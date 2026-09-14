import type { ResourceDto } from '@/services/api/resourceApiService';

export type ResourceReferenceLabels = ReadonlyMap<string, string>;

export function buildUnitReferenceLabels(
  resources: Array<Pick<ResourceDto, 'id' | 'code' | 'name'>>
): ResourceReferenceLabels {
  const labels = new Map<string, string>();
  for (const resource of resources) {
    const name = resource.name.trim();
    if (!name) continue;
    labels.set(resource.id, name);
    if (resource.code?.trim()) labels.set(resource.code.trim(), name);
    labels.set(name, name);
  }
  return labels;
}

export function resolveUnitReferenceLabel(
  value: unknown,
  labels: ResourceReferenceLabels,
  emptyLabel = '—'
): string {
  const reference = String(value ?? '').trim();
  if (!reference) return emptyLabel;
  return labels.get(reference) || reference;
}
