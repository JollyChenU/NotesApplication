/**
 * 文件名: ErrorBoundary.jsx
 * 组件: ErrorBoundary - 错误边界组件
 * 描述: React错误边界组件，用于捕获和处理子组件中的JavaScript错误
 * 功能:
 *   - 捕获子组件的渲染错误
 *   - 显示友好的错误提示页面
 *   - 防止整个应用崩溃
 *   - 错误日志记录
 * 
 * 作者: Jolly
 * 创建时间: 2025-06-04
 * 最后修改: 2025-06-04
 * 修改人: Jolly
 * 版本: 1.0.0
 * 
 * 依赖:
 *   - react: React核心库
 * 
 * 许可证: Apache-2.0
 */
import React from 'react';
import { Box, Typography, Alert, AlertTitle } from '@mui/material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // 你同样可以将错误日志上报给服务器
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
    // Optionally send error report to an analytics service
    // logErrorToMyService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // 你可以自定义降级后的 UI 并渲染
      return (
        <Box sx={{ p: 2 }}>
          <Alert severity="error">
            <AlertTitle>渲染出错</AlertTitle>
            <Typography variant="body2">
              加载笔记内容时遇到问题。请尝试刷新页面或选择其他笔记。
            </Typography>
            {/* Optionally display error details in development */}
            {import.meta.env.DEV && this.state.error && (
              <Typography variant="caption" component="pre" sx={{ mt: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {this.state.error.toString()}
                <br />
                {this.state.errorInfo?.componentStack}
              </Typography>
            )}
          </Alert>
        </Box>
      );
    }

    // 正常渲染子组件
    return this.props.children;
  }
}

export default ErrorBoundary;
