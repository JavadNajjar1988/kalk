// Loader برای لود کردن داده‌ها از JSON

import { DefinitionNode, ExtendedHierarchyLevel, CategoryType } from '../types';
import { validateTreeStructure } from '../utils';

// ساختار داده JSON
interface JsonData {
  nodes: DefinitionNode[];
  levels: ExtendedHierarchyLevel[];
}

// کش داده‌ها
const dataCache = new Map<string, JsonData>();

// تابع کمکی برای لود داده‌ها با اولویت JSON files
async function loadDataWithStorage(
  categoryType: CategoryType,
  categoryId: string,
  jsonFileName: string
): Promise<DefinitionNode[]> {
  const cacheKey = `${categoryType}_${categoryId}`;
  
  // ابتدا از فایل JSON بخوان (منبع اصلی)
  try {
    const mod: any = await import(`../data/json/${jsonFileName}.json`);
    const data = mod.default as unknown as JsonData;
    
    // بعد از بارگذاری موفق از JSON، در کش ذخیره کن
    dataCache.set(cacheKey, data);
    console.log(`Loaded fresh data from ${jsonFileName}.json`);
    return data.nodes;
  } catch (error) {
    console.error(`Error loading ${jsonFileName} data from JSON:`, error);
    
    // اگر JSON در دسترس نبود، از کش بررسی کن
    if (dataCache.has(cacheKey)) {
      console.log(`Fallback: Using cached data for ${cacheKey}`);
      return dataCache.get(cacheKey)!.nodes;
    }
    
    // در آخر از localStorage بررسی کن (فقط به عنوان fallback)
    const storageKey = `definition_editor_${categoryType}_${categoryId}`;
    const storedData = localStorage.getItem(storageKey);
    
    if (storedData) {
      try {
        const data = JSON.parse(storedData) as JsonData;
        dataCache.set(cacheKey, data);
        console.log(`Fallback: Loaded data from localStorage for ${storageKey}`);
        return data.nodes;
      } catch (parseError) {
        console.error('Error parsing stored data:', parseError);
      }
    }
    
    // اگر هیچ منبعی در دسترس نبود، آرایه خالی برگردان
    console.warn(`No data source available for ${categoryType}_${categoryId}`);
    return [];
  }
}

// لود داده‌های جغرافیایی
export async function loadGeographicalData(categoryId: string): Promise<DefinitionNode[]> {
  return loadDataWithStorage(CategoryType.GEOGRAPHICAL, categoryId, 'geographical');
}

// لود داده‌های درجات نظامی
export async function loadMilitaryRanksData(categoryId: string): Promise<DefinitionNode[]> {
  return loadDataWithStorage(CategoryType.MILITARY_RANKS, categoryId, 'military_ranks');
}

// لود داده‌های زمان
export async function loadTimeDefinitionsData(categoryId: string): Promise<DefinitionNode[]> {
  return loadDataWithStorage(CategoryType.TIME_DEFINITIONS, categoryId, 'time_definitions');
}

// لود داده‌های تجهیزات
export async function loadEquipmentData(categoryId: string): Promise<DefinitionNode[]> {
  return loadDataWithStorage(CategoryType.EQUIPMENT, categoryId, 'equipment');
}

// لود داده‌های لجستیک (وضعیت لجستیکی)
export async function loadLogisticsData(categoryId: string): Promise<DefinitionNode[]> {
  return loadDataWithStorage(CategoryType.LOGISTICS_STATUS, categoryId, 'logistics_status');
}

// لود داده‌های تدارکات (logistics)
export async function loadLogisticsSupplyData(categoryId: string): Promise<DefinitionNode[]> {
  return loadDataWithStorage(CategoryType.LOGISTICS_STATUS, categoryId, 'logistics');
}

// لود داده‌های ساختار رده‌های نظامی
export async function loadMilitaryUnitsData(categoryId: string): Promise<DefinitionNode[]> {
  return loadDataWithStorage(CategoryType.MILITARY_UNITS, categoryId, 'military_units');
}

