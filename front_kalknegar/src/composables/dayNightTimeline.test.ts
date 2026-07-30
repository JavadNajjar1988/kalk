import { describe, expect, it, vi } from "vitest";
import { syncDayNightWithTimeline } from "./dayNightTimeline";
import DayNight from "ol-ext/source/DayNight";
import Polygon from "ol/geom/Polygon";

describe("day/night timeline synchronization", () => {
  it("updates the terminator source with the scenario timestamp", () => {
    const setTime = vi.fn();

    syncDayNightWithTimeline({ setTime }, 1_753_776_000_000);

    expect(setTime).toHaveBeenCalledOnce();
    expect(setTime.mock.calls[0][0]).toEqual(new Date(1_753_776_000_000));
  });

  it("classifies Tehran as day at 14:00 and night at 02:00 local time", () => {
    const source = new DayNight();
    const tehran = [51.389, 35.689];
    const iranOffset = 3.5 * 60 * 60 * 1000;
    const localNoon = Date.UTC(1981, 10, 28, 14);
    const localNight = Date.UTC(1981, 10, 28, 2);

    const noonNightPolygon = new Polygon([
      source.getCoordinates(new Date(localNoon - iranOffset)),
    ]);
    const nightPolygon = new Polygon([
      source.getCoordinates(new Date(localNight - iranOffset)),
    ]);

    expect(noonNightPolygon.intersectsCoordinate(tehran)).toBe(false);
    expect(nightPolygon.intersectsCoordinate(tehran)).toBe(true);
  });
});
