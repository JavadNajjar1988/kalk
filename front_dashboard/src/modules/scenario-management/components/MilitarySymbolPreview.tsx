/**
 * MilitarySymbolPreview Component
 * نمایش پیش‌نمایش نماد نظامی با استفاده مستقیم از milsymbol library
 * مطابق با Vue ORBAT Mapper
 */

import React, { useMemo, useState, useEffect, useCallback, memo } from 'react';
import {
  Box,
  Typography,
  Paper,
  useTheme,
  alpha
} from '@mui/material';
import { buildSIDC } from '../constants/militarySymbols';

interface MilitarySymbolPreviewProps {
  standardIdentity: string;
  echelon?: string;
  icon?: string;
  fillColor?: string;
  size?: number;
  showDetails?: boolean;
  compact?: boolean; // New prop for dropdown usage
}

// Global reference to milsymbol library
declare global {
  interface Window {
    ms: any;
  }
}

// Error boundary component for handling symbol rendering errors
class SymbolErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('Military symbol rendering error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

// Symbol cache to improve performance for multiple symbols
const symbolCache = new Map<string, string>();
const MAX_CACHE_SIZE = 100;

// Performance-optimized symbol generator with caching
const generateSymbolWithCache = (sidc: string, options: any): string | null => {
  const cacheKey = `${sidc}_${JSON.stringify(options)}`;
  
  // Check cache first
  if (symbolCache.has(cacheKey)) {
    return symbolCache.get(cacheKey)!;
  }
  
  // Generate new symbol
  if (typeof window !== 'undefined' && window.ms) {
    try {
      const symbol = new window.ms.Symbol(sidc, options);
      const svgString = symbol.asSVG();
      
      if (svgString && svgString.trim() !== '') {
        // Add to cache (with size limit)
        if (symbolCache.size >= MAX_CACHE_SIZE) {
          const firstKey = symbolCache.keys().next().value;
          if (firstKey) {
            symbolCache.delete(firstKey);
          }
        }
        symbolCache.set(cacheKey, svgString);
        return svgString;
      }
    } catch (error) {
      console.warn('Error generating cached symbol:', error);
    }
  }
  
  return null;
};

const MilitarySymbolPreview = memo<MilitarySymbolPreviewProps>(({
  standardIdentity,
  echelon = '18',
  icon = '121100',
  fillColor,
  size = 60,
  showDetails = false,
  compact = false
}) => {
  const theme = useTheme();
  const [isLibraryReady, setIsLibraryReady] = useState(false);
  
  // Check if milsymbol library is loaded
  useEffect(() => {
    const checkLibrary = () => {
      if (typeof window !== 'undefined' && window.ms) {
        setIsLibraryReady(true);
      } else {
        // Retry after a short delay
        setTimeout(checkLibrary, 100);
      }
    };
    
    checkLibrary();
  }, []);
  
  // Build SIDC code (مطابق با Vue ORBAT Mapper)
  const sidc = useMemo(() => {
    return buildSIDC(standardIdentity, echelon, icon);
  }, [standardIdentity, echelon, icon]);
  
  // Standard identity color mapping (مطابق با Vue ORBAT) - memoized
  const getIdentityColor = useCallback((identity: string): string => {
    const colors: Record<string, string> = {
      '0': '#ffff00', // Pending - Yellow
      '1': '#ffff00', // Unknown - Yellow
      '2': '#0080ff', // Assumed Friend - Blue  
      '3': '#0080ff', // Friend - Blue
      '4': '#00ff00', // Neutral - Green
      '5': '#ff8000', // Suspect - Orange
      '6': '#ff0000', // Hostile - Red
      '7': '#ff00ff', // Custom 1 - Magenta
      '8': '#00ffff'  // Custom 2 - Cyan
    };
    return fillColor || colors[identity] || colors['1'];
  }, [fillColor]);
  
  // Generate symbol using cached milsymbol library for performance
  const symbolSvg = useMemo(() => {
    // Check if milsymbol library is loaded
    if (!isLibraryReady || typeof window === 'undefined' || !window.ms) {
      console.debug('MilSymbol library not loaded yet');
      return null;
    }
    
    const symbolOptions = {
      size: size,
      fillColor: getIdentityColor(standardIdentity),
      simpleStatusModifier: true,
      outlineColor: 'white',
      outlineWidth: compact ? 2 : 4,
      strokeWidth: 0 // Remove stroke as requested
    };
    
    // Use cached symbol generation for better performance
    const cachedSymbol = generateSymbolWithCache(sidc, symbolOptions);
    if (cachedSymbol) {
      return cachedSymbol;
    }
    
    console.warn('Failed to generate symbol:', sidc);
    return null;
  }, [sidc, size, standardIdentity, compact, isLibraryReady, getIdentityColor]);
  
  // Get fallback component for error boundary
  const fallbackComponent = (
    <Box
      sx={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'error.light',
        borderRadius: 1,
        color: 'error.contrastText'
      }}
    >
      <Typography variant="caption">!</Typography>
    </Box>
  );
  
  // Compact mode for dropdown usage
  if (compact) {
    if (symbolSvg) {
      return (
        <SymbolErrorBoundary fallback={fallbackComponent}>
          <Box
            sx={{
              width: size,
              height: size,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            dangerouslySetInnerHTML={{ __html: symbolSvg }}
          />
        </SymbolErrorBoundary>
      );
    }
    
    // Fallback when symbol not available
    return (
      <Box
        sx={{
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Box
          sx={{
            width: size - 4,
            height: size - 4,
            bgcolor: getIdentityColor(standardIdentity),
            borderRadius: standardIdentity === '6' ? '0' : '4px',
            transform: standardIdentity === '6' ? 'rotate(45deg)' : 'none'
          }}
        />
      </Box>
    );
  }

  return (
    <SymbolErrorBoundary fallback={fallbackComponent}>
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          bgcolor: alpha(theme.palette.background.paper, 0.8),
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
          minHeight: size + 60
        }}
      >
        {/* Symbol Display */}
        <Box
          sx={{
            width: size,
            height: size,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: showDetails ? 2 : 0
          }}
        >
          {symbolSvg ? (
            <div dangerouslySetInnerHTML={{ __html: symbolSvg }} />
          ) : (
            <Box
              sx={{
                width: size - 10,
                height: size - 10,
                bgcolor: getIdentityColor(standardIdentity),
                borderRadius: standardIdentity === '6' ? '0' : '4px',
                transform: standardIdentity === '6' ? 'rotate(45deg)' : 'none'
              }}
            />
          )}
        </Box>
        
        {/* Details */}
        {showDetails && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              SIDC: {sidc}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Identity: {standardIdentity} | Echelon: {echelon}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Icon: {icon}
            </Typography>
          </Box>
        )}
      </Paper>
    </SymbolErrorBoundary>
  );
});

// Set display name for debugging
MilitarySymbolPreview.displayName = 'MilitarySymbolPreview';

export default MilitarySymbolPreview;