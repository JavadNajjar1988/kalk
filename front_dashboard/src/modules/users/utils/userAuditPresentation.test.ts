import { describe, expect, it } from 'vitest';

import {
  getUserAuditActionLabel,
  getUserAuditActorLabel,
} from './userAuditPresentation';

describe('user audit presentation', () => {
  it('translates every known audit action to a Persian label', () => {
    expect(getUserAuditActionLabel('login_succeeded')).toBe('ورود موفق به سامانه');
    expect(getUserAuditActionLabel('account_locked')).toBe('قفل‌شدن حساب کاربری');
    expect(getUserAuditActionLabel('quick_action_updateAccessLevel')).toBe(
      'تغییر نقش و سطح دسترسی',
    );
  });

  it('does not expose unknown technical action codes', () => {
    expect(getUserAuditActionLabel('future_action')).toBe('رویداد کاربری ثبت‌شده');
  });

  it('prefers the Persian display name and has a system fallback', () => {
    expect(getUserAuditActorLabel('مدیر سامانه', 'admin')).toBe('مدیر سامانه');
    expect(getUserAuditActorLabel(undefined, undefined)).toBe('سامانه');
  });
});

