// Advanced Array Field Manager
// مدیریت پیشرفته فیلدهای آرایه‌ای

import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  alpha
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  ExpandMore as ExpandIcon,
  Settings as SettingsIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Share as SocialIcon,
  Preview as PreviewIcon,
  CheckCircle as ValidIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

import type { 
  InputEnhancementComponent, 
  FieldConstructorConfig 
} from '../../types/fieldConstructor';

/**
 * Array field configuration types
 */
export interface ArrayFieldConfig {
  minItems: number;
  maxItems: number;
  allowDuplicates: boolean;
  itemLabels: string[];
  showItemNumbers: boolean;
  sortable: boolean;
  validation: {
    itemValidation: string[];
    uniqueValidation: boolean;
    customValidator?: string;
  };
  ui: {
    addButtonText: string;
    removeButtonText: string;
    emptyStateText: string;
    layout: 'vertical' | 'horizontal' | 'grid';
    compactMode: boolean;
  };
}

/**
 * Predefined array field types
 */
export const ARRAY_FIELD_PRESETS: Record<string, Partial<ArrayFieldConfig>> = {
  'phone-array': {
    minItems: 1,
    maxItems: 5,
    allowDuplicates: false,
    itemLabels: ['موبایل', 'منزل', 'محل کار', 'اضطراری', 'فکس', 'سایر'],
    validation: {
      itemValidation: ['phone'],
      uniqueValidation: true
    },
    ui: {
      addButtonText: 'افزودن شماره تلفن',
      removeButtonText: 'حذف شماره',
      emptyStateText: 'هیچ شماره تلفنی اضافه نشده است',
      layout: 'vertical'
    }
  },
  'address-array': {
    minItems: 0,
    maxItems: 3,
    allowDuplicates: false,
    itemLabels: ['منزل', 'محل کار', 'محل تولد', 'موقت', 'سایر'],
    validation: {
      itemValidation: ['minLength'],
      uniqueValidation: false
    },
    ui: {
      addButtonText: 'افزودن آدرس',
      removeButtonText: 'حذف آدرس',
      emptyStateText: 'هیچ آدرسی اضافه نشده است',
      layout: 'vertical'
    }
  },
  'social-array': {
    minItems: 0,
    maxItems: 8,
    allowDuplicates: false,
    itemLabels: ['تلگرام', 'واتساپ', 'اینستاگرام', 'توییتر', 'لینکدین', 'ایتا', 'سروش', 'بله'],
    validation: {
      itemValidation: ['socialMedia'],
      uniqueValidation: true
    },
    ui: {
      addButtonText: 'افزودن شبکه اجتماعی',
      removeButtonText: 'حذف',
      emptyStateText: 'هیچ شبکه اجتماعی اضافه نشده است',
      layout: 'grid'
    }
  },
  'skill-array': {
    minItems: 0,
    maxItems: 10,
    allowDuplicates: false,
    itemLabels: ['فنی', 'مدیریتی', 'زبان', 'نرم‌افزار', 'سایر'],
    validation: {
      itemValidation: ['minLength'],
      uniqueValidation: false
    },
    ui: {
      addButtonText: 'افزودن مهارت',
      removeButtonText: 'حذف مهارت',
      emptyStateText: 'هیچ مهارتی اضافه نشده است',
      layout: 'horizontal'
    }
  },
  'document-array': {
    minItems: 0,
    maxItems: 20,
    allowDuplicates: false,
    itemLabels: ['شناسنامه', 'کارت ملی', 'گذرنامه', 'گواهی', 'مدرک', 'سایر'],
    validation: {
      itemValidation: ['file'],
      uniqueValidation: true
    },
    ui: {
      addButtonText: 'افزودن مدرک',
      removeButtonText: 'حذف مدرک',
      emptyStateText: 'هیچ مدرکی آپلود نشده است',
      layout: 'grid'
    }
  }
};

interface ArrayFieldManagerProps {
  config: FieldConstructorConfig;
  onConfigChange: (config: FieldConstructorConfig) => void;
  arrayType?: keyof typeof ARRAY_FIELD_PRESETS;
}

