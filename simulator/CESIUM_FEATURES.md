# قابلیت‌های کامل Cesium در Simulator

## ✅ قابلیت‌های فعلی (در حال استفاده)

### 1. **Viewer & Scene**
- ✅ Cesium.Viewer - نمایش‌دهنده اصلی
- ✅ Scene modes (3D, 2D, CV)
- ✅ Camera controls
- ✅ Lighting

### 2. **Imagery Layers**
- ✅ UrlTemplateImageryProvider
- ✅ OpenStreetMap
- ✅ Satellite imagery
- ✅ Custom tile servers
- ✅ Offline maps (mbtiles)

### 3. **Terrain**
- ✅ EllipsoidTerrainProvider
- ⚠️ World Terrain (نیاز به Cesium Ion token)

### 4. **Coordinate Systems**
- ✅ Geographic coordinates (WGS84)
- ✅ Cartesian coordinates
- ✅ Coordinate conversion

---

## 🚀 قابلیت‌های اضافی قابل استفاده

### 1. **Entities (موجودات روی نقشه)**

```typescript
// Point
const point = viewer.entities.add({
  position: Cesium.Cartesian3.fromDegrees(51.3890, 35.6892),
  point: {
    pixelSize: 10,
    color: Cesium.Color.YELLOW,
    outlineColor: Cesium.Color.BLACK,
    outlineWidth: 2
  }
});

// Polyline (خط)
const polyline = viewer.entities.add({
  polyline: {
    positions: Cesium.Cartesian3.fromDegreesArray([
      51.3890, 35.6892,
      51.4, 35.7,
      51.41, 35.71
    ]),
    width: 5,
    material: Cesium.Color.BLUE
  }
});

// Polygon (چندضلعی)
const polygon = viewer.entities.add({
  polygon: {
    hierarchy: Cesium.Cartesian3.fromDegreesArray([
      51.3890, 35.6892,
      51.4, 35.6892,
      51.4, 35.7,
      51.3890, 35.7
    ]),
    material: Cesium.Color.RED.withAlpha(0.5),
    outline: true,
    outlineColor: Cesium.Color.RED
  }
});

// Label (برچسب)
const label = viewer.entities.add({
  position: Cesium.Cartesian3.fromDegrees(51.3890, 35.6892),
  label: {
    text: 'تهران',
    font: '20px sans-serif',
    fillColor: Cesium.Color.WHITE,
    outlineColor: Cesium.Color.BLACK,
    outlineWidth: 2,
    style: Cesium.LabelStyle.FILL_AND_OUTLINE
  }
});

// Billboard (آیکون)
const billboard = viewer.entities.add({
  position: Cesium.Cartesian3.fromDegrees(51.3890, 35.6892),
  billboard: {
    image: '/path/to/icon.png',
    width: 50,
    height: 50
  }
});
```

### 2. **3D Models (مدل‌های سه‌بعدی)**

```typescript
// مدل GLTF/GLB
const model = viewer.entities.add({
  position: Cesium.Cartesian3.fromDegrees(51.3890, 35.6892, 0),
  model: {
    uri: '/path/to/model.gltf',
    minimumPixelSize: 128,
    maximumScale: 20000,
    scale: 1.0
  }
});
```

### 3. **3D Tiles (کاشی‌های سه‌بعدی)**

```typescript
// بارگذاری 3D Tiles
const tileset = await Cesium.Cesium3DTileset.fromUrl(
  'https://your-tileset-url/tileset.json'
);
viewer.scene.primitives.add(tileset);
```

### 4. **KML/GeoJSON**

```typescript
// بارگذاری KML
const kmlData = await Cesium.KmlDataSource.load(
  '/path/to/file.kml'
);
viewer.dataSources.add(kmlData);

// بارگذاری GeoJSON
const geoJsonData = await Cesium.GeoJsonDataSource.load(
  '/path/to/file.geojson'
);
viewer.dataSources.add(geoJsonData);
```

### 5. **Time-based Animations (انیمیشن‌های زمانی)**

```typescript
// تنظیم زمان
viewer.clock.startTime = Cesium.JulianDate.fromIso8601('2023-01-01T00:00:00Z');
viewer.clock.stopTime = Cesium.JulianDate.fromIso8601('2023-12-31T23:59:59Z');
viewer.clock.currentTime = Cesium.JulianDate.now();
viewer.timeline.zoomTo(viewer.clock.startTime, viewer.clock.stopTime);

// Entity با زمان
const entity = viewer.entities.add({
  availability: new Cesium.TimeIntervalCollection([
    new Cesium.TimeInterval({
      start: Cesium.JulianDate.fromIso8601('2023-01-01T00:00:00Z'),
      stop: Cesium.JulianDate.fromIso8601('2023-12-31T23:59:59Z')
    })
  ]),
  position: new Cesium.SampledPositionProperty(),
  // ...
});
```

### 6. **Clustering (خوشه‌بندی)**

```typescript
const dataSource = new Cesium.CustomDataSource('myData');
dataSource.clustering.enabled = true;
dataSource.clustering.pixelRange = 15;
dataSource.clustering.minimumClusterSize = 3;
viewer.dataSources.add(dataSource);
```

### 7. **Custom Shaders (شیدرهای سفارشی)**

```typescript
// Material سفارشی
const material = new Cesium.Material({
  fabric: {
    type: 'Color',
    uniforms: {
      color: new Cesium.Color(1.0, 0.0, 0.0, 1.0)
    }
  }
});

entity.polygon.material = material;
```

