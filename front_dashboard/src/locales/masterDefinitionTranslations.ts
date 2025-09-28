// ترجمه‌های مربوط به ماژول تعاریف پایه
// این فایل شامل ترجمه‌های متن‌های ماژول تعاریف پایه به زبان‌های مختلف است

export const masterDefinitionTranslations = {
  fa: {
    // عناوین اصلی
    title: 'تعاریف پایه',
    description: 'مدیریت تعاریف پایه و دسته‌بندی‌های سیستم',
    categories: 'دسته‌بندی‌ها',
    definitions: 'تعاریف',
    
    // دسته‌بندی‌ها
    categoryManagement: 'مدیریت دسته‌بندی‌ها',
    addCategory: 'افزودن دسته‌بندی جدید',
    editCategory: 'ویرایش دسته‌بندی',
    deleteCategory: 'حذف دسته‌بندی',
    
    // تعاریف
    definitionManagement: 'مدیریت تعاریف',
    addDefinition: 'افزودن تعریف جدید',
    editDefinition: 'ویرایش تعریف',
    deleteDefinition: 'حذف تعریف',
    
    // فیلدهای فرم
    name: 'نام',
    englishName: 'نام انگلیسی',
    description: 'توضیحات',
    icon: 'آیکون',
    color: 'رنگ',
    maxLevels: 'حداکثر سطوح',
    order: 'ترتیب',
    isActive: 'فعال',
    isRequired: 'الزامی',
    
    // دکمه‌ها
    save: 'ذخیره',
    cancel: 'انصراف',
    confirm: 'تأیید',
    back: 'بازگشت',
    next: 'بعدی',
    
    // پیام‌ها
    successCreate: 'با موفقیت ایجاد شد',
    successUpdate: 'با موفقیت بروزرسانی شد',
    successDelete: 'با موفقیت حذف شد',
    confirmDelete: 'آیا از حذف این مورد اطمینان دارید؟',
    
    // تجهیزات و سامانه‌ها
    equipment: {
      title: 'تجهیزات و سامانه‌ها',
      description: 'مدیریت انواع تجهیزات نظامی و سامانه‌های مختلف',
      
      // ساختار درختی
      treeStructure: 'ساختار درختی تجهیزات',
      selectPath: 'انتخاب مسیر',
      currentPath: 'مسیر فعلی',
      
      // فیلدهای تجهیزات
      fields: {
        title: 'فیلدهای تجهیزات',
        description: 'مدیریت فیلدهای فرم برای تجهیزات',
        addField: 'افزودن فیلد جدید',
        editField: 'ویرایش فیلد',
        deleteField: 'حذف فیلد',
        fieldName: 'نام فیلد',
        fieldType: 'نوع فیلد',
        fieldRequired: 'فیلد الزامی است',
        fieldOptions: 'گزینه‌ها',
        fieldUnit: 'واحد',
        fieldOrder: 'ترتیب نمایش',
        
        // انواع فیلد
        types: {
          text: 'متن',
          number: 'عدد',
          date: 'تاریخ',
          select: 'انتخاب تکی',
          multiselect: 'انتخاب چندتایی',
          boolean: 'بله/خیر',
          file: 'فایل'
        }
      },
      
      // پیش‌نمایش فرم
      preview: {
        title: 'پیش‌نمایش فرم',
        description: 'نمایش فرم ایجاد شده بر اساس فیلدهای تعریف شده',
        submit: 'ثبت اطلاعات'
      },
      
      // نمایش گرافی
      graph: {
        title: 'نمایش گرافی',
        description: 'نمایش ساختار درختی تجهیزات به صورت گرافی',
        zoomIn: 'بزرگنمایی',
        zoomOut: 'کوچکنمایی',
        fitScreen: 'اندازه مناسب',
        showLabels: 'نمایش برچسب‌ها',
        showDetails: 'نمایش جزئیات',
        totalNodes: 'تعداد کل گره‌ها',
        nodesWithFields: 'گره‌های دارای فیلد',
        treeDepth: 'عمق درخت'
      },
      
      // نسخه‌بندی فیلدها
      fieldVersioning: {
        title: 'نسخه‌بندی فیلدها',
        description: 'مدیریت نسخه‌های مجموعه فیلدها',
        currentVersion: 'نسخه فعلی',
        createNewVersion: 'ایجاد نسخه جدید',
        versionHistory: 'تاریخچه نسخه‌ها'
      },
      
      // ارث‌بری فیلدها
      fieldInheritance: {
        title: 'ارث‌بری فیلدها',
        description: 'فیلدهای تعریف شده در هر گره به تمام زیرمجموعه‌های آن به ارث می‌رسند',
        inheritedFields: 'فیلدهای ارث‌برده شده',
        localFields: 'فیلدهای محلی',
        overriddenFields: 'فیلدهای بازنویسی شده'
      }
    }
  },
  
  en: {
    // Main titles
    title: 'Master Definitions',
    description: 'Manage base definitions and system categories',
    categories: 'Categories',
    definitions: 'Definitions',
    
    // Categories
    categoryManagement: 'Category Management',
    addCategory: 'Add New Category',
    editCategory: 'Edit Category',
    deleteCategory: 'Delete Category',
    
    // Definitions
    definitionManagement: 'Definition Management',
    addDefinition: 'Add New Definition',
    editDefinition: 'Edit Definition',
    deleteDefinition: 'Delete Definition',
    
    // Form fields
    name: 'Name',
    englishName: 'English Name',
    description: 'Description',
    icon: 'Icon',
    color: 'Color',
    maxLevels: 'Max Levels',
    order: 'Order',
    isActive: 'Active',
    isRequired: 'Required',
    
    // Buttons
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    back: 'Back',
    next: 'Next',
    
    // Messages
    successCreate: 'Successfully created',
    successUpdate: 'Successfully updated',
    successDelete: 'Successfully deleted',
    confirmDelete: 'Are you sure you want to delete this item?',
    
    // Equipment and Systems
    equipment: {
      title: 'Equipment and Systems',
      description: 'Manage military equipment types and various systems',
      
      // Tree structure
      treeStructure: 'Equipment Tree Structure',
      selectPath: 'Select Path',
      currentPath: 'Current Path',
      
      // Equipment fields
      fields: {
        title: 'Equipment Fields',
        description: 'Manage form fields for equipment',
        addField: 'Add New Field',
        editField: 'Edit Field',
        deleteField: 'Delete Field',
        fieldName: 'Field Name',
        fieldType: 'Field Type',
        fieldRequired: 'Field is Required',
        fieldOptions: 'Options',
        fieldUnit: 'Unit',
        fieldOrder: 'Display Order',
        
        // Field types
        types: {
          text: 'Text',
          number: 'Number',
          date: 'Date',
          email: 'Email',
          password: 'Password',
          textarea: 'Textarea',
          phone: 'Phone Numbers',
          social: 'Social Networks',
          select: 'Select',
          multiselect: 'Multi-select',
          boolean: 'Boolean',
          file: 'File'
        }
      },
      
      // Form preview
      preview: {
        title: 'Form Preview',
        description: 'Preview of the form created based on defined fields',
        submit: 'Submit'
      },
      
      // Graph view
      graph: {
        title: 'Graph View',
        description: 'Graphical view of equipment tree structure',
        zoomIn: 'Zoom In',
        zoomOut: 'Zoom Out',
        fitScreen: 'Fit to Screen',
        showLabels: 'Show Labels',
        showDetails: 'Show Details',
        totalNodes: 'Total Nodes',
        nodesWithFields: 'Nodes with Fields',
        treeDepth: 'Tree Depth'
      },
      
      // Field versioning
      fieldVersioning: {
        title: 'Field Versioning',
        description: 'Manage field set versions',
        currentVersion: 'Current Version',
        createNewVersion: 'Create New Version',
        versionHistory: 'Version History'
      },
      
      // Field inheritance
      fieldInheritance: {
        title: 'Field Inheritance',
        description: 'Fields defined in each node are inherited by all its children',
        inheritedFields: 'Inherited Fields',
        localFields: 'Local Fields',
        overriddenFields: 'Overridden Fields'
      }
    }
  },
  
  ar: {
    // العناوين الرئيسية
    title: 'التعريفات الأساسية',
    description: 'إدارة التعريفات الأساسية وفئات النظام',
    categories: 'الفئات',
    definitions: 'التعريفات',
    
    // الفئات
    categoryManagement: 'إدارة الفئات',
    addCategory: 'إضافة فئة جديدة',
    editCategory: 'تعديل الفئة',
    deleteCategory: 'حذف الفئة',
    
    // التعريفات
    definitionManagement: 'إدارة التعريفات',
    addDefinition: 'إضافة تعريف جديد',
    editDefinition: 'تعديل التعريف',
    deleteDefinition: 'حذف التعريف',
    
    // حقول النموذج
    name: 'الاسم',
    englishName: 'الاسم بالإنجليزية',
    description: 'الوصف',
    icon: 'الأيقونة',
    color: 'اللون',
    maxLevels: 'الحد الأقصى للمستويات',
    order: 'الترتيب',
    isActive: 'نشط',
    isRequired: 'مطلوب',
    
    // الأزرار
    save: 'حفظ',
    cancel: 'إلغاء',
    confirm: 'تأكيد',
    back: 'رجوع',
    next: 'التالي',
    
    // الرسائل
    successCreate: 'تم الإنشاء بنجاح',
    successUpdate: 'تم التحديث بنجاح',
    successDelete: 'تم الحذف بنجاح',
    confirmDelete: 'هل أنت متأكد من حذف هذا العنصر؟',
    
    // المعدات والأنظمة
    equipment: {
      title: 'المعدات والأنظمة',
      description: 'إدارة أنواع المعدات العسكرية والأنظمة المختلفة',
      
      // هيكل الشجرة
      treeStructure: 'هيكل شجرة المعدات',
      selectPath: 'اختيار المسار',
      currentPath: 'المسار الحالي',
      
      // حقول المعدات
      fields: {
        title: 'حقول المعدات',
        description: 'إدارة حقول نموذج المعدات',
        addField: 'إضافة حقل جديد',
        editField: 'تعديل الحقل',
        deleteField: 'حذف الحقل',
        fieldName: 'اسم الحقل',
        fieldType: 'نوع الحقل',
        fieldRequired: 'الحقل مطلوب',
        fieldOptions: 'الخيارات',
        fieldUnit: 'الوحدة',
        fieldOrder: 'ترتيب العرض',
        
        // أنواع الحقول
        types: {
          text: 'نص',
          number: 'رقم',
          date: 'تاريخ',
          select: 'اختيار فردي',
          multiselect: 'اختيار متعدد',
          boolean: 'نعم/لا',
          file: 'ملف'
        }
      },
      
      // معاينة النموذج
      preview: {
        title: 'معاينة النموذج',
        description: 'معاينة النموذج المنشأ بناءً على الحقول المحددة',
        submit: 'إرسال'
      },
      
      // عرض الرسم البياني
      graph: {
        title: 'عرض الرسم البياني',
        description: 'عرض بياني لهيكل شجرة المعدات',
        zoomIn: 'تكبير',
        zoomOut: 'تصغير',
        fitScreen: 'ملاءمة للشاشة',
        showLabels: 'إظهار التسميات',
        showDetails: 'إظهار التفاصيل',
        totalNodes: 'إجمالي العقد',
        nodesWithFields: 'العقد ذات الحقول',
        treeDepth: 'عمق الشجرة'
      },
      
      // إصدارات الحقول
      fieldVersioning: {
        title: 'إصدارات الحقول',
        description: 'إدارة إصدارات مجموعة الحقول',
        currentVersion: 'الإصدار الحالي',
        createNewVersion: 'إنشاء إصدار جديد',
        versionHistory: 'تاريخ الإصدارات'
      },
      
      // وراثة الحقول
      fieldInheritance: {
        title: 'وراثة الحقول',
        description: 'يتم توريث الحقول المحددة في كل عقدة من قبل جميع فروعها',
        inheritedFields: 'الحقول الموروثة',
        localFields: 'الحقول المحلية',
        overriddenFields: 'الحقول المستبدلة'
      }
    }
  }
};