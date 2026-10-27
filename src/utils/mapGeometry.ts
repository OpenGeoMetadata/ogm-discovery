import type { Map as GLMap, LngLatBoundsLike } from 'maplibre-gl';
import { normalizeGeometry } from './geometryUtils';
import { wktToGeoJSON } from '@terraformer/wkt';
import { normalizeBboxSearchEnvelope } from './bbox';

export type MapBounds = [[number, number], [number, number]];
export const EMPTY_GEOJSON: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [],
};
export const toLngLat = ([lat, lng]: [number, number]): [number, number] => [
  lng,
  lat,
];
export const toMapBounds = (bounds: MapBounds): MapBounds => [
  toLngLat(bounds[0]),
  toLngLat(bounds[1]),
];
/** Reject malformed coordinates before they reach a WebGL worker. */
function validGeometry(value: unknown): value is GeoJSON.Geometry {
  if (!value || typeof value !== 'object' || !('type' in value)) return false;
  const geometry = value as GeoJSON.Geometry;
  const position = (p: unknown): boolean =>
    Array.isArray(p) &&
    p.length >= 2 &&
    p.every(Number.isFinite) &&
    Math.abs(p[1]) <= 90;
  const line = (p: unknown): boolean =>
    Array.isArray(p) && p.length >= 2 && p.every(position);
  const ring = (p: unknown): boolean =>
    Array.isArray(p) &&
    p.length >= 4 &&
    p.every(position) &&
    p[0][0] === p[p.length - 1][0] &&
    p[0][1] === p[p.length - 1][1];
  const polygon = (p: unknown): boolean =>
    Array.isArray(p) && p.length > 0 && p.every(ring);
  switch (geometry.type) {
    case 'Point':
      return position(geometry.coordinates);
    case 'MultiPoint':
      return (
        Array.isArray(geometry.coordinates) &&
        geometry.coordinates.every(position)
      );
    case 'LineString':
      return line(geometry.coordinates);
    case 'MultiLineString':
      return (
        Array.isArray(geometry.coordinates) && geometry.coordinates.every(line)
      );
    case 'Polygon':
      return polygon(geometry.coordinates);
    case 'MultiPolygon':
      return (
        Array.isArray(geometry.coordinates) &&
        geometry.coordinates.every(polygon)
      );
    case 'GeometryCollection':
      return (
        Array.isArray(geometry.geometries) &&
        geometry.geometries.every(validGeometry)
      );
    default:
      return false;
  }
}
function unwrapGeometry(geometry: GeoJSON.Geometry): GeoJSON.Geometry {
  const unwrap = (ring: GeoJSON.Position[]) => {
    // A world envelope is intentionally wide; preserve it.
    if (ring.some((p, i) => i > 0 && Math.abs(p[0] - ring[i - 1][0]) >= 359.99))
      return ring;
    const result = ring.map((p) => [...p]);
    for (let i = 1; i < result.length; i++) {
      while (result[i][0] - result[i - 1][0] > 180) result[i][0] -= 360;
      while (result[i][0] - result[i - 1][0] < -180) result[i][0] += 360;
    }
    return result;
  };
  if (geometry.type === 'Polygon')
    return { ...geometry, coordinates: geometry.coordinates.map(unwrap) };
  if (geometry.type === 'MultiPolygon')
    return {
      ...geometry,
      coordinates: geometry.coordinates.map((p) => p.map(unwrap)),
    };
  return geometry;
}
export function geometryData(value: unknown): GeoJSON.FeatureCollection {
  if (!value) return EMPTY_GEOJSON;
  try {
    let parsed: unknown = value;
    if (typeof parsed === 'object' && parsed && 'wkt' in parsed)
      parsed = parsed.wkt;
    if (typeof parsed === 'string') {
      parsed = parsed.trim().startsWith('{')
        ? JSON.parse(parsed)
        : /^ENVELOPE/i.test(parsed)
          ? normalizeGeometry(parsed)
          : wktToGeoJSON(parsed);
    }
    if (!parsed || typeof parsed !== 'object' || !('type' in parsed))
      return EMPTY_GEOJSON;
    const collection = parsed as GeoJSON.GeoJsonObject;
    const features: GeoJSON.Feature[] =
      collection.type === 'FeatureCollection'
        ? (parsed as GeoJSON.FeatureCollection).features
        : collection.type === 'Feature'
          ? [parsed as GeoJSON.Feature]
          : [
              {
                type: 'Feature',
                properties: {},
                geometry: parsed as GeoJSON.Geometry,
              },
            ];
    return {
      type: 'FeatureCollection',
      features: features
        .filter((f) => f && validGeometry(f.geometry))
        .map((f) => ({ ...f, geometry: unwrapGeometry(f.geometry) })),
    };
  } catch {
    return EMPTY_GEOJSON;
  }
}
export function dataBounds(data: GeoJSON.FeatureCollection): MapBounds | null {
  let west = Infinity,
    south = Infinity,
    east = -Infinity,
    north = -Infinity;
  const walk = (coordinates: unknown) => {
    if (!Array.isArray(coordinates)) return;
    if (typeof coordinates[0] === 'number') {
      if (
        coordinates.length >= 2 &&
        coordinates.every(Number.isFinite) &&
        Math.abs(coordinates[1]) <= 90
      ) {
        west = Math.min(west, coordinates[0]);
        east = Math.max(east, coordinates[0]);
        south = Math.min(south, coordinates[1]);
        north = Math.max(north, coordinates[1]);
      }
    } else coordinates.forEach(walk);
  };
  const visit = (geometry: GeoJSON.Geometry | null) => {
    if (!geometry) return;
    if (geometry.type === 'GeometryCollection')
      geometry.geometries.forEach(visit);
    else walk(geometry.coordinates);
  };
  data.features.forEach((f) => visit(f.geometry));
  return Number.isFinite(west)
    ? [
        [west, south],
        [east, north],
      ]
    : null;
}
export function boundsPolygon([
  [west, south],
  [east, north],
]: MapBounds): GeoJSON.FeatureCollection {
  if (east < west) east += 360;
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [west, south],
              [east, south],
              [east, north],
              [west, north],
              [west, south],
            ],
          ],
        },
      },
    ],
  };
}
export function fitMap(
  map: GLMap,
  bounds: LngLatBoundsLike,
  padding = 24,
  maxZoom = 13
) {
  map.fitBounds(bounds, {
    padding,
    maxZoom,
    duration: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      ? 0
      : 400,
  });
}
export function readSearchBounds(params: URLSearchParams): MapBounds | null {
  if (params.get('include_filters[geo][type]') !== 'bbox') return null;
  const keys = [
    'bottom_right][lat',
    'top_left][lon',
    'top_left][lat',
    'bottom_right][lon',
  ];
  const raw = keys.map((k) => params.get(`include_filters[geo][${k}]`));
  if (raw.some((v) => v === null || v === '')) return null;
  const [south, west, north, east] = raw.map(Number);
  if (
    ![south, west, north, east].every(Number.isFinite) ||
    south >= north ||
    south < -90 ||
    north > 90
  )
    return null;
  return [
    [west, south],
    [east < west ? east + 360 : east, north],
  ];
}
export function clearSearchBounds(params: URLSearchParams) {
  for (const key of Array.from(params.keys()))
    if (key.startsWith('include_filters[geo]')) params.delete(key);
  params.delete('page');
  return params;
}
export function writeSearchBounds(
  params: URLSearchParams,
  bounds: MapBounds,
  relation = 'intersects'
) {
  const bbox = normalizeBboxSearchEnvelope(...bounds[0], ...bounds[1]);
  if (!bbox) return null;
  clearSearchBounds(params);
  params.set('include_filters[geo][type]', 'bbox');
  params.set('include_filters[geo][field]', 'dcat_bbox');
  params.set('include_filters[geo][relation]', relation);
  for (const [corner, point] of [
    ['top_left', bbox.topLeft],
    ['bottom_right', bbox.bottomRight],
  ] as const) {
    params.set(`include_filters[geo][${corner}][lat]`, String(point.lat));
    params.set(`include_filters[geo][${corner}][lon]`, String(point.lon));
  }
  return params;
}

export function spiderOffsets(count: number): [number, number][] {
  return Array.from({ length: count }, (_, i) => {
    const angle = count < 9 ? (i * 2 * Math.PI) / count : i * 0.8;
    const radius = count < 9 ? Math.max(40, count * 7) : 35 + i * 5;
    return [Math.cos(angle) * radius, Math.sin(angle) * radius];
  });
}
