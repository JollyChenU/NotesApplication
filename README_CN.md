# Notes 笔记应用

一个正在尝试的笔记应用，支持Markdown编辑、实时预览、笔记拖拽排序等功能。

## 功能特性

- ✨ Markdown编辑与实时预览
- 🔄 笔记拖拽排序
- 💾 自动保存
- 🎨 毛坯房的界面

## 技术栈

### 前端

### 后端

## 安装说明

### 后端设置

1. 安装Python依赖：
```bash
2. 运行Flask服务器：
```bash
服务器将在 http://127.0.0.1:5000 启动

### 前端设置

1. 进入前端目录：
```bash
2. 安装Node.js依赖：
```bash
3. 启动开发服务器：
```bash
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

├── app.py              # Flask backend application / Flask后端应用
├── requirements.txt    # Python dependencies / Python依赖
├── notes.db           # SQLite database / SQLite数据库
└── frontend/          # React frontend application / React前端应用
    ├── src/
    │   ├── App.jsx    # Main application component / 主应用组件
    │   └── main.jsx   # Application entry / 应用入口
    ├── package.json   # Node.js dependency configuration / Node.js依赖配置
    └── index.html     # HTML template / HTML模板
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