import type { BoundaryEchelonCode } from "@/symbology/boundaryEchelons";
import * as MILSTD from "../../symbology/2525c.js";

export interface TacticalFeatureRecord {
  [key: string]: unknown;
  properties?: Record<string, unknown> & {
    sidc?: string;
    t?: string;
    t1?: string;
  };
}

export function getBoundaryDesignation(
  side: "left" | "right",
  feature: TacticalFeatureRecord,
): string | undefined {
  const value = side === "left" ? feature.properties?.t : feature.properties?.t1;
  return typeof value === "string" && value ? value : undefined;
}

export function setBoundaryEchelon(code: BoundaryEchelonCode) {
  return (feature: TacticalFeatureRecord): TacticalFeatureRecord => {
    const properties = feature.properties || {};
    return {
      ...feature,
      properties: {
        ...properties,
        sidc: properties.sidc
          ? MILSTD.format(properties.sidc, { echelon: code })
          : properties.sidc,
      },
    };
  };
}

export function setBoundaryDesignation(side: "left" | "right", value: string) {
  const property = side === "left" ? "t" : "t1";
  return (feature: TacticalFeatureRecord): TacticalFeatureRecord => ({
    ...feature,
    properties: {
      ...feature.properties,
      [property]: value,
    },
  });
}
