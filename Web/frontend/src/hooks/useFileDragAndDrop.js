/**
 * 文件名: useFileDragAndDrop.js
 * 组件: useFileDragAndDrop - 文件拖拽功能Hook
 * 描述: 提供文件拖拽上传和排序功能的自定义React Hook
 * 功能:
 *   - 文件拖拽上传处理
 *   - 文件排序拖拽逻辑
 *   - 拖拽状态管理
 *   - 文件处理回调
 * 
 * 作者: Jolly
 * 创建时间: 2025-06-04
 * 最后修改: 2025-06-04
 * 修改人: Jolly
 * 版本: 1.0.0
 * 
 * 依赖:
 *   - react: React核心库
 * 
 * 许可证: Apache-2.0
 */
import { useState, useCallback } from 'react';
import noteService from '../services/noteService';

/**
 * 自定义Hook，用于处理笔记文件的长按拖拽排序功能
 * @param {Function} onOrderUpdate - 排序更新后的回调函数
 * @returns {Object} 返回拖拽相关的状态和处理函数
 */
const useFileDragAndDrop = (onOrderUpdate) => {
  // 当前正在拖拽的文件ID
  const [draggingFileId, setDraggingFileId] = useState(null);
  // 鼠标位置状态
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  // 拖拽放置位置指示器状态
  const [dropIndicatorIndex, setDropIndicatorIndex] = useState(null);
  // 长按计时器
  const [pressTimer, setPressTimer] = useState(null);
  // 是否处于拖拽状态（用于控制文件名阴影显示）
  const [isDragging, setIsDragging] = useState(false);
  
  /**
   * 处理鼠标按下事件，启动长按计时器
   * @param {number} fileId - 被按下的文件ID
   */
  const handleMouseDown = useCallback((fileId) => {
    const timer = setTimeout(() => {
      setDraggingFileId(fileId);
      setIsDragging(true);
    }, 500); // 500ms的长按触发时间
    setPressTimer(timer);
  }, []);
  
  /**
   * 处理鼠标抬起事件，清除长按计时器
   */
  const handleMouseUp = useCallback(() => {
    console.log('🔍 handleMouseUp - 开始', { pressTimer: !!pressTimer, isDragging });
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
    // 只有在没有处于拖拽状态时才重置
    if (!isDragging) {
      console.log('🔍 handleMouseUp - 不处于拖拽状态，重置draggingFileId和dropIndicatorIndex');
      setDraggingFileId(null);
      setDropIndicatorIndex(null);
    } else {
      // 如果处于拖拽状态，也需要重置isDragging状态
      // 这样可以确保拖拽结束后视觉效果恢复正常
      console.log('🔍 handleMouseUp - 处于拖拽状态，重置isDragging');
      setIsDragging(false);
    }
    console.log('🔍 handleMouseUp - 结束');
  }, [pressTimer, draggingFileId, isDragging]);
  
  /**
   * 处理拖拽结束，更新文件顺序
   * @param {Array} files - 当前的文件列表
   */
  const handleDragEnd = useCallback(async (files) => {
    const startTime = performance.now();
    console.log('🔍 handleDragEnd - 开始', { 
      draggingFileId, 
      isDragging, 
      dropIndicatorIndex,
      filesCount: files?.length || 0,
      mousePosition,
      timestamp: new Date().toISOString()
    });
    
    // 检查是否拖放到了文件夹上
    // 注意：这里需要先检查是否有文件夹元素，因为这个函数主要处理文件排序
    // 文件夹拖放逻辑主要由FileDndContext组件处理
    
    // 检查鼠标当前位置下是否有文件夹元素
    const checkForFolderElement = () => {
      const elemStartTime = performance.now();
      try {
        // 获取当前鼠标位置
        const elements = document.elementsFromPoint(mousePosition.x, mousePosition.y);
        
        // 调试信息
        console.log('拖放结束 - 检查文件夹元素:', {
          mousePosition,
          elementsCount: elements.length,
          elementsFirst5: elements.slice(0, 5).map(el => ({
            tagName: el.tagName,
            id: el.id,
            className: el.className,
            dataset: el.dataset
          })),
          timestamp: new Date().toISOString()
        });
        
        // 修改: 储存所有候选文件夹元素而不是只取第一个
        let folderCandidates = [];
        
        // 遍历所有元素，查找所有可能的文件夹元素
        for (const el of elements) {
          // 检查dataset.droppableId
          const hasDatasetId = el.dataset && el.dataset.droppableId && el.dataset.droppableId.startsWith('folder-');
          // 检查id属性
          const hasIdAttribute = el.id && el.id.startsWith('folder-');
          // 检查data-droppable-id属性（直接访问）
          const hasDataAttribute = el.getAttribute && el.getAttribute('data-droppable-id') && 
                                  el.getAttribute('data-droppable-id').startsWith('folder-');
          // 检查data-is-folder属性（直接标记）
          const hasIsFolderAttribute = el.getAttribute && el.getAttribute('data-is-folder') === 'true';
          // 检查data-folder-id属性（直接标记）
          const hasFolderIdAttribute = el.getAttribute && el.getAttribute('data-folder-id');
          // 检查folder-content-id
          const hasFolderContentId = el.id && el.id.includes('folder-content-');
          // 检查class名称
          const hasFolderClass = el.className && typeof el.className === 'string' && el.className.includes('folder');
          
          // 如果是文件夹元素，尝试提取文件夹ID
          if (hasDatasetId || hasIdAttribute || hasDataAttribute || hasIsFolderAttribute || 
              hasFolderIdAttribute || hasFolderContentId || hasFolderClass) {
            
            let extractedId = null;
            
            // 提取文件夹ID
            if (hasDatasetId) {
              extractedId = el.dataset.droppableId.replace('folder-', '');
            } else if (hasIdAttribute) {
              extractedId = el.id.replace('folder-', '');
            } else if (hasDataAttribute) {
              extractedId = el.getAttribute('data-droppable-id').replace('folder-', '');
            } else if (hasFolderIdAttribute) {
              extractedId = el.getAttribute('data-folder-id');
            } else if (hasFolderContentId) {
              extractedId = el.id.replace('folder-content-', '');
            }
            
            if (extractedId) {
              // 将提取到ID的元素添加到候选列表
              folderCandidates.push({
                element: el,
                id: extractedId,
                // z-index可能无法直接获取，但我们可以使用元素在列表中的位置作为优先级的指标
                // 元素位置越靠前，优先级越高（z-index越高）
                priority: elements.indexOf(el)
              });
              
              console.log('找到候选文件夹元素:', {
                element: el.tagName + (el.id ? '#'+el.id : ''),
                id: extractedId,
                priority: elements.indexOf(el),
                attributes: {
                  hasDatasetId,
                  hasIdAttribute,
                  hasDataAttribute,
                  hasIsFolderAttribute,
                  hasFolderIdAttribute,
                  hasFolderContentId,
                  hasFolderClass
                }
              });
            }
          }
        }
        
        // 如果没有找到任何文件夹元素
        if (folderCandidates.length === 0) {
          console.log('未找到任何文件夹元素');
          const elemEndTime = performance.now();
          console.log(`🕒 checkForFolderElement 执行时间: ${elemEndTime - elemStartTime}ms`);
          return null;
        }
        
        // 按z-index优先级排序（实际是按元素位置排序）
        folderCandidates.sort((a, b) => a.priority - b.priority);
        
        // 选择第一个元素（优先级最高的）
        const selectedFolder = folderCandidates[0];
        
        console.log('从候选列表中选择了文件夹元素:', {
          element: selectedFolder.element.tagName + (selectedFolder.element.id ? '#'+selectedFolder.element.id : ''),
          id: selectedFolder.id,
          totalCandidates: folderCandidates.length,
          allCandidateIds: folderCandidates.map(c => c.id)
        });
        
        const elemEndTime = performance.now();
        console.log(`🕒 checkForFolderElement 执行时间: ${elemEndTime - elemStartTime}ms`);
        return selectedFolder.element;
      } catch (error) {
        console.error('拖放结束 - 检查文件夹元素出错:', error);
        const elemEndTime = performance.now();
        console.log(`🕒 checkForFolderElement 执行出错，用时: ${elemEndTime - elemStartTime}ms`);
        return null;
      }
    };
    
    // 重置拖拽状态的函数
    const resetDragState = () => {
      console.log('🔍 resetDragState - 开始重置拖拽状态');
      setDraggingFileId(null);
      setDropIndicatorIndex(null);
      setIsDragging(false);
      console.log('🔍 resetDragState - 完成重置');
    };
    
    try {
      // 如果没有拖拽文件ID，直接返回
      if (!draggingFileId) {
        console.log('🔍 handleDragEnd - 没有draggingFileId，直接重置状态');
        resetDragState();
        const endTime = performance.now();
        console.log(`🕒 handleDragEnd(提前退出) 总执行时间: ${endTime - startTime}ms`);
        return;
      }
      
      console.log('🔍 handleDragEnd - 当前状态:', { draggingFileId, isDragging });
      
      // 检查是否拖放到了文件夹上
      console.log('🔍 handleDragEnd - 开始检查是否拖放到了文件夹');
      const folderElement = checkForFolderElement();
      console.log('🔍 handleDragEnd - 文件夹检查结果:', { 
        folderFound: !!folderElement, 
        element: folderElement ? `${folderElement.tagName}#${folderElement.id || ''}` : 'null' 
      });
      
      // 如果找到了文件夹元素，提取文件夹ID并通知FileDndContext处理
      if (folderElement) {
        const folderStartTime = performance.now();
        // 提取文件夹ID
        let folderId = null;
        
        // 尝试从各种可能的属性中提取文件夹ID
        if (folderElement.getAttribute && folderElement.getAttribute('data-folder-id')) {
          folderId = folderElement.getAttribute('data-folder-id');
        } else if (folderElement.dataset && folderElement.dataset.droppableId && 
                  folderElement.dataset.droppableId.startsWith('folder-')) {
          folderId = folderElement.dataset.droppableId.replace('folder-', '');
        } else if (folderElement.id && folderElement.id.startsWith('folder-')) {
          folderId = folderElement.id.replace('folder-', '');
        } else if (folderElement.id && folderElement.id.includes('folder-content-')) {
          folderId = folderElement.id.replace('folder-content-', '');
        } else if (folderElement.getAttribute && folderElement.getAttribute('data-droppable-id') && 
                  folderElement.getAttribute('data-droppable-id').startsWith('folder-')) {
          folderId = folderElement.getAttribute('data-droppable-id').replace('folder-', '');
        }
        
        console.log('🔍 handleDragEnd - 检测到文件夹元素，准备由FileDndContext处理:', {
          element: folderElement.tagName + (folderElement.id ? '#'+folderElement.id : ''),
          folderId,
          processingTime: performance.now() - folderStartTime
        });
        
        // 如果成功提取到文件夹ID，可以在这里触发文件移动到文件夹的操作
        if (folderId && draggingFileId) {
          console.log('🔍 handleDragEnd - 提取到文件夹ID:', folderId, '但当前实现中由FileDndContext处理移动操作');
        } else {
          console.log('🔍 handleDragEnd - 提取文件夹ID失败:', { folderId, draggingFileId });
        }
        
        // 重置拖拽状态
        console.log('🔍 handleDragEnd - 文件夹处理完成，准备重置状态');
        resetDragState();
        const endTime = performance.now();
        console.log(`🕒 handleDragEnd(文件夹处理) 总执行时间: ${endTime - startTime}ms`);
        return;
      }
      
      // 如果没有找到文件夹元素，处理文件排序逻辑
      if (dropIndicatorIndex === null) {
        console.log('🔍 handleDragEnd - dropIndicatorIndex为null，无法进行排序，重置状态');
        resetDragState();
        const endTime = performance.now();
        console.log(`🕒 handleDragEnd(无dropIndicatorIndex) 总执行时间: ${endTime - startTime}ms`);
        return;
      }
      
      if (!files || !Array.isArray(files) || files.length === 0) {
        console.log('🔍 handleDragEnd - files数组无效，重置状态', { files });
        resetDragState();
        const endTime = performance.now();
        console.log(`🕒 handleDragEnd(无效files) 总执行时间: ${endTime - startTime}ms`);
        return;
      }
      
      const draggedFile = files.find(file => file && typeof file === 'object' && file.id === draggingFileId);
      if (!draggedFile) {
        console.log('🔍 handleDragEnd - 未找到拖拽的文件对象，重置状态', { draggingFileId });
        resetDragState();
        const endTime = performance.now();
        console.log(`🕒 handleDragEnd(未找到拖拽文件) 总执行时间: ${endTime - startTime}ms`);
        return;
      }
      
      // 处理文件排序
      console.log('🔍 handleDragEnd - 开始处理文件排序:', { draggingFileId, dropIndicatorIndex });
      
      const currentIndex = files.findIndex(file => file.id === draggingFileId);
      const newFiles = [...files];
      newFiles.splice(currentIndex, 1);
      
      const insertIndex = dropIndicatorIndex > currentIndex ? dropIndicatorIndex - 1 : dropIndicatorIndex;
      newFiles.splice(insertIndex, 0, draggedFile);
      
      console.log('🔍 handleDragEnd - 计算新的文件顺序:', { 
        currentIndex, 
        insertIndex, 
        oldOrder: files.map(f => f.id),
        newOrder: newFiles.map(f => f.id)
      });
      
      onOrderUpdate(newFiles);

      const fileIds = newFiles.map(file => file.id);
      try {
        console.log('🔍 handleDragEnd - 调用API更新文件顺序:', { fileIds });
        await noteService.updateFileOrder(fileIds);
        console.log('🔍 handleDragEnd - 文件顺序更新成功');
      } catch (error) {
        console.error('🔍 handleDragEnd - 更新文件顺序失败，正在恢复原始顺序：', error);
        try {
          const originalFiles = await noteService.getAllFiles();
          console.log('🔍 handleDragEnd - 获取原始文件成功，恢复UI显示');
          onOrderUpdate(originalFiles);
        } catch (fetchError) {
          console.error('🔍 handleDragEnd - 获取原始文件列表失败:', fetchError);
        }
        throw error;
      } finally {
        console.log('🔍 handleDragEnd - 文件排序处理完成，准备重置拖拽状态');
        resetDragState();
        const endTime = performance.now();
        console.log(`🕒 handleDragEnd(文件排序) 总执行时间: ${endTime - startTime}ms`);
      }
    } catch (error) {
      console.error('🔍 handleDragEnd - 处理拖拽结束时发生异常:', error);
      resetDragState();
      const endTime = performance.now();
      console.log(`🕒 handleDragEnd(异常) 总执行时间: ${endTime - startTime}ms`);
    }
    console.log('🔍 handleDragEnd - 函数执行完毕');
  }, [draggingFileId, dropIndicatorIndex, mousePosition, onOrderUpdate]);
  
  /**
   * 处理拖拽过程中的鼠标移动
   * @param {MouseEvent} e - 鼠标事件对象
   */
  const handleDragMove = useCallback((e) => {
    if (!draggingFileId) return;
  
    setMousePosition({ x: e.clientX, y: e.clientY });
    
    // 计算拖拽指示器位置
    const fileElements = document.querySelectorAll('[data-file-item]');
    let targetIndex = null;
    const mouseY = e.clientY;
  
    // 优化：使用Array.from和findIndex替代forEach
    const elements = Array.from(fileElements);
    const index = elements.findIndex(element => {
      const rect = element.getBoundingClientRect();
      const elementMiddle = rect.top + (rect.height / 2);
      // 当鼠标在元素上半部分时，指示器显示在该元素上方
      // 当鼠标在元素下半部分时，指示器显示在下一个元素上方（即当前元素下方）
      return mouseY <= elementMiddle;
    });
  
    if (index === -1) {
      // 如果鼠标在所有元素的下半部分，将指示器放在最后
      targetIndex = elements.length;
    } else {
      targetIndex = index;
    }
    
    // 只在指示器位置发生变化时更新状态
    if (targetIndex !== dropIndicatorIndex) {
      setDropIndicatorIndex(targetIndex);
    }
  }, [draggingFileId, dropIndicatorIndex]);
  
  return {
    draggingFileId,
    mousePosition,
    dropIndicatorIndex,
    isDragging,
    handleMouseDown,
    handleMouseUp,
    handleDragEnd,
    handleDragMove
  };
};

export default useFileDragAndDrop;