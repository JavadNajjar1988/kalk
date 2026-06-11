export interface TacticalFeatureLayerItem {
  id: string;
  name: string;
  isHidden: boolean;
  order: number;
  features: TacticalFeatureItem[];
}

export interface TacticalFeatureItem {
  id: string;
  layerId: string;
  name: string;
  sidc?: string;
  isHidden: boolean;
  order: number;
}

type TacticalTuple = [string, any];
type DropEdge = "top" | "bottom";
const tacticalFeatureDragKey = Symbol("tacticalFeature");

export type TacticalFeatureDragItem = {
  [tacticalFeatureDragKey]: boolean;
  feature: TacticalFeatureItem;
};

export function getTacticalFeatureDragItem(feature: TacticalFeatureItem): TacticalFeatureDragItem {
  return {
    [tacticalFeatureDragKey]: true,
    feature,
  };
}

export function isTacticalFeatureDragItem(
  data: Record<string | symbol, unknown>,
): data is TacticalFeatureDragItem {
  return Boolean(data[tacticalFeatureDragKey]);
}

const FEATURE_SCOPE = "feature:";
const LAYER_SCOPE = "layer:";
const HIDDEN_SCOPE = "hidden+";
const TACTICAL_LAYER_TUPLE_SCOPES = [
  LAYER_SCOPE,
  FEATURE_SCOPE,
  `${HIDDEN_SCOPE}${LAYER_SCOPE}`,
  `${HIDDEN_SCOPE}${FEATURE_SCOPE}`,
];

function toPersianNumber(value: number) {
  return value.toLocaleString("fa-IR");
}

function isObject(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null;
}

function isFeatureId(id: string) {
  return id.startsWith(FEATURE_SCOPE) && id.includes("/");
}

function isLayerId(id: string) {
  return id.startsWith(LAYER_SCOPE) && !id.includes("/");
}

function layerIdForFeature(featureId: string) {
  const [layerUuid] = featureId.slice(FEATURE_SCOPE.length).split("/");
  return `${LAYER_SCOPE}${layerUuid}`;
}

function getHiddenTargetId(id: string) {
  return id.startsWith(HIDDEN_SCOPE) ? id.slice(HIDDEN_SCOPE.length) : null;
}

function getLayerName(value: unknown, index: number) {
  if (isObject(value) && typeof value.name === "string" && value.name.trim()) {
    return value.name.trim();
  }
  return `لایه تاکتیکال ${toPersianNumber(index)}`;
}

function getFeatureName(value: Record<string, any>, index: number) {
  const candidates = [
    value.name,
    value.properties?.t,
    value.properties?.t1,
    value.properties?.uniqueDesignation,
  ];
  const name = candidates.find((candidate) => {
    return typeof candidate === "string" && candidate.trim();
  });
  return name?.trim() ?? `نماد تاکتیکال ${toPersianNumber(index)}`;
}

function getPanelOrder(value: unknown, fallback: number) {
  if (isObject(value) && typeof value.layerPanelOrder === "number") {
    return value.layerPanelOrder;
  }
  if (isObject(value) && typeof value.properties?.layerPanelOrder === "number") {
    return value.properties.layerPanelOrder;
  }
  return fallback;
}

export async function readTacticalLayerTuples(store: any): Promise<TacticalTuple[]> {
  if (!store) return [];
  const read =
    typeof store.tuplesJSON === "function"
      ? store.tuplesJSON.bind(store)
      : typeof store.tuples === "function"
        ? store.tuples.bind(store)
        : null;
  if (!read) return [];

  const tupleGroups = await Promise.all(
    TACTICAL_LAYER_TUPLE_SCOPES.map((scope) => read(scope)),
  );
  return tupleGroups.flat();
}

export function reorderTacticalPanelItems<T extends { id: string }>(
  items: T[],
  sourceId: string,
  destinationId: string,
  edge: DropEdge,
): T[] {
  if (sourceId === destinationId) return items;
  const sourceIndex = items.findIndex((item) => item.id === sourceId);
  const destinationIndex = items.findIndex((item) => item.id === destinationId);
  if (sourceIndex === -1 || destinationIndex === -1) return items;

  const next = [...items];
  const [sourceItem] = next.splice(sourceIndex, 1);
  let targetIndex = next.findIndex((item) => item.id === destinationId);
  if (edge === "bottom") targetIndex += 1;
  next.splice(targetIndex, 0, sourceItem);
  return next;
}

export async function writeTacticalPanelOrder(
  store: any,
  orderedIds: string[],
): Promise<void> {
  if (!store || orderedIds.length === 0) return;
  const read =
    typeof store.tuplesJSON === "function"
      ? store.tuplesJSON.bind(store)
      : typeof store.tuples === "function"
        ? store.tuples.bind(store)
        : null;
  if (!read || typeof store.update !== "function") return;

  const currentValues = new Map<string, any>(await read(orderedIds));
  const keys: string[] = [];
  const oldValues: any[] = [];
  const newValues: any[] = [];

  orderedIds.forEach((id, index) => {
    const oldValue = currentValues.get(id);
    if (!isObject(oldValue)) return;
    keys.push(id);
    oldValues.push(oldValue);
    newValues.push({ ...oldValue, layerPanelOrder: index + 1 });
  });

  if (keys.length === 0) return;
  await store.update(keys, newValues, oldValues);
}

export function buildTacticalLayerItems(tuples: TacticalTuple[]): TacticalFeatureLayerItem[] {
  const hiddenIds = new Set(
    tuples
      .map(([id]) => getHiddenTargetId(id))
      .filter((id): id is string => typeof id === "string" && id.length > 0),
  );
  const layerValues = new Map<string, any>();
  const featureValues = new Map<string, Record<string, any>>();

  for (const [id, value] of tuples) {
    if (isLayerId(id)) {
      layerValues.set(id, value);
      continue;
    }
    if (isFeatureId(id) && isObject(value)) {
      featureValues.set(id, value);
    }
  }

  let layerFallbackIndex = 0;
  let featureFallbackIndex = 0;
  const layers = new Map<string, TacticalFeatureLayerItem>();

  function ensureLayer(layerId: string) {
    const existingLayer = layers.get(layerId);
    if (existingLayer) return existingLayer;

    layerFallbackIndex += 1;
    const layer: TacticalFeatureLayerItem = {
      id: layerId,
      name: getLayerName(layerValues.get(layerId), layerFallbackIndex),
      isHidden: hiddenIds.has(layerId),
      order: getPanelOrder(layerValues.get(layerId), layerFallbackIndex),
      features: [],
    };
    layers.set(layerId, layer);
    return layer;
  }

  for (const [featureId, value] of featureValues) {
    const layerId = layerIdForFeature(featureId);
    const layer = ensureLayer(layerId);
    featureFallbackIndex += 1;
    layer.features.push({
      id: featureId,
      layerId,
      name: getFeatureName(value, featureFallbackIndex),
      sidc:
        typeof value.properties?.sidc === "string" ? value.properties.sidc : undefined,
      isHidden: hiddenIds.has(featureId),
      order: getPanelOrder(value, featureFallbackIndex),
    });
  }

  return [...layers.values()]
    .map((layer) => ({
      ...layer,
      features: [...layer.features].sort((a, b) => a.order - b.order),
    }))
    .filter((layer) => layer.features.length > 0)
    .sort((a, b) => a.order - b.order);
}
