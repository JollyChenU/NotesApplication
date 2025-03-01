/**
 * @author Jolly
 * @date 2025-03-01
 * @description 笔记编辑器组件，负责处理笔记的编辑和预览功能
 */

import React from 'react';
import { Box } from '@mui/material';
import ReactMarkdown from 'react-markdown';

const NoteEditor = ({
  note,
  isActive,
  onUpdate,
  onFocus,
  onBlur,
  isEditing
}) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* 笔记编辑区域 */}
      {isEditing && (
        <Box
          component="textarea"
          data-note-id={note.id}
          sx={{
            width: '100%',
            border: 'none',
            outline: 'none',
            fontFamily: 'inherit',
            fontSize: 'inherit',
            resize: 'vertical',
            minHeight: '100px',
            boxShadow: isActive ? '0 0 0 2px #1976d2' : 'none',
            transition: 'box-shadow 0.2s ease-in-out'
          }}
          value={note.content}
          onChange={(e) => onUpdate(note.id, e.target.value)}
          onFocus={() => onFocus(note.id)}
          onBlur={onBlur}
        />
      )}
      {/* Markdown预览区域 */}
      <Box
        data-preview-area
        sx={{
          pt: isEditing ? 2 : 0,
          borderTop: isEditing ? 1 : 'none',
          borderColor: 'divider',
          minHeight: '100px'
        }}
        onClick={() => {
          onFocus(note.id);
          if (isEditing) {
            const textarea = document.querySelector(`[data-note-id="${note.id}"]`);
            if (textarea) {
              textarea.focus();
              textarea.selectionStart = textarea.value.length;
              textarea.selectionEnd = textarea.value.length;
            }
          }
        }}
      >
        <ReactMarkdown>{note.content}</ReactMarkdown>
      </Box>
    </Box>
  );
};

export default NoteEditor;