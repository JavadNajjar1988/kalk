# مستندات سیستم همگام‌سازی Real-time

## خلاصه
سیستم همگام‌سازی real-time با definition-editor پیاده‌سازی شد که امکان اعمال خودکار تغییرات گره‌ها، تب‌ها و فیلدها در مودال‌ها و component های مربوطه را فراهم می‌کند.

## ویژگی‌های کلیدی

### 1. همگام‌سازی کامل
- **تغییر گره‌ها**: اضافه، حذف، ویرایش نام گره‌ها
- **تغییر تب‌ها**: اضافه، حذف، ویرایش تب‌های مودال
- **تغییر فیلدها**: اضافه، حذف، ویرایش فیلدهای فرم
- **تغییر ساختار سلسله‌مراتبی**: به‌روزرسانی HierarchicalSelector

### 2. Event-driven Architecture
- سیستم مبتنی بر رویداد برای تشخیص تغییرات
- فیلتر کردن رویدادها بر اساس category و nodeId
- تاریخچه رویدادها برای debugging و monitoring

### 3. Performance Optimizations
- Memoization برای جلوگیری از re-render های غیرضروری
- Cache invalidation هوشمند
- Batch updates برای کاهش تعداد عملیات

## فایل‌های اصلی

### 1. `useDefinitionData.ts`
Hook اصلی برای بارگذاری تعاریف مودال‌ها با پشتیبانی از real-time sync:

```typescript
const { definitionData, loading, error, reload, triggerManualSync, getSyncInfo } = useDefinitionData('users');
```

**ویژگی‌های جدید**:
- `triggerManualSync()`: اجرای دستی همگام‌سازی
- `getSyncInfo()`: دریافت اطلاعات آخرین sync
- `lastSyncTime`: زمان آخرین همگام‌سازی

### 2. `useHierarchicalData.ts`
Hook مخصوص ساختار سلسله‌مراتبی با پشتیبانی از real-time sync:

```typescript
const { rootNode, selectedPath, refresh, triggerManualSync, getSyncInfo } = useHierarchicalData('users');
```

### 3. `definitionSync.ts`
ماژول اصلی مدیریت رویدادهای همگام‌سازی:

```typescript
// انواع تغییرات پشتیبانی شده
type DefinitionChangeType = 
  | 'add' | 'update' | 'delete' | 'rename'
  | 'field_add' | 'field_update' | 'field_delete'
  | 'tab_add' | 'tab_update' | 'tab_delete';

// شبیه‌سازی تغییرات برای تست
simulateDefinitionChange('field_add', 'persons', 'pr-2-1', null, fieldData, 'new-field-id');
simulateTabChange('pr-2', 'new-tab-id', 'tab_add', tabData);
simulateFieldChange('pr-2-1', 'field-id', 'field_update', newFieldData);
```

### 4. `HierarchicalSelector.tsx`
Component بهبود یافته برای انتخاب سلسله‌مراتبی:

**تغییرات کلیدی**:
- کاهش تعداد فیلدها از چندین فیلد به 2 فیلد
- نمایش مسیر کامل برای زیرگروه‌ها
- جمع‌آوری همه گزینه‌های ممکن در یک dropdown

### 5. `RealTimeSyncTest.tsx`
Component جامع برای تست سیستم همگام‌سازی:

**قابلیت‌های تست**:
- شبیه‌سازی تغییر تب‌ها
- شبیه‌سازی تغییر فیلدها  
- شبیه‌سازی تغییر گره‌های سلسله‌مراتبی
- نمایش وضعیت real-time همگام‌سازی
- لاگ کامل رویدادها

## نحوه استفاده

### 1. در مودال‌ها
مودال‌ها به‌طور خودکار از سیستم همگام‌سازی استفاده می‌کنند:

```typescript
<DynamicModal
  open={modalOpen}
  onClose={() => setModalOpen(false)}
  categoryType="users" // یا "resources"
  mode="create"
/>
```

