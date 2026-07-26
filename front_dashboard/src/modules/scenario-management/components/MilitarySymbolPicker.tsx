import React from 'react';
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { SCENARIO_LAND_UNIT_ICONS } from '../constants/militarySymbols';
import MilitarySymbolPreview from './MilitarySymbolPreview';

interface MilitarySymbolPickerProps {
  open: boolean;
  value: string;
  standardIdentity: string;
  symbologyStandard: 'app6' | '2525';
  fillColor?: string;
  onClose: () => void;
  onChange: (value: string) => void;
}

const MilitarySymbolPicker: React.FC<MilitarySymbolPickerProps> = ({
  open,
  value,
  standardIdentity,
  symbologyStandard,
  fillColor,
  onClose,
  onChange,
}) => {
  const theme = useTheme();

  const handleSelect = (icon: string) => {
    onChange(icon);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      aria-labelledby="military-symbol-picker-title"
      PaperProps={{
        sx: {
          bgcolor: 'background.paper',
          backgroundImage: 'none',
          opacity: 1,
          backdropFilter: 'none',
          boxShadow: theme.shadows[24],
        },
      }}
      BackdropProps={{
        sx: {
          bgcolor: 'rgba(10, 18, 28, 0.62)',
          backdropFilter: 'none',
        },
      }}
    >
      <DialogTitle
        id="military-symbol-picker-title"
        sx={{ bgcolor: 'background.paper' }}
      >
        انتخاب نوع اصلی یگان
      </DialogTitle>
      <DialogContent dividers sx={{ bgcolor: 'background.paper' }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          فقط نوع اصلی را مشخص کنید. زیرنوع‌ها، مأموریت و جزئیات تخصصی بعداً در
          کالک‌نگار تکمیل می‌شوند.
        </Alert>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, minmax(0, 1fr))',
              sm: 'repeat(3, minmax(0, 1fr))',
              md: 'repeat(4, minmax(0, 1fr))',
            },
            gap: 1.5,
          }}
        >
          {SCENARIO_LAND_UNIT_ICONS.map(icon => {
            const selected = value === icon.value;
            return (
              <ButtonBase
                key={icon.value}
                onClick={() => handleSelect(icon.value)}
                aria-label={`انتخاب ${icon.label}`}
                sx={{
                  position: 'relative',
                  minHeight: 128,
                  p: 2,
                  borderRadius: 2,
                  border: '2px solid',
                  borderColor: selected ? 'primary.main' : 'divider',
                  bgcolor: selected
                    ? alpha(theme.palette.primary.main, 0.08)
                    : 'background.paper',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  transition: theme.transitions.create([
                    'border-color',
                    'background-color',
                    'transform',
                  ]),
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                {selected && (
                  <CheckCircle
                    color="primary"
                    sx={{ position: 'absolute', top: 8, right: 8 }}
                  />
                )}
                <MilitarySymbolPreview
                  standardIdentity={standardIdentity}
                  echelon="00"
                  icon={icon.value}
                  fillColor={fillColor}
                  size={58}
                  compact
                  symbologyStandard={symbologyStandard}
                />
                <Typography variant="body2" fontWeight={selected ? 700 : 500}>
                  {icon.label}
                </Typography>
              </ButtonBase>
            );
          })}
        </Box>
      </DialogContent>
      <DialogActions sx={{ bgcolor: 'background.paper' }}>
        <Button onClick={onClose} color="inherit">
          بستن
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MilitarySymbolPicker;
