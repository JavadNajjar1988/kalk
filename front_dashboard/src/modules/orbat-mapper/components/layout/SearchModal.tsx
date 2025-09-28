import React, { useState, useEffect } from 'react';
import { 
  Dialog,
  DialogContent,
  TextField,
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  InputAdornment,
  IconButton
} from '@mui/material';
import { 
  Search as SearchIcon,
  Close as CloseIcon,
  LocationOn as LocationIcon,
  Group as UnitIcon,
  Event as EventIcon,
  Layers as LayerIcon
} from '@mui/icons-material';

interface SearchResult {
  id: string;
  type: 'unit' | 'location' | 'event' | 'layer';
  title: string;
  subtitle?: string;
  description?: string;
}

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  onSelectResult?: (result: SearchResult) => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ open, onClose, onSelectResult }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);

  // Mock search data
  const mockData: SearchResult[] = [
    {
      id: '1',
      type: 'unit',
      title: 'لشکر 21 زرهی',
      subtitle: 'لشکر',
      description: 'فرماندهی: سرهنگ محمدی'
    },
    {
      id: '2', 
      type: 'unit',
      title: 'تیپ 1 زرهی',
      subtitle: 'تیپ',
      description: 'زیرمجموعه لشکر 21'
    },
    {
      id: '3',
      type: 'location', 
      title: 'تهران',
      subtitle: 'موقعیت',
      description: '35.6892° N, 51.3890° E'
    },
    {
      id: '4',
      type: 'event',
      title: 'شروع عملیات',
      subtitle: 'رویداد',
      description: '1402/08/15 - 08:00'
    },
    {
      id: '5',
      type: 'layer',
      title: 'لایه واحدهای خودی',
      subtitle: 'لایه نقشه',
      description: 'نمایش واحدهای دوست'
    }
  ];

  // Filter results based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setResults([]);
      return;
    }

    const filtered = mockData.filter(item => 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subtitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setResults(filtered);
  }, [searchTerm]);

  const handleResultClick = (result: SearchResult) => {
    onSelectResult?.(result);
    onClose();
    setSearchTerm('');
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'unit': return <UnitIcon />;
      case 'location': return <LocationIcon />;
      case 'event': return <EventIcon />;
      case 'layer': return <LayerIcon />;
      default: return <SearchIcon />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'unit': return 'واحد';
      case 'location': return 'موقعیت'; 
      case 'event': return 'رویداد';
      case 'layer': return 'لایه';
      default: return '';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'unit': return 'primary';
      case 'location': return 'success';
      case 'event': return 'warning';
      case 'layer': return 'info';
      default: return 'default';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 2,
          fontFamily: 'Vazirmatn, sans-serif'
        }
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <TextField
            fullWidth
            placeholder="جستجو در واحدها، مکان‌ها، رویدادها..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                border: 'none',
                '& fieldset': { border: 'none' },
                '&:hover fieldset': { border: 'none' },
                '&.Mui-focused fieldset': { border: 'none' }
              }
            }}
          />
        </Box>

        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
          {searchTerm && results.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                نتیجه‌ای یافت نشد
              </Typography>
            </Box>
          ) : searchTerm === '' ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                برای جستجو تایپ کنید...
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                کلیدهای میانبر: Ctrl+K یا Alt+K
              </Typography>
            </Box>
          ) : (
            <List>
              {results.map((result) => (
                <ListItem
                  key={result.id}
                  button
                  onClick={() => handleResultClick(result)}
                  sx={{
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                >
                  <ListItemIcon>
                    {getResultIcon(result.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1">
                          {result.title}
                        </Typography>
                        <Chip 
                          label={getTypeLabel(result.type)}
                          size="small"
                          color={getTypeColor(result.type) as any}
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={result.description}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        {searchTerm && results.length > 0 && (
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
            <Typography variant="caption" color="text.secondary">
              {results.length} نتیجه یافت شد
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SearchModal;