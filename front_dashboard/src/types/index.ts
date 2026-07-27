// Base types
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// User and Auth types
export interface User extends BaseEntity {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: string;
}

export enum UserRole {
  ADMIN = 'admin',
  COMMANDER = 'commander',
  OPERATOR = 'operator',
  VIEWER = 'viewer',
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Military and Mapping types
export interface Coordinate {
  longitude: number;
  latitude: number;
  elevation?: number;
}

export interface MilitaryUnit extends BaseEntity {
  name: string;
  type: UnitType;
  size: UnitSize;
  symbolCode: string;
  position: Coordinate;
  heading?: number;
  status: UnitStatus;
  parentId?: string;
  children?: MilitaryUnit[];
  metadata?: Record<string, any>;
}

export enum UnitType {
  INFANTRY = 'infantry',
  ARMOR = 'armor',
  ARTILLERY = 'artillery',
  AIR_DEFENSE = 'air_defense',
  AVIATION = 'aviation',
  NAVAL = 'naval',
  LOGISTICS = 'logistics',
  COMMAND = 'command',
}

export enum UnitSize {
  TEAM = 'team',
  SQUAD = 'squad',
  SECTION = 'section',
  PLATOON = 'platoon',
  COMPANY = 'company',
  BATTALION = 'battalion',
  BRIGADE = 'brigade',
  DIVISION = 'division',
  CORPS = 'corps',
  ARMY = 'army',
}

export enum UnitStatus {
  OPERATIONAL = 'operational',
  DEGRADED = 'degraded',
  NON_OPERATIONAL = 'non_operational',
  DESTROYED = 'destroyed',
  UNKNOWN = 'unknown',
}

// Map and Layer types
export interface MapLayer extends BaseEntity {
  name: string;
  type: LayerType;
  url?: string;
  visible: boolean;
  opacity: number;
  zIndex: number;
  extent?: [number, number, number, number];
  metadata?: Record<string, any>;
}

export enum LayerType {
  BASE_MAP = 'base_map',
  OVERLAY = 'overlay',
  TACTICAL = 'tactical',
  REFERENCE = 'reference',
}

export interface MapState {
  center: Coordinate;
  zoom: number;
  rotation: number;
  layers: MapLayer[];
  selectedUnits: string[];
  activeLayer?: string;
  measurementMode: MeasurementMode;
  is3D: boolean;
}

export enum MeasurementMode {
  NONE = 'none',
  DISTANCE = 'distance',
  AREA = 'area',
  BEARING = 'bearing',
}

// Scenario types
export interface Scenario extends BaseEntity {
  name: string;
  description: string;
  startTime: string;
  endTime?: string;
  status: ScenarioStatus;
  units: MilitaryUnit[];
  layers: MapLayer[];
  events: ScenarioEvent[];
  objectives?: string[]; // اهداف سناریو
  metadata?: Record<string, any>;
}

export enum ScenarioStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export interface ScenarioEvent extends BaseEntity {
  scenarioId: string;
  phaseId?: string;
  type: EventType;
  timestamp: string;
  title: string;
  data: Record<string, any>;
  description?: string;
  involvedUnits?: string[]; // واحدهای درگیر در رویداد
  location?: Coordinate; // موقعیت رویداد
  severity?: EventSeverity; // شدت رویداد
  status?: EventStatus; // وضعیت رویداد
  outcomes?: string[]; // نتایج رویداد
  relatedEvents?: string[]; // رویدادهای مرتبط
  media?: ScenarioMedia[]; // رسانه‌های مرتبط
  isVisible?: boolean; // قابلیت نمایش
  tags?: string[]; // برچسب‌ها
}

export interface ScenarioMedia {
  id: string;
  url: string;
  type: 'image' | 'video' | 'document';
  title?: string;
  description?: string;
  timestamp?: string;
  source?: string;
}

export enum EventSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum EventStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELED = 'canceled',
  FAILED = 'failed',
}

export enum EventType {
  // رویدادهای مربوط به واحدها
  UNIT_MOVE = 'unit_move', // جابجایی واحد
  UNIT_CREATED = 'unit_created', // ایجاد واحد
  UNIT_DESTROYED = 'unit_destroyed', // انهدام واحد
  STATUS_CHANGE = 'status_change', // تغییر وضعیت

  // رویدادهای مربوط به نبرد
  ENGAGEMENT = 'engagement', // درگیری
  AMBUSH = 'ambush', // کمین
  ATTACK = 'attack', // حمله
  DEFENSE = 'defense', // دفاع
  COUNTERATTACK = 'counterattack', // پاتک

