import React from 'react';
import { Paper, IconButton, Box, TextField } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import EditIcon from '@mui/icons-material/Edit';
import NoteEditor from './NoteEditor';

/**
 * Note组件 - 用于显示和管理单个笔记
 * 
 * @component
 * @param {Object} props
 * @param {Object} props.note - 笔记对象，包含id和content属性
 * @param {boolean} props.isEditing - 是否处于编辑状态
 * @param {boolean} props.isDragging - 是否正在拖拽
 * @param {boolean} props.isActive - 是否处于激活状态
 * @param {Function} props.onEdit - 编辑按钮点击处理函数
 * @param {Function} props.onDelete - 删除按钮点击处理函数
 * @param {Function} props.onDragStart - 开始拖拽处理函数
 * @param {Function} props.onUpdate - 更新笔记内容处理函数
 * @param {Function} props.onFocus - 笔记获得焦点处理函数
 * @param {Function} props.onBlur - 笔记失去焦点处理函数
 */
const Note = ({
  note,
  isEditing,
  isDragging,
  isActive,
  onEdit,
  onDelete,
  onDragStart,
  onUpdate,
  onFocus,
  onBlur
}) => {
  return (
    <Paper
      elevation={isActive ? 3 : 1} // 激活状态时提升阴影
      sx={{
        position: 'relative',
        mb: { xs: 1, sm: 2 }, // 响应式外边距
        opacity: isDragging ? 0.5 : 1, // 拖拽时降低透明度
        transition: 'all 0.2s', // 平滑过渡效果
        '&:hover': {
          '& .note-actions': {
            opacity: 1 // 鼠标悬停时显示操作按钮
          }
        }
      }}
      data-note-id={note.id} // 用于拖拽识别
      onFocus={onFocus}
      onBlur={onBlur}
      tabIndex={0} // 使组件可聚焦
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          p: { xs: 1, sm: 1.5, md: 2 } // 响应式内边距
        }}
      >
        {/* 笔记操作按钮组 */}
        <Box sx={{ display: 'flex', gap: 0.75, mr: {xs:1, sm:2}}}>
          <IconButton
            sx={{ cursor: 'move' }}
            onMouseDown={(e) => {
              e.preventDefault(); // 防止文本选择
              onDragStart(e);
            }}
            size="small"
          >
            <DragIndicatorIcon />
          </IconButton>
          <IconButton onClick={onEdit} size="small">
            <EditIcon />
          </IconButton>
          <IconButton onClick={onDelete} size="small" color="error">
            <DeleteIcon />
          </IconButton>
        </Box>

        {/* 笔记内容区域 */}
        <Box sx={{ flexGrow: 1, maxWidth: 'calc(100% - 48px)', mr: 2 }}>          
          {isEditing ? (
            // 编辑模式：显示编辑器组件
            <NoteEditor
              initialContent={note.content}
              onSave={(content) => {
                onUpdate(content);
                onBlur();
              }}
              autoFocus
            />
          ) : (
            // 显示模式：渲染HTML内容
            <div
              dangerouslySetInnerHTML={{ __html: note.content || '空白笔记' }}
              style={{ minHeight: '1.5rem' }}
            />
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default Note;