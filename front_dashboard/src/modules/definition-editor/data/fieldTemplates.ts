// Pre-defined Field Templates
// قالب‌های آماده برای انواع مختلف فیلدها

import type { FieldTemplate } from '../types/fieldTemplates';

export const FIELD_TEMPLATES: FieldTemplate[] = [
  // ============ فیلدهای پایه ============
  {
    id: 'simple_text',
    name: 'متن ساده',
    englishName: 'Simple Text',
    description: 'فیلد متنی ساده برای ورود اطلاعات کلی',
    category: 'basic',
    icon: 'TextFields',
    difficulty: 'beginner',
    tags: ['متن', 'ساده', 'پایه'],
    examples: ['نام', 'عنوان', 'توضیحات کوتاه'],
    config: {
      id: '',
      name: '',
      englishName: '',
      baseType: 'text',
      isRequired: false,
      order: 1,
      validation: {
        rules: ['minLength', 'maxLength']
      }
    }
  },

  {
    id: 'simple_number',
    name: 'عدد ساده', 
    englishName: 'Simple Number',
    description: 'فیلد عددی برای ورود مقادیر عددی',
    category: 'basic',
    icon: 'Numbers',
    difficulty: 'beginner',
    tags: ['عدد', 'ساده', 'پایه'],
    examples: ['سن', 'تعداد', 'قیمت'],
    config: {
      id: '',
      name: '',
      englishName: '',
      baseType: 'number',
      isRequired: false,
      order: 1,
      validation: {
        rules: ['minValue', 'maxValue']
      }
    }
  },

  {
    id: 'simple_selection',
    name: 'انتخاب ساده',
    englishName: 'Simple Selection', 
    description: 'فیلد انتخاب از لیست گزینه‌های ثابت',
    category: 'basic',
    icon: 'List',
    difficulty: 'beginner',
    tags: ['انتخاب', 'لیست', 'گزینه'],
    examples: ['جنسیت', 'وضعیت', 'اولویت'],
    config: {
      id: '',
      name: '',
      englishName: '', 
      baseType: 'selection',
      isRequired: false,
      order: 1,
      dataSource: {
        type: 'static',
        configuration: {
          staticOptions: [
            { value: 'option1', label: 'گزینه ۱' },
            { value: 'option2', label: 'گزینه ۲' }
          ]
        }
      }
    }
  },

  // ============ فیلدهای متنی پیشرفته ============
  {
    id: 'english_text',
    name: 'متن انگلیسی',
    englishName: 'English Text Only',
    description: 'فیلد متنی که فقط حروف انگلیسی می‌پذیرد',
    category: 'text',
    icon: 'Language',
    difficulty: 'intermediate',
    tags: ['انگلیسی', 'اعتبارسنجی', 'متن'],
    examples: ['نام لاتین', 'آدرس ایمیل', 'نام کاربری'],
    config: {
      id: '',
      name: '',
      englishName: '',
      baseType: 'text',
      isRequired: false,
      order: 1,
      validation: {
        rules: ['englishOnly', 'minLength', 'maxLength']
      }
    }
  },

  {
    id: 'numeric_text',
    name: 'متن عددی',
    englishName: 'Numeric Text Only',
    description: 'فیلد متنی که فقط اعداد می‌پذیرد',
    category: 'text',
    icon: 'Pin',
    difficulty: 'intermediate', 
    tags: ['عددی', 'کد', 'شماره'],
    examples: ['کد پرسنلی', 'شماره شناسایی', 'کد ملی'],
    config: {
      id: '',
      name: '',
      englishName: '',
      baseType: 'text',
      isRequired: false,
      order: 1,
      validation: {
        rules: ['numericOnly', 'minLength', 'maxLength']
      }
    }
  },

  // ============ فیلدهای اعتبارسنجی ============
  {
    id: 'email_field',
    name: 'ایمیل',
    englishName: 'Email Address',
    description: 'فیلد ایمیل با اعتبارسنجی فرمت',
    category: 'validation',
    icon: 'Email',
    difficulty: 'beginner',
    tags: ['ایمیل', 'اعتبارسنجی'],
    examples: ['ایمیل کاری', 'ایمیل شخصی'],
    config: {
      id: '',
      name: '',
      englishName: '',
      baseType: 'text',
      isRequired: false,
      order: 1,
      validation: {
        rules: ['email']
      }
    }
  },

  {
    id: 'phone_field',
    name: 'شماره تلفن',
    englishName: 'Phone Number',
    description: 'فیلد شماره تلفن با اعتبارسنجی فرمت ایرانی',
    category: 'validation',
    icon: 'Phone',
    difficulty: 'intermediate',
    tags: ['تلفن', 'موبایل', 'اعتبارسنجی'],
    examples: ['موبایل شخصی', 'تلفن منزل', 'تلفن اضطراری'],
    config: {
      id: '',
      name: '',
      englishName: '',
      baseType: 'text',
      isRequired: false,
      order: 1,
      validation: {
        rules: ['phone']
      }
    }
  },

  {
    id: 'conditional_national_id',
    name: 'کد ملی شرطی',
    englishName: 'Conditional National ID',
    description: 'کد ملی که بر اساس تابعیت اعتبارسنجی می‌شود',
    category: 'validation',
    icon: 'Badge',
    difficulty: 'advanced',
    tags: ['کد ملی', 'تابعیت', 'شرطی'],
    examples: ['شناسه ملی', 'کد شناسایی'],
    config: {
      id: '',
      name: '',
      englishName: '',
      baseType: 'text',
      isRequired: true,
      order: 1,
      validation: {
        rules: ['nationalId'],
        conditionalValidation: {
          dependsOn: 'nationality',
          condition: 'iranian',
          validationRules: ['nationalId']
        }
      }
    }
  },

  // ============ فیلدهای آرایه‌ای ============
  {
    id: 'phone_array',
    name: 'آرایه شماره تلفن',
    englishName: 'Phone Array',
    description: 'چندین شماره تلفن با برچسب‌های مختلف',
    category: 'array',
    icon: 'ContactPhone',
    difficulty: 'advanced',
    tags: ['تلفن', 'آرایه', 'چندگانه'],
    examples: ['شماره‌های تماس', 'تلفن‌های اضطراری'],
    config: {
      id: '',
      name: '',
      englishName: '',
      baseType: 'text',
      isRequired: false,
      order: 1,
      validation: {
        rules: ['phone']
      },
      inputEnhancement: {
        type: 'array',
        configuration: {
          minItems: 1,
          maxItems: 5,
          itemLabels: ['موبایل', 'منزل', 'محل کار', 'اضطراری', 'فکس', 'سایر']
        }
      }
    }
  },

  {
    id: 'address_array',
    name: 'آرایه آدرس',
    englishName: 'Address Array',
    description: 'چندین آدرس با برچسب‌های مختلف',
    category: 'array',
    icon: 'LocationOn',
    difficulty: 'advanced',
    tags: ['آدرس', 'آرایه', 'چندگانه'],
    examples: ['آدرس‌های مختلف', 'محل‌های سکونت'],
    config: {
      id: '',
      name: '',
      englishName: '',
      baseType: 'text',
      isRequired: false,
      order: 1,
      inputEnhancement: {
        type: 'array',
        configuration: {
          minItems: 1,
          maxItems: 3,
          itemLabels: ['منزل', 'محل کار', 'محل تولد', 'موقت', 'سایر']
        }
      }
    }
  },

  // ============ فیلدهای سلسله‌مراتبی ============
  {
    id: 'hierarchical_address',
    name: 'آدرس سلسله‌مراتبی',
    englishName: 'Hierarchical Address',
    description: 'انتخاب آدرس از درخت جغرافیایی + آدرس دقیق',
    category: 'hierarchical',
    icon: 'AccountTree',
    difficulty: 'advanced',
    tags: ['آدرس', 'جغرافیایی', 'سلسله‌مراتبی'],
    examples: ['آدرس محل سکونت', 'آدرس محل کار'],
    config: {
      id: '',
      name: '',
      englishName: '',
      baseType: 'reference',
      isRequired: false,
      order: 1,
      dataSource: {
        type: 'geographical',
        configuration: {
          allowFreeText: true,
          maxLevel: 9,
          rootCategory: 'geographical'
        }
      },
      inputEnhancement: {
        type: 'hierarchical',
        configuration: {
          maxDepth: 5,
          showPath: true
        }
      }
    }
  },

  // ============ فیلدهای مرجع ============
  {
    id: 'reference_military_rank',
    name: 'رتبه نظامی',
    englishName: 'Military Rank Reference',
    description: 'انتخاب رتبه نظامی از دسته‌بندی درجات',
    category: 'reference',
    icon: 'Military',
    difficulty: 'intermediate',
    tags: ['رتبه', 'نظامی', 'مرجع'],
    examples: ['درجه نظامی', 'رتبه سازمانی'],
    config: {
      id: '',
      name: '',
      englishName: '',
      baseType: 'reference',
      isRequired: false,
      order: 1,
      dataSource: {
        type: 'category',
        configuration: {
          categoryType: 'military_ranks',
          searchable: true,
          filterable: true
        }
      },
      inputEnhancement: {
        type: 'autocomplete',
        configuration: {
          minSearchLength: 2,
          maxSuggestions: 10
        }
      }
    }
  },

  {
    id: 'reference_equipment',
    name: 'تجهیزات',
    englishName: 'Equipment Reference',
    description: 'انتخاب تجهیزات از دسته‌بندی تجهیزات نظامی',
    category: 'reference',
    icon: 'Inventory',
    difficulty: 'intermediate',
    tags: ['تجهیزات', 'مرجع', 'نظامی'],
    examples: ['سلاح شخصی', 'تجهیزات ارتباطی'],
    config: {
      id: '',
      name: '',
      englishName: '',
      baseType: 'reference',
      isRequired: false,
      order: 1,
      dataSource: {
        type: 'category',
        configuration: {
          categoryType: 'equipment',
          searchable: true,
          filterable: true
        }
      }
    }
  },

  // ============ فیلدهای مرکب ============
  {
    id: 'name_split',
    name: 'نام تفکیک شده',
    englishName: 'Split Name',
    description: 'تفکیک نام و نام خانوادگی در فیلدهای جداگانه',
    category: 'composite',
    icon: 'Person',
    difficulty: 'advanced',
    tags: ['نام', 'تفکیک', 'مرکب'],
    examples: ['نام کامل', 'اطلاعات شخصی'],
    config: {
      id: '',
      name: '',
      englishName: '',
      baseType: 'text',
      isRequired: true,
      order: 1,
      inputEnhancement: {
        type: 'array',
        configuration: {
          minItems: 2,
          maxItems: 2,
          itemLabels: ['نام', 'نام خانوادگی']
        }
      }
    }
  },

  {
    id: 'full_name_dual',
    name: 'نام دوزبانه',
    englishName: 'Dual Language Name',
    description: 'نام به دو زبان فارسی و انگلیسی',
    category: 'composite',
    icon: 'Translate',
    difficulty: 'advanced',
    tags: ['نام', 'دوزبانه', 'مرکب'],
    examples: ['نام کامل دوزبانه', 'عنوان دوزبانه'],
    config: {
      id: '',
      name: '',
      englishName: '',
      baseType: 'text',
      isRequired: true,
      order: 1,
      inputEnhancement: {
        type: 'array',
        configuration: {
          minItems: 2,
          maxItems: 2,
          itemLabels: ['فارسی', 'English']
        }
      }
    }
  }
];

// Helper functions
export const getTemplatesByCategory = (category: string) => {
  return FIELD_TEMPLATES.filter(template => template.category === category);
};

export const getTemplateById = (id: string) => {
  return FIELD_TEMPLATES.find(template => template.id === id);
};

export const getPopularTemplates = () => {
  return FIELD_TEMPLATES.filter(template => 
    ['simple_text', 'english_text', 'phone_array', 'hierarchical_address', 'reference_military_rank', 'conditional_national_id']
    .includes(template.id)
  );
};

export const searchTemplates = (query: string) => {
  const lowerQuery = query.toLowerCase();
  return FIELD_TEMPLATES.filter(template =>
    template.name.includes(query) ||
    template.englishName.toLowerCase().includes(lowerQuery) ||
    template.description.includes(query) ||
    template.tags.some(tag => tag.includes(query))
  );
};