/**
 * @description TipTap 编辑器相关的辅助函数
 * @license Apache-2.0
 */

/**
 * 解析编辑器内容，用于拆分笔记
 * @param {Object} editor TipTap编辑器实例
 * @param {Number} position 分割位置
 * @returns {Object} 分割后的内容对象 {beforeContent, afterContent}
 */
export function splitEditorContent(editor, position) {
  if (!editor || typeof position !== 'number') {
    return { beforeContent: '', afterContent: '' };
  }

  // 获取当前完整内容和格式
  const currentContent = editor.getHTML();
  
  try {
    // 将光标移动到分割位置
    editor.commands.setTextSelection(position);
    
    // 创建一个临时范围选择，从开始到当前位置
    // 从文档开始到分割位置
    editor.commands.setTextSelection({
      from: 0,
      to: position
    });
    
    // 获取选定部分的内容 (前半部分)
    const beforeContent = editor.getSelectedText() 
      ? editor.getSelectedHTML() 
      : '';
    
    // 将选择范围更改为从分割位置到结束
    editor.commands.setTextSelection({
      from: position,
      to: editor.state.doc.content.size
    });
    
    // 获取选定部分的内容 (后半部分)
    const afterContent = editor.getSelectedText() 
      ? editor.getSelectedHTML() 
      : '';
    
    // 重置选择状态并恢复原始文本
    editor.commands.setContent(currentContent);
    editor.commands.setTextSelection(position);
    
    return {
      beforeContent,
      afterContent
    };
  } catch (error) {
    console.error('Error splitting editor content:', error);
    return { beforeContent: currentContent, afterContent: '' };
  }
}

/**
 * 判断编辑器内容是否为空
 * @param {String} html 编辑器HTML内容
 * @returns {Boolean} 是否为空
 */
export function isEditorEmpty(html) {
  if (!html) return true;
  
  // 移除HTML标签和空白字符后判断是否为空
  const text = html.replace(/<[^>]*>/g, '').trim();
  return text.length === 0;
}

/**
 * 从键盘事件中获取修饰键状态
 * @param {KeyboardEvent} event 键盘事件
 * @returns {Object} 修饰键状态对象
 */
export function getModifiers(event) {
  return {
    alt: event.altKey,
    ctrl: event.ctrlKey,
    meta: event.metaKey,
    shift: event.shiftKey
  };
}

/**
 * 防抖函数，用于优化高频事件处理
 * @param {Function} func 要执行的函数
 * @param {Number} delay 延迟时间
 * @returns {Function} 防抖后的函数
 */
export function debounce(func, delay) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
}

// 改进设置编辑器焦点的辅助函数，确保可靠地设置焦点
export const setFocusToEditor = (editorElement, noteId, position = 'end') => {
  try {
    // 尝试使用全局存储的编辑器实例（最可靠的方法）
    if (window.tiptapEditors && window.tiptapEditors[noteId]) {
      window.tiptapEditors[noteId].commands.focus(position);

      // 强制触发一次点击以确保获得焦点
      if (window.tiptapEditors[noteId].view && window.tiptapEditors[noteId].view.dom) {
        window.tiptapEditors[noteId].view.dom.click();
      }
      return true;
    }

    // 如果没有找到编辑器实例，尝试使用DOM API
    if (!editorElement && noteId) {
      // 尝试通过noteId查找编辑器元素
      const editorContainer = document.querySelector(`[data-note-id="${noteId}"]`);
      if (editorContainer) {
        editorElement = editorContainer.querySelector('.ProseMirror');
      }
    }

    if (editorElement) {
      // 首先确保元素可见并可滚动到视图中
      editorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // 强制获得焦点
      editorElement.focus();

      // 将光标设置到编辑器指定位置
      const selection = window.getSelection();
      const range = document.createRange();

      // 清除当前选择
      selection.removeAllRanges();

      if (editorElement.firstChild) {
        // 如果有内容，根据position决定光标位置
        if (position === 'start') {
          range.setStart(editorElement.firstChild, 0);
          range.collapse(true);
        } else {
          // 设置到最后位置
          const lastNode = editorElement.lastChild || editorElement;
          const lastTextNode = lastNode.lastChild || lastNode;
          const offset = lastTextNode.textContent ? lastTextNode.textContent.length : 0;
          try {
            range.setStart(lastTextNode, offset);
            range.collapse(true);
          } catch (err) {
            range.selectNodeContents(editorElement);
            range.collapse(false); // false表示末尾
          }
        }
      } else {
        // 如果没有内容，就选择整个编辑器
        range.selectNodeContents(editorElement);
        range.collapse(position === 'start');
      }

      // 应用新的选择范围
      selection.addRange(range);

      // 确保编辑器获得焦点（再次尝试）
      setTimeout(() => editorElement.focus(), 0);

      return true;
    }
  } catch (error) {
    return false;
  }
  return false;
};

