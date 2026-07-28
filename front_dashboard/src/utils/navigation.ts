import type { NavigateFunction } from 'react-router-dom';

const normalizePath = (pathname: string) => {
  const normalized = pathname.replace(/\/+$/, '');
  return normalized || '/';
};

export function getSectionParent(pathname: string) {
  const normalized = normalizePath(pathname);
  const segments = normalized.split('/').filter(Boolean);

  if (segments.length <= 1) return '/';
  if (segments[0] === 'dashboard' && segments.length === 2) {
    return '/dashboard';
  }

  return `/${segments.slice(0, -1).join('/')}`;
}

export function hasInternalHistory() {
  const index = window.history.state?.idx;
  return typeof index === 'number' ? index > 0 : window.history.length > 1;
}

export function navigateToPreviousStep(
  navigate: NavigateFunction,
  pathname: string,
  fallbackPath = getSectionParent(pathname)
) {
  if (hasInternalHistory()) {
    navigate(-1);
    return;
  }

  const currentPath = normalizePath(pathname);
  const fallback = normalizePath(fallbackPath);
  if (fallback !== currentPath) {
    navigate(fallback, { replace: true });
  }
}
