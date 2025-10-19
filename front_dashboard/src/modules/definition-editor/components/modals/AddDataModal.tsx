import React, { useState, useEffect, useMemo } from 'react';
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
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const softSurface = useMemo(() => {
    const primary = (theme.palette.primary.main || '#4a90e2').toLowerCase();
    const hex = primary.replace('#', '');

    if (hex.includes('10b981') || hex.includes('4caf50') || hex.includes('2e7d32')) return '#f0f4f3';
    if (hex.includes('4a90e2') || hex.includes('1976d2') || hex.includes('2196f3')) return '#f0f4f8';
    if (hex.includes('ef4444') || hex.includes('f44336') || hex.includes('d32f2f')) return '#fbf1f0';
    if (hex.includes('6b21a8') || hex.includes('9c27b0') || hex.includes('673ab7')) return theme.palette.mode === 'dark' ? '#1f2330' : '#f3f0f9';
    if (hex.includes('f59e0b') || hex.includes('ff9800') || hex.includes('fb8c00')) return '#fbf5ef';

    const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
    const hexToRgb = (h: string) => {
      const norm = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
      const r = parseInt(norm.slice(0, 2), 16);
      const g = parseInt(norm.slice(2, 4), 16);
      const b = parseInt(norm.slice(4, 6), 16);
      return { r, g, b };
    };
    const rgbToHex = (r: number, g: number, b: number) =>
      `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`;
    const blendWithWhite = (h: string, primaryWeight = 0.1) => {
      const { r, g, b } = hexToRgb(h);
      const white = 255;
      const weight = 1 - primaryWeight;
      const br = white * weight + r * primaryWeight;
      const bg = white * weight + g * primaryWeight;
      const bb = white * weight + b * primaryWeight;
      return rgbToHex(br, bg, bb);
    };

    if (/^[0-9a-f]{3,6}$/.test(hex)) {
      return blendWithWhite(hex, 0.1);
    }

    try {
      const fallback = (theme.palette.primary.light || '#90caf9').toLowerCase().replace('#', '');
      return blendWithWhite(fallback, 0.08);
    } catch {
      return theme.palette.mode === 'dark' ? '#1f2430' : '#f5f7fa';
    }
  }, [theme]);

  const sectionCardSx = useMemo(() => ({
    borderRadius: '16px',
    padding: { xs: 2, sm: 3 },
    backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.72) : 'rgba(255, 255, 255, 0.95)',
    border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
    boxShadow: `0 16px 32px ${alpha(theme.palette.primary.main, 0.12)}`,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  }), [theme]);

  const sectionTitleSx = useMemo(() => ({
    mb: 2,
    fontWeight: 600,
    color: theme.palette.primary.main,
  }), [theme]);

  const inputBaseSx = useMemo(() => ({
    '& .MuiOutlinedInput-root': {
      borderRadius: '12px',
      backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.65) : 'rgba(255, 255, 255, 0.9)',
      '& fieldset': { borderColor: alpha(theme.palette.primary.main, 0.2) },
      '&:hover fieldset': { borderColor: alpha(theme.palette.primary.main, 0.4) },
      '&.Mui-focused fieldset': {
        borderColor: alpha(theme.palette.primary.main, 0.6),
        boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.15)}`,
      },
    },
  }), [theme]);

  const secondaryButtonSx = useMemo(() => ({
    borderRadius: '12px',
    px: { xs: 2, sm: 3 },
    py: 1.2,
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
    color: '#475569',
    border: '1px solid rgba(148, 163, 184, 0.25)',
    backdropFilter: 'blur(10px)',
    fontWeight: 600,
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    '&:hover': {
      backgroundColor: 'rgba(148, 163, 184, 0.18)',
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 22px rgba(148, 163, 184, 0.24)',
    },
  }), [theme]);

  const primaryButtonSx = useMemo(() => ({
    borderRadius: '12px',
    px: { xs: 2.2, sm: 3.5 },
    py: 1.2,
    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
    color: '#ffffff',
    border: '2px solid rgba(255, 255, 255, 0.4)',
    boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.32)}`,
    fontWeight: 700,
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: `0 16px 44px ${alpha(theme.palette.primary.dark, 0.4)}`,
      background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
    },
    '&:disabled': {
      background: 'rgba(148, 163, 184, 0.4)',
      borderColor: 'rgba(255, 255, 255, 0.2)',
      color: 'rgba(255, 255, 255, 0.85)',
      transform: 'none',
      boxShadow: 'none',
    },
  }), [theme]);

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
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : '20px',
          backgroundColor: alpha(theme.palette.primary.light, 0.1),
          backdropFilter: 'blur(20px)',
          border: (t) => `1px solid ${alpha(t.palette.primary.light, 0.2)}`,
          boxShadow: (t) => `0 24px 60px ${alpha(t.palette.primary.light, 0.28)}, inset 0 1px 0 rgba(255, 255, 255, 0.75)`,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: { xs: '100vh', md: '90vh' },
        },
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: softSurface,
          borderBottom: (t) => `1px solid ${alpha(t.palette.primary.light, 0.2)}`,
          py: isMobile ? 2 : 3,
          px: isMobile ? 2 : 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight={700} color="primary">
          {isEditing ? 'ویرایش داده' : 'افزودن داده جدید'}
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            minWidth: 'auto',
            color: theme.palette.primary.main,
            backgroundColor: alpha(theme.palette.primary.main, 0.12),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.2),
              transform: 'translateY(-1px)',
              boxShadow: `0 6px 18px ${alpha(theme.palette.primary.main, 0.25)}`,
            },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, backgroundColor: softSurface }}>
        <Box sx={{ p: { xs: 2.5, sm: 3.5 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* اطلاعات اصلی */}
          <Box sx={{ ...sectionCardSx, mb: 3 }}>
          <Typography variant="h6" sx={sectionTitleSx}>
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
              sx={{ ...inputBaseSx, flex: 1, minWidth: 200 }}
            />
            {effectiveSupportsHierarchy && (
              <FormControl sx={{ minWidth: 200, ...inputBaseSx }} error={!!errors.level}>
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
          <Box sx={{ ...sectionCardSx, mb: 3 }}>
            <Typography variant="h6" sx={sectionTitleSx}>
              ساختار سلسله مراتبی
            </Typography>
            <FormControl fullWidth sx={inputBaseSx}>
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
          <Box sx={{ ...sectionCardSx, mb: 3 }}>
            <Typography variant="h6" sx={sectionTitleSx}>
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
                sx={{ ...inputBaseSx, flex: 1, minWidth: 200 }}
              />
              <TextField
                label="طول جغرافیایی"
                placeholder="طول جغرافیایی"
                value={formData.longitude}
                onChange={(e) => handleInputChange('longitude', e.target.value)}
                error={!!errors.longitude}
                helperText={errors.longitude}
                sx={{ ...inputBaseSx, flex: 1, minWidth: 200 }}
              />
              <TextField
                label="کشور"
                placeholder="کشور"
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                error={!!errors.country}
                helperText={errors.country}
                sx={{ ...inputBaseSx, flex: 1, minWidth: 200 }}
              />
            </Box>
            <FormHelperText sx={{ mt: 1 }}>
              طول و عرض جغرافیایی و نام کشور (اختیاری)
            </FormHelperText>
          </Box>
        )}

          {/* فیلدهای اختصاصی ساختار رده‌های نظامی */}
        {showMilitaryUnitExtras && (
          <Box sx={{ ...sectionCardSx, mb: 3 }}>
            <Typography variant="h6" sx={sectionTitleSx}>
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
                sx={{ ...inputBaseSx, flex: 1, minWidth: 200 }}
              />
              <TextField
                label="کد ناتو / معادل ناتو"
                placeholder="مثلاً: INF, ARM, ART"
                value={formData.natoEquivalent}
                onChange={(e) => handleInputChange('natoEquivalent', e.target.value)}
                error={!!errors.natoEquivalent}
                helperText={errors.natoEquivalent}
                sx={{ ...inputBaseSx, flex: 1, minWidth: 200 }}
              />
              <TextField
                label="آیکون"
                placeholder="نام آیکون یا کد"
                value={formData.icon}
                onChange={(e) => handleInputChange('icon', e.target.value)}
                error={!!errors.icon}
                helperText={errors.icon}
                sx={{ ...inputBaseSx, flex: 1, minWidth: 200 }}
              />
            </Box>
          </Box>
        )}

          {/* فیلد کد ناتو برای درجات نظامی */}
        {showNatoForRanks && (
          <Box sx={{ ...sectionCardSx, mb: 3 }}>
            <Typography variant="h6" sx={sectionTitleSx}>
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
                sx={{ ...inputBaseSx, flex: 1, minWidth: 200 }}
              />
            </Box>
          </Box>
        )}

          {/* فیلدهای کدگذاری برای درجات نظامی */}
        {showMilitaryRankCodes && (
          <Box sx={{ ...sectionCardSx, mb: 3 }}>
            <Typography variant="h6" sx={sectionTitleSx}>
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
                sx={{ ...inputBaseSx, flex: 1, minWidth: 150 }}
              />
              <TextField
                label="کد گروه رده‌ای"
                placeholder="مثلاً: G1, G2, G10"
                value={formData.groupCode}
                onChange={(e) => handleInputChange('groupCode', e.target.value.toUpperCase())}
                error={!!errors.groupCode}
                helperText={errors.groupCode || 'با G شروع شود (اختیاری)'}
                sx={{ ...inputBaseSx, flex: 1, minWidth: 150 }}
              />
              <TextField
                label="کد رده نظامی"
                placeholder="مثلاً: R1, R2, R15"
                value={formData.rankCode}
                onChange={(e) => handleInputChange('rankCode', e.target.value.toUpperCase())}
                error={!!errors.rankCode}
                helperText={errors.rankCode || 'با R شروع شود (اختیاری)'}
                sx={{ ...inputBaseSx, flex: 1, minWidth: 150 }}
              />
            </Box>
            <FormHelperText sx={{ mt: 1 }}>
              کدها برای مرتب‌سازی و نمایش سلسله‌مراتبی استفاده می‌شوند. 
              {isMilitaryRanks ? ' در درجات نظامی، نمایش بر اساس این کدها انجام می‌شود.' : ' اگر والد انتخاب شده باشد، کدهای والد ارث‌بری می‌شوند.'}
            </FormHelperText>
          </Box>
        )}

          {/* توضیحات اضافی */}
          <Box sx={{ ...sectionCardSx, mb: 2 }}>
          <Typography variant="h6" sx={sectionTitleSx}>
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
            sx={inputBaseSx}
          />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          backgroundColor: softSurface,
          borderTop: (t) => `1px solid ${alpha(t.palette.primary.light, 0.2)}`,
          p: isMobile ? 2 : 3,
          justifyContent: 'flex-end',
          gap: 1.5,
        }}
      >
        <Button onClick={onClose} variant="outlined" color="primary" sx={secondaryButtonSx}>
          انصراف
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="primary" sx={primaryButtonSx}>
          {isEditing ? 'ذخیره تغییرات' : 'افزودن'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddDataModal;
