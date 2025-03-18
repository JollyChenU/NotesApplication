/**
 * @author Jolly
 * @date 2025-03-01
 * @description 笔记编辑器组件，负责处理笔记的编辑功能
 */

import React, { useState } from 'react';
import { Box, IconButton } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ReactMarkdown from 'react-markdown';

const NoteEditor = ({
  note,
  isActive,
  onUpdate,
  onFocus,
  onBlur,
  isEditing,
  onCreateNewNote
}) => {
  const [pressTimer, setPressTimer] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isEditorVisible, setIsEditorVisible] = useState(false);

  const handleDragStart = (e) => {
    if (isDragging) {
      e.dataTransfer.setData('text/plain', note.id);
    }
  };

  const handleMouseDown = (e) => {
    const timer = setTimeout(() => {
      setIsDragging(true);
    }, 500);
    setPressTimer(timer);
  };

  const handleMouseUp = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
    setIsDragging(false);
  };

  const getMarkdownStyles = () => {
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
      boxShadow: isActive ? '0 0 0 2px #1976d2' : 'none',
      transition: 'box-shadow 0.2s ease-in-out',
      '&:hover': {
        boxShadow: '0 0 0 1px rgba(25, 118, 210, 0.5)'
      }
    };

    switch (note.format) {
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

  const renderContent = () => {
    if (!note || !note.content) return '';
    let content = String(note.content);
    switch (note.format) {
      case 'bullet':
        content = content.split('\n').map(line => `• ${line}`).join('\n');
        break;
      case 'number':
        content = content.split('\n').map((line, index) => `${index + 1}. ${line}`).join('\n');
        break;
      case 'quote':
        content = content.split('\n').map(line => `> ${line}`).join('\n');
        break;
      case 'h1':
      case 'h2':
      case 'h3':
        content = content;
        break;
      default:
        break;
    }
    return content;
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}
         onMouseEnter={() => setIsEditorVisible(true)}
         onMouseLeave={() => setIsEditorVisible(false)}>
      <Box
        component="div"
        sx={{
          position: 'relative',
          width: '100%',
          overflow: 'hidden',
          '& textarea': {
            ...getMarkdownStyles(),
            position: 'absolute',
            top: 0,
            left: 0,
            border: 'none',
            outline: 'none',
            resize: 'none',
            background: 'transparent',
            opacity: isEditorVisible ? 1 : 0,
            zIndex: isEditorVisible ? 2 : 1
          },
          '& .markdown-preview': {
            ...getMarkdownStyles(),
            opacity: isEditorVisible ? 0 : 1,
            zIndex: isEditorVisible ? 1 : 2
          }
        }}
      >
        <textarea
          data-note-id={note.id}
          value={note.content}
          onChange={(e) => {
            onUpdate(note.id, {
              content: e.target.value,
              format: note.format
            });
            e.target.style.height = 'auto';
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (e.shiftKey) {
                // Shift+Enter 实现换行
                return;
              }
              // 阻止默认的回车换行行为
              e.preventDefault();
              
              // 获取光标位置和内容
              const cursorPosition = e.target.selectionStart;
              const currentContent = note.content;
              const contentBeforeCursor = currentContent.substring(0, cursorPosition);
              const contentAfterCursor = currentContent.substring(cursorPosition);
              // 更新当前笔记块的内容
              // 更新当前笔记内容
              onUpdate(note.id, {
                content: contentBeforeCursor,
              });
              
              // 创建新的笔记块，并将光标后的内容移入新笔记块
              // 确保在更新当前笔记块后再创建新笔记块
              try {
                setTimeout(() => {
                  // 创建新笔记，并将光标后的内容作为新笔记的内容
                  onCreateNewNote(note.id, {
                    content: contentAfterCursor,
                    format: note.format
                  }, 0);
                }, 0);
              } catch (error) {
                console.error('创建新笔记时出错:', error);
              }
            }
          }}
          onFocus={() => onFocus(note.id)}
          onBlur={onBlur}
        />
        <div className="markdown-preview">
          {renderContent()}
        </div>
      </Box>
    </Box>
  );
};

export default NoteEditor;