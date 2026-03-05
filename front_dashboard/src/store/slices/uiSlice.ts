import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index';
import { createSelector } from '@reduxjs/toolkit';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type PrimaryColor = 'blue' | 'green' | 'red' | 'purple' | 'orange';
export type AccentColor = 'blue' | 'cyan' | 'green' | 'light-green' | 'orange' | 'pink' | 'purple' | 'deep-purple' | 'navy' | 'slate' | 'lavender';

// Background themes مثل Gmail
export type BackgroundTheme = 
  | 'default'           // آبی کلاسیک
  | 'military-blue'     // آبی نظامی
  | 'field-green'       // سبز میدانی
  | 'command-red'       // قرمز فرماندهی
  | 'tactical-dark'     // تیره عملیاتی
  | 'clean-white'       // سفید مینیمال
  | 'custom';           // تم سفارشی

// Side panel types
export type SidePanelType = 
  | 'settings'          // تنظیمات
  | 'notifications'     // اطلاع‌رسانی‌ها
  | 'profile'           // پروفایل
  | 'help'              // راهنما
  | 'theme'             // تنظیمات تم
  | null;               // بسته

export interface CustomTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  borderColor: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: number;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  autoHide?: boolean; // آیا اطلاع‌رسانی به صورت خودکار مخفی شود
  archived?: boolean; // آیا اعلان آرشیو شده است
  starred?: boolean; // آیا اعلان ستاره‌دار است
}

export interface ChartSettings {
  symbolSize: number;
  fontSize: number;
  fontColor: string;
  lineColor: string;
  lineWidth: number;
  levelPadding: number;
  unitPadding: number;
  useShortNames: boolean;
  showPersonnelCount: boolean;
  showUnitStatus: boolean;
  showCommanderInfo: boolean;
  showEchelonSymbols: boolean;
  standard: ChartStandard;
  defaultUnitType: string;
  useLegacySymbols: boolean;
}

export type ChartStandard = 'app6d' | 'milstd2525d' | 'milstd2525c';

// تنظیمات هدر زیارتی داشبورد
export interface HeaderEntry {
  id: number;
  quoteText: string;
  personName: string;
  personPosition: string;
  personImage: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface HeaderSettings {
  enabled: boolean;
  quoteMode: 'random' | 'fixed' | 'custom';
  fixedQuoteIndex: number | null;
  martyrMode: 'random' | 'fixed' | 'custom';
  fixedMartyrId: number | null;
  customQuoteText: string | null;
  customQuoteAuthor: string | null;
  customMartyrName: string | null;
  customMartyrPosition: string | null;
  customMartyrDate: string | null;
  customMartyrImage: string | null;
  entries: HeaderEntry[];
  activeEntryId: number | null;
}

export interface DashboardModulesSettings {
  showHeaderBanner: boolean;
  showStatArchivedScenarios: boolean;
  showStatAvailableForces: boolean;
  showStatOngoingOperations: boolean;
  showStatSecurityAlerts: boolean;
  showRecentActivities: boolean;
  showQuickAccess: boolean;
  showSystemStatus: boolean;
  showImportantNotices: boolean;
}

export const DEFAULT_DASHBOARD_MODULES: DashboardModulesSettings = {
  showHeaderBanner: true,
  showStatArchivedScenarios: true,
  showStatAvailableForces: true,
  showStatOngoingOperations: true,
  showStatSecurityAlerts: true,
  showRecentActivities: true,
  showQuickAccess: true,
  showSystemStatus: true,
  showImportantNotices: true,
};

interface UIState {
  // Theme settings
  theme: {
    mode: ThemeMode;
    primaryColor: PrimaryColor;
    backgroundTheme: BackgroundTheme;
    customTheme: CustomTheme | null;
    fontSize: 'small' | 'medium' | 'large';
    highContrast: boolean;
    reducedMotion: boolean;
    darkModeSettings: {
      accentColor: AccentColor;
      contrastLevel: number; // 0-100
      usePureBlack: boolean; // استفاده از سیاه خالص به جای خاکستری تیره
      dimming: number; // 0-100 میزان تیرگی رنگ‌ها
      blurAmount: number; // 0-20 میزان بلور در پنل‌ها
    };
  };
  
