/**
 * Animation System for Smart Field Builder
 * Provides smooth transitions and micro-interactions
 */

import React from 'react';
import { keyframes, css, Keyframes } from '@mui/system';
import { alpha, useTheme } from '@mui/material';

// Animation keyframes
export const animations = {
  // Slide animations
  slideInRight: keyframes`
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  `,
  
  slideInLeft: keyframes`
    from {
      transform: translateX(-100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  `,
  
  slideOutRight: keyframes`
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  `,
  
  slideOutLeft: keyframes`
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(-100%);
      opacity: 0;
    }
  `,
  
  // Fade animations
  fadeIn: keyframes`
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  `,
  
  fadeOut: keyframes`
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(-20px);
    }
  `,
  
  // Scale animations
  scaleIn: keyframes`
    from {
      transform: scale(0.8);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  `,
  
  // Progress animations
  progressFill: keyframes`
    from {
      width: 0%;
    }
    to {
      width: var(--progress-width);
    }
  `,
  
  // Pulse animation for loading states
  pulse: keyframes`
    0%, 100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.05);
      opacity: 0.8;
    }
  `,
  
  // Bounce animation for success states
  bounce: keyframes`
    0%, 20%, 53%, 80%, 100% {
      transform: translate3d(0, 0, 0);
    }
    40%, 43% {
      transform: translate3d(0, -8px, 0);
    }
    70% {
      transform: translate3d(0, -4px, 0);
    }
    90% {
      transform: translate3d(0, -2px, 0);
    }
  `,
  
  // Shake animation for errors
  shake: keyframes`
    0%, 100% {
      transform: translateX(0);
    }
    10%, 30%, 50%, 70%, 90% {
      transform: translateX(-4px);
    }
    20%, 40%, 60%, 80% {
      transform: translateX(4px);
    }
  `,
  
  // Glow animation for highlights
  glow: keyframes`
    0%, 100% {
      box-shadow: 0 0 5px currentColor;
    }
    50% {
      box-shadow: 0 0 20px currentColor, 0 0 30px currentColor;
    }
  `
};

// Animation duration constants
export const durations = {
  fast: '200ms',
  normal: '300ms',
  slow: '500ms',
  verySlow: '800ms'
};

// Easing functions
export const easings = {
  easeOut: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  easeIn: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
  easeInOut: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
  bounceOut: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  backOut: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
};

// Animation presets
export const getAnimationStyles = (animationType: string, duration = durations.normal, easing = easings.easeOut) => {
  const theme = useTheme();
  
  const baseStyles = {
    animationDuration: duration,
    animationTimingFunction: easing,
    animationFillMode: 'both' as const
  };
  
  switch (animationType) {
    case 'slideInRight':
      return {
        ...baseStyles,
        animation: `${animations.slideInRight} ${duration} ${easing}`
      };
      
    case 'slideInLeft':
      return {
        ...baseStyles,
        animation: `${animations.slideInLeft} ${duration} ${easing}`
      };
      
    case 'slideOutRight':
      return {
        ...baseStyles,
        animation: `${animations.slideOutRight} ${duration} ${easing}`
      };
      
    case 'slideOutLeft':
      return {
        ...baseStyles,
        animation: `${animations.slideOutLeft} ${duration} ${easing}`
      };
      
    case 'fadeIn':
      return {
        ...baseStyles,
        animation: `${animations.fadeIn} ${duration} ${easing}`
      };
      
    case 'fadeOut':
      return {
        ...baseStyles,
        animation: `${animations.fadeOut} ${duration} ${easing}`
      };
      
    case 'scaleIn':
      return {
        ...baseStyles,
        animation: `${animations.scaleIn} ${duration} ${easings.backOut}`
      };
      
    case 'pulse':
      return {
        animation: `${animations.pulse} 2s ${easings.easeInOut} infinite`
      };
      
    case 'bounce':
      return {
        animation: `${animations.bounce} 1s ${easings.bounceOut}`
      };
      
    case 'shake':
      return {
        animation: `${animations.shake} 0.5s ${easings.easeInOut}`
      };
      
    case 'glow':
      return {
        animation: `${animations.glow} 2s ${easings.easeInOut} infinite`
      };
      
    default:
      return {};
  }
};

// Step transition animations
export const getStepTransitionStyles = (direction: 'forward' | 'backward' | 'none') => {
  const theme = useTheme();
  
  switch (direction) {
    case 'forward':
      return {
        animation: `${animations.slideInRight} ${durations.normal} ${easings.easeOut}`,
        transformOrigin: 'left center'
      };
      
    case 'backward':
      return {
        animation: `${animations.slideInLeft} ${durations.normal} ${easings.easeOut}`,
        transformOrigin: 'right center'
      };
      
    default:
      return {
        animation: `${animations.fadeIn} ${durations.fast} ${easings.easeOut}`
      };
  }
};

