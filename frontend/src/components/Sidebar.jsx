/**
 * @author Jolly
 * @date 2025-04-01
 * @description 侧边栏组件，提供文件导航、文件夹管理功能
 * @version 1.2.0
 * @license GPL-3.0
 */

import React, { useState, memo, useCallback } from 'react';
import { List, ListItem, ListItemText, ListItemIcon, Collapse, IconButton, TextField, Menu, MenuItem } from '@mui/material';
import { Box, Typography } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import DescriptionIcon from '@mui/icons-material/Description';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import MoreVertIcon from '@mui/icons-material/MoreVert';
// 使用新的拖放组件
import { FileDndContext, createSortableItem } from '../utils/dnd-utils';

// 文件列表项组件
const FileItem = memo(({ 
  file, 
  folderId = null, 
  activeFileId = null, 
  onFileSelect = () => {},
  dragHandleProps = {},
  isDragging = false,
  // 添加长按拖拽相关的属性和事件处理函数
  onMouseDown = () => {},
  onMouseUp = () => {},
  draggingId = null
}) => (
  <ListItem
    button
    selected={activeFileId === file.id}
    onClick={() => onFileSelect(file.id)}
    onMouseDown={() => onMouseDown(file.id)}
    onMouseUp={onMouseUp}
    sx={{
      pl: folderId ? 4 : 2,
      background: (isDragging || draggingId === file.id) ? 'rgba(63, 81, 181, 0.08)' : 'transparent',
      '&.Mui-selected': {
        bgcolor: 'rgba(63, 81, 181, 0.1)',
      },
      cursor: draggingId === file.id ? 'grabbing' : 'pointer'
    }}
    {...dragHandleProps}
    data-file-item // 添加标识，用于useFileDragAndDrop钩子函数识别
  >
    <ListItemIcon sx={{ minWidth: 36 }}>
      <DescriptionIcon fontSize="small" />
    </ListItemIcon>
    <ListItemText primary={file.name} />
  </ListItem>
));

// 创建可排序的文件项
const SortableFileItem = createSortableItem(FileItem);

// 包装SortableFileItem，添加长按拖拽功能
const DraggableFileItem = ({ file, folderId, activeFileId, onFileSelect, draggingFileId, onFileMouseDown, onFileMouseUp }) => {
  return (
    <SortableFileItem
      id={String(file.id)}
      file={file}
      folderId={folderId}
      activeFileId={activeFileId}
      onFileSelect={onFileSelect}
      onMouseDown={onFileMouseDown}
      onMouseUp={onFileMouseUp}
      draggingId={draggingFileId}
    />
  );
};

