/**
 * @author Jolly
 * @date 2025-04-01
 * @description TipTap编辑器组件，提供富文本编辑功能
 * @version 1.1.0
 * @license GPL-3.0
 */

import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Strike from '@tiptap/extension-strike';
import Code from '@tiptap/extension-code';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Box } from '@mui/material';
import htmlToMarkdown from 'html-to-markdown';

// 改进设置编辑器焦点的辅助函数，确保可靠地设置焦点
const setFocusToEditor = (editorElement, noteId, position = 'end') => {
  try {
    // 尝试使用全局存储的编辑器实例（最可靠的方法）
    if (window.tiptapEditors && window.tiptapEditors[noteId]) {
      window.tiptapEditors[noteId].commands.focus(position);

      // 强制触发一次点击以确保获得焦点
      if (window.tiptapEditors[noteId].view && window.tiptapEditors[noteId].view.dom) {
        window.tiptapEditors[noteId].view.dom.click();
      }
      return true;
    }

    // 如果没有找到编辑器实例，尝试使用DOM API
    if (!editorElement && noteId) {
      // 尝试通过noteId查找编辑器元素
      const editorContainer = document.querySelector(`[data-note-id="${noteId}"]`);
      if (editorContainer) {
        editorElement = editorContainer.querySelector('.ProseMirror');
      }
    }

    if (editorElement) {
      // 首先确保元素可见并可滚动到视图中
      editorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // 强制获得焦点
      editorElement.focus();

      // 将光标设置到编辑器指定位置
      const selection = window.getSelection();
      const range = document.createRange();

      // 清除当前选择
      selection.removeAllRanges();

      if (editorElement.firstChild) {
        // 如果有内容，根据position决定光标位置
        if (position === 'start') {
          range.setStart(editorElement.firstChild, 0);
          range.collapse(true);
        } else {
          // 设置到最后位置
          const lastNode = editorElement.lastChild || editorElement;
          const lastTextNode = lastNode.lastChild || lastNode;
          const offset = lastTextNode.textContent ? lastTextNode.textContent.length : 0;
          try {
            range.setStart(lastTextNode, offset);
            range.collapse(true);
          } catch (err) {
            range.selectNodeContents(editorElement);
            range.collapse(false); // false表示末尾
          }
        }
      } else {
        // 如果没有内容，就选择整个编辑器
        range.selectNodeContents(editorElement);
        range.collapse(position === 'start');
      }

      // 应用新的选择范围
      selection.addRange(range);

      // 确保编辑器获得焦点（再次尝试）
      setTimeout(() => editorElement.focus(), 0);

      return true;
    }
  } catch (error) {
    return false;
  }
  return false;
};

