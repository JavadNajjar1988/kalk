import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Alert,
  Divider,
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
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  Phone as PhoneIcon,
  Star as StarIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Security as SecurityIcon,
  Add as AddIcon,
  Preview as PreviewIcon
} from '@mui/icons-material';
import { SmartFieldConfig, BaseFieldType, ValidationType, DataSourceType } from '../../types/smartFieldTypes';

// Template definitions with comprehensive field configurations
interface FieldTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ElementType;
  color: string;
  fields: SmartFieldConfig[];
  tags: string[];
  usageCount?: number;
  isMultiField?: boolean;
}

const FIELD_TEMPLATES: FieldTemplate[] = [
  // Personal Information Templates
  {
    id: 'personal_name',
    name: 'نام کامل',
    description: 'فیلد نام و نام خانوادگی با اعتبارسنجی',
    category: 'personal',
    icon: PersonIcon,
    color: '#2196F3',
    tags: ['نام', 'شخصی', 'کاربر'],
    usageCount: 156,
    fields: [{
      id: 'full_name',
      name: 'نام کامل',
      englishName: 'fullName',
      baseType: 'text' as BaseFieldType,
      enhancements: [],
      validation: [
        { 
          id: 'full_name_required', 
          type: ValidationType.REQUIRED, 
          enabled: true, 
          message: 'ورود نام الزامی است', 
          config: {} 
        },
        { 
          id: 'full_name_min_length', 
          type: ValidationType.MIN_LENGTH, 
          enabled: true, 
          message: 'حداقل 2 کاراکتر',
          config: { value: 2 }
        }
      ],
      isRequired: true,
      order: 1,
      placeholder: 'نام و نام خانوادگی خود را وارد کنید'
    }]
  },
  {
    id: 'national_id',
    name: 'کد ملی',
    description: 'شماره کد ملی با اعتبارسنجی الگوریتم',
    category: 'personal',
    icon: SecurityIcon,
    color: '#FF9800',
    tags: ['کد ملی', 'شناسایی', 'اعتبارسنجی'],
    usageCount: 89,
    fields: [{
      id: 'national_id',
      name: 'کد ملی',
      englishName: 'nationalId',
      baseType: 'text' as BaseFieldType,
      enhancements: [],
      validation: [
        { 
          id: 'national_id_required', 
          type: ValidationType.REQUIRED, 
          enabled: true, 
          message: 'ورود کد ملی الزامی است', 
          config: {} 
        },
        { 
          id: 'national_id_pattern', 
          type: ValidationType.PATTERN, 
          enabled: true, 
          message: 'کد ملی باید 10 رقم باشد',
          config: { pattern: '^[0-9]{10}$' }
        }
      ],
      isRequired: true,
      order: 1,
      placeholder: '0123456789'
    }]
  },
  // Address Templates
  {
    id: 'complete_address',
    name: 'آدرس کامل',
    description: 'آدرس کامل با استان، شهر و کد پستی',
    category: 'address',
    icon: HomeIcon,
    color: '#4CAF50',
    tags: ['آدرس', 'مکان', 'جغرافیایی'],
    usageCount: 134,
    isMultiField: true,
    fields: [
      {
        id: 'province',
        name: 'استان',
        englishName: 'province',
        baseType: 'choice' as BaseFieldType,
        enhancements: [],
        dataSource: {
          type: 'static',
          options: []
        },
        isRequired: true,
        order: 1
      },
      {
        id: 'city',
        name: 'شهر',
        englishName: 'city',
        baseType: 'choice' as BaseFieldType,
        enhancements: [],
        isRequired: true,
        order: 2
      },
      {
        id: 'address_detail',
        name: 'آدرس دقیق',
        englishName: 'addressDetail',
        baseType: 'text' as BaseFieldType,
        validation: [
          { type: 'required', message: 'ورود آدرس الزامی است' }
        ],
        isRequired: true,
        order: 3
      },
      {
        id: 'postal_code',
        name: 'کد پستی',
        englishName: 'postalCode',
        baseType: 'text' as BaseFieldType,
        validation: [
          { type: 'required', message: 'ورود کد پستی الزامی است' },
          { type: 'pattern', value: '^[0-9]{10}$', message: 'کد پستی باید 10 رقم باشد' }
        ],
        isRequired: true,
        order: 4
      }
    ]
  },
  // Contact Information
  {
    id: 'phone_mobile',
    name: 'شماره موبایل',
    description: 'شماره تلفن همراه با اعتبارسنجی',
    category: 'contact',
    icon: PhoneIcon,
    color: '#9C27B0',
    tags: ['تلفن', 'موبایل', 'تماس'],
    usageCount: 203,
    fields: [{
      id: 'mobile_phone',
      name: 'شماره موبایل',
      englishName: 'mobilePhone',
      baseType: 'text' as BaseFieldType,
      enhancements: [],
      validation: [
        { type: 'required', message: 'ورود شماره موبایل الزامی است' },
        { type: 'pattern', value: '^09[0-9]{9}$', message: 'فرمت شماره صحیح نیست' }
      ],
      isRequired: true,
      order: 1,
      placeholder: '09123456789'
    }]
  },
  // Military Rank Templates
  {
    id: 'military_rank',
    name: 'درجه نظامی',
    description: 'انتخاب درجه نظامی از فهرست تعریف شده',
    category: 'military',
    icon: StarIcon,
    color: '#795548',
    tags: ['نظامی', 'درجه', 'رتبه'],
    usageCount: 67,
    fields: [{
      id: 'military_rank',
      name: 'درجه نظامی',
      englishName: 'militaryRank',
      baseType: 'choice' as BaseFieldType,
      enhancements: [],
      dataSource: {
        type: 'static',
        options: []
      },
      isRequired: true,
      order: 1
    }]
  },
  // Business Templates
  {
    id: 'organization_info',
    name: 'اطلاعات سازمان',
    description: 'نام سازمان و کد اقتصادی',
    category: 'business',
    icon: BusinessIcon,
    color: '#607D8B',
    tags: ['سازمان', 'شرکت', 'کسب‌وکار'],
    usageCount: 45,
    isMultiField: true,
    fields: [
      {
        id: 'organization_name',
        name: 'نام سازمان',
        englishName: 'organizationName',
        baseType: 'text' as BaseFieldType,
        validation: [
          { type: 'required', message: 'ورود نام سازمان الزامی است' }
        ],
        isRequired: true,
        order: 1
      },
      {
        id: 'economic_code',
        name: 'کد اقتصادی',
        englishName: 'economicCode',
        baseType: 'text' as BaseFieldType,
        enhancements: [],
        validation: [
          { type: 'pattern', value: '^[0-9]{12}$', message: 'کد اقتصادی باید 12 رقم باشد' }
        ],
        isRequired: false,
        order: 2
      }
    ]
  },
  // Time Templates
  {
    id: 'date_range',
    name: 'بازه زمانی',
    description: 'تاریخ شروع و پایان',
    category: 'time',
    icon: ScheduleIcon,
    color: '#FF5722',
    tags: ['تاریخ', 'زمان', 'بازه'],
    usageCount: 78,
    isMultiField: true,
    fields: [
      {
        id: 'start_date',
        name: 'تاریخ شروع',
        englishName: 'startDate',
        baseType: 'text' as BaseFieldType,
        validation: [
          { type: 'required', message: 'ورود تاریخ شروع الزامی است' }
        ],
        isRequired: true,
        order: 1
      },
      {
        id: 'end_date',
        name: 'تاریخ پایان',
        englishName: 'endDate',
        baseType: 'text' as BaseFieldType,
        validation: [],
        isRequired: false,
        order: 2
      }
    ]
  }
];

