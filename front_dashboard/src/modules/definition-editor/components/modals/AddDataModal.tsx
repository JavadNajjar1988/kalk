import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  FormHelperText,
} from '@mui/material';
import { MasterDefinition, DefinitionCategory, DynamicHierarchyLevel } from '../../types';
import { ExtendedHierarchyLevel, CategoryType } from '../../types';

interface AddDataModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  category: DefinitionCategory;
  levels: (ExtendedHierarchyLevel | DynamicHierarchyLevel)[];
  parentOptions: MasterDefinition[];
  parentId?: string;
  editingItem?: MasterDefinition | null;
  isEditing?: boolean;
  categoryType: CategoryType;
}

interface FormData {
  name: string;
  level: number; // می‌تواند 0 باشد اگر هیچ سطحی موجود نیست
  parentId: string;
  latitude?: string;
  longitude?: string;
  description: string;
  specialty?: string;
  icon?: string;
  natoEquivalent?: string;
  country?: string;
}

interface FormErrors {
  name?: string;
  level?: string;
  parentId?: string;
  latitude?: string;
  longitude?: string;
  description?: string;
  specialty?: string;
  icon?: string;
  natoEquivalent?: string;
  country?: string;
}

const AddDataModal: React.FC<AddDataModalProps> = ({
  open,
  onClose,
  onSubmit,
  levels,
  parentOptions,
  parentId,
  editingItem,
  isEditing = false,
  categoryType,
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    level: 1,
    parentId: parentId || '',
    latitude: '',
    longitude: '',
    description: '',
    specialty: '',
    icon: '',
    natoEquivalent: '',
    country: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // تعیین پشتیبانی از سطوح سلسله‌مراتبی بر اساس نوع دسته‌بندی
  const supportsHierarchyLevels = categoryType !== CategoryType.EQUIPMENT && categoryType !== CategoryType.AMMUNITION;
  const showCoordinates = categoryType === CategoryType.GEOGRAPHICAL;
  const showMilitaryUnitExtras = categoryType === CategoryType.MILITARY_UNITS;
  const showNatoForRanks = categoryType === CategoryType.MILITARY_RANKS;

  // پر کردن فرم با داده‌های آیتم ویرایش
  useEffect(() => {
    if (isEditing && editingItem && open) {
      const cf: any = editingItem.customFields || {};
      const md: any = editingItem.metadata || {};
      const coordFromCF = {
        latitude: typeof cf.latitude === 'number' ? cf.latitude.toString() : (cf.latitude || ''),
        longitude: typeof cf.longitude === 'number' ? cf.longitude.toString() : (cf.longitude || ''),
      };
      const coordFromMD = {
        latitude: md?.coordinates?.lat != null ? String(md.coordinates.lat) : '',
        longitude: md?.coordinates?.lng != null ? String(md.coordinates.lng) : '',
      };
      setFormData({
        name: editingItem.name || '',
        level: editingItem.level || 1,
        parentId: editingItem.parentId || '',
        latitude: coordFromCF.latitude || coordFromMD.latitude || '',
        longitude: coordFromCF.longitude || coordFromMD.longitude || '',
        description: editingItem.description || '',
        specialty: cf.specialty || editingItem.specialty || '',
        icon: cf.icon || '',
        natoEquivalent: cf.natoEquivalent || '',
        country: cf.country || '',
      });
    }
  }, [isEditing, editingItem, open]);

  // تابع برای دریافت نام سطح
  const getLevelName = (level: number) => {
    if (!levels || levels.length === 0) {
      return `سطح ${level}`;
    }
    
    const levelInfo = levels.find(l => {
      const order = 'order' in l ? l.order : (l as any).order || 1;
      return order === level;
    });
    if (levelInfo) {
      const name = 'name' in levelInfo ? levelInfo.name : (levelInfo as any).name || `سطح ${level}`;
      return `${name} (سطح ${level})`;
    }
    return `سطح ${level}`;
  };

  // تابع برای دریافت سطوح قابل انتخاب بر اساس والد
  const getAvailableLevels = (currentParentId?: string) => {
    if (!levels || levels.length === 0) {
      // اگر levels خالی است، هیچ سطحی نمایش نده
      return [];
    }
    
    if (!currentParentId) {
      // اگر والد انتخاب نشده، همه سطوح را نمایش بده
      return levels;
    }

    const selectedParent = parentOptions.find(p => p.id === currentParentId);
    if (!selectedParent) {
      return levels;
    }

    // فقط سطوح بالاتر از والد را نمایش بده
    return levels.filter((level) => {
      const order = 'order' in level ? level.order : (level as any).order || 1;
      return order > selectedParent.level;
    });
  };

  // تابع برای تنظیم سطح پیش‌فرض بر اساس والد
  const getDefaultLevel = (selectedParentId?: string) => {
    if (!selectedParentId) {
      return 1;
    }
    const selectedParent = parentOptions.find(p => p.id === selectedParentId);
    return selectedParent ? selectedParent.level + 1 : 1;
  };

  // مقداردهی اولیه فرم
  useEffect(() => {
    if (open && !isEditing) {
      const availableLevels = supportsHierarchyLevels ? getAvailableLevels(parentId) : [];
      
      // اگر سطوح پشتیبانی نشود، سطح ثابت 1 در نظر بگیر
      // اگر پشتیبانی شود و هیچ سطحی موجود نباشد، 0 تنظیم می‌شود تا کاربر ابتدا سطح بسازد
      let finalLevel = supportsHierarchyLevels ? 0 : 1;
      if (supportsHierarchyLevels && availableLevels.length > 0) {
        const defaultLevel = getDefaultLevel(parentId);
        const firstAvailableLevel = availableLevels[0];
        const firstLevelOrder = 'order' in firstAvailableLevel ? firstAvailableLevel.order : (firstAvailableLevel as any).order || 1;
        finalLevel = defaultLevel < firstLevelOrder ? firstLevelOrder : defaultLevel;
      }
      
      setFormData({
        name: '',
        level: finalLevel,
        parentId: parentId || '',
        latitude: '',
        longitude: '',
        description: '',
        specialty: '',
        icon: '',
        natoEquivalent: '',
        country: '',
      });
      setErrors({});
    }
  }, [open, parentId, parentOptions, levels, isEditing, supportsHierarchyLevels]);

  // اعتبارسنجی فرم
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'نام الزامی است';
    }

    if (supportsHierarchyLevels) {
      if (!formData.level || formData.level === 0) {
        newErrors.level = 'سطح الزامی است';
      } else if (formData.parentId) {
        const selectedParent = parentOptions.find(p => p.id === formData.parentId);
        if (selectedParent && formData.level <= selectedParent.level) {
          newErrors.level = `سطح باید بیشتر از سطح والد (${selectedParent.level}) باشد`;
        }
      }
    }

    // اعتبارسنجی مختصات جغرافیایی
    if (showCoordinates) {
      if (formData.latitude && !/^-?\d+(\.\d+)?$/.test(formData.latitude)) {
        newErrors.latitude = 'عرض جغرافیایی باید عدد باشد';
      }
      if (formData.longitude && !/^-?\d+(\.\d+)?$/.test(formData.longitude)) {
        newErrors.longitude = 'طول جغرافیایی باید عدد باشد';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ارسال فرم
  const handleSubmit = () => {
    if (validateForm()) {
      const customFields: Record<string, any> = {};
      if (showCoordinates) {
        customFields.latitude = formData.latitude ? parseFloat(formData.latitude) : undefined;
        customFields.longitude = formData.longitude ? parseFloat(formData.longitude) : undefined;
        if (formData.country) customFields.country = formData.country;
      }
      if (showMilitaryUnitExtras || showNatoForRanks) {
        if (formData.specialty) customFields.specialty = formData.specialty;
        if (formData.icon) customFields.icon = formData.icon;
        if (formData.natoEquivalent) customFields.natoEquivalent = formData.natoEquivalent;
      }

      onSubmit({
        name: formData.name.trim(),
        englishName: formData.name.trim(),
        description: formData.description.trim(),
        level: supportsHierarchyLevels ? formData.level : 1,
        parentId: supportsHierarchyLevels ? (formData.parentId || undefined) : undefined,
        customFields,
      });
      onClose();
    }
  };

  // تغییر فیلدها
  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // اگر والد تغییر کرد، سطح را خودکار تنظیم کن
      if (field === 'parentId') {
        const newParentId = value as string;
        const availableLevels = getAvailableLevels(newParentId);
        
        // اگر هیچ سطحی موجود نیست، سطح را 0 تنظیم کن
        let finalLevel = 0;
        if (availableLevels.length > 0) {
          const defaultLevel = getDefaultLevel(newParentId);
          const firstAvailableLevel = availableLevels[0];
          const firstLevelOrder = 'order' in firstAvailableLevel ? firstAvailableLevel.order : (firstAvailableLevel as any).order || 1;
          finalLevel = defaultLevel < firstLevelOrder ? firstLevelOrder : defaultLevel;
        }
        
        newData.level = finalLevel;
      }
      
      return newData;
    });
    
    // پاک کردن خطا
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // سطوح قابل انتخاب
  const availableLevels = supportsHierarchyLevels ? getAvailableLevels(formData.parentId) : [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: 'grey.50',
        },
      }}
    >
      <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', pb: 1 }}>
        <Typography variant="h6">{isEditing ? 'ویرایش داده' : 'افزودن داده جدید'}</Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* اطلاعات اصلی */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" color="primary.main" sx={{ mb: 2 }}>
            اطلاعات اصلی
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="نام"
              placeholder="نام داده جدید"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              required
              sx={{ flex: 1, minWidth: 200 }}
            />
            {supportsHierarchyLevels && (
              <FormControl sx={{ minWidth: 200 }} error={!!errors.level}>
               <InputLabel>سطح</InputLabel>
               <Select
                 value={formData.level}
                 onChange={(e) => handleInputChange('level', e.target.value as number)}
                 label="سطح"
                 disabled={availableLevels.length === 0}
               >
                 {availableLevels.length === 0 ? (
                   <MenuItem disabled>
                     <em>هیچ سطحی تعریف نشده است</em>
                   </MenuItem>
                 ) : (
                   availableLevels.map((level) => {
                     const order = 'order' in level ? level.order : (level as any).order || 1;
                     return (
                       <MenuItem key={order} value={order}>
                         {getLevelName(order)}
                       </MenuItem>
                     );
                   })
                 )}
               </Select>
               {errors.level && <FormHelperText>{errors.level}</FormHelperText>}
               {availableLevels.length === 0 && (
                 <FormHelperText>
                   ابتدا در "مدیریت سطوح سلسله‌مراتبی" سطوح مورد نیاز را تعریف کنید
                 </FormHelperText>
               )}
              </FormControl>
            )}
          </Box>
        </Box>

        {/* ساختار سلسله مراتبی */}
        {supportsHierarchyLevels && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" color="primary.main" sx={{ mb: 2 }}>
              ساختار سلسله مراتبی
            </Typography>
            <FormControl fullWidth>
              <InputLabel>نود والد</InputLabel>
              <Select
                value={formData.parentId}
                onChange={(e) => handleInputChange('parentId', e.target.value)}
                label="نود والد"
              >
                <MenuItem value="">
                  <em>بدون والد (ریشه)</em>
                </MenuItem>
                {parentOptions.map((parent) => (
                  <MenuItem key={parent.id} value={parent.id}>
                    {parent.name} ({getLevelName(parent.level)})
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                نود والد را انتخاب کنید. اگر نود اصلی است، خالی بگذارید.
                {formData.parentId && (() => {
                  const selectedParent = parentOptions.find(p => p.id === formData.parentId);
                  return selectedParent ? ` والد انتخاب شده: ${selectedParent.name} (${getLevelName(selectedParent.level)})` : '';
                })()}
              </FormHelperText>
            </FormControl>
          </Box>
        )}

        {/* مختصات جغرافیایی و کشور (فقط برای جغرافیا) */}
        {showCoordinates && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" color="primary.main" sx={{ mb: 2 }}>
              مختصات جغرافیایی
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                label="عرض جغرافیایی"
                placeholder="عرض جغرافیایی"
                value={formData.latitude}
                onChange={(e) => handleInputChange('latitude', e.target.value)}
                error={!!errors.latitude}
                helperText={errors.latitude}
                sx={{ flex: 1, minWidth: 200 }}
              />
              <TextField
                label="طول جغرافیایی"
                placeholder="طول جغرافیایی"
                value={formData.longitude}
                onChange={(e) => handleInputChange('longitude', e.target.value)}
                error={!!errors.longitude}
                helperText={errors.longitude}
                sx={{ flex: 1, minWidth: 200 }}
              />
              <TextField
                label="کشور"
                placeholder="کشور"
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                error={!!errors.country}
                helperText={errors.country}
                sx={{ flex: 1, minWidth: 200 }}
              />
            </Box>
            <FormHelperText sx={{ mt: 1 }}>
              طول و عرض جغرافیایی و نام کشور (اختیاری)
            </FormHelperText>
          </Box>
        )}

        {/* فیلدهای اختصاصی ساختار رده‌های نظامی */}
        {showMilitaryUnitExtras && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" color="primary.main" sx={{ mb: 2 }}>
              اطلاعات تخصصی یگان
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                label="تخصص"
                placeholder="مثلاً: زرهی، پیاده، توپخانه"
                value={formData.specialty}
                onChange={(e) => handleInputChange('specialty', e.target.value)}
                error={!!errors.specialty}
                helperText={errors.specialty}
                sx={{ flex: 1, minWidth: 200 }}
              />
              <TextField
                label="کد ناتو / معادل ناتو"
                placeholder="مثلاً: INF, ARM, ART"
                value={formData.natoEquivalent}
                onChange={(e) => handleInputChange('natoEquivalent', e.target.value)}
                error={!!errors.natoEquivalent}
                helperText={errors.natoEquivalent}
                sx={{ flex: 1, minWidth: 200 }}
              />
              <TextField
                label="آیکون"
                placeholder="نام آیکون یا کد"
                value={formData.icon}
                onChange={(e) => handleInputChange('icon', e.target.value)}
                error={!!errors.icon}
                helperText={errors.icon}
                sx={{ flex: 1, minWidth: 200 }}
              />
            </Box>
          </Box>
        )}

        {/* فیلد کد ناتو برای درجات نظامی */}
        {showNatoForRanks && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" color="primary.main" sx={{ mb: 2 }}>
              اطلاعات ناتو
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                label="کد ناتو"
                placeholder="مثلاً: OF-1, OF-5, OR-6"
                value={formData.natoEquivalent}
                onChange={(e) => handleInputChange('natoEquivalent', e.target.value)}
                error={!!errors.natoEquivalent}
                helperText={errors.natoEquivalent}
                sx={{ flex: 1, minWidth: 200 }}
              />
            </Box>
          </Box>
        )}

        {/* توضیحات اضافی */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" color="primary.main" sx={{ mb: 2 }}>
            توضیحات اضافی
          </Typography>
          <TextField
            label="توضیحات"
            placeholder="توضیحات"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            multiline
            rows={4}
            fullWidth
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={onClose} variant="outlined" color="primary">
          انصراف
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          {isEditing ? 'ذخیره تغییرات' : 'افزودن'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddDataModal;
