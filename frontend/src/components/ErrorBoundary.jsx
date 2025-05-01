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
