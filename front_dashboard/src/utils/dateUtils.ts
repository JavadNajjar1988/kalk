/**
 * Date utility functions
 * توابع کمکی برای تاریخ
 */

/**
 * Format date as "time ago" in Persian
 */
export const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'چند لحظه پیش';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} دقیقه پیش`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ساعت پیش`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} روز پیش`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} ماه پیش`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} سال پیش`;
};

export type DateInput = Date | string | number;

const PERSIAN_DATE_LOCALE = 'fa-IR-u-ca-persian';

function asDate(value: DateInput) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function formatPersianDate(
  value: DateInput,
  options: Intl.DateTimeFormatOptions = {}
) {
  const date = asDate(value);
  if (!date) return '—';
  return new Intl.DateTimeFormat(PERSIAN_DATE_LOCALE, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...options,
  }).format(date);
}

export function formatPersianDateTime(
  value: DateInput,
  options: Intl.DateTimeFormatOptions = {}
) {
  const date = asDate(value);
  if (!date) return '—';
  return new Intl.DateTimeFormat(PERSIAN_DATE_LOCALE, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    ...options,
  }).format(date);
}

export function formatPersianTime(
  value: DateInput,
  options: Intl.DateTimeFormatOptions = {}
) {
  const date = asDate(value);
  if (!date) return '—';
  return new Intl.DateTimeFormat(PERSIAN_DATE_LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    ...options,
  }).format(date);
}

const pad = (value: number) => String(value).padStart(2, '0');

export function toLocalDateTimeInput(value?: DateInput) {
  if (value === undefined || value === null || value === '') return '';
  const date = asDate(value);
  if (!date) return '';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function toLocalDateInput(value?: DateInput) {
  return toLocalDateTimeInput(value).slice(0, 10);
}

export function localDateTimeToIso(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export function formatPersianFileDate(value: DateInput = new Date()) {
  return formatPersianDateTime(value, { second: '2-digit' })
    .replace(/[/:،\s]+/g, '-')
    .replace(/[‏‎]/g, '')
    .replace(/-+$/g, '');
}