// لود داده‌های نوع مأموریت
export async function loadMissionTypeData(categoryId: string): Promise<DefinitionNode[]> {
  return loadDataWithStorage(CategoryType.MISSION_TYPE, categoryId, 'mission_type');
}

// لود داده‌های وضعیت عملیاتی
export async function loadOperationalStatusData(categoryId: string): Promise<DefinitionNode[]> {
  return loadDataWithStorage(CategoryType.OPERATIONAL_STATUS, categoryId, 'operational_status');
}

// لود داده‌های محیط عملیاتی
export async function loadOperationalEnvironmentData(categoryId: string): Promise<DefinitionNode[]> {
  return loadDataWithStorage(CategoryType.OPERATIONAL_ENVIRONMENT, categoryId, 'operational_environment');
}

// لود داده‌های تعاریف فنی و کدگذاری
export async function loadCodingClassificationData(categoryId: string): Promise<DefinitionNode[]> {
  return loadDataWithStorage(CategoryType.CODING_CLASSIFICATION, categoryId, 'coding_classification');
}

// لود داده‌های نوع واحد نظامی
export async function loadMilitaryUnitTypeData(categoryId: string): Promise<DefinitionNode[]> {
  return loadDataWithStorage(CategoryType.FORCE_TYPE, categoryId, 'military_unit_type');
}

// لود داده‌های وابستگی سازمانی
export async function loadOrganizationalAffiliationData(categoryId: string): Promise<DefinitionNode[]> {
  return loadDataWithStorage(CategoryType.ORGANIZATIONAL_AFFILIATION, categoryId, 'organizational_affiliation');
}

// لود داده‌های نوع تهدید
export async function loadThreatTypeData(categoryId: string): Promise<DefinitionNode[]> {
  return loadDataWithStorage(CategoryType.THREAT_TYPE, categoryId, 'threat_type');
}

// لود داده‌های سطح طبقه‌بندی اطلاعات
export async function loadInfoClassificationData(categoryId: string): Promise<DefinitionNode[]> {
  return loadDataWithStorage(CategoryType.INFO_CLASSIFICATION, categoryId, 'info_classification');
}

// لود داده‌های مهمات
export async function loadAmmunitionData(categoryId: string): Promise<DefinitionNode[]> {
  return loadDataWithStorage(CategoryType.AMMUNITION, categoryId, 'ammunition');
}

// لود داده‌های آب و هوا
export async function loadWeatherData(categoryId: string): Promise<DefinitionNode[]> {
  return loadDataWithStorage(CategoryType.WEATHER, categoryId, 'weather');
}

// لود داده‌های اشخاص
export async function loadPersonsData(categoryId: string): Promise<DefinitionNode[]> {
  return loadDataWithStorage(CategoryType.PERSONS, categoryId, 'persons');
}

