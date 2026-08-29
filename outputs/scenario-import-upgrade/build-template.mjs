import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "file:///C:/Users/AI/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs";
import sharp from "sharp";
import ms from "file:///C:/Users/AI/Documents/GitHub/kalk/front_kalknegar/node_modules/milsymbol/index.js";

const sourcePath = "C:/Users/AI/Documents/GitHub/kalk/outputs/scenario-import-upgrade/scenario_import_template_v2.xlsx";
const outputDir = "C:/Users/AI/Documents/GitHub/kalk/outputs/scenario-import-upgrade";
const previewDir = `${outputDir}/main-orbat-preview`;
const outputPath = `${outputDir}/scenario_import_template_graphic_fa_main_orbat.xlsx`;
await fs.mkdir(previewDir, { recursive: true });

const input = await FileBlob.load(sourcePath);
const workbook = await SpreadsheetFile.importXlsx(input);

function getSheet(name) {
  return workbook.worksheets.items.find((sheet) => sheet.name === name);
}

function readRows(sheet) {
  const values = sheet.getUsedRange(true)?.values || [];
  const headers = (values[0] || []).map((value) => String(value ?? "").trim());
  return values.slice(1)
    .filter((row) => row.some((value) => value !== null && String(value ?? "").trim() !== ""))
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? null])));
}

function toDate(value) {
  if (!value && value !== 0) return null;
  if (value instanceof Date) return value;
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 1000 && numeric < 100000) {
    return new Date((numeric - 25569) * 86400000);
  }
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.valueOf()) ? null : parsed;
}

const div = (a, b) => Math.trunc(a / b);
const mod = (a, b) => a - Math.trunc(a / b) * b;
const protectLongDigits = (value) => {
  const text = String(value ?? "");
  return text.length > 2 ? `${text.slice(0, 2)}‌${text.slice(2)}` : text;
};

