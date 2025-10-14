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
  useTheme,
  useMediaQuery,
  alpha,
} from '@mui/material';
import { MapItem } from '@/store/slices/tabularResourcesSlice';

interface MapsModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (mapData: Omit<MapItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  map?: MapItem | null;
  categories: any;
  fields: any;
}

const MapsModal: React.FC<MapsModalProps> = ({
  open,
  onClose,
  onSave,
  map,
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
      const wr = 255;
      const wg = 255;
      const wb = 255;
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

  const inputRootSx = useMemo(() => ({
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
  }), [theme.palette.primary.main]);

  const textFieldSx = useMemo(() => ({
    '& .MuiOutlinedInput-root': {
      ...inputRootSx,
      borderRadius: 2,
    },
  }), [inputRootSx]);

  const [formData, setFormData] = useState<Partial<MapItem>>({
    mapCode: '',
    title: '',
    type: 'topographic',
    scale: '',
    area: '',
    coordinates: {
      north: 0,
      south: 0,
      east: 0,
      west: 0,
    },
    datum: '',
    projection: '',
    securityClassification: 'public',
    source: '',
    lastUpdated: new Date().toISOString().split('T')[0],
    version: '1.0',
    format: 'digital',
    status: 'active',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (map) {
      setFormData(map);
    } else {
      setFormData({
        mapCode: '',
        title: '',
        type: 'topographic',
        scale: '',
        area: '',
        coordinates: {
          north: 0,
          south: 0,
          east: 0,
          west: 0,
        },
        datum: '',
        projection: '',
        securityClassification: 'public',
        source: '',
        lastUpdated: new Date().toISOString().split('T')[0],
        version: '1.0',
        format: 'digital',
        status: 'active',
      });
    }
    setErrors({});
  }, [map, open]);

  const handleChange = (field: keyof MapItem, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleCoordinateChange = (coordinate: keyof MapItem['coordinates'], value: number) => {
    setFormData(prev => ({
      ...prev,
      coordinates: {
        ...(prev.coordinates || {}),
        [coordinate]: value,
      } as MapItem['coordinates'],
    }));
    if (errors.coordinates) {
      setErrors(prev => ({ ...prev, coordinates: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.mapCode?.trim()) {
      newErrors.mapCode = 'کد نقشه الزامی است';
    }

    if (!formData.title?.trim()) {
      newErrors.title = 'عنوان نقشه الزامی است';
    }

    if (!formData.area?.trim()) {
      newErrors.area = 'منطقه الزامی است';
    }

    if (formData.coordinates) {
      if (formData.coordinates.north <= formData.coordinates.south) {
        newErrors.coordinates = 'مختصات شمالی باید بزرگتر از مختصات جنوبی باشد';
      }
      if (formData.coordinates.east <= formData.coordinates.west) {
        newErrors.coordinates = 'مختصات شرقی باید بزرگتر از مختصات غربی باشد';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    onSave(formData as Omit<MapItem, 'id' | 'createdAt' | 'updatedAt'>);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
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
          {map ? 'ویرایش نقشه' : 'افزودن نقشه جدید'}
        </Typography>
      </DialogTitle>

      <DialogContent
        sx={{
          backgroundColor: softSurface,
          p: isMobile ? 2 : 3,
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="کد نقشه"
              value={formData.mapCode || ''}
              onChange={(e) => handleChange('mapCode', e.target.value)}
              error={!!errors.mapCode}
              helperText={errors.mapCode}
              sx={textFieldSx}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="عنوان نقشه"
              value={formData.title || ''}
              onChange={(e) => handleChange('title', e.target.value)}
              error={!!errors.title}
              helperText={errors.title}
              sx={textFieldSx}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="نوع نقشه"
              value={formData.type || ''}
              onChange={(e) => handleChange('type', e.target.value)}
              sx={textFieldSx}
            >
              <MenuItem value="topographic">توپوگرافی</MenuItem>
              <MenuItem value="thematic">موضوعی</MenuItem>
              <MenuItem value="strategic">راهبردی</MenuItem>
              <MenuItem value="operational">عملیاتی</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="مقیاس"
              value={formData.scale || ''}
              onChange={(e) => handleChange('scale', e.target.value)}
              placeholder="1:50000"
              sx={textFieldSx}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="منطقه"
              value={formData.area || ''}
              onChange={(e) => handleChange('area', e.target.value)}
              error={!!errors.area}
              helperText={errors.area}
              sx={textFieldSx}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: theme.palette.primary.main, mb: 1 }}>
              مختصات جغرافیایی
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  label="شمال"
                  type="number"
                  value={formData.coordinates?.north ?? 0}
                  onChange={(e) => handleCoordinateChange('north', parseFloat(e.target.value) || 0)}
                  sx={textFieldSx}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  label="جنوب"
                  type="number"
                  value={formData.coordinates?.south ?? 0}
                  onChange={(e) => handleCoordinateChange('south', parseFloat(e.target.value) || 0)}
                  sx={textFieldSx}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  label="شرق"
                  type="number"
                  value={formData.coordinates?.east ?? 0}
                  onChange={(e) => handleCoordinateChange('east', parseFloat(e.target.value) || 0)}
                  sx={textFieldSx}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  label="غرب"
                  type="number"
                  value={formData.coordinates?.west ?? 0}
                  onChange={(e) => handleCoordinateChange('west', parseFloat(e.target.value) || 0)}
                  sx={textFieldSx}
                />
              </Grid>
            </Grid>
            {errors.coordinates && (
              <Typography color="error" variant="caption">
                {errors.coordinates}
              </Typography>
            )}
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="دیتوم"
              value={formData.datum || ''}
              onChange={(e) => handleChange('datum', e.target.value)}
              sx={textFieldSx}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="سیستم تصویر"
              value={formData.projection || ''}
              onChange={(e) => handleChange('projection', e.target.value)}
              sx={textFieldSx}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="طبقه‌بندی امنیتی"
              value={formData.securityClassification || 'public'}
              onChange={(e) => handleChange('securityClassification', e.target.value)}
              sx={textFieldSx}
            >
              <MenuItem value="public">عمومی</MenuItem>
              <MenuItem value="restricted">محدود</MenuItem>
              <MenuItem value="confidential">محرمانه</MenuItem>
              <MenuItem value="secret">سری</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="فرمت نقشه"
              value={formData.format || 'digital'}
              onChange={(e) => handleChange('format', e.target.value)}
              sx={textFieldSx}
            >
              <MenuItem value="digital">دیجیتال</MenuItem>
              <MenuItem value="paper">کاغذی</MenuItem>
              <MenuItem value="both">هر دو</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="منبع"
              value={formData.source || ''}
              onChange={(e) => handleChange('source', e.target.value)}
              sx={textFieldSx}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="نسخه"
              value={formData.version || ''}
              onChange={(e) => handleChange('version', e.target.value)}
              sx={textFieldSx}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="date"
              label="آخرین به‌روزرسانی"
              value={formData.lastUpdated || ''}
              onChange={(e) => handleChange('lastUpdated', e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={textFieldSx}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="وضعیت"
              value={formData.status || 'active'}
              onChange={(e) => handleChange('status', e.target.value)}
              sx={textFieldSx}
            >
              <MenuItem value="active">فعال</MenuItem>
              <MenuItem value="archived">بایگانی</MenuItem>
              <MenuItem value="deprecated">منسوخ</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions
        sx={{
          backgroundColor: softSurface,
          borderTop: (theme) => `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
          p: isMobile ? 2 : 3,
          gap: 1,
          justifyContent: 'flex-end',
        }}
      >
        <Button
          onClick={onClose}
          sx={{
            borderRadius: '12px',
            minWidth: 100,
            backgroundColor: 'rgba(148, 163, 184, 0.1)',
            backdropFilter: 'blur(10px)',
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
          لغو
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          sx={{
            borderRadius: '12px',
            minWidth: 120,
            backgroundColor: theme.palette.primary.main,
            color: 'white',
            fontWeight: 600,
            border: '2px solid rgba(255, 255, 255, 0.3)',
            boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
              transform: 'translateY(-2px)',
              boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.4)}`,
            },
            '&:disabled': {
              backgroundColor: alpha(theme.palette.primary.main, 0.2),
              color: 'rgba(255,255,255,0.7)',
              transform: 'none',
              boxShadow: 'none',
            },
          }}
        >
          {map ? 'ویرایش' : 'افزودن'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MapsModal;
