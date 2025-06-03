/**
 * @description 自定义 Hook，用于管理当前活动文件的笔记状态和操作
 * @license Apache-2.0
 */
import { useState, useEffect, useCallback } from 'react';
import noteService from '../services/noteService';

export function useNotes(activeFileId, setErrorMessage) {
  const [notes, setNotes] = useState([]);
  const [activeNoteId, setActiveNoteId] = useState(null);

  // 获取笔记列表
  const fetchNotes = useCallback(async () => {
    if (!activeFileId) {
      setNotes([]);
      return;
    }
    try {
      const fetchedNotes = await noteService.getNotes(activeFileId);
      setNotes(fetchedNotes || []);
    } catch (error) {
      setErrorMessage('获取笔记失败: ' + (error.response?.data?.message || error.message));
      setNotes([]);
    }
  }, [activeFileId, setErrorMessage]);

  // 初始加载笔记
  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);
  // 创建新笔记 (确保返回 Promise<string | null>)
  const createNote = useCallback(async (afterNoteId, content = '', format = 'text') => {
    console.log('🔥 createNote函数被调用:', { activeFileId, afterNoteId, content, format });
    
    if (!activeFileId) {
      console.error('❌ 无法创建笔记：未选择文件');
      setErrorMessage('无法创建笔记：未选择文件');
      return null;
    }
    try {      console.log('📤 正在调用noteService.createNote...');
      const newNote = await noteService.createNote(activeFileId, afterNoteId, content, format);
      console.log('✅ 成功创建笔记:', newNote);
      // Update local state immediately
      setNotes(prevNotes => {
        const insertIndex = prevNotes.findIndex(note => note.id === afterNoteId);
        const newNotes = [...prevNotes];
        if (insertIndex !== -1) {
          newNotes.splice(insertIndex + 1, 0, newNote);
        } else {
          newNotes.push(newNote); // Fallback: add to end if afterNoteId not found
        }
        console.log('📝 更新本地笔记状态:', newNotes);
        return newNotes;
      });
      console.log('🎯 返回新笔记ID:', newNote.id);
      return newNote.id; // Return the new note ID
    } catch (error) {
      console.error('❌ 创建笔记失败:', error);
      setErrorMessage('创建笔记失败: ' + (error.response?.data?.message || error.message));
      return null;
    }
  }, [activeFileId, setErrorMessage]);

  // 更新笔记 (确保返回 Promise<void>)
  const updateNote = useCallback(async (noteId, contentData) => {
    try {
      await noteService.updateNote(noteId, contentData);
      // Update local state
      setNotes(prevNotes =>
        prevNotes.map(note =>
          note.id === noteId ? { ...note, ...contentData } : note
        )
      );
    } catch (error) {
      setErrorMessage('更新笔记失败: ' + (error.response?.data?.message || error.message));
    }
  }, [setErrorMessage]);

  // 删除笔记
  const deleteNote = useCallback(async (noteId) => {
    try {
      await noteService.deleteNote(noteId);
      setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
    } catch (error) {
      setErrorMessage('删除笔记失败: ' + (error.response?.data?.message || error.message));
    }
  }, [setErrorMessage]);

  // 更新笔记顺序
  const updateNoteOrder = useCallback(async (orderedIds) => {
    try {
      await noteService.updateNoteOrder(orderedIds);
      // Optimistically update local state based on orderedIds
      setNotes(prevNotes => {
        const noteMap = new Map(prevNotes.map(note => [note.id, note]));
        return orderedIds.map(id => noteMap.get(id)).filter(Boolean); // Filter out potential undefined if IDs mismatch
      });
    } catch (error) {
      setErrorMessage('更新笔记顺序失败: ' + (error.response?.data?.message || error.message));
      // Consider refetching notes on failure to ensure consistency
      fetchNotes();
    }
  }, [setErrorMessage, fetchNotes]);

  // 处理 TipTapEditor 的 onUpdate 回调，区分创建和更新 (Refactored)
  const handleNoteUpdateFromEditor = useCallback(async (idOrNewData, contentData) => {
    // Check if the first argument is the object for creating a new note (check for afterNoteId)
    if (typeof idOrNewData === 'object' && idOrNewData !== null && idOrNewData.afterNoteId !== undefined) {
      const { afterNoteId, content, format } = idOrNewData;
      // Call createNote and return the Promise<string | null>
      return await createNote(afterNoteId, content, format);
    }
    // Handle regular note update
    else if ((typeof idOrNewData === 'string' || typeof idOrNewData === 'number') && contentData) {
      // Call updateNote (which is async)
      await updateNote(idOrNewData, contentData);
      // Return a resolved Promise for consistency if needed
      return Promise.resolve();
    }
    // Log error and reject if arguments are invalid
    console.error("Invalid arguments for handleNoteUpdateFromEditor:", idOrNewData, contentData);
    return Promise.reject("Invalid arguments for handleNoteUpdateFromEditor");
  }, [createNote, updateNote]); // Dependencies: createNote and updateNote

  return {
    notes,
    setNotes,
    activeNoteId,
    setActiveNoteId,
    fetchNotes,
    createNote, // Expose original createNote for the + button
    // updateNote, // Expose original updateNote if needed elsewhere
    deleteNote,
    updateNoteOrder,
    handleNoteUpdateFromEditor, // Provide the combined handler
  };
}
