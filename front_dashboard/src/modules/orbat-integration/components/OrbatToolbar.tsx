import React from 'react';
import { Box, Typography, Toolbar, Button, IconButton, Tooltip } from '@mui/material';
import {
  Fullscreen,
  FullscreenExit,
  Refresh,
  Settings,
  Help,
  Download,
  Print,
  Share
} from '@mui/icons-material';

interface OrbatToolbarProps {
  title?: string;
  isFullscreen?: boolean;
  isLoading?: boolean;
  onToggleFullscreen?: () => void;
  onRefresh?: () => void;
  onSettings?: () => void;
  onHelp?: () => void;
  onExport?: () => void;
  onPrint?: () => void;
  onShare?: () => void;
  children?: React.ReactNode;
}

const OrbatToolbar: React.FC<OrbatToolbarProps> = ({
  title = 'ORBAT Mapper',
  isFullscreen = false,
  isLoading = false,
  onToggleFullscreen,
  onRefresh,
  onSettings,
  onHelp,
  onExport,
  onPrint,
  onShare,
  children
}) => {
  return (
    <Toolbar 
      variant="dense" 
      sx={{ 
        minHeight: 48,
        backgroundColor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        px: 2
      }}
    >
      {/* Title */}
      <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
        {title}
        {isLoading && (
          <Typography 
            component="span" 
            variant="caption" 
            color="text.secondary"
            sx={{ ml: 1 }}
          >
            (در حال بارگیری...)
          </Typography>
        )}
      </Typography>

      {/* Custom children */}
      {children && (
        <Box sx={{ mr: 1 }}>
          {children}
        </Box>
      )}

      {/* Action buttons */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {onRefresh && (
          <Tooltip title="بازآوری">
            <IconButton 
              size="small" 
              onClick={onRefresh}
              disabled={isLoading}
            >
              <Refresh />
            </IconButton>
          </Tooltip>
        )}

        {onExport && (
          <Tooltip title="صادرات">
            <IconButton 
              size="small" 
              onClick={onExport}
              disabled={isLoading}
            >
              <Download />
            </IconButton>
          </Tooltip>
        )}

        {onPrint && (
          <Tooltip title="چاپ">
            <IconButton 
              size="small" 
              onClick={onPrint}
              disabled={isLoading}
            >
              <Print />
            </IconButton>
          </Tooltip>
        )}

        {onShare && (
          <Tooltip title="اشتراک‌گذاری">
            <IconButton 
              size="small" 
              onClick={onShare}
              disabled={isLoading}
            >
              <Share />
            </IconButton>
          </Tooltip>
        )}

        {onSettings && (
          <Tooltip title="تنظیمات">
            <IconButton 
              size="small" 
              onClick={onSettings}
            >
              <Settings />
            </IconButton>
          </Tooltip>
        )}

        {onHelp && (
          <Tooltip title="راهنما">
            <IconButton 
              size="small" 
              onClick={onHelp}
            >
              <Help />
            </IconButton>
          </Tooltip>
        )}

        {onToggleFullscreen && (
          <Tooltip title={isFullscreen ? 'خروج از تمام‌صفحه' : 'تمام‌صفحه'}>
            <IconButton 
              size="small" 
              onClick={onToggleFullscreen}
            >
              {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Toolbar>
  );
};

export { OrbatToolbar };