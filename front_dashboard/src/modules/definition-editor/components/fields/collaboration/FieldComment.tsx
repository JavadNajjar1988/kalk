import React, { useState } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Paper,
  TextField,
  Button,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  Divider
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Reply as ReplyIcon,
  Check as CheckIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { FieldComment as FieldCommentType, Collaborator } from './types';
import { useCollaboration } from './CollaborationContext';

interface FieldCommentProps {
  comment: FieldCommentType;
  onReply?: (commentId: string) => void;
  isReply?: boolean;
}

const FieldComment: React.FC<FieldCommentProps> = ({ comment, onReply, isReply = false }) => {
  const { currentUser, updateComment, deleteComment, resolveComment } = useCollaboration();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    setIsEditing(true);
    handleMenuClose();
  };

  const handleSaveEdit = () => {
    if (editContent.trim() !== comment.content) {
      updateComment({
        ...comment,
        content: editContent,
        updatedAt: new Date()
      });
    }
    setIsEditing(false);
    handleMenuClose();
  };

  const handleCancelEdit = () => {
    setEditContent(comment.content);
    setIsEditing(false);
    handleMenuClose();
  };

  const handleDelete = () => {
    deleteComment(comment.id);
    handleMenuClose();
  };

  const handleResolve = () => {
    resolveComment(comment.id);
    handleMenuClose();
  };

  const canEdit = currentUser?.id === comment.author.id;
  const canResolve = currentUser?.role === 'owner' || currentUser?.role === 'editor' || canEdit;

  return (
    <Paper
      sx={{
        p: 2,
        mb: 1,
        ml: isReply ? 3 : 0,
        background: comment.resolved 
          ? 'linear-gradient(135deg, rgba(144, 238, 144, 0.1) 0%, rgba(144, 238, 144, 0.05) 100%)' 
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%)',
        backdropFilter: 'blur(10px)',
        border: '1px solid',
        borderColor: comment.resolved ? 'success.light' : 'divider',
        borderRadius: '12px',
        position: 'relative',
        '&:hover': {
          boxShadow: comment.resolved ? '0 2px 8px rgba(144, 238, 144, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
        <Avatar 
          src={comment.author.avatar} 
          sx={{ 
            width: 32, 
            height: 32, 
            mr: 1.5,
            fontSize: '0.75rem',
            bgcolor: comment.author.color || 'primary.main'
          }}
          aria-label={`آواتار ${comment.author.name}`}
        >
          {comment.author.name.charAt(0)}
        </Avatar>
        
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mr: 1 }}>
              {comment.author.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {comment.createdAt.toLocaleDateString('fa-IR')}
            </Typography>
            {comment.resolved && (
              <Chip
                label="حل شده"
                size="small"
                color="success"
                icon={<CheckIcon />}
                sx={{ mr: 1, height: 20 }}
              />
            )}
          </Box>
          
          {isEditing ? (
            <Box>
              <TextField
                fullWidth
                multiline
                minRows={2}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                sx={{ mb: 1 }}
                aria-label="ویرایش نظر"
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  size="small" 
                  variant="contained" 
                  onClick={handleSaveEdit}
                  aria-label="ذخیره ویرایش"
                >
                  ذخیره
                </Button>
                <Button 
                  size="small" 
                  onClick={handleCancelEdit}
                  aria-label="لغو ویرایش"
                >
                  لغو
                </Button>
              </Box>
            </Box>
          ) : (
            <Typography 
              variant="body2" 
              sx={{ 
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              {comment.content}
            </Typography>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {onReply && (
            <IconButton 
              size="small" 
              onClick={() => onReply(comment.id)}
              aria-label="پاسخ به نظر"
            >
              <ReplyIcon fontSize="small" />
            </IconButton>
          )}
            
          {canEdit && (
            <IconButton 
              size="small" 
              onClick={handleMenuOpen}
              aria-label="منوی نظر"
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>
      
      {comment.replies && comment.replies.length > 0 && (
        <Box sx={{ mt: 1 }}>
          {comment.replies.map(reply => (
            <FieldComment 
              key={reply.id} 
              comment={reply} 
              isReply={true} 
            />
          ))}
        </Box>
      )}
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleEdit} aria-label="ویرایش نظر">
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          ویرایش
        </MenuItem>
        {canResolve && (
          <MenuItem onClick={handleResolve} aria-label="علامت گذاری به عنوان حل شده">
            <CheckIcon fontSize="small" sx={{ mr: 1 }} />
            علامت گذاری به عنوان حل شده
          </MenuItem>
        )}
        <Divider />
        <MenuItem onClick={handleDelete} aria-label="حذف نظر">
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          حذف
        </MenuItem>
      </Menu>
    </Paper>
  );
};

export default FieldComment;