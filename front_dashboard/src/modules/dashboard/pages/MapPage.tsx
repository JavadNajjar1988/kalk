import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Paper,
  Toolbar,
  IconButton,
  Typography,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Slider,
  ButtonGroup,
  Tooltip,
  Fab,
  useTheme,
  alpha,
  Grid,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  Layers,
  ZoomIn,
  ZoomOut,
  MyLocation,
  Search,
  FilterList,
  Add,
  Edit,
  Delete,
  Visibility,
  VisibilityOff,
  Map as MapIcon,
  Timeline,
  Place,
  Navigation,
  Fullscreen,
  FullscreenExit,
  Settings,
  Save,
  Share,
  Print,
  Download,
  Upload,
  GridOn,
  GridOff,
  Straighten,
  CropFree,
  ColorLens,
  Info,
  PushPin,
  Polyline,
  Gesture,
  Circle,
  PlayArrow,
  Pause,
  Stop,
  SkipNext,
  SkipPrevious,
  Speed,
  Schedule,
  Group,
  BarChart,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../store';
import { selectUser } from '../../../store/slices/authSlice';
import { showInfoNotification } from '../../../store/slices/uiSlice';
import {
  setCenter,
  setZoom,
  toggleBaseLayer,
  toggleOverlayLayer,
  toggleMilitaryLayer,
  setLayerOpacity,
  setDrawingMode,
  setDrawingType,
  selectMapState,
  selectBaseLayers,
  selectOverlayLayers,
  selectMilitaryLayers,
  selectMapCenter,
  selectMapZoom,
  selectDrawingType,
  selectIsDrawingMode,
  selectActiveOfflineMaps,
  addMarker,
  MapMarker,
  Coordinates,
} from '../../../store/slices/mapSlice';
import { useTranslation } from '@/hooks/useTranslation';
import { EnhancedScenario, MilitaryUnit, ScenarioEvent, ScenarioStatus, UnitType, UnitSize, UnitStatus, EventType } from '@/types';

// OpenLayers imports
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Point, LineString, Polygon, Circle as CircleGeometry } from 'ol/geom';
import { Feature } from 'ol';
import { Style, Icon, Stroke, Fill, Circle as CircleStyle } from 'ol/style';
import { Select, Draw, Modify } from 'ol/interaction';
import { defaults as defaultControls } from 'ol/control';
import { defaults as defaultInteractions } from 'ol/interaction';

