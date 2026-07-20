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
  useTheme,
  useMediaQuery,
  alpha,
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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

  // سطح پس‌زمینه نرم همسان با FieldEditDialog
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
    const rgbToHex = (r: number, g: number, b: number) =>
      `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`;
    const blendWithWhite = (h: string, primaryWeight = 0.10) => {
      const { r, g, b } = hexToRgb(h);
      const wr = 255, wg = 255, wb = 255;
      const w = 1 - primaryWeight;
      const br = wr * w + r * primaryWeight;
      const bg = wg * w + g * primaryWeight;
      const bb = wb * w + b * primaryWeight;
      return rgbToHex(br, bg, bb);
    };
    if (/^[0-9a-f]{3,6}$/.test(hex)) {
      return blendWithWhite(hex, 0.10);
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
      maxWidth={isMobile ? 'xs' : 'md'}
      fullScreen={isMobile}
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: isMobile ? 0 : '20px',
          backgroundColor: (theme) => alpha(theme.palette.primary.light, 0.10),
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
      aria-labelledby="category-edit-dialog-title"
      aria-describedby="category-edit-dialog-description"
    >
      <DialogTitle 
        id="category-edit-dialog-title"
        sx={{
          backgroundColor: getSoftSurface(),
          borderBottom: (theme) => `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
          textAlign: 'center',
          py: isMobile ? 2 : 3,
          px: isMobile ? 2 : 3,
          fontWeight: 700,
          color: (theme) => theme.palette.primary.main,
        }}
      >
        ویرایش دسته‌بندی
      </DialogTitle>
      <DialogContent id="category-edit-dialog-description" sx={{ p: 0, backgroundColor: getSoftSurface() }}>
        <Box sx={{ p: isMobile ? 2 : 4 }}>
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
        </Box>
      </DialogContent>
      <DialogActions
        sx={{
          backgroundColor: getSoftSurface(),
          borderTop: (theme) => `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
          p: isMobile ? 2 : 3,
          justifyContent: 'flex-end',
          gap: 1.5,
        }}
      >
        <Button 
          onClick={onClose}
          sx={{
            borderRadius: '12px',
            px: isMobile ? 2 : 3,
            py: isMobile ? 1 : 1.5,
            backgroundColor: 'rgba(148, 163, 184, 0.1)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            color: '#64748B',
            fontWeight: 600,
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
          disabled={!name.trim() || !englishName.trim() || !!errors.name || !!errors.englishName || !!errors.maxLevels || !!errors.order}
          sx={{
            borderRadius: '12px',
            px: isMobile ? 2 : 4,
            py: isMobile ? 1 : 1.5,
            backgroundColor: (theme) => theme.palette.primary.main,
            color: 'white',
            fontWeight: 600,
            border: '2px solid rgba(255, 255, 255, 0.3)',
            boxShadow: (theme) => `0 4px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
            '&:hover': {
              backgroundColor: (theme) => theme.palette.primary.dark,
              transform: 'translateY(-2px)',
              boxShadow: (theme) => `0 8px 24px ${alpha(theme.palette.primary.main, 0.4)}`,
            },
          }}
        >
          بروزرسانی
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CategoryEditModal;


