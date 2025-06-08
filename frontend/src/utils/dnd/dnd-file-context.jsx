/**
 * 文件名: dnd-file-context.jsx
 * 组件: 文件拖拽上下文
 * 描述: 提供文件到文件夹的复杂拖拽操作功能
 * 作者: Jolly Chen
 * 时间: 2024-11-20
 * 版本: 1.2.0
 * 许可证: Apache-2.0
 */

import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { ListItem, ListItemText, ListItemIcon } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import { Logger, CURRENT_LOG_LEVEL, LOG_LEVEL } from './dnd-logger.js';

// 内联辅助函数以避免循环依赖

// 节流函数：限制函数执行频率
const throttle = (func, limit) => {
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
const clearAllFolderHighlights = () => {
  const allFolderElements = document.querySelectorAll('[data-is-folder="true"], [data-folder-id]');
  Logger.debug(`清除 ${allFolderElements.length} 个文件夹元素的高亮状态`);
  
  allFolderElements.forEach(el => {
    el.style.backgroundColor = '';
    el.style.boxShadow = '';
    el.style.border = '';
    el.style.transform = '';
    el.classList.remove('folder-drag-hover', 'drag-target-highlight');
  });
};

const highlightFolderElement = (folderId, isHeader = false) => {
  // 清除所有之前的高亮
  clearAllFolderHighlights();
  
  if (!folderId && folderId !== null) {
    Logger.warn('highlightFolderElement: 无效的folderId', folderId);
    return;
  }
  
  let selector;
  if (folderId === null || folderId === 'null') {
    // 根目录情况
    selector = '[data-droppable-id="root-area"]';
  } else {
    // 特定文件夹
    selector = isHeader 
      ? `[data-folder-id="${folderId}"]` 
      : `[data-droppable-id="folder-${folderId}"], [data-folder-id="${folderId}"]`;
  }
  
  const elements = document.querySelectorAll(selector);
  
  if (elements.length === 0) {
    Logger.debug(`未找到匹配的文件夹元素: ${selector}`);
    return;
  }
  
  elements.forEach(el => {
    el.style.backgroundColor = 'rgba(25, 118, 210, 0.1)';
    el.style.boxShadow = '0 0 0 2px rgba(25, 118, 210, 0.3)';
    el.style.border = '2px dashed rgba(25, 118, 210, 0.5)';
    el.classList.add('drag-target-highlight');    Logger.debug(`高亮文件夹元素: ${selector}`);
  });
};

const setupFolderElements = () => {
  const folderElements = document.querySelectorAll('[data-is-folder="true"], [data-folder-id]');
  Logger.debug(`找到 ${folderElements.length} 个文件夹元素进行设置`);
  
  folderElements.forEach(el => {
    el.style.transition = 'background-color 0.2s ease, box-shadow 0.2s ease';
    el.setAttribute('data-droppable-setup', 'true');
  });
  
  return Array.from(folderElements);
};



/**
 * 文件夹拖放容器组件
 * @param {Array} files - 文件列表
 * @param {Function} onReorder - 重新排序回调函数
 * @param {Function} onMoveToFolder - 移动到文件夹回调函数
 * @param {React.ReactNode} children - 子组件
 */
export function FileDndContext({ files, onReorder, onMoveToFolder, children }) {
  // 添加状态来追踪当前活动的文件项和悬停的文件夹
  const [activeFileId, setActiveFileId] = React.useState(null);
  const [hoverFolderId, setHoverFolderId] = React.useState(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStartTime, setDragStartTime] = React.useState(null);
  const [lastCleanupTime, setLastCleanupTime] = React.useState(null);
  
  // 添加鼠标位置跟踪状态
  const [currentMousePos, setCurrentMousePos] = React.useState({ x: 0, y: 0 });
  
  // 使用useRef来跟踪DOM元素和元素状态
  const draggedElementRef = React.useRef(null);
  const folderElementsRef = React.useRef([]);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        // 修改为更短的延时，提升用户体验
        delay: 150, // 150ms触发拖拽
        tolerance: 8, // 允许8px的移动容差
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 包装后的高亮文件夹函数，添加状态设置
  const highlightFolderElementWithState = React.useCallback((folderId, isHeader = false) => {
    highlightFolderElement(folderId, isHeader);
    setHoverFolderId(folderId);
  }, []);
  // 清理所有拖拽相关的样式和状态
  const cleanupDragState = React.useCallback(() => {
    Logger.info('执行拖拽状态全面清理');
    
    // 记录清理时间
    const now = Date.now();
    setLastCleanupTime(now);
    
    // 重置状态
    setIsDragging(false);
    setDragStartTime(null);
    setActiveFileId(null);
    setHoverFolderId(null);
    
    // 清除所有文件夹高亮
    clearAllFolderHighlights();
    
    // 清除所有data-dragging属性
    document.querySelectorAll('[data-dragging="true"]').forEach(el => {
      el.setAttribute('data-dragging', 'false');
      el.removeAttribute('data-dragging');
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
      el.classList.remove('is-dragging', 'dragging', 'drag-over', 'folder-drag-hover');
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
      el.classList.remove('is-dragging', 'dragging', 'drag-over');
    });
    
    // 重置所有MuiListItem的样式
    document.querySelectorAll('.MuiListItem-root').forEach(el => {
      el.style.opacity = '1';
      el.style.pointerEvents = 'auto';
      el.style.filter = '';
      el.style.backgroundColor = '';
      el.style.cursor = '';
      el.classList.remove('is-dragging', 'dragging', 'drag-over');
    });
    
    // 确保所有元素都可以点击
    document.querySelectorAll('.MuiListItem-button').forEach(el => {
      el.style.pointerEvents = 'auto';
    });
    
    // 移除所有拖拽相关的临时样式和类
    const elementsWithDragStyles = document.querySelectorAll('.dragging, .drag-over, .folder-drag-hover, .is-dragging');
    elementsWithDragStyles.forEach(el => {
      el.classList.remove('dragging', 'drag-over', 'folder-drag-hover', 'is-dragging');
      el.style.opacity = '1';
      el.style.filter = '';
      el.style.pointerEvents = 'auto';
    });
    
    // 清理拖拽覆盖层
    const dragOverlay = document.querySelector('[data-dnd-overlay="true"]');
    if (dragOverlay) {
      dragOverlay.remove();
    }
    
    // 重置任何可能残留的拖拽容器
    const allDragContainers = document.querySelectorAll('[data-dnd-container="true"]');
    allDragContainers.forEach(container => {
      container.style.opacity = '1';
      container.style.pointerEvents = 'auto';
    });
    
    // 强制释放文档上的所有鼠标事件处理器
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';
    document.body.style.cursor = '';
    
    Logger.debug('拖拽状态清理完成');
  }, []);
  
  // 添加自定义属性，确保文件夹元素能被正确识别
  React.useEffect(() => {
    Logger.debug('初始化文件夹元素识别');
    
    // 初始设置
    const folderElements = setupFolderElements();
    folderElementsRef.current = folderElements;
    
    // 为文件夹元素添加事件监听器
    folderElements.forEach(el => {
      if (el.getAttribute('data-folder-id') || (el.id && (el.id.startsWith('folder-') || el.id.includes('folder-content')))) {
        // 移除旧的事件监听器(如果存在)
        el.removeEventListener('dragover', el._dragover);
        el.removeEventListener('dragleave', el._dragleave);
        el.removeEventListener('drop', el._drop);
        
        // 添加新的事件监听器
        el._dragover = (e) => {
          e.preventDefault();
          const folderId = el.getAttribute('data-folder-id');
          if (folderId) {
            highlightFolderElementWithState(folderId);
          }
        };
        
        el._dragleave = () => {
          // 不会立即清除高亮，而是在下一个高亮设置时清除
        };
        
        el._drop = () => {
          clearAllFolderHighlights();
          setHoverFolderId(null);
        };
        
        el.addEventListener('dragover', el._dragover);
        el.addEventListener('dragleave', el._dragleave);
        el.addEventListener('drop', el._drop);
      }
    });
    
    // 添加MutationObserver以处理动态添加的元素
    const observer = new MutationObserver((mutations) => {
      let needsUpdate = false;
      
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // 检查是否添加了新的文件夹元素
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1 && // 元素节点
                ((node.id && (node.id.includes('folder-'))) || 
                 (node.className && typeof node.className === 'string' && node.className.includes('folder')))) {
              needsUpdate = true;
            }
          });
        }
      });
      
      if (needsUpdate) {
        Logger.debug('检测到DOM变化，更新文件夹元素属性');
        const newFolderElements = setupFolderElements();
        folderElementsRef.current = newFolderElements;
      }
    });
    
    // 开始观察整个文档
    observer.observe(document.body, { childList: true, subtree: true });
    
    // 使用节流函数包装mouseMoveHandler，限制执行频率为100ms一次
    const mouseMoveHandler = throttle((e) => {
      if (!activeFileId) return;
      
      // 获取鼠标下的元素
      const elementsAtPoint = document.elementsFromPoint(e.clientX, e.clientY);
      
      // 查找文件夹元素
      const folderElement = elementsAtPoint.find(el => 
        el.getAttribute('data-is-folder') === 'true' || 
        el.getAttribute('data-folder-id')
      );
      
      if (folderElement) {
        const folderId = folderElement.getAttribute('data-folder-id');
        if (folderId && folderId !== hoverFolderId) { // 仅在文件夹ID变化时更新高亮
          highlightFolderElementWithState(folderId);
        }
      } else {
        // 如果不在文件夹上方，清除高亮
        if (hoverFolderId) {
          clearAllFolderHighlights();
          setHoverFolderId(null);
        }
      }
    }, 100); // 100ms节流
    
    window.addEventListener('mousemove', mouseMoveHandler);
    
    // 清理函数
    return () => {
      observer.disconnect();
      window.removeEventListener('mousemove', mouseMoveHandler);
      Logger.debug('文件夹元素识别清理完成');
    };  }, [activeFileId, hoverFolderId, highlightFolderElementWithState]);
    // 添加全局鼠标位置跟踪效果
  React.useEffect(() => {
    const handleMouseMove = (e) => {
      setCurrentMousePos({ x: e.clientX, y: e.clientY });
      // 添加调试输出
      if (isDragging) {
        Logger.debug(`鼠标位置更新: (${e.clientX}, ${e.clientY})`);
      }
    };
    
    // 始终启用鼠标位置跟踪，而不仅仅在拖拽过程中
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isDragging]); // 保持依赖数组包含 isDragging 以便记录日志
    // 处理拖拽开始
  const handleDragStart = (event) => {
    const { active } = event;
    
    Logger.startPerf('dragOperation');
    setDragStartTime(Date.now());
    setIsDragging(true);
    setActiveFileId(String(active.id));
    // 重置悬停文件夹状态
    setHoverFolderId(null);
    
    // 获取被拖拽文件的详细信息
    const draggedFile = files.find(file => String(file.id) === String(active.id));
    if (draggedFile) {
      Logger.info(`开始拖拽文件: ID=${active.id}, 名称=${draggedFile.name}, 当前文件夹=${draggedFile.folder_id || '根目录'}`);
    } else {
      Logger.warn(`开始拖拽文件: ID=${active.id}, 但未找到对应的文件信息`);
    }
    
    // 记录拖拽开始的坐标信息
    const startX = event.activatorEvent?.clientX ?? 0;
    const startY = event.activatorEvent?.clientY ?? 0;
    Logger.debug(`拖拽开始坐标: x=${startX}, y=${startY}`);
    
    // 触发自定义拖拽开始事件
    const customEvent = new CustomEvent('dnd-drag-start', {
      detail: { fileId: active.id }
    });
    document.dispatchEvent(customEvent);
    Logger.debug('已触发自定义拖拽开始事件', { fileId: active.id });
    
    // 添加显著的拖拽开始视觉反馈
    const draggedElement = document.querySelector(`[data-file-id="${active.id}"]`);
    if (draggedElement) {
      draggedElementRef.current = draggedElement;
      draggedElement.style.opacity = "0.6";
      draggedElement.style.border = "2px dashed #3f51b5";
      draggedElement.style.zIndex = "1000";
      Logger.debug(`为拖拽元素应用视觉反馈: ${active.id}`);
    } else {
      Logger.warn(`未找到拖拽元素对应的DOM: ${active.id}`);
    }
  };  // 处理拖拽过程中
  const handleDragOver = (event) => {
    const { active, over } = event;
    
    // 优先处理 @dnd-kit 的 droppable 区域事件
    if (over && over.data && over.data.current) {
      const { type, folderId } = over.data.current;
      
      Logger.debug(`检测到 droppable 区域: type=${type}, folderId=${folderId}, over.id=${over.id}`);
      
      if (type === 'FOLDER' && folderId !== undefined) {
        // 处理文件夹 drop 区域
        if (folderId !== hoverFolderId) {
          Logger.debug(`悬停在文件夹 drop 区域: ${folderId} (之前: ${hoverFolderId || '无'})`);
          highlightFolderElementWithState(folderId);
        }
        return; // 使用 droppable 区域，不再进行手动检测
      } else if (type === 'ROOT') {
        // 处理根目录 drop 区域
        if (hoverFolderId !== null) {
          Logger.debug(`悬停在根目录 drop 区域，清除文件夹高亮 (之前: ${hoverFolderId})`);
          clearAllFolderHighlights();
          setHoverFolderId(null);
        }
        return; // 使用 droppable 区域，不再进行手动检测
      }
    }
    
    // 如果没有有效的 droppable 区域，回退到手动检测（向后兼容）
    if (!over) {
      Logger.debug(`拖拽过程中无 droppable 目标，使用手动检测`);
    }
    
    // 使用跟踪到的鼠标位置，而不是从事件对象获取
    const clientX = currentMousePos.x;
    const clientY = currentMousePos.y;
    
    Logger.debug(`拖拽过程中手动检测: 鼠标位置(${clientX}, ${clientY}), 当前hoverFolderId=${hoverFolderId}`);
    
    // 验证坐标值是有限数值
    if (!isFinite(clientX) || !isFinite(clientY)) {
      Logger.warn(`拖拽事件包含无效坐标: x=${clientX}, y=${clientY}`);
      return;
    }
    
    // 获取鼠标下的元素
    const elementsAtPoint = document.elementsFromPoint(clientX, clientY);
    
    // 记录鼠标下的元素信息（调试时使用）
    if (CURRENT_LOG_LEVEL <= LOG_LEVEL.DEBUG) {
      const topElements = elementsAtPoint.slice(0, 3).map(el => ({
        tagName: el.tagName,
        id: el.id,
        className: typeof el.className === 'string' ? el.className.substring(0, 50) : '',
        dataAttrs: {
          isFolder: el.getAttribute('data-is-folder'),
          folderId: el.getAttribute('data-folder-id'),
          fileId: el.getAttribute('data-file-id')
        }
      }));
      Logger.debug(`手动检测鼠标位置 (${clientX}, ${clientY}), 顶层元素:`, topElements);
    }
      // 查找文件夹元素 - 排除正在拖拽的文件元素
    const folderElement = elementsAtPoint.find(el => {
      // 排除正在拖拽的文件本身
      if (el.getAttribute('data-file-id') === String(active.id)) {
        return false;
      }
      
      return (el.getAttribute('data-is-folder') === 'true' || 
              el.getAttribute('data-folder-id')) &&
             // 确保不是文件项元素
             !el.getAttribute('data-file-item');
    });
    
    if (folderElement) {
      const folderId = folderElement.getAttribute('data-folder-id');
      if (folderId && folderId !== hoverFolderId) { // 仅在文件夹ID变化时更新高亮
        Logger.debug(`手动检测到悬停在文件夹上: ${folderId} (之前: ${hoverFolderId || '无'})`);
        highlightFolderElementWithState(folderId);
      }
    } else {
      // 检查是否在根目录区域
      const inRootArea = elementsAtPoint.some(el => 
        el.id === 'root-files' || 
        el.getAttribute('data-is-root-area') === 'true' ||
        el.getAttribute('data-droppable-id') === 'root-area' ||
        (el.className && typeof el.className === 'string' && (
          el.className.includes('sidebar') || 
          el.className.includes('root-files-area')
        ))
      );
      
      if (inRootArea && hoverFolderId) {
        Logger.debug(`手动检测到悬停在根目录区域，清除文件夹高亮 (之前: ${hoverFolderId})`);
        clearAllFolderHighlights();
        setHoverFolderId(null);
      } else if (hoverFolderId) {
        Logger.debug(`手动检测到离开文件夹区域，清除文件夹高亮 (之前: ${hoverFolderId})`);
        clearAllFolderHighlights();
        setHoverFolderId(null);
      }
    }
  };
    // 处理拖拽结束
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    Logger.info(`结束拖拽: ${active?.id}，目标: ${over?.id || '无目标'}`);
    
    // 立即重置所有状态变量
    setActiveFileId(null);
    setHoverFolderId(null);
    setIsDragging(false);
    setDragStartTime(null);
    setLastCleanupTime(Date.now());
    
    // 重置拖拽元素引用
    if (draggedElementRef.current) {
      draggedElementRef.current = null;
    }
    
    if (!over) {
      Logger.debug('拖拽未结束在有效目标上，操作取消');
      cleanupDragState();
      return;
    }
    
    // 获取活动项原始文件信息
    const draggedFile = files.find(file => String(file.id) === String(active.id));
    
    if (!draggedFile) {
      Logger.error(`未找到被拖动的文件: ${active.id}`);
      cleanupDragState();
      return;
    }
    
    // 记录初始状态，帮助调试
    Logger.debug(`拖动文件初始状态: ID=${draggedFile.id}, 当前所属文件夹=${draggedFile.folder_id || '根目录'}`);    // 获取最准确的鼠标位置 - 优先使用跟踪到的位置
    const finalMouseX = currentMousePos.x || 
                     (event.activatorEvent?.clientX ?? 
                     event.active.currentCoordinates?.x ?? 
                     window.innerWidth / 2);
    const finalMouseY = currentMousePos.y || 
                     (event.activatorEvent?.clientY ?? 
                     event.active.currentCoordinates?.y ?? 
                     window.innerHeight / 2);
    
    Logger.debug(`拖拽结束位置: x=${finalMouseX}, y=${finalMouseY}`);
    
    // 执行拖拽结束逻辑
    try {
      processDragEnd(event, draggedFile, finalMouseX, finalMouseY);
    } catch (error) {
      Logger.error('拖拽结束处理失败', error);
    }
    
    // 立即清理拖拽状态
    cleanupDragState();
    
    // 触发自定义拖拽结束事件
    const customEvent = new CustomEvent('dnd-drag-end', {
      detail: { fileId: active.id }
    });
    document.dispatchEvent(customEvent);
    Logger.debug('已触发自定义拖拽结束事件', { fileId: active.id });
    
    // 延迟再次清理，确保所有异步操作完成
    setTimeout(() => {
      cleanupDragState();
      Logger.debug('延迟清理完成');
    }, 100);
    
    Logger.endPerf('dragOperation');
  };
  // 处理拖拽结束的详细逻辑
  const processDragEnd = (event, draggedFile, finalMouseX, finalMouseY) => {
    const { active } = event;
    
    Logger.debug(`processDragEnd 开始: 当前hoverFolderId=${hoverFolderId}, 文件原始位置=${draggedFile.folder_id || '根目录'}`);
    
    // 获取当前鼠标位置下的所有元素
    const elementsAtPoint = document.elementsFromPoint(finalMouseX, finalMouseY);
    
    // 记录鼠标下的元素，帮助调试
    if (CURRENT_LOG_LEVEL <= LOG_LEVEL.DEBUG) {
      const elementInfo = elementsAtPoint.slice(0, 5).map(el => ({
        tagName: el.tagName,
        id: el.id,
        className: el.className,
        dataAttrs: {
          isFolder: el.getAttribute('data-is-folder'),
          folderId: el.getAttribute('data-folder-id'),
          fileId: el.getAttribute('data-file-id')
        }
      }));
      Logger.debug('鼠标下的主要元素:', elementInfo);
    }

    // 检查是否在侧边栏内，用于判断应该移动到根目录
    const inSidebar = elementsAtPoint.some(el => 
      el.className && typeof el.className === 'string' && (
        el.className.includes('sidebar') || 
        el.className.includes('MuiBox-root') || 
        el.className.includes('MuiDrawer-paper') ||
        el.className.includes('root-files-area')
      ) || 
      el.id === 'root-files' || 
      el.id === 'global-drop-area'
    );
    
    // 增强根目录区域检测 - 特别是侧边栏底部区域
    const emptyAreaAtBottom = elementsAtPoint.some(el => {
      // 检查是否包含"根目录无文件"提示文本
      const hasRootAreaText = el.textContent && (
        el.textContent.includes('根目录') || 
        el.textContent.includes('暂无文件') || 
        el.textContent.includes('拖放到此处')
      );
      
      // 检查自定义数据属性
      const hasRootAreaAttr = 
        el.getAttribute('data-is-root-area') === 'true' || 
        el.getAttribute('data-droppable-id') === 'root-area';
      
      return hasRootAreaText || hasRootAreaAttr;
    });
    
    // 检查各种拖拽目标元素
    const folderHeaderElement = elementsAtPoint.find(el => 
      (el.id && el.id.startsWith('folder-') && !el.id.includes('content')) ||
      (el.getAttribute('data-is-folder') === 'true' && !el.getAttribute('data-folder-content')) ||
      (el.getAttribute('data-droppable-id') && el.getAttribute('data-droppable-id').startsWith('folder-'))
    );
    
    const folderContentElement = elementsAtPoint.find(el => 
      (el.id && el.id.includes('folder-content-')) ||
      (el.getAttribute('data-folder-content') === 'true')
    );
    
    const droppableElement = elementsAtPoint.find(el => 
      el.getAttribute('data-droppable-id') && 
      (el.getAttribute('data-droppable-id').startsWith('folder-') || 
       el.getAttribute('data-droppable-id') === 'root-area')
    );
    
    const rootAreaElement = elementsAtPoint.find(el => 
      el.id === 'root-files' || el.getAttribute('data-is-root-area') === 'true'
    );

    // 获取拖拽文件的原始文件夹ID
    const originalFolderId = String(draggedFile.folder_id || '');
    
    Logger.debug(`检测结果: 侧边栏=${inSidebar}, 底部空白=${emptyAreaAtBottom}, 原文件夹=${originalFolderId || '根目录'}`);
    Logger.debug(`元素: 文件夹头部=${folderHeaderElement?.id || 'none'}, 内容=${folderContentElement?.id || 'none'}, 可放置=${droppableElement?.getAttribute('data-droppable-id') || 'none'}`);
    
    // 处理悬停文件夹优先逻辑
    if (hoverFolderId) {
      handleHoverFolderDrop(active, originalFolderId, inSidebar, folderContentElement, folderHeaderElement);
      return;
    }

    // 处理根目录区域拖拽
    if (inSidebar && rootAreaElement) {
      handleRootAreaDrop(active, draggedFile);
      return;
    }
    
    // 处理普通拖拽逻辑
    const targetFolderId = determineTargetFolder(
      droppableElement, 
      folderContentElement, 
      folderHeaderElement, 
      emptyAreaAtBottom, 
      inSidebar, 
      originalFolderId
    );
    
    if (targetFolderId !== undefined) {
      executeMove(active, draggedFile, targetFolderId);
    } else {
      Logger.info(`未找到有效目标，取消移动操作`);
    }
  };
  // 处理悬停文件夹的拖拽结束
  const handleHoverFolderDrop = (active, originalFolderId, inSidebar, folderContentElement, folderHeaderElement) => {
    Logger.debug(`使用悬停文件夹ID: ${hoverFolderId}, 原文件夹: ${originalFolderId}`);
    Logger.debug(`拖拽环境: 侧边栏=${inSidebar}, 内容元素=${!!folderContentElement}, 头部元素=${!!folderHeaderElement}`);
    
    if (String(hoverFolderId) === originalFolderId) {
      if (inSidebar && !folderContentElement && !folderHeaderElement) {
        Logger.info(`文件原属于文件夹 ${originalFolderId}，但检测到拖拽到侧边栏非文件夹区域，移动到根目录`);
        onMoveToFolder(String(active.id), null);
      } else {
        Logger.info(`文件已在文件夹 ${hoverFolderId} 中，跳过移动`);
      }
    } else {
      Logger.info(`将文件 ${active.id} 移动到悬停文件夹 ${hoverFolderId}`);
      onMoveToFolder(String(active.id), hoverFolderId);
      
      // 触发文件夹展开事件
      setTimeout(() => {
        document.dispatchEvent(new CustomEvent('expandFolder', { 
          detail: { folderId: hoverFolderId },
          bubbles: true,
          cancelable: true
        }));
      }, 100);
    }
  };

  // 处理根目录区域的拖拽结束
  const handleRootAreaDrop = (active, draggedFile) => {
    Logger.info(`检测到拖拽到侧边栏根目录区域，优先处理为移动到根目录`);
    if (draggedFile.folder_id !== null) {
      Logger.info(`将文件 ${active.id} 从文件夹 ${draggedFile.folder_id} 移动到根目录`);
      onMoveToFolder(String(active.id), null);
    } else {
      Logger.info(`文件已在根目录，跳过移动`);
    }
  };

  // 确定目标文件夹
  const determineTargetFolder = (droppableElement, folderContentElement, folderHeaderElement, emptyAreaAtBottom, inSidebar, originalFolderId) => {
    let targetFolderId = null;
    
    // 如果检测到底部空白区域且为侧边栏，优先处理为根目录
    if (emptyAreaAtBottom && inSidebar) {
      Logger.info('检测到底部空白区域，优先设置目标为根目录');
      return null;
    }
    
    // 优先检查是否拖拽到带有data-droppable-id的蓝色放置框区域
    if (droppableElement) {
      const droppableId = droppableElement.getAttribute('data-droppable-id');
      
      if (droppableId === 'root-area') {
        Logger.debug(`检测到拖拽到根目录放置区域`);
        return null;
      } else if (droppableId.startsWith('folder-')) {
        const droppableFolderId = droppableId.replace('folder-', '');
        Logger.debug(`检测到拖拽到文件夹放置区域: ${droppableFolderId}, 原文件夹: ${originalFolderId}`);
        return droppableFolderId;
      }
    }
    
    // 检查文件夹内容区域
    if (folderContentElement) {
      const contentFolderId = folderContentElement.getAttribute('data-folder-id') || 
                           folderContentElement.id.replace('folder-content-', '');
      Logger.debug(`检测到拖拽到文件夹内容区域: ${contentFolderId}, 原文件夹: ${originalFolderId}`);
      return contentFolderId;
    }
    
    // 检查文件夹头部
    if (folderHeaderElement) {
      const headerFolderId = folderHeaderElement.getAttribute('data-folder-id') || 
                          folderHeaderElement.getAttribute('data-droppable-id')?.replace('folder-', '') ||
                          folderHeaderElement.id.replace('folder-', '');
      Logger.debug(`检测到拖拽到文件夹头部: ${headerFolderId}, 原文件夹: ${originalFolderId}`);
      return headerFolderId;
    }
    
    // 如果在侧边栏内但没有检测到具体文件夹，认为是拖到根目录
    if (inSidebar) {
      Logger.debug(`检测到拖拽到侧边栏非文件夹区域，视为根目录`);
      return null;
    }
    
    return undefined;
  };

  // 执行移动操作
  const executeMove = (active, draggedFile, targetFolderId) => {
    const isTargetRoot = targetFolderId === null;
    const isSourceRoot = draggedFile.folder_id === null || draggedFile.folder_id === undefined || 
                        draggedFile.folder_id === 0 || draggedFile.folder_id === '0' || draggedFile.folder_id === '';
    const isSameLocation = isTargetRoot ? isSourceRoot : String(targetFolderId) === String(draggedFile.folder_id);
    
    Logger.debug(`移动判断: 目标=${isTargetRoot ? '根目录' : '文件夹' + targetFolderId}, 源=${isSourceRoot ? '根目录' : '文件夹' + draggedFile.folder_id}, 相同位置=${isSameLocation}`);
    
    if (isSameLocation) {
      Logger.info(`文件已在${isTargetRoot ? '根目录' : '文件夹 ' + targetFolderId}中，跳过移动`);
    } else {
      if (isTargetRoot) {
        Logger.info(`将文件 ${active.id} 从${draggedFile.folder_id ? '文件夹 ' + draggedFile.folder_id : '根目录'}移动到根目录`);
        onMoveToFolder(String(active.id), null);
      } else {
        Logger.info(`将文件 ${active.id} 从${draggedFile.folder_id ? '文件夹 ' + draggedFile.folder_id : '根目录'}移动到文件夹 ${targetFolderId}`);
        
        // 触发文件夹展开事件
        setTimeout(() => {
          document.dispatchEvent(new CustomEvent('expandFolder', { 
            detail: { folderId: targetFolderId },
            bubbles: true,
            cancelable: true
          }));
        }, 100);
        
        onMoveToFolder(String(active.id), targetFolderId);
      }
    }
  };
    // 额外的安全保障：如果拖拽超过10秒没有结束，强制清理
  React.useEffect(() => {
    if (!isDragging || !dragStartTime) return;
    
    const timer = setTimeout(() => {
      const dragDuration = Date.now() - dragStartTime;
      if (dragDuration > 10000) { // 10秒超时
        Logger.warn('拖拽操作超时，强制清理');
        cleanupDragState();
        setActiveFileId(null);
        setHoverFolderId(null);
        setIsDragging(false);
        setDragStartTime(null);
      }
    }, 10000);
    
    return () => clearTimeout(timer);
  }, [isDragging, dragStartTime, cleanupDragState]);

  // 组件卸载时的清理
  React.useEffect(() => {
    return () => {
      Logger.debug('FileDndContext组件卸载，执行清理');
      cleanupDragState();
      setActiveFileId(null);
      setHoverFolderId(null);
      setIsDragging(false);
      setDragStartTime(null);
      
      // 清理DOM引用
      if (draggedElementRef.current) {
        draggedElementRef.current = null;
      }
      folderElementsRef.current = [];
    };
  }, []);
    return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <SortableContext 
        items={files.map(file => String(file.id))}
        strategy={verticalListSortingStrategy}
      >
        {children}
      </SortableContext>
      
      {/* 拖拽预览覆盖层 */}
      <DragOverlay>
        {activeFileId ? (
          <ListItem
            sx={{
              backgroundColor: 'background.paper',
              boxShadow: '0 4px 8px rgba(0,0,0,0.12)',
              borderRadius: 1,
              border: '1px solid rgba(63, 81, 181, 0.2)',
              opacity: 0.9,
              transform: 'rotate(2deg)',
              cursor: 'grabbing',
              minWidth: '200px',
              maxWidth: '250px',
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <DescriptionIcon color="primary" fontSize="small" />
            </ListItemIcon>
            <ListItemText 
              primary={files.find(f => f.id === activeFileId)?.name || '文件'}
              primaryTypographyProps={{
                noWrap: true,
                sx: { fontWeight: 500 }
              }}
            />
          </ListItem>
        ) : null}
      </DragOverlay>
      
      {/* 添加全局样式，只在拖拽时生效 */}
      {activeFileId && (
        <style>{`
          /* ===== 文件夹内容区域容器样式 ===== */
          [id^="folder-content-"] {
            overflow: visible !important;
            position: relative !important;
            min-height: 20px !important;
            z-index: auto !important;
          }
          
          /* ===== 根文件区域容器样式 ===== */
          #root-files {
            overflow: visible !important;
            position: relative !important;
          }
          
          /* ===== 确保拖拽预览位置正确 ===== */
          .sortable-file-item {
            max-width: 100% !important;
            transform-origin: left top !important;
          }
          
          /* ===== 激活拖拽项样式 ===== */
          [data-dragging="true"] {
            z-index: 999 !important;
            opacity: 0.6 !important;
          }
          
          /* ===== 修复MUI组件可能的问题 ===== */
          .MuiListItem-root {
            overflow: visible !important;
          }
          
          /* ===== 确保拖拽层级正确 ===== */
          body > [data-dnd-draggable="true"] {
            z-index: 9999 !important;
            pointer-events: none !important;
            box-shadow: 0 5px 10px rgba(0,0,0,0.15) !important;
            opacity: 0.8 !important;
          }
        `}</style>
      )}
    </DndContext>
  );
}
