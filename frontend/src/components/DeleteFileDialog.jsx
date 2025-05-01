/**
 * @description 文件删除确认对话框
 * @license Apache-2.0
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