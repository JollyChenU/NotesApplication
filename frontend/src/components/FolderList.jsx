/**
 * 文件名: FolderList.jsx
 * 组件: 文件夹列表组件
 * 描述: 文件夹列表组件，显示所有文件夹及其包含的文件，支持拖拽和文件夹管理
 * 功能: 文件夹展开折叠、文件夹创建编辑、拖拽排序、文件管理、右键菜单
 * 作者: Jolly Chen
 * 时间: 2024-11-20
 * 版本: 1.3.0
 * 依赖: React, Material-UI, @dnd-kit/sortable, FileItem
 * 许可证: Apache-2.0
 */
import React, { useState, useCallback, memo } from 'react';
import { 
  List, ListItem, ListItemText, ListItemIcon, 
  Collapse, IconButton, TextField, Menu, MenuItem,
  Box, Typography
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { useDroppable } from '@dnd-kit/core';
import FileItem from './FileItem';

// 文件夹内容组件
const FolderContent = memo(({ 
  folder, 
  files, 
  activeFileId, 
  draggingFileId,
  onFileSelect,
  onFileMouseDown,
  onFileMouseUp,
  isFileDragging
}) => {
  // 获取当前文件夹下的文件
  const folderFiles = React.useMemo(() => {
    if (!Array.isArray(files)) return [];
    
    return files.filter(file => {
      if (!file) return false;
      const fileFolderId = file.folder_id;
      const currentFolderId = folder?.id;
      
      if (currentFolderId === undefined || currentFolderId === null) return false;
      return String(fileFolderId) === String(currentFolderId);
    });
  }, [files, folder?.id]);
  
  // 文件夹无效时显示提示
  if (!folder) {
    return (
      <Box sx={{ py: 1.5, px: 2, color: 'text.disabled', fontStyle: 'italic', fontSize: '0.75rem', textAlign: 'center' }}>
        无效的文件夹
      </Box>
    );
  }
    // 空文件夹提示
  if (folderFiles.length === 0) {
    return (
      <Box sx={{ 
        py: 2, 
        px: 2, 
        color: isFileDragging ? 'primary.main' : 'text.disabled',
        fontStyle: 'italic',
        fontSize: '0.875rem',
        textAlign: 'center',
        minHeight: isFileDragging ? '40px' : '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s ease-in-out',
        ...(isFileDragging && {
          backgroundColor: 'rgba(63, 81, 181, 0.05)',
          borderRadius: 1,
        })
      }}>
        {isFileDragging ? '拖放文件到此文件夹' : '文件夹为空'}
      </Box>
    );
  }
  
  // 显示文件夹中的文件
  return (
    <>
      {folderFiles.map(file => (
        <FileItem
          key={file.id}
          file={file}
          folderId={folder.id}
          activeFileId={activeFileId}
          onFileSelect={onFileSelect}
          onMouseDown={() => onFileMouseDown(file.id)}
          onMouseUp={onFileMouseUp}
          draggingId={draggingFileId}
        />
      ))}
    </>
  );
});

// 文件夹投放区域组件
const FolderDropZone = ({ folder, children, isFileDragging }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `folder-${folder.id}`,
    data: {
      type: 'FOLDER',
      folderId: folder.id
    }
  });

  // 计算文件夹子项数量
  const childrenCount = React.Children.count(children);
    // 稳定的高度计算，避免布局抖动
  const dynamicMinHeight = React.useMemo(() => {
    if (!isFileDragging) return '10px';
    
    if (childrenCount === 0) {
      // 空文件夹：显示放置提示区域
      return '60px';
    } else {
      // 有文件的文件夹：只为原有文件预留空间，不为占位符预留额外高度
      const baseHeight = childrenCount * 48; // 每个文件项约48px
      const padding = 16; // 只保留基本内边距
      return `${baseHeight + padding}px`;
    }
  }, [isFileDragging, childrenCount]); // 保持稳定的高度计算

  // 稳定的样式配置，减少因状态变化导致的重渲染
  const baseStyles = React.useMemo(() => ({
    minHeight: dynamicMinHeight,
    maxHeight: isFileDragging ? 'none' : 'auto',
    py: 0.5,
    px: 1,
    overflow: 'visible',
    position: 'relative',
    transition: 'background-color 0.2s ease-in-out, border-color 0.2s ease-in-out', // 只过渡颜色变化
  }), [dynamicMinHeight, isFileDragging]);

  // 动态样式配置，仅在必要时应用
  const dynamicStyles = React.useMemo(() => {
    if (!isFileDragging) {
      return {
        bgcolor: 'rgba(0, 0, 0, 0.01)',
        border: 'none',
        borderRadius: 0,
      };
    }

    return {
      bgcolor: isOver ? 'rgba(63, 81, 181, 0.08)' : 'rgba(63, 81, 181, 0.03)',
      border: isOver ? '2px dashed rgba(63, 81, 181, 0.5)' : '1px dashed rgba(63, 81, 181, 0.3)',
      borderRadius: 1,
    };
  }, [isFileDragging, isOver]);

  return (
    <List 
      ref={setNodeRef}
      component="div" 
      sx={{ 
        ...baseStyles,
        ...dynamicStyles,
      }}
      id={`folder-content-${folder.id}`}
      data-droppable-id={`folder-${folder.id}`}
      data-folder-id={folder.id}
      data-folder-content="true"
      data-is-folder="true"
      className="folder-content"
    >
      {children}
        {/* 优化的拖拽占位符：使用绝对定位避免布局偏移 */}
      {isFileDragging && isOver && childrenCount > 0 && (
        <Box sx={{
          position: 'absolute',
          bottom: '8px',
          left: '8px',
          right: '8px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(63, 81, 181, 0.12)',
          borderRadius: 1,
          border: '2px dashed rgba(63, 81, 181, 0.4)',
          color: 'primary.main',
          fontSize: '0.875rem',
          fontWeight: 500,
          opacity: 0.9,
          zIndex: 10, // 确保在其他内容之上显示
          pointerEvents: 'none', // 防止干扰拖拽操作
        }}>
          放置文件到此处
        </Box>
      )}
    </List>
  );
};

