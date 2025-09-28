import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Switch,
  FormControlLabel,
  Button,
  ButtonGroup,
  Divider,
  Grid,
  useTheme,
  Slider,
  Tooltip,
  alpha,
  Fade,
} from '@mui/material';
import {
  Close,
  Brightness4,
  Brightness7,
  Brightness6,
  Palette,
  TextFields,
  Refresh,
  Settings,
  Language,
  Accessibility,
  Speed,
  CheckCircle,
  FormatSize,
  Contrast,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  selectTheme,
  setThemeMode,
  setPrimaryColor,
  setBackgroundTheme,
  toggleReducedMotion,
  toggleHighContrast,
  setFontSize,
  PrimaryColor,
  setLanguage,
  resetToDefaultSettings,
  closeSidePanel,
} from '@/store/slices/uiSlice';
import { useTranslation } from '@/hooks/useTranslation';
import TranslatedText from '@/components/common/TranslatedText';

interface SettingsPanelProps {
  onClose: () => void;
  onRequestClose?: () => void; // جدید برای هماهنگی با انیمیشن بسته شدن
}

const STAGGER_DELAYS = [0, 120, 240, 360, 480]; // میلی‌ثانیه برای هر بخش

const SECTION_MIN_HEIGHT = 72; // ارتفاع تقریبی هر بخش (قابل تنظیم)

