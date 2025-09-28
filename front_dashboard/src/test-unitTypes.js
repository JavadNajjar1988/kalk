/* eslint-disable no-undef */
// فایل تست موقت برای بررسی تغییرات unitTypes
const { UNIT_CATEGORIES, UNIT_SUBCATEGORIES, ALL_UNIT_TYPES } = require('./config/unitTypes.js');

console.log('=== UNIT_CATEGORIES ===');
console.log(UNIT_CATEGORIES);

console.log('\n=== UNIT_SUBCATEGORIES ===');
console.log(UNIT_SUBCATEGORIES);

console.log('\n=== تعداد کل یگان‌ها ===');
console.log(ALL_UNIT_TYPES.length);

console.log('\n=== نمونه یگان‌ها ===');
ALL_UNIT_TYPES.slice(0, 3).forEach(unit => {
  console.log(`${unit.name} - ${unit.category} - ${unit.subcategory}`);
});

module.exports = {}; 