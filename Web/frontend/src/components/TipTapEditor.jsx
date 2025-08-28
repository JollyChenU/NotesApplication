/**
 * 文件名: TipTapEditor.jsx
 * 组件: TipTap富文本编辑器
 * 描述: TipTap编辑器组件，提供富文本编辑功能，支持Markdown语法和键盘导航
 * 功能: 富文本编辑、Markdown支持、键盘快捷键、自动保存、笔记导航
 * 作者: Jolly Chen
 * 时间: 2024-11-20
 * 版本: 1.3.0
 * 依赖: React, @tiptap/react, @tiptap/core, Material-UI
 * 许可证: Apache-2.0
 */

import React, { useEffect, useCallback, useMemo, useRef } from 'react'; // Add useRef
import { useEditor, EditorContent } from '@tiptap/react';
import { Box } from '@mui/material';
import { tiptapExtensions } from '../utils/tiptapExtensions';
import { setFocusToEditor, navigateBetweenNotes, handleEnterKeySplit, debounce } from '../utils/editorUtils'; // Import debounce
import MarkdownIt from 'markdown-it';
// Remove html-to-markdown import if no longer needed
// import htmlToMarkdown from 'html-to-markdown';

// 创建全局存储编辑器实例的对象
if (!window.tiptapEditors) {
  window.tiptapEditors = {};
}

