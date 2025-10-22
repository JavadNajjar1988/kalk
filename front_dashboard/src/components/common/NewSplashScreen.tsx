import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, useMediaQuery, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';

interface NewSplashScreenProps {
  onComplete?: () => void;
  duration?: number;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'lottie-player': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        src?: string;
        background?: string;
        speed?: number | string;
        loop?: boolean | string;
        autoplay?: boolean | string;
        style?: React.CSSProperties;
      };
    }
  }
}

const LOTTIE_SCRIPT_SRC = '/assets/vendor/lottie-player.js';
const LOADER_SRC = '/assets/animations/double-circular-loader.json';

const NewSplashScreen: React.FC<NewSplashScreenProps> = ({
  onComplete,
  duration = 2000,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const initialDefined = useMemo(
    () =>
      typeof window !== 'undefined' && !!customElements.get('lottie-player'),
    []
  );
  const [componentDefined, setComponentDefined] = useState(initialDefined);

  const softSurface = useMemo(() => {
    const primary = (theme.palette.primary.main || '#4a90e2').toLowerCase();
    const hex = primary.replace('#', '');
    const paletteHints = [
      { match: ['10b981', '4caf50', '2e7d32'], value: '#f0f4f3' },
      { match: ['4a90e2', '1976d2', '2196f3'], value: '#f0f4f8' },
      { match: ['ef4444', 'f44336', 'd32f2f'], value: '#fbf1f0' },
      { match: ['6b21a8', '9c27b0', '673ab7'], value: '#22262d' },
      { match: ['f59e0b', 'ff9800', 'fb8c00'], value: '#fbf1f1' },
    ];
    const directMatch = paletteHints.find((entry) =>
      entry.match.some((needle) => hex.includes(needle))
    );
    if (directMatch) return directMatch.value;

    const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
    const hexToRgb = (value: string) => {
      const normalized =
        value.length === 3 ? value.split('').map((c) => c + c).join('') : value;
      const r = parseInt(normalized.substring(0, 2), 16);
      const g = parseInt(normalized.substring(2, 4), 16);
      const b = parseInt(normalized.substring(4, 6), 16);
      return { r, g, b };
    };
    const rgbToHex = (r: number, g: number, b: number) =>
      `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g)
        .toString(16)
        .padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`;
    const blendWithWhite = (value: string, primaryWeight = 0.1) => {
      const { r, g, b } = hexToRgb(value);
      const weight = 1 - primaryWeight;
      const blendedR = 255 * weight + r * primaryWeight;
      const blendedG = 255 * weight + g * primaryWeight;
      const blendedB = 255 * weight + b * primaryWeight;
      return rgbToHex(blendedR, blendedG, blendedB);
    };

    const hexMatcher = /^[0-9a-f]{3,6}$/;
    if (hexMatcher.test(hex)) {
      return blendWithWhite(hex, 0.12);
    }
    const fallback = (theme.palette.primary.light || '#90caf9')
      .toLowerCase()
      .replace('#', '');
    if (hexMatcher.test(fallback)) {
      return blendWithWhite(fallback, 0.08);
    }
    return alpha(theme.palette.background.paper, 0.92);
  }, [
    theme.palette.background.paper,
    theme.palette.primary.light,
    theme.palette.primary.main,
  ]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let cancelled = false;

    const ensureDefined = () => {
      if (cancelled) return;
      customElements
        .whenDefined('lottie-player')
        .then(() => {
          if (!cancelled) setComponentDefined(true);
        })
        .catch(() => {
          /* noop */
        });
    };

    if (initialDefined) {
      setComponentDefined(true);
      return;
    }

    ensureDefined();

    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[data-lottie-player="${LOTTIE_SCRIPT_SRC}"]`
    );
    if (existingScript) {
      return () => {
        cancelled = true;
      };
    }

    const script = document.createElement('script');
    script.src = LOTTIE_SCRIPT_SRC;
    script.type = 'module';
    script.defer = true;
    script.dataset.lottiePlayer = LOTTIE_SCRIPT_SRC;
    script.onload = () => {
      setComponentDefined(true);
      ensureDefined();
    };
    document.head.appendChild(script);

    return () => {
      cancelled = true;
      script.onload = null;
    };
  }, [initialDefined]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: (t) => t.zIndex.modal + 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: theme.palette.text.primary,
        overflow: 'hidden',
        px: { xs: 2, sm: 3 },
        background: `linear-gradient(140deg, ${alpha(
          theme.palette.background.default,
          0.88
        )} 0%, ${alpha(
          theme.palette.primary.dark || theme.palette.primary.main,
          0.36
        )} 100%)`,
        backdropFilter: 'blur(16px)',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          maxWidth: 560,
          borderRadius: { xs: 3, sm: 4 },
          px: { xs: 3.5, sm: 5 },
          py: { xs: 4, sm: 5 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: { xs: 3, sm: 3.5 },
          backgroundColor: softSurface,
          boxShadow: `0 30px 72px ${alpha(theme.palette.common.black, 0.18)}`,
          border: `1px solid ${alpha(theme.palette.primary.light, 0.24)}`,
          overflow: 'hidden',
          '@keyframes splash-progress': {
            '0%': { transform: 'translateX(-100%)' },
            '50%': { transform: 'translateX(0%)' },
            '100%': { transform: 'translateX(100%)' },
          },
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: -60,
            background: `radial-gradient(circle at top, ${alpha(
              theme.palette.primary.light,
              0.25
            )}, transparent 60%)`,
            opacity: 0.55,
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'relative',
            width: isMobile ? 184 : 216,
            height: isMobile ? 184 : 216,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: isMobile ? 16 : 22,
              borderRadius: '50%',
              background: alpha(theme.palette.primary.light, 0.2),
              filter: 'blur(14px)',
            }}
          />
          <lottie-player
            src={LOADER_SRC}
            background="transparent"
            speed="1"
            loop
            autoplay
            style={{
              width: '100%',
              height: '100%',
              opacity: componentDefined ? 1 : 0,
              transition: 'opacity 0.18s ease',
              filter: `drop-shadow(0 18px 28px ${alpha(
                theme.palette.primary.main,
                0.25
              )})`,
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              width: isMobile ? 76 : 96,
              height: isMobile ? 76 : 96,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '28%',
              backgroundColor: 'transparent',
              border: 'none',
              boxShadow: 'none',
            }}
          >
            <img
              src="/logo.png"
              alt="لوگو سامانه"
              style={{ width: '70%', height: '70%' }}
            />
          </Box>
        </Box>
        <Typography
          variant={isMobile ? 'h5' : 'h4'}
          sx={{
            fontWeight: 800,
            textAlign: 'center',
            letterSpacing: '0.035em',
            color: theme.palette.primary.main,
          }}
        >
          سامانه جامع عملیات دفاعی
        </Typography>
        <Typography
          variant={isMobile ? 'body1' : 'h6'}
          sx={{
            textAlign: 'center',
            color: alpha(theme.palette.text.primary, 0.82),
            letterSpacing: '0.08em',
          }}
        >
          در حال بارگذاری...
        </Typography>
        <Box
          sx={{
            width: '100%',
            mt: { xs: 1, sm: 2 },
            height: 4,
            bgcolor: alpha(theme.palette.primary.main, 0.12),
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              width: '100%',
              height: '100%',
              background: `linear-gradient(90deg, ${alpha(
                theme.palette.primary.main,
                0
              )} 0%, ${alpha(theme.palette.primary.main, 0.8)} 50%, ${alpha(
                theme.palette.primary.main,
                0
              )} 100%)`,
              animation: 'splash-progress 2.4s ease-in-out infinite',
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default NewSplashScreen;
