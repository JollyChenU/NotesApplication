import axios from 'axios';

// 后端API的基础URL
const API_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * 笔记服务类，封装所有与笔记相关的API请求
 */
const noteService = {
  // 文件相关API
  getAllFiles: async () => {
    try {
      const response = await axios.get(`${API_URL}/files`);
      return response.data;
    } catch (error) {
      console.error('Error fetching files:', error);
      throw error;
    }
  },

  createFile: async (name = 'New File') => {
    try {
      const response = await axios.post(`${API_URL}/files`, { name });
      return response.data;
    } catch (error) {
      console.error('Error creating file:', error);
      throw error;
    }
  },

  updateFile: async (fileId, name) => {
    try {
      const response = await axios.put(`${API_URL}/files/${fileId}`, { name });
      return response.data;
    } catch (error) {
      console.error('Error updating file:', error);
      throw error;
    }
  },

  deleteFile: async (fileId) => {
    try {
      const response = await axios.delete(`${API_URL}/files/${fileId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  },

  /**
   * 更新文件顺序
   * @param {Array<number>} fileIds - 文件ID列表，按新的顺序排列
   * @returns {Promise<void>}
   */
  updateFileOrder: async (fileIds) => {
    try {
      await axios.put(`${API_URL}/files/reorder`, { fileIds });
      // 不再获取最新的文件列表，由前端直接更新UI
      return { success: true };
    } catch (error) {
      console.error('Error updating file order:', error);
      // 如果更新失败，返回错误信息，让前端可以处理回滚
      throw error;
    }
  },
  // 笔记相关API
  getNotes: async (fileId) => {
    try {
      const response = await axios.get(`${API_URL}/files/${fileId}/notes`);
      return response.data;
    } catch (error) {
      console.error('Error fetching notes:', error);
      throw error;
    }
  },

  createNote: async (fileId) => {
    try {
      const response = await axios.post(`${API_URL}/files/${fileId}/notes`, { content: '# 点击左边编辑icon开始编辑...' });
      return response.data;
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  },

  updateNote: async (noteId, content) => {
    try {
      const response = await axios.put(`${API_URL}/notes/${noteId}`, { content });
      return response.data;
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  },

  deleteNote: async (noteId) => {
    try {
      const response = await axios.delete(`${API_URL}/notes/${noteId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  },

  /**
   * 更新笔记顺序
   * @param {Array<number>} noteIds - 笔记ID列表，按新的顺序排列
   * @returns {Promise<void>}
   */
  updateNoteOrder: async (noteIds) => {
    try {
      await axios.put(`${API_URL}/notes/reorder`, { noteIds });
    } catch (error) {
      console.error('Error updating note order:', error);
      throw error;
    }
  }
};

export default noteService;