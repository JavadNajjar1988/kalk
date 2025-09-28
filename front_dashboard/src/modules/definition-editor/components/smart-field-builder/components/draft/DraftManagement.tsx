/**
 * Draft Management UI Components
 * Provides draft status indicator and draft recovery dialog
 */

import React, { useState } from 'react';
import {
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Alert,
  Divider,
  useTheme,
  alpha
} from '@mui/material';
import {
  Save as SaveIcon,
  Delete as DeleteIcon,
  Restore as RestoreIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  CloudDone as CloudDoneIcon,
  Error as ErrorIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';

interface DraftConfig {
  id: string;
  name?: string;
  data: any;
  timestamp: number;
  step?: number;
  mode?: string;
  version: number;
  checksum: string;
}

interface DraftStatusProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  statusInfo: { text: string; color: string };
  onClick?: () => void;
}

export const DraftStatus: React.FC<DraftStatusProps> = ({ status, statusInfo, onClick }) => {
  const theme = useTheme();

  const getIcon = () => {
    switch (status) {
      case 'saving':
        return <CloudUploadIcon fontSize="small" />;
      case 'saved':
        return <CloudDoneIcon fontSize="small" />;
      case 'error':
        return <ErrorIcon fontSize="small" />;
      default:
        return <ScheduleIcon fontSize="small" />;
    }
  };

  const getColor = () => {
    switch (status) {
      case 'saving':
        return 'info';
      case 'saved':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  if (!statusInfo.text) return null;

  return (
    <Chip
      icon={getIcon()}
      label={statusInfo.text}
      size="small"
      color={getColor() as any}
      variant="outlined"
      onClick={onClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        fontSize: '0.7rem',
        height: 24,
        '& .MuiChip-icon': {
          fontSize: '0.875rem'
        },
        ...(status === 'saving' && {
          '& .MuiChip-icon': {
            animation: 'pulse 1.5s ease-in-out infinite'
          }
        })
      }}
    />
  );
};

interface DraftRecoveryDialogProps {
  open: boolean;
  onClose: () => void;
  drafts: DraftConfig[];
  onRestore: (draft: DraftConfig) => void;
  onDelete: (draftId: string) => void;
  onClearAll: () => void;
}

export const DraftRecoveryDialog: React.FC<DraftRecoveryDialogProps> = ({
  open,
  onClose,
  drafts,
  onRestore,
  onDelete,
  onClearAll
}) => {
  const theme = useTheme();
  const [selectedDraft, setSelectedDraft] = useState<DraftConfig | null>(null);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'هم‌اکنون';
    if (diffMinutes < 60) return `${diffMinutes} دقیقه پیش`;
    if (diffHours < 24) return `${diffHours} ساعت پیش`;
    if (diffDays < 7) return `${diffDays} روز پیش`;
    
    return date.toLocaleDateString('fa-IR');
  };

  const getStepName = (step?: number) => {
    const stepNames = ['نوع پایه', 'ویژگی‌ها', 'منبع داده', 'پیش‌نمایش'];
    return step !== undefined ? stepNames[step] || `مرحله ${step + 1}` : 'نامشخص';
  };

  const handleRestore = () => {
    if (selectedDraft) {
      onRestore(selectedDraft);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '80vh'
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          pb: 2,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`
        }}
      >
        <RestoreIcon sx={{ color: theme.palette.primary.main }} />
        <Typography variant="h6" component="h2">
          بازیابی پیش‌نویس
        </Typography>
        {drafts.length > 0 && (
          <Chip
            label={`${drafts.length} پیش‌نویس`}
            size="small"
            color="primary"
            variant="outlined"
          />
        )}
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {drafts.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <SaveIcon 
              sx={{ 
                fontSize: 64, 
                color: theme.palette.grey[400], 
                mb: 2 
              }} 
            />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              پیش‌نویسی یافت نشد
            </Typography>
            <Typography variant="body2" color="text.secondary">
              پیش‌نویس‌های شما به صورت خودکار ذخیره خواهند شد.
            </Typography>
          </Box>
        ) : (
          <>
            <Alert 
              severity="info" 
              sx={{ m: 2, mb: 1 }}
              icon={<RestoreIcon />}
            >
              <Typography variant="body2">
                پیش‌نویس‌های ذخیره شده را انتخاب کنید. توجه: بازیابی پیش‌نویس اطلاعات فعلی را جایگزین می‌کند.
              </Typography>
            </Alert>

            <List sx={{ px: 2 }}>
              {drafts.map((draft, index) => (
                <React.Fragment key={draft.id}>
                  <ListItem
                    button
                    selected={selectedDraft?.id === draft.id}
                    onClick={() => setSelectedDraft(draft)}
                    sx={{
                      borderRadius: 1,
                      mb: 1,
                      border: selectedDraft?.id === draft.id 
                        ? `2px solid ${theme.palette.primary.main}`
                        : `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.04)
                      }
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {draft.name || 'پیش‌نویس بدون نام'}
                          </Typography>
                          {draft.mode && (
                            <Chip
                              label={draft.mode === 'guided' ? 'راهنما' : 'قالب'}
                              size="small"
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            📅 {formatDate(draft.timestamp)} • 
                            📍 {getStepName(draft.step)} • 
                            🔗 نسخه {draft.version}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(draft.id);
                        }}
                        size="small"
                        sx={{
                          color: theme.palette.error.main,
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.error.main, 0.08)
                          }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < drafts.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        {drafts.length > 0 && (
          <Button
            onClick={onClearAll}
            color="error"
            variant="outlined"
            startIcon={<DeleteIcon />}
          >
            حذف همه
          </Button>
        )}
        
        <Box sx={{ flex: 1 }} />
        
        <Button onClick={onClose} variant="outlined">
          انصراف
        </Button>
        
        {selectedDraft && (
          <Button
            onClick={handleRestore}
            variant="contained"
            startIcon={<RestoreIcon />}
          >
            بازیابی
          </Button>
        )}
      </DialogActions>

      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </Dialog>
  );
};