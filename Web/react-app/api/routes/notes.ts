import express, { Request, Response } from 'express';
import { dbGet, dbAll, dbRun } from '../models/database.js';

const router = express.Router();

// 获取所有笔记或指定文件夹下的笔记
router.get('/', async (req: Request, res: Response) => {
  try {
    const { folder_id } = req.query;
    
    let query = `
      SELECT n.*, f.name as folder_name 
      FROM notes n 
      LEFT JOIN folders f ON n.folder_id = f.id
    `;
    let params: any[] = [];
    
    if (folder_id) {
      query += ' WHERE n.folder_id = ?';
      params.push(folder_id);
    }
    
    query += ' ORDER BY n.updated_at DESC';
    
    const notes = await dbAll(query, params);
    
    res.json({
      success: true,
      data: notes
    });
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notes'
    });
  }
});

// 获取单个笔记详情（包含块数据）
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const note = await dbGet(
      `SELECT n.*, f.name as folder_name 
       FROM notes n 
       LEFT JOIN folders f ON n.folder_id = f.id 
       WHERE n.id = ?`,
      [id]
    );
    
    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }
    
    // 获取笔记块
    const blocks = await dbAll(
      'SELECT * FROM note_blocks WHERE note_id = ? ORDER BY position',
      [id]
    );
    
    res.json({
      success: true,
      data: {
        ...note,
        blocks
      }
    });
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch note'
    });
  }
});

// 创建笔记
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, content = '', folder_id } = req.body;
    
    if (!title || title.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Note title is required'
      });
    }
    
    // 如果指定了文件夹，检查文件夹是否存在
    if (folder_id) {
      const folder = await dbGet('SELECT id FROM folders WHERE id = ?', [folder_id]);
      if (!folder) {
        return res.status(400).json({
          success: false,
          error: 'Specified folder does not exist'
        });
      }
    }
    
    const result = await dbRun(
      'INSERT INTO notes (title, content, folder_id) VALUES (?, ?, ?)',
      [title.trim(), content, folder_id || null]
    );
    
    // 创建初始文本块
    if (content) {
      await dbRun(
        'INSERT INTO note_blocks (note_id, type, content, position) VALUES (?, ?, ?, ?)',
        [result.lastID, 'text', content, 0]
      );
    }
    
    const newNote = await dbGet(
      `SELECT n.*, f.name as folder_name 
       FROM notes n 
       LEFT JOIN folders f ON n.folder_id = f.id 
       WHERE n.id = ?`,
      [result.lastID]
    );
    
    res.status(201).json({
      success: true,
      data: newNote
    });
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create note'
    });
  }
});

// 更新笔记
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, folder_id } = req.body;
    
    // 检查笔记是否存在
    const note = await dbGet('SELECT * FROM notes WHERE id = ?', [id]);
    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }
    
    // 如果指定了文件夹，检查文件夹是否存在
    if (folder_id) {
      const folder = await dbGet('SELECT id FROM folders WHERE id = ?', [folder_id]);
      if (!folder) {
        return res.status(400).json({
          success: false,
          error: 'Specified folder does not exist'
        });
      }
    }
    
    const updates: string[] = [];
    const params: any[] = [];
    
    if (title !== undefined) {
      if (!title || title.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Note title cannot be empty'
        });
      }
      updates.push('title = ?');
      params.push(title.trim());
    }
    
    if (content !== undefined) {
      updates.push('content = ?');
      params.push(content);
    }
    
    if (folder_id !== undefined) {
      updates.push('folder_id = ?');
      params.push(folder_id || null);
    }
    
    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);
      
      await dbRun(
        `UPDATE notes SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
    }
    
    const updatedNote = await dbGet(
      `SELECT n.*, f.name as folder_name 
       FROM notes n 
       LEFT JOIN folders f ON n.folder_id = f.id 
       WHERE n.id = ?`,
      [id]
    );
    
    res.json({
      success: true,
      data: updatedNote
    });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update note'
    });
  }
});

// 删除笔记
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // 检查笔记是否存在
    const note = await dbGet('SELECT * FROM notes WHERE id = ?', [id]);
    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }
    
    // 删除笔记（会自动删除相关的块）
    await dbRun('DELETE FROM notes WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete note'
    });
  }
});

// 更新笔记块
router.put('/:id/blocks', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { blocks } = req.body;
    
    // 检查笔记是否存在
    const note = await dbGet('SELECT * FROM notes WHERE id = ?', [id]);
    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }
    
    if (!Array.isArray(blocks)) {
      return res.status(400).json({
        success: false,
        error: 'Blocks must be an array'
      });
    }
    
    // 删除现有块
    await dbRun('DELETE FROM note_blocks WHERE note_id = ?', [id]);
    
    // 插入新块
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      await dbRun(
        'INSERT INTO note_blocks (note_id, type, content, position) VALUES (?, ?, ?, ?)',
        [id, block.type || 'text', block.content || '', i]
      );
    }
    
    // 更新笔记的更新时间
    await dbRun(
      'UPDATE notes SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );
    
    // 获取更新后的块
    const updatedBlocks = await dbAll(
      'SELECT * FROM note_blocks WHERE note_id = ? ORDER BY position',
      [id]
    );
    
    res.json({
      success: true,
      data: updatedBlocks
    });
  } catch (error) {
    console.error('Error updating note blocks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update note blocks'
    });
  }
});

export default router;