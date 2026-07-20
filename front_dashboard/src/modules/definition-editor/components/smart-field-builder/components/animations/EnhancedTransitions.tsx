/**
 * Enhanced Transition Components for Smart Field Builder
 * Provides smooth, accessible state transitions
 */

import React, { ReactNode, useRef, useEffect, useState } from 'react';
import { Box, useTheme, alpha } from '@mui/material';
import { CSSTransition, TransitionGroup, SwitchTransition } from 'react-transition-group';
import { useStateTransition, useAnimatedValue, useAnimationConfig } from '../../hooks/useEnhancedAnimations';

interface EnhancedTransitionProps {
  children: ReactNode;
  transitionKey: string | number;
  mode?: 'slide' | 'fade' | 'scale' | 'flip' | 'push';
  direction?: 'forward' | 'backward' | 'up' | 'down' | 'left' | 'right';
  duration?: 'fast' | 'normal' | 'slow';
  disabled?: boolean;
  onEnter?: () => void;
  onExit?: () => void;
}

export const EnhancedTransition: React.FC<EnhancedTransitionProps> = ({
  children,
  transitionKey,
  mode = 'slide',
  direction = 'forward',
  duration = 'normal',
  disabled = false,
  onEnter,
  onExit
}) => {
  const theme = useTheme();
  const animConfig = useAnimationConfig();
  const nodeRef = useRef<HTMLDivElement>(null);
  
  // Respect motion preferences
  const effectiveDuration = !animConfig.respectsMotion || disabled ? 0 : animConfig[duration].duration;

  const getTransitionStyles = () => {
    const baseStyles = {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      height: '100%',
    };

    switch (mode) {
      case 'slide':
        return {
          '&.transition-enter': {
            ...baseStyles,
            transform: getSlideTransform(direction, true),
            opacity: 0,
            zIndex: 2,
          },
          '&.transition-enter-active': {
            transform: 'translateX(0) translateY(0)',
            opacity: 1,
            transition: `all ${effectiveDuration}ms ${animConfig[duration].easing}`,
            zIndex: 2,
          },
          '&.transition-exit': {
            ...baseStyles,
            transform: 'translateX(0) translateY(0)',
            opacity: 1,
            zIndex: 1,
          },
          '&.transition-exit-active': {
            transform: getSlideTransform(direction, false),
            opacity: 0,
            transition: `all ${effectiveDuration}ms ${animConfig[duration].easing}`,
            zIndex: 1,
          }
        };

      case 'fade':
        return {
          '&.transition-enter': {
            ...baseStyles,
            opacity: 0,
            transform: 'scale(0.95)',
            zIndex: 2,
          },
          '&.transition-enter-active': {
            opacity: 1,
            transform: 'scale(1)',
            transition: `all ${effectiveDuration}ms ${animConfig[duration].easing}`,
            zIndex: 2,
          },
          '&.transition-exit': {
            ...baseStyles,
            opacity: 1,
            transform: 'scale(1)',
            zIndex: 1,
          },
          '&.transition-exit-active': {
            opacity: 0,
            transform: 'scale(1.05)',
            transition: `all ${effectiveDuration}ms ${animConfig[duration].easing}`,
            zIndex: 1,
          }
        };

      case 'scale':
        return {
          '&.transition-enter': {
            ...baseStyles,
            transform: 'scale(0.8)',
            opacity: 0,
            zIndex: 2,
          },
          '&.transition-enter-active': {
            transform: 'scale(1)',
            opacity: 1,
            transition: `all ${effectiveDuration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`,
            zIndex: 2,
          },
          '&.transition-exit': {
            ...baseStyles,
            transform: 'scale(1)',
            opacity: 1,
            zIndex: 1,
          },
          '&.transition-exit-active': {
            transform: 'scale(0.9)',
            opacity: 0,
            transition: `all ${effectiveDuration}ms ${animConfig[duration].easing}`,
            zIndex: 1,
          }
        };

      case 'flip':
        return {
          '&.transition-enter': {
            ...baseStyles,
            transform: 'rotateY(90deg)',
            opacity: 0,
            zIndex: 2,
          },
          '&.transition-enter-active': {
            transform: 'rotateY(0deg)',
            opacity: 1,
            transition: `all ${effectiveDuration}ms ${animConfig[duration].easing}`,
            zIndex: 2,
          },
          '&.transition-exit': {
            ...baseStyles,
            transform: 'rotateY(0deg)',
            opacity: 1,
            zIndex: 1,
          },
          '&.transition-exit-active': {
            transform: 'rotateY(-90deg)',
            opacity: 0,
            transition: `all ${effectiveDuration}ms ${animConfig[duration].easing}`,
            zIndex: 1,
          }
        };

      default:
        return {};
    }
  };

  const getSlideTransform = (dir: string, entering: boolean) => {
    const factor = entering ? 1 : -1;
    switch (dir) {
      case 'forward':
        return `translateX(${100 * factor}%)`;
      case 'backward':
        return `translateX(${-100 * factor}%)`;
      case 'up':
        return `translateY(${-100 * factor}%)`;
      case 'down':
        return `translateY(${100 * factor}%)`;
      case 'left':
        return `translateX(${-100 * factor}%)`;
      case 'right':
        return `translateX(${100 * factor}%)`;
      default:
        return `translateX(${100 * factor}%)`;
    }
  };

  if (disabled || !animConfig.respectsMotion) {
    return <Box sx={{ width: '100%', height: '100%' }}>{children}</Box>;
  }

  return (
    <Box 
      sx={{ 
        width: '100%', 
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        perspective: mode === 'flip' ? '1000px' : 'none',
        ...getTransitionStyles()
      }}
    >
      <SwitchTransition mode="out-in">
        <CSSTransition
          key={transitionKey}
          nodeRef={nodeRef}
          timeout={effectiveDuration}
          classNames="transition"
          onEnter={onEnter}
          onExit={onExit}
          unmountOnExit
        >
          <Box
            ref={nodeRef}
            sx={{
              width: '100%',
              height: '100%',
              backgroundColor: theme.palette.background.paper,
              borderRadius: 1,
            }}
          >
            {children}
          </Box>
        </CSSTransition>
      </SwitchTransition>
    </Box>
  );
};

