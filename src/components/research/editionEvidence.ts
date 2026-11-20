import { buildThemeHomePath } from '../../utils/appRoutes';

export type ResearchPoint = [number, number];
export type ResearchCamera = {
  center: { lng: number; lat: number };
  zoom: number;
  bearing: number;
  pitch: number;
};
export function parseResearchPoint(value: string | null): ResearchPoint | null {
  if (!value) return null;
  const parts = value.split(',');
  if (parts.length !== 2 || parts.some((p) => !p.trim())) return null;
  const [lng, lat] = parts.map(Number);
  return Number.isFinite(lng) &&
    Number.isFinite(lat) &&
    Math.abs(lng) <= 180 &&
    Math.abs(lat) <= 85
    ? [lng, lat]
    : null;
}
export function pointText(point: ResearchPoint) {
  return point.map((n) => n.toFixed(5)).join(', ');
}
export function parseResearchCamera(
  value: string | null
): ResearchCamera | null {
  const parts = value?.split(',');
  if (!parts || parts.length !== 3 || !parts[2].trim()) return null;
  const point = parseResearchPoint(parts.slice(0, 2).join(','));
  const zoom = Number(parts[2]);
  return point && Number.isFinite(zoom) && zoom >= 0 && zoom <= 22
    ? { center: { lng: point[0], lat: point[1] }, zoom, bearing: 0, pitch: 0 }
    : null;
}
export function cameraText(camera: ResearchCamera) {
  return `${camera.center.lng.toFixed(5)},${camera.center.lat.toFixed(5)},${camera.zoom.toFixed(3)}`;
}
export function researchUrl(
  themeId: string,
  route: string,
  params?: URLSearchParams
) {
  const url = new URL(buildThemeHomePath(themeId), window.location.origin);
  url.hash = route + (params?.size ? `?${params}` : '');
  return url.toString();
}
