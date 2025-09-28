import React, { useState, useMemo } from 'react';
import {
  Box,
  TextField,
  Autocomplete,
  Avatar,
  Typography,
  Chip,
  Paper,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ListItemAvatar,
  ListItemText,
  useTheme,
  SelectChangeEvent,
  FormControlProps,
  Grid,
} from '@mui/material';
import { Search as SearchIcon, Flag as FlagIcon, Public as PublicIcon } from '@mui/icons-material';
import countries, { Country, getFlagUrl } from '@/config/countries';
import FarsiTypography from './FarsiTypography';

interface CountrySelectorProps extends Omit<FormControlProps, 'onChange' | 'variant'> {
  value: string | null;
  onChange: (value: string | null) => void;
  label?: string;
  placeholder?: string;
  variant?: 'autocomplete' | 'select';
  size?: 'small' | 'medium';
  continent?: 'asia' | 'europe' | 'africa' | 'americas' | 'oceania' | 'all';
  showOnlyFlags?: boolean;
  flagSize?: 'small' | 'medium' | 'large';
  className?: string;
  style?: React.CSSProperties;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  showGroups?: boolean;
  groups?: {
    nato?: boolean;
    eu?: boolean;
    cis?: boolean;
  };
}

/**
 * کامپوننت انتخاب کشور با نمایش پرچم
 */
