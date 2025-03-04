/**
 * @author Jolly
 * @date 2025-03-01
 * @description 笔记编辑器组件，负责处理笔记的编辑功能
 */

import React, { useState } from 'react';
import { Box, IconButton } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

const NoteEditor = ({
  note,
  isActive,
  onUpdate,
  onFocus,
  onBlur,
  isEditing
}) => {
  const [pressTimer, setPressTimer] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e) => {
    if (isDragging) {
      e.dataTransfer.setData('text/plain', note.id);
    }
  };

  const handleMouseDown = (e) => {
    const timer = setTimeout(() => {
      setIsDragging(true);
    }, 500);
    setPressTimer(timer);
  };

  const handleMouseUp = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
    setIsDragging(false);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
      <Box
        component="textarea"
        data-note-id={note.id}
        sx={{
          display: 'block',
          width: '100%',
          minHeight: '24px',
          height: 'auto',
          overflow: 'hidden',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          border: 'none',
          outline: 'none',
          fontFamily: 'inherit',
          fontSize: 'inherit',
          resize: 'none',
          padding: '4px 8px',
          boxShadow: isActive ? '0 0 0 2px #1976d2' : 'none',
          transition: 'box-shadow 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 0 0 1px rgba(25, 118, 210, 0.5)'
          }
        }}
        value={note.content}
        onChange={(e) => {
          onUpdate(note.id, e.target.value);
          // 自动调整高度
          e.target.style.height = 'auto';
          e.target.style.height = `${e.target.scrollHeight}px`;
        }}
        onFocus={() => onFocus(note.id)}
        onBlur={onBlur}
      />
    </Box>
  );
};

export default NoteEditor;