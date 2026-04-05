import type { Theme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

/** رنگ تأکید مودال‌های مدیریت منابع — همراستا با تم اصلی برنامه (primary) */
export function getResourcesDialogAccent(theme: Theme): string {
  return theme.palette.primary.main;
}

export function buildResourcesFormDialogSx(theme: Theme) {
  const accent = getResourcesDialogAccent(theme);
  const dialogBackground = `linear-gradient(135deg, ${alpha(accent, 0.08)}, ${alpha(accent, 0.04)})`;
  const inputSurface =
    theme.palette.mode === 'dark'
      ? alpha(theme.palette.background.default, 0.72)
      : alpha(theme.palette.common.white, 0.92);

  return {
    '& .MuiDialog-paper': {
      borderRadius: 3,
      backgroundColor: theme.palette.background.paper,
      backgroundImage: dialogBackground,
      border: `1px solid ${alpha(accent, 0.24)}`,
      boxShadow: `0 20px 60px ${alpha(accent, 0.18)}`,
    },
    '& .MuiOutlinedInput-root': {
      backgroundColor: inputSurface,
      '& fieldset': {
        borderColor: alpha(accent, 0.28),
      },
      '&:hover fieldset': {
        borderColor: alpha(accent, 0.45),
      },
      '&.Mui-focused fieldset': {
        borderColor: accent,
        boxShadow: `0 0 0 3px ${alpha(accent, 0.12)}`,
      },
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: accent,
    },
  };
}

export function buildResourcesDialogPaperBase(theme: Theme) {
  const accent = getResourcesDialogAccent(theme);
  const dialogBackground = `linear-gradient(135deg, ${alpha(accent, 0.08)}, ${alpha(accent, 0.04)})`;
  return {
    backgroundColor: theme.palette.background.paper,
    backgroundImage: dialogBackground,
    border: `1px solid ${alpha(accent, 0.24)}`,
    boxShadow: `0 20px 60px ${alpha(accent, 0.18)}`,
  };
}

/** مودال لایهٔ نقشه روی موبایل تمام‌صفحه بدون گوشه گرد */
export function buildResourcesLayerDialogSx(theme: Theme, isMobile: boolean) {
  const base = buildResourcesFormDialogSx(theme);
  const paperBase = buildResourcesDialogPaperBase(theme);
  return {
    ...base,
    '& .MuiDialog-paper': {
      ...paperBase,
      borderRadius: isMobile ? 0 : 3,
    },
  };
}

export function resourcesDialogTitleSx(theme: Theme) {
  const accent = getResourcesDialogAccent(theme);
  return {
    borderBottom: `1px solid ${alpha(accent, 0.2)}`,
    backgroundColor: alpha(accent, 0.08),
    fontWeight: 700 as const,
  };
}

export function resourcesDialogContentDividersSx(theme: Theme) {
  const accent = getResourcesDialogAccent(theme);
  return {
    borderColor: alpha(accent, 0.16),
    backgroundColor: 'transparent' as const,
  };
}

export function resourcesDialogActionsSx(theme: Theme) {
  const accent = getResourcesDialogAccent(theme);
  return {
    borderTop: `1px solid ${alpha(accent, 0.2)}`,
    backgroundColor: alpha(accent, 0.04),
    px: 3,
    py: 2,
    gap: 1,
  };
}

export function resourcesOutlinedCancelButtonSx(theme: Theme) {
  const accent = getResourcesDialogAccent(theme);
  return {
    borderRadius: 2,
    borderColor: alpha(accent, 0.35),
  };
}

/** برای TextFieldهایی که بیرون از سلکتور عمومی دیالوگ به sx نیاز دارند */
export function buildResourcesTextFieldOutlineSx(theme: Theme) {
  const accent = getResourcesDialogAccent(theme);
  const inputSurface =
    theme.palette.mode === 'dark'
      ? alpha(theme.palette.background.default, 0.72)
      : alpha(theme.palette.common.white, 0.92);
  return {
    '& .MuiOutlinedInput-root': {
      backgroundColor: inputSurface,
      '& fieldset': {
        borderColor: alpha(accent, 0.28),
      },
      '&:hover fieldset': {
        borderColor: alpha(accent, 0.45),
      },
      '&.Mui-focused fieldset': {
        borderColor: accent,
        boxShadow: `0 0 0 3px ${alpha(accent, 0.12)}`,
      },
    },
  };
}

/** کاغذ Menu/Popover — همان پس‌زمینه و حاشیهٔ دیالوگ‌های فرم منابع */
export function resourcesMenuPaperSx(theme: Theme, extra?: Record<string, unknown>) {
  return {
    ...buildResourcesDialogPaperBase(theme),
    borderRadius: 3,
    overflow: 'hidden',
    backdropFilter: 'none',
    ...extra,
  };
}
