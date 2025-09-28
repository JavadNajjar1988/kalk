import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Avatar,
  Chip,
  Stack,
  Drawer,
  Divider,
  Tooltip,
  Checkbox,
  TextField,
  InputAdornment,
  MenuItem,
  Button,
} from '@mui/material';
import {
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Notifications as NotificationsIcon,
  Info,
  Warning,
  Error as ErrorIcon,
  CheckCircle,
  Close,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  MarkEmailRead as MarkReadIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon,
  Check as CheckIcon,
  Archive as ArchiveIcon,
} from '@mui/icons-material';
import { useAppSelector } from '@/store';
import { selectNotifications, selectUnreadNotifications } from '@/store/slices/uiSlice';

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'success':
      return <CheckCircle sx={{ color: 'success.main' }} />;
    case 'warning':
      return <Warning sx={{ color: 'warning.main' }} />;
    case 'error':
      return <ErrorIcon sx={{ color: 'error.main' }} />;
    case 'info':
    default:
      return <Info sx={{ color: 'info.main' }} />;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'success':
      return 'success.light';
    case 'warning':
      return 'warning.light';
    case 'error':
      return 'error.light';
    case 'info':
    default:
      return 'info.light';
  }
};

function relativeTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return `${diff} ثانیه پیش`;
  if (diff < 3600) return `${Math.floor(diff / 60)} دقیقه پیش`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ساعت پیش`;
  return date.toLocaleDateString('fa-IR');
}

const typeOptions = [
  { value: 'all', label: 'همه' },
  { value: 'success', label: 'موفقیت' },
  { value: 'warning', label: 'هشدار' },
  { value: 'error', label: 'خطا' },
  { value: 'info', label: 'اطلاعیه' },
];

const sortOptions = [
  { value: 'newest', label: 'جدیدترین' },
  { value: 'oldest', label: 'قدیمی‌ترین' },
  { value: 'unread', label: 'خوانده‌نشده‌ها در بالا' },
  { value: 'starred', label: 'ستاره‌دارها در بالا' },
];

const NotificationsPage: React.FC = () => {
  const notifications = useAppSelector(selectNotifications);
  const unreadNotifications = useAppSelector(selectUnreadNotifications);
  const [selected, setSelected] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [starred, setStarred] = useState<{ [id: string]: boolean }>({});
  const [checked, setChecked] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [refreshing, setRefreshing] = useState(false);

  // شبیه‌سازی رفرش دیتا
  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleOpen = (notif: any) => {
    setSelected(notif);
    setDrawerOpen(true);
  };
  const handleClose = () => {
    setDrawerOpen(false);
    setSelected(null);
  };
  const handleToggleStar = (id: string) => {
    setStarred((prev) => ({ ...prev, [id]: !prev[id] }));
  };
  const handleCheck = (id: string) => {
    setChecked((prev) => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };
  const handleCheckAll = () => {
    if (checked.length === filtered.length) setChecked([]);
    else setChecked(filtered.map(n => n.id));
  };
  // عملیات گروهی (شبیه‌سازی)
  const handleDelete = () => {
    setChecked([]);
  };
  const handleMarkRead = () => {
    setChecked([]);
  };
  const handleStarGroup = () => {
    setStarred(prev => {
      const next = { ...prev };
      checked.forEach(id => { next[id] = true; });
      return next;
    });
    setChecked([]);
  };

  // فیلتر و جستجو و مرتب‌سازی
  let filtered = notifications.filter(n =>
    (typeFilter === 'all' || n.type === typeFilter) &&
    (n.title.includes(search) || n.message.includes(search))
  );
  if (sort === 'newest') filtered = filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  if (sort === 'oldest') filtered = filtered.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  if (sort === 'unread') filtered = filtered.sort((a, b) => (a.read === b.read ? 0 : a.read ? 1 : -1));
  if (sort === 'starred') filtered = filtered.sort((a, b) => ((starred[b.id] ? 1 : 0) - (starred[a.id] ? 1 : 0)));

  // آمار
  const stats = {
    total: notifications.length,
    unread: unreadNotifications.length,
    starred: Object.values(starred).filter(Boolean).length,
  };

  return (
    <Box sx={{ width: '100vw', maxWidth: 1200, mx: 'auto', mt: 6, p: { xs: 1, sm: 2 }, display: 'flex', gap: 2 }}>
      {/* لیست اعلان‌ها */}
      <Paper sx={{ flex: 1, borderRadius: 3, boxShadow: 3, overflow: 'hidden', maxWidth: 1200, margin: '0 auto' }}>
        {/* هدر و ابزارها */}
        <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', gap: 1 }}>
          <NotificationsIcon sx={{ color: 'primary.main', mr: 1 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, flex: 1 }}>
            همه اعلان‌ها
          </Typography>
          <Tooltip title="بارگذاری مجدد">
            <span>
              <IconButton onClick={handleRefresh} disabled={refreshing}>
                <RefreshIcon sx={{ animation: refreshing ? 'spin 1s linear infinite' : undefined }} />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
        {/* آمار */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2, py: 1, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Chip label={`کل: ${stats.total}`} size="small" color="default" />
          <Chip label={`خوانده‌نشده: ${stats.unread}`} size="small" color="primary" />
          <Chip label={`ستاره‌دار: ${stats.starred}`} size="small" color="warning" />
        </Box>
        {/* ابزار جستجو و فیلتر */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1 }}>
          <TextField
            size="small"
            placeholder="جستجو..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FilterListIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1, minWidth: 120 }}
          />
          <TextField
            select
            size="small"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            sx={{ minWidth: 110 }}
          >
            {typeOptions.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            value={sort}
            onChange={e => setSort(e.target.value)}
            sx={{ minWidth: 120 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SortIcon />
                </InputAdornment>
              ),
            }}
          >
            {sortOptions.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </TextField>
        </Box>
        {/* عملیات گروهی */}
        {checked.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1, bgcolor: 'action.selected', borderBottom: '1px solid', borderColor: 'divider', borderRadius: 2, boxShadow: 2, my: 1 }}>
            <Typography variant="body2" color="primary.main">{checked.length} اعلان انتخاب شده</Typography>
            <Tooltip title="حذف">
              <IconButton color="error" onClick={handleDelete}><DeleteIcon /></IconButton>
            </Tooltip>
            <Tooltip title="علامت‌گذاری به عنوان خوانده‌شده">
              <IconButton color="primary" onClick={handleMarkRead}><MarkReadIcon /></IconButton>
            </Tooltip>
            <Tooltip title="ستاره‌دار کردن">
              <IconButton color="warning" onClick={handleStarGroup}><StarIcon /></IconButton>
            </Tooltip>
          </Box>
        )}
        {/* لیست اعلان‌ها */}
        <List sx={{ p: 0 }}>
          {filtered.length === 0 ? (
            <ListItem>
              <ListItemText primary="اعلانی یافت نشد. لطفاً جستجو یا فیلتر را تغییر دهید." />
            </ListItem>
          ) : (
            filtered.map((notif: any) => (
              <React.Fragment key={notif.id}>
                <ListItemButton
                  onClick={() => handleOpen(notif)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    bgcolor: !notif.read ? 'action.selected' : 'background.paper',
                    borderRight: !notif.read ? '4px solid #1976d2' : undefined,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    transition: 'background 0.2s',
                    px: 3,
                    minWidth: 0,
                    width: '100%',
                    maxWidth: 1130,
                    margin: '0 auto',
                    cursor: 'pointer',
                    borderRadius: 3,
                    boxShadow: starred[notif.id] ? '0 2px 12px rgba(255, 193, 7, 0.13)' : (!notif.read ? '0 2px 8px rgba(25, 118, 210, 0.10)' : 'none'),
                    background: starred[notif.id] ? 'rgba(255, 213, 79, 0.13)' : undefined,
                  }}
                >
                  <Checkbox
                    checked={checked.includes(notif.id)}
                    onClick={e => { e.stopPropagation(); handleCheck(notif.id); }}
                    size="small"
                    sx={{ mr: 0.5 }}
                  />
                  <Tooltip title={starred[notif.id] ? 'حذف از علاقه‌مندی' : 'افزودن به علاقه‌مندی'}>
                    <IconButton
                      onClick={e => { e.stopPropagation(); handleToggleStar(notif.id); }}
                      size="small"
                      sx={{ color: starred[notif.id] ? 'warning.main' : 'grey.400', mr: 1, transition: 'color 0.2s', '&:hover': { color: 'warning.dark' } }}
                    >
                      {starred[notif.id] ? <StarIcon /> : <StarBorderIcon />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="آرشیو">
                    <IconButton
                      onClick={e => { e.stopPropagation(); /* TODO: آرشیو */ }}
                      size="small"
                      sx={{ color: 'info.light', mr: 0.5, '&:hover': { color: 'info.main' } }}
                    >
                      <ArchiveIcon />
                    </IconButton>
                  </Tooltip>
                  <Avatar sx={{ bgcolor: 'background.paper', color: 'primary.main', mr: 1, width: 32, height: 32, boxShadow: 1 }}>
                    {getNotificationIcon(notif.type)}
                  </Avatar>
                  <Box flex={1} minWidth={0} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: !notif.read ? 700 : 400, color: !notif.read ? 'primary.main' : 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '1rem', maxWidth: 180 }}
                    >
                      {notif.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.95rem', maxWidth: 350, ml: 2 }}
                    >
                      {notif.message}
                    </Typography>
                  </Box>
                  <Stack direction="row" alignItems="center" minWidth={90} spacing={1} sx={{ justifyContent: 'flex-end' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                      {relativeTime(notif.timestamp)}
                    </Typography>
                    {!notif.read && (
                      <Chip size="small" label="جدید" color="primary" sx={{ fontSize: '0.7rem', height: 20 }} />
                    )}
                  </Stack>
                </ListItemButton>
              </React.Fragment>
            ))
          )}
        </List>
        {/* انتخاب همه */}
        {filtered.length > 0 && (
          <Box sx={{ px: 2, py: 1, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.default', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Checkbox
              checked={checked.length === filtered.length && filtered.length > 0}
              indeterminate={checked.length > 0 && checked.length < filtered.length}
              onChange={handleCheckAll}
              size="small"
            />
            <Typography variant="caption">انتخاب همه</Typography>
          </Box>
        )}
      </Paper>
      {/* پنل جزئیات اعلان */}
      <Drawer
        anchor="bottom"
        open={drawerOpen}
        onClose={handleClose}
        PaperProps={{ sx: { width: '100%', maxWidth: 800, mx: 'auto', p: 3, borderRadius: '24px 24px 0 0', minHeight: 220 } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            جزئیات اعلان
          </Typography>
          <IconButton onClick={handleClose}>
            <Close />
          </IconButton>
        </Box>
        {selected && (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Avatar sx={{ bgcolor: 'background.paper', color: 'primary.main' }}>
                {getNotificationIcon(selected.type)}
              </Avatar>
              <Typography variant="body2" color="text.secondary">
                {selected.type === 'success' ? 'موفقیت' : selected.type === 'warning' ? 'هشدار' : selected.type === 'error' ? 'خطا' : 'اطلاعیه'}
              </Typography>
            </Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              {selected.title}
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {selected.message}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {relativeTime(selected.timestamp)}
            </Typography>
          </>
        )}
      </Drawer>
    </Box>
  );
};

export default NotificationsPage; 