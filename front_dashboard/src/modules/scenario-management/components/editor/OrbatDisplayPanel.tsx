/**
 * ORBAT Display Panel
 * پنل اصلی نمایش ORBAT با ادغام headless module
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Box, Alert, LinearProgress, Typography } from '@mui/material';
import { 
  OrbatViewer,
  useOrbat
} from '../../../orbat-integration';

export interface OrbatDisplayPanelProps {
  scenario: any;
  mode: 'map' | 'grid' | 'chart';
}

export const OrbatDisplayPanel: React.FC<OrbatDisplayPanelProps> = ({
  scenario,
  mode,
}) => {
  console.log('[OrbatDisplayPanel] Rendering with scenario:', scenario, 'mode:', mode);
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  // ORBAT integration hooks
  const { isReady, isConnected, error: orbatError } = useOrbat();
  
  console.log('[OrbatDisplayPanel] ORBAT state - isReady:', isReady, 'isConnected:', isConnected, 'error:', orbatError);

  // Handle ORBAT ready state
  useEffect(() => {
    if (isReady && isConnected) {
      setIsLoading(false);
      setError(null);
      setLoadingProgress(100);
    }
  }, [isReady, isConnected]);

  // Handle ORBAT errors
  useEffect(() => {
    if (orbatError) {
      setError(orbatError);
      setIsLoading(false);
    }
  }, [orbatError]);

  // Handle scenario ready
  const handleScenarioReady = useCallback(() => {
    console.log('ORBAT scenario is ready');
    setIsLoading(false);
    setLoadingProgress(100);
  }, []);

  // Handle scenario error
  const handleScenarioError = useCallback((error: Error) => {
    console.error('ORBAT scenario error:', error);
    setError(`خطا در ORBAT: ${error.message}`);
    setIsLoading(false);
  }, []);

  // Handle unit selection
  const handleUnitSelect = useCallback((unitIds: string[]) => {
    console.log('Units selected:', unitIds);
    // TODO: Update local state or trigger events
  }, []);

  // Handle view change
  const handleViewChange = useCallback((newMode: string) => {
    console.log('View changed to:', newMode);
    // Mode change is handled by parent component
  }, []);

  // Loading state - only show loading if there's an error or we're explicitly loading
  // Don't block rendering if just waiting for ORBAT ready signal
  if (error) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4,
          bgcolor: 'background.default',
        }}
      >
        <Alert 
          severity="error"
          sx={{ maxWidth: 500 }}
          variant="outlined"
        >
          <Typography variant="h6" sx={{ mb: 1 }}>
            خطا در نمایش ORBAT
          </Typography>
          <Typography variant="body2">
            {error}
          </Typography>
        </Alert>
      </Box>
    );
  }

  // Main ORBAT viewer
  return (
    <Box
      sx={{
        height: '100%',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        bgcolor: 'background.default',
      }}
    >
      <OrbatViewer
        mode={mode}
        scenarioId={scenario?.id}
        width="100%"
        height="100%"
        loadingMessage="در حال بارگذاری ORBAT..."
        showLoader={true}
        enableErrorBoundary={true}
        onReady={handleScenarioReady}
        onError={handleScenarioError}
        onUnitSelect={handleUnitSelect}
        onViewChange={handleViewChange}
        enableKeyboardShortcuts={true}
        enableContextMenu={true}
        enableUndoRedo={true}
        style={{
          border: 'none',
          borderRadius: 0,
        }}
      />

      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            bgcolor: 'rgba(0,0,0,0.7)',
            color: 'white',
            p: 1,
            borderRadius: 1,
            fontSize: 12,
            fontFamily: 'monospace',
            zIndex: 1000,
          }}
        >
          <div>Mode: {mode}</div>
          <div>Ready: {isReady ? '✅' : '❌'}</div>
          <div>Connected: {isConnected ? '✅' : '❌'}</div>
          <div>Scenario: {scenario?.id || 'None'}</div>
          <div>Loading: {isLoading ? '⏳' : '✅'}</div>
          {error && <div style={{color: '#ff6b6b'}}>Error: {error}</div>}
        </Box>
      )}
    </Box>
  );
};