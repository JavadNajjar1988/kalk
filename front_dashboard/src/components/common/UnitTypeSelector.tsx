import React, { useState, useMemo } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Grid,
  Paper,
  Chip,
  useTheme,
  alpha,
  ListSubheader,
  TextField,
  InputAdornment,
  Autocomplete,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ms from 'milsymbol';
import { ALL_UNIT_TYPES, UnitType as ConfigUnitType, UNIT_CATEGORIES, SYMBOL_SET_TO_UNIT_TYPES } from '@/config/unitTypes';

interface UnitType {
  value: string;
  label: string;
  icon: string;
  category: string;
  description?: string;
  sidc?: string;
}

interface UnitTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  size?: 'small' | 'medium';
  variant?: 'select' | 'grid';
  showIcons?: boolean;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  filterByCategory?: string;
  symbolSet?: string;
}

const UnitTypeSelector: React.FC<UnitTypeSelectorProps> = ({
  value,
  onChange,
  label = 'نوع یگان',
  size = 'medium',
  variant = 'select',
  showIcons = true,
  disabled = false,
  required = false,
  error = false,
  helperText,
  filterByCategory,
  symbolSet,
}) => {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');

  // فیلتر کردن یگان‌ها بر اساس symbolSet اگر مشخص شده باشد
  const filteredUnitTypes = useMemo(() => {
    let units = ALL_UNIT_TYPES;
    
    // فیلتر بر اساس symbolSet
    if (symbolSet) {
      units = SYMBOL_SET_TO_UNIT_TYPES[symbolSet] || [];
    }
    
    // فیلتر بر اساس دسته‌بندی
    if (filterByCategory) {
      units = units.filter(unit => unit.category === filterByCategory);
    }
    
    return units.map(unit => ({
      value: unit.id,
      label: unit.name,
      icon: new ms.Symbol(unit.sidc, { size: 30 }).asCanvas().toDataURL(),
      category: unit.category,
      description: unit.description,
      sidc: unit.sidc,
    }));
  }, [filterByCategory, symbolSet]);

  // گروه‌بندی یگان‌ها بر اساس دسته‌بندی
  const groupedUnitTypes = useMemo(() => {
    const groups: Record<string, UnitType[]> = {};
    
    filteredUnitTypes.forEach(unit => {
      if (!groups[unit.category]) {
        groups[unit.category] = [];
      }
      groups[unit.category].push(unit);
    });
    
    return groups;
  }, [filteredUnitTypes]);

  // فیلتر کردن یگان‌ها بر اساس عبارت جستجو
  const searchFilteredUnitTypes = useMemo(() => {
    if (!searchTerm) return filteredUnitTypes;
    
    return filteredUnitTypes.filter(unit => 
      unit.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
      unit.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (unit.description && unit.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [filteredUnitTypes, searchTerm]);

  // یافتن یگان انتخاب شده
  const selectedUnit = useMemo(() => {
    return filteredUnitTypes.find(unit => unit.value === value);
  }, [filteredUnitTypes, value]);

  // نمایش به صورت Select
  if (variant === 'select') {
    return (
      <FormControl 
        fullWidth 
        size={size} 
        disabled={disabled}
        required={required}
        error={error}
      >
        <InputLabel>{label}</InputLabel>
        
        <Autocomplete
          key={`unit-selector-${symbolSet}`} // اضافه کردن key منحصر به فرد
          value={selectedUnit || null}
          onChange={(event, newValue) => {
            if (newValue) {
              onChange(newValue.value);
            }
          }}
          options={searchFilteredUnitTypes}
          groupBy={(option) => option.category}
          getOptionLabel={(option) => option.label}
          renderInput={(params) => (
            <TextField
              {...params}
              label={label}
              helperText={helperText}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                    {params.InputProps.startAdornment}
                  </>
                ),
              }}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          )}
          renderOption={(props, option) => (
            <MenuItem {...props} key={`${option.value}-${option.category}`}>
              <Box display="flex" alignItems="center">
                {showIcons && (
                  <Box mr={1} width={30} height={30} display="flex" alignItems="center" justifyContent="center">
                    <img src={option.icon} alt={option.label} style={{ maxWidth: '100%', maxHeight: '100%' }} />
                  </Box>
                )}
                <Typography>{option.label}</Typography>
              </Box>
            </MenuItem>
          )}
          disableListWrap
          ListboxProps={{
            style: { maxHeight: 300 }
          }}
          loading={filteredUnitTypes.length === 0}
          loadingText="در حال بارگذاری..."
          noOptionsText="هیچ یگانی یافت نشد"
        />
        
        {helperText && <Typography variant="caption" color={error ? "error" : "textSecondary"}>{helperText}</Typography>}
      </FormControl>
    );
  }

  // نمایش به صورت Grid
  return (
    <Box>
      {label && <Typography variant="subtitle1" gutterBottom>{label}</Typography>}
      
      <TextField
        fullWidth
        size={size}
        placeholder="جستجو..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
      />
      
      {Object.entries(groupedUnitTypes).map(([category, units]) => {
        // فیلتر کردن یگان‌های هر گروه بر اساس عبارت جستجو
        const filteredUnits = !searchTerm 
          ? units 
          : units.filter(unit => 
              unit.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
              (unit.description && unit.description.toLowerCase().includes(searchTerm.toLowerCase()))
            );
            
        // اگر هیچ یگانی در این گروه نباشد، آن را نمایش نده
        if (filteredUnits.length === 0) return null;
        
        return (
          <Box key={category} mb={3}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>{category}</Typography>
            <Grid container spacing={1}>
              {filteredUnits.map(unit => (
                <Grid item xs={6} sm={4} md={3} key={unit.value}>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 1,
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      backgroundColor: value === unit.value ? alpha(theme.palette.primary.main, 0.1) : undefined,
                      border: value === unit.value ? `1px solid ${theme.palette.primary.main}` : '1px solid transparent',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.05),
                      },
                    }}
                    onClick={() => onChange(unit.value)}
                  >
                    {showIcons && (
                      <Box mr={1} width={30} height={30} display="flex" alignItems="center" justifyContent="center">
                        <img src={unit.icon} alt={unit.label} style={{ maxWidth: '100%', maxHeight: '100%' }} />
                      </Box>
                    )}
                    <Typography variant="body2" noWrap>{unit.label}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        );
      })}
      
      {searchFilteredUnitTypes.length === 0 && (
        <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 2 }}>
          هیچ یگانی یافت نشد
        </Typography>
      )}
      
      {helperText && <Typography variant="caption" color={error ? "error" : "textSecondary"}>{helperText}</Typography>}
    </Box>
  );
};

export default UnitTypeSelector; 