import React, { useEffect, useRef, useState } from 'react';
import { Box, Chip, Stack, Typography, alpha } from '@mui/material';
import Map from 'ol/Map';
import View from 'ol/View';
import Feature from 'ol/Feature';
import GeoJSON from 'ol/format/GeoJSON';
import Geometry from 'ol/geom/Geometry';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import { defaults as defaultInteractions } from 'ol/interaction/defaults';
import { fromLonLat } from 'ol/proj';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import XYZ from 'ol/source/XYZ';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import 'ol/ol.css';
import { DashboardScenarioCard } from '@/services/api/dashboardApiService';

interface ScenarioMapPreviewProps {
  scenario: DashboardScenarioCard;
  height: number | string;
}

interface MapLayerConfig {
  name?: string;
  layerSourceType?: 'osm' | 'xyz';
  sourceOptions?: {
    url?: string;
    minZoom?: number;
    maxZoom?: number;
    attributions?: string;
  };
}

const previewStyle = new Style({
  stroke: new Stroke({ color: '#b4232d', width: 2.5 }),
  fill: new Fill({ color: 'rgba(180, 35, 45, 0.16)' }),
  image: new CircleStyle({
    radius: 6,
    fill: new Fill({ color: '#b4232d' }),
    stroke: new Stroke({ color: '#ffffff', width: 2 }),
  }),
});

const ScenarioMapPreview: React.FC<ScenarioMapPreviewProps> = ({ scenario, height }) => {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!targetRef.current) return undefined;

    let disposed = false;
    let map: Map | undefined;
    let resizeObserver: ResizeObserver | undefined;

    const initialize = async () => {
      setLoadError(false);
      let source: OSM | XYZ = new OSM({ crossOrigin: 'anonymous' });

      try {
        const response = await fetch('/kalknegar/config/mapConfig.json', { cache: 'force-cache' });
        if (response.ok) {
          const configs = await response.json() as MapLayerConfig[];
          const config = configs.find((item) => item.name === scenario.mapPreview.baseMapId);
          if (config?.layerSourceType === 'xyz' && config.sourceOptions?.url) {
            source = new XYZ({
              url: config.sourceOptions.url,
              crossOrigin: 'anonymous',
              minZoom: config.sourceOptions.minZoom,
              maxZoom: config.sourceOptions.maxZoom,
              attributions: config.sourceOptions.attributions,
            });
          } else if (config?.layerSourceType === 'osm') {
            source = new OSM({
              url: config.sourceOptions?.url,
              crossOrigin: 'anonymous',
              attributions: config.sourceOptions?.attributions,
            });
          }
        }
      } catch {
        // OSM remains the honest fallback when the saved tile configuration is unavailable.
      }

      if (disposed || !targetRef.current) return;

      const features = new GeoJSON().readFeatures(
        {
          type: 'FeatureCollection',
          features: scenario.mapPreview.features,
        },
        { featureProjection: 'EPSG:3857' },
      ) as Feature<Geometry>[];
      const vectorSource = new VectorSource<Feature<Geometry>>({ features });

      map = new Map({
        target: targetRef.current,
        controls: [],
        interactions: defaultInteractions({
          altShiftDragRotate: false,
          doubleClickZoom: false,
          dragPan: false,
          keyboard: false,
          mouseWheelZoom: false,
          pinchRotate: false,
          pinchZoom: false,
          shiftDragZoom: false,
        }),
        layers: [
          new TileLayer({ source }),
          new VectorLayer({ source: vectorSource, style: previewStyle }),
        ],
        view: new View({
          center: fromLonLat(scenario.mapPreview.center),
          zoom: scenario.mapPreview.zoom,
        }),
      });
      resizeObserver = new ResizeObserver(() => map?.updateSize());
      resizeObserver.observe(targetRef.current);

      if (features.length > 0) {
        map.getView().fit(vectorSource.getExtent(), {
          padding: [28, 28, 28, 28],
          maxZoom: 14,
          duration: 0,
        });
      }

      source.on('tileloaderror', () => {
        if (!disposed) setLoadError(true);
      });
    };

    void initialize();

    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      map?.setTarget(undefined);
    };
  }, [scenario]);

  return (
    <Box
      sx={{
        width: '100%',
        height,
        position: 'relative',
        overflow: 'hidden',
        bgcolor: '#e8eee9',
        '& .ol-viewport': { pointerEvents: 'none' },
      }}
    >
      <Box ref={targetRef} sx={{ position: 'absolute', inset: 0 }} />
      <Stack
        direction="row"
        spacing={0.7}
        sx={{ position: 'absolute', right: 10, bottom: 9, left: 10, alignItems: 'center' }}
      >
        <Chip
          size="small"
          label={`نقشه: ${scenario.mapPreview.baseMapId}`}
          sx={{
            height: 23,
            bgcolor: alpha('#ffffff', 0.9),
            color: '#32453a',
            fontSize: '0.66rem',
            borderRadius: 1,
          }}
        />
        <Chip
          size="small"
          label={`${scenario.contentStats.features.toLocaleString('fa-IR')} عارضه`}
          sx={{
            height: 23,
            bgcolor: alpha('#ffffff', 0.9),
            color: '#32453a',
            fontSize: '0.66rem',
            borderRadius: 1,
          }}
        />
      </Stack>
      {loadError && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            bgcolor: alpha('#eef2ef', 0.88),
            p: 2,
            textAlign: 'center',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            کاشی نقشه در دسترس نیست؛ اطلاعات سناریو بدون تصویر نقشه نمایش داده می‌شود.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ScenarioMapPreview;
