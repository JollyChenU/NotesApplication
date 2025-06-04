/**
 * 文件名: main.jsx
 * 组件: 应用程序入口
 * 描述: React应用程序的主入口文件，负责挂载根组件
 * 功能:
 *   - 创建React根节点
 *   - 渲染主应用组件
 *   - 配置React严格模式
 * 
 * 作者: Jolly
 * 创建时间: 2025-06-04
 * 最后修改: 2025-06-04
 * 修改人: Jolly
 * 版本: 1.0.0
 * 
 * 依赖:
 *   - react: React核心库
 *   - react-dom/client: React DOM客户端
 *   - ./App.jsx: 主应用组件
 * 
 * 许可证: Apache-2.0
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);