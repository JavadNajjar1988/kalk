import type {
  Position,
  RangeRing,
  RangeRingGroup,
  ScenarioLayer,
  ScenarioMapLayer,
} from "./scenarioGeoModels";
import type { DropTarget, EntityId, ScenarioTime } from "./base";
import type { SidValue } from "@/symbology/values";
import { type SymbolOptions } from "milsymbol";
import type { TextAmpValue } from "@/symbology/milsymbwrapper";
import type { BBox, Geometry } from "geojson";
import type {
  NState,
  NUnitEquipment,
  NUnitPersonnel,
  NUnitSupply,
  UpdateUnitEquipment,
  UpdateUnitPersonnel,
  UpdateUnitSupplies,
} from "@/types/internalModels";
import type { VisibilityStyleSpec } from "@/geo/simplestyle";
import type { EventType } from "./constants";
import type { PathMode } from "@/geo/unitPath";

export interface State extends Partial<ScenarioEventDescription> {
  id: string;
  t: ScenarioTime;
  location?: Position | null;
  sidc?: string;
  via?: Position[];
  pathMode?: PathMode;
  symbolOptions?: UnitSymbolOptions;
  textAmplifiers?: TextAmplifiers;
  interpolate?: boolean;
  viaStartTime?: ScenarioTime;
  reinforcedStatus?: ReinforcedStatus;
  status?: string | null;
  // an update replaces the current state with the new state
  update?: {
    equipment?: UpdateUnitEquipment[];
    personnel?: UpdateUnitPersonnel[];
    supplies?: UpdateUnitSupplies[];
  };
  // a diff is applied to the current state to update it
  diff?: {
    equipment?: UpdateUnitEquipment[];
    personnel?: UpdateUnitPersonnel[];
    supplies?: UpdateUnitSupplies[];
  };
  hierarchy?: TimedHierarchyMove;
}

export interface StateAdd extends Omit<NState, "id"> {
  id?: string;
}

export type CurrentStateType = "initial" | "interpolated";

export interface CurrentState extends Omit<NState, "id"> {
  type?: CurrentStateType;
  equipment?: NUnitEquipment[];
  personnel?: NUnitPersonnel[];
  supplies?: NUnitSupply[];
}

export interface LocationState extends State {
  location: Position;
}

export interface TimedHierarchyMove {
  targetId: EntityId;
  placement: DropTarget;
  parentId?: EntityId;
}

export interface UnitSymbolOptions extends SymbolOptions {
  fillColor?: string;
}

export type TextAmplifiers = Partial<Record<TextAmpValue, string>>;
export type ReinforcedStatus = "Reinforced" | "Reduced" | "ReinforcedReduced" | "None";

export function mapReinforcedStatus2Field(
  value?: ReinforcedStatus,
  options: { compact?: boolean } = {},
): string | undefined {
  const compact = options.compact ?? false;
  switch (value) {
    case "Reinforced":
      return compact ? "+" : "(+)";
    case "Reduced":
      return compact ? "-" : "(-)";
    case "ReinforcedReduced":
      return compact ? "±" : "(±)";
    default:
      return "";
  }
}

export interface Unit {
  id: EntityId;
  name: string;
  sidc: string;
  shortName?: string;
  description?: string;
  externalUrl?: string;
  subUnits?: Unit[];
  location?: Position;
  state?: State[];
  symbolOptions?: UnitSymbolOptions;
  textAmplifiers?: TextAmplifiers;
  reinforcedStatus?: ReinforcedStatus;
  rangeRings?: RangeRing[];
  equipment?: UnitEquipment[];
  personnel?: UnitPersonnel[];
  supplies?: UnitSupply[];
  media?: Media[];
  status?: string;
  template?: EntityId;
  properties?: UnitProperties;
  locked?: boolean;
  style?: UnitStyle;
  // internal runtime only state
  _state?: CurrentState | null;
  _pid?: EntityId; // parent
  _gid?: EntityId; // group
  _sid?: EntityId; // side
  _isOpen?: boolean;
}

export interface UnitStyle extends Partial<VisibilityStyleSpec> {}

export type SpeedUnitOfMeasure = "km/h" | "mph" | "knots" | "m/s" | "ft/s";
export type UnitProperty = { value: number; uom: SpeedUnitOfMeasure };

export interface UnitProperties {
  averageSpeed?: UnitProperty;
  maxSpeed?: UnitProperty;
}

