const USER_AUDIT_ACTION_LABELS: Record<string, string> = {
  user_created: 'ایجاد حساب کاربری',
  user_updated: 'ویرایش اطلاعات کاربر',
  user_archived: 'انتقال کاربر به بایگانی',
  user_restored: 'بازیابی کاربر از بایگانی',
  avatar_updated: 'تغییر آواتار',
  quick_action_toggleActive: 'تغییر وضعیت فعالیت حساب',
  quick_action_changePassword: 'تغییر رمز عبور',
  quick_action_updateAccessLevel: 'تغییر نقش و سطح دسترسی',
  login_succeeded: 'ورود موفق به سامانه',
  login_failed: 'ورود ناموفق به سامانه',
  account_locked: 'قفل‌شدن حساب کاربری',
};

export const getUserAuditActionLabel = (action: string): string =>
  USER_AUDIT_ACTION_LABELS[action] || 'رویداد کاربری ثبت‌شده';

export const getUserAuditActorLabel = (
  displayName?: string,
  username?: string,
): string => displayName?.trim() || username?.trim() || 'سامانه';