// کامپوننت کنترل تایم‌لاین
const TimelineControl: React.FC<{
  scenario: EnhancedScenario;
  currentTime: string;
  onTimeChange: (time: string) => void;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  isPlaying: boolean;
}> = ({ scenario, currentTime, onTimeChange, onPlay, onPause, onStop, isPlaying }) => {
  const { t } = useTranslation();
  const [speed, setSpeed] = useState(1);

  const events = scenario.events || [];
  const sortedEvents = events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const currentTimeMs = new Date(currentTime).getTime();
  const startTimeMs = new Date(scenario.startTime).getTime();
  const endTimeMs = scenario.endTime ? new Date(scenario.endTime).getTime() : Date.now();
  const totalDuration = endTimeMs - startTimeMs;
  const currentProgress = ((currentTimeMs - startTimeMs) / totalDuration) * 100;

  const handleSliderChange = (_event: Event, newValue: number | number[]) => {
    const progress = newValue as number;
    const newTimeMs = startTimeMs + (progress / 100) * totalDuration;
    onTimeChange(new Date(newTimeMs).toISOString());
  };

  const goToNextEvent = () => {
    const nextEvent = sortedEvents.find(event => 
      new Date(event.timestamp).getTime() > currentTimeMs
    );
    if (nextEvent) {
      onTimeChange(nextEvent.timestamp);
    }
  };

  const goToPrevEvent = () => {
    const prevEvent = sortedEvents.reverse().find(event => 
      new Date(event.timestamp).getTime() < currentTimeMs
    );
    if (prevEvent) {
      onTimeChange(prevEvent.timestamp);
    }
  };

  return (
    <Paper
      sx={{
        position: 'absolute',
        bottom: 80,
        left: 16,
        right: 16,
        p: 2,
        background: alpha(useTheme().palette.background.paper, 0.95),
        backdropFilter: 'blur(10px)',
        zIndex: 1000,
      }}
    >
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          {t('scenarios.timeline.title')} - {new Date(currentTime).toLocaleString('fa-IR')}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <IconButton size="small" onClick={goToPrevEvent}>
            <SkipPrevious />
          </IconButton>
          
          <IconButton 
            size="small" 
            onClick={isPlaying ? onPause : onPlay}
            color={isPlaying ? 'secondary' : 'primary'}
          >
            {isPlaying ? <Pause /> : <PlayArrow />}
          </IconButton>
          
          <IconButton size="small" onClick={onStop}>
            <Stop />
          </IconButton>
          
          <IconButton size="small" onClick={goToNextEvent}>
            <SkipNext />
          </IconButton>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
            <Speed sx={{ fontSize: 16 }} />
            <Typography variant="caption">{speed}x</Typography>
            <Slider
              value={speed}
              onChange={(_, value) => setSpeed(value as number)}
              min={0.25}
              max={4}
              step={0.25}
              size="small"
              sx={{ width: 80 }}
            />
          </Box>
        </Box>
        
        <Slider
          value={currentProgress}
          onChange={handleSliderChange}
          min={0}
          max={100}
          step={0.1}
          size="small"
          sx={{ width: '100%' }}
        />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'text.secondary' }}>
          <span>{new Date(scenario.startTime).toLocaleString('fa-IR')}</span>
          <span>{scenario.endTime ? new Date(scenario.endTime).toLocaleString('fa-IR') : 'حال'}</span>
        </Box>
      </Box>
      
      {/* نمایش رویدادهای فعلی */}
      <Box sx={{ maxHeight: 100, overflowY: 'auto' }}>
        <Typography variant="caption" color="text.secondary" gutterBottom>
          رویدادهای فعلی:
        </Typography>
        {sortedEvents
          .filter(event => {
            const eventTime = new Date(event.timestamp).getTime();
            return Math.abs(eventTime - currentTimeMs) < 3600000; // ±1 ساعت
          })
          .map(event => (
            <Chip
              key={event.id}
              label={event.title}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ mr: 0.5, mb: 0.5 }}
            />
          ))}
      </Box>
    </Paper>
  );
};