const CountrySelector: React.FC<CountrySelectorProps> = ({
  value,
  onChange,
  label = 'کشور',
  placeholder = 'انتخاب کشور',
  variant = 'select',
  size = 'medium',
  continent = 'all',
  showOnlyFlags = false,
  flagSize = 'medium',
  className,
  style,
  error,
  helperText,
  disabled = false,
  required = false,
  showGroups = false,
  groups = {},
  ...props
}) => {
  const theme = useTheme();
  const [searchText, setSearchText] = useState('');
  
  // فیلتر کشورها بر اساس قاره و گروه‌ها
  const filteredCountries = useMemo(() => {
    let result = [...countries];
    
    // فیلتر بر اساس قاره
    if (continent !== 'all') {
      result = result.filter(country => country.continent === continent);
    }
    
    // فیلتر بر اساس گروه‌های خاص اگر انتخاب شده باشند
    if (showGroups) {
      if (groups.nato) {
        result = result.filter(country => country.isNato);
      }
      if (groups.eu) {
        result = result.filter(country => country.isEU);
      }
      if (groups.cis) {
        result = result.filter(country => country.isCIS);
      }
    }
    
    return result;
  }, [continent, showGroups, groups]);
  
  // جستجو در لیست کشورها
  const searchedCountries = useMemo(() => {
    if (!searchText) return filteredCountries;
    
    return filteredCountries.filter(country => 
      country.name.includes(searchText) || 
      country.nameEn.toLowerCase().includes(searchText.toLowerCase()) ||
      country.code.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [filteredCountries, searchText]);
  
  // یافتن کشور بر اساس کد
  const selectedCountry = useMemo(() => {
    if (!value) return null;
    return countries.find(country => country.code === value) || null;
  }, [value]);
  
  // اندازه پرچم‌ها
  const getFlagDimensions = () => {
    switch (flagSize) {
      case 'small':
        return { width: 20, height: 15 };
      case 'large':
        return { width: 40, height: 30 };
      case 'medium':
      default:
        return { width: 30, height: 22 };
    }
  };
  
  // اگر از اتوکامپلت استفاده می‌کنیم
  if (variant === 'autocomplete') {
    return (
      <Autocomplete
        value={selectedCountry}
        onChange={(event, newValue) => {
          onChange(newValue ? newValue.code : null);
        }}
        disabled={disabled}
        options={searchedCountries}
        getOptionLabel={(option) => option.name}
        isOptionEqualToValue={(option, value) => option.code === value.code}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            placeholder={placeholder}
            error={error}
            helperText={helperText}
            required={required}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <>
                  <InputAdornment position="start">
                    <PublicIcon color="action" />
                  </InputAdornment>
                  {params.InputProps.startAdornment}
                </>
              ),
            }}
            size={size}
          />
        )}
        renderOption={(props, option) => (
          <MenuItem component="li" {...props}>
            <Box display="flex" alignItems="center" gap={1}>
              <Avatar
                src={getFlagUrl(option.code)}
                alt={option.name}
                variant="rounded"
                sx={{ width: getFlagDimensions().width, height: getFlagDimensions().height }}
              />
              <FarsiTypography variant="body2">{option.name}</FarsiTypography>
              {!showOnlyFlags && (
                <Typography variant="caption" color="text.secondary">
                  ({option.nameEn})
                </Typography>
              )}
            </Box>
          </MenuItem>
        )}
      />
    );
  }
  
  // اگر از سلکت استفاده می‌کنیم (پیش‌فرض)
  return (
    <FormControl fullWidth error={error} disabled={disabled} required={required} size={size} {...props}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value || ''}
        onChange={(e: SelectChangeEvent) => onChange(e.target.value || null)}
        label={label}
        MenuProps={{
          PaperProps: {
            style: {
              maxHeight: 400,
            },
          },
        }}
        startAdornment={
          selectedCountry ? (
            <InputAdornment position="start">
              <Avatar
                src={getFlagUrl(selectedCountry.code)}
                alt={selectedCountry.name}
                variant="rounded"
                sx={{ 
                  width: getFlagDimensions().width, 
                  height: getFlagDimensions().height,
                  mr: 1
                }}
              />
            </InputAdornment>
          ) : (
            <InputAdornment position="start">
              <FlagIcon color="action" sx={{ mr: 1 }} />
            </InputAdornment>
          )
        }
      >
        <MenuItem value="" sx={{ mb: 1 }}>
          <Typography color="text.secondary">{placeholder}</Typography>
        </MenuItem>
        
        <Box sx={{ px: 2, pb: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="جستجوی کشور..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        
        {/* گروه‌بندی کشورها بر اساس قاره */}
        {searchedCountries.filter(c => c.continent === 'asia').length > 0 && (
          <Box>
            <Box sx={{ px: 2, py: 0.5, bgcolor: 'action.hover' }}>
              <Typography variant="caption" color="text.secondary" fontWeight="bold">
                آسیا
              </Typography>
            </Box>
            {searchedCountries
              .filter(c => c.continent === 'asia')
              .map(country => (
                <MenuItem key={country.code} value={country.code}>
                  <ListItemAvatar sx={{ minWidth: 'auto', mr: 1.5 }}>
                    <Avatar
                      src={getFlagUrl(country.code)}
                      alt={country.name}
                      variant="rounded"
                      sx={{ width: getFlagDimensions().width, height: getFlagDimensions().height }}
                    />
                  </ListItemAvatar>
                  <ListItemText
                    primary={country.name}
                    secondary={!showOnlyFlags ? country.nameEn : undefined}
                    primaryTypographyProps={{
                      variant: 'body2',
                    }}
                    secondaryTypographyProps={{
                      variant: 'caption',
                    }}
                  />
                </MenuItem>
              ))
            }
          </Box>
        )}
        
        {searchedCountries.filter(c => c.continent === 'europe').length > 0 && (
          <Box>
            <Box sx={{ px: 2, py: 0.5, bgcolor: 'action.hover' }}>
              <Typography variant="caption" color="text.secondary" fontWeight="bold">
                اروپا
              </Typography>
            </Box>
            {searchedCountries
              .filter(c => c.continent === 'europe')
              .map(country => (
                <MenuItem key={country.code} value={country.code}>
                  <ListItemAvatar sx={{ minWidth: 'auto', mr: 1.5 }}>
                    <Avatar
                      src={getFlagUrl(country.code)}
                      alt={country.name}
                      variant="rounded"
                      sx={{ width: getFlagDimensions().width, height: getFlagDimensions().height }}
                    />
                  </ListItemAvatar>
                  <ListItemText
                    primary={country.name}
                    secondary={!showOnlyFlags ? country.nameEn : undefined}
                    primaryTypographyProps={{
                      variant: 'body2',
                    }}
                    secondaryTypographyProps={{
                      variant: 'caption',
                    }}
                  />
                </MenuItem>
              ))
            }
          </Box>
        )}
        
        {searchedCountries.filter(c => c.continent === 'americas').length > 0 && (
          <Box>
            <Box sx={{ px: 2, py: 0.5, bgcolor: 'action.hover' }}>
              <Typography variant="caption" color="text.secondary" fontWeight="bold">
                آمریکا
              </Typography>
            </Box>
            {searchedCountries
              .filter(c => c.continent === 'americas')
              .map(country => (
                <MenuItem key={country.code} value={country.code}>
                  <ListItemAvatar sx={{ minWidth: 'auto', mr: 1.5 }}>
                    <Avatar
                      src={getFlagUrl(country.code)}
                      alt={country.name}
                      variant="rounded"
                      sx={{ width: getFlagDimensions().width, height: getFlagDimensions().height }}
                    />
                  </ListItemAvatar>
                  <ListItemText
                    primary={country.name}
                    secondary={!showOnlyFlags ? country.nameEn : undefined}
                    primaryTypographyProps={{
                      variant: 'body2',
                    }}
                    secondaryTypographyProps={{
                      variant: 'caption',
                    }}
                  />
                </MenuItem>
              ))
            }
          </Box>
        )}
        
        {searchedCountries.filter(c => c.continent === 'africa').length > 0 && (
          <Box>
            <Box sx={{ px: 2, py: 0.5, bgcolor: 'action.hover' }}>
              <Typography variant="caption" color="text.secondary" fontWeight="bold">
                آفریقا
              </Typography>
            </Box>
            {searchedCountries
              .filter(c => c.continent === 'africa')
              .map(country => (
                <MenuItem key={country.code} value={country.code}>
                  <ListItemAvatar sx={{ minWidth: 'auto', mr: 1.5 }}>
                    <Avatar
                      src={getFlagUrl(country.code)}
                      alt={country.name}
                      variant="rounded"
                      sx={{ width: getFlagDimensions().width, height: getFlagDimensions().height }}
                    />
                  </ListItemAvatar>
                  <ListItemText
                    primary={country.name}
                    secondary={!showOnlyFlags ? country.nameEn : undefined}
                    primaryTypographyProps={{
                      variant: 'body2',
                    }}
                    secondaryTypographyProps={{
                      variant: 'caption',
                    }}
                  />
                </MenuItem>
              ))
            }
          </Box>
        )}
        
        {searchedCountries.filter(c => c.continent === 'oceania').length > 0 && (
          <Box>
            <Box sx={{ px: 2, py: 0.5, bgcolor: 'action.hover' }}>
              <Typography variant="caption" color="text.secondary" fontWeight="bold">
                اقیانوسیه
              </Typography>
            </Box>
            {searchedCountries
              .filter(c => c.continent === 'oceania')
              .map(country => (
                <MenuItem key={country.code} value={country.code}>
                  <ListItemAvatar sx={{ minWidth: 'auto', mr: 1.5 }}>
                    <Avatar
                      src={getFlagUrl(country.code)}
                      alt={country.name}
                      variant="rounded"
                      sx={{ width: getFlagDimensions().width, height: getFlagDimensions().height }}
                    />
                  </ListItemAvatar>
                  <ListItemText
                    primary={country.name}
                    secondary={!showOnlyFlags ? country.nameEn : undefined}
                    primaryTypographyProps={{
                      variant: 'body2',
                    }}
                    secondaryTypographyProps={{
                      variant: 'caption',
                    }}
                  />
                </MenuItem>
              ))
            }
          </Box>
        )}
      </Select>
      {helperText && (
        <Typography color={error ? 'error' : 'text.secondary'} variant="caption">
          {helperText}
        </Typography>
      )}
    </FormControl>
  );
};

