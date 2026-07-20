import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  ButtonGroup,
  Slider,
  Switch,
  FormControlLabel,
  IconButton,
  Divider,
  Grid,
  Paper,
  Chip,
  Avatar,
  Tooltip,
  Snackbar,
  Alert,
  CircularProgress,
  useTheme,
  alpha,
  TextField,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination,
} from '@mui/material';
import {
  Palette,
  DarkMode,
  LightMode,
  AutoMode,
  TextFields,
  Language,
  Refresh,
  Settings,
  Brightness6,
  FormatSize,
  Accessibility,
  Speed,
  CheckCircle,
  Contrast,
  Lock,
  Edit,
  ViewModule,
} from '@mui/icons-material';
import {
  setThemeMode,
  setPrimaryColor,
  setBackgroundTheme,
  toggleReducedMotion,
  toggleHighContrast,
  setFontSize,
  selectTheme,
  setLanguage,
  resetToDefaultSettings,
  updateHeaderSettings,
  selectHeaderSettings,
  HeaderSettings,
  HeaderEntry,
  DashboardModulesSettings,
  selectDashboardModules,
  updateDashboardModules,
  showSuccessNotification,
  showWarningNotification,
} from '@/store/slices/uiSlice';
import { RootState } from '@/store';
import { PrimaryColor } from '@/store/slices/uiSlice';
import { useTranslation } from '@/hooks/useTranslation';
import { selectUser, updateUser } from '@/store/slices/authSlice';

const HEADER_PAGE_SIZE = 10;

type HeaderEditorFormState = {
  quoteText: string;
  personName: string;
  personPosition: string;
  personImage: string | null;
};

const createEmptyHeaderEditorForm = (): HeaderEditorFormState => ({
  quoteText: '',
  personName: '',
  personPosition: '',
  personImage: null,
});