  // Layout settings
  layout: {
    sidebarCollapsed: boolean;
    sidebarWidth: number;
    headerHeight: number;
    compactMode: boolean;
  };
  
  // Side panel state
  sidePanel: {
    isOpen: boolean;
    type: SidePanelType;
    width: number;
    data?: any; // برای ارسال داده‌های اضافی به پنل
  };
  
  // Notifications
  notifications: NotificationItem[];
  
  // General UI state
  loading: boolean;
  language: 'fa' | 'en' | 'ar';
  direction: 'rtl' | 'ltr';
  fullscreen: boolean;
  
  // Splash screen state
  splashScreen: {
    completed: boolean;
    loading: boolean;
  };

  chart: ChartSettings;

  // Header (زیارتی) settings
  header: HeaderSettings;

  // Dashboard module visibility settings
  dashboardModules: DashboardModulesSettings;
}

const initialState: UIState = {
  theme: {
    mode: 'light',
    primaryColor: 'green',
    backgroundTheme: 'field-green',
    customTheme: null,
    fontSize: 'medium',
    highContrast: false,
    reducedMotion: false,
    darkModeSettings: {
      accentColor: 'blue',
      contrastLevel: 70,
      usePureBlack: false,
      dimming: 60,
      blurAmount: 8,
    },
  },
  layout: {
    sidebarCollapsed: false,
    sidebarWidth: 280,
    headerHeight: 64,
    compactMode: false,
  },
  sidePanel: {
    isOpen: false,
    type: null,
    width: 320,
  },
  notifications: [],
  loading: false,
  language: 'fa',
  direction: 'rtl',
  fullscreen: false,
  splashScreen: {
    completed: false,
    loading: false
  },
  chart: {
    symbolSize: 40,
    fontSize: 12,
    fontColor: '#000000',
    lineColor: '#666666',
    lineWidth: 1,
    levelPadding: 160,
    unitPadding: 240,
    useShortNames: false,
    showPersonnelCount: true,
    showUnitStatus: true,
    showCommanderInfo: true,
    showEchelonSymbols: true,
    standard: 'app6d',
    defaultUnitType: '110000',
    useLegacySymbols: false,
  },
  header: {
    enabled: true,
    quoteMode: 'random',
    fixedQuoteIndex: null,
    martyrMode: 'random',
    fixedMartyrId: null,
    customQuoteText: null,
    customQuoteAuthor: null,
    customMartyrName: null,
    customMartyrPosition: null,
    customMartyrDate: null,
    customMartyrImage: null,
    entries: [],
    activeEntryId: null,
  },
  dashboardModules: { ...DEFAULT_DASHBOARD_MODULES },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Theme actions
    setThemeMode: (state, action: PayloadAction<ThemeMode>) => {
      state.theme.mode = action.payload;
      
      // وقتی حالت تاریک فعال می‌شود، تم tactical-dark را انتخاب کن
      if (action.payload === 'dark') {
        state.theme.backgroundTheme = 'tactical-dark';
      } else if (action.payload === 'light' && state.theme.backgroundTheme === 'tactical-dark') {
        // اگر از حالت تاریک به روشن می‌رویم و تم tactical-dark بوده، به تم پیش‌فرض برگرد
        state.theme.backgroundTheme = 'default';
      }
    },
    setPrimaryColor: (state, action: PayloadAction<PrimaryColor>) => {
      state.theme.primaryColor = action.payload;
    },
    setBackgroundTheme: (state, action: PayloadAction<BackgroundTheme>) => {
      state.theme.backgroundTheme = action.payload;
    },
    setCustomTheme: (state, action: PayloadAction<CustomTheme | null>) => {
      state.theme.customTheme = action.payload;
      if (action.payload) {
        state.theme.backgroundTheme = 'custom';
      }
    },
    setFontSize: (state, action: PayloadAction<'small' | 'medium' | 'large'>) => {
      state.theme.fontSize = action.payload;
    },
    toggleHighContrast: (state) => {
      state.theme.highContrast = !state.theme.highContrast;
    },
    toggleReducedMotion: (state) => {
      state.theme.reducedMotion = !state.theme.reducedMotion;
    },

    // Header (زیارتی) settings
    updateHeaderSettings: (state, action: PayloadAction<Partial<HeaderSettings>>) => {
      state.header = { ...state.header, ...action.payload };
    },
    updateDashboardModules: (state, action: PayloadAction<Partial<DashboardModulesSettings>>) => {
      state.dashboardModules = { ...state.dashboardModules, ...action.payload };
    },

    // Dark Mode specific actions
    setDarkModeAccentColor: (state, action: PayloadAction<AccentColor>) => {
      state.theme.darkModeSettings.accentColor = action.payload;
    },
    setDarkModeContrastLevel: (state, action: PayloadAction<number>) => {
      state.theme.darkModeSettings.contrastLevel = Math.min(100, Math.max(0, action.payload));
    },
    toggleDarkModePureBlack: (state) => {
      state.theme.darkModeSettings.usePureBlack = !state.theme.darkModeSettings.usePureBlack;
    },
    setDarkModeDimming: (state, action: PayloadAction<number>) => {
      state.theme.darkModeSettings.dimming = Math.min(100, Math.max(0, action.payload));
    },
    setDarkModeBlurAmount: (state, action: PayloadAction<number>) => {
      state.theme.darkModeSettings.blurAmount = Math.min(20, Math.max(0, action.payload));
    },

    // Layout actions
    toggleSidebar: (state) => {
      state.layout.sidebarCollapsed = !state.layout.sidebarCollapsed;
    },
    setSidebarWidth: (state, action: PayloadAction<number>) => {
      state.layout.sidebarWidth = action.payload;
    },
    toggleCompactMode: (state) => {
      state.layout.compactMode = !state.layout.compactMode;
    },

    // Side panel actions
    openSidePanel: (state, action: PayloadAction<{ type: SidePanelType; data?: any }>) => {
      state.sidePanel.isOpen = true;
      state.sidePanel.type = action.payload.type;
      state.sidePanel.data = action.payload.data;
    },
    closeSidePanel: (state) => {
      state.sidePanel.isOpen = false;
      state.sidePanel.type = null;
      state.sidePanel.data = undefined;
    },
    toggleSidePanel: (state, action: PayloadAction<SidePanelType>) => {
      if (state.sidePanel.isOpen && state.sidePanel.type === action.payload) {
        state.sidePanel.isOpen = false;
        state.sidePanel.type = null;
      } else {
        state.sidePanel.isOpen = true;
        state.sidePanel.type = action.payload;
      }
    },
    setSidePanelWidth: (state, action: PayloadAction<number>) => {
      state.sidePanel.width = action.payload;
    },

    // Notification actions
    addNotification: (state, action: PayloadAction<Omit<NotificationItem, 'id' | 'timestamp'>>) => {
      const notification: NotificationItem = {
        ...action.payload,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
      };
      state.notifications.unshift(notification);
      
      // حداکثر 50 اطلاع‌رسانی نگه داریم
      if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50);
      }
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    markNotificationAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    },
    markAllNotificationsAsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.read = true;
      });
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
    removeDuplicateNotifications: (state) => {
      const seen = new Set();
      state.notifications = state.notifications.filter(notification => {
        if (seen.has(notification.id)) {
          return false;
        }
        seen.add(notification.id);
        return true;
      });
    },
    
    // Archive actions
    archiveNotification: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.archived = true;
      }
    },
    archiveNotifications: (state, action: PayloadAction<string[]>) => {
      action.payload.forEach(id => {
        const notification = state.notifications.find(n => n.id === id);
        if (notification) {
          notification.archived = true;
        }
      });
    },
    unarchiveNotification: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.archived = false;
      }
    },
    unarchiveNotifications: (state, action: PayloadAction<string[]>) => {
      action.payload.forEach(id => {
        const notification = state.notifications.find(n => n.id === id);
        if (notification) {
          notification.archived = false;
        }
      });
    },
    toggleNotificationStar: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.starred = !notification.starred;
      }
    },
    starNotifications: (state, action: PayloadAction<string[]>) => {
      action.payload.forEach(id => {
        const notification = state.notifications.find(n => n.id === id);
        if (notification) {
          notification.starred = true;
        }
      });
    },
    unstarNotifications: (state, action: PayloadAction<string[]>) => {
      action.payload.forEach(id => {
        const notification = state.notifications.find(n => n.id === id);
        if (notification) {
          notification.starred = false;
        }
      });
    },

    // General UI actions
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    // در بخش setLanguage، تغییرات زیر را اعمال می‌کنیم
    setLanguage: (state, action: PayloadAction<'fa' | 'en' | 'ar'>) => {
      console.log('setLanguage action dispatched:', action.payload);
      state.language = action.payload;
      // فارسی و عربی هر دو rtl هستند
      state.direction = action.payload === 'en' ? 'ltr' : 'rtl';
      
      // اعمال مستقیم تغییرات به DOM برای اطمینان از اعمال فوری
      try {
        document.documentElement.dir = state.direction;
        document.documentElement.lang = state.language;
        
        if (state.direction === 'rtl') {
          document.documentElement.classList.add('rtl');
          document.documentElement.classList.remove('ltr');
        } else {
          document.documentElement.classList.add('ltr');
          document.documentElement.classList.remove('rtl');
        }
        console.log('Language changed directly in reducer:', state.language, state.direction);
      } catch (error) {
        console.error('Error applying language changes in reducer:', error);
      }
    },
    toggleFullscreen: (state) => {
      state.fullscreen = !state.fullscreen;
    },
    
    // بازگشت به تنظیمات پیش‌فرض
    resetToDefaultSettings: (state) => {
      state.theme.mode = initialState.theme.mode;
      state.theme.primaryColor = initialState.theme.primaryColor;
      state.theme.backgroundTheme = initialState.theme.backgroundTheme;
      state.theme.fontSize = initialState.theme.fontSize;
      state.theme.highContrast = initialState.theme.highContrast;
      state.theme.reducedMotion = initialState.theme.reducedMotion;
      state.theme.darkModeSettings = { ...initialState.theme.darkModeSettings };
      state.header = { ...initialState.header };
      state.dashboardModules = { ...initialState.dashboardModules };
      // حفظ زبان و جهت به حالت فعلی
    },
    
    // Splash screen actions
    setSplashScreenCompleted: (state, action: PayloadAction<boolean>) => {
      state.splashScreen.completed = action.payload;
    },
    setSplashScreenLoading: (state, action: PayloadAction<boolean>) => {
      state.splashScreen.loading = action.payload;
    },

    // تنظیمات نمودار
    setChartSymbolSize: (state, action: PayloadAction<number>) => {
      state.chart.symbolSize = action.payload;
    },
    setChartFontSize: (state, action: PayloadAction<number>) => {
      state.chart.fontSize = action.payload;
    },
    setChartStandard: (state, action: PayloadAction<ChartStandard>) => {
      state.chart.standard = action.payload;
    },
    toggleUseLegacySymbols: (state, action: PayloadAction<boolean>) => {
      state.chart.useLegacySymbols = action.payload;
    },
    toggleShowPersonnelCount: (state, action: PayloadAction<boolean>) => {
      state.chart.showPersonnelCount = action.payload;
    },
    toggleShowUnitStatus: (state, action: PayloadAction<boolean>) => {
      state.chart.showUnitStatus = action.payload;
    },
    toggleShowCommanderInfo: (state, action: PayloadAction<boolean>) => {
      state.chart.showCommanderInfo = action.payload;
    },
    resetChartSettings: (state) => {
      state.chart = initialState.chart;
    },
  },
});

