import React, { useMemo, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  alpha,
  useTheme,
  Stack,
  Chip
} from '@mui/material';
import {
  AutoAwesome as WizardIcon,
  Dashboard as TemplateIcon,
  Psychology as IntelligentIcon,
  Speed as QuickIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';

export enum BuilderMode {
  GUIDED = 'guided',
  TEMPLATE = 'template'
}

interface BuilderModeSelectorProps {
  onModeSelect: (mode: BuilderMode) => void;
  editingField?: any;
}

const BuilderModeSelector: React.FC<BuilderModeSelectorProps> = React.memo(({
  onModeSelect,
  editingField
}) => {
  const theme = useTheme();
  
  // Memoized modes configuration
  const modes = useMemo(() => [
    {
      mode: BuilderMode.GUIDED,
      title: 'راهنمای هوشمند',
      subtitle: 'گام‌به‌گام و تخصصی',
      description: 'ایجاد فیلد با راهنمایی هوشمند و پیشنهادات متناسب',
      icon: WizardIcon,
      secondaryIcon: IntelligentIcon,
      color: theme.palette.primary.main,
      gradient: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
      features: [
        { icon: CheckIcon, text: 'انتخاب نوع پایه با راهنمایی' },
        { icon: CheckIcon, text: 'پیشنهادات هوشمند بر اساس محتوا' },
        { icon: CheckIcon, text: 'پیش‌نمایش زنده و تعاملی' },
        { icon: CheckIcon, text: 'اعتبارسنجی پیشرفته' }
      ],
      recommended: true,
      badge: 'پیشنهادی'
    },
    {
      mode: BuilderMode.TEMPLATE,
      title: 'قالب‌های آماده',
      subtitle: 'سریع و کاربردی', 
      description: 'انتخاب از قالب‌های پیش‌ساخته و سفارشی‌سازی سریع',
      icon: TemplateIcon,
      secondaryIcon: QuickIcon,
      color: theme.palette.success.main,
      gradient: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
      features: [
        { icon: CheckIcon, text: 'قالب‌های آماده و تست‌شده' },
        { icon: CheckIcon, text: 'سفارشی‌سازی سریع' },
        { icon: CheckIcon, text: 'فیلدهای چندتایی' },
        { icon: CheckIcon, text: 'الگوهای استاندارد' }
      ],
      recommended: false,
      badge: 'سریع'
    }
  ], [theme.palette.primary.main, theme.palette.primary.dark, theme.palette.success.main, theme.palette.success.dark]);

  // Memoized event handlers
  const handleModeSelect = useCallback((mode: BuilderMode) => {
    onModeSelect(mode);
  }, [onModeSelect]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, mode: BuilderMode) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleModeSelect(mode);
    }
  }, [handleModeSelect]);

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2 }, height: '100%', overflow: 'auto' }}>
      {/* Header فشرده */}
      <Box sx={{ textAlign: 'center', mb: { xs: 1.5, sm: 2 } }}>
        <Typography 
          gutterBottom 
          fontWeight={600} 
          color="primary.main"
          sx={{ fontSize: { xs: '1rem', sm: '1.2rem' } }}
        >
          {editingField ? 'انتخاب روش ویرایش' : 'انتخاب روش ایجاد'}
        </Typography>
        <Typography 
          color="text.secondary" 
          sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}
        >
          نحوه مورد نظر خود را انتخاب کنید
        </Typography>
      </Box>
      
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ height: 'fit-content' }}>
        {modes.map((mode, index) => {
          const IconComponent = mode.icon;
          const SecondaryIconComponent = mode.secondaryIcon;
          
          return (
            <Grid item xs={12} sm={6} key={mode.mode}>
              <Card
                sx={{
                  cursor: 'pointer',
                  height: 'fit-content',
                  transition: 'all 0.3s ease',
                  border: `2px solid transparent`,
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 24px ${alpha(mode.color, 0.2)}`,
                    borderColor: mode.color
                  }
                }}
                onClick={() => handleModeSelect(mode.mode)}
                tabIndex={0}
                onKeyDown={(e) => handleKeyDown(e, mode.mode)}
                role="button"
                aria-label={`انتخاب ${mode.title}`}
              >
                {/* Recommended Badge */}
                {mode.recommended && (
                  <Chip
                    label={mode.badge}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      zIndex: 2,
                      background: mode.gradient,
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '0.7rem'
                    }}
                  />
                )}

                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  {/* Icon Section فشرده */}
                  <Box sx={{ textAlign: 'center', mb: 1.5 }}>
                    <Box
                      sx={{
                        width: { xs: 40, sm: 48 },
                        height: { xs: 40, sm: 48 },
                        borderRadius: 1.5,
                        background: mode.gradient,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 6px',
                        color: 'white',
                        boxShadow: `0 3px 8px ${alpha(mode.color, 0.25)}`
                      }}
                    >
                      <IconComponent sx={{ fontSize: { xs: 20, sm: 24 } }} />
                    </Box>
                    <SecondaryIconComponent 
                      sx={{ 
                        fontSize: { xs: 12, sm: 14 }, 
                        color: mode.color,
                        opacity: 0.7
                      }} 
                    />
                  </Box>
                  
                  {/* Title فشرده */}
                  <Box sx={{ textAlign: 'center', mb: 1.5 }}>
                    <Typography 
                      gutterBottom 
                      fontWeight={600} 
                      color="text.primary"
                      sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }}
                    >
                      {mode.title}
                    </Typography>
                    <Typography variant="caption" color={mode.color} fontWeight={500} sx={{ fontSize: '0.75rem' }}>
                      {mode.subtitle}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.3, fontSize: '0.8rem' }}>
                      {mode.description}
                    </Typography>
                  </Box>
                  
                  {/* Features فشرده - فقط مهم‌ترین‌ها */}
                  <Stack spacing={0.5} sx={{ mb: 1.5 }}>
                    {mode.features.slice(0, 3).map((feature, featureIndex) => {
                      const FeatureIcon = feature.icon;
                      return (
                        <Box key={featureIndex} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <FeatureIcon 
                            sx={{ 
                              fontSize: 12, 
                              color: mode.color,
                              flexShrink: 0
                            }} 
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2, fontSize: '0.7rem' }}>
                            {feature.text}
                          </Typography>
                        </Box>
                        );
                      })}
                    </Stack>
                    
                    {/* Action Button فشرده */}
                    <Button
                      variant="contained"
                      fullWidth
                      size="small"
                      sx={{
                        background: mode.gradient,
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        py: 0.8,
                        borderRadius: 1,
                        boxShadow: `0 2px 6px ${alpha(mode.color, 0.25)}`,
                        '&:hover': {
                          boxShadow: `0 3px 8px ${alpha(mode.color, 0.35)}`
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
});

// Display name for debugging
BuilderModeSelector.displayName = 'BuilderModeSelector';

export default BuilderModeSelector;