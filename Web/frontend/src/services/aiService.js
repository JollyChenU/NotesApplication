/**
 * 文件名: aiService.js
 * 组件: AI服务
 * 描述: 处理与AI相关的API调用，包括内容收集、AI优化、内容应用等功能
 * 功能: AI内容优化、文本收集、内容应用、API通信、错误处理
 * 作者: Jolly Chen
 * 时间: 2024-11-20
 * 版本: 1.3.0
 * 依赖: Fetch API
 * 许可证: Apache-2.0
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// 添加调试信息
console.log('AI Service API Base URL:', API_BASE_URL);

class AIService {
    /**
     * 收集指定文件的所有笔记内容
     * @param {number} fileId - 文件ID
     * @returns {Promise} 包含收集内容的响应
     */
    async collectFileContent(fileId) {
        try {
            const response = await fetch(`${API_BASE_URL}/ai/collect-content`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ file_id: fileId })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('收集文件内容失败:', error);
            throw error;
        }
    }

    /**
     * 对内容进行AI优化
     * @param {number} fileId - 文件ID
     * @param {string} content - 待优化的内容
     * @param {string} type - 优化类型 (general, grammar, structure, clarity)
     * @returns {Promise} 包含优化结果的响应
     */    async optimizeContent(fileId, content, type = 'general') {
        try {
            console.log('AI优化请求:', {
                url: `${API_BASE_URL}/ai/optimize-content`,
                fileId,
                contentLength: content?.length,
                type
            });

            // 创建带超时的请求
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60秒超时

            const response = await fetch(`${API_BASE_URL}/ai/optimize-content`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    file_id: parseInt(fileId, 10),
                    content,
                    type
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            console.log('AI优化响应状态:', response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('AI优化响应错误:', errorText);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const result = await response.json();
            console.log('AI优化成功:', result.success);
            return result;
        } catch (error) {
            console.error('AI优化失败:', error);
            console.error('错误详情:', {
                message: error.message,
                name: error.name,
                stack: error.stack
            });
            throw error;
        }
    }

    /**
     * 应用AI优化结果
     * @param {number} fileId - 文件ID
     * @param {string} optimizedContent - 优化后的内容
     * @param {boolean} backupOriginal - 是否备份原始内容
     * @returns {Promise} 应用结果响应
     */
    async applyOptimization(fileId, optimizedContent, backupOriginal = true) {
        try {
            const response = await fetch(`${API_BASE_URL}/ai/apply-optimization`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    file_id: fileId,
                    optimized_content: optimizedContent,
                    backup_original: backupOriginal
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('应用优化失败:', error);
            throw error;
        }
    }

    /**
     * 检查AI服务健康状态
     * @returns {Promise} 健康状态响应
     */
    async checkHealth() {
        try {
            const response = await fetch(`${API_BASE_URL}/ai/health`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('AI服务健康检查失败:', error);
            throw error;
        }
    }

    /**
     * 完整的AI优化流程
     * @param {number} fileId - 文件ID
     * @param {string} optimizationType - 优化类型
     * @returns {Promise} 完整流程结果
     */
    async performFullOptimization(fileId, optimizationType = 'general') {
        try {
            // 步骤1: 收集文件内容
            console.log('正在收集文件内容...');
            const contentResult = await this.collectFileContent(fileId);
            
            if (!contentResult.success || !contentResult.collected_content) {
                throw new Error('无法收集文件内容');
            }

            // 步骤2: AI优化内容
            console.log('正在进行AI优化...');
            const optimizationResult = await this.optimizeContent(
                fileId, 
                contentResult.collected_content, 
                optimizationType
            );

            if (!optimizationResult.success) {
                throw new Error('AI优化失败');
            }

            return {
                success: true,
                originalContent: contentResult.collected_content,
                optimizedContent: optimizationResult.optimized_content,
                report: optimizationResult.report,
                fileInfo: {
                    id: fileId,
                    name: contentResult.file_name,
                    totalNotes: contentResult.total_notes
                }
            };

        } catch (error) {
            console.error('完整AI优化流程失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 获取临时文件列表
     * @param {number} fileId - 可选的文件ID，如果提供则只返回该文件的临时文件
     * @returns {Promise} 包含临时文件列表的响应
     */    async getTempFiles(fileId = null) {
        try {
            const url = fileId 
                ? `${API_BASE_URL}/ai/temp-files?file_id=${fileId}`
                : `${API_BASE_URL}/ai/temp-files`;
            
            console.log('获取临时文件请求:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            console.log('获取临时文件响应状态:', response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('获取临时文件响应错误:', errorText);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const result = await response.json();
            console.log('获取临时文件成功:', result);
            return result;
        } catch (error) {
            console.error('获取临时文件列表失败:', error);
            throw error;
        }
    }

    /**
     * 清理临时文件
     * @param {number} fileId - 可选的文件ID，如果提供则只清理该文件的临时文件
     * @param {number} daysOld - 清理多少天前的文件，默认7天
     * @returns {Promise} 包含清理结果的响应
     */
    async cleanupTempFiles(fileId = null, daysOld = 7) {
        try {
            const requestBody = { days_old: daysOld };
            if (fileId) {
                requestBody.file_id = fileId;
            }

            const response = await fetch(`${API_BASE_URL}/ai/cleanup-temp-files`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('清理临时文件失败:', error);
            throw error;
        }
    }

    /**
     * 获取临时文件内容
     * @param {string} filename - 临时文件名
     * @returns {Promise} 包含文件内容的响应
     */
    async getTempFileContent(filename) {
        try {
            const response = await fetch(`${API_BASE_URL}/ai/temp-file/${filename}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('获取临时文件内容失败:', error);
            throw error;
        }
    }
}

// 创建单例实例
const aiService = new AIService();

export default aiService;