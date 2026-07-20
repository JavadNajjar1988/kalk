// Hierarchical Field Manager for Field Constructor System
// مدیریت فیلدهای سلسله‌مراتبی برای سیستم سازنده فیلد

import React, { useState, useCallback, useEffect } from 'react';
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
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  alpha
} from '@mui/material';
import {
  AccountTree as HierarchicalIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

import type { 
  InputEnhancementComponent, 
  FieldConstructorConfig,
  DataSourceComponent 
} from '../../types/fieldConstructor';
import { loadCategoryLevels } from '../../data/loader';
import { CategoryType } from '../../types';

/**
 * Hierarchical field configuration types
 */
export interface HierarchicalFieldConfig {
  maxDepth: number;
  showPath: boolean;
  expandAll: boolean;
  allowSearch: boolean;
  showCoordinates: boolean;
  rootCategory: string;
  customLevels?: Array<{
    id: string;
    name: string;
    englishName: string;
    order: number;
    isRequired: boolean;
  }>;
  pathDisplay: {
    showIcons: boolean;
    showBreadcrumb: boolean;
    compactMode: boolean;
    orientation: 'horizontal' | 'vertical';
  };
  selection: {
    allowMultiple: boolean;
    requireLeafSelection: boolean;
    showSelectionCounter: boolean;
  };
  filtering: {
    enableQuickFilter: boolean;
    filterByLevel: boolean;
    customFilters: Array<{
      id: string;
      name: string;
      field: string;
      operator: 'equals' | 'contains' | 'startsWith';
      value: string;
    }>;
  };
}

/**
 * Predefined hierarchical field presets
 */
export const HIERARCHICAL_FIELD_PRESETS: Record<string, Partial<HierarchicalFieldConfig>> = {
  'geographical-address': {
    maxDepth: 7,
    showPath: true,
    expandAll: false,
    allowSearch: true,
    showCoordinates: true,
    rootCategory: 'geographical',
    pathDisplay: {
      showIcons: true,
      showBreadcrumb: true,
      compactMode: false,
      orientation: 'horizontal'
    },
    selection: {
      allowMultiple: false,
      requireLeafSelection: false,
      showSelectionCounter: false
    },
    filtering: {
      enableQuickFilter: true,
      filterByLevel: true,
      customFilters: []
    }
  },

  'military-hierarchy': {
    maxDepth: 5,
    showPath: true,
    expandAll: false,
    allowSearch: true,
    showCoordinates: false,
    rootCategory: 'military_rank',
    pathDisplay: {
      showIcons: true,
      showBreadcrumb: true,
      compactMode: true,
      orientation: 'horizontal'
    },
    selection: {
      allowMultiple: false,
      requireLeafSelection: true,
      showSelectionCounter: false
    },
    filtering: {
      enableQuickFilter: true,
      filterByLevel: false,
      customFilters: []
    }
  },

  'equipment-catalog': {
    maxDepth: 6,
    showPath: true,
    expandAll: false,
    allowSearch: true,
    showCoordinates: false,
    rootCategory: 'equipment',
    pathDisplay: {
      showIcons: true,
      showBreadcrumb: true,
      compactMode: false,
      orientation: 'vertical'
    },
    selection: {
      allowMultiple: true,
      requireLeafSelection: false,
      showSelectionCounter: true
    },
    filtering: {
      enableQuickFilter: true,
      filterByLevel: true,
      customFilters: [
        {
          id: 'active-only',
          name: 'فقط موارد فعال',
          field: 'isActive',
          operator: 'equals',
          value: 'true'
        }
      ]
    }
  },

  'personnel-structure': {
    maxDepth: 4,
    showPath: true,
    expandAll: true,
    allowSearch: true,
    showCoordinates: false,
    rootCategory: 'personnel',
    pathDisplay: {
      showIcons: false,
      showBreadcrumb: true,
      compactMode: true,
      orientation: 'horizontal'
    },
    selection: {
      allowMultiple: false,
      requireLeafSelection: true,
      showSelectionCounter: false
    },
    filtering: {
      enableQuickFilter: false,
      filterByLevel: true,
      customFilters: []
    }
  }
};

interface HierarchicalFieldManagerProps {
  config: FieldConstructorConfig;
  onConfigChange: (config: FieldConstructorConfig) => void;
  hierarchicalType?: keyof typeof HIERARCHICAL_FIELD_PRESETS;
}

const HierarchicalFieldManager: React.FC<HierarchicalFieldManagerProps> = ({
  config,
  onConfigChange,
  hierarchicalType = 'geographical-address'
}) => {
  const [availableLevels, setAvailableLevels] = useState<any[]>([]);
  const [loadingLevels, setLoadingLevels] = useState(false);
  const [levelError, setLevelError] = useState<string>('');

  // Get current hierarchical configuration
  const hierarchicalConfig: HierarchicalFieldConfig = {
    ...HIERARCHICAL_FIELD_PRESETS[hierarchicalType],
    ...config.inputEnhancement?.configuration,
    ...config.dataSource?.configuration
  } as HierarchicalFieldConfig;

  // Load available levels for the selected category
  useEffect(() => {
    if (hierarchicalConfig.rootCategory) {
      loadCategoryLevelsData(hierarchicalConfig.rootCategory);
    }
  }, [hierarchicalConfig.rootCategory]);

  const loadCategoryLevelsData = async (categoryType: string) => {
    try {
      setLoadingLevels(true);
      setLevelError('');
      
      let categoryEnum: CategoryType;
      switch (categoryType.toLowerCase()) {
        case 'geographical':
          categoryEnum = CategoryType.GEOGRAPHICAL;
          break;
        case 'equipment':
          categoryEnum = CategoryType.EQUIPMENT;
          break;
        case 'personnel':
          categoryEnum = CategoryType.PERSONS;
          break;
        case 'military_rank':
          categoryEnum = CategoryType.MILITARY_RANK;
          break;
        default:
          categoryEnum = CategoryType.GEOGRAPHICAL;
      }
      
      const levels = await loadCategoryLevels(categoryEnum);
      setAvailableLevels(levels);
    } catch (error) {
      console.error('Failed to load category levels:', error);
      setLevelError('خطا در بارگذاری سطوح دسته‌بندی');
    } finally {
      setLoadingLevels(false);
    }
  };

  // Update hierarchical configuration
  const updateHierarchicalConfig = useCallback((updates: Partial<HierarchicalFieldConfig>) => {
    const newInputEnhancement: InputEnhancementComponent = {
      type: 'hierarchical',
      configuration: {
        ...hierarchicalConfig,
        ...updates
      }
    };

    const newDataSource: DataSourceComponent = {
      type: 'geographical',
      configuration: {
        rootCategory: updates.rootCategory || hierarchicalConfig.rootCategory,
        maxLevel: updates.maxDepth || hierarchicalConfig.maxDepth,
        allowFreeText: true,
        searchable: updates.allowSearch !== undefined ? updates.allowSearch : hierarchicalConfig.allowSearch,
        filterable: updates.filtering?.enableQuickFilter !== undefined ? 
          updates.filtering.enableQuickFilter : hierarchicalConfig.filtering?.enableQuickFilter
      }
    };

    onConfigChange({
      ...config,
      inputEnhancement: newInputEnhancement,
      dataSource: newDataSource
    });
  }, [config, hierarchicalConfig, onConfigChange]);

  // Apply preset configuration
  const applyPreset = (presetKey: keyof typeof HIERARCHICAL_FIELD_PRESETS) => {
    const preset = HIERARCHICAL_FIELD_PRESETS[presetKey];
    updateHierarchicalConfig(preset);
  };

  // Add custom filter
  const addCustomFilter = () => {
    const newFilter = {
      id: `filter_${Date.now()}`,
      name: 'فیلتر جدید',
      field: 'name',
      operator: 'contains' as const,
      value: ''
    };

    updateHierarchicalConfig({
      filtering: {
        ...hierarchicalConfig.filtering,
        customFilters: [...(hierarchicalConfig.filtering?.customFilters || []), newFilter]
      }
    });
  };

  // Remove custom filter
  const removeCustomFilter = (filterId: string) => {
    const updatedFilters = hierarchicalConfig.filtering?.customFilters?.filter(f => f.id !== filterId) || [];
    updateHierarchicalConfig({
      filtering: {
        ...hierarchicalConfig.filtering,
        customFilters: updatedFilters
      }
    });
  };

  // Get preset icon
  const getPresetIcon = (presetKey: string) => {
    switch (presetKey) {
      case 'geographical-address':
        return <LocationIcon />;
      case 'military-hierarchy':
        return <PersonIcon />;
      case 'equipment-catalog':
        return <BusinessIcon />;
      case 'personnel-structure':
        return <PersonIcon />;
      default:
        return <HierarchicalIcon />;
    }
  };

  // Get category type display name
  const getCategoryDisplayName = (category: string) => {
    switch (category.toLowerCase()) {
      case 'geographical':
        return 'جغرافیایی';
      case 'equipment':
        return 'تجهیزات';
      case 'personnel':
        return 'پرسنل';
      case 'military_rank':
        return 'رتبه نظامی';
      default:
        return category;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          مدیریت فیلد سلسله‌مراتبی
        </Typography>
        <Typography variant="body2" color="text.secondary">
          پیکربندی فیلدهای انتخاب درختی و سلسله‌مراتبی
        </Typography>
      </Box>

      {/* Quick Presets */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>قالب‌های آماده</Typography>
          
          <Grid container spacing={2}>
            {Object.entries(HIERARCHICAL_FIELD_PRESETS).map(([key, preset]) => (
              <Grid item xs={12} sm={6} md={3} key={key}>
                <Card
                  variant="outlined"
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    border: hierarchicalType === key ? 2 : 1,
                    borderColor: hierarchicalType === key ? 'primary.main' : 'divider',
                    '&:hover': {
                      borderColor: 'primary.main',
                      backgroundColor: alpha('rgb(25, 118, 210)', 0.04)
                    }
                  }}
                  onClick={() => applyPreset(key as keyof typeof HIERARCHICAL_FIELD_PRESETS)}
                >
                  <CardContent sx={{ p: 2, textAlign: 'center' }}>
                    <Box sx={{ mb: 1 }}>
                      {getPresetIcon(key)}
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontSize: '0.875rem' }}>
                      {getCategoryDisplayName(preset.rootCategory || '')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      حداکثر {preset.maxDepth} سطح
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
        {/* Basic Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                تنظیمات پایه
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>دسته‌بندی مرجع</InputLabel>
                    <Select
                      value={hierarchicalConfig.rootCategory || 'geographical'}
                      onChange={(e) => updateHierarchicalConfig({ rootCategory: e.target.value })}
                    >
                      <MenuItem value="geographical">جغرافیایی</MenuItem>
                      <MenuItem value="equipment">تجهیزات</MenuItem>
                      <MenuItem value="personnel">پرسنل</MenuItem>
                      <MenuItem value="military_rank">رتبه نظامی</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="number"
                    label="حداکثر عمق"
                    value={hierarchicalConfig.maxDepth || 5}
                    onChange={(e) => updateHierarchicalConfig({ maxDepth: parseInt(e.target.value) })}
                    inputProps={{ min: 1, max: 10 }}
                    size="small"
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={hierarchicalConfig.showPath || false}
                        onChange={(e) => updateHierarchicalConfig({ showPath: e.target.checked })}
                      />
                    }
                    label="نمایش مسیر انتخاب"
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={hierarchicalConfig.allowSearch || false}
                        onChange={(e) => updateHierarchicalConfig({ allowSearch: e.target.checked })}
                      />
                    }
                    label="قابلیت جستجو"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Display Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                تنظیمات نمایش
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>جهت نمایش مسیر</InputLabel>
                    <Select
                      value={hierarchicalConfig.pathDisplay?.orientation || 'horizontal'}
                      onChange={(e) => updateHierarchicalConfig({
                        pathDisplay: {
                          ...hierarchicalConfig.pathDisplay,
                          orientation: e.target.value as 'horizontal' | 'vertical'
                        }
                      })}
                    >
                      <MenuItem value="horizontal">افقی</MenuItem>
                      <MenuItem value="vertical">عمودی</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={hierarchicalConfig.pathDisplay?.showIcons || false}
                        onChange={(e) => updateHierarchicalConfig({
                          pathDisplay: {
                            ...hierarchicalConfig.pathDisplay,
                            showIcons: e.target.checked
                          }
                        })}
                      />
                    }
                    label="نمایش آیکون‌ها"
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={hierarchicalConfig.pathDisplay?.compactMode || false}
                        onChange={(e) => updateHierarchicalConfig({
                          pathDisplay: {
                            ...hierarchicalConfig.pathDisplay,
                            compactMode: e.target.checked
                          }
                        })}
                      />
                    }
                    label="حالت فشرده"
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={hierarchicalConfig.expandAll || false}
                        onChange={(e) => updateHierarchicalConfig({ expandAll: e.target.checked })}
                      />
                    }
                    label="باز کردن همه سطوح"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Selection Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                تنظیمات انتخاب
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={hierarchicalConfig.selection?.allowMultiple || false}
                        onChange={(e) => updateHierarchicalConfig({
                          selection: {
                            ...hierarchicalConfig.selection,
                            allowMultiple: e.target.checked
                          }
                        })}
                      />
                    }
                    label="انتخاب چندگانه"
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={hierarchicalConfig.selection?.requireLeafSelection || false}
                        onChange={(e) => updateHierarchicalConfig({
                          selection: {
                            ...hierarchicalConfig.selection,
                            requireLeafSelection: e.target.checked
                          }
                        })}
                      />
                    }
                    label="فقط انتخاب نودهای پایانی"
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={hierarchicalConfig.selection?.showSelectionCounter || false}
                        onChange={(e) => updateHierarchicalConfig({
                          selection: {
                            ...hierarchicalConfig.selection,
                            showSelectionCounter: e.target.checked
                          }
                        })}
                      />
                    }
                    label="نمایش شمارنده انتخاب"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Available Levels */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                سطوح موجود
              </Typography>
              
              {loadingLevels ? (
                <Typography variant="body2" color="text.secondary">
                  در حال بارگذاری...
                </Typography>
              ) : levelError ? (
                <Alert severity="error" size="small">
                  {levelError}
                </Alert>
              ) : availableLevels.length > 0 ? (
                <List dense>
                  {availableLevels.slice(0, hierarchicalConfig.maxDepth).map((level, index) => (
                    <ListItem key={level.id} divider={index < availableLevels.length - 1}>
                      <ListItemIcon>
                        <Typography variant="caption" color="primary.main" fontWeight="bold">
                          {index + 1}
                        </Typography>
                      </ListItemIcon>
                      <ListItemText
                        primary={level.name}
                        secondary={level.englishName}
                        primaryTypographyProps={{ variant: 'body2' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  هیچ سطحی برای این دسته‌بندی تعریف نشده است
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Advanced Filtering */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">
                تنظیمات پیشرفته فیلتر
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={hierarchicalConfig.filtering?.enableQuickFilter || false}
                        onChange={(e) => updateHierarchicalConfig({
                          filtering: {
                            ...hierarchicalConfig.filtering,
                            enableQuickFilter: e.target.checked
                          }
                        })}
                      />
                    }
                    label="فیلتر سریع"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={hierarchicalConfig.filtering?.filterByLevel || false}
                        onChange={(e) => updateHierarchicalConfig({
                          filtering: {
                            ...hierarchicalConfig.filtering,
                            filterByLevel: e.target.checked
                          }
                        })}
                      />
                    }
                    label="فیلتر بر اساس سطح"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle2">فیلترهای سفارشی</Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={addCustomFilter}
                      startIcon={<AddIcon />}
                    >
                      افزودن فیلتر
                    </Button>
                  </Box>

                  {hierarchicalConfig.filtering?.customFilters?.map((filter) => (
                    <Paper key={filter.id} variant="outlined" sx={{ p: 2, mb: 1 }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={3}>
                          <TextField
                            fullWidth
                            size="small"
                            label="نام فیلتر"
                            value={filter.name}
                            onChange={(e) => {
                              const updatedFilters = hierarchicalConfig.filtering?.customFilters?.map(f =>
                                f.id === filter.id ? { ...f, name: e.target.value } : f
                              ) || [];
                              updateHierarchicalConfig({
                                filtering: { ...hierarchicalConfig.filtering, customFilters: updatedFilters }
                              });
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <FormControl fullWidth size="small">
                            <InputLabel>فیلد</InputLabel>
                            <Select value={filter.field} onChange={(e) => {
                              const updatedFilters = hierarchicalConfig.filtering?.customFilters?.map(f =>
                                f.id === filter.id ? { ...f, field: e.target.value } : f
                              ) || [];
                              updateHierarchicalConfig({
                                filtering: { ...hierarchicalConfig.filtering, customFilters: updatedFilters }
                              });
                            }}>
                              <MenuItem value="name">نام</MenuItem>
                              <MenuItem value="englishName">نام انگلیسی</MenuItem>
                              <MenuItem value="description">توضیحات</MenuItem>
                              <MenuItem value="isActive">وضعیت</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={2}>
                          <FormControl fullWidth size="small">
                            <InputLabel>عملگر</InputLabel>
                            <Select value={filter.operator} onChange={(e) => {
                              const updatedFilters = hierarchicalConfig.filtering?.customFilters?.map(f =>
                                f.id === filter.id ? { ...f, operator: e.target.value as any } : f
                              ) || [];
                              updateHierarchicalConfig({
                                filtering: { ...hierarchicalConfig.filtering, customFilters: updatedFilters }
                              });
                            }}>
                              <MenuItem value="equals">برابر</MenuItem>
                              <MenuItem value="contains">شامل</MenuItem>
                              <MenuItem value="startsWith">شروع با</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <TextField
                            fullWidth
                            size="small"
                            label="مقدار"
                            value={filter.value}
                            onChange={(e) => {
                              const updatedFilters = hierarchicalConfig.filtering?.customFilters?.map(f =>
                                f.id === filter.id ? { ...f, value: e.target.value } : f
                              ) || [];
                              updateHierarchicalConfig({
                                filtering: { ...hierarchicalConfig.filtering, customFilters: updatedFilters }
                              });
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={1}>
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => removeCustomFilter(filter.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Grid>
                      </Grid>
                    </Paper>
                  )) || null}
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Summary */}
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                خلاصه پیکربندی
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Chip
                  label={getCategoryDisplayName(hierarchicalConfig.rootCategory || '')}
                  color="primary"
                  size="small"
                />
                <Chip
                  label={`${hierarchicalConfig.maxDepth} سطح`}
                  color="secondary"
                  size="small"
                  variant="outlined"
                />
                {hierarchicalConfig.allowSearch && (
                  <Chip label="جستجو فعال" color="info" size="small" variant="outlined" />
                )}
                {hierarchicalConfig.selection?.allowMultiple && (
                  <Chip label="انتخاب چندگانه" color="warning" size="small" variant="outlined" />
                )}
                {(hierarchicalConfig.filtering?.customFilters?.length || 0) > 0 && (
                  <Chip 
                    label={`${hierarchicalConfig.filtering?.customFilters?.length} فیلتر سفارشی`} 
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
    </Box>
  );
};

export default HierarchicalFieldManager;