/**
 * 文件名: NoteList.jsx
 * 组件: NoteList - 笔记列表组件
 * 描述: 显示和管理笔记列表的React组件
 * 功能:
 *   - 渲染笔记列表
 *   - 笔记的选择和高亮
 *   - 笔记的拖拽排序
 *   - 笔记操作菜单
 * 
 * 作者: Jolly
 * 创建时间: 2025-06-04
 * 最后修改: 2025-06-04
 * 修改人: Jolly
 * 版本: 1.0.0
 * 
 * 依赖:
 *   - react: React核心库
 *   - @mui/material: Material-UI组件库
 * 
 * 许可证: Apache-2.0
 */
import React, { memo, useEffect, useState } from 'react';
import { Box, Paper, IconButton, Menu, MenuItem } from '@mui/material';
import NoteDragHandle from '@mui/icons-material/DragIndicator';
import DeleteIcon from '@mui/icons-material/Delete';
import NoteEditor from './NoteEditor';
// 引入新的拖放工具
import { NoteDndContext, createSortableItem } from '../utils/dnd/index.js';
// 导入noteService
import noteService from '../services/noteService';

const NoteItem = memo(({ 
  note, 
  dragHandleProps = {}, 
  isDragging = false, 
  onDragStart, 
  onUpdate, 
  onDelete, 
  onFocus, 
  onBlur,
  onMenuOpen = () => {}, // 添加新参数用于处理菜单打开
  onCreateNewNote,   // 添加onCreateNewNote参数
  isHandleActive = false // 添加图标激活状态参数
}) => (
  <Box
    sx={{ position: 'relative' }}
    data-note-container
  >
    <Paper
      data-note-id={note.id}
      sx={{
        p: 1, // 减少内边距
        mb: 0, // 设置很小的下边距
        mt: 0, // 确保上边距为0
        pl: 2, // 增加左边距，为拖拽图标留出空间
        position: 'relative',
        width: '100%',
        maxWidth: '1200px',
        mx: 'auto',
        minHeight: '40px', // 确保最小高度以容纳删除按钮
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
        // 确保左右间距一致
        marginLeft: 'auto',
        marginRight: 'auto',
        // 防止出现横向滚动条
        // overflowX: 'hidden', // 注释掉这行，避免隐藏拖拽图标
        boxSizing: 'border-box',
        background: isDragging ? '#ffebee' : '#ffffff',
        transition: 'all 0.3s ease-in-out',
        border: '1px solid transparent',
        boxShadow: 'none',
        '&:hover': {
          border: '1px solid rgba(0, 0, 0, 0.12)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          '& .delete-button, & .drag-handle': { // 修改选择器，确保所有拖拽图标在hover时都可见
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
          className={`drag-handle ${isHandleActive ? 'active' : ''}`} // 添加激活状态的类名
          sx={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'grab',
            padding: '4px',
            fontSize: '24px',
            color: '#666',
            opacity: isHandleActive ? 1 : 0, // 提高非激活状态的透明度
            transition: 'opacity 0.2s ease-in-out',
            width: '24px',
            height: '24px',
            justifyContent: 'center',
            zIndex: 10, // 提高z-index确保图标在最上层
            '&:active': {
              cursor: 'grabbing',
              color: '#333'
            },
            '&.active': { // 添加激活状态的样式
              opacity: 1,
              color: '#3f51b5' // 激活时使用蓝色以突出显示
            }
          }}
          {...dragHandleProps}
          onContextMenu={(e) => {
            // 右键点击显示菜单
            e.preventDefault();
            e.stopPropagation();
            onMenuOpen(e, note.id);
          }}
        >
          <NoteDragHandle />
        </Box>
      </Box>
      <IconButton
        className="delete-button"
        onClick={() => onDelete(note.id)}
        sx={{ 
          position: 'absolute', 
          top: '50%', // 改为垂直居中定位
          right: 8,
          transform: 'translateY(-50%)', // 垂直居中
          opacity: 0,
          transition: 'opacity 0.2s ease-in-out',
          zIndex: 1 // 确保按钮在最上层
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
        onCreateNewNote={onCreateNewNote} // 传递onCreateNewNote函数
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
  // 添加激活的拖曳图标ID状态
  const [activeHandleId, setActiveHandleId] = useState(null);

  const handleMenuOpen = (event, noteId) => {
    event.preventDefault();
    setMenuAnchorEl(event.currentTarget);
    setSelectedNoteId(noteId);
    // 设置激活的拖曳图标ID
    setActiveHandleId(noteId);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedNoteId(null);
    // 清除激活的拖曳图标ID
    setActiveHandleId(null);
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

  // 将handleMenuOpen函数传递给SortableNoteItem组件
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
                onMenuOpen={handleMenuOpen} // 传递菜单打开处理函数
                onCreateNewNote={(noteId, data, callback) => {
                  // 调用onUpdate函数来创建新笔记块
                  const newNote = {
                    isNew: true,
                    fileId: activeFileId,
                    afterNoteId: noteId,
                    content: data.content || '',
                    format: data.format || 'text'
                  };
                  
                  // 调用onUpdate创建新笔记并获取新笔记的ID
                  onUpdate(newNote, null)
                    .then(newNoteId => {
                      if (callback && typeof callback === 'function') {
                        callback(newNoteId);
                      }
                    })
                    .catch(error => {
                      console.error('创建新笔记失败:', error);
                    });
                }}
                isHandleActive={activeHandleId === note.id} // 传递激活状态
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