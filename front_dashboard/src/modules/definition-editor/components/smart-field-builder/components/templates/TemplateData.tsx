/**
 * Template Data with Lazy Loading Support
 * Contains all field templates with optimized loading strategies
 */

import {
  Person as PersonIcon,
  Home as HomeIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Security as SecurityIcon,
  Assignment as MilitaryIcon,
  Storage as EquipmentIcon,
  Analytics as AnalyticsIcon,
  Group as GroupIcon
} from '@mui/icons-material';

// Template categories with lazy loading metadata
export const TEMPLATE_CATEGORIES = [
  { 
    id: 'personal', 
    name: 'اطلاعات شخصی', 
    icon: PersonIcon, 
    color: '#2196F3',
    priority: 'high',
    preload: true
  },
  { 
    id: 'contact', 
    name: 'اطلاعات تماس', 
    icon: PhoneIcon, 
    color: '#9C27B0',
    priority: 'high',
    preload: true
  },
  { 
    id: 'business', 
    name: 'کسب و کار', 
    icon: BusinessIcon, 
    color: '#FF9800',
    priority: 'medium',
    preload: false
  },
  { 
    id: 'location', 
    name: 'موقعیت مکانی', 
    icon: LocationIcon, 
    color: '#4CAF50',
    priority: 'medium',
    preload: false
  },
  { 
    id: 'military', 
    name: 'نظامی', 
    icon: MilitaryIcon, 
    color: '#795548',
    priority: 'low',
    preload: false
  },
  { 
    id: 'equipment', 
    name: 'تجهیزات', 
    icon: EquipmentIcon, 
    color: '#607D8B',
    priority: 'low',
    preload: false
  },
  { 
    id: 'basic', 
    name: 'فیلدهای پایه', 
    icon: HomeIcon, 
    color: '#4CAF50',
    priority: 'medium',
    preload: false
  }
];

