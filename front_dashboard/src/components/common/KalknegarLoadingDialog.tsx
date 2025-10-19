import React from 'react';
import {
  Dialog,
  Box,
  Typography,
  CircularProgress,
  Avatar,
  useTheme,
  alpha,
  Fade,
  useMediaQuery,
} from '@mui/material';
import {
  MilitaryTech,
} from '@mui/icons-material';

interface KalknegarLoadingDialogProps {
  open: boolean;
}

const KalknegarLoadingDialog: React.FC<KalknegarLoadingDialogProps> = ({
  open,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // همسان با FieldEditDialog: سطح نرم و تخت براساس رنگ اصلی
  const getSoftSurface = () => {
    const primary = (theme.palette.primary.main || '#4a90e2').toLowerCase();
    const hex = primary.replace('#', '');
    if (hex.includes('10b981') || hex.includes('4caf50') || hex.includes('2e7d32')) return '#f0f4f3'; // green
    if (hex.includes('4a90e2') || hex.includes('1976d2') || hex.includes('2196f3')) return '#f0f4f8'; // blue
    if (hex.includes('ef4444') || hex.includes('f44336') || hex.includes('d32f2f')) return '#fbf1f0'; // red
    if (hex.includes('6b21a8') || hex.includes('9c27b0') || hex.includes('673ab7')) return '#22262d'; // purple (dark)
    if (hex.includes('f59e0b') || hex.includes('ff9800') || hex.includes('fb8c00')) return '#fbf1f1'; // orange

    const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
    const hexToRgb = (h: string) => {
      const n = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
      const r = parseInt(n.substring(0, 2), 16);
      const g = parseInt(n.substring(2, 4), 16);
      const b = parseInt(n.substring(4, 6), 16);
      return { r, g, b };
    };
    const rgbToHex = (r: number, g: number, b: number) =>
      `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`;
    const blendWithWhite = (h: string, primaryWeight = 0.10) => {
      const { r, g, b } = hexToRgb(h);
      const wr = 255, wg = 255, wb = 255;
      const w = 1 - primaryWeight;
      const br = wr * w + r * primaryWeight;
      const bg = wg * w + g * primaryWeight;
      const bb = wb * w + b * primaryWeight;
      return rgbToHex(br, bg, bb);
    };
    if (/^[0-9a-f]{3,6}$/.test(hex)) {
      return blendWithWhite(hex, 0.10);
    }
    try {
      const fallback = (theme.palette.primary.light || '#90caf9').toLowerCase().replace('#', '');
      return blendWithWhite(fallback, 0.08);
    } catch {
      return '#f5f7fa';
    }
  };

  return (
    <Dialog
      open={open}
      disableEscapeKeyDown
      fullWidth
      maxWidth={isMobile ? 'xs' : 'sm'}
      fullScreen={isMobile}
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: isMobile ? 0 : '20px',
          backgroundColor: (theme) => alpha(theme.palette.primary.light, 0.10),
          backdropFilter: 'blur(20px)',
          border: (theme) => `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
          boxShadow: (theme) => `0 20px 60px ${alpha(theme.palette.primary.light, 0.3)}, inset 0 1px 0 rgba(255, 255, 255, 0.8)`,
          overflow: 'hidden',
          position: 'relative',
        },
        '& .MuiBackdrop-root': {
          backgroundColor: (theme) => `${alpha(theme.palette.primary.light, 0.08)}`,
          backdropFilter: 'blur(4px)',
        },
      }}
      aria-labelledby="kalknegar-loading-dialog-title"
      aria-describedby="kalknegar-loading-dialog-description"
    >
      <Box sx={{ p: isMobile ? 2 : 4, textAlign: 'center', backgroundColor: getSoftSurface() }}>
        <Fade in={open} timeout={800}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            {/* آیکون کالک نگار با انیمیشن */}
            <Box
              sx={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CircularProgress
                size={isMobile ? 72 : 100}
                thickness={2}
                sx={{
                  color: theme.palette.primary.main,
                  position: 'absolute',
                  animation: 'spin 2s linear infinite',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                  },
                }}
              />
              <Avatar
                sx={{
                  width: isMobile ? 56 : 80,
                  height: isMobile ? 56 : 80,
                  bgcolor: (theme) => theme.palette.primary.main,
                  boxShadow: (theme) => `0 4px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  animation: 'pulse 2s ease-in-out infinite',
                  '@keyframes pulse': {
                    '0%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.05)' },
                    '100%': { transform: 'scale(1)' },
                  },
                }}
              >
                <MilitaryTech sx={{ fontSize: isMobile ? 28 : 40, color: 'white' }} />
              </Avatar>
            </Box>

            {/* عنوان */}
            <Typography
              variant={isMobile ? 'h5' : 'h4'}
              sx={{
                fontWeight: 700,
                color: (theme) => theme.palette.primary.main,
                mb: 1,
              }}
            >
              کالک نگار
            </Typography>

            {/* پیام لودینگ */}
            <Typography
              variant={isMobile ? 'body1' : 'h6'}
              sx={{
                color: 'text.primary',
                fontWeight: 500,
                mb: 2,
              }}
            >
              در حال راه‌اندازی کالک نگار...
            </Typography>

            {/* توضیحات */}
            <Typography
              variant={isMobile ? 'body2' : 'body1'}
              sx={{
                color: 'text.secondary',
                lineHeight: 1.6,
                maxWidth: 360,
                mx: 'auto',
              }}
            >
              لطفاً صبر کنید تا تمامی ماژول‌ها و امکانات کالک نگار بارگذاری شوند
            </Typography>

            {/* نوار پیشرفت متحرک */}
            <Box
              sx={{
                width: '100%',
                height: 4,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                borderRadius: 2,
                overflow: 'hidden',
                mt: 2,
              }}
            >
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  background: (theme) => theme.palette.primary.main,
                  borderRadius: 2,
                  animation: 'loading 2s ease-in-out infinite',
                  '@keyframes loading': {
                    '0%': { transform: 'translateX(-100%)' },
                    '50%': { transform: 'translateX(0%)' },
                    '100%': { transform: 'translateX(100%)' },
                  },
                }}
              />
            </Box>
          </Box>
        </Fade>
      </Box>
    </Dialog>
  );
};

export default KalknegarLoadingDialog;
