import React, { memo, useEffect, useState } from 'react';
import { Box, Paper, IconButton, Menu, MenuItem } from '@mui/material';
import NoteDragHandle from '@mui/icons-material/DragIndicator';
import DeleteIcon from '@mui/icons-material/Delete';
import NoteEditor from './NoteEditor';
// 引入新的拖放工具
import { NoteDndContext, createSortableItem } from '../utils/dnd-utils.jsx';

const NoteItem = memo(({ 
  note, 
  dragHandleProps = {}, 
  isDragging = false, 
  onDragStart, 
  onUpdate, 
  onDelete, 
  onFocus, 
  onBlur 
}) => (
  <Box
    sx={{ position: 'relative' }}
    data-note-container
  >
    <Paper
      data-note-id={note.id}
      sx={{
        p: 3,
        mb: 2,
        position: 'relative',
        width: '100%',
        maxWidth: '1200px',
        mx: 'auto',
        '@media (max-width: 1400px)': {
          maxWidth: '1100px',
        },
        '@media (max-width: 1200px)': {
          maxWidth: '950px',
        },
        '@media (max-width: 900px)': {
          maxWidth: '90%',
        },
        '@media (max-width: 600px)': {
          maxWidth: '95%',
        },
        background: isDragging ? '#ffebee' : '#ffffff',
        transition: 'all 0.3s ease-in-out',
        border: '1px solid transparent',
        boxShadow: 'none',
        '&:hover': {
          border: '1px solid rgba(0, 0, 0, 0.12)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          '& .delete-button, & .drag-handle': {
            opacity: 1
          }
        }
      }}
    >
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
        <Box
          className="drag-handle"
          sx={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'grab',
            padding: '4px',
            fontSize: '24px',
            color: '#666',
            opacity: 0,
            transition: 'opacity 0.2s ease-in-out',
            '&:active': {
              cursor: 'grabbing',
              color: '#333'
            }
          }}
          {...dragHandleProps}
        >
          <NoteDragHandle />
        </Box>
      </Box>
      <IconButton
        className="delete-button"
        onClick={() => onDelete(note.id)}
        sx={{ 
          position: 'absolute', 
          top: 8, 
          right: 8,
          opacity: 0,
          transition: 'opacity 0.2s ease-in-out'
        }}
      >
        <DeleteIcon />
      </IconButton>
      <NoteEditor
        note={note}
        isActive={false} // 将由父组件传递
        onUpdate={onUpdate}
        onFocus={onFocus}
        onBlur={onBlur}
        isEditing={false} // 将由父组件传递
        onCreateNewNote={() => {}} // 将由父组件传递
      />
    </Paper>
  </Box>
));

// 创建可排序版本的NoteItem
const SortableNoteItem = createSortableItem(NoteItem);

const NoteList = ({
  notes = [],
  activeNoteId,
  activeFileId,
  onDelete = () => {},
  onUpdate = () => {},
  onFocus = () => {},
  onBlur = () => {},
  // 添加笔记排序处理函数
  onReorder = () => {}
}) => {
  const [editingNotes, setEditingNotes] = useState(new Set());
  const [pressTimer, setPressTimer] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [subMenuAnchorEl, setSubMenuAnchorEl] = useState(null);
  const [copiedNote, setCopiedNote] = useState(null);

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
          setCopiedNote({
            content: note.content,
            format: note.format || 'text'
          });
        }
        break;
      case 'paste':
        if (copiedNote && selectedNoteId) {
          onUpdate(selectedNoteId, {
            content: copiedNote.content,
            format: copiedNote.format
          });
        }
        break;
      case 'duplicate':
        const originalNote = notes.find(n => n.id === selectedNoteId);
        if (originalNote) {
          onUpdate({
            isNew: true,
            content: originalNote.content,
            format: originalNote.format || 'text',
            afterNoteId: selectedNoteId
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

  // 处理笔记排序
  const handleReorder = (reorderedNotes) => {
    // 更新UI
    onReorder(reorderedNotes);
    
    // 发送到后端
    const noteIds = reorderedNotes.map(note => note.id);
    noteService.updateNoteOrder(noteIds)
      .catch(error => console.error('Failed to update note order:', error));
  };

  return (
    <Box sx={{ position: 'relative' }}>
      {Array.isArray(notes) && notes.length > 0 ? (
        <NoteDndContext
          items={notes}
          onReorder={handleReorder}
        >
          <div style={{ minHeight: '50px' }}>
            {notes.map((note) => (
              <SortableNoteItem
                key={note.id}
                id={String(note.id)}
                note={note}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            ))}
          </div>
        </NoteDndContext>
      ) : (
        <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
          无笔记内容，点击右上角 + 按钮添加新笔记
        </Box>
      )}

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleMenuItemClick('delete')}>删除</MenuItem>
        <MenuItem onClick={() => handleMenuItemClick('copy')}>复制</MenuItem>
        <MenuItem onClick={() => handleMenuItemClick('paste')}>粘贴</MenuItem>
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