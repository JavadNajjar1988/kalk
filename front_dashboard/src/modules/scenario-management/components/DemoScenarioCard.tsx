/**
 * DemoScenarioCard Component
 * کامپوننت کارت نمایش سناریوهای نمونه
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  useTheme,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  PlayArrow as PlayArrowIcon,
  ContentCopy as ContentCopyIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { DemoScenarioCardProps } from '../types';

const DemoScenarioCard: React.FC<DemoScenarioCardProps> = ({
  scenario,
  onClick,
  onAction,
  dense = false
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action: string) => {
    handleMenuClose();
    // Handle actions like delete, copy, execute
    if (onAction) {
      onAction(action);
    } else {
      console.log(`Demo scenario action: ${action}`, scenario.id);
    }
  };

  return (
    <Card
      sx={{
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        height: dense ? 'auto' : 300,
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4],
          '& .demo-image': {
            transform: 'scale(1.05)'
          }
        }
      }}
      onClick={onClick}
    >
      {/* Image */}
      {scenario.imageUrl && (
        <CardMedia
          className="demo-image"
          component="img"
          height={dense ? 120 : 160}
          image={scenario.imageUrl}
          alt={scenario.name}
          sx={{
            transition: 'transform 0.2s ease-in-out',
            objectFit: 'cover',
            bgcolor: theme.palette.grey[100]
          }}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      )}

      <CardContent
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          p: dense ? 2 : 3
        }}
      >
        {/* Header with menu */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography
            variant={dense ? 'subtitle2' : 'h6'}
            component="h3"
            sx={{
              fontWeight: 600,
              color: theme.palette.text.primary,
              mb: 1,
              lineHeight: 1.2
            }}
          >
            {scenario.name}
          </Typography>
          
          {/* Three-dot menu */}
          <IconButton
            size="small"
            onClick={handleMenuClick}
            sx={{ 
              opacity: 0.7,
              '&:hover': { opacity: 1 }
            }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Summary */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: dense ? 2 : 4,
            WebkitBoxOrient: 'vertical',
            lineHeight: 1.4
          }}
        >
          {scenario.summary}
        </Typography>

        {/* Demo badge */}
        <Box sx={{ mt: 'auto', pt: 2 }}>
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.primary.main,
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}
          >
            سناریوی نمونه
          </Typography>
        </Box>
      </CardContent>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
        PaperProps={{
          sx: {
            minWidth: 180
          }
        }}
      >
        <MenuItem onClick={() => handleAction('execute')}>
          <PlayArrowIcon sx={{ mr: 1, fontSize: 20 }} />
          اجرا
        </MenuItem>
        <MenuItem onClick={() => handleAction('copy')}>
          <ContentCopyIcon sx={{ mr: 1, fontSize: 20 }} />
          کپی
        </MenuItem>
        <MenuItem 
          onClick={() => handleAction('delete')}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1, fontSize: 20 }} />
          حذف
        </MenuItem>
      </Menu>
    </Card>
  );
};

export default DemoScenarioCard;