import React, { useState, useRef } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  alpha
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { DefinitionCategory } from '../types';

interface SearchAndFilterProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  selectedCategory?: string;
  onCategoryChange?: (categoryId: string) => void;
  categories?: DefinitionCategory[];
  showAdvancedFilters?: boolean;
  onToggleAdvancedFilters?: () => void;
  isDefinitionView?: boolean;
  sortOption: string;
  onSortChange: (option: string) => void;
}

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  searchTerm,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  selectedCategory,
  onCategoryChange,
  categories = [],
  showAdvancedFilters = false,
  onToggleAdvancedFilters,
  isDefinitionView = false,
  sortOption,
  onSortChange,
}) => {
  const theme = useTheme();
  const [showInput, setShowInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpen = () => {
    setShowInput(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleClose = () => {
    setShowInput(false);
    onSearchChange('');
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // اگر مقدار جستجو خالی بود، به حالت آیکون برگردد
    if (!e.target.value) setShowInput(false);
  };

  const handleClearSearch = () => {
    onSearchChange('');
    inputRef.current?.focus();
  };

  return (
    <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
      {/* آیکون جستجو یا نوار جستجو */}
      {!showInput && !searchTerm && (
        <IconButton 
          onClick={handleOpen} 
          color="default"
          sx={{
            boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.08)}, 0 1px 3px ${alpha(theme.palette.common.black, 0.04)}`,
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.12)}, 0 2px 6px ${alpha(theme.palette.common.black, 0.08)}`,
              transform: 'scale(1.05)',
            },
          }}
        >
          <SearchIcon />
        </IconButton>
      )}
      {(showInput || searchTerm) && (
        <TextField
          inputRef={inputRef}
          fullWidth
          placeholder={isDefinitionView ? "جستجو در تعاریف..." : "جستجو در دسته‌بندی‌ها..."}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          onBlur={handleBlur}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={handleClearSearch}
                  sx={{ 
                    color: 'text.secondary',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'scale(1.1)',
                    },
                  }}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            maxWidth: 300,
            height: 36,
            '& .MuiOutlinedInput-root': {
              borderRadius: '18px',
              height: 36,
              backgroundColor: alpha(theme.palette.background.paper, 0.95),
              backdropFilter: 'blur(8px)',
              boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.08)}, 0 2px 6px ${alpha(theme.palette.common.black, 0.04)}`,
              border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '& fieldset': {
                border: 'none',
              },
              '&:hover': {
                boxShadow: `0 6px 16px ${alpha(theme.palette.common.black, 0.12)}, 0 3px 8px ${alpha(theme.palette.common.black, 0.08)}`,
                borderColor: alpha(theme.palette.primary.light, 0.3),
              },
              '&:hover fieldset': {
                border: 'none',
              },
              '&.Mui-focused': {
                boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}, 0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`,
                borderColor: theme.palette.primary.main,
              },
              '&.Mui-focused fieldset': {
                border: 'none',
              },
            },
            '& .MuiInputBase-input': {
              height: '20px',
              padding: '8px 0',
            },
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setShowInput(false);
              onSearchChange('');
            }
          }}
        />
      )}
      {/* مرتب‌سازی */}
      <FormControl sx={{ minWidth: 150 }}>
        <InputLabel>مرتب‌سازی</InputLabel>
        <Select
          value={sortOption}
          label="مرتب‌سازی"
          size="small"
          onChange={(e) => onSortChange(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              boxShadow: `0 2px 6px ${alpha(theme.palette.common.black, 0.06)}, 0 1px 3px ${alpha(theme.palette.common.black, 0.04)}`,
              transition: 'all 0.2s ease',
              '&:hover': {
                boxShadow: `0 4px 10px ${alpha(theme.palette.common.black, 0.1)}, 0 2px 5px ${alpha(theme.palette.common.black, 0.06)}`,
              },
            },
          }}
        >
          <MenuItem value="order">بر اساس ترتیب</MenuItem>
          <MenuItem value="name">بر اساس نام</MenuItem>
          <MenuItem value="createdAt">جدیدترین</MenuItem>
          <MenuItem value="updatedAt">آخرین ویرایش</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
};

export default SearchAndFilter;