// 处理笔记块之间的导航逻辑
export const navigateBetweenNotes = (e, editor, currentId, currentIndex, uniqueNoteIds, onFocus) => {
  let targetNoteId = null;
  let focusPosition = 'end';
  let shouldNavigateBetweenNotes = false;

  // 更全面的光标位置检测 - 包括视觉位置检测
  try {
    // 首先获取基本位置信息
    const isAtDocumentStart = editor.state.selection.$from.pos === 1; // ProseMirror pos starts from 1 for the doc node
    const isAtDocumentEnd = editor.state.selection.$to.pos === editor.state.doc.content.size + 1;

    // 获取更详细的段落位置信息
    const isAtParagraphStart = editor.state.selection.$from.parentOffset === 0;
    const isAtParagraphEnd = editor.state.selection.$from.parentOffset === editor.state.selection.$from.parent.content.size;

    // 检测当前光标是否在可见的第一行或最后一行 - 通过选区位置计算
    let caretRect = null;
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      caretRect = selection.getRangeAt(0).getBoundingClientRect();
    }

    // 获取编辑器容器位置
    const editorElement = editor.view.dom;
    const editorRect = editorElement.getBoundingClientRect();

    // 视觉上判断是否在第一行或最后一行 (阈值可以调整)
    const isVisuallyAtFirstLine = caretRect && Math.abs(caretRect.top - editorRect.top) < 20;
    const isVisuallyAtLastLine = caretRect && Math.abs(caretRect.bottom - editorRect.bottom) < 20;

    // 处理方向键逻辑
    if (e.key === 'ArrowUp') {
      // 如果是在文档开头、段落开头或视觉上在第一行，则移动到上一个笔记
      if (isAtDocumentStart || (isAtParagraphStart && isVisuallyAtFirstLine)) {
        if (currentIndex > 0) {
          shouldNavigateBetweenNotes = true;
          targetNoteId = uniqueNoteIds[currentIndex - 1];
          focusPosition = 'end';
        }
      }
    }
    else if (e.key === 'ArrowDown') {
      // 如果是在文档末尾、段落末尾或视觉上在最后一行，则移动到下一个笔记
      if (isAtDocumentEnd || (isAtParagraphEnd && isVisuallyAtLastLine)) {
        if (currentIndex < uniqueNoteIds.length - 1) {
          shouldNavigateBetweenNotes = true;
          targetNoteId = uniqueNoteIds[currentIndex + 1];
          focusPosition = 'start';
        }
      }
    }
    else if (e.key === 'ArrowLeft') {
      if (isAtDocumentStart || (isAtParagraphStart && editor.state.selection.$from.pos === 1)) { // More precise check for start
        if (currentIndex > 0) {
          shouldNavigateBetweenNotes = true;
          targetNoteId = uniqueNoteIds[currentIndex - 1];
          focusPosition = 'end';
        }
      }
    }
    else if (e.key === 'ArrowRight') {
      if (isAtDocumentEnd || (isAtParagraphEnd && editor.state.selection.$to.pos === editor.state.doc.content.size + 1)) { // More precise check for end
        if (currentIndex < uniqueNoteIds.length - 1) {
          shouldNavigateBetweenNotes = true;
          targetNoteId = uniqueNoteIds[currentIndex + 1];
          focusPosition = 'start';
        }
      }
    }
  } catch (error) {
    console.error("Error detecting cursor position for navigation:", error);
  }

  // 如果需要跨笔记块移动且有目标笔记ID
  if (shouldNavigateBetweenNotes && targetNoteId) {
    // 如果目标ID与当前ID相同，尝试获取下一个不同的ID (避免卡在原地)
    if (targetNoteId === currentId) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        for (let i = currentIndex + 1; i < uniqueNoteIds.length; i++) {
          if (uniqueNoteIds[i] !== currentId) {
            targetNoteId = uniqueNoteIds[i];
            break;
          }
        }
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        for (let i = currentIndex - 1; i >= 0; i--) {
          if (uniqueNoteIds[i] !== currentId) {
            targetNoteId = uniqueNoteIds[i];
            break;
          }
        }
      }
    }

    // 再次检查，如果目标ID仍然与当前ID相同，则放弃导航
    if (targetNoteId === currentId) {
      return false; // Indicate navigation didn't happen
    }

    // 强制阻止默认行为
    e.preventDefault();
    e.stopPropagation();

    // 使用异步函数确保在下一个事件循环执行导航
    setTimeout(() => {
      if (onFocus) {
        onFocus(targetNoteId);
      }

      // 确保目标笔记可见
      const targetEditorContainer = document.querySelector(`[data-note-id="${targetNoteId}"]`);
      if (targetEditorContainer) {
        targetEditorContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      // 多轮重试设置焦点
      const maxRetries = 5;
      let currentRetry = 0;

      const trySetFocus = () => {
        // 1. 优先使用全局存储的编辑器实例
        if (window.tiptapEditors && window.tiptapEditors[targetNoteId]) {
          window.tiptapEditors[targetNoteId].commands.focus(focusPosition);
          return true;
        }

        // 2. 然后尝试通过DOM查找编辑器元素
        const targetEditor = document.querySelector(`[data-note-id="${targetNoteId}"] .ProseMirror`);
        if (targetEditor) {
          const result = setFocusToEditor(targetEditor, targetNoteId, focusPosition);
          if (result) {
            return true;
          }
        }

        // 如果尚未达到最大重试次数，则继续尝试
        if (++currentRetry < maxRetries) {
          setTimeout(trySetFocus, 50 * currentRetry);
        } else {
          // 最后的尝试：模拟点击目标元素
          const targetElement = document.querySelector(`[data-note-id="${targetNoteId}"]`);
          if (targetElement) {
            targetElement.click();
          }
        }
        return false;
      };

      // 开始第一次尝试设置焦点
      trySetFocus();

    }, 10); // 短延时确保DOM已更新

    return true; // Indicate navigation happened
  }
  return false; // Indicate navigation didn't happen
};

