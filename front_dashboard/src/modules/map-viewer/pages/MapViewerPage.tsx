/**
 * Map Viewer Page
 * صفحه کالک نگار با ادغام OrbatIframe
 */

import React from 'react';
import { Paper, Box } from '@mui/material';
import { OrbatIframe, OrbatProvider } from '../../orbat-integration';

const MapViewerPage: React.FC = () => {
  return (
    <Paper
      elevation={1}
      sx={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        margin: 0,
        padding: 0,
      }}
    >
      <Box
        sx={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          margin: 0,
          padding: 0,
        }}
      >
        <OrbatProvider
          config={{
            baseUrl: 'http://localhost:5174',
            allowedModes: ['map', 'chart', 'grid'],
            enableDevTools: process.env.NODE_ENV === 'development'
          }}
          bridge={{
            targetOrigin: 'http://localhost:5174',
            timeout: 10000,
            retryAttempts: 3,
            enableLogging: process.env.NODE_ENV === 'development'
          }}
        >
          <OrbatIframe
            mode="map"
            width="100%"
            height="100%"
            style={{
              border: 'none',
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              margin: 0,
              padding: 0,
            }}
          />
        </OrbatProvider>
      </Box>
    </Paper>
  );
};

export default MapViewerPage;