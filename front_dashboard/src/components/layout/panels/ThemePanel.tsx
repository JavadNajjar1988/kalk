import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  Switch,
  FormControlLabel,
  Divider,
  Chip,
  alpha,
  useTheme,
  Zoom,
  Tooltip,
} from '@mui/material';
import {
  Check as CheckIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  BrightnessAuto as AutoModeIcon,
  Palette as PaletteIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../store';
import { 
  setBackgroundTheme, 
  setThemeMode, 
  toggleHighContrast,
  toggleReducedMotion,
  BackgroundTheme 
} from '../../../store/slices/uiSlice';
import { backgroundThemes } from '../../../theme/backgroundThemes';

const ThemePanel: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const uiState = useSelector((state: RootState) => state.ui.theme);

  const handleThemeChange = (themeKey: BackgroundTheme) => {
    dispatch(setBackgroundTheme(themeKey));
  };

  const handleModeChange = (mode: 'light' | 'dark' | 'auto') => {
    dispatch(setThemeMode(mode));
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Theme Mode Selection */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          حالت نمایش
        </Typography>
        <Grid container spacing={1}>
          {[
            { key: 'light', label: 'روشن', icon: <LightModeIcon /> },
            { key: 'dark', label: 'تیره', icon: <DarkModeIcon /> },
            { key: 'auto', label: 'خودکار', icon: <AutoModeIcon /> },
          ].map((mode) => (
            <Grid item xs={4} key={mode.key}>
              <Card
                sx={{
                  cursor: 'pointer',
                  border: `2px solid ${
                    uiState.mode === mode.key 
                      ? theme.palette.primary.main 
                      : 'transparent'
                  }`,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    border: `2px solid ${alpha(theme.palette.primary.main, 0.5)}`,
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[4],
                  },
                }}
              >
                <CardActionArea
                  onClick={() => handleModeChange(mode.key as any)}
                  sx={{ p: 2, textAlign: 'center' }}
                >
                  <Box sx={{ color: 'primary.main', mb: 1 }}>
                    {mode.icon}
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {mode.label}
                  </Typography>
                  {uiState.mode === mode.key && (
                    <Zoom in={true}>
                      <CheckIcon 
                        sx={{ 
                          color: 'primary.main', 
                          fontSize: 16,
                          position: 'absolute',
                          top: 8,
                          right: 8,
                        }} 
                      />
                    </Zoom>
                  )}
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Background Themes */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <PaletteIcon sx={{ color: 'primary.main' }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            تم‌های پس‌زمینه
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          رنگ و ظاهر کلی سیستم را تغییر دهید
        </Typography>

        <Grid container spacing={2}>
          {Object.entries(backgroundThemes).map(([key, themeConfig]) => (
            <Grid item xs={12} sm={6} key={key}>
              <Tooltip title={themeConfig.description} placement="top">
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: `2px solid ${
                      uiState.backgroundTheme === key 
                        ? theme.palette.primary.main 
                        : alpha(theme.palette.divider, 0.2)
                    }`,
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      border: `2px solid ${alpha(theme.palette.primary.main, 0.7)}`,
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8],
                    },
                  }}
                >
                  <CardActionArea onClick={() => handleThemeChange(key as BackgroundTheme)}>
                    {/* Preview */}
                    <Box
                      sx={{
                        height: 80,
                        background: themeConfig.preview,
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {/* Mini UI Preview */}
                      <Box
                        sx={{
                          width: '80%',
                          height: '60%',
                          background: alpha(themeConfig.colors.background.paper, 0.9),
                          borderRadius: 1,
                          border: `1px solid ${alpha(themeConfig.colors.border.light, 0.5)}`,
                          display: 'flex',
                          flexDirection: 'column',
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          sx={{
                            height: '30%',
                            background: themeConfig.colors.header.background,
                            borderBottom: `1px solid ${themeConfig.colors.border.light}`,
                          }}
                        />
                        <Box
                          sx={{
                            flex: 1,
                            p: 0.5,
                            display: 'flex',
                            gap: 0.5,
                          }}
                        >
                          <Box
                            sx={{
                              width: '30%',
                              background: themeConfig.colors.sidebar.background,
                              borderRadius: 0.5,
                            }}
                          />
                          <Box
                            sx={{
                              flex: 1,
                              background: themeConfig.colors.surface.level1,
                              borderRadius: 0.5,
                            }}
                          />
                        </Box>
                      </Box>

                      {/* Selected indicator */}
                      {uiState.backgroundTheme === key && (
                        <Zoom in={true}>
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              background: theme.palette.primary.main,
                              borderRadius: '50%',
                              width: 24,
                              height: 24,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: theme.shadows[2],
                            }}
                          >
                            <CheckIcon sx={{ color: 'white', fontSize: 16 }} />
                          </Box>
                        </Zoom>
                      )}
                    </Box>

                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {themeConfig.displayName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            {themeConfig.description}
                          </Typography>
                        </Box>
                        {key === 'custom' && (
                          <Chip 
                            label="سفارشی" 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Tooltip>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Accessibility Options */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          تنظیمات دسترسی
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={uiState.highContrast}
                onChange={() => dispatch(toggleHighContrast())}
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  کنتراست بالا
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  افزایش کنتراست برای خوانایی بهتر
                </Typography>
              </Box>
            }
          />

          <FormControlLabel
            control={
              <Switch
                checked={uiState.reducedMotion}
                onChange={() => dispatch(toggleReducedMotion())}
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  کاهش انیمیشن‌ها
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  کاهش انیمیشن‌ها برای حساسیت حرکت
                </Typography>
              </Box>
            }
          />
        </Box>
      </Box>
    </Box>
  );
};

export default ThemePanel; 