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
    console.log('开始监听长按事件：', { fileId });
    const timer = setTimeout(() => {
      console.log('长按计时结束，触发拖拽：', { fileId });
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
      console.log('清除长按计时器');
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
    if (draggingFileId) {
      console.log('结束拖拽状态');
      setDraggingFileId(null);
      setDropIndicatorIndex(null);
      setIsDragging(false);
    }
  }, [pressTimer, draggingFileId]);
  
  /**
   * 处理拖拽结束，更新文件顺序
   * @param {Array} files - 当前的文件列表
   */
  const handleDragEnd = useCallback(async (files) => {
    // 如果没有拖拽状态或拖拽指示器，说明不是拖拽操作，直接返回
    if (!draggingFileId || dropIndicatorIndex === null) {
      return;
    }
  
    console.log('开始处理拖拽结束事件：', {
      draggingFileId,
      dropIndicatorIndex,
      filesCount: files?.length
    });
    
    // 如果缺少必要的拖拽信息，记录日志并重置状态
    if (!files || dropIndicatorIndex === null) {
      console.warn('拖拽操作缺少必要信息：', {
        filesCount: files?.length,
        dropIndicatorIndex
      });
      setDraggingFileId(null);
      setDropIndicatorIndex(null);
      setIsDragging(false);
      return;
    }
    
    // 查找被拖拽的文件
    const draggedFile = files.find(file => file.id === draggingFileId);
    if (!draggedFile) {
      console.warn('未找到被拖拽的文件：', {
        draggingFileId,
        availableFileIds: files.map(f => f.id)
      });
      setDraggingFileId(null);
      setDropIndicatorIndex(null);
      setIsDragging(false);
      return;
    }
    
    try {
      const currentIndex = files.findIndex(file => file.id === draggingFileId);
      console.log('计算文件位置：', {
        currentIndex,
        dropIndicatorIndex,
        draggedFileName: draggedFile.name
      });
  
      const newFiles = [...files];
      newFiles.splice(currentIndex, 1);
      
      // 计算实际的插入位置
      const insertIndex = dropIndicatorIndex > currentIndex ? dropIndicatorIndex - 1 : dropIndicatorIndex;
      newFiles.splice(insertIndex, 0, draggedFile);
      
      console.log('准备更新文件顺序：', {
        oldIndex: currentIndex,
        newIndex: insertIndex,
        newOrder: newFiles.map(f => ({ id: f.id, name: f.name }))
      });
  
      // 更新后端数据
      const fileIds = newFiles.map(file => file.id);
      await noteService.updateFileOrder(fileIds);
      
      // 更新前端状态
      onOrderUpdate(newFiles);
      console.log('文件顺序更新成功');
    } catch (error) {
      console.error('更新文件顺序时发生错误：', {
        error: error.message,
        draggingFileId,
        dropIndicatorIndex
      });
      alert('文件排序失败，请重试');
    } finally {
      // 在所有操作完成后重置状态
      setDraggingFileId(null);
      setDropIndicatorIndex(null);
      setIsDragging(false);
    }
  }, [draggingFileId, dropIndicatorIndex, onOrderUpdate]);
  
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
  
    console.log('处理拖拽移动：', {
      mousePosition: { x: e.clientX, y: e.clientY },
      elementsCount: fileElements.length
    });
  
    // 优化：使用Array.from和findIndex替代forEach
    const elements = Array.from(fileElements);
    const index = elements.findIndex(element => {
      const rect = element.getBoundingClientRect();
      const elementMiddle = (rect.top + rect.bottom) / 2;
      
      if (mouseY < elementMiddle) {
        targetIndex = elements.indexOf(element);
        return true;
      }
      return false;
    });
  
    if (index === -1) {
      // 如果鼠标在所有元素的中点下方，将指示器放在最后
      targetIndex = elements.length;
    } else if (targetIndex === null) {
      targetIndex = index;
    }
    
    // 如果鼠标在所有文件下方，则将指示器放在最后
    if (targetIndex === null && fileElements.length > 0) {
      targetIndex = fileElements.length;
    }
  
    if (targetIndex !== dropIndicatorIndex) {
      console.log('更新拖拽指示器位置：', {
        oldIndex: dropIndicatorIndex,
        newIndex: targetIndex
      });
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