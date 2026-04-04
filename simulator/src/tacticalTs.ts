/**
 * tacticalTs.ts
 * Bridge over jsts — mirrors Odin's ol/ts/library.js so Odin style functions
 * can be called unchanged inside the Cesium simulator.
 */

/* eslint-disable @typescript-eslint/ban-ts-comment */
// jsts ships CommonJS modules without bundled TypeScript declarations.
// All deep-path imports are listed in vite.config.ts > optimizeDeps.include
// so Vite/esbuild pre-bundles them before the dev server starts.
// @ts-expect-error no types
import Angle from 'jsts/org/locationtech/jts/algorithm/Angle.js';
// @ts-expect-error no types
import Centroid from 'jsts/org/locationtech/jts/algorithm/Centroid.js';
// @ts-expect-error no types
import MinimumDiameter from 'jsts/org/locationtech/jts/algorithm/MinimumDiameter.js';
// @ts-expect-error no types
import ConvexHull from 'jsts/org/locationtech/jts/algorithm/ConvexHull.js';
// @ts-expect-error no types
import Coordinate from 'jsts/org/locationtech/jts/geom/Coordinate.js';
// @ts-expect-error no types
import Geometry from 'jsts/org/locationtech/jts/geom/Geometry.js';
// @ts-expect-error no types
import GeometryFactory from 'jsts/org/locationtech/jts/geom/GeometryFactory.js';
// @ts-expect-error no types
import LineSegment from 'jsts/org/locationtech/jts/geom/LineSegment.js';
// @ts-expect-error no types
import Polygon from 'jsts/org/locationtech/jts/geom/Polygon.js';
// @ts-expect-error no types
import AffineTransformation from 'jsts/org/locationtech/jts/geom/util/AffineTransformation.js';
// @ts-expect-error no types
import LengthIndexedLine from 'jsts/org/locationtech/jts/linearref/LengthIndexedLine.js';
// @ts-expect-error no types
import BufferOp from 'jsts/org/locationtech/jts/operation/buffer/BufferOp.js';
// @ts-expect-error no types
import BufferParameters from 'jsts/org/locationtech/jts/operation/buffer/BufferParameters.js';
// @ts-expect-error no types
import OverlayOp from 'jsts/org/locationtech/jts/operation/overlay/OverlayOp.js';
// @ts-expect-error no types
import RelateOp from 'jsts/org/locationtech/jts/operation/relate/RelateOp.js';

const gf = new GeometryFactory();

export const PI_OVER_2 = Math.PI / 2;
export const PI_OVER_3 = Math.PI / 3;
export const PI = Math.PI;

// ---- Coordinate helpers ----

export const coordinate = (...args: any[]): any => {
  if (args[0] instanceof Geometry) return args[0].getCoordinate();
  if (Array.isArray(args[0])) return new Coordinate(args[0][0], args[0][1]);
  if (args.length === 2 && typeof args[0] === 'number') return new Coordinate(args[0], args[1]);
  return args[0];
};

export const coordinates = (...args: any[]): any[] => {
  if (Array.isArray(args[0])) return args[0].flatMap((g: any) => coordinates(g));
  return args[0].getCoordinates();
};

export const point = (coord: any) => gf.createPoint(coord instanceof Coordinate ? coord : new Coordinate(coord.x ?? coord[0], coord.y ?? coord[1]));
export const multiPoint = (pts: any[]) => gf.createMultiPoint(pts);

// ---- LineString ----

export const lineString = (...args: any[]): any => {
  if (args.length === 1) {
    if (args[0] instanceof LineSegment) return args[0].toGeometry(gf);
    if (Array.isArray(args[0])) return gf.createLineString(args[0].map((c: any) => c instanceof Coordinate ? c : new Coordinate(c.x ?? c[0], c.y ?? c[1])));
  }
  return gf.createLineString(args.map((c: any) => c instanceof Coordinate ? c : new Coordinate(c.x ?? c[0], c.y ?? c[1])));
};

export const multiLineString = (ls: any[]) => gf.createMultiLineString(ls);

// ---- Polygon ----

export const polygon = (coords: any[]): any => {
  const ring = coords.map((c: any) => c instanceof Coordinate ? c : new Coordinate(c.x ?? c[0], c.y ?? c[1]));
  return gf.createPolygon(ring);
};

// ---- Segment ----

export const segment = (...args: any[]): any => {
  if (args.length === 1) {
    if (args[0] instanceof LineSegment) return args[0];
    return new LineSegment(args[0][0], args[0][1]);
  }
  if (args.length === 2) return new LineSegment(args[0], args[1]);
  // handle .map(current, index, array) calls
  return segment(args[0]);
};

export const segments = (ls: any): any[] => {
  const coords = ls.getCoordinates();
  const result = [];
  for (let i = 0; i < coords.length - 1; i++) {
    result.push(new LineSegment(coords[i], coords[i + 1]));
  }
  return result;
};

// ---- LengthIndexedLine ----

export const lengthIndexedLine = (geom: any) => new LengthIndexedLine(geom);

// ---- Collection ----

export const collect = (geoms: any[]) => gf.createGeometryCollection(geoms);

// ---- Buffer ----

