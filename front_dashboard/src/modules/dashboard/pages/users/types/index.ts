import { User } from '@/types';

// صادر کردن نوع UserRole از فایل اصلی برای استفاده در همه‌جا
export type UserRole = 'admin' | 'commander' | 'operator' | 'viewer';

// تایپ‌های مورد نیاز
export interface Country {
  code: string;
  name: string;
  states: State[];
}

export interface State {
  code: string;
  name: string;
  cities: City[];
}

export interface City {
  code: string;
  name: string;
}

export interface Address {
  id: string;
  title: string;
  country: string;
  state?: string;
  city?: string;
  postalCode?: string;
  detailAddress: string;
  isDefault?: boolean;
}

export interface BirthPlace {
  country: string;
  state?: string;
  city?: string;
}

export interface BirthDate {
  calendarType: 'shamsi' | 'miladi' | 'qamari';
  year: number;
  month: number;
  day: number;
}

export interface AccessLevel {
  key: string;
  label: string;
  icon: React.ReactElement;
}

export interface CountryCode {
  code: string;      // کد کشور (مثل IR, US)
  dialCode: string;  // پیش شماره (مثل +98, +1)
  nameEn: string;    // نام انگلیسی
  nameFa: string;    // نام فارسی
  flag: string;      // ایموجی پرچم
}

export interface UserProfile extends Omit<User, 'lastLogin' | 'createdAt' | 'updatedAt'> {
  name?: string;
  nameEn?: string; // نام و نام خانوادگی به انگلیسی
  avatar?: string;
  lastLogin?: Date;
  loginCount: number;
  isActive: boolean;
  permissions: string[];
  department: string;
  position: string;
  phoneNumber?: string;
  nationality: 'iranian' | 'non-iranian';
  nationalId?: string; // شماره ملی/شماره پاسپورت
  birthDate?: BirthDate; // تاریخ تولد
  birthPlace?: BirthPlace; // محل تولد
  addresses?: Address[]; // آدرس‌های کاربر
  emergencyContact?: string;
  securityClearance: 'none' | 'basic' | 'secret' | 'top_secret';
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCardProps {
  user: UserProfile;
  onEdit: (user: UserProfile) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onResetPassword: (user: UserProfile) => void;
  onViewPermissions: (user: UserProfile) => void;
}

export interface UserDialogProps {
  open: boolean;
  user?: UserProfile | null;
  onClose: () => void;
  onSave: (userData: Partial<UserProfile>) => void;
  mode?: 'full' | 'edit' | 'permissions' | 'password';
}

export interface TCountry {
  code: string;
  name: string;
}

export interface TState {
  code: string;
  name: string;
}

export interface TCity {
  code: string;
  name: string;
}

export interface StatItem {
  title: string;
  value: number;
  icon: React.ReactElement;
  color: string;
  gradient: string;
  subtitle?: string;
} 