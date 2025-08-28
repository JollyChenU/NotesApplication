/**
 * 文件名: DeleteFileDialog.jsx
 * 组件: 文件删除确认对话框
 * 描述: 文件删除操作的确认对话框组件，提供安全的删除确认机制
 * 功能: 删除确认、用户交互、安全提示、操作取消
 * 作者: Jolly Chen
 * 时间: 2024-11-20
 * 版本: 1.1.0
 * 依赖: React, Material-UI Dialog
 * 许可证: Apache-2.0
 */
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';

const DeleteFileDialog = ({ open, onClose, onConfirm, fileName }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="delete-dialog-title"
    >
      <DialogTitle id="delete-dialog-title">确认删除笔记文件？</DialogTitle>
      <DialogContent>
        <Typography>
          即将删除文件: <strong>{fileName || '未知文件'}</strong>
        </Typography>
        <Typography color="textSecondary" sx={{ mt: 1 }}>
          删除后将无法恢复该笔记文件及其包含的所有笔记内容。
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          确认删除
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteFileDialog;