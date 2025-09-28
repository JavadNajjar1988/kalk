# به‌روزرسانی دسته‌بندی تخصص یگان / آموزش

## تغییرات اعمال شده

### 1. اضافه کردن پشتیبانی کامل از دسته‌بندی تخصص یگان / آموزش

**فایل**: `frontend/src/modules/master-definitions/pages/CategoryDetailPage.tsx`

#### الف) اضافه کردن case در switch categoryType:
```typescript
case 'تخصص یگان / آموزش':
  return 'specialty_training';
```

#### ب) تعریف سطوح پیش‌فرض:
```typescript
case 'specialty_training':
  defaultLevels = [
    { id: '1', name: 'نیروهای رزمی', englishName: 'Combat Forces', order: 1, isRequired: true, isActive: true },
    { id: '2', name: 'مهندسی و پشتیبانی', englishName: 'Engineering & Support', order: 2, isRequired: true, isActive: true },
    { id: '3', name: 'پزشکی و امداد', englishName: 'Medical & Rescue', order: 3, isRequired: true, isActive: true },
    { id: '4', name: 'اطلاعاتی و سایبری', englishName: 'Intelligence & Cyber Operations', order: 4, isRequired: true, isActive: true },
    { id: '5', name: 'جنگ الکترونیک', englishName: 'Electronic Warfare', order: 5, isRequired: true, isActive: true },
    { id: '6', name: 'ش.م.ه', englishName: 'CBRN - Chemical, Biological, Radiological, and Nuclear', order: 6, isRequired: true, isActive: true },
    { id: '7', name: 'عملیات ویژه', englishName: 'Special Operations', order: 7, isRequired: true, isActive: true },
    { id: '8', name: 'آموزش‌های خاص', englishName: 'Specialized Training', order: 8, isRequired: true, isActive: true }
  ];
  break;
```

#### ج) تنظیم محدوده سطح در فیلترها:
```typescript
levelRange: categoryType === 'specialty_training' ? [1, 8] : [1, 9]
```

#### د) SpecialtyManager:
```typescript
// SpecialtyManager فقط برای ساختار رده‌های نظامی فعال است
{categoryType === 'military_units' && (
  <SpecialtyManager categoryId={category.id} />
)}
```

## ساختار سلسله‌مراتبی جدید

### سطح 1: نیروهای رزمی (Combat Forces)
- **نام فارسی**: نیروهای رزمی
- **نام انگلیسی**: Combat Forces
- **توضیحات**: تخصص‌های مربوط به نیروهای رزمی و عملیات‌های نظامی

### سطح 2: مهندسی و پشتیبانی (Engineering & Support)
- **نام فارسی**: مهندسی و پشتیبانی
- **نام انگلیسی**: Engineering & Support
- **توضیحات**: تخصص‌های مهندسی رزمی و پشتیبانی فنی

### سطح 3: پزشکی و امداد (Medical & Rescue)
- **نام فارسی**: پزشکی و امداد
- **نام انگلیسی**: Medical & Rescue
- **توضیحات**: تخصص‌های پزشکی نظامی و عملیات امداد و نجات

### سطح 4: اطلاعاتی و سایبری (Intelligence & Cyber Operations)
- **نام فارسی**: اطلاعاتی و سایبری
- **نام انگلیسی**: Intelligence & Cyber Operations
- **توضیحات**: تخصص‌های اطلاعاتی و عملیات سایبری

### سطح 5: جنگ الکترونیک (Electronic Warfare)
- **نام فارسی**: جنگ الکترونیک
- **نام انگلیسی**: Electronic Warfare
- **توضیحات**: تخصص‌های جنگ الکترونیک و عملیات الکترومغناطیسی

### سطح 6: ش.م.ه (CBRN)
- **نام فارسی**: ش.م.ه
- **نام انگلیسی**: CBRN - Chemical, Biological, Radiological, and Nuclear
- **توضیحات**: تخصص‌های شیمیایی، میکروبی، رادیولوژیکی و هسته‌ای

### سطح 7: عملیات ویژه (Special Operations)
- **نام فارسی**: عملیات ویژه
- **نام انگلیسی**: Special Operations
- **توضیحات**: تخصص‌های عملیات ویژه و نیروهای خاص

### سطح 8: آموزش‌های خاص (Specialized Training)
- **نام فارسی**: آموزش‌های خاص
- **نام انگلیسی**: Specialized Training
- **توضیحات**: آموزش‌های تخصصی و دوره‌های خاص نظامی

## ویژگی‌های فنی

