import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Divider,
  Grid,
  Card,
  CardContent,
  alpha,
  useTheme
} from '@mui/material';
import {
  AutoFixHigh as SmartIcon,
  Visibility as PreviewIcon
} from '@mui/icons-material';

import { SmartFieldBuilder } from '../index';
import { SmartFieldConfig } from '../types';

const SmartFieldBuilderDemo: React.FC = () => {
  const theme = useTheme();
  
  // Demo state
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [createdFields, setCreatedFields] = useState<SmartFieldConfig[]>([]);
  const [editingField, setEditingField] = useState<SmartFieldConfig | null>(null);

  // Demo existing fields for validation
  const existingFields: SmartFieldConfig[] = [
    {
      id: 'demo_name',
      name: 'نام کامل',
      englishName: 'full_name',
      baseType: 'text',
      enhancements: [],
      validation: [],
      isRequired: true,
      order: 1
    },
    {
      id: 'demo_age',
      name: 'سن',
      englishName: 'age',
      baseType: 'number',
      enhancements: [],
      validation: [],
      isRequired: false,
      order: 2
    }
  ];

  // Handle add new field
  const handleAddField = () => {
    setEditingField(null);
    setIsBuilderOpen(true);
  };

  // Handle edit field
  const handleEditField = (field: SmartFieldConfig) => {
    setEditingField(field);
    setIsBuilderOpen(true);
  };

  // Handle field save
  const handleFieldSave = (field: SmartFieldConfig) => {
    if (editingField) {
      // Update existing field
      setCreatedFields(prev => 
        prev.map(f => f.id === editingField.id ? field : f)
      );
    } else {
      // Add new field
      setCreatedFields(prev => [...prev, field]);
    }
    setIsBuilderOpen(false);
    setEditingField(null);
  };

  // Handle builder close
  const handleBuilderClose = () => {
    setIsBuilderOpen(false);
    setEditingField(null);
  };

  // Render field preview
  const renderFieldPreview = (field: SmartFieldConfig) => {
    const enhancementNames = field.enhancements.map(e => e.type).join(', ');
    const validationCount = field.validation.filter(v => v.enabled).length;
    
    return (
      <Card key={field.id} sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={600}>
                {field.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {field.englishName} • {field.baseType}
                {field.isRequired && ' • اجباری'}
              </Typography>
              
              {field.description && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {field.description}
                </Typography>
              )}
              
              {enhancementNames && (
                <Typography variant="caption" color="primary.main">
                  ویژگی‌ها: {enhancementNames}
                </Typography>
              )}
              
              {validationCount > 0 && (
                <Typography variant="caption" color="secondary.main" sx={{ display: 'block' }}>
                  {validationCount} قانون اعتبارسنجی
                </Typography>
              )}
              
              {field.dataSource && (
                <Typography variant="caption" color="info.main" sx={{ display: 'block' }}>
                  منبع داده: {field.dataSource.type}
                </Typography>
              )}
            </Box>
            
            <Button
              size="small"
              onClick={() => handleEditField(field)}
              startIcon={<PreviewIcon />}
            >
              ویرایش
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={600} gutterBottom>
            آزمایش ساخت فیلد هوشمند
          </Typography>
          <Typography variant="body1" color="text.secondary">
            این صفحه برای آزمایش و نمایش قابلیت‌های ساخت فیلد هوشمند طراحی شده است.
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Demo Controls */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              کنترل‌های آزمایش
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<SmartIcon />}
                onClick={handleAddField}
                fullWidth
              >
                ایجاد فیلد جدید
              </Button>
              
              <Box
                sx={{
                  p: 2,
                  backgroundColor: alpha(theme.palette.info.main, 0.1),
                  borderRadius: 1,
                  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                }}
              >
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  وضعیت آزمایش
                </Typography>
                <Typography variant="body2">
                  فیلدهای موجود: {existingFields.length}
                </Typography>
                <Typography variant="body2">
                  فیلدهای ایجاد شده: {createdFields.length}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Existing Fields */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              فیلدهای موجود (نمونه)
            </Typography>
            
            {existingFields.map(field => (
              <Card key={field.id} sx={{ mb: 2, opacity: 0.7 }}>
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {field.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {field.englishName} • {field.baseType}
                    {field.isRequired && ' • اجباری'}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Grid>

          {/* Created Fields */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              فیلدهای ایجاد شده
            </Typography>
            
            {createdFields.length > 0 ? (
              createdFields.map(renderFieldPreview)
            ) : (
              <Box
                sx={{
                  p: 3,
                  textAlign: 'center',
                  backgroundColor: alpha(theme.palette.grey[500], 0.1),
                  borderRadius: 1,
                  border: `1px dashed ${alpha(theme.palette.grey[500], 0.3)}`
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  هنوز فیلدی ایجاد نشده است
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        {/* Instructions */}
        <Box>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            راهنمای آزمایش
          </Typography>
          
          <Box component="ol" sx={{ pl: 3 }}>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              روی دکمه "ایجاد فیلد جدید" کلیک کنید
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              یکی از دو روش ساخت را انتخاب کنید (هوشمند یا قالب آماده)
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              مراحل ساخت فیلد را طی کنید
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              فیلد ایجاد شده در بخش "فیلدهای ایجاد شده" نمایش داده می‌شود
            </Typography>
            <Typography component="li" variant="body2">
              می‌توانید فیلدهای ایجاد شده را ویرایش کنید
            </Typography>
          </Box>
        </Box>

        {/* Smart Field Builder */}
        <SmartFieldBuilder
          open={isBuilderOpen}
          onClose={handleBuilderClose}
          onSave={handleFieldSave}
          existingFields={[...existingFields, ...createdFields]}
          editingField={editingField}
          categoryContext="personnel" // Demo category
        />
      </Paper>
    </Box>
  );
};

export default SmartFieldBuilderDemo;