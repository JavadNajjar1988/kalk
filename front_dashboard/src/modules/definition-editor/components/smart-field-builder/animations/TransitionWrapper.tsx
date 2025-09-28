/**
 * Transition Wrapper Component for Smart Field Builder
 * Handles smooth transitions between wizard steps and mode changes
 */

import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { Box, alpha, useTheme } from '@mui/material';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import { 
  animations, 
  durations, 
  easings, 
  getStepTransitionStyles,
  getModalEntranceStyles 
} from './animationSystem';

interface TransitionWrapperProps {
  children: ReactNode;
  transitionKey: string | number;
  direction?: 'forward' | 'backward' | 'none';
  variant?: 'slide' | 'fade' | 'scale' | 'custom';
  duration?: keyof typeof durations;
  disabled?: boolean;
  onEnter?: () => void;
  onExit?: () => void;
  onEntered?: () => void;
  onExited?: () => void;
}

const TransitionWrapper: React.FC<TransitionWrapperProps> = ({
  children,
  transitionKey,
  direction = 'none',
  variant = 'slide',
  duration = 'normal',
  disabled = false,
  onEnter,
  onExit,
  onEntered,
  onExited
}) => {
  const theme = useTheme();
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Animation styles based on variant and direction
  const getAnimationStyles = () => {
    const animationDuration = durations[duration];
    
    switch (variant) {
      case 'slide':
        return {
          '&.step-enter': {
            transform: direction === 'forward' ? 'translateX(100%)' : 
                     direction === 'backward' ? 'translateX(-100%)' : 'translateY(20px)',
            opacity: 0,
            zIndex: 2
          },
          '&.step-enter-active': {
            transform: 'translateX(0) translateY(0)',
            opacity: 1,
            transition: `all ${animationDuration} ${easings.easeOut}`,
            zIndex: 2
          },
          '&.step-exit': {
            transform: 'translateX(0) translateY(0)',
            opacity: 1,
            zIndex: 1
          },
          '&.step-exit-active': {
            transform: direction === 'forward' ? 'translateX(-100%)' : 
                     direction === 'backward' ? 'translateX(100%)' : 'translateY(-20px)',
            opacity: 0,
            transition: `all ${animationDuration} ${easings.easeOut}`,
            zIndex: 1
          }
        };

      case 'fade':
        return {
          '&.step-enter': {
            opacity: 0,
            transform: 'scale(0.98)',
            zIndex: 2
          },
          '&.step-enter-active': {
            opacity: 1,
            transform: 'scale(1)',
            transition: `all ${animationDuration} ${easings.easeOut}`,
            zIndex: 2
          },
          '&.step-exit': {
            opacity: 1,
            transform: 'scale(1)',
            zIndex: 1
          },
          '&.step-exit-active': {
            opacity: 0,
            transform: 'scale(1.02)',
            transition: `all ${animationDuration} ${easings.easeOut}`,
            zIndex: 1
          }
        };

      case 'scale':
        return {
          '&.step-enter': {
            transform: 'scale(0.8)',
            opacity: 0,
            zIndex: 2
          },
          '&.step-enter-active': {
            transform: 'scale(1)',
            opacity: 1,
            transition: `all ${animationDuration} ${easings.backOut}`,
            zIndex: 2
          },
          '&.step-exit': {
            transform: 'scale(1)',
            opacity: 1,
            zIndex: 1
          },
          '&.step-exit-active': {
            transform: 'scale(1.1)',
            opacity: 0,
            transition: `all ${animationDuration} ${easings.easeIn}`,
            zIndex: 1
          }
        };

      default:
        return {};
    }
  };

  const handleEnter = () => {
    setIsAnimating(true);
    onEnter?.();
  };

  const handleExit = () => {
    onExit?.();
  };

  const handleEntered = () => {
    setIsAnimating(false);
    onEntered?.();
  };

  const handleExited = () => {
    onExited?.();
  };

  if (disabled) {
    return <Box sx={{ width: '100%', height: '100%' }}>{children}</Box>;
  }

  return (
    <Box 
      sx={{ 
        width: '100%', 
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        ...getAnimationStyles()
      }}
    >
      <TransitionGroup component={null}>
        <CSSTransition
          key={transitionKey}
          nodeRef={nodeRef}
          timeout={parseInt(durations[duration])}
          classNames="step"
          onEnter={handleEnter}
          onExit={handleExit}
          onEntered={handleEntered}
          onExited={handleExited}
          unmountOnExit
        >
          <Box
            ref={nodeRef}
            sx={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              backgroundColor: theme.palette.background.paper,
              borderRadius: 1,
              ...(isAnimating && {
                pointerEvents: 'none'
              })
            }}
          >
            {children}
          </Box>
        </CSSTransition>
      </TransitionGroup>
    </Box>
  );
};

