# Notes 笔记应用

一个现代化的笔记应用，支持富文本编辑、Markdown语法、实时预览、笔记拖拽排序等功能。

## 功能特性

- ✨ 富文本编辑与Markdown语法支持
- 🔄 笔记拖拽排序
- 💾 自动保存
- 🎨 简洁现代的界面

## 文档资源

完整的更新历史请查看：

- [CHANGELOG.md](CHANGELOG.md) (双语)
- [CHANGELOG_CN.md](CHANGELOG_CN.md) (中文)
- [CHANGELOG_EN.md](CHANGELOG_EN.md) (英文)



部署说明请查看：

- [DEPLOY_UBUNTU.md](DEPLOY_UBUNTU.md) - Ubuntu部署指南
- [DOCKER_DEPLOY.md](DOCKER_DEPLOY.md) - Docker部署指南



其他文档资源：

- [ERROR_LOG.md](ERROR_LOG.md) - 常见错误解决方案
- [icons_summary.md](icons_summary.md) - 图标使用概览
- [git-operations.md](git-operations.md) - Git操作指南
- [Unfinished_Features.md](Unfinished_Features.md) - 未完成功能清单

## 如何运行

1. 启动后端服务器：
```bash
python app.py
```

2. 先进入 `frontend` 目录再启动前端应用：
```bash
cd frontend
npm run dev
```

3. 打开浏览器访问：
http://localhost:5173

## 技术栈

### 前端

- React 18.2.0
- Material-UI (MUI) 5.13.0
- TipTap 编辑器 2.11.5
- React Beautiful DnD 13.1.1
- Axios 1.4.0
- Vite 4.3.5

### 后端

- Flask 2.0.1
- Flask-CORS 3.0.10
- SQLAlchemy 1.4.23
- Flask-SQLAlchemy 2.5.1
- SQLite

## 安装说明

### 后端设置

1. 安装Python依赖：
```bash
pip install -r requirements.txt
```

2. 运行Flask服务器：
```bash
python app.py
```
服务器将在 http://127.0.0.1:5000 启动

### 前端设置

1. 进入前端目录：
```bash
cd frontend
```

2. 安装Node.js依赖：
```bash
npm install
```

3. 启动开发服务器：
```bash
npm run dev
```
应用将在 http://localhost:5173 启动

## 使用说明

1. 创建笔记：点击右上角的"+"按钮
2. 编辑笔记：直接在文本区域输入，支持富文本编辑和Markdown语法
3. 格式转换：可以通过右键菜单将笔记转换为不同格式（文本、标题、列表、引用等）
4. 排序：通过左侧拖动手柄拖拽笔记调整顺序
5. 删除：点击笔记右上角的删除图标或使用右键菜单

## 开发特性

- 使用React Hooks进行状态管理
- 集成TipTap编辑器，支持富文本编辑和Markdown语法
- 实现了防抖优化，提升输入性能
- RESTful API设计
- SQLite数据持久化
- 支持笔记实时保存
- 自定义拖拽排序实现
- 支持多种笔记格式（文本、标题、列表、引用等）

## 项目结构

```
NotesApplication/
├── app.py                 # Flask后端应用入口
├── LICENSE                # 许可证文件
├── docker-compose.yml     # Docker Compose配置文件
├── Dockerfile             # Docker配置文件
├── notes.db               # SQLite数据库文件
├── requirements.txt       # Python依赖
├── package.json           # 根目录Node.js依赖
├── README.md              # 项目主文档
├── app_debug.log          # 应用调试日志
├── app/                   # 应用主目录
│   ├── __init__.py        # 包初始化和应用工厂
│   ├── extensions.py      # 扩展实例化
│   ├── api/               # API路由模块
│   │   ├── __init__.py    # 路由包初始化
│   │   ├── files.py       # 文件路由
│   │   ├── notes.py       # 笔记路由
│   │   ├── folders.py     # 文件夹路由
│   │   └── health.py      # 健康检查路由
│   ├── config/            # 配置模块
│   │   ├── __init__.py    # 配置包初始化
│   │   └── config.py      # 配置定义
│   ├── models/            # 数据库模型
│   │   ├── __init__.py    # 模型包初始化
│   │   ├── note.py        # 笔记模型
│   │   ├── note_file.py   # 笔记文件模型
│   │   └── folder.py      # 文件夹模型
│   ├── services/          # 业务服务
│   │   └── __init__.py    # 服务包初始化
│   └── utils/             # 工具函数
│       └── __init__.py    # 工具包初始化
├── docs/                  # 文档目录
│   ├── CHANGELOG.md       # 双语更新日志
│   ├── CHANGELOG_CN.md    # 中文更新日志
│   ├── CHANGELOG_EN.md    # 英文更新日志
│   ├── DEPLOY_UBUNTU.md   # Ubuntu部署指南
│   ├── DOCKER_DEPLOY.md   # Docker部署指南
│   ├── ERROR_LOG.md       # 错误日志
│   ├── git-operations.md  # Git操作指南
│   ├── icons_summary.md   # 图标使用汇总
│   ├── OnePage_Propsal_EN.md # 英文提案
│   ├── PPT_Content_Description.md # PPT内容描述
│   ├── PPT_Outline.md     # PPT大纲
│   ├── README_CN.md       # 中文README
│   ├── README_EN.md       # 英文README
│   └── Unfinished_Features.md # 未完成功能
├── frontend/              # React前端应用
│   ├── index.html         # HTML模板
│   ├── Dockerfile         # 前端Docker配置
│   ├── nginx.conf         # Nginx配置
│   ├── package.json       # Node.js依赖配置
│   ├── vite.config.js     # Vite配置
│   └── src/               # 源代码
│       ├── App.jsx        # 主应用组件
│       ├── index.css      # 主CSS文件
│       ├── main.jsx       # 应用入口
│       ├── components/    # React组件
│       │   ├── NoteEditor.jsx    # 笔记编辑器组件
│       │   ├── NoteList.jsx      # 笔记列表组件
│       │   ├── Sidebar.jsx       # 侧边栏组件
│       │   └── TipTapEditor.jsx  # TipTap编辑器组件
│       ├── hooks/         # 自定义钩子
│       │   ├── useDragAndDrop.js       # 拖放钩子
│       │   └── useFileDragAndDrop.js   # 文件拖放钩子
│       ├── services/      # API服务
│       │   └── noteService.js    # 笔记服务
│       └── utils/         # 工具函数
│           ├── dnd-utils.jsx       # 拖放工具
│           ├── dndkit-installer.jsx # DnD工具安装器
│           ├── dndWrapper.js        # DnD包装器
│           └── dndWrapper.jsx        # DnD JSX包装器
├── tests/                # 测试目录
│   └── test_app.py       # 应用测试
└── tools/                # 工具脚本
    └── sync_docs.py      # 文档同步工具
```

## 开发计划

### 优化功能

- [x] 优化笔记块在页面内的自适应宽度显示
- [x] 优化编辑功能，支持富文本编辑和Markdown语法
- [ ] 进一步优化TipTap编辑器的性能和用户体验

### 新增功能

- [x] 支持多种笔记格式（文本、标题、列表、引用等）
- [ ] 新增左侧建立笔记文件夹功能
- [ ] 添加用户认证系统
- [ ] 支持笔记标签和分类
- [ ] 添加笔记搜索功能
- [ ] 支持图片上传和管理
- [ ] 添加笔记分享功能
- [ ] 支持深色模式

## 贡献指南

欢迎提交Issue和Pull Request！

## 许可证

Apache 许可证 2.0 版本