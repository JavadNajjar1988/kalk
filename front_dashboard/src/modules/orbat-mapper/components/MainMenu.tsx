import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Typography,
  Divider,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  useTheme,
} from '@mui/material';
import {
  ExpandMore as ChevronDownIcon,
  Home as HomeIcon,
  Search as SearchIcon,
  FileDownload as DownloadIcon,
  Save as SaveIcon,
  FileUpload as UploadIcon,
  Add as CreateIcon,
  Image as ImageIcon,
  ContentCopy as CopyIcon,
  FileCopy as DuplicateIcon,
  Info as InfoIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Visibility as ViewIcon,
  Build as ToolsIcon,
  Help as HelpIcon,
  Map as MapIcon,
  Timeline as TimelineIcon,
  Assignment as PanelIcon,
  Route as BreadcrumbIcon,
  Straighten as ScaleIcon,
  LocationOn as LocationIcon,
  Brightness4 as DayNightIcon,
  Explore as SymbolsIcon,
  Keyboard as KeyboardIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Logo SVG component
const OrbatLogo: React.FC = () => (
  <svg
    width="28"
    height="28"
    viewBox="41 41 118 118"
    fill="none"
    stroke="currentColor"
    style={{ flexShrink: 0 }}
  >
    <path
      d="m100 45 55 25v60l-55 25-55-25V70z"
      strokeWidth="6"
      fill="rgb(209 213 219)"
      stroke="rgb(156 163 175)"
    />
    <path
      d="m45 70 110 60m-110 0 110-60"
      strokeWidth="6"
      stroke="rgb(156 163 175)"
    />
    <circle
      cx="100"
      cy="70"
      r="10"
      fill="rgb(209 213 219)"
    />
  </svg>
);

// Types
type ScenarioAction = 
  | 'exportJson'
  | 'save'
  | 'loadNew'
  | 'createNew'
  | 'export'
  | 'exportToImage'
  | 'import'
  | 'exportToClipboard'
  | 'duplicate'
  | 'showInfo'
  | 'browseSymbols';

type UIAction = 
  | 'showSearch'
  | 'showKeyboardShortcuts';

interface UISettings {
  showToolbar: boolean;
  showTimeline: boolean;
  showLeftPanel: boolean;
  showOrbatBreadcrumbs: boolean;
  showScaleLine: boolean;
  showLocation: boolean;
  showDayNightTerminator: boolean;
}

interface MapSettings {
  coordinateFormat: 'dms' | 'dd' | 'MGRS';
  measurementUnit: 'metric' | 'imperial' | 'nautical';
}

interface MainMenuProps {
  canUndo: boolean;
  canRedo: boolean;
  uiSettings: UISettings;
  mapSettings: MapSettings;
  isMobile?: boolean;
  onScenarioAction: (action: ScenarioAction) => void;
  onUIAction: (action: UIAction) => void;
  onUndo: () => void;
  onRedo: () => void;
  onUpdateUISettings: (settings: Partial<UISettings>) => void;
  onUpdateMapSettings: (settings: Partial<MapSettings>) => void;
}

const MainMenu: React.FC<MainMenuProps> = ({
  canUndo,
  canRedo,
  uiSettings,
  mapSettings,
  isMobile = false,
  onScenarioAction,
  onUIAction,
  onUndo,
  onRedo,
  onUpdateUISettings,
  onUpdateMapSettings,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [fileMenuEl, setFileMenuEl] = useState<null | HTMLElement>(null);
  const [editMenuEl, setEditMenuEl] = useState<null | HTMLElement>(null);
  const [viewMenuEl, setViewMenuEl] = useState<null | HTMLElement>(null);
  const [toolsMenuEl, setToolsMenuEl] = useState<null | HTMLElement>(null);
  const [helpMenuEl, setHelpMenuEl] = useState<null | HTMLElement>(null);
  const [measurementMenuEl, setMeasurementMenuEl] = useState<null | HTMLElement>(null);
  const [coordinateMenuEl, setCoordinateMenuEl] = useState<null | HTMLElement>(null);

  const handleMainMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMainMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleSubMenuOpen = useCallback((
    event: React.MouseEvent<HTMLElement>,
    setSubMenuEl: React.Dispatch<React.SetStateAction<null | HTMLElement>>
  ) => {
    setSubMenuEl(event.currentTarget);
  }, []);

  const handleSubMenuClose = useCallback((
    setSubMenuEl: React.Dispatch<React.SetStateAction<null | HTMLElement>>
  ) => {
    setSubMenuEl(null);
  }, []);

  const handleHomeClick = useCallback(() => {
    navigate('/');
    handleMainMenuClose();
  }, [navigate, handleMainMenuClose]);

  const handleScenarioAction = useCallback((action: ScenarioAction) => {
    onScenarioAction(action);
    handleMainMenuClose();
  }, [onScenarioAction, handleMainMenuClose]);

  const handleUIAction = useCallback((action: UIAction) => {
    onUIAction(action);
    handleMainMenuClose();
  }, [onUIAction, handleMainMenuClose]);

  const handleUndo = useCallback(() => {
    onUndo();
    handleSubMenuClose(setEditMenuEl);
  }, [onUndo, handleSubMenuClose]);

  const handleRedo = useCallback(() => {
    onRedo();
    handleSubMenuClose(setEditMenuEl);
  }, [onRedo, handleSubMenuClose]);

  const handleUISettingChange = useCallback((setting: keyof UISettings, value: boolean) => {
    onUpdateUISettings({ [setting]: value });
  }, [onUpdateUISettings]);

  const handleCoordinateFormatChange = useCallback((format: MapSettings['coordinateFormat']) => {
    onUpdateMapSettings({ coordinateFormat: format });
    handleSubMenuClose(setCoordinateMenuEl);
  }, [onUpdateMapSettings, handleSubMenuClose]);

  const handleMeasurementUnitChange = useCallback((unit: MapSettings['measurementUnit']) => {
    onUpdateMapSettings({ measurementUnit: unit });
    handleSubMenuClose(setMeasurementMenuEl);
  }, [onUpdateMapSettings, handleSubMenuClose]);

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Main Menu Button */}
      <Button
        onClick={handleMainMenuOpen}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          backgroundColor: 'rgba(17, 24, 39, 0.5)',
          color: 'grey.300',
          px: 1,
          py: 0.5,
          minWidth: 'auto',
          '&:hover': {
            backgroundColor: 'rgba(17, 24, 39, 0.8)',
            color: 'white',
          },
          fontFamily: 'Vazirmatn, sans-serif',
        }}
      >
        <OrbatLogo />
        {!isMobile && (
          <Typography
            variant="body2"
            sx={{ 
              fontWeight: 500,
              letterSpacing: '-0.025em',
              fontFamily: 'inherit',
            }}
          >
            نقشه‌کش آرایش نبرد
          </Typography>
        )}
        <ChevronDownIcon sx={{ fontSize: 20, color: 'grey.400' }} />
      </Button>

      {/* Main Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMainMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            minWidth: 200,
            fontFamily: 'Vazirmatn, sans-serif',
          },
        }}
      >
        {/* Home */}
        <MenuItem onClick={handleHomeClick} sx={{ fontWeight: 500 }}>
          <HomeIcon sx={{ mr: 2, fontSize: 20 }} />
          خانه
        </MenuItem>

        <Divider />

        {/* Search */}
        <MenuItem onClick={() => handleUIAction('showSearch')}>
          <SearchIcon sx={{ mr: 2, fontSize: 20 }} />
          <Typography sx={{ flexGrow: 1, fontFamily: 'inherit' }}>
            جستجو
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', ml: 2, fontFamily: 'inherit' }}>
            Ctrl/⌘ K
          </Typography>
        </MenuItem>

        <Divider />

        {/* File Menu */}
        <MenuItem
          onClick={(e) => handleSubMenuOpen(e, setFileMenuEl)}
          sx={{ justifyContent: 'space-between' }}
        >
          فایل
          <ChevronDownIcon sx={{ fontSize: 16 }} />
        </MenuItem>

        {/* Edit Menu */}
        <MenuItem
          onClick={(e) => handleSubMenuOpen(e, setEditMenuEl)}
          sx={{ justifyContent: 'space-between' }}
        >
          ویرایش
          <ChevronDownIcon sx={{ fontSize: 16 }} />
        </MenuItem>

        {/* View Menu */}
        <MenuItem
          onClick={(e) => handleSubMenuOpen(e, setViewMenuEl)}
          sx={{ justifyContent: 'space-between' }}
        >
          نمایش
          <ChevronDownIcon sx={{ fontSize: 16 }} />
        </MenuItem>

        <Divider />

        {/* Tools Menu */}
        <MenuItem
          onClick={(e) => handleSubMenuOpen(e, setToolsMenuEl)}
          sx={{ justifyContent: 'space-between' }}
        >
          ابزارها
          <ChevronDownIcon sx={{ fontSize: 16 }} />
        </MenuItem>

        {/* Help Menu */}
        <MenuItem
          onClick={(e) => handleSubMenuOpen(e, setHelpMenuEl)}
          sx={{ justifyContent: 'space-between' }}
        >
          راهنما
          <ChevronDownIcon sx={{ fontSize: 16 }} />
        </MenuItem>
      </Menu>

      {/* File Submenu */}
      <Menu
        anchorEl={fileMenuEl}
        open={Boolean(fileMenuEl)}
        onClose={() => handleSubMenuClose(setFileMenuEl)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { minWidth: 200, fontFamily: 'Vazirmatn, sans-serif' } }}
      >
        <MenuItem onClick={() => handleScenarioAction('exportJson')}>
          <DownloadIcon sx={{ mr: 2, fontSize: 20 }} />
          دانلود سناریو
        </MenuItem>
        <MenuItem onClick={() => handleScenarioAction('save')}>
          <SaveIcon sx={{ mr: 2, fontSize: 20 }} />
          ذخیره سناریو
        </MenuItem>
        <MenuItem onClick={() => handleScenarioAction('loadNew')}>
          <UploadIcon sx={{ mr: 2, fontSize: 20 }} />
          بارگذاری سناریو...
        </MenuItem>
        <MenuItem onClick={() => handleScenarioAction('createNew')}>
          <CreateIcon sx={{ mr: 2, fontSize: 20 }} />
          سناریوی جدید...
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleScenarioAction('export')}>
          <DownloadIcon sx={{ mr: 2, fontSize: 20 }} />
          صادرات داده‌های سناریو...
        </MenuItem>
        <MenuItem onClick={() => handleScenarioAction('exportToImage')}>
          <ImageIcon sx={{ mr: 2, fontSize: 20 }} />
          صادرات به عنوان تصویر
        </MenuItem>
        <MenuItem onClick={() => handleScenarioAction('import')}>
          <UploadIcon sx={{ mr: 2, fontSize: 20 }} />
          وارد کردن داده...
        </MenuItem>
        <MenuItem onClick={() => handleScenarioAction('exportToClipboard')}>
          <CopyIcon sx={{ mr: 2, fontSize: 20 }} />
          کپی سناریو به کلیپ‌بورد
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleScenarioAction('duplicate')}>
          <DuplicateIcon sx={{ mr: 2, fontSize: 20 }} />
          تکثیر سناریو
        </MenuItem>
        <MenuItem onClick={() => handleScenarioAction('showInfo')}>
          <InfoIcon sx={{ mr: 2, fontSize: 20 }} />
          نمایش اطلاعات سناریو
        </MenuItem>
      </Menu>

      {/* Edit Submenu */}
      <Menu
        anchorEl={editMenuEl}
        open={Boolean(editMenuEl)}
        onClose={() => handleSubMenuClose(setEditMenuEl)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { minWidth: 200, fontFamily: 'Vazirmatn, sans-serif' } }}
      >
        <MenuItem onClick={handleUndo} disabled={!canUndo}>
          <UndoIcon sx={{ mr: 2, fontSize: 20 }} />
          <Typography sx={{ flexGrow: 1, fontFamily: 'inherit' }}>
            بازگردانی
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', ml: 2, fontFamily: 'inherit' }}>
            Ctrl/⌘ Z
          </Typography>
        </MenuItem>
        <MenuItem onClick={handleRedo} disabled={!canRedo}>
          <RedoIcon sx={{ mr: 2, fontSize: 20 }} />
          <Typography sx={{ flexGrow: 1, fontFamily: 'inherit' }}>
            تکرار
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', ml: 2, fontFamily: 'inherit' }}>
            Ctrl/⌘ Shift Z
          </Typography>
        </MenuItem>
      </Menu>

      {/* View Submenu */}
      <Menu
        anchorEl={viewMenuEl}
        open={Boolean(viewMenuEl)}
        onClose={() => handleSubMenuClose(setViewMenuEl)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { minWidth: 250, fontFamily: 'Vazirmatn, sans-serif' } }}
      >
        <MenuItem onClick={() => handleUISettingChange('showToolbar', !uiSettings.showToolbar)}>
          <FormControlLabel
            control={<Checkbox checked={uiSettings.showToolbar} size="small" />}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <MapIcon sx={{ mr: 1, fontSize: 20 }} />
                نوار ابزار نقشه
              </Box>
            }
            sx={{ width: '100%', m: 0, fontFamily: 'inherit' }}
          />
        </MenuItem>

        <MenuItem onClick={() => handleUISettingChange('showTimeline', !uiSettings.showTimeline)}>
          <FormControlLabel
            control={<Checkbox checked={uiSettings.showTimeline} size="small" />}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TimelineIcon sx={{ mr: 1, fontSize: 20 }} />
                خط زمان
              </Box>
            }
            sx={{ width: '100%', m: 0, fontFamily: 'inherit' }}
          />
        </MenuItem>

        {!isMobile && (
          <MenuItem onClick={() => handleUISettingChange('showLeftPanel', !uiSettings.showLeftPanel)}>
            <FormControlLabel
              control={<Checkbox checked={uiSettings.showLeftPanel} size="small" />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PanelIcon sx={{ mr: 1, fontSize: 20 }} />
                  پنثثثل آرایش نبرد
                </Box>
              }
              sx={{ width: '100%', m: 0, fontFamily: 'inherit' }}
            />
          </MenuItem>
        )}

        <MenuItem onClick={() => handleUISettingChange('showOrbatBreadcrumbs', !uiSettings.showOrbatBreadcrumbs)}>
          <FormControlLabel
            control={<Checkbox checked={uiSettings.showOrbatBreadcrumbs} size="small" />}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <BreadcrumbIcon sx={{ mr: 1, fontSize: 20 }} />
                مسیر واحد
              </Box>
            }
            sx={{ width: '100%', m: 0, fontFamily: 'inherit' }}
          />
        </MenuItem>

        <Divider />

        <MenuItem onClick={() => handleUISettingChange('showScaleLine', !uiSettings.showScaleLine)}>
          <FormControlLabel
            control={<Checkbox checked={uiSettings.showScaleLine} size="small" />}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ScaleIcon sx={{ mr: 1, fontSize: 20 }} />
                خط مقیاس
              </Box>
            }
            sx={{ width: '100%', m: 0, fontFamily: 'inherit' }}
          />
        </MenuItem>

        <MenuItem onClick={() => handleUISettingChange('showLocation', !uiSettings.showLocation)}>
          <FormControlLabel
            control={<Checkbox checked={uiSettings.showLocation} size="small" />}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LocationIcon sx={{ mr: 1, fontSize: 20 }} />
                موقعیت نشانگر
              </Box>
            }
            sx={{ width: '100%', m: 0, fontFamily: 'inherit' }}
          />
        </MenuItem>

        <MenuItem onClick={() => handleUISettingChange('showDayNightTerminator', !uiSettings.showDayNightTerminator)}>
          <FormControlLabel
            control={<Checkbox checked={uiSettings.showDayNightTerminator} size="small" />}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <DayNightIcon sx={{ mr: 1, fontSize: 20 }} />
                خط روز/شب
              </Box>
            }
            sx={{ width: '100%', m: 0, fontFamily: 'inherit' }}
          />
        </MenuItem>

        {/* Measurement Units Submenu */}
        <MenuItem
          onClick={(e) => handleSubMenuOpen(e, setMeasurementMenuEl)}
          sx={{ pl: 4, justifyContent: 'space-between' }}
        >
          واحدهای اندازه‌گیری
          <ChevronDownIcon sx={{ fontSize: 16 }} />
        </MenuItem>

        {/* Coordinate Format Submenu */}
        <MenuItem
          onClick={(e) => handleSubMenuOpen(e, setCoordinateMenuEl)}
          sx={{ justifyContent: 'space-between' }}
        >
          فرمت مختصات
          <ChevronDownIcon sx={{ fontSize: 16 }} />
        </MenuItem>
      </Menu>

      {/* Measurement Units Submenu */}
      <Menu
        anchorEl={measurementMenuEl}
        open={Boolean(measurementMenuEl)}
        onClose={() => handleSubMenuClose(setMeasurementMenuEl)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { fontFamily: 'Vazirmatn, sans-serif' } }}
      >
        <RadioGroup value={mapSettings.measurementUnit}>
          <MenuItem onClick={() => handleMeasurementUnitChange('metric')}>
            <FormControlLabel
              value="metric"
              control={<Radio size="small" />}
              label="متریک"
              sx={{ fontFamily: 'inherit' }}
            />
          </MenuItem>
          <MenuItem onClick={() => handleMeasurementUnitChange('imperial')}>
            <FormControlLabel
              value="imperial"
              control={<Radio size="small" />}
              label="امپریال"
              sx={{ fontFamily: 'inherit' }}
            />
          </MenuItem>
          <MenuItem onClick={() => handleMeasurementUnitChange('nautical')}>
            <FormControlLabel
              value="nautical"
              control={<Radio size="small" />}
              label="دریایی"
              sx={{ fontFamily: 'inherit' }}
            />
          </MenuItem>
        </RadioGroup>
      </Menu>

      {/* Coordinate Format Submenu */}
      <Menu
        anchorEl={coordinateMenuEl}
        open={Boolean(coordinateMenuEl)}
        onClose={() => handleSubMenuClose(setCoordinateMenuEl)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { fontFamily: 'Vazirmatn, sans-serif' } }}
      >
        <RadioGroup value={mapSettings.coordinateFormat}>
          <MenuItem onClick={() => handleCoordinateFormatChange('dms')}>
            <FormControlLabel
              value="dms"
              control={<Radio size="small" />}
              label="درجه، دقیقه، ثانیه"
              sx={{ fontFamily: 'inherit' }}
            />
          </MenuItem>
          <MenuItem onClick={() => handleCoordinateFormatChange('dd')}>
            <FormControlLabel
              value="dd"
              control={<Radio size="small" />}
              label="درجه اعشاری"
              sx={{ fontFamily: 'inherit' }}
            />
          </MenuItem>
          <MenuItem onClick={() => handleCoordinateFormatChange('MGRS')}>
            <FormControlLabel
              value="MGRS"
              control={<Radio size="small" />}
              label="MGRS"
              sx={{ fontFamily: 'inherit' }}
            />
          </MenuItem>
        </RadioGroup>
      </Menu>

      {/* Tools Submenu */}
      <Menu
        anchorEl={toolsMenuEl}
        open={Boolean(toolsMenuEl)}
        onClose={() => handleSubMenuClose(setToolsMenuEl)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { minWidth: 200, fontFamily: 'Vazirmatn, sans-serif' } }}
      >
        <MenuItem onClick={() => handleScenarioAction('browseSymbols')}>
          <SymbolsIcon sx={{ mr: 2, fontSize: 20 }} />
          مرور نمادها
        </MenuItem>
      </Menu>

      {/* Help Submenu */}
      <Menu
        anchorEl={helpMenuEl}
        open={Boolean(helpMenuEl)}
        onClose={() => handleSubMenuClose(setHelpMenuEl)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { minWidth: 200, fontFamily: 'Vazirmatn, sans-serif' } }}
      >
        <MenuItem component="a" href="https://docs.orbat-mapper.app/guide/about-orbat-mapper" target="_blank">
          <HelpIcon sx={{ mr: 2, fontSize: 20 }} />
          مستندات
        </MenuItem>
        <MenuItem onClick={() => handleUIAction('showKeyboardShortcuts')}>
          <KeyboardIcon sx={{ mr: 2, fontSize: 20 }} />
          <Typography sx={{ flexGrow: 1, fontFamily: 'inherit' }}>
            میانبرهای صفحه‌کلید
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', ml: 2, fontFamily: 'inherit' }}>
            ?
          </Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default MainMenu;