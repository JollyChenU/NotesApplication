# AI Notes Application

一个集成AI功能的智能笔记应用，支持Web端和Windows桌面端。

## 项目结构

```
NotesApplication/
├── Web/                    # Web应用开发目录
│   ├── react-app/         # React + Express 全栈应用
│   │   ├── src/           # 前端源码
│   │   ├── api/           # 后端API
│   │   ├── package.json   # 依赖管理
│   │   └── ...
│   └── ...                # 其他Web项目
├── Win/                    # Windows桌面应用开发目录
│   ├── src/
│   │   ├── main/          # Electron主进程
│   │   └── renderer/      # Electron渲染进程(React)
│   ├── package.json       # 依赖管理
│   └── ...
├── .trae/                  # 项目文档和配置
├── README.md              # 项目说明
└── PRODUCT_MANUAL.md      # 产品手册
```

## 开发指南

### Web应用开发

进入Web应用目录：
```bash
cd Web/react-app
```

安装依赖：
```bash
npm install
```

启动开发服务器：
```bash
# 启动前端开发服务器
npm run dev

# 启动后端API服务器
npm run dev:api
```

构建生产版本：
```bash
npm run build
```

### Windows桌面应用开发

进入Windows应用目录：
```bash
cd Win
```

安装依赖：
```bash
npm install
```

启动开发模式：
```bash
npm run dev
```

构建应用：
```bash
# 构建当前平台
npm run build

# 构建Windows安装包
npm run dist
```

## 技术栈

### Web应用
- **前端**: React 18 + TypeScript + Vite + Tailwind CSS
- **后端**: Node.js + Express + SQLite
- **编辑器**: Monaco Editor
- **图表**: Mermaid
- **Markdown**: react-markdown + remark-gfm

### Windows应用
- **框架**: Electron + React + TypeScript
- **构建**: Vite + Electron Builder
- **样式**: Tailwind CSS
- **图标**: Lucide React

## 功能特性

- 📝 **富文本编辑**: 支持Markdown格式，代码高亮
- 🗂️ **文件夹管理**: 树形结构组织笔记
- 🤖 **AI集成**: 智能文本生成和摘要
- 📊 **图表支持**: Mermaid图表渲染
- 💾 **本地存储**: SQLite数据库
- 🌐 **跨平台**: Web端和桌面端

## 开发环境要求

- Node.js 18+
- npm 或 pnpm
- Git

## 许可证

MIT License
