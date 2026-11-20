import type { GeoDocument, GazetteerPlace } from '../../types/api';
import {
  bboxFeature,
  parseBbox,
  type Bbox,
  type IndexFeature,
} from '../../services/research';
import { parseBboxToLeafletBounds } from '../../utils/bbox';
import type { ResearchPoint } from './editionEvidence';

export function recordBounds(record: GeoDocument): Bbox | null {
  const value = record.attributes.ogm.dcat_bbox;
  if (typeof value !== 'string') return null;
  const bounds = parseBboxToLeafletBounds(value);
  return bounds
    ? parseBbox(
        [bounds[0][1], bounds[0][0], bounds[1][1], bounds[1][0]].join(',')
      )
    : null;
}
export function placeBounds(place: GazetteerPlace): Bbox | null {
  const a = place.attributes;
  return parseBbox(
    [a.min_longitude, a.min_latitude, a.max_longitude, a.max_latitude].join(',')
  );
}
// The API ignores zero-area boxes. Use an explicit small area, never claim a
// point-in-polygon query. Round outward to avoid its tiny-envelope edge case.
export function nearPoint([lng, lat]: ResearchPoint): Bbox {
  return [
    Math.max(-180, Math.floor((lng - 0.005) * 100) / 100),
    Math.max(-85, Math.floor((lat - 0.005) * 100) / 100),
    Math.min(180, Math.ceil((lng + 0.005) * 100) / 100),
    Math.min(85, Math.ceil((lat + 0.005) * 100) / 100),
  ];
}
export function discoveryFilters(
  area: Bbox | null,
  resourceType: string | undefined,
  start: string,
  end: string
) {
  const params = new URLSearchParams();
  if (resourceType)
    params.set('include_filters[gbl_resourceType_sm][]', resourceType);
  else params.set('exclude_filters[gbl_resourceType_sm][]', 'Index maps');
  if (area) {
    const [w, s, e, n] = area;
    Object.entries({
      type: 'bbox',
      field: 'dcat_bbox',
      relation: 'intersects',
      'top_left][lat': String(n),
      'top_left][lon': String(w),
      'bottom_right][lat': String(s),
      'bottom_right][lon': String(e),
    }).forEach(([key, value]) =>
      params.set(`include_filters[geo][${key}]`, value)
    );
  }
  if (start) params.set('include_filters[year_range][start]', start);
  if (end) params.set('include_filters[year_range][end]', end);
  return params;
}
export function relatedKey(record: GeoDocument): string | null {
  const names = record.attributes.ogm.dct_alternative_sm;
  const bounds = recordBounds(record);
  return Array.isArray(names) && names.length && bounds
    ? JSON.stringify([[...names].sort(), bounds])
    : null;
}
export function recordFeature(record: GeoDocument): IndexFeature | null {
  const bounds = recordBounds(record);
  if (!bounds) return null;
  const ogm = record.attributes.ogm;
  return {
    ...bboxFeature(bounds),
    properties: {
      recId: record.id,
      title: ogm.dct_title_s,
      label: ogm.dct_title_s,
      datePub:
        typeof ogm.dct_issued_s === 'string' ? ogm.dct_issued_s : undefined,
    },
  };
}
