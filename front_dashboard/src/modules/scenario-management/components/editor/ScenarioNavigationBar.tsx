/**
 * Scenario Navigation Bar
 * نوار ناوبری اصلی ویرایشگر سناریو
 */

import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  ButtonGroup,
  Box,
  Menu,
  MenuItem,
  Divider,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Menu as MenuIcon,
  Search as SearchIcon,
  Help as HelpIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Map as MapIcon,
  TableChart as GridIcon,
  AccountTree as ChartIcon,
  PlayArrow as PlayIcon,
  Timeline as TimelineIcon,
  Build as ToolbarIcon,
} from '@mui/icons-material';
import { useOrbatCommands } from '../../../orbat-integration';

export interface ScenarioNavigationBarProps {
  scenario: any;
  currentMode: 'map' | 'grid' | 'chart';
  showTimeline: boolean;
  showToolbar: boolean;
  onModeChange: (mode: 'map' | 'grid' | 'chart') => void;
  onToggleTimeline: () => void;
  onToggleToolbar: () => void;
  onBackToScenarios: () => void;
}

export const ScenarioNavigationBar: React.FC<ScenarioNavigationBarProps> = ({
  scenario,
  currentMode,
  showTimeline,
  showToolbar,
  onModeChange,
  onToggleTimeline,
  onToggleToolbar,
  onBackToScenarios,
}) => {
  // State for menus
  const [mainMenuAnchor, setMainMenuAnchor] = useState<null | HTMLElement>(null);
  const [fileMenuAnchor, setFileMenuAnchor] = useState<null | HTMLElement>(null);
  const [viewMenuAnchor, setViewMenuAnchor] = useState<null | HTMLElement>(null);
  const [showSearch, setShowSearch] = useState(false);

  // ORBAT integration
  const commands = useOrbatCommands();

  // Menu handlers
  const handleMainMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMainMenuAnchor(event.currentTarget);
  };

  const handleMainMenuClose = () => {
    setMainMenuAnchor(null);
  };

  const handleFileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setFileMenuAnchor(event.currentTarget);
  };

  const handleFileMenuClose = () => {
    setFileMenuAnchor(null);
  };

  const handleViewMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setViewMenuAnchor(event.currentTarget);
  };

  const handleViewMenuClose = () => {
    setViewMenuAnchor(null);
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

  const handleSearch = () => {
    setShowSearch(true);
    // TODO: Implement search functionality
  };

  const handleHelp = () => {
    window.open('#', '_blank');
  };

  // Mode icons
  const getModeIcon = (mode: 'map' | 'grid' | 'chart') => {
    switch (mode) {
      case 'map': return <MapIcon />;
      case 'grid': return <GridIcon />;
      case 'chart': return <ChartIcon />;
      default: return <ChartIcon />;
    }
  };

  const getModeTitle = (mode: 'map' | 'grid' | 'chart') => {
    switch (mode) {
      case 'map': return 'نمای نقشه';
      case 'grid': return 'نمای جدولی';
      case 'chart': return 'نمای چارت';
      default: return 'نمای چارت';
    }
  };

  return (
    <AppBar 
      position="static" 
      elevation={1}
      sx={{ 
        bgcolor: 'grey.900',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Toolbar variant="dense" sx={{ minHeight: 48, px: 2 }}>
        {/* Left Section - Logo, Menu, Scenario Name */}
        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
          {/* Back Button */}
          <Tooltip title="بازگشت به لیست سناریوها">
            <IconButton
              edge="start"
              color="inherit"
              onClick={onBackToScenarios}
              sx={{ mr: 1 }}
            >
              <BackIcon />
            </IconButton>
          </Tooltip>

          {/* Main Menu */}
          <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: 1 }}>
            <Button
              color="inherit"
              onClick={handleMainMenuOpen}
              startIcon={
                <Box
                  component="svg"
                  sx={{ width: 28, height: 28 }}
                  viewBox="41 41 118 118"
                  fill="currentColor"
                >
                  <path d="m100 45 55 25v60l-55 25-55-25V70z" strokeWidth="6" stroke="currentColor"/>
                  <path d="m45 70 110 60m-110 0 110-60" strokeWidth="6" stroke="currentColor"/>
                  <circle cx="100" cy="70" r="10" fill="currentColor"/>
                </Box>
              }
              sx={{ 
                textTransform: 'none',
                fontWeight: 'medium',
                mr: 2,
                display: { xs: 'none', sm: 'flex' }
              }}
            >
              نقشه‌کش آرایش نبرد
            </Button>

            {/* Scenario Name */}
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                ml: 2,
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: { xs: 'none', sm: 'block' }
              }}
            >
              {scenario?.name || 'سناریو بدون نام'}
            </Typography>
          </Box>
        </Box>

        {/* Center Section - Mode Toggle */}
        <Box sx={{ display: 'flex', alignItems: 'center', mx: 2 }}>
          <ButtonGroup 
            variant="contained" 
            size="small"
            sx={{
              bgcolor: 'grey.800',
              '& .MuiButton-root': {
                borderColor: 'grey.700',
                color: 'grey.400',
                '&:hover': {
                  bgcolor: 'grey.700',
                  color: 'white',
                },
              },
            }}
          >
            {(['map', 'grid', 'chart'] as const).map((mode) => (
              <Tooltip key={mode} title={getModeTitle(mode)}>
                <Button
                  onClick={() => onModeChange(mode)}
                  sx={{
                    minWidth: 40,
                    color: currentMode === mode ? 'success.main' : 'grey.400',
                  }}
                >
                  {getModeIcon(mode)}
                </Button>
              </Tooltip>
            ))}
          </ButtonGroup>
        </Box>

        {/* Right Section - Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {/* Undo/Redo */}
          <Tooltip title="واگرد (Ctrl+Z)">
            <IconButton
              color="inherit"
              size="small"
              onClick={handleUndo}
              sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
            >
              <UndoIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="تکرار (Ctrl+Shift+Z)">
            <IconButton
              color="inherit"
              size="small"
              onClick={handleRedo}
              sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
            >
              <RedoIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ mx: 1, bgcolor: 'grey.700' }} />

          {/* Search */}
          <Tooltip title="جستجو (Ctrl+K)">
            <IconButton
              color="inherit"
              size="small"
              onClick={handleSearch}
            >
              <SearchIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* Help */}
          <Tooltip title="راهنما">
            <IconButton
              color="inherit"
              size="small"
              onClick={handleHelp}
              sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
            >
              <HelpIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* View Options */}
          <Tooltip title="گزینه‌های نمایش">
            <IconButton
              color="inherit"
              size="small"
              onClick={handleViewMenuOpen}
            >
              <MenuIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Main Menu */}
        <Menu
          anchorEl={mainMenuAnchor}
          open={Boolean(mainMenuAnchor)}
          onClose={handleMainMenuClose}
          transformOrigin={{ horizontal: 'left', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        >
          <MenuItem onClick={handleFileMenuOpen}>فایل</MenuItem>
          <MenuItem onClick={() => { /* Edit menu */ }}>ویرایش</MenuItem>
          <MenuItem onClick={handleViewMenuOpen}>نمایش</MenuItem>
          <Divider />
          <MenuItem onClick={() => { /* Tools */ }}>ابزارها</MenuItem>
          <MenuItem onClick={handleHelp}>راهنما</MenuItem>
        </Menu>

        {/* View Menu */}
        <Menu
          anchorEl={viewMenuAnchor}
          open={Boolean(viewMenuAnchor)}
          onClose={handleViewMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={onToggleToolbar}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
              نوار ابزار نقشه
              {showToolbar && <Chip size="small" label="فعال" color="success" />}
            </Box>
          </MenuItem>
          <MenuItem onClick={onToggleTimeline}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
              خط زمان
              {showTimeline && <Chip size="small" label="فعال" color="success" />}
            </Box>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};