/**
 * ScenarioCard Component
 * کامپوننت کارت نمایش سناریو با Material-UI
 */

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Box,
  useTheme,
  alpha
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  PlayArrow as PlayArrowIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  ContentCopy as ContentCopyIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { ScenarioCardProps, ScenarioAction } from '../types';
import { formatTimeAgo } from '../../../utils/dateUtils';

const ScenarioCard: React.FC<ScenarioCardProps> = ({
  scenario,
  onAction,
  onSelect,
  selected = false,
  showActions = true,
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

  const handleAction = (action: ScenarioAction) => {
    handleMenuClose();
    onAction(action);
  };

  const handleCardClick = () => {
    if (onSelect) {
      onSelect();
    } else {
      onAction('open');
    }
  };

  const formatDate = (date: Date | string) => {
    if (typeof date === 'string') {
      return formatTimeAgo(new Date(date));
    }
    return formatTimeAgo(date);
  };

  return (
    <Card
      sx={{
        position: 'relative',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        border: selected 
          ? `2px solid ${theme.palette.primary.main}`
          : `1px solid ${theme.palette.divider}`,
        boxShadow: selected 
          ? `0 0 0 3px ${alpha(theme.palette.primary.main, 0.2)}`
          : theme.shadows[1],
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4],
          borderColor: theme.palette.primary.main
        },
        height: dense ? 'auto' : 200,
        display: 'flex',
        flexDirection: 'column'
      }}
      onClick={handleCardClick}
    >
      <CardContent
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          p: dense ? 2 : 3,
          '&:last-child': { pb: dense ? 2 : 3 }
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography
            variant={dense ? 'subtitle2' : 'h6'}
            component="h3"
            sx={{
              fontWeight: 600,
              color: theme.palette.text.primary,
              lineHeight: 1.2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}
          >
            {scenario.name}
          </Typography>
          
          {showActions && (
            <IconButton
              size="small"
              onClick={handleMenuClick}
              sx={{ 
                ml: 1,
                opacity: 0.7,
                '&:hover': { opacity: 1 }
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          )}
        </Box>

        {/* Description */}
        {scenario.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: dense ? 2 : 3,
              WebkitBoxOrient: 'vertical',
              mb: 2
            }}
          >
            {scenario.description}
          </Typography>
        )}

        {/* Type badge */}
        {scenario.type && (
          <Box sx={{ mb: 1 }}>
            <Chip
              label={scenario.type === 'ORBAT-mapper' ? 'ORBAT' : 'سفارشی'}
              size="small"
              variant="outlined"
              sx={{
                fontSize: '0.75rem',
                height: 24
              }}
            />
          </Box>
        )}

        {/* Footer with dates */}
        <Box sx={{ mt: 'auto' }}>
          <Typography variant="caption" color="text.secondary" display="block">
            آخرین تغییر: {formatDate(scenario.modified)}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            ایجاد شده: {formatDate(scenario.created)}
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
        <MenuItem onClick={() => handleAction('open')}>
          <EditIcon sx={{ mr: 1, fontSize: 20 }} />
          ویرایش در کالک‌نگار
        </MenuItem>
        <MenuItem onClick={() => handleAction('run')}>
          <PlayArrowIcon sx={{ mr: 1, fontSize: 20 }} />
          اجرا در شبیه‌ساز
        </MenuItem>
        <MenuItem onClick={() => handleAction('duplicate')}>
          <ContentCopyIcon sx={{ mr: 1, fontSize: 20 }} />
          کپی
        </MenuItem>
        <MenuItem 
          onClick={() => handleAction('delete')}
          sx={{ color: theme.palette.error.main }}
        >
          <DeleteIcon sx={{ mr: 1, fontSize: 20 }} />
          حذف
        </MenuItem>
      </Menu>
    </Card>
  );
};

export default ScenarioCard;