- **حداکثر سطوح**: 8
- **همه سطوح اجباری**: بله
- **پشتیبانی از سطوح پویا**: بله
- **قابلیت ویرایش**: بله
- **قابلیت حذف**: بله
- **قابلیت مرتب‌سازی**: بله
- **پشتیبانی از SpecialtyManager**: خیر (فقط برای ساختار رده‌های نظامی)

## مسیر دسترسی

- **URL**: `http://localhost:3000/dashboard/master-definitions/category/cat-12`
- **شناسه دسته‌بندی**: `cat-12`
- **نام**: تخصص یگان / آموزش (Specialty / Training)

## تغییرات در رابط کاربری

### آکاردئون مدیریت تخصص‌ها
- **برای تخصص یگان / آموزش**: نمایش داده نمی‌شود
- **برای ساختار رده‌های نظامی**: "مدیریت تخصص‌ها" با توضیحات "تعریف و مدیریت تخصص‌های نظامی"

## داده‌های پیش‌فرض

### سطوح سلسله‌مراتبی
تمام 8 سطح تخصصی به صورت پیش‌فرض تعریف شده‌اند و کاربر می‌تواند:
- سطوح جدید اضافه کند
- سطوح موجود را ویرایش کند
- سطوح را حذف کند
- ترتیب سطوح را تغییر دهد
- وضعیت فعال/غیرفعال سطوح را تغییر دهد

### داده‌های نمونه در آکاردئون "مدیریت داده‌ها"
8 دسته اصلی با زیرگروه‌هایشان به عنوان داده‌های پیش‌فرض اضافه شده‌اند:

#### 1. تخصص‌های رزمی (Combat Specialties)
- پیاده‌نظام (Infantry)
- زرهی (Armor)
- مکانیزه (Mechanized)
- توپخانه (Artillery)
- سلاح‌های سبک و سنگین (Light/Heavy Weapons)
- ضد تانک (Anti-Tank)
- نیروهای دفاع هوایی (Air Defense Forces)

#### 2. مهندسی و پشتیبانی (Engineering & Support)
- احداث پل و جاده (Bridge & Road Construction)
- مین‌روب (Mine Clearance)
- استحکامات دفاعی (Fortifications)
- خدمات ساخت‌وساز در صحنه جنگ (Field Construction Services)
- لجستیک و تأمین (Logistics & Supply)
- مدیریت منابع (Resource Management)
- پشتیبانی ارتباطی (Communication Support)

#### 3. پزشکی و امداد (Medical & Rescue)
- پزشکی رزمی (Combat Medicine)
- تخلیه مجروحین (Casualty Evacuation)
- امداد روانی (Psychological Rescue)
- بیمارستان سیار (Field Hospitals)
- تیم واکنش سریع (Rapid Response Teams)

#### 4. اطلاعاتی و سایبری (Intelligence & Cyber Operations)
- تحلیل اطلاعات (Intelligence Analysis)
- عملیات سایبری (Cyber Operations)
- جمع‌آوری داده میدانی (ISR – Intelligence, Surveillance, Reconnaissance)
- مدیریت اطلاعات (Information Management)
- پشتیبانی اطلاعاتی (Intelligence Support)

#### 5. جنگ الکترونیک (Electronic Warfare)
- شنود و پارازیت (Signal Interception & Jamming)
- EW فعال و منفعل (Active/Passive EW)
- ضد رادار (Anti-Radar Operations)
- حفاظت از سیستم‌های ارتباطی (Protection of Communications Systems)

#### 6. ش.م.ه (CBRN)
- عملیات در محیط شیمیایی/هسته‌ای (Chemical/Nuclear Operations)
- ضد آلودگی (Decontamination Operations)
- تیم واکنش سریع (Rapid Response Teams for CBRN)
- تجهیزات حفاظت فردی (Personal Protective Equipment)

#### 7. عملیات ویژه (Special Operations)
- نفوذ و ترور (Infiltration & Assassination)
- نجات گروگان‌ها (Hostage Rescue Operations)
- چتربازی نظامی (Military Parachuting)
- عملیات کوهستانی (Mountain Warfare Operations)
- عملیات دریایی ویژه (Special Marine Operations)
- عملیات ضد تروریسم (Counter-Terrorism Operations)

#### 8. آموزش‌های خاص (Specialized Training)
- آموزش مربی نظامی (Military Trainer Training)
- آموزش فرماندهی میدانی (Field Command Training)
- آموزش نبردهای شهری (Urban Warfare Training)
- آموزش در عملیات‌های مشترک (Joint Operations Training)
- آموزش تاکتیک‌های پیشرفته (Advanced Tactics Training)
- آموزش شبیه‌سازی‌های جنگی (Combat Simulation Training)