const Sidebar = ({
  files = [],
  folders = [],
  activeFileId = null,
  onFileSelect = () => {},
  onCreateFile = () => {},
  onCreateFolder = () => {},
  onRenameFolder = () => {},
  onDeleteFolder = () => {},
  onMoveFileToFolder = () => {},
  onOrderUpdate = () => {},
  // 添加文件拖拽相关的属性和事件处理函数
  draggingFileId = null,
  isFileDragging = false,
  onFileMouseDown = () => {},
  onFileMouseUp = () => {},
  onFileDragEnd = () => {},
  onFileDragMove = () => {}
}) => {
  const [openFolders, setOpenFolders] = useState({});
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [isRenamingFolder, setIsRenamingFolder] = useState(false);
  const [renameFolderName, setRenameFolderName] = useState('');

  // 处理文件夹折叠展开
  const handleFolderToggle = (folderId) => {
    setOpenFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };
  
  // 添加事件监听，当文件被移动到文件夹时自动展开该文件夹
  React.useEffect(() => {
    const handleExpandFolder = (event) => {
      const { folderId } = event.detail;
      if (folderId) {
        console.log('Sidebar收到展开文件夹事件:', folderId);
        setOpenFolders(prev => {
          const newState = {
            ...prev,
            [folderId]: true // 确保文件夹展开
          };
          console.log('文件夹展开状态更新:', newState);
          return newState;
        });
      }
    };
    
    document.addEventListener('expandFolder', handleExpandFolder);
    
    return () => {
      document.removeEventListener('expandFolder', handleExpandFolder);
    };
  }, []);

  // 处理新建文件夹
  const handleCreateFolder = () => {
    setIsCreatingFolder(true);
  };

  // 提交新建文件夹
  const handleSubmitNewFolder = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreatingFolder(false);
    }
  };

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

  // 处理文件排序
  const handleReorderFiles = (reorderedFiles) => {
    // 更新UI
    onOrderUpdate({
      type: 'file-reorder',
      updatedFiles: reorderedFiles
    });
  };

  // 构建文件和文件夹树结构
  const rootFiles = files.filter(file => !file.folderId);
  
  return (
    <Box sx={{ width: 240, height: '100%', overflowY: 'auto', bgcolor: 'background.paper' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">文件</Typography>
        <Box>
          <IconButton size="small" onClick={handleCreateFolder} title="新建文件夹">
            <CreateNewFolderIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={onCreateFile} title="新建笔记">
            <AddIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
      
      {isCreatingFolder && (
        <Box sx={{ p: 2, mb: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="文件夹名称"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmitNewFolder()}
            onBlur={handleSubmitNewFolder}
            autoFocus
          />
        </Box>
      )}
      
      <FileDndContext
        files={files}
        onReorder={handleReorderFiles}
        onMoveToFolder={onMoveFileToFolder}
      >
        <List component="nav" dense>
          {/* 文件夹 */}
          {folders.map((folder) => (
            <React.Fragment key={folder.id}>
              <ListItem 
                button 
                onClick={() => handleFolderToggle(folder.id)}
                sx={{ 
                  bgcolor: 'background.default',
                  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' },
                  // 添加拖拽时的视觉反馈 - 增强视觉效果
                  ...(isFileDragging && {
                    bgcolor: 'rgba(63, 81, 181, 0.12)',
                    border: '2px dashed rgba(63, 81, 181, 0.7)',
                    boxShadow: '0 0 5px rgba(63, 81, 181, 0.3)',
                    transition: 'all 0.2s ease-in-out'
                  }),
                  // 添加明显的可拖放指示
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    pointerEvents: 'none',
                    border: isFileDragging ? '2px dashed rgba(63, 81, 181, 0.7)' : '1px dashed transparent',
                    transition: 'all 0.3s ease'
                  },
                  // 增加点击区域，使文件夹更容易被拖放到
                  padding: '8px 16px',
                  margin: '2px 0'
                }}
                id={`folder-${folder.id}`} // 为拖放目标添加id
                data-droppable-id={`folder-${folder.id}`} // 添加data属性用于拖放识别
                data-folder-id={folder.id} // 添加明确的文件夹ID属性
                data-is-folder="true" // 添加明确的文件夹标识
                className="folder-item" // 添加类名，便于CSS选择器识别
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {openFolders[folder.id] ? <FolderOpenIcon /> : <FolderIcon />}
                </ListItemIcon>
                {isRenamingFolder && selectedFolderId === folder.id ? (
                  <TextField
                    fullWidth
                    size="small"
                    value={renameFolderName}
                    onChange={(e) => setRenameFolderName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmitRename()}
                    onBlur={handleSubmitRename}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <ListItemText primary={folder.name} />
                )}
                <IconButton 
                  size="small" 
                  onClick={(e) => handleFolderMenuOpen(e, folder.id)}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
                {openFolders[folder.id] ? <ExpandLess /> : <ExpandMore />}
              </ListItem>
              
              <Collapse in={openFolders[folder.id]} timeout="auto">
                <List 
                  component="div" 
                  sx={{ 
                    bgcolor: 'rgba(0, 0, 0, 0.02)',
                    minHeight: '30px', // 增加最小高度，使空文件夹也有足够的拖放区域
                    padding: '8px 0',
                    border: '1px dashed transparent',
                    '&:hover': { borderColor: 'rgba(0, 0, 0, 0.1)' },
                    // 添加拖拽时的视觉反馈 - 增强视觉效果
                    ...(isFileDragging && {
                      border: '2px dashed rgba(63, 81, 181, 0.7)',
                      bgcolor: 'rgba(63, 81, 181, 0.08)',
                      boxShadow: 'inset 0 0 5px rgba(63, 81, 181, 0.2)',
                      transition: 'all 0.2s ease-in-out',
                      // 增加内边距，使拖放区域更明显
                      padding: '12px 0',
                      margin: '4px 0'
                    }),
                    // 添加明显的可拖放指示
                    position: 'relative',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      pointerEvents: 'none',
                      border: isFileDragging ? '2px dashed rgba(63, 81, 181, 0.7)' : '1px dashed transparent',
                      transition: 'all 0.3s ease'
                    }
                  }}
                  id={`folder-content-${folder.id}`}
                  data-droppable-id={`folder-${folder.id}`} // 添加与文件夹相同的droppable-id
                  data-folder-id={folder.id} // 添加明确的文件夹ID属性
                  data-folder-content="true" // 标记为文件夹内容区域
                  data-is-folder="true" // 添加明确的文件夹标识
                  className="folder-content" // 添加类名，便于CSS选择器识别
                >
                  {files
                    .filter(file => {
                      // 确保类型一致性，将两者都转换为字符串进行比较
                      const fileFolderId = file.folderId === null ? null : String(file.folderId);
                      const currentFolderId = String(folder.id);
                      return fileFolderId === currentFolderId;
                    })
                    .map((file) => (
                      <DraggableFileItem
                        key={file.id}
                        file={file}
                        folderId={folder.id}
                        activeFileId={activeFileId}
                        onFileSelect={onFileSelect}
                        draggingFileId={draggingFileId}
                        onFileMouseDown={onFileMouseDown}
                        onFileMouseUp={onFileMouseUp}
                      />
                    ))
                  }
                </List>
              </Collapse>
            </React.Fragment>
          ))}
          
          {/* 根文件 */}
          <div id="root-files">
            {rootFiles.map((file) => (
              <DraggableFileItem
                key={file.id}
                file={file}
                activeFileId={activeFileId}
                onFileSelect={onFileSelect}
                draggingFileId={draggingFileId}
                onFileMouseDown={onFileMouseDown}
                onFileMouseUp={onFileMouseUp}
              />
            ))}
          </div>
        </List>
      </FileDndContext>
      
      {/* 文件夹操作菜单 */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleFolderMenuClose}
      >
        <MenuItem onClick={handleRenameFolder}>重命名文件夹</MenuItem>
        <MenuItem onClick={handleDeleteFolder}>删除文件夹</MenuItem>
      </Menu>
    </Box>
  );
};

export default Sidebar;