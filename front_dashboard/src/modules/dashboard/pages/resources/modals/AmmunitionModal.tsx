import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  buildResourcesFormDialogSx,
  buildResourcesTextFieldOutlineSx,
  getResourcesDialogAccent,
  resourcesDialogTitleSx,
  resourcesDialogContentDividersSx,
  resourcesDialogActionsSx,
  resourcesOutlinedCancelButtonSx,
} from '../resourcesDialogStyles';
import { useTranslation } from '@/hooks/useTranslation';
import AmmunitionHierarchicalSelector from '@/components/common/AmmunitionHierarchicalSelector';
import type { AmmunitionPath, AmmunitionFieldDefinition } from '@/hooks/useAmmunitionHierarchy';

interface AmmunitionModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  ammunition?: any;
}

const AmmunitionModal: React.FC<AmmunitionModalProps> = ({
  open,
  onClose,
  onSave,
  ammunition,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const accent = getResourcesDialogAccent(theme);
  const textFieldSx = buildResourcesTextFieldOutlineSx(theme);

  const [formData, setFormData] = useState<any>({});
  const [selectedAmmunitionPath, setSelectedAmmunitionPath] = useState<AmmunitionPath[]>([]);
  const [ammunitionHierarchyFields, setAmmunitionHierarchyFields] = useState<AmmunitionFieldDefinition[]>([]);

  useEffect(() => {
    if (ammunition) {
      setFormData(ammunition);
      if (ammunition.ammunitionPath) {
        setSelectedAmmunitionPath(ammunition.ammunitionPath);
      }
      if (ammunition.ammunitionHierarchyFields) {
        setAmmunitionHierarchyFields(ammunition.ammunitionHierarchyFields);
      }
    } else {
      setFormData({});
      setSelectedAmmunitionPath([]);
      setAmmunitionHierarchyFields([]);
    }
  }, [ammunition, open]);

  const handleChange = (fieldId: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleSubmit = () => {
    const finalData = {
      ...formData,
      ammunitionPath: selectedAmmunitionPath,
      ammunitionHierarchyFields,
    };

    ammunitionHierarchyFields.forEach(field => {
      if (formData[field.id] !== undefined) {
        finalData[field.id] = formData[field.id];
      }
    });

    onSave(finalData);
  };

  const handleAmmunitionPathChange = (path: AmmunitionPath[], _finalNodeId?: string) => {
    setSelectedAmmunitionPath(path);
  };

  const handleAmmunitionFieldsChange = (fields: AmmunitionFieldDefinition[]) => {
    setAmmunitionHierarchyFields(fields);
  };

  const renderAmmunitionField = (field: AmmunitionFieldDefinition) => {
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
      sx={buildResourcesFormDialogSx(theme)}
    >
      <DialogTitle sx={resourcesDialogTitleSx(theme)}>
        {ammunition ? t('resources.ammunition.editTitle') : t('resources.ammunition.addTitle')}
      </DialogTitle>

      <DialogContent dividers sx={resourcesDialogContentDividersSx(theme)}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: `1px solid ${alpha(accent, 0.15)}`,
              boxShadow: `0 8px 24px ${alpha(accent, 0.08)}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                color: accent,
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
                  bgcolor: accent,
                  borderRadius: 1,
                }}
              />
              سلسله‌مراتب مهمات
            </Typography>
            <AmmunitionHierarchicalSelector
              value={selectedAmmunitionPath}
              onChange={handleAmmunitionPathChange}
              onFieldsChange={handleAmmunitionFieldsChange}
            />
          </Paper>

          {ammunitionHierarchyFields.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                borderRadius: 3,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: `1px solid ${alpha(accent, 0.1)}`,
                boxShadow: `0 6px 18px ${alpha(accent, 0.06)}`,
              }}
            >
              <Box
                sx={{
                  p: 2,
                  bgcolor: alpha(accent, 0.08),
                  borderBottom: `1px solid ${alpha(accent, 0.1)}`,
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: accent,
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
                      bgcolor: accent,
                      borderRadius: 1,
                    }}
                  />
                  {t('resources.ammunition.dynamicAttributes') ?? 'ویژگی‌های پویا'}
                </Typography>
              </Box>

              <Box sx={{ p: 3 }}>
                <Grid container spacing={2}>
                  {ammunitionHierarchyFields.map((field: AmmunitionFieldDefinition) => (
                    <Grid
                      item
                      xs={12}
                      sm={field.type === 'text' || field.type === 'number' ? 6 : 12}
                      key={field.id}
                    >
                      {renderAmmunitionField(field)}
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
          ...resourcesDialogActionsSx(theme),
          justifyContent: 'flex-end',
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          color="inherit"
          sx={resourcesOutlinedCancelButtonSx(theme)}
        >
          انصراف
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={ammunitionHierarchyFields.length === 0}
          sx={{
            borderRadius: 2,
            px: 3,
            '&:disabled': {
              backgroundColor: alpha(accent, 0.2),
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

export default AmmunitionModal;
