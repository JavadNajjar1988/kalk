import { until, useFetch, useLocalStorage } from "@vueuse/core";
import type {
  EquipmentData,
  PersonnelData,
  Scenario,
  ScenarioEvent,
  ScenarioInfo,
  Side,
  SideGroup,
  State,
  SupplyCategory,
  SupplyClass,
  SymbologyStandard,
  Unit,
  UnitOfMeasure,
  UnitStatus,
} from "@/types/scenarioModels";
import {
  type NewScenarioStore,
  type ScenarioState,
  useNewScenarioStore,
} from "./newScenarioStore";
import { useSymbolSettingsStore } from "@/stores/settingsStore";
import type { ShallowRef } from "vue";
import { isLoading } from "@/scenariostore/index";
import { INTERNAL_NAMES, TIMESTAMP_NAMES } from "@/types/internalModels";
import dayjs from "dayjs";
import type {
  RangeRingGroup,
  ScenarioLayer,
  ScenarioMapLayer,
} from "@/types/scenarioGeoModels";
import { type EntityId } from "@/types/base";
import { nanoid } from "@/utils";
import {
  DEFAULT_BASEMAP_ID,
  LOCALSTORAGE_KEY,
  SCENARIO_FILE_VERSION,
} from "@/config/constants";
import { useIndexedDb } from "@/scenariostore/localdb";
import { scenarioApiService } from "@/services/api/scenarioApiService";
import { klona } from "klona";
import { saveBlobToLocalFile } from "@/utils/files";

export interface CreateEmptyScenarioOptions {
  id?: string;
  addGroups?: boolean;
  symbologyStandard?: SymbologyStandard;
}

export function createEmptyScenario(options: CreateEmptyScenarioOptions = {}): Scenario {
  const addGroups = options.addGroups ?? false;
  const symbolSettings = useSymbolSettingsStore();
  const symbologyStandard = options.symbologyStandard ?? symbolSettings.symbologyStandard;
  let timeZone;
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (e) {}
  const rangeRingGroups: RangeRingGroup[] = addGroups
    ? [{ name: "GR1" }, { name: "GR2" }]
    : [];

  return {
    id: options.id ?? nanoid(),
    type: "ORBAT-mapper",
    version: SCENARIO_FILE_VERSION,
    meta: {
      createdDate: new Date().toISOString(),
      lastModifiedDate: new Date().toISOString(),
    },
    name: "New scenario",
    description: "Empty scenario description",
    startTime: new Date().setHours(12, 0, 0, 0),
    timeZone,
    symbologyStandard,
    sides: [],
    events: [],
    layers: [{ id: nanoid(), name: "Features", features: [] }],
    mapLayers: [],
    settings: {
      rangeRingGroups,
      statuses: [],
      map: { baseMapId: DEFAULT_BASEMAP_ID },
      supplyClasses: [
        { name: "Class I" },
        { name: "Class II" },
        { name: "Class III" },
        { name: "Class IV" },
        { name: "Class V" },
      ],
      supplyUoMs: [
        { name: "Kilogram", code: "KG", type: "weight" },
        { name: "Liter", code: "LI", type: "volume" },
        { name: "Each", code: "EA", type: "quantity" },
        { name: "Meter", code: "MR", type: "distance" },
        { name: "Gallon", code: "GL", type: "volume" },
      ],
    },
    
    // فیلدهای جدید اضافه شده
    endTime: undefined,
    status: "draft",
    objectives: [],
    phases: [],
    terrainAnalysis: undefined,
    battleInformation: undefined,
    commandStructure: [],
    simulationSettings: undefined,
    currentTime: undefined,
    simulationSpeed: 1.0,
    executionStatus: "not_started",
    analysisResults: [],
    tags: [],
    metadata: {},
  };
}

function getScenarioInfo(state: ScenarioState): ScenarioInfo {
  return { ...state.info };
}

function getScenarioEvents(state: ScenarioState): ScenarioEvent[] {
  return state.events
    .filter((id) => state.eventMap[id]._type === "scenario")
    .map((id) => state.eventMap[id]);
}

function getSides(state: ScenarioState): Side[] {
  function getSideGroup(groupId: EntityId): SideGroup {
    const group = state.sideGroupMap[groupId];
    return {
      ...group,
      subUnits: group.subUnits.map((unitId) => serializeUnit(unitId, state)),
    };
  }

  return state.sides
    .map((sideId) => state.sideMap[sideId])
    .map((nSide) => ({
      ...nSide,
      groups: nSide.groups.map((groupId) => getSideGroup(groupId)),
    }));
}

export type SerializeUnitOptions = {
  newId?: boolean;
  includeSubUnits?: boolean;
};

