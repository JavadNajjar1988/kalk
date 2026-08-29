/**
 * Adds published entries from backend /catalog/layers.json into the scenario mapLayers list
 * (same panel as XYZ/mbtiles-backed tiles), deduped by stable ids.
 */
import { transformExtent } from "ol/proj";
import type { TGeo } from "@/scenariostore";
import type { ScenarioMapLayer } from "@/types/scenarioGeoModels";
import { scenarioApiService } from "@/services/api/scenarioApiService";

type CatalogLayerJson = {
  id?: string;
  title?: string;
  type?: string;
  source?: string;
  path?: string;
  layer_name?: string;
  format?: string;
  bbox?: number[];
  ui?: { defaultOpacity?: number; visibleByDefault?: boolean };
  admin?: { map_id?: number };
  status?: string;
};

function catalogLayerId(raw: CatalogLayerJson): string {
  const mid = raw.admin?.map_id;
  if (typeof mid === "number" && Number.isFinite(mid)) {
    return `sdi-cat-${mid}`;
  }
  const slug = String(raw.id ?? raw.title ?? "layer").replace(/[^a-zA-Z0-9_-]+/g, "-");
  return `sdi-cat-${slug}`;
}

function resolveCatalogUrl(base: string, scenarioId: string): string {
  const b = String(base ?? "/api").replace(/\/+$/, "");
  const query = `?scenario_id=${encodeURIComponent(scenarioId)}`;
  if (b.startsWith("http://") || b.startsWith("https://")) {
    return `${b}/catalog/layers.json${query}`;
  }
  const path = b.startsWith("/") ? b : `/${b}`;
  return `${path}/catalog/layers.json${query}`;
}

export async function mergePublishedCatalogMapLayers(
  geo: TGeo,
  scenarioId: string,
): Promise<void> {
  const rawBase = (scenarioApiService as any)?.baseUrl ?? "/api";
  const url = resolveCatalogUrl(rawBase, scenarioId);
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    console.warn("[catalogMapLayersSync] fetch failed:", url);
    return;
  }
  if (!res.ok) {
    console.warn("[catalogMapLayersSync] HTTP", res.status, url);
    return;
  }
  let data: { layers?: CatalogLayerJson[] };
  try {
    data = await res.json();
  } catch {
    return;
  }
  const layers = Array.isArray(data.layers) ? data.layers : [];
  const allowedIds = new Set(layers.map(catalogLayerId));

  for (const existingLayer of [...geo.mapLayers.value]) {
    const existingId = String(existingLayer.id);
    if (existingId.startsWith("sdi-cat-") && !allowedIds.has(existingId)) {
      geo.deleteMapLayer(existingLayer.id);
    }
  }

  for (const raw of layers) {
    if (!raw || raw.status !== "published") continue;
    const id = catalogLayerId(raw);
    if (geo.getMapLayerById(id)) continue;

    const opacity =
      typeof raw.ui?.defaultOpacity === "number" ? raw.ui.defaultOpacity : 0.85;
    const isHidden = !(raw.ui?.visibleByDefault === true);
    const title = (raw.title || raw.id || id).trim();

    const isRasterXyz =
      raw.type === "raster-xyz" ||
      (typeof raw.source === "string" && raw.source.toLowerCase().startsWith("xyz"));

    if (isRasterXyz && typeof raw.path === "string" && raw.path.length > 0) {
      const layer: ScenarioMapLayer = {
        id,
        type: "XYZLayer",
        name: title,
        url: raw.path,
        opacity,
        isHidden,
        _status: "initialized",
        _isNew: false,
      };
      geo.addMapLayer(layer);
      continue;
    }

    if (
      (raw.type === "geojson" || raw.source === "geojson") &&
      typeof raw.path === "string" &&
      raw.path.length > 0
    ) {
      const layer: ScenarioMapLayer = {
        id,
        type: "GeoJSONLayer",
        name: title,
        url: raw.path.trim(),
        opacity,
        isHidden,
        _status: "initialized",
        _isNew: false,
      };
      geo.addMapLayer(layer);
      continue;
    }

    if (
      (raw.type === "kml" || raw.source === "kml") &&
      typeof raw.path === "string" &&
      raw.path.length > 0
    ) {
      const layer: ScenarioMapLayer = {
        id,
        type: "KMLLayer",
        name: title,
        url: raw.path.trim(),
        extractStyles: false,
        opacity,
        isHidden,
        _status: "initialized",
        _isNew: false,
      };
      geo.addMapLayer(layer);
      continue;
    }

    if (raw.type === "wms" && typeof raw.path === "string" && raw.path.length > 0) {
      const layerName = typeof raw.layer_name === "string" ? raw.layer_name.trim() : "";
      if (!layerName) {
        console.warn(
          "[catalogMapLayersSync] skip WMS without layer_name (republish after backend update):",
          title,
        );
        continue;
      }
      let extent: number[] | undefined;
      if (Array.isArray(raw.bbox) && raw.bbox.length === 4) {
        try {
          extent = transformExtent(
            raw.bbox as [number, number, number, number],
            "EPSG:4326",
            "EPSG:3857",
          );
        } catch {
          extent = undefined;
        }
      }
      const layer: ScenarioMapLayer = {
        id,
        type: "WMSLayer",
        name: title,
        url: raw.path.trim(),
        layers: layerName,
        imageFormat: typeof raw.format === "string" ? raw.format : "image/png",
        opacity,
        isHidden,
        extent,
        _status: "initialized",
        _isNew: false,
      };
      geo.addMapLayer(layer);
    }
  }
}
