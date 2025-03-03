# Notes 笔记应用

一个正在尝试的笔记应用，支持Markdown编辑、实时预览、笔记拖拽排序等功能。

## 功能特性

- ✨ Markdown编辑与实时预览
- 🔄 笔记拖拽排序
- 💾 自动保存
- 🎨 毛坯房的界面

## 更新日志

完整的更新历史请查看：

- CHANGELOG.md (Bilingual / 双语)
- CHANGELOG_CN.md (Chinese / 中文)
- CHANGELOG_EN.md (English / 英文)

## 部署指南

如需了解Ubuntu环境下的部署说明，请查看：
- DEPLOY_UBUNTU.md

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
- React Markdown 8.0.7
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
2. 编辑笔记：直接在文本区域输入，支持Markdown语法
3. 预览：编辑区域下方实时显示Markdown渲染结果
4. 排序：通过左侧拖动手柄拖拽笔记调整顺序
5. 删除：点击笔记右上角的删除图标

## 开发特性

- 使用React Hooks进行状态管理
- 实现了防抖优化，提升输入性能
- RESTful API设计
- SQLite数据持久化
- 支持笔记实时保存
- 自定义拖拽排序实现

## 项目结构

```
Notes/
├── app.py              # Flask后端应用
├── requirements.txt    # Python依赖
├── notes.db           # SQLite数据库
├── models/            # 数据库模型
│   ├── note.py        # 笔记模型
│   └── note_file.py   # 笔记文件模型
├── routes/            # API路由
│   ├── notes.py       # 笔记路由
│   └── files.py       # 文件路由
└── frontend/          # React前端应用
    ├── src/
    │   ├── components/  # React组件
    │   ├── hooks/       # 自定义钩子
    │   ├── services/    # API服务
    │   ├── App.jsx      # 主应用组件
    │   └── main.jsx     # 应用入口
    ├── package.json     # Node.js依赖配置
    └── index.html       # HTML模板
```

## 开发计划

- [ ] 添加用户认证系统
- [ ] 支持笔记标签和分类
- [ ] 添加笔记搜索功能
- [ ] 支持图片上传
- [ ] 添加笔记分享功能
- [ ] 支持深色模式

## 贡献指南

欢迎提交Issue和Pull Request！

## 许可证

GNU通用公共许可证v3.0