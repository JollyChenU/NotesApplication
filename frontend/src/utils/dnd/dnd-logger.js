/**
 * 文件名: dnd-logger.js
 * 组件: 拖拽日志系统
 * 描述: 提供结构化的日志记录功能，支持性能监控
 * 作者: Jolly Chen
 * 时间: 2024-11-20
 * 版本: 1.2.0
 * 许可证: Apache-2.0
 */

// 日志级别控制
export const LOG_LEVEL = {
  DEBUG: 0,   // 详细调试日志
  INFO: 1,    // 普通信息日志
  WARN: 2,    // 警告信息
  ERROR: 3,   // 错误信息
  NONE: 4     // 禁用所有日志
};

// 设置当前日志级别
export const CURRENT_LOG_LEVEL = LOG_LEVEL.INFO; // 显示信息级别及以上日志

// 记录性能指标
const PERF_METRICS = {};

// 结构化日志函数
export const Logger = {
  debug: (message, data) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVEL.DEBUG) {
      console.debug(`[DND|Debug] ${message}`, data || '');
    }
  },
  
  info: (message, data) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVEL.INFO) {
      console.log(`[DND|Info] ${message}`, data || '');
    }
  },
  
  warn: (message, data) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVEL.WARN) {
      console.warn(`[DND|Warn] ${message}`, data || '');
    }
  },
  
  error: (message, error) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVEL.ERROR) {
      console.error(`[DND|Error] ${message}`, error || '');
    }
  },
  
  // 开始性能测量
  startPerf: (label) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVEL.DEBUG) {
      PERF_METRICS[label] = performance.now();
    }
  },
  
  // 结束性能测量并输出结果
  endPerf: (label) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVEL.DEBUG && PERF_METRICS[label]) {
      const duration = performance.now() - PERF_METRICS[label];
      console.debug(`[DND|Perf] ${label}: ${duration.toFixed(2)}ms`);
      delete PERF_METRICS[label];
    }
  }
};
