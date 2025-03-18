import React from 'react';
import { Box, Paper, IconButton, Menu, MenuItem } from '@mui/material';
import NoteDragHandle from '@mui/icons-material/DragIndicator';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
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
  const handleCreateNewNote = (currentNoteId, newNoteData) => {
    const currentIndex = notes.findIndex(note => note.id === currentNoteId);
    if (currentIndex === -1) return;
    
    const newNote = {
      id: Date.now(),
      content: newNoteData.content || '',
      format: newNoteData.format || 'text',
      position: currentIndex + 1
    };
    
    onUpdate(newNote);
  };
  const [editingNotes, setEditingNotes] = React.useState(new Set());
  const [pressTimer, setPressTimer] = React.useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = React.useState(null);
  const [selectedNoteId, setSelectedNoteId] = React.useState(null);
  const [subMenuAnchorEl, setSubMenuAnchorEl] = React.useState(null);
  const handleMenuOpen = (event, noteId) => {
    event.preventDefault();
    setMenuAnchorEl(event.currentTarget);
    setSelectedNoteId(noteId);
  };
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedNoteId(null);
  };
  const handleSubMenuOpen = (event) => {
    setSubMenuAnchorEl(event.currentTarget);
  };
  const handleSubMenuClose = () => {
    setSubMenuAnchorEl(null);
  };
  const handleMenuItemClick = (action, format) => {
    switch (action) {
      case 'delete':
        onDelete(selectedNoteId);
        break;
      case 'copy':
        const note = notes.find(n => n.id === selectedNoteId);
        if (note) {
          navigator.clipboard.writeText(note.content);
        }
        break;
      case 'duplicate':
        const originalNote = notes.find(n => n.id === selectedNoteId);
        if (originalNote) {
          onUpdate({
            id: Date.now(),
            content: originalNote.content,
            format: originalNote.format || 'text',
            position: notes.length
          });
        }
        break;
      case 'format':
        const targetNote = notes.find(n => n.id === selectedNoteId);
        if (targetNote) {
          onUpdate(selectedNoteId, {
            content: targetNote.content,
            format: format
          });
        }
        break;
      default:
        break;
    }
    handleMenuClose();
    handleSubMenuClose();
  };
  return (
    <Box sx={{ position: 'relative' }}>
      {/* 拖拽时的阴影笔记块 */}
      {draggingNoteId && mousePosition.x !== 0 && mousePosition.y !== 0 && (
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
                left: -40,
                top: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
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
                    color: '#333'
                  }
                }}
                onClick={(e) => handleMenuOpen(e, note.id)}
                onMouseDown={() => {
                  const timer = setTimeout(() => {
                    onDragStart(note.id);
                  }, 250);
                  setPressTimer(timer);
                }}
                onMouseUp={() => {
                  // 清除定时器
                  if (pressTimer) {
                    clearTimeout(pressTimer);
                    setPressTimer(null);
                  }
                }}
                onMouseLeave={() => {
                  // 鼠标离开时也清除定时器
                  if (pressTimer) {
                    clearTimeout(pressTimer);
                    setPressTimer(null);
                  }
                }}
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
              onCreateNewNote={handleCreateNewNote}
            />
          </Paper>
        </Box>
      ))}

      {/* 添加菜单组件 */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleMenuItemClick('delete')}>删除</MenuItem>
        <MenuItem onClick={() => handleMenuItemClick('copy')}>复制</MenuItem>
        <MenuItem onClick={() => handleMenuItemClick('duplicate')}>创建副本</MenuItem>
        <MenuItem
          onClick={handleSubMenuOpen}
          sx={{
            '& .MuiMenu-paper': {
              marginLeft: '2px'
            }
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%'
            }}
          >
            转换为
            <Box component="span" sx={{ marginLeft: 'auto' }}>
              ▶
            </Box>
          </Box>
        </MenuItem>
      </Menu>
      <Menu
        anchorEl={subMenuAnchorEl}
        open={Boolean(subMenuAnchorEl)}
        onClose={handleSubMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
      >
        <MenuItem onClick={() => handleMenuItemClick('format', 'text')}>文本</MenuItem>
        <MenuItem onClick={() => handleMenuItemClick('format', 'h1')}>一级标题</MenuItem>
        <MenuItem onClick={() => handleMenuItemClick('format', 'h2')}>二级标题</MenuItem>
        <MenuItem onClick={() => handleMenuItemClick('format', 'h3')}>三级标题</MenuItem>
        <MenuItem onClick={() => handleMenuItemClick('format', 'bullet')}>无序列表</MenuItem>
        <MenuItem onClick={() => handleMenuItemClick('format', 'number')}>有序列表</MenuItem>
        <MenuItem onClick={() => handleMenuItemClick('format', 'quote')}>引用</MenuItem>
        <MenuItem onClick={() => handleMenuItemClick('format', 'highlight')}>标注</MenuItem>
      </Menu>
    </Box>
  );
};

export default NoteList;