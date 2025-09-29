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
    })
  );

  const zoomControl = chart.set("zoomControl", am5map.ZoomControl.new(root, {}));
  zoomControl.homeButton.set("visible", true);

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
  const pointSeries = chart.series.push(am5map.ClusteredPointSeries.new(root, {}));

  // Set clustered bullet
  pointSeries.set("clusteredBullet", function(rootLocal: am5.Root) {
    const container = am5.Container.new(rootLocal, {
      cursorOverStyle: "pointer"
    });

    container.children.push(am5.Circle.new(rootLocal, {
      radius: 8,
      tooltipY: 0,
      fill: am5.color(0xff8c00)
    }));

    container.children.push(am5.Circle.new(rootLocal, {
      radius: 12,
      fillOpacity: 0.3,
      tooltipY: 0,
      fill: am5.color(0xff8c00)
    }));

    container.children.push(am5.Circle.new(rootLocal, {
      radius: 16,
      fillOpacity: 0.3,
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

  // Create regular bullets
  pointSeries.bullets.push(function() {
    const circle = am5.Circle.new(root as am5.Root, {
      radius: 6,
      tooltipY: 0,
      fill: am5.color(0xff8c00),
      tooltipText: "{title}"
    });

    return am5.Bullet.new(root as am5.Root, {
      sprite: circle
    });
  });

  // Set data - Iranian cities and regions
  const iranianCities = [
    { title: "تهران", latitude: 35.6892, longitude: 51.3890 },
    { title: "مشهد", latitude: 36.2605, longitude: 59.6168 },
    { title: "اصفهان", latitude: 32.6546, longitude: 51.6680 },
    { title: "شیراز", latitude: 29.5918, longitude: 52.5837 },
    { title: "تبریز", latitude: 38.0962, longitude: 46.2738 },
    { title: "کرج", latitude: 35.6961, longitude: 50.9963 },
    { title: "اهواز", latitude: 31.3183, longitude: 48.6706 },
    { title: "قم", latitude: 34.6401, longitude: 50.8764 },
    { title: "کرمانشاه", latitude: 34.3142, longitude: 47.0659 },
    { title: "ارومیه", latitude: 37.5527, longitude: 45.0761 },
    { title: "رشت", latitude: 37.2808, longitude: 49.5832 },
    { title: "زاهدان", latitude: 29.4963, longitude: 60.8629 },
    { title: "همدان", latitude: 34.7992, longitude: 48.5146 },
    { title: "یزد", latitude: 31.8974, longitude: 54.3569 },
    { title: "اردبیل", latitude: 38.2498, longitude: 48.2933 },
    { title: "بندرعباس", latitude: 27.1865, longitude: 56.2808 },
    { title: "آبادان", latitude: 30.3392, longitude: 48.3043 },
    { title: "خرمشهر", latitude: 30.4414, longitude: 48.1728 },
    { title: "قصرشیرین", latitude: 34.5142, longitude: 45.5797 },
    { title: "کرند غرب", latitude: 34.2733, longitude: 45.8967 }
  ];

  for (let i = 0; i < iranianCities.length; i++) {
    const city = iranianCities[i];
    addCity(city.longitude, city.latitude, city.title);
  }

  function addCity(longitude: number, latitude: number, title: string) {
    pointSeries.data.push({
      geometry: { type: "Point", coordinates: [longitude, latitude] },
      title: title
    });
  }

  // Make stuff animate on load
  chart.appear(1000, 100);

  // Set initial view to Iran
  chart.zoomToGeoPoint({ latitude: 32.4279, longitude: 53.6880 }, 5);
}
</script>