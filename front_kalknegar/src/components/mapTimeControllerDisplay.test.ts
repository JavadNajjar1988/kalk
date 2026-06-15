import { describe, expect, it } from "vitest";

import { formatMapTimeDisplay } from "./mapTimeControllerDisplay";

describe("formatMapTimeDisplay", () => {
  it("formats the map header date and time as separate stable Persian strings", () => {
    const timestamp = Date.UTC(1982, 3, 1, 10, 40);

    const result = formatMapTimeDisplay(timestamp, "UTC");

    expect(result).toEqual({
      date: "۱۲ فروردین ۱۳۶۱",
      time: "۱۰:۴۰",
    });
    expect(result.date).not.toMatch(/\s{2,}/);
    expect(result.time).toHaveLength(5);
  });
});
