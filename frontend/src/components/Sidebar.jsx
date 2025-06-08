/**
 * 文件名: Sidebar.jsx
 * 组件: 侧边栏组件
 * 描述: 提供文件导航、文件夹管理和文件操作功能的侧边栏界面
 * 功能: 文件导航、文件夹管理、拖拽排序、文件操作、搜索过滤
 * 作者: Jolly Chen
 * 时间: 2024-11-20
 * 版本: 1.4.0
 * 依赖: React, Material-UI, @dnd-kit/core, FolderList, FileItem
 * 许可证: Apache-2.0
 * 
 * Props:
 *   - files: 文件列表数组
 *   - activeFileId: 当前活跃文件ID
 *   - folders: 文件夹列表数组
 *   - onFileSelect: 文件选择回调函数
 *   - onCreateFile: 创建文件回调函数
 *   - onDeleteFile: 删除文件回调函数
 *   - onUpdateFileOrder: 更新文件顺序回调函数
 *   - onMoveFileToFolder: 移动文件到文件夹回调函数
 *   - setErrorMessage: 错误消息设置函数
 * 
 * 功能:
 *   - 文件列表展示和管理
 *   - 拖拽排序支持
 *   - 文件夹分组管理
 *   - 文件重命名和删除
 *   - 响应式侧边栏布局
 * 
 * 作者: Jolly
 * 创建时间: 2025-04-01
 * 最后修改: 2025-06-04
 * 版本: 1.4.0
 * 许可证: Apache-2.0
 */

