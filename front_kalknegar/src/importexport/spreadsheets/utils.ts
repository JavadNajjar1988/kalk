import { type WorkBook } from "xlsx";

export type SpreadsheetDialect = "unknown";

export function detectSpreadsheetDialect(wb: WorkBook): SpreadsheetDialect {
  return "unknown";
}
