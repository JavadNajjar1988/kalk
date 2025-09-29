<template>
  <div class="relative w-full">
    <div id="chartdiv" class="w-full h-96 rounded-2xl overflow-hidden shadow-lg"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import * as am5 from '@amcharts/amcharts5';
import * as am5map from '@amcharts/amcharts5/map';
import am5geodata_worldLow from '@amcharts/amcharts5-geodata/worldLow';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';

let root: am5.Root | null = null;

onMounted(() => {
  initializeMap();
});

onUnmounted(() => {
  if (root) {
    root.dispose();
    root = null;
  }
});

function initializeMap() {
  // Create root element
  root = am5.Root.new("chartdiv");

  // Set themes
  root.setThemes([
    am5themes_Animated.new(root)
  ]);

  // Create the map chart
  const chart = root.container.children.push(
    am5map.MapChart.new(root, {
      panX: "rotateX",
      panY: "translateY",
      projection: am5map.geoMercator(),
      background: am5.Rectangle.new(root, {
        fill: am5.color(0xe0f2f1), // Light teal background
        fillOpacity: 0.3
      })
    })
  );

  // Remove zoom controls and logo for a cleaner appearance
  chart.set("zoomControl", am5map.ZoomControl.new(root, {
    visible: false
  }));
  
  // Dispose of the logo for a cleaner appearance
  if (root._logo) {
    root._logo.dispose();
  }

  // Create main polygon series for countries
  const polygonSeries = chart.series.push(
    am5map.MapPolygonSeries.new(root, {
      geoJSON: am5geodata_worldLow as any,
      exclude: ["AQ"]
    })
  );

  polygonSeries.mapPolygons.template.setAll({
    fill: am5.color(0xdadada)
  });

  // Create point series for markers
  const pointSeries = chart.series.push(am5map.ClusteredPointSeries.new(root, {
    clusterRadius: 20, // Adjust cluster radius to make clustering more visible
    showClusterZoomoutButton: true
  }));

  // Set minimum cluster size to 2 to ensure clustering happens more readily
  pointSeries.set("minClusterSize", 2);

  // Set clustered bullet (reduced opacity for all clusters)
  pointSeries.set("clusteredBullet", function(rootLocal: am5.Root) {
    const container = am5.Container.new(rootLocal, {
      cursorOverStyle: "pointer"
    });

    container.children.push(am5.Circle.new(rootLocal, {
      radius: 8,
      tooltipY: 0,
      fill: am5.color(0xff8c00),
      fillOpacity: 0.6 // Reduced opacity for cluster center
    }));

    container.children.push(am5.Circle.new(rootLocal, {
      radius: 12,
      fillOpacity: 0.15, // Reduced from 0.3 to 0.15
      tooltipY: 0,
      fill: am5.color(0xff8c00)
    }));

    container.children.push(am5.Circle.new(rootLocal, {
      radius: 16,
      fillOpacity: 0.1, // Reduced from 0.3 to 0.1
      tooltipY: 0,
      fill: am5.color(0xff8c00)
    }));

    container.children.push(am5.Label.new(rootLocal, {
      centerX: am5.p50,
      centerY: am5.p50,
      fill: am5.color(0xffffff),
      populateText: true,
      fontSize: "8",
      text: "{value}"
    }));

    container.events.on("click", function(e: any) {
      pointSeries.zoomToCluster(e.target.dataItem);
    });

    return am5.Bullet.new(rootLocal, {
      sprite: container
    });
  });

  // Keep regular bullets for individual points when not clustered (further reduced opacity)
  pointSeries.bullets.push(function() {
    const circle = am5.Circle.new(root as am5.Root, {
      radius: 4,
      tooltipY: 0,
      fill: am5.color(0xff8c00),
      fillOpacity: 0.4, // Further reduced from 0.6 to 0.4
      tooltipText: "{title}"
    });

    return am5.Bullet.new(root as am5.Root, {
      sprite: circle
    });
  });

  // Set data - Iranian cities and regions (reduced set)
  const iranianCities = [
    { title: "تهران", latitude: 35.6892, longitude: 51.3890 },
    { title: "مشهد", latitude: 36.2605, longitude: 59.6168 },
    { title: "اصفهان", latitude: 32.6546, longitude: 51.6680 },
    { title: "شیراز", latitude: 29.5918, longitude: 52.5837 },
    { title: "تبریز", latitude: 38.0962, longitude: 46.2738 }
  ];

  // Set data - Major world cities from different continents (reduced set)
  const worldCities = [
    // Europe (adding more cities to create clusters)
    { title: "London", latitude: 51.5074, longitude: -0.1278 },
    { title: "Paris", latitude: 48.8566, longitude: 2.3522 },
    { title: "Moscow", latitude: 55.7558, longitude: 37.6176 },
    { title: "Berlin", latitude: 52.5200, longitude: 13.4050 },
    { title: "Rome", latitude: 41.9028, longitude: 12.4964 },
    
    // North America (adding more cities to create clusters)
    { title: "New York", latitude: 40.7128, longitude: -74.0060 },
    { title: "Los Angeles", latitude: 34.0522, longitude: -118.2437 },
    { title: "Chicago", latitude: 41.8781, longitude: -87.6298 },
    { title: "Toronto", latitude: 43.6532, longitude: -79.3832 },
    
    // South America
    { title: "São Paulo", latitude: -23.5505, longitude: -46.6333 },
    { title: "Buenos Aires", latitude: -34.6037, longitude: -58.3816 },
    
    // Africa (adding more cities to create clusters)
    { title: "Cairo", latitude: 30.0444, longitude: 31.2357 },
    { title: "Johannesburg", latitude: -26.2041, longitude: 28.0473 },
    { title: "Lagos", latitude: 6.5244, longitude: 3.3792 },
    
    // Asia (outside Iran) (adding more cities to create clusters)
    { title: "Beijing", latitude: 39.9042, longitude: 116.4074 },
    { title: "Tokyo", latitude: 35.6895, longitude: 139.6917 },
    { title: "Delhi", latitude: 28.6139, longitude: 77.2090 },
    { title: "Mumbai", latitude: 19.0760, longitude: 72.8777 },
    { title: "Seoul", latitude: 37.5665, longitude: 126.9780 },
    { title: "Singapore", latitude: 1.3521, longitude: 103.8198 },
    
    // Australia/Oceania
    { title: "Sydney", latitude: -33.8688, longitude: 151.2093 },
    { title: "Melbourne", latitude: -37.8136, longitude: 144.9631 }
  ];

  // Remove the additional cities array and its loop
  // Add Iranian cities
  for (let i = 0; i < iranianCities.length; i++) {
    const city = iranianCities[i];
    addCity(city.longitude, city.latitude, city.title);
  }

  // Add world cities
  for (let i = 0; i < worldCities.length; i++) {
    const city = worldCities[i];
    addCity(city.longitude, city.latitude, city.title);
  }

  // Remove the additional cities loop
  // for (let i = 0; i < additionalCities.length; i++) {
  //   const city = additionalCities[i];
  //   addCity(city.longitude, city.latitude, city.title);
  // }

  function addCity(longitude: number, latitude: number, title: string) {
    pointSeries.data.push({
      geometry: { type: "Point", coordinates: [longitude, latitude] },
      title: title
    });
  }

  // Make stuff animate on load
  chart.appear(1000, 100);

  // Add label at bottom right with teal color and reduced opacity
  const label = am5.Label.new(root, {
    text: "نقشه پراکندگی سناریو ها (درحال توسعه)",
    fontSize: 10,
    fill: am5.color(0x008080),
    fillOpacity: 0.7, // Reduced opacity
    x: am5.p100,
    y: am5.p100,
    centerX: am5.p100,
    centerY: am5.p100,
    dx: -10,
    dy: -10,
    textAlign: "right"
  });
  
  root.container.children.push(label);

  // Set initial view to show the full map without zooming in
  // Removing the specific zoom to show the full world map by default
  // chart.zoomToGeoPoint({ latitude: 32.4279, longitude: 53.6880 }, 5);
  
  // Alternative: Set zoom level to 1 for maximum zoom out
  // chart.zoomToGeoPoint({ latitude: 32.4279, longitude: 53.6880 }, 1);
}
</script>