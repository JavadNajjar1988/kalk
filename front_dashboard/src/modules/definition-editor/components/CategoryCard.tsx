import React, { useState } from 'react';
import { Card, CardContent, Typography, Box, Chip, IconButton, useTheme, alpha, Menu, MenuItem } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, MoreVert as MoreVertIcon } from '@mui/icons-material';
import { DefinitionCategory } from '../types';

interface CategoryCardProps {
  category: DefinitionCategory;
  onEdit: (category: DefinitionCategory) => void;
  onDelete: (category: DefinitionCategory) => void;
  onSelect?: (category: DefinitionCategory) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  onEdit,
  onDelete,
  onSelect,
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleCardClick = (e: React.MouseEvent) => {
    // اگر روی دکمه منو کلیک شد، ریدایرکت نشود
    if ((e.target as HTMLElement).closest('button')) return;
    
    // اگر onSelect وجود دارد، از آن استفاده کن
    if (onSelect) {
      onSelect(category);
    }
  };

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };
  const handleMenuClose = () => setAnchorEl(null);

  return (
    <Card
      onClick={handleCardClick}
      sx={{
        cursor: 'pointer',
        borderRadius: 3,
        minHeight: 160,
        height: 160,
        width: '100%',
        boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.06)}, 0 1px 3px ${alpha(theme.palette.common.black, 0.04)}`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
        backdropFilter: 'blur(8px)',
        '&:hover': {
          boxShadow: `0 12px 40px ${alpha(theme.palette.common.black, 0.12)}, 0 6px 20px ${alpha(theme.palette.common.black, 0.08)}`,
          borderColor: alpha(theme.palette.primary.light, 0.3),
          transform: 'translateY(-2px)',
        },
        '&:active': {
          transform: 'translateY(0px)',
          transition: 'all 0.1s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        '&::before': { display: 'none' },
      }}
    >
      <CardContent sx={{ p: 1.2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* حذف انتخاب چندتایی */}
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                backgroundColor: (category.color ?? theme.palette.primary.main),
                boxShadow: `0 4px 12px ${alpha(category.color ?? theme.palette.primary.main, 0.25)}, 0 2px 6px ${alpha(category.color ?? theme.palette.primary.main, 0.15)}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: `0 6px 16px ${alpha(category.color ?? theme.palette.primary.main, 0.35)}, 0 3px 8px ${alpha(category.color ?? theme.palette.primary.main, 0.2)}`,
                  transform: 'scale(1.05)',
                },
              }}
            >
              <i className={`fas fa-${category.icon || 'folder'}`} style={{ fontSize: 18 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={600} color="text.primary">
                {category.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {category.englishName}
              </Typography>
              {category.description && (
                <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                  {category.description}
                </Typography>
              )}
            </Box>
          </Box>
          <IconButton 
            size="small" 
            onClick={handleMenuOpen} 
            sx={{ 
              ml: 1,
              boxShadow: `0 2px 4px ${alpha(theme.palette.common.black, 0.1)}`,
              transition: 'all 0.2s ease',
              '&:hover': {
                boxShadow: `0 4px 8px ${alpha(theme.palette.common.black, 0.15)}`,
                transform: 'scale(1.1)',
              },
            }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
          <Menu 
            anchorEl={anchorEl} 
            open={Boolean(anchorEl)} 
            onClose={handleMenuClose} 
            anchorOrigin={{vertical:'bottom',horizontal:'right'}} 
            transformOrigin={{vertical:'top',horizontal:'right'}}
            PaperProps={{
              sx: {
                boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.12)}, 0 4px 16px ${alpha(theme.palette.common.black, 0.08)}`,
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                backdropFilter: 'blur(8px)',
              }
            }}
          >
            <MenuItem onClick={(e) => { e.stopPropagation(); handleMenuClose(); onEdit(category); }}>
              <EditIcon fontSize="small" sx={{ mr: 1 }} /> ویرایش
            </MenuItem>
            <MenuItem onClick={(e) => { e.stopPropagation(); handleMenuClose(); onDelete(category); }}>
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} color="error" /> حذف
            </MenuItem>
          </Menu>
        </Box>
        
        {/* نمایش اطلاعات اضافی */}
        <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip 
              label={`حداکثر ${category.maxLevels} سطح`}
              size="small"
              variant="outlined"
              sx={{ 
                fontSize: '0.7rem',
                height: 20,
                '& .MuiChip-label': { px: 1 }
              }}
            />
            {category.isActive ? (
              <Chip 
                label="فعال"
                size="small"
                color="success"
                variant="outlined"
                sx={{ 
                  fontSize: '0.7rem',
                  height: 20,
                  '& .MuiChip-label': { px: 1 }
                }}
              />
            ) : (
              <Chip 
                label="غیرفعال"
                size="small"
                color="error"
                variant="outlined"
                sx={{ 
                  fontSize: '0.7rem',
                  height: 20,
                  '& .MuiChip-label': { px: 1 }
                }}
              />
            )}
          </Box>
          <Typography variant="caption" color="text.disabled">
            ترتیب: {category.order}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CategoryCard;
