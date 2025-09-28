import React from 'react';
import { Paper, IconButton, InputBase, SxProps, Theme, alpha } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from '@/hooks/useTranslation';

interface SearchBarProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  sx?: SxProps<Theme>;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, onSubmit, onClear, placeholder, sx }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Paper
      component="form"
      onSubmit={e => {
        e.preventDefault();
        if (value.trim()) {
          onSubmit(value.trim());
          // پاک کردن متن جستجو بعد از ارسال
          if (onClear) onClear();
        }
      }}
      sx={{
        p: '4px 8px',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        bgcolor: alpha(theme.palette.background.paper, 0.6),
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        borderRadius: '24px',
        transition: 'all 0.2s ease',
        '&:hover': {
          bgcolor: alpha(theme.palette.background.paper, 0.8),
          boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.1)}`,
        },
        '&:focus-within': {
          bgcolor: theme.palette.background.paper,
          boxShadow: `0 2px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
        },
        ...sx,
      }}
    >
      <IconButton sx={{ p: '10px' }} aria-label="search" type="submit">
        <SearchIcon />
      </IconButton>
      <InputBase
        sx={{ ml: 1, flex: 1, fontSize: '0.95rem' }}
        placeholder={placeholder || t('layout.searchPlaceholder', 'جستجو در سیستم...')}
        inputProps={{ 'aria-label': 'search' }}
        value={value}
        onChange={onChange}
      />
    </Paper>
  );
};

export default SearchBar; 