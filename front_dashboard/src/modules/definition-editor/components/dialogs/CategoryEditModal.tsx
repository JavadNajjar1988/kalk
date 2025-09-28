import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControlLabel,
  Switch,
  Box,
  Typography,
  Divider,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from '@mui/material';
import { DefinitionCategory } from '../../types';
import ColorPicker from '../ColorPicker';

interface CategoryEditModalProps {
  open: boolean;
  category?: DefinitionCategory;
  onClose: () => void;
  onSubmit: (data: Partial<DefinitionCategory>) => void;
}

const CategoryEditModal: React.FC<CategoryEditModalProps> = ({ open, category, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [englishName, setEnglishName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [maxLevels, setMaxLevels] = useState<number>(3);
  const [order, setOrder] = useState<number>(1);
  const [isActive, setIsActive] = useState<boolean>(true);

  const [errors, setErrors] = useState<{ [k: string]: string }>({});

  const colorInputRef = useRef<HTMLInputElement | null>(null);

  const iconOptions = useMemo(() => (
    [
      { value: 'folder', label: 'پوشه' },
      { value: 'map', label: 'نقشه' },
      { value: 'star', label: 'ستاره' },
      { value: 'users', label: 'کاربران' },
      { value: 'truck', label: 'کامیون' },
      { value: 'flag', label: 'پرچم' },
      { value: 'shield-alt', label: 'سپر' },
      { value: 'globe', label: 'کره زمین' },
      { value: 'clock', label: 'ساعت' },
      { value: 'code', label: 'کد' },
      { value: 'building', label: 'ساختمان' },
      { value: 'graduation-cap', label: 'کلاه فارغ‌التحصیلی' },
      { value: 'alert-triangle', label: 'هشدار' },
      { value: 'lock', label: 'قفل' },
      { value: 'box', label: 'جعبه' },
    ]
  ), []);

  useEffect(() => {
    if (category) {
      setName(category.name || '');
      setEnglishName(category.englishName || '');
      setDescription(category.description || '');
      setIcon(category.icon || '');
      setColor(category.color || '#3B82F6');
      setMaxLevels(category.maxLevels || 1);
      setOrder(category.order || 1);
      setIsActive(Boolean(category.isActive));
    }
  }, [category, open]);

  const validate = (): boolean => {
    const newErrors: { [k: string]: string } = {};
    if (!name.trim()) newErrors.name = 'نام الزامی است';
    if (!englishName.trim()) newErrors.englishName = 'نام انگلیسی الزامی است';
    if (!Number.isFinite(maxLevels) || maxLevels < 1) newErrors.maxLevels = 'حداقل 1';
    if (!Number.isFinite(order) || order < 1) newErrors.order = 'حداقل 1';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({ name, englishName, description, icon, color, maxLevels, order, isActive });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>ویرایش دسته‌بندی</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          {/* نام‌ها */}
          <Grid item xs={12} md={6}>
            <TextField
              label="نام دسته‌بندی"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={Boolean(errors.name)}
              helperText={errors.name}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="نام انگلیسی"
              fullWidth
              value={englishName}
              onChange={(e) => setEnglishName(e.target.value.replace(/[^a-zA-Z ]/g, ''))}
              error={Boolean(errors.englishName)}
              helperText={errors.englishName}
            />
          </Grid>

          {/* توضیحات */}
          <Grid item xs={12}>
            <TextField
              label="توضیحات"
              fullWidth
              multiline
              minRows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>

          {/* رنگ، آیکون، حداکثر سطح، ترتیب */}
          <Grid item xs={12} md={3}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>رنگ دسته‌بندی</Typography>
            <ColorPicker value={color} onChange={setColor} />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>آیکون</InputLabel>
              <Select label="آیکون" value={icon || 'folder'} onChange={(e) => setIcon(e.target.value as string)}>
                {iconOptions.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <i className={`fas fa-${opt.value}`} />
                      <span style={{ marginInlineStart: 8 }}>{opt.label}</span>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="حداکثر سطوح"
              type="number"
              fullWidth
              value={maxLevels}
              onChange={(e) => setMaxLevels(parseInt(e.target.value, 10) || 1)}
              error={Boolean(errors.maxLevels)}
              helperText={errors.maxLevels || 'تعداد سطح مجاز'}
              inputProps={{ min: 1, max: 200 }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="ترتیب نمایش"
              type="number"
              fullWidth
              value={order}
              onChange={(e) => setOrder(parseInt(e.target.value, 10) || 1)}
              error={Boolean(errors.order)}
              helperText={errors.order || 'نمایش در لیست'}
              inputProps={{ min: 0 }}
            />
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />} label="فعال" />
          </Grid>

          {/* پیش‌نمایش */}
          <Grid item xs={12}>
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2" gutterBottom>پیش‌نمایش:</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    backgroundColor: color,
                    boxShadow: `0 2px 8px ${color}40`
                  }}
                >
                  <i className={`fas fa-${icon || 'folder'}`} />
                </Box>
                <Box>
                  <Typography variant="body1" fontWeight="medium">{name || 'نام دسته‌بندی'}</Typography>
                  <Typography variant="body2" color="text.secondary">{englishName || 'English Name'}</Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">انصراف</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!name.trim() || !englishName.trim() || !!errors.name || !!errors.englishName || !!errors.maxLevels || !!errors.order}>بروزرسانی</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CategoryEditModal;


