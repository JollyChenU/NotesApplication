import { useState, useCallback } from 'react';
import noteService from '../services/noteService';

/**
 * 自定义Hook，用于处理笔记的拖拽排序功能
 * @param {Function} onOrderUpdate - 排序更新后的回调函数
 * @returns {Object} 返回拖拽相关的状态和处理函数
 */
const useDragAndDrop = (onOrderUpdate) => {
  // 当前正在拖拽的笔记ID
  const [draggingNoteId, setDraggingNoteId] = useState(null);
  // 鼠标位置状态
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  // 拖拽放置位置指示器状态
  const [dropIndicatorIndex, setDropIndicatorIndex] = useState(null);

  /**
   * 处理拖拽开始
   * @param {number} noteId - 被拖拽的笔记ID
   */
  const handleDragStart = useCallback((noteId) => {
    setDraggingNoteId(noteId);
  }, []);

  /**
   * 处理拖拽结束，更新笔记顺序
   * @param {Array} notes - 当前的笔记列表
   */
  const handleDragEnd = useCallback(async (notes) => {
    if (draggingNoteId && dropIndicatorIndex !== null) {
      const draggedNote = notes.find(note => note.id === draggingNoteId);
      if (!draggedNote) return;

      const currentIndex = notes.findIndex(note => note.id === draggingNoteId);
      const newNotes = [...notes];
      newNotes.splice(currentIndex, 1);
      
      // 计算实际的插入位置
      const insertIndex = dropIndicatorIndex > currentIndex ? dropIndicatorIndex - 1 : dropIndicatorIndex;
      newNotes.splice(insertIndex, 0, draggedNote);
      
      try {
        // 更新后端数据
        const noteIds = newNotes.map(note => note.id);
        await noteService.updateNoteOrder(noteIds);
        // 更新前端状态
        onOrderUpdate(newNotes);
      } catch (error) {
        console.error('Error updating note order:', error);
        // 显示错误提示
        alert('笔记排序失败，请重试');
      }
    }
    // 重置拖拽状态
    setDraggingNoteId(null);
    setDropIndicatorIndex(null);
  }, [draggingNoteId, dropIndicatorIndex, onOrderUpdate]);

  /**
   * 处理拖拽过程中的鼠标移动
   * @param {MouseEvent} e - 鼠标事件对象
   */
  const handleDragMove = useCallback((e) => {
    if (!draggingNoteId) return;

    setMousePosition({ x: e.clientX, y: e.clientY });
    
    // 计算拖拽指示器位置
    const noteElements = document.querySelectorAll('[data-note-container]');
    let targetIndex = null;
    const mouseY = e.clientY;

    // 优化：使用Array.from和findIndex替代forEach
    const index = Array.from(noteElements).findIndex(element => {
      const editArea = element.querySelector('textarea');
      const previewArea = element.querySelector('[data-preview-area]');
      const paperElement = element.querySelector('.MuiPaper-root');
      const paperRect = paperElement.getBoundingClientRect();

      if (mouseY < paperRect.top) return true;
      if (mouseY >= paperRect.top && mouseY <= paperRect.bottom) {
        targetIndex = Array.from(noteElements).indexOf(element);
        return true;
      }
      return false;
    });

    if (index !== -1 && targetIndex === null) {
      targetIndex = index;
    }
    
    // 如果鼠标在所有笔记下方，则将指示器放在最后
    if (targetIndex === null && noteElements.length > 0) {
      targetIndex = noteElements.length;
    }

    if (targetIndex !== dropIndicatorIndex) {
      setDropIndicatorIndex(targetIndex);
    }
  }, [draggingNoteId, dropIndicatorIndex]);

  return {
    draggingNoteId,
    mousePosition,
    dropIndicatorIndex,
    handleDragStart,
    handleDragEnd,
    handleDragMove
  };
};

export default useDragAndDrop;