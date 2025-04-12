/**
 * @author Jolly
 * @date 2025-04-01
 * @description 主应用组件，负责管理文件和笔记的状态及操作
 * @version 1.2.0
 * @license GPL-3.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Container, Box, Typography, IconButton, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Button, Alert, Snackbar } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import noteService from './services/noteService';
import NoteList from './components/NoteList';
import Sidebar from './components/Sidebar';
import useDragAndDrop from './hooks/useDragAndDrop';
import useFileDragAndDrop from './hooks/useFileDragAndDrop';
// 使用自定义包装器
import { DragDropContext } from './utils/dndWrapper.jsx';

function App() {
  // 文件相关状态
  const [files, setFiles] = useState([]); // 所有笔记文件列表
  const [activeFileId, setActiveFileId] = useState(null); // 当前激活的文件ID

  // 笔记相关状态
  const [notes, setNotes] = useState([]); // 当前文件的笔记列表
  const [activeNoteId, setActiveNoteId] = useState(null); // 当前激活的笔记ID
  
  // 文件名编辑状态
  const [isEditingFileName, setIsEditingFileName] = useState(false); // 是否正在编辑文件名
  const [editingFileName, setEditingFileName] = useState(''); // 编辑中的文件名
  
  // 删除确认对话框状态
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // 笔记拖拽相关状态和处理函数
  const { draggingNoteId, mousePosition, dropIndicatorIndex, handleDragStart, handleDragEnd: handleNoteDragEnd, handleDragMove } = useDragAndDrop(setNotes);
  
  // 文件拖拽相关状态和处理函数
  const { draggingFileId, isDragging: isFileDragging, handleMouseDown, handleMouseUp, handleDragEnd: handleFileDragEnd, handleDragMove: handleFileDragMove } = useFileDragAndDrop(files => {
    // 更新文件顺序
    handleFileOrderUpdate({
      type: 'file-reorder',
      updatedFiles: files
    });
  });

  // 添加文件夹状态管理
  const [folders, setFolders] = useState([]);

  // 添加API状态处理
  const [apiStatus, setApiStatus] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  /**
   * 处理文件顺序更新
   * @param {Object} result - 拖放操作结果
   */
  const handleFileOrderUpdate = async (result) => {
    if (result.type === 'file-reorder') {
      try {
        // 使用传入的已更新文件列表
        const updatedFiles = result.updatedFiles;
        
        // 更新前端状态
        setFiles(updatedFiles);
        
        // 提取文件ID数组用于后端更新
        const fileIdOrder = updatedFiles.map(file => file.id);
        
        // 调用API更新顺序
        await noteService.updateFileOrder(fileIdOrder);
      } catch (error) {
        console.error('Error updating file order:', error);
        // 发生错误时重新获取文件列表
        fetchFiles();
      }
    }
  };

  /**
   * 处理文件名点击事件，进入编辑模式
   */
  const handleFileNameClick = () => {
    const currentFile = files.find(f => f.id === activeFileId);
    if (currentFile) {
      setEditingFileName(currentFile.name);
      setIsEditingFileName(true);
    }
  };

  /**
   * 处理文件名更新
   */
  const handleFileNameChange = async () => {
    if (!activeFileId || !editingFileName.trim()) return;
    try {
      await noteService.updateFile(activeFileId, editingFileName);
      setFiles(files.map(file =>
        file.id === activeFileId ? { ...file, name: editingFileName } : file
      ));
      setIsEditingFileName(false);
    } catch (error) {
      console.error('Error updating file name:', error);
    }
  };

  /**
   * 处理文件名编辑时的键盘事件
   * @param {KeyboardEvent} e - 键盘事件对象
   */
  const handleFileNameKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleFileNameChange();
    } else if (e.key === 'Escape') {
      setIsEditingFileName(false);
      setEditingFileName(files.find(f => f.id === activeFileId)?.name || '');
    }
  };

  /**
   * 处理文件删除
   */
  const handleDeleteFile = async () => {
    if (!activeFileId) return;
    try {
      await noteService.deleteFile(activeFileId);
      setDeleteDialogOpen(false);
      setActiveFileId(null);
      fetchFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  // 初始化和清理副作用
  useEffect(() => {
    const initializeApp = async () => {
      // 检查API健康状态
      const isApiHealthy = await noteService.checkApiHealth();
      setApiStatus(isApiHealthy);
      
      if (isApiHealthy) {
        await Promise.all([fetchFiles(), fetchFolders()])
          .catch(error => {
            console.error('Error initializing data:', error);
            setErrorMessage('无法加载数据，请检查网络连接或稍后再试');
          });
      } else {
        setErrorMessage(
          <div>
            <p><strong>无法连接到后端服务</strong>，请检查以下几点：</p>
            <ol>
              <li>确保后端服务已启动（运行 <code>python app.py</code>）</li>
              <li>确保后端服务运行在端口5000上</li>
              <li>检查浏览器控制台是否显示CORS错误</li>
              <li>尝试重新加载页面</li>
            </ol>
            <p>目前正在使用模拟数据展示界面，部分功能可能不可用。</p>
          </div>
        );
        
        // 在后端不可用时，还是尝试加载模拟数据
        try {
          fetchFiles();
          fetchFolders();
        } catch (error) {
          console.error("Error loading mock data:", error);
        }
      }
    };
    
    initializeApp();
    
    const handleMouseUp = () => handleNoteDragEnd(notes);
    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleDragMove, handleNoteDragEnd]);

  // 监听活动文件变化，加载对应的笔记
  useEffect(() => {
    if (activeFileId) {
      fetchNotes(activeFileId);
    } else {
      setNotes([]);
    }
  }, [activeFileId]);

  /**
   * 获取所有文件列表
   */
  const fetchFiles = async () => {
    try {
      const data = await noteService.getAllFiles();
      setFiles(data);
      if (data.length > 0 && !activeFileId) {
        setActiveFileId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  /**
   * 获取所有文件夹
   */
  const fetchFolders = async () => {
    try {
      const data = await noteService.getFolders();
      setFolders(data || []);
    } catch (error) {
      console.error('Error fetching folders:', error);
      // 空数组确保UI不会崩溃
      setFolders([]);
      throw error;
    }
  };

  /**
   * 创建新文件
   */
  const createFile = async () => {
    try {
      await noteService.createFile();
      fetchFiles();
    } catch (error) {
      console.error('Error creating file:', error);
    }
  };

  /**
   * 创建新文件夹
   */
  const createFolder = async (name) => {
    try {
      await noteService.createFolder(name);
      fetchFolders();
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  /**
   * 重命名文件夹
   */
  const renameFolder = async (folderId, newName) => {
    try {
      await noteService.updateFolder(folderId, { name: newName });
      fetchFolders();
    } catch (error) {
      console.error('Error renaming folder:', error);
    }
  };

  /**
   * 删除文件夹
   */
  const deleteFolder = async (folderId) => {
    try {
      await noteService.deleteFolder(folderId);
      fetchFolders();
      // 如果删除成功，则刷新文件列表以更新文件状态
      fetchFiles();
    } catch (error) {
      console.error('Error deleting folder:', error);
    }
  };

  /**
   * 移动文件到文件夹
   */
  const moveFileToFolder = async (fileId, folderId) => {
    try {
      console.log('执行文件移动操作:', { fileId, folderId });
      
      // 确保fileId是字符串类型
      const fileIdStr = String(fileId);
      
      // 规范化folderId处理 - 修复根目录与文件夹判断
      // 1. null/'null'/0/'0'/'' -> null (表示根目录)
      // 2. 数字ID或字符串ID -> 保持原样 (表示文件夹)
      let normalizedFolderId = folderId;
      const rootIndicators = [null, undefined, 'null', '0', 0, ''];
      
      if (rootIndicators.includes(folderId)) {
        normalizedFolderId = null;
        console.log('规范化: folderId值被视为根目录标识', folderId, '→', normalizedFolderId);
      } else if (!isNaN(Number(folderId))) {
        // 如果是有效的数字ID则转换为数字类型
        normalizedFolderId = Number(folderId);
      }
      
      console.log('规范化后的folderId:', normalizedFolderId, '(类型:', typeof normalizedFolderId, ')');
      
      // 记录移动前的文件状态
      const fileBeforeMove = files.find(f => String(f.id) === fileIdStr);
      
      if (!fileBeforeMove) {
        console.error(`找不到ID为${fileIdStr}的文件`);
        return;
      }
      
      console.log('移动前的文件状态:', fileBeforeMove);
      
      // 改进的根目录判断 - 统一处理根目录标识
      const isSourceRoot = rootIndicators.includes(fileBeforeMove.folder_id);
      const isTargetRoot = normalizedFolderId === null;
      
      // 日志记录源和目标状态
      console.log('源文件夹状态:', {
        原始值: fileBeforeMove.folder_id,
        类型: typeof fileBeforeMove.folder_id,
        是否为根目录: isSourceRoot
      });
      
      console.log('目标文件夹状态:', {
        原始值: folderId,
        规范化值: normalizedFolderId,
        类型: typeof normalizedFolderId,
        是否为根目录: isTargetRoot
      });
      
      // 正确判断文件是否已经在目标位置
      const alreadyInPlace = (isSourceRoot && isTargetRoot) || 
                            (!isSourceRoot && !isTargetRoot && String(fileBeforeMove.folder_id) === String(normalizedFolderId));
      
      if (alreadyInPlace) {
        console.log('文件已经在目标位置，跳过移动', {
          当前文件夹: fileBeforeMove.folder_id,
          目标文件夹: normalizedFolderId,
          文件: fileBeforeMove.name
        });
        return;
      }
      
      // 添加更多的调试信息
      console.log('开始移动文件:', { 
        fileId: fileIdStr, 
        原文件夹: fileBeforeMove.folder_id, 
        目标文件夹: normalizedFolderId,
        源是否为根目录: isSourceRoot,
        目标是否为根目录: isTargetRoot
      });
      
      try {
        // 直接使用API调用前记录尝试
        console.log(`尝试调用API: updateFile(${fileIdStr}, { folder_id: ${normalizedFolderId} })`);
        await noteService.updateFile(fileIdStr, { folder_id: normalizedFolderId });
        console.log('API调用成功');
      } catch (apiError) {
        console.error('API调用失败', apiError);
        setErrorMessage('API错误: 移动文件失败，请查看控制台');
        return;
      }
      
      // 立即更新本地状态，确保UI立即反映变化
      setFiles(prevFiles => {
        console.log('更新前的文件列表:', prevFiles.length);
        const updatedFiles = prevFiles.map(file => 
          String(file.id) === fileIdStr ? { ...file, folder_id: normalizedFolderId } : file
        );
        console.log('本地状态更新后的文件:', updatedFiles.find(f => String(f.id) === fileIdStr));
        console.log('更新后的文件列表:', updatedFiles.length);
        return updatedFiles;
      });
      
      // 如果文件被移动到了文件夹中，确保该文件夹是展开的
      if (!isTargetRoot) {
        // 通知Sidebar组件展开对应的文件夹
        console.log('触发展开文件夹事件:', normalizedFolderId);
        setTimeout(() => {
          try {
            document.dispatchEvent(new CustomEvent('expandFolder', { 
              detail: { folderId: normalizedFolderId },
              bubbles: true,
              cancelable: true
            }));
            console.log('文件夹展开事件已触发');
          } catch (eventError) {
            console.error('触发文件夹展开事件失败:', eventError);
          }
        }, 100);
      }
      
      // 然后再从服务器刷新文件列表，确保数据同步
      try {
        console.log('正在从服务器刷新文件列表...');
        const updatedFiles = await noteService.getAllFiles();
        console.log('从服务器获取的更新文件列表:', updatedFiles);
        setFiles(updatedFiles);
      } catch (refreshError) {
        console.error('刷新文件列表失败:', refreshError);
      }
      
      // 添加成功提示
      console.log('文件已成功移动到文件夹');
    } catch (error) {
      console.error('Error moving file to folder:', error);
      setErrorMessage('移动文件失败，请重试');
    }
  };

  /**
   * 获取指定文件的笔记列表
   * @param {string} fileId - 文件ID
   */
  const fetchNotes = async (fileId) => {
    try {
      const data = await noteService.getNotes(fileId);
      setNotes(data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  /**
   * 创建新笔记
   */
  const createNote = async () => {
    if (!activeFileId) return;
    try {
      await noteService.createNote(activeFileId);
      fetchNotes(activeFileId);
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  /**
   * 更新笔记内容
   * @param {string|object} id - 笔记ID或新笔记对象
   * @param {object} content - 笔记内容
   */
  const updateNote = async (id, content, format) => {
    // 处理新笔记创建请求
    if (typeof id === 'object' && id !== null && id.isNew) {
      if (!activeFileId && !id.fileId) return;
      
      // 创建一个临时笔记对象，立即添加到UI中
      const tempNote = {
        id: `temp-${Date.now()}`,
        content: id.content || '',
        format: id.format || 'text',
        isTemp: true
      };
      
      // 立即更新UI，添加临时笔记
      const currentNoteIndex = notes.findIndex(note => note.id === id.afterNoteId);
      if (currentNoteIndex !== -1) {
        const updatedNotes = [...notes];
        updatedNotes.splice(currentNoteIndex + 1, 0, tempNote);
        setNotes(updatedNotes);
      }
      
      try {
        // 创建新笔记，直接传递内容和格式，只需一次API调用
        const response = await noteService.createNote(
          id.fileId || activeFileId, 
          id.afterNoteId, 
          id.content, 
          id.format
        );
        
        // 创建成功后更新笔记列表
        fetchNotes(id.fileId || activeFileId);
        // 返回新笔记ID，以便回调函数使用
        return response.id;
      } catch (error) {
        console.error('Error creating new note:', error);
        // 发生错误时移除临时笔记
        setNotes(notes.filter(note => !note.isTemp));
        throw error;
      }
    }
    
    // 处理常规笔记更新
    const originalNotes = [...notes];
    try {
      const updatedNote = { ...notes.find(note => note.id === id) };
      if (typeof content === 'object' && content !== null) {
        if ('content' in content) updatedNote.content = content.content;
        if ('format' in content) updatedNote.format = content.format;
      } else if (typeof content === 'string') {
        updatedNote.content = content;
        if (format) updatedNote.format = format;
      }
      
      setNotes(notes.map(note =>
        note.id === id ? updatedNote : note
      ));
      
      await noteService.updateNote(id, updatedNote);
    } catch (error) {
      console.error('Error updating note:', error);
      setNotes(originalNotes);
      if (activeFileId) {
        fetchNotes(activeFileId);
      }
      throw error;
    }
  };

  /**
   * 删除笔记
   * @param {string} id - 笔记ID
   */
  const deleteNote = async (id) => {
    try {
      await noteService.deleteNote(id);
      fetchNotes(activeFileId);
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  /**
   * 滚动到指定笔记
   * @param {string} noteId - 笔记ID
   */
  const scrollToNote = (noteId) => {
    const noteElement = document.querySelector(`[data-note-id="${noteId}"]`);
    if (noteElement) {
      noteElement.scrollIntoView({ behavior: 'smooth' });
      setActiveNoteId(noteId);
      noteElement.focus();
    }
  };

  /**
   * 处理笔记列表重新排序
   * @param {Array<Object>} reorderedNotes - 重新排序后的笔记列表
   */
  const handleNoteReorder = async (reorderedNotes) => {
    try {
      // 更新UI状态
      setNotes(reorderedNotes);
      
      // 提取ID列表发送到后端
      const noteIds = reorderedNotes.map(note => note.id);
      await noteService.updateNoteOrder(noteIds);
    } catch (error) {
      console.error('Error updating note order:', error);
      // 出错时重新获取数据
      if (activeFileId) {
        fetchNotes(activeFileId);
      }
    }
  };

  // 处理拖放结束的统一函数
  const handleDragEnd = useCallback((result) => {
    const { source, destination, draggableId, type } = result;
    
    // 记录详细的调试信息以帮助排查问题
    console.log('DragEnd event:', { source, destination, draggableId, type, result });
    
    // 放弃操作
    if (!destination) return;
    
    // 相同位置
    if (source.droppableId === destination.droppableId && 
        source.index === destination.index) return;

    // 笔记项拖放
    if (type === 'NOTE' || type === 'DEFAULT') {
      // 处理笔记拖拽
      handleNoteDragEnd(notes);
      return;
    }
    
    // 文件拖放
    if (type === 'FILE') {
      // 移动到文件夹内
      if (destination.droppableId.startsWith('folder-')) {
        const folderId = destination.droppableId.replace('folder-', '');
        moveFileToFolder(String(draggableId), folderId);
        return;
      }

      // 文件顺序调整
      const reorderedFiles = Array.from(files);
      const movedFile = reorderedFiles.find(file => String(file.id) === String(draggableId));
      
      if (!movedFile) return;
      
      // 从原位置移除
      const filteredFiles = reorderedFiles.filter(file => String(file.id) !== String(draggableId));
      
      // 如果源是文件夹，则将文件从该文件夹中移出
      if (source.droppableId.startsWith('folder-')) {
        movedFile.folder_id = null;  // 从文件夹中移出
      }
      
      // 插入到新位置
      filteredFiles.splice(destination.index, 0, movedFile);
      
      // 更新顺序
      handleFileOrderUpdate({
        type: 'file-reorder',
        sourceIndex: source.index,
        destinationIndex: destination.index,
        sourceDroppableId: source.droppableId,
        destinationDroppableId: destination.droppableId,
        draggableId: draggableId,
        updatedFiles: filteredFiles
      });
    }
  }, [files, notes, moveFileToFolder, handleFileOrderUpdate, handleNoteDragEnd]);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {/* 显示API错误信息 */}
        {errorMessage && (
          <Snackbar 
            open={!!errorMessage} 
            autoHideDuration={null} // 不自动关闭
            onClose={() => setErrorMessage(null)}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            sx={{ 
              maxWidth: '80%', 
              '& .MuiPaper-root': { 
                maxWidth: '100%' 
              }
            }}
          >
            <Alert 
              severity="warning" 
              onClose={() => setErrorMessage(null)}
              sx={{ 
                width: '100%', 
                '& .MuiAlert-message': { 
                  maxWidth: '600px' 
                } 
              }}
            >
              {errorMessage}
            </Alert>
          </Snackbar>
        )}
        
        <Box sx={{ display: 'flex', flexGrow: 1 }}>
          {/* 侧边栏组件 */}
          <Sidebar
            files={files}
            folders={folders}
            activeFileId={activeFileId}
            onFileSelect={setActiveFileId}
            onCreateFile={createFile}
            onCreateFolder={createFolder}
            onRenameFolder={renameFolder}
            onDeleteFolder={deleteFolder}
            onMoveFileToFolder={moveFileToFolder}
            onOrderUpdate={handleFileOrderUpdate}
            draggingFileId={draggingFileId}
            isFileDragging={isFileDragging}
            onFileMouseDown={handleMouseDown}
            onFileMouseUp={handleMouseUp}
            onFileDragEnd={handleFileDragEnd}
            onFileDragMove={handleFileDragMove}
          />
          
          {/* 主要内容区域 */}
          <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - 240px)` } }}>
            <Container maxWidth="xl" sx={{ py: 4 }}>
              {/* 顶部操作栏 */}
              <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {isEditingFileName ? (
                    <TextField
                      value={editingFileName}
                      onChange={(e) => setEditingFileName(e.target.value)}
                      onBlur={handleFileNameChange}
                      onKeyDown={handleFileNameKeyPress}
                      autoFocus
                      size="small"
                      sx={{ width: '300px' }}
                    />
                  ) : (
                    <Typography
                      variant="h4"
                      component="h1"
                      onClick={handleFileNameClick}
                      sx={{ cursor: 'pointer', '&:hover': { opacity: 0.7 } }}
                    >
                      {files.find(f => f.id === activeFileId)?.name || 'Select a File'}
                    </Typography>
                  )}
                  {activeFileId && (
                    <IconButton
                      onClick={() => setDeleteDialogOpen(true)}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
                <IconButton onClick={createNote} color="primary" size="large" disabled={!activeFileId}>
                  <AddIcon />
                </IconButton>
              </Box>

              {/* 笔记列表组件 */}
              <NoteList
                key={`note-list-${activeFileId || 'empty'}`}
                notes={notes}
                activeNoteId={activeNoteId}
                activeFileId={activeFileId}
                onDelete={deleteNote}
                onUpdate={updateNote}
                onFocus={setActiveNoteId}
                onBlur={() => setActiveNoteId(null)}
                onReorder={handleNoteReorder}
              />

              {/* 删除确认对话框 */}
              <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                aria-labelledby="delete-dialog-title"
              >
                <DialogTitle id="delete-dialog-title">确认删除笔记文件？</DialogTitle>
                <DialogContent>
                  删除后将无法恢复该笔记文件及其包含的所有笔记内容。
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setDeleteDialogOpen(false)}>取消</Button>
                  <Button onClick={handleDeleteFile} color="error" variant="contained">
                    删除
                  </Button>
                </DialogActions>
              </Dialog>
            </Container>
          </Box>
        </Box>
      </Box>
    </DragDropContext>
  );
}

export default App;