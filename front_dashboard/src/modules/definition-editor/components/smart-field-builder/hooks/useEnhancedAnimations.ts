/**
 * Enhanced Animation Hooks for Smart Field Builder
 * Provides smooth state transitions and micro-interactions
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '@mui/material';
import { useAdvancedMemo } from './useAdvancedMemoization';

interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
  direction?: 'normal' | 'reverse' | 'alternate';
}

interface StateTransition {
  from: any;
  to: any;
  progress: number;
  isComplete: boolean;
}

// Enhanced state transition hook with smooth animations
export const useStateTransition = <T>(
  currentState: T,
  config: AnimationConfig = {
    duration: 300,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
  }
) => {
  const [transition, setTransition] = useState<StateTransition>({
    from: currentState,
    to: currentState,
    progress: 1,
    isComplete: true
  });

  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>();

  const startTransition = useCallback((newState: T) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    setTransition(prev => ({
      from: prev.to,
      to: newState,
      progress: 0,
      isComplete: false
    }));

    startTimeRef.current = performance.now();

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) return;

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / config.duration, 1);

      // Apply easing function
      const easedProgress = applyEasing(progress, config.easing);

      setTransition(prev => ({
        ...prev,
        progress: easedProgress,
        isComplete: progress >= 1
      }));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [config.duration, config.easing]);

  useEffect(() => {
    if (currentState !== transition.to) {
      startTransition(currentState);
    }
  }, [currentState, startTransition, transition.to]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return {
    ...transition,
    startTransition
  };
};

// Smooth value interpolation hook
export const useAnimatedValue = (
  targetValue: number,
  config: AnimationConfig = { duration: 200, easing: 'ease-out' }
) => {
  const [currentValue, setCurrentValue] = useState(targetValue);
  const animationRef = useRef<number>();
  const startValueRef = useRef(targetValue);
  const startTimeRef = useRef<number>();

  useEffect(() => {
    if (targetValue === currentValue) return;

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    startValueRef.current = currentValue;
    startTimeRef.current = performance.now();

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) return;

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / config.duration, 1);
      const easedProgress = applyEasing(progress, config.easing);

      const newValue = startValueRef.current + 
        (targetValue - startValueRef.current) * easedProgress;

      setCurrentValue(newValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetValue, config.duration, config.easing, currentValue]);

  return currentValue;
};

// Spring animation hook for bouncy effects
export const useSpringAnimation = (
  target: number,
  config: {
    tension?: number;
    friction?: number;
    precision?: number;
  } = {}
) => {
  const {
    tension = 170,
    friction = 26,
    precision = 0.01
  } = config;

  const [value, setValue] = useState(target);
  const [velocity, setVelocity] = useState(0);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>();

  useEffect(() => {
    if (Math.abs(target - value) < precision && Math.abs(velocity) < precision) {
      setValue(target);
      setVelocity(0);
      return;
    }

    lastTimeRef.current = performance.now();

    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) return;

      const deltaTime = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      const spring = -tension * (value - target);
      const damper = -friction * velocity;
      const acceleration = spring + damper;

      const newVelocity = velocity + acceleration * deltaTime;
      const newValue = value + newVelocity * deltaTime;

      setValue(newValue);
      setVelocity(newVelocity);

      if (Math.abs(target - newValue) > precision || Math.abs(newVelocity) > precision) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [target, value, velocity, tension, friction, precision]);

  return value;
};

// Staggered animation hook for lists
export const useStaggeredAnimation = (
  items: any[],
  config: {
    staggerDelay?: number;
    itemDuration?: number;
    easing?: string;
  } = {}
) => {
  const {
    staggerDelay = 50,
    itemDuration = 300,
    easing = 'ease-out'
  } = config;

  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    // Clear existing timeouts
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current = [];
    setVisibleItems(new Set());

    // Stagger item animations
    items.forEach((_, index) => {
      const timeout = setTimeout(() => {
        setVisibleItems(prev => new Set([...prev, index]));
      }, index * staggerDelay);

      timeoutsRef.current.push(timeout);
    });

    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    };
  }, [items.length, staggerDelay]);

  const getItemStyle = useCallback((index: number) => {
    const isVisible = visibleItems.has(index);
    
    return {
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
      transition: `all ${itemDuration}ms ${easing}`,
      transitionDelay: isVisible ? '0ms' : `${index * staggerDelay}ms`
    };
  }, [visibleItems, itemDuration, easing, staggerDelay]);

  return { getItemStyle, visibleItems };
};

// Gesture-based animation hook
export const useGestureAnimation = (
  threshold: number = 50,
  config: AnimationConfig = { duration: 200, easing: 'ease-out' }
) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  const startPosRef = useRef({ x: 0, y: 0 });
  const lastPosRef = useRef({ x: 0, y: 0 });
  const lastTimeRef = useRef<number>();

  const handleStart = useCallback((clientX: number, clientY: number) => {
    setIsDragging(true);
    startPosRef.current = { x: clientX, y: clientY };
    lastPosRef.current = { x: clientX, y: clientY };
    lastTimeRef.current = performance.now();
  }, []);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging) return;

    const now = performance.now();
    const deltaTime = now - (lastTimeRef.current || now);
    
    const deltaX = clientX - lastPosRef.current.x;
    const deltaY = clientY - lastPosRef.current.y;

    setDragOffset({
      x: clientX - startPosRef.current.x,
      y: clientY - startPosRef.current.y
    });

    if (deltaTime > 0) {
      setVelocity({
        x: deltaX / deltaTime,
        y: deltaY / deltaTime
      });
    }

    lastPosRef.current = { x: clientX, y: clientY };
    lastTimeRef.current = now;
  }, [isDragging]);

  const handleEnd = useCallback(() => {
    setIsDragging(false);
    
    // Animate back if below threshold
    if (Math.abs(dragOffset.x) < threshold && Math.abs(dragOffset.y) < threshold) {
      setDragOffset({ x: 0, y: 0 });
    }
  }, [dragOffset.x, dragOffset.y, threshold]);

  const reset = useCallback(() => {
    setDragOffset({ x: 0, y: 0 });
    setVelocity({ x: 0, y: 0 });
    setIsDragging(false);
  }, []);

  return {
    isDragging,
    dragOffset,
    velocity,
    handleStart,
    handleMove,
    handleEnd,
    reset
  };
};

// Easing function utility
const applyEasing = (progress: number, easing: string): number => {
  switch (easing) {
    case 'ease-out':
      return 1 - Math.pow(1 - progress, 3);
    case 'ease-in':
      return Math.pow(progress, 3);
    case 'ease-in-out':
      return progress < 0.5
        ? 4 * Math.pow(progress, 3)
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    case 'bounce':
      const n1 = 7.5625;
      const d1 = 2.75;
      if (progress < 1 / d1) {
        return n1 * progress * progress;
      } else if (progress < 2 / d1) {
        return n1 * (progress -= 1.5 / d1) * progress + 0.75;
      } else if (progress < 2.5 / d1) {
        return n1 * (progress -= 2.25 / d1) * progress + 0.9375;
      } else {
        return n1 * (progress -= 2.625 / d1) * progress + 0.984375;
      }
    default:
      // cubic-bezier approximation for custom curves
      return progress;
  }
};

// Theme-aware animation configuration
export const useAnimationConfig = () => {
  const theme = useTheme();
  
  return useAdvancedMemo(() => ({
    fast: {
      duration: 150,
      easing: 'ease-out',
    },
    normal: {
      duration: 300,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
    slow: {
      duration: 500,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    },
    spring: {
      tension: 170,
      friction: 26,
    },
    // Respect reduced motion preference
    respectsMotion: !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }), [theme]);
};