export default CountrySelector;

// نمایش گرید پرچم‌های کشورها
export const CountryFlagGrid: React.FC<{
  countries: Country[];
  onSelect?: (country: Country) => void;
  gridSpacing?: number;
  variant?: 'grid' | 'flow';
  size?: 'small' | 'medium' | 'large';
}> = ({ 
  countries, 
  onSelect, 
  gridSpacing = 1, 
  variant = 'grid',
  size = 'medium' 
}) => {
  
  // اندازه پرچم‌ها
  const getFlagSize = () => {
    switch (size) {
      case 'small':
        return { width: 32, height: 24 };
      case 'large':
        return { width: 64, height: 48 };
      case 'medium':
      default:
        return { width: 48, height: 36 };
    }
  };
  
  if (variant === 'flow') {
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: gridSpacing }}>
        {countries.map(country => (
          <Chip
            key={country.code}
            avatar={
              <Avatar
                src={getFlagUrl(country.code)}
                alt={country.name}
                variant="rounded"
                sx={{ width: getFlagSize().width, height: getFlagSize().height }}
              />
            }
            label={country.name}
            onClick={onSelect ? () => onSelect(country) : undefined}
            clickable={!!onSelect}
            sx={{ borderRadius: 1, height: 'auto', py: 0.5 }}
          />
        ))}
      </Box>
    );
  }
  
  return (
    <Grid container spacing={gridSpacing}>
      {countries.map(country => (
        <Grid item key={country.code} xs={4} sm={3} md={2}>
          <Paper
            elevation={1}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              p: 1,
              cursor: onSelect ? 'pointer' : 'default',
              '&:hover': onSelect ? {
                backgroundColor: 'action.hover',
              } : {},
              height: '100%',
            }}
            onClick={onSelect ? () => onSelect(country) : undefined}
          >
            <Avatar
              src={getFlagUrl(country.code)}
              alt={country.name}
              variant="rounded"
              sx={{
                width: getFlagSize().width,
                height: getFlagSize().height,
                mb: 1,
              }}
            />
            <Typography variant="caption" align="center">
              {country.name}
            </Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}; 