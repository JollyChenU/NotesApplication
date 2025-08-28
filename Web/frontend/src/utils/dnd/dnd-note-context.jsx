/**
 * 文件名: dnd-note-context.jsx
 * 组件: 笔记拖拽上下文
 * 描述: 提供笔记列表的拖拽排序功能
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
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy
} from '@dnd-kit/sortable';
import { restrictToParentElement } from '@dnd-kit/modifiers';

/**
 * 笔记列表容器组件
 * @param {Array} items - 笔记项目列表
 * @param {Function} onReorder - 重新排序回调函数
 * @param {React.ReactNode} children - 子组件
 * @param {string} direction - 排序方向 ('vertical' | 'horizontal')
 */
export function NoteDndContext({ items, onReorder, children, direction = 'vertical' }) {
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
