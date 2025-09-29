import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid,
  Divider,
  alpha,
  Alert
} from '@mui/material';
import PreviewIcon from '@mui/icons-material/Preview';
import { CustomField } from '../../types/equipment';
import { ExtendedCustomFieldDefinition } from './types/FieldEditTypes';
import { LiveFieldPreview } from './steps/LiveFieldPreview';

interface FieldPreviewConsistentProps {
  fields: CustomField[];
  title?: string;
  description?: string;
  nodeName?: string;
}

const FieldPreviewConsistent: React.FC<FieldPreviewConsistentProps> = ({
  fields,
  title = 'پیش‌نمایش فرم',
  description = 'نمایش فرم ایجاد شده بر اساس فیلدهای تعریف شده',
  nodeName,
}) => {
  // Convert CustomField to ExtendedCustomFieldDefinition for LiveFieldPreview
  const convertToExtendedField = (field: CustomField): ExtendedCustomFieldDefinition => {
    // Create a copy to avoid modifying the original
    const extendedField = { ...field } as ExtendedCustomFieldDefinition;
    
    // Add any missing properties that LiveFieldPreview might expect
    if (!extendedField.direction) {
      extendedField.direction = 'rtl';
    }
    
    // Map properties that might have different names or need default values
    if (field.placeholder !== undefined) {
      extendedField.placeholder = field.placeholder;
    }
    
    if (field.helpText !== undefined) {
      extendedField.helpText = field.helpText;
    }
    
    if (field.options !== undefined) {
      extendedField.options = field.options;
    }
    
    // Set default values for properties that might be missing
    if (extendedField.displayType === undefined) {
      extendedField.displayType = 'normal';
    }
    
    if (extendedField.size === undefined) {
      extendedField.size = 'md';
    }
    
    if (extendedField.variant === undefined) {
      // Set variant based on displayType for better consistency
      switch (extendedField.displayType) {
        case 'accordion':
          extendedField.variant = 'accordion';
          break;
        case 'multiline':
          extendedField.variant = 'textarea';
          break;
        case 'rich-text':
          extendedField.variant = 'richtext';
          break;
        case 'inline':
          extendedField.variant = 'inline';
          break;
        case 'chips':
          extendedField.variant = 'chips';
          break;
        case 'pill':
          extendedField.variant = 'pill';
          break;
        case 'masked':
          extendedField.variant = 'masked';
          break;
        case 'popover':
          extendedField.variant = 'popover';
          break;
        default:
          extendedField.variant = 'plain';
      }
    }
    
    // Ensure textarea properties are set for textarea variants
    if (extendedField.variant === 'textarea' && extendedField.textareaRows === undefined) {
      extendedField.textareaRows = 4;
    }
    
    // Ensure other variant-specific properties have defaults
    if (extendedField.variant === 'chips' && extendedField.chipsColor === undefined) {
      extendedField.chipsColor = 'default';
    }
    
    if (extendedField.variant === 'pill' && extendedField.pillColor === undefined) {
      extendedField.pillColor = 'default';
    }
    
    return extendedField;
  };

  return (
    <Paper 
      sx={{ 
        p: 2, 
        borderRadius: 2,
        boxShadow: (theme) => `0 4px 20px ${alpha(theme.palette.common.black, 0.08)}`,
        overflow: 'hidden'
      }}
    >
      {/* عنوان و توضیحات */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PreviewIcon color="primary" />
          <Box>
            <Typography variant="h6" fontWeight={600}>
              {title}
              {nodeName && ` - ${nodeName}`}
            </Typography>
            {description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {description}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      {/* فرم پیش‌نمایش */}
      <Grid container spacing={3}>
        {fields.length === 0 ? (
          <Grid item xs={12}>
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 3, 
                textAlign: 'center',
                borderRadius: 1,
                bgcolor: (theme) => alpha(theme.palette.info.main, 0.05)
              }}
            >
              <Typography color="text.secondary">
                هیچ فیلدی برای نمایش وجود ندارد. ابتدا فیلدهای مورد نیاز را تعریف کنید.
              </Typography>
            </Paper>
          </Grid>
        ) : (
          [...fields].sort((a, b) => a.order - b.order)
            .map((field) => (
              <Grid item xs={12} sm={6} key={field.id}>
                <LiveFieldPreview 
                  formData={convertToExtendedField(field)} 
                />
              </Grid>
            ))
        )}
      </Grid>
    </Paper>
  );
};

export default FieldPreviewConsistent;