import { cellToBoundary, isValidCell } from 'h3-js';
import { normalizeBboxSearchEnvelope } from './bbox';
import { zoomToResolution } from './h3Resolution';
import type { MapBounds } from './mapGeometry';

export const mapZoomToResolution = (zoom: number) => zoomToResolution(zoom + 1);
const COLORS = [
  '#DBEAFE',
  '#BFDBFE',
  '#93C5FD',
  '#7AB3FD',
  '#60A5FA',
  '#3B82F6',
  '#2563EB',
  '#1D4ED8',
  '#1E40AF',
  '#003C5B',
];
/** Unwrap each ring locally so cells at the dateline never stretch across the world. */
export function hexGeoJSON(
  hexes: Array<{ h3: string; count: number }>
): GeoJSON.FeatureCollection {
  const valid = hexes.filter(
    (h) => isValidCell(h.h3) && Number.isFinite(h.count) && h.count >= 0
  );
  const max = valid.reduce((n, h) => Math.max(n, h.count), 1);
  return {
    type: 'FeatureCollection',
    features: valid.map((h) => {
      const ring = cellToBoundary(h.h3).map(([lat, lon]) => [lon, lat]);
      for (let i = 1; i < ring.length; i++) {
        while (ring[i][0] - ring[i - 1][0] > 180) ring[i][0] -= 360;
        while (ring[i][0] - ring[i - 1][0] < -180) ring[i][0] += 360;
      }
      ring.push([...ring[0]]);
      const intensity = Math.log(h.count + 1) / Math.log(max + 1);
      return {
        type: 'Feature',
        id: h.h3,
        properties: {
          ...h,
          color:
            COLORS[Math.max(0, Math.min(9, Math.ceil(intensity * 10) - 1))],
        },
        geometry: { type: 'Polygon', coordinates: [ring] },
      };
    }),
  };
}
export function h3RequestBboxes(bounds: MapBounds): string[] {
  const b = normalizeBboxSearchEnvelope(...bounds[0], ...bounds[1]);
  if (!b) return [];
  const { lon: w, lat: n } = b.topLeft;
  const { lon: e, lat: s } = b.bottomRight;
  return w > e
    ? [`${w},${s},180,${n}`, `-180,${s},${e},${n}`]
    : [`${w},${s},${e},${n}`];
}
