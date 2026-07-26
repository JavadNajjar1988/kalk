/**
 * MilitarySymbolPreview Component
 * نمایش پیش‌نمایش نماد نظامی با استفاده مستقیم از milsymbol library
 * مطابق با Vue ORBAT Mapper
 */

import React, { useMemo, useCallback, memo } from 'react';
import { Box, Typography, Paper, useTheme, alpha } from '@mui/material';
import ms from 'milsymbol';
import type { SymbolOptions } from 'milsymbol';
import {
  buildSIDC,
  getStandardIdentityColor,
} from '../constants/militarySymbols';

/** milsymbol از کلید `standard` با مقادیر '2525' | 'APP6' استفاده می‌کند */
function resolveMilsymbolStandard(
  symbologyStandard?: string
): '2525' | 'APP6' | undefined {
  if (!symbologyStandard) return undefined;
  const s = symbologyStandard.toLowerCase();
  if (s === '2525' || s === '2525d') return '2525';
  return 'APP6';
}

interface MilitarySymbolPreviewProps {
  standardIdentity: string;
  echelon?: string;
  icon?: string;
  fillColor?: string;
  size?: number;
  showDetails?: boolean;
  compact?: boolean; // New prop for dropdown usage
  symbologyStandard?: string;
  symbolOptions?: Partial<SymbolOptions>;
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

// Custom color modes (mirrors Kalknegar implementation for special identities)
const CUSTOM_IDENTITY_COLOR_MODE = (() => {
  const base = ms.getColorMode('Light');
  return { ...base, Friend: 'rgb(170, 176, 116)' };
})();

const CUSTOM_IDENTITY_FRAME_COLOR = (() => {
  const base = ms.getColorMode('FrameColor');
  return { ...base, Friend: 'rgb(65, 70, 22)' };
})();

const CUSTOM_ALT_IDENTITY_COLOR_MODE = (() => {
  const base = ms.getColorMode('Light');
  return { ...base, Friend: base.Hostile };
})();

const replaceCharAt = (value: string, index: number, char: string) => {
  if (index < 0 || index >= value.length) return value;
  return value.substring(0, index) + char + value.substring(index + 1);
};

const prepareIdentityOptions = (
  sidc: string,
  options: Partial<SymbolOptions> = {}
) => {
  if (!sidc || sidc.length <= 3) {
    return { sidc, options };
  }

  const identity = sidc.charAt(3);
  if (identity === '7') {
    return {
      sidc: replaceCharAt(sidc, 3, '3'),
      options: {
        ...options,
        colorMode: CUSTOM_IDENTITY_COLOR_MODE,
        frameColor: CUSTOM_IDENTITY_FRAME_COLOR,
        iconColor: CUSTOM_IDENTITY_FRAME_COLOR,
      },
    };
  }

  if (identity === '8') {
    return {
      sidc: replaceCharAt(sidc, 3, '3'),
      options: {
        ...options,
        colorMode: CUSTOM_ALT_IDENTITY_COLOR_MODE,
      },
    };
  }

  return { sidc, options };
};

// Performance-optimized symbol generator with caching
const generateSymbolWithCache = (
  sidc: string,
  options: Partial<SymbolOptions> = {}
): string | null => {
  const { sidc: normalizedSidc, options: normalizedOptions } =
    prepareIdentityOptions(sidc, options);
  const cacheKey = `${normalizedSidc}_${JSON.stringify(normalizedOptions)}`;

  // Check cache first
  if (symbolCache.has(cacheKey)) {
    return symbolCache.get(cacheKey)!;
  }

  // Generate new symbol using milsymbol library
  try {
    const symbol = new ms.Symbol(normalizedSidc, normalizedOptions);
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

  return null;
};

const MilitarySymbolPreview = memo<MilitarySymbolPreviewProps>(
  ({
    standardIdentity,
    echelon = '18',
    icon = '121100',
    fillColor,
    size = 60,
    showDetails = false,
    compact = false,
    symbologyStandard,
    symbolOptions: customSymbolOptions,
  }) => {
    const theme = useTheme();

    // Build SIDC code (مطابق با Vue ORBAT Mapper)
    const sidc = useMemo(() => {
      return buildSIDC(standardIdentity, echelon, icon);
    }, [standardIdentity, echelon, icon]);

    // Standard identity color mapping (مطابق با Vue ORBAT) - memoized
    const getIdentityColor = useCallback(
      (identity: string): string => {
        return fillColor || getStandardIdentityColor(identity);
      },
      [fillColor]
    );

    // Generate symbol using cached milsymbol library for performance
    const symbolSvg = useMemo(() => {
      const resolvedFillColor =
        customSymbolOptions?.fillColor ??
        fillColor ??
        getIdentityColor(standardIdentity);

      const msStandard = resolveMilsymbolStandard(symbologyStandard);
      const symbolOptions: Partial<SymbolOptions> = {
        size,
        outlineColor: 'white',
        outlineWidth: Math.min(
          compact ? 3 : 5,
          Math.max(2, Math.round(size / 20))
        ),
        // A zero stroke hides echelon amplifiers (for example the four X marks
        // for an army) and several internal unit glyphs on light backgrounds.
        strokeWidth: Math.min(4, Math.max(2, Math.round(size / 24))),
        simpleStatusModifier: false,
        ...(msStandard ? { standard: msStandard } : {}),
        ...customSymbolOptions,
        fillColor: resolvedFillColor,
      };

      // Use cached symbol generation for better performance
      const cachedSymbol = generateSymbolWithCache(sidc, symbolOptions);
      if (cachedSymbol) {
        return cachedSymbol;
      }

      console.warn('Failed to generate symbol:', sidc);
      return null;
    }, [
      sidc,
      size,
      standardIdentity,
      compact,
      getIdentityColor,
      customSymbolOptions,
      symbologyStandard,
      fillColor,
    ]);

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
          color: 'error.contrastText',
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
              className="milsymbol"
              sx={{
                width: size,
                height: size,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 0,
                '& svg': { display: 'block', maxWidth: '100%', height: 'auto' },
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
            justifyContent: 'center',
          }}
        >
          <Box
            sx={{
              width: size - 4,
              height: size - 4,
              bgcolor: getIdentityColor(standardIdentity),
              borderRadius: standardIdentity === '6' ? '0' : '4px',
              transform: standardIdentity === '6' ? 'rotate(45deg)' : 'none',
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
            minHeight: size + 60,
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
              mb: showDetails ? 2 : 0,
            }}
          >
            {symbolSvg ? (
              <Box
                className="milsymbol"
                sx={{
                  lineHeight: 0,
                  '& svg': {
                    display: 'block',
                    maxWidth: '100%',
                    height: 'auto',
                  },
                }}
                dangerouslySetInnerHTML={{ __html: symbolSvg }}
              />
            ) : (
              <Box
                sx={{
                  width: size - 10,
                  height: size - 10,
                  bgcolor: getIdentityColor(standardIdentity),
                  borderRadius: standardIdentity === '6' ? '0' : '4px',
                  transform:
                    standardIdentity === '6' ? 'rotate(45deg)' : 'none',
                }}
              />
            )}
          </Box>

          {/* Details */}
          {showDetails && (
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block' }}
              >
                SIDC: {sidc}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block' }}
              >
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
  }
);

// Set display name for debugging
MilitarySymbolPreview.displayName = 'MilitarySymbolPreview';

export default MilitarySymbolPreview;
