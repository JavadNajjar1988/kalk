/**
 * ORBAT Iframe Component
 * کامپوننت wrapper برای iframe حاوی ORBAT Mapper
 */

import React, { 
  useRef, 
  useEffect, 
  useState, 
  forwardRef, 
  useImperativeHandle,
  CSSProperties 
} from 'react';
import { useOrbat } from './OrbatProvider';

export interface OrbatIframeProps {
  src?: string;
  mode?: 'chart' | 'map' | 'grid' | 'story';
  scenarioId?: string;
  width?: string | number;
  height?: string | number;
  style?: CSSProperties;
  className?: string;
  title?: string;
  allowFullScreen?: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onReady?: () => void;
}

export interface OrbatIframeRef {
  iframe: HTMLIFrameElement | null;
  reload: () => void;
  focus: () => void;
  getContentWindow: () => Window | null;
}

export const OrbatIframe = forwardRef<OrbatIframeRef, OrbatIframeProps>(({
  src,
  mode = 'chart',
  scenarioId,
  width = '100%',
  height = '100%',
  style,
  className,
  title = 'ORBAT Mapper',
  allowFullScreen = false,
  onLoad,
  onError,
  onReady
}, ref) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const { config, connect, errors, isReady } = useOrbat();
  
  // Build iframe URL
  const iframeUrl = React.useMemo(() => {
    console.log('[OrbatIframe] Building URL - src:', src, 'mode:', mode, 'scenarioId:', scenarioId);
    
    if (src) {
      console.log('[OrbatIframe] Using provided src URL:', src);
      return src;
    }
    
    const baseUrl = config.get('iframe.baseUrl');
    console.log('[OrbatIframe] Base URL from config:', baseUrl);
    
    const url = new URL(baseUrl);
    
    // Don't add mode to path - Vue backend expects root path
    // url.pathname = `/${mode}`;
    
    // Add mode as parameter instead
    url.searchParams.set('mode', mode);
    
    // Add scenario parameter if provided
    if (scenarioId) {
      url.searchParams.set('scenario', scenarioId);
    }
    
    // Add integration flag
    url.searchParams.set('integration', 'react');
    
    console.log('[OrbatIframe] Final constructed URL:', url.toString());
    return url.toString();
  }, [src, config, mode, scenarioId]);
  
  // Handle iframe load
  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    setErrorMessage('');
    
    if (iframeRef.current) {
      try {
        connect(iframeRef.current);
        onLoad?.();
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to connect iframe';
        setHasError(true);
        setErrorMessage(errorMsg);
        onError?.(error instanceof Error ? error : new Error(errorMsg));
        errors.reportIframeError(errorMsg, error);
      }
    }
  };
  
  // Handle iframe error
  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    setErrorMessage('Failed to load ORBAT Mapper');
    
    const error = new Error('Iframe failed to load');
    onError?.(error);
    errors.reportIframeError('Iframe load failed', { url: iframeUrl });
  };
  
  // Handle ORBAT ready
  useEffect(() => {
    if (isReady) {
      onReady?.();
    }
  }, [isReady, onReady]);
  
  // Imperative handle for ref
  useImperativeHandle(ref, () => ({
    iframe: iframeRef.current,
    reload: () => {
      if (iframeRef.current) {
        setIsLoading(true);
        setHasError(false);
        iframeRef.current.src = iframeUrl;
      }
    },
    focus: () => {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.focus();
      }
    },
    getContentWindow: () => {
      return iframeRef.current?.contentWindow || null;
    }
  }), [iframeUrl]);
  
  // Styles
  const iframeStyle: CSSProperties = {
    width,
    height,
    border: 'none',
    outline: 'none',
    ...style
  };
  
  const containerStyle: CSSProperties = {
    position: 'relative',
    width,
    height,
    backgroundColor: '#f5f5f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };
  
  return (
    <div style={containerStyle} className={className}>
      {/* Main iframe */}
      <iframe
        ref={iframeRef}
        src={iframeUrl}
        title={title}
        style={iframeStyle}
        allowFullScreen={allowFullScreen}
        onLoad={handleLoad}
        onError={handleError}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
      />
      
      {/* Loading overlay */}
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            zIndex: 10
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid #e3e3e3',
              borderTop: '3px solid #007bff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}
          />
          <div style={{ 
            fontSize: '14px', 
            color: '#666',
            textAlign: 'center'
          }}>
            Loading ORBAT Mapper...
          </div>
          
          {/* CSS animation */}
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      )}
      
      {/* Error overlay */}
      {hasError && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            zIndex: 10,
            padding: '20px',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              fontSize: '48px',
              color: '#dc3545'
            }}
          >
            ⚠️
          </div>
          <div style={{ 
            fontSize: '16px', 
            color: '#dc3545',
            fontWeight: 'bold'
          }}>
            Failed to Load ORBAT Mapper
          </div>
          <div style={{ 
            fontSize: '14px', 
            color: '#666',
            maxWidth: '400px'
          }}>
            {errorMessage}
          </div>
          <button
            onClick={() => {
              if (iframeRef.current) {
                setIsLoading(true);
                setHasError(false);
                iframeRef.current.src = iframeUrl;
              }
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
});

OrbatIframe.displayName = 'OrbatIframe';