// کامپوننت نوار ابزار نقشه
const MapToolbar: React.FC<{
  onLayersClick: () => void;
  onFullscreenToggle: () => void;
  isFullscreen: boolean;
  selectedScenario?: EnhancedScenario | null;
}> = ({ onLayersClick, onFullscreenToggle, isFullscreen, selectedScenario }) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const mapZoom = useAppSelector(selectMapZoom);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchValue, setSearchValue] = useState('');

  const handleZoomIn = () => {
    dispatch(setZoom(mapZoom + 1));
  };

  const handleZoomOut = () => {
    dispatch(setZoom(Math.max(1, mapZoom - 1)));
  };

  const handleMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          dispatch(setCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }));
          dispatch(setZoom(15));
          dispatch(showInfoNotification('موقعیت شما روی نقشه نمایش داده شد'));
        },
        (error) => {
          dispatch(showInfoNotification('خطا در دریافت موقعیت: ' + error.message));
        }
      );
    } else {
      dispatch(showInfoNotification('مرورگر شما از دریافت موقعیت پشتیبانی نمی‌کند'));
    }
  };

  return (
    <Paper
      sx={{
        position: 'absolute',
        top: 16,
        left: 16,
        right: 16,
        zIndex: 1000,
        background: alpha(theme.palette.background.paper, 0.95),
        backdropFilter: 'blur(10px)',
      }}
    >
      <Toolbar variant="dense">
        <Typography variant="h6" sx={{ fontWeight: 600, mr: 2 }}>
          کالک نگار
        </Typography>
        
        {selectedScenario && (
          <Chip 
            label={selectedScenario.name}
            color="primary"
            variant="outlined"
            sx={{ mr: 2 }}
          />
        )}
        
        <TextField
          size="small"
          placeholder="جستجو در نقشه..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 250, mr: 2 }}
        />
        
        <Box sx={{ flexGrow: 1 }} />
        
        <ButtonGroup variant="outlined" size="small" sx={{ mr: 1 }}>
          <Tooltip title="بزرگ‌نمایی">
            <IconButton onClick={handleZoomIn}>
              <ZoomIn />
            </IconButton>
          </Tooltip>
          <Tooltip title="کوچک‌نمایی">
            <IconButton onClick={handleZoomOut}>
              <ZoomOut />
            </IconButton>
          </Tooltip>
          <Tooltip title="موقعیت من">
            <IconButton onClick={handleMyLocation}>
              <MyLocation />
            </IconButton>
          </Tooltip>
        </ButtonGroup>
        
        <Tooltip title="لایه‌ها">
          <IconButton onClick={onLayersClick} sx={{ mr: 1 }}>
            <Layers />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="انتخاب سناریو">
          <IconButton
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{ mr: 1 }}
          >
            <Schedule />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="ابزارها">
          <IconButton
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{ mr: 1 }}
          >
            <Settings />
          </IconButton>
        </Tooltip>
        
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
        >
          <MenuItem onClick={() => setAnchorEl(null)}>
            <ListItemIcon><Schedule /></ListItemIcon>
            <ListItemText>سناریوی تست</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => setAnchorEl(null)}>
            <ListItemIcon><Group /></ListItemIcon>
            <ListItemText>مدیریت واحدها</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => setAnchorEl(null)}>
            <ListItemIcon><BarChart /></ListItemIcon>
            <ListItemText>تحلیل سناریو</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => setAnchorEl(null)}>
            <ListItemIcon><GridOn /></ListItemIcon>
            <ListItemText>نمایش شبکه</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => setAnchorEl(null)}>
            <ListItemIcon><Straighten /></ListItemIcon>
            <ListItemText>ابزار اندازه‌گیری</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => setAnchorEl(null)}>
            <ListItemIcon><CropFree /></ListItemIcon>
            <ListItemText>انتخاب منطقه</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => setAnchorEl(null)}>
            <ListItemIcon><Save /></ListItemIcon>
            <ListItemText>ذخیره نقشه</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => setAnchorEl(null)}>
            <ListItemIcon><Print /></ListItemIcon>
            <ListItemText>چاپ</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => setAnchorEl(null)}>
            <ListItemIcon><Share /></ListItemIcon>
            <ListItemText>اشتراک‌گذاری</ListItemText>
          </MenuItem>
        </Menu>
        
        <Tooltip title={isFullscreen ? 'خروج از تمام صفحه' : 'تمام صفحه'}>
          <IconButton onClick={onFullscreenToggle}>
            {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
          </IconButton>
        </Tooltip>
      </Toolbar>
    </Paper>
  );
};

