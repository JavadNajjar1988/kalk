/**
 * ORBAT Viewer - Main Component
 * کامپوننت اصلی نمایش ORBAT Mapper در React
 */

import React, { 
  useRef, 
  useState, 
  useEffect, 
  useCallback,
  CSSProperties 
} from 'react';
import { OrbatProvider, useOrbat } from './OrbatProvider';
import { OrbatIframe, OrbatIframeRef } from './OrbatIframe';
import { OrbatLoader } from './OrbatLoader';
import { OrbatErrorBoundary } from './OrbatErrorBoundary';
import type { OrbatConfig } from '../services/OrbatConfigService';

export interface OrbatViewerProps {
  // ORBAT Configuration
  config?: Partial<OrbatConfig>;
  
  // Iframe props
  mode?: 'chart' | 'map' | 'grid' | 'story';
  scenarioId?: string;
  width?: string | number;
  height?: string | number;
  
  // Styling
  style?: CSSProperties;
  className?: string;
  
  // Loading and error handling
  loadingMessage?: string;
  showLoader?: boolean;
  enableErrorBoundary?: boolean;
  
  // Event handlers
  onReady?: () => void;
  onError?: (error: Error) => void;
  onScenarioLoad?: (scenarioId: string) => void;
  onUnitSelect?: (unitIds: string[]) => void;
  onViewChange?: (mode: string) => void;
  
  // Features
  enableKeyboardShortcuts?: boolean;
  enableContextMenu?: boolean;
  enableUndoRedo?: boolean;
}