const SettingsPage: React.FC = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { t } = useTranslation();
  const themeSettings = useSelector(selectTheme);
  const { language } = useSelector((state: RootState) => state.ui);
  const headerSettings = useSelector(selectHeaderSettings) as HeaderSettings;
  const dashboardModules = useSelector(selectDashboardModules) as DashboardModulesSettings;
  const user = useSelector(selectUser);
  const headerEntries = (headerSettings.entries || []) as HeaderEntry[];
  const activeHeaderEntryId = headerSettings.activeEntryId ?? null;
  
  // استیت محلی پروفایل
  const [displayName, setDisplayName] = useState(user?.name || '');
  const [rank, setRank] = useState(user?.rank || '');
  const [unit, setUnit] = useState(user?.unit || '');
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(user?.avatar);

  // استیت محلی تغییر رمز
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingHeader, setIsSavingHeader] = useState(false);
  const [headerSaveFeedbackOpen, setHeaderSaveFeedbackOpen] = useState(false);
  const [headerEditorForm, setHeaderEditorForm] = useState<HeaderEditorFormState>(createEmptyHeaderEditorForm());
  const [editingHeaderEntryId, setEditingHeaderEntryId] = useState<number | null>(null);
  const [headerPage, setHeaderPage] = useState(0);
  const [isHeaderPageLoading, setIsHeaderPageLoading] = useState(false);

  // استیت محلی نوع فونت (در حد UI)
  const [fontFamily, setFontFamily] = useState<'iransans' | 'vazir' | 'shabnam'>('iransans');
  
  // نمایش تغییرات زبان در کامپوننت برای اشکال‌زدایی
  useEffect(() => {
    console.log('SettingsPage language changed:', language);
  }, [language]);

  const handlePrimaryColorChange = (color: PrimaryColor) => {
    dispatch(setPrimaryColor(color));
    
    // تغییر خودکار رنگ پس‌زمینه متناسب با رنگ اصلی
    switch (color) {
      case 'green':
        dispatch(setBackgroundTheme('field-green'));
        break;
      case 'blue':
        dispatch(setBackgroundTheme('military-blue'));
        break;
      case 'red':
        dispatch(setBackgroundTheme('command-red'));
        break;
      case 'purple':
        dispatch(setBackgroundTheme('tactical-dark'));
        break;
      case 'orange':
        dispatch(setBackgroundTheme('command-red'));
        break;
      default:
        dispatch(setBackgroundTheme('default'));
        break;
    }
  };

  const handleHeaderSettingsChange = (changes: Partial<HeaderSettings>) => {
    dispatch(updateHeaderSettings(changes));
  };
  const handleDashboardModuleToggle =
    (key: keyof DashboardModulesSettings) => (event: React.ChangeEvent<HTMLInputElement>) => {
      dispatch(updateDashboardModules({ [key]: event.target.checked }));
    };

  const totalHeaderPages = useMemo(
    () => Math.max(1, Math.ceil(headerEntries.length / HEADER_PAGE_SIZE)),
    [headerEntries.length]
  );

  const activeHeaderEntry = useMemo(
    () => headerEntries.find(entry => entry.id === activeHeaderEntryId) || null,
    [headerEntries, activeHeaderEntryId]
  );
  const pagedHeaderEntries = useMemo(() => {
    const start = headerPage * HEADER_PAGE_SIZE;
    return headerEntries.slice(start, start + HEADER_PAGE_SIZE);
  }, [headerEntries, headerPage]);
  useEffect(() => {
    const maxPage = Math.max(0, totalHeaderPages - 1);
    if (headerPage > maxPage) setHeaderPage(maxPage);
  }, [headerPage, totalHeaderPages]);
  const handleHeaderFormFieldChange = (
    field: keyof HeaderEditorFormState,
    value: string | null
  ) => {
    setHeaderEditorForm(prev => ({ ...prev, [field]: value }));
  };
  const handleHeaderImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        setHeaderEditorForm(prev => ({ ...prev, personImage: result }));
      }
    };
    reader.readAsDataURL(file);
  };
  const handleHeaderFormReset = () => {
    setHeaderEditorForm(createEmptyHeaderEditorForm());
    setEditingHeaderEntryId(null);
  };
  const handleHeaderRowSelect = (entry: HeaderEntry) => {
    setEditingHeaderEntryId(entry.id);
    setHeaderEditorForm({
      quoteText: entry.quoteText,
      personName: entry.personName,
      personPosition: entry.personPosition,
      personImage: entry.personImage,
    });
  };
  const handleHeaderPageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    const nextPage = page - 1;
    if (nextPage === headerPage) return;
    setIsHeaderPageLoading(true);
    window.setTimeout(() => {
      setHeaderPage(nextPage);
      setIsHeaderPageLoading(false);
    }, 220);
  };
  const resolveHeaderImageSrc = (image: string | null) => {
    if (!image) return 'shahid.jpg';
    const trimmed = image.trim();
    return trimmed || 'shahid.jpg';
  };

  const handleHeaderSettingsSave = () => {
    const quoteText = headerEditorForm.quoteText.trim();
    const personName = headerEditorForm.personName.trim();
    const personPosition = headerEditorForm.personPosition.trim();
    if (!quoteText || !personName || !personPosition || !headerEditorForm.personImage) {
      dispatch(showWarningNotification('لطفاً همه فیلدهای هدر را تکمیل کنید.'));
      return;
    }
    setIsSavingHeader(true);
    const now = Date.now();
    let nextEntries: HeaderEntry[] = [];
    let nextActiveEntryId = activeHeaderEntryId;
    if (editingHeaderEntryId !== null) {
      nextEntries = headerEntries.map(entry =>
        entry.id === editingHeaderEntryId
          ? {
              ...entry,
              quoteText,
              personName,
              personPosition,
              personImage: headerEditorForm.personImage,
              updatedAt: now,
            }
          : entry
      );
      nextActiveEntryId = editingHeaderEntryId;
    } else {
      const newEntry: HeaderEntry = {
        id: now,
        quoteText,
        personName,
        personPosition,
        personImage: headerEditorForm.personImage,
        createdAt: now,
        updatedAt: now,
      };
      nextEntries = [newEntry, ...headerEntries];
      nextActiveEntryId = newEntry.id;
    }
    dispatch(
      updateHeaderSettings({
        enabled: true,
        quoteMode: 'custom',
        fixedQuoteIndex: null,
        martyrMode: 'custom',
        fixedMartyrId: null,
        customQuoteText: quoteText,
        customQuoteAuthor: personName,
        customMartyrName: personName,
        customMartyrPosition: personPosition,
        customMartyrDate: null,
        customMartyrImage: headerEditorForm.personImage,
        entries: nextEntries,
        activeEntryId: nextActiveEntryId,
      })
    );
    setHeaderPage(0);
    handleHeaderFormReset();
    setHeaderSaveFeedbackOpen(true);
    dispatch(showSuccessNotification('مورد هدر با موفقیت ذخیره شد.'));
    setTimeout(() => {
      setIsSavingHeader(false);
    }, 350);
  };

  useEffect(() => {
    if (user) {
      setDisplayName(user.name);
      setRank(user.rank);
      setUnit(user.unit);
      setAvatarPreview(user.avatar);
    }
  }, [user]);

  const handleProfileSave = () => {
    if (!user) return;
    dispatch(updateUser({ name: displayName, rank, unit, avatar: avatarPreview }));
    dispatch(showSuccessNotification('پروفایل با موفقیت به‌روزرسانی شد.'));
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        setAvatarPreview(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePasswordChange = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      dispatch(showSuccessNotification('همه فیلدهای رمز عبور را تکمیل کنید.'));
      return;
    }
    if (newPassword !== confirmPassword) {
      dispatch(showSuccessNotification('تکرار رمز عبور جدید صحیح نیست.'));
      return;
    }
    // فعلاً فقط UI – اتصال به API بعداً اضافه می‌شود
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    dispatch(showSuccessNotification('درخواست تغییر رمز عبور ثبت شد (بک‌اند بعداً اضافه می‌شود).'));
  };

  const handleFontFamilyChange = (family: 'iransans' | 'vazir' | 'shabnam') => {
    setFontFamily(family);
    document.body.style.fontFamily =
      family === 'iransans'
        ? '"IRANSans", sans-serif'
        : family === 'vazir'
        ? '"Vazir", sans-serif'
        : '"Shabnam", sans-serif';
  };

  const unifiedSectionColor = theme.palette.primary.main;
  const unifiedSectionCardSx = {
    background: `linear-gradient(135deg, ${alpha(unifiedSectionColor, 0.07)}, ${alpha(unifiedSectionColor, 0.04)})`,
    border: `1px solid ${alpha(unifiedSectionColor, 0.24)}`,
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-3px)',
      boxShadow: theme.shadows[6],
    },
  };
  const unifiedSectionHeaderBorder = `2px solid ${alpha(unifiedSectionColor, 0.14)}`;
  const unifiedSectionIconSx = { mr: 2, color: unifiedSectionColor, fontSize: '1.5rem' };
  const unifiedSectionTitleSx = { fontWeight: 700, fontSize: '1.25rem', color: unifiedSectionColor };






  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" sx={{ 
          fontWeight: 'bold', 
          mb: 2,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2
        }}>
          <Settings sx={{ fontSize: 40, color: theme.palette.primary.main }} />
          {t('settings.title')}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {t('settings.description')}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* پروفایل + تغییر رمز عبور در یک کارت ترکیبی */}
        <Grid item xs={12} md={12}>
          <Card
            sx={{
              ...unifiedSectionCardSx,
              height: '100%',
            }}
          >
            <CardContent>
              <Grid container spacing={4}>
                {/* ستون پروفایل و آواتار */}
                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mb: 3,
                        pb: 2,
                        borderBottom: unifiedSectionHeaderBorder,
                      }}
                    >
                      <Avatar
                        src={avatarPreview}
                        sx={{
                          width: 56,
                          height: 56,
                          mr: 2,
                          border: `2px solid ${theme.palette.background.paper}`,
                        }}
                      >
                        {user?.name?.[0]}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 700, fontSize: '1.1rem' }}
                        >
                          تنظیمات پروفایل
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          نام نمایشی، درجه، یگان و تصویر پروفایل را تنظیم کنید.
                        </Typography>
                      </Box>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleAvatarChange}
                      />
                      <label htmlFor="avatar-upload">
                        <Button
                          component="span"
                          variant="outlined"
                          size="small"
                          startIcon={<Edit />}
                        >
                          تغییر عکس
                        </Button>
                      </label>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          size="small"
                          label="نام نمایشی"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="درجه"
                          value={rank}
                          onChange={(e) => setRank(e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="یگان"
                          value={unit}
                          onChange={(e) => setUnit(e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          size="small"
                          label="نام کاربری"
                          value={user?.username || ''}
                          disabled
                        />
                      </Grid>
                    </Grid>

                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        mt: 3,
                      }}
                    >
                      <Button
                        variant="contained"
                        onClick={handleProfileSave}
                        disabled={!user}
                      >
                        ذخیره پروفایل
                      </Button>
                    </Box>
                  </Box>
                </Grid>

                {/* ستون تغییر رمز عبور */}
                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mb: 3,
                        pb: 2,
                        borderBottom: unifiedSectionHeaderBorder,
                      }}
                    >
                      <Lock
                        sx={unifiedSectionIconSx}
                      />
                      <Box>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 700, fontSize: '1.1rem', color: unifiedSectionColor }}
                        >
                          تغییر رمز عبور
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          برای امنیت بیشتر، رمز عبور خود را دوره‌ای تغییر دهید.
                        </Typography>
                      </Box>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          size="small"
                          type="password"
                          label="رمز عبور فعلی"
                          value={currentPassword}
                          onChange={(e) =>
                            setCurrentPassword(e.target.value)
                          }
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          size="small"
                          type="password"
                          label="رمز عبور جدید"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          size="small"
                          type="password"
                          label="تکرار رمز عبور جدید"
                          value={confirmPassword}
                          onChange={(e) =>
                            setConfirmPassword(e.target.value)
                          }
                        />
                      </Grid>
                    </Grid>

                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        mt: 3,
                      }}
                    >
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handlePasswordChange}
                      >
                        ثبت تغییر رمز
                      </Button>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* حالت تم + رنگ اصلی در یک کارت ترکیبی */}
        <Grid item xs={12} md={12}>
          <Card
            sx={{
              ...unifiedSectionCardSx,
              height: '100%',
            }}
          >
            <CardContent>
              <Grid container spacing={4}>
                {/* بخش حالت تم */}
                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mb: 4,
                        pb: 2,
                        borderBottom: unifiedSectionHeaderBorder,
                      }}
                    >
                      <Brightness6
                        sx={unifiedSectionIconSx}
                      />
                      <Typography
                        variant="h6"
                        sx={unifiedSectionTitleSx}
                      >
                        {t('settings.themeMode')}
                      </Typography>
                    </Box>

                    <ButtonGroup fullWidth variant="outlined" sx={{ mb: 4 }}>
                      <Button
                        onClick={() => dispatch(setThemeMode('light'))}
                        variant={
                          themeSettings.mode === 'light'
                            ? 'contained'
                            : 'outlined'
                        }
                        startIcon={<LightMode />}
                        sx={{ flex: 1 }}
                      >
                        {t('settings.light')}
                      </Button>
                      <Button
                        onClick={() => dispatch(setThemeMode('dark'))}
                        variant={
                          themeSettings.mode === 'dark'
                            ? 'contained'
                            : 'outlined'
                        }
                        startIcon={<DarkMode />}
                        sx={{ flex: 1 }}
                      >
                        {t('settings.dark')}
                      </Button>
                      <Button
                        onClick={() => dispatch(setThemeMode('auto'))}
                        variant={
                          themeSettings.mode === 'auto'
                            ? 'contained'
                            : 'outlined'
                        }
                        startIcon={<AutoMode />}
                        sx={{ flex: 1 }}
                      >
                        {t('settings.auto')}
                      </Button>
                    </ButtonGroup>

                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Chip
                        label={`${t('settings.currentMode')}: ${
                          themeSettings.mode === 'light'
                            ? t('settings.light')
                            : themeSettings.mode === 'dark'
                            ? t('settings.dark')
                            : t('settings.auto')
                        }`}
                        color="primary"
                        size="small"
                        icon={<CheckCircle />}
                      />
                    </Box>
                  </Box>
                </Grid>

                {/* بخش رنگ اصلی */}
                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mb: 4,
                        pb: 2,
                        borderBottom: unifiedSectionHeaderBorder,
                      }}
                    >
                      <Palette
                        sx={unifiedSectionIconSx}
                      />
                      <Typography
                        variant="h6"
                        sx={unifiedSectionTitleSx}
                      >
                        {t('settings.primaryColor')}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-around',
                        mb: 4,
                        flexWrap: 'wrap',
                        gap: 2,
                      }}
                    >
                      {[
                        {
                          value: 'green',
                          color: '#4caf50',
                          label: t('settings.colors.green'),
                        },
                        {
                          value: 'blue',
                          color: '#2196f3',
                          label: t('settings.colors.blue'),
                        },
                        {
                          value: 'red',
                          color: '#f44336',
                          label: t('settings.colors.red'),
                        },
                        {
                          value: 'purple',
                          color: '#9c27b0',
                          label: t('settings.colors.purple'),
                        },
                        {
                          value: 'orange',
                          color: '#ff9800',
                          label: t('settings.colors.orange'),
                        },
                      ].map((color) => (
                        <Tooltip key={color.value} title={color.label}>
                          <IconButton
                            onClick={() =>
                              handlePrimaryColorChange(
                                color.value as PrimaryColor
                              )
                            }
                            sx={{
                              width: 50,
                              height: 50,
                              bgcolor: color.color,
                              border:
                                themeSettings.primaryColor === color.value
                                  ? `4px solid #ffffff`
                                  : '2px solid transparent',
                              borderRadius: '50%',
                              transition: 'all 0.3s ease',
                              position: 'relative',
                              '&:hover': {
                                transform: 'scale(1.1)',
                                boxShadow: `0 4px 16px ${alpha(
                                  color.color,
                                  0.4
                                )}`,
                              },
                              '&::after':
                                themeSettings.primaryColor === color.value
                                  ? {
                                      content: '""',
                                      position: 'absolute',
                                      top: -6,
                                      left: -6,
                                      right: -6,
                                      bottom: -6,
                                      border: `3px solid #000000`,
                                      borderRadius: '50%',
                                      opacity: 0.6,
                                    }
                                  : {},
                            }}
                          />
                        </Tooltip>
                      ))}
                    </Box>

                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Chip
                        label={`${t('settings.selectedColor')}: ${t(
                          `settings.colors.${themeSettings.primaryColor}`
                        )}`}
                        color="secondary"
                        size="small"
                        icon={<Palette />}
                      />
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        

        {/* اندازه و نوع فونت */}
        <Grid item xs={12} md={6}>
          <Card sx={{ ...unifiedSectionCardSx, height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, pb: 2, borderBottom: unifiedSectionHeaderBorder }}>
                <FormatSize sx={unifiedSectionIconSx} />
                <Typography variant="h6" sx={unifiedSectionTitleSx}>
                  تنظیمات متن و فونت
                </Typography>
              </Box>
              
              {/* اندازه فونت */}
              <ButtonGroup fullWidth variant="outlined" sx={{ mb: 2 }}>
                <Button
                  onClick={() => dispatch(setFontSize('small'))}
                  variant={themeSettings.fontSize === 'small' ? 'contained' : 'outlined'}
                  sx={{ flex: 1 }}
                >
                  {t('settings.small')}
                </Button>
                <Button
                  onClick={() => dispatch(setFontSize('medium'))}
                  variant={themeSettings.fontSize === 'medium' ? 'contained' : 'outlined'}
                  sx={{ flex: 1 }}
                >
                  {t('settings.medium')}
                </Button>
                <Button
                  onClick={() => dispatch(setFontSize('large'))}
                  variant={themeSettings.fontSize === 'large' ? 'contained' : 'outlined'}
                  sx={{ flex: 1 }}
                >
                  {t('settings.large')}
                </Button>
              </ButtonGroup>

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Chip 
                  label={`${t('settings.currentSize')}: ${t(`settings.${themeSettings.fontSize}`)}`}
                  color="info"
                  size="small"
                  icon={<TextFields />}
                />
              </Box>

              {/* نوع فونت */}
              <Box sx={{ mt: 3 }}>
                <ButtonGroup fullWidth variant="outlined">
                  <Button
                    onClick={() => handleFontFamilyChange('iransans')}
                    variant={fontFamily === 'iransans' ? 'contained' : 'outlined'}
                    sx={{ flex: 1 }}
                  >
                    ایران‌سنس
                  </Button>
                  <Button
                    onClick={() => handleFontFamilyChange('vazir')}
                    variant={fontFamily === 'vazir' ? 'contained' : 'outlined'}
                    sx={{ flex: 1 }}
                  >
                    وزیر
                  </Button>
                  <Button
                    onClick={() => handleFontFamilyChange('shabnam')}
                    variant={fontFamily === 'shabnam' ? 'contained' : 'outlined'}
                    sx={{ flex: 1 }}
                  >
                    شبنم
                  </Button>
                </ButtonGroup>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* انتخاب زبان */}
        <Grid item xs={12} md={6}>
          <Card sx={{ ...unifiedSectionCardSx, height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, pb: 2, borderBottom: unifiedSectionHeaderBorder }}>
                <Language sx={unifiedSectionIconSx} />
                <Typography variant="h6" sx={unifiedSectionTitleSx}>
                  {t('settings.languageSelection')}
                </Typography>
              </Box>
              
              <ButtonGroup fullWidth variant="outlined" sx={{ mb: 4 }}>
                <Button
                  onClick={() => dispatch(setLanguage('fa'))}
                  variant={language === 'fa' ? 'contained' : 'outlined'}
                  sx={{ flex: 1 }}
                >
                  {t('settings.persian')}
                </Button>
                <Button
                  onClick={() => dispatch(setLanguage('en'))}
                  variant={language === 'en' ? 'contained' : 'outlined'}
                  sx={{ flex: 1 }}
                >
                  {t('settings.english')}
                </Button>
                <Button
                  onClick={() => dispatch(setLanguage('ar'))}
                  variant={language === 'ar' ? 'contained' : 'outlined'}
                  sx={{ flex: 1 }}
                >
                  {t('settings.arabic')}
                </Button>
              </ButtonGroup>

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Chip 
                  label={t(`settings.${language === 'fa' ? 'persian' : language === 'en' ? 'english' : 'arabic'}`)}
                  color="primary"
                  size="small"
                  icon={<CheckCircle />}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* تنظیمات دسترسی */}
        <Grid item xs={12}>
          <Card sx={{ ...unifiedSectionCardSx }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, pb: 2, borderBottom: unifiedSectionHeaderBorder }}>
                <Accessibility sx={unifiedSectionIconSx} />
                <Typography variant="h6" sx={unifiedSectionTitleSx}>
                  {t('settings.accessibility')}
                </Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={themeSettings.reducedMotion}
                        onChange={() => dispatch(toggleReducedMotion())}
                        color="primary"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', fontSize: '0.95rem', fontWeight: 500 }}>
                        <Speed sx={{ mr: 1.5, color: unifiedSectionColor }} fontSize="small" />
                        {t('settings.reducedMotion')}
                      </Box>
                    }
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={themeSettings.highContrast}
                        onChange={() => dispatch(toggleHighContrast())}
                        color="primary"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', fontSize: '0.95rem', fontWeight: 500 }}>
                        <Contrast sx={{ mr: 1.5, color: unifiedSectionColor }} fontSize="small" />
                        {t('settings.highContrast')}
                      </Box>
                    }
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* تنظیمات هدر زیارتی داشبورد */}
        <Grid item xs={12}>
          <Card
            sx={{
              ...unifiedSectionCardSx,
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 3,
                  pb: 2,
                  borderBottom: unifiedSectionHeaderBorder,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Palette sx={{ color: unifiedSectionColor }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                    تنظیمات هدر زیارتی داشبورد
                  </Typography>
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={headerSettings.enabled}
                      onChange={(e) => handleHeaderSettingsChange({ enabled: e.target.checked })}
                      color="primary"
                    />
                  }
                  label="نمایش هدر"
                />
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="متن سخن"
                    multiline
                    minRows={3}
                    value={headerEditorForm.quoteText}
                    onChange={(e) =>
                      handleHeaderFormFieldChange('quoteText', e.target.value)
                    }
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="نام شهید یا فرد"
                    value={headerEditorForm.personName}
                    onChange={(e) =>
                      handleHeaderFormFieldChange('personName', e.target.value)
                    }
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="سمت یا مسئولیت"
                    value={headerEditorForm.personPosition}
                    onChange={(e) =>
                      handleHeaderFormFieldChange('personPosition', e.target.value)
                    }
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    <input
                      id="header-entry-image"
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleHeaderImageChange}
                    />
                    <label htmlFor="header-entry-image">
                      <Button component="span" variant="outlined" size="small">
                        انتخاب تصویر
                      </Button>
                    </label>
                    <Typography variant="caption" color="text.secondary">
                      PNG / JPG - تصویر مربعی بهتر است.
                    </Typography>
                    {headerEditorForm.personImage && (
                      <Avatar
                        src={resolveHeaderImageSrc(headerEditorForm.personImage)}
                        sx={{ width: 42, height: 42, border: `1px solid ${alpha(theme.palette.divider, 0.6)}` }}
                      />
                    )}
                  </Box>
                </Grid>
              </Grid>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 1,
                  flexWrap: 'wrap',
                  mt: 3,
                  pt: 2,
                  borderTop: `1px dashed ${alpha(theme.palette.primary.main, 0.22)}`,
                }}
              >
                <Chip
                  size="small"
                  color={activeHeaderEntry ? 'primary' : 'default'}
                  label={
                    activeHeaderEntry
                      ? `نمایش در هدر: ${activeHeaderEntry.personName}`
                      : 'هنوز ردیفی فعال نشده است'
                  }
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {editingHeaderEntryId !== null && (
                    <Button variant="outlined" color="inherit" onClick={handleHeaderFormReset}>
                      انصراف از ویرایش
                    </Button>
                  )}
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={
                      isSavingHeader ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <CheckCircle />
                      )
                    }
                    onClick={handleHeaderSettingsSave}
                    disabled={isSavingHeader}
                  >
                    {isSavingHeader
                      ? 'در حال ذخیره...'
                      : editingHeaderEntryId !== null
                        ? 'به‌روزرسانی ردیف'
                        : 'ثبت در جدول'}
                  </Button>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                جدول اطلاعات هدر
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                با کلیک روی هر ردیف، اطلاعات همان ردیف برای ویرایش در فرم بالا بارگذاری می‌شود.
              </Typography>

              {isHeaderPageLoading && (
                <LinearProgress sx={{ mb: 1.5, borderRadius: 1 }} />
              )}

              <TableContainer
                component={Paper}
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  borderColor: alpha(theme.palette.primary.main, 0.25),
                  maxHeight: 420,
                }}
              >
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: 56 }}>#</TableCell>
                      <TableCell sx={{ width: 84 }}>تصویر</TableCell>
                      <TableCell sx={{ width: 220 }}>نام</TableCell>
                      <TableCell sx={{ width: 220 }}>سمت</TableCell>
                      <TableCell>متن سخن</TableCell>
                      <TableCell sx={{ width: 130 }}>وضعیت</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pagedHeaderEntries.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                          هنوز ردیفی ثبت نشده است.
                        </TableCell>
                      </TableRow>
                    )}

                    {pagedHeaderEntries.map((entry, index) => (
                      <TableRow
                        key={entry.id}
                        hover
                        selected={editingHeaderEntryId === entry.id}
                        onClick={() => handleHeaderRowSelect(entry)}
                        sx={{
                          cursor: 'pointer',
                          ...(entry.id === activeHeaderEntryId
                            ? { bgcolor: alpha(theme.palette.primary.main, 0.06) }
                            : {}),
                        }}
                      >
                        <TableCell>{headerPage * HEADER_PAGE_SIZE + index + 1}</TableCell>
                        <TableCell>
                          <Avatar
                            src={resolveHeaderImageSrc(entry.personImage)}
                            sx={{ width: 36, height: 36 }}
                          />
                        </TableCell>
                        <TableCell>{entry.personName}</TableCell>
                        <TableCell>{entry.personPosition}</TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: { xs: 160, md: 360 } }}>
                            {entry.quoteText}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            color={entry.id === activeHeaderEntryId ? 'primary' : 'default'}
                            label={entry.id === activeHeaderEntryId ? 'فعال در هدر' : 'ذخیره شده'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {totalHeaderPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Pagination
                    page={headerPage + 1}
                    count={totalHeaderPages}
                    onChange={handleHeaderPageChange}
                    color="primary"
                    shape="rounded"
                    siblingCount={0}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* ماژول‌های قابل نمایش در داشبورد */}
        <Grid item xs={12}>
          <Card
            sx={{
              ...unifiedSectionCardSx,
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  mb: 2,
                  pb: 1.5,
                  borderBottom: `1px solid ${alpha(unifiedSectionColor, 0.18)}`,
                }}
              >
                <ViewModule sx={{ color: unifiedSectionColor }} />
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem' }}>
                  ماژول‌های قابل نمایش داشبورد
                </Typography>
              </Box>

              <Grid container spacing={1}>
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={<Switch color="primary" checked={dashboardModules.showHeaderBanner} onChange={handleDashboardModuleToggle('showHeaderBanner')} />}
                    label="نمایش ماژول هدر"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={<Switch color="primary" checked={dashboardModules.showStatArchivedScenarios} onChange={handleDashboardModuleToggle('showStatArchivedScenarios')} />}
                    label="نمایش کارت سناریوهای آرشیو"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={<Switch color="primary" checked={dashboardModules.showStatAvailableForces} onChange={handleDashboardModuleToggle('showStatAvailableForces')} />}
                    label="نمایش کارت نیروهای موجود"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={<Switch color="primary" checked={dashboardModules.showStatOngoingOperations} onChange={handleDashboardModuleToggle('showStatOngoingOperations')} />}
                    label="نمایش کارت عملیات در حال اجرا"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={<Switch color="primary" checked={dashboardModules.showStatSecurityAlerts} onChange={handleDashboardModuleToggle('showStatSecurityAlerts')} />}
                    label="نمایش کارت هشدارهای امنیتی"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={<Switch color="primary" checked={dashboardModules.showRecentActivities} onChange={handleDashboardModuleToggle('showRecentActivities')} />}
                    label="نمایش فعالیت‌های اخیر"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={<Switch color="primary" checked={dashboardModules.showQuickAccess} onChange={handleDashboardModuleToggle('showQuickAccess')} />}
                    label="نمایش دسترسی سریع"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={<Switch color="primary" checked={dashboardModules.showSystemStatus} onChange={handleDashboardModuleToggle('showSystemStatus')} />}
                    label="نمایش وضعیت سیستم"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={<Switch color="primary" checked={dashboardModules.showImportantNotices} onChange={handleDashboardModuleToggle('showImportantNotices')} />}
                    label="نمایش اطلاعیه‌های مهم"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* دکمه‌های عملکرد */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: alpha(theme.palette.background.paper, 0.8) }}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={() => dispatch(resetToDefaultSettings())}
                sx={{ 
                  minWidth: 200,
                  py: 1.5,
                  background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`,
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[8],
                  }
                }}
              >
                {t('settings.resetToDefault')}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Snackbar
        open={headerSaveFeedbackOpen}
        autoHideDuration={2800}
        onClose={() => setHeaderSaveFeedbackOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setHeaderSaveFeedbackOpen(false)}
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          تنظیمات هدر با موفقیت ذخیره شد.
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default SettingsPage; 

