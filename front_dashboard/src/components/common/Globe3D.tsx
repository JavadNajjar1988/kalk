import React, { useRef, useEffect, useState } from 'react';
import Globe from 'react-globe.gl';
import { Box, Paper, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

interface Globe3DProps {
  width?: string | number;
  height?: string | number;
  markers?: Array<{
    lat: number;
    lng: number;
    size: number;
    color: string;
    label?: string;
  }>;
}

const Globe3D: React.FC<Globe3DProps> = ({ 
  width = '100%', 
  height = 400,
  markers = []
}) => {
  const theme = useTheme();
  const globeRef = useRef<any>();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (globeRef.current) {
      // تنظیمات اولیه globe
      globeRef.current.pointOfView({ lat: 35.6892, lng: 51.3890, altitude: 2.5 }, 0);
      setIsLoaded(true);
    }
  }, []);

  // نقاط پیش‌فرض برای نمایش (تهران)
  const defaultMarkers = markers.length > 0 ? markers : [
    {
      lat: 35.6892,
      lng: 51.3890,
      size: 0.5,
      color: theme.palette.primary.main,
      label: 'تهران'
    }
  ];

  return (
    <Paper
      sx={{
        width,
        height,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 2,
        bgcolor: alpha(theme.palette.background.default, 0.8),
        backdropFilter: 'blur(10px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
        }}
      >
        <Globe
          ref={globeRef}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
          backgroundColor="rgba(0,0,0,0)"
          showAtmosphere={true}
          atmosphereColor={alpha(theme.palette.primary.main, 0.3)}
          atmosphereAltitude={0.15}
          pointsData={defaultMarkers}
          pointLat="lat"
          pointLng="lng"
          pointColor="color"
          pointRadius="size"
          pointLabel="label"
          pointResolution={2}
          enablePointerInteraction={true}
          onPointHover={(point: any) => {
            if (point) {
              // می‌توانید tooltip یا اطلاعات اضافی نمایش دهید
            }
          }}
        />
      </Box>
      {!isLoaded && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 2,
            color: theme.palette.text.secondary,
          }}
        >
          <Typography variant="body2">در حال بارگذاری نقشه...</Typography>
        </Box>
      )}
    </Paper>
  );
};

export default Globe3D;

