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
  // فیلدهای کدگذاری برای درجات نظامی
  countryCode?: string;
  groupCode?: string;
  rankCode?: string;
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
  // خطاهای کدگذاری برای درجات نظامی
  countryCode?: string;
  groupCode?: string;
  rankCode?: string;
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
    // مقداردهی اولیه فیلدهای کدگذاری
    countryCode: '',
    groupCode: '',
    rankCode: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // تعیین پشتیبانی از سطوح سلسله‌مراتبی بر اساس نوع دسته‌بندی
  const supportsHierarchyLevels = categoryType !== CategoryType.EQUIPMENT && categoryType !== CategoryType.AMMUNITION;
  const showCoordinates = categoryType === CategoryType.GEOGRAPHICAL;
  const showMilitaryUnitExtras = categoryType === CategoryType.MILITARY_UNITS;
  const showNatoForRanks = categoryType === CategoryType.MILITARY_RANKS;
  const showMilitaryRankCodes = categoryType === CategoryType.MILITARY_RANKS;
  
  // برای درجات نظامی، ساختار سلسله‌مراتبی را غیرفعال کن (فقط کدگذاری)
  const isMilitaryRanks = categoryType === CategoryType.MILITARY_RANKS;
  const effectiveSupportsHierarchy = supportsHierarchyLevels && !isMilitaryRanks;

  // تابع برای دریافت کدهای والد
  const getParentCodes = (parentId?: string) => {
    if (!parentId) return { countryCode: '', groupCode: '', rankCode: '' };
    
    const parent = parentOptions.find(p => p.id === parentId);
    if (!parent) return { countryCode: '', groupCode: '', rankCode: '' };
    
    const customFields = parent.customFields || {};
    return {
      countryCode: customFields.countryCode || '',
      groupCode: customFields.groupCode || '',
      rankCode: customFields.rankCode || '',
    };
  };

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
        // پر کردن فیلدهای کدگذاری از customFields
        countryCode: cf.countryCode || '',
        groupCode: cf.groupCode || '',
        rankCode: cf.rankCode || '',
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
  const getAvailableLevels = () => {
    if (!levels || levels.length === 0) {
      // اگر levels خالی است، هیچ سطحی نمایش نده
      return [];
    }
    
    // همیشه همه سطوح تعریف شده را نمایش بده (بدون محدودیت)
    return levels;
  };


  // مقداردهی اولیه فرم
  useEffect(() => {
    if (open && !isEditing) {
      const availableLevels = effectiveSupportsHierarchy ? getAvailableLevels() : [];
      
      // اگر سطوح پشتیبانی نشود، سطح ثابت 1 در نظر بگیر
      // اگر پشتیبانی شود و هیچ سطحی موجود نباشد، 0 تنظیم می‌شود تا کاربر ابتدا سطح بسازد
      let finalLevel = effectiveSupportsHierarchy ? 0 : 1;
      if (effectiveSupportsHierarchy && availableLevels.length > 0) {
        // همیشه اولین سطح موجود را به عنوان پیش‌فرض انتخاب کن
        const firstAvailableLevel = availableLevels[0];
        const firstLevelOrder = 'order' in firstAvailableLevel ? firstAvailableLevel.order : (firstAvailableLevel as any).order || 1;
        finalLevel = firstLevelOrder;
      }
      
      // برای درجات نظامی، والد را خالی بگذار
      const effectiveParentId = isMilitaryRanks ? '' : (parentId || '');
      
      // دریافت کدهای والد برای ارث‌بری (فقط اگر والد انتخاب شده باشد)
      const parentCodes = getParentCodes(effectiveParentId);
      
      setFormData({
        name: '',
        level: finalLevel,
        parentId: effectiveParentId,
        latitude: '',
        longitude: '',
        description: '',
        specialty: '',
        icon: '',
        natoEquivalent: '',
        country: '',
        // ارث‌بری کدها از والد (فقط اگر والد انتخاب شده باشد)
        countryCode: parentCodes.countryCode,
        groupCode: parentCodes.groupCode,
        rankCode: parentCodes.rankCode,
      });
      setErrors({});
    }
  }, [open, parentId, parentOptions, levels, isEditing, effectiveSupportsHierarchy, isMilitaryRanks]);

  // اعتبارسنجی فرم
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'نام الزامی است';
    }

    if (effectiveSupportsHierarchy) {
      if (!formData.level || formData.level === 0) {
        newErrors.level = 'سطح الزامی است';
      }
      // حذف محدودیت سطح بالاتر از والد - حالا هر سطحی قابل انتخاب است
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

    // اعتبارسنجی کدهای درجات نظامی
    if (showMilitaryRankCodes) {
      // اعتبارسنجی کد کشور
      if (formData.countryCode && !/^[A-Z]{2}$/.test(formData.countryCode)) {
        newErrors.countryCode = 'کد کشور باید دو حرف بزرگ انگلیسی باشد (مثل IR)';
      }
      
      // اعتبارسنجی کد گروه
      if (formData.groupCode && !/^G[1-9]\d*$/.test(formData.groupCode)) {
        newErrors.groupCode = 'کد گروه باید با G شروع شود و عدد مثبت باشد (مثل G1, G10)';
      }
      
      // اعتبارسنجی کد رده
      if (formData.rankCode && !/^R[1-9]\d*$/.test(formData.rankCode)) {
        newErrors.rankCode = 'کد رده باید با R شروع شود و عدد مثبت باشد (مثل R1, R15)';
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

      // ذخیره کدهای درجات نظامی
      if (showMilitaryRankCodes) {
        if (formData.countryCode) customFields.countryCode = formData.countryCode;
        if (formData.groupCode) customFields.groupCode = formData.groupCode;
        if (formData.rankCode) customFields.rankCode = formData.rankCode;
      }

      onSubmit({
        name: formData.name.trim(),
        englishName: formData.name.trim(),
        description: formData.description.trim(),
        level: effectiveSupportsHierarchy ? formData.level : 1,
        parentId: effectiveSupportsHierarchy ? (formData.parentId || undefined) : undefined,
        customFields,
      });
      onClose();
    }
  };

  // تغییر فیلدها
  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // اگر والد تغییر کرد، سطح را خودکار تنظیم کن (فقط برای دسته‌های غیر نظامی)
      if (field === 'parentId' && !isMilitaryRanks) {
        const newParentId = value as string;
        const availableLevels = getAvailableLevels();
        
        // اگر هیچ سطحی موجود نیست، سطح را 0 تنظیم کن
        let finalLevel = 0;
        if (availableLevels.length > 0) {
          // همیشه اولین سطح موجود را به عنوان پیش‌فرض انتخاب کن
          const firstAvailableLevel = availableLevels[0];
          const firstLevelOrder = 'order' in firstAvailableLevel ? firstAvailableLevel.order : (firstAvailableLevel as any).order || 1;
          finalLevel = firstLevelOrder;
        }
        
        newData.level = finalLevel;
        
        // ارث‌بری کدها از والد جدید
        if (showMilitaryRankCodes) {
          const parentCodes = getParentCodes(newParentId);
          newData.countryCode = parentCodes.countryCode;
          newData.groupCode = parentCodes.groupCode;
          newData.rankCode = parentCodes.rankCode;
        }
      }
      
      return newData;
    });
    
    // پاک کردن خطا
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // سطوح قابل انتخاب
  const availableLevels = effectiveSupportsHierarchy ? getAvailableLevels() : [];

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
            {effectiveSupportsHierarchy && (
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
        {effectiveSupportsHierarchy && (
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

        {/* فیلدهای کدگذاری برای درجات نظامی */}
        {showMilitaryRankCodes && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" color="primary.main" sx={{ mb: 2 }}>
              کدگذاری سلسله‌مراتبی
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                label="کد کشور"
                placeholder="مثلاً: IR, RU, US"
                value={formData.countryCode}
                onChange={(e) => handleInputChange('countryCode', e.target.value.toUpperCase())}
                error={!!errors.countryCode}
                helperText={errors.countryCode || 'دو حرف بزرگ انگلیسی (اختیاری)'}
                sx={{ flex: 1, minWidth: 150 }}
              />
              <TextField
                label="کد گروه رده‌ای"
                placeholder="مثلاً: G1, G2, G10"
                value={formData.groupCode}
                onChange={(e) => handleInputChange('groupCode', e.target.value.toUpperCase())}
                error={!!errors.groupCode}
                helperText={errors.groupCode || 'با G شروع شود (اختیاری)'}
                sx={{ flex: 1, minWidth: 150 }}
              />
              <TextField
                label="کد رده نظامی"
                placeholder="مثلاً: R1, R2, R15"
                value={formData.rankCode}
                onChange={(e) => handleInputChange('rankCode', e.target.value.toUpperCase())}
                error={!!errors.rankCode}
                helperText={errors.rankCode || 'با R شروع شود (اختیاری)'}
                sx={{ flex: 1, minWidth: 150 }}
              />
            </Box>
            <FormHelperText sx={{ mt: 1 }}>
              کدها برای مرتب‌سازی و نمایش سلسله‌مراتبی استفاده می‌شوند. 
              {isMilitaryRanks ? ' در درجات نظامی، نمایش بر اساس این کدها انجام می‌شود.' : ' اگر والد انتخاب شده باشد، کدهای والد ارث‌بری می‌شوند.'}
            </FormHelperText>
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
