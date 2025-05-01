/**
 * @description 单个文件项组件，用于在侧边栏中显示文件
 * @license Apache-2.0
 */
import React, { memo } from 'react';
import { ListItem, ListItemText, ListItemIcon } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// 可拖拽的文件项组件
const FileItem = memo(({
  file,
  folderId = null,
  activeFileId = null,
  onFileSelect,
  onMouseDown,
  onMouseUp,
  draggingId = null,
}) => {
  // 使用DND-Kit的useSortable钩子
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: String(file.id),
    data: {
      type: 'FILE',
      file,
      originFolderId: folderId,
    },
  });

  const isActive = file.id === activeFileId;
  const isBeingDragged = isDragging || String(file.id) === String(draggingId);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isBeingDragged ? 0.5 : 1,
    backgroundColor: isActive ? 'rgba(63, 81, 181, 0.08)' : 'transparent',
    pl: folderId ? 2 : 2, // 在文件夹中时缩进
    '&:hover': {
      backgroundColor: isActive ? 'rgba(63, 81, 181, 0.12)' : 'rgba(0, 0, 0, 0.04)',
    },
    // 确保拖拽时文件项仍然可见
    position: isBeingDragged ? 'relative' : 'static',
    zIndex: isBeingDragged ? 1200 : 'auto',
  };

  return (
    <ListItem
      ref={setNodeRef}
      button
      sx={style}
      onClick={() => onFileSelect(file.id)}
      onMouseDown={() => onMouseDown && onMouseDown(file.id)}
      onMouseUp={onMouseUp}
      data-file-id={file.id}
      data-file-item="true"
      data-folder-id={folderId}
      {...attributes}
      {...listeners}
    >
      <ListItemIcon sx={{ minWidth: 36 }}>
        <DescriptionIcon color={isActive ? 'primary' : 'action'} fontSize="small" />
      </ListItemIcon>
      <ListItemText 
        primary={file.name} 
        primaryTypographyProps={{
          noWrap: true,
          sx: { fontWeight: isActive ? 500 : 400 }
        }}
      />
    </ListItem>
  );
});

export default FileItem;