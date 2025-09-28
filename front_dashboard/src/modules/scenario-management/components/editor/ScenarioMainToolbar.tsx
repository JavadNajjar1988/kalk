/**
 * Scenario Main Toolbar
 * نوار ابزار اصلی ویرایشگر سناریو
 */

import React, { useState } from 'react';
import {
  Paper,
  Box,
  IconButton,
  ButtonGroup,
  Tooltip,
  Divider,
  Button,
  Menu,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  NearMe as SelectIcon,
  OpenWith as MoveIcon,
  Settings as SettingsIcon,
  Straighten as MeasurementIcon,
  Edit as DrawIcon,
  Timeline as TrackIcon,
  Add as AddIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  CalendarToday as CalendarIcon,
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  SkipPrevious as PrevEventIcon,
  SkipNext as NextEventIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
} from '@mui/icons-material';
import { useOrbatCommands, useOrbatState } from '../../../orbat-integration';

export interface ScenarioMainToolbarProps {
  scenario: any;
  currentMode: 'map' | 'grid' | 'chart';
}

export const ScenarioMainToolbar: React.FC<ScenarioMainToolbarProps> = ({
  scenario,
  currentMode,
}) => {
  // State management
  const [currentTool, setCurrentTool] = useState<string | null>('select');
  const [addMultiple, setAddMultiple] = useState(false);
  const [moveUnitEnabled, setMoveUnitEnabled] = useState(false);
  const [echelonMenuAnchor, setEchelonMenuAnchor] = useState<null | HTMLElement>(null);
  const [symbolMenuAnchor, setSymbolMenuAnchor] = useState<null | HTMLElement>(null);

  // ORBAT integration
  const commands = useOrbatCommands();
  const { state } = useOrbatState();
  const { units, selectedUnits } = state;
  const canUndo = false; // TODO: Implement undo state
  const canRedo = false; // TODO: Implement redo state

  // Tool handlers
  const handleToolChange = (tool: string) => {
    setCurrentTool(tool);
    // TODO: Implement tool change logic
  };

  const handleToggleAddMultiple = () => {
    setAddMultiple(!addMultiple);
  };

  const handleToggleMoveUnit = () => {
    setMoveUnitEnabled(!moveUnitEnabled);
  };

  // Action handlers
  const handleUndo = async () => {
    try {
      // TODO: Implement undo in ORBAT commands
      // await commands.undo();
      console.log('Undo action');
    } catch (error) {
      console.error('Undo failed:', error);
    }
  };

  const handleRedo = async () => {
    try {
      // TODO: Implement redo in ORBAT commands
      // await commands.redo();
      console.log('Redo action');
    } catch (error) {
      console.error('Redo failed:', error);
    }
  };

  const handleTimeNavigation = (action: 'prev-day' | 'next-day' | 'prev-event' | 'next-event') => {
    // TODO: Implement time navigation
    console.log('Time navigation:', action);
  };

  const handleAddUnit = () => {
    // TODO: Implement add unit functionality
    console.log('Add unit');
  };

  const handleEchelonMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setEchelonMenuAnchor(event.currentTarget);
  };

  const handleEchelonMenuClose = () => {
    setEchelonMenuAnchor(null);
  };

  const handleSymbolMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setSymbolMenuAnchor(event.currentTarget);
  };

  const handleSymbolMenuClose = () => {
    setSymbolMenuAnchor(null);
  };

  // Only show toolbar in map mode
  if (currentMode !== 'map') {
    return null;
  }

  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        alignItems: 'center',
        p: 1,
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: 3,
        gap: 1,
      }}
    >
      {/* Left Section - Tools */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Lock/Unlock Multiple */}
        <Tooltip title={addMultiple ? "غیرفعال کردن حالت چندگانه" : "فعال کردن حالت چندگانه"}>
          <IconButton
            size="small"
            onClick={handleToggleAddMultiple}
            color={addMultiple ? "primary" : "default"}
            sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
          >
            {addMultiple ? <LockIcon /> : <LockOpenIcon />}
          </IconButton>
        </Tooltip>

        {/* Select Tool */}
        <Tooltip title="انتخاب">
          <IconButton
            size="small"
            onClick={() => handleToolChange('select')}
            color={currentTool === 'select' && !moveUnitEnabled ? "primary" : "default"}
          >
            <SelectIcon />
          </IconButton>
        </Tooltip>

        {/* Move Tool */}
        <Tooltip title="جابجایی واحد">
          <IconButton
            size="small"
            onClick={handleToggleMoveUnit}
            color={moveUnitEnabled ? "primary" : "default"}
          >
            <MoveIcon />
          </IconButton>
        </Tooltip>

        {/* Settings */}
        <Tooltip title="تنظیمات">
          <IconButton
            size="small"
            sx={{ display: { xs: 'none', md: 'inline-flex' } }}
          >
            <SettingsIcon />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Measurement Tool */}
        <Tooltip title="اندازه‌گیری">
          <IconButton
            size="small"
            onClick={() => handleToolChange('measurements')}
            color={currentTool === 'measurements' ? "primary" : "default"}
          >
            <MeasurementIcon />
          </IconButton>
        </Tooltip>

        {/* Draw Tool */}
        <Tooltip title="ترسیم">
          <IconButton
            size="small"
            onClick={() => handleToolChange('draw')}
            color={currentTool === 'draw' ? "primary" : "default"}
          >
            <DrawIcon />
          </IconButton>
        </Tooltip>

        {/* Unit Track Tool */}
        <Tooltip title="مسیر واحد">
          <IconButton
            size="small"
            onClick={() => handleToolChange('track')}
            color={currentTool === 'track' ? "primary" : "default"}
          >
            <TrackIcon />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Unit Addition Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {/* Echelon Picker */}
          <Tooltip title="انتخاب رده">
            <Button
              size="small"
              variant="outlined"
              onClick={handleEchelonMenuOpen}
              sx={{ 
                minWidth: 40,
                px: 1,
                display: { xs: 'none', sm: 'inline-flex' }
              }}
            >
              III
            </Button>
          </Tooltip>

          {/* Military Symbol + Add */}
          <Tooltip title="افزودن واحد">
            <Box sx={{ position: 'relative' }}>
              <IconButton
                size="small"
                onClick={handleAddUnit}
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: 'action.hover',
                  border: 1,
                  borderColor: 'divider',
                  '&:hover': {
                    bgcolor: 'action.selected',
                  }
                }}
              >
                <Box
                  component="div"
                  sx={{
                    width: 20,
                    height: 20,
                    bgcolor: 'primary.main',
                    borderRadius: 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: 12,
                    fontWeight: 'bold',
                  }}
                >
                  I
                </Box>
              </IconButton>
              <AddIcon 
                sx={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 16,
                  height: 16,
                  bgcolor: 'background.paper',
                  borderRadius: '50%',
                  color: 'text.secondary',
                }}
              />
            </Box>
          </Tooltip>

          {/* Symbol Picker */}
          <Tooltip title="انتخاب نمادهای نظامی">
            <IconButton
              size="small"
              onClick={handleSymbolMenuOpen}
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Right Section - Undo/Redo and Time Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}>
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Undo/Redo */}
        <Tooltip title="واگرد">
          <IconButton
            size="small"
            onClick={handleUndo}
            disabled={!canUndo}
          >
            <UndoIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="تکرار">
          <IconButton
            size="small"
            onClick={handleRedo}
            disabled={!canRedo}
          >
            <RedoIcon />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Time Controls */}
        <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 0.5 }}>
          <Tooltip title="انتخاب تاریخ و زمان">
            <IconButton size="small">
              <CalendarIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="روز قبل">
            <IconButton 
              size="small"
              onClick={() => handleTimeNavigation('prev-day')}
            >
              <PrevIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="روز بعد">
            <IconButton 
              size="small"
              onClick={() => handleTimeNavigation('next-day')}
            >
              <NextIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="رویداد قبل">
            <IconButton 
              size="small"
              onClick={() => handleTimeNavigation('prev-event')}
            >
              <PrevEventIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="رویداد بعد">
            <IconButton 
              size="small"
              onClick={() => handleTimeNavigation('next-event')}
            >
              <NextEventIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Echelon Menu */}
      <Menu
        anchorEl={echelonMenuAnchor}
        open={Boolean(echelonMenuAnchor)}
        onClose={handleEchelonMenuClose}
      >
        <MenuItem onClick={handleEchelonMenuClose}>Team/Crew (●)</MenuItem>
        <MenuItem onClick={handleEchelonMenuClose}>Squad (●●)</MenuItem>
        <MenuItem onClick={handleEchelonMenuClose}>Section (●●●)</MenuItem>
        <MenuItem onClick={handleEchelonMenuClose}>Platoon (I)</MenuItem>
        <MenuItem onClick={handleEchelonMenuClose}>Company (II)</MenuItem>
        <MenuItem onClick={handleEchelonMenuClose}>Battalion (III)</MenuItem>
        <MenuItem onClick={handleEchelonMenuClose}>Regiment (IIII)</MenuItem>
      </Menu>

      {/* Symbol Menu */}
      <Menu
        anchorEl={symbolMenuAnchor}
        open={Boolean(symbolMenuAnchor)}
        onClose={handleSymbolMenuClose}
      >
        <MenuItem onClick={handleSymbolMenuClose}>Infantry</MenuItem>
        <MenuItem onClick={handleSymbolMenuClose}>Armor</MenuItem>
        <MenuItem onClick={handleSymbolMenuClose}>Artillery</MenuItem>
        <MenuItem onClick={handleSymbolMenuClose}>Engineer</MenuItem>
        <MenuItem onClick={handleSymbolMenuClose}>Air Defense</MenuItem>
      </Menu>
    </Paper>
  );
};