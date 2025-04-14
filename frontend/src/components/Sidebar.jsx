/**
 * @author Jolly
 * @date 2025-04-11 (Updated)
 * @description 侧边栏组件，提供文件导航、文件夹管理功能
 * @version 1.3.1
 * @license GPL-3.0
 */

import React, { useState, memo, useCallback, useRef } from 'react';
import { List, ListItem, ListItemText, ListItemIcon, Collapse, IconButton, TextField, Menu, MenuItem } from '@mui/material';
import { Box, Typography, Divider } from '@mui/material';
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

// 定义日志级别
const LOG_LEVEL = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
};

// 设置当前日志级别
const CURRENT_LOG_LEVEL = LOG_LEVEL.WARN; // 只输出警告和错误信息

// 日志工具
const SidebarLogger = {
  debug: (message, data) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVEL.DEBUG) {
      console.debug(`[Sidebar|Debug] ${message}`, data || '');
    }
  },
  
  info: (message, data) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVEL.INFO) {
      console.log(`[Sidebar|Info] ${message}`, data || '');
    }
  },
  
  warn: (message, data) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVEL.WARN) {
      console.warn(`[Sidebar|Warn] ${message}`, data || '');
    }
  },
  
  error: (message, error) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVEL.ERROR) {
      console.error(`[Sidebar|Error] ${message}`, error || '');
    }
  }
};

// 性能测量工具
const perf = {
  marks: {},
  start: (id) => {
    perf.marks[id] = performance.now();
  },
  end: (id, note = '') => {
    if (perf.marks[id]) {
      const duration = performance.now() - perf.marks[id];
      SidebarLogger.debug(`性能 [${id}] ${note}: ${duration.toFixed(2)}ms`);
      delete perf.marks[id];
      return duration;
    }
    return 0;
  }
};

// 文件列表项组件
const FileItem = memo(({ 
  file, 
  folderId = null, 
  activeFileId = null, 
  onFileSelect = () => {},
  dragHandleProps = {},
  isDragging = false,
  onMouseDown = () => {},
  onMouseUp = () => {},
  draggingId = null
}) => {
  // 移除大多数调试日志，只在必要时记录
  const handleMouseDown = (e) => {
    onMouseDown(file.id);
  };

  const handleMouseUp = (e) => {
    onMouseUp();
  };
  
  // 渲染前为性能敏感的组件做一次额外的优化检查
  const shouldHighlight = isDragging || draggingId === file.id;
  
  return (
    <ListItem
      button
      selected={activeFileId === file.id}
      onClick={() => onFileSelect(file.id)}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      sx={{
        pl: folderId ? 4 : 2,
        py: 1,
        background: shouldHighlight ? 'rgba(63, 81, 181, 0.08)' : 'transparent',
        '&.Mui-selected': {
          bgcolor: 'rgba(63, 81, 181, 0.1)',
        },
        cursor: draggingId === file.id ? 'grabbing' : 'pointer',
        borderLeft: folderId ? '1px solid rgba(0,0,0,0.08)' : 'none',
        '&:hover': {
          bgcolor: 'rgba(0, 0, 0, 0.04)'
        }
      }}
      {...dragHandleProps}
      data-file-item="true"
      data-file-id={file.id}
    >
      <ListItemIcon sx={{ minWidth: 36 }}>
        <DescriptionIcon fontSize="small" color="action" />
      </ListItemIcon>
      <ListItemText 
        primary={file.name}
        primaryTypographyProps={{
          style: {
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }
        }}
      />
    </ListItem>
  );
});

// 创建可排序的文件项
const SortableFileItem = createSortableItem(FileItem);

// 包装SortableFileItem，添加长按拖拽功能
const DraggableFileItem = memo(({ file, folderId, activeFileId, onFileSelect, draggingFileId, onFileMouseDown, onFileMouseUp }) => {
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
});

