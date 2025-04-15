# 项目图标使用情况汇总

本文档整理了项目中所有使用的图标组件、它们的变量命名以及使用位置。

## 图标导入情况

当前项目主要从 Material-UI 的图标库导入图标组件：

```jsx
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import DescriptionIcon from '@mui/icons-material/Description';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import MoreVertIcon from '@mui/icons-material/MoreVert';
```

## 图标列表

### 1. Sidebar.jsx 组件中的图标

| 图标变量名 | 图标组件名 | 用途 |
| --- | --- | --- |
| `FolderIcon` | `@mui/icons-material/Folder` | 关闭状态的文件夹图标 |
| `FolderOpenIcon` | `@mui/icons-material/FolderOpen` | 打开状态的文件夹图标 |
| `DescriptionIcon` | `@mui/icons-material/Description` | 文件图标 |
| `ExpandLess` | `@mui/icons-material/ExpandLess` | 文件夹收起指示器 |
| `ExpandMore` | `@mui/icons-material/ExpandMore` | 文件夹展开指示器 |
| `AddIcon` | `@mui/icons-material/Add` | 新建文件按钮 |
| `CreateNewFolderIcon` | `@mui/icons-material/CreateNewFolder` | 新建文件夹按钮 |
| `MoreVertIcon` | `@mui/icons-material/MoreVert` | 文件夹菜单按钮 |

**使用位置：**
- 侧边栏文件和文件夹导航
- 文件夹展开/收起控制
- 新建文件和文件夹操作
- 文件夹上下文菜单

### 2. NoteList.jsx 组件中的图标

| 图标变量名 | 图标组件名 | 用途 |
| --- | --- | --- |
| `DeleteIcon` | `@mui/icons-material/Delete` | 笔记删除按钮 |
| `DragIndicatorIcon` | `@mui/icons-material/DragIndicator` | 笔记拖拽手柄 |

**使用位置：**
- 笔记项中的拖拽和删除操作

### 3. NoteEditor.jsx 组件中的图标

| 图标变量名 | 图标组件名 | 用途 |
| --- | --- | --- |
| `DragIndicatorIcon` | `@mui/icons-material/DragIndicator` | 笔记拖拽手柄 |

**使用位置：**
- 用于笔记编辑器中的拖拽功能

### 4. App.jsx 组件中的图标

| 图标变量名 | 图标组件名 | 用途 |
| --- | --- | --- |
| `AddIcon` | `@mui/icons-material/Add` | 添加笔记按钮 |
| `DeleteIcon` | `@mui/icons-material/Delete` | 删除按钮 |

**使用位置：**
- 用于应用主界面中的添加和删除操作

## 图标重复使用情况

| 图标变量名 | 重复使用的组件 |
| --- | --- |
| `AddIcon` | App.jsx, Sidebar.jsx |
| `DeleteIcon` | App.jsx, NoteList.jsx |
| `DragIndicatorIcon` | NoteList.jsx, NoteEditor.jsx |

## 总结

项目中大量使用 Material-UI 图标库，保持了界面风格的一致性。主要用途集中在：

1. 导航和层次结构显示（文件夹图标、展开/收起图标）
2. 操作指示（添加、删除图标）
3. 交互控制（拖拽手柄、菜单按钮）

随着项目功能的扩展，建议继续使用 Material-UI 图标库保持界面一致性，特别是在添加用户认证、分享和设置等功能时。