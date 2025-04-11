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
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
    // 只有在没有处于拖拽状态时才重置
    if (!isDragging) {
      setDraggingFileId(null);
      setDropIndicatorIndex(null);
    } else {
      // 如果处于拖拽状态，也需要重置isDragging状态
      // 这样可以确保拖拽结束后视觉效果恢复正常
      setIsDragging(false);
    }
  }, [pressTimer, draggingFileId, isDragging]);
  
  /**
   * 处理拖拽结束，更新文件顺序
   * @param {Array} files - 当前的文件列表
   */
  const handleDragEnd = useCallback(async (files) => {
    // 检查是否拖放到了文件夹上
    // 注意：这里需要先检查是否有文件夹元素，因为这个函数主要处理文件排序
    // 文件夹拖放逻辑主要由FileDndContext组件处理
    
    // 检查鼠标当前位置下是否有文件夹元素
    const checkForFolderElement = () => {
      // 获取当前鼠标位置
      const elements = document.elementsFromPoint(mousePosition.x, mousePosition.y);
      
      // 调试信息
      console.log('拖放结束 - 检查文件夹元素:', {
        mousePosition,
        elements: elements.map(el => ({
          tagName: el.tagName,
          id: el.id,
          className: el.className,
          dataset: el.dataset
        }))
      });
      
      // 增强的文件夹元素识别逻辑
      let folderElement = null;
      
      // 第一步：尝试从elements中查找文件夹元素
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
        
        if (hasDatasetId || hasIdAttribute || hasDataAttribute || hasIsFolderAttribute || 
            hasFolderIdAttribute || hasFolderContentId || hasFolderClass) {
          folderElement = el;
          console.log('找到文件夹元素:', {
            element: el.tagName + (el.id ? '#'+el.id : ''),
            hasDatasetId,
            hasIdAttribute,
            hasDataAttribute,
            hasIsFolderAttribute,
            hasFolderIdAttribute,
            hasFolderContentId,
            hasFolderClass
          });
          break; // 找到第一个匹配的元素后停止
        }
      }
      
      // 如果没有找到，输出详细的元素信息以便调试
      if (!folderElement) {
        console.log('未找到文件夹元素，详细元素信息:');
        elements.forEach((el, index) => {
          console.log(`元素[${index}]:`, {
            tagName: el.tagName,
            id: el.id || 'no-id',
            className: el.className || 'no-class',
            dataFolderId: el.getAttribute ? el.getAttribute('data-folder-id') : null,
            dataDroppableId: el.getAttribute ? el.getAttribute('data-droppable-id') : null,
            dataIsFolder: el.getAttribute ? el.getAttribute('data-is-folder') : null,
            dataFolderContent: el.getAttribute ? el.getAttribute('data-folder-content') : null
          });
        });
      }
      
      return folderElement;
    };
    
    // 重置拖拽状态的函数
    const resetDragState = () => {
      console.log('重置拖拽状态');
      setDraggingFileId(null);
      setDropIndicatorIndex(null);
      setIsDragging(false);
    };
    
    try {
      // 如果没有拖拽文件ID，直接返回
      if (!draggingFileId) {
        resetDragState();
        return;
      }
      
      console.log('拖放结束 - 当前状态:', { draggingFileId, isDragging });
      
      // 检查是否拖放到了文件夹上
      const folderElement = checkForFolderElement();
      
      // 如果找到了文件夹元素，提取文件夹ID并通知FileDndContext处理
      if (folderElement) {
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
        
        console.log('检测到文件夹元素，让FileDndContext处理拖放:', {
          element: folderElement.tagName + (folderElement.id ? '#'+folderElement.id : ''),
          folderId
        });
        
        // 如果成功提取到文件夹ID，可以在这里触发文件移动到文件夹的操作
        // 注意：这里需要确保App组件传入了正确的onMoveFileToFolder回调函数
        if (folderId && draggingFileId) {
          // 这里应该调用从App组件传入的回调函数，将文件移动到文件夹
          // 但由于当前实现中没有直接传入这个回调，我们只能重置状态
          // 实际上，这个移动操作应该由FileDndContext处理
          console.log('提取到文件夹ID:', folderId, '但当前实现中由FileDndContext处理移动操作');
        }
        
        // 重置拖拽状态
        resetDragState();
        return;
      }
      
      // 如果没有找到文件夹元素，处理文件排序逻辑
      if (dropIndicatorIndex === null) {
        resetDragState();
        return;
      }
      
      if (!files || !Array.isArray(files) || files.length === 0) {
        resetDragState();
        return;
      }
      
      const draggedFile = files.find(file => file && typeof file === 'object' && file.id === draggingFileId);
      if (!draggedFile) {
        resetDragState();
        return;
      }
      
      // 处理文件排序
      console.log('处理文件排序:', { draggingFileId, dropIndicatorIndex });
      
      const currentIndex = files.findIndex(file => file.id === draggingFileId);
      const newFiles = [...files];
      newFiles.splice(currentIndex, 1);
      
      const insertIndex = dropIndicatorIndex > currentIndex ? dropIndicatorIndex - 1 : dropIndicatorIndex;
      newFiles.splice(insertIndex, 0, draggedFile);
      
      onOrderUpdate(newFiles);

      const fileIds = newFiles.map(file => file.id);
      try {
        await noteService.updateFileOrder(fileIds);
      } catch (error) {
        console.error('更新文件顺序失败，正在恢复原始顺序：', error);
        const originalFiles = await noteService.getAllFiles();
        onOrderUpdate(originalFiles);
        throw error;
      }
    } catch (error) {
      console.error('更新文件顺序时发生错误：', {
        error: error.message,
        draggingFileId,
        dropIndicatorIndex
      });
      alert('文件排序失败，请重试');
    } finally {
      resetDragState();
      
      // 延迟一点时间，确保UI有时间更新
      setTimeout(() => {
        // 模拟一次点击，帮助重置任何可能的拖拽状态
        document.body.click();
      }, 100);
    }
  }, [draggingFileId, dropIndicatorIndex, onOrderUpdate, mousePosition]);
  
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