/**
 * ScenarioGrid Component
 * کامپوننت شبکه نمایش سناریوها
 */

import React from 'react';
import {
  Grid,
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Add as AddIcon,
  Folder as FolderIcon
} from '@mui/icons-material';
import { ScenarioGridProps } from '../types';
import ScenarioCard from './ScenarioCard';
import DemoScenarioCard from './DemoScenarioCard';
import ScenarioUploader from './ScenarioUploader';
import ScenarioToolbar from './ScenarioToolbar';

const ScenarioGrid: React.FC<ScenarioGridProps> = ({
  scenarios,
  demoScenarios = [],
  onScenarioAction,
  onDemoScenarioSelect,
  onNewScenario,
  onUploadScenario,
  onLoadFromUrl,
  loading = false,
  sortOptions,
  onSortChange,
  className
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  
  // Grid columns based on screen size
  const getGridCols = () => {
    if (isMobile) return 12;
    if (isTablet) return 6;
    return 4;
  };

  const gridCols = getGridCols();

  return (
    <Box className={className}>
      {/* Header with toolbar */}
      {(sortOptions || onSortChange) && (
        <Box sx={{ mb: 3 }}>
          <ScenarioToolbar
            onNewScenario={onNewScenario}
            onSort={onSortChange}
            sortOptions={sortOptions}
            showSearch={false}
          />
        </Box>
      )}

      {/* Recent Scenarios Section */}
      {scenarios.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h6"
            component="h2"
            sx={{
              mb: 2,
              fontWeight: 600,
              color: theme.palette.text.primary
            }}
          >
            سناریوهای اخیر
          </Typography>
          
          <Grid container spacing={3}>
            {scenarios.map((scenario) => (
              <Grid item xs={12} sm={6} md={gridCols} key={scenario.id}>
                <ScenarioCard
                  scenario={scenario}
                  onAction={(action) => onScenarioAction(action, scenario.id)}
                />
              </Grid>
            ))}
          </Grid>
          
          <Divider sx={{ mt: 4, mb: 4 }} />
        </Box>
      )}

      {/* Demo Scenarios Section */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h6"
          component="h2"
          sx={{
            mb: 1,
            fontWeight: 600,
            color: theme.palette.text.primary
          }}
        >
          سناریوهای نمونه
        </Typography>
        
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          یکی از سناریوهای نمونه موجود را امتحان کنید یا سناریوی خود را ایجاد کنید
        </Typography>

        <Grid container spacing={3}>
          {/* Demo scenarios */}
          {demoScenarios.map((scenario) => (
            <Grid item xs={12} sm={6} md={gridCols} key={scenario.id}>
              <DemoScenarioCard
                scenario={scenario}
                onClick={() => onDemoScenarioSelect(scenario.id)}
              />
            </Grid>
          ))}

          {/* New Scenario Card */}
          <Grid item xs={12} sm={6} md={gridCols}>
            <Paper
              sx={{
                height: 300,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                border: `2px dashed ${theme.palette.divider}`,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  bgcolor: theme.palette.action.hover
                }
              }}
              onClick={onNewScenario}
            >
              <Box sx={{ textAlign: 'center', p: 3 }}>
                <AddIcon
                  sx={{
                    fontSize: 48,
                    color: theme.palette.text.secondary,
                    mb: 2
                  }}
                />
                <Typography variant="h6" color="text.primary" gutterBottom>
                  ایجاد سناریوی جدید
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  شروع یک سناریوی خالی
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* File Upload Card */}
          {onUploadScenario && (
            <Grid item xs={12} sm={6} md={gridCols}>
              <Box sx={{ height: 300 }}>
                <ScenarioUploader
                  onUpload={onUploadScenario}
                  onUrlLoad={onLoadFromUrl}
                  variant={onLoadFromUrl ? 'both' : 'file'}
                />
              </Box>
            </Grid>
          )}

          {/* URL Load Card (if separate from upload) */}
          {onLoadFromUrl && !onUploadScenario && (
            <Grid item xs={12} sm={6} md={gridCols}>
              <Box sx={{ height: 300 }}>
                <ScenarioUploader
                  onUpload={() => {}}
                  onUrlLoad={onLoadFromUrl}
                  variant="url"
                />
              </Box>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* Loading State */}
      {loading && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            py: 4
          }}
        >
          <CircularProgress size={40} />
          <Typography variant="body2" sx={{ ml: 2 }}>
            در حال بارگذاری سناریوها...
          </Typography>
        </Box>
      )}

      {/* Empty State */}
      {!loading && scenarios.length === 0 && demoScenarios.length === 0 && (
        <Box
          sx={{
            textAlign: 'center',
            py: 8
          }}
        >
          <FolderIcon
            sx={{
              fontSize: 64,
              color: theme.palette.text.disabled,
              mb: 2
            }}
          />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            هیچ سناریویی یافت نشد
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            برای شروع، یک سناریوی جدید ایجاد کنید یا فایل موجود را بارگذاری کنید
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onNewScenario}
            sx={{ mt: 2 }}
          >
            ایجاد سناریوی جدید
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default ScenarioGrid;