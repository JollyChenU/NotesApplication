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
import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  horizontalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';

// 日志级别控制
const LOG_LEVEL = {
  DEBUG: 0,   // 详细调试日志
  INFO: 1,    // 普通信息日志
  WARN: 2,    // 警告信息
  ERROR: 3,   // 错误信息
  NONE: 4     // 禁用所有日志
};

// 设置当前日志级别
const CURRENT_LOG_LEVEL = LOG_LEVEL.WARN; // 仅显示警告和错误信息

// 记录性能指标
const PERF_METRICS = {};

// 结构化日志函数
const Logger = {
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
 * 创建一个可排序项组件
 * @param {Object} props - 组件属性
 * @returns {React.Component} SortableItem组件
 */
export function createSortableItem(ItemComponent) {
  return function SortableItem({ id, ...props }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging
    } = useSortable({ id });
    
    // 获取当前文件的folder_id
    const currentFolderId = props.file?.folder_id;
    
    // 计算实际样式，包含改进的定位逻辑
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      position: 'relative',
      zIndex: isDragging ? 999 : 'auto',
      pointerEvents: isDragging ? 'none' : 'auto',
      boxShadow: isDragging ? '0 4px 8px rgba(0,0,0,0.1)' : 'none',
    };
    
    // 渲染组件，提供正确的属性
    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        {...attributes}
        data-file-original-folder={currentFolderId || 'root'}
        data-sortable-item="true"
        data-dragging={isDragging ? 'true' : 'false'}
        data-file-id={id}
        className={`sortable-file-item ${isDragging ? 'is-dragging' : ''} ${currentFolderId ? 'folder-item-' + currentFolderId : 'root-file-item'}`}
      >
        <ItemComponent 
          {...props}
          draggable={true}
          dragHandleProps={listeners}
          isDragging={isDragging}
          id={id}
        />
      </div>
    );
  };
}

/**
 * 笔记列表容器组件
 */
export function NoteDndContext({ items, onReorder, children, direction = 'vertical' }) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        // 修改为延时激活，实现长按触发拖拽
        delay: 500, // 500ms长按触发
        tolerance: 5, // 允许5px的移动容差
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(item => String(item.id) === String(active.id));
      const newIndex = items.findIndex(item => String(item.id) === String(over.id));
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newItems = arrayMove(items, oldIndex, newIndex);
        onReorder(newItems);
      }
    }
  };
  
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToParentElement]}
    >
      <SortableContext 
        items={items.map(item => String(item.id))} 
        strategy={direction === 'vertical' ? verticalListSortingStrategy : horizontalListSortingStrategy}
      >
        {children}
      </SortableContext>
    </DndContext>
  );
}

/**
 * 文件夹拖放容器组件
 */