  // رویدادهای مربوط به پشتیبانی
  SUPPLY = 'supply', // تدارکات
  RESUPPLY = 'resupply', // بازتأمین
  MEDICAL_EVACUATION = 'medical_evacuation', // تخلیه مجروحین
  REINFORCEMENT = 'reinforcement', // تقویت نیرو
  WITHDRAWAL = 'withdrawal', // عقب‌نشینی

  // رویدادهای مربوط به اطلاعات
  INTELLIGENCE = 'intelligence', // اطلاعات
  RECONNAISSANCE = 'reconnaissance', // شناسایی
  SURVEILLANCE = 'surveillance', // مراقبت

  // رویدادهای مربوط به فرماندهی
  COMMAND_CHANGE = 'command_change', // تغییر فرماندهی
  MISSION_UPDATE = 'mission_update', // به‌روزرسانی مأموریت
  OBJECTIVE_SECURED = 'objective_secured', // تأمین هدف

  // سایر رویدادها
  COMMUNICATION = 'communication', // ارتباطات
  OTHER = 'other', // سایر
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// Redux Store types
export interface RootState {
  auth: AuthState;
  map: MapState;
  scenarios: ScenariosState;
  ui: UIState;
}

export interface ScenariosState {
  scenarios: Scenario[];
  currentScenario: Scenario | null;
  isLoading: boolean;
  error: string | null;
}

export interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  language: 'fa' | 'en';
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  timestamp: string;
  read: boolean;
}

export type Echelon = {
  id: string;
  name: string;
};

export type Alert = {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  timestamp: string;
  description: string;
  source: string;
  acknowledged: boolean;
};

// تایپ‌های گسترش یافته برای سناریو
export interface EnhancedScenario extends Scenario {
  /** ویدئوی اینترو کالک‌نگار (URL از API) */
  intro_video_url?: string | null;
  intro_title?: string | null;
  intro_summary?: string | null;
  /** آرشیو شده */
  archived_at?: string | null;
  // مراحل سناریو
  phases: ScenarioPhase[];
  // شرایط محیطی
  environmentalConditions: EnvironmentalCondition[];
  // تحلیل زمین
  terrainAnalysis?: TerrainAnalysis;
  // اطلاعات نبرد
  battleInformation?: BattleInformation;
  // ساختار فرماندهی
  commandStructure?: CommandNode[];
  // تنظیمات شبیه‌سازی
  simulationSettings?: SimulationSettings;
  // زمان فعلی سناریو (برای شبیه‌سازی)
  currentTime?: string;
  // سرعت شبیه‌سازی
  simulationSpeed?: number;
  // وضعیت اجرا
  executionStatus?: ExecutionStatus;
  // نتایج تحلیل
  analysisResults?: AnalysisResult[];
}

export interface ScenarioPhase {
  id: string;
  name: string;
  description?: string;
  startTime: string;
  endTime?: string;
  objectives: string[];
  tasks: PhaseTask[];
  status: PhaseStatus;
  order?: number;
}

export interface PhaseTask {
  id: string;
  description: string;
  assignedUnitIds: string[];
  status: TaskStatus;
  startTime?: string;
  endTime?: string;
  location?: Coordinate;
  prerequisiteTasks?: string[];
}

export enum PhaseStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum TaskStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface EnvironmentalCondition {
  id: string;
  name?: string;
  /** Legacy dashboard category. New scenarios use `kind`. */
  type?: EnvironmentalFactorType;
  kind?:
    | 'precipitation'
    | 'visibility'
    | 'wind'
    | 'temperature'
    | 'fog'
    | 'surface_condition'
    | 'cloud_cover';
  scope?: 'global' | 'area';
  startTime: string | number;
  endTime?: string | number;
  value?: number;
  parameters?: Record<string, string | number | undefined>;
  description?: string;
  affectedArea?: GeoArea;
  geometry?: {
    type: string;
    coordinates: unknown;
  };
  priority?: number;
  enabled?: boolean;
  metocSidc?: string;
}

export enum EnvironmentalFactorType {
  WEATHER = 'weather',
  VISIBILITY = 'visibility',
  TEMPERATURE = 'temperature',
  PRECIPITATION = 'precipitation',
  WIND = 'wind',
  TIME_OF_DAY = 'time_of_day',
  SEASON = 'season',
  TERRAIN_CONDITION = 'terrain_condition',
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
  controlledBy?: string; // واحد کنترل‌کننده
}

export interface Obstacle {
  id: string;
  type: ObstacleType;
  location: GeoArea;
  strength: number; // 1-10
  description?: string;
  createdBy?: string; // واحد سازنده (برای موانع مصنوعی)
}

