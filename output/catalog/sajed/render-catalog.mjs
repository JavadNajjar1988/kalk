import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const sharp = require('sharp');

const root = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(root, 'pages');
const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
});
const page = await browser.newPage({ viewport: { width: 1240, height: 1754 }, deviceScaleFactor: 1 });
await page.goto(`file:///${path.join(root, 'catalog.html').replaceAll('\\', '/')}`, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
const pages = page.locator('.page');
const count = await pages.count();
const shots = [];
for (let index = 0; index < count; index += 1) {
  const file = path.join(out, `page-${String(index + 1).padStart(2, '0')}.png`);
  await pages.nth(index).screenshot({ path: file });
  shots.push(file);
}
await browser.close();

const thumbWidth = 310;
const thumbHeight = Math.round(thumbWidth * 1754 / 1240);
const gap = 18;
const cols = 4;
const rows = Math.ceil(shots.length / cols);
const composites = [];
for (let index = 0; index < shots.length; index += 1) {
  const left = gap + (index % cols) * (thumbWidth + gap);
  const top = gap + Math.floor(index / cols) * (thumbHeight + gap);
  const input = await sharp(shots[index]).resize(thumbWidth, thumbHeight).png().toBuffer();
  composites.push({ input, left, top });
}
await sharp({
  create: {
    width: cols * thumbWidth + (cols + 1) * gap,
    height: rows * thumbHeight + (rows + 1) * gap,
    channels: 4,
    background: '#d9d5ca',
  },
}).composite(composites).png().toFile(path.join(root, 'contact-sheet.png'));

console.log(`Rendered ${count} pages to ${out}`);
