/**
 * Critical Field Templates - Essential and Commonly Used Field Configurations
 * Part 1: Core Personal and Contact Information Templates
 */

export interface FieldTemplate {
  id: string;
  name: string;
  englishName?: string;
  description: string;
  category: string;
  subcategory?: string;
  icon: string;
  color: string;
  tags: string[];
  usageCount: number;
  complexity: 'simple' | 'intermediate' | 'advanced';
  isMultiField?: boolean;
  isCritical?: boolean;
  fields: Array<{
    id: string;
    name: string;
    englishName: string;
    baseType: 'text' | 'number' | 'choice' | 'reference';
    enhancements?: Array<{
      type: string;
      config: any;
      enabled: boolean;
    }>;
    dataSource?: {
      type: string;
      config: any;
    };
    validation?: Array<{
      id: string;
      type: string;
      config: any;
      message: string;
      enabled: boolean;
    }>;
    isRequired: boolean;
    order: number;
    placeholder?: string;
    helpText?: string;
    description?: string;
  }>;
  examples?: string[];
  bestPractices?: string[];
  useCases?: string[];
}

export const CRITICAL_FIELD_TEMPLATES: FieldTemplate[] = [
  // === Personal Information Templates ===
  {
    id: 'personal_full_name',
    name: 'نام و نام خانوادگی',
    englishName: 'Full Name',
    description: 'فیلد کامل برای ثبت نام و نام خانوادگی با اعتبارسنجی',
    category: 'personal',
    subcategory: 'identity',
    icon: '👤',
    color: '#2196F3',
    tags: ['نام', 'شخصی', 'هویت', 'اجباری'],
    usageCount: 450,
    complexity: 'simple',
    isCritical: true,
    fields: [{
      id: 'full_name',
      name: 'نام و نام خانوادگی',
      englishName: 'fullName',
      baseType: 'text',
      enhancements: [
        {
          type: 'FORMATTED',
          config: { 
            format: 'name',
            pattern: '^[آ-ی\\s]+$',
            allowNumbers: false,
            trimSpaces: true
          },
          enabled: true
        }
      ],
      validation: [
        {
          id: 'full_name_required',
          type: 'REQUIRED',
          config: { value: true },
          message: 'وارد کردن نام و نام خانوادگی الزامی است',
          enabled: true
        },
        {
          id: 'full_name_length',
          type: 'LENGTH',
          config: { min: 2, max: 50 },
          message: 'نام باید بین ۲ تا ۵۰ کاراکتر باشد',
          enabled: true
        }
      ],
      isRequired: true,
      order: 1,
      placeholder: 'مثال: علی احمدی',
      helpText: 'نام و نام خانوادگی خود را به طور کامل وارد کنید'
    }],
    examples: ['علی احمدی', 'فاطمه محمدی', 'حسن رضایی'],
    bestPractices: [
      'از فرمت استاندارد نام استفاده کنید',
      'فقط حروف فارسی مجاز است',
      'از وارد کردن اعداد خودداری کنید'
    ],
    useCases: ['ثبت‌نام کاربران', 'فرم‌های شناسایی', 'مدارک رسمی']
  },
  
  {
    id: 'personal_national_id',
    name: 'کد ملی',
    englishName: 'National ID',
    description: 'کد ملی ایرانی با اعتبارسنجی کامل',
    category: 'personal',
    subcategory: 'identity',
    icon: '🆔',
    color: '#1976D2',
    tags: ['کد ملی', 'شناسایی', 'اجباری', 'ایران'],
    usageCount: 380,
    complexity: 'intermediate',
    isCritical: true,
    fields: [{
      id: 'national_id',
      name: 'کد ملی',
      englishName: 'nationalId',
      baseType: 'text',
      enhancements: [
        {
          type: 'FORMATTED',
          config: { 
            mask: '###-######-#',
            pattern: '^[0-9]{10}$',
            placeholder: '___-______-_'
          },
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
          id: 'national_id_format',
          type: 'PATTERN',
          config: { pattern: '^[0-9]{10}$' },
          message: 'کد ملی باید ۱۰ رقم باشد',
          enabled: true
        }
      ],
      isRequired: true,
      order: 2,
      placeholder: '1234567890',
      helpText: 'کد ملی ۱۰ رقمی خود را وارد کنید'
    }]
  },

  {
    id: 'contact_mobile_phone',
    name: 'شماره موبایل',
    englishName: 'Mobile Phone',
    description: 'شماره تلفن همراه با فرمت ایرانی',
    category: 'contact',
    subcategory: 'phone',
    icon: '📱',
    color: '#9C27B0',
    tags: ['موبایل', 'تلفن', 'تماس', 'پیامک'],
    usageCount: 420,
    complexity: 'simple',
    isCritical: true,
    fields: [{
      id: 'mobile_phone',
      name: 'شماره موبایل',
      englishName: 'mobilePhone',
      baseType: 'text',
      enhancements: [
        {
          type: 'FORMATTED',
          config: { 
            mask: '####-###-####',
            pattern: '^09[0-9]{9}$',
            placeholder: '09##-###-####'
          },
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
        },
        {
          id: 'mobile_format',
          type: 'PATTERN',
          config: { pattern: '^09[0-9]{9}$' },
          message: 'شماره موبایل باید با ۰۹ شروع شود و ۱۱ رقم باشد',
          enabled: true
        }
      ],
      isRequired: true,
      order: 1,
      placeholder: '09123456789',
      helpText: 'شماره موبایل خود را با ۰۹ وارد کنید'
    }]
  },

  {
    id: 'contact_email',
    name: 'آدرس ایمیل',
    englishName: 'Email Address',
    description: 'آدرس پست الکترونیکی با اعتبارسنجی کامل',
    category: 'contact',
    subcategory: 'digital',
    icon: '📧',
    color: '#FF5722',
    tags: ['ایمیل', 'پست الکترونیکی', 'دیجیتال'],
    usageCount: 350,
    complexity: 'simple',
    isCritical: true,
    fields: [{
      id: 'email',
      name: 'آدرس ایمیل',
      englishName: 'email',
      baseType: 'text',
      enhancements: [
        {
          type: 'FORMATTED',
          config: { 
            format: 'email',
            lowercase: true,
            trimSpaces: true
          },
          enabled: true
        }
      ],
      validation: [
        {
          id: 'email_required',
          type: 'REQUIRED',
          config: { value: true },
          message: 'آدرس ایمیل الزامی است',
          enabled: true
        },
        {
          id: 'email_format',
          type: 'PATTERN',
          config: { pattern: '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$' },
          message: 'فرمت ایمیل صحیح نیست',
          enabled: true
        }
      ],
      isRequired: true,
      order: 1,
      placeholder: 'example@domain.com',
      helpText: 'آدرس ایمیل معتبر خود را وارد کنید'
    }]
  },

  // === Business Information Templates ===
  {
    id: 'business_position',
    name: 'سمت شغلی',
    englishName: 'Job Position',
    description: 'سمت یا موقعیت شغلی',
    category: 'business',
    subcategory: 'employment',
    icon: '💼',
    color: '#FF9800',
    tags: ['سمت', 'شغل', 'موقعیت', 'کار'],
    usageCount: 220,
    complexity: 'simple',
    fields: [{
      id: 'job_position',
      name: 'سمت شغلی',
      englishName: 'jobPosition',
      baseType: 'choice',
      enhancements: [
        {
          type: 'SEARCHABLE',
          config: {
            threshold: 3,
            fuzzySearch: true,
            searchPlaceholder: 'جستجو سمت...'
          },
          enabled: true
        }
      ],
      dataSource: {
        type: 'manual',
        config: {
          items: [
            { id: 'manager', label: 'مدیر' },
            { id: 'developer', label: 'توسعه‌دهنده' },
            { id: 'designer', label: 'طراح' },
            { id: 'analyst', label: 'تحلیلگر' },
            { id: 'consultant', label: 'مشاور' },
            { id: 'specialist', label: 'متخصص' }
          ]
        }
      },
      validation: [
        {
          id: 'position_required',
          type: 'REQUIRED',
          config: { value: true },
          message: 'سمت شغلی الزامی است',
          enabled: true
        }
      ],
      isRequired: true,
      order: 1,
      helpText: 'سمت فعلی خود را انتخاب یا وارد کنید'
    }]
  }
];

