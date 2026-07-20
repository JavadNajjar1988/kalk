/**
 * مثال استفاده از قابلیت‌های کامل Cesium
 * این فایل نشان می‌دهد که چگونه می‌توان از تمام قابلیت‌های Cesium استفاده کرد
 */

import * as Cesium from 'cesium';

/**
 * مثال 1: اضافه کردن Entities (نقاط، خطوط، چندضلعی‌ها)
 */
export function addEntitiesExample(viewer: Cesium.Viewer) {
  // نقطه
  viewer.entities.add({
    id: 'tehran-point',
    position: Cesium.Cartesian3.fromDegrees(51.3890, 35.6892),
    point: {
      pixelSize: 15,
      color: Cesium.Color.YELLOW,
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 2,
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
    },
    label: {
      text: 'تهران',
      font: '20px sans-serif',
      fillColor: Cesium.Color.WHITE,
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 2,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      pixelOffset: new Cesium.Cartesian2(0, -40)
    }
  });

  // خط (مسیر)
  viewer.entities.add({
    id: 'route-line',
    polyline: {
      positions: Cesium.Cartesian3.fromDegreesArray([
        51.3890, 35.6892, // تهران
        51.4, 35.7,       // نقطه 2
        51.41, 35.71      // نقطه 3
      ]),
      width: 5,
      material: new Cesium.PolylineGlowMaterialProperty({
        glowPower: 0.2,
        color: Cesium.Color.CYAN
      }),
      clampToGround: true
    }
  });

  // چندضلعی (منطقه)
  viewer.entities.add({
    id: 'area-polygon',
    polygon: {
      hierarchy: Cesium.Cartesian3.fromDegreesArray([
        51.38, 35.68,
        51.42, 35.68,
        51.42, 35.70,
        51.38, 35.70
      ]),
      material: Cesium.Color.RED.withAlpha(0.5),
      outline: true,
      outlineColor: Cesium.Color.RED,
      height: 0,
      extrudedHeight: 1000,
      extrudedHeightReference: Cesium.HeightReference.RELATIVE_TO_GROUND
    }
  });

  // دایره
  viewer.entities.add({
    id: 'circle-area',
    position: Cesium.Cartesian3.fromDegrees(51.3890, 35.6892),
    ellipse: {
      semiMajorAxis: 5000, // متر
      semiMinorAxis: 5000,
      material: Cesium.Color.BLUE.withAlpha(0.3),
      outline: true,
      outlineColor: Cesium.Color.BLUE,
      height: 0
    }
  });
}

/**
 * مثال 2: بارگذاری مدل 3D
 */
export function add3DModelExample(viewer: Cesium.Viewer) {
  viewer.entities.add({
    id: '3d-model',
    position: Cesium.Cartesian3.fromDegrees(51.3890, 35.6892, 0),
    model: {
      uri: '/path/to/model.gltf', // مسیر مدل GLTF/GLB
      minimumPixelSize: 128,
      maximumScale: 20000,
      scale: 1.0,
      heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
      // انیمیشن مدل
      runAnimations: true
    },
    // چرخش مدل
    orientation: Cesium.Transforms.headingPitchRollQuaternion(
      Cesium.Cartesian3.fromDegrees(51.3890, 35.6892),
      new Cesium.HeadingPitchRoll(
        Cesium.Math.toRadians(45), // heading
        0, // pitch
        0  // roll
      )
    )
  });
}

/**
 * مثال 3: بارگذاری KML/GeoJSON
 */
export async function loadKMLGeoJSONExample(viewer: Cesium.Viewer) {
  // بارگذاری KML
  try {
    const kmlData = await Cesium.KmlDataSource.load(
      '/path/to/data.kml',
      {
        camera: viewer.scene.camera,
        canvas: viewer.scene.canvas
      }
    );
    viewer.dataSources.add(kmlData);
    console.log('KML loaded successfully');
  } catch (error) {
    console.error('Error loading KML:', error);
  }

  // بارگذاری GeoJSON
  try {
    const geoJsonData = await Cesium.GeoJsonDataSource.load(
      '/path/to/data.geojson',
      {
        stroke: Cesium.Color.HOTPINK,
        fill: Cesium.Color.PINK.withAlpha(0.5),
        strokeWidth: 3
      }
    );
    viewer.dataSources.add(geoJsonData);
    console.log('GeoJSON loaded successfully');
  } catch (error) {
    console.error('Error loading GeoJSON:', error);
  }
}

/**
 * مثال 4: انیمیشن زمانی (Time-based Animation)
 */
