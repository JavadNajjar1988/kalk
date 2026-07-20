/**
 * Simple Memoization Hooks for Smart Field Builder
 * Provides basic performance optimization without hook rule violations
 */

import React, { useMemo, useCallback, useRef, useState, useEffect } from 'react';

// Simple memoization replacement that follows React hook rules
export const useAdvancedMemo = <T>(
  factory: () => T,
  deps: React.DependencyList,
  options: {
    cacheSize?: number;
    ttl?: number;
    deep?: boolean;
  } = {}
): T => {
  // Use standard useMemo to avoid hook rule violations
  return useMemo(factory, deps);
};

// Simple callback memoization
export const useSmartCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList,
  options: {
    debounce?: number;
    throttle?: number;
    immediate?: boolean;
  } = {}
): T => {
  // Use standard useCallback to avoid hook rule violations
  return useCallback(callback, deps) as T;
};

// Simple state hook
export const useSmartState = <T>(
  initialState: T | (() => T),
  equalityFn?: (a: T, b: T) => boolean
): [T, React.Dispatch<React.SetStateAction<T>>] => {
  // Use standard useState to avoid hook rule violations
  return useState(initialState);
};

// Simple render tracker
export const useRenderTracker = (componentName: string, logLimit = 10) => {
  const renderCountRef = useRef(0);
  
  useEffect(() => {
    renderCountRef.current += 1;
  });
  
  return {
    renderCount: renderCountRef.current,
    averageRenderInterval: 0
  };
};

// Simple list memoization
export const useListMemo = <T>(
  list: T[],
  keyExtractor: (item: T, index: number) => string | number,
  deps: React.DependencyList = []
): T[] => {
  // Use standard useMemo to avoid hook rule violations
  return useMemo(() => list, [list, ...deps]);
};

// Simple effect hook
export const useOptimizedEffect = (
  effect: React.EffectCallback,
  deps: React.DependencyList,
  options: {
    deep?: boolean;
    debounce?: number;
    skipMount?: boolean;
  } = {}
): void => {
  // Use standard useEffect to avoid hook rule violations
  useEffect(effect, deps);
};