import express, { Request, Response } from 'express';
import { dbGet, dbAll, dbRun } from '../models/database.js';

const router = express.Router();

// 获取所有文件夹（树形结构）
router.get('/', async (req: Request, res: Response) => {
  try {
    const folders = await dbAll(`
      SELECT id, name, parent_id, created_at, updated_at 
      FROM folders 
      ORDER BY parent_id, name
    `);
    
    // 构建树形结构
    const folderMap = new Map();
    const rootFolders: any[] = [];
    
    // 初始化所有文件夹
    folders.forEach(folder => {
      folderMap.set(folder.id, { ...folder, children: [] });
    });
    
    // 构建父子关系
    folders.forEach(folder => {
      if (folder.parent_id) {
        const parent = folderMap.get(folder.parent_id);
        if (parent) {
          parent.children.push(folderMap.get(folder.id));
        }
      } else {
        rootFolders.push(folderMap.get(folder.id));
      }
    });
    
    res.json({
      success: true,
      data: rootFolders
    });
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch folders'
    });
  }
});

// 创建文件夹
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, parent_id } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Folder name is required'
      });
    }
    
    // 检查同级目录下是否已存在同名文件夹
    const existingFolder = await dbGet(
      'SELECT id FROM folders WHERE name = ? AND parent_id = ?',
      [name.trim(), parent_id || null]
    );
    
    if (existingFolder) {
      return res.status(400).json({
        success: false,
        error: 'Folder with this name already exists in the same directory'
      });
    }
    
    const result = await dbRun(
      'INSERT INTO folders (name, parent_id) VALUES (?, ?)',
      [name.trim(), parent_id || null]
    );
    
    const newFolder = await dbGet(
      'SELECT * FROM folders WHERE id = ?',
      [result.lastID]
    );
    
    res.status(201).json({
      success: true,
      data: newFolder
    });
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create folder'
    });
  }
});

// 更新文件夹
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Folder name is required'
      });
    }
    
    // 检查文件夹是否存在
    const folder = await dbGet('SELECT * FROM folders WHERE id = ?', [id]);
    if (!folder) {
      return res.status(404).json({
        success: false,
        error: 'Folder not found'
      });
    }
    
    // 检查同级目录下是否已存在同名文件夹
    const existingFolder = await dbGet(
      'SELECT id FROM folders WHERE name = ? AND parent_id = ? AND id != ?',
      [name.trim(), folder.parent_id, id]
    );
    
    if (existingFolder) {
      return res.status(400).json({
        success: false,
        error: 'Folder with this name already exists in the same directory'
      });
    }
    
    await dbRun(
      'UPDATE folders SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name.trim(), id]
    );
    
    const updatedFolder = await dbGet('SELECT * FROM folders WHERE id = ?', [id]);
    
    res.json({
      success: true,
      data: updatedFolder
    });
  } catch (error) {
    console.error('Error updating folder:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update folder'
    });
  }
});

// 删除文件夹
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // 检查文件夹是否存在
    const folder = await dbGet('SELECT * FROM folders WHERE id = ?', [id]);
    if (!folder) {
      return res.status(404).json({
        success: false,
        error: 'Folder not found'
      });
    }
    
    // 检查是否有子文件夹
    const subFolders = await dbAll('SELECT id FROM folders WHERE parent_id = ?', [id]);
    if (subFolders.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete folder that contains subfolders'
      });
    }
    
    // 检查是否有笔记
    const notes = await dbAll('SELECT id FROM notes WHERE folder_id = ?', [id]);
    if (notes.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete folder that contains notes'
      });
    }
    
    await dbRun('DELETE FROM folders WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Folder deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete folder'
    });
  }
});

export default router;