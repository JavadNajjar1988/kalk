# 🔗 ORBAT Integration Module

ماژول یکپارچه‌سازی ORBAT برای ارتباط بین React و Vue ORBAT Mapper بدون تداخل در کدهای موجود.

## 📁 ساختار ماژول

```
orbat-integration/
├── types/                      # تعریف انواع داده‌ها
│   ├── orbat-bridge.ts        # انواع پیام‌های ارتباطی
│   ├── orbat-data.ts          # ساختار داده‌های ORBAT
│   ├── orbat-events.ts        # انواع رویدادها
│   └── orbat-commands.ts      # انواع دستورات
├── adapters/                   # آداپتورهای ارتباطی
│   ├── OrbatMessageBridge.ts  # پل ارتباطی اصلی
│   ├── OrbatEventAdapter.ts   # تبدیل رویدادها
│   ├── OrbatStateSync.ts      # همگام‌سازی وضعیت
│   └── OrbatCommandHandler.ts # مدیریت دستورات
├── services/                   # سرویس‌های کمکی
│   ├── OrbatDataService.ts    # مدیریت داده‌ها
│   ├── OrbatConfigService.ts  # تنظیمات
│   ├── OrbatValidationService.ts # اعتبارسنجی
│   └── OrbatErrorService.ts   # مدیریت خطا
├── components/                 # کامپوننت‌های React (مرحله بعد)
├── hooks/                      # React Hooks (مرحله بعد)
├── routes/                     # مسیریابی (مرحله بعد)
├── utils/                      # توابع کمکی (مرحله بعد)
├── index.ts                    # Export اصلی
└── README.md                   # این فایل
```

## 🎯 اهداف

- **صفر تداخل**: هیچ تغییری در کدهای موجود React یا Vue
- **ارتباط Headless**: تبدیل ORBAT Mapper به core قابل استفاده
- **Type Safety**: پشتیبانی کامل از TypeScript
- **Event-Driven**: معماری مبتنی بر رویداد
- **Real-time Sync**: همگام‌سازی فوری وضعیت

## 🏗️ معماری

### Message Bridge
```typescript
// ارتباط دوطرفه بین React و Vue
React ←→ MessageBridge ←→ iframe (Vue ORBAT Mapper)
```

### Event Flow
```
Vue Events → EventAdapter → React Handlers
React Commands → CommandHandler → Vue Actions
```

### State Synchronization
```
Vue State ←→ StateSync ←→ React State
```

## 📋 وضعیت فعلی (فاز 1 تکمیل شده)

### ✅ انجام شده:
- [x] **Types**: تعریف کامل انواع داده‌ها
- [x] **Message Bridge**: پل ارتباطی اصلی
- [x] **Event Adapter**: سیستم رویدادها
- [x] **State Sync**: همگام‌سازی وضعیت
- [x] **Command Handler**: مدیریت دستورات
- [x] **Data Service**: سرویس مدیریت داده‌ها
- [x] **Config Service**: سیستم تنظیمات
- [x] **Validation Service**: اعتبارسنجی
- [x] **Error Service**: مدیریت خطا

### ⏳ مراحل بعدی:
- [ ] **React Components**: کامپوننت‌های UI
- [ ] **React Hooks**: hook های سفارشی
- [ ] **Routing**: مسیریابی
- [ ] **Testing**: تست‌های integration

## 🚀 استفاده سریع

```typescript
import { 
  OrbatMessageBridge, 
  OrbatEventAdapter, 
  OrbatCommandHandler,
  OrbatDataService 
} from './modules/orbat-integration';

// ایجاد bridge
const bridge = new OrbatMessageBridge({
  targetOrigin: 'http://localhost:5173',
  enableLogging: true
});

// ایجاد adapter ها
const eventAdapter = new OrbatEventAdapter(bridge);
const commandHandler = new OrbatCommandHandler(bridge);
const dataService = new OrbatDataService(bridge);

// گوش دادن به رویدادها
eventAdapter.onUnitAdded((data) => {
  console.log('Unit added:', data);
});

// اجرای دستورات
await commandHandler.loadScenario({
  source: 'local',
  scenarioId: 'my-scenario'
});

// دریافت داده‌ها
const units = await dataService.getUnits();
```

## 🔧 پیکربندی

```typescript
import { OrbatConfigService } from './modules/orbat-integration';

const config = new OrbatConfigService({
  bridge: {
    targetOrigin: 'http://localhost:5173',
    timeout: 10000
  },
  iframe: {
    baseUrl: 'http://localhost:5173',
    defaultMode: 'chart'
  }
});

// تغییر تنظیمات
config.set('ui.theme', 'dark');
config.setLanguage('fa');
```

