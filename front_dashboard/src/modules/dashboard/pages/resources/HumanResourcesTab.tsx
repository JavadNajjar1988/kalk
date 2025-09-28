import React from 'react';
import {
  Box,
  Typography,
  Paper,
} from '@mui/material';
import { Construction as ConstructionIcon } from '@mui/icons-material';
import { useTranslation } from '@/hooks/useTranslation';

const HumanResourcesTab: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Box p={3}>
      <Paper 
        elevation={2} 
        sx={{ 
          p: 4, 
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          minHeight: '400px',
          justifyContent: 'center'
        }}
      >
        <ConstructionIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom color="primary.main">
          {t('resources.humanResources.title')}
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {t('resources.humanResources.underDevelopment')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('resources.humanResources.comingSoon')}
        </Typography>
      </Paper>
    </Box>
  );
};

export default HumanResourcesTab; 