const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose, onRequestClose }) => {
  console.log('SettingsPanel rendered');
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const themeSettings = useAppSelector(selectTheme);
  const { language } = useAppSelector(state => state.ui);
  const { t } = useTranslation();
  const [fadeStates, setFadeStates] = useState([false, false, false, false, false]);
  const [isClosing, setIsClosing] = useState(false);

  // استفاده از همان تابع صفحه کامل تنظیمات
  const handlePrimaryColorChange = (color: PrimaryColor) => {
    dispatch(setPrimaryColor(color));
    
    // تغییر خودکار رنگ پس‌زمینه متناسب با رنگ اصلی (همان کد صفحه کامل)
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

  const handleThemeModeChange = (mode: 'light' | 'dark' | 'auto') => {
    dispatch(setThemeMode(mode));
  };

  const handleFontSizeChange = (size: 'small' | 'medium' | 'large') => {
    dispatch(setFontSize(size));
  };

  const handleLanguageChange = (lang: 'fa' | 'en' | 'ar') => {
    console.log('Changing language to:', lang);
    dispatch(setLanguage(lang));
  };

  const handleResetToDefaults = () => {
    dispatch(resetToDefaultSettings());
  };

  const handleNavigateToAllSettings = () => {
    // بستن پنل کناری
    dispatch(closeSidePanel());
    // هدایت به صفحه کامل تنظیمات
    navigate('/dashboard/settings');
  };

  // نمایش ترتیبی هنگام باز شدن
  useEffect(() => {
    if (!isClosing) {
      setFadeStates([false, false, false, false, false]);
      STAGGER_DELAYS.forEach((delay, idx) => {
        setTimeout(() => {
          setFadeStates(prev => {
            const next = [...prev];
            next[idx] = true;
            return next;
          });
        }, delay);
      });
    }
  }, [isClosing]);

  // هنگام بسته شدن: ابتدا fadeها را خاموش کن، بعد از اتمام، onRequestClose را صدا بزن
  const handleClose = () => {
    setIsClosing(true);
    setFadeStates([false, false, false, false, false]);
    setTimeout(() => {
      setIsClosing(false);
      if (onRequestClose) onRequestClose();
      else onClose();
    }, STAGGER_DELAYS[STAGGER_DELAYS.length - 1] + 350); // 350ms مدت fade آخر
  };

  return (
    <Paper sx={{ 
      height: 'calc(100vh - 128px)',
      mx: 1,
      mt: 3,
      mb: 4,
      borderRadius: 3,
      boxShadow: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative',
      bgcolor: 'background.paper',
    }}>
      {/* Header ثابت */}
      <Box sx={{ 
        p: 2,
        pb: 1.5,
        borderBottom: `1px solid ${theme.palette.divider}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {t('settings.title')}
        </Typography>
        <IconButton 
          onClick={handleClose} 
          size="small"
        >
          <Close fontSize="small" />
        </IconButton>
      </Box>
      
      {/* محتوای قابل اسکرول */}
      <Box sx={{ 
        flex: 1,
        overflow: 'auto',
        p: 2,
        pt: 1.5,
      }}>

        {/* حالت تم */}
        <Box sx={{ mb: 3, minHeight: SECTION_MIN_HEIGHT, position: 'relative' }}>
          <Fade in={fadeStates[0]} timeout={350} unmountOnExit={false}>
            <Box sx={{ position: 'absolute', width: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, pb: 1, borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.2)}` }}>
                <Brightness6 sx={{ mr: 1.5, color: '#ffc107', fontSize: '1.1rem' }} />
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.9rem', color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000' }}>
                  {t('settings.themeMode')}
                </Typography>
              </Box>
              <ButtonGroup fullWidth variant="outlined" size="small" sx={{ mb: 2 }}>
                <Button
                  onClick={() => handleThemeModeChange('light')}
                  variant={themeSettings.mode === 'light' ? 'contained' : 'outlined'}
                  sx={{ flex: 1, py: 0.5, fontSize: '0.75rem' }}
                >
                  {t('settings.light')}
                </Button>
                <Button
                  onClick={() => handleThemeModeChange('dark')}
                  variant={themeSettings.mode === 'dark' ? 'contained' : 'outlined'}
                  sx={{ flex: 1, py: 0.5, fontSize: '0.75rem' }}
                >
                  {t('settings.dark')}
                </Button>
                <Button
                  onClick={() => handleThemeModeChange('auto')}
                  variant={themeSettings.mode === 'auto' ? 'contained' : 'outlined'}
                  sx={{ flex: 1, py: 0.5, fontSize: '0.75rem' }}
                >
                  {t('settings.auto')}
                </Button>
              </ButtonGroup>
            </Box>
          </Fade>
        </Box>

        {/* رنگ اصلی */}
        <Box sx={{ mb: 3, minHeight: SECTION_MIN_HEIGHT, position: 'relative' }}>
          <Fade in={fadeStates[1]} timeout={350} unmountOnExit={false}>
            <Box sx={{ position: 'absolute', width: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, pb: 1, borderBottom: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}` }}>
                <Palette sx={{ mr: 1.5, color: theme.palette.secondary.main, fontSize: '1.1rem' }} />
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.9rem', color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000' }}>
                  {t('settings.primaryColor')}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between', mb: 2 }}>
                {[
                  { value: 'green', color: '#4caf50' },
                  { value: 'blue', color: '#2196f3' },
                  { value: 'red', color: '#f44336' },
                  { value: 'purple', color: '#9c27b0' },
                  { value: 'orange', color: '#ff9800' },
                ].map((option) => (
                  <IconButton
                    key={option.value}
                    onClick={() => handlePrimaryColorChange(option.value as PrimaryColor)}
                    sx={{
                      width: 32,
                      height: 32,
                      border: themeSettings.primaryColor === option.value ? `3px solid #ffffff` : '1px solid transparent',
                      borderRadius: '50%',
                      bgcolor: option.color,
                      position: 'relative',
                      '&:hover': {
                        bgcolor: option.color,
                        opacity: 0.8,
                      },
                      '&::after': themeSettings.primaryColor === option.value ? {
                        content: '""',
                        position: 'absolute',
                        top: -4,
                        left: -4,
                        right: -4,
                        bottom: -4,
                        border: `2px solid #000000`,
                        borderRadius: '50%',
                        opacity: 0.6,
                      } : {},
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Fade>
        </Box>

        {/* اندازه فونت */}
        <Box sx={{ mb: 3, minHeight: SECTION_MIN_HEIGHT, position: 'relative' }}>
          <Fade in={fadeStates[2]} timeout={350} unmountOnExit={false}>
            <Box sx={{ position: 'absolute', width: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, pb: 1, borderBottom: `1px solid ${alpha(theme.palette.info.main, 0.2)}` }}>
                <FormatSize sx={{ mr: 1.5, color: theme.palette.info.main, fontSize: '1.1rem' }} />
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.9rem', color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000' }}>
                  {t('settings.fontSize')}
                </Typography>
              </Box>
              <ButtonGroup fullWidth variant="outlined" size="small" sx={{ mb: 2 }}>
                <Button
                  onClick={() => handleFontSizeChange('small')}
                  variant={themeSettings.fontSize === 'small' ? 'contained' : 'outlined'}
                  sx={{ flex: 1, py: 0.5, fontSize: '0.75rem' }}
                >
                  {t('settings.small')}
                </Button>
                <Button
                  onClick={() => handleFontSizeChange('medium')}
                  variant={themeSettings.fontSize === 'medium' ? 'contained' : 'outlined'}
                  sx={{ flex: 1, py: 0.5, fontSize: '0.75rem' }}
                >
                  {t('settings.medium')}
                </Button>
                <Button
                  onClick={() => handleFontSizeChange('large')}
                  variant={themeSettings.fontSize === 'large' ? 'contained' : 'outlined'}
                  sx={{ flex: 1, py: 0.5, fontSize: '0.75rem' }}
                >
                  {t('settings.large')}
                </Button>
              </ButtonGroup>
            </Box>
          </Fade>
        </Box>

        {/* انتخاب زبان */}
        <Box sx={{ mb: 3, minHeight: SECTION_MIN_HEIGHT, position: 'relative' }}>
          <Fade in={fadeStates[3]} timeout={350} unmountOnExit={false}>
            <Box sx={{ position: 'absolute', width: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, pb: 1, borderBottom: `1px solid ${alpha(theme.palette.success.main, 0.2)}` }}>
                <Language sx={{ mr: 1.5, color: theme.palette.success.main, fontSize: '1.1rem' }} />
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.9rem', color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000' }}>
                  {t('settings.languageSelection')}
                </Typography>
              </Box>
              <ButtonGroup fullWidth variant="outlined" size="small" sx={{ mb: 2 }}>
                <Button
                  onClick={() => handleLanguageChange('fa')}
                  variant={language === 'fa' ? 'contained' : 'outlined'}
                  sx={{ flex: 1, py: 0.5, fontSize: '0.75rem' }}
                >
                  {t('settings.persian')}
                </Button>
                <Button
                  onClick={() => handleLanguageChange('en')}
                  variant={language === 'en' ? 'contained' : 'outlined'}
                  sx={{ flex: 1, py: 0.5, fontSize: '0.75rem' }}
                >
                  {t('settings.english')}
                </Button>
                <Button
                  onClick={() => handleLanguageChange('ar')}
                  variant={language === 'ar' ? 'contained' : 'outlined'}
                  sx={{ flex: 1, py: 0.5, fontSize: '0.75rem' }}
                >
                  {t('settings.arabic')}
                </Button>
              </ButtonGroup>
            </Box>
          </Fade>
        </Box>

        {/* تنظیمات دسترسی */}
        <Box sx={{ mb: 3, minHeight: SECTION_MIN_HEIGHT, position: 'relative' }}>
          <Fade in={fadeStates[4]} timeout={350} unmountOnExit={false}>
            <Box sx={{ position: 'absolute', width: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, pb: 1, borderBottom: `1px solid ${alpha(theme.palette.warning.main, 0.2)}` }}>
                <Accessibility sx={{ mr: 1.5, color: theme.palette.warning.main, fontSize: '1.1rem' }} />
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.9rem', color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000' }}>
                  {t('settings.accessibility')}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={themeSettings.reducedMotion}
                      onChange={() => dispatch(toggleReducedMotion())}
                      color="warning"
                      size="small"
                    />
                  }
                  label={
                    <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center' }}>
                      <Speed sx={{ mr: 1, color: theme.palette.warning.main }} fontSize="small" />
                      {t('settings.reducedMotion')}
                    </Typography>
                  }
                  sx={{ m: 0 }}
                />
                <FormControlLabel
                  control={
                    <Switch 
                      checked={themeSettings.highContrast}
                      onChange={() => dispatch(toggleHighContrast())}
                      color="warning"
                      size="small"
                    />
                  }
                  label={
                    <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center' }}>
                      <Contrast sx={{ mr: 1, color: theme.palette.warning.main }} fontSize="small" />
                      {t('settings.highContrast')}
                    </Typography>
                  }
                  sx={{ m: 0 }}
                />
              </Box>
            </Box>
          </Fade>
        </Box>

        {/* تنظیمات کلی */}
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Refresh />}
            size="small"
            sx={{ py: 0.5, fontSize: '0.75rem' }}
            onClick={handleResetToDefaults}
          >
            {t('settings.resetToDefault')}
          </Button>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Settings />}
            size="small"
            sx={{ py: 0.5, fontSize: '0.75rem' }}
            onClick={handleNavigateToAllSettings}
          >
            {t('settings.allSettings')}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default SettingsPanel; 