/**
 * 文件名: dnd-utils.jsx
 * 组件: 拖拽工具组件（已重构 - 向后兼容导出）
 * 描述: 该文件已重构为模块化结构，此文件保留用于向后兼容
 * 功能: 重新导出所有拖拽相关组件和工具
 * 作者: Jolly Chen
 * 时间: 2024-11-20
 * 版本: 2.0.0 (已重构)
 * 依赖: @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, React
 * 许可证: Apache-2.0
 * 
 * 注意：此文件已重构为模块化结构，位于 ./dnd/ 目录下
 * 新的模块结构：
 * - dnd-logger.js: 日志系统
 * - dnd-sortable.jsx: 可排序项组件
 * - dnd-note-context.jsx: 笔记拖拽上下文
 * - dnd-file-context.jsx: 文件拖拽上下文
 * - dnd-helpers.js: 拖拽辅助函数
 * - index.js: 模块导出入口
 */

// 重新导出所有功能以保持向后兼容性
export {
  Logger,
  LOG_LEVEL,
  CURRENT_LOG_LEVEL,
  createSortableItem,
  NoteDndContext,
  FileDndContext,
  throttle,
  clearAllFolderHighlights,
  highlightFolderElement,
  setupFolderElements,
  cleanupDragState
} from './dnd/index.js';