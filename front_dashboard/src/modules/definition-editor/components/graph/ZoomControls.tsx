import React from 'react';
import { useReactFlow } from '@xyflow/react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { ZoomIn as ZoomInIcon, ZoomOut as ZoomOutIcon, FitScreen as FitScreenIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

interface ZoomControlsProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitView?: () => void;
}

const ZoomControls: React.FC<ZoomControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onFitView
}) => {
  const theme = useTheme();
  const reactFlowInstance = useReactFlow();

  const handleZoomIn = () => {
    if (onZoomIn) {
      onZoomIn();
    } else {
      reactFlowInstance.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (onZoomOut) {
      onZoomOut();
    } else {
      reactFlowInstance.zoomOut();
    }
  };

  const handleFitView = () => {
    if (onFitView) {
      onFitView();
    } else {
      reactFlowInstance.fitView();
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Tooltip title="بزرگنمایی">
        <IconButton
          size="small"
          onClick={handleZoomIn}
          sx={{ 
            color: theme.palette.text.secondary,
            '&:hover': { backgroundColor: theme.palette.action.hover }
          }}
        >
          <ZoomInIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      
      <Tooltip title="کوچک‌نمایی">
        <IconButton
          size="small"
          onClick={handleZoomOut}
          sx={{ 
            color: theme.palette.text.secondary,
            '&:hover': { backgroundColor: theme.palette.action.hover }
          }}
        >
          <ZoomOutIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      
      <Tooltip title="نمایش کامل">
        <IconButton
          size="small"
          onClick={handleFitView}
          sx={{ 
            color: theme.palette.text.secondary,
            '&:hover': { backgroundColor: theme.palette.action.hover }
          }}
        >
          <FitScreenIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default ZoomControls; 