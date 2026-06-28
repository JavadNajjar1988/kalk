import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function extractToolbarBlock(component: string, className: string) {
  const classIndex = component.indexOf(className);
  expect(classIndex).toBeGreaterThanOrEqual(0);

  const navStart = component.lastIndexOf("<nav", classIndex);
  expect(navStart).toBeGreaterThanOrEqual(0);

  const navEnd = component.indexOf("</nav>", navStart);
  expect(navEnd).toBeGreaterThan(navStart);

  return component.slice(navStart, navEnd + "</nav>".length);
}

describe("MapEditorMainToolbar layout", () => {
  it("separates playback controls from map editing tools", () => {
    const component = readFileSync(
      resolve(__dirname, "MapEditorMainToolbar.vue"),
      "utf8",
    );
    expect(component).toContain("flex-col items-center justify-center gap-1");

    const mainToolbarBlock = extractToolbarBlock(component, "map-editor-main-toolbar");
    const playbackToolbarBlock = extractToolbarBlock(
      component,
      "map-editor-playback-toolbar",
    );

    expect(mainToolbarBlock).toContain("symbol-library-button");
    expect(mainToolbarBlock).not.toContain("playback-button");
    expect(mainToolbarBlock).not.toContain("storyboard-menu-button");
    expect(mainToolbarBlock).not.toContain("playback-menu-button");
    expect(mainToolbarBlock).not.toContain("playback-speed-button");
    expect(mainToolbarBlock).not.toContain("event-loop-button");
    expect(mainToolbarBlock).not.toContain("calendar-button");
    expect(mainToolbarBlock).not.toContain("start-time-button");
    expect(mainToolbarBlock).not.toContain("end-time-button");

    expect(playbackToolbarBlock).toContain("playback-button");
    expect(playbackToolbarBlock).toContain("storyboard-menu-button");
    expect(playbackToolbarBlock).not.toContain("playback-menu-button");
    expect(playbackToolbarBlock).toContain("playback-speed-button");
    expect(playbackToolbarBlock).toContain("event-loop-button");
    expect(playbackToolbarBlock).toContain("calendar-button");
    expect(playbackToolbarBlock).toContain("end-time-button");
    expect(playbackToolbarBlock).toContain("next-event-button");
    expect(playbackToolbarBlock).toContain("next-day-button");
    expect(playbackToolbarBlock).toContain("prev-day-button");
    expect(playbackToolbarBlock).toContain("prev-event-button");
    expect(playbackToolbarBlock).toContain("start-time-button");
  });
});
