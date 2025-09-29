// Number Field Rules Step Component
// کامپوننت مرحله قوانین فیلد عددی

import React, { memo } from 'react';
import {
  Box,
  Typography,
} from '@mui/material';
import { ExtendedCustomFieldDefinition } from '../types/FieldEditTypes';
import { NumberValidationRules } from '../rules/NumberValidationRules';
import { NumberDependencyRules } from '../rules/NumberDependencyRules';
import { NumberControlRules } from '../rules/NumberControlRules';

interface NumberFieldRulesStepProps {
  formData: ExtendedCustomFieldDefinition;
  onChange: (key: keyof ExtendedCustomFieldDefinition, value: any) => void;
}

export const NumberFieldRulesStep = memo<NumberFieldRulesStepProps>(({
  formData,
  onChange,
}) => {
  return (
    <Box>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography 
          variant="h5" 
          gutterBottom
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(45deg, #4A90E2 30%, #7BB3F0 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          قوانین فیلد عددی
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem', opacity: 0.8, mb: 4 }}>
          قوانین اعتبارسنجی، وابستگی و کنترلی برای فیلد عددی تعریف کنید
        </Typography>
      </Box>

      {/* Validation Rules */}
      <NumberValidationRules formData={formData} onChange={onChange} />

      {/* Dependency Rules */}
      <NumberDependencyRules formData={formData} onChange={onChange} />

      {/* Control Rules */}
      <NumberControlRules formData={formData} onChange={onChange} />
    </Box>
  );
});

NumberFieldRulesStep.displayName = 'NumberFieldRulesStep';
