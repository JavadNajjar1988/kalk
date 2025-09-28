import React from 'react';
import { Tooltip, IconButton } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

interface HelpTooltipProps {
  title: string;
  description: string;
  example: string;
  size?: 'small' | 'medium';
}

const HelpTooltip: React.FC<HelpTooltipProps> = ({ 
  title, 
  description, 
  example, 
  size = 'small' 
}) => {
  const tooltipContent = (
    <div style={{ maxWidth: 300 }}>
      <div style={{ fontWeight: 600, marginBottom: 8, color: '#4A90E2' }}>
        {title}
      </div>
      <div style={{ marginBottom: 8, lineHeight: 1.4 }}>
        {description}
      </div>
      <div style={{ 
        backgroundColor: 'rgba(74, 144, 226, 0.1)', 
        padding: 8, 
        borderRadius: 4,
        fontStyle: 'italic',
        fontSize: '0.875rem',
        direction: 'rtl'
      }}>
        <strong>مثال:</strong> {example}
      </div>
    </div>
  );

  return (
    <Tooltip
      title={tooltipContent}
      arrow
      placement="top"
      sx={{
        '& .MuiTooltip-tooltip': {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          color: '#333',
          border: '1px solid rgba(74, 144, 226, 0.3)',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(74, 144, 226, 0.2)',
          backdropFilter: 'blur(10px)',
          fontSize: '0.875rem',
          maxWidth: 320,
          direction: 'rtl'
        },
        '& .MuiTooltip-arrow': {
          color: 'rgba(255, 255, 255, 0.95)',
          '&::before': {
            border: '1px solid rgba(74, 144, 226, 0.3)',
          }
        }
      }}
    >
      <IconButton
        size={size}
        sx={{
          ml: 1,
          color: '#4A90E2',
          opacity: 0.7,
          '&:hover': {
            opacity: 1,
            backgroundColor: 'rgba(74, 144, 226, 0.1)',
          },
          width: size === 'small' ? 20 : 24,
          height: size === 'small' ? 20 : 24,
        }}
      >
        <HelpOutlineIcon fontSize={size === 'small' ? 'small' : 'medium'} />
      </IconButton>
    </Tooltip>
  );
};

export default HelpTooltip;