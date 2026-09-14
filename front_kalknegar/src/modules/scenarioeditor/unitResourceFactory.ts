import type { NUnitAdd } from "@/types/internalModels";
import type { ResourceDto } from "@/services/api/resourceApiService";

const SIDC_PATTERN = /^[0-9A-Z]{20}$/i;

function textValue(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}

export function resolveResourceUnitSidc(
  resource: ResourceDto,
  fallbackSidc: string,
): string {
  const metadata = resource.metadata ?? {};
  const candidate = textValue(metadata.sidc)?.toUpperCase();
  return candidate && SIDC_PATTERN.test(candidate) ? candidate : fallbackSidc;
}

/**
 * یک یگان سناریویی می‌سازد که هویت آن به رکورد اصلی در مدیریت منابع متصل است.
 * جزئیات عملیاتی و موقعیت، در خود سناریو تکمیل می‌شوند و کاتالوگ دست‌نخورده می‌ماند.
 */
export function createUnitFromResource(
  resource: ResourceDto,
  fallbackSidc: string,
  participationStartTime?: number,
): NUnitAdd {
  const metadata = resource.metadata ?? {};
  return {
    name: resource.name,
    shortName:
      textValue(metadata.shortName) ?? textValue(metadata.short_name) ?? undefined,
    description: textValue(resource.description) ?? undefined,
    sidc: resolveResourceUnitSidc(resource, fallbackSidc),
    linkedResourceId: resource.id,
    linkedResourceLabel: resource.name,
    participationStatus: "planned",
    participationStartTime,
    subUnits: [],
    state: [],
  };
}
