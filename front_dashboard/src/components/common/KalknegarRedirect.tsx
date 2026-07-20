import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppSelector } from '@/store';
import { selectIsAuthenticated } from '@/store/slices/authSlice';
import KalknegarLoadingDialog from './KalknegarLoadingDialog';

/**
 * Redirects the user to the Vue KalkNegar application that is now served
 * behind the same origin via the Vite proxy. We keep the SPA path intact,
 * attach integration metadata when available, and show the loading dialog
 * until the redirect completes.
 */
const KalknegarRedirect: React.FC = () => {
  const location = useLocation();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const redirected = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || redirected.current) {
      return;
    }

    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);

    if (!params.has('integration')) {
      params.set('integration', 'react');
    }

    if (params.has('token')) {
      params.delete('token');
    }

    let pathname = url.pathname;
    if (pathname === '/kalknegar') {
      pathname = '/kalknegar/';
    }

    const nextSearch = params.toString();
    const nextUrl = `${pathname}${nextSearch ? `?${nextSearch}` : ''}${url.hash}`;

    redirected.current = true;
    
    // اضافه کردن تاخیر کوتاه برای نمایش دیالوگ لودینگ
    setTimeout(() => {
      window.location.replace(nextUrl);
    }, 1500);
  }, [isAuthenticated, location]);

  // نمایش دیالوگ لودینگ به جای صفحه جداگانه
  return <KalknegarLoadingDialog open={true} />;
};

export default KalknegarRedirect;
