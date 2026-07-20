import React from 'react';
import {
  Box,
  Paper,
  IconButton,
  Tooltip,
  Divider,
  useTheme,
} from '@mui/material';
import {
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
  AspectRatio as AspectRatioIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Settings as SettingsIcon,
  Delete as DeleteIcon,
  SelectAll as SelectAllIcon,
  Clear as ClearIcon,
  Palette as PaletteIcon,
  Link as LinkIcon,
  LinkOff as LinkOffIcon,
  Visibility as VisibilityIcon,
  CenterFocusStrong as CenterFocusStrongIcon,
  Timeline as TimelineIcon,
  GroupWork as GroupWorkIcon,
  Lock as LockIcon,
  ContentCopy as ContentCopyIcon,
  ContentPaste as ContentPasteIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
} from '@mui/icons-material';

interface GraphToolbarProps {
  // Layout controls
  onLayoutChange: (direction: 'TB' | 'LR') => void;
  
  // Resize controls
  isResizeEnabled: boolean;
  onResizeToggle: () => void;
  
  // Selection controls
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  onDeleteSelected?: () => void;
  onCopySelected?: () => void;
  onPasteClipboard?: () => void;
  
  // Appearance controls
  onToggleConnections?: () => void;
  onChangeColor?: () => void;
  edgeType?: 'smoothstep' | 'straight' | 'step';
  onChangeEdgeType?: () => void;
  
  // Filter controls
  onToggleFilter?: () => void;
  onSearch?: () => void;
  
  // View controls
  isFocusedView?: boolean;
  onToggleView?: () => void;
  
  // Settings
  onSettings?: () => void;
  onGroupSelected?: () => void;
  onToggleLock?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  
  // Test controls
  onTestCopyPaste?: () => void;
}

