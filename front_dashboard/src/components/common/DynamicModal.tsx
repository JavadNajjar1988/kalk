import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Alert, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';

interface DynamicModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Record<string, any>) => void | Promise<void>;
  title?: string;
}

const DynamicModal: React.FC<DynamicModalProps> = ({ open, onClose, onSave, title }) => {
  const theme = useTheme();
  const accent = theme.palette.success.main;
  const dialogBackground = `linear-gradient(135deg, ${alpha(accent, 0.08)}, ${alpha(accent, 0.04)})`;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 3,
          backgroundColor: theme.palette.background.paper,
          backgroundImage: dialogBackground,
          border: `1px solid ${alpha(accent, 0.24)}`,
          boxShadow: `0 20px 60px ${alpha(accent, 0.18)}`,
        },
      }}
    >
      <DialogTitle sx={{ borderBottom: `1px solid ${alpha(accent, 0.2)}`, backgroundColor: alpha(accent, 0.08) }}>
        {title || 'فرم'}
      </DialogTitle>
      <DialogContent dividers sx={{ borderColor: alpha(accent, 0.16), backgroundColor: 'transparent' }}>
        <Alert severity="warning">این مودال به نسخه سبک تبدیل شده است.</Alert>
      </DialogContent>
      <DialogActions sx={{ borderTop: `1px solid ${alpha(accent, 0.2)}`, backgroundColor: alpha(accent, 0.04), px: 3, py: 2 }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          color="inherit"
          sx={{ borderRadius: 2, borderColor: alpha(accent, 0.35) }}
        >
          انصراف
        </Button>
        <Button 
          variant="contained" 
          color="success"
          onClick={() => onSave({})}
          sx={{ borderRadius: 2 }}
        >
          ذخیره
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DynamicModal;
