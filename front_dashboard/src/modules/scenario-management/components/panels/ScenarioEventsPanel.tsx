import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Button,
  Menu,
  MenuItem,
  Divider
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent
} from '@mui/lab';
import {
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  PlayArrow as PlayIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useOrbatIntegration } from '../../hooks/useOrbatIntegration';

interface ScenarioEventsPanelProps {
  scenarioId: string;
  currentTime?: Date;
  onEventSelect?: (event: ScenarioEvent) => void;
  onTimeChange?: (time: Date) => void;
  className?: string;
}

interface ScenarioEvent {
  id: string;
  title: string;
  description?: string;
  time: Date;
  type: EventType;
  visible: boolean;
  data?: any;
}

type EventType = 
  | 'unit_movement'
  | 'engagement'
  | 'status_change'
  | 'communication'
  | 'logistics'
  | 'intelligence'
  | 'weather'
  | 'milestone'
  | 'decision_point';

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  unit_movement: 'Unit Movement',
  engagement: 'Engagement',
  status_change: 'Status Change',
  communication: 'Communication',
  logistics: 'Logistics',
  intelligence: 'Intelligence',
  weather: 'Weather',
  milestone: 'Milestone',
  decision_point: 'Decision Point'
};

const EVENT_TYPE_COLORS: Record<EventType, string> = {
  unit_movement: '#2196F3',
  engagement: '#F44336',
  status_change: '#FF9800',
  communication: '#4CAF50',
  logistics: '#9C27B0',
  intelligence: '#795548',
  weather: '#00BCD4',
  milestone: '#FFC107',
  decision_point: '#E91E63'
};

const ScenarioEventsPanel: React.FC<ScenarioEventsPanelProps> = ({
  scenarioId,
  currentTime,
  onEventSelect,
  onTimeChange,
  className
}) => {
  const [events, setEvents] = useState<ScenarioEvent[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedEvent, setSelectedEvent] = useState<ScenarioEvent | null>(null);
  const { orbatInstance } = useOrbatIntegration();

  useEffect(() => {
    loadEvents();
  }, [scenarioId]);

  const loadEvents = async () => {
    try {
      if (orbatInstance) {
        // Load events from ORBAT scenario data
        const scenarioData = await orbatInstance.getScenarioData(scenarioId);
        if (scenarioData?.events) {
          setEvents(scenarioData.events);
        }
      }
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, scenarioEvent: ScenarioEvent) => {
    setAnchorEl(event.currentTarget);
    setSelectedEvent(scenarioEvent);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedEvent(null);
  };

  const handleEventClick = (event: ScenarioEvent) => {
    onEventSelect?.(event);
    onTimeChange?.(event.time);
  };

  const handleToggleVisibility = (eventId: string) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId 
        ? { ...event, visible: !event.visible }
        : event
    ));
    handleMenuClose();
  };

  const handleEditEvent = () => {
    // TODO: Open edit dialog
    console.log('Edit event:', selectedEvent);
    handleMenuClose();
  };

  const handleDeleteEvent = () => {
    if (selectedEvent) {
      setEvents(prev => prev.filter(event => event.id !== selectedEvent.id));
    }
    handleMenuClose();
  };

  const handleAddEvent = () => {
    // TODO: Open add event dialog
    console.log('Add new event');
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getEventIcon = (type: EventType) => {
    switch (type) {
      case 'unit_movement':
        return <PlayIcon />;
      case 'engagement':
        return <ScheduleIcon />;
      default:
        return <ScheduleIcon />;
    }
  };

  const sortedEvents = [...events].sort((a, b) => a.time.getTime() - b.time.getTime());

  return (
    <Paper className={className} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Timeline Events</Typography>
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={handleAddEvent}
          >
            Add Event
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {events.length} events • {events.filter(e => e.visible).length} visible
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        {sortedEvents.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No events found for this scenario.
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddEvent}
              sx={{ mt: 2 }}
            >
              Create First Event
            </Button>
          </Box>
        ) : (
          <Timeline sx={{ p: 0 }}>
            {sortedEvents.map((event, index) => (
              <TimelineItem key={event.id}>
                <TimelineOppositeContent sx={{ flex: 0.3, pr: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(event.time)}
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {formatTime(event.time)}
                  </Typography>
                </TimelineOppositeContent>
                
                <TimelineSeparator>
                  <TimelineDot 
                    sx={{ 
                      bgcolor: EVENT_TYPE_COLORS[event.type],
                      opacity: event.visible ? 1 : 0.3
                    }}
                  >
                    {getEventIcon(event.type)}
                  </TimelineDot>
                  {index < sortedEvents.length - 1 && <TimelineConnector />}
                </TimelineSeparator>
                
                <TimelineContent>
                  <Box
                    sx={{
                      cursor: 'pointer',
                      p: 1,
                      borderRadius: 1,
                      border: 1,
                      borderColor: currentTime && 
                        Math.abs(currentTime.getTime() - event.time.getTime()) < 60000
                        ? 'primary.main'
                        : 'divider',
                      bgcolor: currentTime && 
                        Math.abs(currentTime.getTime() - event.time.getTime()) < 60000
                        ? 'primary.50'
                        : 'background.paper',
                      opacity: event.visible ? 1 : 0.6,
                      '&:hover': {
                        bgcolor: 'action.hover'
                      }
                    }}
                    onClick={() => handleEventClick(event)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" noWrap>
                          {event.title}
                        </Typography>
                        <Chip
                          label={EVENT_TYPE_LABELS[event.type]}
                          size="small"
                          sx={{
                            bgcolor: EVENT_TYPE_COLORS[event.type],
                            color: 'white',
                            fontSize: '0.75rem',
                            height: '20px'
                          }}
                        />
                      </Box>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuOpen(e, event);
                        }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Box>
                    {event.description && (
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ mt: 0.5 }}
                        noWrap
                      >
                        {event.description}
                      </Typography>
                    )}
                  </Box>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        )}
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleToggleVisibility(selectedEvent?.id || '')}>
          {selectedEvent?.visible ? <VisibilityOffIcon /> : <VisibilityIcon />}
          <Typography sx={{ ml: 1 }}>
            {selectedEvent?.visible ? 'Hide' : 'Show'}
          </Typography>
        </MenuItem>
        <MenuItem onClick={handleEditEvent}>
          <EditIcon />
          <Typography sx={{ ml: 1 }}>Edit</Typography>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDeleteEvent} sx={{ color: 'error.main' }}>
          <DeleteIcon />
          <Typography sx={{ ml: 1 }}>Delete</Typography>
        </MenuItem>
      </Menu>
    </Paper>
  );
};

export default ScenarioEventsPanel;