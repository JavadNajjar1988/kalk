import React from 'react';
import {
  Box,
  Typography,
  Paper,
} from '@mui/material';
import { Help } from '@mui/icons-material';

const HelpPage: React.FC = () => {
  return (
    <Box sx={{ p: 4 }}>
      <Paper 
        sx={{ 
          p: 4, 
          textAlign: 'center',
          minHeight: '400px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <Help sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          راهنما
        </Typography>
        <Typography variant="body1" color="text.secondary">
          این صفحه در حال توسعه است
        </Typography>
      </Paper>
    </Box>
  );
};

export default HelpPage; 