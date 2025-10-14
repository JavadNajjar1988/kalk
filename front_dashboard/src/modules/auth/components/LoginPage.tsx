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

  const backgroundTransform = `translate(${mousePosition.x * -20}px, ${mousePosition.y * -20}px)`;

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
        sx={{ 
          position: 'absolute',
          top: '-20px',
          left: '-20px',
          right: '-20px',
          bottom: '-20px',
          backgroundImage: 'url("/images/military-bg.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transform: backgroundTransform,
          transition: 'transform 0.1s ease-out',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(28, 104, 78, 0.7), rgba(45, 134, 89, 0.5))',
            backdropFilter: 'blur(3px)',
          }
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
        elevation={24}
        sx={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '480px',
          p: { xs: 3, sm: 4 },
          mx: 2,
          borderRadius: 3,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        {/* هدر */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          mb: 4 
        }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, primary.main, primary.light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
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
              sx={{ mb: 3, borderRadius: 2 }}
              onClose={() => dispatch(clearError())}
            >
              {error}
            </Alert>
          </Fade>
        )}
        
        {/* فرم */}
        <form onSubmit={handleSubmit}>
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
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
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
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
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
              py: 1.8, 
              mb: 3, 
              fontWeight: 600,
              fontSize: '1.1rem',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {isLoading ? 'در حال ورود...' : 'ورود به سیستم'}
          </Button>
        </form>
        
        {/* اطلاعات تماس */}
        <Box sx={{ 
          textAlign: 'center', 
          pt: 2, 
          borderTop: '1px solid',
          borderColor: 'divider',
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
