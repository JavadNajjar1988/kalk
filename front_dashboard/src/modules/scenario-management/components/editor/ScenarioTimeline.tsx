/**
 * Scenario Timeline
 * خط زمان سناریو با کنترل‌های پخش و ناوبری زمان
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  IconButton,
  Slider,
  Typography,
  Tooltip,
  ButtonGroup,
  Chip,
  Paper,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  SkipPrevious as PrevEventIcon,
  SkipNext as NextEventIcon,
  Speed as SpeedIcon,
  Event as EventIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
// Temporarily disable complex ORBAT hooks to fix infinite loops
// import { useOrbatCommands, useOrbatEvents, useOrbatData } from '../../../orbat-integration';

export interface ScenarioTimelineProps {
  scenario: any;
}

interface TimelineEvent {
  id: string;
  name: string;
  timestamp: number;
  type: 'event' | 'state_change' | 'unit_action';
  description?: string;
}

export const ScenarioTimeline: React.FC<ScenarioTimelineProps> = ({
  scenario,
}) => {
  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(24 * 60 * 60 * 1000); // 24 hours in ms
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(-1);
  const [showEventDetails, setShowEventDetails] = useState(false);

  // Refs
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ORBAT integration - temporarily disabled to fix infinite loops
  // const commands = useOrbatCommands();
  // const orbatEvents = useOrbatEvents();
  // const data = useOrbatData();

  // Load timeline data
  useEffect(() => {
    const loadTimelineData = async () => {
      try {
        // Mock timeline events - in real implementation, load from ORBAT
        const mockEvents: TimelineEvent[] = [
          {
            id: '1',
            name: 'شروع عملیات',
            timestamp: 0,
            type: 'event',
            description: 'آغاز عملیات نظامی'
          },
          {
            id: '2',
            name: 'جابجایی واحد A',
            timestamp: 2 * 60 * 60 * 1000, // 2 hours
            type: 'unit_action',
            description: 'واحد A به موقعیت جدید منتقل شد'
          },
          {
            id: '3',
            name: 'تماس با دشمن',
            timestamp: 4 * 60 * 60 * 1000, // 4 hours
            type: 'event',
            description: 'اولین تماس با نیروهای دشمن'
          },
          {
            id: '4',
            name: 'تغییر وضعیت واحدها',
            timestamp: 6 * 60 * 60 * 1000, // 6 hours
            type: 'state_change',
            description: 'تغییر وضعیت عملیاتی واحدها'
          }
        ];

        setEvents(mockEvents);
        setDuration(8 * 60 * 60 * 1000); // 8 hours

        // TODO: Load actual timeline data from ORBAT when hooks are fixed
        // const timelineData = await data.getTimelineEvents();
        // setEvents(timelineData);
      } catch (error) {
        console.error('Failed to load timeline data:', error);
      }
    };

    loadTimelineData();
  }, [scenario?.id]); // Remove data dependency temporarily

  // Update current event index based on time
  useEffect(() => {
    const newEventIndex = events.findIndex((event, index) => {
      const nextEvent = events[index + 1];
      return currentTime >= event.timestamp && 
             (!nextEvent || currentTime < nextEvent.timestamp);
    });

    setCurrentEventIndex(prevIndex => {
      return newEventIndex !== prevIndex ? newEventIndex : prevIndex;
    });
  }, [currentTime, events]);

  // Playback logic
  useEffect(() => {
    if (isPlaying) {
      playbackIntervalRef.current = setInterval(() => {
        setCurrentTime(prevTime => {
          const newTime = prevTime + (1000 * playbackSpeed); // Advance by speed factor
          if (newTime >= duration) {
            setIsPlaying(false);
            return duration;
          }
          return newTime;
        });
      }, 1000); // Update every second
    } else {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    }

    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, duration]);

  // Event handlers
  const handlePlayPause = useCallback(async () => {
    try {
      // Temporarily disable ORBAT commands to fix infinite loops
      // if (isPlaying) {
      //   await commands.pauseTimeline();
      //   setIsPlaying(false);
      // } else {
      //   await commands.playTimeline();
      //   setIsPlaying(true);
      // }
      
      // Fallback to local state only
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('Timeline play/pause failed:', error);
      // Fallback to local state
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]); // Remove commands dependency temporarily

  const handleStop = useCallback(async () => {
    try {
      // Temporarily disable ORBAT commands
      // await commands.seekTimeline(0);
      setCurrentTime(0);
      setIsPlaying(false);
    } catch (error) {
      console.error('Timeline stop failed:', error);
      // Fallback to local state
      setCurrentTime(0);
      setIsPlaying(false);
    }
  }, []); // Remove commands dependency

  const handleTimeChange = useCallback(async (newTime: number) => {
    try {
      // Temporarily disable ORBAT commands
      // await commands.seekTimeline(newTime);
      setCurrentTime(newTime);
    } catch (error) {
      console.error('Timeline seek failed:', error);
      // Fallback to local state
      setCurrentTime(newTime);
    }
  }, []); // Remove commands dependency

  const handlePrevEvent = useCallback(() => {
    if (currentEventIndex > 0) {
      const prevEvent = events[currentEventIndex - 1];
      handleTimeChange(prevEvent.timestamp);
    }
  }, [currentEventIndex, events, handleTimeChange]);

  const handleNextEvent = useCallback(() => {
    if (currentEventIndex < events.length - 1) {
      const nextEvent = events[currentEventIndex + 1];
      handleTimeChange(nextEvent.timestamp);
    }
  }, [currentEventIndex, events, handleTimeChange]);

  const handleSpeedChange = useCallback((newSpeed: number) => {
    setPlaybackSpeed(newSpeed);
  }, []);

  // Format time for display
  const formatTime = useCallback((timeMs: number) => {
    const hours = Math.floor(timeMs / (60 * 60 * 1000));
    const minutes = Math.floor((timeMs % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((timeMs % (60 * 1000)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Get event markers for slider
  const getEventMarks = useCallback(() => {
    return events.map(event => ({
      value: event.timestamp,
      label: event.name,
    }));
  }, [events]);

  const currentEvent = currentEventIndex >= 0 ? events[currentEventIndex] : null;

  return (
    <Paper
      elevation={0}
      sx={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        px: 2,
        py: 1,
        bgcolor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
      }}
    >
      {/* Playback Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ButtonGroup size="small" variant="outlined">
          <Tooltip title="رویداد قبل">
            <span>
              <IconButton
                onClick={handlePrevEvent}
                disabled={currentEventIndex <= 0}
                size="small"
              >
                <PrevEventIcon />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title={isPlaying ? "توقف پخش" : "شروع پخش"}>
            <IconButton
              onClick={handlePlayPause}
              color={isPlaying ? "primary" : "default"}
              size="small"
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </IconButton>
          </Tooltip>

          <Tooltip title="توقف کامل">
            <IconButton
              onClick={handleStop}
              size="small"
            >
              <StopIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="رویداد بعد">
            <span>
              <IconButton
                onClick={handleNextEvent}
                disabled={currentEventIndex >= events.length - 1}
                size="small"
              >
                <NextEventIcon />
              </IconButton>
            </span>
          </Tooltip>
        </ButtonGroup>

        {/* Speed Control */}
        <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
          <SpeedIcon sx={{ mr: 1, fontSize: 18 }} />
          <ButtonGroup size="small" variant="outlined">
            {[0.5, 1, 2, 4].map(speed => (
              <Tooltip key={speed} title={`سرعت ${speed}x`}>
                <IconButton
                  onClick={() => handleSpeedChange(speed)}
                  size="small"
                  color={playbackSpeed === speed ? "primary" : "default"}
                  sx={{ minWidth: 32, fontSize: 12 }}
                >
                  {speed}x
                </IconButton>
              </Tooltip>
            ))}
          </ButtonGroup>
        </Box>
      </Box>

      {/* Timeline Slider */}
      <Box sx={{ flex: 1, mx: 3 }}>
        <Slider
          value={currentTime}
          onChange={(_, value) => handleTimeChange(value as number)}
          min={0}
          max={duration}
          step={60000} // 1 minute steps
          marks={getEventMarks()}
          valueLabelDisplay="auto"
          valueLabelFormat={formatTime}
          sx={{
            '& .MuiSlider-mark': {
              backgroundColor: 'primary.main',
              height: 8,
              width: 2,
            },
            '& .MuiSlider-markActive': {
              backgroundColor: 'primary.dark',
            },
          }}
        />
      </Box>

      {/* Time Display */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="body2" sx={{ fontFamily: 'monospace', minWidth: 80 }}>
          {formatTime(currentTime)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          /
        </Typography>
        <Typography variant="body2" sx={{ fontFamily: 'monospace', minWidth: 80 }}>
          {formatTime(duration)}
        </Typography>

        {/* Current Event */}
        {currentEvent && (
          <Chip
            icon={<EventIcon />}
            label={currentEvent.name}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ ml: 2 }}
          />
        )}
      </Box>
    </Paper>
  );
};