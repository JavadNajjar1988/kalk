import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Avatar,
  useTheme,
  alpha,
  Fade,
  useMediaQuery,
} from '@mui/material';
import {
  MilitaryTech,
  PlayArrow,
  Close,
} from '@mui/icons-material';

interface KalknegarLaunchDialogProps {
  open: boolean;
  onClose: () => void;
  onLaunch: () => void;
}

const KalknegarLaunchDialog: React.FC<KalknegarLaunchDialogProps> = ({
  open,
  onClose,
  onLaunch,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Soft flat background based on primary palette (same as FieldEditDialog)
  const getSoftSurface = () => {
    const primary = (theme.palette.primary.main || '#4a90e2').toLowerCase();
    const hex = primary.replace('#', '');
    // 1) Exact/brand buckets
    if (hex.includes('10b981') || hex.includes('4caf50') || hex.includes('2e7d32')) return '#f0f4f3'; // green
    if (hex.includes('4a90e2') || hex.includes('1976d2') || hex.includes('2196f3')) return '#f0f4f8'; // blue
    if (hex.includes('ef4444') || hex.includes('f44336') || hex.includes('d32f2f')) return '#fbf1f0'; // red
    if (hex.includes('6b21a8') || hex.includes('9c27b0') || hex.includes('673ab7')) return '#22262d'; // purple (dark)
    if (hex.includes('f59e0b') || hex.includes('ff9800') || hex.includes('fb8c00')) return '#fbf1f1'; // orange

    // 2) Generic: create a white-tinted version of primary (solid, 100% opacity)
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
      const wr = 255, wg = 255, wb = 255; // white
      const w = 1 - primaryWeight;
      const br = wr * w + r * primaryWeight;
      const bg = wg * w + g * primaryWeight;
      const bb = wb * w + b * primaryWeight;
      return rgbToHex(br, bg, bb);
    };
    if (/^[0-9a-f]{3,6}$/.test(hex)) {
      return blendWithWhite(hex, 0.10); // 10% رنگ اصلی + 90% سفید (تخت، 100% opacity)
    }
    // Fallback neutral tinted from theme primary.light if available
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
      onClose={onClose}
      maxWidth={isMobile ? "xs" : "sm"}
      fullWidth
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
          '&::before': {
            content: 'none',
          }
        },
        '& .MuiBackdrop-root': {
          backgroundColor: (theme) => `${alpha(theme.palette.primary.light, 0.08)}`,
          backdropFilter: 'blur(4px)',
        },
      }}
      aria-labelledby="kalknegar-launch-dialog-title"
      aria-describedby="kalknegar-launch-dialog-description"
    >
      <DialogTitle
        sx={{
          backgroundColor: getSoftSurface(),
          backdropFilter: 'none',
          borderBottom: (theme) => `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
          textAlign: 'center',
          py: isMobile ? 2 : 3,
          px: isMobile ? 2 : 3,
        }}
        id="kalknegar-launch-dialog-title"
      >
        <Fade in={open} timeout={500}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                width: isMobile ? 60 : 80,
                height: isMobile ? 60 : 80,
                bgcolor: (theme) => theme.palette.primary.main,
                boxShadow: (theme) => `0 4px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
                mb: 1,
                border: '2px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              <MilitaryTech sx={{ fontSize: isMobile ? 30 : 40, color: 'white' }} />
            </Avatar>
            <Typography
              variant={isMobile ? "h5" : "h4"}
              sx={{
                fontWeight: 700,
                color: (theme) => theme.palette.primary.main,
              }}
            >
              کالک نگار
            </Typography>
          </Box>
        </Fade>
      </DialogTitle>

      <DialogContent sx={{ p: 0, backgroundColor: getSoftSurface() }} id="kalknegar-launch-dialog-description">
        <Box sx={{ 
          p: isMobile ? 2 : 4, 
          minHeight: isMobile ? 200 : 300,
          textAlign: 'center',
          pt: isMobile ? 1 : undefined
        }}>
          <Typography
            variant="h6"
            sx={{
              mb: 2,
              color: 'text.primary',
              fontWeight: 500,
              lineHeight: 1.6,
            }}
          >
            آیا می‌خواهید نرم‌افزار کالک نگار را راه‌اندازی کنید؟
          </Typography>
          
          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              lineHeight: 1.8,
              maxWidth: 400,
              mx: 'auto',
            }}
          >
            کالک نگار یک ابزار پیشرفته برای طراحی و مدیریت سناریوهای نظامی است. 
            با راه‌اندازی این نرم‌افزار، دسترسی کامل به تمامی امکانات طراحی و ویرایش سناریوها خواهید داشت.
          </Typography>

          <Box
            sx={{
              mt: 3,
              p: 2,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.info.main, 0.1),
              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: 'info.main',
                fontWeight: 500,
              }}
            >
              💡 پس از راه‌اندازی، تمامی تغییرات شما به صورت خودکار ذخیره خواهد شد
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          backgroundColor: getSoftSurface(),
          backdropFilter: 'none',
          borderTop: (theme) => `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
          p: isMobile ? 2 : 3,
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          startIcon={<Close />}
          sx={{
            borderRadius: '12px',
            px: isMobile ? 2 : 3,
            py: isMobile ? 1 : 1.5,
            backgroundColor: 'rgba(148, 163, 184, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            color: '#64748B',
            fontWeight: 600,
            fontSize: isMobile ? '0.8rem' : 'inherit',
            '&:hover': {
              backgroundColor: 'rgba(148, 163, 184, 0.15)',
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(148, 163, 184, 0.2)',
            },
          }}
          aria-label="انصراف و بستن"
        >
          {isMobile ? 'انصراف' : 'انصراف'}
        </Button>
        
        <Button
          onClick={onLaunch}
          variant="contained"
          startIcon={<PlayArrow />}
          sx={{
            borderRadius: '12px',
            px: isMobile ? 2 : 4,
            py: isMobile ? 1 : 1.5,
            backgroundColor: (theme) => theme.palette.primary.main,
            color: 'white',
            fontWeight: 600,
            border: '2px solid rgba(255, 255, 255, 0.3)',
            boxShadow: (theme) => `0 4px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
            fontSize: isMobile ? '0.8rem' : 'inherit',
            '&:hover': {
              backgroundColor: (theme) => theme.palette.primary.dark,
              transform: 'translateY(-2px)',
              boxShadow: (theme) => `0 8px 24px ${alpha(theme.palette.primary.main, 0.4)}`,
            },
            transition: 'all 0.3s ease',
          }}
          aria-label="راه‌اندازی کالک نگار"
        >
          {isMobile ? 'راه‌اندازی' : 'راه‌اندازی کالک نگار'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default KalknegarLaunchDialog;