export function setupTimeAnimationExample(viewer: Cesium.Viewer) {
  // فعال کردن timeline و animation controls
  viewer.clock.shouldAnimate = true;
  viewer.timeline.zoomTo(
    Cesium.JulianDate.fromIso8601('2023-01-01T00:00:00Z'),
    Cesium.JulianDate.fromIso8601('2023-12-31T23:59:59Z')
  );

  // Entity با موقعیت متحرک
  const startPosition = Cesium.Cartesian3.fromDegrees(51.3890, 35.6892);
  const endPosition = Cesium.Cartesian3.fromDegrees(51.4, 35.7);

  const startTime = Cesium.JulianDate.fromIso8601('2023-01-01T00:00:00Z');
  const stopTime = Cesium.JulianDate.fromIso8601('2023-01-01T01:00:00Z');

  const positionProperty = new Cesium.SampledPositionProperty();
  positionProperty.addSample(startTime, startPosition);
  positionProperty.addSample(stopTime, endPosition);
  positionProperty.setInterpolationOptions({
    interpolationDegree: 1,
    interpolationAlgorithm: Cesium.LinearApproximation
  });

  viewer.entities.add({
    id: 'moving-entity',
    availability: new Cesium.TimeIntervalCollection([
      new Cesium.TimeInterval({
        start: startTime,
        stop: stopTime
      })
    ]),
    position: positionProperty,
    point: {
      pixelSize: 10,
      color: Cesium.Color.LIME,
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 2
    },
    path: {
      resolution: 1,
      material: new Cesium.PolylineGlowMaterialProperty({
        glowPower: 0.1,
        color: Cesium.Color.YELLOW
      }),
      width: 10
    }
  });
}

/**
 * مثال 5: Clustering (خوشه‌بندی)
 */
export function setupClusteringExample(viewer: Cesium.Viewer) {
  const dataSource = new Cesium.CustomDataSource('clustered-data');
  
  // فعال کردن clustering
  dataSource.clustering.enabled = true;
  dataSource.clustering.pixelRange = 15;
  dataSource.clustering.minimumClusterSize = 3;

  // اضافه کردن نقاط
  for (let i = 0; i < 100; i++) {
    dataSource.entities.add({
      position: Cesium.Cartesian3.fromDegrees(
        51.3890 + (Math.random() - 0.5) * 0.1,
        35.6892 + (Math.random() - 0.5) * 0.1
      ),
      point: {
        pixelSize: 10,
        color: Cesium.Color.YELLOW
      }
    });
  }

  viewer.dataSources.add(dataSource);
}

/**
 * مثال 6: Camera Animations (انیمیشن‌های دوربین)
 */
export function cameraAnimationExample(viewer: Cesium.Viewer) {
  // پرواز به موقعیت
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(51.3890, 35.6892, 10000),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-90),
      roll: 0.0
    },
    duration: 3.0,
    complete: () => {
      console.log('Camera animation completed');
    }
  });

  // چرخش دوربین به دور یک نقطه
  viewer.camera.lookAt(
    Cesium.Cartesian3.fromDegrees(51.3890, 35.6892),
    new Cesium.HeadingPitchRange(0, -0.5, 10000)
  );
}

/**
 * مثال 7: Custom Materials (مواد سفارشی)
 */
export function customMaterialExample(viewer: Cesium.Viewer) {
  // Material با رنگ متحرک - استفاده مستقیم از ColorMaterialProperty
  viewer.entities.add({
    id: 'custom-material-entity',
    position: Cesium.Cartesian3.fromDegrees(51.3890, 35.6892),
    ellipse: {
      semiMajorAxis: 1000,
      semiMinorAxis: 1000,
      material: new Cesium.ColorMaterialProperty(Cesium.Color.RED)
    }
  });
}

/**
 * مثال 8: Post-processing Effects (افکت‌های پس‌پردازش)
 */
export function postProcessingExample(viewer: Cesium.Viewer) {
  // Bloom effect (درخشش)
  const bloom = viewer.scene.postProcessStages.bloom;
  bloom.enabled = true;
  // تنظیمات bloom از طریق uniforms
  (bloom as any).uniforms.intensity = 2.0;
  (bloom as any).uniforms.threshold = 0.3;

  // FXAA (anti-aliasing)
  viewer.scene.postProcessStages.fxaa.enabled = true;

  // Ambient Occlusion
  const ao = viewer.scene.postProcessStages.ambientOcclusion;
  ao.enabled = true;
  // تنظیمات ambient occlusion از طریق uniforms
  (ao as any).uniforms.intensity = 1.5;
}

/**
 * مثال 9: Drawing Tools (ابزارهای ترسیم)
 */
