/**
 * 文件名: dndWrapper.jsx
 * 组件: 拖拽包装器组件
 * 描述: 为react-beautiful-dnd和@dnd-kit提供统一的包装器接口，便于拖拽库的切换和管理
 * 功能: 拖拽上下文包装、可拖拽区域包装、拖拽项包装、库切换支持
 * 作者: Jolly Chen
 * 时间: 2024-11-20
 * 版本: 1.0.0
 * 依赖: React, react-beautiful-dnd, @dnd-kit/core
 * 许可证: Apache-2.0
 */

import React from 'react';
import {
  DragDropContext as OriginalDragDropContext, 
  Droppable as OriginalDroppable,
  Draggable as OriginalDraggable
} from 'react-beautiful-dnd';

// 包装DragDropContext，确保只有一个实例
export const DragDropContext = (props) => {
  return <OriginalDragDropContext {...props} />;
};

// 包装Droppable，使用函数参数默认值而不是defaultProps
export const Droppable = ({ 
  droppableId, 
  type = "DEFAULT", 
  direction = "vertical",
  isDropDisabled = false,
  isCombineEnabled = false,
  ignoreContainerClipping = false,
  renderClone = null,
  getContainerForClone = (() => document.body),
  children,
  ...rest
}) => {
  return (
    <OriginalDroppable
      droppableId={droppableId}
      type={type}
      direction={direction}
      isDropDisabled={isDropDisabled}
      isCombineEnabled={isCombineEnabled}
      ignoreContainerClipping={ignoreContainerClipping}
      renderClone={renderClone}
      getContainerForClone={getContainerForClone}
      {...rest}
    >
      {children}
    </OriginalDroppable>
  );
};

// 包装Draggable，使用函数参数默认值而不是defaultProps
export const Draggable = ({
  draggableId,
  index,
  isDragDisabled = false,
  disableInteractiveElementBlocking = false,
  shouldRespectForcePress = false,
  children,
  ...rest
}) => {
  return (
    <OriginalDraggable
      draggableId={draggableId}
      index={index}
      isDragDisabled={isDragDisabled}
      disableInteractiveElementBlocking={disableInteractiveElementBlocking}
      shouldRespectForcePress={shouldRespectForcePress}
      {...rest}
    >
      {children}
    </OriginalDraggable>
  );
};