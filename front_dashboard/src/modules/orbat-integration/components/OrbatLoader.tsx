/**
 * ORBAT Loader Component
 * کامپوننت نمایش وضعیت بارگذاری ORBAT
 */

import React, { CSSProperties } from 'react';

export interface OrbatLoaderProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars';
  color?: string;
  backgroundColor?: string;
  overlay?: boolean;
  style?: CSSProperties;
  className?: string;
}

export const OrbatLoader: React.FC<OrbatLoaderProps> = ({
  message = 'در حال بارگیری ORBAT...',
  size = 'medium',
  variant = 'spinner',
  color = '#007bff',
  backgroundColor = 'rgba(255, 255, 255, 0.9)',
  overlay = true,
  style,
  className
}) => {
  // Size configurations
  const sizeConfig = {
    small: { loader: 24, font: 12 },
    medium: { loader: 40, font: 14 },
    large: { loader: 60, font: 16 }
  };
  
  const { loader: loaderSize, font: fontSize } = sizeConfig[size];
  
  // Base container style
  const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    ...style
  };
  
  // Overlay style
  const overlayStyle: CSSProperties = overlay ? {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor,
    zIndex: 1000,
    ...containerStyle
  } : containerStyle;
  
  // Loader components
  const renderSpinner = () => (
    <div
      style={{
        width: loaderSize,
        height: loaderSize,
        border: `3px solid #e3e3e3`,
        borderTop: `3px solid ${color}`,
        borderRadius: '50%',
        animation: 'orbat-spin 1s linear infinite'
      }}
    />
  );
  
  const renderDots = () => (
    <div
      style={{
        display: 'flex',
        gap: '4px',
        alignItems: 'center'
      }}
    >
      {[0, 1, 2].map(i => (
        <div
          key={i}
          style={{
            width: loaderSize / 4,
            height: loaderSize / 4,
            backgroundColor: color,
            borderRadius: '50%',
            animation: `orbat-dots 1.4s ease-in-out ${i * 0.16}s infinite both`
          }}
        />
      ))}
    </div>
  );
  
  const renderPulse = () => (
    <div
      style={{
        width: loaderSize,
        height: loaderSize,
        backgroundColor: color,
        borderRadius: '50%',
        animation: 'orbat-pulse 1.5s ease-in-out infinite'
      }}
    />
  );
  
  const renderBars = () => (
    <div
      style={{
        display: 'flex',
        gap: '3px',
        alignItems: 'end',
        height: loaderSize
      }}
    >
      {[0, 1, 2, 3, 4].map(i => (
        <div
          key={i}
          style={{
            width: loaderSize / 8,
            backgroundColor: color,
            animation: `orbat-bars 1.2s ease-in-out ${i * 0.1}s infinite`
          }}
        />
      ))}
    </div>
  );
  
  // Render appropriate loader
  const renderLoader = () => {
    switch (variant) {
      case 'dots': return renderDots();
      case 'pulse': return renderPulse();
      case 'bars': return renderBars();
      case 'spinner':
      default: return renderSpinner();
    }
  };
  
  return (
    <div style={overlayStyle} className={className}>
      {/* Loader */}
      {renderLoader()}
      
      {/* Message */}
      {message && (
        <div style={{ 
          fontSize,
          color: '#666',
          textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          {message}
        </div>
      )}
      
      {/* CSS Animations */}
      <style>
        {`
          @keyframes orbat-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes orbat-dots {
            0%, 80%, 100% { 
              transform: scale(0);
              opacity: 0.5;
            } 
            40% { 
              transform: scale(1);
              opacity: 1;
            }
          }
          
          @keyframes orbat-pulse {
            0% {
              transform: scale(0);
              opacity: 1;
            }
            100% {
              transform: scale(1);
              opacity: 0;
            }
          }
          
          @keyframes orbat-bars {
            0%, 40%, 100% {
              height: 20%;
            }
            20% {
              height: 100%;
            }
          }
        `}
      </style>
    </div>
  );
};

// Preset configurations
export const OrbatLoaderPresets = {
  small: (props?: Partial<OrbatLoaderProps>) => (
    <OrbatLoader size="small" {...props} />
  ),
  
  medium: (props?: Partial<OrbatLoaderProps>) => (
    <OrbatLoader size="medium" {...props} />
  ),
  
  large: (props?: Partial<OrbatLoaderProps>) => (
    <OrbatLoader size="large" {...props} />
  ),
  
  overlay: (props?: Partial<OrbatLoaderProps>) => (
    <OrbatLoader overlay={true} {...props} />
  ),
  
  inline: (props?: Partial<OrbatLoaderProps>) => (
    <OrbatLoader overlay={false} {...props} />
  ),
  
  dots: (props?: Partial<OrbatLoaderProps>) => (
    <OrbatLoader variant="dots" {...props} />
  ),
  
  pulse: (props?: Partial<OrbatLoaderProps>) => (
    <OrbatLoader variant="pulse" {...props} />
  ),
  
  bars: (props?: Partial<OrbatLoaderProps>) => (
    <OrbatLoader variant="bars" {...props} />
  )
};

// Higher-order component for adding loading state
export interface WithOrbatLoaderProps {
  isLoading?: boolean;
  loadingMessage?: string;
  loadingProps?: Partial<OrbatLoaderProps>;
}

export function withOrbatLoader<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P & WithOrbatLoaderProps> {
  return ({ 
    isLoading = false, 
    loadingMessage,
    loadingProps,
    ...props 
  }) => {
    if (isLoading) {
      return (
        <OrbatLoader 
          message={loadingMessage}
          {...loadingProps}
        />
      );
    }
    
    return <Component {...(props as P)} />;
  };
}