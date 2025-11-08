import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import XYZ from "ol/source/XYZ";
import { transformExtent } from "ol/proj";
import { klona } from "klona";
import type { LayerConfigFile } from "@/geo/layerConfigTypes";

function createFallbackLayers() {
  return [
    new TileLayer({
      source: new OSM({ crossOrigin: "anonymous" }),
      visible: true,
      preload: Infinity,
      properties: {
        title: "OSM",
        name: "osm",
        layerType: "baselayer",
      },
    }),
  ];
}

export async function createBaseLayers(view: View, currentBaseLayerName = "osm") {
  let layers;
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}config/mapConfig.json`);
    layers = (await res.json()) as LayerConfigFile;
  } catch (e) {
    console.error("Failed to fetch mapConfig.json", e);
    return createFallbackLayers();
  }

  if (!layers || !layers.length) {
    console.warn("No layers found in mapConfig.json");
    return createFallbackLayers();
  }

  const baseLayers = layers.map((layerConfig) => {
    const {
      layerSourceType,
      layerType = "baselayer",
      title,
      name,
      tileLayerOptions,
    } = klona(layerConfig);

    if (tileLayerOptions?.extent) {
      tileLayerOptions.extent = transformExtent(
        tileLayerOptions.extent,
        "EPSG:4326",
        view.getProjection(),
      );
    }

    const properties = { title, name, layerType };

    let source;
    if (layerSourceType === "osm") {
      source = new OSM(layerConfig.sourceOptions);
    } else if (layerSourceType === "xyz") {
      source = new XYZ(layerConfig.sourceOptions);
    }

    return new TileLayer({
      source,
      properties,
      visible: currentBaseLayerName === layerConfig.name,
      preload: Infinity,
      ...tileLayerOptions,
    });
  });

  try {
    const activeRes = await fetch("/api/maps/active");
    if (activeRes.ok) {
      const payload = await activeRes.json();
      const rawList = Array.isArray(payload?.maps) ? payload.maps : payload ? [payload] : [];
      const activeMaps = rawList.filter(
        (item: any) => item && typeof item.url_template === "string" && item.url_template.length > 0,
      );
      if (activeMaps.length) {
        const preferredLayerName =
          currentBaseLayerName === "osm" ? `offline-${activeMaps[0].id}` : currentBaseLayerName;
        for (let i = activeMaps.length - 1; i >= 0; i -= 1) {
          const activeMap = activeMaps[i];
          const offlineLayerName = `offline-${activeMap.id}`;
          const offlineLayer = new TileLayer({
            source: new XYZ({
              url: activeMap.url_template,
              crossOrigin: "anonymous",
            }),
            properties: {
              title: activeMap.name ?? "Offline Map",
              name: offlineLayerName,
              layerType: "baselayer",
            },
            visible: preferredLayerName === offlineLayerName,
            preload: Infinity,
          });
          baseLayers.unshift(offlineLayer);
        }

        baseLayers.forEach((layer) => {
          const name = layer.get("name");
          layer.setVisible(name === preferredLayerName);
        });
      }
    }
  } catch (error) {
    console.warn("Failed to load active offline map", error);
  }

  // ensure that at least one is visible
  if (!baseLayers.some((l) => l.getVisible())) {
    baseLayers[0]?.setVisible(true);
  }
  return baseLayers;
}
