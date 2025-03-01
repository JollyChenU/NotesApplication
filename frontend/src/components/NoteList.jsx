import React from 'react';
import { Box, Paper, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import NoteDragHandle from '@mui/icons-material/DragIndicator';
import EditIcon from '@mui/icons-material/Edit';
import NoteEditor from './NoteEditor';

const NoteList = ({
  notes,
  draggingNoteId,
  dropIndicatorIndex,
  mousePosition,
  activeNoteId,
  onDelete,
  onDragStart,
  onUpdate,
  onFocus,
  onBlur
}) => {
  // 添加编辑状态管理
  const [editingNotes, setEditingNotes] = React.useState(new Set());

  // 切换笔记的编辑状态
  const toggleNoteEditing = (noteId) => {
    setEditingNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  };

  return (
    <Box sx={{ position: 'relative' }}>
      {/* 拖拽时的阴影笔记块 */}
      {draggingNoteId && (
        <Box
          sx={{
            position: 'fixed',
            left: mousePosition.x + 20,
            top: mousePosition.y - 20,
            zIndex: 1000,
            pointerEvents: 'none',
            width: '300px'
          }}
        >
          <Paper
            sx={{
              p: 2,
              background: '#ffffff',
              opacity: 0.6,
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
            }}
          >
            {notes.find(note => note.id === draggingNoteId)?.content}
          </Paper>
        </Box>
      )}

      {/* 拖拽放置位置指示器 */}
      {draggingNoteId && dropIndicatorIndex !== null && (
        <Box
          sx={{
            position: 'fixed',
            left: 269,
            right: 0,
            margin: '0 auto',
            width: 'calc(100% - 240px)',
            maxWidth: '1182px',
            height: '4px',
            backgroundColor: '#1976d2',
            zIndex: 2,
            top: (() => {
              const noteElements = document.querySelectorAll('[data-note-container]');
              if (dropIndicatorIndex === 0) {
                const firstElement = noteElements[0];
                if (firstElement) {
                  const paperElement = firstElement.querySelector('.MuiPaper-root');
                  if (paperElement) {
                    const paperRect = paperElement.getBoundingClientRect();
                    return `${paperRect.top - 2}px`;
                  }
                }
                return '0px';
              } else if (dropIndicatorIndex === noteElements.length) {
                const lastElement = noteElements[noteElements.length - 1];
                if (lastElement) {
                  const paperElement = lastElement.querySelector('.MuiPaper-root');
                  if (paperElement) {
                    const paperRect = paperElement.getBoundingClientRect();
                    return `${paperRect.bottom + 2}px`;
                  }
                }
                return '0px';
              } else {
                const currentElement = noteElements[dropIndicatorIndex];
                const previousElement = noteElements[dropIndicatorIndex - 1];
                if (currentElement && previousElement) {
                  const currentPaper = currentElement.querySelector('.MuiPaper-root');
                  const previousPaper = previousElement.querySelector('.MuiPaper-root');
                  if (currentPaper && previousPaper) {
                    const currentRect = currentPaper.getBoundingClientRect();
                    const previousRect = previousPaper.getBoundingClientRect();
                    return `${(previousRect.bottom + currentRect.top) / 2}px`;
                  }
                }
                return '0px';
              }
            })()
          }}
        />
      )}

      {notes.map((note) => (
        <Box key={note.id} sx={{ position: 'relative' }} data-note-container>
          <Paper
            data-note-id={note.id}
            sx={{
              p: 2,
              mb: 2,
              position: 'relative',
              width: '100%',
              background: (() => {
                if (draggingNoteId && dropIndicatorIndex !== null) {
                  const currentIndex = notes.findIndex(n => n.id === note.id);
                  if (currentIndex === dropIndicatorIndex || currentIndex === dropIndicatorIndex - 1) {
                    return '#ffebee';
                  }
                }
                return '#ffffff';
              })(),
              opacity: draggingNoteId === note.id ? 0.6 : 1,
              transition: 'all 0.2s ease-in-out'
            }}
          >
            {/* 笔记操作按钮组 */}
            <Box
              sx={{
                position: 'absolute',
                left: -80,
                top: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              {/* 编辑按钮 */}
              <IconButton
                onClick={() => toggleNoteEditing(note.id)}
                sx={{
                  padding: '4px',
                  color: editingNotes.has(note.id) ? '#1976d2' : '#666'
                }}
              >
                <EditIcon />
              </IconButton>
              {/* 拖拽手柄 */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'grab',
                  padding: '4px',
                  fontSize: '24px',
                  color: '#666',
                  '&:active': {
                    cursor: 'grabbing',
                    color: '#333',
                    backgroundColor: '#f5f5f5',
                    boxShadow: '0 0 5px rgba(0,0,0,0.1)'
                  }
                }}
                onMouseDown={() => onDragStart(note.id)}
              >
                <NoteDragHandle />
              </Box>
            </Box>
            {/* 删除按钮 */}
            <IconButton
              onClick={() => onDelete(note.id)}
              sx={{ position: 'absolute', top: 8, right: 8 }}
            >
              <DeleteIcon />
            </IconButton>
            {/* 笔记编辑器组件 */}
            <NoteEditor
              note={note}
              isActive={activeNoteId === note.id}
              onUpdate={onUpdate}
              onFocus={onFocus}
              onBlur={onBlur}
              isEditing={editingNotes.has(note.id)}
            />
          </Paper>
        </Box>
      ))}
    </Box>
  );
};

export default NoteList;