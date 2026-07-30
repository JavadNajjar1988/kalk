import { describe, expect, it } from "vitest";
import { buildTimezoneLocationOptions } from "./timezoneLocationOptions";

describe("timezone location options", () => {
  it("groups time zones by country and keeps the IANA zone as the value", () => {
    const result = buildTimezoneLocationOptions([
      {
        name: "Asia/Tehran",
        countryCode: "IR",
        countryName: "Iran",
        mainCities: ["Tehran"],
      },
      {
        name: "Europe/Paris",
        countryCode: "FR",
        countryName: "France",
        mainCities: ["Paris"],
      },
    ]);

    expect(result.countries.map((country) => country.value)).toEqual(["FR", "IR"]);
    expect(result.locationsByCountry.IR).toEqual([
      { label: "Tehran — Asia/Tehran", value: "Asia/Tehran" },
    ]);
  });
});
