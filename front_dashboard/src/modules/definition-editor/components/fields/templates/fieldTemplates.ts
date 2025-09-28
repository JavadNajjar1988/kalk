import { ExtendedCustomFieldDefinition } from '../types/FieldEditTypes';

export interface FieldTemplate {
  id: string;
  name: string;
  description: string;
  category: 'personal' | 'contact' | 'business' | 'technical' | 'common';
  icon: string;
  definition: Partial<ExtendedCustomFieldDefinition>;
}

export const fieldTemplates: FieldTemplate[] = [
  // Personal Information
  {
    id: 'full-name',
    name: 'نام کامل',
    description: 'فیلد متنی برای نام و نام خانوادگی',
    category: 'personal',
    icon: '👤',
    definition: {
      name: 'نام کامل',
      englishName: 'full_name',
      type: 'text',
      isRequired: true,
      placeholder: 'نام و نام خانوادگی خود را وارد کنید',
      validationRules: {
        minLength: 2,
        maxLength: 100
      }
    }
  },
  {
    id: 'national-id',
    name: 'کد ملی',
    description: 'فیلد متنی برای کد ملی با اعتبارسنجی',
    category: 'personal',
    icon: '🆔',
    definition: {
      name: 'کد ملی',
      englishName: 'national_id',
      type: 'text',
      isRequired: true,
      placeholder: 'کد ملی 10 رقمی',
      validationRules: {
        pattern: '^[0-9]{10}$',
        patternMessage: 'کد ملی باید 10 رقم باشد'
      }
    }
  },
  {
    id: 'birth-date',
    name: 'تاریخ تولد',
    description: 'فیلد تاریخ برای تاریخ تولد',
    category: 'personal',
    icon: '📅',
    definition: {
      name: 'تاریخ تولد',
      englishName: 'birth_date',
      type: 'date',
      isRequired: false
    }
  },

  // Contact Information
  {
    id: 'email',
    name: 'ایمیل',
    description: 'فیلد ایمیل با اعتبارسنجی خودکار',
    category: 'contact',
    icon: '📧',
    definition: {
      name: 'آدرس ایمیل',
      englishName: 'email',
      type: 'email',
      isRequired: false,
      placeholder: 'example@domain.com'
    }
  },
  {
    id: 'phone',
    name: 'شماره تلفن',
    description: 'فیلد شماره تلفن همراه',
    category: 'contact',
    icon: '📱',
    definition: {
      name: 'شماره موبایل',
      englishName: 'mobile_phone',
      type: 'phone',
      isRequired: false,
      placeholder: '09123456789',
      validationRules: {
        pattern: '^09[0-9]{9}$',
        patternMessage: 'شماره موبایل باید با 09 شروع شود و 11 رقم باشد'
      }
    }
  },
  {
    id: 'address',
    name: 'آدرس',
    description: 'فیلد متن چندخطی برای آدرس',
    category: 'contact',
    icon: '🏠',
    definition: {
      name: 'آدرس منزل',
      englishName: 'home_address',
      type: 'textarea',
      isRequired: false,
      placeholder: 'آدرس کامل خود را وارد کنید',
      validationRules: {
        maxLength: 500
      }
    }
  },

  // Business
  {
    id: 'job-title',
    name: 'عنوان شغلی',
    description: 'فیلد متنی برای عنوان شغل',
    category: 'business',
    icon: '💼',
    definition: {
      name: 'عنوان شغلی',
      englishName: 'job_title',
      type: 'text',
      isRequired: false,
      validationRules: {
        maxLength: 100
      }
    }
  },
  {
    id: 'department',
    name: 'بخش/دپارتمان',
    description: 'فیلد انتخابی برای انتخاب بخش',
    category: 'business',
    icon: '🏢',
    definition: {
      name: 'بخش',
      englishName: 'department',
      type: 'select',
      isRequired: false,
      options: [
        'فناوری اطلاعات',
        'منابع انسانی',
        'مالی',
        'فروش',
        'بازاریابی'
      ]
    }
  },
  {
    id: 'salary',
    name: 'حقوق',
    description: 'فیلد عددی برای حقوق',
    category: 'business',
    icon: '💰',
    definition: {
      name: 'حقوق (تومان)',
      englishName: 'salary',
      type: 'number',
      isRequired: false,
      placeholder: '0',
      validationRules: {
        minLength: 0
      }
    }
  },

  // Technical
  {
    id: 'username',
    name: 'نام کاربری',
    description: 'فیلد متنی انگلیسی برای نام کاربری',
    category: 'technical',
    icon: '👨‍💻',
    definition: {
      name: 'نام کاربری',
      englishName: 'username',
      type: 'text-english',
      isRequired: true,
      placeholder: 'username',
      validationRules: {
        pattern: '^[a-zA-Z0-9_]+$',
        patternMessage: 'نام کاربری فقط می‌تواند شامل حروف انگلیسی، اعداد و _ باشد',
        minLength: 3,
        maxLength: 20,
        unique: true
      }
    }
  },
  {
    id: 'password',
    name: 'رمز عبور',
    description: 'فیلد رمز عبور با اعتبارسنجی قوی',
    category: 'technical',
    icon: '🔒',
    definition: {
      name: 'رمز عبور',
      englishName: 'password',
      type: 'password',
      isRequired: true,
      validationRules: {
        minLength: 8,
        pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d@$!%*?&]{8,}$',
        patternMessage: 'رمز عبور باید حداقل 8 کاراکتر و شامل حرف بزرگ، کوچک و عدد باشد'
      }
    }
  },

  // Common
  {
    id: 'notes',
    name: 'یادداشت',
    description: 'فیلد متن چندخطی برای یادداشت‌های عمومی',
    category: 'common',
    icon: '📝',
    definition: {
      name: 'یادداشت',
      englishName: 'notes',
      type: 'textarea',
      isRequired: false,
      placeholder: 'یادداشت‌های خود را اینجا بنویسید...',
      validationRules: {
        maxLength: 1000
      }
    }
  },
  {
    id: 'status',
    name: 'وضعیت',
    description: 'فیلد انتخابی برای وضعیت',
    category: 'common',
    icon: '📊',
    definition: {
      name: 'وضعیت',
      englishName: 'status',
      type: 'select',
      isRequired: true,
      defaultValue: 'active',
      options: [
        'فعال',
        'غیرفعال',
        'در انتظار',
        'تعلیق'
      ]
    }
  },
  {
    id: 'tags',
    name: 'برچسب‌ها',
    description: 'فیلد انتخاب چندگانه برای برچسب‌ها',
    category: 'common',
    icon: '🏷️',
    definition: {
      name: 'برچسب‌ها',
      englishName: 'tags',
      type: 'multiselect',
      isRequired: false,
      options: [
        'مهم',
        'فوری',
        'جدید',
        'بررسی شده',
        'تأیید شده'
      ]
    }
  }
];

export const getTemplatesByCategory = (category: FieldTemplate['category']): FieldTemplate[] => {
  return fieldTemplates.filter(template => template.category === category);
};

export const searchTemplates = (query: string): FieldTemplate[] => {
  const lowerQuery = query.toLowerCase();
  return fieldTemplates.filter(template => 
    template.name.toLowerCase().includes(lowerQuery) ||
    template.description.toLowerCase().includes(lowerQuery) ||
    template.definition.englishName?.toLowerCase().includes(lowerQuery)
  );
};

export const getTemplateById = (id: string): FieldTemplate | undefined => {
  return fieldTemplates.find(template => template.id === id);
};