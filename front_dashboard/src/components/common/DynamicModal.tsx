import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Alert } from '@mui/material';

interface DynamicModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Record<string, any>) => void | Promise<void>;
  title?: string;
}

const DynamicModal: React.FC<DynamicModalProps> = ({ open, onClose, onSave, title }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title || 'فرم'}</DialogTitle>
      <DialogContent>
        <Alert severity="warning">این مودال به نسخه سبک تبدیل شده است.</Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>انصراف</Button>
        <Button variant="contained" onClick={() => onSave({})}>ذخیره</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DynamicModal;