const GraphToolbar: React.FC<GraphToolbarProps> = ({
  onLayoutChange,
  isResizeEnabled,
  onResizeToggle,
  onSelectAll,
  onClearSelection,
  onDeleteSelected,
  onToggleConnections,
  onChangeColor,
  onToggleFilter,
  onSearch,
  isFocusedView = false,
  onToggleView,
  onSettings,
  edgeType = 'smoothstep',
  onChangeEdgeType,
  onGroupSelected,
  onToggleLock,
  onCopySelected,
  onPasteClipboard,
  onUndo,
  onRedo,
  onTestCopyPaste,
}) => {
  const theme = useTheme();

  return (
    <Paper
      sx={{
        p: 1,
        mb: 2,
        background: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: '12px',
        boxShadow: theme.palette.mode === 'dark' 
          ? '0 2px 8px rgba(0,0,0,0.3)' 
          : '0 2px 8px rgba(0,0,0,0.05)',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        flexWrap: 'wrap',
      }}
    >
      {/* Layout Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Tooltip title="چیدمان عمودی">
          <IconButton
            size="small"
            onClick={() => onLayoutChange('TB')}
            sx={{ 
              color: theme.palette.primary.main,
              '&:hover': { backgroundColor: theme.palette.primary.light + '20' }
            }}
          >
            <ViewListIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="چیدمان افقی">
          <IconButton
            size="small"
            onClick={() => onLayoutChange('LR')}
            sx={{ 
              color: theme.palette.primary.main,
              '&:hover': { backgroundColor: theme.palette.primary.light + '20' }
            }}
          >
            <ViewModuleIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Divider orientation="vertical" flexItem />

      {/* Resize Control */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Tooltip title={isResizeEnabled ? 'غیرفعال کردن تغییر اندازه' : 'فعال کردن تغییر اندازه'}>
          <IconButton
            size="small"
            onClick={onResizeToggle}
            sx={{ 
              color: isResizeEnabled ? theme.palette.primary.main : theme.palette.text.secondary,
              backgroundColor: isResizeEnabled ? theme.palette.primary.light + '20' : 'transparent',
              '&:hover': { backgroundColor: theme.palette.primary.light + '20' }
            }}
          >
            <AspectRatioIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Divider orientation="vertical" flexItem />

      <Divider orientation="vertical" flexItem />

      {/* Selection Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Tooltip title="انتخاب همه">
          <IconButton
            size="small"
            onClick={onSelectAll}
            sx={{ 
              color: theme.palette.text.secondary,
              '&:hover': { backgroundColor: theme.palette.action.hover }
            }}
          >
            <SelectAllIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="لغو انتخاب">
          <IconButton
            size="small"
            onClick={onClearSelection}
            sx={{ 
              color: theme.palette.text.secondary,
              '&:hover': { backgroundColor: theme.palette.action.hover }
            }}
          >
            <ClearIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="حذف انتخاب شده">
          <IconButton
            size="small"
            onClick={onDeleteSelected}
            sx={{ 
              color: theme.palette.error.main,
              '&:hover': { backgroundColor: theme.palette.error.light + '20' }
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Divider orientation="vertical" flexItem />

      {/* Appearance Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Tooltip title="نمایش/مخفی اتصالات">
          <IconButton
            size="small"
            onClick={onToggleConnections}
            sx={{ 
              color: theme.palette.text.secondary,
              '&:hover': { backgroundColor: theme.palette.action.hover }
            }}
          >
            <LinkIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="تغییر رنگ">
          <IconButton
            size="small"
            onClick={onChangeColor}
            sx={{ 
              color: theme.palette.text.secondary,
              '&:hover': { backgroundColor: theme.palette.action.hover }
            }}
          >
            <PaletteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Divider orientation="vertical" flexItem />

      {/* Edge Type Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Tooltip title={`نوع خطوط: ${edgeType === 'smoothstep' ? 'SmoothStep' : edgeType === 'straight' ? 'Straight' : 'Step'}` }>
          <IconButton
            size="small"
            onClick={onChangeEdgeType}
            sx={{ color: theme.palette.text.secondary, '&:hover': { backgroundColor: theme.palette.action.hover } }}
          >
            <TimelineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      <Divider orientation="vertical" flexItem />

      {/* Group Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Tooltip title="گروه‌بندی گره‌های انتخاب شده">
          <IconButton
            size="small"
            onClick={onGroupSelected}
            sx={{ color: theme.palette.text.secondary, '&:hover': { backgroundColor: theme.palette.action.hover } }}
          >
            <GroupWorkIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      <Divider orientation="vertical" flexItem />

      {/* View Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Tooltip title={isFocusedView ? 'نمایش کلی' : 'نمایش متمرکز'}>
          <IconButton
            size="small"
            onClick={onToggleView}
            sx={{ 
              color: isFocusedView ? theme.palette.primary.main : theme.palette.text.secondary,
              backgroundColor: isFocusedView ? theme.palette.primary.light + '20' : 'transparent',
              '&:hover': { backgroundColor: theme.palette.primary.light + '20' }
            }}
          >
            {isFocusedView ? <VisibilityIcon fontSize="small" /> : <CenterFocusStrongIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>

      <Divider orientation="vertical" flexItem />

      {/* Filter Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Tooltip title="جستجو">
          <IconButton
            size="small"
            onClick={onSearch}
            sx={{ 
              color: theme.palette.text.secondary,
              '&:hover': { backgroundColor: theme.palette.action.hover }
            }}
          >
            <SearchIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="فیلتر">
          <IconButton
            size="small"
            onClick={onToggleFilter}
            sx={{ 
              color: theme.palette.text.secondary,
              '&:hover': { backgroundColor: theme.palette.action.hover }
            }}
          >
            <FilterListIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Divider orientation="vertical" flexItem />

      {/* Copy/Paste Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Tooltip title="کپی گره‌های انتخاب شده">
          <IconButton
            size="small"
            onClick={onCopySelected}
            sx={{ color: theme.palette.text.secondary, '&:hover': { backgroundColor: theme.palette.action.hover } }}
          >
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="چسباندن گره‌های کپی شده">
          <IconButton
            size="small"
            onClick={onPasteClipboard}
            sx={{ color: theme.palette.text.secondary, '&:hover': { backgroundColor: theme.palette.action.hover } }}
          >
            <ContentPasteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      <Divider orientation="vertical" flexItem />

      {/* Undo/Redo Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Tooltip title="بازگردانی (Undo)">
          <IconButton
            size="small"
            onClick={onUndo}
            sx={{ color: theme.palette.text.secondary, '&:hover': { backgroundColor: theme.palette.action.hover } }}
          >
            <UndoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="تکرار (Redo)">
          <IconButton
            size="small"
            onClick={onRedo}
            sx={{ color: theme.palette.text.secondary, '&:hover': { backgroundColor: theme.palette.action.hover } }}
          >
            <RedoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      <Divider orientation="vertical" flexItem />

      {/* Test Controls */}
      {onTestCopyPaste && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title="تست کپی و پیست">
            <IconButton
              size="small"
              onClick={onTestCopyPaste}
              sx={{ 
                color: theme.palette.warning.main,
                '&:hover': { backgroundColor: theme.palette.action.hover }
              }}
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}
      <Divider orientation="vertical" flexItem />

      {/* Settings */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Tooltip title="تنظیمات">
          <IconButton
            size="small"
            onClick={onSettings}
            sx={{ 
              color: theme.palette.text.secondary,
              '&:hover': { backgroundColor: theme.palette.action.hover }
            }}
          >
            <SettingsIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Lock Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Tooltip title="قفل/باز کردن قفل گره‌های انتخاب شده">
          <IconButton
            size="small"
            onClick={onToggleLock}
            sx={{ color: theme.palette.text.secondary, '&:hover': { backgroundColor: theme.palette.action.hover } }}
          >
            <LockIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      <Divider orientation="vertical" flexItem />
    </Paper>
  );
};

export default GraphToolbar; 