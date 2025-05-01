/**
 * @author Jolly
 * @date 2025-05-01 (Refactored)
 * @description TipTap编辑器组件，提供富文本编辑功能
 * @version 1.3.0
 * @license Apache-2.0
 */

import React, { useEffect, useCallback, useMemo } from 'react'; // Add useMemo
import { useEditor, EditorContent } from '@tiptap/react';
import { Box } from '@mui/material';
// Remove html-to-markdown import if no longer needed
// import htmlToMarkdown from 'html-to-markdown';
import { tiptapExtensions } from '../utils/tiptapExtensions';
import { setFocusToEditor, navigateBetweenNotes, handleEnterKeySplit, debounce } from '../utils/editorUtils'; // Import debounce

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
  });

  // Debounced update function
  const debouncedUpdate = useCallback(debounce((id, content) => {
      if (onUpdate) { // onUpdate is handleNoteUpdateFromEditor
          onUpdate(id, content);
      }
  }, 500), [onUpdate]); // Adjust delay as needed

  // Trigger debounced update when editor content changes
   useEffect(() => {
    if (!editor) {
      return;
    }
    const handleUpdate = () => {
        const htmlContent = editor.getHTML();
        // Avoid updating if content is just the initial empty paragraph or unchanged
        if (htmlContent === '<p></p>' && (note?.content === '' || note?.content === '<p></p>')) return;
        if (htmlContent === note?.content) return;

        debouncedUpdate(note.id, { content: htmlContent, format: note.format });
    };
    editor.on('update', handleUpdate);
    return () => {
      editor.off('update', handleUpdate);
    };
  }, [editor, note?.id, note?.content, note?.format, debouncedUpdate]); // Add note?.content to dependencies


  // Simplified effect to sync external note content changes to the editor
  useEffect(() => {
    if (editor && note?.content !== undefined) {
      // Check if the editor is ready and if the content actually differs
      // Use a simple string comparison.
      if (editor.isEditable && editor.getHTML() !== note.content) {
        // Use setContent to update the editor's content.
        // The second argument `false` prevents firing the 'update' event again.
        // Store selection before setting content
        const { from, to } = editor.state.selection;
        editor.commands.setContent(note.content, false);
        // Try to restore selection if possible and meaningful
        // Check if the previous selection is still valid
        try {
          editor.commands.setTextSelection({ from, to });
        } catch (error) {
          // If restoring fails (e.g., content changed too much), focus at the end
          editor.commands.focus('end');
        }
      }
    }
  }, [editor, note?.content]); // Dependencies: editor instance and the content string

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
  }, [editor, note, onUpdate, onFocus]);

  // 根据笔记格式获取样式 (保持原有逻辑)
  const getEditorStyles = () => {
    const baseStyles = {
      width: '100%',
      minHeight: '1em',
      height: 'fit-content',
      lineHeight: '1.5',
      overflow: 'hidden',
      whiteSpace: 'pre-wrap',
      wordWrap: 'break-word',
      fontFamily: 'inherit',
      fontSize: 'inherit',
      padding: '2px 8px',
      boxShadow: 'none',
      border: 'none',
      transition: 'all 0.3s ease-in-out',
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
        overflow: 'hidden',
        '& .ProseMirror': {
          ...getEditorStyles(),
          outline: 'none',
          caretColor: '#3f51b5',
          color: '#000000',
          '&:focus': {
            border: 'none',
            outline: 'none',
            boxShadow: 'none'
          },
          '& p': {
            margin: 0,
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