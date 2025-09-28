import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  IconButton,
  Badge,
  Tabs,
  Tab,
  Chip
} from '@mui/material';
import {
  Comment as CommentIcon,
  Send as SendIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import FieldComment from './FieldComment';
import { useCollaboration } from './CollaborationContext';
import { FieldComment as FieldCommentType } from './types';

interface FieldCommentPanelProps {
  fieldId: string;
  onClose: () => void;
}

const FieldCommentPanel: React.FC<FieldCommentPanelProps> = ({ fieldId, onClose }) => {
  const {
    comments,
    currentUser,
    addComment,
    notifications,
    markNotificationRead,
    getUnreadNotificationsCount,
    getActiveCollaborators
  } = useCollaboration();
  
  const [newComment, setNewComment] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [mentionedUsers, setMentionedUsers] = useState<string[]>([]);
  
  const fieldComments = comments.filter(comment => comment.fieldId === fieldId);
  const unreadNotificationsCount = getUnreadNotificationsCount();
  const activeCollaborators = getActiveCollaborators();

  const handleAddComment = async () => {
    if (newComment.trim() && currentUser) {
      await addComment({
        fieldId,
        author: currentUser,
        content: newComment
      });
      setNewComment('');
      setMentionedUsers([]);
    }
  };

  const handleReply = (commentId: string) => {
    // Focus on the comment input and add a reply prefix
    setNewComment(`@${commentId} `);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleAddComment();
    }
  };

  const handleMentionUser = (userId: string) => {
    const user = activeCollaborators.find(c => c.id === userId);
    if (user) {
      const mentionText = `@${user.name} `;
      setNewComment(prev => prev + mentionText);
      setMentionedUsers(prev => [...prev, userId]);
    }
  };

  return (
    <Paper
      sx={{
        width: 350,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
        backdropFilter: 'blur(10px)',
        borderLeft: '1px solid rgba(135, 206, 250, 0.2)',
        boxShadow: '-5px 0 15px rgba(0, 0, 0, 0.05)',
        position: 'relative'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid rgba(135, 206, 250, 0.2)',
          background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 248, 255, 0.7) 100%)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#4A90E2' }}>
            نظرات و همکاری
          </Typography>
          <IconButton onClick={onClose} size="small" aria-label="بستن پنل نظرات">
            ×
          </IconButton>
        </Box>
        
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ minHeight: 32, '& .MuiTab-root': { minHeight: 32, fontSize: '0.875rem' } }}
          aria-label="تب‌های نظرات و اعلانات"
        >
          <Tab 
            icon={<CommentIcon />} 
            iconPosition="start" 
            label={`نظرات (${fieldComments.length})`} 
            sx={{ minHeight: 32 }} 
          />
          <Tab 
            icon={
              <Badge 
                badgeContent={unreadNotificationsCount} 
                color="error"
                sx={{ '& .MuiBadge-badge': { fontSize: '0.5rem', height: 12, minWidth: 12 } }}
              >
                <NotificationsIcon />
              </Badge>
            } 
            iconPosition="start" 
            label="اعلانات" 
            sx={{ minHeight: 32 }} 
          />
        </Tabs>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {activeTab === 0 ? (
          // Comments Tab
          <>
            <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
              {fieldComments.length === 0 ? (
                <Box 
                  sx={{ 
                    textAlign: 'center', 
                    py: 4, 
                    color: 'text.secondary' 
                  }}
                >
                  <CommentIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
                  <Typography variant="body2">
                    هنوز نظری برای این فیلد ثبت نشده است
                  </Typography>
                </Box>
              ) : (
                fieldComments.map(comment => (
                  <FieldComment 
                    key={comment.id} 
                    comment={comment} 
                    onReply={handleReply}
                  />
                ))
              )}
            </Box>
            
            {/* Comment Input */}
            <Box sx={{ p: 2, borderTop: '1px solid rgba(135, 206, 250, 0.2)' }}>
              {/* Active Collaborators */}
              {activeCollaborators.length > 1 && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 0.5 }}>
                  <Typography variant="caption" sx={{ mr: 1, color: 'text.secondary' }}>
                    همکاران فعال:
                  </Typography>
                  {activeCollaborators
                    .filter(collaborator => collaborator.id !== currentUser?.id)
                    .map(collaborator => (
                      <Chip
                        key={collaborator.id}
                        label={collaborator.name}
                        size="small"
                        icon={<PersonIcon sx={{ fontSize: '0.75rem !important' }} />}
                        onClick={() => handleMentionUser(collaborator.id)}
                        sx={{ 
                          height: 20,
                          '& .MuiChip-icon': { ml: 0.5 },
                          cursor: 'pointer'
                        }}
                        aria-label={`اشاره به ${collaborator.name}`}
                      />
                    ))}
                </Box>
              )}
              
              <TextField
                fullWidth
                multiline
                minRows={2}
                maxRows={4}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="نظر خود را بنویسید... (Ctrl+Enter برای ارسال)"
                sx={{ mb: 1 }}
                aria-label="نوشتن نظر جدید"
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<SendIcon />}
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || !currentUser}
                  sx={{
                    borderRadius: '8px',
                    px: 2,
                    py: 0.5,
                    background: 'linear-gradient(135deg, #4A90E2, #7BB3F0)',
                    '&:disabled': {
                      background: 'rgba(148, 163, 184, 0.3)',
                    }
                  }}
                  aria-label="ارسال نظر"
                >
                  ارسال
                </Button>
              </Box>
            </Box>
          </>
        ) : (
          // Notifications Tab
          <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
            {notifications.length === 0 ? (
              <Box 
                sx={{ 
                  textAlign: 'center', 
                  py: 4, 
                  color: 'text.secondary' 
                }}
              >
                <NotificationsIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
                <Typography variant="body2">
                  هیچ اعلانی وجود ندارد
                </Typography>
              </Box>
            ) : (
              notifications.map(notification => (
                <Paper
                  key={notification.id}
                  sx={{
                    p: 1.5,
                    mb: 1,
                    background: notification.read 
                      ? 'rgba(248, 250, 252, 0.8)' 
                      : 'linear-gradient(135deg, rgba(74, 144, 226, 0.1) 0%, rgba(123, 179, 240, 0.05) 100%)',
                    border: '1px solid',
                    borderColor: notification.read ? 'divider' : 'primary.light',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    '&:hover': {
                      background: notification.read 
                        ? 'rgba(240, 248, 255, 0.8)' 
                        : 'linear-gradient(135deg, rgba(74, 144, 226, 0.15) 0%, rgba(123, 179, 240, 0.1) 100%)'
                    }
                  }}
                  onClick={() => markNotificationRead(notification.id)}
                  aria-label={`اعلان: ${notification.message}`}
                >
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: notification.read ? 400 : 600,
                      mb: 0.5
                    }}
                  >
                    {notification.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {notification.createdAt.toLocaleDateString('fa-IR')}
                  </Typography>
                </Paper>
              ))
            )}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default FieldCommentPanel;