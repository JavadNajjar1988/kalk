import React from 'react';
import { Box, Typography } from '@mui/material';
import { StepIndicatorProps } from '../types/FieldEditTypes';

const StepIndicator: React.FC<StepIndicatorProps> = ({ steps, currentStep }) => {
  return (
    <Box 
      sx={{ 
        p: 3, 
        borderBottom: '1px solid rgba(135, 206, 250, 0.2)',
        background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.8) 0%, rgba(240, 248, 255, 0.6) 100%)',
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
                  background: currentStep > step.number 
                    ? 'linear-gradient(90deg, #4A90E2, #7BB3F0)'
                    : 'rgba(135, 206, 250, 0.3)',
                  zIndex: 0,
                }}
              />
            )}
            
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: currentStep >= step.number 
                  ? 'linear-gradient(135deg, #4A90E2, #7BB3F0)'
                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.8))',
                color: currentStep >= step.number ? 'white' : '#64748B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                mb: 2,
                border: currentStep >= step.number 
                  ? '2px solid rgba(255, 255, 255, 0.3)' 
                  : '2px solid rgba(135, 206, 250, 0.3)',
                boxShadow: currentStep >= step.number
                  ? '0 4px 16px rgba(74, 144, 226, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                  : '0 4px 16px rgba(135, 206, 250, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
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
                color: currentStep >= step.number ? '#4A90E2' : '#64748B',
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