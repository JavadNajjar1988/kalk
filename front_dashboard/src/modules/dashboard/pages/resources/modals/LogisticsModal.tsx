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
  Divider,
  Chip,
  Paper,
} from '@mui/material';
import { useTranslation } from '@/hooks/useTranslation';
import LogisticsHierarchicalSelector from '@/components/common/LogisticsHierarchicalSelector';
import type { LogisticsPath, LogisticsFieldDefinition } from '@/hooks/useLogisticsHierarchy';

interface LogisticsModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  logistics?: any;
  categories: any[];
}

const LogisticsModal: React.FC<LogisticsModalProps> = ({
  open,
  onClose,
  onSave,
  logistics,
  categories
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<any>({});
  const [selectedLogisticsPath, setSelectedLogisticsPath] = useState<LogisticsPath[]>([]);
  const [logisticsHierarchyFields, setLogisticsHierarchyFields] = useState<LogisticsFieldDefinition[]>([]);

  useEffect(() => {
    if (logistics) {
      setFormData(logistics);
      // اگر لجستیک قبلاً مسیر hierarchical داشته، آن را تنظیم کن
      if (logistics.logisticsPath) {
        setSelectedLogisticsPath(logistics.logisticsPath);
      }
      if (logistics.logisticsHierarchyFields) {
        setLogisticsHierarchyFields(logistics.logisticsHierarchyFields);
      }
    } else {
      setFormData({});
      setSelectedLogisticsPath([]);
      setLogisticsHierarchyFields([]);
    }
  }, [logistics, open]);

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
      logisticsPath: selectedLogisticsPath,
      logisticsHierarchyFields: logisticsHierarchyFields,
    };
    
    // اضافه کردن مقادیر فیلدهای hierarchical
    logisticsHierarchyFields.forEach(field => {
      if (formData[field.id] !== undefined) {
        finalData[field.id] = formData[field.id];
      }
    });
    
    onSave(finalData);
  };

  const handleLogisticsPathChange = (path: LogisticsPath[], finalNodeId?: string) => {
    setSelectedLogisticsPath(path);
  };

  const handleLogisticsFieldsChange = (fields: LogisticsFieldDefinition[]) => {
    setLogisticsHierarchyFields(fields);
  };

  const renderLogisticsField = (field: LogisticsFieldDefinition) => {
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
      case 'boolean':
        return (
          <TextField
            {...commonProps}
            key={field.id}
            select
            label={field.name}
            value={formData[field.id] ?? ''}
            onChange={(e) => handleChange(field.id, e.target.value === 'true')}
          >
            <MenuItem value={true as any}>بله</MenuItem>
            <MenuItem value={false as any}>خیر</MenuItem>
          </TextField>
        );
      case 'number':
        return (
          <TextField
            {...commonProps}
            key={field.id}
            type="number"
            label={field.name}
            value={formData[field.id] || ''}
            onChange={(e) => handleChange(field.id, Number(e.target.value))}
            InputProps={{
              endAdornment: field.unit && (
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  {field.unit}
                </Typography>
              )
            }}
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
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          p: 3, 
          pb: 1,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          borderRadius: '12px 12px 0 0',
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
        {logistics ? t('resources.logistics.editTitle') : t('resources.logistics.addTitle')}
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 3 }}>
          {/* Logistics Hierarchy Selector */}
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
              انتخاب نوع لجستیک
            </Typography>
            <LogisticsHierarchicalSelector
              value={selectedLogisticsPath}
              onChange={handleLogisticsPathChange}
              onFieldsChange={handleLogisticsFieldsChange}
            />
          </Paper>

          {/* Dynamic Logistics Hierarchy Fields */}
          {logisticsHierarchyFields.length > 0 && (
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
                  مشخصات لجستیک
                  <Chip 
                    label={`${logisticsHierarchyFields.length} فیلد`} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                    sx={{ ml: 'auto', fontSize: '0.7rem' }}
                  />
                </Typography>
              </Box>
              <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  {logisticsHierarchyFields.map((field, index) => (
                    <Grid 
                      item 
                      xs={12} 
                      sm={field.type === 'boolean' || field.type === 'select' ? 6 : 12}
                      key={field.id}
                    >
                      {renderLogisticsField(field)}
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Paper>
          )}
          
          {/* Show message when no path is selected */}
          {selectedLogisticsPath.length === 0 && (
            <Paper 
              elevation={0}
              sx={{ 
                p: 3,
                textAlign: 'center',
                bgcolor: 'info.50',
                border: 1,
                borderColor: 'info.200',
                borderRadius: 2
              }}
            >
              <Typography variant="body2" color="info.main">
                💡 لطفاً ابتدا از بخش بالا نوع لجستیک مورد نظر را انتخاب کنید
              </Typography>
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
          disabled={logisticsHierarchyFields.length === 0}
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

export default LogisticsModal;