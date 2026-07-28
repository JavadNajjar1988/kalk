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
  Typography,
  useTheme,
} from '@mui/material';
import {
  buildResourcesFormDialogSx,
  buildResourcesTextFieldOutlineSx,
  getResourcesDialogAccent,
  resourcesDialogTitleSx,
  resourcesDialogContentDividersSx,
  resourcesDialogActionsSx,
  resourcesOutlinedCancelButtonSx,
} from '../resourcesDialogStyles';
import PersianCalendarField from '@/components/common/PersianCalendarField';
import { toLocalDateInput } from '@/utils/dateUtils';
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
  const accent = getResourcesDialogAccent(theme);
  const textFieldSx = buildResourcesTextFieldOutlineSx(theme);

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
    lastUpdated: toLocalDateInput(new Date()),
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
        lastUpdated: toLocalDateInput(new Date()),
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

  const handleCoordinateChange = (
    coordinate: keyof MapItem['coordinates'],
    value: number
  ) => {
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
      sx={buildResourcesFormDialogSx(theme)}
    >
      <DialogTitle sx={resourcesDialogTitleSx(theme)}>
        {map ? 'ویرایش نقشه' : 'افزودن نقشه جدید'}
      </DialogTitle>

      <DialogContent dividers sx={resourcesDialogContentDividersSx(theme)}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="کد نقشه"
              value={formData.mapCode || ''}
              onChange={e => handleChange('mapCode', e.target.value)}
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
              onChange={e => handleChange('title', e.target.value)}
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
              onChange={e => handleChange('type', e.target.value)}
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
              onChange={e => handleChange('scale', e.target.value)}
              placeholder="1:50000"
              sx={textFieldSx}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="منطقه"
              value={formData.area || ''}
              onChange={e => handleChange('area', e.target.value)}
              error={!!errors.area}
              helperText={errors.area}
              sx={textFieldSx}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, color: accent, mb: 1 }}
            >
              مختصات جغرافیایی
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  label="شمال"
                  type="number"
                  value={formData.coordinates?.north ?? 0}
                  onChange={e =>
                    handleCoordinateChange(
                      'north',
                      parseFloat(e.target.value) || 0
                    )
                  }
                  sx={textFieldSx}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  label="جنوب"
                  type="number"
                  value={formData.coordinates?.south ?? 0}
                  onChange={e =>
                    handleCoordinateChange(
                      'south',
                      parseFloat(e.target.value) || 0
                    )
                  }
                  sx={textFieldSx}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  label="شرق"
                  type="number"
                  value={formData.coordinates?.east ?? 0}
                  onChange={e =>
                    handleCoordinateChange(
                      'east',
                      parseFloat(e.target.value) || 0
                    )
                  }
                  sx={textFieldSx}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  label="غرب"
                  type="number"
                  value={formData.coordinates?.west ?? 0}
                  onChange={e =>
                    handleCoordinateChange(
                      'west',
                      parseFloat(e.target.value) || 0
                    )
                  }
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
              onChange={e => handleChange('datum', e.target.value)}
              sx={textFieldSx}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="سیستم تصویر"
              value={formData.projection || ''}
              onChange={e => handleChange('projection', e.target.value)}
              sx={textFieldSx}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="طبقه‌بندی امنیتی"
              value={formData.securityClassification || 'public'}
              onChange={e =>
                handleChange('securityClassification', e.target.value)
              }
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
              onChange={e => handleChange('format', e.target.value)}
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
              onChange={e => handleChange('source', e.target.value)}
              sx={textFieldSx}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="نسخه"
              value={formData.version || ''}
              onChange={e => handleChange('version', e.target.value)}
              sx={textFieldSx}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <PersianCalendarField
              label="آخرین به‌روزرسانی"
              value={formData.lastUpdated || ''}
              onChange={value => handleChange('lastUpdated', value)}
              dateOnly
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="وضعیت"
              value={formData.status || 'active'}
              onChange={e => handleChange('status', e.target.value)}
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
          ...resourcesDialogActionsSx(theme),
          justifyContent: 'flex-end',
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          color="inherit"
          sx={resourcesOutlinedCancelButtonSx(theme)}
        >
          انصراف
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          sx={{
            borderRadius: 2,
            px: 3,
          }}
        >
          {map ? 'ویرایش' : 'افزودن'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MapsModal;
