import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { renderMetocIcon } from '@/modules/dashboard/utils/metocRenderer';

interface EnvironmentMetocSymbolProps {
  sidc: string;
  label: string;
  size?: number;
}

const EnvironmentMetocSymbol: React.FC<EnvironmentMetocSymbolProps> = ({
  sidc,
  label,
  size = 48,
}) => {
  const [source, setSource] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setSource('');
    setFailed(false);

    renderMetocIcon(sidc, size)
      .then(result => {
        if (active) setSource(result);
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
    };
  }, [sidc, size]);

  return (
    <Box
      role="img"
      aria-label={`نماد ${label}`}
      title={failed ? `نمایش نماد ${label} ممکن نشد` : label}
      sx={{
        width: 58,
        height: 58,
        flex: '0 0 58px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.paper',
        border: 1,
        borderColor: failed ? 'warning.light' : 'divider',
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      {source ? (
        <Box
          component="img"
          src={source}
          alt=""
          draggable={false}
          sx={{
            display: 'block',
            width: `${size}px`,
            height: `${size}px`,
            objectFit: 'contain',
          }}
        />
      ) : failed ? (
        <Typography variant="caption" color="text.secondary">
          METOC
        </Typography>
      ) : (
        <CircularProgress size={20} thickness={4} aria-label="بارگذاری نماد" />
      )}
    </Box>
  );
};

export default EnvironmentMetocSymbol;
