import express, { Request, Response } from 'express';
import { dbGet, dbAll, dbRun } from '../models/database.js';

const router = express.Router();

// 获取AI配置
router.get('/config', async (req: Request, res: Response) => {
  try {
    const config = await dbGet(
      'SELECT * FROM ai_config WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1'
    );
    
    res.json({
      success: true,
      data: config || {
        model_path: null,
        model_type: 'rwkv',
        gpu_enabled: true,
        is_active: false
      }
    });
  } catch (error) {
    console.error('Error fetching AI config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch AI configuration'
    });
  }
});

// 更新AI配置
router.post('/config', async (req: Request, res: Response) => {
  try {
    const { model_path, model_type = 'rwkv', gpu_enabled = true, is_active = false } = req.body;
    
    // 如果设置为活跃，先将其他配置设为非活跃
    if (is_active) {
      await dbRun('UPDATE ai_config SET is_active = 0');
    }
    
    const result = await dbRun(
      'INSERT INTO ai_config (model_path, model_type, gpu_enabled, is_active) VALUES (?, ?, ?, ?)',
      [model_path, model_type, gpu_enabled ? 1 : 0, is_active ? 1 : 0]
    );
    
    const newConfig = await dbGet(
      'SELECT * FROM ai_config WHERE id = ?',
      [result.lastID]
    );
    
    res.status(201).json({
      success: true,
      data: newConfig
    });
  } catch (error) {
    console.error('Error updating AI config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update AI configuration'
    });
  }
});

// 切换AI开关
router.post('/toggle', async (req: Request, res: Response) => {
  try {
    const { enabled } = req.body;
    
    if (enabled) {
      // 检查是否有可用的模型配置
      const config = await dbGet(
        'SELECT * FROM ai_config WHERE model_path IS NOT NULL ORDER BY created_at DESC LIMIT 1'
      );
      
      if (!config) {
        return res.status(400).json({
          success: false,
          error: 'No AI model configured. Please configure a model first.'
        });
      }
      
      // 将最新的配置设为活跃
      await dbRun('UPDATE ai_config SET is_active = 0');
      await dbRun('UPDATE ai_config SET is_active = 1 WHERE id = ?', [config.id]);
    } else {
      // 禁用所有AI配置
      await dbRun('UPDATE ai_config SET is_active = 0');
    }
    
    res.json({
      success: true,
      message: `AI ${enabled ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    console.error('Error toggling AI:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle AI'
    });
  }
});

// AI文本生成（预留接口）
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { prompt, context = '', max_tokens = 500 } = req.body;
    
    if (!prompt || prompt.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }
    
    // 检查AI是否已启用
    const config = await dbGet(
      'SELECT * FROM ai_config WHERE is_active = 1 LIMIT 1'
    );
    
    if (!config) {
      return res.status(400).json({
        success: false,
        error: 'AI is not enabled or configured'
      });
    }
    
    // TODO: 集成RWKV模型
    // 这里是预留接口，后续需要集成实际的RWKV模型调用
    
    // 模拟响应（开发阶段）
    const mockResponse = {
      generated_text: `[AI Response] Based on your prompt: "${prompt}", here would be the AI-generated content. This is a placeholder response until RWKV model is integrated.`,
      model_info: {
        model_type: config.model_type,
        gpu_enabled: config.gpu_enabled,
        model_path: config.model_path
      },
      tokens_used: Math.floor(Math.random() * max_tokens)
    };
    
    res.json({
      success: true,
      data: mockResponse
    });
  } catch (error) {
    console.error('Error generating AI text:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate AI text'
    });
  }
});

// AI摘要生成（预留接口）
router.post('/summarize', async (req: Request, res: Response) => {
  try {
    const { text, max_length = 200 } = req.body;
    
    if (!text || text.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Text to summarize is required'
      });
    }
    
    // 检查AI是否已启用
    const config = await dbGet(
      'SELECT * FROM ai_config WHERE is_active = 1 LIMIT 1'
    );
    
    if (!config) {
      return res.status(400).json({
        success: false,
        error: 'AI is not enabled or configured'
      });
    }
    
    // TODO: 集成RWKV模型进行摘要生成
    // 这里是预留接口，后续需要集成实际的RWKV模型调用
    
    // 模拟响应（开发阶段）
    const mockSummary = `[AI Summary] This is a generated summary of the provided text. The original text was ${text.length} characters long, and this summary captures the key points. This is a placeholder until RWKV model integration.`;
    
    res.json({
      success: true,
      data: {
        summary: mockSummary,
        original_length: text.length,
        summary_length: mockSummary.length,
        compression_ratio: (mockSummary.length / text.length * 100).toFixed(1) + '%'
      }
    });
  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate summary'
    });
  }
});

// 获取模型状态（预留接口）
router.get('/status', async (req: Request, res: Response) => {
  try {
    const config = await dbGet(
      'SELECT * FROM ai_config WHERE is_active = 1 LIMIT 1'
    );
    
    // TODO: 检查实际模型状态
    // 这里是预留接口，后续需要检查RWKV模型的实际运行状态
    
    const status = {
      is_enabled: !!config,
      model_loaded: false, // 待实现
      gpu_available: true, // 待检测
      model_info: config ? {
        model_type: config.model_type,
        model_path: config.model_path,
        gpu_enabled: config.gpu_enabled
      } : null,
      performance: {
        memory_usage: '0 MB', // 待实现
        inference_time: '0 ms' // 待实现
      }
    };
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error fetching AI status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch AI status'
    });
  }
});

export default router;