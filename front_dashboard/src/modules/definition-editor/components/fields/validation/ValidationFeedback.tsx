import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Alert,
  Fade,
  Collapse,
  IconButton,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { ValidationResult, ValidationError, ValidationWarning } from './types';

interface ValidationFeedbackProps {
  validationResult?: ValidationResult;
  isValidating?: boolean;
  showWarnings?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number;
  compact?: boolean;
  position?: 'top' | 'bottom' | 'inline';
  className?: string;
}

export const ValidationFeedback: React.FC<ValidationFeedbackProps> = ({
  validationResult,
  isValidating = false,
  showWarnings = true,
  autoHide = false,
  autoHideDelay = 3000,
  compact = false,
  position = 'bottom',
  className
}) => {
  const [visible, setVisible] = useState(true);
  const [dismissedErrors, setDismissedErrors] = useState<Set<string>>(new Set());
  const [dismissedWarnings, setDismissedWarnings] = useState<Set<string>>(new Set());

  // Auto-hide functionality
  useEffect(() => {
    if (autoHide && validationResult && !isValidating) {
      const timer = setTimeout(() => {
        setVisible(false);
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [validationResult, isValidating, autoHide, autoHideDelay]);

  // Reset visibility when validation result changes
  useEffect(() => {
    setVisible(true);
    setDismissedErrors(new Set());
    setDismissedWarnings(new Set());
  }, [validationResult?.timestamp]);

  const handleDismissError = useCallback((errorId: string) => {
    setDismissedErrors(prev => new Set([...prev, errorId]));
  }, []);

  const handleDismissWarning = useCallback((warningId: string) => {
    setDismissedWarnings(prev => new Set([...prev, warningId]));
  }, []);

  if (!validationResult && !isValidating) {
    return null;
  }

  const visibleErrors = validationResult?.errors?.filter(
    error => !dismissedErrors.has(error.ruleId)
  ) || [];

  const visibleWarnings = validationResult?.warnings?.filter(
    warning => !dismissedWarnings.has(warning.ruleId)
  ) || [];

  const hasContent = isValidating || visibleErrors.length > 0 || (showWarnings && visibleWarnings.length > 0);

  if (!hasContent || !visible) {
    return null;
  }

  const renderValidatingState = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
      <LinearProgress 
        sx={{ 
          width: 20, 
          height: 3,
          borderRadius: 1.5,
          '& .MuiLinearProgress-bar': {
            borderRadius: 1.5
          }
        }} 
      />
      <Typography variant="caption" color="text.secondary">
        Validating...
      </Typography>
    </Box>
  );

  const renderSuccessState = () => (
    <Fade in timeout={300}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
        <CheckIcon sx={{ fontSize: 16, color: 'success.main' }} />
        <Typography variant="caption" color="success.main" sx={{ fontWeight: 500 }}>
          {compact ? 'Valid' : 'All validations passed'}
        </Typography>
      </Box>
    </Fade>
  );

  const renderError = (error: ValidationError, index: number) => (
    <Collapse key={`error-${error.ruleId}-${index}`} in timeout={300}>
      <Alert
        severity="error"
        variant={compact ? "standard" : "filled"}
        sx={{
          mb: 1,
          '& .MuiAlert-message': {
            fontSize: compact ? '0.75rem' : '0.875rem'
          },
          '& .MuiAlert-icon': {
            fontSize: compact ? 16 : 20
          }
        }}
        action={
          <IconButton
            size="small"
            onClick={() => handleDismissError(error.ruleId)}
            sx={{ color: 'inherit' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {error.message}
          </Typography>
          {!compact && error.code && (
            <Chip
              label={error.code}
              size="small"
              variant="outlined"
              sx={{
                mt: 0.5,
                height: 20,
                fontSize: '0.7rem',
                borderColor: 'currentColor',
                color: 'inherit'
              }}
            />
          )}
        </Box>
      </Alert>
    </Collapse>
  );

  const renderWarning = (warning: ValidationWarning, index: number) => (
    <Collapse key={`warning-${warning.ruleId}-${index}`} in timeout={300}>
      <Alert
        severity="warning"
        variant={compact ? "standard" : "filled"}
        sx={{
          mb: 1,
          '& .MuiAlert-message': {
            fontSize: compact ? '0.75rem' : '0.875rem'
          },
          '& .MuiAlert-icon': {
            fontSize: compact ? 16 : 20
          }
        }}
        action={
          <IconButton
            size="small"
            onClick={() => handleDismissWarning(warning.ruleId)}
            sx={{ color: 'inherit' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {warning.message}
          </Typography>
          {!compact && warning.code && (
            <Chip
              label={warning.code}
              size="small"
              variant="outlined"
              sx={{
                mt: 0.5,
                height: 20,
                fontSize: '0.7rem',
                borderColor: 'currentColor',
                color: 'inherit'
              }}
            />
          )}
        </Box>
      </Alert>
    </Collapse>
  );

  const getPositionStyles = () => {
    switch (position) {
      case 'top':
        return { mb: 2 };
      case 'bottom':
        return { mt: 1 };
      case 'inline':
      default:
        return {};
    }
  };

  return (
    <Fade in={visible} timeout={300}>
      <Box
        className={className}
        sx={{
          ...getPositionStyles(),
          minHeight: compact ? 'auto' : 40
        }}
      >
        {isValidating && renderValidatingState()}
        
        {!isValidating && validationResult?.isValid && visibleErrors.length === 0 && renderSuccessState()}
        
        {visibleErrors.map((error, index) => renderError(error, index))}
        
        {showWarnings && visibleWarnings.map((warning, index) => renderWarning(warning, index))}
      </Box>
    </Fade>
  );
};

export default ValidationFeedback;