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
  const [files, setFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);
  const [notes, setNotes] = useState([]);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [isEditingFileName, setIsEditingFileName] = useState(false);
  const [editingFileName, setEditingFileName] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { draggingNoteId, mousePosition, dropIndicatorIndex, handleDragStart, handleDragEnd, handleDragMove } = useDragAndDrop(setNotes);
  const handleFileNameClick = () => {
    const currentFile = files.find(f => f.id === activeFileId);
    if (currentFile) {
      setEditingFileName(currentFile.name);
      setIsEditingFileName(true);
    }
  };
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
  const handleFileNameKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleFileNameChange();
    } else if (e.key === 'Escape') {
      setIsEditingFileName(false);
      setEditingFileName(files.find(f => f.id === activeFileId)?.name || '');
    }
  };
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

  useEffect(() => {
    if (activeFileId) {
      fetchNotes(activeFileId);
    } else {
      setNotes([]);
    }
  }, [activeFileId]);

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

  const createFile = async () => {
    try {
      await noteService.createFile();
      fetchFiles();
    } catch (error) {
      console.error('Error creating file:', error);
    }
  };

  const fetchNotes = async (fileId) => {
    try {
      const data = await noteService.getNotes(fileId);
      setNotes(data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const createNote = async () => {
    if (!activeFileId) return;
    try {
      await noteService.createNote(activeFileId);
      fetchNotes(activeFileId);
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const updateNote = async (id, content) => {
    try {
      setNotes(notes.map(note => 
        note.id === id ? { ...note, content } : note
      ));
      await noteService.updateNote(id, content);
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const deleteNote = async (id) => {
    try {
      await noteService.deleteNote(id);
      fetchNotes(activeFileId);
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };
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
      <Sidebar
        files={files}
        activeFileId={activeFileId}
        onFileSelect={setActiveFileId}
        onCreateFile={createFile}
      />

      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - 240px)` } }}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
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

          <NoteList
            notes={notes}
            draggingNoteId={draggingNoteId}
            dropIndicatorIndex={dropIndicatorIndex}
            mousePosition={mousePosition}
            activeNoteId={activeNoteId}
            onDelete={deleteNote}
            onDragStart={handleDragStart}
            onUpdate={updateNote}
            onFocus={setActiveNoteId}
            onBlur={() => setActiveNoteId(null)}
          />

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