// لود سطوح بر اساس نوع دسته‌بندی
export async function loadCategoryLevels(categoryType: CategoryType): Promise<ExtendedHierarchyLevel[]> {
  const cacheKey = `levels_${categoryType}`;
  if (dataCache.has(cacheKey)) {
    return dataCache.get(cacheKey)!.levels;
  }
  try {
    let importer: Promise<any>;
    switch (categoryType) {
      case CategoryType.GEOGRAPHICAL:
        importer = import('../data/json/geographical.json');
        break;
      case CategoryType.MILITARY_RANKS:
        importer = import('../data/json/military_ranks.json');
        break;
      case CategoryType.MILITARY_UNITS:
        importer = import('../data/json/military_units.json');
        break;
      case CategoryType.EQUIPMENT:
        importer = import('../data/json/equipment.json');
        break;
      case CategoryType.MISSION_TYPE:
        importer = import('../data/json/mission_type.json');
        break;
      case CategoryType.OPERATIONAL_STATUS:
        importer = import('../data/json/operational_status.json');
        break;
      case CategoryType.OPERATIONAL_ENVIRONMENT:
        importer = import('../data/json/operational_environment.json');
        break;
      case CategoryType.TIME_DEFINITIONS:
        importer = import('../data/json/time_definitions.json');
        break;
      case CategoryType.CODING_CLASSIFICATION:
        importer = import('../data/json/coding_classification.json');
        break;
      case CategoryType.FORCE_TYPE:
        importer = import('../data/json/military_unit_type.json');
        break;
      case CategoryType.ORGANIZATIONAL_AFFILIATION:
        importer = import('../data/json/organizational_affiliation.json');
        break;
      case CategoryType.THREAT_TYPE:
        importer = import('../data/json/threat_type.json');
        break;
      case CategoryType.INFO_CLASSIFICATION:
        importer = import('../data/json/info_classification.json');
        break;
      case CategoryType.LOGISTICS_STATUS:
        importer = import('../data/json/logistics_status.json');
        break;
      case CategoryType.LOGISTICS:
        importer = import('../data/json/logistics.json');
        break;
      case CategoryType.AMMUNITION:
        importer = import('../data/json/ammunition.json');
        break;
      case CategoryType.WEATHER:
        importer = import('../data/json/weather.json');
        break;
      case CategoryType.PERSONS:
        importer = import('../data/json/persons.json');
        break;
      default:
        console.warn(`No specific level loader for category type: ${categoryType}. Using geographical.json as fallback.`);
        importer = import('../data/json/geographical.json');
    }
    const mod: any = await importer;
    const data = mod.default as unknown as JsonData;
    dataCache.set(cacheKey, data);
    return data.levels || [];
  } catch (error) {
    console.error('Error loading category levels:', error);
    return [];
  }
}

// تابع خاص برای لود سطوح لجستیک
export async function loadLogisticsStatusLevels(): Promise<ExtendedHierarchyLevel[]> {
  return loadCategoryLevels(CategoryType.LOGISTICS_STATUS);
}

// لود داده‌های نود بر اساس نوع دسته‌بندی
export async function loadCategoryNodes(categoryType: CategoryType, categoryId: string): Promise<DefinitionNode[]> {
  switch (categoryType) {
    case CategoryType.GEOGRAPHICAL:
      return loadGeographicalData(categoryId);
    case CategoryType.MILITARY_RANKS:
      return loadMilitaryRanksData(categoryId);
    case CategoryType.MILITARY_UNITS:
      return loadMilitaryUnitsData(categoryId);
    case CategoryType.EQUIPMENT:
      return loadEquipmentData(categoryId);
    case CategoryType.MISSION_TYPE:
      return loadMissionTypeData(categoryId);
    case CategoryType.OPERATIONAL_STATUS:
      return loadOperationalStatusData(categoryId);
    case CategoryType.OPERATIONAL_ENVIRONMENT:
      return loadOperationalEnvironmentData(categoryId);
    case CategoryType.TIME_DEFINITIONS:
      return loadTimeDefinitionsData(categoryId);
    case CategoryType.CODING_CLASSIFICATION:
      return loadCodingClassificationData(categoryId);
    case CategoryType.FORCE_TYPE:
      return loadMilitaryUnitTypeData(categoryId);
    case CategoryType.ORGANIZATIONAL_AFFILIATION:
      return loadOrganizationalAffiliationData(categoryId);
    case CategoryType.THREAT_TYPE:
      return loadThreatTypeData(categoryId);
    case CategoryType.INFO_CLASSIFICATION:
      return loadInfoClassificationData(categoryId);
    case CategoryType.LOGISTICS_STATUS:
      return loadLogisticsData(categoryId);
    case CategoryType.LOGISTICS:
      return loadLogisticsSupplyData(categoryId);
    case CategoryType.AMMUNITION:
      return loadAmmunitionData(categoryId);
    case CategoryType.WEATHER:
      return loadWeatherData(categoryId);
    case CategoryType.PERSONS:
      return loadPersonsData(categoryId);
    default:
      console.warn(`No specific loader for category type: ${categoryType}. Returning empty array.`);
      return [];
  }
}

