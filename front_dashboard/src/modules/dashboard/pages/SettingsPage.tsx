import React, { useEffect } from 'react';
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
  resetToDefaultSettings
} from '@/store/slices/uiSlice';
import { RootState } from '@/store';
import { PrimaryColor } from '@/store/slices/uiSlice';
import TranslatedText from '@/components/common/TranslatedText';
import { useTranslation } from '@/hooks/useTranslation';

const SettingsPage: React.FC = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { t } = useTranslation();
  const themeSettings = useSelector(selectTheme);
  const { language } = useSelector((state: RootState) => state.ui);
  
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
        {/* حالت تم */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            height: '100%', 
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: theme.shadows[8],
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, pb: 2, borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
                <Brightness6 sx={{ mr: 2, color: theme.palette.primary.main, fontSize: '1.5rem' }} />
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.25rem', color: theme.palette.primary.main }}>
                  {t('settings.themeMode')}
                </Typography>
              </Box>
              
              <ButtonGroup fullWidth variant="outlined" sx={{ mb: 4 }}>
                <Button
                  onClick={() => dispatch(setThemeMode('light'))}
                  variant={themeSettings.mode === 'light' ? 'contained' : 'outlined'}
                  startIcon={<LightMode />}
                  sx={{ flex: 1 }}
                >
                  {t('settings.light')}
                </Button>
                <Button
                  onClick={() => dispatch(setThemeMode('dark'))}
                  variant={themeSettings.mode === 'dark' ? 'contained' : 'outlined'}
                  startIcon={<DarkMode />}
                  sx={{ flex: 1 }}
                >
                  {t('settings.dark')}
                </Button>
                <Button
                  onClick={() => dispatch(setThemeMode('auto'))}
                  variant={themeSettings.mode === 'auto' ? 'contained' : 'outlined'}
                  startIcon={<AutoMode />}
                  sx={{ flex: 1 }}
                >
                  {t('settings.auto')}
                </Button>
              </ButtonGroup>

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Chip 
                  label={`${t('settings.currentMode')}: ${themeSettings.mode === 'light' ? t('settings.light') : themeSettings.mode === 'dark' ? t('settings.dark') : t('settings.auto')}`}
                  color="primary"
                  size="small"
                  icon={<CheckCircle />}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* رنگ اصلی */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            height: '100%',
            background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.1)}, ${alpha(theme.palette.primary.main, 0.1)})`,
            border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: theme.shadows[8],
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, pb: 2, borderBottom: `2px solid ${alpha(theme.palette.secondary.main, 0.1)}` }}>
                <Palette sx={{ mr: 2, color: theme.palette.secondary.main, fontSize: '1.5rem' }} />
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.25rem', color: theme.palette.secondary.main }}>
                  {t('settings.primaryColor')}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 4 }}>
                {[
                  { value: 'green', color: '#4caf50', label: t('settings.colors.green') },
                  { value: 'blue', color: '#2196f3', label: t('settings.colors.blue') },
                  { value: 'red', color: '#f44336', label: t('settings.colors.red') },
                  { value: 'purple', color: '#9c27b0', label: t('settings.colors.purple') },
                  { value: 'orange', color: '#ff9800', label: t('settings.colors.orange') },
                ].map((color) => (
                  <Tooltip key={color.value} title={color.label}>
                    <IconButton
                      onClick={() => handlePrimaryColorChange(color.value as PrimaryColor)}
                      sx={{
                        width: 50,
                        height: 50,
                        bgcolor: color.color,
                        border: themeSettings.primaryColor === color.value ? `4px solid #ffffff` : '2px solid transparent',
                        borderRadius: '50%',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        '&:hover': {
                          transform: 'scale(1.1)',
                          boxShadow: `0 4px 16px ${alpha(color.color, 0.4)}`,
                        },
                        '&::after': themeSettings.primaryColor === color.value ? {
                          content: '""',
                          position: 'absolute',
                          top: -6,
                          left: -6,
                          right: -6,
                          bottom: -6,
                          border: `3px solid #000000`,
                          borderRadius: '50%',
                          opacity: 0.6,
                        } : {},
                      }}
                    />
                  </Tooltip>
                ))}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Chip 
                  label={`${t('settings.selectedColor')}: ${t(`settings.colors.${themeSettings.primaryColor}`)}`}
                  color="secondary"
                  size="small"
                  icon={<Palette />}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        

        {/* اندازه فونت */}
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
                  {t('settings.fontSize')}
                </Typography>
              </Box>
              
              <ButtonGroup fullWidth variant="outlined" sx={{ mb: 4 }}>
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
              
              <Button
                variant="outlined"
                startIcon={<Settings />}
                sx={{ 
                  minWidth: 200,
                  py: 1.5,
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                    transform: 'translateY(-2px)',
                  }
                }}
              >
                {t('settings.advancedSettings')}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default SettingsPage; 