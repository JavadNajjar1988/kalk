import type { Theme } from '@mui/material/styles';

export interface RoleProfile {
  role: string;
  accessLevel: string;
  permissions: string[];
}

export const ROLE_PROFILES: RoleProfile[] = [
  {
    role: 'مدیر سیستم',
    accessLevel: 'سطح 1 - دسترسی کامل',
    permissions: ['مدیریت کاربران', 'مدیریت سناریوها', 'مدیریت منابع', 'تنظیمات سامانه'],
  },
  {
    role: 'فرمانده',
    accessLevel: 'سطح 2 - دسترسی عملیاتی',
    permissions: ['مشاهده کاربران', 'مدیریت سناریوها', 'مدیریت منابع', 'مدیریت داده'],
  },
  {
    role: 'اپراتور',
    accessLevel: 'سطح 3 - دسترسی محدود',
    permissions: ['مشاهده داشبورد', 'مشاهده سناریوها', 'مدیریت منابع'],
  },
  {
    role: 'ناظر مهمان',
    accessLevel: 'سطح 4 - دسترسی مهمان',
    permissions: ['مشاهده داشبورد', 'مشاهده سناریوها', 'مشاهده منابع'],
  },
];

type ServerRoleProfile = {
  role?: string;
  name?: string;
  accessLevel?: string;
  permissions?: string[];
};

export const getRoleProfile = (
  role?: string,
  serverProfiles?: ServerRoleProfile[],
): RoleProfile => {
  const serverProfile = serverProfiles?.find((profile) => (profile.role || profile.name) === role);
  if (serverProfile?.accessLevel && serverProfile.permissions) {
    return {
      role: serverProfile.role || serverProfile.name || role || 'ناظر مهمان',
      accessLevel: serverProfile.accessLevel,
      permissions: serverProfile.permissions,
    };
  }
  return ROLE_PROFILES.find((profile) => profile.role === role)
    ?? ROLE_PROFILES[ROLE_PROFILES.length - 1];
};

export const getAccessLevelNumber = (accessLevel?: string): number | null => {
  const match = accessLevel?.match(/(?:سطح|level)\s*([1-4])/i);
  return match ? Number(match[1]) : null;
};

export const getAccessLevelColor = (theme: Theme, accessLevel?: string): string => {
  switch (getAccessLevelNumber(accessLevel)) {
    case 1:
      return theme.palette.error.main;
    case 2:
      return theme.palette.warning.main;
    case 3:
      return theme.palette.info.main;
    case 4:
      return theme.palette.success.main;
    default:
      return theme.palette.grey[500];
  }
};

export const getUserInitials = (name?: string, fallback = 'ک'): string => {
  const initials = (name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('');
  return initials || fallback;
};