// ذخیره داده‌های نود در JSON
export async function saveCategoryNodes(
  categoryType: CategoryType, 
  categoryId: string, 
  nodes: DefinitionNode[]
): Promise<boolean> {
  try {
    console.log('Saving nodes for category:', categoryType, categoryId, nodes);
    
    // ذخیره در کش
    const cacheKey = `${categoryType}_${categoryId}`;
    const existingData = dataCache.get(cacheKey) || { nodes: [], levels: [] };
    existingData.nodes = nodes;
    dataCache.set(cacheKey, existingData);
    
    // ذخیره در فایل JSON (برای توسعه - در تولید باید API باشد)
    const jsonData = { nodes };
    const jsonString = JSON.stringify(jsonData, null, 2);
    
    // در محیط توسعه، می‌توانیم از localStorage استفاده کنیم
    // در تولید، اینجا باید API call باشد
    const storageKey = `definition_editor_${categoryType}_${categoryId}`;
    localStorage.setItem(storageKey, jsonString);
    
    console.log(`Data saved to localStorage with key: ${storageKey}`);
    
    return true;
  } catch (error) {
    console.error('Error saving category nodes:', error);
    return false;
  }
}

// ذخیره سطوح (برای آینده - اتصال به API)
export async function saveCategoryLevels(
  categoryType: CategoryType, 
  levels: ExtendedHierarchyLevel[]
): Promise<boolean> {
  try {
    // در آینده اینجا API call خواهد بود
    console.log('Saving levels for category:', categoryType, levels);
    
    // فعلاً فقط در کش ذخیره می‌کنیم
    const cacheKey = `levels_${categoryType}`;
    const existingData = dataCache.get(cacheKey) || { nodes: [], levels: [] };
    existingData.levels = levels;
    dataCache.set(cacheKey, existingData);
    
    return true;
  } catch (error) {
    console.error('Error saving category levels:', error);
    return false;
  }
}

// پاک کردن کش
export function clearCache(): void {
  dataCache.clear();
}

// پاک کردن کش برای یک دسته‌بندی خاص
export function clearCategoryCache(categoryType: CategoryType, categoryId?: string): void {
  if (categoryId) {
    dataCache.delete(`${categoryType}_${categoryId}`);
  } else {
    // پاک کردن تمام کش‌های مربوط به این نوع دسته‌بندی
    for (const key of dataCache.keys()) {
      if (key.startsWith(categoryType)) {
        dataCache.delete(key);
      }
    }
  }
}

// Export داده‌ها به JSON برای استفاده در API
export function exportCategoryDataToJSON(categoryType: CategoryType, categoryId: string): string | null {
  try {
    const storageKey = `definition_editor_${categoryType}_${categoryId}`;
    const storedData = localStorage.getItem(storageKey);
    
    if (storedData) {
      return storedData;
    }
    
    // اگر در localStorage نبود، از کش بخوان
    const cacheKey = `${categoryType}_${categoryId}`;
    const cachedData = dataCache.get(cacheKey);
    
    if (cachedData) {
      return JSON.stringify(cachedData, null, 2);
    }
    
    return null;
  } catch (error) {
    console.error('Error exporting category data:', error);
    return null;
  }
}

// Export همه داده‌ها به JSON
export function exportAllDataToJSON(): Record<string, string> {
  const allData: Record<string, string> = {};
  
  try {
    // بررسی همه کلیدهای localStorage که با definition_editor شروع می‌شوند
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('definition_editor_')) {
        const data = localStorage.getItem(key);
        if (data) {
          allData[key] = data;
        }
      }
    }
    
    return allData;
  } catch (error) {
    console.error('Error exporting all data:', error);
    return {};
  }
}

// Import داده‌ها از JSON
export function importCategoryDataFromJSON(categoryType: CategoryType, categoryId: string, jsonData: string): boolean {
  try {
    const parsedData = JSON.parse(jsonData);
    const storageKey = `definition_editor_${categoryType}_${categoryId}`;
    
    localStorage.setItem(storageKey, jsonData);
    
    // به‌روزرسانی کش
    const cacheKey = `${categoryType}_${categoryId}`;
    dataCache.set(cacheKey, parsedData);
    
    console.log(`Data imported for ${categoryType}_${categoryId}`);
    return true;
  } catch (error) {
    console.error('Error importing category data:', error);
    return false;
  }
}
