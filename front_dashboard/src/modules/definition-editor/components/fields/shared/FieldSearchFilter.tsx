import React, { useState } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon, FilterList as FilterIcon } from '@mui/icons-material';
import { ExtendedCustomFieldDefinition } from '../types/FieldEditTypes';

interface FieldSearchFilterProps {
  fields: ExtendedCustomFieldDefinition[];
  onFilteredFieldsChange: (fields: ExtendedCustomFieldDefinition[]) => void;
}

const FieldSearchFilter: React.FC<FieldSearchFilterProps> = ({
  fields,
  onFilteredFieldsChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [requiredFilter, setRequiredFilter] = useState<string>('all');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    applyFilters(query, typeFilter, requiredFilter);
  };

  const handleTypeFilter = (type: string) => {
    setTypeFilter(type);
    applyFilters(searchQuery, type, requiredFilter);
  };

  const handleRequiredFilter = (required: string) => {
    setRequiredFilter(required);
    applyFilters(searchQuery, typeFilter, required);
  };

  const applyFilters = (query: string, type: string, required: string) => {
    let filtered = [...fields];

    // Text search
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(field =>
        field.name?.toLowerCase().includes(lowerQuery) ||
        field.englishName?.toLowerCase().includes(lowerQuery) ||
        field.type?.toLowerCase().includes(lowerQuery)
      );
    }

    // Type filter
    if (type !== 'all') {
      filtered = filtered.filter(field => field.type === type);
    }

    // Required filter
    if (required === 'required') {
      filtered = filtered.filter(field => field.isRequired);
    } else if (required === 'optional') {
      filtered = filtered.filter(field => !field.isRequired);
    }

    onFilteredFieldsChange(filtered);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setRequiredFilter('all');
    onFilteredFieldsChange(fields);
  };

  const hasActiveFilters = searchQuery || typeFilter !== 'all' || requiredFilter !== 'all';

  // Get unique field types
  const fieldTypes = Array.from(new Set(fields.map(f => f.type))).sort();

  return (
    <Box
      sx={{
        p: 2.5,
        mb: 3,
        borderRadius: '12px',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(135, 206, 250, 0.2)',
        boxShadow: '0 4px 16px rgba(135, 206, 250, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <FilterIcon sx={{ color: '#4A90E2' }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <span style={{ color: '#4A90E2', fontWeight: 600 }}>جستجو و فیلتر</span>
          {hasActiveFilters && (
            <Chip
              size="small"
              label="فیلتر فعال"
              color="primary"
              variant="filled"
              sx={{ height: 20, fontSize: '0.75rem' }}
            />
          )}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {/* Search Input */}
        <TextField
          placeholder="جستجو در نام، کلید یا نوع فیلد..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          sx={{
            flex: '1 1 300px',
            '& .MuiOutlinedInput-root': {
              background: 'rgba(255, 255, 255, 0.8)',
              borderRadius: '8px',
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#64748B' }} />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => handleSearch('')}
                  sx={{ color: '#64748B' }}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {/* Type Filter */}
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>نوع فیلد</InputLabel>
          <Select
            value={typeFilter}
            onChange={(e) => handleTypeFilter(e.target.value)}
            label="نوع فیلد"
            sx={{
              background: 'rgba(255, 255, 255, 0.8)',
              borderRadius: '8px',
            }}
          >
            <MenuItem value="all">همه انواع</MenuItem>
            {fieldTypes.map(type => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Required Filter */}
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>الزامی</InputLabel>
          <Select
            value={requiredFilter}
            onChange={(e) => handleRequiredFilter(e.target.value)}
            label="الزامی"
            sx={{
              background: 'rgba(255, 255, 255, 0.8)',
              borderRadius: '8px',
            }}
          >
            <MenuItem value="all">همه</MenuItem>
            <MenuItem value="required">اجباری</MenuItem>
            <MenuItem value="optional">اختیاری</MenuItem>
          </Select>
        </FormControl>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <IconButton
            onClick={clearAllFilters}
            sx={{
              bgcolor: 'rgba(239, 68, 68, 0.1)',
              color: '#DC2626',
              borderRadius: '8px',
              '&:hover': {
                bgcolor: 'rgba(239, 68, 68, 0.2)',
              }
            }}
          >
            <ClearIcon />
          </IconButton>
        )}
      </Box>
    </Box>
  );
};

export default FieldSearchFilter;