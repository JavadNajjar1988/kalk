import { createTheme } from '@mui/material/styles';
import { describe, expect, it } from 'vitest';

import {
  getAccessLevelColor,
  getAccessLevelNumber,
  getRoleProfile,
  getUserInitials,
} from './userPresentation';

describe('user presentation policy', () => {
  it('extracts the level number from Persian and English access labels', () => {
    expect(getAccessLevelNumber('سطح 2 - دسترسی عملیاتی')).toBe(2);
    expect(getAccessLevelNumber('Level 4 - Viewer')).toBe(4);
    expect(getAccessLevelNumber('بدون سطح')).toBeNull();
  });

  it('derives the canonical access policy from the selected role', () => {
    const commander = getRoleProfile('فرمانده');

    expect(commander.accessLevel).toBe('سطح 2 - دسترسی عملیاتی');
    expect(commander.permissions).toContain('مشاهده کاربران');
  });

  it('uses the guest viewer policy for unknown roles', () => {
    expect(getRoleProfile('نقش ناشناخته').role).toBe('ناظر مهمان');
  });

  it('maps each access level to the intended theme color', () => {
    const theme = createTheme();

    expect(getAccessLevelColor(theme, 'سطح 1 - دسترسی کامل')).toBe(theme.palette.error.main);
    expect(getAccessLevelColor(theme, 'سطح 2 - دسترسی عملیاتی')).toBe(theme.palette.warning.main);
    expect(getAccessLevelColor(theme, 'سطح 3 - دسترسی محدود')).toBe(theme.palette.info.main);
    expect(getAccessLevelColor(theme, 'سطح 4 - دسترسی مهمان')).toBe(theme.palette.success.main);
  });

  it('creates stable initials for user avatars', () => {
    expect(getUserInitials('علی رضایی')).toBe('عر');
    expect(getUserInitials('', 'ک')).toBe('ک');
  });
});
