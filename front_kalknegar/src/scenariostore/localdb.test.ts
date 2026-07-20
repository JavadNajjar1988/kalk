import { describe, expect, it } from "vitest";
import { SCENARIO_DB_VERSION } from "./localdb";

describe("scenario IndexedDB schema", () => {
  it("opens scenario-db with the current schema version", () => {
    expect(SCENARIO_DB_VERSION).toBe(4);
  });
});
