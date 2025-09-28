import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, IconButton, Tooltip, Button, ButtonGroup } from '@mui/material';
import { 
  Home as HomeIcon,
  Map as MapIcon, 
  TableChart as GridIcon,
  AccountTree as ChartIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Search as SearchIcon,
  Menu as MenuIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import { EnhancedScenario } from '../../../types';
import { getCurrentEditorMode, type EditorMode } from '../constants/routes';

// Import layout components
import MainMenu from './layout/MainMenu';
import SettingsSidebar from './layout/SettingsSidebar';
import SearchModal from './layout/SearchModal';

// Import editor mode components (to be created)
import MapEditorView from './editor-modes/MapEditorView';
import GridEditorView from './editor-modes/GridEditorView'; 
import ChartEditorView from './editor-modes/ChartEditorView';

interface ScenarioEditorProps {
  scenario: EnhancedScenario;
}

const ScenarioEditor: React.FC<ScenarioEditorProps> = ({ scenario }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { scenarioId } = useParams<{ scenarioId: string }>();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  
  const currentMode = getCurrentEditorMode(location.pathname);
  
  const handleModeChange = (mode: EditorMode) => {
    const basePath = `/dashboard/orbat-mapper/scenario/${scenarioId}`;
    switch (mode) {
      case 'map':
        navigate(basePath);
        break;
      case 'grid':
        navigate(`${basePath}/grid-edit`);
        break;
      case 'chart':
        navigate(`${basePath}/chart-edit`);
        break;
    }
  };

  const handleGoHome = () => {
    navigate('/dashboard/orbat-mapper');
  };

  const handleMenuAction = (action: string) => {
    console.log('Menu action:', action);
    // TODO: Implement menu actions
    switch (action) {
      case 'save':
        console.log('Saving scenario...');
        break;
      case 'export':
        console.log('Exporting scenario...');
        break;
      case 'settings':
        setSidebarOpen(true);
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const handleUndo = () => {
    // TODO: Implement undo functionality
    console.log('Undo action');
  };

  const handleRedo = () => {
    // TODO: Implement redo functionality  
    console.log('Redo action');
  };

  const handleSearch = () => {
    setSearchOpen(true);
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Top Navigation Bar */}
      <AppBar 
        position="static" 
        sx={{ 
          bgcolor: 'rgb(15 23 42)', // slate-900
          color: 'rgb(229 231 235)' // gray-200
        }}
      >
        <Toolbar sx={{ minHeight: '48px !important', py: 0.5 }}>
          {/* Left section - Scenario name and home */}
          <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: 1 }}>
            <MainMenu onAction={handleMenuAction} />
            
            <Tooltip title="بازگشت به صفحه اصلی">
              <IconButton
                onClick={handleGoHome}
                sx={{ 
                  color: 'rgb(156 163 175)',
                  '&:hover': { 
                    backgroundColor: 'rgb(55 65 81)', 
                    color: 'white' 
                  }
                }}
              >
                <HomeIcon />
              </IconButton>
            </Tooltip>
            
            <Typography 
              variant="body1" 
              sx={{ 
                ml: 2, 
                fontFamily: 'Vazirmatn, sans-serif',
                fontWeight: 500,
                color: 'rgb(229 231 235)',
                cursor: 'pointer',
                '&:hover': { color: 'white' }
              }}
              onClick={() => setSidebarOpen(true)}
            >
              {scenario.name}
            </Typography>
          </Box>

          {/* Center section - Editor Mode Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', mx: 2 }}>
            <ButtonGroup 
              variant="contained" 
              size="small"
              sx={{
                bgcolor: 'rgb(30 41 59)', // slate-800
                '& .MuiButton-root': {
                  color: 'rgb(156 163 175)', // gray-400
                  borderColor: 'rgb(55 65 81)', // gray-700
                  '&:hover': {
                    bgcolor: 'rgb(55 65 81)',
                    color: 'white'
                  }
                },
                '& .MuiButton-contained': {
                  boxShadow: 'none'
                }
              }}
            >
              <Button
                onClick={() => handleModeChange('map')}
                sx={{
                  color: currentMode === 'map' ? 'rgb(34 197 94)' : 'inherit' // green-500 if active
                }}
                startIcon={<MapIcon />}
              >
                نقشه
              </Button>
              <Button
                onClick={() => handleModeChange('grid')}
                sx={{
                  color: currentMode === 'grid' ? 'rgb(34 197 94)' : 'inherit'
                }}
                startIcon={<GridIcon />}
              >
                جدول
              </Button>
              <Button
                onClick={() => handleModeChange('chart')}
                sx={{
                  color: currentMode === 'chart' ? 'rgb(34 197 94)' : 'inherit'
                }}
                startIcon={<ChartIcon />}
              >
                چارت
              </Button>
            </ButtonGroup>
          </Box>

          {/* Right section - Action buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="جستجو (Ctrl+K)">
              <IconButton
                onClick={handleSearch}
                sx={{ 
                  color: 'rgb(156 163 175)',
                  '&:hover': { 
                    backgroundColor: 'rgb(55 65 81)', 
                    color: 'white' 
                  }
                }}
              >
                <SearchIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="بازگردانی (Ctrl+Z)">
              <IconButton
                onClick={handleUndo}
                sx={{ 
                  color: 'rgb(156 163 175)',
                  '&:hover': { 
                    backgroundColor: 'rgb(55 65 81)', 
                    color: 'white' 
                  }
                }}
              >
                <UndoIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="تکرار">
              <IconButton
                onClick={handleRedo}
                sx={{ 
                  color: 'rgb(156 163 175)',
                  '&:hover': { 
                    backgroundColor: 'rgb(55 65 81)', 
                    color: 'white' 
                  }
                }}
              >
                <RedoIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="راهنما">
              <IconButton
                component="a"
                href="https://docs.orbat-mapper.app/guide/about-orbat-mapper"
                target="_blank"
                sx={{ 
                  color: 'rgb(156 163 175)',
                  '&:hover': { 
                    backgroundColor: 'rgb(55 65 81)', 
                    color: 'white' 
                  }
                }}
              >
                <HelpIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="منو">
              <IconButton
                onClick={() => setSidebarOpen(!sidebarOpen)}
                sx={{ 
                  color: 'rgb(156 163 175)',
                  '&:hover': { 
                    backgroundColor: 'rgb(55 65 81)', 
                    color: 'white' 
                  }
                }}
              >
                <MenuIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Editor Content */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <Routes>
          <Route 
            path="/" 
            element={<MapEditorView scenario={scenario} />} 
          />
          <Route 
            path="/grid-edit" 
            element={<GridEditorView scenario={scenario} />} 
          />
          <Route 
            path="/chart-edit" 
            element={<ChartEditorView scenario={scenario} />} 
          />
        </Routes>
      </Box>

      {/* TODO: Add modals, sidebars, etc. */}
      {/* Search Modal */}
      <SearchModal 
        open={searchOpen} 
        onClose={() => setSearchOpen(false)}
        onSelectResult={(result) => console.log('Selected:', result)}
      />
      
      {/* Settings Sidebar */}
      <SettingsSidebar 
        open={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      {/* Notifications */}
    </Box>
  );
};

export default ScenarioEditor;