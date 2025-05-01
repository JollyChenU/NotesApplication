/**
 * @description 自定义 Hook，用于管理文件状态和操作
 * @license Apache-2.0
 */
import { useState, useCallback } from 'react';
import noteService from '../services/noteService';

export function useFiles(initialFiles = [], setErrorMessage) {
  const [files, setFiles] = useState(initialFiles);
  const [activeFileId, setActiveFileId] = useState(null);
  const [isEditingFileName, setIsEditingFileName] = useState(false);
  const [editingFileName, setEditingFileName] = useState('');

  const fetchFiles = useCallback(async () => {
    try {
      const data = await noteService.getAllFiles();
      setFiles(data || []);
      // 如果当前没有激活文件，且获取到了文件，则默认激活第一个
      if (data && data.length > 0 && !activeFileId) {
         // 保持原有逻辑或根据需要调整
         // setActiveFileId(data[0].id);
      } else if (data && data.length === 0) {
        setActiveFileId(null); // 如果没有文件了，取消激活
      }
      return data || []; // 返回获取到的数据
    } catch (error) {
      console.error('Error fetching files:', error);
      setErrorMessage('获取文件列表失败。');
      setFiles([]); // 出错时设置为空数组
      setActiveFileId(null);
      return []; // 返回空数组
    }
  }, [activeFileId, setErrorMessage]); // 依赖 activeFileId 以便在没有文件时重置

  const createFile = useCallback(async () => {
    try {
      const newFile = await noteService.createFile();
      await fetchFiles(); // 创建后刷新列表
      if (newFile && newFile.id) {
        setActiveFileId(newFile.id); // 激活新创建的文件
      }
    } catch (error) {
      console.error('Error creating file:', error);
      setErrorMessage('创建文件失败。');
    }
  }, [fetchFiles, setErrorMessage]);

  const handleFileNameClick = useCallback(() => {
    const currentFile = files.find(f => f.id === activeFileId);
    if (currentFile) {
      setEditingFileName(currentFile.name);
      setIsEditingFileName(true);
    }
  }, [files, activeFileId]);

  const handleFileNameChange = useCallback(async () => {
    if (!activeFileId || !editingFileName.trim()) {
      setIsEditingFileName(false); // 取消编辑状态
      return;
    }
    const originalFile = files.find(file => file.id === activeFileId);
    const trimmedName = editingFileName.trim();

    // 如果名字没变，则不发送请求
    if (originalFile && originalFile.name === trimmedName) {
      setIsEditingFileName(false);
      return;
    }

    // 乐观更新 UI
    setFiles(prevFiles => prevFiles.map(file =>
      file.id === activeFileId ? { ...file, name: trimmedName } : file
    ));
    setIsEditingFileName(false);

    try {
      await noteService.updateFile(activeFileId, trimmedName);
      // 可以在这里添加成功提示或无需操作，因为UI已更新
    } catch (error) {
      console.error('Error updating file name:', error);
      setErrorMessage('更新文件名失败。');
      // 回滚 UI
      if (originalFile) {
        setFiles(prevFiles => prevFiles.map(file =>
          file.id === activeFileId ? originalFile : file
        ));
      }
      // 可能需要重新获取文件列表以确保一致性
      // fetchFiles();
    }
  }, [activeFileId, editingFileName, files, setErrorMessage]);

  const handleFileNameBlur = useCallback(() => {
    // 失去焦点时也尝试保存
    handleFileNameChange();
  }, [handleFileNameChange]);


  const handleFileNameKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      handleFileNameChange();
    } else if (e.key === 'Escape') {
      setIsEditingFileName(false);
      // 恢复原始名称 (可选)
      const currentFile = files.find(f => f.id === activeFileId);
      if (currentFile) {
        setEditingFileName(currentFile.name);
      }
    }
  }, [handleFileNameChange, files, activeFileId]);

  const deleteFile = useCallback(async (fileIdToDelete) => {
    if (!fileIdToDelete) return false;
    try {
      await noteService.deleteFile(fileIdToDelete);
      // 删除后刷新列表
      const remainingFiles = await fetchFiles();
      // 如果删除的是当前激活的文件，则激活列表中的第一个文件（如果存在）
      if (activeFileId === fileIdToDelete) {
        setActiveFileId(remainingFiles.length > 0 ? remainingFiles[0].id : null);
      }
      return true; // 表示删除成功
    } catch (error) {
      console.error('Error deleting file:', error);
      setErrorMessage('删除文件失败。');
      return false; // 表示删除失败
    }
  }, [fetchFiles, activeFileId, setErrorMessage]);

  const updateFileOrder = useCallback(async (fileIdOrder) => {
    // 乐观更新 UI
    const orderedFilesMap = new Map(fileIdOrder.map((id, index) => [String(id), index]));
    const reorderedFiles = [...files].sort((a, b) => {
        const orderA = orderedFilesMap.get(String(a.id)) ?? Infinity;
        const orderB = orderedFilesMap.get(String(b.id)) ?? Infinity;
        return orderA - orderB;
    });
    setFiles(reorderedFiles);

    try {
      await noteService.updateFileOrder(fileIdOrder);
    } catch (error) {
      console.error('Error updating file order:', error);
      setErrorMessage('更新文件顺序失败。');
      // 失败时回滚或重新获取
      fetchFiles();
    }
  }, [files, fetchFiles, setErrorMessage]);


  const moveFileToFolder = useCallback(async (fileId, folderId) => {
    const fileIdStr = String(fileId);
    let normalizedFolderId = folderId;
    const rootIndicators = [null, undefined, 'null', '0', 0, ''];

    if (rootIndicators.includes(folderId)) {
      normalizedFolderId = null; // 统一根目录标识
    } else {
      normalizedFolderId = String(folderId); // 确保文件夹ID是字符串
    }

    const fileBeforeMove = files.find(f => String(f.id) === fileIdStr);
    if (!fileBeforeMove) {
      console.error('File not found for moving:', fileIdStr);
      setErrorMessage('未找到要移动的文件。');
      return;
    }

    const isSourceRoot = rootIndicators.includes(fileBeforeMove.folder_id);
    const isTargetRoot = normalizedFolderId === null;
    const alreadyInPlace = (isSourceRoot && isTargetRoot) ||
                           (!isSourceRoot && !isTargetRoot && String(fileBeforeMove.folder_id) === normalizedFolderId);

    if (alreadyInPlace) {
      console.log('File already in the target folder.');
      return; // 文件已在目标位置
    }

    // 乐观更新 UI
    setFiles(prevFiles => prevFiles.map(f =>
      String(f.id) === fileIdStr ? { ...f, folder_id: normalizedFolderId } : f
    ));

    // 触发文件夹展开事件 (如果移入文件夹)
    if (!isTargetRoot && normalizedFolderId) {
        const event = new CustomEvent('expandFolder', { detail: { folderId: normalizedFolderId } });
        document.dispatchEvent(event);
    }


    try {
      await noteService.moveFileToFolder(fileIdStr, normalizedFolderId);
      // 移动成功，可以添加提示或延迟刷新
      // setTimeout(fetchFiles, 500); // 延迟刷新以等待后端处理完毕
    } catch (apiError) {
      console.error('Error moving file via API:', apiError);
      setErrorMessage('移动文件失败，请重试。');
      // 回滚 UI
      setFiles(prevFiles => prevFiles.map(f =>
        String(f.id) === fileIdStr ? fileBeforeMove : f
      ));
      // 可能需要重新获取文件列表
      // fetchFiles();
    }
  }, [files, fetchFiles, setErrorMessage]);


  return {
    files,
    setFiles, // 允许外部直接设置（例如拖拽后）
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
    handleFileNameBlur, // 添加 blur 处理
  };
}
