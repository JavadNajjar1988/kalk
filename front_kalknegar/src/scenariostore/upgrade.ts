import type { Scenario, Unit, Media, Side } from "@/types/scenarioModels";
import { compare as compareVersions } from "compare-versions";
import type { ScenarioFeatureMeta } from "@/types/scenarioGeoModels";
import { type SimpleStyleSpec } from "@/geo/simplestyle";
import { SCENARIO_FILE_VERSION } from "@/config/constants";

export function upgradeScenarioIfNecessary(scenario: Scenario): Scenario {
  let upgraded: Scenario = scenario;

  if (compareVersions(upgraded.version, "0.30.0", "<")) {
    console.log("Found outdated scenario version, upgrading from", upgraded.version);
    upgraded = { ...upgraded };
    upgraded.layers = upgraded.layers.map((layer) => {
      const upgradedLayer = { ...layer };
      upgradedLayer.features = upgradedLayer.features.map((feature) => {
        const upgradedFeature = { ...feature };
        const {
          visibleFromT,
          visibleUntilT,
          type,
          name,
          description,
          externalUrl,
          radius,
          _zIndex,
          "fill-opacity": fillOpacity,
          fill,
          showLabel,
          "stroke-opacity": strokeOpacity,
          stroke,
          "marker-color": markerColor,
          "marker-size": markerSize,
          "marker-symbol": markerSymbol,
          "stroke-width": strokeWidth,
          title,
          "text-placement": textPlacement,
          "text-align": textAlign,
          "text-offset-x": textOffsetX,
          "text-offset-y": textOffsetY,
          limitVisibility,
          minZoom,
          maxZoom,
          textMinZoom,
          textMaxZoom,
          ...rest
        } = upgradedFeature.properties ?? {};

        const meta: Required<Omit<ScenarioFeatureMeta, "locked">> = {
          type,
          visibleFromT,
          visibleUntilT,
          name,
          description,
          externalUrl,
          radius,
          _zIndex,
        };

        const style: Omit<Required<SimpleStyleSpec>, "_fill" | "_stroke"> = {
          fill,
          "fill-opacity": fillOpacity,
          "stroke-opacity": strokeOpacity,
          "stroke-style": "solid",
          showLabel,
          stroke,
          "marker-color": markerColor,
          "marker-size": markerSize,
          "marker-symbol": markerSymbol,
          "stroke-width": strokeWidth,
          "text-placement": textPlacement,
          "text-align": textAlign,
          "text-offset-x": textOffsetX,
          "text-offset-y": textOffsetY,
          title,
          limitVisibility,
          minZoom,
          maxZoom,
          textMinZoom,
          textMaxZoom,
        };
        upgradedFeature.meta = meta;
        upgradedFeature.style = style;
        upgradedFeature.properties = rest;
        return upgradedFeature;
      });
      return upgradedLayer;
    });
  }

  // ---- 0.41.0: نرمال‌سازی Media برای اتصال به مدیریت منابع ------------------
  // پیش از این: media.url یک رشتهٔ خام بود.
  // اکنون: media.mediaId اولویت دارد و url به‌عنوان fallback می‌ماند تا
  // ItemMedia/EditMediaForm آن را به‌عنوان «سناریوی قدیمی» نمایش دهند.
  if (compareVersions(upgraded.version, "0.41.0", "<")) {
    console.log("Upgrading scenario to 0.41.0 (media → resource references)");
    upgraded = { ...upgraded };
    upgraded.sides = (upgraded.sides ?? []).map((side: Side) => ({
      ...side,
      groups: (side.groups ?? []).map((group) => ({
        ...group,
        subUnits: (group.subUnits ?? []).map((u) => upgradeUnitMedia(u)),
      })),
    }));
    upgraded.unitTemplates = (upgraded.unitTemplates ?? []).map((u) =>
      upgradeUnitMedia(u),
    );
    upgraded.version = SCENARIO_FILE_VERSION;
  }

  return upgraded;
}

function upgradeUnitMedia(unit: Unit): Unit {
  const next: Unit = { ...unit };
  if (Array.isArray(next.media)) {
    next.media = next.media.map((m) => normalizeMedia(m));
  }
  if (Array.isArray(next.subUnits)) {
    next.subUnits = next.subUnits.map((u) => upgradeUnitMedia(u));
  }
  return next;
}

function normalizeMedia(m: Media): Media {
  // اگر mediaId از قبل ست شده، دست نمی‌زنیم.
  if (m && m.mediaId) return m;
  // در غیر این صورت url خام را به‌عنوان fallback نگه می‌داریم.
  return {
    mediaId: undefined,
    resourceId: m?.resourceId,
    url: m?.url ?? "",
    caption: m?.caption,
    credits: m?.credits,
    creditsUrl: m?.creditsUrl,
  };
}