const TipTapEditor = ({
  note,
  isActive,
  onUpdate, // This will now be handleNoteUpdateFromEditor from useNotes
  onFocus,
  onBlur,
  isEditing, // Still seems unused
  // onCreateNewNote is no longer needed directly, handled via onUpdate
}) => {

  // Memoize extensions to prevent RangeError
  const memoizedExtensions = useMemo(() => tiptapExtensions, []);

  const editor = useEditor({
    extensions: memoizedExtensions,
    content: note?.content || '', // Initial content
    // Remove onUpdate from here, handle via editor.on('update')
    onFocus: () => { // Keep onFocus
      if (onFocus) onFocus(note.id);
    },
    onBlur: onBlur, // Keep onBlur
  });  // Debounced update function
  const debouncedUpdate = useCallback(debounce((noteId, contentData) => {
      if (onUpdate) {
          onUpdate(noteId, contentData);
      }
  }, 500), [onUpdate]);  // Trigger debounced update when editor content changes
   useEffect(() => {
    if (!editor || !note?.id) {
      return;
    }    const handleUpdate = () => {
        // 如果正在进行格式转换，暂时不触发自动更新
        if (isFormattingRef.current) {
            return;
        }
        
        const htmlContent = editor.getHTML();
        
        // Avoid updating if content is just the initial empty paragraph or unchanged
        if (htmlContent === '<p></p>' && (note?.content === '' || note?.content === '<p></p>')) {
            return;
        }
        if (htmlContent === note?.content) {
            return;
        }

        // Trigger debounced update with correct parameters
        debouncedUpdate(note.id, { content: htmlContent, format: note.format });
    };
    
    editor.on('update', handleUpdate);
      return () => {
      editor.off('update', handleUpdate);
    };
  }, [editor, note?.id, note?.format, debouncedUpdate]); // 添加 note?.format 依赖


  // Simplified effect to sync external note content changes to the editor
  useEffect(() => {
    if (editor && note?.content !== undefined) {
      // 避免在用户正在编辑时重置内容，防止光标跳跃
      if (isEditing || editor.isFocused) {
        return;
      }
      
      const currentContent = editor.getHTML();
      
      // 检查内容是否为 markdown 格式（以 # 或 - 或 * 或数字. 开头，或包含换行的 markdown 特征）
      const isLikelyMarkdown = typeof note.content === 'string' && /(^#|^\* |^- |^\d+\. |\n#|\n\* |\n- |\n\d+\.)/.test(note.content);
      let htmlContent = note.content;
      
      // 只有在内容确实来自外部（如AI优化）且不是HTML时才转换
      if (isLikelyMarkdown && !/^<([a-z]+)([^<]+)*(?:>(.*)<\/\1>|\s+\/>)$/i.test(note.content.trim())) {
        // 仅在内容不是 HTML 时转换
        const md = new MarkdownIt();
        htmlContent = md.render(note.content);
      }
      
      // 只有在内容真正不同时才更新编辑器
      if (currentContent !== htmlContent) {
        const { from, to } = editor.state.selection;
        editor.commands.setContent(htmlContent, false);
        try {
          editor.commands.setTextSelection({ from, to });
        } catch (error) {
          editor.commands.focus('end');
        }
      }
    }
  }, [editor, note?.content, isEditing]); // 添加 isEditing 依赖

  // Store editor instance globally
  useEffect(() => {
    if (editor && note?.id) {
      window.tiptapEditors[note.id] = editor;
      return () => {
        delete window.tiptapEditors[note.id];
        // Consider destroying the editor instance on unmount if memory leaks occur
        // editor.destroy();
      };
    }
  }, [editor, note?.id]);

  // Handle keyboard events (Refactored to be async)
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = async (e) => { // Make async
      // Handle Enter key for splitting notes
      if (e.key === 'Enter' && !e.shiftKey) {
        // Pass the combined update/create handler (handleNoteUpdateFromEditor)
        // for both onUpdate and onCreateNewNote arguments as it handles both cases
        await handleEnterKeySplit(e, editor, note, onUpdate, onUpdate, onFocus);
        return; // Prevent default Enter and further processing
      }

      // Handle arrow key navigation
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const noteElements = document.querySelectorAll('[data-note-id]');
        const uniqueNoteIdsMap = new Map();
        Array.from(noteElements).forEach(el => {
          const id = String(el.getAttribute('data-note-id'));
          if (!uniqueNoteIdsMap.has(id)) {
            uniqueNoteIdsMap.set(id, true);
          }
        });
        const uniqueNoteIds = Array.from(uniqueNoteIdsMap.keys());
        const currentId = String(note?.id);
        const currentIndex = uniqueNoteIds.indexOf(currentId);

        if (currentIndex !== -1) {
          const navigated = navigateBetweenNotes(e, editor, currentId, currentIndex, uniqueNoteIds, onFocus);
          if (navigated) {
             return; // Prevent default arrow key behavior if navigation occurred
          }
        } else {
           // Backup logic for finding current note element
           const activeElement = document.activeElement;
           let currentNoteElement = activeElement;
           while (currentNoteElement && !currentNoteElement.hasAttribute('data-note-id')) {
             currentNoteElement = currentNoteElement.parentElement;
           }
           if (currentNoteElement) {
             const backupCurrentId = currentNoteElement.getAttribute('data-note-id');
             const backupIndex = uniqueNoteIds.indexOf(String(backupCurrentId));
             if (backupIndex !== -1) {
               const navigated = navigateBetweenNotes(e, editor, backupCurrentId, backupIndex, uniqueNoteIds, onFocus);
               if (navigated) {
                 return;
               }
             }
           }
        }
      }
    };

    const editorElement = editor.view.dom;
    editorElement.addEventListener('keydown', handleKeyDown, true); // Use capture phase

    return () => {
      editorElement.removeEventListener('keydown', handleKeyDown, true);
    };
    // Add onUpdate to dependencies as it's used in handleEnterKeySplit
  }, [editor, note, onUpdate, onFocus]);  // 处理格式转换
  const prevFormatRef = useRef(note?.format);
  const isFormattingRef = useRef(false); // 添加格式转换状态标志
  
  useEffect(() => {
    if (editor && note?.format && prevFormatRef.current !== note?.format) {
      // 只有当格式真正发生变化时才执行转换
      prevFormatRef.current = note?.format;
      isFormattingRef.current = true; // 设置格式转换状态
      
      // 获取当前选中的内容或全部内容
      const { from, to } = editor.state.selection;
      const isSelectionEmpty = from === to;
      
      // 如果没有选中内容，选中全部内容
      if (isSelectionEmpty) {
        editor.commands.selectAll();
      }
        // 根据格式执行相应的转换命令
      switch (note.format) {        case 'text':
          // 转换为普通文本，彻底清除所有格式          // 1. 先取消所有可能的活跃状态
          if (editor.isActive('highlight')) {
            editor.commands.toggleHighlight(); // 如果是高亮状态，toggle会取消高亮
          }
          if (editor.isActive('bulletList')) {
            editor.commands.toggleBulletList();
          }
          if (editor.isActive('orderedList')) {
            editor.commands.toggleOrderedList();
          }
          if (editor.isActive('blockquote')) {
            editor.commands.toggleBlockquote();
          }
          // 2. 清除块级格式（标题、列表、引用等）
          editor.commands.clearNodes();
          // 3. 清除所有行内标记（粗体、斜体、高亮等）
          editor.commands.unsetAllMarks();
          // 4. 确保转换为普通段落
          editor.commands.setParagraph();
          break;        case 'h1':
          // 先清除其他格式，再设置标题
          editor.commands.clearNodes();
          editor.commands.unsetAllMarks();
          editor.commands.setHeading({ level: 1 });
          break;
        case 'h2':
          editor.commands.clearNodes();
          editor.commands.unsetAllMarks();
          editor.commands.setHeading({ level: 2 });
          break;
        case 'h3':
          editor.commands.clearNodes();
          editor.commands.unsetAllMarks();
          editor.commands.setHeading({ level: 3 });
          break;        case 'bullet':
          // 确保清除其他格式后应用无序列表
          if (editor.isActive('orderedList')) {
            editor.commands.toggleOrderedList();
          }
          if (editor.isActive('blockquote')) {
            editor.commands.toggleBlockquote();
          }
          editor.commands.clearNodes();
          editor.commands.unsetAllMarks();
          editor.commands.toggleBulletList();
          break;
        case 'number':
          // 确保清除其他格式后应用有序列表
          if (editor.isActive('bulletList')) {
            editor.commands.toggleBulletList();
          }
          if (editor.isActive('blockquote')) {
            editor.commands.toggleBlockquote();
          }
          editor.commands.clearNodes();
          editor.commands.unsetAllMarks();
          editor.commands.toggleOrderedList();
          break;
        case 'quote':
          // 确保清除其他格式后应用引用
          if (editor.isActive('bulletList')) {
            editor.commands.toggleBulletList();
          }
          if (editor.isActive('orderedList')) {
            editor.commands.toggleOrderedList();
          }
          editor.commands.clearNodes();
          editor.commands.unsetAllMarks();
          editor.commands.toggleBlockquote();
          break;
        case 'highlight':
          // 对于高亮，只应用高亮标记，不清除块级格式
          // 确保应用高亮效果
          if (!editor.isActive('highlight')) {
            editor.commands.toggleHighlight();
          }
          break;
        default:
          break;
      }      
      // 如果原来没有选中内容，恢复到末尾
      if (isSelectionEmpty) {
        editor.commands.focus('end');
      }
        // 格式转换完成后，延迟重置标志并手动触发一次更新
      setTimeout(() => {
        isFormattingRef.current = false;
        // 手动触发一次更新，确保新格式被保存
        const htmlContent = editor.getHTML();
        debouncedUpdate(note.id, { content: htmlContent, format: note.format });
      }, 100); // 短暂延迟确保格式转换完全完成
    }
  }, [editor, note?.format]); // 监听格式变化
  // 根据笔记格式获取样式 (保持原有逻辑)
  const getEditorStyles = () => {
    const baseStyles = {
      width: '100%',
      minHeight: '24px',
      height: 'auto',
      lineHeight: 1.5, // 增加行高
      overflow: 'visible', // 改为 visible
      whiteSpace: 'pre-wrap',
      wordWrap: 'break-word',
      fontFamily: 'inherit',
      fontSize: 'inherit',
      padding: '4px 6px', // 增加内边距
      boxShadow: 'none',
      border: 'none',
      transition: 'all 0.3s ease-in-out',
      display: 'block', // 改为 block      alignItems: 'flex-start', // 改为顶部对齐
      '&:hover': {
        boxShadow: 'none',
        border: 'none'
      }
    };

    switch (note?.format) {
      case 'h1':
        return { ...baseStyles, fontSize: '2em', fontWeight: 'bold' };
      case 'h2':
        return { ...baseStyles, fontSize: '1.5em', fontWeight: 'bold' };
      case 'h3':
        return { ...baseStyles, fontSize: '1.17em', fontWeight: 'bold' };
      case 'bullet':
        return { ...baseStyles, paddingLeft: '20px', listStyleType: 'disc' };
      case 'number':
        return { ...baseStyles, paddingLeft: '20px', listStyleType: 'decimal' };
      case 'quote':
        return { ...baseStyles, paddingLeft: '20px', borderLeft: '4px solid #ccc', fontStyle: 'italic' };
      case 'highlight':
        return { ...baseStyles, backgroundColor: 'rgba(255, 235, 59, 0.2)' };
      default:
        return baseStyles;
    }
  };
  return (
    <Box
      data-note-id={note?.id}
      sx={{
        position: 'relative',
        width: '100%',
        minHeight: '24px',
        overflow: 'visible', // 改为 visible 避免内容被裁剪
        '& .ProseMirror': {
          ...getEditorStyles(),
          outline: 'none',
          caretColor: '#3f51b5',
          color: '#000000',
          overflow: 'visible', // 改为 visible
          position: 'relative', // 确保相对定位
          zIndex: 1, // 确保层级正确
          '&:focus': {
            border: 'none',
            outline: 'none',
            boxShadow: 'none'
          },
          '& p': {
            margin: '2px 0', // 增加段落间距
            padding: 0,
            lineHeight: 1.5, // 增加行高
            minHeight: '20px', // 增加最小高度
            display: 'block', // 确保块级显示
          },
          // 修复标题的间距和显示
          '& h1': {
            margin: '8px 0 4px 0', // 上下间距
            padding: '2px 0',
            lineHeight: '1.3',
            display: 'block',
            fontSize: '2em',
            fontWeight: 'bold',
          },
          '& h2': {
            margin: '6px 0 3px 0',
            padding: '2px 0',
            lineHeight: '1.3',
            display: 'block',
            fontSize: '1.5em',
            fontWeight: 'bold',
          },
          '& h3': {
            margin: '4px 0 2px 0',
            padding: '2px 0',
            lineHeight: '1.3',
            display: 'block',
            fontSize: '1.2em',
            fontWeight: 'bold',
          },
          '& h4, & h5, & h6': {
            margin: '4px 0 2px 0',
            padding: '2px 0',
            lineHeight: '1.3',
            display: 'block',
            fontWeight: 'bold',
          },
          // 列表和其他元素样式
          '& ul, & ol': {
            margin: '4px 0',
            padding: '0 0 0 20px',
            display: 'block',
          },
          '& li': {
            margin: '2px 0',
            padding: 0,
            lineHeight: 1.5,
            display: 'list-item',
          },
          '& blockquote': {
            margin: '4px 0',
            padding: '4px 0 4px 16px',
            borderLeft: '4px solid #ccc',
            fontStyle: 'italic',
            display: 'block',
          },
          // ... (保持原有的 ProseMirror 内部元素样式)
          '& strong': {
            fontWeight: 'bold',
          },
          '& em': {
            fontStyle: 'italic',
          },
          '& code': {
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            padding: '0.2em 0.4em',
            borderRadius: '3px',
            fontFamily: 'monospace',
          },
          '& a': {
            color: '#3f51b5',
            textDecoration: 'underline',
          },
          '& img': {
            maxWidth: '100%',
          },
          '& s': {
            textDecoration: 'line-through',
          },
        }
      }}
    >
      <EditorContent editor={editor} />
    </Box>
  );
};

export default TipTapEditor;