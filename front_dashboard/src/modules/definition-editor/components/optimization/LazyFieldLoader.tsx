// Lazy Field Loader for Performance Optimization
// بارگذار تنبل فیلد برای بهینه‌سازی عملکرد

import React, { Suspense, lazy, useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  CircularProgress,
  Alert,
  Skeleton,
  Typography,
  Button,
  alpha,
  useTheme
} from '@mui/material';
import { Visibility as VisibilityIcon, Error as ErrorIcon } from '@mui/icons-material';

import type { FieldConstructorConfig } from '../../types/fieldConstructor';
import type { CustomField } from '../../types/equipment';

// Lazy-loaded field components
const LazyArrayInputComponent = lazy(() => import('../input/ArrayInputComponent'));
const LazyCompositeInputComponent = lazy(() => import('../input/CompositeInputComponent'));
const LazyHierarchicalInputComponent = lazy(() => import('../input/HierarchicalInputComponent'));

interface LazyFieldLoaderProps {
  field: FieldConstructorConfig | CustomField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
  loadingThreshold?: number; // Delay before showing loading state (ms)
  visibility?: boolean; // Whether field is visible in viewport
  priority?: 'high' | 'medium' | 'low';
}

interface LoadingSkeletonProps {
  field: FieldConstructorConfig | CustomField;
}

// Optimized loading skeleton
const LoadingSkeleton: React.FC<LoadingSkeletonProps> = React.memo(({ field }) => {
  const getSkeletonHeight = () => {
    const fieldType = (field as any).type;
    
    switch (fieldType) {
      case 'address-array':
      case 'hierarchical-address':
      case 'phone-array':
        return 200;
      case 'name-split':
      case 'full-name-dual':
        return 120;
      default:
        return 80;
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Skeleton variant="text" width="30%" height={24} sx={{ mb: 1 }} />
      <Skeleton 
        variant="rectangular" 
        width="100%" 
        height={getSkeletonHeight()} 
        sx={{ borderRadius: 1 }} 
      />
    </Box>
  );
});

LoadingSkeleton.displayName = 'LoadingSkeleton';

// Error boundary for field loading
class FieldErrorBoundary extends React.Component<
  { children: React.ReactNode; fieldName: string; onRetry: () => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Field loading error for ${this.props.fieldName}:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert 
          severity="error" 
          sx={{ m: 2 }}
          action={
            <Button 
              size="small" 
              onClick={() => {
                this.setState({ hasError: false, error: null });
                this.props.onRetry();
              }}
            >
              Retry
            </Button>
          }
        >
          <Typography variant="body2" fontWeight="bold">
            Failed to load field: {this.props.fieldName}
          </Typography>
          <Typography variant="caption" display="block">
            {this.state.error?.message}
          </Typography>
        </Alert>
      );
    }

    return this.props.children;
  }
}

const LazyFieldLoader: React.FC<LazyFieldLoaderProps> = ({
  field,
  value,
  onChange,
  error,
  disabled = false,
  loadingThreshold = 300,
  visibility = true,
  priority = 'medium'
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const loadTimeoutRef = useRef<NodeJS.Timeout>();
  const theme = useTheme();

  const fieldType = (field as any).type;
  const isHeavyField = ['address-array', 'hierarchical-address', 'phone-array', 'name-split', 'full-name-dual'].includes(fieldType);

  // Determine loading strategy based on field type and priority
  const shouldLazyLoad = isHeavyField || priority === 'low';

  // Handle visibility-based loading
  useEffect(() => {
    if (!shouldLazyLoad) {
      setShouldLoad(true);
      return;
    }

    if (visibility && !shouldLoad) {
      // Add loading delay based on priority
      const delay = priority === 'high' ? 0 : priority === 'medium' ? 100 : 300;
      
      loadTimeoutRef.current = setTimeout(() => {
        setIsLoading(true);
        setShouldLoad(true);
      }, delay);
    }

    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [visibility, shouldLoad, shouldLazyLoad, priority]);

  // Loading timeout management
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        setIsLoading(false);
      }, loadingThreshold);

      return () => clearTimeout(timeout);
    }
  }, [isLoading, loadingThreshold]);

  const handleRetry = useCallback(() => {
    setRetryKey(prev => prev + 1);
    setShouldLoad(false);
    setTimeout(() => setShouldLoad(true), 100);
  }, []);

  // Render appropriate component based on field type
  const renderFieldComponent = useCallback(() => {
    const commonProps = {
      key: `${field.id}-${retryKey}`,
      config: field as FieldConstructorConfig,
      value,
      onChange,
      error,
      disabled
    };

    switch (fieldType) {
      case 'address-array':
      case 'phone-array':
        return <LazyArrayInputComponent {...commonProps} />;
      
      case 'name-split':
      case 'full-name-dual':
        return <LazyCompositeInputComponent {...commonProps} />;
      
      case 'hierarchical-address':
        return <LazyHierarchicalInputComponent {...commonProps} />;
      
      default:
        // For non-heavy fields, render directly without lazy loading
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Field type "{fieldType}" does not require lazy loading
            </Typography>
          </Box>
        );
    }
  }, [field, value, onChange, error, disabled, fieldType, retryKey]);

  // Show placeholder when not visible or not loaded
  if (!visibility && shouldLazyLoad) {
    return (
      <Box
        sx={{
          minHeight: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: alpha(theme.palette.grey[100], 0.5),
          border: `1px dashed ${theme.palette.grey[300]}`,
          borderRadius: 1,
          m: 1
        }}
      >
        <VisibilityIcon sx={{ color: 'text.secondary', mr: 1 }} />
        <Typography variant="body2" color="text.secondary">
          Field will load when visible
        </Typography>
      </Box>
    );
  }

  // Show loading skeleton
  if (isLoading || !shouldLoad) {
    return <LoadingSkeleton field={field} />;
  }

  // Render the actual field component
  return (
    <FieldErrorBoundary fieldName={field.name} onRetry={handleRetry}>
      <Suspense fallback={<LoadingSkeleton field={field} />}>
        {renderFieldComponent()}
      </Suspense>
    </FieldErrorBoundary>
  );
};

export default React.memo(LazyFieldLoader);