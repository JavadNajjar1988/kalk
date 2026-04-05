import React from 'react';
import { UserRole } from '@/types';
import { AccessLevel } from '../types';
import {
  Dashboard,
  Map,
  Edit,
  People,
  SupervisorAccount,
  Storage,
  Build,
  Assessment,
  CloudDownload,
  Settings,
  Backup,
  PlayArrow,
  Stop,
  CloudUpload,
} from '@mui/icons-material';

// تابع دریافت سطوح دسترسی بر اساس نقش
export const getAccessLevelsByRole = (role: UserRole): AccessLevel[] => {
  const allPermissions: AccessLevel[] = [
    { key: 'dashboard_view', label: 'مشاهده داشبورد', icon: <Dashboard fontSize="small" /> },
    { key: 'map_view', label: 'مشاهده نقشه', icon: <Map fontSize="small" /> },
    { key: 'map_edit', label: 'ویرایش نقشه', icon: <Edit fontSize="small" /> },
    { key: 'users_view', label: 'مشاهده کاربران', icon: <People fontSize="small" /> },
    { key: 'users_manage', label: 'مدیریت کاربران', icon: <SupervisorAccount fontSize="small" /> },
    { key: 'data_view', label: 'مشاهده داده‌ها', icon: <Storage fontSize="small" /> },
    { key: 'data_edit', label: 'ویرایش داده‌ها', icon: <Build fontSize="small" /> },
    { key: 'reports_view', label: 'مشاهده گزارشات', icon: <Assessment fontSize="small" /> },
    { key: 'reports_generate', label: 'تولید گزارش', icon: <CloudDownload fontSize="small" /> },
    { key: 'system_config', label: 'تنظیمات سیستم', icon: <Settings fontSize="small" /> },
    { key: 'backup_restore', label: 'پشتیبان‌گیری', icon: <Backup fontSize="small" /> },
    { key: 'simulation_run', label: 'اجرای شبیه‌سازی', icon: <PlayArrow fontSize="small" /> },
    { key: 'simulation_stop', label: 'توقف شبیه‌سازی', icon: <Stop fontSize="small" /> },
    { key: 'export_data', label: 'خروجی داده‌ها', icon: <CloudUpload fontSize="small" /> },
    { key: 'import_data', label: 'ورودی داده‌ها', icon: <CloudDownload fontSize="small" /> },
  ];

  switch (role) {
    case 'viewer':
      // ناظر مهمان: فقط مشاهده
      return allPermissions.filter(p => 
        ['dashboard_view', 'map_view', 'data_view', 'reports_view'].includes(p.key)
      );
    
    case 'commander':
      // فرمانده: دسترسی عملیاتی کامل (بدون مدیریت کاربران و تنظیمات سیستم)
      return allPermissions.filter(p => 
        ['dashboard_view', 'map_view', 'map_edit', 'users_view', 'data_view', 
         'data_edit', 'reports_view', 'reports_generate', 'simulation_run', 
         'simulation_stop', 'export_data', 'import_data'].includes(p.key)
      );
    
    case 'super_admin':
      // سوپر ادمین: همه دسترسی‌ها
      return allPermissions;
    
    default:
      return [];
  }
};

// توابع کمکی نمایش نقش
export const getRoleIcon = (role: UserRole) => {
  switch (role) {
    case 'super_admin': return 'AdminPanelSettings';
    case 'commander': return 'Security';
    case 'viewer': return 'Visibility';
    default: return 'Person';
  }
};

export const getRoleColor = (role: UserRole) => {
  switch (role) {
    case 'super_admin': return 'error';
    case 'commander': return 'secondary';
    case 'viewer': return 'info';
    default: return 'default';
  }
};

export const getRoleText = (role: UserRole) => {
  switch (role) {
    case 'super_admin': return 'سوپر ادمین';
    case 'commander': return 'فرمانده';
    case 'viewer': return 'ناظر مهمان';
    default: return 'نامشخص';
  }
};

export const getClearanceColor = (clearance: string) => {
  switch (clearance) {
    case 'top_secret': return 'error';
    case 'secret': return 'warning';
    case 'basic': return 'primary';
    case 'none': return 'default';
    default: return 'default';
  }
};

export const getClearanceText = (clearance: string) => {
  switch (clearance) {
    case 'top_secret': return 'فوق محرمانه';
    case 'secret': return 'محرمانه';
    case 'basic': return 'عادی';
    case 'none': return 'بدون دسترسی';
    default: return 'نامشخص';
  }
}; 