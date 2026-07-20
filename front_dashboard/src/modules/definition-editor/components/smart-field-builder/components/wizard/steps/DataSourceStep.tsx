import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Chip,
  Alert,
  alpha,
  useTheme
} from '@mui/material';
import {
  Category as CategoryIcon,
  List as ManualIcon,
  CloudDownload as ExternalIcon,
  Functions as ComputedIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

import { 
  SmartFieldConfig, 
  FieldContext,
  DataSourceType,
  DataSource
} from '../../../types/smartFieldTypes';

interface DataSourceStepProps {
  config: Partial<SmartFieldConfig>;
  onConfigUpdate: (updates: Partial<SmartFieldConfig>) => void;
  fieldContext: FieldContext;
  errors: Record<string, string>;
  editingField?: SmartFieldConfig | null;
}

const DataSourceStep: React.FC<DataSourceStepProps> = ({
  config,
  onConfigUpdate,
  fieldContext,
  errors,
  editingField
}) => {
  const theme = useTheme();
  const [manualItems, setManualItems] = useState<Array<{id: string; label: string}>>([]);
  const [newItemLabel, setNewItemLabel] = useState('');

  const needsDataSource = config.baseType === 'choice' || config.baseType === 'reference';

  // Initialize manual items from existing config
  useEffect(() => {
    if (config.dataSource?.type === 'manual' && config.dataSource.config.items) {
      setManualItems(config.dataSource.config.items);
    }
  }, [config.dataSource]);

  // Available data sources
  const dataSources = [
    {
      type: DataSourceType.CATEGORY,
      title: 'از دسته‌بندی‌های موجود',
      description: 'انتخاب از دسته‌بندی‌های تعریف شده در سیستم',
      icon: CategoryIcon,
      color: theme.palette.primary.main,
      suitable: ['choice', 'reference'],
      examples: ['استان و شهر', 'درجات نظامی', 'نوع تجهیزات']
    },
    {
      type: DataSourceType.MANUAL,
      title: 'لیست دستی',
      description: 'تعریف لیست گزینه‌ها به صورت دستی',
      icon: ManualIcon,
      color: theme.palette.secondary.main,
      suitable: ['choice'],
      examples: ['جنسیت', 'وضعیت تأهل', 'سطح تحصیلات']
    },
    {
      type: DataSourceType.EXTERNAL,
      title: 'منبع خارجی',
      description: 'دریافت داده از API یا سرویس خارجی',
      icon: ExternalIcon,
      color: theme.palette.warning.main,
      suitable: ['choice', 'reference'],
      examples: ['لیست کشورها', 'نرخ ارز', 'اطلاعات موقعیت جغرافیایی']
    },
    {
      type: DataSourceType.COMPUTED,
      title: 'محاسبه شده',
      description: 'مقادیر محاسبه شده بر اساس سایر فیلدها',
      icon: ComputedIcon,
      color: theme.palette.info.main,
      suitable: ['choice', 'reference'],
      examples: ['سن بر اساس تاریخ تولد', 'امتیاز کل', 'وضعیت بر اساس شرایط']
    }
  ];

  const suitableDataSources = dataSources.filter(ds => 
    ds.suitable.includes(config.baseType as string)
  );

  // Handle data source type change
  const handleDataSourceTypeChange = (type: DataSourceType) => {
    const newDataSource: DataSource = {
      type,
      config: {}
    };
    
    onConfigUpdate({ dataSource: newDataSource });
    
    // Reset manual items when changing away from manual
    if (type !== DataSourceType.MANUAL) {
      setManualItems([]);
      setNewItemLabel('');
    }
  };

  // Handle category selection
  const handleCategoryChange = (categoryId: string) => {
    const newDataSource: DataSource = {
      type: DataSourceType.CATEGORY,
      config: { categoryId }
    };
    onConfigUpdate({ dataSource: newDataSource });
  };

  // Add manual item
  const addManualItem = () => {
    if (!newItemLabel.trim()) return;
    
    const newItem = {
      id: `item_${Date.now()}`,
      label: newItemLabel.trim()
    };
    
    const updatedItems = [...manualItems, newItem];
    setManualItems(updatedItems);
    setNewItemLabel('');
    
    const newDataSource: DataSource = {
      type: DataSourceType.MANUAL,
      config: { items: updatedItems }
    };
    onConfigUpdate({ dataSource: newDataSource });
  };

  // Remove manual item
  const removeManualItem = (itemId: string) => {
    const updatedItems = manualItems.filter(item => item.id !== itemId);
    setManualItems(updatedItems);
    
    const newDataSource: DataSource = {
      type: DataSourceType.MANUAL,
      config: { items: updatedItems }
    };
    onConfigUpdate({ dataSource: newDataSource });
  };

  // Available categories (mock data)
  const availableCategories = [
    { id: 'geographical', name: 'جغرافیایی', description: 'استان، شهر، منطقه' },
    { id: 'military_ranks', name: 'درجات نظامی', description: 'رتبه‌های نظامی' },
    { id: 'equipment', name: 'تجهیزات', description: 'انواع تجهیزات نظامی' },
    { id: 'logistics', name: 'تدارکات', description: 'اقلام تداركاتی' }
  ];

  if (!needsDataSource) {
    return (
      <Box sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'auto',
        pr: 1,
        '&::-webkit-scrollbar': {
          width: '6px'
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'transparent'
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: alpha(theme.palette.grey[400], 0.5),
          borderRadius: '3px',
          '&:hover': {
            backgroundColor: alpha(theme.palette.grey[500], 0.7)
          }
        }
      }}>
        <Typography variant="h6" gutterBottom fontWeight={600}>
          منبع داده
        </Typography>
        <Alert severity="info">
          برای نوع فیلد انتخابی شما ({config.baseType}) نیازی به تعریف منبع داده نیست.
          می‌توانید به مرحله بعد بروید.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'auto',
      pr: 1,
      '&::-webkit-scrollbar': {
        width: '6px'
      },
      '&::-webkit-scrollbar-track': {
        backgroundColor: 'transparent'
      },
      '&::-webkit-scrollbar-thumb': {
        backgroundColor: alpha(theme.palette.grey[400], 0.5),
        borderRadius: '3px',
        '&:hover': {
          backgroundColor: alpha(theme.palette.grey[500], 0.7)
        }
      }
    }}>
      <Typography variant="h6" gutterBottom fontWeight={600}>
        منبع داده
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        منبع اطلاعات برای فیلد "{config.baseType}" را انتخاب کنید.
      </Typography>

      {errors.dataSource && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errors.dataSource}
        </Alert>
      )}

      {/* Data Source Type Selection */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {suitableDataSources.map((dataSource) => {
          const IconComponent = dataSource.icon;
          const isSelected = config.dataSource?.type === dataSource.type;
          
          return (
            <Grid item xs={12} sm={6} key={dataSource.type}>
              <Card
                sx={{
                  cursor: 'pointer',
                  border: isSelected 
                    ? `2px solid ${dataSource.color}` 
                    : `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                  backgroundColor: isSelected 
                    ? alpha(dataSource.color, 0.05) 
                    : 'background.paper',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: dataSource.color,
                    transform: 'translateY(-2px)'
                  }
                }}
                onClick={() => handleDataSourceTypeChange(dataSource.type)}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <IconComponent sx={{ color: dataSource.color, mr: 1 }} />
                    <Typography variant="h6" fontWeight={600}>
                      {dataSource.title}
                    </Typography>
                    {isSelected && (
                      <Box
                        sx={{
                          ml: 'auto',
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          backgroundColor: dataSource.color,
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px'
                        }}
                      >
                        ✓
                      </Box>
                    )}
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {dataSource.description}
                  </Typography>
                  
                  <Typography variant="caption" color={dataSource.color}>
                    مثال‌ها: {dataSource.examples.slice(0, 2).join('، ')}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Data Source Configuration */}
      {config.dataSource && (
        <Box>
          {config.dataSource.type === DataSourceType.CATEGORY && (
            <Box>
              <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                انتخاب دسته‌بندی
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>دسته‌بندی</InputLabel>
                <Select
                  value={config.dataSource.config.categoryId || ''}
                  label="دسته‌بندی"
                  onChange={(e) => handleCategoryChange(e.target.value)}
                >
                  {availableCategories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      <Box>
                        <Typography variant="body2">{category.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {category.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}

          {config.dataSource.type === DataSourceType.MANUAL && (
            <Box>
              <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                تعریف گزینه‌های دستی
              </Typography>
              
              {/* Add new item */}
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  label="گزینه جدید"
                  value={newItemLabel}
                  onChange={(e) => setNewItemLabel(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addManualItem()}
                  size="small"
                  sx={{ flex: 1 }}
                />
                <Button
                  variant="contained"
                  onClick={addManualItem}
                  disabled={!newItemLabel.trim()}
                  startIcon={<AddIcon />}
                >
                  افزودن
                </Button>
              </Box>
              
              {/* Items list */}
              {manualItems.length > 0 && (
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    گزینه‌های تعریف شده:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {manualItems.map((item) => (
                      <Chip
                        key={item.id}
                        label={item.label}
                        onDelete={() => removeManualItem(item.id)}
                        deleteIcon={<DeleteIcon />}
                        variant="outlined"
                        color="primary"
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}

          {config.dataSource.type === DataSourceType.EXTERNAL && (
            <Box>
              <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                تنظیمات منبع خارجی
              </Typography>
              <TextField
                label="آدرس API"
                value={config.dataSource.config.apiEndpoint || ''}
                onChange={(e) => {
                  const newDataSource = {
                    ...config.dataSource!,
                    config: { ...config.dataSource!.config, apiEndpoint: e.target.value }
                  };
                  onConfigUpdate({ dataSource: newDataSource });
                }}
                fullWidth
                placeholder="https://api.example.com/data"
                helperText="آدرس API برای دریافت داده‌ها"
              />
            </Box>
          )}

          {config.dataSource.type === DataSourceType.COMPUTED && (
            <Box>
              <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                تنظیمات محاسبه
              </Typography>
              <TextField
                label="فرمول محاسبه"
                value={config.dataSource.config.computation || ''}
                onChange={(e) => {
                  const newDataSource = {
                    ...config.dataSource!,
                    config: { ...config.dataSource!.config, computation: e.target.value }
                  };
                  onConfigUpdate({ dataSource: newDataSource });
                }}
                fullWidth
                multiline
                rows={3}
                placeholder="age = today.year - birthDate.year"
                helperText="فرمول یا منطق محاسبه مقدار"
              />
            </Box>
          )}
        </Box>
      )}

      {/* Context Help */}
      {fieldContext.categoryType && (
        <Box
          sx={{
            mt: 3,
            p: 2,
            backgroundColor: alpha(theme.palette.info.main, 0.1),
            borderRadius: 1,
            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
          }}
        >
          <Typography variant="body2" color="info.main">
            <strong>توصیه:</strong> برای دسته‌بندی "{fieldContext.categoryType}"، 
            استفاده از منبع "دسته‌بندی‌های موجود" توصیه می‌شود.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default DataSourceStep;