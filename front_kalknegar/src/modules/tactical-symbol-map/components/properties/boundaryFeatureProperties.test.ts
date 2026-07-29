import { describe, expect, it } from "vitest";
import {
  getBoundaryDesignation,
  setBoundaryDesignation,
  setBoundaryEchelon,
} from "./boundaryFeatureProperties";

describe("Boundary feature properties", () => {
  it("updates the echelon without changing the Boundary function ID", () => {
    const updated = setBoundaryEchelon("D")({
      properties: { sidc: "GFGPGLB---*****", t: "چپ" },
    });

    expect(updated).toEqual({
      properties: { sidc: "GFGPGLB---*D***", t: "چپ" },
    });
  });

  it("updates the right designation independently from the left", () => {
    const updated = setBoundaryDesignation(
      "right",
      "یگان راست",
    )({
      properties: { sidc: "GFGPGLB---*D***", t: "" },
    });

    expect(updated.properties).toMatchObject({
      t: "",
      t1: "یگان راست",
    });
  });

  it("updates the left designation without changing the right", () => {
    const updated = setBoundaryDesignation(
      "left",
      "یگان چپ",
    )({
      properties: { sidc: "GFGPGLB---*D***", t1: "یگان راست" },
    });

    expect(updated.properties).toMatchObject({
      t: "یگان چپ",
      t1: "یگان راست",
    });
  });

  it("reads the right designation without depending on the left value", () => {
    expect(
      getBoundaryDesignation("right", {
        properties: { t: "", t1: "یگان راست" },
      }),
    ).toBe("یگان راست");
    expect(
      getBoundaryDesignation("right", {
        properties: { t: "یگان چپ" },
      }),
    ).toBeUndefined();
  });
});
