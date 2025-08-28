# AI笔记软件 - Web端产品开发手册

> **版本**: v1.0  
> **创建时间**: 2025年8月28日  
> **文档类型**: Web端产品规划  
> **负责人**: JolluChen

## 📋 目录导航

- [Web端概述](#web端概述)
- [当前功能状态](#当前功能状态)
- [技术架构分析](#技术架构分析)
- [功能规划路线图](#功能规划路线图)
- [技术债务与优化](#技术债务与优化)
- [开发指南](#开发指南)

## Web端概述

### 定位与作用
Web端作为AI笔记软件的核心开发平台，承担以下职责：
- **功能原型验证**: 新功能首先在Web端实现和验证
- **技术栈统一**: 为Windows端提供可复用的前端代码
- **快速迭代**: 便于快速开发和部署测试
- **跨平台基础**: 为后续移动端等平台提供技术基础

### 目标用户场景
- 需要在浏览器中快速访问笔记的用户
- 多设备协作的临时使用场景
- 功能演示和用户体验测试
- 开发调试和新功能验证

## 当前功能状态

### ✅ 已实现功能

#### 基础笔记系统
- **Block块编辑系统**: 基于TipTap的富文本编辑器
- **实时自动保存**: 块级别的实时数据持久化
- **文件夹管理**: 层级文件夹结构支持
- **拖拽排序**: 使用DnD Kit实现的笔记重排序
- **数据库存储**: SQLite + SQLAlchemy的数据持久化

#### AI优化功能
- **内容优化**: 基于通义千问API的多类型内容优化
  - 语法优化
  - 结构优化  
  - 清晰度优化
  - 格式优化
  - 综合优化
- **AI服务架构**: LangChain + Qwen模型集成

#### 技术基础设施
- **前后端分离**: React前端 + Flask后端
- **API设计**: RESTful API设计规范
- **错误处理**: 完善的异常处理机制
- **开发工具**: Vite构建工具，热重载支持

### 🔄 进行中功能
- **错误边界优化**: ErrorBoundary组件完善
- **界面交互优化**: 用户体验持续改进
- **性能优化**: 组件渲染性能提升

### ❌ 待实现核心功能

#### 1. 本地AI模型集成 (高优先级)
**当前状态**: 使用第三方API(通义千问)  
**目标状态**: 本地RWKV模型运行  
**技术需求**:
- 后端集成RWKV推理引擎(作为后端服务的一部分)
- RWKV模型启动后一直挂在后台，通过API交互
- 默认GPU模式，无法启动时自动切换到CPU
- 用户可手动选择GPU/CPU运行模式
- 模型启动状态管理和监控
- AI开关UI控制本地模型启停
- 用户模型导入支持(仅支持RWKV系列.pth, .st格式)
- 模型文件拖拽导入、指定路径导入、路径输入导入

#### 2. 富文本功能增强 (高优先级)
**当前状态**: 基础文本编辑(基于TipTap)  
**目标状态**: 完整富文本支持  
**功能需求**:
- **Mermaid流程图渲染** (核心需求)
- 代码块语法高亮
- 表格编辑器
- 数学公式支持
- 图片粘贴和管理

#### 3. 用户账号系统 (中优先级)
**当前状态**: 无账号概念  
**目标状态**: 完整用户管理  
**功能需求**:
- 用户注册/登录界面
- JWT token管理
- 会话状态管理
- 权限控制前端

#### 4. 数据同步前端 (中优先级)
**当前状态**: 纯本地存储(SQLite + block块实时写入)  
**目标状态**: 支持云端同步  
**功能需求**:
- 基于用户账号的完全数据同步
- 同步状态指示器
- 内容合并式冲突解决界面
- 同步设置面板(是否自动同步、同步范围控制)
- 离线状态处理
- 选择性同步特定文件夹或笔记

## 技术架构分析

### 前端架构图
```
┌─────────────────────────────────────────┐
│                 React App               │
├─────────────────────────────────────────┤
│  Components Layer                       │
│  ├─ AppHeader                           │
│  ├─ NoteEditor (TipTap)                 │
│  ├─ FolderTree                          │
│  ├─ AIOptimizeDialog                    │
│  └─ ErrorBoundary                       │
├─────────────────────────────────────────┤
│  Hooks Layer                            │
│  ├─ useDragAndDrop                      │
│  ├─ useAutoSave                         │
│  └─ useAIOptimize                       │
├─────────────────────────────────────────┤
│  Services Layer                         │
│  ├─ apiService (Axios)                  │
│  ├─ noteService                         │
│  └─ folderService                       │
├─────────────────────────────────────────┤
│  Utils Layer                            │
│  ├─ dateUtils                           │
│  ├─ validationUtils                     │
│  └─ storageUtils                        │
└─────────────────────────────────────────┘
```

### 后端架构图
```
┌─────────────────────────────────────────┐
│               Flask App                 │
├─────────────────────────────────────────┤
│  API Blueprints                         │
│  ├─ /api/notes     (notes.py)           │
│  ├─ /api/files     (files.py)           │
│  ├─ /api/folders   (folders.py)         │
│  ├─ /api/ai        (ai.py)              │
│  └─ /api/health    (health.py)          │
├─────────────────────────────────────────┤
│  Services Layer                         │
│  ├─ AIOptimizationService               │
│  ├─ DataProcessor                       │
│  ├─ DataApplier                         │
│  └─ TempFileManager                     │
├─────────────────────────────────────────┤
│  Models Layer (SQLAlchemy)              │
│  ├─ Note                                │
│  ├─ NoteFile                            │
│  └─ Folder                              │
├─────────────────────────────────────────┤
│  Database Layer                         │
│  └─ SQLite + SQLAlchemy ORM             │
└─────────────────────────────────────────┘
```

### 数据流分析
```
用户操作 → React组件 → Hooks → API调用 → Flask路由 → Service层 → 数据库
    ↑                                                                ↓
用户界面 ← React更新 ← 状态管理 ← API响应 ← JSON序列化 ← 业务逻辑 ← 数据查询
```


## 功能规划路线图

### 第一阶段 (1-2个月): AI本地化改造

#### 1.1 RWKV模型集成后端
**时间**: 3周  
**任务**:
- [ ] 研究RWKV Python库集成方案
- [ ] 实现RWKV模型作为后端服务的一部分
- [ ] 模型启动后一直挂在后台，通过API交互
- [ ] 实现模型加载和推理接口
- [ ] 默认GPU模式，无法启动时自动切换到CPU逻辑
- [ ] 用户可手动选择GPU/CPU运行模式
- [ ] 模型状态管理API
- [ ] 模型导入管理(仅支持RWKV系列.pth, .st格式)

**技术细节**:
```python
# 新增服务: app/services/rwkv_service.py
class RWKVService:
    def __init__(self):
        self.model = None
        self.is_loaded = False
        self.device = 'gpu'  # 默认GPU模式
        self.auto_fallback = True  # 自动回退到CPU
        self.user_preference = None  # 用户手动选择
    
    def load_model(self, model_path: str):
        # 模型加载逻辑，支持.pth和.st格式
        pass
    
    def generate(self, prompt: str) -> str:
        # 文本生成逻辑
        pass
    
    def import_model(self, file_path: str, import_method: str):
        # 模型导入：拖拽、路径指定、路径输入
        pass
```

#### 1.2 AI控制前端界面
**时间**: 2周  
**任务**:
- [ ] AI开关组件开发(控制本地模型启停)
- [ ] 模型状态指示器
- [ ] 模型导入界面(拖拽、路径指定、路径输入)
- [ ] GPU/CPU模式手动选择
- [ ] 模型性能监控面板

**界面设计**:
```jsx
// 新增组件: AIControlPanel.jsx
<AIControlPanel>
  <AIToggle enabled={aiEnabled} onChange={handleAIToggle} />
  <ModelImporter 
    onDragDrop={handleModelDragDrop}
    onPathSelect={handlePathSelect}
    onPathInput={handlePathInput}
    supportedFormats={['.pth', '.st']}
  />
  <DeviceSelector 
    device={currentDevice} 
    autoMode={autoFallback}
    onManualSelect={handleDeviceSelect}
  />
  <ModelStatus status={modelStatus} performance={modelPerformance} />
</AIControlPanel>
```

#### 1.3 模型导入功能
**时间**: 1周  
**任务**:
- [ ] 文件拖拽上传组件
- [ ] 模型文件验证(.pth, .st)
- [ ] 模型安装进度指示
- [ ] 模型管理界面

### 第二阶段 (2-3个月): 富文本增强

#### 2.1 Mermaid图表支持
**时间**: 2周  
**任务**:
- [ ] Mermaid.js集成
- [ ] 自定义TipTap扩展开发
- [ ] 图表编辑器界面
- [ ] 图表预览功能

**技术方案**:
```jsx
// TipTap扩展: MermaidExtension
import { Node } from '@tiptap/core'
import mermaid from 'mermaid'

export const MermaidExtension = Node.create({
  name: 'mermaid',
  group: 'block',
  content: 'text*',
  parseHTML() {
    return [{ tag: 'div[data-type="mermaid"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'mermaid' }, 0]
  }
})
```

#### 2.2 代码块增强
**时间**: 1周  
**任务**:
- [ ] 语法高亮优化
- [ ] 代码语言选择器
- [ ] 复制代码功能
- [ ] 代码折叠功能

#### 2.3 表格编辑器
**时间**: 2周  
**任务**:
- [ ] 表格插入工具
- [ ] 行列增删功能
- [ ] 表格样式定制
- [ ] CSV导入导出

### 第三阶段 (3-4个月): 用户系统

#### 3.1 认证系统后端
**时间**: 2周  
**任务**:
- [ ] 用户模型设计
- [ ] JWT认证实现
- [ ] 密码加密存储
- [ ] 权限管理系统

#### 3.2 登录注册界面
**时间**: 1周  
**任务**:
- [ ] 登录表单组件
- [ ] 注册表单组件
- [ ] 密码重置流程
- [ ] 用户信息管理

#### 3.3 权限控制前端
**时间**: 1周  
**任务**:
- [ ] 路由权限守卫
- [ ] 组件权限控制
- [ ] API请求拦截器
- [ ] 登录状态管理

### 第四阶段 (4-5个月): 数据同步

#### 4.1 同步服务开发
**时间**: 3周  
**任务**:
- [ ] 增量同步算法
- [ ] 冲突检测逻辑
- [ ] 版本控制系统
- [ ] 同步队列管理

#### 4.2 同步界面开发
**时间**: 2周  
**任务**:
- [ ] 同步状态组件
- [ ] 冲突解决界面
- [ ] 同步设置面板
- [ ] 同步历史查看

## 技术债务与优化

### 当前技术债务

#### 1. 性能优化需求
**问题**: 大文件加载时前端卡顿  
**影响程度**: 中  
**解决方案**:
- 实现虚拟滚动
- 懒加载优化
- 组件级别缓存

#### 2. 错误处理完善
**问题**: 部分异常情况处理不完整  
**影响程度**: 中  
**解决方案**:
- 完善ErrorBoundary覆盖
- 统一错误提示组件
- 日志收集系统

#### 3. 测试覆盖率低
**问题**: 缺乏自动化测试  
**影响程度**: 高  
**解决方案**:
- Jest + React Testing Library
- API接口测试
- E2E测试框架

### 代码质量优化

#### 1. TypeScript迁移
**当前状态**: 使用JavaScript  
**目标状态**: 完全TypeScript化  
**迁移计划**:
- 第一步: 新组件使用TypeScript
- 第二步: 逐步迁移现有组件
- 第三步: 完善类型定义

#### 2. 组件库标准化
**当前状态**: 临时组件较多  
**目标状态**: 统一设计系统  
**优化方案**:
- Material-UI主题定制
- 公共组件抽取
- Storybook文档化

## 开发指南

### 开发环境设置

#### 前端开发
```bash
cd frontend
npm install
npm run dev  # 启动开发服务器 (http://localhost:5173)
```

#### 后端开发
```bash
cd ../
pip install -r requirements.txt
python app.py  # 启动Flask服务器 (http://localhost:5000)
```

### 代码规范

#### 组件开发规范
```jsx
// 组件模板
import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';

const ComponentName = ({ prop1, prop2 }) => {
  const [state, setState] = useState(null);

  useEffect(() => {
    // 副作用处理
  }, []);

  const handleAction = () => {
    // 事件处理
  };

  return (
    <Box>
      <Typography variant="h6">
        {/* 组件内容 */}
      </Typography>
    </Box>
  );
};

export default ComponentName;
```

#### API调用规范
```javascript
// services/apiService.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const noteService = {
  async getNotes() {
    const response = await apiClient.get('/notes');
    return response.data;
  },
  
  async createNote(noteData) {
    const response = await apiClient.post('/notes', noteData);
    return response.data;
  }
};
```

### 调试和测试

#### 前端调试
- React DevTools浏览器扩展
- 网络请求监控(DevTools Network)
- 控制台日志输出

#### 后端调试
- Flask调试模式 (`debug=True`)
- 日志文件查看 (`app_debug.log`)
- API测试工具 (Postman/Insomnia)

### 部署流程

#### 开发环境
- 前端: Vite开发服务器
- 后端: Flask开发模式
- 数据库: 本地SQLite文件

#### 生产环境
- 前端: Nginx静态文件服务
- 后端: Gunicorn + Nginx代理
- 数据库: SQLite文件备份

---

**备注**: 本文档将根据开发进度和需求变化持续更新。所有新功能开发需遵循现有的代码规范和架构设计原则。
