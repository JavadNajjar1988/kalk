import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import OptionsEditor from './OptionsEditor';
import { FieldPropertiesStepProps } from '../types/FieldEditTypes';

const SelectOptionsProperties: React.FC<FieldPropertiesStepProps> = ({ formData, onChange }) => {
  // Only show this component for select or multiselect field types
  const isSelectField = formData.type === 'select' || formData.type === 'multiselect';
  
  // Also show for display types that support options
  const supportsOptions = ['accordion', 'chips', 'pill'].includes(formData.displayType || '') && 
                         ['text', 'textarea'].includes(formData.type);

  if (!isSelectField && !supportsOptions) {
    return null;
  }

  return (
    <Paper
      sx={{
        p: 3,
        mb: 3,
        borderRadius: '12px',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(135, 206, 250, 0.2)',
        boxShadow: '0 4px 16px rgba(135, 206, 250, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
      }}
    >
      <Typography variant="h6" sx={{ mb: 3, color: '#4A90E2', fontWeight: 600 }}>
        گزینه‌های فیلد انتخابی
      </Typography>
      
      <OptionsEditor
        options={formData.options || []}
        onChange={(options) => onChange('options', options)}
        fieldType={formData.type}
        displayType={formData.displayType}
      />
      
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {formData.type === 'multiselect' 
            ? 'این فیلد از انتخاب چندگانه پشتیبانی می‌کند. گزینه‌های بالا برای انتخاب توسط کاربران نمایش داده می‌شوند.'
            : 'این فیلد از انتخاب تکی پشتیبانی می‌کند. گزینه‌های بالا برای انتخاب توسط کاربران نمایش داده می‌شوند.'}
        </Typography>
      </Box>
    </Paper>
  );
};

export default SelectOptionsProperties;