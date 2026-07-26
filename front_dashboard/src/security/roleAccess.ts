export type AppRole = 'admin' | 'commander' | 'operator' | 'viewer';

export type RoleFeature =
  | 'dashboard.view'
  | 'scenarios.view'
  | 'scenarios.manage'
  | 'scenarios.delete'
  | 'resources.view'
  | 'resources.manage'
  | 'users.view'
  | 'users.manage'
  | 'settings.manage'
  | 'baseInfo.manage'
  | 'data.manage'
  | 'kalknegar.access';

const ACCESS: Record<RoleFeature, AppRole[]> = {
  'dashboard.view': ['admin', 'commander', 'operator', 'viewer'],
  'scenarios.view': ['admin', 'commander', 'operator', 'viewer'],
  'scenarios.manage': ['admin', 'commander'],
  'scenarios.delete': ['admin'],
  'resources.view': ['admin', 'commander', 'operator', 'viewer'],
  'resources.manage': ['admin', 'commander', 'operator'],
  'users.view': ['admin', 'commander'],
  'users.manage': ['admin'],
  'settings.manage': ['admin'],
  'baseInfo.manage': ['admin'],
  'data.manage': ['admin', 'commander'],
  'kalknegar.access': ['admin', 'commander', 'operator'],
};

export const normalizeRole = (role?: string | null): AppRole => {
  const value = (role || '').trim().toLowerCase().replace('-', '_');
  if (value === 'admin' || value === 'super_admin') return 'admin';
  if (value === 'commander') return 'commander';
  if (value === 'operator') return 'operator';
  return 'viewer';
};

export const canAccessFeature = (
  role: string | null | undefined,
  feature: RoleFeature,
): boolean => ACCESS[feature].includes(normalizeRole(role));