// Internal viewer component (used within provider)
const OrbatViewerInternal: React.FC<Omit<OrbatViewerProps, 'config'>> = ({
  mode = 'chart',
  scenarioId,
  width = '100%',
  height = '600px',
  style,
  className,
  loadingMessage = 'در حال بارگیری نقشه‌کش آرایش نبرد...',
  showLoader = true,
  onReady,
  onError,
  onScenarioLoad,
  onUnitSelect,
  onViewChange,
  enableKeyboardShortcuts = true,
  enableContextMenu = true,
  enableUndoRedo = true
}) => {
  const iframeRef = useRef<OrbatIframeRef>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMode, setCurrentMode] = useState(mode);
  
  const { 
    isReady, 
    isConnected, 
    error, 
    events, 
    commands, 
    errors 
  } = useOrbat();
  
  // Handle iframe ready
  const handleIframeReady = useCallback(() => {
    setIsLoading(false);
    onReady?.();
  }, [onReady]);
  
  // Handle iframe error
  const handleIframeError = useCallback((error: Error) => {
    setIsLoading(false);
    onError?.(error);
  }, [onError]);
  
  // Setup event listeners
  useEffect(() => {
    if (!isReady) return;
    
    const unsubscribers: (() => void)[] = [];
    
    // Scenario events
    unsubscribers.push(
      events.onScenarioLoaded((data) => {
        onScenarioLoad?.(data.scenarioId);
      })
    );
    
    // Selection events
    unsubscribers.push(
      events.onSelectionChanged((data) => {
        onUnitSelect?.(data.selectedUnitIds || []);
      })
    );
    
    // View mode events
    unsubscribers.push(
      events.onViewModeChanged((data) => {
        setCurrentMode(data.mode);
        onViewChange?.(data.mode);
      })
    );
    
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [isReady, events, onScenarioLoad, onUnitSelect, onViewChange]);
  
  // Keyboard shortcuts
  useEffect(() => {
    if (!enableKeyboardShortcuts || !isReady) return;
    
    const handleKeyDown = async (event: KeyboardEvent) => {
      // Ctrl/Cmd + Z for undo
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        try {
          await commands.undo();
        } catch (error) {
          errors.reportCommandError('UNDO', 'Undo failed', error);
        }
      }
      
      // Ctrl/Cmd + Shift + Z for redo
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && event.shiftKey) {
        event.preventDefault();
        try {
          await commands.redo();
        } catch (error) {
          errors.reportCommandError('REDO', 'Redo failed', error);
        }
      }
      
      // Escape to clear selection
      if (event.key === 'Escape') {
        try {
          await commands.clearSelection();
        } catch (error) {
          errors.reportCommandError('CLEAR_SELECTION', 'Clear selection failed', error);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboardShortcuts, isReady, commands, errors]);
  
  // Auto-load scenario if provided
  useEffect(() => {
    if (!isReady || !scenarioId) return;
    
    const loadScenario = async () => {
      try {
        await commands.loadScenario({
          source: 'local',
          scenarioId
        });
      } catch (error) {
        errors.reportCommandError(
          'LOAD_SCENARIO', 
          `Failed to load scenario: ${scenarioId}`,
          error
        );
      }
    };
    
    loadScenario();
  }, [isReady, scenarioId, commands, errors]);
  
  // Container style
  const containerStyle: CSSProperties = {
    position: 'relative',
    width,
    height,
    backgroundColor: '#f5f5f5',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    overflow: 'hidden',
    ...style
  };
  
  return (
    <div style={containerStyle} className={className}>
      {/* Main iframe */}
      <OrbatIframe
        ref={iframeRef}
        mode={currentMode}
        scenarioId={scenarioId}
        width="100%"
        height="100%"
        onLoad={handleIframeReady}
        onError={handleIframeError}
        onReady={handleIframeReady}
      />
      
      {/* Loading overlay */}
      {(isLoading || !isConnected) && showLoader && (
        <OrbatLoader
          message={loadingMessage}
          overlay={true}
          backgroundColor="rgba(255, 255, 255, 0.9)"
        />
      )}
      
      {/* Error overlay */}
      {error && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20
          }}
        >
          <div style={{
            textAlign: 'center',
            padding: '20px',
            maxWidth: '400px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <div style={{ 
              fontSize: '16px', 
              color: '#dc3545',
              marginBottom: '8px',
              fontWeight: 'bold'
            }}>
              Connection Error
            </div>
            <div style={{ 
              fontSize: '14px', 
              color: '#666',
              marginBottom: '16px'
            }}>
              {error}
            </div>
            <button
              onClick={() => window.location.reload()}
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
              Reload
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Main viewer component with provider wrapper
export const OrbatViewer: React.FC<OrbatViewerProps> = ({
  config,
  enableErrorBoundary = true,
  ...props
}) => {
  const content = (
    <OrbatProvider config={config}>
      <OrbatViewerInternal {...props} />
    </OrbatProvider>
  );
  
  if (enableErrorBoundary) {
    return (
      <OrbatErrorBoundary
        title="ORBAT Viewer Error"
        message="An error occurred while loading the ORBAT viewer."
        showDetails={process.env.NODE_ENV === 'development'}
      >
        {content}
      </OrbatErrorBoundary>
    );
  }
  
  return content;
};

// Ref interface for imperative API
export interface OrbatViewerRef {
  // View control
  setMode: (mode: 'chart' | 'map' | 'grid' | 'story') => Promise<void>;
  zoomToUnit: (unitId: string) => Promise<void>;
  zoomToExtent: (extent: [number, number, number, number]) => Promise<void>;
  
  // Selection
  selectUnits: (unitIds: string[]) => Promise<void>;
  clearSelection: () => Promise<void>;
  
  // Scenario
  loadScenario: (scenarioId: string) => Promise<void>;
  saveScenario: () => Promise<void>;
  
  // Timeline
  playTimeline: () => Promise<void>;
  pauseTimeline: () => Promise<void>;
  seekTimeline: (time: number) => Promise<void>;
  
  // Data
  getUnits: () => Promise<any[]>;
  getSelection: () => Promise<any>;
  
  // Utility
  reload: () => void;
  focus: () => void;
}

// Forward ref version with imperative API
export const OrbatViewerWithRef = React.forwardRef<OrbatViewerRef, OrbatViewerProps>(
  (props, ref) => {
    const commandsRef = useRef<any>(null);
    const dataRef = useRef<any>(null);
    
    // Imperative API
    React.useImperativeHandle(ref, () => ({
      setMode: async (mode) => {
        if (commandsRef.current) {
          await commandsRef.current.setViewMode(mode);
        }
      },
      zoomToUnit: async (unitId) => {
        if (commandsRef.current) {
          await commandsRef.current.zoomToUnit(unitId);
        }
      },
      zoomToExtent: async (extent) => {
        if (commandsRef.current) {
          await commandsRef.current.zoomToExtent(extent);
        }
      },
      selectUnits: async (unitIds) => {
        if (commandsRef.current) {
          await commandsRef.current.selectUnits(unitIds);
        }
      },
      clearSelection: async () => {
        if (commandsRef.current) {
          await commandsRef.current.clearSelection();
        }
      },
      loadScenario: async (scenarioId) => {
        if (commandsRef.current) {
          await commandsRef.current.loadScenario({ source: 'local', scenarioId });
        }
      },
      saveScenario: async () => {
        if (commandsRef.current) {
          await commandsRef.current.saveScenario({ destination: 'local' });
        }
      },
      playTimeline: async () => {
        if (commandsRef.current) {
          await commandsRef.current.playTimeline();
        }
      },
      pauseTimeline: async () => {
        if (commandsRef.current) {
          await commandsRef.current.pauseTimeline();
        }
      },
      seekTimeline: async (time) => {
        if (commandsRef.current) {
          await commandsRef.current.seekTimeline(time);
        }
      },
      getUnits: async () => {
        if (dataRef.current) {
          return await dataRef.current.getUnits();
        }
        return [];
      },
      getSelection: async () => {
        if (dataRef.current) {
          return await dataRef.current.getSelection();
        }
        return null;
      },
      reload: () => {
        window.location.reload();
      },
      focus: () => {
        // Focus implementation
      }
    }), []);
    
    return (
      <OrbatProvider config={props.config}>
        <InternalViewerWithRefs 
          commandsRef={commandsRef}
          dataRef={dataRef}
          {...props}
        />
      </OrbatProvider>
    );
  }
);

// Internal component with refs
const InternalViewerWithRefs: React.FC<OrbatViewerProps & {
  commandsRef: React.MutableRefObject<any>;
  dataRef: React.MutableRefObject<any>;
}> = ({ commandsRef, dataRef, ...props }) => {
  const { commands, data } = useOrbat();
  
  React.useEffect(() => {
    commandsRef.current = commands;
    dataRef.current = data;
  }, [commands, data, commandsRef, dataRef]);
  
  return <OrbatViewerInternal {...props} />;
};

OrbatViewerWithRef.displayName = 'OrbatViewerWithRef';