// 文件夹列表主组件
const FolderList = ({
  folders = [],
  files = [],
  activeFileId,
  onFileSelect,
  onRenameFolder,
  onDeleteFolder,
  draggingFileId,
  onFileMouseDown,
  onFileMouseUp,
  isFileDragging,
}) => {
  // 状态管理
  const [openFolders, setOpenFolders] = useState({});
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [isRenamingFolder, setIsRenamingFolder] = useState(false);
  const [renameFolderName, setRenameFolderName] = useState('');

  // 处理文件夹折叠展开
  const handleFolderToggle = useCallback((folderId) => {
    setOpenFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  }, []);
  
  // 文件夹菜单控制
  const handleFolderMenuOpen = (event, folderId) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedFolderId(folderId);
  };

  const handleFolderMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedFolderId(null);
  };

  // 处理文件夹重命名
  const handleRenameFolder = () => {
    const folder = folders.find(f => f.id === selectedFolderId);
    if (folder) {
      setRenameFolderName(folder.name);
      setIsRenamingFolder(true);
      handleFolderMenuClose();
    }
  };

  // 提交文件夹重命名
  const handleSubmitRename = () => {
    if (renameFolderName.trim() && selectedFolderId) {
      onRenameFolder(selectedFolderId, renameFolderName.trim());
      setRenameFolderName('');
      setIsRenamingFolder(false);
      setSelectedFolderId(null);
    }
  };

  // 处理删除文件夹
  const handleDeleteFolder = () => {
    if (selectedFolderId) {
      onDeleteFolder(selectedFolderId);
      handleFolderMenuClose();
    }
  };

  // 处理展开文件夹事件
  React.useEffect(() => {
    const handleExpandFolder = (event) => {
      const { folderId } = event.detail;
      if (folderId && folderId !== '0' && folderId !== 0) {
        setOpenFolders(prev => ({
          ...prev,
          [folderId]: true
        }));
      }
    };
    
    document.addEventListener('expandFolder', handleExpandFolder);
    return () => {
      document.removeEventListener('expandFolder', handleExpandFolder);
    };
  }, []);
  
  return (
    <>
      {/* 文件夹列表 */}
      {folders.map((folder) => (
        <React.Fragment key={folder.id}>
          {isRenamingFolder && selectedFolderId === folder.id ? (
            <ListItem 
              sx={{ 
                pl: 2, 
                pr: 1
              }}
            >
              <TextField
                fullWidth
                size="small"
                value={renameFolderName}
                onChange={(e) => setRenameFolderName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmitRename()}
                onBlur={handleSubmitRename}
                autoFocus
              />
            </ListItem>
          ) : (
            <ListItem 
              button
              onClick={() => handleFolderToggle(folder.id)}
              id={`folder-${folder.id}`}
              data-folder-id={folder.id}
              data-is-folder="true"
              data-droppable-id={`folder-${folder.id}`}
              sx={{
                pl: 2,
                pr: 1,
                position: 'relative',
                '&:hover .folderActionButton': {
                  visibility: 'visible',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                {openFolders[folder.id] ? <FolderOpenIcon color="primary" /> : <FolderIcon color="primary" />}
              </ListItemIcon>
              <ListItemText primary={folder.name} />
              <Box className="folderActionButton" sx={{ visibility: 'hidden' }}>
                <IconButton
                  size="small"
                  onClick={(e) => handleFolderMenuOpen(e, folder.id)}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Box>
              <Box sx={{ ml: 1 }}>
                {openFolders[folder.id] ? <ExpandLess /> : <ExpandMore />}
              </Box>
            </ListItem>
          )}
            {/* 文件夹内容区域 */}
          <Collapse in={openFolders[folder.id]} timeout="auto">
            <FolderDropZone folder={folder} isFileDragging={isFileDragging}>
              <FolderContent
                folder={folder}
                files={files}
                activeFileId={activeFileId}
                draggingFileId={draggingFileId}
                onFileSelect={onFileSelect}
                onFileMouseDown={onFileMouseDown}
                onFileMouseUp={onFileMouseUp}
                isFileDragging={isFileDragging}
              />
            </FolderDropZone>
          </Collapse>
        </React.Fragment>
      ))}

      {/* 文件夹菜单 */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleFolderMenuClose}
      >
        <MenuItem onClick={handleRenameFolder}>重命名</MenuItem>
        <MenuItem onClick={handleDeleteFolder}>删除</MenuItem>
      </Menu>
    </>
  );
};

export default FolderList;