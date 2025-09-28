import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  alpha
} from '@mui/material';
import {
  AutoAwesome as WizardIcon,
  Dashboard as TemplateIcon
} from '@mui/icons-material';

export enum BuilderMode {
  GUIDED = 'guided',
  TEMPLATE = 'template'
}

interface BuilderModeSelectorProps {
  onModeSelect: (mode: BuilderMode) => void;
  editingField?: any;
}

const BuilderModeSelector: React.FC<BuilderModeSelectorProps> = ({
  onModeSelect,
  editingField
}) => {
  const modes = [
    {
      mode: BuilderMode.GUIDED,
      title: 'راهنمای گام‌به‌گام',
      description: 'ایجاد فیلد با راهنمایی هوشمند',
      icon: WizardIcon,
      color: '#2196F3',
      features: ['انتخاب نوع پایه', 'پیشنهادات هوشمند', 'پیش‌نمایش زنده']
    },
    {
      mode: BuilderMode.TEMPLATE,
      title: 'قالب‌های آماده',
      description: 'انتخاب از قالب‌های پیش‌ساخته',
      icon: TemplateIcon,
      color: '#4CAF50',
      features: ['قالب‌های آماده', 'سفارشی‌سازی سریع', 'فیلدهای چندتایی']
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom textAlign="center">
        {editingField ? 'انتخاب روش ویرایش فیلد' : 'انتخاب روش ایجاد فیلد'}
      </Typography>
      
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {modes.map((mode) => {
          const IconComponent = mode.icon;
          
          return (
            <Grid item xs={12} md={6} key={mode.mode}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: (theme) => `0 8px 25px ${alpha(mode.color, 0.2)}`
                  },
                  border: `2px solid transparent`,
                  '&:hover': {
                    borderColor: mode.color
                  }
                }}
                onClick={() => onModeSelect(mode.mode)}
              >
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      bgcolor: alpha(mode.color, 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                      color: mode.color
                    }}
                  >
                    <IconComponent fontSize="large" />
                  </Box>
                  
                  <Typography variant="h6" gutterBottom>
                    {mode.title}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {mode.description}
                  </Typography>
                  
                  <Box sx={{ textAlign: 'right', mb: 2 }}>
                    {mode.features.map((feature, index) => (
                      <Typography 
                        key={index}
                        variant="caption" 
                        display="block"
                        sx={{ mb: 0.5 }}
                      >
                        • {feature}
                      </Typography>
                    ))}
                  </Box>
                  
                  <Button
                    variant="contained"
                    fullWidth
                    sx={{
                      bgcolor: mode.color,
                      '&:hover': {
                        bgcolor: alpha(mode.color, 0.8)
                      }
                    }}
                  >
                    انتخاب این روش
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default BuilderModeSelector;