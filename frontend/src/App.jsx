/**
 * @author Jolly
 * @date 2025-03-01
 * @description 主应用组件，负责管理文件和笔记的状态及操作
 */

import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, IconButton, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import noteService from './services/noteService';
import NoteList from './components/NoteList';
import Sidebar from './components/Sidebar';
import useDragAndDrop from './hooks/useDragAndDrop';

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

  // 拖拽相关状态和处理函数
  const { draggingNoteId, mousePosition, dropIndicatorIndex, handleDragStart, handleDragEnd, handleDragMove } = useDragAndDrop(setNotes);

  /**
   * 处理文件顺序更新
   * @param {Array} updatedFiles - 更新后的文件列表
   */
  const handleFileOrderUpdate = async (updatedFiles) => {
    setFiles(updatedFiles);
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
    fetchFiles();

    const handleMouseUp = () => handleDragEnd(notes);
    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleDragMove, handleDragEnd]);

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

  return (
    <Box sx={{ display: 'flex' }}>
      {/* 侧边栏组件 */}
      <Sidebar
        files={files}
        activeFileId={activeFileId}
        onFileSelect={setActiveFileId}
        onCreateFile={createFile}
        onOrderUpdate={handleFileOrderUpdate}
      />

      {/* 主要内容区域 */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - 240px)` } }}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
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
            notes={notes}
            draggingNoteId={draggingNoteId}
            dropIndicatorIndex={dropIndicatorIndex}
            mousePosition={mousePosition}
            activeNoteId={activeNoteId}
            activeFileId={activeFileId}
            onDelete={deleteNote}
            onDragStart={handleDragStart}
            onUpdate={updateNote}
            onFocus={setActiveNoteId}
            onBlur={() => setActiveNoteId(null)}
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
  );
}

export default App;