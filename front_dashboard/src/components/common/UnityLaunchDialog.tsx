import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  CircularProgress,
  useTheme,
  alpha,
  useMediaQuery,
} from '@mui/material';
import {
  PlayArrow,
  Close,
  ThreeDRotation,
  ContentCopy,
} from '@mui/icons-material';
import type { Scenario } from '@/types';

interface UnityLaunchDialogProps {
  open: boolean;
  scenario?: Scenario | null;
  onClose: () => void;
  onLaunch: () => void;
  isLaunching: boolean;
  error?: string | null;
  fallbackLink?: string | null;
}

const UnityLaunchDialog: React.FC<UnityLaunchDialogProps> = ({
  open,
  scenario,
  onClose,
  onLaunch,
  isLaunching,
  error,
  fallbackLink,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCopied(false);
  }, [fallbackLink, open]);

  const handleCopyLink = async () => {
    if (!fallbackLink) {
      return;
    }
    try {
      await navigator.clipboard.writeText(fallbackLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (copyError) {
      console.error('Clipboard copy failed', copyError);
    }
  };

  const renderCopyField = () => {
    if (!fallbackLink) {
      return null;
    }

    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          لینک دستی اجرا
        </Typography>
        <TextField
          fullWidth
          value={fallbackLink}
          size="small"
          InputProps={{
            readOnly: true,
            sx: { fontFamily: 'monospace', direction: 'ltr' },
            endAdornment: (
              <InputAdornment position="end">
                <Tooltip title={copied ? 'کپی شد' : 'کپی لینک'}>
                  <span>
                    <IconButton onClick={handleCopyLink} disabled={!fallbackLink}>
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </InputAdornment>
            ),
          }}
        />
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      fullScreen={isMobile}
      aria-labelledby="unity-launch-dialog-title"
      aria-describedby="unity-launch-dialog-description"
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: isMobile ? 0 : '20px',
          backgroundColor: alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
        },
      }}
    >
      <DialogTitle
        id="unity-launch-dialog-title"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
        }}
      >
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: '14px',
            backgroundColor: alpha(theme.palette.primary.main, 0.15),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ThreeDRotation color="primary" />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            اجرای سه‌بعدی سناریو
          </Typography>
          <Typography variant="body2" color="text.secondary">
            اطلاعات سناریو به شبیه ساز ارسال می‌شود
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent
        id="unity-launch-dialog-description"
        sx={{ py: 3, px: isMobile ? 2 : 4 }}
      >
        <Box
          sx={{
            mb: 3,
            p: 2,
            borderRadius: 3,
            backgroundColor: alpha(theme.palette.primary.light, 0.08),
            border: `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
          }}
        >
          <Typography variant="subtitle2" color="text.secondary">
            سناریوی انتخاب‌شده
          </Typography>
          <Typography variant="h6" sx={{ mt: 1, fontWeight: 600 }}>
            {scenario?.name || '---'}
          </Typography>
          <Typography
            variant="body2"
            sx={{ mt: 0.5, direction: 'ltr', fontFamily: 'monospace' }}
            color="text.secondary"
          >
            ID: {scenario?.id || 'نامشخص'}
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          اطمینان حاصل کنید که شبیه ساز یا لانچر اختصاصی آن روی سیستم نصب شده و
          پروتکل سفارشی اجرا (Unity Bridge) در مرورگر ثبت شده باشد.
        </Alert>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Typography variant="body2" color="text.secondary">
          با کلیک روی «اجرای شبیه ساز»، یک لینک عمیق با اطلاعات سناریو ساخته می‌شود.
          اگر مرورگر پاپ‌آپ را مسدود کند می‌توانید لینک دستی را کپی کرده و به صورت
          مستقیم در لانچر باز کنید.
        </Typography>

        {renderCopyField()}
      </DialogContent>

      <DialogActions
        sx={{
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
          p: isMobile ? 2 : 3,
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1.5,
        }}
      >
        <Button
          onClick={onClose}
          startIcon={<Close />}
          disabled={isLaunching}
        >
          انصراف
        </Button>
        <Button
          onClick={onLaunch}
          variant="contained"
          startIcon={
            isLaunching ? (
              <CircularProgress color="inherit" size={20} />
            ) : (
              <PlayArrow />
            )
          }
          disabled={isLaunching || !scenario}
        >
          اجرای شبیه ساز
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UnityLaunchDialog;

