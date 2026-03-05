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
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

interface LogisticsModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  logistics?: any;
  categories: any[];
}

const initialFormData = {
  itemCode: '',
  name: '',
  category: '',
  quantity: 0,
  unit: '',
  minStock: 0,
  maxStock: 0,
  location: '',
  supplier: '',
  unitPrice: 0,
  totalValue: 0,
  status: 'available',
  lastRestocked: '',
};

const LogisticsModal: React.FC<LogisticsModalProps> = ({
  open,
  onClose,
  onSave,
  logistics,
  categories,
}) => {
  const theme = useTheme();
  const accent = theme.palette.success.main;
  const dialogBackground = `linear-gradient(135deg, ${alpha(accent, 0.08)}, ${alpha(accent, 0.04)})`;
  const inputSurface =
    theme.palette.mode === 'dark'
      ? alpha(theme.palette.background.default, 0.72)
      : alpha(theme.palette.common.white, 0.92);

  const [formData, setFormData] = useState<any>(initialFormData);

  useEffect(() => {
    if (logistics) {
      setFormData({ ...initialFormData, ...logistics });
    } else {
      setFormData(initialFormData);
    }
  }, [logistics, open]);

  const handleChange = (fieldId: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleSubmit = () => {
    const quantity = Number(formData.quantity || 0);
    const unitPrice = Number(formData.unitPrice || 0);
    onSave({
      ...formData,
      quantity,
      unitPrice,
      totalValue: quantity * unitPrice,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 3,
          backgroundColor: theme.palette.background.paper,
          backgroundImage: dialogBackground,
          border: `1px solid ${alpha(accent, 0.24)}`,
          boxShadow: `0 20px 60px ${alpha(accent, 0.18)}`,
        },
        '& .MuiOutlinedInput-root': {
          backgroundColor: inputSurface,
          '& fieldset': {
            borderColor: alpha(accent, 0.28),
          },
          '&:hover fieldset': {
            borderColor: alpha(accent, 0.45),
          },
          '&.Mui-focused fieldset': {
            borderColor: accent,
            boxShadow: `0 0 0 3px ${alpha(accent, 0.12)}`,
          },
        },
        '& .MuiInputLabel-root.Mui-focused': {
          color: accent,
        },
      }}
    >
      <DialogTitle
        sx={{
          borderBottom: `1px solid ${alpha(accent, 0.2)}`,
          backgroundColor: alpha(accent, 0.08),
          fontWeight: 700,
        }}
      >
        {logistics ? 'ویرایش آیتم لجستیک' : 'افزودن آیتم لجستیک'}
      </DialogTitle>
      <DialogContent
        dividers
        sx={{
          borderColor: alpha(accent, 0.16),
          backgroundColor: 'transparent',
        }}
      >
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="کد آیتم"
              value={formData.itemCode || ''}
              onChange={(e) => handleChange('itemCode', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="نام آیتم"
              value={formData.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              label="دسته‌بندی"
              value={formData.category || ''}
              onChange={(e) => handleChange('category', e.target.value)}
            >
              {categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.name}
                </MenuItem>
              ))}
              <MenuItem value="عمومی">عمومی</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="واحد"
              value={formData.unit || ''}
              onChange={(e) => handleChange('unit', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="number"
              label="موجودی"
              value={formData.quantity || 0}
              onChange={(e) => handleChange('quantity', Number(e.target.value))}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="number"
              label="حداقل موجودی"
              value={formData.minStock || 0}
              onChange={(e) => handleChange('minStock', Number(e.target.value))}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="number"
              label="حداکثر موجودی"
              value={formData.maxStock || 0}
              onChange={(e) => handleChange('maxStock', Number(e.target.value))}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="مکان"
              value={formData.location || ''}
              onChange={(e) => handleChange('location', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="تأمین‌کننده"
              value={formData.supplier || ''}
              onChange={(e) => handleChange('supplier', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="قیمت واحد"
              value={formData.unitPrice || 0}
              onChange={(e) => handleChange('unitPrice', Number(e.target.value))}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              label="وضعیت"
              value={formData.status || 'available'}
              onChange={(e) => handleChange('status', e.target.value)}
            >
              <MenuItem value="available">موجود</MenuItem>
              <MenuItem value="low-stock">کمبود موجودی</MenuItem>
              <MenuItem value="out-of-stock">تمام موجودی</MenuItem>
              <MenuItem value="ordered">سفارش داده‌شده</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions
        sx={{
          borderTop: `1px solid ${alpha(accent, 0.2)}`,
          backgroundColor: alpha(accent, 0.04),
          px: 3,
          py: 2,
          gap: 1,
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          color="inherit"
          sx={{
            borderRadius: 2,
            borderColor: alpha(accent, 0.35),
          }}
        >
          انصراف
        </Button>
        <Button variant="contained" color="success" onClick={handleSubmit} sx={{ borderRadius: 2, px: 3 }}>
          ذخیره
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LogisticsModal;
