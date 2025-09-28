import React, { useState, useMemo } from 'react';
import { styled } from '@mui/material/styles';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Collapse,
  Grid,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  PlayArrow,
  Pause,
  Stop,
  Schedule,
  Event as EventIcon,
  Info,
  Edit,
  Delete
} from '@mui/icons-material';
import { format } from 'date-fns';
import type { OrbatEvent } from '../types/orbat-data';

const EventCard = styled(Card)<{ eventType?: string; active?: boolean }>(({ theme, eventType, active }) => {
  const getEventColor = () => {
    switch (eventType) {
      case 'ATTACK': return theme.palette.error.main;
      case 'DEFEND': return theme.palette.info.main;
      case 'MOVE': return theme.palette.success.main;
      case 'RESUPPLY': return theme.palette.warning.main;
      default: return theme.palette.grey[500];
    }
  };

  return {
    minHeight: 140,
    borderLeft: `4px solid ${getEventColor()}`,
    backgroundColor: active ? theme.palette.action.selected : 'inherit',
    transition: theme.transitions.create(['box-shadow', 'background-color'], {
      duration: theme.transitions.duration.short,
    }),
    '&:hover': {
      boxShadow: theme.shadows[4],
    },
  };
});

const EventHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: theme.spacing(1),
}));

const EventActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
}));

const EventProgress = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

interface OrbatEventCardProps {
  event: OrbatEvent;
  active?: boolean;
  onActivate?: (event: OrbatEvent) => void;
  onPause?: (event: OrbatEvent) => void;
  onStop?: (event: OrbatEvent) => void;
  onEdit?: (event: OrbatEvent) => void;
  onDelete?: (event: OrbatEvent) => void;
  onShowInfo?: (event: OrbatEvent) => void;
  compact?: boolean;
}

