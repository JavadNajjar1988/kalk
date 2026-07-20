import React from 'react';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useAvailableCategories } from '@/hooks/useDefinitionData';

interface CategorySelectorProps {
  value?: string;
  onChange: (categoryId: string) => void;
  label?: string;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({ value = '', onChange, label = 'دسته‌بندی' }) => {
  const { categories } = useAvailableCategories();
  return (
    <FormControl fullWidth>
      <InputLabel>{label}</InputLabel>
      <Select value={value} label={label} onChange={(e) => onChange(e.target.value)}>
        {categories.map((c) => (
          <MenuItem key={c.id} value={c.id}>
            {c.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default CategorySelector;
