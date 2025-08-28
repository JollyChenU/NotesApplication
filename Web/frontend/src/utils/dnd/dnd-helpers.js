/**
 * 文件名: dnd-helpers.js
 * 组件: 拖拽辅助函数
 * 描述: 提供拖拽操作的辅助函数和工具
 * 作者: Jolly Chen
 * 时间: 2024-11-20
 * 版本: 1.2.0
 * 许可证: Apache-2.0
 */

import { Logger } from './dnd-logger.js';

/**
 * 节流函数：限制函数执行频率
 * @param {Function} func - 要执行的函数
 * @param {number} limit - 限制时间间隔（毫秒）
 * @returns {Function} 节流后的函数
 */
export const throttle = (func, limit) => {
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
};

/**
 * 清除所有文件夹元素的高亮状态
 */
export const clearAllFolderHighlights = () => {
  const allFolderElements = document.querySelectorAll('[data-is-folder="true"], [data-folder-id]');
  Logger.debug(`清除 ${allFolderElements.length} 个文件夹元素的高亮状态`);
  
  allFolderElements.forEach(el => {
    el.style.backgroundColor = '';
    el.style.boxShadow = '';
    el.style.border = '';
    el.style.borderRadius = '';
    el.style.borderTop = '';
    el.style.borderBottom = '';
    el.style.minHeight = '';
  });
  
  Logger.debug('已清除所有文件夹高亮');
};

/**
 * 高亮指定的文件夹元素
 * @param {string} folderId - 文件夹ID
 * @param {boolean} isHeader - 是否仅高亮头部
 */
export const highlightFolderElement = (folderId, isHeader = false) => {
  if (!folderId) {
    Logger.warn('尝试高亮空的文件夹ID');
    return;
  }
  
  Logger.debug(`开始高亮文件夹: ${folderId}, 仅头部: ${isHeader}`);
  
  // 清除所有高亮
  clearAllFolderHighlights();
  
  // 获取文件夹头部元素和内容区域元素
  const folderHeader = document.querySelector(`#folder-${folderId}`);
  const folderContent = document.querySelector(`#folder-content-${folderId}`);
  
  if (!folderHeader) {
    Logger.warn(`未找到文件夹头部元素: #folder-${folderId}`);
  }
  if (!folderContent) {
    Logger.debug(`未找到文件夹内容元素: #folder-content-${folderId} （可能是正常的，如果文件夹未展开）`);
  }
  
  // 判断文件夹是否展开
  const isFolderExpanded = folderContent && 
    window.getComputedStyle(folderContent).display !== 'none';
  
  Logger.debug(`文件夹 ${folderId} 展开状态: ${isFolderExpanded}`);
  
  // 如果只需要高亮头部或文件夹处于折叠状态
  if (isHeader || !isFolderExpanded) {
    if (folderHeader) {
      folderHeader.style.backgroundColor = 'rgba(33, 150, 243, 0.15)';
      folderHeader.style.boxShadow = '0 0 0 2px rgba(33, 150, 243, 0.5)';
      folderHeader.style.border = '2px solid rgba(33, 150, 243, 0.8)';
      folderHeader.style.borderRadius = '4px';
      Logger.debug(`已高亮文件夹头部: ${folderId}`);
    }
  } 
  // 文件夹展开状态，高亮整个文件夹区域（包括头部和内容）
  else {
    if (folderHeader) {
      folderHeader.style.backgroundColor = 'rgba(33, 150, 243, 0.12)';
      folderHeader.style.border = '2px solid rgba(33, 150, 243, 0.8)';
      folderHeader.style.borderRadius = '4px 4px 0 0';
      folderHeader.style.borderBottom = '1px solid rgba(33, 150, 243, 0.4)';
      Logger.debug(`已高亮文件夹头部（展开模式）: ${folderId}`);
    }
    
    if (folderContent) {
      folderContent.style.backgroundColor = 'rgba(33, 150, 243, 0.08)';
      folderContent.style.border = '2px solid rgba(33, 150, 243, 0.6)';
      folderContent.style.borderTop = 'none'; // 避免与头部边框重叠
      folderContent.style.borderRadius = '0 0 4px 4px';
      folderContent.style.minHeight = '40px'; // 确保有足够的拖放区域
      Logger.debug(`已高亮文件夹内容区域: ${folderId}`);
    }
  }
  
  Logger.info(`文件夹高亮完成: ${folderId}, 仅头部: ${isHeader}, 展开状态: ${isFolderExpanded}`);
};

/**
 * 设置文件夹元素识别属性
 */
export const setupFolderElements = () => {
  // 增强文件夹元素识别 - 使用更广泛的选择器
  const folderElements = document.querySelectorAll(
    '[id^="folder-"], [data-droppable-id^="folder-"], [id*="folder-content"], [class*="folder"]'
  );
  
  Logger.debug(`识别到 ${folderElements.length} 个潜在文件夹元素`);
  
  folderElements.forEach(el => {
    // 确保dataset属性被正确设置
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
    
    // 为所有文件夹相关元素添加视觉指示
    if (el.getAttribute('data-folder-id') || (el.id && (el.id.startsWith('folder-') || el.id.includes('folder-content')))) {
      // 添加一个微妙的视觉指示，表明这是可拖放区域
      el.style.transition = 'all 0.2s ease-in-out';
      
      // 标记文件夹元素
      el.setAttribute('data-is-folder', 'true');
    }
  });
  
  return Array.from(folderElements);
};

/**
 * 清理所有拖拽相关的样式和状态
 */
export const cleanupDragState = () => {
  Logger.info('执行拖拽状态全面清理');
  
  // 清除所有文件夹高亮
  clearAllFolderHighlights();
  
  // 清除所有data-dragging属性
  document.querySelectorAll('[data-dragging="true"]').forEach(el => {
    el.setAttribute('data-dragging', 'false');
  });
  
  // 重置所有sortable-file-item样式
  document.querySelectorAll('.sortable-file-item').forEach(el => {
    el.style.opacity = '1';
    el.style.border = '';
    el.style.zIndex = 'auto';
    el.style.pointerEvents = 'auto';
    el.style.position = 'relative';
    el.style.transform = '';
    el.style.boxShadow = '';
    el.style.backgroundColor = '';
    el.style.filter = '';
    el.classList.remove('is-dragging');
    el.removeAttribute('data-dragging');
  });
  
  // 重置所有文件项的样式
  document.querySelectorAll('[data-file-item="true"]').forEach(el => {
    el.style.opacity = '1';
    el.style.pointerEvents = 'auto';
    el.style.filter = '';
    el.style.backgroundColor = '';
    el.style.transform = '';
    el.style.transition = '';
  });
  
  // 重置所有MuiListItem的样式
  document.querySelectorAll('.MuiListItem-root').forEach(el => {
    el.style.opacity = '1';
    el.style.pointerEvents = 'auto';
    el.style.filter = '';
    el.style.backgroundColor = '';
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
};
