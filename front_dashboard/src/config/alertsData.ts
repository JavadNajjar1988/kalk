import { Alert } from '@/types';

export const alerts: Alert[] = [
  {
    id: '1',
    title: 'نفوذ به شبکه شناسایی شد',
    severity: 'critical',
    timestamp: '2024-07-29T10:30:00Z',
    description: 'یک تلاش برای نفوذ به شبکه از طریق آدرس IP مشکوک شناسایی شد.',
    source: 'دیوار آتش',
    acknowledged: false,
  },
  {
    id: '2',
    title: 'فعالیت مشکوک کاربر',
    severity: 'high',
    timestamp: '2024-07-29T09:15:00Z',
    description: 'کاربر "testuser" چندین بار تلاش ناموفق برای ورود داشته است.',
    source: 'سیستم لاگ',
    acknowledged: false,
  },
  {
    id: '3',
    title: 'بدافزار شناسایی شد',
    severity: 'high',
    timestamp: '2024-07-28T14:00:00Z',
    description: 'یک فایل حاوی بدافزار در سرور فایل شناسایی و قرنطینه شد.',
    source: 'آنتی ویروس',
    acknowledged: true,
  },
  {
    id: '4',
    title: 'قطع شدن سرویس پایگاه داده',
    severity: 'medium',
    timestamp: '2024-07-28T22:05:00Z',
    description: 'سرویس پایگاه داده به دلیل کمبود حافظه برای مدت کوتاهی قطع شد.',
    source: 'مانیتورینگ سرور',
    acknowledged: true,
  },
  {
    id: '5',
    title: 'ترافیک غیرعادی شبکه',
    severity: 'low',
    timestamp: '2024-07-29T11:00:00Z',
    description: 'افزایش ناگهانی در ترافیک ورودی به وب سرور مشاهده شده است.',
    source: 'مانیتورینگ شبکه',
    acknowledged: false,
  },
]; 