// 处理回车键拆分笔记块的逻辑 (Refactored to be async and simplify data passing)
export const handleEnterKeySplit = async (e, editor, note, onUpdate, onCreateNewNote, onFocus) => {
  e.preventDefault(); // Prevent default Enter behavior

  try {
    const { from } = editor.state.selection;
    const docSize = editor.state.doc.content.size;

    // Get text content after cursor for the new note
    const contentAfterCursorText = editor.state.doc.textBetween(from, docSize, '\n'); // Get plain text

    // Delete content after cursor in the current editor
    const tr = editor.state.tr;
    tr.delete(from, docSize);
    editor.view.dispatch(tr);

    // Update the current note with the truncated content
    const currentNoteContentHTML = editor.getHTML(); // Get HTML after deletion
    if (typeof onUpdate === 'function') {
      // Assuming onUpdate (mapped to handleNoteUpdateFromEditor -> updateNote) is async or returns a Promise
      await onUpdate(note.id, {
        content: currentNoteContentHTML,
        format: note.format
      });
    }

    // Create the new note with the content that was after the cursor
    if (typeof onCreateNewNote === 'function') {
      const newNoteData = {
        afterNoteId: note.id, // Pass current note's ID to insert after
        content: contentAfterCursorText, // Pass plain text content
        format: note.format // Keep the same format for now
      };
      // Assuming onCreateNewNote (mapped to handleNoteUpdateFromEditor -> createNote) returns the new note ID
      const newNoteId = await onCreateNewNote(newNoteData); // Pass the object directly

      if (newNoteId && typeof onFocus === 'function') {
        onFocus(newNoteId); // Trigger focus state change

        // Focus logic (keep the retry mechanism)
        setTimeout(() => {
          if (window.tiptapEditors && window.tiptapEditors[newNoteId]) {
            window.tiptapEditors[newNoteId].commands.focus('start');
          } else {
            const newEditor = document.querySelector(`[data-note-id="${newNoteId}"] .ProseMirror`);
            if (newEditor) {
              setFocusToEditor(newEditor, newNoteId, 'start');
            }
          }
        }, 100); // Delay to allow React state updates and rendering
      }
    }
  } catch (error) {
    console.error('Error splitting note on Enter key:', error);
    // Optionally call setErrorMessage here if available
  }
};
