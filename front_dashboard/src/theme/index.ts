import { createTheme, ThemeOptions, alpha } from '@mui/material/styles';
import { faIR } from '@mui/material/locale';
import { BackgroundTheme, ThemeMode, PrimaryColor as UIPrimaryColor } from '../store/slices/uiSlice';
import { backgroundThemes } from './backgroundThemes';
import focusReset from './overrides/focusReset';

// رنگ‌های نقش‌های نظامی
export const roleColors = {
  admin: '#b71c1c',      // قرمز تیره - فرمانده کل
  commander: '#1b5e20',  // سبز نظامی - فرمانده
  operator: '#0d47a1',   // آبی - اپراتور
  viewer: '#424242',     // خاکستری - بیننده
};

// تایپ برای حالت تم
export type PrimaryColor = keyof typeof roleColors;

// رنگ‌های اصلی برای تم
export const primaryColors = {
  blue: '#4285f4',
  green: '#34a853',
  red: '#ea4335',
  purple: '#673ab7',
  orange: '#ff9800'
};

// Yekan font faces
const YekanFontFaces = `
  @font-face {
    font-family: 'Yekan';
    src: url('/fonts/Yekan.woff2') format('woff2'),
         url('/fonts/Yekan.woff') format('woff');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
  }
  
  @font-face {
    font-family: 'Yekan';
    src: url('/fonts/Yekan-Bold.woff2') format('woff2'),
         url('/fonts/Yekan-Bold.woff') format('woff');
    font-weight: bold;
    font-style: normal;
    font-display: swap;
  }
`;

// Inject font faces
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = YekanFontFaces;
  document.head.appendChild(styleElement);
}

export interface ExtendedThemeOptions extends ThemeOptions {
  backgroundTheme?: BackgroundTheme;
  customColors?: {
    sidebar: {
      background: string;
      hover: string;
      active: string;
    };
    surface: {
      level0: string;
      level1: string;
      level2: string;
      level3: string;
    };
  };
}

