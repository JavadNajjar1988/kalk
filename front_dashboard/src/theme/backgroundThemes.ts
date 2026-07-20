import { BackgroundTheme } from '../store/slices/uiSlice';

export interface BackgroundThemeConfig {
  name: string;
  displayName: string;
  description: string;
  preview: string; // gradient یا رنگ برای پیش‌نمایش
  colors: {
    primary: string;
    secondary: string;
    background: {
      default: string;
      paper: string;
      elevated: string;
    };
    surface: {
      level0: string; // سطح پایه
      level1: string; // کارت‌ها
      level2: string; // منوها
      level3: string; // مدال‌ها
    };
    text: {
      primary: string;
      secondary: string;
      disabled: string;
    };
    border: {
      light: string;
      medium: string;
      strong: string;
    };
    accent: string;
    sidebar: {
      background: string;
      hover: string;
      active: string;
    };
    header: {
      background: string;
      text: string;
    };
  };
  gradients: {
    primary: string;
    secondary: string;
    background: string;
  };
}

export const backgroundThemes: Record<BackgroundTheme, BackgroundThemeConfig> = {
  'default': {
    name: 'default',
    displayName: 'کلاسیک آبی',
    description: 'تم پیش‌فرض با رنگ‌بندی آبی Gmail',
    preview: 'linear-gradient(135deg, #4285f4 0%, #34a853 100%)',
    colors: {
      primary: '#4285f4',
      secondary: '#34a853',
      background: {
        default: '#f8f9ff',
        paper: '#ffffff',
        elevated: '#fafbff',
      },
      surface: {
        level0: '#ffffff',
        level1: '#f8f9ff',
        level2: '#f0f2ff',
        level3: '#e8ebff',
      },
      text: {
        primary: '#202124',
        secondary: '#5f6368',
        disabled: '#9aa0a6',
      },
      border: {
        light: '#e8eaed',
        medium: '#dadce0',
        strong: '#bdc1c6',
      },
      accent: '#1a73e8',
      sidebar: {
        background: '#f8f9ff',
        hover: '#e8f0fe',
        active: '#d2e3fc',
      },
      header: {
        background: '#ffffff',
        text: '#202124',
      },
    },
    gradients: {
      primary: 'linear-gradient(135deg, #4285f4 0%, #1a73e8 100%)',
      secondary: 'linear-gradient(135deg, #34a853 0%, #137333 100%)',
      background: 'linear-gradient(180deg, #f8f9ff 0%, #ffffff 100%)',
    },
  },

  'military-blue': {
    name: 'military-blue',
    displayName: 'آبی نظامی',
    description: 'تم آبی نظامی برای عملیات‌های دریایی',
    preview: 'linear-gradient(135deg, #1565C0 0%, #0D47A1 100%)',
    colors: {
      primary: '#1565C0',
      secondary: '#1976D2',
      background: {
        default: '#f0f4f8',
        paper: '#ffffff',
        elevated: '#f5f7fa',
      },
      surface: {
        level0: '#ffffff',
        level1: '#f0f4f8',
        level2: '#e1e8ed',
        level3: '#d1dce5',
      },
      text: {
        primary: '#0d1421',
        secondary: '#4b5563',
        disabled: '#9ca3af',
      },
      border: {
        light: '#e1e8ed',
        medium: '#cbd5e0',
        strong: '#a0aec0',
      },
      accent: '#0D47A1',
      sidebar: {
        background: '#f0f4f8',
        hover: '#e3f2fd',
        active: '#bbdefb',
      },
      header: {
        background: '#ffffff',
        text: '#0d1421',
      },
    },
    gradients: {
      primary: 'linear-gradient(135deg, #1565C0 0%, #0D47A1 100%)',
      secondary: 'linear-gradient(135deg, #1976D2 0%, #1565C0 100%)',
      background: 'linear-gradient(180deg, #f0f4f8 0%, #ffffff 100%)',
    },
  },

  'field-green': {
    name: 'field-green',
    displayName: 'سبز میدانی',
    description: 'تم سبز میدانی برای عملیات‌های زمینی',
    preview: 'linear-gradient(135deg, #1c684e 0%, #0f4c3a 100%)',
    colors: {
      primary: '#1c684e',
      secondary: '#2e7d63',
      background: {
        default: '#f0f5f3',
        paper: '#ffffff',
        elevated: '#f5f9f7',
      },
      surface: {
        level0: '#ffffff',
        level1: '#f0f5f3',
        level2: '#e0ebe6',
        level3: '#d1e0d9',
      },
      text: {
        primary: '#0a1e17',
        secondary: '#4a5d54',
        disabled: '#94a3a0',
      },
      border: {
        light: '#e0ebe6',
        medium: '#c7d6cc',
        strong: '#a8bfb2',
      },
      accent: '#0f4c3a',
      sidebar: {
        background: '#f0f5f3',
        hover: '#e8f5e8',
        active: '#c8e6c9',
      },
      header: {
        background: '#ffffff',
        text: '#0a1e17',
      },
    },
    gradients: {
      primary: 'linear-gradient(135deg, #1c684e 0%, #0f4c3a 100%)',
      secondary: 'linear-gradient(135deg, #2e7d63 0%, #1c684e 100%)',
      background: 'linear-gradient(180deg, #f0f5f3 0%, #ffffff 100%)',
    },
  },

  'command-red': {
    name: 'command-red',
    displayName: 'قرمز فرماندهی',
    description: 'تم قرمز برای مقامات ارشد و فرماندهان',
    preview: 'linear-gradient(135deg, #8B0000 0%, #590000 100%)',
    colors: {
      primary: '#8B0000',
      secondary: '#B71C1C',
      background: {
        default: '#faf0f0',
        paper: '#ffffff',
        elevated: '#fdf5f5',
      },
      surface: {
        level0: '#ffffff',
        level1: '#faf0f0',
        level2: '#f5e6e6',
        level3: '#f0dcdc',
      },
      text: {
        primary: '#1a0000',
        secondary: '#5c2020',
        disabled: '#a08080',
      },
      border: {
        light: '#f5e6e6',
        medium: '#e0cccc',
        strong: '#ccb3b3',
      },
      accent: '#590000',
      sidebar: {
        background: '#faf0f0',
        hover: '#ffebee',
        active: '#ffcdd2',
      },
      header: {
        background: '#ffffff',
        text: '#1a0000',
      },
    },
    gradients: {
      primary: 'linear-gradient(135deg, #8B0000 0%, #590000 100%)',
      secondary: 'linear-gradient(135deg, #B71C1C 0%, #8B0000 100%)',
      background: 'linear-gradient(180deg, #faf0f0 0%, #ffffff 100%)',
    },
  },

  'tactical-dark': {
    name: 'tactical-dark',
    displayName: 'تیره عملیاتی',
    description: 'تم تیره برای عملیات‌های شبانه و محرمانه',
    preview: 'linear-gradient(135deg, #383b43 0%, #23262d 100%)',
    colors: {
      primary: '#383b43',      // رنگ اصلی داده شده
      secondary: '#3b475e',    // رنگ ثانویه داده شده
      background: {
        default: '#23262d',    // رنگ تیره‌تر برای پس‌زمینه
        paper: '#2a2e36',      // کمی روشن‌تر از رنگ پس‌زمینه اصلی
        elevated: '#313540',   // روشن‌تر برای عناصر برجسته
      },
      surface: {
        level0: '#2a2e36',     // سطح پایه
        level1: '#313540',     // کارت‌ها
        level2: '#383b43',     // منوها
        level3: '#3b475e',     // مدال‌ها
      },
      text: {
        primary: '#bac7e3',    // متن اصلی با رنگ روشن داده شده
        secondary: '#9aa6c3',  // کمی تیره‌تر برای متن ثانویه
        disabled: '#6c7a95',   // تیره‌تر برای متن غیرفعال
      },
      border: {
        light: '#383b43',      // مرزهای نامحسوس
        medium: '#3b475e',     // مرزهای متوسط
        strong: '#4e5c77',     // مرزهای قوی‌تر
      },
      accent: '#8596b5',       // رنگ اکسنت هماهنگ با پالت
      sidebar: {
        background: '#23262d', // پس‌زمینه سایدبار با تیره‌ترین رنگ
        hover: '#2a2e36',      // حالت هاور کمی روشن‌تر
        active: '#383b43',     // حالت فعال با رنگ اصلی
      },
      header: {
        background: '#23262d', // همرنگ با سایدبار
        text: '#bac7e3',       // متن روشن
      },
    },
    gradients: {
      primary: 'linear-gradient(135deg, #383b43 0%, #3b475e 100%)',      // گرادیان با دو رنگ اصلی
      secondary: 'linear-gradient(135deg, #3b475e 0%, #4e5c77 100%)',    // گرادیان با رنگ ثانویه
      background: 'linear-gradient(180deg, #23262d 0%, #2a2e36 100%)',   // گرادیان پس‌زمینه
    },
  },

  'clean-white': {
    name: 'clean-white',
    displayName: 'سفید مینیمال',
    description: 'تم سفید و مینیمال برای تمرکز بیشتر',
    preview: 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)',
    colors: {
      primary: '#1976d2',
      secondary: '#424242',
      background: {
        default: '#ffffff',
        paper: '#ffffff',
        elevated: '#fafafa',
      },
      surface: {
        level0: '#ffffff',
        level1: '#fafafa',
        level2: '#f5f5f5',
        level3: '#eeeeee',
      },
      text: {
        primary: '#212121',
        secondary: '#757575',
        disabled: '#bdbdbd',
      },
      border: {
        light: '#f5f5f5',
        medium: '#e0e0e0',
        strong: '#bdbdbd',
      },
      accent: '#1565c0',
      sidebar: {
        background: '#fafafa',
        hover: '#f0f0f0',
        active: '#e0e0e0',
      },
      header: {
        background: '#ffffff',
        text: '#212121',
      },
    },
    gradients: {
      primary: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
      secondary: 'linear-gradient(135deg, #424242 0%, #212121 100%)',
      background: 'linear-gradient(180deg, #ffffff 0%, #fafafa 100%)',
    },
  },

  'custom': {
    name: 'custom',
    displayName: 'سفارشی',
    description: 'تم سفارشی تعریف شده توسط کاربر',
    preview: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    colors: {
      primary: '#6366f1',
      secondary: '#8b5cf6',
      background: {
        default: '#f8fafc',
        paper: '#ffffff',
        elevated: '#fafbfc',
      },
      surface: {
        level0: '#ffffff',
        level1: '#f8fafc',
        level2: '#f1f5f9',
        level3: '#e2e8f0',
      },
      text: {
        primary: '#0f172a',
        secondary: '#475569',
        disabled: '#94a3b8',
      },
      border: {
        light: '#e2e8f0',
        medium: '#cbd5e1',
        strong: '#94a3b8',
      },
      accent: '#4f46e5',
      sidebar: {
        background: '#f8fafc',
        hover: '#f1f5f9',
        active: '#e2e8f0',
      },
      header: {
        background: '#ffffff',
        text: '#0f172a',
      },
    },
    gradients: {
      primary: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
      secondary: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
    },
  },
}; 