import React, { useState, useMemo } from 'react';
import {
  Box,
  Grid,
  Typography,
  Paper,
  TextField,
  Chip,
  InputAdornment,
  Button,
  Divider,
} from '@mui/material';
import { Search as SearchIcon, Close as CloseIcon } from '@mui/icons-material';
import { fieldTemplates, getTemplatesByCategory, searchTemplates, FieldTemplate } from './fieldTemplates';
import { ExtendedCustomFieldDefinition } from '../types/FieldEditTypes';

interface FieldTemplateSelectorProps {
  onSelectTemplate: (template: FieldTemplate) => void;
  onClose: () => void;
}

const FieldTemplateSelector: React.FC<FieldTemplateSelectorProps> = ({
  onSelectTemplate,
  onClose
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', name: 'همه', count: fieldTemplates.length },
    { id: 'personal', name: 'اطلاعات شخصی', count: getTemplatesByCategory('personal').length },
    { id: 'contact', name: 'اطلاعات تماس', count: getTemplatesByCategory('contact').length },
    { id: 'business', name: 'کسب و کار', count: getTemplatesByCategory('business').length },
    { id: 'technical', name: 'فنی', count: getTemplatesByCategory('technical').length },
    { id: 'common', name: 'عمومی', count: getTemplatesByCategory('common').length },
  ];

  const filteredTemplates = useMemo(() => {
    let templates = selectedCategory === 'all' 
      ? fieldTemplates 
      : getTemplatesByCategory(selectedCategory as any);

    if (searchQuery.trim()) {
      templates = searchTemplates(searchQuery);
      if (selectedCategory !== 'all') {
        templates = templates.filter(t => t.category === selectedCategory);
      }
    }

    return templates;
  }, [selectedCategory, searchQuery]);

  const handleTemplateSelect = (template: FieldTemplate) => {
    onSelectTemplate(template);
  };

  return (
    <Box
      sx={{
        p: 4,
        background: 'linear-gradient(135deg, rgba(240, 248, 255, 0.95) 0%, rgba(230, 245, 255, 0.9) 100%)',
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        overflow: 'hidden',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(45deg, rgba(135, 206, 250, 0.05) 0%, rgba(173, 216, 230, 0.1) 50%, rgba(176, 224, 230, 0.05) 100%)',
          zIndex: -1,
        }
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(45deg, #4A90E2 30%, #7BB3F0 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          قالب‌های آماده فیلد
        </Typography>
        <Button
          onClick={onClose}
          sx={{
            minWidth: 'auto',
            p: 1,
            borderRadius: '8px',
            color: '#64748B',
            '&:hover': { bgcolor: 'rgba(100, 116, 139, 0.1)' }
          }}
        >
          <CloseIcon />
        </Button>
      </Box>

      {/* Search */}
      <TextField
        fullWidth
        placeholder="جستجو در قالب‌ها..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{
          mb: 3,
          '& .MuiOutlinedInput-root': {
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
          }
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: '#64748B' }} />
            </InputAdornment>
          ),
        }}
      />

      {/* Category Chips */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {categories.map((category) => (
            <Chip
              key={category.id}
              label={`${category.name} (${category.count})`}
              variant={selectedCategory === category.id ? 'filled' : 'outlined'}
              color={selectedCategory === category.id ? 'primary' : 'default'}
              clickable
              onClick={() => setSelectedCategory(category.id)}
              sx={{
                borderRadius: '8px',
                '&.MuiChip-filled': {
                  background: 'linear-gradient(135deg, #4A90E2, #7BB3F0)',
                  color: 'white',
                }
              }}
            />
          ))}
        </Box>
      </Box>

      <Divider sx={{ mb: 3, opacity: 0.3 }} />

      {/* Templates Grid */}
      <Box sx={{ maxHeight: 500, overflow: 'auto' }}>
        <Grid container spacing={2}>
          {filteredTemplates.map((template) => (
            <Grid item xs={12} sm={6} md={4} key={template.id}>
              <Paper
                sx={{
                  p: 2.5,
                  cursor: 'pointer',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(135, 206, 250, 0.2)',
                  boxShadow: '0 4px 16px rgba(135, 206, 250, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 24px rgba(74, 144, 226, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                    borderColor: 'rgba(74, 144, 226, 0.3)',
                  }
                }}
                onClick={() => handleTemplateSelect(template)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <Typography
                    sx={{
                      fontSize: '1.5rem',
                      filter: 'drop-shadow(0 2px 4px rgba(74, 144, 226, 0.3))'
                    }}
                  >
                    {template.icon}
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: '#4A90E2',
                      fontSize: '1rem'
                    }}
                  >
                    {template.name}
                  </Typography>
                </Box>
                
                <Typography
                  variant="body2"
                  sx={{
                    color: '#64748B',
                    mb: 1.5,
                    lineHeight: 1.4,
                    fontSize: '0.875rem'
                  }}
                >
                  {template.description}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    size="small"
                    label={template.definition.type}
                    sx={{
                      bgcolor: 'rgba(74, 144, 226, 0.1)',
                      color: '#4A90E2',
                      fontWeight: 500,
                      fontSize: '0.75rem',
                      height: 20,
                    }}
                  />
                  {template.definition.isRequired && (
                    <Chip
                      size="small"
                      label="اجباری"
                      sx={{
                        bgcolor: 'rgba(239, 68, 68, 0.1)',
                        color: '#DC2626',
                        fontWeight: 500,
                        fontSize: '0.75rem',
                        height: 20,
                      }}
                    />
                  )}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {filteredTemplates.length === 0 && (
          <Box
            sx={{
              textAlign: 'center',
              py: 6,
              color: '#64748B'
            }}
          >
            <Typography variant="h6" gutterBottom>
              قالبی یافت نشد
            </Typography>
            <Typography variant="body2">
              لطفاً عبارت جستجو یا دسته‌بندی دیگری انتخاب کنید
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default FieldTemplateSelector;