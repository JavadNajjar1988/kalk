import React, { useState } from 'react';
import { Box, Typography, Popover, Grid } from '@mui/material';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange, disabled = false }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const predefinedColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#6366F1', '#EC4899',
    '#6B7280', '#059669', '#DC2626', '#7C3AED', '#D97706',
    '#1F2937', '#374151', '#4B5563', '#6B7280', '#9CA3AF'
  ];

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (!disabled) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleColorSelect = (color: string) => {
    onChange(color);
    handleClose();
  };

  const open = Boolean(anchorEl);

  return (
    <Box>
      <Box
        onClick={handleClick}
        sx={{
          width: 40,
          height: 40,
          borderRadius: '8px',
          backgroundColor: value,
          border: '2px solid',
          borderColor: 'divider',
          cursor: disabled ? 'default' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          '&:hover': {
            borderColor: disabled ? 'divider' : 'primary.main',
            transform: disabled ? 'none' : 'scale(1.05)',
          },
          transition: 'all 0.2s ease',
        }}
      />
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { p: 2, borderRadius: 2, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' } }}
      >
        <Typography variant="subtitle2" gutterBottom>
          انتخاب رنگ:
        </Typography>
        <Grid container spacing={1} sx={{ width: 280 }}>
          {predefinedColors.map((c) => (
            <Grid item key={c}>
              <Box
                onClick={() => handleColorSelect(c)}
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '6px',
                  backgroundColor: c,
                  border: '2px solid',
                  borderColor: value === c ? 'primary.main' : 'transparent',
                  cursor: 'pointer',
                  '&:hover': { transform: 'scale(1.1)', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' },
                  transition: 'all 0.2s ease',
                }}
              />
            </Grid>
          ))}
        </Grid>
        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            رنگ انتخاب شده: {value}
          </Typography>
        </Box>
      </Popover>
    </Box>
  );
};

export default ColorPicker;