// کامپوننت اصلی صفحه نقشه
const MapPage: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const unitsLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const baseLayerRefs = useRef<Record<string, TileLayer<any>>>({});
  const offlineLayerRefs = useRef<Record<string, TileLayer<any>>>({});
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const mapState = useAppSelector(selectMapState);
  const mapCenter = useAppSelector(selectMapCenter);
  const mapZoom = useAppSelector(selectMapZoom);
  const baseLayersConfig = useAppSelector(selectBaseLayers);
  const activeOfflineMaps = useAppSelector(selectActiveOfflineMaps);
  const isDrawingMode = useAppSelector(selectIsDrawingMode);
  const theme = useTheme();
  
  const [layersPanelOpen, setLayersPanelOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mousePosition, setMousePosition] = useState<Coordinates | null>(null);
  const [mapReady, setMapReady] = useState(false);
  
  // State برای کالک نگار
  const [selectedScenario, setSelectedScenario] = useState<EnhancedScenario | null>(null);
  const [currentTime, setCurrentTime] = useState<string>(new Date().toISOString());
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackInterval, setPlaybackInterval] = useState<NodeJS.Timeout | null>(null);

  // نمونه سناریو برای تست
  const mockScenario: EnhancedScenario = {
    id: 'test-scenario',
    name: 'عملیات دفاعی در ارتفاعات شمالی',
    description: 'سناریوی تست برای کالک نگار',
    startTime: '2023-10-15T08:00:00Z',
    endTime: '2023-10-18T16:00:00Z',
    status: ScenarioStatus.ACTIVE,
    units: [
      {
        id: 'unit-1',
        name: 'گردان پیاده 1',
        type: UnitType.INFANTRY,
        size: UnitSize.BATTALION,
        symbolCode: '10031000131211004600',
        position: { longitude: 51.388974, latitude: 35.689197 },
        status: UnitStatus.OPERATIONAL,
        createdAt: '2023-10-15T08:00:00Z',
        updatedAt: '2023-10-15T08:00:00Z',
      },
      {
        id: 'unit-2',
        name: 'گردان زرهی 2',
        type: UnitType.ARMOR,
        size: UnitSize.BATTALION,
        symbolCode: '10031000151205010000',
        position: { longitude: 51.4, latitude: 35.7 },
        status: UnitStatus.OPERATIONAL,
        createdAt: '2023-10-15T10:00:00Z',
        updatedAt: '2023-10-15T10:00:00Z',
      },
      {
        id: 'unit-3',
        name: 'آتشبار توپخانه',
        type: UnitType.ARTILLERY,
        size: UnitSize.COMPANY,
        symbolCode: '10031500331105030000',
        position: { longitude: 51.35, latitude: 35.65 },
        status: UnitStatus.OPERATIONAL,
        createdAt: '2023-10-15T12:00:00Z',
        updatedAt: '2023-10-15T12:00:00Z',
      },
    ],
    layers: [],
    events: [
      {
        id: 'event-1',
        scenarioId: 'test-scenario',
        type: EventType.ATTACK,
        timestamp: '2023-10-15T14:00:00Z',
        title: 'شروع حمله دشمن',
        data: {},
        createdAt: '2023-10-15T14:00:00Z',
        updatedAt: '2023-10-15T14:00:00Z',
      },
      {
        id: 'event-2',
        scenarioId: 'test-scenario',
        type: EventType.DEFENSE,
        timestamp: '2023-10-16T08:00:00Z',
        title: 'دفاع موفقیت‌آمیز',
        data: {},
        createdAt: '2023-10-16T08:00:00Z',
        updatedAt: '2023-10-16T08:00:00Z',
      },
    ],
    objectives: ['دفاع از ارتفاعات', 'ممانعت از پیشروی دشمن'],
    phases: [],
    environmentalConditions: [],
    createdAt: '2023-10-15T08:00:00Z',
    updatedAt: '2023-10-15T08:00:00Z',
  };

  // تنظیم سناریو پیش‌فرض
  useEffect(() => {
    setSelectedScenario(mockScenario);
    setCurrentTime(mockScenario.startTime);
  }, []);

  // ایجاد نقشه OpenLayers
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const unitsSource = new VectorSource();
    const unitsLayer = new VectorLayer({
      source: unitsSource,
      style: new Style({
        image: new CircleStyle({
          radius: 8,
          fill: new Fill({ color: '#ff0000' }),
          stroke: new Stroke({ color: '#ffffff', width: 2 }),
        }),
      }),
    });

    unitsLayerRef.current = unitsLayer;

    const map = new Map({
      target: mapRef.current,
      layers: [unitsLayer],
      view: new View({
        center: fromLonLat([mapCenter.lng, mapCenter.lat]),
        zoom: mapZoom,
      }),
      controls: defaultControls(),
      interactions: defaultInteractions(),
    });

    mapInstanceRef.current = map;

    map.on('click', (event) => {
      const coordinate = event.coordinate;
      const lonLat = toLonLat(coordinate);
      setMousePosition({ lat: lonLat[1], lng: lonLat[0] });
    });

    map.on('pointermove', (event) => {
      const coordinate = event.coordinate;
      const lonLat = toLonLat(coordinate);
      setMousePosition({ lat: lonLat[1], lng: lonLat[0] });
    });

    dispatch(showInfoNotification('نقشه OpenLayers بارگذاری شد'));
    setMapReady(true);

    return () => {
      map.setTarget(undefined);
      mapInstanceRef.current = null;
      baseLayerRefs.current = {};
      offlineLayerRefs.current = {};
      setMapReady(false);
    };
    // اجرای یک‌باره پس از مونت
  }, [dispatch]);

  // همگام‌سازی تغییرات لایه‌های پایه با نقشه
  useEffect(() => {
    if (!mapReady) return;
    const map = mapInstanceRef.current;
    if (!map) return;

    // حذف لایه‌هایی که دیگر وجود ندارند
    Object.keys(baseLayerRefs.current).forEach(id => {
      if (!baseLayersConfig.find(l => l.id === id)) {
        const layer = baseLayerRefs.current[id];
        map.removeLayer(layer);
        delete baseLayerRefs.current[id];
      }
    });

    // افزودن/به‌روزرسانی لایه‌ها
    baseLayersConfig.forEach(cfg => {
      let layer = baseLayerRefs.current[cfg.id];
      const isOSM = (cfg.url || '').includes('{s}.tile.openstreetmap.org');
      if (!layer) {
        const xyzOptions: any = { url: cfg.url || '', crossOrigin: 'anonymous' };
        if (typeof cfg.maxZoom === 'number') {
          xyzOptions.maxZoom = cfg.maxZoom;
        }
        if (typeof cfg.minZoom === 'number') {
          xyzOptions.minZoom = cfg.minZoom;
        }
        const source = isOSM ? new OSM() : new XYZ(xyzOptions);
        layer = new TileLayer({ source });
        map.addLayer(layer);
        layer.setZIndex(0);
        baseLayerRefs.current[cfg.id] = layer;
      }
      layer.setOpacity(cfg.opacity);
      layer.setVisible(cfg.visible);
      const src = layer.getSource();
      if (!isOSM && src && typeof (src as any).setUrl === 'function' && cfg.url) {
        (src as any).setUrl(cfg.url);
      }
    });
  }, [baseLayersConfig, mapReady]);

  // افزودن/حذف لایه‌های نقشه‌های آفلاین فعال
  useEffect(() => {
    if (!mapReady) return;
    const map = mapInstanceRef.current;
    if (!map) return;

    const refs = offlineLayerRefs.current;
    const activeIds = new Set(activeOfflineMaps.map(item => `offline-${item.id}`));

    // حذف لایه‌های غیرفعال شده
    Object.entries(refs).forEach(([key, layer]) => {
      if (!activeIds.has(key)) {
        map.removeLayer(layer);
        delete refs[key];
      }
    });

    // افزودن یا به‌روزرسانی لایه‌های جدید
    activeOfflineMaps.forEach(item => {
      const key = `offline-${item.id}`;
      let layer = refs[key];
      if (!layer) {
        const xyzOptions: any = {
          url: item.url,
          crossOrigin: 'anonymous',
        };
        if (typeof item.maxZoom === 'number') {
          xyzOptions.maxZoom = item.maxZoom;
        }
        if (typeof item.minZoom === 'number') {
          xyzOptions.minZoom = item.minZoom;
        }
        layer = new TileLayer({
          source: new XYZ(xyzOptions),
          visible: true,
          opacity: 1,
        });
        layer.set('title', item.name);
        layer.set('name', key);
        layer.set('layerType', 'offline');
        layer.setZIndex(0);
        map.addLayer(layer);
        refs[key] = layer;
      } else {
        const source = layer.getSource();
        if (source && typeof (source as any).setUrl === 'function') {
          (source as any).setUrl(item.url);
        }
        layer.set('title', item.name);
        layer.setVisible(true);
      }
    });
  }, [activeOfflineMaps, mapReady]);

  // به‌روزرسانی مرکز و زوم نقشه
  useEffect(() => {
    if (mapInstanceRef.current) {
      const view = mapInstanceRef.current.getView();
      view.setCenter(fromLonLat([mapCenter.lng, mapCenter.lat]));
      view.setZoom(mapZoom);
    }
  }, [mapCenter, mapZoom]);

  // به‌روزرسانی واحدها روی نقشه
  useEffect(() => {
    if (!unitsLayerRef.current || !selectedScenario) return;

    const source = unitsLayerRef.current.getSource();
    source?.clear();

    const currentTimeMs = new Date(currentTime).getTime();
    
    // فیلتر کردن واحدهایی که در زمان فعلی وجود دارند
    const visibleUnits = selectedScenario.units.filter(unit => {
      const unitCreatedAt = new Date(unit.createdAt).getTime();
      return unitCreatedAt <= currentTimeMs;
    });

    // اضافه کردن واحدها به نقشه
    visibleUnits.forEach(unit => {
      const feature = new Feature({
        geometry: new Point(fromLonLat([unit.position.longitude, unit.position.latitude])),
        name: unit.name,
        type: unit.type,
        status: unit.status,
      });

      // استایل بر اساس نوع واحد
      const getUnitColor = (type: string) => {
        switch (type) {
          case 'infantry': return '#4CAF50';
          case 'armor': return '#FF9800';
          case 'artillery': return '#F44336';
          case 'aviation': return '#2196F3';
          case 'naval': return '#3F51B5';
          default: return '#757575';
        }
      };

      feature.setStyle(new Style({
        image: new CircleStyle({
          radius: 12,
          fill: new Fill({ color: getUnitColor(unit.type) }),
          stroke: new Stroke({ color: '#ffffff', width: 2 }),
        }),
      }));

      source?.addFeature(feature);
    });
  }, [selectedScenario, currentTime]);

  const handleFullscreenToggle = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  // توابع کنترل تایم‌لاین
  const handleTimeChange = (time: string) => {
    setCurrentTime(time);
  };

  const handlePlay = () => {
    setIsPlaying(true);
    const interval = setInterval(() => {
      setCurrentTime(prevTime => {
        const newTime = new Date(prevTime);
        newTime.setMinutes(newTime.getMinutes() + 15); // پیشرفت 15 دقیقه‌ای
        return newTime.toISOString();
      });
    }, 1000); // هر ثانیه
    setPlaybackInterval(interval);
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (playbackInterval) {
      clearInterval(playbackInterval);
      setPlaybackInterval(null);
    }
  };

  const handleStop = () => {
    setIsPlaying(false);
    if (playbackInterval) {
      clearInterval(playbackInterval);
      setPlaybackInterval(null);
    }
    if (selectedScenario) {
      setCurrentTime(selectedScenario.startTime);
    }
  };

  return (
    <Box sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
      {/* نوار ابزار */}
      <MapToolbar
        onLayersClick={() => setLayersPanelOpen(true)}
        onFullscreenToggle={handleFullscreenToggle}
        isFullscreen={isFullscreen}
        selectedScenario={selectedScenario}
      />
      
      {/* محتوای اصلی نقشه */}
      <Box
        ref={mapRef}
        sx={{
          width: '100%',
          height: '100%',
          position: 'relative',
          cursor: isDrawingMode ? 'crosshair' : 'default',
        }}
      />
      
      {/* دکمه‌های شناور */}
      <Box sx={{ position: 'absolute', bottom: 24, right: 24, zIndex: 1000 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Tooltip title="افزودن عنصر جدید" placement="left">
            <Fab 
              color="primary" 
              size="small"
              onClick={() => dispatch(setDrawingType('point'))}
            >
              <Add />
            </Fab>
          </Tooltip>
          
          <Tooltip title="ویرایش" placement="left">
            <Fab 
              color="secondary" 
              size="small"
            >
              <Edit />
            </Fab>
          </Tooltip>
          
          <Tooltip title="اطلاعات" placement="left">
            <Fab size="small">
              <Info />
            </Fab>
          </Tooltip>
        </Box>
      </Box>
      
      {/* کنترل تایم‌لاین */}
      {selectedScenario && (
        <TimelineControl
          scenario={selectedScenario}
          currentTime={currentTime}
          onTimeChange={handleTimeChange}
          onPlay={handlePlay}
          onPause={handlePause}
          onStop={handleStop}
          isPlaying={isPlaying}
        />
      )}
      
      {/* اطلاعات مختصات */}
      <Paper
        sx={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          p: 1,
          background: alpha(theme.palette.background.paper, 0.9),
          backdropFilter: 'blur(5px)',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          مختصات: {mousePosition ? `${mousePosition.lat.toFixed(4)}, ${mousePosition.lng.toFixed(4)}` : '-'} | مقیاس: 1:{Math.round(50000 / mapZoom)}
        </Typography>
      </Paper>
    </Box>
  );
};

export default MapPage; 