export interface Media {
  /**
   * شناسه فایل مدیا در سیستم مدیریت منابع (resource_media.id).
   * اولویت با این فیلد است؛ اگر تعیین شده باشد، URL از API منابع ساخته می‌شود
   * و فیلد `url` به‌عنوان fallback (سناریوهای قدیمی) باقی می‌ماند.
   */
  mediaId?: string;
  /** ارجاع اختیاری به منبع داخلی (resource.id) که این مدیا به آن منتسب است. */
  resourceId?: string;
  /** URL مستقیم — فقط برای fallback / سازگاری با سناریوهای قبل از اتصال به مدیریت منابع. */
  url?: string;
  caption?: string;
  credits?: string;
  creditsUrl?: string;
}

export interface UnitEquipment {
  count: number;
  name: string;
  description?: string;
  onHand?: number;
  /** ارجاع به کاتالوگ منابع (resource.id با type=equipment). */
  resourceId?: string;
}

export interface UnitPersonnel {
  count: number;
  name: string;
  description?: string;
  onHand?: number;
  /** ارجاع به کاتالوگ منابع (resource.id با type=personnel). */
  resourceId?: string;
}

export interface UnitSupply {
  count: number;
  name: string;
  description?: string;
  onHand?: number;
  supplyClass?: string;
  uom?: string;
}

export interface SideData {
  name: string;
  description?: string;
  standardIdentity: SidValue;
  symbolOptions?: UnitSymbolOptions;
}

export interface SideGroup {
  id: EntityId;
  name: string;
  description?: string;
  subUnits: Unit[];
  symbolOptions?: UnitSymbolOptions;
  isHidden?: boolean;
  locked?: boolean;
  initiallyOpen?: boolean;
  _pid?: EntityId;
  _isNew?: boolean;
}

export interface Side extends SideData {
  id: EntityId;
  groups: SideGroup[];
  isHidden?: boolean;
  locked?: boolean;
  initiallyOpen?: boolean;
  subUnits?: Unit[];
  _isNew?: boolean;
}

export type UIActionType =
  | "CHANGE_MAP_LAYER"
  | "FLY_TO_LOCATION"
  | "FLY_TO_UNIT_LOCATION";

/**
 * A UI/map-action
 */
export interface UIAction {
  type: UIActionType;
}

export interface ChangeMapLayerUIAction extends UIAction {
  type: "CHANGE_MAP_LAYER";
  layerIndex: number;
}

export interface FlyToUnitLocationAction extends UIAction {
  type: "FLY_TO_UNIT_LOCATION";
  unitId: string;
  zoomLevel?: number;
}

export interface ScenarioEventDescription {
  title: string;
  subTitle?: string;
  description?: string;
  media?: Media[];
  externalUrl?: string;
  eventType?: EventType; // New field for event type
}

/**
 *
 */
export interface ScenarioEvent extends ScenarioEventDescription {
  startTime: ScenarioTime;
  /** Optional phase this event belongs to. */
  phaseId?: EntityId;
  uiActions?: UIAction[];
  id?: string;
  _type?: "unit" | "scenario";
  where?: UnitsWhere | GeometryWhere;
  severity?: "low" | "medium" | "high" | "critical"; // New field for severity of event
  outcomes?: string[]; // New field for tracking outcomes of events
  relatedEvents?: string[]; // New field for linking related events
  involvedUnits?: EntityId[]; // New field for explicitly listing units involved
}

export type StoryboardShowMode = "toast" | "cinematic";

export interface StoryboardSettings {
  defaultSceneDurationMs: number;
  autoDuration: boolean;
  showMode: StoryboardShowMode;
}

export type StoryboardCamera =
  | { type: "none" }
  | { type: "eventWhere"; maxZoom?: number }
  | { type: "geometry"; geometry: GeometryWhere["geometry"]; maxZoom?: number }
  | { type: "units"; units: EntityId[]; maxZoom?: number };

export interface StoryboardScene {
  id: EntityId;
  title: string;
  body?: string;
  startTime?: ScenarioTime;
  durationMs?: number;
  order?: number;
  linkedEventId?: EntityId;
  camera?: StoryboardCamera;
  pausePlayback?: boolean;
}

export interface Storyboard {
  enabled: boolean;
  scenes: StoryboardScene[];
  settings: StoryboardSettings;
}

export interface WhereOptions {
  mapAnimation?: "flyTo" | "easeTo" | "jumpTo";
  maxZoom?: number;
}

export interface UnitsWhere extends WhereOptions {
  type: "units";
  units: EntityId[];
}

export interface GeometryWhere extends WhereOptions {
  type: "geometry";
  geometry: Geometry;
}

export interface ScenarioInfo {
  name: string;
  description?: string;
  startTime?: ScenarioTime;
  timeZone?: string;
  symbologyStandard?: SymbologyStandard;
}

