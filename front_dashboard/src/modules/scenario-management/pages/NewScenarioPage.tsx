/**
 * NewScenarioPage Component
 * صفحه ایجاد سناریوی جدید با استفاده از ORBAT headless
 */

import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  useTheme,
  alpha,
  Alert,
  Paper,
  CircularProgress,
  Divider
} from '@mui/material';
import { ArrowBack, Help } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { OrbatProvider } from '../../orbat-integration';
import { useNewScenarioForm } from '../hooks';
import ScenarioBasicInfoForm from '../components/ScenarioBasicInfoForm';
import ScenarioTimeSettingsForm from '../components/ScenarioTimeSettingsForm';
import ScenarioOrbatForm from '../components/ScenarioOrbatForm';
import type { NewScenarioFormData } from '../types/new-scenario';
import { navigateToPreviousStep } from '@/utils/navigation';

const NewScenarioPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  return (
    <OrbatProvider>
      <NewScenarioPageContent />
    </OrbatProvider>
  );
};

const NewScenarioPageContent: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  const {
    formData,
    errors,
    isSubmitting,
    isValid,
    resDateTime,
    updateField,
    addSide,
    removeSide,
    updateSide,
    addUnit,
    removeUnit,
    updateUnit,
    submit
  } = useNewScenarioForm({
    onSuccess: (scenarioId) => {
      // Navigate to scenario editor/viewer
      navigate('/dashboard/scenarios');
      // TODO: Navigate to ORBAT editor with scenario ID
      console.log('Scenario created:', scenarioId);
    },
    onError: (error) => {
      console.error('Failed to create scenario:', error);
    }
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;
    
    await submit();
  };
  
  const handleCancel = () => {
    navigateToPreviousStep(navigate, window.location.pathname, '/dashboard/scenarios');
  };
  
  // Wrapper functions for proper type compatibility
  const handleFieldChange = (field: string, value: any) => {
    updateField(field as keyof NewScenarioFormData, value);
  };
  
  const handleUpdateSide = (index: number, field: string, value: any) => {
    updateSide(index, { [field]: value });
  };
  
  const handleUpdateUnit = (sideIndex: number, unitIndex: number, field: string, value: any) => {
    updateUnit(sideIndex, unitIndex, { [field]: value });
  };
  
  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        bgcolor: 'background.default',
        py: 3
      }}
    >
        {/* Header */}
        <Box
          sx={{
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
            borderBottom: `1px solid ${theme.palette.divider}`,
            py: 4,
            mb: 4
          }}
        >
          <Container maxWidth="lg">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Button
                startIcon={<ArrowBack />}
                onClick={handleCancel}
                variant="outlined"
                size="small"
                sx={{
                  borderColor: alpha(theme.palette.text.secondary, 0.3),
                  color: theme.palette.text.secondary,
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    color: theme.palette.primary.main
                  }
                }}
              >
                بازگشت
              </Button>
              
              <Button
                startIcon={<Help />}
                component="a"
                href="https://docs.orbat-mapper.app/guide/getting-started"
                target="_blank"
                variant="text"
                size="small"
                sx={{ color: theme.palette.text.secondary }}
              >
                مشاهده مستندات
              </Button>
            </Box>
            
            <Typography
              variant="h3"
              component="h1"
              sx={{
                fontWeight: 700,
                color: theme.palette.text.primary,
                mb: 2
              }}
            >
              ایجاد سناریوی جدید
            </Typography>
            
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                maxWidth: 800,
                lineHeight: 1.7
              }}
            >
              در اینجا می‌توانید در صورت تمایل برخی داده‌های اولیه برای سناریوی خود ارائه دهید. 
              همیشه می‌توانید این تنظیمات را بعداً تغییر دهید.
            </Typography>
          </Container>
        </Box>
        
        {/* Main Content */}
        <Container maxWidth="lg">
          {/* Development Notice */}
          <Alert 
            severity="info" 
            sx={{ 
              mb: 3,
              bgcolor: alpha(theme.palette.info.main, 0.1),
              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
            }}
          >
            این یک نمونه اولیه در حال توسعه است.
          </Alert>
          
          {/* Form */}
          <Paper
            component="form"
            onSubmit={handleSubmit}
            elevation={0}
            sx={{
              bgcolor: 'transparent',
              '& > *:not(:last-child)': {
                mb: 3
              }
            }}
          >
            {/* Basic Info */}
            <ScenarioBasicInfoForm
              formData={{
                name: formData.name,
                description: formData.description
              }}
              errors={{
                name: errors.name,
                description: errors.description
              }}
              onFieldChange={(field, value) => updateField(field, value)}
            />
            
            {/* Time Settings */}
            <ScenarioTimeSettingsForm
              formData={{
                timeZone: formData.timeZone,
                year: formData.year,
                month: formData.month,
                day: formData.day,
                hour: formData.hour,
                minute: formData.minute
              }}
              errors={{
                timeZone: errors.timeZone,
                year: errors.year,
                month: errors.month,
                day: errors.day,
                hour: errors.hour,
                minute: errors.minute
              }}
              onFieldChange={(field, value) => updateField(field, value)}
              resDateTime={resDateTime}
            />
            
            {/* ORBAT Configuration */}
            <ScenarioOrbatForm
              formData={{
                noInitialOrbat: formData.noInitialOrbat,
                sides: formData.sides,
                symbologyStandard: formData.symbologyStandard
              }}
              errors={{
                sides: errors.sides
              }}
              onFieldChange={handleFieldChange}
              onAddSide={addSide}
              onRemoveSide={removeSide}
              onUpdateSide={handleUpdateSide}
              onAddUnit={addUnit}
              onRemoveUnit={removeUnit}
              onUpdateUnit={handleUpdateUnit}
            />
            
            {/* TODO: Add more form sections */}
            {/* - Symbology Standards */}
            
            <Divider sx={{ my: 4 }} />
            
            {/* Action Buttons */}
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2,
                pt: 2
              }}
            >
              <Button
                onClick={handleCancel}
                variant="outlined"
                size="large"
                disabled={isSubmitting}
                sx={{
                  minWidth: 120,
                  borderColor: alpha(theme.palette.text.secondary, 0.3),
                  color: theme.palette.text.secondary,
                  '&:hover': {
                    borderColor: theme.palette.text.primary,
                    color: theme.palette.text.primary
                  }
                }}
              >
                لغو
              </Button>
              
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={!isValid || isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={20} /> : undefined}
                sx={{
                  minWidth: 160,
                  fontWeight: 600,
                  boxShadow: theme.shadows[3],
                  '&:hover': {
                    boxShadow: theme.shadows[6]
                  }
                }}
              >
                {isSubmitting ? 'در حال ایجاد...' : 'ایجاد سناریو'}
              </Button>
            </Box>
          </Paper>
        </Container>
      </Box>
    );
  };

export default NewScenarioPage;