const makeBuffer = (opts: any = {}) => (geom: any) => (distance: number) => {
  const params = new BufferParameters(
    opts.quadrantSegments ?? BufferParameters.DEFAULT_QUADRANT_SEGMENTS,
    opts.endCapStyle ?? BufferParameters.CAP_ROUND,
    opts.joinStyle ?? BufferParameters.JOIN_BEVEL,
    opts.mitreLimit ?? BufferParameters.DEFAULT_MITRE_LIMIT,
  );
  if (opts.singleSided) params.setSingleSided(true);
  return BufferOp.bufferOp(geom, distance, params);
};

export const pointBuffer = makeBuffer();
export const lineBuffer = makeBuffer({ joinStyle: BufferParameters.JOIN_ROUND, endCapStyle: BufferParameters.CAP_FLAT });
export const singleSidedLineBuffer = makeBuffer({ joinStyle: BufferParameters.JOIN_ROUND, endCapStyle: BufferParameters.CAP_FLAT, singleSided: true });
export const simpleBuffer = makeBuffer({ endCapStyle: BufferParameters.CAP_ROUND });

// ---- Projection helpers ----

export const projectCoordinate = ({ x, y }: any) => ([angle, distance]: [number, number]) =>
  new Coordinate(x + Math.cos(angle) * distance, y + Math.sin(angle) * distance);

export const projectCoordinates = (distance: number, angle: number, coord: any) => (fractions: number[][]) =>
  fractions
    .map(cs => cs.map(c => c * distance))
    .map(([a, b]) => [angle - Math.atan2(b, a), Math.hypot(a, b)] as [number, number])
    .map(projectCoordinate(coord));

export const segmentize = (seg: any, n: number): any[] => {
  const result = [];
  for (let i = 0; i <= n; i++) result.push(seg.pointAlong(i / n));
  return result;
};

// ---- Misc ----

export const centroid = (geom: any) => Centroid.getCentroid(geom);
export const minimumRectangle = (geom: any) => MinimumDiameter.getMinimumRectangle(geom);
export const convexHull = (geom: any) => new ConvexHull(geom).getConvexHull();
export const rotation = (seg: any) => Angle.normalize(Angle.PI_TIMES_2 - seg.angle());
export const normalizePositive = (angle: number) => Angle.normalizePositive(angle);
export const boundary = (geom: any) => geom.getBoundary();
export const startPoint = (geom: any) => geom.getStartPoint();
export const endPoint = (geom: any) => geom.getEndPoint();
export const union = (geoms: any[]) => geoms.reduce(OverlayOp.union);
export const difference = (geoms: any[]) => geoms.reduce(OverlayOp.difference);
export const intersection = (geoms: any[]) => geoms.reduce(OverlayOp.intersection);
export const equals = (g1: any, g2: any) => RelateOp.equalsTopo(g1, g2);
export const intersects = (g1: any, g2: any) => RelateOp.intersects(g1, g2);

export const geometries = (collection: any): any[] => {
  const n = collection.getNumGeometries();
  const result = [];
  for (let i = 0; i < n; i++) result.push(collection.getGeometryN(i));
  return result;
};

export const arc = ({ x, y }: any, radius: number, α1: number, α2: number, n: number): any[] => {
  const result = [];
  for (let i = 0; i < n; i++) {
    const α = α1 - α2 / n * i;
    result.push(new Coordinate(x + radius * Math.cos(α), y + radius * Math.sin(α)));
  }
  return result;
};

export const translate = (angle: number, geom: any) => (distance: number) => {
  const α = Angle.PI_TIMES_2 - angle;
  const [tx, ty] = [-Math.cos(α) * distance, Math.sin(α) * distance];
  const transform = AffineTransformation.translationInstance(tx, ty);
  const copy = geom.copy();
  copy.apply(transform);
  return copy;
};

export const reflect = (x0: number, y0: number, x1: number, y1: number) => (geom: any) => {
  const transform = AffineTransformation.reflectionInstance(x0, y0, x1, y1);
  const copy = geom.copy();
  copy.apply(transform);
  return copy;
};

export const points = (geom: any): any[] => {
  const type = geom.getGeometryType();
  switch (type) {
    case 'Point': return [geom];
    case 'MultiPoint': return geometries(geom);
    case 'LineString':
    case 'LinearRing': {
      const n = geom.getNumPoints();
      const res = [];
      for (let i = 0; i < n; i++) res.push(geom.getPointN(i));
      return res;
    }
    case 'Polygon': return points(geom.getExteriorRing());
    case 'GeometryCollection': return geometries(geom).flatMap(points);
    default: return [];
  }
};

/** The full TS object — passed as first argument to all Odin style functions */
export const TS = {
  PI_OVER_2, PI_OVER_3, PI,
  /** jsts Coordinate class — corridor-styles/commons.js uses `new TS.Coordinate(...)` */
  Coordinate,
  coordinate, coordinates, point, multiPoint,
  lineString, multiLineString, polygon, collect,
  segment, segments, lengthIndexedLine, segmentize,
  buffer: makeBuffer(), pointBuffer, lineBuffer, singleSidedLineBuffer, simpleBuffer,
  BufferParameters,
  projectCoordinate, projectCoordinates,
  centroid, minimumRectangle, convexHull, rotation, normalizePositive,
  boundary, startPoint, endPoint, union, difference, intersection,
  equals, intersects, geometries, arc, translate, reflect, points,
};