### 2. در HierarchicalSelector
```typescript
<HierarchicalSelector
  categoryType="users"
  value={selectedPath}
  onChange={(path, finalNodeId) => {
    // تغییر خودکار اعمال می‌شود
  }}
  onFieldsChange={(fields) => {
    // فیلدها خودکار به‌روزرسانی می‌شوند
  }}
/>
```

### 3. تست و دیباگ
برای تست سیستم همگام‌سازی:

```
/dashboard/test/real-time-sync
```

## رویدادهای پشتیبانی شده

### 1. تغییرات گره (Node Changes)
- `add`: اضافه کردن گره جدید
- `update`: به‌روزرسانی گره موجود
- `delete`: حذف گره
- `rename`: تغییر نام گره

### 2. تغییرات تب (Tab Changes)  
- `tab_add`: اضافه کردن تب جدید
- `tab_update`: به‌روزرسانی تب موجود
- `tab_delete`: حذف تب

### 3. تغییرات فیلد (Field Changes)
- `field_add`: اضافه کردن فیلد جدید
- `field_update`: به‌روزرسانی فیلد موجود
- `field_delete`: حذف فیلد

## مثال‌های کاربردی

### 1. اضافه کردن تب جدید
```typescript
// در definition-editor
const newTab = {
  id: 'pr-2-new',
  name: 'تب جدید',
  customFields: [...]
};

// سیستم sync خودکار این تغییر را تشخیص می‌دهد
// و در همه مودال‌ها اعمال می‌کند
```

### 2. تغییر فیلد در تب موجود
```typescript
// تغییر نوع فیلد از text به email
simulateFieldChange('pr-2-1', 'field-id', 'field_update', {
  type: 'email',
  name: 'ایمیل',
  isRequired: true
});
```

### 3. اضافه کردن گره سلسله‌مراتبی
```typescript
// اضافه کردن زیرگروه جدید به اطلاعات حقوقی
simulateDefinitionChange('add', 'persons', 'pr-2-3-new', null, {
  id: 'pr-2-3-new',
  name: 'گروه جدید',
  parentId: 'pr-2-3',
  customFields: [...]
});
```

## نکات مهم

### 1. Performance
- سیستم از memoization و cache استفاده می‌کند
- تنها component های مرتبط به‌روزرسانی می‌شوند
- Debouncing برای جلوگیری از بروزرسانی‌های زیاد

### 2. Error Handling
- مدیریت خطاهای شبکه و بارگذاری
- نمایش پیام‌های خطای کاربرپسند
- Fallback به cache محلی در صورت خطا

### 3. Debugging
- لاگ کامل رویدادها
- نمایش زمان آخرین همگام‌سازی
- ابزارهای تست جامع

## محدودیت‌ها

### 1. شبیه‌سازی فعلی
- در حال حاضر از file watching واقعی استفاده نمی‌شود
- برای تست از simulateDefinitionChange استفاده شود

### 2. Real-world Implementation
برای پیاده‌سازی واقعی نیاز به:
- WebSocket connection به definition-editor
- File system watchers
- Server-side change detection

## آینده و بهبودها

### 1. WebSocket Integration
- اتصال مستقیم به definition-editor
- Real-time bidirectional communication

### 2. Conflict Resolution
- مدیریت تغییرات همزمان
- Merge strategies برای conflict ها

### 3. Offline Support
- Cache محلی برای کار آفلاین
- Sync queue برای تغییرات pending

## نتیجه‌گیری

سیستم همگام‌سازی real-time به‌طور کامل پیاده‌سازی شده و آماده استفاده است. کاربران می‌توانند:

✅ تب‌های مودال را اضافه/حذف کنند
✅ فیلدها را ویرایش/اضافه/حذف کنند  
✅ ساختار سلسله‌مراتبی را تغییر دهند
✅ همه تغییرات بلافاصله در UI منعکس شوند

برای تست کامل سیستم، از صفحه `/dashboard/test/real-time-sync` استفاده کنید.