import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
  alpha,
  useTheme
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
  Preview as PreviewIcon,
  Assignment as MilitaryIcon,
  Storage as EquipmentIcon,
  Analytics as AnalyticsIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import { SmartFieldConfig, BaseFieldType, EnhancementType, DataSourceType, ValidationRule, ValidationType, FieldEnhancement, DataSource } from './types/smartFieldTypes';
import { VirtualTemplateList } from './components/performance/VirtualList';
import { useDebouncedState, useMemoizedSearch, usePerformanceProfiler } from './hooks/usePerformanceOptimization';

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
      baseType: BaseFieldType.TEXT,
      enhancements: [
        {
          type: EnhancementType.FORMATTED,
          config: { pattern: 'name' },
          enabled: true
        }
      ],
      validation: [
        {
          id: 'full_name_required',
          type: ValidationType.REQUIRED,
          config: { value: true },
          message: 'نام کامل الزامی است',
          enabled: true
        },
        {
          id: 'full_name_min_length',
          type: ValidationType.MIN_LENGTH,
          config: { min: 2 },
          message: 'نام باید حداقل 2 کاراکتر باشد',
          enabled: true
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
    description: 'شماره کد ملی با اعتبارسنجی',
    category: 'personal',
    icon: SecurityIcon,
    color: '#FF9800',
    tags: ['کد ملی', 'شناسایی', 'اعتبارسنجی'],
    usageCount: 89,
    fields: [{
      id: 'national_id',
      name: 'کد ملی',
      englishName: 'nationalId',
      baseType: BaseFieldType.TEXT,
      enhancements: [
        {
          type: EnhancementType.FORMATTED,
          config: { mask: '####-####-##' },
          enabled: true
        }
      ],
      validation: [
        {
          id: 'national_id_required',
          type: ValidationType.REQUIRED,
          config: { value: true },
          message: 'کد ملی الزامی است',
          enabled: true
        },
        {
          id: 'national_id_pattern',
          type: ValidationType.PATTERN,
          config: { pattern: '^[0-9]{10}$' },
          message: 'کد ملی باید 10 رقم باشد',
          enabled: true
        }
      ],
      isRequired: true,
      order: 1,
      placeholder: '0123456789'
    }]
  },
  
  // Contact Information Templates
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
      baseType: BaseFieldType.TEXT,
      enhancements: [
        {
          type: EnhancementType.FORMATTED,
          config: { mask: '####-###-####' },
          enabled: true
        }
      ],
      validation: [
        {
          id: 'mobile_required',
          type: ValidationType.REQUIRED,
          config: { value: true },
          message: 'شماره موبایل الزامی است',
          enabled: true
        },
        {
          id: 'mobile_pattern',
          type: ValidationType.PATTERN,
          config: { pattern: '^09[0-9]{9}$' },
          message: 'شماره موبایل باید با 09 شروع شود',
          enabled: true
        }
      ],
      isRequired: true,
      order: 1,
      placeholder: '09123456789'
    }]
  },
  {
    id: 'email_address',
    name: 'آدرس ایمیل',
    description: 'آدرس ایمیل با اعتبارسنجی',
    category: 'contact',
    icon: BusinessIcon,
    color: '#4CAF50',
    tags: ['ایمیل', 'تماس', 'الکترونیکی'],
    usageCount: 134,
    fields: [{
      id: 'email',
      name: 'آدرس ایمیل',
      englishName: 'email',
      baseType: BaseFieldType.TEXT,
      enhancements: [],
      validation: [
        {
          id: 'email_validation',
          type: ValidationType.EMAIL,
          config: { value: true },
          message: 'فرمت ایمیل صحیح نیست',
          enabled: true
        }
      ],
      isRequired: false,
      order: 1,
      placeholder: 'example@domain.com'
    }]
  },
  
  // Military Templates
  {
    id: 'military_rank',
    name: 'رتبه نظامی',
    description: 'انتخاب رتبه نظامی از فهرست استاندارد',
    category: 'military',
    icon: MilitaryIcon,
    color: '#795548',
    tags: ['رتبه', 'نظامی', 'سلسله‌مراتب'],
    usageCount: 67,
    fields: [{
      id: 'military_rank',
      name: 'رتبه نظامی',
      englishName: 'militaryRank',
      baseType: BaseFieldType.CHOICE,
      enhancements: [
        {
          type: EnhancementType.HIERARCHICAL,
          config: {},
          enabled: true
        }
      ],
      dataSource: {
        type: DataSourceType.MANUAL,
        config: {
          items: [
            { id: 'private', label: 'سرباز' },
            { id: 'corporal', label: 'سرجوخه' },
            { id: 'sergeant', label: 'گروهبان' },
            { id: 'lieutenant', label: 'ستوان' },
            { id: 'captain', label: 'سروان' },
            { id: 'major', label: 'سرگرد' },
            { id: 'colonel', label: 'سرهنگ' }
          ]
        }
      },
      validation: [],
      isRequired: true,
      order: 1
    }]
  },
  {
    id: 'unit_designation',
    name: 'نام یگان',
    description: 'نام و کد یگان نظامی',
    category: 'military',
    icon: GroupIcon,
    color: '#607D8B',
    tags: ['یگان', 'واحد', 'نظامی'],
    usageCount: 45,
    fields: [{
      id: 'unit_name',
      name: 'نام یگان',
      englishName: 'unitName',
      baseType: BaseFieldType.TEXT,
      enhancements: [
        {
          type: EnhancementType.FORMATTED,
          config: { pattern: 'military_unit' },
          enabled: true
        }
      ],
      validation: [
        {
          id: 'unit_name_required',
          type: ValidationType.REQUIRED,
          config: { value: true },
          message: 'نام یگان الزامی است',
          enabled: true
        }
      ],
      isRequired: true,
      order: 1,
      placeholder: 'مثال: تیپ 65 نیروی ویژه'
    }]
  },
  
  // Equipment Templates
  {
    id: 'equipment_serial',
    name: 'شماره سریال تجهیزات',
    description: 'شماره سریال و شناسه تجهیزات',
    category: 'equipment',
    icon: EquipmentIcon,
    color: '#FF5722',
    tags: ['تجهیزات', 'سریال', 'شناسه'],
    usageCount: 78,
    fields: [{
      id: 'equipment_serial',
      name: 'شماره سریال',
      englishName: 'equipmentSerial',
      baseType: BaseFieldType.TEXT,
      enhancements: [
        {
          type: EnhancementType.FORMATTED,
          config: { mask: '####-####-####' },
          enabled: true
        }
      ],
      validation: [
        {
          id: 'equipment_serial_pattern',
          type: ValidationType.PATTERN,
          config: { pattern: '^[A-Z0-9\\-]+$' },
          message: 'شماره سریال فقط شامل حروف انگلیسی، اعداد و خط تیره',
          enabled: true
        }
      ],
      isRequired: true,
      order: 1,
      placeholder: 'EQ01-2024-0001'
    }]
  },
  {
    id: 'equipment_quantity',
    name: 'تعداد تجهیزات',
    description: 'تعداد و واحد اندازه‌گیری تجهیزات',
    category: 'equipment',
    icon: AnalyticsIcon,
    color: '#3F51B5',
    tags: ['تعداد', 'واحد', 'اندازه‌گیری'],
    usageCount: 92,
    fields: [{
      id: 'equipment_quantity',
      name: 'تعداد',
      englishName: 'equipmentQuantity',
      baseType: BaseFieldType.NUMBER,
      enhancements: [
        {
          type: EnhancementType.UNIT,
          config: { unit: 'عدد' },
          enabled: true
        },
        {
          type: EnhancementType.RANGE,
          config: { min: 1, max: 10000 },
          enabled: true
        }
      ],
      validation: [
        {
          id: 'equipment_quantity_range',
          type: ValidationType.RANGE,
          config: { min: 1 },
          message: 'تعداد باید حداقل 1 باشد',
          enabled: true
        }
      ],
      isRequired: true,
      order: 1,
      placeholder: '1'
    }]
  },
  
  // Geographic Templates
  {
    id: 'iran_province_city',
    name: 'استان و شهر ایران',
    description: 'انتخاب استان و شهر از فهرست ایران',
    category: 'geographic',
    icon: LocationIcon,
    color: '#009688',
    tags: ['استان', 'شهر', 'جغرافیا', 'ایران'],
    usageCount: 201,
    isMultiField: true,
    fields: [
      {
        id: 'province',
        name: 'استان',
        englishName: 'province',
        baseType: BaseFieldType.CHOICE,
        enhancements: [
          {
            type: EnhancementType.SEARCHABLE,
            config: {},
            enabled: true
          }
        ],
        dataSource: {
          type: DataSourceType.EXTERNAL,
          config: {
            apiEndpoint: '/api/geographic/provinces'
          }
        },
        validation: [],
        isRequired: true,
        order: 1
      },
      {
        id: 'city',
        name: 'شهر',
        englishName: 'city',
        baseType: BaseFieldType.CHOICE,
        enhancements: [
          {
            type: EnhancementType.SEARCHABLE,
            config: {},
            enabled: true
          }
        ],
        dataSource: {
          type: DataSourceType.EXTERNAL,
          config: {
            apiEndpoint: '/api/geographic/cities'
          }
        },
        validation: [],
        isRequired: true,
        order: 2
      }
    ]
  },
  {
    id: 'coordinates',
    name: 'مختصات جغرافیایی',
    description: 'مختصات طول و عرض جغرافیایی',
    category: 'geographic',
    icon: LocationIcon,
    color: '#00BCD4',
    tags: ['مختصات', 'GPS', 'موقعیت'],
    usageCount: 34,
    isMultiField: true,
    fields: [
      {
        id: 'latitude',
        name: 'عرض جغرافیایی',
        englishName: 'latitude',
        baseType: BaseFieldType.NUMBER,
        enhancements: [
          {
            type: EnhancementType.DECIMAL,
            config: { precision: 6 },
            enabled: true
          },
          {
            type: EnhancementType.RANGE,
            config: { min: -90, max: 90 },
            enabled: true
          }
        ],
        validation: [
          {
            id: 'latitude_required',
            type: ValidationType.REQUIRED,
            config: { value: true },
            message: 'عرض جغرافیایی الزامی است',
            enabled: true
          }
        ],
        isRequired: true,
        order: 1,
        placeholder: '35.6892'
      },
      {
        id: 'longitude',
        name: 'طول جغرافیایی',
        englishName: 'longitude',
        baseType: BaseFieldType.NUMBER,
        enhancements: [
          {
            type: EnhancementType.DECIMAL,
            config: { precision: 6 },
            enabled: true
          },
          {
            type: EnhancementType.RANGE,
            config: { min: -180, max: 180 },
            enabled: true
          }
        ],
        validation: [
          {
            id: 'longitude_required',
            type: ValidationType.REQUIRED,
            config: { value: true },
            message: 'طول جغرافیایی الزامی است',
            enabled: true
          }
        ],
        isRequired: true,
        order: 2,
        placeholder: '51.3890'
      }
    ]
  },
  
  // Basic Field Templates
  {
    id: 'simple_text',
    name: 'متن ساده',
    description: 'فیلد متنی ساده',
    category: 'basic',
    icon: PersonIcon,
    color: '#4CAF50',
    tags: ['متن', 'ساده'],
    usageCount: 45,
    fields: [{
      id: 'simple_text_field',
      name: 'متن ساده',
      englishName: 'simpleText',
      baseType: BaseFieldType.TEXT,
      enhancements: [],
      validation: [],
      isRequired: false,
      order: 1,
      placeholder: 'متن مورد نظر را وارد کنید'
    }]
  },
  {
    id: 'long_text',
    name: 'متن بلند',
    description: 'فیلد متن چندخطی برای توضیحات',
    category: 'basic',
    icon: BusinessIcon,
    color: '#2196F3',
    tags: ['متن', 'چندخطی', 'توضیحات'],
    usageCount: 67,
    fields: [{
      id: 'long_text_field',
      name: 'متن بلند',
      englishName: 'longText',
      baseType: BaseFieldType.TEXT,
      enhancements: [
        {
          type: EnhancementType.MULTILINE,
          config: { rows: 4 },
          enabled: true
        }
      ],
      validation: [],
      isRequired: false,
      order: 1,
      placeholder: 'توضیحات تفصیلی را وارد کنید...'
    }]
  },
  {
    id: 'simple_number',
    name: 'عدد ساده',
    description: 'فیلد عددی ساده',
    category: 'basic',
    icon: AnalyticsIcon,
    color: '#FF9800',
    tags: ['عدد', 'ساده'],
    usageCount: 89,
    fields: [{
      id: 'simple_number_field',
      name: 'عدد ساده',
      englishName: 'simpleNumber',
      baseType: BaseFieldType.NUMBER,
      enhancements: [],
      validation: [],
      isRequired: false,
      order: 1,
      placeholder: '0'
    }]
  },
  
  // Time Templates
  {
    id: 'date_time',
    name: 'تاریخ و زمان',
    description: 'انتخاب تاریخ و زمان',
    category: 'datetime',
    icon: ScheduleIcon,
    color: '#E91E63',
    tags: ['تاریخ', 'زمان', 'زمان‌بندی'],
    usageCount: 123,
    fields: [{
      id: 'datetime_field',
      name: 'تاریخ و زمان',
      englishName: 'datetime',
      baseType: BaseFieldType.TEXT, // Will be enhanced for datetime
      enhancements: [
        {
          type: EnhancementType.FORMATTED,
          config: { pattern: 'datetime' },
          enabled: true
        }
      ],
      validation: [
        {
          id: 'datetime_required',
          type: ValidationType.REQUIRED,
          config: { value: true },
          message: 'تاریخ و زمان الزامی است',
          enabled: true
        }
      ],
      isRequired: true,
      order: 1,
      placeholder: '1403/01/01 - 12:00'
    }]
  },
  
  // Business Templates
  {
    id: 'company_info',
    name: 'اطلاعات شرکت',
    description: 'نام شرکت، کد اقتصادی و نوع فعالیت',
    category: 'business',
    icon: BusinessIcon,
    color: '#FF9800',
    tags: ['شرکت', 'کسب‌وکار', 'اقتصادی'],
    usageCount: 89,
    isMultiField: true,
    fields: [
      {
        id: 'company_name',
        name: 'نام شرکت',
        englishName: 'companyName',
        baseType: BaseFieldType.TEXT,
        enhancements: [],
        validation: [
          {
            id: 'company_name_required',
            type: ValidationType.REQUIRED,
            config: { value: true },
            message: 'نام شرکت الزامی است',
            enabled: true
          }
        ],
        isRequired: true,
        order: 1
      },
      {
        id: 'economic_code',
        name: 'کد اقتصادی',
        englishName: 'economicCode',
        baseType: BaseFieldType.TEXT,
        enhancements: [],
        validation: [
          {
            id: 'economic_code_pattern',
            type: ValidationType.PATTERN,
            config: { pattern: '^[0-9]{12}$' },
            message: 'کد اقتصادی باید 12 رقم باشد',
            enabled: true
          }
        ],
        isRequired: true,
        order: 2
      }
    ]
  },
  
  // Medical Templates
  {
    id: 'medical_record',
    name: 'پرونده پزشکی',
    description: 'شماره پرونده و اطلاعات پزشکی',
    category: 'medical',
    icon: SecurityIcon,
    color: '#4CAF50',
    tags: ['پزشکی', 'بهداشت', 'درمان'],
    usageCount: 45,
    fields: [{
      id: 'medical_record_number',
      name: 'شماره پرونده پزشکی',
      englishName: 'medicalRecordNumber',
      baseType: BaseFieldType.TEXT,
      enhancements: [],
      validation: [
        {
          id: 'medical_record_pattern',
          type: ValidationType.PATTERN,
          config: { pattern: '^MR[0-9]{8}$' },
          message: 'شماره پرونده باید با MR شروع شود و 8 رقم داشته باشد',
          enabled: true
        }
      ],
      isRequired: true,
      order: 1,
      placeholder: 'MR12345678'
    }]
  },
  
  // Educational Templates
  {
    id: 'student_info',
    name: 'اطلاعات دانشجویی',
    description: 'شماره دانشجویی و مقطع تحصیلی',
    category: 'educational',
    icon: AnalyticsIcon,
    color: '#9C27B0',
    tags: ['دانشجو', 'تحصیل', 'آموزش'],
    usageCount: 78,
    isMultiField: true,
    fields: [
      {
        id: 'student_id',
        name: 'شماره دانشجویی',
        englishName: 'studentId',
        baseType: BaseFieldType.TEXT,
        enhancements: [],
        validation: [
          {
            id: 'student_id_pattern',
            type: ValidationType.PATTERN,
            config: { pattern: '^[0-9]{9}$' },
            message: 'شماره دانشجویی باید 9 رقم باشد',
            enabled: true
          }
        ],
        isRequired: true,
        order: 1
      },
      {
        id: 'education_level',
        name: 'مقطع تحصیلی',
        englishName: 'educationLevel',
        baseType: BaseFieldType.CHOICE,
        enhancements: [],
        validation: [],
        dataSource: {
          type: DataSourceType.MANUAL,
          config: {
            items: [
              { id: 'bachelor', label: 'کارشناسی' },
              { id: 'master', label: 'کارشناسی ارشد' },
              { id: 'phd', label: 'دکتری' }
            ]
          }
        },
        isRequired: true,
        order: 2
      }
    ]
  },
  
  // Technical Templates
  {
    id: 'technical_specs',
    name: 'مشخصات فنی',
    description: 'ورژن نرم‌افزار و مشخصات سیستم',
    category: 'technical',
    icon: EquipmentIcon,
    color: '#607D8B',
    tags: ['فنی', 'نرم‌افزار', 'سیستم'],
    usageCount: 34,
    fields: [{
      id: 'software_version',
      name: 'ورژن نرم‌افزار',
      englishName: 'softwareVersion',
      baseType: BaseFieldType.TEXT,
      enhancements: [],
      validation: [
        {
          id: 'version_pattern',
          type: ValidationType.PATTERN,
          config: { pattern: '^[0-9]+\\.[0-9]+\\.[0-9]+$' },
          message: 'فرمت ورژن باید x.y.z باشد',
          enabled: true
        }
      ],
      isRequired: false,
      order: 1,
      placeholder: '1.0.0'
    }]
  }
];

