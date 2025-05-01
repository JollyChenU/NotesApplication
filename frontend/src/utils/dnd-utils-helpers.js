/*
 * Copyright 2025 Jolly Chen
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @description 拖拽相关辅助函数
 */

// 日志级别常量
export const LOG_LEVEL = {
  DEBUG: 0,   // 详细调试日志
  INFO: 1,    // 普通信息日志
  WARN: 2,    // 警告信息
  ERROR: 3,   // 错误信息
  NONE: 4     // 禁用所有日志
};

// 当前日志级别设置
export const CURRENT_LOG_LEVEL = LOG_LEVEL.WARN; // 仅显示警告和错误信息

// 性能测量对象
const PERF_METRICS = {};

// 日志记录工具
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

/**
 * 节流函数 - 限制函数执行频率
 * @param {Function} func 要节流的函数
 * @param {number} limit 时间间隔（毫秒）
 * @returns {Function} 节流后的函数
 */
export function throttle(func, limit) {
  let inThrottle;
  let lastResult;
  return function(...args) {
    if (!inThrottle) {
      lastResult = func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
    return lastResult;
  };
}

/**
 * 从文档中获取文件夹元素
 * @returns {Array} 文件夹元素数组
 */
export function getFolderElements() {
  const folderElements = document.querySelectorAll(
    '[id^="folder-"], [data-droppable-id^="folder-"], [id*="folder-content"], [class*="folder"]'
  );
  
  return Array.from(folderElements);
}

/**
 * 设置文件夹数据属性
 * @param {HTMLElement} el 元素
 */
export function setupFolderElement(el) {
  // 设置文件夹ID属性
  if (el.id && el.id.startsWith('folder-')) {
    el.dataset.droppableId = el.id;
    // 从ID中提取文件夹ID
    const folderId = el.id.replace('folder-', '');
    el.setAttribute('data-folder-id', folderId);
    el.setAttribute('data-is-folder', 'true');
  }
  
  // 确保文件夹内容区域也有正确的属性
  if (el.id && el.id.includes('folder-content-')) {
    const folderId = el.id.replace('folder-content-', '');
    el.setAttribute('data-droppable-id', `folder-${folderId}`);
    el.setAttribute('data-folder-id', folderId);
    el.setAttribute('data-is-folder', 'true');
  }
  
  // 确保data-folder-id属性被正确设置
  if (el.getAttribute('data-droppable-id') && !el.getAttribute('data-folder-id')) {
    const folderId = el.getAttribute('data-droppable-id').replace('folder-', '');
    el.setAttribute('data-folder-id', folderId);
    el.setAttribute('data-is-folder', 'true');
  }
  
  // 为所有文件夹相关元素添加视觉指示和事件处理
  if (el.getAttribute('data-folder-id') || (el.id && (el.id.startsWith('folder-') || el.id.includes('folder-content')))) {
    // 添加一个微妙的视觉指示，表明这是可拖放区域
    el.style.transition = 'all 0.2s ease-in-out';
    
    // 标记文件夹元素
    el.setAttribute('data-is-folder', 'true');
  }
}

/**
 * 清除所有文件夹元素的高亮状态
 */
export function clearAllFolderHighlights() {
  const allFolderElements = document.querySelectorAll('[data-is-folder="true"], [data-folder-id]');
  allFolderElements.forEach(el => {
    el.style.backgroundColor = '';
    el.style.boxShadow = '';
    el.style.border = '';
  });
  Logger.debug('清除所有文件夹高亮');
}

/**
 * 高亮指定的文件夹元素
 * @param {string} folderId 文件夹ID
 * @param {boolean} isHeader 是否仅高亮文件夹头部
 */
export function highlightFolderElement(folderId, isHeader = false) {
  if (!folderId) return;
  
  // 清除所有高亮
  clearAllFolderHighlights();
  
  // 获取文件夹头部元素和内容区域元素
  const folderHeader = document.querySelector(`#folder-${folderId}`);
  const folderContent = document.querySelector(`#folder-content-${folderId}`);
  
  // 判断文件夹是否展开
  const isFolderExpanded = folderContent && 
    window.getComputedStyle(folderContent).display !== 'none';
  
  // 如果只需要高亮头部或文件夹处于折叠状态
  if (isHeader || !isFolderExpanded) {
    if (folderHeader) {
      folderHeader.style.backgroundColor = 'rgba(63, 81, 181, 0.15)';
      folderHeader.style.boxShadow = 'inset 0 0 8px rgba(63, 81, 181, 0.3)';
      folderHeader.style.border = '1px dashed rgba(63, 81, 181, 0.7)';
    }
  } 
  // 文件夹展开状态，高亮整个文件夹区域（包括头部和内容）
  else {
    if (folderHeader) {
      folderHeader.style.backgroundColor = 'rgba(63, 81, 181, 0.1)';
      folderHeader.style.border = '1px dashed rgba(63, 81, 181, 0.7)';
    }
    
    if (folderContent) {
      folderContent.style.backgroundColor = 'rgba(63, 81, 181, 0.08)';
      folderContent.style.border = '1px dashed rgba(63, 81, 181, 0.4)';
      folderContent.style.borderTop = 'none'; // 避免与头部边框重叠
    }
  }
  
  Logger.debug(`高亮文件夹: ${folderId}, 是否仅头部: ${isHeader}, 是否展开: ${isFolderExpanded}`);
}

/**
 * 清理拖拽相关状态
 */
export function cleanupDragState() {
  Logger.info('执行拖拽状态全面清理');
  
  // 清除所有文件夹高亮
  clearAllFolderHighlights();
  
  // 清除所有data-dragging属性
  document.querySelectorAll('[data-dragging="true"]').forEach(el => {
    el.setAttribute('data-dragging', 'false');
  });
  
  // 重置所有sortable-file-item样式
  document.querySelectorAll('.sortable-file-item').forEach(el => {
    el.style.opacity = '';
    el.style.border = '';
    el.style.zIndex = '';
    el.style.pointerEvents = '';
    el.style.position = 'relative';
    el.style.transform = '';
    el.style.boxShadow = '';
    el.classList.remove('is-dragging');
  });
  
  // 修复MUI组件
  document.querySelectorAll('.MuiListItem-root').forEach(el => {
    el.style.pointerEvents = '';
    el.style.cursor = '';
  });
  
  // 确保所有元素都可以点击
  document.querySelectorAll('.MuiListItem-button').forEach(el => {
    el.style.pointerEvents = 'auto';
  });
  
  // 重置任何可能残留的拖拽容器
  const dragOverlay = document.querySelector('[data-dnd-overlay="true"]');
  if (dragOverlay) {
    dragOverlay.remove();
  }
  
  // 强制释放文档上的所有鼠标事件处理器
  document.body.style.userSelect = '';
  document.body.style.webkitUserSelect = '';
  document.body.style.cursor = '';
  
  Logger.debug('拖拽状态清理完成');
}

/**
 * 检查是否为根目录指示器
 * @param {any} value - 要检查的值
 * @returns {boolean} - 是否为根目录指示器
 */
export const isRootIndicator = (value) => {
  const rootIndicators = [null, undefined, 'null', '0', 0, ''];
  return rootIndicators.includes(value);
};