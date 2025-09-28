import dayjs from './src/dayjs.js';

// Test different month formats
const testDate = dayjs('2022-03-21'); // Nowruz (1 Farvardin)
console.log('Full month (MMMM):', testDate.calendar('jalali').locale('fa').format('MMMM'));
console.log('Short month (MMM):', testDate.calendar('jalali').locale('fa').format('MMM')); 
console.log('Medium month (MM):', testDate.calendar('jalali').locale('fa').format('MM'));
console.log('Full date:', testDate.calendar('jalali').locale('fa').format('dddd DD MMMM YYYY'));
console.log('Short date with MMM:', testDate.calendar('jalali').locale('fa').format('DD MMM YYYY'));

// Test more months
const months = [
  '2022-03-21', // Farvardin
  '2022-04-21', // Ordibehesht
  '2022-05-22', // Khordad
];

months.forEach(date => {
  const d = dayjs(date);
  console.log(`${date} -> MMMM: ${d.calendar('jalali').locale('fa').format('MMMM')}`);
  console.log(`${date} -> MMM: ${d.calendar('jalali').locale('fa').format('MMM')}`);
});