export function resolveInitialBaseMapId(
  scenarioBaseMapId: unknown,
  fallbackBaseMapId: string,
): string {
  return typeof scenarioBaseMapId === "string" && scenarioBaseMapId.trim()
    ? scenarioBaseMapId.trim()
    : fallbackBaseMapId;
}
