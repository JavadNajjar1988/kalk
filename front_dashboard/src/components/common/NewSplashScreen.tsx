import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Typography, useMediaQuery, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

type NormalizedColor = [number, number, number];

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const parseColorToNormalized = (
  input?: string,
  fallback: NormalizedColor = [1, 1, 1]
): NormalizedColor => {
  if (!input) {
    return [...fallback] as NormalizedColor;
  }

  const color = input.trim();

  if (color.startsWith('#')) {
    let hex = color.slice(1);
    if (hex.length === 3) {
      hex = hex
        .split('')
        .map((char) => char + char)
        .join('');
    }
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16) / 255;
      const g = parseInt(hex.slice(2, 4), 16) / 255;
      const b = parseInt(hex.slice(4, 6), 16) / 255;
      return [r, g, b] as NormalizedColor;
    }
  } else {
    const match = color
      .replace(/\s+/g, '')
      .match(/^rgba?\((\d+),(\d+),(\d+)/i);
    if (match) {
      const r = Number(match[1]) / 255;
      const g = Number(match[2]) / 255;
      const b = Number(match[3]) / 255;
      return [r, g, b] as NormalizedColor;
    }
  }

  return [...fallback] as NormalizedColor;
};

const mixWithWhite = (
  color: NormalizedColor,
  weight: number
): NormalizedColor => {
  const w = clamp01(weight);
  const keep = 1 - w;
  return [
    clamp01(color[0] * keep + 1 * w),
    clamp01(color[1] * keep + 1 * w),
    clamp01(color[2] * keep + 1 * w),
  ] as NormalizedColor;
};

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

const SajedLogo: React.FC<SvgIconProps> = (props) => (
  <SvgIcon viewBox="0 0 570 402" {...props}>
    <path
      fillRule="evenodd"
      d="M266.632 61.237 392.069 185.512l50.174 50.111h34.119l47.164 48.106H421.17L233.517 96.314Zm-42.146 42.093 180.628 180.4H44.861l47.164-48.106h83.29l-41.143-41.091 34.118-34.076 74.259 74.164 45.157 1v-1l-62.217-63.139-17.117 16.108-34.119-33.073Zm37.129 194.43c4.834-1.329 10.335-1.919 16.056 2 12.86 7.186 9.255 19.151 3.329 32.236-4.463 9.854-8.669 19.622-12.364 27.9h-1l-1-1c-1.745-7.251-5.175-14.708-8.629-21.9-5.833-12.37-12.662-25.337 4.836-36.926Zm1 10.022-4.014 3.007c-1.16 4.5-1.335 5.539-.6 10.211 1.785 3.78 2.884 4.218 6 6a11.881 11.881 0 0 0 8-1c3.34-2.454 3.02-2.662 5-7-5.364-4.478-10.285-8.22-20.307-6.209Z"
    />
  </SvgIcon>
);

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
  const loaderRef = useRef<HTMLElement | null>(null);
  const [loaderData, setLoaderData] = useState<any | null>(null);

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
  const logoColor = useMemo(
    () =>
      theme.palette.mode === 'dark'
        ? alpha(theme.palette.common.white, 0.92)
        : theme.palette.primary.main,
    [theme.palette.common.white, theme.palette.mode, theme.palette.primary.main]
  );
  const loaderInnerColor = useMemo<NormalizedColor>(
    () =>
      parseColorToNormalized(theme.palette.primary.main, [
        0.898,
        0.9608,
        0.9804,
      ]),
    [theme.palette.primary.main]
  );
  const loaderOuterFallback = useMemo<NormalizedColor>(
    () => mixWithWhite(loaderInnerColor, theme.palette.mode === 'dark' ? 0.08 : 0.24),
    [loaderInnerColor, theme.palette.mode]
  );
  const loaderOuterColor = useMemo<NormalizedColor>(
    () =>
      parseColorToNormalized(
        theme.palette.primary.light,
        loaderOuterFallback
      ),
    [theme.palette.primary.light, loaderOuterFallback]
  );

  useEffect(() => {
    if (loaderData || typeof window === 'undefined') return;
    let cancelled = false;

    fetch(LOADER_SRC)
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled) setLoaderData(data);
      })
      .catch(() => {
        /* noop */
      });

    return () => {
      cancelled = true;
    };
  }, [loaderData]);

  useEffect(() => {
    if (!componentDefined || !loaderData) return;
    const player = loaderRef.current as unknown as {
      load?: (data: unknown) => void;
      play?: () => void;
    } | null;
    if (!player || typeof player.load !== 'function') return;

    const updated = JSON.parse(JSON.stringify(loaderData));
    if (Array.isArray(updated.layers)) {
      updated.layers.forEach((layer: any) => {
        if (!Array.isArray(layer?.shapes)) return;
        layer.shapes.forEach((shape: any) => {
          if (!shape || shape.ty !== 'st' || !shape.c) return;
          const widthValue =
            typeof shape.w?.k === 'number'
              ? shape.w.k
              : Array.isArray(shape.w?.k)
              ? shape.w.k[0]
              : typeof shape.w?.k === 'object' && shape.w?.k !== null
              ? shape.w.k.s ?? shape.w.k[0]
              : 0;
          const color =
            widthValue && widthValue <= 12 ? loaderInnerColor : loaderOuterColor;
          shape.c.k = [...color];
        });
      });
    }

    try {
      player.load(updated);
      player.play?.();
    } catch {
      /* noop */
    }
  }, [componentDefined, loaderData, loaderInnerColor, loaderOuterColor]);

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
            ref={loaderRef as unknown as React.RefObject<HTMLElement>}
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
            }}
          >
            <SajedLogo
              titleAccess="لوگو سامانه"
              role="img"
              sx={{
                width: '70%',
                height: '70%',
                color: logoColor,
                transition: 'color 0.3s ease',
              }}
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
