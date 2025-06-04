/**
 * 文件名: useDragAndDrop.js
 * 组件: useDragAndDrop - 拖拽功能Hook
 * 描述: 提供拖拽排序功能的自定义React Hook
 * 功能:
 *   - 元素拖拽事件处理
 *   - 拖拽排序逻辑
 *   - 拖拽状态管理
 *   - 拖拽完成回调
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
    const elements = Array.from(noteElements);
    const index = elements.findIndex(element => {
      const paperElement = element.querySelector('.MuiPaper-root');
      const rect = paperElement.getBoundingClientRect();
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