const TEMPLATE_CATEGORIES = [
  { id: 'personal', name: 'اطلاعات شخصی', icon: PersonIcon, color: '#2196F3' },
  { id: 'contact', name: 'اطلاعات تماس', icon: PhoneIcon, color: '#9C27B0' },
  { id: 'business', name: 'کسب‌وکار', icon: BusinessIcon, color: '#FF9800' },
  { id: 'medical', name: 'پزشکی', icon: SecurityIcon, color: '#4CAF50' },
  { id: 'educational', name: 'آموزشی', icon: AnalyticsIcon, color: '#9C27B0' },
  { id: 'technical', name: 'فنی', icon: EquipmentIcon, color: '#607D8B' },
  { id: 'military', name: 'اطلاعات نظامی', icon: MilitaryIcon, color: '#795548' },
  { id: 'equipment', name: 'تجهیزات و لجستیک', icon: EquipmentIcon, color: '#FF5722' },
  { id: 'geographic', name: 'اطلاعات جغرافیایی', icon: LocationIcon, color: '#009688' },
  { id: 'datetime', name: 'تاریخ و زمان', icon: ScheduleIcon, color: '#E91E63' },
  { id: 'basic', name: 'فیلدهای پایه', icon: HomeIcon, color: '#4CAF50' }
];

