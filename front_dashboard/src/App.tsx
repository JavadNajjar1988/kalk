import React, { Suspense, lazy, useState, useEffect } from 'react';
import { Routes, Route, Navigate, useRoutes } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material';
import { useAppSelector, useAppDispatch } from './store';
import { selectTheme, setLanguage } from './store/slices/uiSlice';
import { selectIsAuthenticated, rehydrateUser } from './store/slices/authSlice';
import { createAppTheme } from './theme';
import { ErrorFallback } from './components/common/ErrorFallback';
import { ErrorBoundary } from 'react-error-boundary';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import TransformFarsiNumbers from './components/common/TransformFarsiNumbers';
import NewSplashScreen from './components/common/NewSplashScreen';
import KalknegarRedirect from './components/common/KalknegarRedirect';
import authRoutes from './modules/auth/routes';
import DashboardRoutes from './modules/dashboard/routes';
import { ScenarioDialogProvider } from './components/common/ScenarioDialogContext';
import { initializeViewportHeight } from './utils/browserCompatibility';
import './transparent-number.css';

// کامپوننت لودینگ
const LoadingFallback = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      flexDirection: 'column',
      gap: 2,
    }}
  >
    <CircularProgress size={40} />
    <Box sx={{ textAlign: 'center' }}>
      در حال بارگذاری...
    </Box>
  </Box>
);

// تابع کمکی برای اعمال مستقیم تغییرات زبان به DOM
const applyLanguageToDOM = (language: string, direction: string) => {
  document.documentElement.dir = direction;
  document.documentElement.lang = language;
  
  if (direction === 'rtl') {
    document.documentElement.classList.add('rtl');
    document.documentElement.classList.remove('ltr');
  } else {
    document.documentElement.classList.add('ltr');
    document.documentElement.classList.remove('rtl');
  }
  
  console.log('Applied language changes directly to DOM in App.tsx:', language, direction);
};

const AppRoutes: React.FC = () => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const routes = useRoutes([
    {
      path: '/',
      element: <Navigate to={isAuthenticated ? '/dashboard' : '/auth/login'} replace />,
    },
    ...authRoutes,
    {
      path: '/dashboard/*',
      element: <ProtectedRoute><DashboardRoutes /></ProtectedRoute>,
    },
    {
      path: '/kalknegar/*',
      element: (
        <ProtectedRoute>
          <KalknegarRedirect />
        </ProtectedRoute>
      ),
    },
    {
      path: '*',
      element: (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            flexDirection: 'column',
            textAlign: 'center',
          }}
        >
          <h1>۴۰۴</h1>
          <p>صفحه مورد نظر یافت نشد</p>
        </Box>
      ),
    },
  ]);

  return routes;
};


// کامپوننت اصلی اپلیکیشن
const App: React.FC = () => {
  const themeState = useAppSelector(selectTheme);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const { language, direction } = useAppSelector(state => state.ui);
  const dispatch = useAppDispatch();
  const muiTheme = createAppTheme(themeState.mode, themeState.backgroundTheme, themeState.primaryColor, themeState.fontSize, themeState.highContrast);
  const [showSplash, setShowSplash] = React.useState(true);

  // Initialize browser compatibility fixes
  useEffect(() => {
    initializeViewportHeight();
  }, []);

  // Re-hydrate user from localStorage on app start
  useEffect(() => {
    dispatch(rehydrateUser());
  }, [dispatch]);

  // اضافه کردن useEffect برای مشاهده تغییرات زبان و تم
  useEffect(() => {
    console.log('App component - Language:', language, 'Direction:', direction);
    console.log('App component - Theme:', themeState);
    
    // اعمال مستقیم تغییرات زبان به DOM
    applyLanguageToDOM(language, direction);
  }, [language, direction, themeState]);
  
  // اضافه کردن کلیدهای میانبر برای تغییر زبان (فقط در محیط توسعه)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Alt+Shift+F برای فارسی
        if (e.altKey && e.shiftKey && e.key === 'F') {
          dispatch(setLanguage('fa'));
        }
        // Alt+Shift+E برای انگلیسی
        else if (e.altKey && e.shiftKey && e.key === 'E') {
          dispatch(setLanguage('en'));
        }
        // Alt+Shift+A برای عربی
        else if (e.altKey && e.shiftKey && e.key === 'A') {
          dispatch(setLanguage('ar'));
        }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [dispatch]);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <ScenarioDialogProvider>
        <TransformFarsiNumbers>
          {showSplash && (
            <NewSplashScreen 
              onComplete={handleSplashComplete}
              duration={3000}
            />
          )}
          <ErrorBoundary
            FallbackComponent={ErrorFallback}
            onReset={() => window.location.reload()}
          >
            <Suspense fallback={<LoadingFallback />}>
              <AppRoutes />
            </Suspense>
          </ErrorBoundary>
        </TransformFarsiNumbers>
      </ScenarioDialogProvider>
    </ThemeProvider>
  );
};

export default App; 
