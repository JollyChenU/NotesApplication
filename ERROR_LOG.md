<!--
 * @author Jolly
 * @date 2025-04-01
 * @description 项目错误日志，记录开发过程中遇到的问题及解决方案
 * @version 1.0.0
 * @license GPL-3.0
-->

# 错误日志 Error Log

## 目录 Contents
1. [前端页面空白问题](#1-前端页面空白问题)
2. [React-Markdown渲染行内代码崩溃问题](#2-react-markdown渲染行内代码崩溃问题)
3. [方向键在笔记块间移动失效问题](#3-方向键在笔记块间移动失效问题)

## 1. 前端页面空白问题

### 问题描述 Description
在启动前端应用后，页面显示完全空白，没有任何内容渲染。通过浏览器控制台发现是由于Sidebar组件中的空值引用导致的渲染错误。

### 错误信息 Error Message
```
TypeError: Cannot read properties of undefined (reading 'map')
    at Sidebar (Sidebar.jsx:xx)
```

### 原因分析 Root Cause
问题出在Sidebar组件中，当尝试对未初始化的数组进行map操作时发生了错误。这通常发生在数据还未从后端获取完成时就开始渲染的情况。

### 解决方案 Solution
1. 在Sidebar组件中添加空值检查
2. 确保在数据加载完成前显示加载状态
3. 使用可选链操作符或提供默认空数组

### 代码修改 Code Changes
```jsx
// 修改前
const Sidebar = ({ files }) => {
  return (
    <div>
      {files.map(file => (
        <div key={file.id}>{file.name}</div>
      ))}
    </div>
  );
};

// 修改后
const Sidebar = ({ files = [] }) => {
  return (
    <div>
      {files?.map(file => (
        <div key={file.id}>{file.name}</div>
      ))}
    </div>
  );
};
```

### 预防措施 Prevention
1. 在组件中始终为props提供默认值
2. 使用TypeScript进行类型检查
3. 实现数据加载状态管理
4. 添加错误边界处理组件异常

### 相关文档 References
- [React Error Boundaries](https://reactjs.org/docs/error-boundaries.html)
- [Optional Chaining](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining)

## 2. React-Markdown渲染行内代码崩溃问题

### 问题描述 Description
在使用React-Markdown组件渲染Markdown内容时，应用出现崩溃。特别是当用户输入成对的反引号（用于标记行内代码）时，应用会立即崩溃，导致整个编辑器界面失效，无法继续编辑。

### 错误信息 Error Message
```
Uncaught TypeError: Cannot read properties of null (reading 'props')
    at InlineCode.jsx:27
    at processChild (react-markdown.js:352)
    at ReactMarkdown.jsx:124
```

### 原因分析 Root Cause
问题出在React-Markdown的行内代码渲染器中，当用户输入成对的反引号（`` ` ``）时，解析器会尝试立即渲染行内代码，但由于某些内部实现问题，导致渲染过程中出现空引用并引发崩溃。此外，React-Markdown库的维护频率较低，这类已知问题未得到及时修复。

### 解决方案 Solution
1. 将Markdown渲染组件从React-Markdown迁移到更强大的TipTap编辑器
2. 使用TipTap的扩展系统实现代码块和行内代码的自定义渲染
3. 添加专门的代码语法高亮扩展
4. 实现更健壮的错误处理机制

### 代码修改 Code Changes
```jsx
// 修改前 - 使用React-Markdown
import ReactMarkdown from 'react-markdown';

const MarkdownRenderer = ({ content }) => {
  return (
    <ReactMarkdown
      components={{
        code: ({ node, inline, ...props }) => (
          <code className={inline ? 'inline-code' : 'code-block'} {...props} />
        )
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

// 修改后 - 使用TipTap编辑器
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { lowlight } from 'lowlight/lib/core';

const TipTapRenderer = ({ content }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'javascript',
      }),
    ],
    content,
    editable: false,
  });

  return <EditorContent editor={editor} />;
};
```

### 预防措施 Prevention
1. 选择活跃维护的库和组件
2. 实现全面的错误边界和降级渲染策略
3. 为复杂内容渲染添加单元测试和集成测试
4. 定期更新依赖并关注社区反馈的问题

### 相关文档 References
- [TipTap Editor Documentation](https://tiptap.dev/introduction)
- [CodeBlockLowlight Extension](https://tiptap.dev/api/nodes/code-block-lowlight)
- [React Error Handling Best Practices](https://reactjs.org/docs/error-boundaries.html)

## 3. 方向键在笔记块间移动失效问题

### 问题描述 Description
在使用方向键（向上、向下箭头键）尝试在不同笔记块之间移动光标时，光标无法正确跳转到相邻笔记块，导致用户体验不佳。

### 现象表现 Symptoms
- 在笔记块的开头按上箭头键，光标不会移动到上一个笔记块
- 在笔记块的末尾按下箭头键，光标不会移动到下一个笔记块
- 从控制台输出可以看到，系统无法正确识别当前笔记ID或找到下一个笔记块

### 原因分析 Root Cause
1. **ID 重复问题**：DOM 中每个笔记 ID 出现两次，导致在寻找下一个笔记时始终停留在相同 ID 的另一个元素上
2. **光标位置判断不准确**：未能有效检测光标是否真正处于文档的开头或末尾
3. **笔记 ID 类型不一致**：DOM 中的 ID 和代码中比较的 ID 类型可能不一致（字符串与数字）

### 代码修改 Code Changes
```jsx
// 原代码 - 简单获取所有笔记ID
const noteElements = document.querySelectorAll('[data-note-id]');
const noteIds = Array.from(noteElements).map(el => el.getAttribute('data-note-id'));

// 修改后 - 解决ID重复问题
const noteElements = document.querySelectorAll('[data-note-id]');

// 创建Map用于去除重复ID并保持顺序
const uniqueNoteIdsMap = new Map();
Array.from(noteElements).forEach(el => {
  const id = String(el.getAttribute('data-note-id'));
  // 如果这个ID还没有出现过，就添加到Map中
  if (!uniqueNoteIdsMap.has(id)) {
    uniqueNoteIdsMap.set(id, true);
  }
});

// 转换为唯一ID数组
const uniqueNoteIds = Array.from(uniqueNoteIdsMap.keys());

// 确保当前笔记ID也是字符串格式
const currentId = String(note?.id);

// 增加防止导航到相同ID的处理
if (targetNoteId === currentId) {
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
    // 查找下一个不同ID
    for (let i = currentIndex + 1; i < uniqueNoteIds.length; i++) {
      if (uniqueNoteIds[i] !== currentId) {
        targetNoteId = uniqueNoteIds[i];
        break;
      }
    }
  } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
    // 查找上一个不同ID
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (uniqueNoteIds[i] !== currentId) {
        targetNoteId = uniqueNoteIds[i];
        break;
      }
    }
  }
}
```

### 预防措施 Prevention
1. 在处理DOM元素ID时，始终使用统一的数据类型（如转换为字符串）
2. 处理可能包含重复项的数据集合时，使用Set或Map进行去重
3. 实现导航功能时，添加备用方法确保鲁棒性
4. 使用详细的调试日志，帮助发现DOM结构和ID关系中的问题

### 相关文档 References
- [JavaScript Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)
- [DOM操作最佳实践](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Client-side_web_APIs/Manipulating_documents)
- [JavaScript事件处理](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener)