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
    }
  }, [pressTimer, draggingFileId, isDragging]);
  
  /**
   * 处理拖拽结束，更新文件顺序
   * @param {Array} files - 当前的文件列表
   */
  const handleDragEnd = useCallback(async (files) => {
    if (!draggingFileId || dropIndicatorIndex === null) {
      return;
    }
    
    if (!files || !Array.isArray(files) || files.length === 0) {
      setDraggingFileId(null);
      setDropIndicatorIndex(null);
      setIsDragging(false);
      return;
    }
    
    const draggedFile = files.find(file => file && typeof file === 'object' && file.id === draggingFileId);
    if (!draggedFile) {
      setDraggingFileId(null);
      setDropIndicatorIndex(null);
      setIsDragging(false);
      return;
    }
    
    try {
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