### 8. **Post-processing Effects (افکت‌های پس‌پردازش)**

```typescript
// Bloom effect
viewer.scene.postProcessStages.bloom.enabled = true;
viewer.scene.postProcessStages.bloom.intensity = 2.0;

// FXAA (anti-aliasing)
viewer.scene.postProcessStages.fxaa.enabled = true;
```

### 9. **Drawing Tools (ابزارهای ترسیم)**

```typescript
// رسم خط
const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
handler.setInputAction((click) => {
  const cartesian = viewer.camera.pickEllipsoid(click.position);
  // اضافه کردن نقطه به polyline
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);
```

### 10. **Measurement Tools (ابزارهای اندازه‌گیری)**

```typescript
// اندازه‌گیری فاصله
const distance = Cesium.Cartesian3.distance(
  point1,
  point2
);

// محاسبه مساحت
const area = Cesium.PolygonGeometry.computeArea(
  positions,
  Cesium.Ellipsoid.WGS84
);
```

### 11. **Camera Animations (انیمیشن‌های دوربین)**

```typescript
// پرواز به موقعیت
viewer.camera.flyTo({
  destination: Cesium.Cartesian3.fromDegrees(51.3890, 35.6892, 10000),
  orientation: {
    heading: Cesium.Math.toRadians(0),
    pitch: Cesium.Math.toRadians(-90),
    roll: 0.0
  },
  duration: 3.0
});

// چرخش دوربین
viewer.camera.lookAt(
  Cesium.Cartesian3.fromDegrees(51.3890, 35.6892),
  new Cesium.HeadingPitchRange(0, -0.5, 10000)
);
```

### 12. **Terrain Providers (ارائه‌دهندگان توپوگرافی)**

```typescript
// Cesium World Terrain (نیاز به token)
viewer.terrainProvider = await Cesium.createWorldTerrainAsync({
  requestVertexNormals: true,
  requestWaterMask: true
});

// ArcGIS Terrain
viewer.terrainProvider = new Cesium.ArcGisMapServerTerrainProvider({
  url: 'https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer'
});
```

### 13. **Imagery Providers (ارائه‌دهندگان تصویر)**

```typescript
// Bing Maps
viewer.imageryLayers.addImageryProvider(
  new Cesium.BingMapsImageryProvider({
    url: 'https://dev.virtualearth.net',
    key: 'YOUR_BING_KEY',
    mapStyle: Cesium.BingMapsStyle.AERIAL
  })
);

// Mapbox
viewer.imageryLayers.addImageryProvider(
  new Cesium.MapboxImageryProvider({
    mapId: 'your-map-id',
    accessToken: 'YOUR_MAPBOX_TOKEN'
  })
);

// WMS
viewer.imageryLayers.addImageryProvider(
  new Cesium.WebMapServiceImageryProvider({
    url: 'https://your-wms-server.com',
    layers: 'layer1,layer2',
    parameters: {
      transparent: true,
      format: 'image/png'
    }
  })
);
```

### 14. **Event Handling (مدیریت رویدادها)**

```typescript
// کلیک روی entity
viewer.selectedEntityChanged.addEventListener((selectedEntity) => {
  if (selectedEntity) {
    console.log('Entity selected:', selectedEntity);
  }
});

// حرکت ماوس
viewer.cesiumWidget.canvas.addEventListener('mousemove', (event) => {
  const cartesian = viewer.camera.pickEllipsoid(
    new Cesium.Cartesian2(event.clientX, event.clientY)
  );
  // ...
});
```

### 15. **Custom Primitives (پریمیتیوهای سفارشی)**

```typescript
// رسم geometry سفارشی
const instance = new Cesium.GeometryInstance({
  geometry: new Cesium.RectangleGeometry({
    rectangle: Cesium.Rectangle.fromDegrees(51.0, 35.0, 52.0, 36.0)
  }),
  attributes: {
    color: Cesium.ColorGeometryInstanceAttribute.fromColor(
      Cesium.Color.RED.withAlpha(0.5)
    )
  }
});

const primitive = new Cesium.Primitive({
  geometryInstances: instance,
  appearance: new Cesium.EllipsoidAppearance({
    material: Cesium.Material.fromType('Color')
  })
});

viewer.scene.primitives.add(primitive);
```

---

## 📝 نحوه استفاده

تمام این قابلیت‌ها از طریق `import * as Cesium from 'cesium'` در دسترس هستند.

مثال کامل:

```typescript
import * as Cesium from 'cesium';

// استفاده از هر قابلیت Cesium
const viewer = new Cesium.Viewer('cesiumContainer');

// اضافه کردن entity
viewer.entities.add({
  position: Cesium.Cartesian3.fromDegrees(51.3890, 35.6892),
  point: {
    pixelSize: 10,
    color: Cesium.Color.YELLOW
  }
});
```

---

## ⚠️ محدودیت‌ها

1. **Cesium Ion**: برخی قابلیت‌ها (مثل World Terrain) نیاز به Cesium Ion token دارند
2. **Performance**: استفاده از قابلیت‌های سنگین (مثل 3D Tiles بزرگ) ممکن است عملکرد را کاهش دهد
3. **Browser Support**: برخی قابلیت‌ها نیاز به WebGL 2.0 دارند

---

## 🔗 منابع

- [Cesium Documentation](https://cesium.com/learn/cesiumjs/ref-doc/)
- [Cesium Sandcastle](https://sandcastle.cesium.com/) - مثال‌های زنده
- [Cesium API Reference](https://cesium.com/learn/cesiumjs/ref-doc/)