export type SymbologyStandard = "2525" | "app6";
export type ScenarioVersion =
  | "0.41.0"
  | "0.40.0"
  | "0.39.0"
  | "0.38.0"
  | "0.37.0"
  | "0.36.0"
  | "0.33.0"
  | "0.32.0"
  | "0.31.0"
  | "0.30.0"
  | "0.20.0"
  | "0.19.0"
  | "0.18.0"
  | "0.17.0"
  | "0.16.0"
  | "0.15.0"
  | "0.14.0"
  | "0.13.0"
  | "0.12.0"
  | "0.11.0"
  | "0.10.0"
  | "0.9.0"
  | "0.8.0"
  | "0.7.0"
  | "0.6.0";

export interface EquipmentData {
  name: string;
  description?: string;
  sidc?: string;
  /** ارجاع به ردیف کاتالوگ منابع (resource.id با type=equipment). */
  resourceId?: string;
}

export interface PersonnelData {
  name: string;
  description?: string;
  /** ارجاع به ردیف کاتالوگ منابع (resource.id با type=personnel). */
  resourceId?: string;
}

export interface SupplyCategory {
  name: string;
  description?: string;
  supplyClass?: string;
  uom?: string;
}

export interface SupplyClass {
  name: string;
  description?: string;
}

export interface UnitOfMeasure {
  name: string;
  description?: string;
  code?: string; // Abbreviation (e.g., kg, L)
  type?: UoMType | "";
}

export type UoMType = "weight" | "volume" | "quantity" | "distance";

export interface UnitStatus {
  name: string;
  description?: string;
  color?: string;
}

export interface ScenarioSettings {
  rangeRingGroups: RangeRingGroup[];
  statuses: UnitStatus[];
  supplyClasses: SupplyClass[];
  supplyUoMs: UnitOfMeasure[];
  map?: MapSettings;
  boundingBox?: BBox;
  /** Optional human-selected coordinate reference system, e.g., WGS84, UTM Zone 39N */
  coordinateSystem?: string;
  /** Optional geographic boundary as a GeoJSON geometry (e.g., Polygon) */
  geoBoundary?: Geometry;
}

export interface MapSettings {
  baseMapId: string;
}

export interface ScenarioMetadata {
  createdDate: string;
  lastModifiedDate: string;
  exportedFrom?: EntityId;
  exportedDate?: string;
  /** Display code generated by system, e.g., SCN-20251002-ABC123 */
  scenarioCode?: string;
  /** Author display name */
  authorName?: string;
  /** Purpose of scenario: operational, educational, or training */
  purpose?: "operational" | "educational" | "training";
}

// فیلدهای جدید برای سناریو
export interface ScenarioPhase {
  id: string;
  name: string;
  description?: string;
  startTime: ScenarioTime;
  endTime?: ScenarioTime;
  objectives: string[];
  tasks: PhaseTask[];
  status: PhaseStatus;
  order?: number;
}

export type EnvironmentalKind =
  | "metoc"
  | "precipitation"
  | "visibility"
  | "wind"
  | "temperature"
  | "fog"
  | "surface_condition"
  | "cloud_cover"
  | "thunderstorm"
  | "dust_storm"
  | "blizzard"
  | "humidity"
  | "pressure"
  | "smoke"
  | "fire"
  | "illumination"
  | "flood"
  | "soil_bearing"
  | "slope"
  | "roughness"
  | "vegetation"
  | "road_condition"
  | "bridge_condition"
  | "water_crossing"
  | "elevation";

export type EnvironmentalScope = "global" | "area";

export type EnvironmentalParameters = Record<
  string,
  string | number | boolean | undefined
>;

export interface EnvironmentalEraseZone {
  mode: "fade" | "cut";
  coordinates: Position[];
  radiusMeters: number;
}

export interface SymbolRenderReference {
  version: 1;
  renderer: "mission-command" | "milsymbol" | "tactical-2525c" | "custom";
  authoredResolution: number;
  authoredScale: number;
  pointSizeMeters?: number;
  artifact?: GeoJSON.FeatureCollection;
}

/**
 * Time-bound METOC/environmental state authored in Kalknegar.
 * Legacy fields remain optional so older dashboard scenarios can be opened and
 * saved without losing their environmental data.
 */