interface TemplateSelectorProps {
  onTemplateSelect: (config: SmartFieldConfig | SmartFieldConfig[]) => void;
  existingFields?: SmartFieldConfig[];
  categoryContext?: string;
  editingField?: SmartFieldConfig | null;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = React.memo(({
  onTemplateSelect,
  existingFields = [],
  categoryContext,
  editingField
}) => {
  const theme = useTheme();
  const { renderCount, logPerformance } = usePerformanceProfiler('TemplateSelector');
  
  // Performance-optimized search state
  const [searchQuery, debouncedSearchQuery, setSearchQuery] = useDebouncedState('', 300);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['personal']);
  const [useVirtualization, setUseVirtualization] = useState(false);

  // Memoized template filtering with performance optimization
  const filteredTemplates = useMemoizedSearch(
    FIELD_TEMPLATES,
    debouncedSearchQuery,
    ['name', 'description'],
    useCallback((template: FieldTemplate) => {
      return selectedCategory === 'all' || template.category === selectedCategory;
    }, [selectedCategory]),
    useCallback((a: FieldTemplate, b: FieldTemplate) => {
      // Sort by usage count (most used first) then by name
      if (a.usageCount && b.usageCount) {
        return b.usageCount - a.usageCount;
      }
      return a.name.localeCompare(b.name);
    }, [])
  );

  // Memoized grouped templates
  const groupedTemplates = useMemo(() => {
    return TEMPLATE_CATEGORIES.reduce((acc, category) => {
      acc[category.id] = filteredTemplates.filter(t => t.category === category.id);
      return acc;
    }, {} as Record<string, FieldTemplate[]>);
  }, [filteredTemplates]);

  // Performance-optimized event handlers
  const handleTemplateSelect = useCallback((template: FieldTemplate) => {
    logPerformance('Template Selection', () => {
      if (template.isMultiField) {
        onTemplateSelect(template.fields);
      } else {
        onTemplateSelect(template.fields[0]);
      }
    });
  }, [onTemplateSelect, logPerformance]);

  const handleCategoryToggle = useCallback((categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  }, []);

  const handleCategorySelect = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId);
    // Auto-expand the selected category
    if (categoryId !== 'all' && !expandedCategories.includes(categoryId)) {
      setExpandedCategories(prev => [...prev, categoryId]);
    }
  }, [expandedCategories]);

  // Auto-enable virtualization for large template lists
  useEffect(() => {
    setUseVirtualization(filteredTemplates.length > 50);
  }, [filteredTemplates.length]);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        انتخاب قالب آماده
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        قالب‌های آماده برای فیلدهای رایج سیستم
      </Typography>

      {/* Search and Filter */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="جستجو در قالب‌ها..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
          sx={{ mb: 2 }}
          helperText={debouncedSearchQuery !== searchQuery ? 'در حال جستجو...' : `${filteredTemplates.length} قالب یافت شد`}
        />
        
        {/* Category Chips */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label="همه"
            variant={selectedCategory === 'all' ? 'filled' : 'outlined'}
            onClick={() => handleCategorySelect('all')}
            color="primary"
          />
          {TEMPLATE_CATEGORIES.map(category => {
            const CategoryIcon = category.icon;
            return (
              <Chip
                key={category.id}
                icon={<CategoryIcon />}
                label={category.name}
                variant={selectedCategory === category.id ? 'filled' : 'outlined'}
                onClick={() => handleCategorySelect(category.id)}
                sx={{ 
                  backgroundColor: selectedCategory === category.id ? category.color : undefined,
                  color: selectedCategory === category.id ? 'white' : undefined
                }}
              />
            );
          })}
        </Box>
      </Box>

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
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CategoryIcon sx={{ color: category.color }} />
                    <Typography variant="subtitle1" fontWeight={600}>
                      {category.name}
                    </Typography>
                    <Chip 
                      label={templates.length} 
                      size="small" 
                      sx={{ backgroundColor: alpha(category.color, 0.1) }}
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
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
                                boxShadow: 3
                              }
                            }}
                            onClick={() => handleTemplateSelect(template)}
                          >
                            <CardContent sx={{ pb: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <TemplateIcon sx={{ color: template.color }} />
                                <Typography variant="subtitle2" fontWeight={600}>
                                  {template.name}
                                </Typography>
                                {template.isMultiField && (
                                  <Chip label="چندتایی" size="small" color="secondary" />
                                )}
                              </Box>
                              
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {template.description}
                              </Typography>
                              
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                                {template.tags.slice(0, 3).map(tag => (
                                  <Chip 
                                    key={tag} 
                                    label={tag} 
                                    size="small" 
                                    variant="outlined"
                                    sx={{ fontSize: '0.7rem' }}
                                  />
                                ))}
                              </Box>
                              
                              {template.usageCount && (
                                <Typography variant="caption" color="text.secondary">
                                  استفاده شده: {template.usageCount} بار
                                </Typography>
                              )}
                            </CardContent>
                            
                            <CardActions sx={{ pt: 0, justifyContent: 'space-between' }}>
                              <Button 
                                size="small" 
                                startIcon={<AddIcon />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTemplateSelect(template);
                                }}
                              >
                                انتخاب
                              </Button>
                              <IconButton size="small" color="primary">
                                <PreviewIcon />
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
  );
});

export default TemplateSelector;