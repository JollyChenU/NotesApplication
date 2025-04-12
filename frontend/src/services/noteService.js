import axios from 'axios';

// 修正API_URL配置并添加调试信息
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
console.log('Using API URL:', API_URL);

// 添加axios拦截器以便更好地跟踪API请求
axios.interceptors.request.use(config => {
  console.log(`🚀 Request: ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

axios.interceptors.response.use(
  response => {
    console.log(`✅ Response: ${response.status} from ${response.config.url}`);
    return response;
  },
  error => {
    console.error(`❌ Error ${error.response?.status || 'unknown'} from ${error.config?.url || 'unknown URL'}:`, 
      error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// 添加模拟数据，便于后端不可用时使用
const mockData = {
  folders: [
    { id: "mock-folder-1", name: "示例文件夹", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: "mock-folder-2", name: "文档", created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  ],
  files: [
    { id: "mock-file-1", name: "欢迎笔记", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), folder_id: null },
    { id: "mock-file-2", name: "项目计划", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), folder_id: "mock-folder-1" }
  ],
  notes: [
    { id: "mock-note-1", content: "这是一个演示笔记，后端服务似乎未启动。\n\n请检查以下几点：\n1. 后端服务是否已启动\n2. 端口是否为5000\n3. CORS设置是否正确", format: "text" }
  ]
};

/**
 * 确保ID是字符串类型
 * @param {any} id - 输入的ID
 * @returns {string} - 字符串形式的ID
 */
const ensureStringId = (id) => String(id);

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
      
      // 如果在开发环境下且后端不可用，使用模拟数据
      if (!import.meta.env.PROD) {
        console.warn('Using mock files data due to API error');
        return mockData.files;
      }
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

  /**
   * 将文件移动到指定文件夹或根目录的专用方法
   * @param {string} fileId - 文件ID
   * @param {string|null} targetFolderId - 目标文件夹ID，null表示移动到根目录
   * @returns {Promise<Object>} - 更新后的文件数据
   */
  updateFileFolder: async (fileId, targetFolderId) => {
    try {
      console.log(`【API】开始移动文件 [${fileId}] 到${targetFolderId ? `文件夹 [${targetFolderId}]` : '根目录'}`);
      console.time(`moveFile_${fileId}_to_${targetFolderId || 'root'}`);
      
      // 构建请求数据
      const requestData = { folder_id: targetFolderId };
      
      console.log('【API】发送文件移动请求:', {
        url: `${API_URL}/files/${fileId}`,
        method: 'PUT',
        data: requestData,
        fileId: fileId,
        targetFolderId: targetFolderId || 'root'
      });
      
      // 发送请求
      const response = await axios.put(`${API_URL}/files/${fileId}`, requestData);
      
      console.log('【API】文件移动响应:', {
        status: response.status,
        dataReceived: !!response.data,
        updatedFile: response.data,
        oldFolderId: response.data.old_folder_id || '未知',
        newFolderId: response.data.folder_id || 'root'
      });
      
      console.timeEnd(`moveFile_${fileId}_to_${targetFolderId || 'root'}`);
      return response.data;
    } catch (error) {
      console.error('【API错误】文件移动失败:', {
        fileId,
        targetFolderId: targetFolderId || 'root',
        错误类型: error.name,
        错误信息: error.message,
        请求URL: error.config?.url,
        请求方法: error.config?.method,
        响应状态: error.response?.status,
        响应数据: error.response?.data
      });
      
      // 记录详细的错误堆栈
      console.error('【API错误堆栈】:', error.stack);
      throw error;
    }
  },

  updateFile: async (fileId, fileData) => {
    try {
      console.log('【API】开始更新文件:', {fileId, fileData});
      
      // 检查是否为移动文件操作
      if (typeof fileData === 'object' && ('folder_id' in fileData || 'folderId' in fileData)) {
        const targetFolderId = fileData.folder_id !== undefined ? fileData.folder_id : fileData.folderId;
        
        console.log('【API】检测到文件移动操作，改用专用方法', {
          fileId,
          targetFolderId: targetFolderId,
          请求数据: fileData
        });
        
        // 如果是移动文件操作，使用专用的updateFileFolder方法
        return noteService.updateFileFolder(fileId, targetFolderId);
      }
      
      // 常规文件更新操作
      const response = await axios.put(`${API_URL}/files/${fileId}`, 
        typeof fileData === 'object' ? fileData : { name: fileData });
      
      console.log('【API】文件更新成功:', {
        fileId,
        responseStatus: response.status,
        responseData: response.data
      });
      
      return response.data;
    } catch (error) {
      console.error('【API错误】更新文件失败:', {
        fileId, 
        fileData,
        错误信息: error.message,
        响应数据: error.response?.data
      });
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
   * @param {Array<string|number>} fileIds - 文件ID列表，按新的顺序排列
   * @returns {Promise<Object>}
   */
  updateFileOrder: async (fileIds) => {
    try {
      // 确保所有ID为字符串格式
      const stringFileIds = fileIds.map(id => String(id));
      
      // 发送请求到后端
      const response = await axios.put(`${API_URL}/files/reorder`, { fileIds: stringFileIds });
      return response.data;
    } catch (error) {
      console.error('Error updating file order:', error);
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
      
      // 如果在开发环境下且后端不可用，使用模拟数据
      if (!import.meta.env.PROD && fileId === "mock-file-1") {
        console.warn('Using mock notes data due to API error');
        return mockData.notes;
      }
      throw error;
    }
  },

  createNote: async (fileId, afterNoteId = null, content = '', format = 'text') => {
    try {
      const response = await axios.post(`${API_URL}/files/${fileId}/notes`, {
        content: content,
        format: format,
        after_note_id: afterNoteId
      });
      return response.data;
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  },

  updateNote: async (noteId, noteData) => {
    try {
      const response = await axios.put(`${API_URL}/notes/${noteId}`, noteData);
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
  },

  // 文件夹相关API
  getFolders: async () => {
    try {
      const response = await axios.get(`${API_URL}/folders`);
      return response.data;
    } catch (error) {
      console.error('Error fetching folders:', error);
      
      // 如果在开发环境下且后端不可用，使用模拟数据
      if (!import.meta.env.PROD) {
        console.warn('Using mock folders data due to API error');
        return mockData.folders;
      }
      throw error;
    }
  },

  createFolder: async (name) => {
    try {
      const response = await axios.post(`${API_URL}/folders`, { name });
      return response.data;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  },

  updateFolder: async (folderId, folderData) => {
    try {
      const response = await axios.put(`${API_URL}/folders/${folderId}`, folderData);
      return response.data;
    } catch (error) {
      console.error('Error updating folder:', error);
      throw error;
    }
  },

  deleteFolder: async (folderId) => {
    try {
      const response = await axios.delete(`${API_URL}/folders/${folderId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting folder:', error);
      throw error;
    }
  },

  // 添加API健康检查方法
  checkApiHealth: async () => {
    try {
      const response = await axios.get(`${API_URL}/health`, { 
        timeout: 5000,
        // 添加重试逻辑
        retry: 2,
        retryDelay: 1000
      });
      return response.data?.status === 'ok';
    } catch (error) {
      console.error('API health check failed:', error);
      return false;
    }
  },

  // 确保返回的数据中所有ID都是字符串类型
  processApiResponse: (data) => {
    if (Array.isArray(data)) {
      return data.map(item => ({
        ...item,
        id: ensureStringId(item.id),
        file_id: item.file_id ? ensureStringId(item.file_id) : undefined,
        folder_id: item.folder_id ? ensureStringId(item.folder_id) : undefined
      }));
    } else if (data && typeof data === 'object') {
      return {
        ...data,
        id: data.id ? ensureStringId(data.id) : undefined,
        file_id: data.file_id ? ensureStringId(data.file_id) : undefined,
        folder_id: data.folder_id ? ensureStringId(data.folder_id) : undefined
      };
    }
    return data;
  }
};

// 封装请求方法以处理ID格式
const originalGetAllFiles = noteService.getAllFiles;
noteService.getAllFiles = async () => {
  const data = await originalGetAllFiles();
  return Array.isArray(data) ? data.map(file => ({
    ...file,
    id: String(file.id),
    folder_id: file.folder_id ? String(file.folder_id) : null
  })) : [];
};

// 封装获取笔记方法以处理ID格式
const originalGetNotes = noteService.getNotes;
noteService.getNotes = async (fileId) => {
  const data = await originalGetNotes(fileId);
  return Array.isArray(data) ? data.map(note => ({
    ...note,
    id: String(note.id),
    file_id: String(note.file_id)
  })) : [];

};

// 封装获取文件夹方法以处理ID格式
const originalGetFolders = noteService.getFolders;
noteService.getFolders = async () => {
  const data = await originalGetFolders();
  return Array.isArray(data) ? data.map(folder => ({
    ...folder,
    id: String(folder.id)
  })) : [];
};

export default noteService;