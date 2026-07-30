import rendererUrl from "@io.github.missioncommand/mil-sym-js/dist/sm-bc.min.js?url";
import singlePointFontUrl from "@io.github.missioncommand/mil-sym-js/dist/fonts/SinglePoint.woff2?url";
import tacticalGraphicsFontUrl from "@io.github.missioncommand/mil-sym-js/dist/fonts/TacticalGraphics.woff2?url";
import unitFontUrl from "@io.github.missioncommand/mil-sym-js/dist/fonts/UnitFont.woff2?url";
import type { MetocGeometry } from "./metocCatalog";

interface MissionImageInfo {
  toDataUrl(): string;
  toSVG(): string;
}

interface MissionRendererWindow extends Window {
  armyc2?: {
    c2sd: {
      renderer: {
        MilStdIconRenderer: {
          Render(
            sidc: string,
            modifiers: Record<string, string | number>,
          ): MissionImageInfo | null;
        };
      };
    };
  };
  sec?: {
    web: {
      renderer: {
        SECWebRenderer: {
          RenderSymbol(
            id: string,
            name: string,
            description: string,
            sidc: string,
            controlPoints: string,
            altitudeMode: string,
            scale: number,
            bbox: string,
            modifiers: string,
            format: number,
            symStd: number,
          ): string;
        };
      };
    };
  };
}

let rendererPromise: Promise<MissionRendererWindow> | undefined;
let fontsPromise: Promise<void> | undefined;
const iconCache = new Map<string, Promise<string>>();

function rendererWindow() {
  return window as MissionRendererWindow;
}

function ensureMetocFonts() {
  if (!fontsPromise) {
    const style = document.createElement("style");
    style.dataset.metocFonts = "mission-command";
    style.textContent = `
      @font-face { font-family: "SinglePoint"; src: url("${singlePointFontUrl}") format("woff2"); font-display: block; }
      @font-face { font-family: "TacticalGraphics"; src: url("${tacticalGraphicsFontUrl}") format("woff2"); font-display: block; }
      @font-face { font-family: "UnitFont"; src: url("${unitFontUrl}") format("woff2"); font-display: block; }
    `;
    document.head.appendChild(style);
    fontsPromise = Promise.all([
      document.fonts.load("16px SinglePoint"),
      document.fonts.load("16px TacticalGraphics"),
      document.fonts.load("16px UnitFont"),
    ]).then(() => undefined);
  }
  return fontsPromise;
}

export function ensureMetocRenderer() {
  if (rendererWindow().armyc2 && rendererWindow().sec) {
    return ensureMetocFonts().then(() => rendererWindow());
  }
  if (!rendererPromise) {
    rendererPromise = Promise.all([
      ensureMetocFonts(),
      new Promise<MissionRendererWindow>((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>(
          'script[data-metoc-renderer="mission-command"]',
        );
        const script = existing ?? document.createElement("script");
        const handleLoad = () => {
          const target = rendererWindow();
          if (target.armyc2 && target.sec) resolve(target);
          else reject(new Error("METOC renderer did not expose its public API"));
        };
        script.addEventListener("load", handleLoad, { once: true });
        script.addEventListener(
          "error",
          () => reject(new Error("METOC renderer could not be loaded")),
          { once: true },
        );
        if (!existing) {
          script.src = rendererUrl;
          script.async = true;
          script.dataset.metocRenderer = "mission-command";
          document.head.appendChild(script);
        }
      }),
    ]).then(([, target]) => target);
  }
  return rendererPromise;
}

export function renderMetocIcon(sidc: string, size = 32) {
  const cacheKey = `${sidc}:${size}`;
  let pending = iconCache.get(cacheKey);
  if (!pending) {
    pending = ensureMetocRenderer().then((target) => {
      const image = target.armyc2?.c2sd.renderer.MilStdIconRenderer.Render(sidc, {
        SIZE: size,
        SYMSTD: 1,
      });
      if (!image) throw new Error(`METOC icon is not renderable: ${sidc}`);
      return image.toDataUrl();
    });
    iconCache.set(cacheKey, pending);
  }
  return pending;
}

function flattenCoordinates(geometry: GeoJSON.Geometry): [number, number][] | undefined {
  if (geometry.type === "LineString") {
    return geometry.coordinates as [number, number][];
  }
  if (geometry.type === "Polygon") {
    const ring = geometry.coordinates[0] as [number, number][];
    const last = ring[ring.length - 1];
    if (ring.length > 1 && ring[0][0] === last?.[0] && ring[0][1] === last?.[1]) {
      return ring.slice(0, -1);
    }
    return ring;
  }
  return undefined;
}

function boundsFor(coordinates: [number, number][]) {
  const xs = coordinates.map(([x]) => x);
  const ys = coordinates.map(([, y]) => y);
  const west = Math.min(...xs);
  const east = Math.max(...xs);
  const south = Math.min(...ys);
  const north = Math.max(...ys);
  const padX = Math.max((east - west) * 0.15, 0.01);
  const padY = Math.max((north - south) * 0.15, 0.01);
  return `${west - padX},${south - padY},${east + padX},${north + padY}`;
}

export async function renderMetocGeometry(
  sidc: string,
  geometry: GeoJSON.Geometry,
  expectedGeometry: MetocGeometry,
  scale: number,
) {
  if (expectedGeometry === "Point") return undefined;
  const coordinates = flattenCoordinates(geometry);
  if (!coordinates?.length) return undefined;

  const target = await ensureMetocRenderer();
  const output = target.sec?.web.renderer.SECWebRenderer.RenderSymbol(
    sidc,
    "",
    "",
    sidc,
    coordinates.map(([longitude, latitude]) => `${longitude},${latitude}`).join(" "),
    "clampToGround",
    Math.min(Math.max(scale, 1_000), 20_000_000),
    boundsFor(coordinates),
    "{}",
    2,
    1,
  );
  if (!output) return undefined;
  const parsed = JSON.parse(output) as GeoJSON.FeatureCollection;
  return parsed.type === "FeatureCollection" ? parsed : undefined;
}
