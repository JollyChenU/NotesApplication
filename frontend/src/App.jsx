import React, { useState, useEffect, useCallback } from 'react';
import { Container, Box, Paper, Typography, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import NoteDragHandle from '@mui/icons-material/DragIndicator';

// 后端API的基础URL
const API_URL = 'http://127.0.0.1:5000/api';

/**
 * 防抖函数，用于限制函数的执行频率
 * @param {Function} func - 需要执行的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} - 返回一个防抖处理后的函数
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 主应用组件
 * 实现了笔记的增删改查功能，以及拖拽排序和Markdown预览
 */
function App() {
  // 存储所有笔记的状态
  const [notes, setNotes] = useState([]);
  // 当前活动笔记的ID
  const [activeNoteId, setActiveNoteId] = useState(null);
  // 当前正在拖拽的笔记ID
  const [draggingNoteId, setDraggingNoteId] = useState(null);
  // 鼠标位置状态
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  // 拖拽放置位置指示器状态
  const [dropIndicatorIndex, setDropIndicatorIndex] = useState(null);

  // 组件挂载时获取笔记列表和设置全局mouseup事件
  useEffect(() => {
    fetchNotes();
    
    // 添加全局mouseup事件监听器
    const handleGlobalMouseUp = () => {
      if (draggingNoteId) {
        setDraggingNoteId(null);
      }
    };

    // 添加全局mousemove事件监听器
    const handleGlobalMouseMove = (e) => {
      if (draggingNoteId) {
        setMousePosition({ x: e.clientX, y: e.clientY });
        
        // 计算拖拽指示器位置
        const noteElements = document.querySelectorAll('[data-note-container]');
        let targetIndex = null;
        
        noteElements.forEach((element, index) => {
          const rect = element.getBoundingClientRect();
          const mouseY = e.clientY;
          
          // 检查鼠标是否在当前笔记的上半部分
          if (mouseY < rect.top + rect.height / 2) {
            if (targetIndex === null) targetIndex = index;
          }
        });
        
        // 如果鼠标在所有笔记下方，则将指示器放在最后
        if (targetIndex === null && noteElements.length > 0) {
          targetIndex = noteElements.length;
        }
        
        setDropIndicatorIndex(targetIndex);
      }
    };
    
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('mousemove', handleGlobalMouseMove);
    
    // 组件卸载时移除事件监听器
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      setDropIndicatorIndex(null);
    };
  }, [draggingNoteId]);

  /**
   * 使用防抖优化的API更新函数
   * 当用户连续输入时，会延迟500ms才发送请求
   * 这样可以减少服务器压力，同时保持良好的用户体验
   */
  const debouncedApiUpdate = useCallback(
    debounce(async (id, content) => {
      try {
        await axios.put(`${API_URL}/notes/${id}`, {
          title: 'Note',
          content
        });
      } catch (error) {
        console.error('Error updating note:', error);
      }
    }, 500),
    []
  );

  /**
   * 从服务器获取所有笔记
   */
  const fetchNotes = async () => {
    try {
      const response = await axios.get(`${API_URL}/notes`);
      setNotes(response.data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  /**
   * 创建新笔记
   */
  const createNote = async () => {
    try {
      const response = await axios.post(`${API_URL}/notes`, {
        title: 'New Note',
        content: '# Start writing here...'
      });
      fetchNotes();
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  /**
   * 更新笔记内容
   * 采用了优化策略：立即更新本地状态，延迟发送API请求
   * 这样可以让用户立即看到更改，同时避免频繁的API调用
   * @param {number} id - 笔记ID
   * @param {string} content - 笔记内容
   */
  const updateNote = (id, content) => {
    // 立即更新本地状态，提供即时反馈
    setNotes(notes.map(note => 
      note.id === id ? { ...note, content } : note
    ));
    // 使用防抖函数延迟发送API请求，避免频繁调用
    debouncedApiUpdate(id, content);
  };

  /**
   * 删除笔记
   * @param {number} id - 要删除的笔记ID
   */
  const deleteNote = async (id) => {
    try {
      await axios.delete(`${API_URL}/notes/${id}`);
      fetchNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* 拖拽时的阴影笔记块 */}
      {draggingNoteId && (
        <Box
          sx={{
            position: 'fixed',
            left: mousePosition.x + 20,
            top: mousePosition.y - 20,
            zIndex: 1000,
            pointerEvents: 'none',
            width: '300px'
          }}
        >
          <Paper
            sx={{
              p: 2,
              background: '#ffffff',
              opacity: 0.6,
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
            }}
          >
            {notes.find(note => note.id === draggingNoteId)?.content}
          </Paper>
        </Box>
      )}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          My Notes
        </Typography>
        <IconButton onClick={createNote} color="primary" size="large">
          <AddIcon />
        </IconButton>
      </Box>

      <Box sx={{ position: 'relative' }}>
        {/* 拖拽放置位置指示器 */}
        {draggingNoteId && dropIndicatorIndex !== null && (
          <Box
            sx={{
              position: 'absolute',
              left: '0',
              right: '0',
              height: '4px',
              backgroundColor: '#1976d2',
              transform: 'translateY(-2px)',
              zIndex: 1,
              top: `${dropIndicatorIndex * (100 + 16)}px`, // 100px是笔记的最小高度，16px是笔记间距
              transition: 'top 0.2s ease-in-out'
            }}
          />
        )}

        {notes.map((note) => (
          <Box key={note.id} sx={{ position: 'relative' }} data-note-container>
            <Paper
              sx={{
                p: 2,
                mb: 2,
                position: 'relative',
                width: '100%',
                background: '#ffffff',
                opacity: draggingNoteId === note.id ? 0.6 : 1,
                transition: 'opacity 0.2s ease-in-out'
              }}
            >
              {/* 笔记拖拽手柄 */}
              <Box
                sx={{
                  position: 'absolute',
                  left: -40,
                  top: 0,
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'grab',
                  padding: '4px',
                  fontSize: '24px',
                  color: '#666',
                  '&:active': {
                    cursor: 'grabbing',
                    color: '#333',
                    backgroundColor: '#f5f5f5',
                    boxShadow: '0 0 5px rgba(0,0,0,0.1)'
                  }
                }}
                onMouseDown={() => setDraggingNoteId(note.id)}
              >
                <NoteDragHandle />
              </Box>
              {/* 删除按钮 */}
              <IconButton
                onClick={() => deleteNote(note.id)}
                sx={{ position: 'absolute', top: 8, right: 8 }}
              >
                <DeleteIcon />
              </IconButton>
              {/* 笔记内容容器 */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* 笔记编辑区域 */}
                <Box
                  component="textarea"
                  data-note-id={note.id}
                  sx={{
                    width: '100%',
                    border: 'none',
                    outline: 'none',
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    resize: 'vertical',
                    minHeight: '100px',
                    boxShadow: activeNoteId === note.id ? '0 0 0 2px #1976d2' : 'none',
                    transition: 'box-shadow 0.2s ease-in-out'
                  }}
                  value={note.content}
                  onChange={(e) => updateNote(note.id, e.target.value)}
                  onFocus={() => setActiveNoteId(note.id)}
                  onBlur={() => setActiveNoteId(null)}
                />
                {/* Markdown预览区域 */}
                <Box
                  sx={{
                    borderTop: 1,
                    borderColor: 'divider',
                    pt: 2,
                    minHeight: '100px'
                  }}
                  onClick={() => {
                    setActiveNoteId(note.id);
                    const textarea = document.querySelector(`[data-note-id="${note.id}"]`);
                    if (textarea) {
                      textarea.focus();
                      textarea.selectionStart = textarea.value.length;
                      textarea.selectionEnd = textarea.value.length;
                    }
                  }}
                >
                  <ReactMarkdown>{note.content}</ReactMarkdown>
                </Box>
              </Box>
            </Paper>
          </Box>
        ))}
      </Box>
    </Container>
  );
}

export default App;