// 文件夹内容渲染组件 - 提取到循环外以避免在循环中使用 Hooks
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
  // 使用useMemo优化文件夹内文件的过滤，避免重复渲染
  const folderFiles = React.useMemo(() => {
    // 为了健壮性，先确保files是有效的数组
    if (!Array.isArray(files)) return [];
    
    const result = files.filter(file => {
      // 确保file是有效对象
      if (!file) return false;
      
      const fileFolderId = file.folder_id;
      const currentFolderId = folder?.id;
      
      // 如果currentFolderId无效，则返回false
      if (currentFolderId === undefined || currentFolderId === null) return false;
      
      // 使用双等号允许类型转换 (2 == '2')
      return String(fileFolderId) === String(currentFolderId);
    });
    
    return result;
  }, [files, folder?.id]);
  
  // 如果folder无效，返回一个合理的默认UI
  if (!folder) {
    return (
      <Box sx={{ 
        py: 1.5, 
        px: 2, 
        color: 'text.disabled',
        fontStyle: 'italic',
        fontSize: '0.75rem',
        textAlign: 'center'
      }}>
        无效的文件夹
      </Box>
    );
  }
  
  // 空文件夹的显示状态根据是否正在拖拽文件而变化
  if (folderFiles.length === 0) {
    return (
      <Box sx={{ 
        py: 1.5, 
        px: 2, 
        color: isFileDragging ? 'primary.main' : 'text.disabled',
        fontStyle: 'italic',
        fontSize: '0.75rem',
        textAlign: 'center',
        border: isFileDragging ? '1px dashed rgba(63, 81, 181, 0.4)' : 'none',
        borderRadius: 1,
        m: isFileDragging ? 1 : 0,
        bgcolor: isFileDragging ? 'rgba(63, 81, 181, 0.05)' : 'transparent',
      }}>
        {isFileDragging ? '拖动到此处添加文件' : '空文件夹'}
      </Box>
    );
  }
  
  return folderFiles.map((file) => (
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
  ));
});

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
  draggingFileId = null,
  setDraggingFileId = () => {},
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
  const lastDragTimeRef = useRef(null);
  
  // 在组件挂载和卸载时记录日志
  React.useEffect(() => {
    SidebarLogger.info(`侧边栏渲染: 文件数=${files.length}, 文件夹数=${folders.length}`);
    
    return () => {
      SidebarLogger.debug('侧边栏卸载');
    };
  }, [files.length, folders.length]);

  // 处理文件夹折叠展开 - 使用useCallback优化
  const handleFolderToggle = useCallback((folderId) => {
    setOpenFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  }, []);
  
  // 添加事件监听，当文件被移动到文件夹时自动展开该文件夹
  const handleExpandFolder = useCallback((event) => {
    const { folderId } = event.detail;
    // 只在folderId有效且非0/null时展开文件夹
    if (folderId && folderId !== '0' && folderId !== 0) {
      SidebarLogger.info(`收到展开文件夹事件: ${folderId}`);
      
      // 使用函数式更新，避免闭包陷阱
      setOpenFolders(prev => ({
        ...prev,
        [folderId]: true // 确保文件夹展开
      }));
    }
  }, []);
  
  // 仅添加一次事件监听器，并在组件卸载时清理
  React.useEffect(() => {
    // 确保移除之前可能存在的监听器
    document.removeEventListener('expandFolder', handleExpandFolder);
    // 添加新的监听器
    document.addEventListener('expandFolder', handleExpandFolder);
    
    // 清理函数
    return () => {
      document.removeEventListener('expandFolder', handleExpandFolder);
    };
  }, [handleExpandFolder]); // 依赖于handleExpandFolder函数

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

  // 优化文件鼠标事件处理
  const handleFileMouseDown = useCallback((fileId) => {
    lastDragTimeRef.current = Date.now();
    setDraggingFileId(fileId);
  }, [setDraggingFileId]);

  const handleFileMouseUp = useCallback(() => {
    setDraggingFileId(null);
    lastDragTimeRef.current = null;
  }, [setDraggingFileId]);
  
  // 构建文件和文件夹树结构 - 使用useMemo优化性能，避免每次渲染时都重新计算
  const rootFiles = React.useMemo(() => {
    // 修复了根文件判定逻辑，所有值为null/undefined/0/'0'/''的folder_id都视为根文件
    // 确保使用一致的根目录判断
    const rootIndicators = [null, undefined, 0, '0', ''];
    
    // 筛选出根文件 - 只有明确不在任何文件夹中的文件才会显示在根目录
    return files.filter(file => rootIndicators.includes(file.folder_id));
  }, [files]);
  
  // 为解决文件不可点击的问题，确保所有指针事件正常工作
  React.useEffect(() => {
    // 确保在拖拽结束后重置所有可能的状态
    if (!isFileDragging && draggingFileId === null) {
      const fileItems = document.querySelectorAll('[data-file-item="true"]');
      fileItems.forEach(item => {
        item.style.pointerEvents = 'auto';
        const parent = item.parentElement;
        if (parent) {
          parent.style.pointerEvents = 'auto';
        }
      });
    }
  }, [isFileDragging, draggingFileId]);
  
  return (
    <Box sx={{ 
      width: 240, 
      height: '100vh', 
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'background.paper',
      boxShadow: 1,
      borderRight: '1px solid rgba(0, 0, 0, 0.12)',
      position: 'sticky', 
      top: 0, 
      left: 0, 
      zIndex: 100, 
      maxHeight: '100vh', 
      minHeight: '100vh'
    }}>
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)'
      }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>我的笔记</Typography>
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
        <Box sx={{ 
          flexGrow: 1, 
          overflowY: 'auto', 
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* 全局拖放区域 - 覆盖整个侧边栏，简化为一个整体 */}
          <Box
            id="global-drop-area"
            data-is-root-area="true"
            data-droppable-id="root-area"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: isFileDragging ? 5 : -1,
              pointerEvents: isFileDragging ? 'auto' : 'none',
              // 当拖拽时显示一个淡色边框指示整个区域
              border: isFileDragging ? '2px dashed rgba(63, 81, 181, 0.2)' : 'none',
              borderRadius: '4px',
              margin: isFileDragging ? '8px' : 0,
              transition: 'all 0.3s ease'
            }}
          />

          <List component="nav" dense sx={{ width: '100%', pt: 0 }}>
            {/* 文件夹区域 */}
            {folders.map((folder) => (
              <React.Fragment key={folder.id}>
                {/* 文件夹头部 */}
                <ListItem 
                  button 
                  onClick={() => handleFolderToggle(folder.id)}
                  sx={{ 
                    bgcolor: 'background.paper',
                    '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' },
                    ...(isFileDragging && {
                      bgcolor: 'rgba(63, 81, 181, 0.05)',
                      border: '1px dashed rgba(63, 81, 181, 0.4)',
                      transition: 'all 0.2s ease-in-out'
                    }),
                    position: 'relative',
                    py: 1.2,
                    px: 2
                  }}
                  id={`folder-${folder.id}`}
                  data-droppable-id={`folder-${folder.id}`}
                  data-folder-id={folder.id}
                  data-is-folder="true"
                  data-folder-header="true"
                  className="folder-item folder-header"
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {openFolders[folder.id] ? 
                      <FolderOpenIcon color="primary" /> : 
                      <FolderIcon color="primary" />
                    }
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
                    <ListItemText 
                      primary={folder.name}
                      primaryTypographyProps={{
                        style: {
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }
                      }}
                    />
                  )}
                  <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
                    <IconButton 
                      size="small" 
                      onClick={(e) => handleFolderMenuOpen(e, folder.id)}
                      sx={{ mr: 0.5 }}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                    {openFolders[folder.id] ? <ExpandLess /> : <ExpandMore />}
                  </Box>
                </ListItem>
                
                {/* 文件夹内容区域 */}
                <Collapse in={openFolders[folder.id]} timeout="auto">
                  <List 
                    component="div" 
                    sx={{ 
                      bgcolor: 'rgba(0, 0, 0, 0.01)',
                      minHeight: '10px',
                      py: 0.5,
                      ...(isFileDragging && {
                        bgcolor: 'rgba(63, 81, 181, 0.03)',
                        transition: 'background-color 0.2s ease-in-out'
                      })
                    }}
                    id={`folder-content-${folder.id}`}
                    data-droppable-id={`folder-${folder.id}`}
                    data-folder-id={folder.id}
                    data-folder-content="true"
                    data-is-folder="true"
                    className="folder-content"
                  >
                    <FolderContent
                      folder={folder}
                      files={files}
                      activeFileId={activeFileId}
                      draggingFileId={draggingFileId}
                      onFileSelect={onFileSelect}
                      onFileMouseDown={handleFileMouseDown}
                      onFileMouseUp={handleFileMouseUp}
                      isFileDragging={isFileDragging}
                    />
                  </List>
                </Collapse>
              </React.Fragment>
            ))}

            {/* 使用轻量级分隔线 */}
            {folders.length > 0 && rootFiles.length > 0 && (
              <Divider sx={{ my: 1, opacity: 0.5 }} />
            )}
            
            {/* 根文件区域 - 简化的设计，去掉过多的方框 */}
            <Box
              id="root-files"
              data-is-root-area="true"
              data-droppable-id="root-area"
              className="root-files-area"
              sx={{
                minHeight: rootFiles.length === 0 ? '60px' : 'auto',
                px: 0,
                py: 0.5,
                // 简化的指示器，只有当拖拽时才显示微弱的背景色
                ...(isFileDragging && {
                  bgcolor: 'rgba(25, 118, 210, 0.03)',
                })
              }}
            >
              {rootFiles.length > 0 ? (
                rootFiles.map((file) => (
                  <DraggableFileItem
                    key={file.id}
                    file={file}
                    activeFileId={activeFileId}
                    onFileSelect={onFileSelect}
                    draggingFileId={draggingFileId}
                    onFileMouseDown={handleFileMouseDown}
                    onFileMouseUp={handleFileMouseUp}
                  />
                ))
              ) : (
                <Box 
                  sx={{ 
                    py: 2,
                    px: 2, 
                    color: isFileDragging ? 'primary.main' : 'text.secondary',
                    fontStyle: 'italic',
                    fontSize: '0.85rem',
                    textAlign: 'center',
                    // 简化空状态样式
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  data-is-root-area="true"
                  data-droppable-id="root-area"
                >
                  {isFileDragging ? '拖放到此处将文件移至根目录' : '根目录下暂无文件'}
                </Box>
              )}
            </Box>
            
            {/* 添加一个专门用于接收拖拽的根目录区域（对应截图中标记的红框区域） */}
            <Box
              id="root-drop-area"
              data-is-root-area="true"
              data-droppable-id="root-area"
              sx={{
                // 占据剩余空间，确保底部填充
                flexGrow: 1, 
                minHeight: '120px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                // 仅在拖拽时显示视觉提示
                ...(isFileDragging ? {
                  bgcolor: 'rgba(25, 118, 210, 0.04)',
                  border: '1px dashed rgba(25, 118, 210, 0.2)',
                  margin: '8px',
                  borderRadius: '4px',
                } : {
                  // 非拖拽状态下保持透明
                  border: 'none',
                  bgcolor: 'transparent',
                })
              }}
            >
              {isFileDragging && (
                <Typography
                  variant="body2"
                  sx={{
                    fontStyle: 'italic',
                    color: 'text.secondary',
                    opacity: 0.7
                  }}
                >
                  根目录下无文件
                </Typography>
              )}
            </Box>
          </List>
        </Box>
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