# Notes - A Modern Note-Taking Application
# Notes 笔记应用

A note-taking application in development that supports Markdown editing, real-time preview, and note drag-and-drop sorting.

一个正在尝试的笔记应用，支持Markdown编辑、实时预览、笔记拖拽排序等功能。

## Features
## 功能特性

- ✨ Markdown editing with real-time preview
- 🔄 Note drag-and-drop sorting
- 💾 Auto-save functionality
- 🎨 Basic interface

- ✨ Markdown编辑与实时预览
- 🔄 笔记拖拽排序
- 💾 自动保存
- 🎨 毛坯房的界面

## Changelog
## 更新日志

For detailed update history, please check:
完整的更新历史请查看：

- CHANGELOG.md (Bilingual / 双语)
- CHANGELOG_CN.md (Chinese / 中文)
- CHANGELOG_EN.md (English / 英文)

## How to Run
## 如何运行

1. Start backend server:<br>启动后端服务器：
```bash
python app.py
```

2. Enter the `frontend` directory then start the frontend application:<br>先进入 `frontend` 目录再启动前端应用：
```bash
cd frontend
npm run dev
```

3. Open browser and visit:<br>打开浏览器访问：
http://localhost:5173

## Technology Stack
## 技术栈

### Frontend
### 前端

- React 18.2.0
- Material-UI (MUI) 5.13.0
- React Markdown 8.0.7
- React Beautiful DnD 13.1.1
- Axios 1.4.0
- Vite 4.3.5

### Backend
### 后端

- Flask 2.0.1
- Flask-CORS 3.0.10
- SQLAlchemy 1.4.23
- Flask-SQLAlchemy 2.5.1
- SQLite

## Installation
## 安装说明

### Backend Setup
### 后端设置

1. Install Python dependencies:<br>安装Python依赖：
```bash
pip install -r requirements.txt
```

2. Run Flask server:<br>运行Flask服务器：
```bash
python app.py
```
Server will start at http://127.0.0.1:5000
服务器将在 http://127.0.0.1:5000 启动

### Frontend Setup
### 前端设置

1. Enter frontend directory:<br>进入前端目录：
```bash
cd frontend
```

2. Install Node.js dependencies:<br>安装Node.js依赖：
```bash
npm install
```

3. Start development server:<br>启动开发服务器：
```bash
npm run dev
```
Application will start at http://localhost:5173
应用将在 http://localhost:5173 启动

## Usage Guide
## 使用说明

1. Create note: Click the "+" button in the top right corner
2. Edit note: Input directly in the text area, supporting Markdown syntax
3. Preview: Markdown rendering results are displayed in real-time below the editing area
4. Sort: Drag notes using the handle on the left to adjust order
5. Delete: Click the delete icon in the top right corner of the note

1. 创建笔记：点击右上角的"+"按钮
2. 编辑笔记：直接在文本区域输入，支持Markdown语法
3. 预览：编辑区域下方实时显示Markdown渲染结果
4. 排序：通过左侧拖动手柄拖拽笔记调整顺序
5. 删除：点击笔记右上角的删除图标

## Development Features
## 开发特性

- React Hooks for state management
- Debounce optimization for improved input performance
- RESTful API design
- SQLite data persistence
- Real-time note saving
- Custom drag-and-drop sorting implementation

- 使用React Hooks进行状态管理
- 实现了防抖优化，提升输入性能
- RESTful API设计
- SQLite数据持久化
- 支持笔记实时保存
- 自定义拖拽排序实现

## Project Structure
## 项目结构

```
Notes/
├── app.py              # Flask backend application / Flask后端应用
├── requirements.txt    # Python dependencies / Python依赖
├── notes.db           # SQLite database / SQLite数据库
├── models/            # Database models / 数据库模型
│   ├── note.py        # Note model / 笔记模型
│   └── note_file.py   # Note file model / 笔记文件模型
├── routes/            # API routes / API路由
│   ├── notes.py       # Note routes / 笔记路由
│   └── files.py       # File routes / 文件路由
└── frontend/          # React frontend application / React前端应用
    ├── src/
    │   ├── components/  # React components / React组件
    │   ├── hooks/       # Custom hooks / 自定义钩子
    │   ├── services/    # API services / API服务
    │   ├── App.jsx      # Main application component / 主应用组件
    │   └── main.jsx     # Application entry / 应用入口
    ├── package.json     # Node.js dependency configuration / Node.js依赖配置
    └── index.html       # HTML template / HTML模板
```

## Development Plans
## 开发计划

- [ ] Add user authentication system
- [ ] Support note tags and categories
- [ ] Add note search functionality
- [ ] Support image upload
- [ ] Add note sharing functionality
- [ ] Support dark mode

- [ ] 添加用户认证系统
- [ ] 支持笔记标签和分类
- [ ] 添加笔记搜索功能
- [ ] 支持图片上传
- [ ] 添加笔记分享功能
- [ ] 支持深色模式

## Contribution Guide
## 贡献指南

Issues and Pull Requests are welcome!
欢迎提交Issue和Pull Request！

## License
## 许可证

GNU General Public License v3.0
GNU通用公共许可证v3.0