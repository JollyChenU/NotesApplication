# NotesApplication 开发规范文档

## 📋 目录

1. [概述](#概述)
2. [编码规范](#编码规范)
3. [命名规范](#命名规范)
4. [Git 工作流规范](#git-工作流规范)
5. [代码审查规范](#代码审查规范)
6. [数据操作规范](#数据操作规范)
7. [API 设计规范](#api-设计规范)
8. [文档规范](#文档规范)
9. [测试规范](#测试规范)
10. [部署规范](#部署规范)
11. [项目结构规范](#项目结构规范)
12. [变更日志管理](#变更日志管理)

---

## 概述

本文档定义了 NotesApplication 项目的开发规范和最佳实践，旨在确保代码质量、团队协作效率和项目可维护性。

### 技术栈
- **后端**: Python 3.12 + Flask + SQLAlchemy
- **前端**: React + Vite + JavaScript/JSX
- **AI服务**: LangChain + 通义千问(Qwen)
- **数据库**: SQLite
- **容器化**: Docker + Docker Compose

---

## 编码规范

### Python 后端代码规范

#### 1. 代码风格
遵循 PEP 8 Python 编码规范：

```python
# ✅ 正确示例
class AIOptimizationService:
    """AI优化服务类"""
    
    def __init__(self):
        self.llm = QwenLLM()
        self._setup_chains()
    
    def optimize_content(self, content: str, optimization_type: str = "general") -> Dict[str, Any]:
        """
        优化笔记内容
        
        Args:
            content: 原始内容
            optimization_type: 优化类型
            
        Returns:
            包含优化结果的字典
        """
        # 实现逻辑
        pass

# ❌ 错误示例
class aiOptimizationService:
    def __init__(self):
        self.llm=QwenLLM()
        self._setup_chains()
    
    def optimizeContent(self,content,optimization_type="general"):
        pass
```

#### 2. 导入规范
```python
# 标准库导入
import os
import re
import json
import logging
from typing import Optional, Dict, Any

# 第三方库导入
from flask import Flask, request, jsonify
from langchain.llms.base import LLM
from langchain.prompts import PromptTemplate

# 本地模块导入
from app.models.note import Note
from app.services.ai_service import ai_service
```

#### 3. 异常处理
```python
# ✅ 正确示例
def optimize_content(self, content: str) -> Dict[str, Any]:
    """优化内容"""
    try:
        if not content or not content.strip():
            return {
                'success': False,
                'error': '内容为空',
                'original_content': content
            }
        
        # 处理逻辑
        result = self._process_content(content)
        
        return {
            'success': True,
            'optimized_content': result
        }
        
    except ValueError as e:
        logger.error(f"参数错误: {str(e)}")
        return {'success': False, 'error': f'参数错误: {str(e)}'}
    except Exception as e:
        logger.error(f"内容优化失败: {str(e)}")
        return {'success': False, 'error': f'优化失败: {str(e)}'}
```

### JavaScript/React 前端代码规范

#### 1. 组件规范
```jsx
// ✅ 正确示例
import React, { useState, useEffect } from 'react';
import { Button, Dialog } from '@mui/material';

const AIOptimizeDialog = ({ open, onClose, content, onOptimize }) => {
    const [optimizationType, setOptimizationType] = useState('general');
    const [isLoading, setIsLoading] = useState(false);

    const handleOptimize = async () => {
        try {
            setIsLoading(true);
            await onOptimize(content, optimizationType);
        } catch (error) {
            console.error('优化失败:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose}>
            {/* 组件内容 */}
        </Dialog>
    );
};

export default AIOptimizeDialog;
```

#### 2. 状态管理
```jsx
// ✅ 使用 useState 管理组件状态
const [notes, setNotes] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

// ✅ 使用 useEffect 处理副作用
useEffect(() => {
    const fetchNotes = async () => {
        try {
            setLoading(true);
            const response = await notesApi.fetchNotes();
            setNotes(response.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);        }
    };

    fetchNotes();
}, []);
```

#### 3. 图标使用规范

项目使用 Material-UI 图标库，保持界面风格一致性。

##### 图标导入和命名
```jsx
// ✅ 正确的图标导入方式
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import DescriptionIcon from '@mui/icons-material/Description';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

// ❌ 避免的导入方式
import * as Icons from '@mui/icons-material'; // 避免全量导入
import { Add, Delete } from '@mui/icons-material'; // 避免非标准命名
```

##### 图标使用最佳实践
```jsx
// ✅ 正确的图标使用
const Sidebar = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    return (
        <Box>
            <IconButton onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
            <IconButton>
                <FolderIcon />
            </IconButton>
        </Box>
    );
};

// ✅ 图标与文字组合
const FileItem = ({ file }) => (
    <ListItem>
        <ListItemIcon>
            <DescriptionIcon />
        </ListItemIcon>
        <ListItemText primary={file.name} />
        <IconButton>
            <DeleteIcon />
        </IconButton>
    </ListItem>
);
```

##### 项目图标使用汇总

| 图标组件 | 用途 | 使用位置 |
|---------|------|----------|
| `AddIcon` | 新建操作 | 侧边栏新建文件、头部新建按钮 |
| `DeleteIcon` | 删除操作 | 文件列表、头部删除按钮 |
| `FolderIcon` | 关闭状态文件夹 | 侧边栏文件夹列表 |
| `FolderOpenIcon` | 打开状态文件夹 | 侧边栏展开文件夹 |
| `DescriptionIcon` | 文件标识 | 文件列表项、文件图标 |
| `DragIndicatorIcon` | 拖拽手柄 | 笔记列表、文件排序 |
| `ExpandLess` | 收起指示器 | 文件夹折叠控制 |
| `ExpandMore` | 展开指示器 | 文件夹展开控制 |
| `CreateNewFolderIcon` | 新建文件夹 | 侧边栏新建文件夹按钮 |
| `MoreVertIcon` | 更多菜单 | 文件夹上下文菜单 |
| `AutoFixHighIcon` | AI优化功能 | AI优化按钮 |

##### 图标一致性原则
1. **功能一致性**: 相同功能使用相同图标（如所有删除操作都使用 `DeleteIcon`）
2. **视觉一致性**: 保持图标尺寸和颜色主题统一
3. **语义清晰**: 图标含义应直观明确，符合用户认知习惯
4. **可访问性**: 为图标提供适当的 `aria-label` 属性

```jsx
// ✅ 可访问性最佳实践
<IconButton aria-label="删除文件" onClick={handleDelete}>
    <DeleteIcon />
</IconButton>

<IconButton aria-label={isExpanded ? "收起文件夹" : "展开文件夹"}>
    {isExpanded ? <ExpandLess /> : <ExpandMore />}
</IconButton>
```

---

## 命名规范

### 1. 文件命名
```
# Python 文件
ai_service.py          # 使用下划线分隔
note_manager.py
data_processor.py

# JavaScript/JSX 文件
AIOptimizeDialog.jsx   # React组件使用PascalCase
notesService.js        # 工具函数使用camelCase
api-client.js          # 配置文件可使用kebab-case
```

### 2. 变量和函数命名

#### Python
```python
# 变量名：使用 snake_case
user_name = "张三"
note_content = "笔记内容"
optimization_type = "general"

# 函数名：使用 snake_case
def get_user_notes():
    pass

def optimize_content():
    pass

# 类名：使用 PascalCase
class AIOptimizationService:
    pass

# 常量：使用 UPPER_CASE
MAX_CONTENT_LENGTH = 10000
DEFAULT_OPTIMIZATION_TYPE = "general"

# 私有方法：使用下划线前缀
def _preprocess_content(self):
    pass
```

#### JavaScript
```javascript
// 变量名：使用 camelCase
const userName = "张三";
const noteContent = "笔记内容";
const optimizationType = "general";

// 函数名：使用 camelCase
function getUserNotes() {}
function optimizeContent() {}

// 组件名：使用 PascalCase
const AIOptimizeDialog = () => {};
const NoteEditor = () => {};

// 常量：使用 UPPER_CASE
const MAX_CONTENT_LENGTH = 10000;
const API_BASE_URL = "http://localhost:5000";
```

### 3. 数据库命名
```sql
-- 表名：使用复数形式的 snake_case
notes
note_files
user_preferences

-- 字段名：使用 snake_case
user_id
created_at
updated_at
content_type
```

---

## Git 工作流规范

### 1. 分支管理策略

#### 分支类型
- `main`: 主分支，保存生产环境代码
- `dev`: 开发分支，用于集成开发中的功能
- `feature/*`: 功能分支，开发新功能
- `bugfix/*`: 修复分支，修复bug
- `hotfix/*`: 热修复分支，紧急修复生产问题

#### 分支命名规范
```bash
# 功能分支
feature/ai-optimization
feature/note-search
feature/user-authentication

# 修复分支
bugfix/ai-service-error
bugfix/note-save-issue

# 热修复分支
hotfix/critical-security-fix
```

### 2. Commit 消息规范

#### 格式
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

#### 类型 (type)
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式化（不影响功能）
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 添加或修改测试
- `chore`: 构建过程或辅助工具的变动
- `ci`: CI/CD 相关变更

#### 示例
```bash
# 新功能
git commit -m "feat(ai): 添加AI内容优化功能"
git commit -m "feat(api): 新增笔记搜索API接口"

# 修复bug
git commit -m "fix(ai): 修复AI服务调用失败的问题"
git commit -m "fix(frontend): 修复笔记保存时的界面卡顿"

# 文档更新
git commit -m "docs: 更新API文档和使用说明"
git commit -m "docs: 添加开发规范文档"

# 代码重构
git commit -m "refactor(services): 重构AI服务代码结构"
git commit -m "refactor(components): 优化React组件性能"

# 性能优化
git commit -m "perf(database): 优化笔记查询性能"
git commit -m "perf(frontend): 减少组件重渲染次数"

# 样式调整
git commit -m "style(frontend): 统一代码格式化标准"
git commit -m "style(python): 修复PEP8格式问题"

# 测试相关
git commit -m "test(api): 添加API接口单元测试"
git commit -m "test(services): 完善AI服务测试用例"

# 构建相关
git commit -m "chore(deps): 更新项目依赖版本"
git commit -m "chore(docker): 优化Docker构建配置"
```

### 3. Pull Request 规范

#### PR 标题格式
```
[Type] Brief description of changes
```

#### PR 描述模板
```markdown
## 变更类型
- [ ] 新功能 (feat)
- [ ] Bug修复 (fix)
- [ ] 文档更新 (docs)
- [ ] 代码重构 (refactor)
- [ ] 性能优化 (perf)
- [ ] 测试相关 (test)

## 变更描述
简要描述本次变更的内容...

## 测试说明
- [ ] 已通过单元测试
- [ ] 已通过集成测试
- [ ] 已手动测试相关功能

## 相关Issues
Closes #issue_number

## 检查清单
- [ ] 代码遵循项目编码规范
- [ ] 已添加必要的测试用例
- [ ] 已更新相关文档
- [ ] 已测试变更不会破坏现有功能
```

---

## 代码审查规范

### 1. 审查检查项

#### 功能性
- [ ] 代码实现是否符合需求
- [ ] 是否存在逻辑错误
- [ ] 边界条件是否处理正确
- [ ] 异常处理是否完善

#### 代码质量
- [ ] 代码结构是否清晰
- [ ] 命名是否规范和有意义
- [ ] 是否遵循编码规范
- [ ] 是否存在代码重复

#### 性能和安全
- [ ] 是否存在性能问题
- [ ] 是否存在安全漏洞
- [ ] 资源使用是否合理
- [ ] 数据验证是否充分

#### 测试和文档
- [ ] 是否包含必要的测试
- [ ] 注释和文档是否充分
- [ ] API文档是否更新

### 2. 审查流程
1. 提交PR后，指定至少一名审查者
2. 审查者在24小时内完成初步审查
3. 发现问题时，提供具体的修改建议
4. 修改完成后，重新请求审查
5. 审查通过后，合并到目标分支

---

## 数据操作规范

### 1. 数据库操作规范

#### 查询优化
```python
# ✅ 正确示例：使用索引和分页
def get_notes_by_user(user_id: int, page: int = 1, per_page: int = 20):
    """分页获取用户笔记"""
    return Note.query.filter_by(user_id=user_id)\
        .order_by(Note.updated_at.desc())\
        .paginate(page=page, per_page=per_page)

# ❌ 错误示例：查询所有数据
def get_all_notes():
    return Note.query.all()  # 可能导致内存问题
```

#### 事务处理
```python
# ✅ 正确示例：使用事务确保数据一致性
def create_note_with_files(note_data: dict, files: list):
    """创建笔记和相关文件"""
    try:
        db.session.begin()
        
        # 创建笔记
        note = Note(**note_data)
        db.session.add(note)
        db.session.flush()  # 获取note.id
        
        # 创建文件记录
        for file_data in files:
            file_data['note_id'] = note.id
            note_file = NoteFile(**file_data)
            db.session.add(note_file)
        
        db.session.commit()
        return note
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"创建笔记失败: {str(e)}")
        raise
```

### 2. 数据验证规范

#### 输入验证
```python
# ✅ 正确示例：严格的数据验证
def validate_note_data(data: dict) -> tuple[bool, str]:
    """验证笔记数据"""
    if not data.get('title'):
        return False, "标题不能为空"
    
    if len(data['title']) > 200:
        return False, "标题长度不能超过200字符"
    
    if not data.get('content'):
        return False, "内容不能为空"
    
    if len(data['content']) > 100000:
        return False, "内容长度不能超过100000字符"
    
    return True, ""

# API中使用
@notes_bp.route('/api/notes', methods=['POST'])
def create_note():
    data = request.get_json()
    
    is_valid, error_msg = validate_note_data(data)
    if not is_valid:
        return jsonify({'error': error_msg}), 400
    
    # 继续处理...
```

### 3. 数据变更操作规范

#### 软删除
```python
# ✅ 使用软删除而不是物理删除
class Note(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    is_deleted = db.Column(db.Boolean, default=False)
    deleted_at = db.Column(db.DateTime, nullable=True)
    
    def soft_delete(self):
        """软删除笔记"""
        self.is_deleted = True
        self.deleted_at = datetime.utcnow()
        db.session.commit()
```

#### 数据备份
```python
# ✅ 重要操作前备份数据
def optimize_note_content(note_id: int, optimization_type: str):
    """优化笔记内容"""
    note = Note.query.get_or_404(note_id)
    
    # 备份原始内容
    backup_data = {
        'note_id': note.id,
        'original_content': note.content,
        'operation_type': 'ai_optimization',
        'created_at': datetime.utcnow()
    }
    backup = ContentBackup(**backup_data)
    db.session.add(backup)
    
    # 执行优化
    result = ai_service.optimize_content(note.content, optimization_type)
    if result['success']:
        note.content = result['optimized_content']
        db.session.commit()
    
    return result
```

---

## API 设计规范

### 1. RESTful API 设计

#### URL 设计
```python
# ✅ 正确示例：RESTful风格
GET    /api/notes                    # 获取笔记列表
POST   /api/notes                    # 创建笔记
GET    /api/notes/{id}               # 获取特定笔记
PUT    /api/notes/{id}               # 更新笔记
DELETE /api/notes/{id}               # 删除笔记

# 嵌套资源
GET    /api/notes/{id}/files         # 获取笔记的文件列表
POST   /api/notes/{id}/files         # 为笔记添加文件

# 操作端点
POST   /api/notes/{id}/optimize      # 优化笔记内容
POST   /api/notes/{id}/backup        # 备份笔记
```

#### 响应格式
```python
# ✅ 统一的响应格式
def success_response(data=None, message="操作成功"):
    """成功响应格式"""
    return jsonify({
        'success': True,
        'message': message,
        'data': data,
        'timestamp': datetime.utcnow().isoformat()
    })

def error_response(message="操作失败", code=400, details=None):
    """错误响应格式"""
    response = {
        'success': False,
        'message': message,
        'error_code': code,
        'timestamp': datetime.utcnow().isoformat()
    }
    if details:
        response['details'] = details
    return jsonify(response), code
```

### 2. 状态码使用
```python
# 2xx 成功
200  # OK - 请求成功
201  # Created - 资源创建成功
204  # No Content - 删除成功

# 4xx 客户端错误
400  # Bad Request - 请求参数错误
401  # Unauthorized - 未授权
403  # Forbidden - 禁止访问
404  # Not Found - 资源不存在
409  # Conflict - 资源冲突
422  # Unprocessable Entity - 数据验证失败

# 5xx 服务器错误
500  # Internal Server Error - 服务器内部错误
502  # Bad Gateway - 网关错误
503  # Service Unavailable - 服务不可用
```

### 3. 参数验证
```python
from marshmallow import Schema, fields, validate

class NoteSchema(Schema):
    """笔记数据验证模式"""
    title = fields.Str(required=True, validate=validate.Length(min=1, max=200))
    content = fields.Str(required=True, validate=validate.Length(min=1, max=100000))
    folder_id = fields.Int(missing=None)
    tags = fields.List(fields.Str(), missing=[])

@notes_bp.route('/api/notes', methods=['POST'])
def create_note():
    schema = NoteSchema()
    try:
        data = schema.load(request.get_json())
    except ValidationError as err:
        return error_response("数据验证失败", 422, err.messages)
    
    # 处理验证后的数据...
```

---

## 文档规范

### 1. 文件头部注释规范

每个代码文件都应该在文件开头包含标准化的文件头部注释，说明文件的功能、作用、创建和修改历史等信息。

#### Python 文件头部注释
```python
"""
文件名: ai_service.py
模块: AI优化服务
描述: 使用LangChain和Qwen模型进行笔记内容的智能优化处理
功能:
    - 提供多种类型的内容优化（语法、结构、清晰度、格式、综合）
    - 集成通义千问API进行AI内容处理
    - 生成优化报告和统计信息
    - 内容预处理和后处理

作者: 开发团队
创建时间: 2024-12-01
最后修改: 2024-12-15
修改人: 张三
版本: 1.2.0

依赖:
    - langchain: AI链式处理框架
    - dashscope: 通义千问API SDK
    - typing: 类型注解支持

注意事项:
    - 需要配置QWEN_API_KEY环境变量
    - AI服务调用有频率限制
    - 内容长度不应超过100000字符
"""

import os
import re
from typing import Optional, Dict, Any
# ...其他导入...
```

#### JavaScript/JSX 文件头部注释
```javascript
/**
 * 文件名: AIOptimizeDialog.jsx
 * 组件: AI内容优化对话框
 * 描述: 提供用户界面用于选择优化类型并执行AI内容优化
 * 功能:
 *   - 显示优化类型选择界面
 *   - 处理优化请求和结果展示
 *   - 提供加载状态和错误处理
 *   - 支持预览优化前后对比
 * 
 * 作者: 前端团队
 * 创建时间: 2024-11-20
 * 最后修改: 2024-12-10
 * 修改人: 李四
 * 版本: 1.1.0
 * 
 * 依赖:
 *   - React: 组件框架
 *   - Material-UI: UI组件库
 *   - notesService: 笔记API服务
 * 
 * Props:
 *   - open: boolean - 对话框开启状态
 *   - onClose: function - 关闭回调
 *   - content: string - 待优化内容
 *   - onOptimize: function - 优化完成回调
 * 
 * 注意事项:
 *   - 内容不能为空
 *   - 优化过程中禁用操作按钮
 *   - 错误信息需要用户友好的展示
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent } from '@mui/material';
// ...其他导入...
```

#### CSS/样式文件头部注释
```css
/**
 * 文件名: main.css
 * 模块: 主要样式表
 * 描述: 应用程序的全局样式定义和主题配置
 * 功能:
 *   - 全局样式重置和基础样式
 *   - 颜色主题和设计令牌定义
 *   - 响应式断点和布局样式
 *   - 动画和过渡效果
 * 
 * 作者: UI/UX团队
 * 创建时间: 2024-10-15
 * 最后修改: 2024-12-05
 * 修改人: 王五
 * 版本: 2.0.0
 * 
 * 设计系统:
 *   - 主色调: #1976d2 (蓝色)
 *   - 辅助色: #f50057 (粉红色)
 *   - 字体: 'Roboto', 'Microsoft YaHei', sans-serif
 *   - 断点: 移动端 <768px, 平板 768-1024px, 桌面 >1024px
 * 
 * 注意事项:
 *   - 支持深色和浅色主题切换
 *   - 兼容Chrome 90+, Firefox 88+, Safari 14+
 *   - 遵循WCAG 2.1 AA无障碍标准
 */

/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
```

#### 配置文件头部注释
```yaml
# 文件名: docker-compose.yml
# 项目: NotesApplication
# 描述: Docker容器编排配置，定义应用程序的多容器部署架构
# 功能:
#   - 后端Flask应用容器配置
#   - 前端React应用容器配置
#   - 数据库服务配置（如需要）
#   - 网络和卷挂载配置
#
# 作者: DevOps团队
# 创建时间: 2024-11-01
# 最后修改: 2024-12-08
# 修改人: 赵六
# 版本: 1.3.0
#
# 使用方法:
#   - 开发环境: docker-compose up
#   - 生产环境: docker-compose -f docker-compose.yml -f docker-compose.prod.yml up
#
# 端口映射:
#   - 前端: 3000 (开发) / 80 (生产)
#   - 后端: 5000
#
# 注意事项:
#   - 需要配置环境变量文件 .env
#   - 生产环境需要设置合适的资源限制
#   - 确保数据卷的持久化配置正确

version: '3.8'

services:
  frontend:
    build: ./frontend
    # ...其他配置...
```

### 2. 文件头部注释字段说明

#### 必填字段
- **文件名**: 当前文件的名称
- **模块/组件**: 文件所属的模块或组件名称
- **描述**: 简要说明文件的主要功能和用途
- **作者**: 文件的创建者或负责团队
- **创建时间**: 文件首次创建的日期
- **版本**: 当前文件的版本号

#### 可选字段
- **最后修改**: 最近一次修改的日期
- **修改人**: 最后修改者的姓名
- **功能**: 详细列举文件提供的功能点
- **依赖**: 文件依赖的外部库或模块
- **注意事项**: 使用时需要注意的重要信息
- **Props/参数**: (适用于组件) 组件接收的属性参数
- **使用方法**: (适用于配置文件) 如何使用此配置文件

### 3. 版本号规范

采用语义化版本号 (Semantic Versioning) 格式：`主版本号.次版本号.修订号`

- **主版本号**: 不兼容的API修改
- **次版本号**: 向下兼容的功能性新增
- **修订号**: 向下兼容的问题修正

**示例**:
- `1.0.0`: 初始版本
- `1.1.0`: 添加新功能
- `1.1.1`: 修复bug
- `2.0.0`: 重大重构或API变更

### 4. 修改历史记录

对于重要的文件，可以在头部注释中维护简要的修改历史：

```python
"""
文件名: ai_service.py
...其他字段...

修改历史:
    v1.2.0 (2024-12-15, 张三): 添加批量优化功能
    v1.1.1 (2024-12-10, 李四): 修复优化超时问题  
    v1.1.0 (2024-12-05, 张三): 新增清晰度优化类型
    v1.0.0 (2024-12-01, 张三): 初始版本，基础AI优化功能
"""
```

### 5. 文件头部注释更新规范

#### 更新时机
- **创建文件时**: 必须添加完整的文件头部注释
- **重大功能修改时**: 更新版本号、最后修改时间和修改人
- **API接口变更时**: 更新版本号，并在注意事项中说明变更
- **依赖变更时**: 更新依赖列表和相关说明

#### 更新责任
- **文件创建者**: 负责编写初始的完整头部注释
- **代码修改者**: 负责更新修改相关的字段
- **代码审查者**: 在PR审查时检查头部注释是否正确更新

#### 工具支持
建议配置IDE模板，自动生成标准的文件头部注释：

**VS Code模板配置** (`.vscode/snippets/python.json`):
```json
{
  "Python File Header": {
    "prefix": "fileheader",
    "body": [
      "\"\"\"",
      "文件名: ${TM_FILENAME}",
      "模块: ${1:模块名称}",
      "描述: ${2:文件功能描述}",
      "功能:",
      "    - ${3:主要功能1}",
      "    - ${4:主要功能2}",
      "",
      "作者: ${5:作者姓名}",
      "创建时间: ${CURRENT_YEAR}-${CURRENT_MONTH}-${CURRENT_DATE}",
      "版本: ${6:1.0.0}",
      "",
      "依赖:",
      "    - ${7:主要依赖}",
      "",
      "注意事项:",
      "    - ${8:重要注意事项}",
      "\"\"\""
    ],
    "description": "Python文件头部注释模板"
  }
}
```

### 6. 代码注释规范

#### Python 文档字符串
```python
def optimize_content(self, content: str, optimization_type: str = "general") -> Dict[str, Any]:
    """
    优化笔记内容
    
    使用AI服务对笔记内容进行智能优化，支持多种优化类型。
    
    Args:
        content (str): 需要优化的原始内容，不能为空
        optimization_type (str, optional): 优化类型，支持以下选项：
            - 'grammar': 语法优化
            - 'structure': 结构优化  
            - 'clarity': 清晰度优化
            - 'markdown': 格式优化
            - 'general': 综合优化（默认）
            
    Returns:
        Dict[str, Any]: 优化结果字典，包含以下字段：
            - success (bool): 是否成功
            - original_content (str): 原始内容
            - optimized_content (str): 优化后内容
            - optimization_type (str): 优化类型
            - report (Dict): 优化报告
            - error (str, optional): 错误信息（失败时）
            
    Raises:
        ValueError: 当输入参数无效时
        APIError: 当AI服务调用失败时
        
    Example:
        >>> service = AIOptimizationService()
        >>> result = service.optimize_content("这是一个笔记", "grammar")
        >>> print(result['success'])
        True
    """
```

#### JavaScript JSDoc 注释
```javascript
/**
 * 优化笔记内容
 * 
 * @param {string} content - 需要优化的内容
 * @param {string} optimizationType - 优化类型
 * @returns {Promise<Object>} 优化结果
 * 
 * @example
 * const result = await optimizeContent("笔记内容", "general");
 * console.log(result.optimizedContent);
 */
async function optimizeContent(content, optimizationType = 'general') {
    // 实现逻辑
}
```

### 2. API 文档规范

#### OpenAPI/Swagger 格式
```yaml
# docs/api-spec.yaml
openapi: 3.0.0
info:
  title: NotesApplication API
  version: 1.0.0
  description: 智能笔记应用API文档

paths:
  /api/notes/{id}/optimize:
    post:
      summary: 优化笔记内容
      description: 使用AI服务优化指定笔记的内容
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
          description: 笔记ID
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                optimization_type:
                  type: string
                  enum: [grammar, structure, clarity, markdown, general]
                  default: general
                  description: 优化类型
      responses:
        200:
          description: 优化成功
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  optimized_content:
                    type: string
                  report:
                    type: object
```

---

## 测试规范

### 1. 单元测试

#### Python 测试
```python
import pytest
from unittest.mock import Mock, patch
from app.services.ai_service import AIOptimizationService

class TestAIOptimizationService:
    """AI优化服务测试类"""
    
    def setup_method(self):
        """测试前置设置"""
        self.service = AIOptimizationService()
    
    def test_optimize_content_success(self):
        """测试内容优化成功情况"""
        content = "这是一个测试笔记内容"
        optimization_type = "grammar"
        
        with patch.object(self.service, 'optimization_chain') as mock_chain:
            mock_chain.run.return_value = "这是一个优化后的测试笔记内容"
            
            result = self.service.optimize_content(content, optimization_type)
            
            assert result['success'] is True
            assert result['optimization_type'] == optimization_type
            assert 'optimized_content' in result
            mock_chain.run.assert_called_once()
    
    def test_optimize_empty_content(self):
        """测试空内容优化情况"""
        result = self.service.optimize_content("")
        
        assert result['success'] is False
        assert result['error'] == "内容为空"
    
    @pytest.mark.parametrize("optimization_type,expected_improvements", [
        ("grammar", ["语法修正", "拼写检查", "句式优化"]),
        ("structure", ["内容重组", "逻辑优化", "段落调整"]),
        ("clarity", ["表达简化", "冗余删除", "清晰度提升"])
    ])
    def test_get_improvement_areas(self, optimization_type, expected_improvements):
        """测试获取改进领域功能"""
        improvements = self.service._get_improvement_areas(optimization_type)
        assert improvements == expected_improvements
```

#### JavaScript 测试
```javascript
// tests/services/notesService.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { optimizeContent, fetchNotes } from '../src/services/notesService';

describe('notesService', () => {
    beforeEach(() => {
        // 重置所有mock
        vi.clearAllMocks();
    });

    describe('optimizeContent', () => {
        it('应该成功优化内容', async () => {
            // 模拟API响应
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    optimized_content: '优化后的内容'
                })
            });

            const result = await optimizeContent('原始内容', 'grammar');

            expect(result.success).toBe(true);
            expect(result.optimized_content).toBe('优化后的内容');
            expect(fetch).toHaveBeenCalledWith('/api/ai/optimize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: '原始内容',
                    optimization_type: 'grammar'
                })
            });
        });

        it('应该处理API错误', async () => {
            global.fetch = vi.fn().mockResolvedValue({
                ok: false,
                status: 500
            });

            await expect(optimizeContent('内容', 'grammar'))
                .rejects.toThrow('优化内容失败');
        });
    });
});
```

### 2. 集成测试
```python
# tests/test_integration.py
import pytest
from app import create_app
from app.models import db

class TestNoteOptimization:
    """笔记优化集成测试"""
    
    @pytest.fixture
    def client(self):
        """创建测试客户端"""
        app = create_app('testing')
        with app.test_client() as client:
            with app.app_context():
                db.create_all()
                yield client
                db.drop_all()
    
    def test_note_optimization_workflow(self, client):
        """测试完整的笔记优化流程"""
        # 1. 创建笔记
        note_data = {
            'title': '测试笔记',
            'content': '这是一个测试笔记内容'
        }
        response = client.post('/api/notes', json=note_data)
        assert response.status_code == 201
        note_id = response.get_json()['data']['id']
        
        # 2. 优化笔记
        optimize_data = {'optimization_type': 'grammar'}
        response = client.post(f'/api/notes/{note_id}/optimize', json=optimize_data)
        assert response.status_code == 200
        
        result = response.get_json()
        assert result['success'] is True
        assert 'optimized_content' in result['data']
        
        # 3. 验证笔记已更新
        response = client.get(f'/api/notes/{note_id}')
        assert response.status_code == 200
        updated_note = response.get_json()['data']
        assert updated_note['content'] != note_data['content']
```

---

## 部署规范

### 1. 环境管理

#### 环境变量配置
```bash
# .env.example - 环境变量模板
# 数据库配置
DATABASE_URL=sqlite:///notes.db

# AI服务配置
QWEN_API_KEY=your_qwen_api_key_here
AI_MODEL_NAME=qwen-turbo

# Flask配置
FLASK_ENV=development
SECRET_KEY=your_secret_key_here
DEBUG=true

# 日志配置
LOG_LEVEL=INFO
LOG_FILE=app.log

# 文件上传配置
UPLOAD_FOLDER=uploads
MAX_CONTENT_LENGTH=16777216  # 16MB
```

#### Docker 配置
```dockerfile
# Dockerfile 规范
FROM python:3.12-slim

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY requirements.txt .

# 安装依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 创建非root用户
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN chown -R appuser:appuser /app
USER appuser

# 暴露端口
EXPOSE 5000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# 启动命令
CMD ["python", "app.py"]
```

### 2. 部署检查清单

#### 部署前检查
- [ ] 所有测试通过
- [ ] 代码审查完成
- [ ] 环境变量配置正确
- [ ] 数据库迁移脚本准备
- [ ] 静态资源构建完成
- [ ] 安全配置检查

#### 部署后验证
- [ ] 应用正常启动
- [ ] 健康检查端点响应正常
- [ ] 数据库连接正常
- [ ] AI服务调用正常
- [ ] 日志记录正常
- [ ] 性能指标正常

---

## 项目结构规范

### 1. 目录结构
```
NotesApplication/
├── app/                    # 应用主目录
│   ├── __init__.py
│   ├── api/               # API路由
│   │   ├── __init__.py
│   │   ├── notes.py
│   │   ├── ai.py
│   │   └── health.py
│   ├── models/            # 数据模型
│   │   ├── __init__.py
│   │   ├── note.py
│   │   └── folder.py
│   ├── services/          # 业务逻辑服务
│   │   ├── __init__.py
│   │   ├── ai_service.py
│   │   └── data_processor.py
│   ├── utils/             # 工具函数
│   │   ├── __init__.py
│   │   └── helpers.py
│   └── config/            # 配置文件
│       ├── __init__.py
│       └── config.py
├── frontend/              # 前端代码
│   ├── src/
│   │   ├── components/    # React组件
│   │   ├── services/      # API服务
│   │   ├── hooks/         # 自定义Hooks
│   │   └── utils/         # 工具函数
│   ├── public/            # 静态资源
│   └── package.json
├── tests/                 # 测试代码
│   ├── unit/             # 单元测试
│   ├── integration/      # 集成测试
│   └── fixtures/         # 测试数据
├── docs/                 # 文档
│   ├── api/              # API文档
│   ├── dev/              # 开发文档
│   └── user/             # 用户文档
├── scripts/              # 脚本文件
├── docker-compose.yml    # Docker编排
├── Dockerfile           # Docker配置
├── requirements.txt     # Python依赖
├── .env.example         # 环境变量模板
├── .gitignore          # Git忽略规则
└── README.md           # 项目说明
```

### 2. 文件组织原则

#### 单一职责原则
- 每个文件只负责一个具体功能
- 避免在一个文件中混合不同层次的逻辑
- 保持文件大小适中（建议不超过500行）

#### 模块化组织
- 按功能模块组织代码
- 相关文件放在同一目录下
- 使用__init__.py明确模块接口

#### 依赖管理
- 明确模块间的依赖关系
- 避免循环依赖
- 使用接口抽象减少耦合

---

## 安全规范

### 1. 数据安全
```python
# ✅ 输入验证和消毒
from markupsafe import escape
import bleach

def sanitize_html_content(content: str) -> str:
    """清理HTML内容，防止XSS攻击"""
    allowed_tags = ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3']
    allowed_attributes = {}
    
    return bleach.clean(content, tags=allowed_tags, attributes=allowed_attributes)

def validate_and_escape_input(data: dict) -> dict:
    """验证和转义用户输入"""
    cleaned_data = {}
    for key, value in data.items():
        if isinstance(value, str):
            cleaned_data[key] = escape(value.strip())
        else:
            cleaned_data[key] = value
    return cleaned_data
```

### 2. API 安全
```python
# ✅ 请求限制和验证
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

@notes_bp.route('/api/notes', methods=['POST'])
@limiter.limit("10 per minute")  # 限制创建频率
def create_note():
    # API实现
    pass
```

### 3. 敏感信息处理
```python
# ✅ 日志脱敏
import re

def sanitize_log_message(message: str) -> str:
    """清理日志中的敏感信息"""
    # 隐藏API密钥
    message = re.sub(r'api_key[=:]\s*["\']?([^"\'\s]{8})[^"\'\s]*["\']?', 
                    r'api_key=\1****', message, flags=re.IGNORECASE)
    
    # 隐藏密码
    message = re.sub(r'password[=:]\s*["\']?[^"\'\s]+["\']?', 
                    'password=****', message, flags=re.IGNORECASE)
    
    return message

# 自定义日志处理器
class SanitizingFormatter(logging.Formatter):
    def format(self, record):
        record.msg = sanitize_log_message(str(record.msg))
        return super().format(record)
```

---

## 性能优化规范

### 1. 数据库优化
```python
# ✅ 查询优化
from sqlalchemy import func

# 使用索引
class Note(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False, index=True)  # 添加索引
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

# 查询优化
def get_user_notes_optimized(user_id: int, limit: int = 20):
    """优化的用户笔记查询"""
    return db.session.query(Note)\
        .filter(Note.user_id == user_id, Note.is_deleted == False)\
        .order_by(Note.updated_at.desc())\
        .limit(limit)\
        .all()

# 批量操作
def bulk_update_notes(note_ids: list, update_data: dict):
    """批量更新笔记"""
    db.session.query(Note)\
        .filter(Note.id.in_(note_ids))\
        .update(update_data, synchronize_session=False)
    db.session.commit()
```

### 2. 缓存策略
```python
# ✅ 使用缓存
from flask_caching import Cache

cache = Cache(app, config={'CACHE_TYPE': 'simple'})

@cache.memoize(timeout=300)  # 缓存5分钟
def get_popular_notes(limit: int = 10):
    """获取热门笔记（带缓存）"""
    return Note.query\
        .filter(Note.is_public == True)\
        .order_by(Note.view_count.desc())\
        .limit(limit)\
        .all()

# 缓存失效
def update_note_content(note_id: int, content: str):
    """更新笔记内容并清理缓存"""
    note = Note.query.get(note_id)
    note.content = content
    db.session.commit()
    
    # 清理相关缓存
    cache.delete_memoized(get_popular_notes)
    cache.delete(f'note_content_{note_id}')
```

---

## 监控和日志规范

### 1. 日志记录
```python
import logging
import structlog
from datetime import datetime

# 结构化日志配置
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# 使用示例
def optimize_content(self, content: str, optimization_type: str):
    """优化内容（带日志记录）"""
    logger.info("开始内容优化", 
                content_length=len(content), 
                optimization_type=optimization_type)
    
    try:
        result = self._perform_optimization(content, optimization_type)
        
        logger.info("内容优化成功", 
                   original_length=len(content),
                   optimized_length=len(result['optimized_content']),
                   optimization_type=optimization_type)
        
        return result
        
    except Exception as e:
        logger.error("内容优化失败", 
                    error=str(e),
                    content_length=len(content),
                    optimization_type=optimization_type)
        raise
```

### 2. 性能监控
```python
# ✅ 性能监控装饰器
import time
import functools
from typing import Callable

def monitor_performance(func: Callable) -> Callable:
    """性能监控装饰器"""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        
        try:
            result = func(*args, **kwargs)
            success = True
            error = None
        except Exception as e:
            result = None
            success = False
            error = str(e)
            raise
        finally:
            execution_time = time.time() - start_time
            
            logger.info("函数执行监控",
                       function_name=func.__name__,
                       execution_time=execution_time,
                       success=success,
                       error=error)
            
            # 性能预警
            if execution_time > 5.0:  # 超过5秒预警
                logger.warning("函数执行时间过长",
                             function_name=func.__name__,
                             execution_time=execution_time)
        
        return result
    return wrapper

# 使用示例
@monitor_performance
def optimize_content(self, content: str, optimization_type: str):
    # 函数实现
    pass
```

---

## 变更日志管理

### 概述

项目采用标准化的变更日志管理机制，确保所有重要变更都得到妥善记录和追踪。

### 变更日志文件

项目根目录下的 `CHANGELOG.md` 文件记录所有版本的变更信息。

### 变更日志格式

基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/) 标准：

```markdown
## [版本号] - YYYY-MM-DD

### 新增
- 新功能描述

### 改进
- 功能改进描述

### 修复
- 问题修复描述

### 移除
- 移除功能描述

### 安全
- 安全相关修复

### 文档
- 文档更新

### 重构
- 代码重构说明
```

### 变更类型定义

- **新增** (Added): 新功能
- **改进** (Changed): 对现有功能的改进
- **修复** (Fixed): 错误修复
- **移除** (Removed): 移除的功能
- **安全** (Security): 安全相关的修复
- **文档** (Documentation): 文档更新
- **重构** (Refactored): 代码重构，不影响功能

### 版本号规则

采用 [语义化版本](https://semver.org/lang/zh-CN/) 规范：

- **MAJOR.MINOR.PATCH**
  - **MAJOR**: 不兼容的 API 修改
  - **MINOR**: 向下兼容的功能性新增
  - **PATCH**: 向下兼容的问题修正

### 更新流程

1. **开发阶段**: 在 `[Unreleased]` 章节记录变更
2. **版本发布**: 将变更移至对应版本号章节
3. **发布日期**: 添加实际发布日期
4. **链接维护**: 更新版本比较链接

### 示例条目

```markdown
## [Unreleased] - 待发布

### 新增
- AI内容优化功能增强
- 新增快捷键支持

### 改进
- 优化笔记搜索性能
- 改进用户界面响应速度

### 修复
- 修复文件夹创建问题
- 解决数据同步异常
```

### 维护责任

- **开发人员**: 及时记录功能变更
- **项目负责人**: 审查变更记录的完整性
- **发布管理员**: 确保版本发布时更新日志的准确性

---

## 总结

本开发规范文档涵盖了 NotesApplication 项目开发的各个方面，包括：

1. **编码规范**: Python和JavaScript的代码风格标准
2. **命名规范**: 文件、变量、函数的命名约定
3. **Git工作流**: 分支管理和提交信息规范
4. **数据操作**: 数据库查询、事务处理和数据验证
5. **API设计**: RESTful API设计原则和响应格式
6. **测试规范**: 单元测试和集成测试标准
7. **安全规范**: 数据安全和API安全措施
8. **性能优化**: 数据库优化和缓存策略
9. **监控日志**: 结构化日志和性能监控

### 执行建议

1. **团队培训**: 确保所有开发人员熟悉本规范
2. **工具集成**: 配置IDE和CI/CD工具自动检查规范遵循情况
3. **定期审查**: 定期审查和更新开发规范
4. **文档维护**: 保持文档与项目发展同步更新

### 相关工具推荐

- **代码格式化**: black (Python), prettier (JavaScript)
- **代码检查**: flake8, pylint (Python), eslint (JavaScript)
- **测试工具**: pytest (Python), vitest (JavaScript)
- **API文档**: Swagger/OpenAPI
- **监控工具**: Sentry, Prometheus
- **CI/CD**: GitHub Actions, GitLab CI

遵循这些规范将有助于提高代码质量、团队协作效率和项目的长期可维护性。
