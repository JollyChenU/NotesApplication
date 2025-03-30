/**
 * @author Trae AI
 * @date 2023-07-10
 * @description TipTap编辑器组件，提供富文本编辑功能
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

// 设置编辑器焦点的辅助函数
const setFocusToEditor = (editorElement, noteId) => {
  try {
    // 尝试使用全局存储的编辑器实例
    if (window.tiptapEditors && window.tiptapEditors[noteId]) {
      window.tiptapEditors[noteId].commands.focus('end');
      return true;
    }
    
    // 如果没有找到编辑器实例，尝试使用DOM API
    if (editorElement) {
      // 将光标设置到编辑器末尾
      const selection = window.getSelection();
      const range = document.createRange();
      
      // 清除当前选择
      selection.removeAllRanges();
      
      // 设置范围到编辑器内容的末尾
      range.selectNodeContents(editorElement);
      range.collapse(false); // false表示折叠到末尾
      
      // 应用新的选择范围
      selection.addRange(range);
      
      // 确保编辑器获得焦点
      editorElement.focus();
      return true;
    }
  } catch (error) {
    console.error('设置编辑器焦点失败:', error);
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
      } catch (error) {
        console.error('Error converting HTML to Markdown:', error);
      }
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
      // 处理方向键
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        // 获取当前编辑器的状态和选择
        const { state } = editor;
        const { selection } = state;
        const { from, to } = selection;
        
        // 获取当前文档的内容大小
        const docSize = state.doc.content.size;
        
        // 判断是否在文档的边界
        const isAtDocumentStart = from === 0;
        const isAtDocumentEnd = to === docSize;
        
        // 获取当前光标所在行的信息
        const $from = state.doc.resolve(from);
        const $to = state.doc.resolve(to);
        
        // 判断是否在第一行或最后一行
        const isAtFirstLine = $from.parentOffset === 0;
        const isAtLastLine = $to.parentOffset === $to.parent.content.size;
        
        // 向下键且在最后一行，或向上键且在第一行时，需要跨笔记块移动
        if ((e.key === 'ArrowDown' && isAtLastLine && isAtDocumentEnd) || 
            (e.key === 'ArrowUp' && isAtFirstLine && isAtDocumentStart)) {
          e.preventDefault();
          
          // 获取当前笔记的ID
          const currentNoteId = note.id;
          
          // 获取所有笔记元素
          const noteElements = document.querySelectorAll('[data-note-id]');
          const noteIds = Array.from(noteElements).map(el => el.getAttribute('data-note-id'));
          
          // 找到当前笔记在列表中的索引
          const currentIndex = noteIds.indexOf(currentNoteId);
          
          if (currentIndex !== -1) {
            let targetNoteId = null;
            
            // 向下移动到下一个笔记
            if (e.key === 'ArrowDown' && currentIndex < noteIds.length - 1) {
              targetNoteId = noteIds[currentIndex + 1];
              
              // 触发onFocus事件，通知父组件将焦点设置到目标笔记
              if (typeof onFocus === 'function') {
                onFocus(targetNoteId);
                
                // 使用setTimeout确保DOM已更新
                setTimeout(() => {
                  // 获取目标编辑器实例
                  const targetEditor = window.tiptapEditors[targetNoteId];
                  if (targetEditor) {
                    // 将光标设置到目标编辑器的开头
                    targetEditor.commands.focus('start');
                  }
                }, 50);
              }
            }
            // 向上移动到上一个笔记
            else if (e.key === 'ArrowUp' && currentIndex > 0) {
              targetNoteId = noteIds[currentIndex - 1];
              
              // 触发onFocus事件，通知父组件将焦点设置到目标笔记
              if (typeof onFocus === 'function') {
                onFocus(targetNoteId);
                
                // 使用setTimeout确保DOM已更新
                setTimeout(() => {
                  // 获取目标编辑器实例
                  const targetEditor = window.tiptapEditors[targetNoteId];
                  if (targetEditor) {
                    // 将光标设置到目标编辑器的末尾
                    targetEditor.commands.focus('end');
                  }
                }, 50);
              }
            }
          }
        }
      }
      
      if (e.key === 'Enter') {
        if (e.shiftKey) {
          // Shift+Enter 实现换行，TipTap默认行为，不需要阻止
          return;
        }
        
        // 阻止默认的回车换行行为
        e.preventDefault();
        e.stopPropagation(); // 阻止事件冒泡
        
        // 获取当前编辑器内容和光标位置
        const selection = editor.state.selection;
        const { from } = selection;
        
        // 获取光标位置前后的内容
        const contentBeforeCursor = editor.state.doc.textBetween(0, from);
        const contentAfterCursor = editor.state.doc.textBetween(from, editor.state.doc.content.size);
        
        // 将HTML转换为Markdown
        let markdownBeforeCursor = contentBeforeCursor;
        let markdownAfterCursor = contentAfterCursor;
        try {
          if (contentBeforeCursor) {
            // 先设置编辑器内容为光标前的内容，然后获取HTML并转换为Markdown
            editor.commands.setContent(contentBeforeCursor);
            markdownBeforeCursor = htmlToMarkdown.convert(editor.getHTML());
          }
          
          if (contentAfterCursor) {
            // 临时设置编辑器内容为光标后的内容，然后获取HTML并转换为Markdown
            editor.commands.setContent(contentAfterCursor);
            markdownAfterCursor = htmlToMarkdown.convert(editor.getHTML());
            
            // 恢复编辑器内容为光标前的内容
            editor.commands.setContent(contentBeforeCursor);
          }
        } catch (error) {
          console.error('Error converting HTML to Markdown:', error);
        }
        
        // 更新当前笔记内容为光标前的内容
        onUpdate(note.id, {
          content: markdownBeforeCursor,
          format: note.format
        });
        
        // 创建新笔记，内容为光标后的内容
        if (typeof onCreateNewNote === 'function') {
          // 传递回调函数，在新笔记创建后获取新笔记ID并设置焦点
          onCreateNewNote(note.id, {
            content: markdownAfterCursor,
            format: note.format
          }, (newNoteId) => {
            // 使用setTimeout确保DOM已更新，增加延时时间以确保DOM完全更新
            setTimeout(() => {
              // 如果提供了新笔记ID，则尝试将焦点设置到新笔记
              if (newNoteId) {
                // 确保DOM完全更新后再设置焦点
                requestAnimationFrame(() => {
                  // 触发onFocus事件，通知父组件将焦点设置到新笔记
                  // 确保newNoteId不是Promise对象
                  if (newNoteId instanceof Promise) {
                    newNoteId.then(id => onFocus(id));
                  } else {
                    onFocus(newNoteId);
                  }
                });
                
                // 尝试找到新笔记的编辑器元素并将光标设置到末尾
                
                // 使用更高效的选择器直接查找目标编辑器元素
                const noteIdStr = newNoteId instanceof Promise ? 
                  newNoteId.then(id => id.toString()) : newNoteId.toString();
                
                // 如果是Promise，等待解析后再查找元素
                if (noteIdStr instanceof Promise) {
                  noteIdStr.then(resolvedId => {
                    const targetSelector = `[data-note-id="${resolvedId}"] .ProseMirror`;
                    const targetEditor = document.querySelector(targetSelector);
                    if (targetEditor) {
                      setFocusToEditor(targetEditor, resolvedId);
                    }
                  });
                  return; // 等待Promise解析，不继续执行
                }
                
                // 直接使用选择器查找目标编辑器元素
                const targetSelector = `[data-note-id="${noteIdStr}"] .ProseMirror`;
                const targetEditor = document.querySelector(targetSelector);
                let foundEditor = false;
                
                if (targetEditor) {
                  foundEditor = true;
                  setFocusToEditor(targetEditor, noteIdStr);
                }
                
                // 如果没有找到编辑器，尝试多次查找
                if (typeof foundEditor === 'undefined' || !foundEditor) {
                  // 第一次尝试未找到编辑器，稍后再次尝试
                  
                  // 定义重试函数
                  const retryFindEditor = (attempt = 1, maxAttempts = 3) => {
                    // 开始下一次尝试查找编辑器元素
                    
                    // 首先尝试使用全局存储的编辑器实例
                    // 检查全局编辑器实例
                    // 处理newNoteId可能是Promise的情况
                    const noteId = newNoteId instanceof Promise ? newNoteId.then(id => id) : newNoteId;
                    const editorInstance = window.tiptapEditors && (noteId instanceof Promise ? null : window.tiptapEditors[noteId]);
                    
                    if (editorInstance) {
                      // 尝试找到编辑器实例
                      try {
                        // 使用TipTap API设置焦点和光标
                        // 使用TipTap API设置焦点
                        editorInstance.commands.focus('end');
                        // TipTap API设置焦点成功
                        return true; // 成功找到并设置
                      } catch (error) {
                        console.error(`第${attempt+1}次尝试使用TipTap API设置焦点失败:`, error);
                      }
                    } else {
                      // 未找到编辑器实例，尝试使用DOM查找
                    }
                    
                    // 如果没有找到编辑器实例或设置失败，尝试使用DOM查找
                    const retryEditorElements = document.querySelectorAll('.ProseMirror');
                    // 查找ProseMirror元素
                    
                    // 记录所有找到的data-note-id
                    const allNoteIds = [];
                    document.querySelectorAll('[data-note-id]').forEach(el => {
                      allNoteIds.push(el.getAttribute('data-note-id'));
                    });
                    // 获取页面上所有的data-note-id
                    
                    let found = false;
                    
                    retryEditorElements.forEach((el, index) => {
                      // 检查ProseMirror元素
                      const editorContainer = el.closest('[data-note-id]');
                      if (editorContainer) {
                        // 检查容器元素data-note-id
                      }
                      
                      // 处理newNoteId可能是Promise的情况
                      const noteIdStr = newNoteId instanceof Promise ? 
                        newNoteId.then(id => id.toString()) : newNoteId.toString();
                      
                      // 比较data-note-id和noteId
                      if (editorContainer && (noteIdStr instanceof Promise ? 
                        false : // Promise情况下先跳过，等待异步处理
                        editorContainer.getAttribute('data-note-id') === noteIdStr)) {
                        // 找到新笔记编辑器元素
                        found = true;
                        setFocusToEditor(el, noteIdStr);
                        return true;
                      }
                    });
                    
                    // 如果仍未找到且未达到最大尝试次数，继续重试
                    if (!found && attempt < maxAttempts) {
                      // 未找到编辑器，将再次尝试
                      setTimeout(() => retryFindEditor(attempt + 1, maxAttempts), 8);
                    } else if (!found) {
                      // 已达到最大尝试次数，放弃查找编辑器
                    }
                    
                    return found;
                  };
                  
                  // 开始第一次重试
                  setTimeout(() => retryFindEditor(), 0);
                }
              }
            }, 310); // 增加延时时间确保DOM完全更新
          });
        }
      }
    };

    // 添加事件监听器 - 使用editor.view.dom获取DOM元素
    const editorElement = editor?.view?.dom;
    if (editorElement) {
      // 在捕获阶段添加事件监听器，确保最先处理事件
      editorElement.addEventListener('keydown', handleKeyDown, true);
    };

    // 清理函数
    return () => {
      if (editorElement) {
        editorElement.removeEventListener('keydown', handleKeyDown, true);
      }
    };
  }, [editor, note?.id, note?.format, onUpdate, onCreateNewNote]);

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