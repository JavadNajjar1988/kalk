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
  useMediaQuery,
  alpha,
} from '@mui/material';
import { Warning as WarningIcon, Delete as DeleteIcon, Cancel as CancelIcon, Inventory2 as InventoryAvatarIcon } from '@mui/icons-material';
import { EquipmentItem } from '@/store/slices/tabularResourcesSlice';

interface EquipmentDeleteConfirmModalProps {
  open: boolean;
  item: EquipmentItem | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
  isDeleting?: boolean;
}

const EquipmentDeleteConfirmModal: React.FC<EquipmentDeleteConfirmModalProps> = ({ open, item, onClose, onConfirm, isDeleting = false }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (!item) return null;

  const getSoftSurface = () => {
    const primary = (theme.palette.primary.main || '#4a90e2').toLowerCase();
    const hex = primary.replace('#', '');
    if (hex.includes('10b981') || hex.includes('4caf50') || hex.includes('2e7d32')) return '#f0f4f3';
    if (hex.includes('4a90e2') || hex.includes('1976d2') || hex.includes('2196f3')) return '#f0f4f8';
    if (hex.includes('ef4444') || hex.includes('f44336') || hex.includes('d32f2f')) return '#fbf1f0';
    if (hex.includes('6b21a8') || hex.includes('9c27b0') || hex.includes('673ab7')) return '#22262d';
    if (hex.includes('f59e0b') || hex.includes('ff9800') || hex.includes('fb8c00')) return '#fbf1f1';
    const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
    const hexToRgb = (h: string) => {
      const n = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
      const r = parseInt(n.substring(0, 2), 16);
      const g = parseInt(n.substring(2, 4), 16);
      const b = parseInt(n.substring(4, 6), 16);
      return { r, g, b };
    };
    const rgbToHex = (r: number, g: number, b: number) => `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`;
    const blendWithWhite = (h: string, primaryWeight = 0.1) => {
      const { r, g, b } = hexToRgb(h);
      const wr = 255, wg = 255, wb = 255;
      const w = 1 - primaryWeight;
      const br = wr * w + r * primaryWeight;
      const bg = wg * w + g * primaryWeight;
      const bb = wb * w + b * primaryWeight;
      return rgbToHex(br, bg, bb);
    };
    if (/^[0-9a-f]{3,6}$/.test(hex)) {
      return blendWithWhite(hex, 0.1);
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
      onClose={onClose}
      fullWidth
      maxWidth={isMobile ? 'xs' : 'sm'}
      fullScreen={isMobile}
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: isMobile ? 0 : '20px',
          backgroundColor: (theme) => alpha(theme.palette.primary.light, 0.1),
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
      aria-labelledby="equipment-delete-dialog-title"
      aria-describedby="equipment-delete-dialog-description"
    >
      <DialogTitle
        id="equipment-delete-dialog-title"
        sx={{
          backgroundColor: getSoftSurface(),
          borderBottom: (theme) => `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
          textAlign: 'center',
          py: isMobile ? 2 : 3,
          px: isMobile ? 2 : 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
          <WarningIcon color="error" sx={{ mr: 0.5 }} />
          <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight={700} color={(theme) => theme.palette.error.main}>
            تأیید حذف تجهیز
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent id="equipment-delete-dialog-description" sx={{ p: 0, backgroundColor: getSoftSurface() }}>
        <Box sx={{ p: isMobile ? 2 : 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: 2, bgcolor: (theme) => alpha(theme.palette.error.light, 0.06), border: (theme) => `1px solid ${alpha(theme.palette.error.light, 0.2)}` }}>
            <Avatar sx={{ width: 56, height: 56, bgcolor: (theme) => theme.palette.error.main }}>
              <InventoryAvatarIcon sx={{ color: '#fff' }} />
            </Avatar>
            <Box>
              <Typography variant="body1" fontWeight={600}>{item.name}</Typography>
              <Typography variant="body2" color="text.secondary">کد تجهیز: {item.equipmentCode}</Typography>
              {item.type && <Typography variant="body2" color="text.secondary">نوع: {item.type}</Typography>}
            </Box>
          </Box>

          <Typography variant="body1" sx={{ mt: 3, mb: 1.5 }}>
            آیا مطمئن هستید که می‌خواهید این تجهیز را حذف کنید؟ این عملیات غیرقابل بازگشت است.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ backgroundColor: getSoftSurface(), borderTop: (theme) => `1px solid ${alpha(theme.palette.primary.light, 0.2)}`, p: isMobile ? 2 : 3, gap: 1.5 }}>
        <Button onClick={onClose} variant="outlined" startIcon={<CancelIcon />} sx={{ borderRadius: '12px' }}>
          انصراف
        </Button>
        <Button onClick={() => onConfirm(item.id)} variant="contained" color="error" startIcon={<DeleteIcon />} disabled={isDeleting} sx={{ borderRadius: '12px' }}>
          {isDeleting ? 'در حال حذف...' : 'حذف'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EquipmentDeleteConfirmModal;


