/**
 * 文件名: dnd-sortable.jsx
 * 组件: 可排序项组件
 * 描述: 提供可排序的拖拽项组件包装器
 * 作者: Jolly Chen
 * 时间: 2024-11-20
 * 版本: 1.2.0
 * 许可证: Apache-2.0
 */

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/**
 * 创建一个可排序项组件
 * @param {React.Component} ItemComponent - 要包装的组件
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
