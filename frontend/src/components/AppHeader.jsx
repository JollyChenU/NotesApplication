/**
 * @description 应用头部组件，显示文件名、编辑控件和操作按钮
 * @license Apache-2.0
 */
import React from 'react';
import { Box, Typography, IconButton, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

const AppHeader = ({
  activeFile,
  isEditingFileName,
  editingFileName,
  onFileNameChange,
  onFileNameKeyPress,
  onFileNameBlur,
  onFileNameClick,
  onDeleteFileClick,
  onCreateNoteClick,
  onAIOptimizeClick, // AI优化回调
  isLoading, // 添加加载状态
}) => {
  const fileName = activeFile?.name || '选择一个文件';
  const canEdit = !!activeFile && !isLoading; // 只有选中文件且不在加载时才能编辑/操作

  return (
    <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '48px' /* 保持高度稳定 */ }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1, overflow: 'hidden' }}>
        {isEditingFileName && canEdit ? (
          <TextField
            value={editingFileName}
            onChange={(e) => onFileNameChange(e.target.value)} // 直接传递 setEditingFileName
            onBlur={onFileNameBlur}
            onKeyDown={onFileNameKeyPress}
            autoFocus
            size="small"
            variant="outlined" // 使用 outlined 样式
            sx={{
              flexGrow: 1,
              maxWidth: '400px', // 限制最大宽度
              '& .MuiInputBase-input': {
                fontSize: '1.5rem', // 匹配 Typography h4
                padding: '6px 10px',
              },
            }}
          />
        ) : (
          <Typography
            variant="h4"
            component="h1"
            onClick={canEdit ? onFileNameClick : undefined} // 只有可编辑时才响应点击
            sx={{
              cursor: canEdit ? 'pointer' : 'default',
              '&:hover': { opacity: canEdit ? 0.7 : 1 },
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              mr: 1, // 与编辑状态保持一致
            }}
            title={fileName} // 添加 title 提示
          >
            {isLoading ? '加载中...' : fileName}
          </Typography>
        )}
        {activeFile && !isEditingFileName && !isLoading && ( // 仅在非编辑、有选中文件且非加载时显示删除按钮
          <IconButton
            onClick={onDeleteFileClick}
            color="error"
            size="small"
            title="删除当前文件"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        )}      </Box>
      <Box sx={{ display: 'flex', gap: 1 }}>
        {activeFile && !isLoading && ( // 只有选中文件且不在加载时才显示AI优化按钮
          <IconButton
            onClick={onAIOptimizeClick}
            color="secondary"
            size="large"
            title="AI优化内容"
          >
            <AutoFixHighIcon />
          </IconButton>
        )}
        <IconButton
          onClick={onCreateNoteClick}
          color="primary"
          size="large"
          disabled={!activeFile || isLoading} // 只有选中文件且不在加载时才能添加笔记
          title="添加新笔记"
        >
          <AddIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default AppHeader;