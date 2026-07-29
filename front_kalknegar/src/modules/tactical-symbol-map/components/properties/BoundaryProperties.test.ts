// @vitest-environment jsdom

import { createApp, nextTick, ref } from "vue";
import { afterEach, describe, expect, it } from "vitest";
import BoundaryProperties from "./BoundaryProperties.vue";

const cleanups: (() => void)[] = [];

function mountBoundaryProperties() {
  const feature = {
    properties: {
      sidc: "GFGPGLB---*D***",
      t: "",
    },
  };
  const features = { "feature:test": feature };
  let updatedFeature = feature;
  const services = ref({
    store: {
      update: async (
        values: typeof features,
        updateFeature: (value: typeof feature) => typeof feature,
      ) => {
        updatedFeature = updateFeature(Object.values(values)[0]);
      },
    },
  });
  const root = document.createElement("div");
  document.body.appendChild(root);
  const app = createApp(BoundaryProperties, { features, disabled: false });
  app.provide("services", services);
  app.mount(root);
  cleanups.push(() => {
    app.unmount();
    root.remove();
  });

  return {
    root,
    updatedFeature: () => updatedFeature,
  };
}

afterEach(() => {
  for (const cleanup of cleanups.splice(0)) cleanup();
});

describe("BoundaryProperties", () => {
  it("shows the stored platoon echelon", () => {
    const { root } = mountBoundaryProperties();

    expect(
      (root.querySelector("[data-boundary-echelon]") as HTMLSelectElement).value,
    ).toBe("D");
  });

  it("updates the right designation when the left designation is empty", async () => {
    const { root, updatedFeature } = mountBoundaryProperties();
    const input = root.querySelector(
      '[data-boundary-designation="right"]',
    ) as HTMLInputElement;

    input.value = "یگان راست";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("blur", { bubbles: true }));
    await nextTick();

    expect(updatedFeature().properties).toMatchObject({
      t: "",
      t1: "یگان راست",
    });
  });
});