const TEMPLATE_CATEGORIES = [
  { id: 'personal', name: 'اطلاعات شخصی', icon: PersonIcon, color: '#2196F3' },
  { id: 'address', name: 'آدرس و مکان', icon: LocationIcon, color: '#4CAF50' },
  { id: 'contact', name: 'اطلاعات تماس', icon: PhoneIcon, color: '#9C27B0' },
  { id: 'military', name: 'اطلاعات نظامی', icon: StarIcon, color: '#795548' },
  { id: 'business', name: 'اطلاعات کسب‌وکار', icon: BusinessIcon, color: '#607D8B' },
  { id: 'time', name: 'تاریخ و زمان', icon: ScheduleIcon, color: '#FF5722' }
];

interface TemplateSelectorProps {
  onTemplateSelect: (config: SmartFieldConfig | SmartFieldConfig[]) => void;
  existingFields?: SmartFieldConfig[];
  categoryContext?: string;
  editingField?: SmartFieldConfig | null;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  onTemplateSelect,
  existingFields = [],
  categoryContext,
  editingField
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['personal']);

  // Filter templates based on search and category
  const filteredTemplates = FIELD_TEMPLATES.filter(template => {
    const matchesSearch = searchQuery === '' || 
      template.name.includes(searchQuery) ||
      template.description.includes(searchQuery) ||
      template.tags.some(tag => tag.includes(searchQuery));
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Group templates by category
  const groupedTemplates = TEMPLATE_CATEGORIES.reduce((acc, category) => {
    acc[category.id] = filteredTemplates.filter(t => t.category === category.id);
    return acc;
  }, {} as Record<string, FieldTemplate[]>);

  const handleTemplateSelect = (template: FieldTemplate) => {
    if (template.isMultiField) {
      onTemplateSelect(template.fields);
    } else {
      onTemplateSelect(template.fields[0]);
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header فشرده */}
      <Box sx={{ p: { xs: 1.5, sm: 2 }, borderBottom: 1, borderColor: 'divider', flex: '0 0 auto' }}>
        <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }}>
          انتخاب قالب آماده
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
          قالب‌های آماده برای فیلدهای رایج سیستم
        </Typography>
      </Box>

      {/* Search and Filter فشرده */}
      <Box sx={{ p: { xs: 1.5, sm: 2 }, flex: '0 0 auto' }}>
        <TextField
          fullWidth
          size="small"
          placeholder="جستجو در قالب‌ها..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18 }} />
              </InputAdornment>
            )
          }}
          sx={{ mb: 1.5 }}
        />
        
        {/* Category Chips فشرده */}
        <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
          <Chip
            label="همه"
            size="small"
            variant={selectedCategory === 'all' ? 'filled' : 'outlined'}
            onClick={() => setSelectedCategory('all')}
            color="primary"
            sx={{ fontSize: '0.75rem' }}
          />
          {TEMPLATE_CATEGORIES.map(category => {
            const CategoryIcon = category.icon;
            return (
              <Chip
                key={category.id}
                icon={<CategoryIcon sx={{ fontSize: 16 }} />}
                label={category.name}
                size="small"
                variant={selectedCategory === category.id ? 'filled' : 'outlined'}
                onClick={() => setSelectedCategory(category.id)}
                sx={{ 
                  backgroundColor: selectedCategory === category.id ? category.color : undefined,
                  color: selectedCategory === category.id ? 'white' : undefined,
                  fontSize: '0.75rem'
                }}
              />
            );
          })}
        </Box>
      </Box>
      
      {/* Content Area استفاده کامل از فضا */}
      <Box sx={{ flex: '1 1 auto', overflow: 'auto', px: { xs: 1.5, sm: 2 }, pb: 2 }}>
        {filteredTemplates.length === 0 ? (
        <Alert severity="info">
          قالبی با معیارهای جستجو پیدا نشد. لطفاً کلمات کلیدی دیگری امتحان کنید.
        </Alert>
      ) : (
        <Box>
          {TEMPLATE_CATEGORIES.map(category => {
            const templates = groupedTemplates[category.id];
            if (templates.length === 0) return null;
            
            const CategoryIcon = category.icon;
            
            return (
              <Accordion
                key={category.id}
                expanded={expandedCategories.includes(category.id)}
                onChange={() => handleCategoryToggle(category.id)}
                sx={{ mb: 1 }}
              >
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon />}
                  sx={{ 
                    '& .MuiAccordionSummary-content': {
                      my: 1
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CategoryIcon sx={{ color: category.color, fontSize: 20 }} />
                    <Typography variant="subtitle1" fontWeight={600} sx={{ fontSize: '0.95rem' }}>
                      {category.name}
                    </Typography>
                    <Chip 
                      label={templates.length} 
                      size="small" 
                      sx={{ backgroundColor: alpha(category.color, 0.1), fontSize: '0.7rem', height: 20 }}
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 1 }}>
                  <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                    {templates.map(template => {
                      const TemplateIcon = template.icon;
                      return (
                        <Grid item xs={12} sm={6} md={4} key={template.id}>
                          <Card 
                            sx={{ 
                              height: '100%',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: 2
                              }
                            }}
                            onClick={() => handleTemplateSelect(template)}
                          >
                            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, pb: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <TemplateIcon sx={{ color: template.color, fontSize: 18 }} />
                                <Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: '0.9rem' }}>
                                  {template.name}
                                </Typography>
                                {template.isMultiField && (
                                  <Chip label="چندتایی" size="small" color="secondary" sx={{ fontSize: '0.65rem', height: 18 }} />
                                )}
                              </Box>
                              
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.8rem', lineHeight: 1.3 }}>
                                {template.description}
                              </Typography>
                              
                              <Box sx={{ display: 'flex', gap: 0.4, flexWrap: 'wrap', mb: 1 }}>
                                {template.tags.slice(0, 2).map(tag => (
                                  <Chip 
                                    key={tag} 
                                    label={tag} 
                                    size="small" 
                                    variant="outlined"
                                    sx={{ fontSize: '0.65rem', height: 18 }}
                                  />
                                ))}
                              </Box>
                              
                              {template.usageCount && (
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                  استفاده شده: {template.usageCount} بار
                                </Typography>
                              )}
                            </CardContent>
                            
                            <CardActions sx={{ pt: 0, px: { xs: 1.5, sm: 2 }, pb: { xs: 1.5, sm: 2 }, justifyContent: 'space-between' }}>
                              <Button 
                                size="small" 
                                startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTemplateSelect(template);
                                }}
                                sx={{ fontSize: '0.75rem' }}
                              >
                                انتخاب
                              </Button>
                              <IconButton size="small" color="primary" sx={{ p: 0.5 }}>
                                <PreviewIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </CardActions>
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>
      )}
      </Box>
    </Box>
  );
};

export default TemplateSelector;