export const {
  // Theme actions
  setThemeMode,
  setPrimaryColor,
  setBackgroundTheme,
  setCustomTheme,
  setFontSize,
  toggleHighContrast,
  toggleReducedMotion,
  updateHeaderSettings,
  updateDashboardModules,
  setDarkModeAccentColor,
  setDarkModeContrastLevel,
  toggleDarkModePureBlack,
  setDarkModeDimming,
  setDarkModeBlurAmount,
  
  // Layout actions
  toggleSidebar,
  setSidebarWidth,
  toggleCompactMode,
  
  // Side panel actions
  openSidePanel,
  closeSidePanel,
  toggleSidePanel,
  setSidePanelWidth,
  
  // Notification actions
  addNotification,
  removeNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearAllNotifications,
  removeDuplicateNotifications,
  
  // Archive actions
  archiveNotification,
  archiveNotifications,
  unarchiveNotification,
  unarchiveNotifications,
  toggleNotificationStar,
  starNotifications,
  unstarNotifications,
  
  // General UI actions
  setLoading,
  setLanguage,
  toggleFullscreen,
  resetToDefaultSettings,
  
  // Splash screen actions
  setSplashScreenCompleted,
  setSplashScreenLoading,

  // Chart actions
  setChartSymbolSize,
  setChartFontSize,
  setChartStandard,
  toggleUseLegacySymbols,
  toggleShowPersonnelCount,
  toggleShowUnitStatus,
  toggleShowCommanderInfo,
  resetChartSettings,
} = uiSlice.actions;

