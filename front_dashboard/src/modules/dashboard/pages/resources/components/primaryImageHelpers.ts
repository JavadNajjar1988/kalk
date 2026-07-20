import resourceApiService from '@/services/api/resourceApiService';

/**
 * تغییرات تصویر اصلی که از مودال به سمت Tab منتقل می‌شود.
 */
export interface PrimaryImageChanges {
  /** فایل جدید برای آپلود (در صورت تعویض/افزودن). */
  selectedFile?: File | null;
  /** اگر true باشد، تصویر فعلی باید حذف شود. */
  clearExisting?: boolean;
}

/**
 * بر اساس وضعیت قبلی primaryMediaId و تغییرات کاربر، عملیات upload/delete را
 * انجام می‌دهد و در نهایت primaryMediaId جدید را بازمی‌گرداند.
 */
export async function applyPrimaryImageChanges(params: {
  resourceId: string;
  currentPrimaryMediaId?: string | null;
  changes?: PrimaryImageChanges;
}): Promise<string | undefined> {
  const { resourceId, currentPrimaryMediaId, changes } = params;
  let primaryMediaId: string | undefined = currentPrimaryMediaId || undefined;

  if (changes?.selectedFile) {
    if (primaryMediaId) {
      try {
        await resourceApiService.deleteMedia(primaryMediaId);
      } catch (err) {
        console.warn('failed to delete previous primary media', err);
      }
    }
    const media = await resourceApiService.uploadMedia(changes.selectedFile, {
      resourceId,
    });
    primaryMediaId = media.id;
    return primaryMediaId;
  }

  if (changes?.clearExisting && primaryMediaId) {
    try {
      await resourceApiService.deleteMedia(primaryMediaId);
    } catch (err) {
      console.warn('failed to delete primary media on clear', err);
    }
    return undefined;
  }

  return primaryMediaId;
}