// Animated progress component
interface AnimatedProgressProps {
  progress: number;
  showValue?: boolean;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  variant?: 'linear' | 'circular';
  size?: number;
}

export const AnimatedProgress: React.FC<AnimatedProgressProps> = ({
  progress,
  showValue = false,
  color = 'primary',
  variant = 'linear',
  size = 40
}) => {
  const theme = useTheme();
  const animatedProgress = useAnimatedValue(progress, { duration: 800, easing: 'ease-out' });

  if (variant === 'circular') {
    const radius = (size - 4) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (animatedProgress / 100) * circumference;

    return (
      <Box
        sx={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <svg width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={alpha(theme.palette[color].main, 0.2)}
            strokeWidth={3}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={theme.palette[color].main}
            strokeWidth={3}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{
              transition: 'stroke-dashoffset 0.8s ease-out'
            }}
          />
        </svg>
        {showValue && (
          <Box
            sx={{
              position: 'absolute',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: theme.palette[color].main
            }}
          >
            {Math.round(animatedProgress)}%
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box
        sx={{
          width: '100%',
          height: 6,
          borderRadius: 3,
          backgroundColor: alpha(theme.palette[color].main, 0.2),
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <Box
          sx={{
            height: '100%',
            width: `${animatedProgress}%`,
            backgroundColor: theme.palette[color].main,
            borderRadius: 3,
            transition: 'width 0.8s ease-out',
            background: `linear-gradient(90deg, 
              ${theme.palette[color].main} 0%, 
              ${theme.palette[color].light} 100%
            )`,
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
              transform: 'translateX(-100%)',
              animation: animatedProgress > 0 ? 'shimmer 2s infinite' : 'none',
            }
          }}
        />
      </Box>
      {showValue && (
        <Box
          sx={{
            mt: 0.5,
            textAlign: 'right',
            fontSize: '0.75rem',
            color: theme.palette.text.secondary
          }}
        >
          {Math.round(animatedProgress)}%
        </Box>
      )}
      <style>
        {`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}
      </style>
    </Box>
  );
};

// Micro-interaction component for buttons
interface AnimatedButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'contained' | 'outlined' | 'text';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  disabled?: boolean;
  loading?: boolean;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  onClick,
  variant = 'contained',
  color = 'primary',
  disabled = false,
  loading = false
}) => {
  const theme = useTheme();
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  
  const handleMouseDown = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    
    setIsPressed(true);
    
    const rect = event.currentTarget.getBoundingClientRect();
    const newRipple = {
      id: Date.now(),
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
    
    setRipples(prev => [...prev, newRipple]);
    
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);
  };

  const handleMouseUp = () => {
    setIsPressed(false);
  };

  return (
    <Box
      component="button"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={onClick}
      disabled={disabled || loading}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        border: variant === 'outlined' ? `1px solid ${theme.palette[color].main}` : 'none',
        backgroundColor: variant === 'contained' ? theme.palette[color].main : 'transparent',
        color: variant === 'contained' ? theme.palette[color].contrastText : theme.palette[color].main,
        padding: '8px 16px',
        borderRadius: 1,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        transform: isPressed ? 'scale(0.98)' : 'scale(1)',
        opacity: disabled ? 0.6 : 1,
        
        '&:hover:not(:disabled)': {
          backgroundColor: variant === 'contained' 
            ? theme.palette[color].dark 
            : alpha(theme.palette[color].main, 0.08),
          transform: 'translateY(-1px)',
          boxShadow: theme.shadows[4]
        }
      }}
    >
      {children}
      
      {/* Ripple effects */}
      {ripples.map(ripple => (
        <Box
          key={ripple.id}
          sx={{
            position: 'absolute',
            left: ripple.x,
            top: ripple.y,
            width: 0,
            height: 0,
            borderRadius: '50%',
            backgroundColor: alpha(theme.palette.common.white, 0.6),
            transform: 'translate(-50%, -50%)',
            animation: 'ripple 0.6s ease-out',
            pointerEvents: 'none'
          }}
        />
      ))}
      
      <style>
        {`
          @keyframes ripple {
            to {
              width: 200px;
              height: 200px;
              opacity: 0;
            }
          }
        `}
      </style>
    </Box>
  );
};