export enum ObstacleType {
  NATURAL = 'natural',
  ARTIFICIAL = 'artificial',
  REINFORCED = 'reinforced',
}

export interface AvenueOfApproach {
  id: string;
  name: string;
  path: Coordinate[];
  width: number;
  suitability: VehicleType[];
  constraints?: string[];
}

export enum VehicleType {
  INFANTRY = 'infantry',
  WHEELED = 'wheeled',
  TRACKED = 'tracked',
  AIRCRAFT = 'aircraft',
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
  location: Coordinate;
  visibleAreas: GeoArea[];
  range: number;
  quality: number; // 1-10
}

export interface GeoArea {
  type: 'polygon' | 'circle' | 'rectangle';
  coordinates: Coordinate[];
  radius?: number; // برای دایره
  width?: number; // برای مستطیل
  height?: number; // برای مستطیل
}

export enum SignificanceLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
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
  startTime: string;
  endTime?: string;
  location: GeoArea | Coordinate;
  involvedUnits: {
    unitId: string;
    side: 'attacker' | 'defender' | 'neutral';
  }[];
  outcome?: EngagementOutcome;
  description?: string;
  casualties?: string[];
  significantEvents?: string[];
}

export enum EngagementType {
  DIRECT_FIRE = 'direct_fire',
  INDIRECT_FIRE = 'indirect_fire',
  AIR_STRIKE = 'air_strike',
  AMBUSH = 'ambush',
  MEETING_ENGAGEMENT = 'meeting_engagement',
  RECONNAISSANCE = 'reconnaissance',
  PATROL = 'patrol',
}

export interface EngagementOutcome {
  victor?: string; // واحد پیروز
  territoryControl?: string; // واحد کنترل‌کننده منطقه
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
  timestamp: string;
  cause?: string;
}

export interface IntelligenceReport {
  id: string;
  source: IntelligenceSource;
  timestamp: string;
  validUntil?: string;
  reliability: ReliabilityLevel;
  content: string;
  relatedUnits?: string[];
  location?: Coordinate;
  attachments?: string[];
}

export enum IntelligenceSource {
  HUMAN = 'human',
  SIGNAL = 'signal',
  IMAGERY = 'imagery',
  OPEN_SOURCE = 'open_source',
  MEASUREMENT = 'measurement',
}

export enum ReliabilityLevel {
  CONFIRMED = 'confirmed',
  PROBABLE = 'probable',
  POSSIBLE = 'possible',
  DOUBTFUL = 'doubtful',
  IMPROBABLE = 'improbable',
  UNCONFIRMED = 'unconfirmed',
}

export interface SupplyStatus {
  unitId: string;
  timestamp: string;
  supplyCategories: {
    category: SupplyCategory;
    current: number;
    required: number;
  }[];
  nextResupplyExpected?: string;
  resupplyRoute?: Coordinate[];
  priority: SupplyPriority;
}

export enum SupplyCategory {
  AMMUNITION = 'ammunition',
  FUEL = 'fuel',
  FOOD = 'food',
  WATER = 'water',
  MEDICAL = 'medical',
  MAINTENANCE = 'maintenance',
  PERSONNEL = 'personnel',
}

export enum SupplyPriority {
  ROUTINE = 'routine',
  PRIORITY = 'priority',
  IMMEDIATE = 'immediate',
  EMERGENCY = 'emergency',
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
  COMMANDER = 'commander',
  DEPUTY = 'deputy',
  STAFF_OFFICER = 'staff_officer',
  LIAISON = 'liaison',
}

export interface CommunicationChannel {
  type: CommunicationType;
  reliability: number; // 1-10
  security: number; // 1-10
  connectedUnits: string[];
}

export enum CommunicationType {
  RADIO = 'radio',
  SATELLITE = 'satellite',
  FIELD_PHONE = 'field_phone',
  MESSENGER = 'messenger',
  VISUAL_SIGNAL = 'visual_signal',
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
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  ULTRA = 'ultra',
}

export enum ExecutionStatus {
  NOT_STARTED = 'not_started',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  TERMINATED = 'terminated',
}

export interface AnalysisResult {
  id: string;
  type: AnalysisType;
  timestamp: string;
  data: any;
  conclusions?: string[];
  recommendations?: string[];
}

export enum AnalysisType {
  FORCE_RATIO = 'force_ratio',
  CASUALTY_PREDICTION = 'casualty_prediction',
  MISSION_SUCCESS = 'mission_success',
  TERRAIN_ADVANTAGE = 'terrain_advantage',
  SUPPLY_EFFICIENCY = 'supply_efficiency',
  COMMAND_EFFECTIVENESS = 'command_effectiveness',
}
