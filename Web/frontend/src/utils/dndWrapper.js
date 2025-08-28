/**
 * 文件名: dndWrapper.js
 * 组件: DnD包装器
 * 描述: React DnD库的包装器，提供拖拽功能的高层封装
 * 功能:
 *   - DragDropContext包装
 *   - Droppable区域封装
 *   - Draggable元素封装
 *   - 拖拽事件处理
 * 
 * 作者: Jolly
 * 创建时间: 2025-06-04
 * 最后修改: 2025-06-04
 * 修改人: Jolly
 * 版本: 1.0.0
 * 
 * 依赖:
 *   - react: React核心库
 *   - react-beautiful-dnd: 拖拽功能库
 * 
 * 许可证: Apache-2.0
 */

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
