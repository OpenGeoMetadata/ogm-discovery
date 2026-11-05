import type { GeoDocument } from '../types/api';
import { fetchResourceDetails } from './api';

export type Bbox = [number, number, number, number];
export type IndexFeature = GeoJSON.Feature<
  GeoJSON.Polygon,
  {
    recId: string;
    title: string;
    label: string;
    datePub?: string;
    dateSurvey?: string;
    dateReprnt?: string;
    scale?: string;
    download?: string;
    websiteUrl?: string;
    available?: boolean;
  }
>;
export function references(record: GeoDocument): Record<string, unknown> {
  const raw = record.attributes.ogm.dct_references_s;
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : (raw ?? {});
  } catch {
    return {};
  }
}
export function reference(
  record: GeoDocument,
  key: string
): string | undefined {
  const value = references(record)[key];
  return typeof value === 'string' && /^https?:\/\//.test(value)
    ? value
    : undefined;
}
export function parseBbox(value: string): Bbox | null {
  const values = value.split(',').map(Number);
  if (
    values.length !== 4 ||
    value.split(',').some((v) => !v.trim()) ||
    !values.every(Number.isFinite)
  )
    return null;
  const [w, s, e, n] = values;
  return w >= -180 && e <= 180 && s >= -85 && n <= 85 && w < e && s < n
    ? [w, s, e, n]
    : null;
}
export function featureBounds(feature: IndexFeature): Bbox {
  const points = feature.geometry.coordinates.flat();
  return [
    Math.min(...points.map((p) => p[0])),
    Math.min(...points.map((p) => p[1])),
    Math.max(...points.map((p) => p[0])),
    Math.max(...points.map((p) => p[1])),
  ];
}
export function intersects(a: Bbox, b: Bbox) {
  return a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
}
export function bboxFeature(bbox: Bbox): GeoJSON.Feature<GeoJSON.Polygon> {
  const [w, s, e, n] = bbox;
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [w, s],
          [e, s],
          [e, n],
          [w, n],
          [w, s],
        ],
      ],
    },
  };
}
// Conservative grouping: same structured name, scale and exact normalized polygon.
export function sheetKey(feature: IndexFeature) {
  const points = feature.geometry.coordinates
    .map((ring) => [...new Set(ring.map((p) => JSON.stringify(p)))].sort())
    .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  return JSON.stringify([
    feature.properties.title,
    feature.properties.scale,
    points,
  ]);
}
export async function fetchIndex(
  id: string,
  signal: AbortSignal
): Promise<IndexFeature[]> {
  const record = await fetchResourceDetails(id);
  const url = reference(record, 'https://openindexmaps.org');
  if (!url) throw new Error('index');
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error('index');
  const data = await response.json();
  if (data.type !== 'FeatureCollection' || !Array.isArray(data.features))
    throw new Error('index');
  return data.features.filter(
    (f: IndexFeature) =>
      f.geometry?.type === 'Polygon' &&
      typeof f.properties?.recId === 'string' &&
      f.geometry.coordinates
        ?.flat()
        .every((p) => p.length >= 2 && p.every(Number.isFinite))
  );
}
export type DailyPeriod = { start: string; end: string };
export function parseDailyPeriods(xml: string): DailyPeriod[] {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  if (doc.querySelector('parsererror')) throw new Error('domain');
  const domain = [...doc.getElementsByTagName('DimensionDomain')].find(
    (node) =>
      node.getElementsByTagNameNS('*', 'Identifier')[0]?.textContent === 'time'
  );
  const values =
    domain?.getElementsByTagName('Domain')[0]?.textContent?.split(',') ?? [];
  if (!values.length) throw new Error('domain');
  return values.map((value) => {
    const [start, end, period] = value.trim().split('/');
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(start) ||
      (end && !/^\d{4}-\d{2}-\d{2}$/.test(end)) ||
      (end && period !== 'P1D')
    )
      throw new Error('cadence');
    return { start, end: end ?? start };
  });
}
export function validDay(day: string, periods: DailyPeriod[]) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(day) &&
    !Number.isNaN(Date.parse(day)) &&
    new Date(day).toISOString().slice(0, 10) === day &&
    periods.some((p) => day >= p.start && day <= p.end)
  );
}
export function imageryUrl(
  endpoint: string,
  layer: string,
  day: string,
  bbox: Bbox
) {
  const url = new URL(endpoint);
  const ratio = (bbox[2] - bbox[0]) / (bbox[3] - bbox[1]);
  const params = {
    SERVICE: 'WMS',
    REQUEST: 'GetMap',
    VERSION: '1.1.1',
    LAYERS: layer,
    STYLES: '',
    SRS: 'EPSG:4326',
    BBOX: bbox.join(','),
    WIDTH: String(Math.max(1, Math.round(1000 * Math.min(1, ratio)))),
    HEIGHT: String(Math.max(1, Math.round(1000 * Math.min(1, 1 / ratio)))),
    FORMAT: 'image/jpeg',
    TIME: day,
  };
  Object.entries(params).forEach(([key, value]) =>
    url.searchParams.set(key, value)
  );
  return url.toString();
}
