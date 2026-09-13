import { describe, expect, it } from "vitest";
import type { ResourceDto } from "@/services/api/resourceApiService";
import {
  createPositionedEquipmentFeature,
  resolveEquipmentSidc,
} from "./equipmentResourceFactory";

const resource: ResourceDto = {
  id: "equipment-resource-1",
  type: "equipment",
  name: "تانک تی-۷۲",
  code: "EQ-T72",
  description: "تانک اصلی میدان نبرد",
  metadata: { sidc: "10031000001205000000", equipmentType: "زرهی" },
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  media_files: [],
};

describe("createPositionedEquipmentFeature", () => {
  it("creates a resource-linked military symbol at the selected location", () => {
    const feature = createPositionedEquipmentFeature(resource, [51.4, 35.7], {
      quantity: 3,
      participationStatus: "active",
      unitId: "unit-1",
      unitName: "گردان زرهی",
      visibleFromT: 123,
    });

    expect(String(feature.id)).toMatch(/^equipment-/);
    expect(feature.geometry).toEqual({ type: "Point", coordinates: [51.4, 35.7] });
    expect(feature.properties).toMatchObject({
      resourceId: "equipment-resource-1",
      quantity: 3,
      participationStatus: "active",
      unitId: "unit-1",
    });
    expect((feature.style as any).militarySymbolSidc).toBe("10031000001205000000");
  });

  it("falls back to a themed square when no valid SIDC exists", () => {
    expect(
      resolveEquipmentSidc({ ...resource, metadata: { sidc: "invalid" } }),
    ).toBeUndefined();
  });
});
