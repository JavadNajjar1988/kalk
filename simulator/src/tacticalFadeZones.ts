import { TS } from './tacticalTs';

const MIN_ZONE = 0.005;
const EPSILON = 1e-9;

export interface FadeZone {
  from: number;
  to: number;
  opacity: number;
}

type StyleDescriptor = Record<string, any>;

export function normalizeFadeZones(zones: unknown): FadeZone[] {
  if (!Array.isArray(zones)) return [];
  return zones
    .filter((z): z is Partial<FadeZone> => (
      !!z &&
      typeof z === 'object' &&
      typeof (z as Partial<FadeZone>).from === 'number' &&
      typeof (z as Partial<FadeZone>).to === 'number'
    ))
    .map((z) => ({
      from: Math.max(0, Math.min(1, Math.min(z.from as number, z.to as number))),
      to: Math.max(0, Math.min(1, Math.max(z.from as number, z.to as number))),
      opacity: typeof z.opacity === 'number'
        ? Math.max(0, Math.min(1, z.opacity))
        : 0.15,
    }))
    .filter((z) => z.to - z.from >= MIN_ZONE);
}

function opacityAt(t: number, zones: FadeZone[]): number {
  const matches = zones.filter((z) => t >= z.from && t <= z.to);
  return matches.length ? Math.min(...matches.map((z) => z.opacity)) : 1;
}

function splitByOpacity(zones: FadeZone[]): FadeZone[] {
  const normalized = normalizeFadeZones(zones);
  if (!normalized.length) return [{ from: 0, to: 1, opacity: 1 }];

  const breakpoints = new Set([0, 1]);
  normalized.forEach((z) => {
    breakpoints.add(z.from);
    breakpoints.add(z.to);
  });

  const sorted = [...breakpoints].sort((a, b) => a - b);
  return sorted.slice(0, -1).map((from, index) => {
    const to = sorted[index + 1];
    const mid = (from + to) / 2;
    return { from, to, opacity: opacityAt(mid, normalized) };
  });
}

function geometryType(geometry: any): string | null {
  return geometry && typeof geometry.getGeometryType === 'function'
    ? geometry.getGeometryType()
    : null;
}

function asLineString(geometry: any): any {
  return geometryType(geometry) === 'LinearRing'
    ? TS.lineString(TS.coordinates(geometry))
    : geometry;
}

function polygonRings(polygon: any): any[] {
  const rings = [polygon.getExteriorRing()];
  const count = typeof polygon.getNumInteriorRing === 'function'
    ? polygon.getNumInteriorRing()
    : 0;

  for (let index = 0; index < count; index += 1) {
    rings.push(polygon.getInteriorRingN(index));
  }

  return rings;
}

function toFadeBaseLines(geometry: any): any[] {
  const type = geometryType(geometry);
  if (!type) return [];

  if (type === 'LineString' || type === 'LinearRing') return [asLineString(geometry)];
  if (type === 'MultiPoint') {
    const coordinates = TS.coordinates(geometry);
    return coordinates.length >= 2 ? [TS.lineString(coordinates)] : [];
  }
  if (type === 'MultiLineString') return TS.geometries(geometry).map(asLineString);
  if (type === 'Polygon') return polygonRings(geometry).map(asLineString);
  if (type === 'MultiPolygon') {
    return TS.geometries(geometry).flatMap((polygon: any) =>
      polygonRings(polygon).map(asLineString),
    );
  }
  if (type === 'GeometryCollection') {
    return TS.geometries(geometry).flatMap(toFadeBaseLines);
  }

  return [];
}

function toFadeBaseLine(geometry: any): any {
  const lines = toFadeBaseLines(geometry);
  if (!lines.length) return null;
  return lines.length === 1 ? lines[0] : TS.multiLineString(lines);
}

function normalizedCoordinate(coordinate: any): any {
  return coordinate instanceof TS.Coordinate
    ? coordinate
    : new TS.Coordinate(coordinate[0] ?? coordinate.x, coordinate[1] ?? coordinate.y);
}

function lineLength(line: any): number {
  return TS.lengthIndexedLine(line).getEndIndex();
}

function positionOnLines(lines: any[], coordinate: any): number {
  if (!lines.length || !coordinate) return 0;

  const coord = normalizedCoordinate(coordinate);
  const point = TS.point(coord);
  const total = lines.reduce((sum, line) => sum + lineLength(line), 0);
  if (!total) return 0;

  let offset = 0;
  let best: { distance: number; index: number } | null = null;

  for (const line of lines) {
    const indexed = TS.lengthIndexedLine(line);
    const end = indexed.getEndIndex();
    const local = Math.max(0, Math.min(end, indexed.indexOf(coord)));
    const distance = typeof line.distance === 'function' ? line.distance(point) : 0;

    if (!best || distance < best.distance) {
      best = { distance, index: offset + local };
    }

    offset += end;
  }

  return Math.max(0, Math.min(1, (best?.index ?? 0) / total));
}

