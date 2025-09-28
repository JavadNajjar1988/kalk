import React, { Suspense, lazy, ComponentType } from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Skeleton,
  Card,
  CardContent,
  alpha,
  useTheme
} from '@mui/material';

// Enhanced loading component with multiple states
interface LazyLoadingProps {
  variant?: 'circular' | 'skeleton' | 'card' | 'minimal';
  message?: string;
  height?: number | string;
  width?: number | string;
}

const LazyLoading: React.FC<LazyLoadingProps> = ({
  variant = 'circular',
  message = 'در حال بارگذاری...',
  height = 200,
  width = '100%'
}) => {
  const theme = useTheme();
  
  const containerStyles = {
    width,
    height,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column' as const
  };
  
  switch (variant) {
    case 'circular':
      return (
        <Box sx={containerStyles}>
          <CircularProgress size={40} thickness={4} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {message}
          </Typography>
        </Box>
      );
      
    case 'skeleton':
      return (
        <Box sx={{ width, height, p: 2 }}>
          <Skeleton variant="text" width="60%" height={32} sx={{ mb: 2 }} />
          <Skeleton variant="text" width="80%" height={24} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="40%" height={24} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" width="100%" height={120} />
        </Box>
      );
      
    case 'card':
      return (
        <Card sx={{ width, height }}>
          <CardContent sx={{ ...containerStyles, p: 3 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: 2,
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2
              }}
            >
              <CircularProgress size={32} thickness={4} />
            </Box>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              {message}
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              لطفاً صبر کنید...
            </Typography>
          </CardContent>
        </Card>
      );
      
    case 'minimal':
      return (
        <Box sx={{ ...containerStyles, minHeight: 40 }}>
          <CircularProgress size={20} thickness={5} />
        </Box>
      );
      
    default:
      return (
        <Box sx={containerStyles}>
          <CircularProgress />
        </Box>
      );
  }
};

// HOC for lazy loading components with error boundary
interface LazyComponentOptions {
  loading?: LazyLoadingProps;
  fallback?: React.ComponentType<any>;
  retryMessage?: string;
}

function withLazyLoading<P extends object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  options: LazyComponentOptions = {}
) {
  const LazyComponent = lazy(importFunc);
  
  return React.forwardRef<any, P>((props, ref) => {
    const [hasError, setHasError] = React.useState(false);
    const [retryCount, setRetryCount] = React.useState(0);
    
    const handleRetry = () => {
      setHasError(false);
      setRetryCount(prev => prev + 1);
    };
    
    React.useEffect(() => {
      setHasError(false);
    }, [retryCount]);
    
    if (hasError) {
      if (options.fallback) {
        const FallbackComponent = options.fallback;
        return <FallbackComponent onRetry={handleRetry} {...props} />;
      }
      
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="error" gutterBottom>
            خطا در بارگذاری کامپوننت
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {options.retryMessage || 'مشکلی در بارگذاری این بخش وجود دارد.'}
          </Typography>
          <button
            onClick={handleRetry}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: '#1976d2',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            تلاش مجدد
          </button>
        </Box>
      );
    }
    
    return (
      <Suspense fallback={<LazyLoading {...options.loading} />}>
        <ErrorBoundary onError={() => setHasError(true)}>
          <LazyComponent ref={ref} {...props} />
        </ErrorBoundary>
      </Suspense>
    );
  });
}

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: () => void },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }
  
  componentDidCatch(error: any, errorInfo: any) {
    console.error('LazyComponent Error:', error, errorInfo);
    this.props.onError();
  }
  
  render() {
    if (this.state.hasError) {
      return null;
    }
    
    return this.props.children;
  }
}

// Performance monitoring hook
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = React.useState({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0
  });
  
  React.useEffect(() => {
    const startTime = performance.now();
    
    // Monitor load time
    const handleLoad = () => {
      const loadTime = performance.now() - startTime;
      setMetrics(prev => ({ ...prev, loadTime }));
    };
    
    // Monitor memory usage (if available)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      setMetrics(prev => ({
        ...prev,
        memoryUsage: memory.usedJSHeapSize / 1024 / 1024 // MB
      }));
    }
    
    window.addEventListener('load', handleLoad);
    return () => window.removeEventListener('load', handleLoad);
  }, []);
  
  const measureRenderTime = React.useCallback((callback: () => void) => {
    const startTime = performance.now();
    callback();
    const renderTime = performance.now() - startTime;
    setMetrics(prev => ({ ...prev, renderTime }));
  }, []);
  
  return { metrics, measureRenderTime };
};

// Intersection observer hook for lazy loading
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = React.useState(false);
  const [entry, setEntry] = React.useState<IntersectionObserverEntry | null>(null);
  const elementRef = React.useRef<HTMLElement>(null);
  
  React.useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        setEntry(entry);
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    );
    
    observer.observe(element);
    
    return () => {
      observer.unobserve(element);
    };
  }, [options]);
  
  return { elementRef, isIntersecting, entry };
};

export default LazyLoading;
export { withLazyLoading };