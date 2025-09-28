/**
 * ScenarioBasicInfoForm Component
 * فرم اطلاعات پایه سناریو
 */

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Box,
  useTheme,
  alpha
} from '@mui/material';
import type { NewScenarioFormData, NewScenarioFormErrors } from '../types/new-scenario';

interface ScenarioBasicInfoFormProps {
  formData: Pick<NewScenarioFormData, 'name' | 'description'>;
  errors: Pick<NewScenarioFormErrors, 'name' | 'description'>;
  onFieldChange: (field: 'name' | 'description', value: string) => void;
}

const ScenarioBasicInfoForm: React.FC<ScenarioBasicInfoFormProps> = ({
  formData,
  errors,
  onFieldChange
}) => {
  const theme = useTheme();
  
  return (
    <Card 
      sx={{ 
        mb: 3,
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.default, 0.95)} 100%)`,
        backdropFilter: 'blur(10px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography 
            variant="h6" 
            component="h3"
            sx={{ 
              fontWeight: 600,
              color: theme.palette.text.primary,
              mb: 1
            }}
          >
            اطلاعات پایه سناریو
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ lineHeight: 1.6 }}
          >
            نام و توضیحی برای سناریوی خود ارائه دهید.
          </Typography>
        </Box>
        
        {/* Form Fields */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Scenario Name */}
          <TextField
            label="نام"
            value={formData.name}
            onChange={(e) => onFieldChange('name', e.target.value)}
            error={!!errors.name}
            helperText={errors.name}
            variant="outlined"
            fullWidth
            autoFocus
            InputLabelProps={{
              sx: { 
                '&.Mui-focused': { 
                  color: theme.palette.primary.main 
                }
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: alpha(theme.palette.primary.main, 0.5)
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.primary.main,
                  borderWidth: 2
                }
              }
            }}
          />
          
          {/* Scenario Description */}
          <TextField
            label="توضیحات"
            value={formData.description}
            onChange={(e) => onFieldChange('description', e.target.value)}
            error={!!errors.description}
            helperText={errors.description || 'از نحو مارک‌داون برای قالب‌بندی استفاده کنید'}
            variant="outlined"
            fullWidth
            multiline
            rows={4}
            InputLabelProps={{
              sx: { 
                '&.Mui-focused': { 
                  color: theme.palette.primary.main 
                }
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: alpha(theme.palette.primary.main, 0.5)
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.primary.main,
                  borderWidth: 2
                }
              }
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default ScenarioBasicInfoForm;