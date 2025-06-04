/**
 * 文件名: useApiStatus.js
 * 组件: API状态管理Hook
 * 描述: 自定义Hook，用于管理API健康状态检查、错误消息处理和连接状态监控
 * 功能: API健康检查、错误状态管理、连接监控、状态更新
 * 作者: Jolly Chen
 * 时间: 2024-11-20
 * 版本: 1.1.0
 * 依赖: React hooks, noteService
 * 许可证: Apache-2.0
 */
import { useState, useEffect, useCallback } from 'react';
import noteService from '../services/noteService';

export function useApiStatus() {
  const [apiStatus, setApiStatus] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // 添加加载状态

  const checkApiHealth = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const isHealthy = await noteService.checkApiHealth();
      setApiStatus(isHealthy);
      if (!isHealthy) {
        setErrorMessage('API 服务连接失败，请检查后端服务是否运行正常。');
      }
      return isHealthy; // 返回健康状态
    } catch (error) {
      console.error('Error checking API health:', error);
      setApiStatus(false);
      setErrorMessage(`API 健康检查失败: ${error.message || '未知错误'}`);
      return false; // 返回健康状态
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 初始加载时检查 API 健康状态
  useEffect(() => {
    checkApiHealth();
  }, [checkApiHealth]);

  const clearErrorMessage = useCallback(() => {
    setErrorMessage(null);
  }, []);

  return {
    apiStatus,
    errorMessage,
    isLoading,
    checkApiHealth,
    setErrorMessage, // 允许外部设置错误
    clearErrorMessage,
  };
}
