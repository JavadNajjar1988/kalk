export interface TimezoneLocation {
  name: string;
  countryCode: string;
  countryName: string;
  mainCities: string[];
}

export interface TimezoneSelectItem {
  label: string;
  value: string;
}

export function buildTimezoneLocationOptions(zones: TimezoneLocation[]) {
  const regionNames = new Intl.DisplayNames(["fa"], { type: "region" });
  const countryNames = new Map<string, string>();
  const locationsByCountry: Record<string, TimezoneSelectItem[]> = {};

  [...zones]
    .sort(
      (a, b) =>
        a.countryName.localeCompare(b.countryName) || a.name.localeCompare(b.name),
    )
    .forEach((zone) => {
      if (!zone.countryCode) return;

      countryNames.set(
        zone.countryCode,
        regionNames.of(zone.countryCode) || zone.countryName,
      );
      const nameParts = zone.name.split("/");
      const city = zone.mainCities[0] || nameParts[nameParts.length - 1] || zone.name;
      (locationsByCountry[zone.countryCode] ||= []).push({
        label: `${city.replaceAll("_", " ")} — ${zone.name}`,
        value: zone.name,
      });
    });

  return {
    countries: [...countryNames].map(([value, label]) => ({ label, value })),
    locationsByCountry,
  };
}
