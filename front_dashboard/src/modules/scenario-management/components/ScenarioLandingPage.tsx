/**
 * ScenarioLandingPage Component
 * صفحه اصلی مدیریت سناریوها با ادغام ORBAT
 */

import React, { useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Alert,
  Skeleton,
  useTheme,
  alpha
} from '@mui/material';
import { OrbatProvider } from '../../orbat-integration';
import { ScenarioLandingPageProps, ScenarioAction } from '../types';
import { useScenarioData } from '../hooks';
import ScenarioGrid from './ScenarioGrid';

const ScenarioLandingPage: React.FC<ScenarioLandingPageProps> = ({
  className,
  onScenarioSelect,
  onScenarioAction,
  initialScenarios,
  showDemoScenarios = true,
  enableUpload = true,
  enableUrlLoad = true
}) => {
  const theme = useTheme();
  
  const {
    scenarios,
    demoScenarios,
    sortOptions,
    isLoading,
    error,
    handleScenarioAction,
    handleDemoScenarioSelect,
    handleNewScenario,
    handleUploadScenario,
    handleLoadFromUrl,
    handleSort,
    refreshData
  } = useScenarioData({
    autoLoad: true,
    enableDemoScenarios: showDemoScenarios
  });

  // Initialize with provided scenarios if any
  useEffect(() => {
    if (initialScenarios && initialScenarios.length > 0) {
      // Handle initial scenarios if provided
      console.log('Initial scenarios provided:', initialScenarios);
    }
  }, [initialScenarios]);

  // Handle scenario actions with callbacks
  const handleScenarioActionWithCallback = async (action: ScenarioAction, scenarioId: string) => {
    await handleScenarioAction(action, scenarioId);
    onScenarioAction?.(action, scenarioId);
  };

  const handleDemoScenarioSelectWithCallback = (scenarioId: string) => {
    handleDemoScenarioSelect(scenarioId);
    onScenarioSelect?.(scenarioId);
  };

  // Handle file upload
  const handleUpload = async (file: File) => {
    const result = await handleUploadScenario(file);
    if (result.success && result.scenario) {
      onScenarioSelect?.(result.scenario.id);
    }
  };

  // Handle URL load
  const handleUrlLoad = async (url: string) => {
    const result = await handleLoadFromUrl(url);
    if (result.success && result.scenario) {
      onScenarioSelect?.(result.scenario.id);
    }
  };

  return (
    <Box className={className}>
      {/* Header Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          borderBottom: `1px solid ${theme.palette.divider}`,
          py: 4,
          mb: 4
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', maxWidth: 800, mx: 'auto' }}>
            <Typography
              variant="h3"
              component="h1"
              sx={{
                fontWeight: 700,
                color: theme.palette.text.primary,
                mb: 2,
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              سامانه ساجد
              <Typography
                component="span"
                sx={{
                  fontSize: '0.4em',
                  color: theme.palette.text.secondary,
                  ml: 1,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  WebkitTextFillColor: theme.palette.text.secondary
                }}
              >
                اولیه
              </Typography>
            </Typography>
            
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{
                maxWidth: 600,
                mx: 'auto',
                lineHeight: 1.6,
                fontWeight: 400
              }}
            >
              نبردهای تاریخی و سناریوهای نظامی را در مرورگر خود بازسازی کنید
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Development Notice */}
      <Container maxWidth="lg" sx={{ mb: 3 }}>
        <Alert 
          severity="info" 
          sx={{ 
            bgcolor: alpha(theme.palette.info.main, 0.1),
            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
          }}
        >
          این یک نمونه اولیه در حال توسعه است.
        </Alert>
      </Container>

      {/* Main Content */}
      <Container maxWidth="lg">
        {/* Error State */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            action={
              <Typography
                component="button"
                onClick={refreshData}
                sx={{
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  background: 'none',
                  border: 'none',
                  color: 'inherit',
                  fontSize: 'inherit'
                }}
              >
                تلاش مجدد
              </Typography>
            }
          >
            {error}
          </Alert>
        )}

        {/* Loading Skeleton */}
        {isLoading && scenarios.length === 0 ? (
          <Box>
            <Skeleton variant="text" width={200} height={40} sx={{ mb: 2 }} />
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3 }}>
              {[...Array(6)].map((_, index) => (
                <Skeleton 
                  key={index} 
                  variant="rectangular" 
                  height={200} 
                  sx={{ borderRadius: 2 }} 
                />
              ))}
            </Box>
          </Box>
        ) : (
          /* Scenario Grid */
          <ScenarioGrid
            scenarios={scenarios}
            demoScenarios={showDemoScenarios ? demoScenarios : []}
            onScenarioAction={handleScenarioActionWithCallback}
            onDemoScenarioSelect={handleDemoScenarioSelectWithCallback}
            onNewScenario={handleNewScenario}
            onUploadScenario={enableUpload ? handleUpload : undefined}
            onLoadFromUrl={enableUrlLoad ? handleUrlLoad : undefined}
            loading={isLoading}
            sortOptions={sortOptions}
            onSortChange={handleSort}
          />
        )}
      </Container>

      {/* Footer Notice */}
      <Box
        sx={{
          mt: 6,
          py: 3,
          borderTop: `1px solid ${theme.palette.divider}`,
          bgcolor: alpha(theme.palette.background.paper, 0.7)
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ fontStyle: 'italic' }}
          >
            لطفاً توجه داشته باشید که سناریوهای نمونه ناکامل هستند و هنوز در حال توسعه می‌باشند.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

// Wrapped component with ORBAT Provider
const ScenarioLandingPageWithProvider: React.FC<ScenarioLandingPageProps> = (props) => {
  return (
    <OrbatProvider>
      <ScenarioLandingPage {...props} />
    </OrbatProvider>
  );
};

export default ScenarioLandingPageWithProvider;