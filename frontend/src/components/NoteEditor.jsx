/**
 * 文件名: NoteEditor.jsx
 * 组件: 笔记编辑器组件
 * 描述: 包含拖拽手柄和TipTap编辑器的复合组件，支持笔记内容的编辑和格式化
 * 
 * Props:
 *   - note: 笔记对象，包含id、content、format等属性
 *   - isActive: 是否为当前活跃的笔记
 *   - onUpdate: 内容更新回调函数
 *   - onFocus: 获得焦点回调函数
 *   - onBlur: 失去焦点回调函数
 * 
 * 功能:
 *   - 富文本编辑器集成
 *   - 拖拽排序支持
 *   - 实时内容保存
 *   - 焦点状态管理
 * 
 * 作者: Jolly
 * 创建时间: 2025-04-01
 * 最后修改: 2025-06-04
 * 版本: 1.2.0
 * 许可证: Apache-2.0
 */

import React, { useState } from 'react';
import { Box, IconButton } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import TipTapEditor from './TipTapEditor';

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

  // 确保onCreateNewNote是一个函数，并支持回调函数
  const handleCreateNewNote = (noteId, data, callback) => {
    if (typeof onCreateNewNote === 'function') {
      onCreateNewNote(noteId, data, callback);
    } else {
      console.error('onCreateNewNote is not a function');
    }
  };

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
      boxShadow: 'none',
      border: 'none',
      transition: 'all 0.3s ease-in-out',
      '&:hover': {
        boxShadow: 'none',
        border: 'none'
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
    <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%', maxWidth: 'calc(100% - 40px)' }}
         onMouseEnter={() => setIsEditorVisible(true)}
         onMouseLeave={() => setIsEditorVisible(false)}>
      <TipTapEditor
        note={note}
        isActive={isActive}
        onUpdate={onUpdate}
        onFocus={onFocus}
        onBlur={onBlur}
        isEditing={isEditing}
        onCreateNewNote={handleCreateNewNote}
      />
    </Box>
  );
};

export default NoteEditor;