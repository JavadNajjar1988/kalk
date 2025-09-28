import dayjs from 'dayjs';
import jalaliday from 'jalaliday';

dayjs.extend(jalaliday);

// Test different ways to use jalali calendar
const testDate = dayjs('2022-01-01');

console.log('Original date:', testDate.format('YYYY-MM-DD'));
console.log('With fa locale:', testDate.locale('fa').format('YYYY-MM-DD'));
console.log('With calendar jalali:', testDate.calendar('jalali').format('YYYY-MM-DD'));
console.log('With calendar jalali and fa locale:', testDate.calendar('jalali').locale('fa').format('YYYY-MM-DD'));