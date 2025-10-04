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

  return (
    <Dialog
      open={open}
      disableEscapeKeyDown
      PaperProps={{
        sx: {
          borderRadius: 4,
          background:
            `linear-gradient( to bottom right, ${alpha('#FFFFFF', 0.08)}, ${alpha('#FFFFFF', 0.02)} )`,
          backdropFilter: 'blur(28px) saturate(160%)',
          WebkitBackdropFilter: 'blur(28px) saturate(160%)',
          border: `1px solid ${alpha('#FFFFFF', 0.18)}`,
          boxShadow: 'inset 0 1px 0 rgba(112, 119, 218, 0.08), 0 8px 32px rgba(0,0,0,0.35)',
          outline: '1px solid transparent',
          overflow: 'hidden',
          position: 'relative',
          '::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(1200px 600px at -10% -20%, ${alpha('#FFFFFF', 0.08)} 0%, transparent 40%), radial-gradient(1000px 500px at 120% 120%, ${alpha('#FFFFFF', 0.06)} 0%, transparent 45%)`,
            pointerEvents: 'none',
          },
          minWidth: 400,
        }
      }}
    >
      <Box sx={{ p: 4, textAlign: 'center' }}>
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
                size={100}
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
                  width: 80,
                  height: 80,
                  bgcolor: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  boxShadow: theme.shadows[8],
                  animation: 'pulse 2s ease-in-out infinite',
                  '@keyframes pulse': {
                    '0%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.05)' },
                    '100%': { transform: 'scale(1)' },
                  },
                }}
              >
                <MilitaryTech sx={{ fontSize: 40, color: 'white' }} />
              </Avatar>
            </Box>

            {/* عنوان */}
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontFamily: 'Yekan, serif',
                mb: 1,
              }}
            >
              کالک نگار
            </Typography>

            {/* پیام لودینگ */}
            <Typography
              variant="h6"
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
              variant="body2"
              sx={{
                color: 'text.secondary',
                lineHeight: 1.6,
                maxWidth: 300,
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
                  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
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