const OrbatEventCard: React.FC<OrbatEventCardProps> = ({
  event,
  active = false,
  onActivate,
  onPause,
  onStop,
  onEdit,
  onDelete,
  onShowInfo,
  compact = false
}) => {
  const [expanded, setExpanded] = useState(false);

  const eventProgress = useMemo(() => {
    if (!event.startTime || !event.endTime) return 0;
    
    const now = new Date();
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    
    return Math.round((elapsed / total) * 100);
  }, [event.startTime, event.endTime]);

  const eventStatus = useMemo(() => {
    if (!event.startTime || !event.endTime) return 'SCHEDULED';
    
    const now = new Date();
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    
    if (now < start) return 'SCHEDULED';
    if (now > end) return 'COMPLETED';
    if (active) return 'ACTIVE';
    
    return 'PENDING';
  }, [event.startTime, event.endTime, active]);

  const getStatusColor = () => {
    switch (eventStatus) {
      case 'ACTIVE': return 'success';
      case 'COMPLETED': return 'default';
      case 'PENDING': return 'warning';
      case 'SCHEDULED': return 'info';
      default: return 'default';
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return 'Invalid date';
    }
  };

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const handleActionClick = (event: React.MouseEvent, action: () => void) => {
    event.stopPropagation();
    action();
  };

  return (
    <EventCard eventType={event.eventType} active={active} elevation={1}>
      <CardContent sx={{ p: compact ? 1 : 2, '&:last-child': { pb: compact ? 1 : 2 } }}>
        <EventHeader>
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
            <EventIcon sx={{ mr: 1, color: 'text.secondary' }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography 
                variant={compact ? 'body2' : 'h6'} 
                component="div"
                noWrap
                title={event.name}
              >
                {event.name}
              </Typography>
              <Typography 
                variant="caption" 
                color="text.secondary"
                noWrap
              >
                {event.eventType}
              </Typography>
            </Box>
          </Box>
          
          <EventActions>
            <Chip 
              label={eventStatus} 
              size="small" 
              color={getStatusColor() as any}
              variant="outlined"
            />
            
            {eventStatus === 'PENDING' && onActivate && (
              <Tooltip title="شروع رویداد">
                <IconButton
                  size="small"
                  onClick={(e) => handleActionClick(e, () => onActivate(event))}
                  color="success"
                >
                  <PlayArrow />
                </IconButton>
              </Tooltip>
            )}
            
            {eventStatus === 'ACTIVE' && onPause && (
              <Tooltip title="مکث رویداد">
                <IconButton
                  size="small"
                  onClick={(e) => handleActionClick(e, () => onPause(event))}
                  color="warning"
                >
                  <Pause />
                </IconButton>
              </Tooltip>
            )}
            
            {(eventStatus === 'ACTIVE' || eventStatus === 'PENDING') && onStop && (
              <Tooltip title="توقف رویداد">
                <IconButton
                  size="small"
                  onClick={(e) => handleActionClick(e, () => onStop(event))}
                  color="error"
                >
                  <Stop />
                </IconButton>
              </Tooltip>
            )}
            
            {onShowInfo && (
              <Tooltip title="اطلاعات رویداد">
                <IconButton
                  size="small"
                  onClick={(e) => handleActionClick(e, () => onShowInfo(event))}
                >
                  <Info />
                </IconButton>
              </Tooltip>
            )}
            
            {onEdit && (
              <Tooltip title="ویرایش رویداد">
                <IconButton
                  size="small"
                  onClick={(e) => handleActionClick(e, () => onEdit(event))}
                >
                  <Edit />
                </IconButton>
              </Tooltip>
            )}
            
            {onDelete && (
              <Tooltip title="حذف رویداد">
                <IconButton
                  size="small"
                  onClick={(e) => handleActionClick(e, () => onDelete(event))}
                  color="error"
                >
                  <Delete />
                </IconButton>
              </Tooltip>
            )}
            
            <IconButton
              size="small"
              onClick={handleExpandClick}
              sx={{ 
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s'
              }}
            >
              <ExpandMore />
            </IconButton>
          </EventActions>
        </EventHeader>

        {!compact && (
          <>
            {(eventStatus === 'ACTIVE' || eventStatus === 'PENDING') && (
              <EventProgress>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Schedule sx={{ mr: 1, fontSize: 16 }} />
                  <Typography variant="caption" color="text.secondary">
                    پیشرفت: {eventProgress}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={eventProgress} 
                  color={eventStatus === 'ACTIVE' ? 'success' : 'primary'}
                />
              </EventProgress>
            )}

            <Grid container spacing={1}>
              {event.startTime && (
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    شروع: {formatDateTime(event.startTime)}
                  </Typography>
                </Grid>
              )}
              
              {event.endTime && (
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    پایان: {formatDateTime(event.endTime)}
                  </Typography>
                </Grid>
              )}
              
              {event.priority && (
                <Grid item xs={6}>
                  <Chip 
                    label={`اولویت: ${event.priority}`} 
                    size="small" 
                    variant="outlined"
                    color={event.priority === 'HIGH' ? 'error' : event.priority === 'MEDIUM' ? 'warning' : 'default'}
                  />
                </Grid>
              )}
              
              {event.affectedUnits && event.affectedUnits.length > 0 && (
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    واحدها: {event.affectedUnits.length}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </>
        )}

        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Divider sx={{ my: 1 }} />
          
          {event.description && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                توضیحات:
              </Typography>
              <Typography variant="body2">
                {event.description}
              </Typography>
            </Box>
          )}
          
          {event.affectedUnits && event.affectedUnits.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                واحدهای تاثیرپذیر:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {event.affectedUnits.slice(0, 5).map((unitId) => (
                  <Chip 
                    key={unitId} 
                    label={unitId} 
                    size="small" 
                    variant="outlined"
                  />
                ))}
                {event.affectedUnits.length > 5 && (
                  <Chip 
                    label={`+${event.affectedUnits.length - 5} more`} 
                    size="small" 
                    color="primary"
                  />
                )}
              </Box>
            </Box>
          )}
          
          {event.parameters && Object.keys(event.parameters).length > 0 && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                پارامترها:
              </Typography>
              <Grid container spacing={1}>
                {Object.entries(event.parameters).map(([key, value]) => (
                  <Grid item xs={6} key={key}>
                    <Typography variant="caption">
                      {key}: {String(value)}
                    </Typography>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Collapse>
      </CardContent>
    </EventCard>
  );
};

export { OrbatEventCard };