import React, { useState, useCallback, useRef, memo } from 'react';
import { 
  List, ListItem, ListItemIcon, TextField, Box, Drawer, Divider, 
  Typography, IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import { FileDndContext } from '../utils/dnd/index.js';
import FileItem from './FileItem';
import FolderList from './FolderList';

// 日志级别常量
const LOG_LEVEL = {
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4
};

// 当前日志级别设置
const CURRENT_LOG_LEVEL = LOG_LEVEL.INFO;

// 侧边栏日志工具
const SidebarLogger = {
  debug: (message, data) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVEL.DEBUG) {
      console.debug(`[Sidebar|Debug] ${message}`, data || '');
    }
  },
  
  info: (message, data) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVEL.INFO) {
      console.info(`[Sidebar|Info] ${message}`, data || '');
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

// 侧边栏组件
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
}) => {
  // 状态管理
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [draggingFileId, setDraggingFileId] = useState(null);
  const [isFileDragging, setIsFileDragging] = useState(false);
  
  // Refs
  const lastDragTimeRef = useRef(null);
  
  // 处理创建文件操作
  const handleCreateFile = useCallback(() => {
    onCreateFile();
  }, [onCreateFile]);
  
  // 处理创建文件夹操作
  const handleCreateFolder = useCallback(() => {
    setIsCreatingFolder(true);
    setNewFolderName('');
  }, []);
  
  // 提交新建文件夹
  const handleSubmitNewFolder = useCallback(() => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreatingFolder(false);
    }
  }, [newFolderName, onCreateFolder]);
  
  // 文件鼠标事件处理
  const handleFileMouseDown = useCallback((fileId) => {
    lastDragTimeRef.current = Date.now();
    setDraggingFileId(fileId);
  }, []);

  const handleFileMouseUp = useCallback(() => {
    setDraggingFileId(null);
    lastDragTimeRef.current = null;
  }, []);
  
  // 处理文件排序
  const handleReorderFiles = useCallback((reorderedFiles) => {
    onOrderUpdate({
      type: 'file-reorder',
      updatedFiles: reorderedFiles
    });
  }, [onOrderUpdate]);
  
  // 构建根文件列表
  const rootFiles = React.useMemo(() => {
    const rootIndicators = [null, undefined, 0, '0', ''];
    return files.filter(file => rootIndicators.includes(file.folder_id));
  }, [files]);

  // 设置拖拽状态监听 - 使用dnd-kit事件
  React.useEffect(() => {
    const onDragStart = (event) => {
      SidebarLogger.debug('拖拽开始事件触发', event);
      setIsFileDragging(true);
      if (event.detail && event.detail.fileId) {
        setDraggingFileId(event.detail.fileId);
      }
    };
    
    const onDragEnd = (event) => {
      SidebarLogger.debug('拖拽结束事件触发', event);
      setIsFileDragging(false);
      setDraggingFileId(null);
    };
    
    // 监听自定义拖拽事件
    document.addEventListener('dnd-drag-start', onDragStart);
    document.addEventListener('dnd-drag-end', onDragEnd);
    
    // 同时保留原生事件作为备用
    document.addEventListener('dragstart', onDragStart);
    document.addEventListener('dragend', onDragEnd);
    
    return () => {
      document.removeEventListener('dnd-drag-start', onDragStart);
      document.removeEventListener('dnd-drag-end', onDragEnd);
      document.removeEventListener('dragstart', onDragStart);
      document.removeEventListener('dragend', onDragEnd);
    };
  }, []);
  
  // 组件挂载/卸载日志  // 监听组件卸载
  React.useEffect(() => {
    return () => {
      SidebarLogger.debug('侧边栏卸载');
    };
  }, []);
  
  // 确保拖拽后文件项可点击
  React.useEffect(() => {
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
    <Drawer
      variant="permanent"
      sx={{
        width: 280,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 280,
          boxSizing: 'border-box',
          overflowX: 'hidden',
        },
      }}
    >
      {/* 侧边栏头部 */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        p: 2,
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
      }}>
        <Typography variant="h6" component="h1">
          文件
        </Typography>
        <Box>
          <IconButton 
            size="small"
            color="primary" 
            onClick={handleCreateFile}
            title="新建文件"
          >
            <AddIcon />
          </IconButton>
          <IconButton 
            size="small"
            color="primary" 
            onClick={handleCreateFolder}
            title="新建文件夹"
          >
            <CreateNewFolderIcon />
          </IconButton>
        </Box>
      </Box>
      
      {/* 文件夹新建输入框 */}
      {isCreatingFolder && (
        <Box sx={{ px: 2, py: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="新建文件夹"
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
          {/* 全局拖放区域 */}
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
              zIndex: -1,
              display: isFileDragging ? 'block' : 'none',
            }}
          />
          
          <List sx={{ width: '100%', py: 0 }}>
            {/* 文件夹列表 */}
            <FolderList 
              folders={folders}
              files={files}
              activeFileId={activeFileId}
              onFileSelect={onFileSelect}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              draggingFileId={draggingFileId}
              onFileMouseDown={handleFileMouseDown}
              onFileMouseUp={handleFileMouseUp}
              isFileDragging={isFileDragging}
            />
            
            {/* 显示分隔线，条件：有文件夹且有根文件 */}
            {folders.length > 0 && rootFiles.length > 0 && (
              <Divider sx={{ my: 1, opacity: 0.5 }} />
            )}
            
            {/* 根文件区域 */}
            <Box
              id="root-files"
              data-is-root-area="true"
              data-droppable-id="root-area"
              className="root-files-area"
              sx={{
                minHeight: rootFiles.length === 0 ? '60px' : 'auto',
                px: 0,
                py: 0.5,
                ...(isFileDragging && rootFiles.length === 0 && {
                  border: '1px dashed rgba(63, 81, 181, 0.4)',
                  borderRadius: 1,
                  m: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }),
              }}
            >
              {rootFiles.length > 0 ? (
                rootFiles.map(file => (
                  <FileItem
                    key={file.id}
                    file={file}
                    activeFileId={activeFileId}
                    onFileSelect={onFileSelect}
                    onMouseDown={() => handleFileMouseDown(file.id)}
                    onMouseUp={handleFileMouseUp}
                    draggingId={draggingFileId}
                  />
                ))
              ) : (
                <Box sx={{
                  width: '100%',
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
            
            {/* 专用根目录拖放区域 */}
            <Box
              id="root-drop-area"
              data-is-root-area="true"
              data-droppable-id="root-area"
              sx={{
                flexGrow: 1, 
                minHeight: '120px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isFileDragging ? 'primary.main' : 'text.disabled',
                fontStyle: 'italic',
                fontSize: '0.75rem',
                border: isFileDragging ? '1px dashed rgba(63, 81, 181, 0.4)' : 'none',
                borderRadius: 1,
                m: isFileDragging ? 1 : 0,
                mt: 2,
                opacity: isFileDragging ? 0.9 : 0.6,
              }}
            >
              {isFileDragging ? '拖放到此区域移至根目录' : ''}
            </Box>
          </List>
        </Box>
      </FileDndContext>
    </Drawer>
  );
};

export default Sidebar;