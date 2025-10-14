import React, { useEffect, useRef } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/store';
import { selectIsAuthenticated } from '@/store/slices/authSlice';
import { OrbatMessageBridge } from '@/modules/orbat-integration/adapters/OrbatMessageBridge';

const resolveKalknegarBaseUrl = () => {
  const rawOrigin = import.meta.env.VITE_KALKNEGAR_ORIGIN as string | undefined;
  const origin = rawOrigin ? rawOrigin.replace(/\/+$/, '') : 'http://127.0.0.1:5173';
  const rawPath = import.meta.env.VITE_KALKNEGAR_PATH as string | undefined;
  const sanitized = rawPath ? rawPath.replace(/^\/+/, '') : 'kalknegar/';
  const path = sanitized.endsWith('/') ? sanitized : `${sanitized}/`;
  return `${origin}/${path}`;
};

const KalknegarIframe: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const bridgeRef = useRef<OrbatMessageBridge | null>(null);
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const kalknegarBaseUrl = useRef(resolveKalknegarBaseUrl());

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('[KalknegarIframe] User not authenticated, redirecting to login');
      navigate('/auth/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    // Initialize the bridge
    bridgeRef.current = new OrbatMessageBridge({
      enableLogging: true,
    });

    // Set the iframe reference when it loads
    const iframe = iframeRef.current;
    if (iframe) {
      bridgeRef.current.setIframe(iframe);
    }

    return () => {
      if (bridgeRef.current) {
        bridgeRef.current.destroy();
      }
    };
  }, []);

  // Check if we have a token and log it
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    // If no token in localStorage, try to get it from sessionStorage or parent window
    if (!token) {
      console.log('[KalknegarIframe] No token in localStorage, checking alternatives...');
      
      // Try sessionStorage
      const sessionToken = sessionStorage.getItem('access_token');
      if (sessionToken) {
        console.log('[KalknegarIframe] Found token in sessionStorage, copying to localStorage');
        localStorage.setItem('access_token', sessionToken);
      }
      
      // Try to get from parent window (if we're in an iframe)
      if (window.parent !== window) {
        try {
          const parentToken = window.parent.localStorage.getItem('access_token');
          if (parentToken) {
            console.log('[KalknegarIframe] Found token in parent localStorage, copying to localStorage');
            localStorage.setItem('access_token', parentToken);
          }
        } catch (e) {
          console.log('[KalknegarIframe] Cannot access parent localStorage:', e);
        }
      }
    }
  }, []);

  const handleIframeLoad = () => {
    console.log('[KalknegarIframe] Iframe loaded');
    const iframe = iframeRef.current;
    if (!iframe || !bridgeRef.current) {
      return;
    }

    console.log('[KalknegarIframe] Setting iframe reference to bridge');
    bridgeRef.current.setIframe(iframe);
  };

  // Show loading if not authenticated
  if (!isAuthenticated) {
    return (
      <Box sx={{ 
        width: '100%', 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column'
      }}>
        <CircularProgress size={40} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          در حال بررسی احراز هویت...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100vh', position: 'relative' }}>
      <iframe
        ref={iframeRef}
        src={`${kalknegarBaseUrl.current}?integration=react&token=${localStorage.getItem('access_token') || ''}`}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
        }}
        onLoad={handleIframeLoad}
        title="KalkNegar ORBAT Mapper"
      />
      
      {/* Loading overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          zIndex: 1000,
          opacity: 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: 'none',
        }}
        id="kalknegar-loading-overlay"
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={40} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            در حال بارگذاری KalkNegar...
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default KalknegarIframe;
