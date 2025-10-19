import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  Box,
  Typography,
  Paper,
  useTheme,
  useMediaQuery,
  alpha,
} from '@mui/material';
import { useTranslation } from '@/hooks/useTranslation';
import EquipmentHierarchicalSelector from '@/components/common/EquipmentHierarchicalSelector';
import type { EquipmentPath, EquipmentFieldDefinition } from '@/hooks/useEquipmentHierarchy';

interface EquipmentModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  equipment?: any;
}

const EquipmentModal: React.FC<EquipmentModalProps> = ({
  open,
  onClose,
  onSave,
  equipment,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const softSurface = useMemo(() => {
    const primary = (theme.palette.primary.main || '#4a90e2').toLowerCase();
    const hex = primary.replace('#', '');
    if (hex.includes('10b981') || hex.includes('4caf50') || hex.includes('2e7d32')) return '#f0f4f3';
    if (hex.includes('4a90e2') || hex.includes('1976d2') || hex.includes('2196f3')) return '#f0f4f8';
    if (hex.includes('ef4444') || hex.includes('f44336') || hex.includes('d32f2f')) return '#fbf1f0';
    if (hex.includes('6b21a8') || hex.includes('9c27b0') || hex.includes('673ab7')) return '#22262d';
    if (hex.includes('f59e0b') || hex.includes('ff9800') || hex.includes('fb8c00')) return '#fbf1f1';

    const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
    const hexToRgb = (h: string) => {
      const normalized = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
      const r = parseInt(normalized.substring(0, 2), 16);
      const g = parseInt(normalized.substring(2, 4), 16);
      const b = parseInt(normalized.substring(4, 6), 16);
      return { r, g, b };
    };
    const rgbToHex = (r: number, g: number, b: number) =>
      `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`;
    const blendWithWhite = (h: string, primaryWeight = 0.1) => {
      const { r, g, b } = hexToRgb(h);
      const wr = 255;
      const wg = 255;
      const wb = 255;
      const w = 1 - primaryWeight;
      const br = wr * w + r * primaryWeight;
      const bg = wg * w + g * primaryWeight;
      const bb = wb * w + b * primaryWeight;
      return rgbToHex(br, bg, bb);
    };

    if (/^[0-9a-f]{3,6}$/.test(hex)) {
      return blendWithWhite(hex, 0.1);
    }

    try {
      const fallback = (theme.palette.primary.light || '#90caf9').toLowerCase().replace('#', '');
      return blendWithWhite(fallback, 0.08);
    } catch {
      return '#f5f7fa';
    }
  }, [theme.palette.primary.main, theme.palette.primary.light]);

  const inputRootSx = useMemo(() => ({
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    backdropFilter: 'blur(8px)',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    '& fieldset': {
      borderColor: alpha(theme.palette.primary.main, 0.2),
    },
    '&:hover fieldset': {
      borderColor: alpha(theme.palette.primary.main, 0.35),
    },
    '&.Mui-focused fieldset': {
      borderWidth: 2,
      borderColor: alpha(theme.palette.primary.main, 0.6),
      boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
    },
  }), [theme.palette.primary.main]);

  const textFieldSx = useMemo(() => ({
    '& .MuiOutlinedInput-root': {
      ...inputRootSx,
      borderRadius: 2,
    },
  }), [inputRootSx]);

  const [formData, setFormData] = useState<any>({});
  const [selectedEquipmentPath, setSelectedEquipmentPath] = useState<EquipmentPath[]>([]);
  const [equipmentHierarchyFields, setEquipmentHierarchyFields] = useState<EquipmentFieldDefinition[]>([]);

  useEffect(() => {
    if (equipment) {
      setFormData(equipment);
      if (equipment.equipmentPath) {
        setSelectedEquipmentPath(equipment.equipmentPath);
      }
      if (equipment.equipmentHierarchyFields) {
        setEquipmentHierarchyFields(equipment.equipmentHierarchyFields);
      }
    } else {
      setFormData({});
      setSelectedEquipmentPath([]);
      setEquipmentHierarchyFields([]);
    }
  }, [equipment, open]);

  const handleChange = (fieldId: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleSubmit = () => {
    const finalData = {
      ...formData,
      equipmentPath: selectedEquipmentPath,
      equipmentHierarchyFields,
    };

    equipmentHierarchyFields.forEach(field => {
      if (formData[field.id] !== undefined) {
        finalData[field.id] = formData[field.id];
      }
    });

    onSave(finalData);
  };

  const handleEquipmentPathChange = (path: EquipmentPath[], _finalNodeId?: string) => {
    setSelectedEquipmentPath(path);
  };

  const handleEquipmentFieldsChange = (fields: EquipmentFieldDefinition[]) => {
    setEquipmentHierarchyFields(fields);
  };

  const renderEquipmentField = (field: EquipmentFieldDefinition) => {
    const commonProps = {
      fullWidth: true,
      variant: 'outlined' as const,
      size: 'small' as const,
      required: field.isRequired,
      sx: textFieldSx,
    };

    switch (field.type) {
      case 'select':
        return (
          <TextField
            {...commonProps}
            key={field.id}
            select
            label={field.name}
            value={formData[field.id] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
          >
            {field.options?.map((option: string) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        );
      case 'multiselect':
        return (
          <TextField
            {...commonProps}
            key={field.id}
            select
            label={field.name}
            SelectProps={{ multiple: true }}
            value={formData[field.id] || []}
            onChange={(e) => handleChange(field.id, e.target.value)}
          >
            {field.options?.map((option: string) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        );
      case 'number':
        return (
          <TextField
            {...commonProps}
            key={field.id}
            type="number"
            label={`${field.name}${field.unit ? ` (${field.unit})` : ''}`}
            value={formData[field.id] || ''}
            onChange={(e) => handleChange(field.id, e.target.value ? Number(e.target.value) : '')}
          />
        );
      case 'date':
        return (
          <TextField
            {...commonProps}
            key={field.id}
            type="date"
            label={field.name}
            value={formData[field.id] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        );
      default:
        return (
          <TextField
            {...commonProps}
            key={field.id}
            label={field.name}
            value={formData[field.id] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
          />
        );
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: isMobile ? 0 : '20px',
          backgroundColor: (theme) => alpha(theme.palette.primary.light, 0.1),
          backdropFilter: 'blur(20px)',
          border: (theme) => `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
          boxShadow: (theme) => `0 20px 60px ${alpha(theme.palette.primary.light, 0.3)}, inset 0 1px 0 rgba(255, 255, 255, 0.8)`,
          overflow: 'hidden',
          position: 'relative',
          minHeight: isMobile ? '100vh' : 'auto',
          '&::before': {
            content: 'none',
          },
        },
        '& .MuiBackdrop-root': {
          backgroundColor: (theme) => `${alpha(theme.palette.primary.light, 0.08)}`,
          backdropFilter: 'blur(4px)',
        },
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: softSurface,
          borderBottom: (theme) => `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
          textAlign: 'center',
          py: isMobile ? 2 : 3,
          px: isMobile ? 2 : 3,
        }}
      >
        <Typography
          variant={isMobile ? 'h6' : 'h5'}
          sx={{
            fontWeight: 700,
            color: theme.palette.primary.main,
          }}
        >
          {equipment ? 'ویرایش تجهیز' : 'افزودن تجهیز جدید'}
        </Typography>
      </DialogTitle>

      <DialogContent
        sx={{
          backgroundColor: softSurface,
          p: isMobile ? 2 : 3,
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

          <Paper
            elevation={0}
            sx={{
              p: isMobile ? 2 : 3,
              borderRadius: '16px',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
              boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.08)}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                color: theme.palette.primary.main,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Box
                component="span"
                sx={{
                  width: 4,
                  height: 16,
                  bgcolor: theme.palette.primary.main,
                  borderRadius: 1,
                }}
              />
              سلسله‌مراتب تجهیزات
            </Typography>
            <EquipmentHierarchicalSelector
              value={selectedEquipmentPath}
              onChange={handleEquipmentPathChange}
              onFieldsChange={handleEquipmentFieldsChange}
            />
          </Paper>

          {equipmentHierarchyFields.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                borderRadius: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                boxShadow: `0 6px 18px ${alpha(theme.palette.primary.main, 0.06)}`,
              }}
            >
              <Box
                sx={{
                  p: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: theme.palette.primary.main,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      width: 4,
                      height: 16,
                      bgcolor: theme.palette.primary.main,
                      borderRadius: 1,
                    }}
                  />
                  {t('resources.equipment.dynamicAttributes')}
                </Typography>
              </Box>

              <Box sx={{ p: isMobile ? 2 : 3 }}>
                <Grid container spacing={2}>
                  {equipmentHierarchyFields.map((field: EquipmentFieldDefinition) => (
                    <Grid
                      item
                      xs={12}
                      sm={field.type === 'text' || field.type === 'number' ? 6 : 12}
                      key={field.id}
                    >
                      {renderEquipmentField(field)}
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Paper>
          )}
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          backgroundColor: softSurface,
          borderTop: (theme) => `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
          p: isMobile ? 2 : 3,
          gap: 1,
          justifyContent: 'flex-end',
        }}
      >
        <Button
          onClick={onClose}
          sx={{
            borderRadius: '12px',
            minWidth: 100,
            backgroundColor: 'rgba(148, 163, 184, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            color: '#64748B',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: 'rgba(148, 163, 184, 0.15)',
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(148, 163, 184, 0.2)',
            },
          }}
        >
          انصراف
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={equipmentHierarchyFields.length === 0}
          sx={{
            borderRadius: '12px',
            minWidth: 120,
            backgroundColor: theme.palette.primary.main,
            color: 'white',
            fontWeight: 600,
            border: '2px solid rgba(255, 255, 255, 0.3)',
            boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
              transform: 'translateY(-2px)',
              boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.4)}`,
            },
            '&:disabled': {
              backgroundColor: alpha(theme.palette.primary.main, 0.2),
              color: 'rgba(255,255,255,0.7)',
              transform: 'none',
              boxShadow: 'none',
            },
          }}
        >
          ذخیره
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EquipmentModal;
