/**
 * @author Jolly
 * @date 2025-05-01 (Refactored)
 * @description 主应用组件，协调侧边栏和笔记列表
 * @version 1.3.0
 * @license Apache-2.0
 */

/*
 * Copyright 2025 Jolly Chen
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, { useState, useCallback } from 'react';
import { Container, Box, Alert, Snackbar, Typography } from '@mui/material'; // Added Typography here
import Sidebar from './components/Sidebar';
import NoteList from './components/NoteList';
import AppHeader from './components/AppHeader';
import DeleteFileDialog from './components/DeleteFileDialog';
import AIOptimizeDialog from './components/AIOptimizeDialog';
import { useApiStatus } from './hooks/useApiStatus';
import { useFolders } from './hooks/useFolders';
import { useFiles } from './hooks/useFiles';
import { useNotes } from './hooks/useNotes';
import { DragDropContext } from './utils/dndWrapper.jsx';
import ErrorBoundary from './components/ErrorBoundary'; // Import the ErrorBoundary

function App() {
  // 1. API 状态管理
  const { apiStatus, errorMessage, isLoading: isApiLoading, checkApiHealth, setErrorMessage, clearErrorMessage } = useApiStatus();

  // 2. 文件夹状态管理
  const { folders, fetchFolders, createFolder, renameFolder, deleteFolder } = useFolders(setErrorMessage);

  // 3. 文件状态管理
  const {
    files,
    setFiles,
    activeFileId,
    setActiveFileId,
    fetchFiles,
    createFile,
    deleteFile,
    updateFileOrder,
    moveFileToFolder,
    isEditingFileName,
    editingFileName,
    setEditingFileName,
    handleFileNameClick,
    handleFileNameChange,
    handleFileNameKeyPress,
    handleFileNameBlur,
  } = useFiles([], setErrorMessage);

  // 4. 笔记状态管理
  const {
    notes,
    setNotes,
    activeNoteId,
    setActiveNoteId,
    createNote,
    deleteNote,
    updateNoteOrder,
    handleNoteUpdateFromEditor,
  } = useNotes(activeFileId, setErrorMessage);
  // 5. 删除确认对话框状态
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // 6. AI优化对话框状态
  const [aiOptimizeDialogOpen, setAiOptimizeDialogOpen] = useState(false);
  // 初始化加载数据
  React.useEffect(() => {
    const initialize = async () => {
      console.log('🚀 开始初始化应用...');
      const isHealthy = await checkApiHealth();
      console.log('🏥 API健康检查结果:', isHealthy);
      
      if (isHealthy) {
        try {
          console.log('📂 开始获取文件和文件夹...');
          const [fetchedFiles, fetchedFolders] = await Promise.all([
            fetchFiles(),
            fetchFolders(),
          ]);
          console.log('📂 获取到的文件:', fetchedFiles);
          console.log('📁 获取到的文件夹:', fetchedFolders);
          
          // 如果获取到文件且当前没有激活文件，则激活第一个
          if (fetchedFiles.length > 0 && !activeFileId) {
            setActiveFileId(fetchedFiles[0].id);
            console.log('🎯 激活文件:', fetchedFiles[0].id);
          }
        } catch (error) {
          console.error("❌ 初始化失败:", error);
        }
      } else {
        console.warn('⚠️ API健康检查失败，跳过数据获取');
      }
    };
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 初始加载，依赖项为空
  // 删除文件夹后刷新文件列表
  const handleDeleteFolder = useCallback(async (folderId) => {
    const success = await deleteFolder(folderId);
    if (success) {
      await fetchFiles(); // 文件夹删除成功后，刷新文件列表
    }
  }, [deleteFolder, fetchFiles]);

  // 处理创建笔记点击事件
  const handleCreateNoteClick = useCallback(async () => {
    console.log('🔘 + 按钮被点击，开始创建笔记...');
    if (!activeFileId) {
      setErrorMessage('请先选择一个文件');
      return;
    }
    
    try {
      // 在末尾创建新笔记，所以 afterNoteId 为 null
      const newNoteId = await createNote(null, '', 'text');
      console.log('✅ 成功创建笔记，ID:', newNoteId);
    } catch (error) {
      console.error('❌ 创建笔记失败:', error);
      setErrorMessage('创建笔记失败: ' + error.message);
    }
  }, [activeFileId, createNote, setErrorMessage]);

  // 打开删除文件对话框
  const openDeleteDialog = useCallback(() => {
    if (activeFileId) {
      setDeleteDialogOpen(true);
    }
  }, [activeFileId]);
  // 确认删除文件
  const confirmDeleteFile = useCallback(async () => {
    if (activeFileId) {
      const success = await deleteFile(activeFileId);
      if (success) {
        setDeleteDialogOpen(false);
      }
    }
  }, [activeFileId, deleteFile]);
  // AI优化内容处理
  const handleAIOptimize = useCallback(() => {
    if (!activeFileId) {
      setErrorMessage('请先选择一个文件');
      return;
    }

    setAiOptimizeDialogOpen(true);
  }, [activeFileId, setErrorMessage]);

  // AI优化对话框关闭处理
  const handleAIOptimizeDialogClose = useCallback((applied) => {
    setAiOptimizeDialogOpen(false);
    
    if (applied) {
      // 如果应用了优化，重新加载笔记数据
      setErrorMessage('AI优化已应用，正在刷新数据...');
      setTimeout(() => {
        // 这里应该重新获取笔记数据
        window.location.reload(); // 简单粗暴的刷新方式
      }, 1000);
    }
  }, [setErrorMessage]);

  // 统一的拖放结束处理
  const handleDragEnd = useCallback((result) => {
    const { source, destination, draggableId, type } = result;

    if (!destination) return; // 拖到非放置区域

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return; // 位置未改变
    }

    // --- 处理笔记拖放排序 ---
    if (type === 'NOTE' || type === 'DEFAULT') {
      if (source.droppableId === destination.droppableId && source.droppableId === `notes-${activeFileId}`) {
        const items = Array.from(notes);
        const [reorderedItem] = items.splice(source.index, 1);
        items.splice(destination.index, 0, reorderedItem);
        updateNoteOrder(items.map(item => item.id));
      }
      return;
    }

    // --- 处理文件拖放 ---
    if (type === 'FILE') {
      const fileId = draggableId;

      // 情况 1: 文件移动到文件夹
      if (destination.droppableId.startsWith('folder-')) {
        const folderElement = document.getElementById(destination.droppableId);
        const targetFolderId = folderElement?.getAttribute('data-folder-id') || 
                              destination.droppableId.split('-')[1];
        moveFileToFolder(fileId, targetFolderId);
        return;
      }

      // 情况 2: 文件移动到根目录区域
      if (destination.droppableId === 'root-area' || destination.droppableId === 'root-files' || 
          destination.droppableId === 'global-drop-area') {
        moveFileToFolder(fileId, null); // null 表示根目录
        return;
      }
    }
  }, [notes, activeFileId, updateNoteOrder, moveFileToFolder]);

  const activeFile = files.find(f => f.id === activeFileId);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        {/* API 错误/状态提示 */}
        <Snackbar
          open={!!errorMessage}
          autoHideDuration={6000}
          onClose={clearErrorMessage}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          sx={{ maxWidth: '80%', '& .MuiPaper-root': { maxWidth: '100%' } }}
        >
          <Alert
            severity={apiStatus ? "warning" : "error"}
            onClose={clearErrorMessage}
            sx={{ width: '100%', '& .MuiAlert-message': { maxWidth: '600px' } }}
          >
            {errorMessage}
          </Alert>
        </Snackbar>

        <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
          {/* 侧边栏 */}
          <Sidebar
            files={files}
            folders={folders}
            activeFileId={activeFileId}
            onFileSelect={setActiveFileId}
            onCreateFile={createFile}
            onCreateFolder={createFolder}
            onRenameFolder={renameFolder}
            onDeleteFolder={handleDeleteFolder}
            onMoveFileToFolder={moveFileToFolder}
            onOrderUpdate={updateFileOrder}
          />

          {/* 主要内容区 */}
          <Box component="main" sx={{ flexGrow: 1, p: 3, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* 头部 */}            <AppHeader
              activeFile={activeFile}
              isEditingFileName={isEditingFileName}
              editingFileName={editingFileName}
              onFileNameChange={setEditingFileName}
              onFileNameKeyPress={handleFileNameKeyPress}
              onFileNameBlur={handleFileNameBlur}
              onFileNameClick={handleFileNameClick}
              onDeleteFileClick={openDeleteDialog}
              onCreateNoteClick={handleCreateNoteClick}
              onAIOptimizeClick={handleAIOptimize}
              isLoading={isApiLoading}
            />

            {/* 笔记列表 */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
              <Container maxWidth="xl" sx={{ pt: 0, pb: 4 }}>
                <ErrorBoundary>
                  {activeFileId && ( // Only render NoteList if a file is active
                    <NoteList
                      notes={notes}
                      setNotes={setNotes} // Pass setNotes if needed for local updates
                      activeNoteId={activeNoteId}
                      setActiveNoteId={setActiveNoteId}
                      onUpdateNote={handleNoteUpdateFromEditor} // Pass the combined handler
                      onDeleteNote={deleteNote}
                      onUpdateNoteOrder={updateNoteOrder}
                      setErrorMessage={setErrorMessage}
                    />
                  )}
                  {!activeFileId && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <Typography variant="h6" color="text.secondary">请选择或创建一个文件以开始</Typography>
                    </Box>
                  )}
                </ErrorBoundary>
              </Container>
            </Box>
          </Box>
        </Box>        {/* 删除文件确认对话框 */}
        <DeleteFileDialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={confirmDeleteFile}
          fileName={activeFile?.name}
        />

        {/* AI优化对话框 */}
        <AIOptimizeDialog
          open={aiOptimizeDialogOpen}
          onClose={handleAIOptimizeDialogClose}
          fileId={activeFileId}
          fileName={activeFile?.name}
        />
      </Box>
    </DragDropContext>
  );
}

export default App;