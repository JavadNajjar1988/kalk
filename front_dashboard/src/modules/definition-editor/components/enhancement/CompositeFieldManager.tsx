// Composite Field Manager for Field Constructor System
// مدیریت فیلدهای مرکب برای سیستم سازنده فیلد

import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Chip,
  Alert,
  IconButton,
  alpha
} from '@mui/material';
import {
  Person as PersonIcon,
  Language as LanguageIcon,
  Settings as SettingsIcon,
  Delete as DeleteIcon,
  Add as AddIcon
} from '@mui/icons-material';

import type { 
  InputEnhancementComponent, 
  FieldConstructorConfig 
} from '../../types/fieldConstructor';

/**
 * Composite field configuration types
 */
export interface CompositeFieldConfig {
  compositeType: 'name-split' | 'full-name-dual' | 'address-parts' | 'contact-info';
  subFields: Array<{
    id: string;
    name: string;
    englishName: string;
    type: 'text' | 'number' | 'selection';
    isRequired: boolean;
    validation?: {
      rules: string[];
      minLength?: number;
      maxLength?: number;
    };
    placeholder?: string;
    order: number;
  }>;
  layout: {
    arrangement: 'horizontal' | 'vertical' | 'grid';
    spacing: 'compact' | 'normal' | 'spacious';
    equalWidth: boolean;
  };
  validation: {
    crossFieldValidation: boolean;
    requireAllFields: boolean;
    itemValidation?: string[];
    uniqueValidation?: boolean;
    customValidator?: string;
  };
  ui: {
    showLabels: boolean;
    groupBorder: boolean;
    addButtonText?: string;
    removeButtonText?: string;
    emptyStateText?: string;
    layout?: 'horizontal' | 'vertical' | 'grid';
    compactMode?: boolean;
  };
}

/**
 * Predefined composite field types
 */
export const COMPOSITE_FIELD_PRESETS: Record<string, Partial<CompositeFieldConfig>> = {
  'name-split': {
    compositeType: 'name-split',
    subFields: [
      {
        id: 'first_name',
        name: 'نام',
        englishName: 'firstName',
        type: 'text',
        isRequired: true,
        order: 1
      },
      {
        id: 'last_name',
        name: 'نام خانوادگی',
        englishName: 'lastName',
        type: 'text',
        isRequired: true,
        order: 2
      }
    ],
    layout: {
      arrangement: 'horizontal',
      spacing: 'normal',
      equalWidth: true
    }
  },
  'full-name-dual': {
    compositeType: 'full-name-dual',
    subFields: [
      {
        id: 'persian_name',
        name: 'نام فارسی',
        englishName: 'persianName',
        type: 'text',
        isRequired: true,
        order: 1
      },
      {
        id: 'english_name',
        name: 'نام انگلیسی',
        englishName: 'englishName',
        type: 'text',
        isRequired: false,
        validation: {
          rules: ['englishOnly']
        },
        order: 2
      }
    ],
    layout: {
      arrangement: 'vertical',
      spacing: 'normal',
      equalWidth: false
    }
  },
  'contact-info': {
    compositeType: 'contact-info',
    subFields: [
      {
        id: 'phone',
        name: 'تلفن',
        englishName: 'phone',
        type: 'text',
        isRequired: true,
        validation: {
          rules: ['phone']
        },
        order: 1
      },
      {
        id: 'email',
        name: 'ایمیل',
        englishName: 'email',
        type: 'text',
        isRequired: false,
        validation: {
          rules: ['email']
        },
        order: 2
      }
    ],
    layout: {
      arrangement: 'horizontal',
      spacing: 'normal',
      equalWidth: true
    }
  }
};

interface CompositeFieldManagerProps {
  config: FieldConstructorConfig;
  onConfigChange: (config: FieldConstructorConfig) => void;
  compositeType?: keyof typeof COMPOSITE_FIELD_PRESETS;
}

const CompositeFieldManager: React.FC<CompositeFieldManagerProps> = ({
  config,
  onConfigChange,
  compositeType = 'name-split'
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>(compositeType);

  // Get current composite configuration
  const compositeConfig: CompositeFieldConfig = {
    ...COMPOSITE_FIELD_PRESETS[compositeType],
    ...config.inputEnhancement?.configuration
  } as CompositeFieldConfig;

  // Update composite configuration
  const updateCompositeConfig = useCallback((updates: Partial<CompositeFieldConfig>) => {
    const newInputEnhancement: InputEnhancementComponent = {
      type: 'composite',
      configuration: {
        ...compositeConfig,
        ...updates
      }
    };

    onConfigChange({
      ...config,
      inputEnhancement: newInputEnhancement
    });
  }, [config, compositeConfig, onConfigChange]);

  // Apply preset
  const applyPreset = (presetKey: keyof typeof COMPOSITE_FIELD_PRESETS) => {
    const preset = COMPOSITE_FIELD_PRESETS[presetKey];
    updateCompositeConfig(preset);
    setSelectedPreset(presetKey);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          مدیریت فیلد مرکب
        </Typography>
        <Typography variant="body2" color="text.secondary">
          ترکیب چندین زیرفیلد در یک فیلد واحد
        </Typography>
      </Box>

      {/* Preset Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            انتخاب نوع فیلد مرکب
          </Typography>
          
          <Grid container spacing={2}>
            {Object.entries(COMPOSITE_FIELD_PRESETS).map(([key, preset]) => (
              <Grid item xs={12} sm={6} md={4} key={key}>
                <Card
                  variant="outlined"
                  sx={{
                    cursor: 'pointer',
                    border: selectedPreset === key ? 2 : 1,
                    borderColor: selectedPreset === key ? 'primary.main' : 'divider',
                    '&:hover': {
                      borderColor: 'primary.main',
                      backgroundColor: alpha('rgb(25, 118, 210)', 0.04)
                    }
                  }}
                  onClick={() => applyPreset(key as keyof typeof COMPOSITE_FIELD_PRESETS)}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      {key === 'name-split' && <PersonIcon color="primary" sx={{ mr: 1 }} />}
                      {key === 'full-name-dual' && <LanguageIcon color="primary" sx={{ mr: 1 }} />}
                      {key === 'contact-info' && <SettingsIcon color="primary" sx={{ mr: 1 }} />}
                      <Typography variant="subtitle2">
                        {key === 'name-split' && 'تقسیم نام'}
                        {key === 'full-name-dual' && 'نام دوزبانه'}
                        {key === 'contact-info' && 'اطلاعات تماس'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {preset.subFields?.map((field, index) => (
                        <Chip 
                          key={index} 
                          label={field.name} 
                          size="small" 
                          variant="outlined" 
                        />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Configuration Display */}
      <Card>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            تنظیمات فعلی
          </Typography>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            نوع انتخاب شده: <strong>{selectedPreset}</strong>
          </Alert>

          {/* Sub-fields preview */}
          <Typography variant="subtitle2" gutterBottom>
            زیرفیلدها:
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {compositeConfig.subFields?.map((field, index) => (
              <Box 
                key={index} 
                sx={{ 
                  p: 2, 
                  border: '1px solid', 
                  borderColor: 'divider', 
                  borderRadius: 1,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {field.name} ({field.englishName})
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    نوع: {field.type} | اجباری: {field.isRequired ? 'بله' : 'خیر'}
                  </Typography>
                </Box>
                
                <Chip 
                  label={field.type} 
                  size="small" 
                  color={field.isRequired ? 'primary' : 'default'}
                  variant="outlined"
                />
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CompositeFieldManager;