/**
 * 文件名: tiptapExtensions.js
 * 组件: TipTap扩展配置
 * 描述: TipTap编辑器的扩展配置，包括基础功能、语法高亮、快捷键等
 * 功能: 编辑器扩展、语法高亮、快捷键绑定、自定义命令、占位符
 * 作者: Jolly Chen
 * 时间: 2024-11-20
 * 版本: 1.2.0
 * 依赖: @tiptap/starter-kit, @tiptap/extension-*, lowlight
 * 许可证: Apache-2.0
 */

import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { Extension } from '@tiptap/core';

// Import lowlight v3 factory and common languages
import { createLowlight, common } from 'lowlight';

// Create the lowlight instance with common languages registered
const lowlight = createLowlight(common);

// 自定义扩展：支持回车键自定义处理
const EnterKeyCustomHandler = Extension.create({
  name: 'enterKeyHandler',
  addKeyboardShortcuts() {
    return {
      'Enter': ({ editor }) => {
        // 这里不做任何处理，但会阻止默认行为
        // 实际处理逻辑会由外部 onKeyDown 处理
        return true;
      },
    };
  },
});

// 定义自定义的键盘快捷键扩展
const CustomKeyboardShortcuts = Extension.create({
  name: 'customKeyboardShortcuts',
  addKeyboardShortcuts() {
    return {
      // 粗体
      'Mod-b': ({ editor }) => editor.commands.toggleBold(),
      // 斜体
      'Mod-i': ({ editor }) => editor.commands.toggleItalic(),
      // 行内代码
      'Mod-e': ({ editor }) => editor.commands.toggleCode(),
      // 删除线
      'Mod-Shift-s': ({ editor }) => editor.commands.toggleStrike(),
      // 下划线
      'Mod-u': ({ editor }) => editor.commands.toggleUnderline(),
      // 清除格式
      'Mod-\\': ({ editor }) => editor.commands.unsetAllMarks(),
    };
  },
});

// 组合所有扩展
export const tiptapExtensions = [
  // 基础功能包
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3],
    },
    bulletList: {
      keepMarks: true,
      keepAttributes: true,
    },
    orderedList: {
      keepMarks: true,
      keepAttributes: true,
    },
    codeBlock: false, // 使用自定义代码块替代
  }),
  // 代码块语法高亮
  CodeBlockLowlight.configure({
    lowlight, // Pass the created lowlight instance
    languageClassPrefix: 'language-',
  }),
  // 占位符
  Placeholder.configure({
    placeholder: '输入笔记内容...',
    emptyEditorClass: 'is-editor-empty',
  }),
  // 链接支持
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      rel: 'noopener noreferrer',
      target: '_blank',
    },
  }),
  // 下划线
  Underline,
  // 文本样式
  TextStyle,
  // 自定义回车键处理
  EnterKeyCustomHandler,
  // 自定义快捷键
  CustomKeyboardShortcuts,
];
