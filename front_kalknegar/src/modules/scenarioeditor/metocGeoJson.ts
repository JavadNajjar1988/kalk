function finitePosition(value: unknown): value is GeoJSON.Position {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1])
  );
}

function cleanLine(value: unknown): GeoJSON.Position[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const coordinates = value.filter(finitePosition);
  return coordinates.length >= 2 ? coordinates : undefined;
}

function cleanRing(value: unknown): GeoJSON.Position[] | undefined {
  const coordinates = cleanLine(value);
  if (!coordinates || coordinates.length < 3) return undefined;
  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) coordinates.push([...first]);
  return coordinates.length >= 4 ? coordinates : undefined;
}

export function sanitizeMetocGeometry(
  geometry: GeoJSON.Geometry | null | undefined,
): GeoJSON.Geometry | undefined {
  if (!geometry) return undefined;

  switch (geometry.type) {
    case "Point":
      return finitePosition(geometry.coordinates) ? geometry : undefined;
    case "MultiPoint": {
      const coordinates = geometry.coordinates.filter(finitePosition);
      return coordinates.length ? { ...geometry, coordinates } : undefined;
    }
    case "LineString": {
      const coordinates = cleanLine(geometry.coordinates);
      return coordinates ? { ...geometry, coordinates } : undefined;
    }
    case "MultiLineString": {
      const coordinates = geometry.coordinates
        .map(cleanLine)
        .filter((line): line is GeoJSON.Position[] => Boolean(line));
      return coordinates.length ? { ...geometry, coordinates } : undefined;
    }
    case "Polygon": {
      const outer = cleanRing(geometry.coordinates[0]);
      if (!outer) return undefined;
      const holes = geometry.coordinates
        .slice(1)
        .map(cleanRing)
        .filter((ring): ring is GeoJSON.Position[] => Boolean(ring));
      return { ...geometry, coordinates: [outer, ...holes] };
    }
    case "MultiPolygon": {
      const coordinates = geometry.coordinates
        .map((polygon) => {
          const outer = cleanRing(polygon[0]);
          if (!outer) return undefined;
          const holes = polygon
            .slice(1)
            .map(cleanRing)
            .filter((ring): ring is GeoJSON.Position[] => Boolean(ring));
          return [outer, ...holes];
        })
        .filter((polygon): polygon is GeoJSON.Position[][] => Boolean(polygon));
      return coordinates.length ? { ...geometry, coordinates } : undefined;
    }
    case "GeometryCollection": {
      const geometries = geometry.geometries
        .map(sanitizeMetocGeometry)
        .filter((item): item is GeoJSON.Geometry => Boolean(item));
      return geometries.length ? { ...geometry, geometries } : undefined;
    }
  }
}

export function sanitizeMetocFeatureCollection(
  collection: GeoJSON.FeatureCollection,
): GeoJSON.FeatureCollection | undefined {
  const features = collection.features.flatMap((feature) => {
    const geometry = sanitizeMetocGeometry(feature.geometry);
    return geometry ? [{ ...feature, geometry }] : [];
  });
  return features.length ? { ...collection, features } : undefined;
}
