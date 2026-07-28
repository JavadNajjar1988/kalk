/**
 * Scenario Editor Page
 * صفحه اصلی ویرایشگر سناریو با ادغام ORBAT
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Alert, Typography } from '@mui/material';
import { OrbatProvider } from '../../orbat-integration';
import { ScenarioEditorLayout } from '../components/editor/ScenarioEditorLayout';
import { navigateToPreviousStep } from '@/utils/navigation';

interface ScenarioEditorPageProps {
  // Props for future extension
}

const ScenarioEditorPage: React.FC<ScenarioEditorPageProps> = () => {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scenario, setScenario] = useState<any>(null);

  // Effect for loading scenario
  useEffect(() => {
    const loadScenario = async () => {
      if (!scenarioId) {
        setError('شناسه سناریو مشخص نشده است');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // TODO: Load scenario from your data source
        // For now, we'll simulate loading
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock scenario data
        const mockScenario = {
          id: scenarioId,
          name: `سناریو ${scenarioId}`,
          description: 'سناریوی نمونه برای تست',
          createdAt: new Date().toISOString(),
        };

        setScenario(mockScenario);
      } catch (err) {
        console.error('Error loading scenario:', err);
        setError('خطا در بارگذاری سناریو');
      } finally {
        setIsLoading(false);
      }
    };

    loadScenario();
  }, [scenarioId]);

  // Handle ORBAT ready event
  const handleOrbatReady = () => {
    console.log('ORBAT is ready');
  };

  // Handle ORBAT error
  const handleOrbatError = (error: string) => {
    console.error('ORBAT error:', error);
    if (error.includes('Failed to load') || error.includes('Connection')) {
      setError(`خطا در اتصال به ORBAT: احتمالاً سرور Vue ORBAT روی پورت 5173 در حال اجرا نیست.\n\nبرای حل مشکل:\n1. به پوشه backend/orbat/Orbat بروید\n2. دستور npm run dev را اجرا کنید\n3. منتظر بمانید تا سرور روی http://localhost:5173 اجرا شود\n4. سپس این صفحه را refresh کنید\n\nجزئیات خطا: ${error}`);
    } else {
      setError(`خطا در ORBAT: ${error}`);
    }
  };

  // Handle back to scenarios list
  const handleBackToScenarios = () => {
    navigateToPreviousStep(navigate, window.location.pathname, '/dashboard/scenarios');
  };

  // Loading state
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          gap: 2,
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          در حال بارگذاری سناریو...
        </Typography>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          p: 3,
        }}
      >
        <Alert 
          severity="error" 
          sx={{ mb: 2, maxWidth: 600, textAlign: 'right' }}
          action={
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => window.location.reload()}
                style={{
                  padding: '4px 12px',
                  fontSize: '12px',
                  backgroundColor: '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                تازه‌سازی صفحه
              </button>
              <button 
                onClick={handleBackToScenarios}
                style={{
                  padding: '4px 12px',
                  fontSize: '12px',
                  backgroundColor: '#757575',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                بازگشت
              </button>
            </div>
          }
        >
          <Typography variant="body1" sx={{ whiteSpace: 'pre-line', textAlign: 'right' }}>
            {error}
          </Typography>
        </Alert>
      </Box>
    );
  }

  // Main render
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <OrbatProvider
        config={{
          iframe: {
            baseUrl: 'http://localhost:5173', // Vue ORBAT URL
            defaultMode: 'chart',
            allowedModes: ['chart', 'map', 'grid', 'story'],
            enableDevTools: process.env.NODE_ENV === 'development'
          },
          bridge: {
            targetOrigin: 'http://localhost:5173',
            timeout: 10000,
            retryAttempts: 3,
            enableLogging: process.env.NODE_ENV === 'development'
          }
        }}
        onReady={handleOrbatReady}
        onError={handleOrbatError}
      >
        <ScenarioEditorLayout
          scenario={scenario}
          onBackToScenarios={handleBackToScenarios}
        />
      </OrbatProvider>
    </Box>
  );
};

export default ScenarioEditorPage;
