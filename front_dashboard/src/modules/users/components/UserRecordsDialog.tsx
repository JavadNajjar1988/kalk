import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
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
} from '@mui/material';
import {
  Archive as ArchiveIcon,
  Close as CloseIcon,
  History as HistoryIcon,
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
  const [tab, setTab] = useState(0);
  const [archivedUsers, setArchivedUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<UserAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography component="div" variant="h6">بایگانی و سوابق کاربران</Typography>
        <Tooltip title="بستن">
          <IconButton onClick={onClose} aria-label="بستن">
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </DialogTitle>
      <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="fullWidth">
        <Tab icon={<ArchiveIcon />} iconPosition="start" label={`بایگانی (${archivedUsers.length})`} />
        <Tab icon={<HistoryIcon />} iconPosition="start" label="سوابق تغییرات" />
      </Tabs>
      <DialogContent dividers sx={{ minHeight: 360 }}>
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
                  divider
                  secondaryAction={
                    <Tooltip title="بازیابی کاربر">
                      <span>
                        <IconButton
                          color="success"
                          aria-label={`بازیابی ${user.personalInfo.fullName}`}
                          disabled={restoringId === user.id}
                          onClick={() => void restoreUser(user)}
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
            <Typography color="text.secondary" textAlign="center" sx={{ mt: 12 }}>
              کاربر بایگانی‌شده‌ای وجود ندارد
            </Typography>
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
                <ListItem key={log.id} divider alignItems="flex-start">
                  <ListItemText
                    primary={`${getUserAuditActionLabel(log.action)} | ${userName}`}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.secondary">
                          انجام‌دهنده: {getUserAuditActorLabel(log.actorDisplayName, log.actorUsername)}
                          {' | '}
                          {new Date(log.createdAt).toLocaleString('fa-IR')}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => void loadData()} disabled={isLoading}>تازه‌سازی</Button>
        <Button onClick={onClose}>بستن</Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserRecordsDialog;
