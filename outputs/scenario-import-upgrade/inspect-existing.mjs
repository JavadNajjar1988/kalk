import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "file:///C:/Users/AI/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs";

const sourcePath = "C:/Users/AI/Downloads/scenario_import_template .xlsx";
const outputDir = "C:/Users/AI/Documents/GitHub/kalk/outputs/scenario-import-upgrade/existing-preview";
await fs.mkdir(outputDir, { recursive: true });
const input = await FileBlob.load(sourcePath);
const workbook = await SpreadsheetFile.importXlsx(input);
const summary = await workbook.inspect({
  kind: "workbook,sheet,region,computedStyle",
  maxChars: 12000,
  tableMaxRows: 6,
  tableMaxCols: 12,
  tableMaxCellChars: 80,
});
console.log(summary.ndjson);
for (const sheet of workbook.worksheets.items) {
  const preview = await workbook.render({ sheetName: sheet.name, autoCrop: "all", scale: 1, format: "png" });
  await fs.writeFile(`${outputDir}/${sheet.name}.png`, new Uint8Array(await preview.arrayBuffer()));
}