// Progress bar animation
export const getProgressBarStyles = (progress: number) => {
  return {
    '--progress-width': `${progress}%`,
    animation: `${animations.progressFill} ${durations.slow} ${easings.easeOut}`,
    transition: `width ${durations.normal} ${easings.easeOut}`
  };
};

// Modal entrance animation
export const getModalEntranceStyles = () => {
  const theme = useTheme();
  
  return {
    animation: `${animations.scaleIn} ${durations.normal} ${easings.backOut}`,
    transformOrigin: 'center center'
  };
};

// Button hover animations
export const getButtonHoverStyles = () => {
  const theme = useTheme();
  
  return {
    transition: `all ${durations.fast} ${easings.easeOut}`,
    transform: 'translateY(0)',
    boxShadow: theme.shadows[2],
    
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: theme.shadows[8],
      '& .icon': {
        transform: 'scale(1.1)'
      }
    },
    
    '&:active': {
      transform: 'translateY(0)',
      transition: `all ${durations.fast} ${easings.easeIn}`
    }
  };
};

// Card hover animations
export const getCardHoverStyles = () => {
  const theme = useTheme();
  
  return {
    transition: `all ${durations.normal} ${easings.easeOut}`,
    transform: 'translateY(0)',
    boxShadow: theme.shadows[2],
    
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: theme.shadows[12],
      '& .card-icon': {
        animation: `${animations.pulse} 1s ${easings.easeInOut} infinite`
      }
    }
  };
};

// Loading state animations
export const getLoadingStyles = (variant: 'pulse' | 'skeleton' | 'fade') => {
  const theme = useTheme();
  
  switch (variant) {
    case 'pulse':
      return {
        animation: `${animations.pulse} 1.5s ${easings.easeInOut} infinite`
      };
      
    case 'skeleton':
      return {
        background: `linear-gradient(90deg, 
          ${alpha(theme.palette.grey[300], 0.2)} 25%, 
          ${alpha(theme.palette.grey[300], 0.4)} 50%, 
          ${alpha(theme.palette.grey[300], 0.2)} 75%
        )`,
        backgroundSize: '200% 100%',
        animation: `shimmer 1.5s ease-in-out infinite`,
        '@keyframes shimmer': {
          '0%': {
            backgroundPosition: '-200% 0'
          },
          '100%': {
            backgroundPosition: '200% 0'
          }
        }
      };
      
    case 'fade':
      return {
        animation: `${animations.fadeIn} ${durations.slow} ${easings.easeOut}`
      };
      
    default:
      return {};
  }
};

// Validation state animations
export const getValidationStyles = (state: 'success' | 'error' | 'warning') => {
  const theme = useTheme();
  
  switch (state) {
    case 'success':
      return {
        animation: `${animations.bounce} 0.6s ${easings.bounceOut}`,
        borderColor: theme.palette.success.main,
        boxShadow: `0 0 0 2px ${alpha(theme.palette.success.main, 0.2)}`
      };
      
    case 'error':
      return {
        animation: `${animations.shake} 0.5s ${easings.easeInOut}`,
        borderColor: theme.palette.error.main,
        boxShadow: `0 0 0 2px ${alpha(theme.palette.error.main, 0.2)}`
      };
      
    case 'warning':
      return {
        animation: `${animations.glow} 1s ${easings.easeInOut} 2`,
        borderColor: theme.palette.warning.main,
        boxShadow: `0 0 0 2px ${alpha(theme.palette.warning.main, 0.2)}`
      };
      
    default:
      return {};
  }
};

// Micro-interaction styles
export const microInteractions = {
  // Icon animations
  iconHover: {
    transition: `transform ${durations.fast} ${easings.easeOut}`,
    '&:hover': {
      transform: 'scale(1.2) rotate(5deg)'
    }
  },
  
  // Ripple effect
  ripple: {
    position: 'relative' as const,
    overflow: 'hidden' as const,
    '&::after': {
      content: '\"\"',
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
      transform: 'scale(0)',
      transition: `transform ${durations.fast} ${easings.easeOut}`,
      pointerEvents: 'none' as const
    },
    '&:active::after': {
      transform: 'scale(1)'
    }
  },
  
  // Focus animations
  focusGlow: {
    transition: `box-shadow ${durations.fast} ${easings.easeOut}`,
    '&:focus': {
      outline: 'none',
      animation: `${animations.glow} 0.3s ${easings.easeOut}`
    }
  }
};