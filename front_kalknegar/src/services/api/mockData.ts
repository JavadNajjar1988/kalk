import type { Scenario } from '@/types/scenarioModels';
import { nanoid } from '@/utils';

// Mock scenarios data
export const mockScenarios: Scenario[] = [
  {
    id: 'scenario-1',
    type: 'ORBAT-mapper',
    version: '0.40.0',
    name: 'عملیات دفاعی در ارتفاعات شمالی',
    description: 'سناریوی دفاعی برای مقابله با نیروهای دشمن در ارتفاعات شمالی',
    startTime: new Date('2023-10-15T08:00:00Z').getTime(),
    timeZone: 'Asia/Tehran',
    symbologyStandard: '2525',
    meta: {
      createdDate: '2023-09-01T10:30:00Z',
      lastModifiedDate: '2023-10-10T14:45:00Z',
    },
    sides: [],
    events: [],
    layers: [
      {
        id: nanoid(),
        name: 'Features',
        features: []
      }
    ],
    mapLayers: [],
    equipment: [],
    personnel: [],
    supplyCategories: [],
    settings: {
      rangeRingGroups: [],
      statuses: [],
      supplyClasses: [
        { name: 'Class I' },
        { name: 'Class II' },
        { name: 'Class III' },
        { name: 'Class IV' },
        { name: 'Class V' },
      ],
      supplyUoMs: [
        { name: 'Kilogram', code: 'KG', type: 'weight' },
        { name: 'Liter', code: 'LI', type: 'volume' },
        { name: 'Each', code: 'EA', type: 'quantity' },
        { name: 'Meter', code: 'MR', type: 'distance' },
        { name: 'Gallon', code: 'GL', type: 'volume' },
      ],
      map: { baseMapId: 'default' },
    },
  },
  {
    id: 'scenario-2',
    type: 'ORBAT-mapper',
    version: '0.40.0',
    name: 'عملیات آفندی مناطق شهری',
    description: 'سناریوی حمله به مواضع دشمن در مناطق شهری',
    startTime: new Date('2023-11-05T06:00:00Z').getTime(),
    timeZone: 'Asia/Tehran',
    symbologyStandard: '2525',
    meta: {
      createdDate: '2023-10-15T08:20:00Z',
      lastModifiedDate: '2023-10-20T11:35:00Z',
    },
    sides: [],
    events: [],
    layers: [
      {
        id: nanoid(),
        name: 'Features',
        features: []
      }
    ],
    mapLayers: [],
    equipment: [],
    personnel: [],
    supplyCategories: [],
    settings: {
      rangeRingGroups: [],
      statuses: [],
      supplyClasses: [
        { name: 'Class I' },
        { name: 'Class II' },
        { name: 'Class III' },
        { name: 'Class IV' },
        { name: 'Class V' },
      ],
      supplyUoMs: [
        { name: 'Kilogram', code: 'KG', type: 'weight' },
        { name: 'Liter', code: 'LI', type: 'volume' },
        { name: 'Each', code: 'EA', type: 'quantity' },
        { name: 'Meter', code: 'MR', type: 'distance' },
        { name: 'Gallon', code: 'GL', type: 'volume' },
      ],
      map: { baseMapId: 'default' },
    },
  },
  {
    id: 'scenario-3',
    type: 'ORBAT-mapper',
    version: '0.40.0',
    name: 'رزمایش مشترک دریایی و هوایی',
    description: 'رزمایش مشترک نیروهای دریایی و هوایی در منطقه خلیج',
    startTime: new Date('2023-12-01T07:30:00Z').getTime(),
    timeZone: 'Asia/Tehran',
    symbologyStandard: '2525',
    meta: {
      createdDate: '2023-11-01T09:45:00Z',
      lastModifiedDate: '2023-11-05T13:20:00Z',
    },
    sides: [],
    events: [],
    layers: [
      {
        id: nanoid(),
        name: 'Features',
        features: []
      }
    ],
    mapLayers: [],
    equipment: [],
    personnel: [],
    supplyCategories: [],
    settings: {
      rangeRingGroups: [],
      statuses: [],
      supplyClasses: [
        { name: 'Class I' },
        { name: 'Class II' },
        { name: 'Class III' },
        { name: 'Class IV' },
        { name: 'Class V' },
      ],
      supplyUoMs: [
        { name: 'Kilogram', code: 'KG', type: 'weight' },
        { name: 'Liter', code: 'LI', type: 'volume' },
        { name: 'Each', code: 'EA', type: 'quantity' },
        { name: 'Meter', code: 'MR', type: 'distance' },
        { name: 'Gallon', code: 'GL', type: 'volume' },
      ],
      map: { baseMapId: 'default' },
    },
  },
];

// Mock delay function
export const MOCK_API_DELAY = 500;

export function delay(ms: number = MOCK_API_DELAY): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Mock scenario metadata
export const mockScenarioMetadata = mockScenarios.map(scenario => ({
  id: scenario.id,
  name: scenario.name,
  description: scenario.description || '',
  created: scenario.meta?.createdDate || new Date().toISOString(),
  modified: scenario.meta?.lastModifiedDate || new Date().toISOString(),
  size: JSON.stringify(scenario).length,
  version: scenario.version,
}));