function positionOnGeometry(geometry: any, coordinate: any): number {
  return positionOnLines(toFadeBaseLines(geometry), coordinate);
}

function extractSubLine(indexedLine: any, from: number, to: number): any {
  const end = indexedLine.getEndIndex();
  const i1 = from * end;
  const i2 = to * end;
  if (i2 - i1 < 1e-6) return null;
  try {
    return indexedLine.extractLine(i1, i2);
  } catch {
    return null;
  }
}

function extractRangeParts(lines: any[], from: number, to: number): any[] {
  const totalLength = lines.reduce((sum, line) => sum + lineLength(line), 0);
  const rangeStart = from * totalLength;
  const rangeEnd = to * totalLength;
  const result: any[] = [];
  let offset = 0;

  for (const line of lines) {
    const indexed = TS.lengthIndexedLine(line);
    const lineEnd = indexed.getEndIndex();
    if (lineEnd <= 1e-6) continue;

    const lineStart = offset;
    const lineStop = offset + lineEnd;
    if (lineStop > rangeStart && lineStart < rangeEnd) {
      const localStart = Math.max(0, rangeStart - lineStart);
      const localEnd = Math.min(lineEnd, rangeEnd - lineStart);
      const part = extractSubLine(indexed, localStart / lineEnd, localEnd / lineEnd);
      if (part && TS.coordinates(part).length >= 2) result.push(asLineString(part));
    }

    offset += lineEnd;
  }

  return result;
}

function lineGeometry(lines: any[]): any {
  if (!lines.length) return null;
  return lines.length === 1 ? lines[0] : TS.multiLineString(lines);
}

function extractSubGeometry(geometry: any, from: number, to: number): any {
  return lineGeometry(extractRangeParts(toFadeBaseLines(geometry), from, to));
}

function isLineLike(geometry: any): boolean {
  const type = geometryType(geometry);
  return type === 'LineString' || type === 'LinearRing';
}

function isPoint(geometry: any): boolean {
  return geometryType(geometry) === 'Point';
}

function isStrokeEntry(entry: StyleDescriptor): boolean {
  const id = entry?.id || '';
  return id.endsWith('-stroke') || id === 'style:wasp-stroke' || id === 'style:guide-stroke';
}

function isFillEntry(entry: StyleDescriptor): boolean {
  const id = entry?.id || '';
  return id.endsWith('-fill');
}

function isPolygonLike(geometry: any): boolean {
  const type = geometryType(geometry);
  return type === 'Polygon' || type === 'MultiPolygon';
}

function isMultiLineString(geometry: any): boolean {
  return geometryType(geometry) === 'MultiLineString';
}

function isGeometryCollection(geometry: any): boolean {
  return geometryType(geometry) === 'GeometryCollection';
}

function isCollectionSegmentEntry(entry: StyleDescriptor): boolean {
  return isStrokeEntry(entry) || isFillEntry(entry);
}

function shouldSegment(entry: StyleDescriptor, geometry: any): boolean {
  return (
    isLineLike(geometry) ||
    isMultiLineString(geometry) ||
    (isGeometryCollection(geometry) && isCollectionSegmentEntry(entry)) ||
    (isPolygonLike(geometry) && isStrokeEntry(entry))
  );
}

function withOpacity<T extends StyleDescriptor>(entry: T, opacity: number): T {
  if (opacity >= 1) return entry;
  return {
    ...entry,
    'line-opacity': opacity,
    'shape-opacity': opacity,
    'icon-opacity': opacity,
  };
}

function hasDrawableCoordinates(geometry: any): boolean {
  const coords = typeof geometry?.getCoordinates === 'function'
    ? geometry.getCoordinates()
    : [];
  return coords.length >= 2;
}

function isSegmentLineGeometry(geometry: any): boolean {
  const type = geometryType(geometry);
  return type === 'LineString' || type === 'LinearRing' || type === 'MultiLineString';
}

function representativeCoordinate(geometry: any): any {
  if (!geometry) return null;
  if (isPoint(geometry)) return TS.coordinate(geometry);
  if (typeof geometry.getCentroid === 'function') {
    const centroid = geometry.getCentroid();
    if (centroid) return TS.coordinate(centroid);
  }
  const coords = typeof geometry.getCoordinates === 'function'
    ? geometry.getCoordinates()
    : [];
  return coords[Math.floor(coords.length / 2)] || null;
}

function isWithinSegment(t: number, segment: FadeZone): boolean {
  return t >= segment.from && (t < segment.to || segment.to === 1);
}

function sameCoordinate(a: any, b: any): boolean {
  return Math.abs(a.x - b.x) < EPSILON && Math.abs(a.y - b.y) < EPSILON;
}

function interpolateCoordinate(a: any, b: any, ratio: number): any {
  return new TS.Coordinate(
    a.x + (b.x - a.x) * ratio,
    a.y + (b.y - a.y) * ratio,
  );
}

function addLinePart(parts: any[][], start: any, end: any): void {
  if (sameCoordinate(start, end)) return;

  const current = parts[parts.length - 1];
  if (current && sameCoordinate(current[current.length - 1], start)) {
    current.push(end);
    return;
  }

  parts.push([start, end]);
}

