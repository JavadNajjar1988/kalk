import React, { useEffect, useRef, useState } from 'react';
import { Box, Chip, Stack, Typography, alpha } from '@mui/material';
import ms from 'milsymbol';
import Map from 'ol/Map';
import View from 'ol/View';
import Feature from 'ol/Feature';
import GeoJSON from 'ol/format/GeoJSON';
import Geometry from 'ol/geom/Geometry';
import Point from 'ol/geom/Point';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import { defaults as defaultInteractions } from 'ol/interaction/defaults';
import { fromLonLat } from 'ol/proj';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import XYZ from 'ol/source/XYZ';
import {
  Circle as CircleStyle,
  Fill,
  Icon,
  Stroke,
  Style,
} from 'ol/style';
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

const militaryStyleCache = new globalThis.Map<string, Style>();

const affiliationColor = (sidc: string) => {
  const identity = sidc.charAt(1).toUpperCase();
  if ('HJSK'.includes(identity)) return '#c62828';
  if ('NLG'.includes(identity)) return '#2e7d42';
  if ('UPW'.includes(identity)) return '#b77900';
  return '#1769aa';
};

const tacticalStyle = (feature: Feature<Geometry>) => {
  const sidc = String(feature.get('sidc') || '').trim();
  const geometry = feature.getGeometry();
  if (sidc && geometry instanceof Point) {
    const cached = militaryStyleCache.get(sidc);
    if (cached) return cached;
    try {
      const symbol = new ms.Symbol(sidc, { size: 32, infoFields: true });
      const canvas = symbol.asCanvas();
      const anchor = symbol.getAnchor();
      const style = new Style({
        image: new Icon({
          img: canvas,
          size: [canvas.width, canvas.height],
          anchor: [anchor.x, anchor.y],
          anchorXUnits: 'pixels',
          anchorYUnits: 'pixels',
        }),
      });
      militaryStyleCache.set(sidc, style);
      return style;
    } catch {
      // Invalid legacy SIDCs still get a visible affiliation-colored marker.
    }
  }

  const color = sidc ? affiliationColor(sidc) : '#b4232d';
  return new Style({
    stroke: new Stroke({ color, width: 2.5 }),
    fill: new Fill({ color: alpha(color, 0.16) }),
    image: new CircleStyle({
      radius: 6,
      fill: new Fill({ color }),
      stroke: new Stroke({ color: '#ffffff', width: 2 }),
    }),
  });
};

const ScenarioMapPreview: React.FC<ScenarioMapPreviewProps> = ({ scenario, height }) => {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [snapshotFailed, setSnapshotFailed] = useState(false);
  const snapshotUrl = scenario.mapPreview.snapshotUrl;

  useEffect(() => {
    setSnapshotFailed(false);
  }, [scenario.id, snapshotUrl]);

  useEffect(() => {
    if (snapshotUrl && !snapshotFailed) return undefined;
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

      const layerFeatureData = scenario.mapPreview.features.filter(
        (feature) => (
          feature.properties as Record<string, unknown> | undefined
        )?.__dashboardProjection !== 'EPSG:3857',
      );
      const tacticalFeatureData = scenario.mapPreview.features.filter(
        (feature) => (
          feature.properties as Record<string, unknown> | undefined
        )?.__dashboardProjection === 'EPSG:3857',
      );
      const geoJson = new GeoJSON();
      const layerFeatures = geoJson.readFeatures(
        {
          type: 'FeatureCollection',
          features: layerFeatureData,
        },
        { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' },
      ) as Feature<Geometry>[];
      const tacticalFeatures = geoJson.readFeatures(
        {
          type: 'FeatureCollection',
          features: tacticalFeatureData,
        },
        { dataProjection: 'EPSG:3857', featureProjection: 'EPSG:3857' },
      ) as Feature<Geometry>[];
      const layerVectorSource = new VectorSource<Feature<Geometry>>({ features: layerFeatures });
      const tacticalVectorSource = new VectorSource<Feature<Geometry>>({
        features: tacticalFeatures,
      });
      const features = [...layerFeatures, ...tacticalFeatures];

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
          new VectorLayer({ source: layerVectorSource, style: previewStyle }),
          new VectorLayer({
            source: tacticalVectorSource,
            style: (feature) => tacticalStyle(feature as Feature<Geometry>),
            zIndex: 2,
          }),
        ],
        view: new View({
          center: fromLonLat(scenario.mapPreview.center),
          zoom: scenario.mapPreview.zoom,
        }),
      });
      resizeObserver = new ResizeObserver(() => map?.updateSize());
      resizeObserver.observe(targetRef.current);

      if (features.length > 0) {
        const extent = layerVectorSource.getExtent();
        tacticalVectorSource.forEachFeature((feature) => {
          const geometry = feature.getGeometry();
          if (geometry) {
            const featureExtent = geometry.getExtent();
            extent[0] = Math.min(extent[0], featureExtent[0]);
            extent[1] = Math.min(extent[1], featureExtent[1]);
            extent[2] = Math.max(extent[2], featureExtent[2]);
            extent[3] = Math.max(extent[3], featureExtent[3]);
          }
        });
        map.getView().fit(extent, {
          padding: [22, 22, 22, 22],
          maxZoom: 6,
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
  }, [scenario, snapshotFailed, snapshotUrl]);

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
      {snapshotUrl && !snapshotFailed ? (
        <Box
          component="img"
          src={snapshotUrl}
          alt={`نمای ذخیره‌شده کالک ${scenario.name}`}
          onError={() => setSnapshotFailed(true)}
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            display: 'block',
            objectFit: 'contain',
            bgcolor: '#e8eee9',
          }}
        />
      ) : (
        <Box ref={targetRef} sx={{ position: 'absolute', inset: 0 }} />
      )}
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
