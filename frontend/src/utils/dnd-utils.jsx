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
import { restrictToParentElement } from '@dnd-kit/modifiers';

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
    
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      position: 'relative',
      zIndex: isDragging ? 999 : 'auto',
    };
    
    return (
      <div ref={setNodeRef} style={style} {...attributes}>
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
  
  // 添加自定义属性，确保文件夹元素能被正确识别
  React.useEffect(() => {
    // 增强文件夹元素识别 - 使用更广泛的选择器
    const setupFolderElements = () => {
      // 为所有文件夹元素添加dataset属性 - 使用多种选择器确保捕获所有可能的文件夹元素
      const folderElements = document.querySelectorAll(
        '[id^="folder-"], [data-droppable-id^="folder-"], [id*="folder-content"], [class*="folder"]'
      );
      
      console.log('找到潜在文件夹元素数量:', folderElements.length);
      
      folderElements.forEach(el => {
        // 确保dataset属性被正确设置
        if (el.id && el.id.startsWith('folder-')) {
          el.dataset.droppableId = el.id;
          // 从ID中提取文件夹ID
          const folderId = el.id.replace('folder-', '');
          el.setAttribute('data-folder-id', folderId);
          console.log('设置文件夹元素属性:', {id: el.id, folderId});
        }
        
        // 确保文件夹内容区域也有正确的属性
        if (el.id && el.id.includes('folder-content-')) {
          const folderId = el.id.replace('folder-content-', '');
          el.setAttribute('data-droppable-id', `folder-${folderId}`);
          el.setAttribute('data-folder-id', folderId);
          console.log('设置文件夹内容区域属性:', {id: el.id, folderId});
        }
        
        // 确保data-folder-id属性被正确设置
        if (el.getAttribute('data-droppable-id') && !el.getAttribute('data-folder-id')) {
          const folderId = el.getAttribute('data-droppable-id').replace('folder-', '');
          el.setAttribute('data-folder-id', folderId);
          console.log('设置缺失的data-folder-id属性:', {droppableId: el.getAttribute('data-droppable-id'), folderId});
        }
        
        // 为所有文件夹相关元素添加视觉指示
        if (el.getAttribute('data-folder-id') || (el.id && (el.id.startsWith('folder-') || el.id.includes('folder-content')))) {
          // 添加一个微妙的视觉指示，表明这是可拖放区域
          el.style.transition = 'all 0.2s ease-in-out';
          
          // 添加事件监听器以提供拖放反馈
          el.addEventListener('dragover', (e) => {
            e.preventDefault();
            el.style.backgroundColor = 'rgba(63, 81, 181, 0.15)';
            el.style.boxShadow = 'inset 0 0 5px rgba(63, 81, 181, 0.3)';
          });
          
          el.addEventListener('dragleave', () => {
            el.style.backgroundColor = '';
            el.style.boxShadow = '';
          });
          
          el.addEventListener('drop', () => {
            el.style.backgroundColor = '';
            el.style.boxShadow = '';
          });
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
        console.log('检测到DOM变化，更新文件夹元素属性');
        setupFolderElements();
      }
    });
    
    // 开始观察整个文档
    observer.observe(document.body, { childList: true, subtree: true });
    
    // 清理函数
    return () => observer.disconnect();
  }, []);
  
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (!over) return;
    
    // 1. 拖放开始时记录当前拖拽的文件ID和类型
    console.log('拖放结束事件开始处理:', {
      activeId: active?.id,
      activeType: active?.data?.current?.type || '文件', // 添加类型信息
      overId: over?.id,
      overType: typeof over.id,
      isOverIdFolder: String(over.id).startsWith('folder-'),
      dragTime: new Date().toISOString()
    });
    
    // 移动到文件夹 - 处理直接拖放到文件夹ID上的情况
    if (String(over.id).startsWith('folder-')) {
      const folderId = String(over.id).replace('folder-', '');
      console.log('直接拖放到文件夹ID上:', {fileId: String(active.id), folderId});
      // 确保调用onMoveToFolder函数并传递正确的参数
      onMoveToFolder(String(active.id), folderId);
      // 强制触发一次DOM更新，确保UI状态正确重置
      setTimeout(() => {
        document.body.click(); // 模拟一次点击，帮助重置拖拽状态
      }, 50);
      return;
    }
    
    // 检查over对象的data属性是否包含文件夹信息
    if (over.data && over.data.current && over.data.current.sortable && 
        over.data.current.sortable.containerId && 
        String(over.data.current.sortable.containerId).startsWith('folder-')) {
      const folderId = String(over.data.current.sortable.containerId).replace('folder-', '');
      console.log('从over对象的sortable数据中识别到文件夹:', {fileId: String(active.id), folderId});
      onMoveToFolder(String(active.id), folderId);
      return;
    }
    
    // 即使activeId和overId相同，也继续检查是否拖放到了文件夹上
    // 这解决了将文件拖放到同一位置但实际是文件夹的情况
    
    // 检查是否拖放到了带有data-droppable-id属性的元素上
    // 使用已经声明的鼠标位置变量，避免重复声明
    
    // 修复：使用最终事件的鼠标位置
    // DnD Kit在拖放结束时可能会使用不同的事件对象
    // 增加更多位置获取方式，提高准确性
    // 声明mouseX和mouseY变量，用于存储鼠标位置
    const mouseX = (event.over?.rect?.left + event.over?.rect?.width / 2) || 
                  (event.collisions && event.collisions[0]?.data?.droppableContainer?.rect?.left) || 0;
    const mouseY = (event.over?.rect?.top + event.over?.rect?.height / 2) || 
                  (event.collisions && event.collisions[0]?.data?.droppableContainer?.rect?.top) || 0;
    
    // 使用mouseX和mouseY变量
    const finalMouseX = mouseX;
    const finalMouseY = mouseY;
    
    // 3. 添加鼠标位置的上下文信息
    console.log('拖放位置详细信息:', {
      mousePosition: { x: finalMouseX, y: finalMouseY },
      viewportSize: { width: window.innerWidth, height: window.innerHeight },
      relativePosition: { 
        x: Math.round((finalMouseX / window.innerWidth) * 100) + '%', 
        y: Math.round((finalMouseY / window.innerHeight) * 100) + '%'
      }
    });
                      
    // 如果over对象存在且ID以folder-开头，直接处理
    if (over && String(over.id).startsWith('folder-')) {
      const folderId = String(over.id).replace('folder-', '');
      console.log('直接从over对象识别到文件夹:', {fileId: String(active.id), folderId});
      onMoveToFolder(String(active.id), folderId);
      return;
    }
    
    // 特殊处理：如果activeId和overId相同，检查鼠标下方是否有文件夹元素
    if (active.id === over.id) {
      console.log('检测到拖放到相同元素:', { id: active.id, mousePos: { x: finalMouseX, y: finalMouseY } });
      // 直接获取鼠标位置下的元素
      const elementsUnderMouse = document.elementsFromPoint(finalMouseX, finalMouseY);
      
      // 查找文件夹元素
      const folderEl = elementsUnderMouse.find(el => {
        return (el.getAttribute && el.getAttribute('data-is-folder') === 'true') || 
               (el.id && el.id.startsWith('folder-')) || 
               (el.getAttribute && el.getAttribute('data-folder-id'));
      });
      
      if (folderEl) {
        let folderId;
        if (folderEl.getAttribute('data-folder-id')) {
          folderId = folderEl.getAttribute('data-folder-id');
        } else if (folderEl.id && folderEl.id.startsWith('folder-')) {
          folderId = folderEl.id.replace('folder-', '');
        } else if (folderEl.getAttribute('data-droppable-id') && 
                  folderEl.getAttribute('data-droppable-id').startsWith('folder-')) {
          folderId = folderEl.getAttribute('data-droppable-id').replace('folder-', '');
        }
        
        if (folderId) {
          console.log('在相同ID情况下找到文件夹元素:', { fileId: String(active.id), folderId });
          onMoveToFolder(String(active.id), folderId);
          return;
        }
      }
    }
    
    console.log('拖放结束事件信息:', {
      eventType: event.type,
      active: event.active?.id,
      over: event.over?.id,
      mousePosition: { x: finalMouseX, y: finalMouseY },
      hasCollisions: Boolean(event.collisions && event.collisions.length)
    });
    
    const elementsAtPoint = document.elementsFromPoint(finalMouseX, finalMouseY);
    
    // 查找拖放点下的所有元素中是否有文件夹
    // 修复：检查所有可能的文件夹标识方式，并增强调试信息
    console.log('拖放检测 - 元素列表:', elementsAtPoint.map(el => el.tagName + (el.id ? '#'+el.id : '')));
    
    // 直接检查over对象是否包含文件夹信息
    if (over && over.data && over.data.current && over.data.current.droppableId && 
        String(over.data.current.droppableId).startsWith('folder-')) {
      const folderId = String(over.data.current.droppableId).replace('folder-', '');
      console.log('从over对象数据中识别到文件夹:', {fileId: String(active.id), folderId});
      onMoveToFolder(String(active.id), folderId);
      return;
    }
    
    // 检查是否拖放到了带有data-droppable-id属性的元素上
    // 使用已经声明的鼠标位置变量，避免重复声明
    
    // 如果over对象存在且ID以folder-开头，直接处理
    if (over && String(over.id).startsWith('folder-')) {
      const folderId = String(over.id).replace('folder-', '');
      console.log('直接从over对象识别到文件夹:', {fileId: String(active.id), folderId});
      onMoveToFolder(String(active.id), folderId);
      return;
    }
    
    // 特殊处理：如果activeId和overId相同，检查鼠标下方是否有文件夹元素
    if (active.id === over.id) {
      console.log('检测到拖放到相同元素:', { id: active.id, mousePos: { x: finalMouseX, y: finalMouseY } });
      // 直接获取鼠标位置下的元素
      const elementsUnderMouse = document.elementsFromPoint(finalMouseX, finalMouseY);
      
      // 查找文件夹元素
      const folderEl = elementsUnderMouse.find(el => {
        return (el.getAttribute && el.getAttribute('data-is-folder') === 'true') || 
               (el.id && el.id.startsWith('folder-')) || 
               (el.getAttribute && el.getAttribute('data-folder-id'));
      });
      
      if (folderEl) {
        let folderId;
        if (folderEl.getAttribute('data-folder-id')) {
          folderId = folderEl.getAttribute('data-folder-id');
        } else if (folderEl.id && folderEl.id.startsWith('folder-')) {
          folderId = folderEl.id.replace('folder-', '');
        } else if (folderEl.getAttribute('data-droppable-id') && 
                  folderEl.getAttribute('data-droppable-id').startsWith('folder-')) {
          folderId = folderEl.getAttribute('data-droppable-id').replace('folder-', '');
        }
        
        if (folderId) {
          console.log('在相同ID情况下找到文件夹元素:', { fileId: String(active.id), folderId });
          onMoveToFolder(String(active.id), folderId);
          return;
        }
      }
    }
    
    // 增强文件夹元素识别逻辑
    let folderElement = null;
    let folderId = null;
    
    console.log('开始增强文件夹元素识别...', {
      draggedFileId: active?.id,
      draggedFileType: active?.data?.current?.type || '文件',
      targetTime: new Date().toISOString(),
      elementsCount: elementsAtPoint.length
    });
    
    // 第一步：尝试从elementsAtPoint中查找文件夹元素
    for (const el of elementsAtPoint) {
      // 2. 输出每个条件判断的详细结果和原始值
      // 检查dataset.droppableId
      const hasDatasetId = el.dataset && el.dataset.droppableId && el.dataset.droppableId.startsWith('folder-');
      const datasetIdValue = el.dataset?.droppableId || 'undefined';
      
      // 检查id属性
      const hasIdAttribute = el.id && el.id.startsWith('folder-');
      const idValue = el.id || 'undefined';
      
      // 检查data-droppable-id属性（直接访问）
      const hasDataAttribute = el.getAttribute && el.getAttribute('data-droppable-id') && 
                              el.getAttribute('data-droppable-id').startsWith('folder-');
      const dataAttributeValue = el.getAttribute ? el.getAttribute('data-droppable-id') : 'undefined';
      
      // 检查data-is-folder属性（直接标记）
      const hasIsFolderAttribute = el.getAttribute && el.getAttribute('data-is-folder') === 'true';
      const isFolderValue = el.getAttribute ? el.getAttribute('data-is-folder') : 'undefined';
      
      // 检查data-folder-id属性（直接标记）
      const hasFolderIdAttribute = el.getAttribute && el.getAttribute('data-folder-id');
      const folderIdValue = el.getAttribute ? el.getAttribute('data-folder-id') : 'undefined';
      
      // 检查class名称
      const hasFolderClass = el.className && typeof el.className === 'string' && el.className.includes('folder');
      const classNameValue = el.className || 'undefined';
      
      // 4. 输出完整的元素属性和数据集
      console.log(`检查元素 ${el.tagName}#${el.id || 'no-id'} 是否为文件夹:`, {
        条件结果: {
          hasDatasetId,
          hasIdAttribute,
          hasDataAttribute,
          hasIsFolderAttribute,
          hasFolderIdAttribute,
          hasFolderClass
        },
        原始值: {
          datasetId: datasetIdValue,
          id: idValue,
          dataAttribute: dataAttributeValue,
          isFolder: isFolderValue,
          folderId: folderIdValue,
          className: classNameValue
        }
      });
      
      if (hasDatasetId || hasIdAttribute || hasDataAttribute || hasIsFolderAttribute || hasFolderIdAttribute || hasFolderClass) {
        folderElement = el;
        
        // 提取文件夹ID
        if (hasDatasetId) {
          folderId = el.dataset.droppableId.replace('folder-', '');
        } else if (hasIdAttribute) {
          folderId = el.id.replace('folder-', '');
        } else if (hasDataAttribute) {
          folderId = el.getAttribute('data-droppable-id').replace('folder-', '');
        } else if (hasFolderIdAttribute) {
          folderId = el.getAttribute('data-folder-id');
        }
        
        // 5. 明确输出最终判断结果
        console.log('找到文件夹元素:', {
          element: el.tagName + (el.id ? '#'+el.id : ''),
          folderId,
          匹配条件: {
            hasDatasetId,
            hasIdAttribute,
            hasDataAttribute,
            hasIsFolderAttribute,
            hasFolderIdAttribute,
            hasFolderClass
          },
          elementRect: el.getBoundingClientRect ? {
            top: Math.round(el.getBoundingClientRect().top),
            left: Math.round(el.getBoundingClientRect().left),
            width: Math.round(el.getBoundingClientRect().width),
            height: Math.round(el.getBoundingClientRect().height)
          } : 'N/A',
          relativeToMouse: el.getBoundingClientRect ? {
            x: Math.round(finalMouseX - el.getBoundingClientRect().left),
            y: Math.round(finalMouseY - el.getBoundingClientRect().top)
          } : 'N/A'
        });
        
        break; // 找到第一个匹配的元素后停止
      }
    }
    
    // 如果没有找到，尝试查找所有包含folder字符串的元素
    if (!folderElement) {
      for (const el of elementsAtPoint) {
        if ((el.id && el.id.includes('folder')) ||
            (el.className && typeof el.className === 'string' && el.className.includes('folder'))) {
          
          // 尝试从id提取文件夹ID
          if (el.id && el.id.includes('folder-')) {
            const match = el.id.match(/folder-(\d+)/);
            if (match && match[1]) {
              folderElement = el;
              folderId = match[1];
              console.log('从ID中提取到文件夹ID:', folderId);
              break;
            }
          }
          
          // 尝试从data-droppable-id属性提取
          if (el.getAttribute && el.getAttribute('data-droppable-id') && 
              el.getAttribute('data-droppable-id').includes('folder-')) {
            const attrValue = el.getAttribute('data-droppable-id');
            const match = attrValue.match(/folder-(\d+)/);
            if (match && match[1]) {
              folderElement = el;
              folderId = match[1];
              console.log('从data-droppable-id属性中提取到文件夹ID:', folderId);
              break;
            }
          }
        }
      }
    }
    
    // 增强调试信息，帮助排查问题
    console.log('拖放检测:', {
      // 限制输出数量，避免日志过多
      elementsAtPoint: elementsAtPoint.slice(0, 5).map(el => ({
        tagName: el.tagName,
        id: el.id,
        className: el.className,
        dataset: el.dataset,
        droppableId: el.dataset?.droppableId,
        rect: el.getBoundingClientRect ? {
          top: Math.round(el.getBoundingClientRect().top),
          left: Math.round(el.getBoundingClientRect().left),
          width: Math.round(el.getBoundingClientRect().width),
          height: Math.round(el.getBoundingClientRect().height)
        } : 'N/A',
        attributes: el.getAttribute ? {
          'data-droppable-id': el.getAttribute('data-droppable-id'),
          'data-folder-id': el.getAttribute('data-folder-id'),
          'data-is-folder': el.getAttribute('data-is-folder'),
          'id': el.getAttribute('id')
        } : 'N/A'
      })),
      elementsCount: elementsAtPoint.length,
      mousePosition: { x: mouseX, y: mouseY },
      folderElement: folderElement ? {
        tagName: folderElement.tagName,
        id: folderElement.id,
        className: folderElement.className,
        dataset: folderElement.dataset,
        rect: folderElement.getBoundingClientRect ? {
          top: Math.round(folderElement.getBoundingClientRect().top),
          left: Math.round(folderElement.getBoundingClientRect().left),
          width: Math.round(folderElement.getBoundingClientRect().width),
          height: Math.round(folderElement.getBoundingClientRect().height)
        } : 'N/A'
      } : null
    });
    
    // 如果没有找到文件夹元素，尝试更宽松的匹配
    if (!folderElement) {
      console.log('开始尝试更宽松的匹配...');
      console.log('可用元素列表:', elementsAtPoint.map(el => ({
        tagName: el.tagName,
        id: el.id || 'no-id',
        className: el.className || 'no-class',
        dataAttributes: {
          'data-folder-id': el.getAttribute ? el.getAttribute('data-folder-id') : 'N/A',
          'data-droppable-id': el.getAttribute ? el.getAttribute('data-droppable-id') : 'N/A',
          'data-folder-content': el.getAttribute ? el.getAttribute('data-folder-content') : 'N/A',
          'data-is-folder': el.getAttribute ? el.getAttribute('data-is-folder') : 'N/A'
        }
      })));
      
      // 优先检查data-is-folder属性
      if (!folderElement) {
        console.log('尝试查找带有data-is-folder属性的元素...');
        for (const el of elementsAtPoint) {
          if (el.getAttribute && el.getAttribute('data-is-folder') === 'true') {
            folderElement = el;
            folderId = el.getAttribute('data-folder-id');
            console.log('找到带有data-is-folder属性的文件夹元素:', {element: el.tagName, folderId});
            break;
          }
        }
      }
      
      // 如果没有找到文件夹元素，尝试查找所有包含folder-content的元素
      if (!folderElement) {
        console.log('尝试查找folder-content元素...');
        for (const el of elementsAtPoint) {
          if (el.id && el.id.includes('folder-content-')) {
            const folderId = el.id.replace('folder-content-', '');
            folderElement = el;
            console.log('找到文件夹内容区域:', {id: el.id, folderId});
            break;
          }
        }
      }
      
      // 如果没有找到文件夹元素，尝试更宽松的匹配
      if (!folderElement) {
        console.log('未找到文件夹元素，尝试更宽松的匹配...');
        
        // 详细记录所有元素的属性
        console.log('拖放位置的所有元素详细信息:');
        elementsAtPoint.forEach((el, index) => {
          console.log(`元素[${index}]:`, {
            tagName: el.tagName,
            id: el.id || 'no-id',
            className: el.className || 'no-class',
            dataFolderId: el.getAttribute ? el.getAttribute('data-folder-id') : 'N/A',
            dataDroppableId: el.getAttribute ? el.getAttribute('data-droppable-id') : 'N/A',
            dataFolderContent: el.getAttribute ? el.getAttribute('data-folder-content') : 'N/A',
            hasFolder: el.id ? el.id.includes('folder') : false,
            rect: el.getBoundingClientRect ? {
              top: el.getBoundingClientRect().top,
              left: el.getBoundingClientRect().left,
              width: el.getBoundingClientRect().width,
              height: el.getBoundingClientRect().height
            } : 'N/A'
          });
        });
        
        // 尝试查找所有可能的文件夹相关元素
        for (const el of elementsAtPoint) {
          // 检查是否有任何与文件夹相关的类名或属性
          const isFolder = (
            (el.className && typeof el.className === 'string' && el.className.includes('folder')) ||
            (el.getAttribute && el.getAttribute('data-folder-id')) ||
            (el.getAttribute && el.getAttribute('data-droppable-id') && el.getAttribute('data-droppable-id').includes('folder-')) ||
            (el.id && (el.id.includes('folder-') || el.id.includes('folder-content-')))
          );
          
          console.log('检查元素是否为文件夹:', {
            tagName: el.tagName,
            id: el.id || 'no-id',
            isFolder: isFolder,
            条件1: el.className && typeof el.className === 'string' && el.className.includes('folder'),
            条件2: el.getAttribute && el.getAttribute('data-folder-id'),
            条件3: el.getAttribute && el.getAttribute('data-droppable-id') && el.getAttribute('data-droppable-id').includes('folder-'),
            条件4: el.id && (el.id.includes('folder-') || el.id.includes('folder-content-'))
          });
          
          if (isFolder) {
            // 尝试从各种可能的属性中提取文件夹ID
            let extractedId = null;
            
            // 从data-folder-id属性提取
            if (el.getAttribute && el.getAttribute('data-folder-id')) {
              extractedId = el.getAttribute('data-folder-id');
              console.log('从data-folder-id提取ID:', extractedId);
            }
            // 从data-droppable-id属性提取
            else if (el.getAttribute && el.getAttribute('data-droppable-id') && 
                     el.getAttribute('data-droppable-id').includes('folder-')) {
              extractedId = el.getAttribute('data-droppable-id').replace('folder-', '');
              console.log('从data-droppable-id提取ID:', extractedId);
            }
            // 从id属性提取
            else if (el.id) {
              if (el.id.includes('folder-content-')) {
                extractedId = el.id.replace('folder-content-', '');
                console.log('从folder-content-id提取ID:', extractedId);
              } else if (el.id.includes('folder-')) {
                extractedId = el.id.replace('folder-', '');
                console.log('从folder-id提取ID:', extractedId);
              }
            }
            
            if (extractedId) {
              folderElement = el;
              folderId = extractedId;
              console.log('使用宽松匹配找到文件夹元素:', {
                element: el.tagName + (el.id ? '#'+el.id : ''),
                folderId,
                source: 'relaxed-matching'
              });
              break;
            } else {
              console.log('元素符合文件夹条件但无法提取ID');
            }
          }
        }
        
        if (!folderElement) {
          console.log('未找到文件夹元素，尝试更宽松的匹配...');
          console.log('DOM结构分析:', {
            elementsCount: elementsAtPoint.length,
            possibleFolderElements: elementsAtPoint.filter(el => 
              (el.className && typeof el.className === 'string' && el.className.includes('folder')) ||
              (el.id && el.id.includes('folder'))
            ).map(el => ({
              tagName: el.tagName,
              id: el.id || 'no-id',
              className: el.className || 'no-class',
              attributes: el.getAttributeNames ? Array.from(el.getAttributeNames()).reduce((acc, name) => {
                acc[name] = el.getAttribute(name);
                return acc;
              }, {}) : 'N/A'
            }))
          });
        }
      }
    }
    
    // 如果找到了文件夹元素和文件夹ID
    if (folderElement && folderId) {
      // 确保folderId不为null或undefined
      if (folderId === null || folderId === undefined) {
        console.error('找到文件夹元素但folderId为空');
        // 尝试从元素中再次提取folderId
        if (folderElement.getAttribute && folderElement.getAttribute('data-folder-id')) {
          folderId = folderElement.getAttribute('data-folder-id');
          console.log('从元素属性中重新提取folderId:', folderId);
        } else if (folderElement.id && folderElement.id.includes('folder-')) {
          folderId = folderElement.id.replace(/folder-|folder-content-/g, '');
          console.log('从元素ID中重新提取folderId:', folderId);
        }
      }
      
      // 再次检查folderId是否有效
      if (!folderId) {
        console.error('无法提取有效的文件夹ID');
        return;
      }
      
      // 尝试将folderId转换为数字
      const numericFolderId = parseInt(folderId, 10);
      // 如果转换成功且不是NaN，使用数字类型的folderId
      if (!isNaN(numericFolderId)) {
        folderId = numericFolderId;
      }
      
      // 5. 明确输出最终判断结果和执行的操作
      console.log('准备移动文件到文件夹:', {
        fileId: String(active.id),
        folderId,
        folderElementType: folderElement.tagName,
        folderElementId: folderElement.id || 'no-id',
        操作类型: '文件移动到文件夹',
        操作时间: new Date().toISOString()
      });
      
      // 确保调用onMoveToFolder函数并传递正确的参数
      try {
        onMoveToFolder(String(active.id), folderId);
        console.log('文件移动操作执行结果:', {
          fileId: String(active.id),
          folderId,
          操作状态: '成功',
          完成时间: new Date().toISOString()
        });
        
        // 强制触发一次DOM更新，确保UI状态正确重置
        setTimeout(() => {
          console.log('延迟重置拖拽状态');
          document.body.click(); // 模拟一次点击，帮助重置拖拽状态
          
          // 延迟后再次触发展开文件夹事件，确保文件夹保持展开状态
          setTimeout(() => {
            console.log('再次触发展开文件夹事件:', folderId);
            document.dispatchEvent(new CustomEvent('expandFolder', { 
              detail: { folderId },
              bubbles: true,
              cancelable: true
            }));
          }, 150);
        }, 100);
        
        return; // 重要：成功处理后立即返回，不执行后续的重排序逻辑
      } catch (error) {
        console.error('调用onMoveToFolder函数失败:', error);
      }
    } else if (folderElement) {
      console.error('找到文件夹元素但无法提取有效的文件夹ID');
    }
    
    // 重新排序
    if (active.id !== over.id) {
      const oldIndex = files.findIndex(file => String(file.id) === String(active.id));
      const newIndex = files.findIndex(file => String(file.id) === String(over.id));
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newFiles = arrayMove(files, oldIndex, newIndex);
        onReorder(newFiles);
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
        items={files.map(file => String(file.id))}
        strategy={verticalListSortingStrategy}
      >
        {children}
      </SortableContext>
    </DndContext>
  );
}
