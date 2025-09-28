import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  Box,
} from '@mui/material';
import { useTranslation } from '@/hooks/useTranslation';

interface RanksModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  rank?: any;
  categories: any[];
  fields: any[];
}

const RanksModal: React.FC<RanksModalProps> = ({
  open,
  onClose,
  onSave,
  rank,
  categories,
  fields
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (rank) {
      setFormData(rank);
    } else {
      const defaultData: any = {};
      fields.forEach(field => {
        if (field.type === 'select' && field.options?.length > 0) {
          defaultData[field.id] = field.options[0].value;
        } else {
          defaultData[field.id] = '';
        }
      });
      setFormData(defaultData);
    }
  }, [rank, fields, open]);

  const handleChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleSubmit = () => {
    onSave(formData);
  };

  const renderField = (field: any) => {
    switch (field.type) {
      case 'select':
        const options = field.id === 'category' ? categories : field.options || [];
        return (
          <TextField
            key={field.id}
            select
            fullWidth
            label={field.name}
            value={formData[field.id] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            required={field.required}
          >
            {options.map((option: any) => (
              <MenuItem key={option.value || option.id} value={option.value || option.id}>
                {option.label || option.name}
              </MenuItem>
            ))}
          </TextField>
        );
      case 'textarea':
        return (
          <TextField
            key={field.id}
            fullWidth
            multiline
            rows={3}
            label={field.name}
            value={formData[field.id] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            required={field.required}
          />
        );
      case 'number':
        return (
          <TextField
            key={field.id}
            fullWidth
            type="number"
            label={field.name}
            value={formData[field.id] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            required={field.required}
          />
        );
      case 'date':
        return (
          <TextField
            key={field.id}
            fullWidth
            type="date"
            label={field.name}
            value={formData[field.id] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            required={field.required}
            InputLabelProps={{ shrink: true }}
          />
        );
      default:
        return (
          <TextField
            key={field.id}
            fullWidth
            type={field.type}
            label={field.name}
            value={formData[field.id] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            required={field.required}
          />
        );
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {rank ? t('resources.ranks.editTitle') : t('resources.ranks.addTitle')}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Grid container spacing={3}>
            {fields.map((field: any) => (
              <Grid item xs={12} sm={field.type === 'textarea' ? 12 : 6} key={field.id}>
                {renderField(field)}
              </Grid>
            ))}
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button onClick={handleSubmit} variant="contained">
          {t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RanksModal;