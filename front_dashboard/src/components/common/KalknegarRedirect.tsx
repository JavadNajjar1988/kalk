import React, { useEffect, useRef } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { useAppSelector } from '@/store';
import { selectIsAuthenticated } from '@/store/slices/authSlice';

/**
 * Redirects the user to the Vue KalkNegar application that is now served
 * behind the same origin via the Vite proxy. We keep the SPA path intact,
 * attach integration metadata when available, and fall back to a spinner
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
    window.location.replace(nextUrl);
  }, [isAuthenticated, location]);

  return (
    <Box
      sx={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <CircularProgress size={48} />
      <Typography variant="h6">
        Redirecting to KalkNegar...
      </Typography>
    </Box>
  );
};

export default KalknegarRedirect;