const ArrayFieldManager: React.FC<ArrayFieldManagerProps> = ({
  config,
  onConfigChange,
  arrayType = 'phone-array'
}) => {
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [presetDialog, setPresetDialog] = useState(false);

  // Get current array configuration
  const arrayConfig: ArrayFieldConfig = {
    ...ARRAY_FIELD_PRESETS[arrayType],
    ...config.inputEnhancement?.configuration
  } as ArrayFieldConfig;

  // Update array configuration
  const updateArrayConfig = useCallback((updates: Partial<ArrayFieldConfig>) => {
    const newInputEnhancement: InputEnhancementComponent = {
      type: 'array',
      configuration: {
        ...arrayConfig,
        ...updates
      }
    };

    onConfigChange({
      ...config,
      inputEnhancement: newInputEnhancement
    });
  }, [config, arrayConfig, onConfigChange]);

  // Apply preset configuration
  const applyPreset = (presetKey: keyof typeof ARRAY_FIELD_PRESETS) => {
    const preset = ARRAY_FIELD_PRESETS[presetKey];
    updateArrayConfig(preset);
    setPresetDialog(false);
  };

  // Add custom label
  const addCustomLabel = () => {
    const newLabel = prompt('نام برچسب جدید را وارد کنید:');
    if (newLabel && newLabel.trim()) {
      const newLabels = [...(arrayConfig.itemLabels || []), newLabel.trim()];
      updateArrayConfig({ itemLabels: newLabels });
    }
  };

  // Remove label
  const removeLabel = (index: number) => {
    const newLabels = arrayConfig.itemLabels?.filter((_, i) => i !== index) || [];
    updateArrayConfig({ itemLabels: newLabels });
  };

  // Get configuration validation
  const getConfigValidation = () => {
    const issues: string[] = [];
    const warnings: string[] = [];

    if (arrayConfig.minItems > arrayConfig.maxItems) {
      issues.push('حداقل آیتم نمی‌تواند بیشتر از حداکثر آیتم باشد');
    }

    if (arrayConfig.maxItems > 50) {
      warnings.push('تعداد زیاد آیتم‌ها ممکن است عملکرد را کاهش دهد');
    }

    if (!arrayConfig.itemLabels || arrayConfig.itemLabels.length === 0) {
      warnings.push('تعریف برچسب برای آیتم‌ها توصیه می‌شود');
    }

    return { issues, warnings };
  };

  const { issues, warnings } = getConfigValidation();

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          مدیریت فیلد آرایه‌ای
        </Typography>
        <Typography variant="body2" color="text.secondary">
          پیکربندی پیشرفته برای فیلدهای چندتایی
        </Typography>
      </Box>

      {/* Quick Presets */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1">قالب‌های آماده</Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setPresetDialog(true)}
              startIcon={<SettingsIcon />}
            >
              انتخاب قالب
            </Button>
          </Box>
          
          <Grid container spacing={2}>
            {Object.entries(ARRAY_FIELD_PRESETS).map(([key, preset]) => (
              <Grid item xs={12} sm={6} md={4} key={key}>
                <Card
                  variant="outlined"
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    border: arrayType === key ? 2 : 1,
                    borderColor: arrayType === key ? 'primary.main' : 'divider',
                    '&:hover': {
                      borderColor: 'primary.main',
                      backgroundColor: alpha('rgb(25, 118, 210)', 0.04)
                    }
                  }}
                  onClick={() => applyPreset(key as keyof typeof ARRAY_FIELD_PRESETS)}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      {key === 'phone-array' && <PhoneIcon color="primary" sx={{ mr: 1 }} />}
                      {key === 'address-array' && <LocationIcon color="primary" sx={{ mr: 1 }} />}
                      {key === 'social-array' && <SocialIcon color="primary" sx={{ mr: 1 }} />}
                      {key === 'skill-array' && <PersonIcon color="primary" sx={{ mr: 1 }} />}
                      {!['phone-array', 'address-array', 'social-array', 'skill-array'].includes(key) && 
                        <SettingsIcon color="primary" sx={{ mr: 1 }} />}
                      <Typography variant="subtitle2">
                        {preset.ui?.addButtonText?.replace('افزودن ', '') || key}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {preset.minItems}-{preset.maxItems} آیتم
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Configuration Sections */}
      <Grid container spacing={3}>
        {/* Basic Configuration */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                تنظیمات پایه
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="حداقل تعداد آیتم"
                  type="number"
                  value={arrayConfig.minItems || 0}
                  onChange={(e) => updateArrayConfig({ minItems: parseInt(e.target.value) || 0 })}
                  inputProps={{ min: 0, max: 100 }}
                  size="small"
                />
                
                <TextField
                  label="حداکثر تعداد آیتم"
                  type="number"
                  value={arrayConfig.maxItems || 10}
                  onChange={(e) => updateArrayConfig({ maxItems: parseInt(e.target.value) || 10 })}
                  inputProps={{ min: 1, max: 100 }}
                  size="small"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={arrayConfig.allowDuplicates || false}
                      onChange={(e) => updateArrayConfig({ allowDuplicates: e.target.checked })}
                    />
                  }
                  label="اجازه مقادیر تکراری"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={arrayConfig.sortable || false}
                      onChange={(e) => updateArrayConfig({ sortable: e.target.checked })}
                    />
                  }
                  label="قابلیت مرتب‌سازی"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Item Labels */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1">
                  برچسب‌های آیتم
                </Typography>
                <Button
                  size="small"
                  onClick={addCustomLabel}
                  startIcon={<AddIcon />}
                >
                  افزودن
                </Button>
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {arrayConfig.itemLabels?.map((label, index) => (
                  <Chip
                    key={index}
                    label={label}
                    onDelete={() => removeLabel(index)}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                ))}
                {(!arrayConfig.itemLabels || arrayConfig.itemLabels.length === 0) && (
                  <Typography variant="body2" color="text.secondary">
                    هیچ برچسبی تعریف نشده است
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* UI Configuration */}
        <Grid item xs={12}>
          <Accordion expanded={isAdvancedMode} onChange={() => setIsAdvancedMode(!isAdvancedMode)}>
            <AccordionSummary expandIcon={<ExpandIcon />}>
              <Typography variant="subtitle1">تنظیمات پیشرفته رابط کاربری</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>چیدمان</InputLabel>
                    <Select
                      value={arrayConfig.ui?.layout || 'vertical'}
                      onChange={(e) => updateArrayConfig({
                        ui: { ...arrayConfig.ui, layout: e.target.value as any }
                      })}
                    >
                      <MenuItem value="vertical">عمودی</MenuItem>
                      <MenuItem value="horizontal">افقی</MenuItem>
                      <MenuItem value="grid">شبکه‌ای</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={arrayConfig.ui?.compactMode || false}
                        onChange={(e) => updateArrayConfig({
                          ui: { ...arrayConfig.ui, compactMode: e.target.checked }
                        })}
                      />
                    }
                    label="حالت فشرده"
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={arrayConfig.showItemNumbers || false}
                        onChange={(e) => updateArrayConfig({ showItemNumbers: e.target.checked })}
                      />
                    }
                    label="نمایش شماره آیتم"
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setShowPreview(true)}
                    startIcon={<PreviewIcon />}
                    fullWidth
                  >
                    پیش‌نمایش
                  </Button>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="متن دکمه افزودن"
                    value={arrayConfig.ui?.addButtonText || 'افزودن آیتم'}
                    onChange={(e) => updateArrayConfig({
                      ui: { ...arrayConfig.ui, addButtonText: e.target.value }
                    })}
                    size="small"
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="پیام حالت خالی"
                    value={arrayConfig.ui?.emptyStateText || 'هیچ آیتمی اضافه نشده است'}
                    onChange={(e) => updateArrayConfig({
                      ui: { ...arrayConfig.ui, emptyStateText: e.target.value }
                    })}
                    size="small"
                    fullWidth
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Validation Issues */}
        {(issues.length > 0 || warnings.length > 0) && (
          <Grid item xs={12}>
            {issues.length > 0 && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>مشکلات پیکربندی:</Typography>
                <List dense>
                  {issues.map((issue, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <WarningIcon color="error" />
                      </ListItemIcon>
                      <ListItemText primary={issue} />
                    </ListItem>
                  ))}
                </List>
              </Alert>
            )}

            {warnings.length > 0 && (
              <Alert severity="warning">
                <Typography variant="subtitle2" gutterBottom>نکات و توصیه‌ها:</Typography>
                <List dense>
                  {warnings.map((warning, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <WarningIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText primary={warning} />
                    </ListItem>
                  ))}
                </List>
              </Alert>
            )}
          </Grid>
        )}

        {/* Summary */}
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                خلاصه پیکربندی
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Chip
                  icon={<ValidIcon />}
                  label={`${arrayConfig.minItems}-${arrayConfig.maxItems} آیتم`}
                  color="primary"
                  size="small"
                />
                {arrayConfig.allowDuplicates && (
                  <Chip label="تکراری مجاز" color="secondary" size="small" variant="outlined" />
                )}
                {arrayConfig.sortable && (
                  <Chip label="قابل مرتب‌سازی" color="info" size="small" variant="outlined" />
                )}
                {arrayConfig.itemLabels && arrayConfig.itemLabels.length > 0 && (
                  <Chip 
                    label={`${arrayConfig.itemLabels.length} برچسب`} 
                    color="success" 
                    size="small" 
                    variant="outlined" 
                  />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Preset Selection Dialog */}
      <Dialog open={presetDialog} onClose={() => setPresetDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>انتخاب قالب آرایه</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {Object.entries(ARRAY_FIELD_PRESETS).map(([key, preset]) => (
              <Grid item xs={12} sm={6} key={key}>
                <Card
                  variant="outlined"
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: 'action.hover' }
                  }}
                  onClick={() => applyPreset(key as keyof typeof ARRAY_FIELD_PRESETS)}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {preset.ui?.addButtonText?.replace('افزودن ', '') || key}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {preset.ui?.emptyStateText}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {preset.itemLabels?.slice(0, 4).map((label, index) => (
                        <Chip key={index} label={label} size="small" variant="outlined" />
                      ))}
                      {preset.itemLabels && preset.itemLabels.length > 4 && (
                        <Chip label={`+${preset.itemLabels.length - 4}`} size="small" />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPresetDialog(false)}>انصراف</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ArrayFieldManager;