export function serializeUnit(
  unitId: EntityId,
  scnState: ScenarioState,
  options: SerializeUnitOptions = {},
): Unit {
  const { newId = false, includeSubUnits = true } = options;
  const nUnit = scnState.unitMap[unitId];
  let equipment = nUnit.equipment?.map(({ id, count, onHand }) => {
    const { name } = scnState.equipmentMap[id];
    return { name, count, onHand };
  });
  if (equipment?.length === 0) equipment = undefined;
  let personnel = nUnit.personnel?.map(({ id, count, onHand }) => {
    const { name } = scnState.personnelMap[id];
    return { name, count, onHand };
  });
  if (personnel?.length === 0) personnel = undefined;

  let supplies = nUnit.supplies?.map(({ id, count, onHand }) => {
    const { name } = scnState.supplyCategoryMap[id];
    return { name, count, onHand };
  });
  if (supplies?.length === 0) supplies = undefined;

  let rangeRings = nUnit.rangeRings?.map(({ group, ...rest }) => {
    return group ? { group: scnState.rangeRingGroupMap[group].name, ...rest } : rest;
  });

  if (rangeRings?.length === 0) rangeRings = undefined;
  const { id, state, ...rest } = nUnit;

  return {
    id: newId ? nanoid() : id,
    ...rest,
    status: nUnit.status ? scnState.unitStatusMap[nUnit.status]?.name : undefined,
    subUnits: includeSubUnits
      ? nUnit.subUnits.map((subUnitId) => serializeUnit(subUnitId, scnState, options))
      : [],
    equipment,
    personnel,
    supplies,
    rangeRings,
    state: state
      ? state.map((s) => {
          let diffEquipment, diffPersonnel, diffSupplies;
          const c = klona(s) as State;

          if (s.diff) {
            if (s.diff.equipment) {
              diffEquipment = s.diff.equipment.map(({ id, count, onHand }) => {
                return { name: scnState.equipmentMap[id]?.name ?? id, count, onHand };
              });
            }

            if (s.diff?.personnel) {
              diffPersonnel = s.diff.personnel.map(({ id, count, onHand }) => {
                return { name: scnState.personnelMap[id]?.name ?? id, count, onHand };
              });
            }

            if (s.diff?.supplies) {
              diffSupplies = s.diff.supplies.map(({ id, count, onHand }) => {
                return {
                  name: scnState.supplyCategoryMap[id]?.name ?? id,
                  count,
                  onHand,
                };
              });
            }
            c.diff = {
              equipment: diffEquipment,
              personnel: diffPersonnel,
              supplies: diffSupplies,
            };
          }

          if (s.update) {
            let updateEquipment, updatePersonnel, updateSupplies;

            if (s.update.equipment) {
              updateEquipment = s.update.equipment.map(({ id, count, onHand }) => {
                return { name: scnState.equipmentMap[id]?.name ?? id, count, onHand };
              });
            }
            if (s.update.personnel) {
              updatePersonnel = s.update.personnel.map(({ id, count, onHand }) => {
                return { name: scnState.personnelMap[id]?.name ?? id, count, onHand };
              });
            }

            if (s.update.supplies) {
              updateSupplies = s.update.supplies.map(({ id, count, onHand }) => {
                return {
                  name: scnState.supplyCategoryMap[id]?.name ?? id,
                  count,
                  onHand,
                };
              });
            }
            c.update = {
              equipment: updateEquipment,
              personnel: updatePersonnel,
              supplies: updateSupplies,
            };
          }

          if (s.status) {
            c.status = scnState.unitStatusMap[s.status]?.name;
          }
          return c;
        })
      : undefined,
  };
}

function getLayers(state: ScenarioState): ScenarioLayer[] {
  return state.layers
    .map((id) => state.layerMap[id])
    .map((layer) => ({
      ...layer,
      features: layer.features.map((fId) => state.featureMap[fId]),
    }));
}

function getMapLayers(state: ScenarioState): ScenarioMapLayer[] {
  return state.mapLayers
    .map((id) => state.mapLayerMap[id])
    .filter((l) => !l._isTemporary);
}

function getEquipment(state: ScenarioState): EquipmentData[] {
  return Object.values(state.equipmentMap).map(({ name, description, sidc }) => ({
    name,
    description,
    sidc,
  }));
}

function getPersonnel(state: ScenarioState): PersonnelData[] {
  return Object.values(state.personnelMap).map(({ name, description }) => ({
    name,
    description,
  }));
}

function getSupplyCategories(state: ScenarioState): SupplyCategory[] {
  return Object.values(state.supplyCategoryMap).map(({ id, ...sup }) => {
    return {
      ...sup,
      supplyClass: sup.supplyClass
        ? (state.supplyClassMap[sup.supplyClass]?.name ?? sup.supplyClass)
        : undefined,
      uom: sup.uom ? (state.supplyUomMap[sup.uom]?.name ?? sup.uom) : undefined,
    };
  });
}

function getRangeRingGroups(state: ScenarioState): RangeRingGroup[] {
  return Object.values(state.rangeRingGroupMap).map(({ id, ...rest }) => rest);
}

function getUnitStatuses(state: ScenarioState): UnitStatus[] {
  return Object.values(state.unitStatusMap).map(({ id, ...rest }) => rest);
}

function getSupplyClasses(state: ScenarioState): SupplyClass[] {
  return Object.values(state.supplyClassMap).map(({ id, ...rest }) => rest);
}

