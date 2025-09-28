import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box, CircularProgress, Typography } from '@mui/material';
import { fetchScenarioById, selectCurrentScenario, selectScenariosLoading, selectScenariosError } from '../../../store/slices/scenariosSlice';
import { RootState } from '../../../store';
import ScenarioSplashScreen from './ScenarioSplashScreen';
import ScenarioEditor from './ScenarioEditor';

interface ScenarioEditorWrapperProps {}

const ScenarioEditorWrapper: React.FC<ScenarioEditorWrapperProps> = () => {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const currentScenario = useSelector(selectCurrentScenario) as any;
  const isLoading = useSelector(selectScenariosLoading);
  const error = useSelector(selectScenariosError);
  
  const [localReady, setLocalReady] = useState(false);
  const [scenarioNotFound, setScenarioNotFound] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Check if it's a demo scenario
  const isDemoScenario = (id: string) => id?.startsWith('demo-');

  useEffect(() => {
    const loadScenario = async () => {
      if (!scenarioId) {
        setScenarioNotFound(true);
        setLocalReady(true);
        return;
      }

      try {
        setLocalReady(false);
        setScenarioNotFound(false);

        if (isDemoScenario(scenarioId)) {
          // Handle demo scenarios
          const demoId = scenarioId.replace('demo-', '');
          // For now, redirect to demo scenarios or show not found
          console.log('Loading demo scenario:', demoId);
          // TODO: Implement demo scenario loading
          setScenarioNotFound(true);
        } else {
          // Load regular scenario
          const resultAction = await dispatch(fetchScenarioById(scenarioId) as any);
          
          if (fetchScenarioById.fulfilled.match(resultAction)) {
            // Scenario loaded successfully
            setLocalReady(true);
          } else {
            // Scenario not found or error
            setScenarioNotFound(true);
            setLocalReady(true);
          }
        }
      } catch (error) {
        console.error('Error loading scenario:', error);
        setScenarioNotFound(true);
        setLocalReady(true);
      }
    };

    loadScenario();
  }, [scenarioId, dispatch]);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  // Show splash screen initially
  if (showSplash) {
    return (
      <ScenarioSplashScreen
        onComplete={handleSplashComplete}
        scenarioName={currentScenario?.name || `سناریو ${scenarioId}`}
        duration={2000}
      />
    );
  }

  // Show loading state
  if (isLoading || !localReady) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          در حال بارگذاری سناریو...
        </Typography>
      </Box>
    );
  }

  // Show scenario not found
  if (scenarioNotFound || error) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <Typography variant="h4" color="error">
          سناریو یافت نشد
        </Typography>
        <Typography variant="body1" color="text.secondary">
          سناریو مورد نظر در دسترس نیست یا حذف شده است.
        </Typography>
      </Box>
    );
  }

  // Show scenario editor
  if (currentScenario && localReady) {
    return (
      <ScenarioEditor
        key={currentScenario.id}
        scenario={currentScenario}
      />
    );
  }

  // Fallback loading state
  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <CircularProgress />
    </Box>
  );
};

export default ScenarioEditorWrapper;