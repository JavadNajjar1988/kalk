import { FieldType } from '../types/FieldEditTypes';

export function getFieldTypeLabel(type: FieldType): string {
  const labels: Record<FieldType, string> = {
    'text': 'متن ساده',
    'number': 'عدد',
    'email': 'ایمیل',
    'phone': 'شماره تلفن',
    'date': 'تاریخ',
    'boolean': 'بولین (بله/خیر)',
    'select': 'انتخاب از لیست',
    'multiselect': 'انتخاب چندگانه',
    'textarea': 'متن چندخطی',
    'file': 'فایل',
    'password': 'رمز عبور',
    'social': 'شبکه اجتماعی',
    'reference': 'مرجع',
    'text-english': 'متن انگلیسی',
    'text-numeric': 'متن عددی',
    'conditional-national-id': 'کد ملی شرطی',
    'phone-array': 'آرایه شماره تلفن',
    'address-array': 'آرایه آدرس',
    'hierarchical-address': 'آدرس سلسله‌مراتبی',
    'name-split': 'تفکیک نام',
    'full-name-dual': 'نام دوزبانه',
    'array-text': 'آرایه متن',
    'key-value': 'کلید-مقدار',
    'grouped': 'گروه‌بندی شده',
  };
  return labels[type] || type;
}