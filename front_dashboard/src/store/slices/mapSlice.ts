import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index';

const resolveTileServerBase = () => {
  const raw = (import.meta.env.VITE_TILESERVER_URL as string | undefined)?.trim();
  if (raw && raw.length > 0) {
    return raw.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:8480`;
  }
  return 'http://127.0.0.1:8480';
};

const defaultTileServerBase = resolveTileServerBase();

// تعریف تایپ‌های مورد نیاز
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapMarker {
  id: string;
  position: Coordinates;
  title: string;
  description?: string;
  type: 'friendly' | 'hostile' | 'neutral' | 'unknown';
  icon?: string;
  symbolCode?: string;
  unitSize?: string;
  unitType?: string;
}

export interface MapLayer {
  id: string;
  name: string;
  type: 'base' | 'overlay' | 'vector' | 'military';
  visible: boolean;
  opacity: number;
  url?: string;
  data?: any;
}

export interface OfflineTileLayer {
  id: number;
  name: string;
  url: string;
}

export interface MapState {
  center: Coordinates;
  zoom: number;
  bounds: MapBounds | null;
  baseLayers: MapLayer[];
  overlayLayers: MapLayer[];
  militaryLayers: MapLayer[];
  markers: MapMarker[];
  selectedMarker: string | null;
  isDrawingMode: boolean;
  drawingType: 'point' | 'line' | 'polygon' | 'circle' | null;
  loading: boolean;
  error: string | null;
  activeOfflineMaps: OfflineTileLayer[];
}

// حالت اولیه نقشه
const initialState: MapState = {
  center: { lat: 32.4279, lng: 53.6880 }, // مرکز ایران
  zoom: 6,
  bounds: null,
  baseLayers: [
    {
      id: 'osm',
      name: 'نقشه آفلاین جهانی',
      type: 'base',
      visible: true,
      opacity: 1,
      url: `${defaultTileServerBase}/data/maps.mbtiles/{z}/{x}/{y}.png`,
    },
    {
      id: 'satellite',
      name: 'تصویر ماهواره‌ای',
      type: 'base',
      visible: false,
      opacity: 1,
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    },
    {
      id: 'terrain',
      name: 'توپوگرافی',
      type: 'base',
      visible: false,
      opacity: 1,
      url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.png',
    },
  ],
  overlayLayers: [
    {
      id: 'provinces',
      name: 'استان‌ها',
      type: 'overlay',
      visible: true,
      opacity: 0.5,
    },
    {
      id: 'roads',
      name: 'جاده‌ها',
      type: 'overlay',
      visible: false,
      opacity: 0.7,
    },
    {
      id: 'cities',
      name: 'شهرها',
      type: 'overlay',
      visible: true,
      opacity: 1,
    },
  ],
  militaryLayers: [
    {
      id: 'units',
      name: 'یگان‌ها',
      type: 'military',
      visible: true,
      opacity: 1,
    },
    {
      id: 'operations',
      name: 'عملیات‌ها',
      type: 'military',
      visible: true,
      opacity: 1,
    },
    {
      id: 'tactics',
      name: 'تاکتیک‌ها',
      type: 'military',
      visible: true,
      opacity: 1,
    },
  ],
  markers: [],
  selectedMarker: null,
  isDrawingMode: false,
  drawingType: null,
  loading: false,
  error: null,
  activeOfflineMaps: [],
};

// ایجاد اسلایس نقشه
const mapSlice = createSlice({
  name: 'map',
  initialState,
  reducers: {
    // تغییر مرکز نقشه
    setCenter: (state, action: PayloadAction<Coordinates>) => {
      state.center = action.payload;
    },
    
    // تغییر بزرگنمایی نقشه
    setZoom: (state, action: PayloadAction<number>) => {
      state.zoom = action.payload;
    },
    
    // تنظیم محدوده نقشه
    setBounds: (state, action: PayloadAction<MapBounds>) => {
      state.bounds = action.payload;
    },
    
    // تغییر وضعیت نمایش لایه پایه
    toggleBaseLayer: (state, action: PayloadAction<string>) => {
      const layerId = action.payload;
      state.baseLayers = state.baseLayers.map(layer => ({
        ...layer,
        visible: layer.id === layerId,
      }));
    },
    
    // تغییر وضعیت نمایش لایه روکش
    toggleOverlayLayer: (state, action: PayloadAction<string>) => {
      const layerId = action.payload;
      state.overlayLayers = state.overlayLayers.map(layer => ({
        ...layer,
        visible: layer.id === layerId ? !layer.visible : layer.visible,
      }));
    },
    
    // تغییر وضعیت نمایش لایه نظامی
    toggleMilitaryLayer: (state, action: PayloadAction<string>) => {
      const layerId = action.payload;
      state.militaryLayers = state.militaryLayers.map(layer => ({
        ...layer,
        visible: layer.id === layerId ? !layer.visible : layer.visible,
      }));
    },
    
    // تغییر شفافیت لایه
    setLayerOpacity: (state, action: PayloadAction<{ layerId: string; opacity: number; layerType: 'base' | 'overlay' | 'military' }>) => {
      const { layerId, opacity, layerType } = action.payload;
      
      if (layerType === 'base') {
        state.baseLayers = state.baseLayers.map(layer => 
          layer.id === layerId ? { ...layer, opacity } : layer
        );
      } else if (layerType === 'overlay') {
        state.overlayLayers = state.overlayLayers.map(layer => 
          layer.id === layerId ? { ...layer, opacity } : layer
        );
      } else if (layerType === 'military') {
        state.militaryLayers = state.militaryLayers.map(layer => 
          layer.id === layerId ? { ...layer, opacity } : layer
        );
      }
    },
    
    // افزودن مارکر به نقشه
    addMarker: (state, action: PayloadAction<MapMarker>) => {
      state.markers.push(action.payload);
    },
    
    // حذف مارکر از نقشه
    removeMarker: (state, action: PayloadAction<string>) => {
      state.markers = state.markers.filter(marker => marker.id !== action.payload);
      if (state.selectedMarker === action.payload) {
        state.selectedMarker = null;
      }
    },
    
    // ویرایش مارکر
    updateMarker: (state, action: PayloadAction<MapMarker>) => {
      const index = state.markers.findIndex(marker => marker.id === action.payload.id);
      if (index !== -1) {
        state.markers[index] = action.payload;
      }
    },
    
    // انتخاب مارکر
    selectMarker: (state, action: PayloadAction<string | null>) => {
      state.selectedMarker = action.payload;
    },
    
    // تغییر حالت ترسیم
    setDrawingMode: (state, action: PayloadAction<boolean>) => {
      state.isDrawingMode = action.payload;
      if (!action.payload) {
        state.drawingType = null;
      }
    },
    
    // تنظیم نوع ترسیم
    setDrawingType: (state, action: PayloadAction<'point' | 'line' | 'polygon' | 'circle' | null>) => {
      state.drawingType = action.payload;
      state.isDrawingMode = action.payload !== null;
    },
    
    // شروع بارگذاری
    loadingStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    
    // پایان بارگذاری
    loadingEnd: (state) => {
      state.loading = false;
    },
    
    // تنظیم خطا
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    
    // پاک کردن خطا
    clearError: (state) => {
      state.error = null;
    },
    
    // بازنشانی نقشه
    resetMap: (state) => {
      state.center = initialState.center;
      state.zoom = initialState.zoom;
      state.bounds = null;
    },
    
    // تنظیم نقشه‌های آفلاین فعال
    setActiveOfflineMaps: (state, action: PayloadAction<OfflineTileLayer[]>) => {
      state.activeOfflineMaps = action.payload;
      if (action.payload.length === 0) {
        const defaultOsm = initialState.baseLayers.find(layer => layer.id === 'osm');
        const osmLayer = state.baseLayers.find(layer => layer.id === 'osm');
        if (defaultOsm && osmLayer) {
          osmLayer.url = defaultOsm.url || osmLayer.url;
          osmLayer.name = defaultOsm.name;
        }
      }
    },
  },
});

// اکشن‌ها
export const {
  setCenter,
  setZoom,
  setBounds,
  toggleBaseLayer,
  toggleOverlayLayer,
  toggleMilitaryLayer,
  setLayerOpacity,
  addMarker,
  removeMarker,
  updateMarker,
  selectMarker,
  setDrawingMode,
  setDrawingType,
  loadingStart,
  loadingEnd,
  setError,
  setActiveOfflineMaps,
  clearError,
  resetMap,
} = mapSlice.actions;

// سلکتورها
export const selectMapState = (state: RootState) => state.map;
export const selectMapCenter = (state: RootState) => state.map.center;
export const selectMapZoom = (state: RootState) => state.map.zoom;
export const selectMapBounds = (state: RootState) => state.map.bounds;
export const selectBaseLayers = (state: RootState) => state.map.baseLayers;
export const selectOverlayLayers = (state: RootState) => state.map.overlayLayers;
export const selectMilitaryLayers = (state: RootState) => state.map.militaryLayers;
export const selectMapMarkers = (state: RootState) => state.map.markers;
export const selectSelectedMarker = (state: RootState) => {
  const selectedId = state.map.selectedMarker;
  return selectedId ? state.map.markers.find(marker => marker.id === selectedId) : null;
};
export const selectIsDrawingMode = (state: RootState) => state.map.isDrawingMode;
export const selectDrawingType = (state: RootState) => state.map.drawingType;
export const selectMapLoading = (state: RootState) => state.map.loading;
export const selectMapError = (state: RootState) => state.map.error;
export const selectActiveOfflineMaps = (state: RootState) => state.map.activeOfflineMaps;

// اکسپورت کردن ریدیوسر
export default mapSlice.reducer;