const TipTapEditor = ({
  note,
  isActive,
  onUpdate,
  onFocus,
  onBlur,
  isEditing,
  onCreateNewNote
}) => {
  // 创建全局存储编辑器实例的对象
  if (!window.tiptapEditors) {
    window.tiptapEditors = {};
  }

  // 创建TipTap编辑器实例
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Bold.configure({
        // 配置Bold扩展以支持Markdown语法
        HTMLAttributes: {
          class: 'font-bold',
        },
        parseHTML: () => [
          {
            tag: 'strong',
          },
          {
            tag: 'b',
          },
          {
            style: {
              'font-weight': 'bold',
            },
          },
        ],
        renderHTML: ({ HTMLAttributes }) => ['strong', HTMLAttributes, 0],
        // 添加输入规则，处理Markdown风格的加粗语法
        addInputRules() {
          return [
            // 当输入**text**时，将其转换为加粗文本，并确保光标位于加粗文本之后
            {
              find: /(?:\*\*)((?:[^*]+))(?:\*\*)$/,
              handler: ({ state, range, match }) => {
                const { tr } = state;
                const start = range.from;
                const end = range.to;
                const textToEmbolden = match[1];

                // 删除原始的**text**
                tr.delete(start, end);

                // 插入加粗文本
                const boldText = this.type.create();
                tr.insert(start, boldText);
                tr.insertText(textToEmbolden, start + 1);

                // 将光标位置设置在加粗文本之后
                tr.setSelection(state.selection.constructor.create(
                  tr.doc,
                  start + textToEmbolden.length + 1
                ));

                // 确保光标位于加粗区域之外，后续输入不会继续应用加粗格式
                setTimeout(() => {
                  if (this.editor) {
                    this.editor.commands.unsetBold();
                  }
                }, 0);

                return tr;
              }
            }
          ];
        }
      }),
      Italic.configure({
        // 配置Italic扩展以支持Markdown语法
        HTMLAttributes: {
          class: 'font-italic',
        },
        parseHTML: () => [
          {
            tag: 'em',
          },
          {
            tag: 'i',
          },
          {
            style: {
              'font-style': 'italic',
            },
          },
        ],
        renderHTML: ({ HTMLAttributes }) => ['em', HTMLAttributes, 0],
        // 添加输入规则，处理Markdown风格的斜体语法
        addInputRules() {
          return [
            // 当输入*text*时，将其转换为斜体文本，并确保光标位于斜体文本之后
            {
              find: /(?:\*)((?:[^*]+))(?:\*)$/,
              handler: ({ state, range, match }) => {
                const { tr } = state;
                const start = range.from;
                const end = range.to;
                const textToItalicize = match[1];

                // 删除原始的*text*
                tr.delete(start, end);

                // 插入斜体文本
                const italicText = this.type.create();
                tr.insert(start, italicText);
                tr.insertText(textToItalicize, start + 1);

                // 将光标位置设置在斜体文本之后
                tr.setSelection(state.selection.constructor.create(
                  tr.doc,
                  start + textToItalicize.length + 1
                ));

                // 确保光标位于斜体区域之外，后续输入不会继续应用斜体格式
                setTimeout(() => {
                  if (this.editor) {
                    this.editor.commands.unsetItalic();
                  }
                }, 0);

                return tr;
              }
            }
          ];
        }
      }),
      Strike.configure({
        // 配置Strike扩展以支持Markdown语法
        HTMLAttributes: {
          class: 'line-through',
        },
        parseHTML: () => [
          {
            tag: 's',
          },
          {
            tag: 'del',
          },
          {
            style: {
              'text-decoration': 'line-through',
            },
          },
        ],
        renderHTML: ({ HTMLAttributes }) => ['s', HTMLAttributes, 0],
        // 添加输入规则，处理Markdown风格的删除线语法
        addInputRules() {
          return [
            // 当输入~~text~~时，将其转换为删除线文本，并确保光标位于删除线文本之后
            {
              find: /(?:~~)((?:[^~]+))(?:~~)$/,
              handler: ({ state, range, match }) => {
                const { tr } = state;
                const start = range.from;
                const end = range.to;
                const textToStrike = match[1];

                // 删除原始的~~text~~
                tr.delete(start, end);

                // 插入删除线文本
                const strikeText = this.type.create();
                tr.insert(start, strikeText);
                tr.insertText(textToStrike, start + 1);

                // 将光标位置设置在删除线文本之后
                tr.setSelection(state.selection.constructor.create(
                  tr.doc,
                  start + textToStrike.length + 1
                ));

                // 确保光标位于删除线区域之外，后续输入不会继续应用删除线格式
                setTimeout(() => {
                  if (this.editor) {
                    this.editor.commands.unsetStrike();
                  }
                }, 0);

                return tr;
              }
            }
          ];
        }
      }),
      Code.configure({
        // 配置Code扩展以支持Markdown语法
        HTMLAttributes: {
          class: 'inline-code',
        },
        parseHTML: () => [
          {
            tag: 'code',
          },
        ],
        renderHTML: ({ HTMLAttributes }) => ['code', HTMLAttributes, 0],
        // 添加输入规则，处理Markdown风格的行内代码语法
        addInputRules() {
          return [
            // 当输入`text`时，将其转换为行内代码，并确保光标位于行内代码之后
            {
              find: /(?:`)((?:[^`]+))(?:`)$/,
              handler: ({ state, range, match }) => {
                const { tr } = state;
                const start = range.from;
                const end = range.to;
                const textToCode = match[1];

                // 删除原始的`text`
                tr.delete(start, end);

                // 插入行内代码
                const codeText = this.type.create();
                tr.insert(start, codeText);
                tr.insertText(textToCode, start + 1);

                // 将光标位置设置在行内代码之后
                tr.setSelection(state.selection.constructor.create(
                  tr.doc,
                  start + textToCode.length + 1
                ));

                // 确保光标位于行内代码区域之外，后续输入不会继续应用行内代码格式
                setTimeout(() => {
                  if (this.editor) {
                    this.editor.commands.unsetCode();
                  }
                }, 0);

                return tr;
              }
            }
          ];
        }
      }),
      Link,
      Image,
      StarterKit.configure({
        // 禁用已单独引入的扩展，避免冲突
        document: false,
        paragraph: false,
        text: false,
        bold: false,
        italic: false,
        strike: false,
        code: false,
      }),
    ],
    content: note?.content || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // 将HTML转换为Markdown
      let markdown = html;
      try {
        // 使用自定义处理确保所有行内格式正确转换
        markdown = htmlToMarkdown.convert(html);

        // 修复各种行内格式的转换问题
        // 查找所有<strong>标签并替换为Markdown的**格式
        const strongRegex = /<strong>(.*?)<\/strong>/g;
        // 查找所有<em>标签并替换为Markdown的*格式
        const emRegex = /<em>(.*?)<\/em>/g;
        // 查找所有<s>标签并替换为Markdown的~~格式
        const strikeRegex = /<s>(.*?)<\/s>/g;
        // 查找所有<code>标签并替换为Markdown的`格式
        const codeRegex = /<code>(.*?)<\/code>/g;

        // 检查是否存在需要手动处理的行内格式
        if (strongRegex.test(html) || emRegex.test(html) || strikeRegex.test(html) || codeRegex.test(html)) {
          // 先进行手动替换
          markdown = html;
          if (strongRegex.test(markdown)) {
            markdown = markdown.replace(strongRegex, '**$1**');
          }
          if (emRegex.test(markdown)) {
            markdown = markdown.replace(emRegex, '*$1*');
          }
          if (strikeRegex.test(markdown)) {
            markdown = markdown.replace(strikeRegex, '~~$1~~');
          }
          if (codeRegex.test(markdown)) {
            markdown = markdown.replace(codeRegex, '`$1`');
          }

          // 如果还有其他HTML标签，继续使用htmlToMarkdown处理
          if (/<[^>]*>/g.test(markdown)) {
            markdown = htmlToMarkdown.convert(markdown);
          }
        }
      } catch (error) {}
      onUpdate(note.id, {
        content: markdown,
        format: note.format
      });
    },
    onFocus: () => {
      onFocus(note.id);
    },
    onBlur: onBlur,
  });

  // 当note内容变化时更新编辑器内容
  useEffect(() => {
    if (editor && note?.content !== undefined && editor.getHTML() !== note.content) {
      // 处理各种Markdown行内格式语法，将其转换为对应的HTML标签
      let processedContent = note.content;

      // 处理加粗语法，将**text**转换为<strong>text</strong>
      const boldRegex = /\*\*(.*?)\*\*/g;
      if (boldRegex.test(processedContent)) {
        processedContent = processedContent.replace(boldRegex, '<strong>$1</strong>');
      }

      // 处理斜体语法，将*text*转换为<em>text</em>
      const italicRegex = /(?<!\*)\*((?:[^\*]+))\*(?!\*)/g;
      if (italicRegex.test(processedContent)) {
        processedContent = processedContent.replace(italicRegex, '<em>$1</em>');
      }

      // 处理删除线语法，将~~text~~转换为<s>text</s>
      const strikeRegex = /~~(.*?)~~/g;
      if (strikeRegex.test(processedContent)) {
        processedContent = processedContent.replace(strikeRegex, '<s>$1</s>');
      }

      // 处理行内代码语法，将`text`转换为<code>text</code>
      const codeRegex = /`([^`]+)`/g;
      if (codeRegex.test(processedContent)) {
        processedContent = processedContent.replace(codeRegex, '<code>$1</code>');
      }
      editor.commands.setContent(processedContent);
    }
  }, [editor, note?.content]);

  // 将编辑器实例存储到全局对象中
  useEffect(() => {
    if (editor && note?.id) {
      window.tiptapEditors[note.id] = editor;

      return () => {
        // 在组件卸载时删除编辑器实例
        delete window.tiptapEditors[note.id];
      };
    }
  }, [editor, note?.id]);

  // 处理键盘事件
  useEffect(() => {
    if (!editor) return;

    // 添加键盘事件处理
    const handleKeyDown = (e) => {
      // 获取所有笔记ID并处理重复问题
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

      // 找到当前笔记在去重列表中的位置
      const currentIndex = uniqueNoteIds.indexOf(currentId);

      if (currentIndex === -1) {
        // 如果找不到当前笔记，尝试备用方法
        // 备用方法：查找包含当前活动元素的笔记容器
        const activeElement = document.activeElement;
        let currentNoteElement = activeElement;

        // 向上遍历DOM树，查找包含data-note-id属性的父元素
        while (currentNoteElement && !currentNoteElement.hasAttribute('data-note-id')) {
          currentNoteElement = currentNoteElement.parentElement;
        }

        if (currentNoteElement) {
          const backupCurrentId = currentNoteElement.getAttribute('data-note-id');
          const backupIndex = uniqueNoteIds.indexOf(String(backupCurrentId));

          // 使用备用方法找到的索引
          if (backupIndex !== -1) {
            // 继续使用备用索引处理导航
            navigateBetweenNotes(e, backupCurrentId, backupIndex, uniqueNoteIds);
            return;
          }
        }

        return; // 如果备用方法也失败，则退出
      }

      // 使用正常索引处理导航
      navigateBetweenNotes(e, currentId, currentIndex, uniqueNoteIds);
    };

    // 抽取导航逻辑为单独函数，以便可以从多个地方调用
    const navigateBetweenNotes = (e, currentId, currentIndex, uniqueNoteIds) => {
      let targetNoteId = null;
      let focusPosition = 'end';
      let shouldNavigateBetweenNotes = false;

      // 更全面的光标位置检测 - 包括视觉位置检测
      try {
        // 首先获取基本位置信息
        const isAtDocumentStart = editor.state.selection.$from.pos === 0;
        const isAtDocumentEnd = editor.state.selection.$to.pos === editor.state.doc.content.size;

        // 获取更详细的段落位置信息
        const isAtParagraphStart = editor.state.selection.$from.parentOffset === 0;
        const isAtParagraphEnd = editor.state.selection.$from.parentOffset === editor.state.selection.$from.parent.content.size;

        // 检测当前光标是否在可见的第一行或最后一行 - 通过选区位置计算
        let caretRect = null;
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          caretRect = selection.getRangeAt(0).getBoundingClientRect();
        }

        // 获取编辑器容器位置
        const editorElement = editor.view.dom;
        const editorRect = editorElement.getBoundingClientRect();

        // 视觉上判断是否在第一行或最后一行
        const isVisuallyAtFirstLine = caretRect && Math.abs(caretRect.top - editorRect.top) < 20;
        const isVisuallyAtLastLine = caretRect && Math.abs(caretRect.bottom - editorRect.bottom) < 20;

        // 处理方向键逻辑
        if (e.key === 'ArrowUp') {
          // 如果是在文档开头、段落开头或视觉上在第一行，则移动到上一个笔记
          if (isAtDocumentStart || (isAtParagraphStart && isVisuallyAtFirstLine)) {
            // 移动到上一个笔记
            if (currentIndex > 0) {
              shouldNavigateBetweenNotes = true;
              targetNoteId = uniqueNoteIds[currentIndex - 1];
              focusPosition = 'end';
            }
          }
        }
        else if (e.key === 'ArrowDown') {
          // 如果是在文档末尾、段落末尾或视觉上在最后一行，则移动到下一个笔记
          if (isAtDocumentEnd || (isAtParagraphEnd && isVisuallyAtLastLine)) {
            if (currentIndex < uniqueNoteIds.length - 1) {
              shouldNavigateBetweenNotes = true;
              targetNoteId = uniqueNoteIds[currentIndex + 1];
              focusPosition = 'start';
            }
          }
        }
        else if (e.key === 'ArrowLeft') {
          if (isAtDocumentStart) {
            if (currentIndex > 0) {
              shouldNavigateBetweenNotes = true;
              targetNoteId = uniqueNoteIds[currentIndex - 1];
              focusPosition = 'end';
            }
          }
        }
        else if (e.key === 'ArrowRight') {
          if (isAtDocumentEnd) {
            if (currentIndex < uniqueNoteIds.length - 1) {
              shouldNavigateBetweenNotes = true;
              targetNoteId = uniqueNoteIds[currentIndex + 1];
              focusPosition = 'start';
            }
          }
        }
      } catch (error) {}

      // 如果需要跨笔记块移动且有目标笔记ID
      if (shouldNavigateBetweenNotes && targetNoteId) {
        // 如果目标ID与当前ID相同，尝试获取下一个不同的ID
        if (targetNoteId === currentId) {
          if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
            // 向下或向右导航，查找当前索引之后的不同ID
            for (let i = currentIndex + 1; i < uniqueNoteIds.length; i++) {
              if (uniqueNoteIds[i] !== currentId) {
                targetNoteId = uniqueNoteIds[i];
                break;
              }
            }
          } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
            // 向上或向左导航，查找当前索引之前的不同ID
            for (let i = currentIndex - 1; i >= 0; i--) {
              if (uniqueNoteIds[i] !== currentId) {
                targetNoteId = uniqueNoteIds[i];
                break;
              }
            }
          }
        }

        // 再次检查，如果目标ID仍然与当前ID相同，则放弃导航
        if (targetNoteId === currentId) {
          return;
        }

        // 强制阻止默认行为
        e.preventDefault();
        e.stopPropagation();

        // 使用异步函数确保在下一个事件循环执行导航
        setTimeout(() => {
          if (onFocus) {
            onFocus(targetNoteId);
          }

          // 确保目标笔记可见
          const targetEditorContainer = document.querySelector(`[data-note-id="${targetNoteId}"]`);
          if (targetEditorContainer) {
            targetEditorContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }

          // 多轮重试设置焦点
          const maxRetries = 5; // 增加重试次数
          let currentRetry = 0;

          const trySetFocus = () => {
            // 1. 优先使用全局存储的编辑器实例
            if (window.tiptapEditors && window.tiptapEditors[targetNoteId]) {
              window.tiptapEditors[targetNoteId].commands.focus(focusPosition);
              return true;
            }

            // 2. 然后尝试通过DOM查找编辑器元素
            const targetEditor = document.querySelector(`[data-note-id="${targetNoteId}"] .ProseMirror`);
            if (targetEditor) {
              const result = setFocusToEditor(targetEditor, targetNoteId, focusPosition);
              if (result) {
                return true;
              }
            }

            // 如果尚未达到最大重试次数，则继续尝试
            if (++currentRetry < maxRetries) {
              setTimeout(trySetFocus, 50 * currentRetry);
            } else {
              // 最后的尝试：模拟点击目标元素
              const targetElement = document.querySelector(`[data-note-id="${targetNoteId}"]`);
              if (targetElement) {
                targetElement.click();
              }
            }

            return false;
          };

          // 开始第一次尝试设置焦点
          trySetFocus();

        }, 10); // 短延时确保DOM已更新

        return false; // 确保不再处理这个事件
      }
    };

    // 全局处理键盘事件，以避免其他元素阻止事件传播
    const globalKeyHandler = (e) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' ||
        e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        // 检查当前活动元素是否是此笔记的编辑器
        const activeElement = document.activeElement;

        // 寻找活动元素对应的笔记容器
        let noteContainer = null;
        let currentElement = activeElement;

        // 向上遍历DOM树，查找包含data-note-id属性的父元素
        while (currentElement && !noteContainer) {
          if (currentElement.hasAttribute && currentElement.hasAttribute('data-note-id')) {
            noteContainer = currentElement;
          }
          currentElement = currentElement.parentElement;
        }

        // 如果找到笔记容器，并且ID匹配，则处理键盘事件
        if (noteContainer && String(noteContainer.getAttribute('data-note-id')) === String(note?.id)) {
          handleKeyDown(e);
        }
      }
    };

    // 添加事件监听器 - 同时监听全局和编辑器元素
    document.addEventListener('keydown', globalKeyHandler, true);

    const editorElement = editor?.view?.dom;
    if (editorElement) {
      editorElement.addEventListener('keydown', handleKeyDown, true);
    }

    // 清理函数
    return () => {
      document.removeEventListener('keydown', globalKeyHandler, true);

      if (editorElement) {
        editorElement.removeEventListener('keydown', handleKeyDown, true);
      }
    };
  }, [editor, note?.id, note?.format, onUpdate, onCreateNewNote, onFocus]);

  // 根据笔记格式获取样式
  const getEditorStyles = () => {
    const baseStyles = {
      width: '100%',
      minHeight: '1em',
      height: 'fit-content',
      lineHeight: '1.5',
      overflow: 'hidden',
      whiteSpace: 'pre-wrap',
      wordWrap: 'break-word',
      fontFamily: 'inherit',
      fontSize: 'inherit',
      padding: '2px 8px',
      boxShadow: 'none',
      border: 'none',
      transition: 'all 0.3s ease-in-out',
      '&:hover': {
        boxShadow: 'none',
        border: 'none'
      }
    };

    switch (note?.format) {
      case 'h1':
        return { ...baseStyles, fontSize: '2em', fontWeight: 'bold' };
      case 'h2':
        return { ...baseStyles, fontSize: '1.5em', fontWeight: 'bold' };
      case 'h3':
        return { ...baseStyles, fontSize: '1.17em', fontWeight: 'bold' };
      case 'bullet':
        return { ...baseStyles, paddingLeft: '20px', listStyleType: 'disc' };
      case 'number':
        return { ...baseStyles, paddingLeft: '20px', listStyleType: 'decimal' };
      case 'quote':
        return { ...baseStyles, paddingLeft: '20px', borderLeft: '4px solid #ccc', fontStyle: 'italic' };
      case 'highlight':
        return { ...baseStyles, backgroundColor: 'rgba(255, 235, 59, 0.2)' };
      default:
        return baseStyles;
    }
  };

  return (
    <Box
      data-note-id={note?.id} // 添加data-note-id属性，用于方向键导航功能识别笔记块
      sx={{
        position: 'relative',
        width: '100%',
        overflow: 'hidden',
        '& .ProseMirror': {
          ...getEditorStyles(),
          outline: 'none',
          caretColor: '#3f51b5',
          color: '#000000',
          '&:focus': {
            border: 'none',
            outline: 'none',
            boxShadow: 'none'
          },
          '& p': {
            margin: 0,
          },
          '& strong': {
            fontWeight: 'bold',
          },
          '& em': {
            fontStyle: 'italic',
          },
          '& code': {
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            padding: '0.2em 0.4em',
            borderRadius: '3px',
            fontFamily: 'monospace',
          },
          '& a': {
            color: '#3f51b5',
            textDecoration: 'underline',
          },
          '& img': {
            maxWidth: '100%',
          },
          '& s': {
            textDecoration: 'line-through',
          },
        }
      }}
    >
      <EditorContent editor={editor} />
    </Box>
  );
};

export default TipTapEditor;