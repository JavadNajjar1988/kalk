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
  SelectChangeEvent
} from '@mui/material';
import {
  Category as CategoryIcon,
  DataObject as DataIcon,
  AccountTree as TreeIcon
} from '@mui/icons-material';

// Hooks
import { useAvailableReferenceCategories } from '@/hooks/useReferenceData';

interface AvailableCategory {
  id: string;
  name: string;
  englishName: string;
  description?: string;
  icon?: string;
  hasHierarchy?: boolean;
  hasData?: boolean;
}

interface ReferenceCategorySelectorProps {
  value?: string;
  onChange: (categoryId: string) => void;
  error?: string;
  disabled?: boolean;
  label?: string;
  fullWidth?: boolean;
}

/**
 * کامپوننت انتخاب دسته‌بندی مرجع برای فیلدهای Reference
 * این کامپوننت لیست دسته‌بندی‌های موجود را نمایش داده و امکان انتخاب یکی از آنها را فراهم می‌کند
 */
const ReferenceCategorySelector: React.FC<ReferenceCategorySelectorProps> = ({
  value = '',
  onChange,
  error,
  disabled = false,
  label = 'دسته‌بندی مرجع',
  fullWidth = true
}) => {
  const [loading, setLoading] = useState(false);
  
  // استفاده از hook برای دریافت دسته‌بندی‌های مجاز
  const { categories } = useAvailableReferenceCategories();

  const handleChange = (event: SelectChangeEvent) => {
    const selectedCategoryId = event.target.value as string;
    onChange(selectedCategoryId);
  };

  const getSelectedCategory = (): AvailableCategory | undefined => {
    return categories.find(cat => cat.id === value);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
        <CircularProgress size={20} />
        <Typography variant="body2" color="text.secondary">
          در حال بارگذاری دسته‌بندی‌ها...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <FormControl fullWidth={fullWidth} error={!!error} disabled={disabled}>
        <InputLabel id="reference-category-label">{label}</InputLabel>
        <Select
          labelId="reference-category-label"
          value={value}
          label={label}
          onChange={handleChange}
          displayEmpty
        >
          <MenuItem value="">
            <em>انتخاب کنید</em>
          </MenuItem>
          {categories.map((category) => (
            <MenuItem key={category.id} value={category.id}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                <Box sx={{ fontSize: '1.2rem' }}>
                  {category.icon || <CategoryIcon fontSize="small" />}
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" fontWeight={500}>
                    {category.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {category.englishName}
                  </Typography>
                  {(category.hasHierarchy || category.hasData) && (
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                      {category.hasHierarchy && (
                        <Chip 
                          label="سطوح" 
                          size="small" 
                          variant="outlined" 
                          color="primary"
                          sx={{ fontSize: '0.6rem', height: '16px' }}
                        />
                      )}
                      {category.hasData && (
                        <Chip 
                          label="داده" 
                          size="small" 
                          variant="outlined" 
                          color="secondary"
                          sx={{ fontSize: '0.6rem', height: '16px' }}
                        />
                      )}
                    </Box>
                  )}
                </Box>
              </Box>
            </MenuItem>
          ))}
        </Select>
        {error && (
          <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
            {error}
          </Typography>
        )}
      </FormControl>

      {/* نمایش اطلاعات دسته‌بندی انتخاب شده */}
      {value && getSelectedCategory() && (
        <Box sx={{ mt: 2 }}>
          <Alert severity="info" sx={{ borderRadius: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <DataIcon fontSize="small" />
              <Typography variant="body2" fontWeight={600}>
                دسته‌بندی انتخاب شده: {getSelectedCategory()?.name}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {getSelectedCategory()?.description}
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Chip
                label={`ID: ${getSelectedCategory()?.id}`}
                size="small"
                variant="outlined"
                color="primary"
              />
            </Box>
          </Alert>
        </Box>
      )}

      {/* راهنمای استفاده */}
      {!value && (
        <Box sx={{ mt: 2 }}>
          <Alert severity="warning" sx={{ borderRadius: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <TreeIcon fontSize="small" />
              <Typography variant="body2" fontWeight={600}>
                انتخاب دسته‌بندی مرجع
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              برای ایجاد فیلد مرجع، ابتدا دسته‌بندی مورد نظر خود را انتخاب کنید.
              داده‌های این فیلد از دسته‌بندی انتخاب شده خوانده خواهد شد.
            </Typography>
          </Alert>
        </Box>
      )}
    </Box>
  );
};

export default ReferenceCategorySelector;