// Template Categories for UI Organization
export const TEMPLATE_CATEGORIES = [
  {
    id: 'personal',
    name: 'اطلاعات شخصی',
    description: 'فیلدهای مربوط به اطلاعات فردی',
    icon: '👤',
    color: '#2196F3',
    subcategories: [
      { id: 'identity', name: 'شناسایی', description: 'نام، کد ملی، تاریخ تولد' },
      { id: 'demographic', name: 'جمعیت‌شناختی', description: 'سن، جنسیت، وضعیت تأهل' }
    ]
  },
  {
    id: 'contact',
    name: 'اطلاعات تماس',
    description: 'راه‌های ارتباطی و تماس',
    icon: '📞',
    color: '#9C27B0',
    subcategories: [
      { id: 'phone', name: 'تلفن', description: 'موبایل، ثابت، فکس' },
      { id: 'digital', name: 'دیجیتال', description: 'ایمیل، شبکه‌های اجتماعی' }
    ]
  },
  {
    id: 'business',
    name: 'اطلاعات شغلی',
    description: 'سابقه کار و اطلاعات حرفه‌ای',
    icon: '💼',
    color: '#FF9800',
    subcategories: [
      { id: 'employment', name: 'اشتغال', description: 'سمت، شرکت، سابقه' },
      { id: 'company', name: 'شرکت', description: 'نام، نوع، آدرس شرکت' }
    ]
  },
  {
    id: 'address',
    name: 'آدرس و موقعیت',
    description: 'اطلاعات مکانی و آدرس',
    icon: '🏠',
    color: '#607D8B'
  }
];

export default CRITICAL_FIELD_TEMPLATES;