// @vitest-environment jsdom

import { createApp, nextTick } from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import BoundaryDrawConfigurator from "./BoundaryDrawConfigurator.vue";

const mountedElements: HTMLElement[] = [];

function mountConfigurator(onConfirm = vi.fn()) {
  const root = document.createElement("div");
  document.body.appendChild(root);
  mountedElements.push(root);

  const app = createApp(BoundaryDrawConfigurator, {
    units: [],
    selectedUnitIds: [],
    initialEchelon: "F",
    onConfirm,
  });
  app.mount(root);

  return { root, onConfirm, app };
}

afterEach(() => {
  for (const element of mountedElements.splice(0)) element.remove();
});

describe("BoundaryDrawConfigurator", () => {
  it("shows the platoon preset with three solid dots", () => {
    const { root } = mountConfigurator();

    const marker = root.querySelector('[data-echelon-code="D"] .boundary-echelon-marker');
    expect(marker?.textContent).toBe("•••");
  });

  it("emits the manually selected echelon when drawing is confirmed", async () => {
    const { root, onConfirm } = mountConfigurator();

    (root.querySelector('[data-echelon-code="D"]') as HTMLButtonElement).click();
    await nextTick();
    (root.querySelector('[data-action="confirm"]') as HTMLButtonElement).click();

    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ echelonCode: "D" }));
  });
});
