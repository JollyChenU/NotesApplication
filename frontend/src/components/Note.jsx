import React from 'react';
import { Paper, IconButton, Box, TextField } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import EditIcon from '@mui/icons-material/Edit';
import NoteEditor from './NoteEditor';

const Note = ({
  note,
  isEditing,
  isDragging,
  isActive,
  onEdit,
  onDelete,
  onDragStart,
  onUpdate,
  onFocus,
  onBlur
}) => {
  return (
    <Paper
      elevation={isActive ? 3 : 1}
      sx={{
        position: 'relative',
        // mb: 2,
        mb: { xs: 1, sm: 2 }, //updated
        opacity: isDragging ? 0.5 : 1,
        transition: 'all 0.2s',
        '&:hover': {
          '& .note-actions': {
            opacity: 1
          }
        }
      }}
      data-note-id={note.id}
      onFocus={onFocus}
      onBlur={onBlur}
      tabIndex={0}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          // p: 2
          p: { xs: 1, sm: 1.5, md: 2 } //updated
        }}
      >
        <Box sx={{ display: 'flex', gap: 0.75, mr: {xs:1, sm:2}}}>//gap used to 1
          <IconButton
            sx={{ cursor: 'move' }}
            onMouseDown={(e) => {
              e.preventDefault();
              onDragStart(e);
            }}
            size="small"
          >
            <DragIndicatorIcon />
          </IconButton>
          <IconButton onClick={onEdit} size="small">
            <EditIcon />
          </IconButton>
          <IconButton onClick={onDelete} size="small" color="error">
            <DeleteIcon />
          </IconButton>
        </Box>

        <Box sx={{ flexGrow: 1 }}>
          {isEditing ? (
            <NoteEditor
              initialContent={note.content}
              onSave={(content) => {
                onUpdate(content);
                onBlur();
              }}
              autoFocus
            />
          ) : (
            <div
              dangerouslySetInnerHTML={{ __html: note.content || '空白笔记' }}
              style={{ minHeight: '1.5rem' }}//used to 1.5em
            />
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default Note;