export function FileDndContext({ files, onReorder, onMoveToFolder, children }) {
  // 添加状态来追踪当前活动的文件项和悬停的文件夹
  const [activeFileId, setActiveFileId] = React.useState(null);
  const [hoverFolderId, setHoverFolderId] = React.useState(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStartTime, setDragStartTime] = React.useState(null);
  const [lastCleanupTime, setLastCleanupTime] = React.useState(null);
  
  // 使用useRef来跟踪DOM元素和元素状态
  const draggedElementRef = React.useRef(null);
  const folderElementsRef = React.useRef([]);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        // 修改为延时激活，实现长按触发拖拽
        delay: 500, // 500ms长按触发
        tolerance: 5, // 允许5px的移动容差
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // 清除所有文件夹元素的高亮状态
  const clearAllFolderHighlights = React.useCallback(() => {
    const allFolderElements = document.querySelectorAll('[data-is-folder="true"], [data-folder-id]');
    allFolderElements.forEach(el => {
      el.style.backgroundColor = '';
      el.style.boxShadow = '';
      el.style.border = '';
    });
    Logger.debug('清除所有文件夹高亮');
  }, []);
  
  // 高亮指定的文件夹元素
  const highlightFolderElement = React.useCallback((folderId, isHeader = false) => {
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
    
    // 设置状态
    setHoverFolderId(folderId);
    Logger.debug(`高亮文件夹: ${folderId}, 是否仅头部: ${isHeader}, 是否展开: ${isFolderExpanded}`);
  }, [clearAllFolderHighlights]);
  
  // 添加自定义属性，确保文件夹元素能被正确识别
  React.useEffect(() => {
    Logger.debug('初始化文件夹元素识别');
    
    // 增强文件夹元素识别 - 使用更广泛的选择器
    const setupFolderElements = () => {
      // 为所有文件夹元素添加dataset属性 - 使用多种选择器确保捕获所有可能的文件夹元素
      const folderElements = document.querySelectorAll(
        '[id^="folder-"], [data-droppable-id^="folder-"], [id*="folder-content"], [class*="folder"]'
      );
      
      Logger.debug(`识别到 ${folderElements.length} 个潜在文件夹元素`);
      
      folderElementsRef.current = Array.from(folderElements);
      
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
        
        // 为所有文件夹相关元素添加视觉指示和事件处理
        if (el.getAttribute('data-folder-id') || (el.id && (el.id.startsWith('folder-') || el.id.includes('folder-content')))) {
          // 添加一个微妙的视觉指示，表明这是可拖放区域
          el.style.transition = 'all 0.2s ease-in-out';
          
          // 标记文件夹元素
          el.setAttribute('data-is-folder', 'true');
          
          // 移除旧的事件监听器(如果存在)
          el.removeEventListener('dragover', el._dragover);
          el.removeEventListener('dragleave', el._dragleave);
          el.removeEventListener('drop', el._drop);
          
          // 添加新的事件监听器
          el._dragover = (e) => {
            e.preventDefault();
            const folderId = el.getAttribute('data-folder-id');
            if (folderId) {
              highlightFolderElement(folderId);
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
    };
    
    // 初始设置
    setupFolderElements();
    
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
        setupFolderElements();
      }
    });
    
    // 开始观察整个文档
    observer.observe(document.body, { childList: true, subtree: true });
    
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
          highlightFolderElement(folderId);
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
    };
  }, [activeFileId, hoverFolderId, highlightFolderElement, clearAllFolderHighlights]);
  
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
  }, [clearAllFolderHighlights]);
  
  // 处理拖拽开始
  const handleDragStart = (event) => {
    const { active } = event;
    
    Logger.startPerf('dragOperation');
    setDragStartTime(Date.now());
    setIsDragging(true);
    setActiveFileId(String(active.id));
    
    Logger.info(`开始拖拽文件: ${active.id}`);
    
    // 添加显著的拖拽开始视觉反馈
    const draggedElement = document.querySelector(`[data-file-id="${active.id}"]`);
    if (draggedElement) {
      draggedElementRef.current = draggedElement;
      draggedElement.style.opacity = "0.6";
      draggedElement.style.border = "2px dashed #3f51b5";
      draggedElement.style.zIndex = "1000";
    }
  };
  
  // 处理拖拽过程中
  const handleDragOver = (event) => {
    const { active, over } = event;
    
    // 如果没有悬停目标，则不处理
    if (!over) return;
    
    // 检查坐标值是否有效（防止NaN或Infinity值导致崩溃）
    const clientX = event.clientX ?? 0;
    const clientY = event.clientY ?? 0;
    
    // 验证坐标值是有限数值
    if (!isFinite(clientX) || !isFinite(clientY)) {
      Logger.warn(`拖拽事件包含无效坐标: x=${clientX}, y=${clientY}`);
      return;
    }
    
    // 获取鼠标下的元素
    const elementsAtPoint = document.elementsFromPoint(clientX, clientY);
    
    // 查找文件夹元素
    const folderElement = elementsAtPoint.find(el => 
      el.getAttribute('data-is-folder') === 'true' || 
      el.getAttribute('data-folder-id')
    );
    
    if (folderElement) {
      const folderId = folderElement.getAttribute('data-folder-id');
      if (folderId && folderId !== hoverFolderId) { // 仅在文件夹ID变化时更新高亮
        highlightFolderElement(folderId);
      }
    } else {
      // 如果不在文件夹上方，清除高亮
      if (hoverFolderId) {
        clearAllFolderHighlights();
        setHoverFolderId(null);
      }
    }
  };
  
  // 处理拖拽结束
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    Logger.info(`结束拖拽: ${active?.id}，目标: ${over?.id || '无目标'}`);
    
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
    Logger.debug(`拖动文件初始状态: ID=${draggedFile.id}, 当前所属文件夹=${draggedFile.folder_id || '根目录'}`);
    
    // 获取最准确的鼠标位置
    const finalMouseX = event.activatorEvent?.clientX ?? 
                     event.active.currentCoordinates?.x ?? 
                     window.innerWidth / 2;
    const finalMouseY = event.activatorEvent?.clientY ?? 
                     event.active.currentCoordinates?.y ?? 
                     window.innerHeight / 2;
    
    Logger.debug(`拖拽结束位置: x=${finalMouseX}, y=${finalMouseY}`);
    
    // 获取当前鼠标位置下的所有元素
    let elementsAtPoint = [];
    try {
      elementsAtPoint = document.elementsFromPoint(finalMouseX, finalMouseY);
      
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
      
      // 获取拖拽文件的原始文件夹ID
      const originalFolderId = String(draggedFile.folder_id || '');
      Logger.debug(`原始文件夹ID: ${originalFolderId || '根目录'}, 侧边栏区域: ${inSidebar}, 底部空白区域: ${emptyAreaAtBottom}`);
      
      // 检查鼠标下的所有元素，同时精确区分文件夹头部和内容区域
      const folderHeaderElement = elementsAtPoint.find(el => 
        (el.id && el.id.startsWith('folder-') && !el.id.includes('content'))
      );
      
      const folderContentElement = elementsAtPoint.find(el => 
        (el.id && el.id.includes('folder-content-'))
      );
      
      // 获取根目录区域元素
      const rootAreaElement = elementsAtPoint.find(el => 
        el.id === 'root-files' || el.getAttribute('data-is-root-area') === 'true'
      );

      Logger.debug(`侧边栏区域: ${inSidebar}, 根目录元素: ${rootAreaElement ? 'found' : 'not found'}`);
      
      // 如果在拖拽过程中已经确定了悬停文件夹，则优先使用它
      if (hoverFolderId) {
        // 检查悬停文件夹是否与原始文件夹相同
        if (String(hoverFolderId) === originalFolderId) {
          if (inSidebar && !folderContentElement && !folderHeaderElement) {
            // 如果在侧边栏中且不在文件夹元素上，则移动到根目录
            Logger.info(`文件原属于文件夹 ${originalFolderId}，但检测到拖拽到侧边栏非文件夹区域，移动到根目录`);
            onMoveToFolder(String(active.id), null);
          } else {
            Logger.info(`文件已在文件夹 ${hoverFolderId} 中，跳过移动`);
          }
        } else {
          Logger.info(`将文件 ${active.id} 移动到文件夹 ${hoverFolderId}`);
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
        
        cleanupDragState();
        return;
      }

      // 处理特殊情况：如果位于侧边栏的根目录区域，优先移到根目录
      if (inSidebar && rootAreaElement) {
        Logger.info(`检测到拖拽到侧边栏根目录区域，优先处理为移动到根目录`);
        if (draggedFile.folder_id !== null) {
          Logger.info(`将文件 ${active.id} 从文件夹 ${draggedFile.folder_id} 移动到根目录`);
          onMoveToFolder(String(active.id), null);
          cleanupDragState();
          return;
        } else {
          Logger.info(`文件已在根目录，跳过移动`);
        }
      }
      
      // 初始化目标文件夹ID为null（根目录）
      let targetFolderId = null;
      let isInSameFolder = false;
      
      // 添加额外检测 - 如果检测到底部空白区域且为侧边栏，优先处理为根目录
      if (emptyAreaAtBottom && inSidebar) {
        Logger.info('检测到底部空白区域，优先设置目标为根目录');
        targetFolderId = null; // 明确设置为根目录(null)
        isInSameFolder = false; // 强制设置为不同文件夹，确保移动操作执行
      }
      // 否则，继续正常检测
      else {
        // 首先检查文件是否拖拽到自己所在的文件夹内容区域
        if (folderContentElement) {
          const contentFolderId = folderContentElement.getAttribute('data-folder-id') || 
                               folderContentElement.id.replace('folder-content-', '');
          
          // 检查是否是原文件夹的内容区域
          if (String(contentFolderId) === originalFolderId) {
            isInSameFolder = true;
            Logger.debug(`文件拖拽到了自己所在的文件夹内容区域: ${contentFolderId}`);
          }
          
          // 如果不是同一个文件夹，则设置为目标文件夹
          if (!isInSameFolder) {
            targetFolderId = contentFolderId;
            Logger.debug(`检测到拖拽到文件夹内容区域: ${targetFolderId}`);
          }
        }
        
        // 如果不是拖到文件夹内容区域，检查是否拖到文件夹头部
        if (!targetFolderId && folderHeaderElement) {
          const headerFolderId = folderHeaderElement.getAttribute('data-folder-id') || 
                              folderHeaderElement.id.replace('folder-', '');
          
          // 检查是否是原文件夹的头部
          if (String(headerFolderId) === originalFolderId) {
            isInSameFolder = true;
            Logger.debug(`文件拖拽到了自己所在的文件夹头部: ${headerFolderId}`);
          }
          
          // 如果不是同一个文件夹，则设置为目标文件夹
          if (!isInSameFolder) {
            targetFolderId = headerFolderId;
            Logger.debug(`检测到拖拽到文件夹头部: ${targetFolderId}`);
          }
        }
        
        // 如果在侧边栏内但没有检测到具体文件夹，认为是拖到根目录
        if (inSidebar && !targetFolderId && !isInSameFolder) {
          targetFolderId = null; // 明确设为null，表示根目录
          Logger.debug(`检测到拖拽到侧边栏非文件夹区域，视为根目录`);
        }
        
        // 如果文件在原文件夹内拖拽，但位于侧边栏区域且鼠标不在任何文件夹上
        // 这种情况下应该将文件移动到根目录
        if (isInSameFolder && inSidebar && 
            !elementsAtPoint.some(el => el.getAttribute('data-is-folder') === 'true' && 
                                el.getAttribute('data-folder-id') === originalFolderId)) {
          Logger.info(`文件虽然拖拽到原始文件夹区域,但鼠标位于侧边栏非文件夹区域,应移动到根目录`);
          isInSameFolder = false;
          targetFolderId = null; // 强制设置为根目录
        }
        
        // 如果最终没有确定目标文件夹，且在侧边栏内，设为根目录
        if (targetFolderId === undefined && inSidebar) {
          targetFolderId = null;
          Logger.debug('未找到具体目标文件夹，但在侧边栏内，默认为根目录');
        }
      }
      
      Logger.debug(`最终确定的目标:${targetFolderId !== undefined ? (targetFolderId === null ? '根目录' : targetFolderId) : '无效目标'}`);
      Logger.debug(`是否在原文件夹: ${isInSameFolder}, 原文件夹: ${originalFolderId || '根目录'}`);
      
      // 执行移动操作
      if (targetFolderId !== undefined) {
        // 修正判断逻辑：明确区分根目录和文件夹
        const isTargetRoot = targetFolderId === null;
        const isSourceRoot = draggedFile.folder_id === null || draggedFile.folder_id === undefined || 
                            draggedFile.folder_id === 0 || draggedFile.folder_id === '0' || draggedFile.folder_id === '';
        const isSameLocation = isTargetRoot ? isSourceRoot : String(targetFolderId) === String(draggedFile.folder_id);
        
        // 如果是同一个位置，跳过移动
        if (isSameLocation) {
          Logger.info(`文件已在${isTargetRoot ? '根目录' : '文件夹 ' + targetFolderId}中，跳过移动`);
        } else {
          // 移动到目标文件夹或根目录
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
      } else {
        Logger.info(`未找到有效目标，取消移动操作`);
      }
    } catch (error) {
      Logger.error('拖拽结束处理失败', error);
    }
    
    // 拖拽操作结束后，确保进行一次完整的清理
    cleanupDragState();
    Logger.endPerf('dragOperation');
  };
  
  // 额外的安全保障：如果拖拽超过10秒没有结束，强制清理
  React.useEffect(() => {
    if (!isDragging || !dragStartTime) return;
    
    const timer = setTimeout(() => {
      const dragDuration = Date.now() - dragStartTime;
      if (dragDuration > 10000) { // 10秒超时
        Logger.warn('拖拽操作超时，强制清理');
        cleanupDragState();
      }
    }, 10000);
    
    return () => clearTimeout(timer);
  }, [isDragging, dragStartTime, cleanupDragState]);
  
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
      
      {/* 添加全局样式，只在拖拽时生效 */}
      {activeFileId && (
        <style>{`
          /* ===== 文件夹内容区域容器样式 ===== */
          [id^="folder-content-"] {
            overflow: visible !important; /* 允许元素溢出以避免裁剪问题 */
            position: relative !重要;
            min-height: 20px !important;
            z-index: auto !重要;
          }
          
          /* ===== 根文件区域容器样式 ===== */
          #root-files {
            overflow: visible !important;
            position: relative !重要;
          }
          
          /* ===== 确保拖拽预览位置正确 ===== */
          .sortable-file-item {
            max-width: 100% !重要;
            transform-origin: left top !重要;
          }
          
          /* ===== 激活拖拽项样式 ===== */
          [data-dragging="true"] {
            z-index: 999 !重要;
            opacity: 0.6 !重要;
          }
          
          /* ===== 修复MUI组件可能的问题 ===== */
          .MuiListItem-root {
            overflow: visible !重要;
          }
          
          /* ===== 确保拖拽层级正确 ===== */
          body > [data-dnd-draggable="true"] {
            z-index: 9999 !重要;
            pointer-events: none !重要;
            box-shadow: 0 5px 10px rgba(0,0,0,0.15) !重要;
            opacity: 0.8 !重要;
          }
        `}</style>
      )}
    </DndContext>
  );
}
