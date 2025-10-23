import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Alert,
  Fade,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person,
  Lock,
  Login as LoginIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '@/store';
import { 
  loginUser, 
  selectAuthLoading, 
  selectAuthError,
  clearError,
  selectIsAuthenticated
} from '@/store/slices/authSlice';
import { useNavigate, useLocation } from 'react-router-dom';

interface LoginFormData {
  username: string;
  password: string;
  rememberMe: boolean;
}

interface MousePosition {
  x: number;
  y: number;
}

const LoginPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
    rememberMe: false,
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [mousePosition, setMousePosition] = useState<MousePosition>({ x: 0.5, y: 0.5 });
  const [validationErrors, setValidationErrors] = useState<Partial<LoginFormData>>({});

  // مدیریت حرکت ماوس برای پس‌زمینه پارالکس
  const handleMouseMove = useCallback((e: MouseEvent) => {
    setMousePosition({
      x: e.clientX / window.innerWidth,
      y: e.clientY / window.innerHeight,
    });
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleMouseMove]);

  // پاک کردن خطا هنگام تغییر فیلدها
  useEffect(() => {
    if (error) {
      dispatch(clearError());
    }
  }, [formData.username, formData.password, dispatch, error]);

  // Redirect اگر کاربر قبلاً احراز هویت شده
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  // اعتبارسنجی فرم
  const validateForm = (): boolean => {
    const errors: Partial<LoginFormData> = {};

    if (!formData.username.trim()) {
      errors.username = 'نام کاربری الزامی است';
    } else if (formData.username.length < 3) {
      errors.username = 'نام کاربری باید حداقل ۳ کاراکتر باشد';
    }

    if (!formData.password) {
      errors.password = 'رمز عبور الزامی است';
    } else if (formData.password.length < 6) {
      errors.password = 'رمز عبور باید حداقل ۶ کاراکتر باشد';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // مدیریت ارسال فرم
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const result = await dispatch(loginUser({
        username: formData.username,
        password: formData.password,
      })).unwrap();
      // در صورت موفقیت، useEffect redirect را انجام می‌دهد
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  // مدیریت تغییر فیلدها
  const handleFieldChange = (field: keyof LoginFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.type === 'checkbox' 
      ? event.target.checked 
      : event.target.value;
      
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // پاک کردن خطای validation برای فیلد جاری
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(prev => !prev);
  };

  const backgroundTransform = `translate(${mousePosition.x * -20}px, ${mousePosition.y * -20}px) scale(0.9)`;

  // Soft surface like FieldEditDialog
  const getSoftSurface = () => {
    const primary = (theme.palette.primary.main || '#4a90e2').toLowerCase();
    const hex = primary.replace('#', '');
    if (hex.includes('10b981') || hex.includes('4caf50') || hex.includes('2e7d32')) return '#f0f4f3';
    if (hex.includes('4a90e2') || hex.includes('1976d2') || hex.includes('2196f3')) return '#f0f4f8';
    if (hex.includes('ef4444') || hex.includes('f44336') || hex.includes('d32f2f')) return '#fbf1f0';
    if (hex.includes('6b21a8') || hex.includes('9c27b0') || hex.includes('673ab7')) return '#22262d';
    if (hex.includes('f59e0b') || hex.includes('ff9800') || hex.includes('fb8c00')) return '#fbf1f1';
    const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
    const hexToRgb = (h: string) => {
      const n = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
      const r = parseInt(n.substring(0, 2), 16);
      const g = parseInt(n.substring(2, 4), 16);
      const b = parseInt(n.substring(4, 6), 16);
      return { r, g, b };
    };
    const rgbToHex = (r: number, g: number, b: number) => `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`;
    const blendWithWhite = (h: string, primaryWeight = 0.10) => {
      const { r, g, b } = hexToRgb(h);
      const wr = 255, wg = 255, wb = 255;
      const w = 1 - primaryWeight;
      const br = wr * w + r * primaryWeight;
      const bg = wg * w + g * primaryWeight;
      const bb = wb * w + b * primaryWeight;
      return rgbToHex(br, bg, bb);
    };
    if (/^[0-9a-f]{3,6}$/.test(hex)) return blendWithWhite(hex, 0.10);
    try {
      const fallback = (theme.palette.primary.light || '#90caf9').toLowerCase().replace('#', '');
      return blendWithWhite(fallback, 0.08);
    } catch {
      return '#f5f7fa';
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      }}
    >
      {/* پس‌زمینه پارالکس */}
        <Box 
          aria-hidden
          sx={{ 
            position: 'absolute',
            inset: '-160px',
            backgroundImage: 'url("/videos/login.gif")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            transform: backgroundTransform,
            transition: 'transform 0.18s ease-out',
            filter: 'blur(18px)',
            pointerEvents: 'none',
            zIndex: 0,
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background: (theme) =>
                `linear-gradient(140deg, ${alpha(theme.palette.background.default, 0.55)}, ${alpha(
                  theme.palette.background.paper,
                  0.35
                )})`,
            }
          }}
        />

        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 0.5,
            background: (theme) =>
              `linear-gradient(145deg, ${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.36 : 0.28)}, ${alpha(
                theme.palette.secondary.main || theme.palette.primary.light,
                theme.palette.mode === 'dark' ? 0.2 : 0.18
              )})`,
            opacity: 0.55,
            transition: 'opacity 0.3s ease, background 0.3s ease',
            mixBlendMode: 'overlay',
          }}
        />

      {/* شبکه پس‌زمینه */}
      <Box 
        sx={{ 
          position: 'absolute', 
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '30px 30px',
          opacity: 0.4,
          zIndex: 1,
        }}
      />

      {/* فرم ورود */}
      <Paper 
        elevation={0}
        sx={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '520px',
          p: 0,
          mx: 2,
          borderRadius: '20px',
          backgroundColor: (theme) => alpha(theme.palette.primary.light, 0.10),
          backdropFilter: 'blur(20px)',
          border: (theme) => `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
          boxShadow: (theme) => `0 20px 60px ${alpha(theme.palette.primary.light, 0.25)}, inset 0 1px 0 rgba(255, 255, 255, 0.75)`,
          overflow: 'hidden',
        }}
      >
        {/* هدر */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          py: 3,
          px: 3,
          backgroundColor: getSoftSurface(),
          borderBottom: (theme) => `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
        }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              backgroundColor: (theme) => theme.palette.primary.main,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
              boxShadow: (theme) => `0 8px 24px ${alpha(theme.palette.primary.main, 0.25)}`,
              border: '2px solid rgba(255,255,255,0.3)'
            }}
          >
            <LoginIcon sx={{ fontSize: 40, color: 'white' }} />
          </Box>
          
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700, 
              textAlign: 'center', 
              color: 'primary.main',
              mb: 1,
            }}
          >
            ورود به ساجد
          </Typography>
          
          <Typography 
            variant="body1" 
            sx={{ 
              textAlign: 'center', 
              color: 'text.secondary',
            }}
          >
            سیستم مدیریت عملیات نظامی
          </Typography>
        </Box>
        
        {/* نمایش خطا */}
        {error && (
          <Fade in={!!error}>
            <Alert 
              severity="error" 
              sx={{ m: 3, borderRadius: 2, backgroundColor: alpha(theme.palette.error.light, 0.15) }}
              onClose={() => dispatch(clearError())}
            >
              {error}
            </Alert>
          </Fade>
        )}
        
        {/* فرم - بدون افکت شیشه‌ای */}
        <Box 
          component="form" 
          onSubmit={handleSubmit} 
          sx={{ 
            p: { xs: 2, sm: 3 }, 
            pt: 2,
            backgroundColor: (theme) => theme.palette.background.paper,
            borderRadius: 0,
            boxShadow: (theme) => theme.shadows[1],
            border: (theme) => `1px solid ${alpha(theme.palette.primary.light, 0.15)}`,
            backdropFilter: 'none',
          }}
        >
          {/* نام کاربری */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
              نام کاربری
            </Typography>
            <TextField
              fullWidth
              type="text"
              value={formData.username}
              onChange={handleFieldChange('username')}
              placeholder="نام کاربری خود را وارد کنید"
              variant="outlined"
              error={!!validationErrors.username}
              helperText={validationErrors.username}
              disabled={isLoading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#fff',
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: formData.username && !validationErrors.username && (
                  <InputAdornment position="end">
                    <Box sx={{ color: 'success.main', fontSize: '1.2rem' }}>✓</Box>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          
          {/* رمز عبور */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
              رمز عبور
            </Typography>
            <TextField
              fullWidth
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleFieldChange('password')}
              placeholder="رمز عبور خود را وارد کنید"
              variant="outlined"
              error={!!validationErrors.password}
              helperText={validationErrors.password}
              disabled={isLoading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#fff',
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={toggleShowPassword}
                      edge="end"
                      disabled={isLoading}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Box>
          
          {/* یادآوری */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 4 
          }}>
            <FormControlLabel
              control={
                <Checkbox 
                  checked={formData.rememberMe}
                  onChange={handleFieldChange('rememberMe')}
                  size="small"
                  color="primary"
                  disabled={isLoading}
                />
              }
              label={
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  مرا به خاطر بسپار
                </Typography>
              }
            />
          </Box>
          
          {/* دکمه ورود */}
          <Button 
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            disabled={isLoading || !formData.username || !formData.password}
            sx={{ 
              py: 1.6, 
              mb: 2.5, 
              fontWeight: 600,
              fontSize: '1.1rem',
              borderRadius: '12px',
              border: '2px solid rgba(255,255,255,0.3)',
              boxShadow: (theme) => `0 4px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: (theme) => `0 8px 24px ${alpha(theme.palette.primary.main, 0.4)}`,
              }
            }}
          >
            {isLoading ? 'در حال ورود...' : 'ورود به سیستم'}
          </Button>
        </Box>
        
        {/* اطلاعات تماس */}
        <Box sx={{ 
          textAlign: 'center', 
          p: 2.5,
          borderTop: (theme) => `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
          backgroundColor: getSoftSurface(),
        }}>
          <Typography variant="caption" color="text.secondary">
            در صورت مشکل با واحد پشتیبانی تماس بگیرید
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginPage; 
