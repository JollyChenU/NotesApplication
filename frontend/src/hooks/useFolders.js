/**
 * @description 自定义 Hook，用于管理文件夹状态和操作
 * @license Apache-2.0
 */
import { useState, useCallback } from 'react';
import noteService from '../services/noteService';

export function useFolders(setErrorMessage) {
  const [folders, setFolders] = useState([]);

  const fetchFolders = useCallback(async () => {
    try {
      const data = await noteService.getFolders();
      setFolders(data || []);
      return data || []; // 返回获取到的数据
    } catch (error) {
      console.error('Error fetching folders:', error);
      setErrorMessage('获取文件夹列表失败。');
      setFolders([]); // 出错时设置为空数组
      return []; // 返回空数组
    }
  }, [setErrorMessage]);

  const createFolder = useCallback(async (name) => {
    try {
      await noteService.createFolder(name);
      await fetchFolders(); // 创建后刷新列表
    } catch (error) {
      console.error('Error creating folder:', error);
      setErrorMessage('创建文件夹失败。');
    }
  }, [fetchFolders, setErrorMessage]);

  const renameFolder = useCallback(async (folderId, newName) => {
    try {
      await noteService.updateFolder(folderId, { name: newName });
      await fetchFolders(); // 重命名后刷新列表
    } catch (error) {
      console.error('Error renaming folder:', error);
      setErrorMessage('重命名文件夹失败。');
    }
  }, [fetchFolders, setErrorMessage]);

  const deleteFolder = useCallback(async (folderId) => {
    try {
      await noteService.deleteFolder(folderId);
      await fetchFolders(); // 删除后刷新列表
      // 注意：删除文件夹后可能需要刷新文件列表，这将在 useFiles Hook 中处理
      return true; // 表示删除成功
    } catch (error) {
      console.error('Error deleting folder:', error);
      setErrorMessage('删除文件夹失败。');
      return false; // 表示删除失败
    }
  }, [fetchFolders, setErrorMessage]);

  return {
    folders,
    fetchFolders,
    createFolder,
    renameFolder,
    deleteFolder,
  };
}
