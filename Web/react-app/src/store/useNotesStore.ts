import { create } from 'zustand';

interface NoteBlock {
  id?: number;
  type: 'text' | 'heading' | 'list' | 'code' | 'mermaid';
  content: string;
  position: number;
}

interface Note {
  id: number;
  title: string;
  content: string;
  folder_id?: number;
  folder_name?: string;
  created_at: string;
  updated_at: string;
  blocks?: NoteBlock[];
}

interface Folder {
  id: number;
  name: string;
  parent_id?: number;
  created_at: string;
  updated_at: string;
  children?: Folder[];
}

interface NotesState {
  // 数据状态
  notes: Note[];
  folders: Folder[];
  currentNote: Note | null;
  selectedFolderId: number | null;
  
  // UI状态
  isLoading: boolean;
  error: string | null;
  
  // 笔记操作
  fetchNotes: (folderId?: number) => Promise<void>;
  fetchNote: (id: number) => Promise<void>;
  createNote: (title: string, folderId?: number) => Promise<Note | null>;
  updateNote: (id: number, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: number) => Promise<void>;
  updateNoteBlocks: (noteId: number, blocks: NoteBlock[]) => Promise<void>;
  
  // 文件夹操作
  fetchFolders: () => Promise<void>;
  createFolder: (name: string, parentId?: number) => Promise<Folder | null>;
  updateFolder: (id: number, name: string) => Promise<void>;
  deleteFolder: (id: number) => Promise<void>;
  
  // UI操作
  setCurrentNote: (note: Note | null) => void;
  setSelectedFolder: (folderId: number | null) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

const API_BASE = '/api';

export const useNotesStore = create<NotesState>((set, get) => ({
  // 初始状态
  notes: [],
  folders: [],
  currentNote: null,
  selectedFolderId: null,
  isLoading: false,
  error: null,
  
  // 笔记操作
  fetchNotes: async (folderId) => {
    set({ isLoading: true, error: null });
    try {
      const url = folderId ? `${API_BASE}/notes?folder_id=${folderId}` : `${API_BASE}/notes`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        set({ notes: data.data, isLoading: false });
      } else {
        set({ error: data.error, isLoading: false });
      }
    } catch (error) {
      set({ error: 'Failed to fetch notes', isLoading: false });
    }
  },
  
  fetchNote: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/notes/${id}`);
      const data = await response.json();
      
      if (data.success) {
        set({ currentNote: data.data, isLoading: false });
      } else {
        set({ error: data.error, isLoading: false });
      }
    } catch (error) {
      set({ error: 'Failed to fetch note', isLoading: false });
    }
  },
  
  createNote: async (title, folderId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, folder_id: folderId }),
      });
      const data = await response.json();
      
      if (data.success) {
        const { notes } = get();
        set({ 
          notes: [data.data, ...notes], 
          currentNote: data.data,
          isLoading: false 
        });
        return data.data;
      } else {
        set({ error: data.error, isLoading: false });
        return null;
      }
    } catch (error) {
      set({ error: 'Failed to create note', isLoading: false });
      return null;
    }
  },
  
  updateNote: async (id, updates) => {
    set({ error: null });
    try {
      const response = await fetch(`${API_BASE}/notes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      const data = await response.json();
      
      if (data.success) {
        const { notes, currentNote } = get();
        const updatedNotes = notes.map(note => 
          note.id === id ? { ...note, ...data.data } : note
        );
        set({ 
          notes: updatedNotes,
          currentNote: currentNote?.id === id ? { ...currentNote, ...data.data } : currentNote
        });
      } else {
        set({ error: data.error });
      }
    } catch (error) {
      set({ error: 'Failed to update note' });
    }
  },
  
  deleteNote: async (id) => {
    set({ error: null });
    try {
      const response = await fetch(`${API_BASE}/notes/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      
      if (data.success) {
        const { notes, currentNote } = get();
        const filteredNotes = notes.filter(note => note.id !== id);
        set({ 
          notes: filteredNotes,
          currentNote: currentNote?.id === id ? null : currentNote
        });
      } else {
        set({ error: data.error });
      }
    } catch (error) {
      set({ error: 'Failed to delete note' });
    }
  },
  
  updateNoteBlocks: async (noteId, blocks) => {
    set({ error: null });
    try {
      const response = await fetch(`${API_BASE}/notes/${noteId}/blocks`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ blocks }),
      });
      const data = await response.json();
      
      if (data.success) {
        const { currentNote } = get();
        if (currentNote?.id === noteId) {
          set({ 
            currentNote: { 
              ...currentNote, 
              blocks: data.data 
            }
          });
        }
      } else {
        set({ error: data.error });
      }
    } catch (error) {
      set({ error: 'Failed to update note blocks' });
    }
  },
  
  // 文件夹操作
  fetchFolders: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/folders`);
      const data = await response.json();
      
      if (data.success) {
        set({ folders: data.data, isLoading: false });
      } else {
        set({ error: data.error, isLoading: false });
      }
    } catch (error) {
      set({ error: 'Failed to fetch folders', isLoading: false });
    }
  },
  
  createFolder: async (name, parentId) => {
    set({ error: null });
    try {
      const response = await fetch(`${API_BASE}/folders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, parent_id: parentId }),
      });
      const data = await response.json();
      
      if (data.success) {
        // 重新获取文件夹列表以更新树形结构
        await get().fetchFolders();
        return data.data;
      } else {
        set({ error: data.error });
        return null;
      }
    } catch (error) {
      set({ error: 'Failed to create folder' });
      return null;
    }
  },
  
  updateFolder: async (id, name) => {
    set({ error: null });
    try {
      const response = await fetch(`${API_BASE}/folders/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });
      const data = await response.json();
      
      if (data.success) {
        // 重新获取文件夹列表以更新树形结构
        await get().fetchFolders();
      } else {
        set({ error: data.error });
      }
    } catch (error) {
      set({ error: 'Failed to update folder' });
    }
  },
  
  deleteFolder: async (id) => {
    set({ error: null });
    try {
      const response = await fetch(`${API_BASE}/folders/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      
      if (data.success) {
        // 重新获取文件夹列表以更新树形结构
        await get().fetchFolders();
        // 如果删除的是当前选中的文件夹，清除选择
        const { selectedFolderId } = get();
        if (selectedFolderId === id) {
          set({ selectedFolderId: null });
        }
      } else {
        set({ error: data.error });
      }
    } catch (error) {
      set({ error: 'Failed to delete folder' });
    }
  },
  
  // UI操作
  setCurrentNote: (note) => set({ currentNote: note }),
  setSelectedFolder: (folderId) => set({ selectedFolderId: folderId }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));