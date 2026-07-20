// Test script to demonstrate data mapping for Reference Fields
// This shows exactly where each section gets its data from JSON files

import militaryRanksData from '../modules/definition-editor/data/json/military_ranks.json';
import geographicalData from '../modules/definition-editor/data/json/geographical.json';

// Function to extract hierarchy items (levels management)
const extractHierarchyItems = (data: any) => {
  if (data.levels && Array.isArray(data.levels)) {
    return data.levels.map((level: any) => ({
      id: level.id,
      name: level.name,
      englishName: level.englishName,
      description: level.description || `Level ${level.order}: ${level.name}`,
      level: level.order,
      type: 'hierarchy',
      // Additional properties from levels
      isRequired: level.isRequired,
      isActive: level.isActive,
      icon: level.icon,
      natoRank: level.natoRank,
      standardCode: level.standardCode,
      personnelRange: level.personnelRange,
      specialty: level.specialty,
      order: level.order
    }));
  }
  return [];
};

// Function to flatten nodes recursively
const flattenNodes = (nodes: any[]) => {
  const items: any[] = [];
  
  for (const node of nodes) {
    const item = {
      id: node.id,
      name: node.name,
      englishName: node.englishName,
      description: node.description,
      level: node.level,
      parentId: node.parentId,
      type: 'data',
      // Additional properties
      country: node.country,
      natoEquivalent: node.natoEquivalent,
      icon: node.icon,
      coordinates: node.coordinates
    };
    
    // Remove undefined properties
    Object.keys(item).forEach(key => {
      if (item[key] === undefined) {
        delete item[key];
      }
    });
    
    items.push(item);
    
    // Recursively process children
    if (node.children && Array.isArray(node.children)) {
      const childItems = flattenNodes(node.children);
      items.push(...childItems);
    }
  }
  
  return items;
};

// Function to extract data items (actual data)
const extractDataItems = (data: any) => {
  if (!data.nodes || !Array.isArray(data.nodes)) {
    return [];
  }
  return flattenNodes(data.nodes);
};

console.log('=== MILITARY RANKS CATEGORY ===');
console.log('Hierarchy Management (مديريت سطوح سلسله مراتبى) - from "levels" array:');
const militaryHierarchy = extractHierarchyItems(militaryRanksData);
console.log(`Found ${militaryHierarchy.length} hierarchy levels:`);
militaryHierarchy.forEach((item, index) => {
  console.log(`${index + 1}. ${item.name} (${item.englishName}) - Level ${item.level}`);
});

console.log('\nData Management (مديريت دادهها) - from "nodes" array:');
const militaryData = extractDataItems(militaryRanksData);
console.log(`Found ${militaryData.length} rank data items:`);
militaryData.slice(0, 10).forEach((item, index) => {
  console.log(`${index + 1}. ${item.name} - Level ${item.level} - NATO: ${item.natoEquivalent}`);
});

console.log('\n=== GEOGRAPHICAL CATEGORY ===');
console.log('Hierarchy Management (مديريت سطوح سلسله مراتبى) - from "levels" array:');
const geoHierarchy = extractHierarchyItems(geographicalData);
console.log(`Found ${geoHierarchy.length} hierarchy levels:`);
geoHierarchy.forEach((item, index) => {
  console.log(`${index + 1}. ${item.name} (${item.englishName}) - Level ${item.level}`);
});

console.log('\nData Management (مديريت دادهها) - from "nodes" array:');
const geoData = extractDataItems(geographicalData);
console.log(`Found ${geoData.length} geographical data items:`);
geoData.slice(0, 10).forEach((item, index) => {
  console.log(`${index + 1}. ${item.name} - Level ${item.level} - Coordinates: ${item.coordinates ? `${item.coordinates.lat}, ${item.coordinates.lng}` : 'N/A'}`);
});

export { extractHierarchyItems, extractDataItems };