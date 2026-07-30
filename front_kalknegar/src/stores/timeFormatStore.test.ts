import { describe, expect, it } from "vitest";
import { createFormatter, type TimeFormatSettings } from "./timeFormatStore";

const settings: TimeFormatSettings = {
  timeFormat: "local",
  locale: "en-US",
  dateStyle: "short",
  timeStyle: "short",
};

describe("createFormatter", () => {
  it("applies the requested time zone", () => {
    const value = Date.UTC(2026, 0, 1, 12, 0, 0);

    expect(createFormatter("UTC", settings).format(value)).not.toBe(
      createFormatter("America/New_York", settings).format(value),
    );
  });

  it("applies locale and requested date/time styles", () => {
    const value = Date.UTC(2026, 0, 1, 12, 0, 0);
    const actual = createFormatter("UTC", settings).format(value);
    const expected = new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      dateStyle: "short",
      timeStyle: "short",
    }).format(value);

    expect(actual).toBe(expected);
  });

  it("keeps Persian digits for the default Persian locale", () => {
    const value = Date.UTC(2026, 0, 1, 12, 0, 0);
    const actual = createFormatter("UTC", { ...settings, locale: "fa-IR" }).format(value);

    expect(actual).toMatch(/[۰-۹]/);
  });

  it("falls back safely for invalid locale and time zone values", () => {
    expect(() =>
      createFormatter("invalid-zone", { ...settings, locale: "invalid_locale" }).format(0),
    ).not.toThrow();
  });
});
