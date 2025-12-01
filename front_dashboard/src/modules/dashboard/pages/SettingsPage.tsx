import React, { useEffect, useState } from 'react';
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
  useTheme,
  alpha,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Palette,
  DarkMode,
  LightMode,
  AutoMode,
  TextFields,
  Language,
  PhoneAndroid,
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
  showSuccessNotification,
} from '@/store/slices/uiSlice';
import { RootState } from '@/store';
import { PrimaryColor } from '@/store/slices/uiSlice';
import TranslatedText from '@/components/common/TranslatedText';
import { useTranslation } from '@/hooks/useTranslation';
import { quotes } from '@/config/quotes';
import { martyrs } from '@/config/martyrs';
import { selectUser, updateUser } from '@/store/slices/authSlice';

const SettingsPage: React.FC = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { t } = useTranslation();
  const themeSettings = useSelector(selectTheme);
  const { language } = useSelector((state: RootState) => state.ui);
  const headerSettings = useSelector(selectHeaderSettings) as HeaderSettings;
  const user = useSelector(selectUser);
  
  // استیت محلی پروفایل
  const [displayName, setDisplayName] = useState(user?.name || '');
  const [rank, setRank] = useState(user?.rank || '');
  const [unit, setUnit] = useState(user?.unit || '');
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(user?.avatar);

  // استیت محلی تغییر رمز
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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
              height: '100%',
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.primary.main,
                0.08
              )}, ${alpha(theme.palette.error.light, 0.1)})`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[8],
              },
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
                        borderBottom: `2px solid ${alpha(
                          theme.palette.primary.main,
                          0.15
                        )}`,
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
                        borderBottom: `2px solid ${alpha(
                          theme.palette.error.main,
                          0.12
                        )}`,
                      }}
                    >
                      <Lock
                        sx={{
                          mr: 2,
                          color: theme.palette.error.main,
                        }}
                      />
                      <Box>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            fontSize: '1.1rem',
                            color: theme.palette.error.main,
                          }}
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
                        color="error"
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
              height: '100%',
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.primary.main,
                0.1
              )}, ${alpha(theme.palette.secondary.main, 0.1)})`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[8],
              },
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
                        borderBottom: `2px solid ${alpha(
                          theme.palette.primary.main,
                          0.1
                        )}`,
                      }}
                    >
                      <Brightness6
                        sx={{
                          mr: 2,
                          color: theme.palette.primary.main,
                          fontSize: '1.5rem',
                        }}
                      />
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          fontSize: '1.25rem',
                          color: theme.palette.primary.main,
                        }}
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
                        borderBottom: `2px solid ${alpha(
                          theme.palette.secondary.main,
                          0.1
                        )}`,
                      }}
                    >
                      <Palette
                        sx={{
                          mr: 2,
                          color: theme.palette.secondary.main,
                          fontSize: '1.5rem',
                        }}
                      />
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          fontSize: '1.25rem',
                          color: theme.palette.secondary.main,
                        }}
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
          <Card sx={{ 
            height: '100%',
            background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)}, ${alpha(theme.palette.info.light, 0.1)})`,
            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: theme.shadows[8],
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, pb: 2, borderBottom: `2px solid ${alpha(theme.palette.info.main, 0.1)}` }}>
                <FormatSize sx={{ mr: 2, color: theme.palette.info.main, fontSize: '1.5rem' }} />
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.25rem', color: theme.palette.info.main }}>
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
          <Card sx={{ 
            height: '100%',
            background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)}, ${alpha(theme.palette.success.light, 0.1)})`,
            border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: theme.shadows[8],
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, pb: 2, borderBottom: `2px solid ${alpha(theme.palette.success.main, 0.1)}` }}>
                <Language sx={{ mr: 2, color: theme.palette.success.main, fontSize: '1.5rem' }} />
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.25rem', color: theme.palette.success.main }}>
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
                  color="success"
                  size="small"
                  icon={<CheckCircle />}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* تنظیمات دسترسی */}
        <Grid item xs={12}>
          <Card sx={{ 
            background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)}, ${alpha(theme.palette.warning.light, 0.1)})`,
            border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: theme.shadows[6],
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, pb: 2, borderBottom: `2px solid ${alpha(theme.palette.warning.main, 0.1)}` }}>
                <Accessibility sx={{ mr: 2, color: theme.palette.warning.main, fontSize: '1.5rem' }} />
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.25rem', color: theme.palette.warning.main }}>
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
                        color="warning"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', fontSize: '0.95rem', fontWeight: 500 }}>
                        <Speed sx={{ mr: 1.5, color: theme.palette.warning.main }} fontSize="small" />
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
                        color="warning"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', fontSize: '0.95rem', fontWeight: 500 }}>
                        <Contrast sx={{ mr: 1.5, color: theme.palette.warning.main }} fontSize="small" />
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
              background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.06)}, ${alpha(theme.palette.info.main, 0.06)})`,
              border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows[6],
              },
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
                  borderBottom: `2px solid ${alpha(theme.palette.success.main, 0.12)}`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Palette sx={{ color: theme.palette.success.main }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                    تنظیمات هدر زیارتی داشبورد
                  </Typography>
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={headerSettings.enabled}
                      onChange={(e) => handleHeaderSettingsChange({ enabled: e.target.checked })}
                      color="success"
                    />
                  }
                  label="نمایش هدر"
                />
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="header-quote-mode-label">حالت سخن</InputLabel>
                    <Select
                      labelId="header-quote-mode-label"
                      label="حالت سخن"
                      value={headerSettings.quoteMode}
                      onChange={(e) =>
                        handleHeaderSettingsChange({
                          quoteMode: e.target.value as HeaderSettings['quoteMode'],
                        })
                      }
                    >
                      <MenuItem value="random">تصادفی</MenuItem>
                      <MenuItem value="fixed">انتخاب دستی</MenuItem>
                      <MenuItem value="custom">سفارشی</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl
                    fullWidth
                    size="small"
                    disabled={headerSettings.quoteMode !== 'fixed'}
                  >
                    <InputLabel id="header-quote-select-label">انتخاب سخن</InputLabel>
                    <Select
                      labelId="header-quote-select-label"
                      label="انتخاب سخن"
                      value={
                        headerSettings.fixedQuoteIndex !== null
                          ? headerSettings.fixedQuoteIndex
                          : ''
                      }
                      onChange={(e) =>
                        handleHeaderSettingsChange({
                          fixedQuoteIndex:
                            e.target.value === '' ? null : Number(e.target.value),
                        })
                      }
                    >
                      {quotes.map((q, index) => (
                        <MenuItem key={index} value={index}>
                          {q.text.slice(0, 40)}
                          {q.text.length > 40 ? '…' : ''} — {q.author}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                {/* فیلدهای سخن سفارشی */}
                {headerSettings.quoteMode === 'custom' && (
                  <Grid item xs={12}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={8}>
                        <TextField
                          fullWidth
                          size="small"
                          label="متن سخن"
                          value={headerSettings.customQuoteText || ''}
                          onChange={(e) =>
                            handleHeaderSettingsChange({
                              customQuoteText: e.target.value,
                            })
                          }
                          multiline
                          minRows={2}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          size="small"
                          label="گوینده"
                          value={headerSettings.customQuoteAuthor || ''}
                          onChange={(e) =>
                            handleHeaderSettingsChange({
                              customQuoteAuthor: e.target.value,
                            })
                          }
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                )}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="header-martyr-mode-label">حالت شهید</InputLabel>
                    <Select
                      labelId="header-martyr-mode-label"
                      label="حالت شهید"
                      value={headerSettings.martyrMode}
                      onChange={(e) =>
                        handleHeaderSettingsChange({
                          martyrMode: e.target.value as HeaderSettings['martyrMode'],
                        })
                      }
                    >
                      <MenuItem value="random">تصادفی</MenuItem>
                      <MenuItem value="fixed">انتخاب دستی</MenuItem>
                      <MenuItem value="custom">سفارشی</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl
                    fullWidth
                    size="small"
                    disabled={headerSettings.martyrMode !== 'fixed'}
                  >
                    <InputLabel id="header-martyr-select-label">انتخاب شهید</InputLabel>
                    <Select
                      labelId="header-martyr-select-label"
                      label="انتخاب شهید"
                      value={
                        headerSettings.fixedMartyrId !== null
                          ? headerSettings.fixedMartyrId
                          : ''
                      }
                      onChange={(e) =>
                        handleHeaderSettingsChange({
                          fixedMartyrId:
                            e.target.value === '' ? null : Number(e.target.value),
                        })
                      }
                    >
                      {martyrs.map((m) => (
                        <MenuItem key={m.id} value={m.id}>
                          {m.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                {/* فیلدهای شهید سفارشی */}
                {headerSettings.martyrMode === 'custom' && (
                  <Grid item xs={12}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          size="small"
                          label="نام شهید"
                          value={headerSettings.customMartyrName || ''}
                          onChange={(e) =>
                            handleHeaderSettingsChange({
                              customMartyrName: e.target.value,
                            })
                          }
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          size="small"
                          label="سمت / مسئولیت"
                          value={headerSettings.customMartyrPosition || ''}
                          onChange={(e) =>
                            handleHeaderSettingsChange({
                              customMartyrPosition: e.target.value,
                            })
                          }
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          size="small"
                          label="تاریخ شهادت"
                          placeholder="مثلاً ۱۳ دی ۱۳۹۸"
                          value={headerSettings.customMartyrDate || ''}
                          onChange={(e) =>
                            handleHeaderSettingsChange({
                              customMartyrDate: e.target.value,
                            })
                          }
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            flexWrap: 'wrap',
                          }}
                        >
                          <Box>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              تصویر شهید (استاندارد ۸۰×۸۰، نسبت مربعی)
                            </Typography>
                            <input
                              id="custom-martyr-image"
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = evt => {
                                  const result = evt.target?.result;
                                  if (typeof result === 'string') {
                                    handleHeaderSettingsChange({
                                      customMartyrImage: result,
                                    });
                                  }
                                };
                                reader.readAsDataURL(file);
                              }}
                            />
                            <label htmlFor="custom-martyr-image">
                              <Button
                                component="span"
                                variant="outlined"
                                size="small"
                              >
                                انتخاب تصویر
                              </Button>
                            </label>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: 'block', mt: 0.5 }}
                            >
                              فرمت‌های مجاز: PNG / JPG – بهتر است تصویر با پس‌زمینه ساده و مربع باشد.
                            </Typography>
                          </Box>

                          {headerSettings.customMartyrImage && (
                            <Box
                              sx={{
                                width: 80,
                                height: 80,
                                borderRadius: 1,
                                overflow: 'hidden',
                                border: `1px solid ${alpha(
                                  theme.palette.divider,
                                  0.6
                                )}`,
                              }}
                            >
                              <img
                                src={headerSettings.customMartyrImage}
                                alt="پیش‌نمایش شهید"
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                }}
                              />
                            </Box>
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  </Grid>
                )}
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
    </Container>
  );
};

export default SettingsPage; 