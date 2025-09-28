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
} from '@mui/material';
import { useTranslation } from '@/hooks/useTranslation';
import AmmunitionHierarchicalSelector from '@/components/common/AmmunitionHierarchicalSelector';
import type { AmmunitionPath, AmmunitionFieldDefinition } from '@/hooks/useAmmunitionHierarchy';

interface AmmunitionModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  ammunition?: any;
  categories: any[];
}

const AmmunitionModal: React.FC<AmmunitionModalProps> = ({
  open,
  onClose,
  onSave,
  ammunition,
  categories
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<any>({});
  const [selectedAmmunitionPath, setSelectedAmmunitionPath] = useState<AmmunitionPath[]>([]);
  const [ammunitionHierarchyFields, setAmmunitionHierarchyFields] = useState<AmmunitionFieldDefinition[]>([]);

  useEffect(() => {
    if (ammunition) {
      setFormData(ammunition);
      // اگر مهمات قبلاً مسیر hierarchical داشته، آن را تنظیم کن
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
      [fieldId]: value
    }));
  };

  const handleSubmit = () => {
    // ترکیب داده‌های فرم با اطلاعات hierarchical
    const finalData = {
      ...formData,
      ammunitionPath: selectedAmmunitionPath,
      ammunitionHierarchyFields: ammunitionHierarchyFields,
    };
    
    // اضافه کردن مقادیر فیلدهای hierarchical
    ammunitionHierarchyFields.forEach(field => {
      if (formData[field.id] !== undefined) {
        finalData[field.id] = formData[field.id];
      }
    });
    
    onSave(finalData);
  };

  const handleAmmunitionPathChange = (path: AmmunitionPath[], finalNodeId?: string) => {
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
      sx: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 2,
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'primary.main',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: 2,
          }
        }
      }
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
      case 'boolean':
        return (
          <TextField
            {...commonProps}
            key={field.id}
            select
            label={field.name}
            value={formData[field.id] !== undefined ? String(formData[field.id]) : 'false'}
            onChange={(e) => handleChange(field.id, e.target.value === 'true')}
          >
            <MenuItem value="true">بله</MenuItem>
            <MenuItem value="false">خیر</MenuItem>
          </TextField>
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
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: 400,
        }
      }}
    >
      <DialogTitle
        sx={{
          pb: 1,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        <Box
          component="span"
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: 'primary.contrastText',
            opacity: 0.7
          }}
        />
        {ammunition ? t('resources.ammunition.editTitle') : t('resources.ammunition.addTitle')}
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 3 }}>
          {/* Ammunition Hierarchy Selector */}
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              mb: 3, 
              bgcolor: 'grey.50',
              border: 1,
              borderColor: 'grey.200',
              borderRadius: 2,
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'primary.50'
              },
              transition: 'all 0.2s ease'
            }}
          >
            <Typography 
              variant="subtitle2" 
              sx={{ 
                mb: 2, 
                color: 'primary.main',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <Box
                component="span"
                sx={{
                  width: 4,
                  height: 16,
                  bgcolor: 'primary.main',
                  borderRadius: 1
                }}
              />
              انتخاب نوع مهمات
            </Typography>
            <AmmunitionHierarchicalSelector
              value={selectedAmmunitionPath}
              onChange={handleAmmunitionPathChange}
              onFieldsChange={handleAmmunitionFieldsChange}
            />
          </Paper>

          {/* Dynamic Ammunition Hierarchy Fields */}
          {ammunitionHierarchyFields.length > 0 && (
            <Paper 
              elevation={0}
              sx={{ 
                border: 1,
                borderColor: 'grey.200',
                borderRadius: 2,
                overflow: 'hidden'
              }}
            >
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'primary.50',
                  borderBottom: 1,
                  borderColor: 'grey.200'
                }}
              >
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    color: 'primary.main',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      width: 4,
                      height: 16,
                      bgcolor: 'primary.main',
                      borderRadius: 1
                    }}
                  />
                  فیلدهای تخصصی
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
          p: 3, 
          pt: 0,
          gap: 1,
          justifyContent: 'flex-end'
        }}
      >
        <Button 
          onClick={onClose}
          variant="outlined"
          sx={{
            borderRadius: 2,
            minWidth: 100
          }}
        >
          {t('common.cancel')}
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={ammunitionHierarchyFields.length === 0}
          sx={{
            borderRadius: 2,
            minWidth: 100,
            boxShadow: 2
          }}
        >
          {t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AmmunitionModal;