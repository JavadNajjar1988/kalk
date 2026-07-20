import { useState, useEffect, useMemo, useCallback } from 'react';

// Types for ammunition hierarchy
export interface AmmunitionPath {
  nodeId: string;
  nodeName: string;
  level: number;
}

export interface AmmunitionFieldDefinition {
  id: string;
  name: string;
  englishName: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean';
  isRequired: boolean;
  order: number;
  options?: string[];
  unit?: string;
}

export interface AmmunitionNode {
  id: string;
  name: string;
  englishName?: string;
  level: number;
  parentId?: string | null;
  order: number;
  hasChildren: boolean;
  children?: AmmunitionNode[];
  customFields?: AmmunitionFieldDefinition[];
}

interface UseAmmunitionHierarchyReturn {
  rootNodes: AmmunitionNode[];
  loading: boolean;
  error: string | null;
  selectedPath: AmmunitionPath[];
  getCurrentSelection: {
    finalNode: AmmunitionNode | null;
    fields: AmmunitionFieldDefinition[];
  };
  addToPath: (nodeId: string, nodeName: string, level: number) => void;
  clearPathFromLevel: (level: number) => void;
  resetPath: () => void;
  getOptionsForLevel: (level: number) => AmmunitionNode[];
  refresh: () => void;
  triggerManualSync: () => void;
  lastSyncTime: number;
}

// Comprehensive ammunition data structure with all major military ammunition categories
const ammunitionData = {
  nodes: [
    {
      id: "am-1",
      name: "مهمات شلیک",
      englishName: "Firing Ammunition",
      level: 1,
      parentId: null,
      order: 1,
      hasChildren: true,
      children: [
        {
          id: "am-1-1",
          name: "گلوله‌ها",
          englishName: "Bullets",
          level: 2,
          parentId: "am-1",
          order: 1,
          hasChildren: true,
          children: [
            {
              id: "am-1-1-1",
              name: "گلوله‌های پیستول",
              englishName: "Pistol Bullets",
              level: 3,
              parentId: "am-1-1",
              order: 1,
              hasChildren: false,
              customFields: [
                { id: "pf-bullet-name", name: "نام گلوله", englishName: "Bullet Name", type: "text", isRequired: true, order: 1 },
                { id: "pf-caliber", name: "کالیبر", englishName: "Caliber", type: "select", isRequired: true, order: 2, options: ["9mm", ".45 ACP", ".40 S&W", ".380 ACP", "10mm Auto", ".357 SIG"] },
                { id: "pf-effective-range", name: "برد مؤثر", englishName: "Effective Range", type: "number", isRequired: false, order: 3, unit: "m" },
                { id: "pf-ammo-type", name: "نوع مهمات", englishName: "Ammunition Type", type: "select", isRequired: true, order: 4, options: ["Hollow Point", "Full Metal Jacket", "Soft Point", "Jacketed Hollow Point"] },
                { id: "pf-weight", name: "وزن", englishName: "Bullet Weight", type: "number", isRequired: false, order: 5, unit: "g" }
              ]
            },
            {
              id: "am-1-1-2",
              name: "گلوله‌های تفنگ",
              englishName: "Rifle Bullets",
              level: 3,
              parentId: "am-1-1",
              order: 2,
              hasChildren: false,
              customFields: [
                { id: "rf-bullet-name", name: "نام گلوله", englishName: "Bullet Name", type: "text", isRequired: true, order: 1 },
                { id: "rf-caliber", name: "کالیبر", englishName: "Caliber", type: "select", isRequired: true, order: 2, options: ["5.56mm", "7.62mm", ".308", ".30-06", "7.62x39", "5.45x39"] },
                { id: "rf-effective-range", name: "برد مؤثر", englishName: "Effective Range", type: "number", isRequired: false, order: 3, unit: "m" },
                { id: "rf-bullet-type", name: "نوع گلوله", englishName: "Bullet Type", type: "select", isRequired: true, order: 4, options: ["Ball", "Tracer", "Armor Piercing", "Incendiary", "AP-I"] }
              ]
            },
            {
              id: "am-1-1-3",
              name: "گلوله‌های مسلسل",
              englishName: "Machine Gun Bullets",
              level: 3,
              parentId: "am-1-1",
              order: 3,
              hasChildren: false,
              customFields: [
                { id: "mg-bullet-name", name: "نام گلوله", englishName: "Bullet Name", type: "text", isRequired: true, order: 1 },
                { id: "mg-caliber", name: "کالیبر", englishName: "Caliber", type: "select", isRequired: true, order: 2, options: ["12.7mm", "14.5mm", "7.62mm", "5.56mm"] },
                { id: "mg-feed-type", name: "نوع تغذیه", englishName: "Feed Type", type: "select", isRequired: true, order: 3, options: ["Belt Fed", "Magazine", "Drum"] },
                { id: "mg-rate-of-fire", name: "نرخ شلیک", englishName: "Rate of Fire", type: "number", isRequired: false, order: 4, unit: "rpm" }
              ]
            },
            {
              id: "am-1-1-4",
              name: "گلوله‌های تک‌تیرانداز",
              englishName: "Sniper Bullets",
              level: 3,
              parentId: "am-1-1",
              order: 4,
              hasChildren: false,
              customFields: [
                { id: "sn-bullet-name", name: "نام گلوله", englishName: "Bullet Name", type: "text", isRequired: true, order: 1 },
                { id: "sn-caliber", name: "کالیبر", englishName: "Caliber", type: "select", isRequired: true, order: 2, options: [".338 Lapua", ".50 BMG", ".300 Win Mag", "7.62x51", "6.5 Creedmoor"] },
                { id: "sn-effective-range", name: "برد مؤثر", englishName: "Effective Range", type: "number", isRequired: true, order: 3, unit: "m" },
                { id: "sn-accuracy", name: "دقت", englishName: "Accuracy", type: "select", isRequired: false, order: 4, options: ["Sub-MOA", "1 MOA", "1.5 MOA", "2 MOA"] }
              ]
            }
          ]
        },
        {
          id: "am-1-2",
          name: "موشک‌ها",
          englishName: "Missiles",
          level: 2,
          parentId: "am-1",
          order: 2,
          hasChildren: true,
          children: [
            {
              id: "am-1-2-1",
              name: "موشک‌های بالستیک",
              englishName: "Ballistic Missiles",
              level: 3,
              parentId: "am-1-2",
              order: 1,
              hasChildren: true,
              children: [
                {
                  id: "am-1-2-1-1",
                  name: "موشک‌های کوتاه‌برد",
                  englishName: "Short Range Ballistic Missiles",
                  level: 4,
                  parentId: "am-1-2-1",
                  order: 1,
                  hasChildren: false,
                  customFields: [
                    { id: "srbm-name", name: "نام موشک", englishName: "Missile Name", type: "text", isRequired: true, order: 1 },
                    { id: "srbm-range", name: "برد", englishName: "Range", type: "number", isRequired: true, order: 2, unit: "km" },
                    { id: "srbm-payload", name: "بار محمول", englishName: "Payload", type: "number", isRequired: true, order: 3, unit: "kg" },
                    { id: "srbm-guidance", name: "سیستم هدایت", englishName: "Guidance System", type: "select", isRequired: true, order: 4, options: ["Inertial", "GPS", "Terminal Guidance", "Combined"] }
                  ]
                },
                {
                  id: "am-1-2-1-2",
                  name: "موشک‌های میان‌برد",
                  englishName: "Medium Range Ballistic Missiles",
                  level: 4,
                  parentId: "am-1-2-1",
                  order: 2,
                  hasChildren: false,
                  customFields: [
                    { id: "mrbm-name", name: "نام موشک", englishName: "Missile Name", type: "text", isRequired: true, order: 1 },
                    { id: "mrbm-range", name: "برد", englishName: "Range", type: "number", isRequired: true, order: 2, unit: "km" },
                    { id: "mrbm-payload", name: "بار محمول", englishName: "Payload", type: "number", isRequired: true, order: 3, unit: "kg" },
                    { id: "mrbm-fuel-type", name: "نوع سوخت", englishName: "Fuel Type", type: "select", isRequired: true, order: 4, options: ["Solid", "Liquid", "Hybrid"] }
                  ]
                }
              ]
            },
            {
              id: "am-1-2-2",
              name: "موشک‌های ضدتانک",
              englishName: "Anti-Tank Missiles",
              level: 3,
              parentId: "am-1-2",
              order: 2,
              hasChildren: false,
              customFields: [
                { id: "atm-name", name: "نام موشک", englishName: "Missile Name", type: "text", isRequired: true, order: 1 },
                { id: "atm-range", name: "برد", englishName: "Range", type: "number", isRequired: true, order: 2, unit: "km" },
                { id: "atm-guidance", name: "سیستم هدایت", englishName: "Guidance System", type: "select", isRequired: true, order: 3, options: ["Wire Guided", "Laser Guided", "Fire and Forget", "Beam Riding"] },
                { id: "atm-penetration", name: "قدرت نفوذ", englishName: "Penetration Power", type: "number", isRequired: false, order: 4, unit: "mm RHA" }
              ]
            },
            {
              id: "am-1-2-3",
              name: "موشک‌های ضدهوایی",
              englishName: "Surface-to-Air Missiles",
              level: 3,
              parentId: "am-1-2",
              order: 3,
              hasChildren: true,
              children: [
                {
                  id: "am-1-2-3-1",
                  name: "موشک‌های کوتاه‌برد ضدهوایی",
                  englishName: "Short Range SAM",
                  level: 4,
                  parentId: "am-1-2-3",
                  order: 1,
                  hasChildren: false,
                  customFields: [
                    { id: "srsam-name", name: "نام موشک", englishName: "Missile Name", type: "text", isRequired: true, order: 1 },
                    { id: "srsam-range", name: "برد", englishName: "Range", type: "number", isRequired: true, order: 2, unit: "km" },
                    { id: "srsam-altitude", name: "ارتفاع عملیاتی", englishName: "Operational Altitude", type: "number", isRequired: true, order: 3, unit: "m" },
                    { id: "srsam-mobility", name: "قابلیت حمل", englishName: "Mobility", type: "select", isRequired: true, order: 4, options: ["Portable", "Vehicle Mounted", "Fixed Installation"] }
                  ]
                },
                {
                  id: "am-1-2-3-2",
                  name: "موشک‌های بلندبرد ضدهوایی",
                  englishName: "Long Range SAM",
                  level: 4,
                  parentId: "am-1-2-3",
                  order: 2,
                  hasChildren: false,
                  customFields: [
                    { id: "lrsam-name", name: "نام موشک", englishName: "Missile Name", type: "text", isRequired: true, order: 1 },
                    { id: "lrsam-range", name: "برد", englishName: "Range", type: "number", isRequired: true, order: 2, unit: "km" },
                    { id: "lrsam-radar-type", name: "نوع رادار", englishName: "Radar Type", type: "select", isRequired: true, order: 3, options: ["Phased Array", "Mechanical Scan", "AESA", "Passive"] },
                    { id: "lrsam-engagement", name: "تعداد هدف همزمان", englishName: "Simultaneous Engagements", type: "number", isRequired: false, order: 4 }
                  ]
                }
              ]
            }
          ]
        },
        {
          id: "am-1-3",
          name: "خمپاره‌ها",
          englishName: "Mortars",
          level: 2,
          parentId: "am-1",
          order: 3,
          hasChildren: true,
          children: [
            {
              id: "am-1-3-1",
              name: "خمپاره سبک",
              englishName: "Light Mortars",
              level: 3,
              parentId: "am-1-3",
              order: 1,
              hasChildren: false,
              customFields: [
                { id: "lm-name", name: "نام خمپاره", englishName: "Mortar Name", type: "text", isRequired: true, order: 1 },
                { id: "lm-caliber", name: "کالیبر", englishName: "Caliber", type: "select", isRequired: true, order: 2, options: ["60mm", "81mm"] },
                { id: "lm-range", name: "برد حداکثر", englishName: "Maximum Range", type: "number", isRequired: true, order: 3, unit: "m" },
                { id: "lm-weight", name: "وزن کل", englishName: "Total Weight", type: "number", isRequired: false, order: 4, unit: "kg" }
              ]
            },
            {
              id: "am-1-3-2",
              name: "خمپاره سنگین",
              englishName: "Heavy Mortars",
              level: 3,
              parentId: "am-1-3",
              order: 2,
              hasChildren: false,
              customFields: [
                { id: "hm-name", name: "نام خمپاره", englishName: "Mortar Name", type: "text", isRequired: true, order: 1 },
                { id: "hm-caliber", name: "کالیبر", englishName: "Caliber", type: "select", isRequired: true, order: 2, options: ["120mm", "160mm", "240mm"] },
                { id: "hm-range", name: "برد حداکثر", englishName: "Maximum Range", type: "number", isRequired: true, order: 3, unit: "m" },
                { id: "hm-mobility", name: "نوع حرکت", englishName: "Mobility Type", type: "select", isRequired: true, order: 4, options: ["Towed", "Self-Propelled", "Fixed"] }
              ]
            }
          ]
        },
        {
          id: "am-1-4",
          name: "توپخانه",
          englishName: "Artillery",
          level: 2,
          parentId: "am-1",
          order: 4,
          hasChildren: true,
          children: [
            {
              id: "am-1-4-1",
              name: "توپخانه میدانی",
              englishName: "Field Artillery",
              level: 3,
              parentId: "am-1-4",
              order: 1,
              hasChildren: false,
              customFields: [
                { id: "fa-name", name: "نام توپخانه", englishName: "Artillery Name", type: "text", isRequired: true, order: 1 },
                { id: "fa-caliber", name: "کالیبر", englishName: "Caliber", type: "select", isRequired: true, order: 2, options: ["105mm", "122mm", "152mm", "155mm"] },
                { id: "fa-range", name: "برد حداکثر", englishName: "Maximum Range", type: "number", isRequired: true, order: 3, unit: "km" },
                { id: "fa-ammunition-type", name: "نوع مهمات", englishName: "Ammunition Type", type: "multiselect", isRequired: true, order: 4, options: ["HE", "Smoke", "Illumination", "Cluster", "Precision Guided"] }
              ]
            },
            {
              id: "am-1-4-2",
              name: "راکت چندلوله",
              englishName: "Multiple Rocket Launcher",
              level: 3,
              parentId: "am-1-4",
              order: 2,
              hasChildren: false,
              customFields: [
                { id: "mrl-name", name: "نام سیستم", englishName: "System Name", type: "text", isRequired: true, order: 1 },
                { id: "mrl-caliber", name: "کالیبر", englishName: "Caliber", type: "select", isRequired: true, order: 2, options: ["107mm", "122mm", "220mm", "300mm"] },
                { id: "mrl-tubes", name: "تعداد لوله", englishName: "Number of Tubes", type: "number", isRequired: true, order: 3 },
                { id: "mrl-reload-time", name: "زمان بارگذاری مجدد", englishName: "Reload Time", type: "number", isRequired: false, order: 4, unit: "min" }
              ]
            }
          ]
        }
      ]
    },
    {
      id: "am-2",
      name: "مهمات ویژه",
      englishName: "Special Ammunition",
      level: 1,
      parentId: null,
      order: 2,
      hasChildren: true,
      children: [
        {
          id: "am-2-1",
          name: "نارنجک‌ها",
          englishName: "Grenades",
          level: 2,
          parentId: "am-2",
          order: 1,
          hasChildren: true,
          children: [
            {
              id: "am-2-1-1",
              name: "نارنجک‌های دستی",
              englishName: "Hand Grenades",
              level: 3,
              parentId: "am-2-1",
              order: 1,
              hasChildren: false,
              customFields: [
                { id: "hg-grenade-name", name: "نام نارنجک", englishName: "Grenade Name", type: "text", isRequired: true, order: 1 },
                { id: "hg-explosive-type", name: "نوع ماده منفجره", englishName: "Explosive Type", type: "select", isRequired: true, order: 2, options: ["TNT", "RDX", "C4"] },
                { id: "hg-fuse-time", name: "زمان فیوز", englishName: "Fuse Time", type: "number", isRequired: true, order: 3, unit: "s" }
              ]
            },
            {
              id: "am-2-1-2",
              name: "نارنجک‌های دودزا",
              englishName: "Smoke Grenades",
              level: 3,
              parentId: "am-2-1",
              order: 2,
              hasChildren: false,
              customFields: [
                { id: "sg-grenade-name", name: "نام نارنجک", englishName: "Grenade Name", type: "text", isRequired: true, order: 1 },
                { id: "sg-smoke-color", name: "رنگ دود", englishName: "Smoke Color", type: "select", isRequired: true, order: 2, options: ["White", "Red", "Green", "Yellow", "Purple"] },
                { id: "sg-duration", name: "مدت زمان دودزایی", englishName: "Smoke Duration", type: "number", isRequired: true, order: 3, unit: "min" },
                { id: "sg-coverage", name: "پوشش دودی", englishName: "Smoke Coverage", type: "number", isRequired: false, order: 4, unit: "m²" }
              ]
            }
          ]
        },
        {
          id: "am-2-2",
          name: "مواد منفجره",
          englishName: "Explosives",
          level: 2,
          parentId: "am-2",
          order: 2,
          hasChildren: true,
          children: [
            {
              id: "am-2-2-1",
              name: "مواد منفجره نظامی",
              englishName: "Military Explosives",
              level: 3,
              parentId: "am-2-2",
              order: 1,
              hasChildren: false,
              customFields: [
                { id: "me-explosive-name", name: "نام ماده منفجره", englishName: "Explosive Name", type: "text", isRequired: true, order: 1 },
                { id: "me-explosive-type", name: "نوع ماده منفجره", englishName: "Explosive Type", type: "select", isRequired: true, order: 2, options: ["C4", "TNT", "RDX", "Semtex", "PETN"] },
                { id: "me-blast-yield", name: "قدرت انفجار", englishName: "Blast Yield", type: "number", isRequired: true, order: 3, unit: "kg TNT equivalent" },
                { id: "me-detonation-method", name: "روش انفجار", englishName: "Detonation Method", type: "select", isRequired: true, order: 4, options: ["Electric", "Remote", "Timer", "Impact", "Manual"] }
              ]
            },
            {
              id: "am-2-2-2",
              name: "مین‌ها",
              englishName: "Mines",
              level: 3,
              parentId: "am-2-2",
              order: 2,
              hasChildren: true,
              children: [
                {
                  id: "am-2-2-2-1",
                  name: "مین‌های ضدپیاده",
                  englishName: "Anti-Personnel Mines",
                  level: 4,
                  parentId: "am-2-2-2",
                  order: 1,
                  hasChildren: false,
                  customFields: [
                    { id: "apm-mine-name", name: "نام مین", englishName: "Mine Name", type: "text", isRequired: true, order: 1 },
                    { id: "apm-trigger-mechanism", name: "مکانیزم فعال‌سازی", englishName: "Trigger Mechanism", type: "select", isRequired: true, order: 2, options: ["Pressure", "Tripwire", "Magnetic", "Acoustic"] },
                    { id: "apm-explosive-content", name: "محتوای مواد منفجره", englishName: "Explosive Content", type: "number", isRequired: true, order: 3, unit: "g" },
                    { id: "apm-detection-method", name: "روش تشخیص", englishName: "Detection Method", type: "select", isRequired: false, order: 4, options: ["Metal Detector", "Ground Penetrating Radar", "Visual", "Trained Dogs"] }
                  ]
                },
                {
                  id: "am-2-2-2-2",
                  name: "مین‌های ضدتانک",
                  englishName: "Anti-Tank Mines",
                  level: 4,
                  parentId: "am-2-2-2",
                  order: 2,
                  hasChildren: false,
                  customFields: [
                    { id: "atm-mine-name", name: "نام مین", englishName: "Mine Name", type: "text", isRequired: true, order: 1 },
                    { id: "atm-activation-weight", name: "وزن فعال‌سازی", englishName: "Activation Weight", type: "number", isRequired: true, order: 2, unit: "kg" },
                    { id: "atm-explosive-content", name: "محتوای مواد منفجره", englishName: "Explosive Content", type: "number", isRequired: true, order: 3, unit: "kg" },
                    { id: "atm-penetration-depth", name: "عمق نفوذ", englishName: "Penetration Depth", type: "number", isRequired: false, order: 4, unit: "mm" }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      id: "am-3",
      name: "مهمات دفاعی",
      englishName: "Defensive Ammunition",
      level: 1,
      parentId: null,
      order: 3,
      hasChildren: true,
      children: [
        {
          id: "am-3-1",
          name: "مهمات ضدهوایی",
          englishName: "Anti-Aircraft Ammunition",
          level: 2,
          parentId: "am-3",
          order: 1,
          hasChildren: true,
          children: [
            {
              id: "am-3-1-1",
              name: "گلوله‌های ضدهوایی",
              englishName: "Anti-Aircraft Bullets",
              level: 3,
              parentId: "am-3-1",
              order: 1,
              hasChildren: false,
              customFields: [
                { id: "aab-bullet-name", name: "نام گلوله", englishName: "Bullet Name", type: "text", isRequired: true, order: 1 },
                { id: "aab-caliber", name: "کالیبر", englishName: "Caliber", type: "select", isRequired: true, order: 2, options: ["20mm", "23mm", "30mm", "35mm", "40mm"] },
                { id: "aab-muzzle-velocity", name: "سرعت دهانه", englishName: "Muzzle Velocity", type: "number", isRequired: true, order: 3, unit: "m/s" },
                { id: "aab-effective-ceiling", name: "سقف مؤثر", englishName: "Effective Ceiling", type: "number", isRequired: true, order: 4, unit: "m" }
              ]
            }
          ]
        },
        {
          id: "am-3-2",
          name: "مهمات الکترونیکی",
          englishName: "Electronic Warfare Ammunition",
          level: 2,
          parentId: "am-3",
          order: 2,
          hasChildren: true,
          children: [
            {
              id: "am-3-2-1",
              name: "مهمات جنگ الکترونیک",
              englishName: "EW Ammunition",
              level: 3,
              parentId: "am-3-2",
              order: 1,
              hasChildren: false,
              customFields: [
                { id: "ew-ammo-name", name: "نام مهمات", englishName: "Ammunition Name", type: "text", isRequired: true, order: 1 },
                { id: "ew-frequency-range", name: "محدوده فرکانس", englishName: "Frequency Range", type: "select", isRequired: true, order: 2, options: ["HF", "VHF", "UHF", "SHF", "EHF"] },
                { id: "ew-jamming-type", name: "نوع مزاحمت", englishName: "Jamming Type", type: "select", isRequired: true, order: 3, options: ["Noise", "Deception", "Spot", "Barrage", "Sweep"] },
                { id: "ew-range", name: "برد مؤثر", englishName: "Effective Range", type: "number", isRequired: false, order: 4, unit: "km" }
              ]
            }
          ]
        }
      ]
    }
  ]
};

export const useAmmunitionHierarchy = (): UseAmmunitionHierarchyReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<AmmunitionPath[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState(Date.now());

  // Flatten nodes for easier access
  const flatNodes = useMemo(() => {
    const flatten = (nodes: any[]): AmmunitionNode[] => {
      let result: AmmunitionNode[] = [];
      for (const node of nodes) {
        result.push({
          ...node,
          hasChildren: node.children && node.children.length > 0
        } as AmmunitionNode);
        if (node.children) {
          result = result.concat(flatten(node.children));
        }
      }
      return result;
    };
    return flatten(ammunitionData.nodes);
  }, []);

  const rootNodes = useMemo(() => {
    return ammunitionData.nodes.map(node => ({
      ...node,
      hasChildren: node.children && node.children.length > 0
    })) as AmmunitionNode[];
  }, []);

  const getCurrentSelection = useMemo(() => {
    if (selectedPath.length === 0) {
      return { finalNode: null, fields: [] };
    }

    const lastPathItem = selectedPath[selectedPath.length - 1];
    const finalNode = flatNodes.find(node => node.id === lastPathItem.nodeId);
    
    return {
      finalNode: finalNode || null,
      fields: finalNode?.customFields || []
    };
  }, [selectedPath, flatNodes]);

  const getOptionsForLevel = useCallback((level: number): AmmunitionNode[] => {
    if (level === 1) {
      return rootNodes;
    }

    const parentPath = selectedPath.find(path => path.level === level - 1);
    if (!parentPath) {
      return [];
    }

    const parentNode = flatNodes.find(node => node.id === parentPath.nodeId);
    if (!parentNode || !parentNode.children) {
      return [];
    }

    return parentNode.children.map(child => ({
      ...child,
      hasChildren: !!(child.children && child.children.length > 0)
    }));
  }, [selectedPath, flatNodes, rootNodes]);

  const addToPath = useCallback((nodeId: string, nodeName: string, level: number) => {
    setSelectedPath(prev => {
      const newPath = prev.filter(item => item.level < level);
      newPath.push({ nodeId, nodeName, level });
      return newPath;
    });
  }, []);

  const clearPathFromLevel = useCallback((level: number) => {
    setSelectedPath(prev => prev.filter(item => item.level < level));
  }, []);

  const resetPath = useCallback(() => {
    setSelectedPath([]);
  }, []);

  const refresh = useCallback(() => {
    setLastSyncTime(Date.now());
  }, []);

  const triggerManualSync = useCallback(() => {
    setLastSyncTime(Date.now());
  }, []);

    return {
      rootNodes,
      loading,
      error,
      selectedPath,
      getCurrentSelection,
      addToPath,
      clearPathFromLevel,
      resetPath,
      getOptionsForLevel,
      refresh,
      triggerManualSync,
      lastSyncTime
    };
};