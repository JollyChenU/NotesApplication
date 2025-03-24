import React, { useEffect, useState } from 'react';
import { Box, Drawer, List, ListItem, ListItemText, IconButton, Paper } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MenuIcon from '@mui/icons-material/Menu'; // Import menu icon
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'; // Import collapse icon
import useFileDragAndDrop from '../hooks/useFileDragAndDrop';

const Sidebar = ({
  files,
  activeFileId,
  onFileSelect,
  onCreateFile,
  onOrderUpdate
}) => {
  const [open, setOpen] = useState(true); // Add state for sidebar open/close
  const toggleSidebar = () => {
    setOpen(!open);
  };

  const {
    draggingFileId,
    mousePosition,
    dropIndicatorIndex,
    handleMouseDown,
    handleMouseUp,
    handleDragEnd,
    handleDragMove
  } = useFileDragAndDrop(updatedFiles => {
    // 通知父组件更新文件列表状态
    onOrderUpdate(updatedFiles);
    onFileSelect(updatedFiles[0]?.id || null);
  });
  useEffect(() => {
    const handleMouseUpEvent = () => {
      if (draggingFileId) {
        handleDragEnd(files);
      }
    };
    window.addEventListener('mouseup', handleMouseUpEvent);
    window.addEventListener('mousemove', handleDragMove);

    return () => {
      window.removeEventListener('mouseup', handleMouseUpEvent);
      window.removeEventListener('mousemove', handleDragMove);
    };
  }, [handleDragEnd, handleDragMove, files, draggingFileId]);
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? 240 : 60, // Set width to 60 when sidebar is closed
        flexShrink: 0,
        transition: 'width 0.3s ease',
        '& .MuiDrawer-paper': {
          width: open ? 240 : 60,
          boxSizing: 'border-box',
          backgroundColor: '#f5f5f5',
          borderRight: '1px solid rgba(0, 0, 0, 0.12)',
          transition: 'width 0.3s ease',
          overflow: open ? 'auto' : 'hidden'
        }
      }}
    >
      <Box sx={{ overflow: 'auto', pt: 8, position: 'relative' }}>
        {/* Toggle Button */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
          <IconButton onClick={toggleSidebar}>
            {open ? <ChevronLeftIcon className="sidebar-collapse-icon" /> : <MenuIcon className="sidebar-expand-icon" />}
          </IconButton>
        </Box>
        
        {/* 拖拽时的阴影文件块 */}
        {draggingFileId && (
          <Box
            sx={{
              position: 'fixed',
              left: mousePosition.x + 20,
              top: mousePosition.y - 20,
              zIndex: 1000,
              pointerEvents: 'none',
              width: '200px',
              display: open ? 'block' : 'none'
            }}
          >
            <Paper
              sx={{
                p: 2,
                background: '#ffffff',
                opacity: 0.6,
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
              }}
            >
              {files.find(file => file.id === draggingFileId)?.name}
            </Paper>
          </Box>
        )}

        {/* 拖拽放置位置指示器 */}
        {open && draggingFileId && dropIndicatorIndex !== null && (
          <Box
            sx={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: '4px',
              backgroundColor: '#1976d2',
              zIndex: 2,
              top: (() => {
                const fileElements = document.querySelectorAll('[data-file-item]');
                if (dropIndicatorIndex === 0) {
                  const firstElement = fileElements[0];
                  if (firstElement) {
                    const rect = firstElement.getBoundingClientRect();
                    return `${rect.top - 2}px`;
                  }
                } else if (dropIndicatorIndex === fileElements.length) {
                  const lastElement = fileElements[fileElements.length - 1];
                  if (lastElement) {
                    const rect = lastElement.getBoundingClientRect();
                    return `${rect.bottom + 2}px`;
                  }
                } else {
                  const currentElement = fileElements[dropIndicatorIndex];
                  const previousElement = fileElements[dropIndicatorIndex - 1];
                  if (currentElement && previousElement) {
                    const currentRect = currentElement.getBoundingClientRect();
                    const previousRect = previousElement.getBoundingClientRect();
                    return `${(previousRect.bottom + currentRect.top) / 2}px`;
                  }
                }
                return '0px';
              })()
            }}
          />
        )}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 2, mb: 1 }}>
          <IconButton
            onClick={onCreateFile}
            color="primary"
            size="small"
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.08)'
              }
            }}
          >
            <AddIcon className="sidebar-add-file-icon" />
          </IconButton>
        </Box>
        <List>
          {files.map((file) => (
            <ListItem
              key={file.id}
              button
              selected={activeFileId === file.id}
              onClick={() => onFileSelect(file.id)}
              data-file-item
              onMouseDown={() => handleMouseDown(file.id)}
              onMouseUp={handleMouseUp}
              onMouseMove={handleDragMove}
              sx={{
                borderLeft: activeFileId === file.id ? '4px solid #1976d2' : '4px solid transparent',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.08)'
                }
              }}
            >
              {open ? (
                <ListItemText
                  primary={file.name}
                  primaryTypographyProps={{
                    noWrap: true,
                    style: {
                      fontWeight: activeFileId === file.id ? 600 : 400
                    }
                  }}
                />
              ) : (
                <Box sx={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {file.name[0]?.toUpperCase()}
                </Box>
              )}
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;