export function drawingToolsExample(viewer: Cesium.Viewer) {
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  const positions: Cesium.Cartesian3[] = [];

  handler.setInputAction((click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
    const cartesian = viewer.camera.pickEllipsoid(click.position);
    if (cartesian) {
      positions.push(cartesian);
      
      // اضافه کردن نقطه
      viewer.entities.add({
        position: cartesian,
        point: {
          pixelSize: 10,
          color: Cesium.Color.YELLOW
        }
      });

      // اگر بیش از یک نقطه داریم، خط بکش
      if (positions.length > 1) {
        viewer.entities.add({
          polyline: {
            positions: positions,
            width: 3,
            material: Cesium.Color.CYAN
          }
        });
      }
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

/**
 * مثال 10: Measurement Tools (ابزارهای اندازه‌گیری)
 */
export function measurementExample(_viewer: Cesium.Viewer) {
  const point1 = Cesium.Cartesian3.fromDegrees(51.3890, 35.6892);
  const point2 = Cesium.Cartesian3.fromDegrees(51.4, 35.7);

  // محاسبه فاصله
  const distance = Cesium.Cartesian3.distance(point1, point2);
  console.log('Distance:', distance, 'meters');

  // محاسبه مساحت
  const positions = [
    Cesium.Cartesian3.fromDegrees(51.38, 35.68),
    Cesium.Cartesian3.fromDegrees(51.42, 35.68),
    Cesium.Cartesian3.fromDegrees(51.42, 35.70),
    Cesium.Cartesian3.fromDegrees(51.38, 35.70)
  ];
  
  // محاسبه مساحت polygon با استفاده از PolygonGeometry
  const polygon = new Cesium.PolygonGeometry({
    polygonHierarchy: new Cesium.PolygonHierarchy(positions),
    ellipsoid: Cesium.Ellipsoid.WGS84
  });
  // ایجاد geometry برای محاسبه مساحت
  const geometry = Cesium.PolygonGeometry.createGeometry(polygon);
  if (geometry) {
    // مساحت از طریق geometry attributes قابل محاسبه است
    // برای محاسبه دقیق مساحت، می‌توان از Cesium.GeometryPipeline استفاده کرد
    console.log('Polygon geometry created. Area can be calculated from geometry attributes.');
  }
}

/**
 * مثال 11: Event Handling (مدیریت رویدادها)
 */
export function eventHandlingExample(viewer: Cesium.Viewer) {
  // انتخاب entity
  viewer.selectedEntityChanged.addEventListener((selectedEntity) => {
    if (selectedEntity) {
      console.log('Entity selected:', selectedEntity.id);
      // نمایش اطلاعات entity در infoBox
      viewer.selectedEntity = selectedEntity;
    }
  });

  // حرکت ماوس
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
    const cartesian = viewer.camera.pickEllipsoid(movement.endPosition);
    if (cartesian) {
      const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
      const longitude = Cesium.Math.toDegrees(cartographic.longitude);
      const latitude = Cesium.Math.toDegrees(cartographic.latitude);
      console.log(`Mouse position: ${longitude}, ${latitude}`);
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
}

/**
 * مثال 12: Terrain Providers (ارائه‌دهندگان توپوگرافی)
 */
export async function terrainProviderExample(viewer: Cesium.Viewer) {
  // استفاده از Cesium World Terrain (نیاز به token)
  // Cesium.Ion.defaultAccessToken = 'YOUR_TOKEN';
  // viewer.terrainProvider = await Cesium.createWorldTerrainAsync();

  // استفاده از ArcGIS Terrain (از طریق ArcGisMapServerImageryProvider برای elevation)
  // توجه: Cesium از ArcGisMapServerTerrainProvider پشتیبانی نمی‌کند
  // برای terrain واقعی باید از Cesium World Terrain استفاده کرد (نیاز به token)
  // یا از EllipsoidTerrainProvider برای terrain صاف
  viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
  
  // برای terrain واقعی (نیاز به Cesium Ion token):
  // Cesium.Ion.defaultAccessToken = 'YOUR_TOKEN';
  // viewer.terrainProvider = await Cesium.createWorldTerrainAsync();
}

/**
 * مثال 13: Imagery Providers (ارائه‌دهندگان تصویر)
 */
export function imageryProviderExample(viewer: Cesium.Viewer) {
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

  // TMS
  viewer.imageryLayers.addImageryProvider(
    new Cesium.UrlTemplateImageryProvider({
      url: 'https://your-tms-server.com/{z}/{x}/{y}.png',
      maximumLevel: 18
    })
  );
}

/**
 * مثال 14: Custom Primitives (پریمیتیوهای سفارشی)
 */
export function customPrimitiveExample(viewer: Cesium.Viewer) {
  const instance = new Cesium.GeometryInstance({
    geometry: new Cesium.RectangleGeometry({
      rectangle: Cesium.Rectangle.fromDegrees(51.0, 35.0, 52.0, 36.0),
      height: 0
    }),
    attributes: {
      color: Cesium.ColorGeometryInstanceAttribute.fromColor(
        Cesium.Color.RED.withAlpha(0.5)
      )
    }
  });

  const primitive = new Cesium.Primitive({
    geometryInstances: instance,
    appearance: new Cesium.PerInstanceColorAppearance({
      translucent: true,
      closed: true
    })
  });

  viewer.scene.primitives.add(primitive);
}

/**
 * مثال 15: استفاده از 3D Tiles
 */
export async function tilesetExample(viewer: Cesium.Viewer) {
  try {
    const tileset = await Cesium.Cesium3DTileset.fromUrl(
      'https://your-tileset-url/tileset.json'
    );
    viewer.scene.primitives.add(tileset);
    
    // پرواز به tileset
    viewer.zoomTo(tileset);
  } catch (error) {
    console.error('Error loading 3D Tiles:', error);
  }
}

