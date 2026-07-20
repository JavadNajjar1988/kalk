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
import {
  buildResourcesFormDialogSx,
  resourcesDialogTitleSx,
  resourcesDialogContentDividersSx,
  resourcesDialogActionsSx,
  resourcesOutlinedCancelButtonSx,
} from '../resourcesDialogStyles';
import PrimaryImageField from '../components/PrimaryImageField';
import type { PrimaryImageChanges } from '../components/primaryImageHelpers';

interface EquipmentModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any, imageChanges?: PrimaryImageChanges) => void;
  equipment?: any;
  categories?: Array<{ id: string; name: string }>;
}

const initialFormData = {
  equipmentCode: '',
  name: '',
  type: 'سلاح',
  model: '',
  manufacturer: '',
  serialNumber: '',
  condition: 'good',
  status: 'available',
  location: '',
  acquisitionDate: '',
};

const EquipmentModal: React.FC<EquipmentModalProps> = ({
  open,
  onClose,
  onSave,
  equipment,
  categories = [],
}) => {
  const theme = useTheme();
  const [formData, setFormData] = useState<any>(initialFormData);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [clearExisting, setClearExisting] = useState<boolean>(false);

  useEffect(() => {
    if (equipment) {
      setFormData({ ...initialFormData, ...equipment });
    } else {
      setFormData(initialFormData);
    }
    setSelectedFile(null);
    setClearExisting(false);
  }, [equipment, open]);

  const handleChange = (fieldId: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleSubmit = () => {
    onSave(
      {
        ...formData,
        assignedTo: formData.assignedTo || '',
      },
      { selectedFile, clearExisting },
    );
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
        {equipment ? 'ویرایش تجهیز' : 'افزودن تجهیز جدید'}
      </DialogTitle>
      <DialogContent dividers sx={resourcesDialogContentDividersSx(theme)}>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="کد تجهیز"
              value={formData.equipmentCode || ''}
              onChange={(e) => handleChange('equipmentCode', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="نام تجهیز"
              value={formData.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              label="نوع"
              value={formData.type || 'سلاح'}
              onChange={(e) => handleChange('type', e.target.value)}
            >
              <MenuItem value="سلاح">سلاح</MenuItem>
              <MenuItem value="وسیله نقلیه">وسیله نقلیه</MenuItem>
              <MenuItem value="ارتباطات">ارتباطات</MenuItem>
              <MenuItem value="الکترونیک">الکترونیک</MenuItem>
              <MenuItem value="پشتیبانی">پشتیبانی</MenuItem>
            </TextField>
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
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="مدل"
              value={formData.model || ''}
              onChange={(e) => handleChange('model', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="سازنده"
              value={formData.manufacturer || ''}
              onChange={(e) => handleChange('manufacturer', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="شماره سریال"
              value={formData.serialNumber || ''}
              onChange={(e) => handleChange('serialNumber', e.target.value)}
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
              select
              fullWidth
              label="وضعیت"
              value={formData.status || 'available'}
              onChange={(e) => handleChange('status', e.target.value)}
            >
              <MenuItem value="available">موجود</MenuItem>
              <MenuItem value="assigned">تخصیص‌یافته</MenuItem>
              <MenuItem value="maintenance">در تعمیر</MenuItem>
              <MenuItem value="retired">مستهلک</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              label="شرایط"
              value={formData.condition || 'good'}
              onChange={(e) => handleChange('condition', e.target.value)}
            >
              <MenuItem value="excellent">عالی</MenuItem>
              <MenuItem value="good">خوب</MenuItem>
              <MenuItem value="fair">قابل قبول</MenuItem>
              <MenuItem value="poor">ضعیف</MenuItem>
              <MenuItem value="damaged">آسیب‌دیده</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <PrimaryImageField
              primaryMediaId={formData.primaryMediaId}
              selectedFile={selectedFile}
              clearExisting={clearExisting}
              onChange={({ selectedFile: f, clearExisting: c }) => {
                setSelectedFile(f);
                setClearExisting(c);
              }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={resourcesDialogActionsSx(theme)}>
        <Button
          onClick={onClose}
          variant="outlined"
          color="inherit"
          sx={resourcesOutlinedCancelButtonSx(theme)}
        >
          انصراف
        </Button>
        <Button variant="contained" color="primary" onClick={handleSubmit} sx={{ borderRadius: 2, px: 3 }}>
          ذخیره
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EquipmentModal;
