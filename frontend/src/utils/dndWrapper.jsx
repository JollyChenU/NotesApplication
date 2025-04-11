/**
 * @author Jolly
 * @date 2025-04-01
 * @description 包装react-beautiful-dnd以避免使用废弃特性
 * @version 1.0.0
 * @license GPL-3.0
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