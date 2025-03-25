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

const TipTapEditor = ({
  note,
  isActive,
  onUpdate,
  onFocus,
  onBlur,
  isEditing,
  onCreateNewNote
}) => {
  // 创建TipTap编辑器实例
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Bold,
      Italic,
      Strike,
      Code,
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
        markdown = htmlToMarkdown.convert(html);
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
      editor.commands.setContent(note.content);
    }
  }, [editor, note?.content]);

  // 处理键盘事件
  useEffect(() => {
    if (!editor) return;

    // 添加键盘事件处理
    const handleKeyDown = (e) => {
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
                // 触发onFocus事件，通知父组件将焦点设置到新笔记
                onFocus(newNoteId);
                
                // 尝试找到新笔记的编辑器元素并将光标设置到末尾
                const newEditorElements = document.querySelectorAll('.ProseMirror');
                let foundEditor = false;
                
                newEditorElements.forEach(el => {
                  // 查找与新笔记ID关联的编辑器元素
                  const editorContainer = el.closest('[data-note-id]');
                  if (editorContainer && editorContainer.getAttribute('data-note-id') === newNoteId.toString()) {
                    foundEditor = true;
                    console.log('找到新笔记编辑器元素:', newNoteId);
                    
                    // 设置焦点
                    el.focus();
                    
                    // 递归查找最后一个文本节点的函数
                    const findLastTextNode = (node) => {
                      if (!node) return null;
                      
                      // 如果是文本节点，直接返回
                      if (node.nodeType === Node.TEXT_NODE) {
                        return node;
                      }
                      
                      // 从最后一个子节点开始向前查找
                      if (node.childNodes && node.childNodes.length > 0) {
                        for (let i = node.childNodes.length - 1; i >= 0; i--) {
                          const textNode = findLastTextNode(node.childNodes[i]);
                          if (textNode) return textNode;
                        }
                      }
                      
                      return null;
                    };
                    
                    // 将光标移动到末尾
                    const selection = window.getSelection();
                    const range = document.createRange();
                    
                    // 确保元素有内容节点
                    if (el.childNodes.length > 0) {
                      // 尝试查找最后一个文本节点
                      const lastTextNode = findLastTextNode(el);
                      
                      if (lastTextNode) {
                        // 如果找到文本节点，将光标设置到文本末尾
                        range.setStart(lastTextNode, lastTextNode.length);
                        range.setEnd(lastTextNode, lastTextNode.length);
                        console.log('设置光标到文本节点末尾');
                      } else {
                        // 如果没有找到文本节点，使用原来的方法
                        const lastChild = el.lastChild;
                        if (lastChild) {
                          if (lastChild.nodeType === Node.TEXT_NODE) {
                            range.setStart(lastChild, lastChild.length);
                            range.setEnd(lastChild, lastChild.length);
                          } else {
                            range.selectNodeContents(lastChild);
                            range.collapse(false); // false表示折叠到末尾
                          }
                          console.log('设置光标到最后一个子节点');
                        } else {
                          // 如果没有子节点，直接选择整个编辑器
                          range.selectNodeContents(el);
                          range.collapse(false);
                          console.log('设置光标到编辑器末尾');
                        }
                      }
                      
                      selection.removeAllRanges();
                      selection.addRange(range);
                    }
                  }
                });
              }
            }, 300); // 增加延时时间确保DOM完全更新
          });
        }
      }
    };

    // 添加事件监听器 - 使用editor.view.dom获取DOM元素
    const editorElement = editor.view.dom;
    if (editorElement) {
      // 在捕获阶段添加事件监听器，确保最先处理事件
      editorElement.addEventListener('keydown', handleKeyDown, true);
    }

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