function segmentLineStringByBaseRange(line: any, segment: FadeZone, baseLine: any): any[] {
  const coords = typeof line?.getCoordinates === 'function'
    ? line.getCoordinates()
    : [];
  if (coords.length < 2) return [];

  const positions = coords
    .map((coord: any) => positionOnGeometry(baseLine, coord));
  const parts: any[][] = [];

  coords.slice(1).forEach((end: any, index: number) => {
    const start = coords[index];
    const fromT = positions[index];
    const toT = positions[index + 1];

    if (!Number.isFinite(fromT) || !Number.isFinite(toT)) return;

    if (Math.abs(toT - fromT) < EPSILON) {
      if (isWithinSegment(fromT, segment)) addLinePart(parts, start, end);
      return;
    }

    const startRatio = Math.max(
      0,
      Math.min(1, (segment.from - fromT) / (toT - fromT), (segment.to - fromT) / (toT - fromT)),
    );
    const endRatio = Math.min(
      1,
      Math.max(0, (segment.from - fromT) / (toT - fromT), (segment.to - fromT) / (toT - fromT)),
    );

    if (endRatio - startRatio <= EPSILON) return;

    addLinePart(
      parts,
      interpolateCoordinate(start, end, startRatio),
      interpolateCoordinate(start, end, endRatio),
    );
  });

  return parts
    .filter((part) => part.length >= 2)
    .map((part) => TS.lineString(part));
}

function segmentLinePartByBaseRange(geometry: any, segment: FadeZone, baseLine: any): any[] {
  const type = geometryType(geometry);
  if (type === 'MultiLineString') {
    return TS.geometries(geometry).flatMap((part: any) =>
      segmentLineStringByBaseRange(part, segment, baseLine),
    );
  }
  return segmentLineStringByBaseRange(geometry, segment, baseLine);
}

function collectGeometry(geometries: any[]): any {
  const parts = geometries.filter(Boolean);
  if (!parts.length) return null;
  return parts.length === 1 ? parts[0] : TS.collect(parts);
}

function minimumSegmentOpacity(segments: FadeZone[]): number {
  return Math.min(...segments.map((segment) => segment.opacity));
}

function segmentCollectionParts(geometry: any, segment: FadeZone, baseLine: any): any[] {
  if (!isGeometryCollection(geometry)) return [];

  return TS.geometries(geometry).flatMap((part: any) => {
    if (isGeometryCollection(part)) {
      return segmentCollectionParts(part, segment, baseLine);
    }

    if (isSegmentLineGeometry(part)) {
      return segmentLinePartByBaseRange(part, segment, baseLine)
        .filter(hasDrawableCoordinates);
    }

    if (isPolygonLike(part) || isPoint(part)) {
      const coord = representativeCoordinate(part);
      if (!coord) return [];
      const t = positionOnGeometry(baseLine, coord);
      return isWithinSegment(t, segment) ? [part] : [];
    }

    return [];
  });
}

export function applyFadeZonesToDescriptors<T extends StyleDescriptor>(
  styles: T[],
  fadeZones: unknown,
  baseGeometry: any,
): T[] {
  const zones = normalizeFadeZones(fadeZones);
  if (!zones.length || !baseGeometry || !Array.isArray(styles)) return styles;

  const baseLine = toFadeBaseLine(baseGeometry);
  if (!baseLine) return styles;

  const segments = splitByOpacity(zones);

  return styles.flatMap((entry) => {
    if (!entry?.geometry) return [entry];
    const geom = entry.geometry;

    if (isGeometryCollection(geom) && isCollectionSegmentEntry(entry)) {
      return segments.flatMap((segment) => {
        if (segment.opacity <= 0) return [];
        const collection = collectGeometry(segmentCollectionParts(geom, segment, baseLine));
        if (!collection) return [];
        return [withOpacity({ ...entry, geometry: collection }, segment.opacity)];
      });
    }

    if (isPolygonLike(geom) && isFillEntry(entry)) {
      const opacity = minimumSegmentOpacity(segments);
      if (opacity <= 0) return [];
      return [withOpacity(entry, opacity)];
    }

    if (shouldSegment(entry, geom)) {
      return segments.flatMap((segment) => {
        if (segment.opacity <= 0) return [];
        const sub = extractSubGeometry(geom, segment.from, segment.to);
        if (!sub) return [];
        const coords = typeof sub.getCoordinates === 'function' ? sub.getCoordinates() : [];
        if (coords.length < 2) return [];
        return [withOpacity({ ...entry, geometry: sub }, segment.opacity)];
      });
    }

    if (isPoint(geom)) {
      const coord = typeof geom.getCoordinate === 'function' ? geom.getCoordinate() : null;
      if (!coord) return [entry];
      const opacity = opacityAt(positionOnGeometry(baseLine, coord), zones);
      if (opacity <= 0) return [];
      return [withOpacity(entry, opacity)];
    }

    return [entry];
  });
}