export const createAppTheme = (
  mode: ThemeMode = 'light',
  backgroundTheme: BackgroundTheme = 'default',
  primaryColor: UIPrimaryColor = 'green',
  fontSize: 'small' | 'medium' | 'large' = 'medium',
  highContrast: boolean = false
) => {
  // Get theme config with safe fallback
  const safeBackgroundTheme = backgroundTheme && backgroundTheme in backgroundThemes ? backgroundTheme : 'default';
  const finalThemeConfig = backgroundThemes[safeBackgroundTheme];
  
  const isDark = mode === 'dark' || (mode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  // رنگ‌های سفارشی تم تاریک
  const darkThemeColors = {
    primary: '#383b43',
    secondary: '#3b475e',
    background: {
      default: '#23262d',
      paper: '#2a2e36',
      elevated: '#313540',
    },
    text: {
      primary: '#bac7e3',
      secondary: '#9aa6c3', 
      disabled: '#6c7a95',
    },
    border: {
      light: '#383b43',
      medium: '#3b475e',
      strong: '#4e5c77',
    }
  };
  
  // تنظیم رنگ اصلی بر اساس انتخاب کاربر
  const selectedPrimaryColor = primaryColors[primaryColor] || primaryColors.green;
  
  // تنظیم ضریب اندازه فونت بر اساس انتخاب کاربر
  const fontSizeMultiplier = fontSize === 'small' ? 0.85 : fontSize === 'large' ? 1.15 : 1;
  
  // Base theme configuration
  const baseTheme: ExtendedThemeOptions = {
    direction: 'rtl',
    backgroundTheme,
    palette: {
      mode: isDark ? 'dark' : 'light',
      primary: {
        main: selectedPrimaryColor,
        dark: isDark ? alpha(selectedPrimaryColor, 0.8) : finalThemeConfig.colors.accent,
        light: isDark ? alpha(selectedPrimaryColor, 0.2) : alpha(selectedPrimaryColor, 0.1),
        contrastText: isDark ? '#ffffff' : '#ffffff',
      },
      secondary: {
        main: isDark ? darkThemeColors.secondary : finalThemeConfig.colors.secondary,
        dark: isDark ? alpha(darkThemeColors.secondary, 0.8) : alpha(finalThemeConfig.colors.secondary, 0.8),
        light: isDark ? alpha(darkThemeColors.secondary, 0.2) : alpha(finalThemeConfig.colors.secondary, 0.1),
      },
      background: {
        default: isDark ? darkThemeColors.background.default : finalThemeConfig.colors.background.default,
        paper: isDark ? darkThemeColors.background.paper : finalThemeConfig.colors.background.paper,
      },

      text: {
        primary: isDark ? darkThemeColors.text.primary : finalThemeConfig.colors.text.primary,
        secondary: isDark ? darkThemeColors.text.secondary : finalThemeConfig.colors.text.secondary,
        disabled: isDark ? darkThemeColors.text.disabled : finalThemeConfig.colors.text.disabled,
      },
      divider: isDark ? darkThemeColors.border.light : finalThemeConfig.colors.border.light,
      action: {
        hover: isDark ? alpha(selectedPrimaryColor, 0.08) : alpha(selectedPrimaryColor, 0.04),
        selected: isDark ? alpha(selectedPrimaryColor, 0.12) : alpha(selectedPrimaryColor, 0.08),
        focus: isDark ? alpha(selectedPrimaryColor, 0.12) : alpha(selectedPrimaryColor, 0.12),
      },
    },
    customColors: {
      sidebar: {
        background: isDark ? darkThemeColors.background.default : finalThemeConfig.colors.sidebar.background,
        hover: isDark ? darkThemeColors.background.paper : finalThemeConfig.colors.sidebar.hover,
        active: isDark ? alpha(selectedPrimaryColor, 0.2) : finalThemeConfig.colors.sidebar.active,
      },
      surface: {
        level0: isDark ? darkThemeColors.background.paper : finalThemeConfig.colors.surface.level0,
        level1: isDark ? darkThemeColors.background.elevated : finalThemeConfig.colors.surface.level1,
        level2: isDark ? alpha(selectedPrimaryColor, 0.1) : finalThemeConfig.colors.surface.level2,
        level3: isDark ? darkThemeColors.secondary : finalThemeConfig.colors.surface.level3,
      },
    },
    typography: {
      fontFamily: '"Yekan", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontFamily: '"Yekan", serif',
        fontWeight: 700,
        fontSize: `${2.5 * fontSizeMultiplier}rem`,
        lineHeight: 1.2,
      },
      h2: {
        fontFamily: '"Yekan", serif',
        fontWeight: 600,
        fontSize: `${2 * fontSizeMultiplier}rem`,
        lineHeight: 1.3,
      },
      h3: {
        fontFamily: '"Yekan", serif',
        fontWeight: 600,
        fontSize: `${1.75 * fontSizeMultiplier}rem`,
        lineHeight: 1.3,
      },
      h4: {
        fontFamily: '"Yekan", serif',
        fontWeight: 600,
        fontSize: `${1.5 * fontSizeMultiplier}rem`,
        lineHeight: 1.4,
      },
      h5: {
        fontFamily: '"Yekan", serif',
        fontWeight: 600,
        fontSize: `${1.25 * fontSizeMultiplier}rem`,
        lineHeight: 1.4,
      },
      h6: {
        fontFamily: '"Yekan", serif',
        fontWeight: 600,
        fontSize: `${1.1 * fontSizeMultiplier}rem`,
        lineHeight: 1.4,
      },
      body1: {
        fontFamily: '"Yekan", sans-serif',
        fontSize: `${1 * fontSizeMultiplier}rem`,
        lineHeight: 1.5,
      },
      body2: {
        fontFamily: '"Yekan", sans-serif',
        fontSize: `${0.875 * fontSizeMultiplier}rem`,
        lineHeight: 1.5,
      },
      button: {
        fontFamily: '"Yekan", sans-serif',
        fontWeight: 500,
        fontSize: `${0.875 * fontSizeMultiplier}rem`,
        textTransform: 'none',
      },
      caption: {
        fontFamily: '"Yekan", sans-serif',
        fontSize: `${0.75 * fontSizeMultiplier}rem`,
        lineHeight: 1.4,
      },
    },
    shape: {
      borderRadius: 12,
    },
    shadows: isDark 
      ? [
          'none',
          '0 2px 4px 0 rgba(0,0,0,0.7)',
          '0 4px 8px 0 rgba(0,0,0,0.7)',
          '0 8px 16px 0 rgba(0,0,0,0.7)',
          '0 12px 24px 0 rgba(0,0,0,0.7)',
          '0 16px 32px 0 rgba(0,0,0,0.7)',
          '0 20px 40px 0 rgba(0,0,0,0.7)',
          '0 24px 48px 0 rgba(0,0,0,0.7)',
          '0 30px 60px 0 rgba(0,0,0,0.7)',
          '0 36px 72px 0 rgba(0,0,0,0.7)',
          '0 42px 84px 0 rgba(0,0,0,0.7)',
          '0 48px 96px 0 rgba(0,0,0,0.7)',
          '0 52px 104px 0 rgba(0,0,0,0.7)',
          '0 56px 112px 0 rgba(0,0,0,0.7)',
          '0 60px 120px 0 rgba(0,0,0,0.7)',
          '0 64px 128px 0 rgba(0,0,0,0.7)',
          '0 68px 136px 0 rgba(0,0,0,0.7)',
          '0 72px 144px 0 rgba(0,0,0,0.7)',
          '0 76px 152px 0 rgba(0,0,0,0.7)',
          '0 80px 160px 0 rgba(0,0,0,0.7)',
          '0 84px 168px 0 rgba(0,0,0,0.7)',
          '0 88px 176px 0 rgba(0,0,0,0.7)',
          '0 92px 184px 0 rgba(0,0,0,0.7)',
          '0 96px 192px 0 rgba(0,0,0,0.7)',
          '0 100px 200px 0 rgba(0,0,0,0.7)',
        ]
      : [
          'none',
          '0px 2px 4px rgba(0, 0, 0, 0.1)',
          '0px 4px 8px rgba(0, 0, 0, 0.1)',
          '0px 8px 16px rgba(0, 0, 0, 0.1)',
          '0px 12px 24px rgba(0, 0, 0, 0.1)',
          '0px 16px 32px rgba(0, 0, 0, 0.1)',
          '0px 20px 40px rgba(0, 0, 0, 0.1)',
          '0px 24px 48px rgba(0, 0, 0, 0.1)',
          '0px 30px 60px rgba(0, 0, 0, 0.1)',
          '0px 36px 72px rgba(0, 0, 0, 0.1)',
          '0px 42px 84px rgba(0, 0, 0, 0.1)',
          '0px 48px 96px rgba(0, 0, 0, 0.1)',
          '0px 52px 104px rgba(0, 0, 0, 0.1)',
          '0px 56px 112px rgba(0, 0, 0, 0.1)',
          '0px 60px 120px rgba(0, 0, 0, 0.1)',
          '0px 64px 128px rgba(0, 0, 0, 0.1)',
          '0px 68px 136px rgba(0, 0, 0, 0.1)',
          '0px 72px 144px rgba(0, 0, 0, 0.1)',
          '0px 76px 152px rgba(0, 0, 0, 0.1)',
          '0px 80px 160px rgba(0, 0, 0, 0.1)',
          '0px 84px 168px rgba(0, 0, 0, 0.1)',
          '0px 88px 176px rgba(0, 0, 0, 0.1)',
          '0px 92px 184px rgba(0, 0, 0, 0.1)',
          '0px 96px 192px rgba(0, 0, 0, 0.1)',
          '0px 100px 200px rgba(0, 0, 0, 0.1)',
        ],
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            background: isDark 
              ? darkThemeColors.background.default
              : finalThemeConfig.colors.background.default,
            minHeight: '100vh',
            fontFamily: '"Yekan", sans-serif',
          },
          '*': {
            '&::-webkit-scrollbar': {
              width: '8px',
              height: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: isDark ? darkThemeColors.background.elevated : alpha(finalThemeConfig.colors.border.light, 0.3),
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: isDark ? darkThemeColors.border.medium : alpha(finalThemeConfig.colors.border.medium, 0.6),
              borderRadius: '4px',
              '&:hover': {
                background: isDark ? darkThemeColors.border.strong : alpha(finalThemeConfig.colors.border.strong, 0.8),
              },
            },
          },
        },
      },
      MuiTypography: {
        defaultProps: {
          // Remove the incorrect implementation that tries to use React components
          // children: (props: any) => {
          //   if (typeof props.children === 'string' || typeof props.children === 'number') {
          //     return convertToFarsiNumber(props.children);
          //   }
          //   return props.children;
          // }
        },
        styleOverrides: {
          root: {
            // We can apply styling here, but not component logic
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            background: isDark ? darkThemeColors.background.paper : finalThemeConfig.colors.surface.level1,
            backdropFilter: 'blur(20px)',
            border: `${highContrast ? '2px' : '1px'} solid ${highContrast ? selectedPrimaryColor : (isDark ? alpha(darkThemeColors.border.light, 0.3) : alpha(finalThemeConfig.colors.border.light, 0.5))}`,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: isDark 
                ? `0px 8px 32px rgba(0, 0, 0, 0.8), 0px 2px 8px rgba(${hexToRgb(darkThemeColors.primary)}, 0.15)`
                : '0px 8px 32px rgba(0, 0, 0, 0.12)',
            },
          },
        },
      },
      // انتخاب کننده‌ها
      MuiSelect: {
        styleOverrides: {
          select: {
            background: isDark ? darkThemeColors.background.paper : 'transparent',
          },
        },
      },
      // دکمه‌ها
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
          contained: {
            ...(highContrast && {
              border: `2px solid ${selectedPrimaryColor}`,
              boxShadow: `0 0 0 2px ${alpha(selectedPrimaryColor, 0.3)}`,
            }),
            ...(isDark && {
              backgroundColor: selectedPrimaryColor,
              color: '#ffffff',
              '&:hover': {
                backgroundColor: alpha(selectedPrimaryColor, 0.9),
              },
            }),
          },
          outlined: {
            ...(highContrast && {
              borderWidth: '2px',
              borderColor: selectedPrimaryColor,
              '&:hover': {
                borderColor: selectedPrimaryColor,
                backgroundColor: alpha(selectedPrimaryColor, 0.1),
              },
            }),
            ...(isDark && {
              borderColor: darkThemeColors.border.medium,
              color: darkThemeColors.text.primary,
              '&:hover': {
                backgroundColor: alpha(selectedPrimaryColor, 0.1),
              },
            }),
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: isDark ? '#1e1e1e' : finalThemeConfig.colors.header.background,
            backdropFilter: 'blur(20px)',
            borderBottom: `1px solid ${isDark ? '#333333' : alpha(finalThemeConfig.colors.border.light, 0.2)}`,
            boxShadow: 'none',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            background: isDark ? '#1e1e1e' : finalThemeConfig.colors.sidebar.background,
            borderRight: `1px solid ${isDark ? '#333333' : alpha(finalThemeConfig.colors.border.light, 0.2)}`,
            boxShadow: 'none',
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: '8px',
            margin: '2px 8px',
            '&:hover': {
              background: isDark ? '#2a2a2a' : finalThemeConfig.colors.sidebar.hover,
            },
            '&.Mui-selected': {
              background: isDark ? '#333333' : finalThemeConfig.colors.sidebar.active,
              '&:hover': {
                background: isDark ? '#3a3a3a' : alpha(finalThemeConfig.colors.sidebar.active, 0.8),
              },
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              background: isDark ? alpha('#ffffff', 0.05) : alpha(finalThemeConfig.colors.background.paper, 0.8),
              backdropFilter: 'blur(10px)',
              transition: 'all 0.2s ease',
              ...(highContrast && {
                '& .MuiOutlinedInput-notchedOutline': {
                  borderWidth: '2px',
                  borderColor: selectedPrimaryColor,
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: selectedPrimaryColor,
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: selectedPrimaryColor,
                },
              }),
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: isDark 
                  ? '0px 4px 12px rgba(0, 0, 0, 0.3)'
                  : `0px 4px 12px ${alpha(finalThemeConfig.colors.primary, 0.1)}`,
              },
              '&.Mui-focused': {
                boxShadow: `0px 0px 0px 3px ${alpha(finalThemeConfig.colors.primary, 0.2)}`,
              },
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            background: isDark ? alpha('#ffffff', 0.05) : alpha(finalThemeConfig.colors.background.paper, 0.8),
            backdropFilter: 'blur(20px)',
            transition: 'box-shadow 0.3s ease-in-out', // اضافه کردن انیمیشن برای سایه
            ...(isDark && {
              boxShadow: `0 0 5px 1px ${alpha('#ffffff', 0.5)}, 0 2px 4px rgba(0,0,0,0.5)`,
            }),
            ...(highContrast && {
              border: `2px solid ${selectedPrimaryColor}`,
              boxShadow: `0 0 0 1px ${alpha(selectedPrimaryColor, 0.3)}`,
            }),
            // پنل پروفایل از این قانون مستثنی باشد
            '&[data-component="profile-panel"]': {
              border: 'none !important',
              outline: 'none !important',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12) !important',
            },
          },
        },
      },
      MuiFab: {
        styleOverrides: {
          root: {
            boxShadow: isDark 
              ? '0px 4px 12px rgba(0, 0, 0, 0.6)'
              : `0px 4px 12px ${alpha(finalThemeConfig.colors.primary, 0.1)}`,
            ...(highContrast && {
              border: `2px solid ${selectedPrimaryColor}`,
              boxShadow: `0 0 0 2px ${alpha(selectedPrimaryColor, 0.3)}`,
            }),
            '&:hover': {
              transform: 'scale(1.05)',
              boxShadow: `0px 0px 0px 3px ${alpha(finalThemeConfig.colors.primary, 0.2)}`,
            },
          },
        },
      },
      ...focusReset,
    },
  };

  const theme = createTheme(baseTheme, faIR);
  
  return theme;
};

// تم پیش‌فرض
export const defaultTheme = createAppTheme('light', 'default', 'green', 'medium', false);

// تم‌های مختلف
export const militaryBlueTheme = createAppTheme('light', 'military-blue', 'blue', 'medium', false);
export const fieldGreenTheme = createAppTheme('light', 'field-green', 'green', 'medium', false);
export const commandRedTheme = createAppTheme('light', 'command-red', 'red', 'medium', false);
export const tacticalDarkTheme = createAppTheme('light', 'tactical-dark', 'green', 'medium', false);

// تم‌های تاریک
export const defaultDarkTheme = createAppTheme('dark', 'default', 'green', 'medium', false);
export const militaryBlueDarkTheme = createAppTheme('dark', 'military-blue', 'blue', 'medium', false);
export const fieldGreenDarkTheme = createAppTheme('dark', 'field-green', 'green', 'medium', false);
export const commandRedDarkTheme = createAppTheme('dark', 'command-red', 'red', 'medium', false); 

// ابزار کمکی برای تبدیل هگزا به RGB
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? 
    parseInt(result[1], 16) + ',' + parseInt(result[2], 16) + ',' + parseInt(result[3], 16) :
    '0,0,0';
} 