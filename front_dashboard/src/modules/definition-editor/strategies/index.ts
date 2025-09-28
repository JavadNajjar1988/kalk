// Export base strategy
export { BaseStrategy } from './baseStrategy';

// Export concrete strategies
export { GeographicalStrategy } from './geographicalStrategy';
export { MilitaryRanksStrategy } from './militaryRanksStrategy';
export { default as EquipmentStrategy } from './equipmentStrategy';
export { default as LogisticsStrategy } from './logisticsStrategy';
export { default as TimeDefinitionsStrategy } from './timeDefinitionsStrategy';
export { default as PersonsStrategy } from './personsStrategy';

// Export strategy registry functions
export { getStrategy, hasStrategy, getAvailableStrategies, registerStrategy } from './strategyRegistry';