## 📊 مدیریت خطا

```typescript
import { OrbatErrorService } from './modules/orbat-integration';

const errorService = new OrbatErrorService();

// گزارش خطا
errorService.reportBridgeError('Connection failed', details);

// گوش دادن به خطاها
errorService.onError('BRIDGE_ERROR', (error) => {
  console.error('Bridge error:', error.message);
});

// آمار خطاها
const stats = errorService.getErrorStatistics();
```

## 🎮 رویدادها و دستورات

### رویدادهای پشتیبانی شده:
- `scenario:loaded` - بارگذاری سناریو
- `unit:added` - اضافه شدن واحد
- `unit:updated` - به‌روزرسانی واحد
- `selection:changed` - تغییر انتخاب
- `timeline:play` - شروع تایم‌لاین
- `view:mode_changed` - تغییر حالت نمایش

### دستورات پشتیبانی شده:
- `LOAD_SCENARIO` - بارگذاری سناریو
- `ADD_UNIT` - اضافه کردن واحد
- `UPDATE_UNIT` - به‌روزرسانی واحد
- `SELECT_UNITS` - انتخاب واحدها
- `SET_VIEW_MODE` - تغییر حالت نمایش
- `PLAY_TIMELINE` - شروع تایم‌لاین

## 📝 مثال کامل

```typescript
import { 
  OrbatMessageBridge,
  OrbatEventAdapter,
  OrbatCommandHandler,
  OrbatDataService,
  OrbatConfigService,
  OrbatErrorService
} from './modules/orbat-integration';

class OrbatIntegration {
  private bridge: OrbatMessageBridge;
  private events: OrbatEventAdapter;
  private commands: OrbatCommandHandler;
  private data: OrbatDataService;
  private config: OrbatConfigService;
  private errors: OrbatErrorService;

  constructor() {
    this.config = new OrbatConfigService();
    this.errors = new OrbatErrorService();
    
    this.bridge = new OrbatMessageBridge(
      this.config.getBridgeConfig()
    );
    
    this.events = new OrbatEventAdapter(this.bridge);
    this.commands = new OrbatCommandHandler(this.bridge);
    this.data = new OrbatDataService(this.bridge);
    
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // رویدادهای واحدها
    this.events.onUnitAdded((data) => {
      console.log('New unit added:', data);
    });

    // رویدادهای انتخاب
    this.events.onSelectionChanged((data) => {
      console.log('Selection changed:', data);
    });

    // مدیریت خطاها
    this.errors.onAnyError((error) => {
      console.error('ORBAT Error:', error);
    });
  }

  async loadScenario(scenarioId: string) {
    try {
      await this.commands.loadScenario({
        source: 'local',
        scenarioId
      });
      
      const scenario = await this.data.getCurrentScenario();
      return scenario;
    } catch (error) {
      this.errors.reportCommandError(
        'LOAD_SCENARIO',
        'Failed to load scenario',
        { scenarioId, error }
      );
      throw error;
    }
  }
}

// استفاده
const orbat = new OrbatIntegration();
await orbat.loadScenario('my-scenario');
```

## 🔍 Debug و Monitoring

```typescript
// فعال کردن logging
config.set('debugging.enableLogs', true);
config.set('debugging.logLevel', 'debug');

// مشاهده آمار bridge
console.log(bridge.getConnectionStats());

// مشاهده آمار خطا
console.log(errorService.getErrorStatistics());

// صحت سنجی تنظیمات
const validation = config.validateConfig();
if (!validation.valid) {
  console.error('Config errors:', validation.errors);
}
```

## 📈 Performance

- **Lazy Loading**: تنها کامپوننت‌های مورد نیاز لود می‌شوند
- **Caching**: داده‌ها به صورت هوشمند cache می‌شوند
- **Debouncing**: از رویدادهای زیاد جلوگیری می‌شود
- **Memory Management**: مدیریت خودکار حافظه

## 🛡️ امنیت

- **Origin Validation**: اعتبارسنجی منبع پیام‌ها
- **Data Sanitization**: پاکسازی داده‌های ورودی
- **CSP Support**: پشتیبانی از Content Security Policy
- **Error Isolation**: جداسازی خطاها

---

**وضعیت**: فاز 1 تکمیل ✅  
**بعدی**: پیاده‌سازی React Components و Hooks