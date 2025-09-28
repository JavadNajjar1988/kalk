import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import { useAvailableCategories } from '@/hooks/useDefinitionData';

interface CategorySelectorProps {
  value?: string;
  onChange: (categoryId: string) => void;
  label?: string;
  error?: boolean;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  showDescription?: boolean;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  value = '',
  onChange,
  label = 'انتخاب دسته‌بندی',
  error = false,
  helperText,
  required = false,
  disabled = false,
  fullWidth = true,
  showDescription = false,
}) => {
  const { categories } = useAvailableCategories();

  const handleChange = (event: any) => {
    onChange(event.target.value);
  };

  const selectedCategory = categories.find(cat => cat.id === value);

  return (
    <Box>
      <FormControl 
        fullWidth={fullWidth} 
        error={error} 
        required={required}
        disabled={disabled}
      >
        <InputLabel>{label}</InputLabel>
        <Select
          value={value}
          onChange={handleChange}
          label={label}
          renderValue={(selected) => {
            if (!selected) return '';
            const category = categories.find(cat => cat.id === selected);
            return category ? category.name : selected;
          }}
        >
          <MenuItem value="">
            <em>هیچ دسته‌بندی انتخاب نشده</em>
          </MenuItem>
          {categories.map((category) => (
            <MenuItem key={category.id} value={category.id}>
              <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1">
                    {category.name}
                  </Typography>
                  <Chip 
                    label={category.englishName} 
                    size="small" 
                    variant="outlined"
                    sx={{ ml: 1 }}
                  />
                </Box>
                {showDescription && (
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    {category.englishName}
                  </Typography>
                )}
              </Box>
            </MenuItem>
          ))}
        </Select>
        {helperText && (
          <Typography 
            variant="caption" 
            color={error ? 'error' : 'text.secondary'}
            sx={{ mt: 0.5, mx: 1.75 }}
          >
            {helperText}
          </Typography>
        )}
      </FormControl>

      {selectedCategory && showDescription && (
        <Box sx={{ mt: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="body2" color="primary">
            دسته‌بندی انتخاب شده: {selectedCategory.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ({selectedCategory.englishName})
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default CategorySelector;