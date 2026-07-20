import { CategoryType, CategoryStrategy } from '../types';
import { GeographicalStrategy } from './geographicalStrategy';
import { MilitaryRanksStrategy } from './militaryRanksStrategy';
import { EquipmentStrategy } from './equipmentStrategy';
import { LogisticsStrategy } from './logisticsStrategy';
import { TimeDefinitionsStrategy } from './timeDefinitionsStrategy';
import { PersonsStrategy } from './personsStrategy';

// رجیستری استراتژی‌ها برای دسترسی آسان
const strategyRegistry = new Map<CategoryType, CategoryStrategy>();

// ثبت استراتژی‌های موجود
strategyRegistry.set(CategoryType.GEOGRAPHICAL, new GeographicalStrategy());
strategyRegistry.set(CategoryType.MILITARY_RANKS, new MilitaryRanksStrategy());
strategyRegistry.set(CategoryType.EQUIPMENT, new EquipmentStrategy());
strategyRegistry.set(CategoryType.LOGISTICS_STATUS, new LogisticsStrategy());
strategyRegistry.set(CategoryType.TIME_DEFINITIONS, new TimeDefinitionsStrategy());
strategyRegistry.set(CategoryType.PERSONS, new PersonsStrategy());

// تابع برای دریافت استراتژی بر اساس نوع دسته‌بندی
export function getStrategy(categoryType: CategoryType): CategoryStrategy {
  const strategy = strategyRegistry.get(categoryType);
  if (!strategy) {
    throw new Error(`Strategy not found for category type: ${categoryType}`);
  }
  return strategy;
}

// تابع برای بررسی وجود استراتژی
export function hasStrategy(categoryType: CategoryType): boolean {
  return strategyRegistry.has(categoryType);
}

// تابع برای دریافت لیست تمام استراتژی‌های موجود
export function getAvailableStrategies(): CategoryType[] {
  return Array.from(strategyRegistry.keys());
}

// تابع برای ثبت استراتژی جدید
export function registerStrategy(categoryType: CategoryType, strategy: CategoryStrategy): void {
  strategyRegistry.set(categoryType, strategy);
}

export default strategyRegistry;
