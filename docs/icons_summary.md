# 项目图标使用情况汇总

本文档整理了项目中所有使用的图标组件、它们的变量命名以及使用位置。

## 图标导入情况

项目中所有图标都来自 Material-UI 的图标库 `@mui/icons-material`。

## 图标列表

### 1. Sidebar.jsx 组件中的图标

| 图标变量名 | 图标组件名 | 用途 |
| --- | --- | --- |
| `AddIcon` | `@mui/icons-material/Add` | 添加新文件按钮 |
| `MenuIcon` | `@mui/icons-material/Menu` | 侧边栏展开按钮 |
| `ChevronLeftIcon` | `@mui/icons-material/ChevronLeft` | 侧边栏折叠按钮 |

**使用位置：**
- `AddIcon`: 用于侧边栏中的添加新文件按钮
- `MenuIcon`: 当侧边栏折叠时显示的展开按钮
- `ChevronLeftIcon`: 当侧边栏展开时显示的折叠按钮

### 2. NoteList.jsx 组件中的图标

| 图标变量名 | 图标组件名 | 用途 |
| --- | --- | --- |
| `NoteDragHandle` | `@mui/icons-material/DragIndicator` | 笔记拖拽手柄 |
| `EditIcon` | `@mui/icons-material/Edit` | 编辑笔记按钮 |
| `DeleteIcon` | `@mui/icons-material/Delete` | 删除笔记按钮 |

**使用位置：**
- 这些图标用于笔记列表中每个笔记项的操作按钮

### 3. NoteEditor.jsx 组件中的图标

| 图标变量名 | 图标组件名 | 用途 |
| --- | --- | --- |
| `DragIndicatorIcon` | `@mui/icons-material/DragIndicator` | 笔记拖拽手柄 |

**使用位置：**
- 用于笔记编辑器中的拖拽功能

### 4. App.jsx 组件中的图标

| 图标变量名 | 图标组件名 | 用途 |
| --- | --- | --- |
| `AddIcon` | `@mui/icons-material/Add` | 添加按钮 |
| `DeleteIcon` | `@mui/icons-material/Delete` | 删除按钮 |

**使用位置：**
- 用于应用主界面中的添加和删除操作

## 图标重复使用情况

以下图标在多个组件中重复使用：

1. `AddIcon` - 在 Sidebar.jsx 和 App.jsx 中使用
2. `DeleteIcon` - 在 NoteList.jsx 和 App.jsx 中使用
3. `DragIndicator` 图标 - 在 NoteList.jsx 中命名为 `NoteDragHandle`，在 NoteEditor.jsx 中命名为 `DragIndicatorIcon`

## 总结

项目中总共使用了 6 种不同的 Material-UI 图标：

1. Add (添加)
2. Delete (删除)
3. Edit (编辑)
4. DragIndicator (拖拽指示器)
5. Menu (菜单)
6. ChevronLeft (向左箭头)

这些图标主要用于用户界面的交互元素，如按钮和拖拽控件。