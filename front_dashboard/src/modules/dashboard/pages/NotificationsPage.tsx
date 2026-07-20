import React, { useState, useEffect } from 'react';
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
  MarkEmailRead as MarkReadIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon,
  Check as CheckIcon,
  Archive as ArchiveIcon,
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '@/store';
import { 
  selectNotifications, 
  selectUnreadNotifications, 
  selectArchivedNotifications,
  selectActiveNotifications,
  selectNotificationStats,
  archiveNotification,
  archiveNotifications,
  unarchiveNotification,
  unarchiveNotifications,
  toggleNotificationStar,
  starNotifications,
  unstarNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  showSuccessNotification,
  showErrorNotification,
  removeDuplicateNotifications
} from '@/store/slices/uiSlice';

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'success':
      return <CheckCircle sx={{ color: 'primary.main' }} />;
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
      return 'primary.light';
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
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(selectNotifications);
  const unreadNotifications = useAppSelector(selectUnreadNotifications);
  const archivedNotifications = useAppSelector(selectArchivedNotifications);
  const activeNotifications = useAppSelector(selectActiveNotifications);
  const stats = useAppSelector(selectNotificationStats);
  
  const [selected, setSelected] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [checked, setChecked] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [refreshing, setRefreshing] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  // پاک کردن notifications تکراری هنگام بارگذاری صفحه
  useEffect(() => {
    dispatch(removeDuplicateNotifications());
  }, [dispatch]);

  // شبیه‌سازی رفرش دیتا
  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleOpen = (notif: any) => {
    setSelected(notif);
    setDrawerOpen(true);
    // علامت‌گذاری خودکار به عنوان خوانده‌شده
    if (!notif.read) {
      dispatch(markNotificationAsRead(notif.id));
      dispatch(showSuccessNotification('اعلان به عنوان خوانده‌شده علامت‌گذاری شد'));
    }
  };
  const handleClose = () => {
    setDrawerOpen(false);
    setSelected(null);
  };
  const handleToggleStar = (id: string) => {
    dispatch(toggleNotificationStar(id));
    dispatch(showSuccessNotification('وضعیت ستاره‌دار تغییر کرد'));
  };
  const handleCheck = (id: string) => {
    setChecked((prev) => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };
  const handleCheckAll = () => {
    if (checked.length === filtered.length) setChecked([]);
    else setChecked(filtered.map(n => n.id));
  };
  // عملیات آرشیو
  const handleArchiveSingle = (id: string) => {
    dispatch(archiveNotification(id));
    dispatch(showSuccessNotification('اعلان آرشیو شد'));
  };
  
  
  const handleArchiveAll = () => {
    const allIds = filtered.map(n => n.id);
    if (allIds.length === 0) {
      dispatch(showErrorNotification('اعلانی برای آرشیو وجود ندارد'));
      return;
    }
    dispatch(archiveNotifications(allIds));
    dispatch(showSuccessNotification(`${allIds.length} اعلان آرشیو شد`));
  };
  
  
  const handleUnarchiveAll = () => {
    const allIds = filtered.map(n => n.id);
    if (allIds.length === 0) {
      dispatch(showErrorNotification('اعلانی برای بازگردانی وجود ندارد'));
      return;
    }
    dispatch(unarchiveNotifications(allIds));
    dispatch(showSuccessNotification(`${allIds.length} اعلان از آرشیو بازگردانده شد`));
  };
  
  
  // منطق هوشمند ستاره‌دار کردن
  const handleToggleStarAll = () => {
    const allIds = filtered.map(n => n.id);
    if (allIds.length === 0) {
      dispatch(showErrorNotification('اعلانی برای ستاره‌دار کردن وجود ندارد'));
      return;
    }
    
    // بررسی وضعیت: آیا حداقل یک اعلان ستاره‌دار است؟
    const hasStarred = filtered.some(n => n.starred === true);
    
    if (hasStarred) {
      // اگر حداقل یک اعلان ستاره‌دار است، همه را لغو ستاره‌دار کن
      dispatch(unstarNotifications(allIds));
      dispatch(showSuccessNotification(`${allIds.length} اعلان از ستاره‌دار خارج شد`));
    } else {
      // اگر هیچ اعلانی ستاره‌دار نیست، همه را ستاره‌دار کن
      dispatch(starNotifications(allIds));
      dispatch(showSuccessNotification(`${allIds.length} اعلان ستاره‌دار شد`));
    }
  };

  // عملیات خوانده شدن
  const handleMarkReadSelected = () => {
    if (checked.length === 0) {
      dispatch(showErrorNotification('ابتدا اعلان‌هایی را انتخاب کنید'));
      return;
    }
    checked.forEach(id => {
      dispatch(markNotificationAsRead(id));
    });
    dispatch(showSuccessNotification(`${checked.length} اعلان به عنوان خوانده‌شده علامت‌گذاری شد`));
    setChecked([]);
  };

  const handleMarkReadAll = () => {
    const allIds = filtered.map(n => n.id);
    if (allIds.length === 0) {
      dispatch(showErrorNotification('اعلانی برای علامت‌گذاری وجود ندارد'));
      return;
    }
    allIds.forEach(id => {
      dispatch(markNotificationAsRead(id));
    });
    dispatch(showSuccessNotification(`${allIds.length} اعلان به عنوان خوانده‌شده علامت‌گذاری شد`));
  };

  // خوانده شدن تکی
  const handleMarkReadSingle = (id: string) => {
    dispatch(markNotificationAsRead(id));
    dispatch(showSuccessNotification('اعلان به عنوان خوانده‌شده علامت‌گذاری شد'));
  };

  // فیلتر و جستجو و مرتب‌سازی
  const currentNotifications = showArchived ? archivedNotifications : activeNotifications;
  let filtered = currentNotifications.filter(n =>
    (typeFilter === 'all' || n.type === typeFilter) &&
    (n.title.includes(search) || n.message.includes(search))
  );
  
  if (sort === 'newest') filtered = filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  if (sort === 'oldest') filtered = filtered.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  if (sort === 'unread') filtered = filtered.sort((a, b) => (a.read === b.read ? 0 : a.read ? 1 : -1));
  if (sort === 'starred') filtered = filtered.sort((a, b) => ((b.starred ? 1 : 0) - (a.starred ? 1 : 0)));

  return (
    <Box sx={{ 
      width: '100%', 
      maxWidth: 1600, // افزایش عرض به 1600px (100px بیشتر - 50px از هر طرف)
      mx: 'auto', 
      mt: 2, // کاهش فاصله از بالا
      p: { xs: 0.5, sm: 1 }, // کاهش padding
      display: 'flex', 
      gap: 1, // کاهش فاصله بین المان‌ها
      height: 'calc(100vh - 200px)', // کاهش بیشتر (20px دیگر)
      flexDirection: 'column',
      overflow: 'hidden' // غیرفعال کردن اسکرول کادر بیرونی
    }}>
      {/* لیست اعلان‌ها */}
      <Paper sx={{ 
        flex: 1, 
        borderRadius: 3, 
        boxShadow: 3, 
        overflow: 'hidden', 
        width: '100%', // استفاده کامل از عرض موجود
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0, // اضافه کردن minHeight برای flex
        maxHeight: '100%' // محدود کردن ارتفاع
      }}>
        {/* هدر و ابزارها - Sticky */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          px: 2, 
          py: 1, // کاهش padding عمودی
          borderBottom: '1px solid', 
          borderColor: 'divider', 
          bgcolor: 'background.paper', 
          gap: 1,
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <NotificationsIcon sx={{ color: 'primary.main', mr: 1 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, flex: 1 }}>
            {showArchived ? 'اعلان‌های آرشیو شده' : 'همه اعلان‌ها'}
          </Typography>
          <Button
            variant={showArchived ? "contained" : "outlined"}
            onClick={() => setShowArchived(!showArchived)}
            startIcon={<ArchiveIcon />}
            sx={{ mr: 2 }}
          >
            {showArchived ? 'نمایش فعال' : 'نمایش آرشیو'}
          </Button>
          <Tooltip title="بارگذاری مجدد">
            <span>
              <IconButton onClick={handleRefresh} disabled={refreshing}>
                <RefreshIcon sx={{ animation: refreshing ? 'spin 1s linear infinite' : undefined }} />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
        
        {/* آمار و عملیات گروهی - Sticky */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2, 
          px: 2, 
          py: 0.5, // کاهش padding عمودی
          bgcolor: 'background.default', 
          borderBottom: '1px solid', 
          borderColor: 'divider',
          position: 'sticky',
          top: '48px', // کاهش ارتفاع هدر قبلی
          zIndex: 9,
          flexWrap: 'wrap' // برای نمایش بهتر در صورت نیاز
        }}>
          {/* آمار اعلان‌ها */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Chip label={`کل: ${stats.total}`} size="small" color="default" />
            <Chip label={`خوانده‌نشده: ${stats.unread}`} size="small" color="primary" />
            <Chip label={`خوانده‌شده: ${stats.read}`} size="small" color="primary" />
            <Chip label={`ستاره‌دار: ${stats.starred}`} size="small" color="warning" />
            <Chip label={`انتخاب شده: ${checked.length}`} size="small" color="info" />
            <Chip label={`آرشیو شده: ${stats.archived}`} size="small" color="secondary" />
            <Chip label={`فعال: ${stats.active}`} size="small" color="primary" />
          </Box>
          
        </Box>
        
        {/* ابزار جستجو و فیلتر - Sticky */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1, 
          px: 2, 
          py: 0.5, // کاهش padding عمودی
          position: 'sticky',
          top: '72px', // کاهش ارتفاع هدر + آمار
          zIndex: 8,
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
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
         
         {/* بخش اسکرول شونده - فقط لیست اعلان‌ها */}
         <Box sx={{ 
           flex: 1, 
           overflow: 'auto', // فعال کردن اسکرول در این سطح
           display: 'flex',
           flexDirection: 'column',
           minHeight: 0, // اضافه کردن minHeight
           maxHeight: 'calc(100vh - 280px)' // کاهش بیشتر (20px دیگر)
         }}>
           {/* لیست اعلان‌ها */}
           <List sx={{ p: 0, flex: 1, minHeight: 0 }}>
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
                    maxWidth: '100%', // استفاده کامل از عرض موجود
                    margin: '0 auto',
                    cursor: 'pointer',
                    borderRadius: 3,
                    boxShadow: notif.starred ? '0 2px 12px rgba(255, 193, 7, 0.13)' : (!notif.read ? '0 2px 8px rgba(25, 118, 210, 0.10)' : 'none'),
                    background: notif.starred ? 'rgba(255, 213, 79, 0.13)' : undefined,
                  }}
                >
                  <Checkbox
                    checked={checked.includes(notif.id)}
                    onClick={e => { e.stopPropagation(); handleCheck(notif.id); }}
                    size="small"
                    sx={{ mr: 0.5 }}
                  />
                  <IconButton
                    onClick={e => { e.stopPropagation(); handleToggleStar(notif.id); }}
                    size="small"
                    sx={{ color: notif.starred ? 'warning.main' : 'grey.400', mr: 1, transition: 'color 0.2s', '&:hover': { color: 'warning.dark' } }}
                  >
                    {notif.starred ? <StarIcon /> : <StarBorderIcon />}
                  </IconButton>
                  <IconButton
                    onClick={e => { e.stopPropagation(); handleArchiveSingle(notif.id); }}
                    size="small"
                    sx={{ color: 'info.light', mr: 0.5, '&:hover': { color: 'info.main' } }}
                  >
                    <ArchiveIcon />
                  </IconButton>
                  <IconButton
                    onClick={e => { e.stopPropagation(); handleMarkReadSingle(notif.id); }}
                    size="small"
                    sx={{ 
                      color: notif.read ? 'primary.main' : 'grey.400', 
                      mr: 0.5, 
                      transition: 'color 0.2s', 
                      '&:hover': { color: 'primary.dark' } 
                    }}
                  >
                    <CheckCircle />
                  </IconButton>
                  <Avatar sx={{ bgcolor: 'background.paper', color: 'primary.main', mr: 1, width: 32, height: 32, boxShadow: 1 }}>
                    {getNotificationIcon(notif.type)}
                  </Avatar>
                  <Box flex={1} minWidth={0} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: !notif.read ? 700 : 400, color: !notif.read ? 'primary.main' : 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '1rem', maxWidth: 240, flex: 1 }} // افزایش عرض برای استفاده بهتر از فضا
                    >
                      {notif.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.95rem', maxWidth: 480, ml: 2, flex: 2 }} // افزایش عرض برای استفاده بهتر از فضا
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
         </Box>
         
         {/* عملیات گروهی - خارج از بخش اسکرول شونده */}
         {filtered.length > 0 && (
           <Box sx={{ 
             px: 2, 
             py: 1, 
             borderTop: '1px solid', 
             borderColor: 'divider', 
             bgcolor: 'grey.100', // رنگ زمینه تیره‌تر برای تمایز
             display: 'flex', 
             flexDirection: 'column',
             gap: 1,
             flexShrink: 0, // جلوگیری از کوچک شدن
             width: '100%' // عرض کامل
           }}>
             {/* نام کلیدها */}
             <Box sx={{ 
               display: 'flex', 
               alignItems: 'center', 
               gap: 2,
               px: 1,
               py: 0.5
             }}>
               <Typography variant="caption" sx={{ 
                 fontSize: '0.7rem', 
                 color: 'text.secondary',
                 minWidth: 40,
                 textAlign: 'center'
               }}>
                 انتخاب
               </Typography>
               <Typography variant="caption" sx={{ 
                 fontSize: '0.7rem', 
                 color: 'text.secondary',
                 minWidth: 40,
                 textAlign: 'center'
               }}>
                 ستاره
               </Typography>
               <Typography variant="caption" sx={{ 
                 fontSize: '0.7rem', 
                 color: 'text.secondary',
                 minWidth: 40,
                 textAlign: 'center'
               }}>
                 آرشیو
               </Typography>
               <Typography variant="caption" sx={{ 
                 fontSize: '0.7rem', 
                 color: 'text.secondary',
                 minWidth: 40,
                 textAlign: 'center'
               }}>
                 خوانده
               </Typography>
             </Box>
             
             {/* کلیدهای عملیات */}
             <Box sx={{ 
               display: 'flex', 
               alignItems: 'center', 
               gap: 2
             }}>
               {/* انتخاب همه - در راستای checkbox های اعلان‌ها */}
               <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5, ml: 0.9 }}>
                 <IconButton 
                   size="small" 
                   onClick={handleCheckAll}
                   sx={{ 
                     color: checked.length === filtered.length ? 'primary.main' : 'grey.400',
                     '&:hover': { 
                       color: 'primary.dark' 
                     }
                   }}
                 >
                   <CheckIcon fontSize="small" />
                 </IconButton>
               </Box>
               
               {/* ستاره‌دار کردن - در راستای ستاره‌های اعلان‌ها */}
               <Box sx={{ display: 'flex', alignItems: 'center', mr: 1, ml: 0.9 }}>
                 <IconButton 
                   size="small" 
                   onClick={handleToggleStarAll}
                   sx={{ 
                     color: filtered.some(n => n.starred === true) ? 'warning.main' : 'grey.400',
                     '&:hover': { 
                       color: filtered.some(n => n.starred === true) ? 'warning.dark' : 'grey.600'
                     }
                   }}
                 >
                   {filtered.some(n => n.starred === true) ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
                 </IconButton>
               </Box>
               
               {/* آرشیو/بازگردانی - در راستای آرشیوهای اعلان‌ها */}
               <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5, ml: 0.9 }}>
                 <IconButton 
                   size="small" 
                   onClick={showArchived ? handleUnarchiveAll : handleArchiveAll}
                   sx={{ 
                     color: 'info.main',
                     '&:hover': { 
                       color: 'info.dark' 
                     }
                   }}
                 >
                   <ArchiveIcon fontSize="small" />
                 </IconButton>
               </Box>
               
               {/* خوانده‌شده علامت‌گذاری کردن همه - در راستای آواتارهای اعلان‌ها */}
               <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5, ml: 0.9 }}>
                 <IconButton 
                   size="small" 
                   onClick={handleMarkReadAll}
                   sx={{ 
                     color: 'primary.main',
                     '&:hover': { 
                       color: 'primary.dark' 
                     }
                   }}
                 >
                   <MarkReadIcon fontSize="small" />
                 </IconButton>
               </Box>
               
               {/* دکمه‌های عملیات گروهی */}
               {checked.length > 0 && (
                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
                   <Button
                     size="small"
                     variant="outlined"
                     onClick={handleMarkReadSelected}
                     startIcon={<MarkReadIcon />}
                     sx={{ fontSize: '0.75rem' }}
                   >
                     خوانده‌شده
                   </Button>
                 </Box>
               )}
               
               {/* فاصله برای رسیدن به سمت راست */}
               <Box sx={{ flex: 1 }} />
             </Box>
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