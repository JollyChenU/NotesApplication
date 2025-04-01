<!--
 * @author Jolly
 * @date 2025-04-01
 * @description Git操作指南，用于团队协作开发
 * @version 1.0.0
 * @license GPL-3.0
-->

# Git 操作指南

本文档提供了团队协作开发时常用的Git操作步骤和最佳实践，确保代码库的一致性和稳定性。

## 目录

1. [基础配置](#基础配置)
2. [分支管理](#分支管理)
3. [代码提交](#代码提交)
4. [远程同步](#远程同步)
5. [冲突解决](#冲突解决)
6. [工作流程](#工作流程)
7. [完整工作流程示例](#完整工作流程示例)

## 基础配置

### 设置用户信息

```bash
# 设置全局用户名和邮箱
git config --global user.name "你的名字"
git config --global user.email "你的邮箱"

# 设置项目级别用户名和邮箱（仅对当前项目有效）
git config user.name "你的名字"
git config user.email "你的邮箱"
```

### 检出代码库

```bash
# 克隆代码库
git clone https://github.com/JolluChen/NotesApplication.git

# 进入项目目录
cd NotesApplication
```

## 分支管理

### 分支命名规范

- `main` - 主分支，稳定版本
- `dev` - 开发分支，最新开发版本
- `feature/xxx` - 功能分支，如 `feature/markdown-editor`
- `fix/xxx` - 修复分支，如 `fix/login-bug`
- `release/x.x.x` - 发布分支，如 `release/1.0.0`

### 查看分支

```bash
# 查看本地分支
git branch

# 查看所有分支（包括远程分支）
git branch -a
```

### 创建分支

```bash
# 基于当前分支创建新分支
git branch feature/new-feature

# 创建并切换到新分支
git checkout -b feature/new-feature

# 基于特定分支创建新分支
git checkout -b feature/new-feature origin/dev
```

### 切换分支

```bash
# 切换到指定分支
git checkout dev

# 切换到新的远程分支
git checkout -b feature/remote-feature origin/feature/remote-feature
```

### 删除分支

```bash
# 删除本地分支
git branch -d feature/old-feature

# 强制删除未合并的分支
git branch -D feature/old-feature

# 删除远程分支
git push origin --delete feature/old-feature
```

## 代码提交

### 检查状态

```bash
# 查看工作区状态
git status
```

### 添加文件到暂存区

```bash
# 添加单个文件
git add path/to/file

# 添加多个文件
git add file1 file2

# 添加所有变更
git add .
```

### 提交更改

```bash
# 提交已暂存的更改
git commit -m "描述性的提交信息"

# 跳过暂存区，直接提交所有更改
git commit -a -m "描述性的提交信息"
```

### 提交信息规范

- 使用现在时态（"Add feature"，不是"Added feature"）
- 第一行是简短摘要（不超过50个字符）
- 使用空行分隔摘要和详细描述
- 描述内容应该说明做了什么和为什么，而不是如何做的

## 完整工作流程示例

本节通过一个完整示例，展示从功能开发到合并上线的全流程Git操作。

### 场景：实现笔记编辑器的Markdown支持功能

#### 1. 更新本地仓库

首先确保本地仓库是最新的：

```bash
# 切换到主开发分支
git checkout dev

# 拉取最新更改
git pull origin dev
```

#### 2. 创建功能分支

```bash
# 创建并切换到功能分支
git checkout -b feature/markdown-support
```

#### 3. 进行开发

现在在你的功能分支上进行开发工作。例如修改以下文件：

```bash
# 开发过程中查看修改状态
git status
```

输出：

#### 4. 提交修改
```bash
# 添加所有更改到暂存区
git add .

# 或者选择性地添加文件
git add frontend/src/components/TipTapEditor.jsx
git add frontend/src/components/NoteEditor.jsx
git add frontend/src/utils/markdownUtils.js
```
```bash
# 提交更改
git commit -m "添加Markdown语法支持和实时预览功能"
```

#### 5. 与开发分支保持同步
在完成功能开发后，确保你的分支与最新的开发分支兼容：
```bash
# 获取最新的开发分支
git fetch origin dev

# 基于最新的开发分支变基你的功能分支
git rebase origin/dev
```
如果出现冲突，解决冲突：
```# 解决冲突后标记为已解决
git add <冲突文件>

# 继续变基过程
git rebase --continue
```

#### 6. 推送功能分支到远程仓库
```bash
# 推送到远程仓库
git push -u origin feature/markdown-support
```

#### 7. 创建合并请求
在GitHub/GitLab界面上：
1. 导航到仓库
2. 点击"Pull Requests"/"Merge Requests"
3. 点击"New Pull Request"/"New Merge Request"
4. 选择源分支为feature/markdown-support，目标分支为dev
5. 填写PR标题和描述
6. 指定代码审查者
7. 提交PR

#### 8. 代码审查和合并
1. 审查者审查代码并提供反馈
2. 根据反馈进行修改：

```bash
# 进行修改后
git add .
git commit -m "根据代码审查反馈进行修改"
git push origin feature/markdown-support
```

3. 审查通过后，合并PR（通过GitHub/GitLab界面）

#### 9. 清理本地分支
合并完成后，清理本地分支：
```bash
# 切换回开发分支
git checkout dev

# 拉取最新更改
git pull origin dev

# 删除已合并的本地功能分支
git branch -d feature/markdown-support
```

#### 10. 同步到生产环境（发布）
当开发分支足够稳定时，可以合并到主分支：
```bash
# 切换到主分支
git checkout main

# 拉取最新的主分支
git pull origin main

# 合并开发分支
git merge dev

# 创建版本标签
git tag -a v1.2.0 -m "版本1.2.0发布：添加Markdown支持"

# 推送主分支和标签到远程
git push origin main
git push origin v1.2.0
```
通过这个完整的流程，你已经成功地从本地开发到远程部署完成了一个新功能的实现。