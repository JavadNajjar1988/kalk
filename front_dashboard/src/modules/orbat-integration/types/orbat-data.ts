/**
 * ORBAT Data Types
 * ساختار داده‌های ORBAT
 */

// Base entity
export interface BaseEntity {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Scenario data structure
export interface OrbatScenario extends BaseEntity {
  type: 'ORBAT-mapper';
  version: string;
  meta: {
    createdDate: string;
    lastModifiedDate: string;
  };
  startTime: number;
  timeZone?: string;
  symbologyStandard: 'APP6' | '2525';
  sides: OrbatSide[];
  events: OrbatEvent[];
  layers: OrbatLayer[];
  mapLayers: OrbatMapLayer[];
  settings?: OrbatSettings;
}

// Side (faction/force)
export interface OrbatSide extends BaseEntity {
  standardIdentity: 'friend' | 'hostile' | 'neutral' | 'unknown';
  groups: OrbatGroup[];
  isHidden?: boolean;
  locked?: boolean;
}

// Group within a side
export interface OrbatGroup extends BaseEntity {
  subUnits: OrbatUnit[];
}

// Military unit
export interface OrbatUnit extends BaseEntity {
  sidc: string; // Symbol identification code
  shortName?: string;
  symbolOptions?: UnitSymbolOptions;
  textAmplifiers?: Record<string, string>;
  reinforcedStatus?: 'Reinforced' | 'Reduced' | 'ReinforcedReduced' | 'None';
  location?: [number, number] | [number, number, number]; // [lon, lat] or [lon, lat, alt]
  subUnits?: OrbatUnit[];
  personnel?: UnitPersonnel[];
  equipment?: UnitEquipment[];
  supplies?: UnitSupply[];
  properties?: UnitProperties;
  state?: UnitState[];
  externalUrl?: string;
}

// Unit symbol options
export interface UnitSymbolOptions {
  fillColor?: string;
  frameColor?: string;
  iconColor?: string;
  size?: number;
  amplifiers?: Record<string, any>;
}

// Unit personnel
export interface UnitPersonnel {
  name: string;
  count: number;
  description?: string;
  onHand?: number;
}

// Unit equipment
export interface UnitEquipment {
  name: string;
  count: number;
  description?: string;
  onHand?: number;
  equipmentClass?: string;
}

// Unit supplies
export interface UnitSupply {
  name: string;
  count: number;
  description?: string;
  onHand?: number;
  supplyClass?: string;
  uom?: string; // Unit of measure
}

// Unit properties
export interface UnitProperties {
  averageSpeed?: { value: number; uom: string };
  maxSpeed?: { value: number; uom: string };
  [key: string]: any;
}

// Unit state over time
export interface UnitState {
  t: number; // timestamp
  location?: [number, number] | [number, number, number];
  properties?: Partial<UnitProperties>;
  status?: string;
}

// Timeline event
export interface OrbatEvent extends BaseEntity {
  startTime: number;
  title: string;
  subTitle?: string;
  eventType?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  media?: MediaItem[];
  outcomes?: string[];
  relatedEvents?: string[];
  involvedUnits?: string[];
}

// Media item
export interface MediaItem {
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  caption?: string;
  thumbnailUrl?: string;
}

// Map layer
export interface OrbatLayer extends BaseEntity {
  features: GeoFeature[];
}

// Geographic feature
export interface GeoFeature {
  id: string;
  type: 'Feature';
  geometry: any; // GeoJSON geometry
  properties: Record<string, any>;
  meta: {
    type: string;
    name?: string;
    description?: string;
  };
}

// Map base layer
export interface OrbatMapLayer extends BaseEntity {
  type: 'base' | 'overlay';
  url?: string;
  visible: boolean;
  opacity: number;
}

// Scenario settings
export interface OrbatSettings {
  map?: {
    baseMapId: string;
  };
  statuses?: UnitStatus[];
  rangeRingGroups?: RangeRingGroup[];
  supplyClasses?: SupplyClass[];
  supplyUoMs?: UnitOfMeasure[];
}

// Unit status definition
export interface UnitStatus {
  name: string;
  description?: string;
  color?: string;
}

// Range ring group
export interface RangeRingGroup {
  name: string;
  description?: string;
}

// Supply class
export interface SupplyClass {
  name: string;
  description?: string;
}

// Unit of measure
export interface UnitOfMeasure {
  name: string;
  code: string;
  type: 'weight' | 'volume' | 'quantity' | 'distance';
  description?: string;
}

// Chart layout data
export interface ChartLayout {
  nodes: ChartNode[];
  edges: ChartEdge[];
  layout: 'hierarchical' | 'force' | 'circular';
}

export interface ChartNode {
  id: string;
  unitId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ChartEdge {
  id: string;
  source: string;
  target: string;
  type: 'command' | 'support' | 'coordination';
}

// Selection state
export interface SelectionState {
  selectedUnitIds: string[];
  selectedFeatureIds: string[];
  selectedEventIds: string[];
  activeUnitId?: string;
  activeFeatureId?: string;
  activeEventId?: string;
}

// Position coordinate
export interface Position {
  lat: number;
  lon: number;
  alt?: number;
}

// Map view state (renamed from ViewState for clarity)
export interface MapViewState {
  zoom: number;
  center: [number, number];
  rotation: number;
}

// ORBAT search filters
export interface OrbatSearchFilters {
  text?: string;
  unitTypes?: string[];
  sides?: string[];
  status?: string[];
  timeRange?: {
    start: number;
    end: number;
  };
}

// ORBAT statistics
export interface OrbatStatistics {
  totalUnits: number;
  unitsBySide: Record<string, number>;
  unitsByType: Record<string, number>;
  totalEvents: number;
  eventsBySeverity: Record<string, number>;
}

// View state
export interface ViewState {
  mode: 'chart' | 'map' | 'grid' | 'story';
  zoom: number;
  center: [number, number];
  rotation: number;
  selectedLayers: string[];
  timePosition: number;
  isPlaying: boolean;
  playbackSpeed: number;
}