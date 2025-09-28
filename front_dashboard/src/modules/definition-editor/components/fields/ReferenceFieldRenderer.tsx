import React, { useState, useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  TextField,
  Autocomplete,
  FormHelperText,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Link as LinkIcon,
  Warning as WarningIcon,
  DataObject as DataIcon
} from '@mui/icons-material';
import { useReferenceData, type ReferenceDataItem, type ReferenceSections } from '@/hooks/useReferenceData';
import type { CustomField } from '@/modules/definition-editor/types/equipment';

interface ReferenceFieldRendererProps {
  field: CustomField;
  value?: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
  fullWidth?: boolean;
}

/**
 * کامپوننت نمایش فیلدهای Reference در فرم‌ها
 * این کامپوننت داده‌ها را از دسته‌بندی مرجع دریافت کرده و به کاربر نمایش می‌دهد
 */
const ReferenceFieldRenderer: React.FC<ReferenceFieldRendererProps> = ({
  field,
  value,
  onChange,
  error,
  disabled = false,
  fullWidth = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // بارگذاری داده‌های دسته‌بندی مرجع با پشتیبانی از sections
  const {
    data: referenceData,
    loading,
    error: referenceError,
    refresh,
    searchItems,
    getItemById,
    isReady
  } = useReferenceData(field.referenceCategory, field.referenceSections as ReferenceSections);

  // تابع دریافت مقدار نمایش - از فیلد name استفاده می‌کند
  const getDisplayValue = (item: ReferenceDataItem | null): string => {
    if (!item) return '';
    return item.name || item.id;
  };

  // تابع دریافت مقدار ذخیره - از فیلد id استفاده می‌کند
  const getValueField = (item: ReferenceDataItem): any => {
    return item.id;
  };

  // تابع یافتن آیتم بر اساس مقدار
  const findItemByValue = (val: any): ReferenceDataItem | null => {
    if (!referenceData || !val) return null;
    return referenceData.items.find(item => item.id === val) || null;
  };

  // آیتم انتخاب شده فعلی
  const selectedItem = findItemByValue(value);

  // لیست آیتم‌های فیلتر شده
  const filteredItems = searchTerm ? searchItems(searchTerm) : (referenceData?.items || []);

  // مدیریت تغییر انتخاب
  const handleSelectionChange = (newValue: ReferenceDataItem | null) => {
    if (newValue) {
      const fieldValue = getValueField(newValue);
      onChange(fieldValue);
    } else {
      onChange(null);
    }
  };

  // نمایش وضعیت بارگذاری
  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
        <CircularProgress size={20} />
        <Typography variant="body2" color="text.secondary">
          در حال بارگذاری {field.name}...
        </Typography>
      </Box>
    );
  }

  // نمایش خطای دسته‌بندی مرجع
  if (referenceError || !field.referenceCategory) {
    return (
      <Alert severity="error" sx={{ borderRadius: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <WarningIcon fontSize="small" />
          <Typography variant="body2" fontWeight={600}>
            خطا در بارگذاری {field.name}
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          {referenceError || 'دسته‌بندی مرجع مشخص نشده است'}
        </Typography>
        <Box sx={{ mt: 1 }}>
          <Tooltip title="تلاش مجدد">
            <IconButton size="small" onClick={refresh}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Alert>
    );
  }

  // نمایش پیام خالی بودن داده‌ها
  if (isReady && (!referenceData?.items || referenceData.items.length === 0)) {
    return (
      <Alert severity="info" sx={{ borderRadius: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <DataIcon fontSize="small" />
          <Typography variant="body2" fontWeight={600}>
            {field.name}
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          هیچ داده‌ای در دسته‌بندی "{referenceData?.name}" یافت نشد
        </Typography>
      </Alert>
    );
  }

  // نمایش فیلد انتخاب اصلی
  return (
    <Box sx={{ width: fullWidth ? '100%' : 'auto' }}>
      {/* نمایش اطلاعات دسته‌بندی مرجع */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <LinkIcon fontSize="small" color="action" />
          <Typography variant="caption" color="text.secondary">
            مرجع: {referenceData?.name}
          </Typography>
        </Box>
        
        {field.referenceSections && (
          <Chip
            size="small"
            label={
              field.referenceSections === 'hierarchy' ? 'سطوح سلسله مراتبی' :
              field.referenceSections === 'data' ? 'داده‌ها' :
              'هر دو بخش'
            }
            color={
              field.referenceSections === 'hierarchy' ? 'success' :
              field.referenceSections === 'data' ? 'info' :
              'primary'
            }
            variant="outlined"
          />
        )}
        
        {referenceData && (
          <Chip
            size="small"
            label={`${referenceData.items.length} مورد`}
            variant="outlined"
          />
        )}
        
        <Tooltip title="بروزرسانی داده‌ها">
          <IconButton size="small" onClick={refresh} disabled={loading}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* فیلد انتخاب Autocomplete */}
      <Autocomplete
        options={filteredItems}
        value={selectedItem}
        onChange={(event, newValue) => handleSelectionChange(newValue)}
        getOptionLabel={(option) => getDisplayValue(option)}
        isOptionEqualToValue={(option, value) => {
          const optionValue = getValueField(option);
          const currentValue = getValueField(value);
          return optionValue === currentValue;
        }}
        loading={loading}
        disabled={disabled}
        fullWidth={fullWidth}
        renderInput={(params) => (
          <TextField
            {...params}
            label={field.name}
            required={field.isRequired}
            error={!!error}
            helperText={error}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        renderOption={(props, option) => (
          <Box component="li" {...props}>
            <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">
                  {getDisplayValue(option)}
                </Typography>
                {option.type && (
                  <Chip
                    size="small"
                    label={option.type === 'hierarchy' ? 'سطح' : 'داده'}
                    color={option.type === 'hierarchy' ? 'success' : 'info'}
                    variant="outlined"
                    sx={{ fontSize: '0.65rem', height: '18px' }}
                  />
                )}
              </Box>
              {option.englishName && option.englishName !== getDisplayValue(option) && (
                <Typography variant="caption" color="text.secondary">
                  {option.englishName}
                </Typography>
              )}
              {option.description && (
                <Typography variant="caption" color="text.secondary">
                  {option.description}
                </Typography>
              )}
              {/* نمایش اطلاعات اضافی بر اساس نوع */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {option.level !== undefined && (
                  <Chip
                    size="small"
                    label={`سطح ${option.level}`}
                    variant="outlined"
                    sx={{ fontSize: '0.6rem', height: '16px' }}
                  />
                )}
                {option.order !== undefined && option.order !== option.level && (
                  <Chip
                    size="small"
                    label={`ترتیب ${option.order}`}
                    variant="outlined"
                    sx={{ fontSize: '0.6rem', height: '16px' }}
                  />
                )}
                {option.coordinates && (
                  <Chip
                    size="small"
                    label="📍 مختصات"
                    color="warning"
                    variant="outlined"
                    sx={{ fontSize: '0.6rem', height: '16px' }}
                  />
                )}
                {option.natoEquivalent && (
                  <Chip
                    size="small"
                    label={`NATO: ${option.natoEquivalent}`}
                    color="secondary"
                    variant="outlined"
                    sx={{ fontSize: '0.6rem', height: '16px' }}
                  />
                )}
              </Box>
            </Box>
            {/* نمایش مقدار ID */}
            <Chip
              label={getValueField(option)}
              size="small"
              variant="outlined"
              color="primary"
              sx={{ ml: 1, fontSize: '0.7rem', height: '20px' }}
            />
          </Box>
        )}
        noOptionsText="هیچ گزینه‌ای یافت نشد"
        loadingText="در حال بارگذاری..."
      />

      {/* نمایش اطلاعات آیتم انتخاب شده */}
      {selectedItem && (
        <Box sx={{ mt: 1 }}>
          <Alert severity="success" sx={{ borderRadius: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <DataIcon fontSize="small" />
              <Typography variant="body2" fontWeight={600}>
                انتخاب شده: {getDisplayValue(selectedItem)}
              </Typography>
              {selectedItem.type && (
                <Chip
                  size="small"
                  label={selectedItem.type === 'hierarchy' ? 'سطح سازمانی' : 'داده اصلی'}
                  color={selectedItem.type === 'hierarchy' ? 'success' : 'info'}
                  variant="filled"
                />
              )}
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              <Chip
                label={`ID: ${getValueField(selectedItem)}`}
                size="small"
                variant="outlined"
                color="primary"
              />
              {selectedItem.englishName && (
                <Chip
                  label={selectedItem.englishName}
                  size="small"
                  variant="outlined"
                  color="secondary"
                />
              )}
              {selectedItem.level !== undefined && (
                <Chip
                  label={`سطح: ${selectedItem.level}`}
                  size="small"
                  variant="outlined"
                  color="info"
                />
              )}
              {selectedItem.coordinates && (
                <Chip
                  label={`📍 ${selectedItem.coordinates.lat}, ${selectedItem.coordinates.lng}`}
                  size="small"
                  variant="outlined"
                  color="warning"
                />
              )}
              {selectedItem.natoEquivalent && (
                <Chip
                  label={`NATO: ${selectedItem.natoEquivalent}`}
                  size="small"
                  variant="outlined"
                  color="secondary"
                />
              )}
              {selectedItem.isRequired !== undefined && (
                <Chip
                  label={selectedItem.isRequired ? 'اجباری' : 'اختیاری'}
                  size="small"
                  variant="outlined"
                  color={selectedItem.isRequired ? 'error' : 'default'}
                />
              )}
            </Box>
            {selectedItem.description && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {selectedItem.description}
              </Typography>
            )}
          </Alert>
        </Box>
      )}

      {/* نمایش اطلاعات debug (فقط در حالت توسعه) */}
      {process.env.NODE_ENV === 'development' && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Debug: Category={field.referenceCategory}, Sections={field.referenceSections}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ReferenceFieldRenderer;