const symbolCatalog = [
  { name: "پیاده‌نظام", code: "121100", use: "یگان‌های پیاده" },
  { name: "پیاده‌نظام مکانیزه", code: "121102", use: "پیاده مجهز به نفربر یا خودروی رزمی" },
  { name: "شناسایی", code: "121300", use: "یگان‌های شناسایی" },
  { name: "توپخانه", code: "130300", use: "توپخانه صحرایی و آتش پشتیبانی" },
  { name: "زرهی", code: "120500", use: "یگان‌های تانک و زرهی" },
  { name: "پشتیبانی خدمات رزمی", code: "160600", use: "تدارکات و پشتیبانی" },
  { name: "پدافند هوایی", code: "130100", use: "یگان‌های پدافند هوایی" },
  { name: "مهندسی رزمی", code: "140700", use: "یگان‌های مهندسی رزمی" },
];
const mainEchelons = [
  { name: "ارتش", code: "23", parent: "ریشه آرایش نبرد" },
  { name: "سپاه", code: "22", parent: "ارتش یا ریشه" },
  { name: "لشکر", code: "21", parent: "سپاه، ارتش یا ریشه" },
  { name: "تیپ", code: "18", parent: "لشکر یا سپاه" },
  { name: "هنگ / گروه", code: "17", parent: "تیپ یا لشکر" },
  { name: "گردان / اسکادران", code: "16", parent: "تیپ یا هنگ" },
  { name: "گروهان / آتشبار", code: "15", parent: "گردان" },
  { name: "دسته / جزء مستقل", code: "14", parent: "گروهان یا گردان" },
  { name: "نامشخص", code: "00", parent: "برای مواردی که رده هنوز معلوم نیست" },
];
const symbolStatuses = ["حاضر", "برنامه‌ریزی‌شده", "آسیب‌دیده", "نابودشده"];
const knownMainIcons = new Set(symbolCatalog.map((item) => item.code));
const cleanSidc = (value) => String(value ?? "").replace(/[‌\s']/g, "");
const sidcForCatalog = (mainIcon) => `1003100016${mainIcon}0000`;
const sidcForEchelon = (side, echelonCode) => `100${side}1000${echelonCode}1211000000`;

async function symbolPngDataUrl(sidc) {
  const svg = new ms.Symbol(sidc, { size: 52 }).asSVG();
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}

function jalaliToGregorian(jy, jm, jd) {
  jy += 1595;
  let days = -355668 + 365 * jy + div(jy, 33) * 8 + div(mod(jy, 33) + 3, 4) + jd;
  days += jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186;
  let gy = 400 * div(days, 146097);
  days = mod(days, 146097);
  if (days > 36524) {
    days -= 1;
    gy += 100 * div(days, 36524);
    days = mod(days, 36524);
    if (days >= 365) days += 1;
  }
  gy += 4 * div(days, 1461);
  days = mod(days, 1461);
  if (days > 365) {
    gy += div(days - 1, 365);
    days = mod(days - 1, 365);
  }
  let gd = days + 1;
  const leap = gy % 4 === 0 && (gy % 100 !== 0 || gy % 400 === 0);
  const monthDays = [0, 31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 1;
  while (gm <= 12 && gd > monthDays[gm]) {
    gd -= monthDays[gm];
    gm += 1;
  }
  return [gy, gm, gd];
}

function persianDateParts(date, timeZone = "Asia/Tehran") {
  const formatter = new Intl.DateTimeFormat("en-US-u-ca-persian-nu-latn", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
}

const scenarioRows = readRows(getSheet("سناریو"));
const eventRows = readRows(getSheet("حوادث"));
const unitRows = readRows(getSheet("یگان‌ها"));
const equipmentRows = readRows(getSheet("تجهیزات"));
const personnelRows = readRows(getSheet("پرسنل"));
const featureRows = readRows(getSheet("عوارض"));
const defaultTimeZone = String(scenarioRows[0]?.time_zone || "Asia/Tehran");

const timeEntries = [];
const timeKeyToId = new Map();
function registerTime(value, timeZone = defaultTimeZone) {
  const parsedDate = toDate(value);
  const date = parsedDate ? new Date(Math.round(parsedDate.valueOf() / 60000) * 60000) : null;
  if (!date) return "";
  const key = `${date.toISOString()}|${timeZone}`;
  if (timeKeyToId.has(key)) return timeKeyToId.get(key);
  const id = `زمان-${String(timeEntries.length + 1).padStart(3, "0")}`;
  const parts = persianDateParts(date, timeZone);
  timeEntries.push([id, parts.year, parts.month, parts.day, parts.hour, parts.minute, timeZone]);
  timeKeyToId.set(key, id);
  return id;
}

for (const row of scenarioRows) registerTime(row.start_time, row.time_zone || defaultTimeZone);
for (const row of eventRows) {
  registerTime(row.start_time);
  registerTime(row.end_time);
}
for (const row of unitRows) registerTime(row.time);
for (const row of equipmentRows) registerTime(row.start_time);
for (const row of featureRows) {
  registerTime(row.start_time);
  registerTime(row.end_time);
}
if (timeEntries.length === 0) registerTime(new Date("2026-08-29T08:00:00+03:30"));

function replaceSheet(name, headers, rows) {
  let sheet = getSheet(name);
  if (!sheet) sheet = workbook.worksheets.add(name);
  const used = sheet.getUsedRange(true);
  if (used) used.clear({ applyTo: "all" });
  headers.forEach((header, index) => {
    if (["نماد", "کد_نماد_پیشرفته", "کد_ملی"].includes(header)) {
      sheet.getRangeByIndexes(1, index, 500, 1).format.numberFormat = "@";
    }
  });
  const values = [headers, ...rows];
  sheet.getRangeByIndexes(0, 0, values.length, headers.length).values = values;
  return sheet;
}

const scenarioData = scenarioRows.map((row) => [
  row.name, row.description, registerTime(row.start_time, row.time_zone || defaultTimeZone),
  row.time_zone || defaultTimeZone, row.symbology_standard || "app6",
]);
const eventData = eventRows.map((row, index) => [
  row.id, row.title, row.subtitle, registerTime(row.start_time), registerTime(row.end_time), row.side,
  row.unit_ids || (index === 0 ? "d2" : ""), row.equipment_ids || (index === 0 ? "eq1" : ""), row.lon, row.lat,
]);
const unitData = [
  ["u1", "لشکر ۱۶", "خودی", "لشکر", "پیاده‌نظام", "", "حاضر", "", "", "", ""],
  ["u2", "تیپ ۱", "خودی", "تیپ", "پیاده‌نظام مکانیزه", "u1", "حاضر", "", "", "", ""],
  ["u3", "گردان ۲۳۲", "خودی", "گردان / اسکادران", "زرهی", "u2", "حاضر", timeEntries[0][0], 48.05, 31.61, ""],
  ["d1", "لشکر ۵", "دشمن", "لشکر", "زرهی", "", "حاضر", "", "", "", ""],
  ["d2", "تیپ ۱۲", "دشمن", "تیپ", "پیاده‌نظام", "d1", "حاضر", timeEntries[0][0], 48.1531212, 31.6395122, ""],
];
const equipmentData = equipmentRows.map((row, index) => [
  row.id, row.name, row.type, row.quantity || 1, index === 0 ? "d2" : (row.unit_id || ""), registerTime(row.start_time), row.lon, row.lat,
]);
const personnelData = personnelRows.map((row, index) => [
  row.id, row.first_name, row.last_name, row.rank, row.specialty,
  row.national_id ? protectLongDigits(row.national_id) : "", index === 0 ? "u3" : (row.unit_id || ""),
]);
const featureData = featureRows.length > 0
  ? featureRows.map((row) => [
      row.id, row.name, row.type, row.lon, row.lat, row.radius_m,
      registerTime(row.start_time), registerTime(row.end_time), row.event_id,
    ])
  : [["عارضه-نمونه-۱", "شهر نمونه؛ پیش از ورود ویرایش شود", "شهر", 48.1, 31.6, 3000, timeEntries[0][0], "", "ev-1"]];

replaceSheet("سناریو", ["نام", "توضیحات", "شناسه_زمان_شروع", "ناحیه_زمانی", "استاندارد_نماد"], scenarioData);
replaceSheet("حوادث", ["شناسه", "عنوان", "زیرعنوان", "شناسه_زمان_شروع", "شناسه_زمان_پایان", "طرف", "شناسه_یگان", "شناسه_تجهیزات", "طول_جغرافیایی", "عرض_جغرافیایی"], eventData);
replaceSheet("یگان‌ها", ["شناسه", "نام", "طرف", "رده_یگان", "نوع_نماد", "شناسه_والد", "وضعیت_نماد", "شناسه_زمان", "طول", "عرض", "کد_نماد_پیشرفته"], unitData);
replaceSheet("تجهیزات", ["شناسه", "نام", "نوع", "تعداد", "شناسه_یگان", "شناسه_زمان_شروع", "طول", "عرض"], equipmentData);
replaceSheet("پرسنل", ["شناسه", "نام", "نام_خانوادگی", "درجه", "تخصص", "کد_ملی", "شناسه_یگان"], personnelData);
replaceSheet("عوارض", ["شناسه", "نام", "نوع", "طول", "عرض", "شعاع_متر", "شناسه_زمان_شروع", "شناسه_زمان_پایان", "شناسه_رویداد"], featureData);

const timingSheet = replaceSheet(
  "زمان‌بندی",
  ["شناسه_زمان", "سال_شمسی", "ماه_شمسی", "روز_شمسی", "ساعت", "دقیقه", "ناحیه_زمانی", "تاریخ_و_ساعت_میلادی"],
  timeEntries.map((entry) => [...entry, null]),
);

let listsSheet = getSheet("فهرست‌های انتخاب");
if (!listsSheet) listsSheet = workbook.worksheets.add("فهرست‌های انتخاب");
const existingLists = listsSheet.getUsedRange(true);
if (existingLists) existingLists.clear({ applyTo: "all" });

const years = Array.from({ length: 81 }, (_, index) => 1350 + index);
const months = Array.from({ length: 12 }, (_, index) => index + 1);
const days = Array.from({ length: 31 }, (_, index) => index + 1);
const hours = Array.from({ length: 24 }, (_, index) => index);
const minutes = Array.from({ length: 60 }, (_, index) => index);
const zones = ["Asia/Tehran", "UTC", "Asia/Baghdad", "Asia/Kabul", "Asia/Dubai"];
listsSheet.getRange("A1:I1").values = [["سال", "ماه", "روز", "ساعت", "دقیقه", "ناحیه_زمانی", "نوع_نماد", "رده_یگان", "وضعیت_نماد"]];
listsSheet.getRange("A2:A82").values = years.map((value) => [value]);
listsSheet.getRange("B2:B13").values = months.map((value) => [value]);
listsSheet.getRange("C2:C32").values = days.map((value) => [value]);
listsSheet.getRange("D2:D25").values = hours.map((value) => [value]);
listsSheet.getRange("E2:E61").values = minutes.map((value) => [value]);
listsSheet.getRange("F2:F6").values = zones.map((value) => [value]);
listsSheet.getRange("G2:G9").values = symbolCatalog.map((item) => [item.name]);
listsSheet.getRange("H2:H10").values = mainEchelons.map((item) => [item.name]);
listsSheet.getRange("I2:I5").values = symbolStatuses.map((value) => [value]);

const calendarRows = [];
for (const year of years) {
  for (let month = 1; month <= 12; month += 1) {
    const maxDay = month <= 6 ? 31 : 30;
    for (let day = 1; day <= maxDay; day += 1) {
      const [gy, gm, gd] = jalaliToGregorian(year, month, day);
      calendarRows.push([`${year}/${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}`, new Date(Date.UTC(gy, gm - 1, gd))]);
    }
  }
}
listsSheet.getRange("J1:K1").values = [["کلید_تاریخ_شمسی", "تاریخ_میلادی"]];
listsSheet.getRangeByIndexes(1, 9, calendarRows.length, 2).values = calendarRows;
listsSheet.getRangeByIndexes(1, 10, calendarRows.length, 1).format.numberFormat = "yyyy-mm-dd";

const calendarEnd = calendarRows.length + 1;
for (let row = 2; row <= 100; row += 1) {
  timingSheet.getRange(`H${row}`).formulas = [[
    `=IFERROR(INDEX('فهرست‌های انتخاب'!$K$2:$K$${calendarEnd},MATCH(TEXT(B${row},"0000")&"/"&TEXT(C${row},"00")&"/"&TEXT(D${row},"00"),'فهرست‌های انتخاب'!$J$2:$J$${calendarEnd},0))+TIME(E${row},F${row},0),"")`,
  ]];
}
timingSheet.getRange("H2:H100").format.numberFormat = "yyyy-mm-dd hh:mm";

for (const [range, formula1] of [
  ["B2:B500", "'فهرست‌های انتخاب'!$A$2:$A$82"],
  ["C2:C500", "'فهرست‌های انتخاب'!$B$2:$B$13"],
  ["D2:D500", "'فهرست‌های انتخاب'!$C$2:$C$32"],
  ["E2:E500", "'فهرست‌های انتخاب'!$D$2:$D$25"],
  ["F2:F500", "'فهرست‌های انتخاب'!$E$2:$E$61"],
  ["G2:G500", "'فهرست‌های انتخاب'!$F$2:$F$6"],
]) {
  timingSheet.getRange(range).dataValidation = { rule: { type: "list", formula1 } };
}

const timeIdFormula = "'زمان‌بندی'!$A$2:$A$500";
for (const [sheetName, headers] of [
  ["سناریو", ["شناسه_زمان_شروع"]],
  ["حوادث", ["شناسه_زمان_شروع", "شناسه_زمان_پایان"]],
  ["یگان‌ها", ["شناسه_زمان"]],
  ["تجهیزات", ["شناسه_زمان_شروع"]],
  ["عوارض", ["شناسه_زمان_شروع", "شناسه_زمان_پایان"]],
]) {
  const sheet = getSheet(sheetName);
  const rowHeaders = sheet.getRange("A1:Z1").values[0];
  for (const header of headers) {
    const index = rowHeaders.findIndex((value) => value === header);
    if (index >= 0) {
      sheet.getRangeByIndexes(1, index, 499, 1).dataValidation = { rule: { type: "list", formula1: timeIdFormula } };
    }
  }
}

getSheet("حوادث").getRange("F2:F500").dataValidation = { rule: { type: "list", values: ["خودی", "دشمن", "خنثی", "نامشخص"] } };
getSheet("یگان‌ها").getRange("C2:C500").dataValidation = { rule: { type: "list", values: ["خودی", "دشمن", "خنثی", "نامشخص"] } };
getSheet("یگان‌ها").getRange("D2:D500").dataValidation = { rule: { type: "list", formula1: "'فهرست‌های انتخاب'!$H$2:$H$10" } };
getSheet("یگان‌ها").getRange("E2:E500").dataValidation = { rule: { type: "list", formula1: "'فهرست‌های انتخاب'!$G$2:$G$9" } };
getSheet("یگان‌ها").getRange("G2:G500").dataValidation = { rule: { type: "list", formula1: "'فهرست‌های انتخاب'!$I$2:$I$5" } };

let symbolGuide = getSheet("راهنمای نمادها");
if (!symbolGuide) symbolGuide = workbook.worksheets.add("راهنمای نمادها");
const symbolGuideUsed = symbolGuide.getUsedRange(true);
if (symbolGuideUsed) symbolGuideUsed.clear({ applyTo: "all" });
symbolGuide.deleteAllDrawings();
symbolGuide.mergeCells("A1:E1");
symbolGuide.getRange("A1").values = [["رده‌های اصلی آرایش نبرد"]];
symbolGuide.getRange("A2:E2").values = [["نماد خودی", "نماد دشمن", "رده سازمانی", "والد معمول", "کاربرد در اکسل"]];
symbolGuide.getRange("A3:E11").values = mainEchelons.map((item) => [
  "", "", item.name, item.parent,
  item.code === "00" ? "در صورت نامشخص بودن رده" : "برای ساخت اسکلت اصلی انتخاب شود",
]);
for (let index = 0; index < mainEchelons.length; index += 1) {
  const item = mainEchelons[index];
  symbolGuide.images.add({
    dataUrl: await symbolPngDataUrl(sidcForEchelon("3", item.code)),
    anchor: { from: { row: index + 2, col: 0, rowOffsetPx: 5, colOffsetPx: 12 }, extent: { widthPx: 82, heightPx: 60 } },
  });
  symbolGuide.images.add({
    dataUrl: await symbolPngDataUrl(sidcForEchelon("6", item.code)),
    anchor: { from: { row: index + 2, col: 1, rowOffsetPx: 5, colOffsetPx: 12 }, extent: { widthPx: 82, heightPx: 60 } },
  });
}

symbolGuide.mergeCells("A13:E13");
symbolGuide.getRange("A13").values = [["نوع‌های اصلی یگان"]];
symbolGuide.getRange("A14:D14").values = [["پیش‌نمایش", "نام نوع", "کاربرد پیشنهادی", "ویرایش تکمیلی"]];
symbolGuide.getRange("A15:D22").values = symbolCatalog.map((item) => [
  "", item.name, item.use, "جزئیات بیشتر بعداً در کالک‌نگار ویرایش می‌شود",
]);
for (let index = 0; index < symbolCatalog.length; index += 1) {
  symbolGuide.images.add({
    dataUrl: await symbolPngDataUrl(sidcForCatalog(symbolCatalog[index].code)),
    anchor: { from: { row: index + 14, col: 0, rowOffsetPx: 5, colOffsetPx: 12 }, extent: { widthPx: 82, heightPx: 60 } },
  });
}

let guide = getSheet("راهنما");
if (!guide) guide = workbook.worksheets.add("راهنما");
const guideUsed = guide.getUsedRange(true);
if (guideUsed) guideUsed.clear({ applyTo: "all" });
guide.getRange("C2:C14").format.numberFormat = "@";
guide.getRange("A1:D14").values = [
  ["بخش", "کار کاربر", "نمونه", "نتیجه در کالک‌نگار"],
  ["زمان‌بندی", "سال، ماه، روز، ساعت و ناحیه زمانی را از فهرست انتخاب کنید.", "۱۴۰۵/۰۶/۰۷", "تاریخ میلادی به‌صورت خودکار نمایش داده می‌شود."],
  ["شناسه زمان", "شناسه ساخته‌شده را در کاربرگ رویداد یا تجهیز انتخاب کنید.", "زمان-۰۰۱", "واردساز تاریخ شمسی را به زمان استاندارد تبدیل می‌کند."],
  ["یگان‌ها", "طرف، رده، نوع و شناسه والد را انتخاب کنید.", "خودی / تیپ / u1", "اسکلت اصلی آرایش نبرد ساخته می‌شود."],
  ["نماد یگان", "ابتدا رده‌های اصلی مانند لشکر، تیپ و گردان را انتخاب کنید.", "زرهی / گردان / حاضر", "جزئیات نماد بعداً در کالک‌نگار قابل ویرایش است."],
  ["راهنمای نمادها", "شکل رده‌های خودی و دشمن را پیش از انتخاب ببینید.", "لشکر، تیپ، گردان", "انتخاب در کاربرگ یگان‌ها با نام فارسی انجام می‌شود."],
  ["کد نماد پیشرفته", "فقط برای نماد خارج از فهرست، کد بیست‌رقمی را وارد کنید.", protectLongDigits("10031000161211000000"), "کد پیشرفته بر انتخاب‌های فارسی اولویت دارد."],
  ["تجهیزات", "شناسه یگان را انتخاب کنید.", "u3", "تجهیز به یگان متصل می‌شود."],
  ["تجهیزات مختصات‌دار", "طول و عرض جغرافیایی را وارد کنید.", "48.15 / 31.64", "تجهیز به‌صورت مستقل روی نقشه نیز دیده می‌شود."],
  ["عارضه نقطه‌ای", "مرکز عارضه را وارد کنید.", "48.10 / 31.60", "نقطه روی نقشه ساخته می‌شود."],
  ["عارضه شعاع‌دار", "شعاع را بر حسب متر وارد کنید.", "3000", "محدوده اولیه ساخته و بعداً روی نقشه ویرایش می‌شود."],
  ["رویداد", "شناسه یگان‌ها و تجهیزات را با ویرگول جدا کنید.", "u1,u2", "ارتباط رویداد با منابع حفظ می‌شود."],
  ["شناسه‌ها", "شناسه‌ها را در ورودهای بعدی ثابت نگه دارید.", "ev-1", "رکورد موجود به‌روزرسانی می‌شود."],
  ["ردیف‌های نمونه", "قبل از ورود نهایی، داده‌های نمونه را با اطلاعات واقعی جایگزین کنید.", "عارضه-نمونه-۱", "از ایجاد داده آزمایشی ناخواسته جلوگیری می‌شود."],
];

const theme = {
  navy: "#173A5E", teal: "#0F766E", paleBlue: "#EAF2F8",
  paleGold: "#FFF8E1", paleGreen: "#E8F5E9", line: "#D9E2EC",
};
const widths = {
  "سناریو": [30, 58, 24, 20, 20],
  "حوادث": [15, 68, 28, 24, 24, 14, 22, 24, 18, 18],
  "یگان‌ها": [15, 28, 14, 24, 28, 18, 20, 20, 16, 16, 28],
  "تجهیزات": [15, 24, 22, 12, 18, 24, 16, 16],
  "پرسنل": [15, 18, 24, 18, 26, 20, 18],
  "عوارض": [18, 38, 18, 16, 16, 16, 24, 24, 20],
  "زمان‌بندی": [18, 14, 14, 14, 12, 12, 20, 26],
  "راهنما": [22, 64, 30, 62],
  "راهنمای نمادها": [17, 17, 28, 34, 38],
};
const tableNames = {
  "سناریو": "ScenarioFaTable", "حوادث": "EventsFaTable", "یگان‌ها": "UnitsFaTable",
  "تجهیزات": "EquipmentFaTable", "پرسنل": "PersonnelFaTable", "عوارض": "FeaturesFaTable",
  "زمان‌بندی": "TimesFaTable", "راهنما": "GuideFaTable",
};

for (const sheet of workbook.worksheets.items) {
  const used = sheet.getUsedRange(true);
  if (!used) continue;
  sheet.showGridLines = false;
  sheet.freezePanes.freezeRows(1);
  const rows = used.values.length;
  const cols = used.values[0]?.length || 1;
  sheet.getRangeByIndexes(0, 0, 1, cols).format = {
    fill: sheet.name === "زمان‌بندی" ? theme.teal : theme.navy,
    font: { bold: true, color: "#FFFFFF", typeface: "Arial", fontSize: 11 },
    horizontalAlignment: "center", verticalAlignment: "center", wrapText: true,
    borders: { preset: "outside", style: "medium", color: theme.navy }, rowHeight: 34,
  };
  if (rows > 1) {
    sheet.getRangeByIndexes(1, 0, rows - 1, cols).format = {
      font: { typeface: "Arial", fontSize: 10 }, verticalAlignment: "center",
      horizontalAlignment: "right", wrapText: true,
      borders: { preset: "inside", style: "thin", color: theme.line },
      rowHeight: sheet.name === "حوادث" ? 38 : 27,
    };
  }
  (widths[sheet.name] || []).forEach((width, index) => {
    sheet.getRangeByIndexes(0, index, Math.max(rows, 1), 1).format.columnWidth = width;
  });
  if (tableNames[sheet.name] && rows >= 2) {
    const endColumn = String.fromCharCode(64 + cols);
    const table = sheet.tables.add(`A1:${endColumn}${rows}`, true, tableNames[sheet.name]);
    table.style = sheet.name === "زمان‌بندی" ? "TableStyleMedium4" : "TableStyleMedium2";
    table.showBandedColumns = false;
    table.showFilterButton = true;
  }
}

timingSheet.getRange("B2:G500").format.fill = theme.paleGold;
timingSheet.getRange("H2:H500").format.fill = theme.paleGreen;
for (const sheetName of ["سناریو", "حوادث", "یگان‌ها", "تجهیزات", "پرسنل", "عوارض"]) {
  const sheet = getSheet(sheetName);
  const headers = sheet.getRange("A1:Z1").values[0];
  headers.forEach((header, index) => {
    if (String(header).startsWith("شناسه_زمان")) {
      sheet.getRangeByIndexes(1, index, 499, 1).format.fill = theme.paleGold;
    }
    if (["شناسه", "شناسه_والد", "شناسه_یگان", "شناسه_تجهیزات", "شناسه_رویداد"].includes(String(header))) {
      sheet.getRangeByIndexes(1, index, Math.max(sheet.getUsedRange(true).values.length - 1, 1), 1).format.fill = theme.paleBlue;
    }
  });
}
const unitsSheet = getSheet("یگان‌ها");
unitsSheet.getRange("K2:K500").format.numberFormat = "@";
unitsSheet.getRange("C2:E500").format.fill = theme.paleGold;
unitsSheet.getRange("G2:G500").format.fill = theme.paleGold;
unitsSheet.getRange("K2:K500").format.fill = "#F3F4F6";
unitsSheet.getRange("C2:C500").conditionalFormats.add("containsText", {
  text: "خودی", format: { fill: "#DBEAFE", font: { color: "#1E3A8A" } },
});
unitsSheet.getRange("C2:C500").conditionalFormats.add("containsText", {
  text: "دشمن", format: { fill: "#FEE2E2", font: { color: "#991B1B" } },
});
getSheet("پرسنل").getRange("F2:F500").format.numberFormat = "@";
listsSheet.getRange("A1:I1").format = { fill: theme.teal, font: { bold: true, color: "#FFFFFF" } };
listsSheet.getRange("J1:K1").format = { fill: theme.teal, font: { bold: true, color: "#FFFFFF" } };
listsSheet.getRange("A1:I20").format.columnWidth = 18;
listsSheet.getRange("G1:H20").format.columnWidth = 28;
listsSheet.getRange("I1:I20").format.columnWidth = 22;
listsSheet.getRange("J1:K20").format.columnWidth = 22;
listsSheet.showGridLines = false;
listsSheet.freezePanes.freezeRows(1);

symbolGuide.freezePanes.freezeRows(2);
symbolGuide.getRange("A1:E1").format = {
  fill: theme.navy, font: { bold: true, color: "#FFFFFF", typeface: "Arial", fontSize: 13 },
  horizontalAlignment: "center", verticalAlignment: "center", rowHeight: 38,
};
symbolGuide.getRange("A2:E2").format = {
  fill: theme.teal, font: { bold: true, color: "#FFFFFF", typeface: "Arial", fontSize: 10 },
  horizontalAlignment: "center", verticalAlignment: "center", wrapText: true, rowHeight: 32,
};
symbolGuide.getRange("A3:E11").format = {
  font: { typeface: "Arial", fontSize: 10 }, horizontalAlignment: "right", verticalAlignment: "center",
  wrapText: true, rowHeight: 72, borders: { preset: "inside", style: "thin", color: theme.line },
};
symbolGuide.getRange("A13:E13").format = {
  fill: theme.navy, font: { bold: true, color: "#FFFFFF", typeface: "Arial", fontSize: 13 },
  horizontalAlignment: "center", verticalAlignment: "center", rowHeight: 38,
};
symbolGuide.getRange("A14:D14").format = {
  fill: theme.teal, font: { bold: true, color: "#FFFFFF", typeface: "Arial", fontSize: 10 },
  horizontalAlignment: "center", verticalAlignment: "center", wrapText: true, rowHeight: 32,
};
symbolGuide.getRange("A15:D22").format = {
  font: { typeface: "Arial", fontSize: 10 }, horizontalAlignment: "right", verticalAlignment: "center",
  wrapText: true, rowHeight: 72, borders: { preset: "inside", style: "thin", color: theme.line },
};

const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(outputPath);

const renderRanges = {
  "سناریو": "A1:E4", "حوادث": "A1:J14", "یگان‌ها": "A1:K6",
  "تجهیزات": "A1:H14", "پرسنل": "A1:G5", "عوارض": "A1:I5",
  "زمان‌بندی": "A1:H16", "راهنما": "A1:D14", "راهنمای نمادها": "A1:E22", "فهرست‌های انتخاب": "A1:K14",
};
for (const sheet of workbook.worksheets.items) {
  const preview = await workbook.render({
    sheetName: sheet.name, range: renderRanges[sheet.name] || undefined, scale: 1, format: "png",
  });
  await fs.writeFile(`${previewDir}/${sheet.name}.png`, new Uint8Array(await preview.arrayBuffer()));
}

const check = await workbook.inspect({
  kind: "sheet,region,formula,match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 100 },
  maxChars: 18000,
  tableMaxRows: 5,
  tableMaxCols: 12,
});
console.log(check.ndjson);
console.log(outputPath);
