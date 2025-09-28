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
  FormControl,
  InputLabel,
  Select,
  Box,
  Typography,
  Chip,
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
  categories,
  fields
}) => {
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
        ...prev.coordinates,
        [coordinate]: value,
      } as MapItem['coordinates']
    }));
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
    if (validateForm()) {
      onSave(formData as Omit<MapItem, 'id' | 'createdAt' | 'updatedAt'>);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {map ? 'ویرایش نقشه' : 'افزودن نقشه جدید'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="کد نقشه"
              value={formData.mapCode || ''}
              onChange={(e) => handleChange('mapCode', e.target.value)}
              error={!!errors.mapCode}
              helperText={errors.mapCode}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="عنوان نقشه"
              value={formData.title || ''}
              onChange={(e) => handleChange('title', e.target.value)}
              error={!!errors.title}
              helperText={errors.title}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>نوع نقشه</InputLabel>
              <Select
                value={formData.type || 'topographic'}
                onChange={(e) => handleChange('type', e.target.value)}
                label="نوع نقشه"
              >
                <MenuItem value="topographic">توپوگرافی</MenuItem>
                <MenuItem value="satellite">ماهواره‌ای</MenuItem>
                <MenuItem value="tactical">تاکتیکی</MenuItem>
                <MenuItem value="nautical">دریایی</MenuItem>
                <MenuItem value="aeronautical">هوانوردی</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="مقیاس"
              value={formData.scale || ''}
              onChange={(e) => handleChange('scale', e.target.value)}
              placeholder="1:50000"
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
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              مختصات جغرافیایی
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  label="شمال"
                  type="number"
                  value={formData.coordinates?.north || 0}
                  onChange={(e) => handleCoordinateChange('north', parseFloat(e.target.value) || 0)}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  label="جنوب"
                  type="number"
                  value={formData.coordinates?.south || 0}
                  onChange={(e) => handleCoordinateChange('south', parseFloat(e.target.value) || 0)}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  label="شرق"
                  type="number"
                  value={formData.coordinates?.east || 0}
                  onChange={(e) => handleCoordinateChange('east', parseFloat(e.target.value) || 0)}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  label="غرب"
                  type="number"
                  value={formData.coordinates?.west || 0}
                  onChange={(e) => handleCoordinateChange('west', parseFloat(e.target.value) || 0)}
                />
              </Grid>
            </Grid>
            {errors.coordinates && (
              <Typography color="error" variant="caption">
                {errors.coordinates}
              </Typography>
            )}
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>طبقه‌بندی امنیتی</InputLabel>
              <Select
                value={formData.securityClassification || 'public'}
                onChange={(e) => handleChange('securityClassification', e.target.value)}
                label="طبقه‌بندی امنیتی"
              >
                <MenuItem value="public">عمومی</MenuItem>
                <MenuItem value="restricted">محدود</MenuItem>
                <MenuItem value="confidential">محرمانه</MenuItem>
                <MenuItem value="secret">سری</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>فرمت</InputLabel>
              <Select
                value={formData.format || 'digital'}
                onChange={(e) => handleChange('format', e.target.value)}
                label="فرمت"
              >
                <MenuItem value="digital">دیجیتال</MenuItem>
                <MenuItem value="paper">کاغذی</MenuItem>
                <MenuItem value="both">هر دو</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="منبع"
              value={formData.source || ''}
              onChange={(e) => handleChange('source', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="نسخه"
              value={formData.version || ''}
              onChange={(e) => handleChange('version', e.target.value)}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          لغو
        </Button>
        <Button onClick={handleSubmit} variant="contained">
          {map ? 'ویرایش' : 'افزودن'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MapsModal;