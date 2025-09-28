import React from 'react';
import { Box, Typography } from '@mui/material';

const HelpPanel: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="body2" color="text.secondary">
        پنل راهنما و پشتیبانی در حال توسعه است
      </Typography>
    </Box>
  );
};

export default HelpPanel; 