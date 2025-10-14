import React from 'react';
import { Box, Typography, useTheme, alpha } from '@mui/material';
import { StepIndicatorProps } from '../types/FieldEditTypes';

const StepIndicator: React.FC<StepIndicatorProps> = ({ steps, currentStep }) => {
  const theme = useTheme();
  return (
    <Box 
      sx={{ 
        p: 3, 
        borderBottom: `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
        backgroundColor: 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {steps.map((step, index) => (
          <Box
            key={step.number}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flex: 1,
              position: 'relative',
            }}
          >
            {/* Connection Line */}
            {index < steps.length - 1 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 16,
                  left: '50%',
                  width: '100%',
                  height: '2px',
                backgroundColor: currentStep > step.number 
                  ? theme.palette.primary.main
                  : alpha(theme.palette.primary.light, 0.3),
                  zIndex: 0,
                }}
              />
            )}
            
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
              backgroundColor: currentStep >= step.number 
                ? theme.palette.primary.main
                : 'rgba(255, 255, 255, 0.9)',
                color: currentStep >= step.number ? 'white' : '#64748B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                mb: 2,
              border: currentStep >= step.number 
                ? '2px solid rgba(255, 255, 255, 0.3)' 
                : `2px solid ${alpha(theme.palette.primary.light, 0.3)}`,
              boxShadow: currentStep >= step.number
                ? `0 4px 16px ${alpha(theme.palette.primary.main, 0.3)}, inset 0 1px 0 rgba(255, 255, 255, 0.3)`
                : `0 4px 16px ${alpha(theme.palette.primary.light, 0.15)}, inset 0 1px 0 rgba(255, 255, 255, 0.8)`,
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                zIndex: 1,
              }}
            >
              {step.number}
            </Box>
            <Typography
              variant="caption"
              sx={{
              color: currentStep >= step.number ? theme.palette.primary.main : '#64748B',
                textAlign: 'center',
                fontWeight: currentStep >= step.number ? 600 : 500,
                textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)',
                fontSize: '0.85rem',
              }}
            >
              {step.title}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default StepIndicator;