function getSupplyUoMs(state: ScenarioState): UnitOfMeasure[] {
  return Object.values(state.supplyUomMap).map(({ id, ...rest }) => rest);
}

export function useScenarioIO(store: ShallowRef<NewScenarioStore>) {
  const settingsStore = useSymbolSettingsStore();

  function toObject(): Scenario {
    const { state } = store.value;
    return {
      id: state.id,
      type: "ORBAT-mapper",
      version: SCENARIO_FILE_VERSION,
      meta: {
        createdDate: state?.meta?.createdDate,
        lastModifiedDate: new Date().toISOString(),
      },
      ...getScenarioInfo(state),
      sides: getSides(state),
      layers: getLayers(state),
      events: getScenarioEvents(state),
      mapLayers: getMapLayers(state),
      equipment: getEquipment(state),
      personnel: getPersonnel(state),
      supplyCategories: getSupplyCategories(state),
      settings: {
        rangeRingGroups: getRangeRingGroups(state),
        statuses: getUnitStatuses(state),
        supplyClasses: getSupplyClasses(state),
        supplyUoMs: getSupplyUoMs(state),
        map: state.mapSettings,
      },
    };
  }

  function stringifyScenario() {
    return JSON.stringify(toObject(), stringifyReplacer, "  ");
  }

  function stringifyObject(obj: any) {
    return JSON.stringify(obj, stringifyReplacer, "  ");
  }

  function stringifyReplacer(name: string, val: any) {
    if (val === undefined) return undefined;
    if (INTERNAL_NAMES.includes(name)) return undefined;
    if (TIMESTAMP_NAMES.includes(name)) {
      return dayjs(val)
        .tz(store.value.state.info.timeZone || "UTC")
        .format();
    }
    return val;
  }

  function serializeToObject(): Scenario {
    return JSON.parse(stringifyScenario());
  }

  function saveToLocalStorage(key = LOCALSTORAGE_KEY) {
    const scn = useLocalStorage(key, "");
    scn.value = stringifyScenario();
  }

  async function saveToIndexedDb() {
    const scn = serializeToObject();
    if (scn.id.startsWith("demo-")) {
      scn.id = nanoid();
      store.value.state.id = scn.id;
    }
    
    // ذخیره در IndexedDB محلی
    const { addScenario } = await useIndexedDb();
    await addScenario(scn);
    
    // ذخیره در API
    const saved = await scenarioApiService.save(scn);
    return saved.id;
  }

  async function duplicateScenario() {
    const scn = serializeToObject();
    scn.id = nanoid();
    scn.name = `${scn.name} (copy)`;
    const created = await scenarioApiService.create(scn);
    return created.id;
  }

  function loadFromLocalStorage(key = LOCALSTORAGE_KEY) {
    const scn = useLocalStorage(key, "");

    if (scn.value) {
      loadFromObject(JSON.parse(scn.value));
    }
  }

  function loadFromObject(data: Scenario) {
    store.value = useNewScenarioStore(data);
    settingsStore.symbologyStandard = store.value.state.info.symbologyStandard || "2525";
  }

  async function loadFromUrl(url: string) {
    const { data, isFinished, statusCode, error } = useFetch<Scenario>(url).json();
    await until(isFinished).toBe(true);

    if (error.value) {
      console.error(statusCode.value, error.value);
      return;
    }
    loadFromObject(data.value);
  }

  function loadEmptyScenario() {
    const scn = createEmptyScenario();
    loadFromObject(scn);
  }

  async function loadDemoScenario(id: string | "Operation_Beit_ol_Moqaddas_1982_FA" | "Operation_Mersad_1988_FA" | "Iran_Israel_War_June_2025_FA") {
    isLoading.value = true;
    const base = (import.meta as any).env?.BASE_URL || "/";
    const idUrlMap: Record<string, string> = {
      Operation_Beit_ol_Moqaddas_1982_FA: `${base}scenarios/Operation_Beit_ol_Moqaddas_1982_FA.json`,
      Operation_Mersad_1988_FA: `${base}scenarios/Operation_Mersad_1988_FA.json`,
      Iran_Israel_War_June_2025_FA: `${base}scenarios/Iran_Israel_War_June_2025_FA.json`,
    };
    const url = idUrlMap[id];
    if (!url) {
      console.warn("Unknown scenario id", id);
      return;
    }
    await loadFromUrl(url);
    isLoading.value = false;
  }

  async function downloadAsJson(fileName?: string) {
    let name = fileName;
    if (!name) {
      //@ts-ignore
      const { default: filenamify } = await import("filenamify/browser");
      name = filenamify(store.value.state.info.name || "scenario.json");
    }
    await saveBlobToLocalFile(
      new Blob([stringifyScenario()], {
        type: "application/json",
      }),
      name + ".json",
    );
  }
  return {
    loadDemoScenario,
    loadEmptyScenario,
    loadFromObject,
    downloadAsJson,
    saveToLocalStorage,
    loadFromLocalStorage,
    stringifyScenario,
    serializeToObject,
    saveToIndexedDb,
    duplicateScenario,
    stringifyObject,
    toObject,
  };
}