export interface EnvironmentalCondition {
  id: string;
  name?: string;
  kind: EnvironmentalKind;
  scope: EnvironmentalScope;
  startTime: ScenarioTime;
  endTime?: ScenarioTime;
  parameters: EnvironmentalParameters;
  geometry?: Geometry;
  transition?: {
    fadeInSeconds?: number;
    fadeOutSeconds?: number;
  };
  priority?: number;
  enabled?: boolean;
  description?: string;
  metocSidc?: string;
  renderReference?: SymbolRenderReference;
  eraseZones?: EnvironmentalEraseZone[];
  type?: string;
  value?: number;
  affectedArea?: GeoArea;
}

export interface PhaseTask {
  id: string;
  description: string;
  assignedUnitIds: string[];
  status: TaskStatus;
  startTime?: ScenarioTime;
  endTime?: ScenarioTime;
  location?: Position;
  prerequisiteTasks?: string[];
}

export enum PhaseStatus {
  PLANNED = "planned",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export enum TaskStatus {
  PENDING = "pending",
  ASSIGNED = "assigned",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  FAILED = "failed",
}

export enum ScenarioStatus {
  DRAFT = "draft",
  ACTIVE = "active",
  PAUSED = "paused",
  COMPLETED = "completed",
  ARCHIVED = "archived",
}

export interface TerrainAnalysis {
  id: string;
  keyTerrainFeatures: TerrainFeature[];
  obstacles: Obstacle[];
  avenues: AvenueOfApproach[];
  coverAndConcealment: CoverConcealmentArea[];
  observationPoints: ObservationPoint[];
}

export interface TerrainFeature {
  id: string;
  name: string;
  description?: string;
  location: GeoArea;
  significance: SignificanceLevel;
  controlledBy?: string;
}

export interface Obstacle {
  id: string;
  type: ObstacleType;
  location: GeoArea;
  strength: number; // 1-10
  description?: string;
  createdBy?: string;
}

export enum ObstacleType {
  NATURAL = "natural",
  ARTIFICIAL = "artificial",
  REINFORCED = "reinforced",
}

export interface AvenueOfApproach {
  id: string;
  name: string;
  path: Position[];
  width: number;
  suitability: VehicleType[];
  constraints?: string[];
}

export enum VehicleType {
  INFANTRY = "infantry",
  WHEELED = "wheeled",
  TRACKED = "tracked",
  AIRCRAFT = "aircraft",
}

export interface CoverConcealmentArea {
  id: string;
  location: GeoArea;
  coverValue: number; // 1-10
  concealmentValue: number; // 1-10
  description?: string;
}

export interface ObservationPoint {
  id: string;
  location: Position;
  visibleAreas: GeoArea[];
  range: number;
  quality: number; // 1-10
}

export interface GeoArea {
  type: "polygon" | "circle" | "rectangle";
  coordinates: Position[];
  radius?: number; // برای دایره
  width?: number; // برای مستطیل
  height?: number; // برای مستطیل
}

export enum SignificanceLevel {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export interface BattleInformation {
  id: string;
  engagements: Engagement[];
  casualties: Casualty[];
  intelligenceReports: IntelligenceReport[];
  supplyStatus: SupplyStatus[];
}

export interface Engagement {
  id: string;
  type: EngagementType;
  startTime: ScenarioTime;
  endTime?: ScenarioTime;
  location: GeoArea | Position;
  involvedUnits: {
    unitId: string;
    side: "attacker" | "defender" | "neutral";
  }[];
  outcome?: EngagementOutcome;
  description?: string;
  casualties?: string[];
  significantEvents?: string[];
}

export enum EngagementType {
  DIRECT_FIRE = "direct_fire",
  INDIRECT_FIRE = "indirect_fire",
  AIR_STRIKE = "air_strike",
  AMBUSH = "ambush",
  MEETING_ENGAGEMENT = "meeting_engagement",
  RECONNAISSANCE = "reconnaissance",
  PATROL = "patrol",
}

export interface EngagementOutcome {
  victor?: string;
  territoryControl?: string;
  objectiveAchieved: boolean;
  notes?: string;
}

export interface Casualty {
  unitId: string;
  personnel: {
    killed: number;
    wounded: number;
    missing: number;
  };
  equipment: {
    destroyed: number;
    damaged: number;
    captured: number;
  };
  timestamp: ScenarioTime;
  cause?: string;
}

export interface IntelligenceReport {
  id: string;
  source: IntelligenceSource;
  timestamp: ScenarioTime;
  validUntil?: ScenarioTime;
  reliability: ReliabilityLevel;
  content: string;
  relatedUnits?: string[];
  location?: Position;
  attachments?: string[];
}

export enum IntelligenceSource {
  HUMAN = "human",
  SIGNAL = "signal",
  IMAGERY = "imagery",
  OPEN_SOURCE = "open_source",
  MEASUREMENT = "measurement",
}

export enum ReliabilityLevel {
  CONFIRMED = "confirmed",
  PROBABLE = "probable",
  POSSIBLE = "possible",
  DOUBTFUL = "doubtful",
  IMPROBABLE = "improbable",
  UNCONFIRMED = "unconfirmed",
}

export interface SupplyStatus {
  unitId: string;
  timestamp: ScenarioTime;
  supplyCategories: {
    category: SupplyCategory;
    current: number;
    required: number;
  }[];
  nextResupplyExpected?: ScenarioTime;
  resupplyRoute?: Position[];
  priority: SupplyPriority;
}

export enum SupplyPriority {
  ROUTINE = "routine",
  PRIORITY = "priority",
  IMMEDIATE = "immediate",
  EMERGENCY = "emergency",
}

export interface CommandNode {
  unitId: string;
  role: CommandRole;
  subordinates: string[];
  superiors?: string[];
  responsibilities?: string[];
  communicationChannels?: CommunicationChannel[];
}

export enum CommandRole {
  COMMANDER = "commander",
  DEPUTY = "deputy",
  STAFF_OFFICER = "staff_officer",
  LIAISON = "liaison",
}

export interface CommunicationChannel {
  type: CommunicationType;
  reliability: number; // 1-10
  security: number; // 1-10
  connectedUnits: string[];
}

export enum CommunicationType {
  RADIO = "radio",
  SATELLITE = "satellite",
  FIELD_PHONE = "field_phone",
  MESSENGER = "messenger",
  VISUAL_SIGNAL = "visual_signal",
}

export interface SimulationSettings {
  timeStep: number; // به ثانیه
  accuracyLevel: AccuracyLevel;
  randomFactors: boolean;
  weatherEffects: boolean;
  suppliesSimulation: boolean;
  casualtySimulation: boolean;
  moralSimulation: boolean;
  terrainEffects: boolean;
}

export enum AccuracyLevel {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  ULTRA = "ultra",
}

export enum ExecutionStatus {
  NOT_STARTED = "not_started",
  RUNNING = "running",
  PAUSED = "paused",
  COMPLETED = "completed",
  TERMINATED = "terminated",
}

export interface AnalysisResult {
  id: string;
  type: AnalysisType;
  timestamp: ScenarioTime;
  data: any;
  conclusions?: string[];
  recommendations?: string[];
}

export enum AnalysisType {
  FORCE_RATIO = "force_ratio",
  CASUALTY_PREDICTION = "casualty_prediction",
  MISSION_SUCCESS = "mission_success",
  TERRAIN_ADVANTAGE = "terrain_advantage",
  SUPPLY_EFFICIENCY = "supply_efficiency",
  COMMAND_EFFECTIVENESS = "command_effectiveness",
}

export interface Scenario extends ScenarioInfo {
  type: "ORBAT-mapper";
  id: string;
  version: ScenarioVersion;
  meta?: ScenarioMetadata;
  sides: Side[];
  events: ScenarioEvent[];
  layers: ScenarioLayer[];
  mapLayers: ScenarioMapLayer[];
  equipment?: EquipmentData[];
  personnel?: PersonnelData[];
  supplyCategories?: SupplyCategory[];
  unitTemplates?: Unit[];
  settings?: ScenarioSettings;
  storyboard?: Storyboard;

  // فیلدهای جدید اضافه شده
  endTime?: ScenarioTime;
  status?: ScenarioStatus;
  objectives?: string[];
  phases?: ScenarioPhase[];
  environmentalConditions?: EnvironmentalCondition[];
  terrainAnalysis?: TerrainAnalysis;
  battleInformation?: BattleInformation;
  commandStructure?: CommandNode[];
  simulationSettings?: SimulationSettings;
  currentTime?: ScenarioTime;
  simulationSpeed?: number;
  executionStatus?: ExecutionStatus;
  analysisResults?: AnalysisResult[];
  tags?: string[];
  metadata?: Record<string, any>;

  // فیلد تصویر برای API
  image?: string;
}

export type UnitOrSide = Unit | Side;

export interface OrbatItemData {
  unit: Unit;
  children: OrbatItemData[];
}

const exampleData: UnitOfMeasure[] = [
  {
    name: "Kilogram",
    code: "kg",
    type: "weight",
  },
  {
    name: "Liter",
    code: "L",
    type: "volume",
  },
  {
    name: "Each",
    code: "ea",
    type: "quantity",
  },
  {
    name: "Meter",
    code: "m",
    type: "distance",
  },
];
