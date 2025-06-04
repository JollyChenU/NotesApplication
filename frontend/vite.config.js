/**
 * 文件名: vite.config.js
 * 组件: Vite配置文件
 * 描述: Vite构建工具的配置文件，用于前端开发和构建
 * 功能:
 *   - 开发服务器配置
 *   - 构建输出配置
 *   - 插件配置
 *   - 代理配置
 * 
 * 作者: Jolly
 * 创建时间: 2025-06-04
 * 最后修改: 2025-06-04
 * 修改人: Jolly
 * 版本: 1.0.0
 * 
 * 依赖:
 *   - vite: 构建工具
 *   - @vitejs/plugin-react: React插件
 * 
 * 许可证: Apache-2.0
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // 监听所有网络接口，允许外网访问
    port: 5173,      // 指定端口为5173
    strictPort: true, // 如果端口被占用则直接失败，而不是尝试其他端口
    // 如果需要代理后端 API，可以在这里配置
    // proxy: {
    //   '/api': {
    //     target: process.env.VITE_API_URL || 'http://localhost:5000', // 动态后端地址
    //     changeOrigin: true,
    //     rewrite: (path) => path.replace(/^\/api/, '/api')
    //   }
    // }
  }
})