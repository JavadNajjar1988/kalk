import React, { useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  Button,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Archive as ArchiveIcon,
  Close as CloseIcon,
  History as HistoryIcon,
  Inventory2Outlined as EmptyArchiveIcon,
  Refresh as RefreshIcon,
  Restore as RestoreIcon,
} from '@mui/icons-material';

import type { User } from '../types';
import { userApiService, type UserAuditLog } from '@/services/api/userApiService';
import {
  getUserAuditActionLabel,
  getUserAuditActorLabel,
} from '../utils/userAuditPresentation';

interface UserRecordsDialogProps {
  open: boolean;
  onClose: () => void;
  onRestored: () => void;
}

const UserRecordsDialog: React.FC<UserRecordsDialogProps> = ({
  open,
  onClose,
  onRestored,
}) => {
  const theme = useTheme();
  const [tab, setTab] = useState(0);
  const [archivedUsers, setArchivedUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<UserAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isDark = theme.palette.mode === 'dark';
  const paperSurface = isDark ? theme.palette.grey[900] : theme.palette.common.white;
  const contentSurface = isDark ? theme.palette.background.default : theme.palette.grey[50];
  const headerSurface = isDark ? theme.palette.grey[900] : '#f2f7f3';

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [archived, logs] = await Promise.all([
        userApiService.getArchivedUsers(),
        userApiService.getAuditLogs(),
      ]);
      setArchivedUsers(archived);
      setAuditLogs(logs);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'بارگذاری بایگانی و سوابق کاربران ناموفق بود');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) void loadData();
  }, [open]);

  const restoreUser = async (user: User) => {
    setRestoringId(user.id);
    setError(null);
    try {
      await userApiService.restoreUser(user.id, user.version);
      await loadData();
      onRestored();
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : 'بازیابی کاربر ناموفق بود');
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      BackdropProps={{
        sx: {
          backgroundColor: alpha(theme.palette.common.black, 0.5),
          backdropFilter: 'none',
        },
      }}
      PaperProps={{
        elevation: 0,
        sx: {
          borderRadius: 2,
          backgroundColor: paperSurface,
          backgroundImage: 'none',
          backdropFilter: 'none',
          opacity: 1,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: isDark
            ? '0 24px 64px rgba(0, 0, 0, 0.55)'
            : '0 24px 64px rgba(31, 41, 55, 0.22)',
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle
        sx={{
          px: 3,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          backgroundColor: headerSurface,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Avatar
            variant="rounded"
            sx={{
              width: 38,
              height: 38,
              borderRadius: 1,
              bgcolor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
            }}
          >
            <HistoryIcon fontSize="small" />
          </Avatar>
          <Typography component="div" variant="h6" fontWeight={700}>
            بایگانی و سوابق کاربران
          </Typography>
        </Box>
        <Tooltip title="بستن">
          <IconButton
            onClick={onClose}
            aria-label="بستن"
            size="small"
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: paperSurface,
              '&:hover': { bgcolor: theme.palette.action.hover },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </DialogTitle>
      <Box
        sx={{
          px: 2,
          backgroundColor: paperSurface,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          variant="fullWidth"
          sx={{
            minHeight: 52,
            '& .MuiTab-root': {
              minHeight: 52,
              fontWeight: 600,
              color: theme.palette.text.secondary,
            },
            '& .Mui-selected': {
              color: `${theme.palette.primary.main} !important`,
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
          }}
        >
          <Tab
            disableRipple
            icon={<ArchiveIcon />}
            iconPosition="start"
            label={`بایگانی (${archivedUsers.length})`}
          />
          <Tab
            disableRipple
            icon={<HistoryIcon />}
            iconPosition="start"
            label="سوابق تغییرات"
          />
        </Tabs>
      </Box>
      <DialogContent
        sx={{
          p: { xs: 2, sm: 2.5 },
          minHeight: 380,
          maxHeight: '62vh',
          backgroundColor: contentSurface,
        }}
      >
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {isLoading ? (
          <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 280 }}>
            <CircularProgress />
          </Box>
        ) : tab === 0 ? (
          archivedUsers.length ? (
            <List disablePadding>
              {archivedUsers.map((user) => (
                <ListItem
                  key={user.id}
                  sx={{
                    mb: 1,
                    px: 2,
                    py: 1.25,
                    borderRadius: 1,
                    border: `1px solid ${theme.palette.divider}`,
                    backgroundColor: paperSurface,
                  }}
                  secondaryAction={
                    <Tooltip title="بازیابی کاربر">
                      <span>
                        <IconButton
                          color="success"
                          aria-label={`بازیابی ${user.personalInfo.fullName}`}
                          disabled={restoringId === user.id}
                          onClick={() => void restoreUser(user)}
                          sx={{
                            border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
                            bgcolor: alpha(theme.palette.success.main, 0.08),
                          }}
                        >
                          {restoringId === user.id ? <CircularProgress size={20} /> : <RestoreIcon />}
                        </IconButton>
                      </span>
                    </Tooltip>
                  }
                >
                  <ListItemText
                    primary={user.personalInfo.fullName}
                    secondary={`${user.userCode} | ${user.systemInfo.role} | بایگانی در ${new Date(user.deletedAt || '').toLocaleString('fa-IR')}`}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Box
              sx={{
                minHeight: 290,
                display: 'grid',
                placeItems: 'center',
                textAlign: 'center',
              }}
            >
              <Box>
                <EmptyArchiveIcon
                  sx={{ fontSize: 48, color: theme.palette.text.disabled, mb: 1 }}
                />
                <Typography color="text.secondary">
                  کاربر بایگانی‌شده‌ای وجود ندارد
                </Typography>
              </Box>
            </Box>
          )
        ) : (
          <List disablePadding>
            {auditLogs.map((log) => {
              const userName =
                log.targetDisplayName ||
                log.after?.personalInfo?.fullName ||
                log.before?.personalInfo?.fullName ||
                'کاربر سامانه';
              return (
                <ListItem
                  key={log.id}
                  alignItems="flex-start"
                  sx={{
                    mb: 1,
                    px: 2,
                    py: 1.25,
                    gap: 1.5,
                    borderRadius: 1,
                    border: `1px solid ${theme.palette.divider}`,
                    backgroundColor: paperSurface,
                  }}
                >
                  <Avatar
                    sx={{
                      width: 34,
                      height: 34,
                      mt: 0.25,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                    }}
                  >
                    <HistoryIcon sx={{ fontSize: 18 }} />
                  </Avatar>
                  <ListItemText
                    disableTypography
                    primary={
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          flexWrap: 'wrap',
                        }}
                      >
                        <Typography variant="body2" fontWeight={700}>
                          {getUserAuditActionLabel(log.action)}
                        </Typography>
                        <Chip
                          label={userName}
                          size="small"
                          variant="outlined"
                          sx={{ height: 24 }}
                        />
                      </Box>
                    }
                    secondary={
                      <Typography
                        component="span"
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mt: 0.5 }}
                      >
                        انجام‌دهنده: {getUserAuditActorLabel(log.actorDisplayName, log.actorUsername)}
                        {' | '}
                        {new Date(log.createdAt).toLocaleString('fa-IR')}
                      </Typography>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        )}
      </DialogContent>
      <DialogActions
        sx={{
          px: 3,
          py: 1.5,
          gap: 1,
          backgroundColor: paperSurface,
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Button
          onClick={() => void loadData()}
          disabled={isLoading}
          variant="outlined"
          startIcon={<RefreshIcon />}
        >
          تازه‌سازی
        </Button>
        <Button onClick={onClose} variant="contained">
          بستن
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserRecordsDialog;