// Template chunks for lazy loading
const personalTemplates = [
  {
    id: 'personal_name',
    name: 'نام کامل',
    description: 'فیلد نام و نام خانوادگی با اعتبارسنجی',
    category: 'personal',
    icon: PersonIcon,
    color: '#2196F3',
    tags: ['نام', 'شخصی', 'کاربر'],
    usageCount: 156,
    complexity: 'simple',
    fields: [{
      id: 'full_name',
      name: 'نام کامل',
      englishName: 'fullName',
      baseType: 'TEXT',
      enhancements: [
        {
          type: 'FORMATTED',
          config: { pattern: 'name' },
          enabled: true
        }
      ],
      validation: [
        {
          id: 'full_name_required',
          type: 'REQUIRED',
          config: { value: true },
          message: 'نام کامل الزامی است',
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
    complexity: 'intermediate',
    fields: [{
      id: 'national_id',
      name: 'کد ملی',
      englishName: 'nationalId',
      baseType: 'TEXT',
      enhancements: [
        {
          type: 'FORMATTED',
          config: { mask: '####-####-##' },
          enabled: true
        }
      ],
      validation: [
        {
          id: 'national_id_required',
          type: 'REQUIRED',
          config: { value: true },
          message: 'کد ملی الزامی است',
          enabled: true
        },
        {
          id: 'national_id_pattern',
          type: 'PATTERN',
          config: { pattern: '^[0-9]{10}$' },
          message: 'کد ملی باید 10 رقم باشد',
          enabled: true
        }
      ],
      isRequired: true,
      order: 1,
      placeholder: '0123456789'
    }]
  }
];

const contactTemplates = [
  {
    id: 'phone_mobile',
    name: 'شماره موبایل',
    description: 'شماره تلفن همراه با اعتبارسنجی',
    category: 'contact',
    icon: PhoneIcon,
    color: '#9C27B0',
    tags: ['تلفن', 'موبایل', 'تماس'],
    usageCount: 203,
    complexity: 'simple',
    fields: [{
      id: 'mobile_phone',
      name: 'شماره موبایل',
      englishName: 'mobilePhone',
      baseType: 'TEXT',
      enhancements: [
        {
          type: 'FORMATTED',
          config: { mask: '####-###-####' },
          enabled: true
        }
      ],
      validation: [
        {
          id: 'mobile_required',
          type: 'REQUIRED',
          config: { value: true },
          message: 'شماره موبایل الزامی است',
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
    complexity: 'simple',
    fields: [{
      id: 'email',
      name: 'آدرس ایمیل',
      englishName: 'email',
      baseType: 'EMAIL',
      validation: [
        {
          id: 'email_required',
          type: 'REQUIRED',
          config: { value: true },
          message: 'آدرس ایمیل الزامی است',
          enabled: true
        }
      ],
      isRequired: true,
      order: 1,
      placeholder: 'example@domain.com'
    }]
  }
];

const businessTemplates = [
  {
    id: 'company_info',
    name: 'اطلاعات شرکت',
    description: 'نام شرکت و کد اقتصادی',
    category: 'business',
    icon: BusinessIcon,
    color: '#FF9800',
    tags: ['شرکت', 'کسب و کار', 'اقتصادی'],
    usageCount: 67,
    complexity: 'intermediate',
    isMultiField: true,
    fields: [
      {
        id: 'company_name',
        name: 'نام شرکت',
        englishName: 'companyName',
        baseType: 'TEXT',
        isRequired: true,
        order: 1,
        placeholder: 'نام شرکت یا سازمان'
      },
      {
        id: 'economic_code',
        name: 'کد اقتصادی',
        englishName: 'economicCode',
        baseType: 'TEXT',
        validation: [
          {
            id: 'economic_code_pattern',
            type: 'PATTERN',
            config: { pattern: '^[0-9]{12}$' },
            message: 'کد اقتصادی باید 12 رقم باشد',
            enabled: true
          }
        ],
        isRequired: true,
        order: 2,
        placeholder: '123456789012'
      }
    ]
  }
];

const locationTemplates = [
  {
    id: 'address_complete',
    name: 'آدرس کامل',
    description: 'آدرس با جزئیات کامل',
    category: 'location',
    icon: LocationIcon,
    color: '#4CAF50',
    tags: ['آدرس', 'مکان', 'موقعیت'],
    usageCount: 92,
    complexity: 'advanced',
    isMultiField: true,
    fields: [
      {
        id: 'province',
        name: 'استان',
        englishName: 'province',
        baseType: 'SELECT',
        isRequired: true,
        order: 1
      },
      {
        id: 'city',
        name: 'شهر',
        englishName: 'city',
        baseType: 'SELECT',
        isRequired: true,
        order: 2
      },
      {
        id: 'address_detail',
        name: 'آدرس تفصیلی',
        englishName: 'addressDetail',
        baseType: 'TEXTAREA',
        isRequired: true,
        order: 3,
        placeholder: 'خیابان، کوچه، پلاک و...'
      }
    ]
  }
];

const militaryTemplates = [
  {
    id: 'military_service',
    name: 'وضعیت نظام وظیفه',
    description: 'اطلاعات خدمت نظام وظیفه',
    category: 'military',
    icon: MilitaryIcon,
    color: '#795548',
    tags: ['نظامی', 'خدمت', 'وظیفه'],
    usageCount: 43,
    complexity: 'intermediate',
    fields: [{
      id: 'military_status',
      name: 'وضعیت نظام وظیفه',
      englishName: 'militaryStatus',
      baseType: 'SELECT',
      options: [
        { value: 'completed', label: 'پایان خدمت' },
        { value: 'exempt', label: 'معافیت' },
        { value: 'serving', label: 'در حال خدمت' },
        { value: 'not_started', label: 'مشمول' }
      ],
      isRequired: true,
      order: 1
    }]
  }
];

const equipmentTemplates = [
  {
    id: 'equipment_basic',
    name: 'اطلاعات تجهیزات',
    description: 'شناسه و مشخصات تجهیزات',
    category: 'equipment',
    icon: EquipmentIcon,
    color: '#607D8B',
    tags: ['تجهیزات', 'دارایی', 'شناسه'],
    usageCount: 31,
    complexity: 'intermediate',
    isMultiField: true,
    fields: [
      {
        id: 'equipment_id',
        name: 'شناسه تجهیزات',
        englishName: 'equipmentId',
        baseType: 'TEXT',
        isRequired: true,
        order: 1,
        placeholder: 'EQ-12345'
      },
      {
        id: 'equipment_name',
        name: 'نام تجهیزات',
        englishName: 'equipmentName',
        baseType: 'TEXT',
        isRequired: true,
        order: 2,
        placeholder: 'نام تجهیزات'
      }
    ]
  }
];

const basicTemplates = [
  {
    id: 'text_simple',
    name: 'متن ساده',
    description: 'فیلد متنی پایه',
    category: 'basic',
    icon: HomeIcon,
    color: '#4CAF50',
    tags: ['متن', 'پایه', 'ساده'],
    usageCount: 278,
    complexity: 'simple',
    fields: [{
      id: 'simple_text',
      name: 'متن',
      englishName: 'text',
      baseType: 'TEXT',
      order: 1,
      placeholder: 'متن خود را وارد کنید'
    }]
  },
  {
    id: 'number_simple',
    name: 'عدد ساده',
    description: 'فیلد عددی پایه',
    category: 'basic',
    icon: AnalyticsIcon,
    color: '#FF5722',
    tags: ['عدد', 'پایه', 'ساده'],
    usageCount: 145,
    complexity: 'simple',
    fields: [{
      id: 'simple_number',
      name: 'عدد',
      englishName: 'number',
      baseType: 'NUMBER',
      order: 1,
      placeholder: '0'
    }]
  }
];

// Template loading strategies
const templateChunks = {
  high: () => Promise.resolve([...personalTemplates, ...contactTemplates]),
  medium: () => Promise.resolve([...businessTemplates, ...locationTemplates, ...basicTemplates]),
  low: () => Promise.resolve([...militaryTemplates, ...equipmentTemplates])
};

// Main template loader with priority-based loading
export const loadTemplates = async (priority: 'high' | 'medium' | 'low' | 'all' = 'all') => {
  if (priority === 'all') {
    const [high, medium, low] = await Promise.all([
      templateChunks.high(),
      templateChunks.medium(),
      templateChunks.low()
    ]);
    return [...high, ...medium, ...low];
  }
  
  return templateChunks[priority]();
};

// Default export for immediate use
export const FIELD_TEMPLATES = [
  ...personalTemplates,
  ...contactTemplates,
  ...businessTemplates,
  ...locationTemplates,
  ...militaryTemplates,
  ...equipmentTemplates,
  ...basicTemplates
];

export default FIELD_TEMPLATES;