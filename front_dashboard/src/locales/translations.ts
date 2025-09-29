// فایل ترجمه‌های متون برنامه
// این فایل شامل ترجمه‌های تمام متن‌های برنامه به زبان‌های مختلف است

import { masterDefinitionTranslations } from './masterDefinitionTranslations';

export type SupportedLanguage = 'fa' | 'en' | 'ar';

export const translations = {
  fa: {
    // Common translations
    common: {
      all: 'همه',
      actions: 'عملیات',
      save: 'ذخیره',
      cancel: 'انصراف',
      edit: 'ویرایش',
      delete: 'حذف',
      add: 'افزودن',
      search: 'جستجو',
      filter: 'فیلتر',
      status: 'وضعیت',
      rowsPerPage: 'تعداد ردیف در صفحه',
    },
    // Settings Panel
    settings: {
      title: 'تنظیمات کلی',
      description: 'رابط کاربری خود را مطابق با سلیقه شخصی‌تان تنظیم کنید',
      themeMode: 'حالت تم',
      auto: 'خودکار',
      dark: 'تاریک',
      light: 'روشن',
      primaryColor: 'رنگ اصلی',
      darkModeSettings: 'تنظیمات حالت تاریک',
      contrastLevel: 'شدت کنتراست',
      dimming: 'میزان تیرگی',
      blurAmount: 'میزان بلور (Blur)',
      highContrast: 'کنتراست بالا',
      reducedMotion: 'کاهش انیمیشن',
      accessibility: 'دسترسی',
      pureBlack: 'استفاده از سیاه خالص (برای نمایشگرهای OLED)',
      accentColor: 'رنگ تأکیدی (اکسنت)',
      fontSize: 'اندازه فونت',
      large: 'بزرگ',
      medium: 'متوسط',
      small: 'کوچک',
      languageSelection: 'انتخاب زبان',
      persian: 'فارسی',
      arabic: 'العربیه',
      english: 'English',
      currentLanguage: 'زبان فعلی: فارسی',
      currentMode: 'حالت فعلی',
      selectedColor: 'رنگ انتخابی',
      currentSize: 'اندازه فعلی',
      resetToDefault: 'بازنشانی به حالت پیش‌فرض',
      allSettings: 'همه ی تنظیمات',
      advancedSettings: 'تنظیمات پیشرفته',
      chartSettingsTitle: 'تنظیمات نمودار سازمانی',
      symbolStandard: 'استاندارد نمادها',
      app6d: 'APP-6D (ناتو)',
      milstd2525d: 'MIL-STD-2525D (آمریکا)',
      milstd2525c: 'MIL-STD-2525C (آمریکا)',
      symbolSize: 'اندازه نماد',
      colors: {
        red: 'قرمز',
        blue: 'آبی',
        green: 'سبز',
        orange: 'نارنجی',
        purple: 'بنفش',
        cyan: 'فیروزه‌ای',
        lightGreen: 'سبز روشن',
        pink: 'صورتی',
        deepPurple: 'بنفش تیره',
        navy: 'سرمه‌ای',
        slate: 'خاکستری آبی',
        lavender: 'یاسی روشن',
      },
    },
    // Menu items
    menu: {
      dashboard: 'داشبورد',
      map: 'کالک نگار',
      scenarios: 'سناریوها',
      resources: 'منابع',

      definitionEditor: 'ویرایشگر تعاریف',
      militarySymbolGenerator: 'تولید نماد نظامی',
      users: 'کاربران',
      userManagement: 'مدیریت کاربران',
      resourceManagement: 'مدیریت منابع',
      settings: 'تنظیمات',
      help: 'راهنما',
    },
    layout: {
      searchPlaceholder: 'جستجو در سیستم...',
      helpTooltip: 'راهنما',
      notificationsTooltip: 'اعلان‌ها',
      settingsTooltip: 'تنظیمات',
      userProfileTooltip: 'پروفایل کاربری',
      notificationsTitle: 'اعلان‌ها',
      noNewNotifications: 'اعلان جدیدی وجود ندارد',
      viewAllNotifications: 'مشاهده همه اعلان‌ها',
    },
    dashboard: {
      stats: {
        activeScenarios: 'سناریوهای فعال',
        availableForces: 'نیروهای موجود',
        ongoingOperations: 'عملیات در حال اجرا',
        securityAlerts: 'هشدارهای امنیتی',
        activeScenariosSubtitle: '{activePercent}% فعال | {inactiveCount} غیرفعال',
        availableForcesSubtitle: '{iranianPercent}% ایرانی | {foreignPercent}% خارجی',
        ongoingOperationsSubtitle: '{commanderCount} فرمانده | {operatorCount} اپراتور | {viewerCount} بیننده',
        securityAlertsSubtitle: '{todayPercent}% امروز | {weekCount} این هفته',
        todayAlerts: 'هشدارهای امروز:',
        alertItems: 'مورد',
        today: 'امروز',
        thisWeek: 'این هفته',
        thisMonth: 'این ماه',
        commander: 'فرمانده',
        operator: 'اپراتور',
        viewer: 'بیننده',
        iranian: 'ایرانی',
        foreign: 'خارجی',
        iran: 'ایران',
        otherCountries: 'کشورهای دیگر',
        totalScenarios: 'کل سناریوها',
        active: 'فعال',
        inactive: 'غیرفعال',
      },
      welcome: {
        title: 'خوش آمدید',
        message: 'سلام {name}، به سیستم ساجد خوش آمدید!',
      },
      activities: {
        newScenario: 'سناریوی جدید ایجاد شد',
        newScenarioDesc: 'عملیات دفاع ساحلی - جنوب',
        forceMoved: 'نیرو منتقل شد',
        forceMovedDesc: 'انتقال تیپ ۲۱ به منطقه عملیاتی',
        mapUpdated: 'به‌روزرسانی نقشه',
        mapUpdatedDesc: 'اطلاعات جدید دشمن دریافت شد',
        securityReport: 'گزارش امنیتی',
        securityReportDesc: 'بررسی تهدیدات منطقه شمال',
        newUser: 'کاربر جدید اضافه شد',
        newUserDesc: 'سروان محمدی با نقش اپراتور',
        readinessReport: 'گزارش آمادگی نیروها',
        readinessReportDesc: 'گردان ۱۰۱ پیاده - آمادگی ۹۰٪',
        time: {
          minutes: '{count} دقیقه پیش',
          hours: '{count} ساعت پیش',
        },
      },
      quickActions: {
        newScenario: 'سناریوی جدید',
        viewMap: 'مشاهده نقشه',
        reporting: 'گزارش‌گیری',
        settings: 'تنظیمات',
        userManagement: 'مدیریت کاربران',
        securityAlerts: 'هشدارهای امنیتی',
        orbatMapper: 'نقشه‌کش آرایش نبرد',
      },
      systemStatus: {
        title: 'وضعیت سیستم',
        disk: 'دیسک',
        network: 'شبکه',
      },
      recentActivities: 'فعالیت‌های اخیر',
      viewAllActivities: 'مشاهده همه فعالیت‌ها',
      quickAccess: 'دسترسی سریع',
      importantNotices: 'اطلاعیه‌های مهم',
      alerts: {
        securityThreat: 'تهدید امنیتی در منطقه شمال شناسایی شد',
        systemUpdate: 'به‌روزرسانی سیستم در تاریخ ۱۴۰۲/۰۸/۱۵',
        trainingSuccess: 'عملیات آموزشی با موفقیت به پایان رسید',
      },
      notifications: {
        archiveAllSuccess: 'همه فعالیت‌ها آرشیو شدند',
        unarchiveAllSuccess: 'آرشیو همه فعالیت‌ها لغو شد',
        starAllSuccess: 'همه فعالیت‌ها ستاره‌دار شدند',
        unstarAllSuccess: 'ستاره‌دار کردن همه فعالیت‌ها لغو شد',
      },
      tooltips: {
        update: 'بروزرسانی',
        settings: 'تنظیمات',
        star: 'ستاره',
        archive: 'آرشیو',
      },
      menu: {
        archiveAll: 'آرشیو همه',
        starAll: 'ستاره‌دار کردن همه',
        unarchiveAll: 'لغو آرشیو همه',
        unstarAll: 'لغو ستاره‌دار کردن همه',
        deselectAll: 'لغو انتخاب همه'  // ترجمه جدید
      }
    },
    scenarios: {
      pageTitle: 'سناریوها',
      pageDescription: 'مدیریت سناریوهای عملیاتی و شبیه‌سازی',
      loading: 'در حال بارگذاری سناریوها...',
      errorLoading: 'خطا در بارگذاری سناریوها',
      notFound: 'سناریو یافت نشد',
      backToList: 'بازگشت به فهرست سناریوها',

      // وضعیت‌ها
      status: {
        draft: 'پیش‌نویس',
        active: 'فعال',
        paused: 'متوقف',
        completed: 'تکمیل شده',
        archived: 'بایگانی شده'
      },

      // اجرای سناریو
      execution: {
        start: 'شروع اجرا',
        pause: 'توقف',
        resume: 'ادامه',
        stop: 'پایان',
        startSuccess: 'اجرای سناریو شروع شد',
        pauseSuccess: 'اجرای سناریو متوقف شد',
        resumeSuccess: 'اجرای سناریو ادامه یافت',
        stopSuccess: 'اجرای سناریو پایان یافت',
        error: 'خطا در تغییر وضعیت اجرای سناریو',
        stopError: 'خطا در پایان دادن به اجرای سناریو'
      },

      // تب‌ها
      tabs: {
        timeline: 'خط زمانی',
        map: 'نقشه',
        units: 'واحدها',
        phases: 'فازها',
        environment: 'شرایط محیطی',
        analysis: 'تحلیل',
        settings: 'تنظیمات'
      },

      // صفحه جزئیات سناریو
      detail: {
        startTime: 'زمان شروع',
        endTime: 'زمان پایان',
        created: 'ایجاد شده',
        lastModified: 'آخرین ویرایش',
        objectives: 'اهداف',
        noObjectives: 'اهدافی تعریف نشده است'
      },

      // آنالیز سناریو
      analysis: {
        title: 'تحلیل سناریو',
        typeTitle: 'نوع تحلیل',
        resultsTitle: 'نتایج تحلیل',
        runButton: 'اجرای تحلیل',
        success: 'تحلیل با موفقیت انجام شد',
        error: 'خطا در اجرای تحلیل',
        noResults: 'هنوز تحلیلی انجام نشده است',
        chartTitle: 'نمودار تحلیل',
        statisticsTitle: 'آمار کلیدی',
        effectiveness: 'اثربخشی',
        probability: 'احتمال موفقیت',
        risk: 'سطح ریسک',
        conclusionsTitle: 'نتیجه‌گیری‌ها',
        recommendationsTitle: 'پیشنهادات',

        types: {
          force_ratio: 'نسبت نیرو',
          casualty_prediction: 'پیش‌بینی تلفات',
          mission_success: 'احتمال موفقیت عملیات',
          terrain_advantage: 'مزیت زمین',
          supply_efficiency: 'کارایی تدارکات',
          command_effectiveness: 'اثربخشی فرماندهی'
        }
      },

      // فازهای سناریو
      phases: {
        title: 'فازهای سناریو',
        addPhase: 'افزودن فاز',
        noPhases: 'هیچ فازی تعریف نشده است',
        noEndTime: 'نامشخص',
        objectives: 'اهداف',
        tasks: 'وظایف',
        noTasks: 'هیچ وظیفه‌ای تعریف نشده است',

        status: {
          planned: 'برنامه‌ریزی شده',
          in_progress: 'در حال اجرا',
          completed: 'تکمیل شده',
          failed: 'ناموفق',
          cancelled: 'لغو شده'
        }
      },

      // شرایط محیطی
      environmental: {
        title: 'شرایط محیطی',
        addCondition: 'افزودن شرایط محیطی',
        noConditions: 'هیچ شرایط محیطی تعریف نشده است',
        ongoing: 'ادامه دارد',
        value: 'مقدار',

        types: {
          weather: 'وضعیت آب و هوا',
          visibility: 'دید',
          temperature: 'دما',
          precipitation: 'بارندگی',
          wind: 'باد',
          time_of_day: 'زمان روز',
          season: 'فصل',
          terrain_condition: 'وضعیت زمین'
        }
      },

      // خط زمانی رویدادها
      timeline: {
        title: 'خط زمانی رویدادها',
        description: 'نمایش رویدادهای سناریو در خط زمان'
      },

      // نقشه
      map: {
        title: 'نقشه سناریو',
        description: 'نمایش نقشه و موقعیت واحدها'
      },

      // واحدها
      units: {
        title: 'واحدهای نظامی',
        description: 'مدیریت واحدهای نظامی سناریو'
      },

      // تنظیمات
      settings: {
        title: 'تنظیمات سناریو',
        description: 'تغییر تنظیمات پیشرفته سناریو'
      },

      // اکشن‌ها
      actions: {
        save: 'ذخیره تغییرات',
        export: 'خروجی گرفتن',
        import: 'وارد کردن'
      },

      // نوار ابزار
      toolbar: {
        searchPlaceholder: 'جستجوی سناریو',
        statusFilter: 'فیلتر وضعیت',
        allStatuses: 'همه وضعیت‌ها',
        newScenarioButton: 'سناریوی جدید'
      },

      // منو
      menu: {
        viewDetails: 'مشاهده جزئیات',
        edit: 'ویرایش',
        delete: 'حذف'
      },

      // جدول
      table: {
        name: 'نام',
        status: 'وضعیت',
        startTime: 'زمان شروع',
        endTime: 'زمان پایان',
        objectives: 'اهداف',
        actions: 'عملیات',
        noMatch: 'هیچ سناریویی با فیلترهای انتخاب شده یافت نشد',
        noScenarios: 'هنوز سناریویی ایجاد نشده است'
      },

      // دیالوگ‌ها
      dialog: {
        createTitle: 'ایجاد سناریوی جدید',
        editTitle: 'ویرایش سناریو',
        nameLabel: 'نام سناریو',
        statusLabel: 'وضعیت',
        descriptionLabel: 'توضیحات',
        startTimeLabel: 'زمان شروع',
        endTimeLabel: 'زمان پایان',
        objectivesLabel: 'اهداف',
        objectivesPlaceholder: 'هر هدف را در یک خط وارد کنید',
        objectivesHelper: 'اهداف اصلی سناریو را وارد کنید (هر هدف در یک خط)',
        cancelButton: 'انصراف',
        saveButton: 'ذخیره',
        createButton: 'ایجاد'
      },

      // دیالوگ حذف
      deleteDialog: {
        title: 'حذف سناریو',
        message: 'آیا از حذف سناریوی "{name}" اطمینان دارید؟',
        warning: 'این عملیات غیرقابل بازگشت است',
        cancelButton: 'انصراف',
        confirmButton: 'حذف'
      },

      // آمار
      stats: {
        total: 'کل سناریوها',
        active: 'فعال',
        completed: 'تکمیل شده',
        draft: 'پیش‌نویس'
      },

      // اعلان‌ها
      notifications: {
        createSuccess: 'سناریو با موفقیت ایجاد شد',
        createError: 'خطا در ایجاد سناریو',
        updateSuccess: 'سناریو با موفقیت به‌روزرسانی شد',
        updateError: 'خطا در به‌روزرسانی سناریو',
        deleteSuccess: 'سناریو با موفقیت حذف شد',
        deleteError: 'خطا در حذف سناریو'
      }
    },
    resources: {
      pageTitle: 'مدیریت منابع',
      tabs: {
        personnel: 'اشخاص',
        equipment: 'تجهیزات و سامانه‌ها',
        ammunition: 'مهمات',
        logistics: 'لجستیک',
        ranks: 'رده‌ها',
        maps: 'نقشه‌ها',
      },
      personnel: {
        title: 'مدیریت اشخاص',
        addNew: 'افزودن شخص جدید',
        addTitle: 'افزودن شخص جدید',
        editTitle: 'ویرایش اطلاعات شخص',
        searchPlaceholder: 'جستجو در اشخاص...',
        statusFilter: 'فیلتر وضعیت',
        totalCount: 'تعداد کل',
        fields: {
          personalCode: 'کد پرسنلی',
          fullName: 'نام و نام خانوادگی',
          rank: 'درجه',
          unit: 'یگان',
          position: 'سمت',
          status: 'وضعیت',
        },
      },
      equipment: {
        title: 'مدیریت تجهیزات و سامانه‌ها',
        addNew: 'افزودن تجهیز جدید',
        addTitle: 'افزودن تجهیز جدید',
        editTitle: 'ویرایش اطلاعات تجهیز',
        searchPlaceholder: 'جستجو در تجهیزات...',
        statusFilter: 'فیلتر وضعیت',
        categoryFilter: 'فیلتر دسته‌بندی',
        totalCount: 'تعداد کل',
        fields: {
          equipmentCode: 'کد تجهیز',
          name: 'نام تجهیز',
          category: 'دسته‌بندی',
          serialNumber: 'شماره سریال',
          assignedUnit: 'یگان تحویل‌گیرنده',
          status: 'وضعیت',
        },
      },
      ammunition: {
        title: 'مدیریت مهمات',
        addNew: 'افزودن مهمات جدید',
        addTitle: 'افزودن مهمات جدید',
        editTitle: 'ویرایش اطلاعات مهمات',
        searchPlaceholder: 'جستجو در مهمات...',
        statusFilter: 'فیلتر وضعیت',
        categoryFilter: 'فیلتر دسته‌بندی',
        totalCount: 'تعداد کل',
        fields: {
          ammunitionCode: 'کد مهمات',
          name: 'نام مهمات',
          caliber: 'کالیبر',
          quantity: 'مقدار',
          storageLocation: 'محل انبارداری',
          status: 'وضعیت',
        },
      },
      logistics: {
        title: 'مدیریت لجستیک',
        addNew: 'افزودن کالای جدید',
        addTitle: 'افزودن کالای جدید',
        editTitle: 'ویرایش اطلاعات کالا',
        searchPlaceholder: 'جستجو در کالاها...',
        statusFilter: 'فیلتر وضعیت',
        categoryFilter: 'فیلتر دسته‌بندی',
        totalCount: 'تعداد کل',
        fields: {
          itemCode: 'کد کالا',
          name: 'نام کالا',
          category: 'دسته‌بندی',
          quantity: 'مقدار',
          storageLocation: 'محل انبارداری',
          status: 'وضعیت',
        },
      },
      ranks: {
        title: 'مدیریت رده‌ها',
        addNew: 'افزودن رده جدید',
        addTitle: 'افزودن رده جدید',
        editTitle: 'ویرایش اطلاعات رده',
        searchPlaceholder: 'جستجو در رده‌ها...',
        statusFilter: 'فیلتر وضعیت',
        categoryFilter: 'فیلتر دسته‌بندی',
        totalCount: 'تعداد کل',
        fields: {
          rankCode: 'کد رده',
          name: 'نام رده',
          category: 'دسته‌بندی',
          level: 'سطح',
          payGrade: 'گروه حقوقی',
          status: 'وضعیت',
        },
        categories: {
          armor: 'زرهی',
          transport: 'ترابری',
          artillery: 'توپخانه',
          air_defense: 'پدافند هوایی',
          engineer: 'مهندسی',
          aircraft: 'هواپیما',
          helicopter: 'هلیکوپتر',
          naval: 'دریایی',
          missile: 'موشکی',
          electronic: 'الکترونیکی',
        }
      },
      equipmentAssignment: {
        selectUnitTitle: 'انتخاب واحد برای تخصیص تجهیزات',
        unitLabel: 'واحد مورد نظر',
        unitPlaceholder: 'واحدی را انتخاب کنید...',
        selectedUnit: 'واحد انتخاب شده',
        currentEquipment: 'تجهیزات فعلی',
        types: 'نوع',
        assignableEquipmentTitle: 'تجهیزات کلی قابل تخصیص',
        searchPlaceholder: 'جستجو...',
        assignedEquipmentTitle: 'تجهیزات تخصیص داده شده',
        authorizedCount: 'تعداد مجاز',
        onHand: 'موجود',
        dialog: {
          title: 'تخصیص {equipmentName} به {unitName}',
          authorizedCountLabel: 'تعداد مجاز',
          onHandLabel: 'تعداد موجود',
          cancelButton: 'انصراف',
          assignButton: 'تخصیص',
        }
      },
      equipmentInventory: {
        searchPlaceholder: 'جستجو در تجهیزات...',
        categoryLabel: 'دسته‌بندی',
        allCategories: 'همه دسته‌ها',
        addButton: 'افزودن تجهیزات جدید',
        cardView: 'نمای کارت',
        tableView: 'نمای جدول',
        yearOfManufacture: 'سال ساخت',
        deleteConfirm: 'آیا از حذف این تجهیزات اطمینان دارید؟',
        tooltips: {
          details: 'جزئیات',
          edit: 'ویرایش',
          delete: 'حذف',
        },
        table: {
          image: 'تصویر',
          name: 'نام',
          category: 'دسته‌بندی',
          manufacturer: 'سازنده',
          country: 'کشور سازنده',
          year: 'سال ساخت',
          actions: 'عملیات',
        },
        dialog: {
          addTitle: 'افزودن تجهیزات جدید',
          editTitle: 'ویرایش تجهیزات',
          nameLabel: 'نام تجهیزات',
          categoryLabel: 'دسته‌بندی',
          descriptionLabel: 'توضیحات',
          manufacturerLabel: 'سازنده',
          countryLabel: 'کشور سازنده',
          yearLabel: 'سال ساخت',
          uploadButton: 'آپلود تصویر',
          cancelButton: 'انصراف',
          addButton: 'افزودن',
          saveButton: 'ذخیره تغییرات',
        }
      },
      maps: {
        serverLayersTitle: 'لایه‌های نقشه سرور',
        addFromServerButton: 'افزودن از سرور',
        type: 'نوع',
        url: 'آدرس',
        opacityTooltip: 'تنظیم شفافیت',
        noServerLayers: 'هیچ لایه نقشه‌ای از سرور اضافه نشده است',
        uploadedLayersTitle: 'لایه‌های آپلود شده',
        uploadFileButton: 'آپلود فایل',
        vector: 'برداری',
        raster: 'رستری',
        format: 'فرمت',
        unknownFormat: 'نامشخص',
        noUploadedLayers: 'هیچ فایل نقشه‌ای آپلود نشده است',
        summaryTitle: 'خلاصه لایه‌ها',
        totalLayers: 'کل لایه‌ها',
        activeLayers: 'لایه‌های فعال',
        serverLayers: 'لایه‌های سرور',
        deleteConfirm: 'آیا از حذف این لایه نقشه اطمینان دارید؟',
        dialog: {
          addFromServerTitle: 'افزودن لایه از سرور',
          uploadFileTitle: 'آپلود فایل نقشه',
          layerNameLabel: 'نام لایه',
          serviceTypeLabel: 'نوع سرویس',
          serverUrlLabel: 'آدرس سرور',
          layersLabel: 'لایه‌ها',
          fileTypeLabel: 'نوع فایل',
          selectFileButton: 'انتخاب فایل',
          selectedFile: 'فایل انتخاب شده',
          cancelButton: 'انصراف',
          addButton: 'افزودن',
          uploadButton: 'آپلود',
        }
      }
    },
    // Users Module
    users: {
      pageTitle: 'مدیریت کاربران',
      pageDescription: 'مدیریت و سازماندهی کاربران سیستم',
      addUser: 'افزودن کاربر جدید',
      searchPlaceholder: 'جستجو در کاربران...',
      noUsers: 'هیچ کاربری یافت نشد',
      loading: 'در حال بارگذاری...',
      
      // نمایش و عملیات
      viewMode: {
        table: 'نمایش جدولی',
        card: 'نمایش کارتی',
        tableTooltip: 'نمایش جدولی',
        cardTooltip: 'نمایش کارتی'
      },
      
      // فیلترها
      filters: {
        title: 'فیلترها و جستجو',
        clearAll: 'پاک کردن فیلترها',
        search: 'جستجو',
        status: 'وضعیت',
        role: 'نقش',
        accessLevel: 'سطح دسترسی',
        nationality: 'تابعیت',
        all: 'همه'
      },
      
      // جدول کاربران
      table: {
        rowNumber: 'ردیف',
        userCode: 'کد کاربری',
        fullName: 'نام و نام خانوادگی',
        nationality: 'تابعیت',
        role: 'نقش',
        accessLevel: 'سطح دسترسی',
        status: 'وضعیت',
        actions: 'عملیات'
      },
      
      // عملیات سریع
      quickActions: {
        title: 'تغییرات فوری',
        changePassword: 'تغییر رمز عبور',
        changePasswordDesc: 'تنظیم رمز عبور جدید برای کاربر',
        updateAccess: 'تغییر سطح دسترسی',
        updateAccessDesc: 'ویرایش نقش و سطح دسترسی کاربر',
        toggleActive: 'تغییر وضعیت',
        activateUser: 'فعال کردن کاربر',
        deactivateUser: 'غیرفعال کردن کاربر',
        activateDesc: 'کاربر قادر به ورود خواهد بود',
        deactivateDesc: 'کاربر قادر به ورود نخواهد بود',
        
        // فرم تغییر رمز
        passwordForm: {
          newPassword: 'رمز عبور جدید',
          confirmPassword: 'تکرار رمز عبور جدید',
          passwordMismatch: 'رمز عبور و تکرار آن یکسان نیستند',
          passwordRequirements: 'رمز عبور جدید باید حداقل ۸ کاراکتر و شامل حروف، اعداد و نمادها باشد.'
        },
        
        // فرم تغییر دسترسی
        accessForm: {
          systemRole: 'نقش سیستمی',
          accessLevel: 'سطح دسترسی',
          currentPermissions: 'مجوزهای فعلی',
          accessWarning: 'تغییر سطح دسترسی بر روی قابلیت‌های کاربر تأثیر خواهد گذاشت.'
        },
        
        // تأیید تغییر وضعیت
        statusConfirm: {
          user: 'کاربر',
          userCode: 'کد کاربری',
          role: 'نقش',
          currentStatus: 'وضعیت فعلی',
          deactivateWarning: 'با غیرفعال کردن این کاربر، وی قادر به ورود به سیستم نخواهد بود.',
          activateInfo: 'با فعال کردن این کاربر، وی قادر به ورود به سیستم خواهد بود.'
        },
        
        // دکمه‌ها
        buttons: {
          back: 'بازگشت',
          cancel: 'انصراف',
          confirm: 'تأیید',
          processing: 'در حال انجام...'
        }
      },
      
      // اکشن‌های عمومی
      actions: {
        view: 'مشاهده جزئیات',
        edit: 'ویرایش',
        delete: 'حذف',
        quickActions: 'تغییرات فوری'
      },
      
      status: {
        active: 'فعال',
        inactive: 'غیرفعال',
        pending: 'در انتظار',
        suspended: 'معلق'
      },
      form: {
        personalInfo: 'اطلاعات شخصی',
        contactInfo: 'اطلاعات تماس',
        legalInfo: 'اطلاعات حقوقی',
        fullName: 'نام و نام خانوادگی',
        nationalId: 'شماره ملی',
        gender: 'جنسیت',
        nationality: 'تابعیت',
        birthDate: 'تاریخ تولد',
        mobile: 'شماره موبایل',
        email: 'ایمیل',
        address: 'آدرس',
        postalCode: 'کد پستی',
        status: 'وضعیت',
        isActive: 'کاربر فعال'
      }
    },
    // Resources Module  
    resourcesModule: {
      pageTitle: 'مدیریت منابع',
      pageDescription: 'مدیریت و سازماندهی منابع',
      addResource: 'افزودن منبع جدید',
      searchPlaceholder: 'جستجو در منابع...',
      noResources: 'هیچ منبعی یافت نشد',
      loading: 'در حال بارگذاری...',
      status: {
        keyPersons: 'اشخاص کلیدی',
        military: 'نظامی',
        civilian: 'غیرنظامی'
      },
      subStatus: {
        alive: 'زنده',
        martyr: 'شهید',
        injured: 'آسیب دیده'
      }
    }
  },
  en: {
    // Settings Panel
    settings: {
      title: 'General Settings',
      description: 'Customize your user interface to your personal taste',
      themeMode: 'Theme Mode',
      auto: 'Auto',
      dark: 'Dark',
      light: 'Light',
      primaryColor: 'Primary Color',
      darkModeSettings: 'Dark Mode Settings',
      contrastLevel: 'Contrast Level',
      dimming: 'Dimming Amount',
      blurAmount: 'Blur Amount',
      highContrast: 'High Contrast',
      reducedMotion: 'Reduce Motion',
      accessibility: 'Accessibility',
      pureBlack: 'Use pure black (for OLED displays)',
      accentColor: 'Accent Color',
      fontSize: 'Font Size',
      large: 'Large',
      medium: 'Medium',
      small: 'Small',
      languageSelection: 'Language Selection',
      persian: 'فارسی',
      arabic: 'العربیه',
      english: 'English',
      currentLanguage: 'Current language: English',
      currentMode: 'Current Mode',
      selectedColor: 'Selected Color',
      currentSize: 'Current Size',
      resetToDefault: 'Reset to Default',
      allSettings: 'All Settings',
      advancedSettings: 'Advanced Settings',
      chartSettingsTitle: 'Organizational Chart Settings',
      symbolStandard: 'Symbol Standard',
      app6d: 'APP-6D (NATO)',
      milstd2525d: 'MIL-STD-2525D (USA)',
      milstd2525c: 'MIL-STD-2525C (USA)',
      symbolSize: 'Symbol Size',
      colors: {
        red: 'Red',
        blue: 'Blue',
        green: 'Green',
        orange: 'Orange',
        purple: 'Purple',
        cyan: 'Cyan',
        lightGreen: 'Light Green',
        pink: 'Pink',
        deepPurple: 'Deep Purple',
        navy: 'Navy',
        slate: 'Slate',
        lavender: 'Lavender',
      },
    },
    // Menu items
    menu: {
      dashboard: 'Dashboard',
      map: 'Map View',
      scenarios: 'Scenarios',
      resources: 'Resources',

      definitionEditor: 'Definition Editor',
      militarySymbolGenerator: 'Military Symbol Generator',
      users: 'Users',
      settings: 'Settings',
      help: 'Help',
    },
    layout: {
      searchPlaceholder: 'Search in system...',
      helpTooltip: 'Help',
      notificationsTooltip: 'Notifications',
      settingsTooltip: 'Settings',
      userProfileTooltip: 'User Profile',
      notificationsTitle: 'Notifications',
      noNewNotifications: 'No new notifications',
      viewAllNotifications: 'View all notifications',
    },
    dashboard: {
      stats: {
        activeScenarios: 'Active Scenarios',
        availableForces: 'Available Forces',
        ongoingOperations: 'Ongoing Operations',
        securityAlerts: 'Security Alerts',
        activeScenariosSubtitle: '{activePercent}٪ active | {inactiveCount} inactive',
        availableForcesSubtitle: '{iranianPercent}٪ Iranian | {foreignPercent}٪ foreign',
        ongoingOperationsSubtitle: '{commanderCount} Cmdr. | {operatorCount} Op. | {viewerCount} Viewer',
        securityAlertsSubtitle: '{todayPercent}٪ today | {weekCount} this week',
        todayAlerts: 'Today\'s Alerts:',
        alertItems: 'items',
        today: 'Today',
        thisWeek: 'This Week',
        thisMonth: 'This Month',
        commander: 'Commander',
        operator: 'Operator',
        viewer: 'Viewer',
        iranian: 'Iranian',
        foreign: 'Foreign',
        iran: 'Iran',
        otherCountries: 'Other Countries',
        totalScenarios: 'Total Scenarios',
        active: 'Active',
        inactive: 'Inactive',
      },
      welcome: {
        title: 'Welcome',
        message: 'Hello {name}, welcome to the Sajed system!',
      },
      activities: {
        newScenario: 'New Scenario Created',
        newScenarioDesc: 'Coastal Defense Operation - South',
        forceMoved: 'Force Transferred',
        forceMovedDesc: 'Transfer of 21st Brigade to operational area',
        mapUpdated: 'Map Updated',
        mapUpdatedDesc: 'New enemy information received',
        securityReport: 'Security Report',
        securityReportDesc: 'Review of threats in the northern region',
        newUser: 'New User Added',
        newUserDesc: 'Captain Mohammadi with operator role',
        readinessReport: 'Force Readiness Report',
        readinessReportDesc: '101st Infantry Battalion - 90% readiness',
        time: {
          minutes: '{count} minutes ago',
          hours: '{count} hours ago',
        },
      },
      quickActions: {
        newScenario: 'New Scenario',
        viewMap: 'View Map',
        reporting: 'Reporting',
        settings: 'Settings',
        userManagement: 'User Management',
        securityAlerts: 'Security Alerts',
        orbatMapper: 'ORBAT Mapper',
      },
      systemStatus: {
        title: 'System Status',
        disk: 'Disk',
        network: 'Network',
      },
      recentActivities: 'Recent Activities',
      viewAllActivities: 'View all activities',
      quickAccess: 'Quick Access',
      importantNotices: 'Important Notices',
      alerts: {
        securityThreat: 'Security threat identified in the northern region',
        systemUpdate: 'System update on 2023-11-06',
        trainingSuccess: 'Training operation completed successfully',
      },
      tooltips: {
        update: 'Update',
        settings: 'Settings',
        star: 'Star',
        archive: 'Archive',
      },
      menu: {
        archiveAll: 'Archive All',
        starAll: 'Star All',
        unarchiveAll: 'Unarchive All',
        unstarAll: 'Unstar All',
        deselectAll: 'Deselect All'
      },
      notifications: {
        archiveAllSuccess: 'All activities have been archived',
        unarchiveAllSuccess: 'Archiving of all activities has been canceled',
        starAllSuccess: 'All activities have been starred',
        unstarAllSuccess: 'Starring of all activities has been canceled',
      }
    },
    scenarios: {
      pageTitle: 'Scenario Management',
      pageDescription: 'Create, edit, and manage operational scenarios',
      errorLoading: 'Error loading scenarios',
      status: {
        draft: 'Draft',
        active: 'Active',
        paused: 'Paused',
        completed: 'Completed',
      },
      stats: {
        total: 'Total Scenarios',
        active: 'Active',
        completed: 'Completed',
        draft: 'Draft',
      },
      toolbar: {
        searchPlaceholder: 'Search in scenarios...',
        statusFilter: 'Status Filter',
        allStatuses: 'All',
        newScenarioButton: 'New Scenario',
      },
      table: {
        name: 'Scenario Name',
        status: 'Status',
        startTime: 'Start Time',
        endTime: 'End Time',
        objectives: '# Objectives',
        actions: 'Actions',
        noMatch: 'No scenarios found with these filters',
        noScenarios: 'No scenarios have been created yet',
      },
      dialog: {
        createTitle: 'Create New Scenario',
        editTitle: 'Edit Scenario',
        nameLabel: 'Scenario Name',
        statusLabel: 'Status',
        descriptionLabel: 'Description',
        startTimeLabel: 'Start Time',
        endTimeLabel: 'End Time',
        objectivesLabel: 'Scenario Objectives',
        objectivesPlaceholder: 'Enter each objective on a new line',
        objectivesHelper: 'Enter each objective on a new line',
        cancelButton: 'Cancel',
        createButton: 'Create Scenario',
        saveButton: 'Save Changes',
      },
      menu: {
        viewDetails: 'View Details',
        edit: 'Edit',
        delete: 'Delete',
      },
      deleteDialog: {
        title: 'Delete Scenario',
        message: 'Are you sure you want to delete the scenario "{name}"?',
        warning: 'This action is irreversible.',
        cancelButton: 'Cancel',
        confirmButton: 'Delete',
      },
      notifications: {
        createSuccess: 'Scenario created successfully',
        createError: 'Error creating scenario',
        updateSuccess: 'Scenario updated successfully',
        updateError: 'Error updating scenario',
        deleteSuccess: 'Scenario deleted successfully',
        deleteError: 'Error deleting scenario',
      }
    },
    resources: {
      pageTitle: 'Resource Management',
      tabs: {
        humanResources: 'Human Resources',
        equipmentAssignment: 'Equipment Assignment',
        equipmentInventory: 'Equipment Inventory',
        maps: 'Maps',
      },
      humanResources: {
        title: 'Human Resources',
        underDevelopment: 'Under Development',
        comingSoon: 'This section will be available soon',
      },
      equipment: {
        categories: {
          armor: 'Armor',
          transport: 'Transport',
          artillery: 'Artillery',
          air_defense: 'Air Defense',
          engineer: 'Engineer',
          aircraft: 'Aircraft',
          helicopter: 'Helicopter',
          naval: 'Naval',
          missile: 'Missile',
          electronic: 'Electronic',
        }
      },
      equipmentAssignment: {
        selectUnitTitle: 'Select Unit for Equipment Assignment',
        unitLabel: 'Target Unit',
        unitPlaceholder: 'Select a unit...',
        selectedUnit: 'Selected Unit',
        currentEquipment: 'Current Equipment',
        types: 'types',
        assignableEquipmentTitle: 'Assignable General Equipment',
        searchPlaceholder: 'Search...',
        assignedEquipmentTitle: 'Assigned Equipment',
        authorizedCount: 'Authorized',
        onHand: 'On Hand',
        dialog: {
          title: 'Assign {equipmentName} to {unitName}',
          authorizedCountLabel: 'Authorized Count',
          onHandLabel: 'On Hand Count',
          cancelButton: 'Cancel',
          assignButton: 'Assign',
        }
      },
      equipmentInventory: {
        searchPlaceholder: 'Search in equipment...',
        categoryLabel: 'Category',
        allCategories: 'All Categories',
        addButton: 'Add New Equipment',
        cardView: 'Card View',
        tableView: 'Table View',
        yearOfManufacture: 'Year of Manufacture',
        deleteConfirm: 'Are you sure you want to delete this equipment?',
        tooltips: {
          details: 'Details',
          edit: 'Edit',
          delete: 'Delete',
        },
        table: {
          image: 'Image',
          name: 'Name',
          category: 'Category',
          manufacturer: 'Manufacturer',
          country: 'Country',
          year: 'Year',
          actions: 'Actions',
        },
        dialog: {
          addTitle: 'Add New Equipment',
          editTitle: 'Edit Equipment',
          nameLabel: 'Equipment Name',
          categoryLabel: 'Category',
          descriptionLabel: 'Description',
          manufacturerLabel: 'Manufacturer',
          countryLabel: 'Country of Origin',
          yearLabel: 'Year of Manufacture',
          uploadButton: 'Upload Image',
          cancelButton: 'Cancel',
          addButton: 'Add',
          saveButton: 'Save Changes',
        }
      },
      maps: {
        serverLayersTitle: 'Server Map Layers',
        addFromServerButton: 'Add from Server',
        type: 'Type',
        url: 'URL',
        opacityTooltip: 'Set Opacity',
        noServerLayers: 'No map layers have been added from a server',
        uploadedLayersTitle: 'Uploaded Layers',
        uploadFileButton: 'Upload File',
        vector: 'Vector',
        raster: 'Raster',
        format: 'Format',
        unknownFormat: 'Unknown',
        noUploadedLayers: 'No map files have been uploaded',
        summaryTitle: 'Layers Summary',
        totalLayers: 'Total Layers',
        activeLayers: 'Active Layers',
        serverLayers: 'Server Layers',
        deleteConfirm: 'Are you sure you want to delete this map layer?',
        dialog: {
          addFromServerTitle: 'Add Layer from Server',
          uploadFileTitle: 'Upload Map File',
          layerNameLabel: 'Layer Name',
          serviceTypeLabel: 'Service Type',
          serverUrlLabel: 'Server URL',
          layersLabel: 'Layers',
          fileTypeLabel: 'File Type',
          selectFileButton: 'Select File',
          selectedFile: 'Selected file',
          cancelButton: 'Cancel',
          addButton: 'Add',
          uploadButton: 'Upload',
        }
      }
    }
  },
  ar: {
    // Settings Panel
    settings: {
      title: 'الإعدادات العامة',
      description: 'قم بتخصيص واجهة المستخدم حسب ذوقك الشخصي',
      themeMode: 'وضع السمة',
      auto: 'تلقائي',
      dark: 'داكن',
      light: 'فاتح',
      primaryColor: 'اللون الأساسي',
      darkModeSettings: 'إعدادات الوضع الداكن',
      contrastLevel: 'مستوى التباين',
      dimming: 'مقدار التعتيم',
      blurAmount: 'مقدار التشويش',
      highContrast: 'تباين عالي',
      reducedMotion: 'تقليل الحركة',
      accessibility: 'إمكانية الوصول',
      pureBlack: 'استخدام الأسود الخالص (لشاشات OLED)',
      accentColor: 'لون التأكيد',
      fontSize: 'حجم الخط',
      large: 'كبير',
      medium: 'متوسط',
      small: 'صغير',
      languageSelection: 'اختيار اللغة',
      persian: 'فارسی',
      arabic: 'العربیه',
      english: 'English',
      currentLanguage: 'اللغة الحالية: العربية',
      currentMode: 'الوضع الحالي',
      selectedColor: 'اللون المحدد',
      currentSize: 'الحجم الحالي',
      resetToDefault: 'إعادة تعيين إلى الافتراضي',
      allSettings: 'جميع الإعدادات',
      advancedSettings: 'إعدادات متقدمة',
      chartSettingsTitle: 'إعدادات المخطط التنظيمي',
      symbolStandard: 'معيار الرموز',
      app6d: 'APP-6D (الناتو)',
      milstd2525d: 'MIL-STD-2525D (أمريكا)',
      milstd2525c: 'MIL-STD-2525C (أمريكا)',
      symbolSize: 'حجم الرمز',
      colors: {
        red: 'أحمر',
        blue: 'أزرق',
        green: 'أخضر',
        orange: 'برتقالي',
        purple: 'بنفسجي',
        cyan: 'سماوي',
        lightGreen: 'أخضر فاتح',
        pink: 'وردي',
        deepPurple: 'بنفسجي داكن',
        navy: 'كحلي',
        slate: 'رمادي مزرق',
        lavender: 'خزامي',
      },
    },
    // Menu items
    menu: {
      dashboard: 'لوحة التحكم',
      map: 'عرض الخريطة',
      scenarios: 'السيناريوهات',
      resources: 'الموارد',

      definitionEditor: 'محرر التعريفات',
      militarySymbolGenerator: 'مولد الرموز العسكرية',
      users: 'المستخدمون',
      settings: 'الإعدادات',
      help: 'المساعدة',
    },
    layout: {
      searchPlaceholder: 'ابحث في النظام...',
      helpTooltip: 'المساعدة',
      notificationsTooltip: 'الإشعارات',
      settingsTooltip: 'الإعدادات',
      userProfileTooltip: 'ملف المستخدم',
      notificationsTitle: 'الإشعارات',
      noNewNotifications: 'لا توجد إشعارات جديدة',
      viewAllNotifications: 'عرض كل الإشعارات',
    },
    dashboard: {
      stats: {
        activeScenarios: 'السيناريوهات النشطة',
        availableForces: 'القوات المتاحة',
        ongoingOperations: 'العمليات الجارية',
        securityAlerts: 'التنبيهات الأمنية',
        activeScenariosSubtitle: '{activePercent}٪ نشط | {inactiveCount} غير نشط',
        availableForcesSubtitle: '{iranianPercent}٪ إيراني | {foreignPercent}٪ أجنبي',
        ongoingOperationsSubtitle: '{commanderCount} قائد | {operatorCount} مشغل | {viewerCount} مشاهد',
        securityAlertsSubtitle: '{todayPercent}٪ اليوم | {weekCount} هذا الأسبوع',
        todayAlerts: 'تنبيهات اليوم:',
        alertItems: 'عناصر',
        today: 'اليوم',
        thisWeek: 'هذا الأسبوع',
        thisMonth: 'هذا الشهر',
        commander: 'قائد',
        operator: 'مشغل',
        viewer: 'مشاهد',
        iranian: 'إيراني',
        foreign: 'أجنبي',
        iran: 'إيران',
        otherCountries: 'دول أخرى',
        totalScenarios: 'إجمالي السيناريوهات',
        active: 'نشط',
        inactive: 'غير نشط',
      },
      welcome: {
        title: 'أهلاً بك',
        message: 'مرحباً {name}، أهلاً بك في نظام ساجد!',
      },
      activities: {
        newScenario: 'تم إنشاء سيناريو جديد',
        newScenarioDesc: 'عملية الدفاع الساحلي - الجنوب',
        forceMoved: 'تم نقل القوات',
        forceMovedDesc: 'نقل اللواء 21 إلى منطقة العمليات',
        mapUpdated: 'تم تحديث الخريطة',
        mapUpdatedDesc: 'تم استلام معلومات جديدة عن العدو',
        securityReport: 'تقرير أمني',
        securityReportDesc: 'مراجعة التهديدات في المنطقة الشمالية',
        newUser: 'تمت إضافة مستخدم جديد',
        newUserDesc: 'النقيب محمدي بدور مشغل',
        readinessReport: 'تقرير جاهزية القوات',
        readinessReportDesc: 'الكتيبة 101 مشاة - جاهزية 90٪',
        time: {
          minutes: 'قبل {count} دقيقة',
          hours: 'قبل {count} ساعة',
        },
      },
      quickActions: {
        newScenario: 'سيناريو جديد',
        viewMap: 'عرض الخريطة',
        reporting: 'التقارير',
        settings: 'الإعدادات',
        userManagement: 'إدارة المستخدمين',
        securityAlerts: 'التنبيهات الأمنية',
        orbatMapper: 'مخطط الهيكل التنظيمي',
      },
      systemStatus: {
        title: 'حالة النظام',
        disk: 'القرص',
        network: 'الشبكة',
      },
      recentActivities: 'الأنشطة الأخيرة',
      viewAllActivities: 'عرض جميع الأنشطة',
      quickAccess: 'وصول سريع',
      importantNotices: 'ملاحظات هامة',
      alerts: {
        securityThreat: 'تم تحديد تهديد أمني في المنطقة الشمالية',
        systemUpdate: 'تحديث النظام بتاريخ ٠٦-٢٠٢٣',
        trainingSuccess: 'اكتملت العملية التدريبية بنجاح',
      },
      tooltips: {
        update: 'تحديث',
        settings: 'الإعدادات',
        star: 'نجمة',
        archive: 'أرشفة',
      },
      menu: {
        archiveAll: 'أرشفة الكل',
        starAll: 'تمييز الكل بنجمة',
        unarchiveAll: 'إلغاء أرشفة الكل',
        unstarAll: 'إلغاء تمييز الكل بنجمة',
        deselectAll: 'إلغاء تحديد الكل'
      },
      notifications: {
        archiveAllSuccess: 'تم أرشفة جميع الأنشطة',
        unarchiveAllSuccess: 'تم إلغاء أرشفة جميع الأنشطة',
        starAllSuccess: 'تم وضع نجمة على جميع الأنشطة',
        unstarAllSuccess: 'تم إلغاء وضع النجمة على جميع الأنشطة',
      }
    },
    scenarios: {
      pageTitle: 'إدارة السيناريوهات',
      pageDescription: 'إنشاء وتعديل وإدارة السيناريوهات التشغيلية',
      errorLoading: 'خطأ في تحميل السيناريوهات',
      status: {
        draft: 'مسودة',
        active: 'نشط',
        paused: 'متوقف مؤقتاً',
        completed: 'مكتمل',
      },
      stats: {
        total: 'إجمالي السيناريوهات',
        active: 'نشط',
        completed: 'مكتمل',
        draft: 'مسودة',
      },
      toolbar: {
        searchPlaceholder: 'ابحث في السيناريوهات...',
        statusFilter: 'تصفية الحالة',
        allStatuses: 'الكل',
        newScenarioButton: 'سيناريو جديد',
      },
      table: {
        name: 'اسم السيناريو',
        status: 'الحالة',
        startTime: 'وقت البدء',
        endTime: 'وقت الانتهاء',
        objectives: 'عدد الأهداف',
        actions: 'الإجراءات',
        noMatch: 'لم يتم العثور على سيناريوهات بهذه المرشحات',
        noScenarios: 'لم يتم إنشاء أي سيناريوهات بعد',
      },
      dialog: {
        createTitle: 'إنشاء سيناريو جديد',
        editTitle: 'تعديل السيناريو',
        nameLabel: 'اسم السيناريو',
        statusLabel: 'الحالة',
        descriptionLabel: 'الوصف',
        startTimeLabel: 'وقت البدء',
        endTimeLabel: 'وقت الانتهاء',
        objectivesLabel: 'أهداف السيناريو',
        objectivesPlaceholder: 'أدخل كل هدف في سطر جديد',
        objectivesHelper: 'أدخل كل هدف في سطر جديد',
        cancelButton: 'إلغاء',
        createButton: 'إنشاء سيناريو',
        saveButton: 'حفظ التغييرات',
      },
      menu: {
        viewDetails: 'عرض التفاصيل',
        edit: 'تعديل',
        delete: 'حذف',
      },
      deleteDialog: {
        title: 'حذف السيناريو',
        message: 'هل أنت متأكد من أنك تريد حذف سيناريو "{name}"؟',
        warning: 'هذا الإجراء لا يمكن التراجع عنه.',
        cancelButton: 'إلغاء',
        confirmButton: 'حذف',
      },
      notifications: {
        createSuccess: 'تم إنشاء السيناريو بنجاح',
        createError: 'خطأ في إنشاء السيناريو',
        updateSuccess: 'تم تحديث السيناريو بنجاح',
        updateError: 'خطأ في تحديث السيناريو',
        deleteSuccess: 'تم حذف السيناريو بنجاح',
        deleteError: 'خطأ في حذف السيناريو',
      }
    },
    resources: {
      pageTitle: 'إدارة الموارد',
      tabs: {
        humanResources: 'الموارد البشرية',
        maps: 'الخرائط',
      },
      humanResources: {
        title: 'الموارد البشرية',
        underDevelopment: 'قيد التطوير',
        comingSoon: 'هذا القسم سيكون متاحا قريبا',
      },
      equipment: {
        categories: {
          armor: 'الدروع',
          transport: 'النقل',
          artillery: 'المدفعية',
          air_defense: 'الدفاع الجوي',
          engineer: 'الهندسة',
          aircraft: 'الطيران',
          helicopter: 'المروحية',
          naval: 'البحري',
          missile: 'الصواريخ',
          electronic: 'الإلكترونية',
        }
      },

      maps: {
        serverLayersTitle: 'طبقات خريطة الخادم',
        addFromServerButton: 'إضافة من الخادم',
        type: 'النوع',
        url: 'الرابط',
        opacityTooltip: 'ضبط الشفافية',
        noServerLayers: 'لم تتم إضافة أي طبقات خريطة من خادم',
        uploadedLayersTitle: 'الطبقات المرفوعة',
        uploadFileButton: 'رفع ملف',
        vector: 'متجه',
        raster: 'نقطي',
        format: 'الصيغة',
        unknownFormat: 'غير معروف',
        noUploadedLayers: 'لم يتم رفع أي ملفات خرائط',
        summaryTitle: 'ملخص الطبقات',
        totalLayers: 'إجمالي الطبقات',
        activeLayers: 'الطبقات النشطة',
        serverLayers: 'طبقات الخادم',
        deleteConfirm: 'هل أنت متأكد من حذف طبقة الخريطة هذه؟',
        dialog: {
          addFromServerTitle: 'إضافة طبقة من الخادم',
          uploadFileTitle: 'رفع ملف خريطة',
          layerNameLabel: 'اسم الطبقة',
          serviceTypeLabel: 'نوع الخدمة',
          serverUrlLabel: 'رابط الخادم',
          layersLabel: 'الطبقات',
          fileTypeLabel: 'نوع الملف',
          selectFileButton: 'اختر ملفًا',
          selectedFile: 'الملف المختار',
          cancelButton: 'إلغاء',
          addButton: 'إضافة',
          uploadButton: 'رفع',
        }
      }
    },
    // Users Module
    users: {
      pageTitle: 'إدارة المستخدمين',
      pageDescription: 'إدارة وتنظيم مستخدمي النظام',
      addUser: 'إضافة مستخدم جديد',
      searchPlaceholder: 'البحث في المستخدمين...',
      noUsers: 'لم يتم العثور على مستخدمين',
      loading: 'جار التحميل...',
      
      // View and Operations
      viewMode: {
        table: 'عرض جدولي',
        card: 'عرض بطاقات',
        tableTooltip: 'عرض جدولي',
        cardTooltip: 'عرض بطاقات'
      },
      
      // Filters
      filters: {
        title: 'الفلاتر والبحث',
        clearAll: 'مسح الفلاتر',
        search: 'بحث',
        status: 'الحالة',
        role: 'الدور',
        accessLevel: 'مستوى الوصول',
        nationality: 'الجنسية',
        all: 'الكل'
      },
      
      // Users Table
      table: {
        rowNumber: 'الصف',
        userCode: 'رمز المستخدم',
        fullName: 'الاسم الكامل',
        nationality: 'الجنسية',
        role: 'الدور',
        accessLevel: 'مستوى الوصول',
        status: 'الحالة',
        actions: 'الإجراءات'
      },
      
      // Quick Actions
      quickActions: {
        title: 'إجراءات سريعة',
        changePassword: 'تغيير كلمة المرور',
        changePasswordDesc: 'تعيين كلمة مرور جديدة للمستخدم',
        updateAccess: 'تحديث مستوى الوصول',
        updateAccessDesc: 'تعديل دور المستخدم ومستوى الوصول',
        toggleActive: 'تبديل الحالة',
        activateUser: 'تفعيل المستخدم',
        deactivateUser: 'تعطيل المستخدم',
        activateDesc: 'سيتمكن المستخدم من تسجيل الدخول',
        deactivateDesc: 'لن يتمكن المستخدم من تسجيل الدخول',
        
        // Password Form
        passwordForm: {
          newPassword: 'كلمة المرور الجديدة',
          confirmPassword: 'تأكيد كلمة المرور الجديدة',
          passwordMismatch: 'كلمة المرور والتأكيد غير متطابقين',
          passwordRequirements: 'يجب أن تكون كلمة المرور الجديدة على الأقل 8 أحرف وتشمل حروف وأرقام ورموز.'
        },
        
        // Access Form
        accessForm: {
          systemRole: 'دور النظام',
          accessLevel: 'مستوى الوصول',
          currentPermissions: 'الأذونات الحالية',
          accessWarning: 'تغيير مستوى الوصول سيؤثر على قدرات المستخدم.'
        },
        
        // Status Confirmation
        statusConfirm: {
          user: 'المستخدم',
          userCode: 'رمز المستخدم',
          role: 'الدور',
          currentStatus: 'الحالة الحالية',
          deactivateWarning: 'بتعطيل هذا المستخدم، لن يتمكن من تسجيل الدخول إلى النظام.',
          activateInfo: 'بتفعيل هذا المستخدم، سيتمكن من تسجيل الدخول إلى النظام.'
        },
        
        // Buttons
        buttons: {
          back: 'رجوع',
          cancel: 'إلغاء',
          confirm: 'تأكيد',
          processing: 'جار المعالجة...'
        }
      },
      
      // General Actions
      actions: {
        view: 'عرض التفاصيل',
        edit: 'تعديل',
        delete: 'حذف',
        quickActions: 'إجراءات سريعة'
      },
      
      status: {
        active: 'نشط',
        inactive: 'غير نشط',
        pending: 'قيد الانتظار',
        suspended: 'معلق'
      },
      form: {
        personalInfo: 'المعلومات الشخصية',
        contactInfo: 'معلومات الاتصال',
        legalInfo: 'المعلومات القانونية',
        fullName: 'الاسم الكامل',
        nationalId: 'الرقم الوطني',
        gender: 'الجنس',
        nationality: 'الجنسية',
        birthDate: 'تاريخ الميلاد',
        mobile: 'رقم الجوال',
        email: 'البريد الإلكتروني',
        address: 'العنوان',
        postalCode: 'الرمز البريدي',
        status: 'الحالة',
        isActive: 'مستخدم نشط'
      }
    },
    // Resources Module
    resourcesModule: {
      pageTitle: 'Resource Management',
      pageDescription: 'Manage and organize resources',
      addResource: 'Add New Resource',
      searchPlaceholder: 'Search resources...',
      noResources: 'No resources found',
      loading: 'Loading...',
      status: {
        keyPersons: 'Key Persons',
        military: 'Military',
        civilian: 'Civilian'
      },
      subStatus: {
        alive: 'Alive',
        martyr: 'Martyr',
        injured: 'Injured'
      }
    }
  },
};

export type TranslationKey = keyof typeof translations.fa; 