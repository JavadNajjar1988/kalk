import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Grid,
  Card,
  CardContent,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  DataObject as DataIcon,
  Category as CategoryIcon,
  Language as ApiIcon,
  Storage as StaticIcon,
  Functions as ComputedIcon
} from '@mui/icons-material';

// Types
import type {
  DataSourceComponent,
  DataSourceType
} from '../../types/fieldConstructor';
import { CategoryType } from '../../types';

interface DataSourceManagerProps {
  currentDataSource?: DataSourceComponent;
  onDataSourceChange: (dataSource: DataSourceComponent) => void;
  allowedTypes?: DataSourceType[];
}

const DataSourceManager: React.FC<DataSourceManagerProps> = ({
  currentDataSource,
  onDataSourceChange,
  allowedTypes = ['static', 'category', 'geographical', 'api', 'computed']
}) => {
  const [dataSource, setDataSource] = useState<DataSourceComponent>(
    currentDataSource || {
      type: 'static',
      configuration: {}
    }
  );

  const [staticOptions, setStaticOptions] = useState<Array<{
    value: string;
    label: string;
    description?: string;
  }>>([]);

  // Data source type options
  const dataSourceTypes = [
    {
      value: 'static' as DataSourceType,
      label: 'گزینه‌های ثابت',
      description: 'لیست ثابت از گزینه‌ها',
      icon: <StaticIcon />,
      color: '#2196F3'
    },
    {
      value: 'category' as DataSourceType,
      label: 'از دسته‌بندی',
      description: 'داده‌ها از دسته‌بندی‌های تعریف شده',
      icon: <CategoryIcon />,
      color: '#FF9800'
    },
    {
      value: 'geographical' as DataSourceType,
      label: 'جغرافیایی',
      description: 'داده‌های جغرافیایی سلسله‌مراتبی',
      icon: <DataIcon />,
      color: '#4CAF50'
    },
    {
      value: 'api' as DataSourceType,
      label: 'API خارجی',
      description: 'دریافت از سرویس خارجی',
      icon: <ApiIcon />,
      color: '#E91E63'
    },
    {
      value: 'computed' as DataSourceType,
      label: 'محاسبه شده',
      description: 'بر اساس فیلدهای دیگر محاسبه می‌شود',
      icon: <ComputedIcon />,
      color: '#9C27B0'
    }
  ].filter(type => allowedTypes.includes(type.value));

  // Update data source configuration
  const updateDataSource = useCallback((updates: Partial<DataSourceComponent>) => {
    const newDataSource = {
      ...dataSource,
      ...updates,
      configuration: {
        ...dataSource.configuration,
        ...updates.configuration
      }
    };
    setDataSource(newDataSource);
    onDataSourceChange(newDataSource);
  }, [dataSource, onDataSourceChange]);

  // Add static option
  const addStaticOption = () => {
    const newOption = {
      value: `option_${Date.now()}`,
      label: 'گزینه جدید',
      description: ''
    };
    const newOptions = [...staticOptions, newOption];
    setStaticOptions(newOptions);
    updateDataSource({
      configuration: {
        ...dataSource.configuration,
        staticOptions: newOptions
      }
    });
  };

  // Remove static option
  const removeStaticOption = (index: number) => {
    const newOptions = staticOptions.filter((_, i) => i !== index);
    setStaticOptions(newOptions);
    updateDataSource({
      configuration: {
        ...dataSource.configuration,
        staticOptions: newOptions
      }
    });
  };

  // Update static option
  const updateStaticOption = (index: number, updates: Partial<typeof staticOptions[0]>) => {
    const newOptions = staticOptions.map((option, i) => 
      i === index ? { ...option, ...updates } : option
    );
    setStaticOptions(newOptions);
    updateDataSource({
      configuration: {
        ...dataSource.configuration,
        staticOptions: newOptions
      }
    });
  };

  // Initialize static options from current data source
  useEffect(() => {
    if (dataSource.configuration.staticOptions) {
      setStaticOptions(dataSource.configuration.staticOptions);
    }
  }, [dataSource.configuration.staticOptions]);

  // Render configuration based on data source type
  const renderConfiguration = () => {
    switch (dataSource.type) {
      case 'static':
        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2">
                گزینه‌های ثابت ({staticOptions.length})
              </Typography>
              <Button startIcon={<AddIcon />} onClick={addStaticOption} size="small">
                افزودن گزینه
              </Button>
            </Box>
            
            <List>
              {staticOptions.map((option, index) => (
                <ListItem key={index}>
                  <Grid container spacing={1} alignItems="center">
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="مقدار"
                        value={option.value}
                        onChange={(e) => updateStaticOption(index, { value: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="نمایش"
                        value={option.label}
                        onChange={(e) => updateStaticOption(index, { label: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <TextField
                        fullWidth
                        size="small"
                        label="توضیح"
                        value={option.description || ''}
                        onChange={(e) => updateStaticOption(index, { description: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={1}>
                      <IconButton
                        onClick={() => removeStaticOption(index)}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </ListItem>
              ))}
            </List>
            
            {staticOptions.length === 0 && (
              <Alert severity="info">
                هیچ گزینه‌ای تعریف نشده است. برای شروع یک گزینه اضافه کنید.
              </Alert>
            )}
          </Box>
        );

      case 'category':
        return (
          <Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>نوع دسته‌بندی</InputLabel>
                  <Select
                    value={dataSource.configuration.categoryType || ''}
                    onChange={(e) => updateDataSource({
                      configuration: {
                        ...dataSource.configuration,
                        categoryType: e.target.value
                      }
                    })}
                  >
                    <MenuItem value="military_ranks">درجات نظامی</MenuItem>
                    <MenuItem value="equipment">تجهیزات</MenuItem>
                    <MenuItem value="persons">اشخاص</MenuItem>
                    <MenuItem value="mission_type">نوع مأموریت</MenuItem>
                    <MenuItem value="operational_status">وضعیت عملیاتی</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>بخش‌ها</InputLabel>
                  <Select
                    value={dataSource.configuration.sections || 'both'}
                    onChange={(e) => updateDataSource({
                      configuration: {
                        ...dataSource.configuration,
                        sections: e.target.value
                      }
                    })}
                  >
                    <MenuItem value="hierarchy">فقط سلسله‌مراتب</MenuItem>
                    <MenuItem value="data">فقط داده‌ها</MenuItem>
                    <MenuItem value="both">هر دو</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={dataSource.configuration.searchable || false}
                      onChange={(e) => updateDataSource({
                        configuration: {
                          ...dataSource.configuration,
                          searchable: e.target.checked
                        }
                      })}
                    />
                  }
                  label="قابلیت جستجو"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={dataSource.configuration.filterable || false}
                      onChange={(e) => updateDataSource({
                        configuration: {
                          ...dataSource.configuration,
                          filterable: e.target.checked
                        }
                      })}
                    />
                  }
                  label="قابلیت فیلتر"
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 'geographical':
        return (
          <Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="حداکثر سطح"
                  type="number"
                  value={dataSource.configuration.maxLevel || 9}
                  onChange={(e) => updateDataSource({
                    configuration: {
                      ...dataSource.configuration,
                      maxLevel: parseInt(e.target.value) || 9
                    }
                  })}
                  inputProps={{ min: 1, max: 9 }}
                  helperText="حداکثر سطح سلسله‌مراتب جغرافیایی"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="دسته‌بندی ریشه"
                  value={dataSource.configuration.rootCategory || 'geographical'}
                  onChange={(e) => updateDataSource({
                    configuration: {
                      ...dataSource.configuration,
                      rootCategory: e.target.value
                    }
                  })}
                  helperText="شناسه دسته‌بندی ریشه"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={dataSource.configuration.allowFreeText || false}
                      onChange={(e) => updateDataSource({
                        configuration: {
                          ...dataSource.configuration,
                          allowFreeText: e.target.checked
                        }
                      })}
                    />
                  }
                  label="اجازه ورود آدرس دستی"
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 'api':
        return (
          <Box>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="API Endpoint"
                  value={dataSource.configuration.apiEndpoint || ''}
                  onChange={(e) => updateDataSource({
                    configuration: {
                      ...dataSource.configuration,
                      apiEndpoint: e.target.value
                    }
                  })}
                  helperText="آدرس کامل API endpoint"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>روش درخواست</InputLabel>
                  <Select
                    value={dataSource.configuration.apiMethod || 'GET'}
                    onChange={(e) => updateDataSource({
                      configuration: {
                        ...dataSource.configuration,
                        apiMethod: e.target.value as 'GET' | 'POST'
                      }
                    })}
                  >
                    <MenuItem value="GET">GET</MenuItem>
                    <MenuItem value="POST">POST</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="مدت cache (دقیقه)"
                  type="number"
                  value={dataSource.configuration.cacheDuration || 60}
                  onChange={(e) => updateDataSource({
                    configuration: {
                      ...dataSource.configuration,
                      cacheDuration: parseInt(e.target.value) || 60
                    }
                  })}
                  inputProps={{ min: 0, max: 1440 }}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 'computed':
        return (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              فیلدهای محاسبه شده بر اساس مقادیر فیلدهای دیگر محاسبه می‌شوند
            </Alert>
            
            <TextField
              fullWidth
              label="فرمول محاسبه"
              multiline
              rows={3}
              value={dataSource.configuration.computeFormula || ''}
              onChange={(e) => updateDataSource({
                configuration: {
                  ...dataSource.configuration,
                  computeFormula: e.target.value
                }
              })}
              helperText="مثال: ${field1} + ${field2} یا نام + ' ' + نام_خانوادگی"
            />
          </Box>
        );

      default:
        return (
          <Alert severity="warning">
            نوع منبع داده انتخاب شده پشتیبانی نمی‌شود
          </Alert>
        );
    }
  };

  return (
    <Box>
      {/* Data Source Type Selection */}
      <Typography variant="h6" gutterBottom>
        منبع داده
      </Typography>
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {dataSourceTypes.map((type) => (
          <Grid item xs={12} sm={6} md={4} key={type.value}>
            <Card
              sx={{
                cursor: 'pointer',
                border: dataSource.type === type.value ? 2 : 1,
                borderColor: dataSource.type === type.value ? 'primary.main' : 'divider',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'action.hover'
                }
              }}
              onClick={() => updateDataSource({ type: type.value })}
            >
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Box sx={{ color: type.color, mb: 1 }}>
                  {type.icon}
                </Box>
                <Typography variant="subtitle2" gutterBottom>
                  {type.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {type.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 2 }} />

      {/* Configuration Section */}
      <Typography variant="subtitle1" gutterBottom>
        تنظیمات منبع داده
      </Typography>
      
      {renderConfiguration()}

      {/* Common Configuration Options */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          تنظیمات عمومی
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={dataSource.configuration.searchable || false}
                  onChange={(e) => updateDataSource({
                    configuration: {
                      ...dataSource.configuration,
                      searchable: e.target.checked
                    }
                  })}
                />
              }
              label="قابلیت جستجو"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={dataSource.configuration.filterable || false}
                  onChange={(e) => updateDataSource({
                    configuration: {
                      ...dataSource.configuration,
                      filterable: e.target.checked
                    }
                  })}
                />
              }
              label="قابلیت فیلتر"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={dataSource.configuration.refreshOnMount || false}
                  onChange={(e) => updateDataSource({
                    configuration: {
                      ...dataSource.configuration,
                      refreshOnMount: e.target.checked
                    }
                  })}
                />
              }
              label="بارگذاری مجدد در هر نمایش"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="مدت cache (دقیقه)"
              type="number"
              value={dataSource.configuration.cacheDuration || 60}
              onChange={(e) => updateDataSource({
                configuration: {
                  ...dataSource.configuration,
                  cacheDuration: parseInt(e.target.value) || 60
                }
              })}
              inputProps={{ min: 0, max: 1440 }}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Preview Section */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          پیش‌نمایش تنظیمات
        </Typography>
        
        <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'grey.50' }}>
          <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(dataSource, null, 2)}
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default DataSourceManager;