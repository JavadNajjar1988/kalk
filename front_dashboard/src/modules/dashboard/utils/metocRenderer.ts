import rendererUrl from '@io.github.missioncommand/mil-sym-js/dist/sm-bc.min.js?url';
import singlePointFontUrl from '@io.github.missioncommand/mil-sym-js/dist/fonts/SinglePoint.woff2?url';
import tacticalGraphicsFontUrl from '@io.github.missioncommand/mil-sym-js/dist/fonts/TacticalGraphics.woff2?url';
import unitFontUrl from '@io.github.missioncommand/mil-sym-js/dist/fonts/UnitFont.woff2?url';

interface MissionImageInfo {
  toDataUrl(): string;
}

interface MissionRendererWindow extends Window {
  armyc2?: {
    c2sd: {
      renderer: {
        MilStdIconRenderer: {
          Render(
            sidc: string,
            modifiers: Record<string, string | number>
          ): MissionImageInfo | null;
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
    const existing = document.querySelector<HTMLStyleElement>(
      'style[data-metoc-fonts="mission-command"]'
    );
    if (!existing) {
      const style = document.createElement('style');
      style.dataset.metocFonts = 'mission-command';
      style.textContent = `
        @font-face { font-family: "SinglePoint"; src: url("${singlePointFontUrl}") format("woff2"); font-display: block; }
        @font-face { font-family: "TacticalGraphics"; src: url("${tacticalGraphicsFontUrl}") format("woff2"); font-display: block; }
        @font-face { font-family: "UnitFont"; src: url("${unitFontUrl}") format("woff2"); font-display: block; }
      `;
      document.head.appendChild(style);
    }

    const fontSet = document.fonts;
    fontsPromise = fontSet
      ? Promise.all([
          fontSet.load('16px SinglePoint'),
          fontSet.load('16px TacticalGraphics'),
          fontSet.load('16px UnitFont'),
        ]).then(() => undefined)
      : Promise.resolve();
  }
  return fontsPromise;
}

export function ensureMetocRenderer() {
  const currentWindow = rendererWindow();
  if (currentWindow.armyc2) {
    return ensureMetocFonts().then(() => currentWindow);
  }

  if (!rendererPromise) {
    rendererPromise = Promise.all([
      ensureMetocFonts(),
      new Promise<MissionRendererWindow>((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>(
          'script[data-metoc-renderer="mission-command"]'
        );
        const script = existing ?? document.createElement('script');
        const handleLoad = () => {
          const target = rendererWindow();
          if (target.armyc2) {
            resolve(target);
          } else {
            reject(new Error('METOC renderer did not expose its public API'));
          }
        };

        script.addEventListener('load', handleLoad, { once: true });
        script.addEventListener(
          'error',
          () => reject(new Error('METOC renderer could not be loaded')),
          { once: true }
        );

        if (!existing) {
          script.src = rendererUrl;
          script.async = true;
          script.dataset.metocRenderer = 'mission-command';
          document.head.appendChild(script);
        }
      }),
    ]).then(([, target]) => target);
  }

  return rendererPromise;
}

export function renderMetocIcon(sidc: string, size = 48) {
  const cacheKey = `${sidc}:${size}`;
  let pending = iconCache.get(cacheKey);
  if (!pending) {
    pending = ensureMetocRenderer().then(target => {
      const image =
        target.armyc2?.c2sd.renderer.MilStdIconRenderer.Render(sidc, {
          SIZE: size,
          SYMSTD: 1,
        }) ?? null;
      if (!image) {
        throw new Error(`METOC icon is not renderable: ${sidc}`);
      }
      return image.toDataUrl();
    });
    iconCache.set(cacheKey, pending);
  }
  return pending;
}
