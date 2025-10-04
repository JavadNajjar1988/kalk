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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          background:
            `linear-gradient( to bottom right, ${alpha('#FFFFFF', 0.08)}, ${alpha('#FFFFFF', 0.02)} )`,
          backdropFilter: 'blur(28px) saturate(160%)',
          WebkitBackdropFilter: 'blur(28px) saturate(160%)',
          border: `1px solid ${alpha('#FFFFFF', 0.18)}`,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.35)',
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
        }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 2 }}>
        <Fade in={open} timeout={500}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                boxShadow: theme.shadows[8],
                mb: 1,
              }}
            >
              <MilitaryTech sx={{ fontSize: 40, color: 'white' }} />
            </Avatar>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontFamily: 'Yekan, serif',
              }}
            >
              کالک نگار
            </Typography>
          </Box>
        </Fade>
      </DialogTitle>

      <DialogContent sx={{ textAlign: 'center', py: 3 }}>
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
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          startIcon={<Close />}
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1,
            fontWeight: 600,
            borderColor: alpha(theme.palette.text.secondary, 0.3),
            color: 'text.secondary',
            '&:hover': {
              borderColor: theme.palette.text.secondary,
              bgcolor: alpha(theme.palette.text.secondary, 0.05),
            },
          }}
        >
          انصراف
        </Button>
        
        <Button
          onClick={onLaunch}
          variant="contained"
          startIcon={<PlayArrow />}
          sx={{
            borderRadius: 2,
            px: 4,
            py: 1,
            fontWeight: 600,
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            boxShadow: theme.shadows[4],
            '&:hover': {
              background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
              boxShadow: theme.shadows[8],
              transform: 'translateY(-2px)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          راه‌اندازی کالک نگار
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default KalknegarLaunchDialog;
