/**
 * ScenarioToolbar Component
 * نوار ابزار برای عملیات سناریو
 */

import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Sort as SortIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { ScenarioToolbarProps } from '../types';

const ScenarioToolbar: React.FC<ScenarioToolbarProps> = ({
  onNewScenario,
  onSearch,
  onSort,
  sortOptions,
  searchValue = '',
  className,
  showSearch = true,
  showSort = true
}) => {
  const theme = useTheme();
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [searchInput, setSearchInput] = useState(searchValue);

  const handleSortClick = (event: React.MouseEvent<HTMLElement>) => {
    setSortAnchorEl(event.currentTarget);
  };

  const handleSortClose = () => {
    setSortAnchorEl(null);
  };

  const handleSortSelect = (sortValue: string) => {
    onSort?.(sortValue);
    handleSortClose();
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchInput(value);
    onSearch?.(value);
  };

  return (
    <Box
      className={className}
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 2,
        flexWrap: 'wrap'
      }}
    >
      {/* Left side - Search */}
      {showSearch && onSearch && (
        <Box sx={{ flex: 1, maxWidth: 400 }}>
          <TextField
            size="small"
            placeholder="جستجو در سناریوها..."
            value={searchInput}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: theme.palette.text.secondary }} />
                </InputAdornment>
              )
            }}
            sx={{
              width: '100%',
              '& .MuiOutlinedInput-root': {
                bgcolor: theme.palette.background.paper
              }
            }}
          />
        </Box>
      )}

      {/* Right side - Actions */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* Sort button */}
        {showSort && sortOptions && sortOptions.length > 0 && (
          <>
            <Button
              variant="outlined"
              startIcon={<SortIcon />}
              onClick={handleSortClick}
              size="small"
            >
              مرتب‌سازی
            </Button>
            
            <Menu
              anchorEl={sortAnchorEl}
              open={Boolean(sortAnchorEl)}
              onClose={handleSortClose}
              PaperProps={{
                sx: { minWidth: 200 }
              }}
            >
              {sortOptions.map((option, index) => (
                <MenuItem
                  key={option.value}
                  onClick={() => {
                    if (option.action) {
                      option.action();
                    } else {
                      handleSortSelect(option.value);
                    }
                  }}
                  disabled={option.disabled}
                  sx={{
                    '&.Mui-selected': {
                      bgcolor: theme.palette.action.selected
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {option.active && (
                      <CheckIcon 
                        sx={{ 
                          fontSize: 20, 
                          color: theme.palette.primary.main 
                        }} 
                      />
                    )}
                  </ListItemIcon>
                  <ListItemText primary={option.label} />
                </MenuItem>
              ))}
            </Menu>
          </>
        )}

        {/* New scenario button */}
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onNewScenario}
          size="small"
          sx={{
            bgcolor: theme.palette.primary.main,
            '&:hover': {
              bgcolor: theme.palette.primary.dark
            }
          }}
        >
          ایجاد جدید
        </Button>
      </Box>
    </Box>
  );
};

export default ScenarioToolbar;