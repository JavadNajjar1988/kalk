import React, { useState, useEffect, useMemo } from 'react';
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
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  Alert,
  useTheme,
  useMediaQuery,
  alpha,
} from '@mui/material';
import { PersonnelItem } from '@/store/slices/tabularResourcesSlice';

interface PersonnelModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<PersonnelItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  personnel?: PersonnelItem | null;
  categories: any[];
  fields: any[];
}

const PersonnelModal: React.FC<PersonnelModalProps> = ({
  open,
  onClose,
  onSave,
  personnel,
  categories,
  fields
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const softSurface = useMemo(() => {
    const primary = (theme.palette.primary.main || '#4a90e2').toLowerCase();
    const hex = primary.replace('#', '');
    if (hex.includes('10b981') || hex.includes('4caf50') || hex.includes('2e7d32')) return '#f0f4f3';
    if (hex.includes('4a90e2') || hex.includes('1976d2') || hex.includes('2196f3')) return '#f0f4f8';
    if (hex.includes('ef4444') || hex.includes('f44336') || hex.includes('d32f2f')) return '#fbf1f0';
    if (hex.includes('6b21a8') || hex.includes('9c27b0') || hex.includes('673ab7')) return '#22262d';
    if (hex.includes('f59e0b') || hex.includes('ff9800') || hex.includes('fb8c00')) return '#fbf1f1';

    const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
    const hexToRgb = (h: string) => {
      const normalized = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
      const r = parseInt(normalized.substring(0, 2), 16);
      const g = parseInt(normalized.substring(2, 4), 16);
      const b = parseInt(normalized.substring(4, 6), 16);
      return { r, g, b };
    };
    const rgbToHex = (r: number, g: number, b: number) =>
      `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`;
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
  }, [theme.palette.primary.main, theme.palette.primary.light]);

  const textFieldSx = useMemo(() => ({
    '& .MuiOutlinedInput-root': {
      backgroundColor: 'rgba(255, 255, 255, 0.92)',
      backdropFilter: 'blur(8px)',
      transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      '& fieldset': {
        borderColor: alpha(theme.palette.primary.main, 0.2),
      },
      '&:hover fieldset': {
        borderColor: alpha(theme.palette.primary.main, 0.35),
      },
      '&.Mui-focused fieldset': {
        borderWidth: 2,
        borderColor: alpha(theme.palette.primary.main, 0.6),
        boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
      },
    },
  }), [theme.palette.primary.main]);

  const backdropSx = useMemo(
    () => ({
      backgroundColor: 'rgba(15, 23, 42, 0.45)',
      backdropFilter: 'blur(6px)',
    }),
    []
  );

  const [formData, setFormData] = useState<Partial<PersonnelItem>>({
    personalCode: '',
    firstName: '',
    lastName: '',
    nationalId: '',
    rank: '',
    unit: '',
    position: '',
    phoneNumber: '',
    email: '',
    status: 'active',
    startDate: new Date().toISOString().split('T')[0],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (personnel) {
      setFormData(personnel);
    } else {
      setFormData({
        personalCode: '',
        firstName: '',
        lastName: '',
        nationalId: '',
        rank: '',
        unit: '',
        position: '',
        phoneNumber: '',
        email: '',
        status: 'active',
        startDate: new Date().toISOString().split('T')[0],
      });
    }
    setErrors({});
  }, [personnel, open]);

  const handleChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
    if (errors[fieldId]) {
      setErrors(prev => ({ ...prev, [fieldId]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.personalCode?.trim()) {
      newErrors.personalCode = 'کد پرسنلی الزامی است';
    }

    if (!formData.firstName?.trim()) {
      newErrors.firstName = 'نام الزامی است';
    }

    if (!formData.lastName?.trim()) {
      newErrors.lastName = 'نام خانوادگی الزامی است';
    }

    if (!formData.nationalId?.trim()) {
      newErrors.nationalId = 'کد ملی الزامی است';
    } else if (!/^\d{10}$/.test(formData.nationalId)) {
      newErrors.nationalId = 'کد ملی باید 10 رقم باشد';
    }

    if (!formData.rank?.trim()) {
      newErrors.rank = 'درجه الزامی است';
    }

    if (!formData.unit?.trim()) {
      newErrors.unit = 'یگان الزامی است';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'تاریخ شروع خدمت الزامی است';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'فرمت ایمیل صحیح نیست';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSave(formData as Omit<PersonnelItem, 'id' | 'createdAt' | 'updatedAt'>);
    }
  };

  const renderField = (field: any) => {
    switch (field.type) {
      case 'select': {
        const options = field.id === 'status' ? field.options : [];
        return (
          <TextField
            key={field.id}
            select
            fullWidth
            label={field.name}
            value={formData[field.id as keyof PersonnelItem] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            required={field.required}
            error={!!errors[field.id]}
            helperText={errors[field.id]}
            sx={textFieldSx}
          >
            {field.id === 'status' && options?.map((option: any) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        );
      }
      case 'date':
        return (
          <TextField
            key={field.id}
            fullWidth
            type="date"
            label={field.name}
            value={formData[field.id as keyof PersonnelItem] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            required={field.required}
            error={!!errors[field.id]}
            helperText={errors[field.id]}
            InputLabelProps={{ shrink: true }}
            sx={textFieldSx}
          />
        );
      case 'tel':
      case 'email':
        return (
          <TextField
            key={field.id}
            fullWidth
            type={field.type}
            label={field.name}
            value={formData[field.id as keyof PersonnelItem] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            required={field.required}
            error={!!errors[field.id]}
            helperText={errors[field.id]}
            sx={textFieldSx}
          />
        );
      default:
        return (
          <TextField
            key={field.id}
            fullWidth
            type={field.type}
            label={field.name}
            value={formData[field.id as keyof PersonnelItem] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            required={field.required}
            error={!!errors[field.id]}
            helperText={errors[field.id]}
            sx={textFieldSx}
          />
        );
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      slotProps={{
        backdrop: {
          sx: backdropSx,
        },
      }}
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: isMobile ? 0 : '20px',
          backgroundColor: (theme) => alpha(theme.palette.primary.light, 0.1),
          backdropFilter: 'blur(20px)',
          border: (theme) => `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
          boxShadow: (theme) => `0 20px 60px ${alpha(theme.palette.primary.light, 0.3)}, inset 0 1px 0 rgba(255, 255, 255, 0.8)`,
          overflow: 'hidden',
          position: 'relative',
          minHeight: isMobile ? '100vh' : 'auto',
          '&::before': {
            content: 'none',
          },
        },
        '& .MuiBackdrop-root': {
          backgroundColor: (theme) => `${alpha(theme.palette.primary.light, 0.08)}`,
          backdropFilter: 'blur(4px)',
        },
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: softSurface,
          borderBottom: (theme) => `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
          textAlign: 'center',
          py: isMobile ? 2 : 3,
          px: isMobile ? 2 : 3,
        }}
      >
        <Typography
          variant={isMobile ? 'h6' : 'h5'}
          sx={{
            fontWeight: 700,
            color: theme.palette.primary.main,
          }}
        >
          {personnel ? 'ویرایش اطلاعات شخص' : 'افزودن شخص جدید'}
        </Typography>
      </DialogTitle>

      <DialogContent
        sx={{
          backgroundColor: softSurface,
          p: isMobile ? 2 : 3,
        }}
      >
        {Object.keys(errors).length > 0 && (
          <Alert
            severity="error"
            sx={{
              mb: 2,
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
              borderRadius: '12px',
              color: theme.palette.error.dark,
            }}
          >
            لطفاً خطاهای فرم را اصلاح کنید
          </Alert>
        )}

        <Paper
          variant="outlined"
          sx={{
            p: isMobile ? 2 : 3,
            mt: 2,
            borderRadius: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
            boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.08)}`,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              mb: 2,
              color: theme.palette.primary.main,
              fontWeight: 600,
            }}
          >
            اطلاعات اصلی
          </Typography>
          <Grid container spacing={3}>
            {fields.map((field: any) => (
              <Grid item xs={12} sm={field.type === 'textarea' ? 12 : 6} key={field.id}>
                {renderField(field)}
              </Grid>
            ))}
          </Grid>
        </Paper>
      </DialogContent>

      <DialogActions
        sx={{
          backgroundColor: softSurface,
          borderTop: (theme) => `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
          p: isMobile ? 2 : 3,
          gap: 1,
        }}
      >
        <Button
          onClick={onClose}
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
        >
          انصراف
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          sx={{
            borderRadius: '12px',
            px: isMobile ? 2 : 4,
            py: isMobile ? 1 : 1.5,
            backgroundColor: theme.palette.primary.main,
            color: 'white',
            fontWeight: 600,
            border: '2px solid rgba(255, 255, 255, 0.3)',
            boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
            fontSize: isMobile ? '0.8rem' : 'inherit',
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
              transform: 'translateY(-2px)',
              boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.4)}`,
            },
          }}
        >
          {personnel ? 'ذخیره تغییرات' : 'افزودن شخص'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PersonnelModal;
