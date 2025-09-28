// تایپ‌های ORBAT
import type { SymbolOptions } from 'milsymbol';

// موقعیت جغرافیایی
export type Position = [number, number] | [number, number, number];

// شناسه موجودیت
export type EntityId = string;

// زمان سناریو
export type ScenarioTime = string;

// گزینه‌های نماد واحد
export interface UnitSymbolOptions extends SymbolOptions {
  fillColor?: string;
}

// تقویت‌کننده‌های متنی
export type TextAmplifiers = Partial<Record<string, string>>;

// وضعیت تقویت/کاهش
export type ReinforcedStatus = "Reinforced" | "Reduced" | "ReinforcedReduced" | "None";



// پرسنل واحد
export interface UnitPersonnel {
  count: number;
  name: string;
  description?: string;
  onHand?: number;
}

// تدارکات واحد
export interface UnitSupply {
  count: number;
  name: string;
  description?: string;
  onHand?: number;
  supplyClass?: string;
  uom?: string;
}

// ویژگی‌های واحد
export interface UnitProperties {
  averageSpeed?: { value: number; uom: string };
  maxSpeed?: { value: number; uom: string };
}

// واحد نظامی
export interface Unit {
  id: EntityId;
  name: string;
  sidc: string;
  shortName?: string;
  description?: string;
  externalUrl?: string;
  subUnits?: Unit[];
  location?: Position;
  symbolOptions?: UnitSymbolOptions;
  textAmplifiers?: TextAmplifiers;
  reinforcedStatus?: ReinforcedStatus;

  personnel?: UnitPersonnel[];
  supplies?: UnitSupply[];
  properties?: UnitProperties;
  locked?: boolean;
  // داده‌های runtime
  _pid?: EntityId; // parent
  _gid?: EntityId; // group
  _sid?: EntityId; // side
  _isOpen?: boolean;
}

// گروه واحدها
export interface SideGroup {
  id: EntityId;
  name: string;
  description?: string;
  subUnits: Unit[];
  symbolOptions?: UnitSymbolOptions;
  isHidden?: boolean;
  locked?: boolean;
  _pid?: EntityId;
  _isNew?: boolean;
}

// طرف/کشور
export interface Side {
  id: EntityId;
  name: string;
  description?: string;
  standardIdentity: string;
  symbolOptions?: UnitSymbolOptions;
  groups: SideGroup[];
  isHidden?: boolean;
  locked?: boolean;
  _isNew?: boolean;
}

// داده‌های تجهیزات
export interface EquipmentData {
  id: string;
  name: string;
  description?: string;
}

// لایه نقشه
export interface MapLayer {
  id: string;
  name: string;
  type: 'wms' | 'wmts' | 'xyz' | 'osm' | 'vector' | 'raster';
  url?: string;
  visible: boolean;
  opacity: number;
  minZoom?: number;
  maxZoom?: number;
  attribution?: string;
  extent?: number[];
  format?: string;
  layers?: string;
  tileSize?: number;
  projection?: string;
  file?: File;
}

// انواع رده‌های نظامی
export type MilitaryLevel = 
  | 'team'           // تیم
  | 'squad'          // جوخه
  | 'section'        // بخش
  | 'platoon'        // دسته
  | 'company'        // گروهان
  | 'battalion'      // گردان
  | 'regiment'       // هنگ
  | 'brigade'        // تیپ
  | 'division'       // لشکر
  | 'corps'          // سپاه
  | 'army'           // ارتش
  | 'theater';       // منطقه

// انواع واحدهای نظامی
export type MilitaryUnitType = 
  | 'command'        // فرماندهی
  | 'infantry'       // پیاده
  | 'armor'          // زرهی
  | 'artillery'      // توپخانه
  | 'air_defense'    // پدافند هوایی
  | 'engineer'       // مهندسی
  | 'logistics'      // پشتیبانی
  | 'medical'        // پزشکی
  | 'intelligence'   // اطلاعات
  | 'communications' // ارتباطات
  | 'special_forces' // نیروهای ویژه
  | 'aviation'       // هوانیروز
  | 'navy'           // نیروی دریایی
  | 'air_force';     // نیروی هوایی
