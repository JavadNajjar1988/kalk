/**
 * ORBAT Error Boundary Component
 * مدیریت خطاهای React در ماژول ORBAT
 */

import React, { Component, ErrorInfo, ReactNode, CSSProperties } from 'react';
import { OrbatErrorService } from '../services/OrbatErrorService';

interface OrbatErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export interface OrbatErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: ErrorInfo, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
  enableRetry?: boolean;
  maxRetries?: number;
  errorService?: OrbatErrorService;
  title?: string;
  message?: string;
  showDetails?: boolean;
  style?: CSSProperties;
  className?: string;
}

export class OrbatErrorBoundary extends Component<
  OrbatErrorBoundaryProps,
  OrbatErrorBoundaryState
> {
  private retryCount = 0;
  private errorService: OrbatErrorService;

  constructor(props: OrbatErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
    
    this.errorService = props.errorService || new OrbatErrorService();
  }

  static getDerivedStateFromError(error: Error): Partial<OrbatErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Report error to error service
    const errorId = this.errorService.reportError({
      type: 'UNKNOWN_ERROR',
      severity: 'high',
      message: error.message,
      details: {
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        retryCount: this.retryCount
      },
      source: 'react',
      stack: error.stack,
      context: {
        componentName: 'OrbatErrorBoundary',
        action: 'component_error'
      }
    });

    this.setState({
      errorInfo,
      errorId
    });

    // Call onError callback
    this.props.onError?.(error, errorInfo, errorId);

    // Log to console
    console.error('ORBAT Error Boundary caught an error:', error, errorInfo);
  }

  private handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    
    if (this.retryCount < maxRetries) {
      this.retryCount += 1;
      
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null
      });
      
      // Resolve previous error if exists
      if (this.state.errorId) {
        this.errorService.resolveError(this.state.errorId, `Retry attempt ${this.retryCount}`);
      }
    }
  };

  private renderDefaultFallback() {
    const { 
      title = 'Something went wrong',
      message = 'An error occurred while loading the ORBAT component.',
      showDetails = process.env.NODE_ENV === 'development',
      style,
      className,
      enableRetry = true,
      maxRetries = 3
    } = this.props;
    
    const { error, errorInfo } = this.state;
    const canRetry = enableRetry && this.retryCount < maxRetries;

    const containerStyle: CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      textAlign: 'center',
      backgroundColor: '#fff',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      maxWidth: '600px',
      margin: '20px auto',
      ...style
    };

    return (
      <div style={containerStyle} className={className}>
        {/* Error Icon */}
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>
          🚫
        </div>

        {/* Title */}
        <h2 style={{ 
          color: '#dc3545',
          marginBottom: '8px',
          fontSize: '24px',
          fontWeight: '600'
        }}>
          {title}
        </h2>

        {/* Message */}
        <p style={{ 
          color: '#666',
          marginBottom: '24px',
          fontSize: '16px',
          lineHeight: '1.5'
        }}>
          {message}
        </p>

        {/* Error Details (Development) */}
        {showDetails && error && (
          <details style={{ 
            marginBottom: '24px',
            textAlign: 'left',
            width: '100%',
            maxWidth: '500px'
          }}>
            <summary style={{ 
              cursor: 'pointer',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#666'
            }}>
              Error Details
            </summary>
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontFamily: 'monospace',
              overflow: 'auto',
              maxHeight: '200px'
            }}>
              <div style={{ marginBottom: '8px' }}>
                <strong>Error:</strong> {error.message}
              </div>
              {error.stack && (
                <div style={{ marginBottom: '8px' }}>
                  <strong>Stack:</strong>
                  <pre style={{ 
                    margin: '4px 0',
                    whiteSpace: 'pre-wrap',
                    fontSize: '11px'
                  }}>
                    {error.stack}
                  </pre>
                </div>
              )}
              {errorInfo?.componentStack && (
                <div>
                  <strong>Component Stack:</strong>
                  <pre style={{ 
                    margin: '4px 0',
                    whiteSpace: 'pre-wrap',
                    fontSize: '11px'
                  }}>
                    {errorInfo.componentStack}
                  </pre>
                </div>
              )}
            </div>
          </details>
        )}

        {/* Actions */}
        <div style={{ 
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          {canRetry && (
            <button
              onClick={this.handleRetry}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Try Again ({maxRetries - this.retryCount} left)
            </button>
          )}
          
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Reload Page
          </button>
        </div>

        {/* Retry Information */}
        {this.retryCount > 0 && (
          <div style={{
            marginTop: '16px',
            padding: '8px 12px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#856404'
          }}>
            Retry attempt: {this.retryCount} / {maxRetries}
          </div>
        )}
      </div>
    );
  }

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error && errorInfo) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback(error, errorInfo, this.handleRetry);
      }

      // Use default fallback
      return this.renderDefaultFallback();
    }

    return children;
  }
}

// HOC for wrapping components with error boundary
export function withOrbatErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  boundaryProps?: Partial<OrbatErrorBoundaryProps>
): React.FC<P> {
  return (props: P) => (
    <OrbatErrorBoundary {...boundaryProps}>
      <Component {...props} />
    </OrbatErrorBoundary>
  );
}

// Hook for error reporting within components
export function useOrbatErrorHandler(errorService?: OrbatErrorService) {
  const service = errorService || new OrbatErrorService();
  
  const reportError = React.useCallback((
    error: Error,
    context?: {
      componentName?: string;
      action?: string;
      [key: string]: any;
    }
  ) => {
    return service.reportError({
      type: 'UNKNOWN_ERROR',
      severity: 'medium',
      message: error.message,
      details: error,
      source: 'react',
      stack: error.stack,
      context
    });
  }, [service]);
  
  const reportComponentError = React.useCallback((
    componentName: string,
    action: string,
    error: Error
  ) => {
    return reportError(error, { componentName, action });
  }, [reportError]);
  
  return {
    reportError,
    reportComponentError,
    errorService: service
  };
}