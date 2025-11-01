# GeoServer Custom Theme

این پوشه شامل فایل‌های CSS سفارشی برای تغییر ظاهر GeoServer به تم مشابه داشبورد React است.

## نصب

فایل‌های CSS به صورت خودکار در GeoServer mount شده‌اند. برای فعال‌سازی تم:

### روش 1: استفاده از Bookmarklet (ساده‌ترین)

یک Bookmarklet به مرورگر اضافه کنید که CSS را inject کند:

```javascript
javascript:(function(){var link=document.createElement('link');link.rel='stylesheet';link.type='text/css';link.href='http://127.0.0.1:8080/geoserver/www/custom/overlay.css';document.head.appendChild(link);document.documentElement.setAttribute('dir','rtl');})();
```

### روش 2: استفاده از Browser Extension

از یک extension مانند "Stylus" یا "User JavaScript and CSS" استفاده کنید و محتوای فایل `overlay.css` را اضافه کنید.

### روش 3: افزودن دستی به HTML (برای توسعه‌دهندگان)

اگر دسترسی به سورس GeoServer دارید، می‌توانید این خط را به فایل HTML اضافه کنید:

```html
<link rel="stylesheet" type="text/css" href="/geoserver/www/custom/overlay.css">
```

## ویژگی‌های تم

- رنگ اصلی: سبز (#34a853) - مشابه تم داشبورد
- تم تاریک: پس‌زمینه تیره با متن روشن
- فونت: Tahoma/Arial (مشابه Yekan در داشبورد)
- جهت: راست‌چین (RTL)
- Border radius: 12px
- Shadows و transitions مشابه Material-UI

## فایل‌ها

- `overlay.css`: فایل CSS اصلی
- `inject-theme.js`: اسکریپت JavaScript برای inject کردن CSS
- `index.html`: فایل HTML overlay

## توجه

برای تغییرات دائمی در تمام کاربران، نیاز به استفاده از GeoServer Extension یا Webapp Overlay دارید.

