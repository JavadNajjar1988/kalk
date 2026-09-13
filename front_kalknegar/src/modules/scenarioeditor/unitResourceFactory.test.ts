import { describe, expect, it } from "vitest";
import type { ResourceDto } from "@/services/api/resourceApiService";
import { createUnitFromResource, resolveResourceUnitSidc } from "./unitResourceFactory";

const fallbackSidc = "10031000000000000000";

function unitResource(overrides: Partial<ResourceDto> = {}): ResourceDto {
  return {
    id: "resource-unit-1",
    type: "units",
    name: "تیپ ۵۵ هوابرد",
    code: "UNIT-0055",
    description: "یگان عملیاتی",
    status: "active",
    metadata: {
      sidc: "10031000161211000000",
      shortName: "تیپ ۵۵",
    },
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    media_files: [],
    ...overrides,
  };
}

describe("createUnitFromResource", () => {
  it("keeps the catalog identity and copies the basic unit fields", () => {
    const unit = createUnitFromResource(unitResource(), fallbackSidc);

    expect(unit).toMatchObject({
      name: "تیپ ۵۵ هوابرد",
      shortName: "تیپ ۵۵",
      description: "یگان عملیاتی",
      sidc: "10031000161211000000",
      linkedResourceId: "resource-unit-1",
      linkedResourceLabel: "تیپ ۵۵ هوابرد",
      subUnits: [],
      state: [],
    });
  });

  it("uses the current toolbar symbol when the catalog SIDC is missing or invalid", () => {
    const resource = unitResource({ metadata: { sidc: "invalid" } });

    expect(resolveResourceUnitSidc(resource, fallbackSidc)).toBe(fallbackSidc);
    expect(createUnitFromResource(resource, fallbackSidc).sidc).toBe(fallbackSidc);
  });
});