// Helper actions
export const showInfoNotification = (message: string) => {
  return addNotification({
    title: 'اطلاع‌رسانی',
    message,
    type: 'info',
    read: false,
    priority: 'medium',
  });
};

export const showSuccessNotification = (message: string) => {
  return addNotification({
    title: 'موفقیت',
    message,
    type: 'success',
    read: false,
    priority: 'medium',
  });
};

export const showWarningNotification = (message: string) => {
  return addNotification({
    title: 'هشدار',
    message,
    type: 'warning',
    read: false,
    priority: 'high',
  });
};

export const showErrorNotification = (message: string) => {
  return addNotification({
    title: 'خطا',
    message,
    type: 'error',
    read: false,
    priority: 'high',
  });
};

// Selectors
export const selectTheme = (state: RootState) => state.ui.theme;
export const selectLayout = (state: RootState) => state.ui.layout;
export const selectSidePanel = (state: RootState) => state.ui.sidePanel;
export const selectNotifications = (state: RootState) => state.ui.notifications;
export const selectHeaderSettings = (state: RootState) => state.ui.header;
export const selectDashboardModules = (state: RootState) =>
  state.ui.dashboardModules || DEFAULT_DASHBOARD_MODULES;

// استفاده از createSelector برای بهینه‌سازی سلکتور و جلوگیری از رندر مجدد غیرضروری
export const selectUnreadNotifications = createSelector(
  [selectNotifications],
  (notifications) => Array.isArray(notifications) ? notifications.filter(n => !n.read) : []
);

// Archive selectors
export const selectArchivedNotifications = createSelector(
  [selectNotifications],
  (notifications) => Array.isArray(notifications) ? notifications.filter(n => n.archived) : []
);

export const selectActiveNotifications = createSelector(
  [selectNotifications],
  (notifications) => Array.isArray(notifications) ? notifications.filter(n => !n.archived) : []
);

export const selectStarredNotifications = createSelector(
  [selectNotifications],
  (notifications) => Array.isArray(notifications) ? notifications.filter(n => n.starred) : []
);

export const selectNotificationStats = createSelector(
  [selectNotifications, selectUnreadNotifications, selectArchivedNotifications, selectStarredNotifications],
  (all, unread, archived, starred) => ({
    total: all.length,
    unread: unread.length,
    read: all.length - unread.length,
    archived: archived.length,
    active: all.length - archived.length,
    starred: starred.length,
  })
);

export const selectUI = (state: RootState) => state.ui;

export const selectSplashScreen = (state: RootState) => state.ui.splashScreen;

export default uiSlice.reducer; 