// Specialized transition for step changes
interface StepTransitionProps {
  children: ReactNode;
  currentStep: number;
  direction?: 'forward' | 'backward';
  disabled?: boolean;
}

export const StepTransition: React.FC<StepTransitionProps> = ({
  children,
  currentStep,
  direction = 'forward',
  disabled = false
}) => {
  return (
    <TransitionWrapper
      transitionKey={currentStep}
      direction={direction}
      variant="slide"
      duration="normal"
      disabled={disabled}
    >
      {children}
    </TransitionWrapper>
  );
};

// Specialized transition for mode changes
interface ModeTransitionProps {
  children: ReactNode;
  mode: string | null;
  disabled?: boolean;
}

export const ModeTransition: React.FC<ModeTransitionProps> = ({
  children,
  mode,
  disabled = false
}) => {
  return (
    <TransitionWrapper
      transitionKey={mode || 'none'}
      direction="none"
      variant="scale"
      duration="normal"
      disabled={disabled}
    >
      {children}
    </TransitionWrapper>
  );
};

// Animated progress indicator
interface AnimatedProgressProps {
  progress: number;
  showLabel?: boolean;
  variant?: 'linear' | 'circular';
  color?: 'primary' | 'secondary' | 'success';
}

export const AnimatedProgress: React.FC<AnimatedProgressProps> = ({
  progress,
  showLabel = false,
  variant = 'linear',
  color = 'primary'
}) => {
  const theme = useTheme();
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayProgress(progress);
    }, 100);

    return () => clearTimeout(timer);
  }, [progress]);

  if (variant === 'circular') {
    return (
      <Box
        sx={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <svg width={40} height={40}>
          <circle
            cx={20}
            cy={20}
            r={16}
            fill="none"
            stroke={alpha(theme.palette[color].main, 0.2)}
            strokeWidth={3}
          />
          <circle
            cx={20}
            cy={20}
            r={16}
            fill="none"
            stroke={theme.palette[color].main}
            strokeWidth={3}
            strokeDasharray={`${displayProgress} ${100 - displayProgress}`}
            strokeDashoffset={25}
            transform="rotate(-90 20 20)"
            sx={{
              transition: `stroke-dasharray ${durations.slow} ${easings.easeOut}`
            }}
          />
        </svg>
        {showLabel && (
          <Box
            sx={{
              position: 'absolute',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: theme.palette[color].main
            }}
          >
            {Math.round(displayProgress)}%
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        height: 4,
        borderRadius: 2,
        backgroundColor: alpha(theme.palette[color].main, 0.2),
        overflow: 'hidden'
      }}
    >
      <Box
        sx={{
          height: '100%',
          width: `${displayProgress}%`,
          backgroundColor: theme.palette[color].main,
          borderRadius: 2,
          transition: `width ${durations.slow} ${easings.easeOut}`,
          background: `linear-gradient(90deg, 
            ${theme.palette[color].main} 0%, 
            ${theme.palette[color].light} 100%
          )`
        }}
      />
      {showLabel && (
        <Box
          sx={{
            mt: 0.5,
            textAlign: 'right',
            fontSize: '0.75rem',
            color: theme.palette.text.secondary
          }}
        >
          {Math.round(displayProgress)}%
        </Box>
      )}
    </Box>
  );
};

export default TransitionWrapper;