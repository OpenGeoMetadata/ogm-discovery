import { describe, expect, it } from 'vitest';
import {
  discoveryFilters,
  nearPoint,
  placeBounds,
  recordBounds,
  recordFeature,
  relatedKey,
} from '../../../components/research/topoDiscovery';
import type { GazetteerPlace, GeoDocument } from '../../../types/api';
const record = (ogm: Record<string, unknown>) =>
  ({
    id: 'scan',
    attributes: { ogm: { dct_title_s: 'Original title', ...ogm } },
  }) as unknown as GeoDocument;
describe('historical discovery contract', () => {
  it('does not invent canonical groups or geometry from unstructured titles', () => {
    expect(recordBounds(record({}))).toBeNull();
    expect(recordFeature(record({ dcat_bbox: 'broken' }))).toBeNull();
    expect(
      relatedKey(record({ dcat_bbox: 'ENVELOPE(-94, -93, 45, 44)' }))
    ).toBeNull();
    const a = record({
      dcat_bbox: 'ENVELOPE(-94, -93, 45, 44)',
      dct_alternative_sm: ['Minneapolis'],
      dct_issued_s: '1896',
    });
    const b = record({
      ...a.attributes.ogm,
      dct_title_s: 'Another printing',
      dct_issued_s: '1901',
    });
    expect(relatedKey(a)).toBe(relatedKey(b));
    expect(recordFeature(a)?.properties).toEqual({
      recId: 'scan',
      title: 'Original title',
      label: 'Original title',
      datePub: '1896',
    });
    expect(
      relatedKey(
        record({ ...a.attributes.ogm, dct_alternative_sm: ['Saint Paul'] })
      )
    ).not.toBe(relatedKey(a));
    expect(
      recordBounds(record({ dcat_bbox: 'ENVELOPE(-93, -94, 45, 44)' }))
    ).toBeNull();
  });
  it('validates place extents and keeps point envelopes non-degenerate at map edges', () => {
    expect(placeBounds({ attributes: {} } as GazetteerPlace)).toBeNull();
    for (const point of [
      [180, 85],
      [-180, -85],
      [-93.265, 44.977],
    ] as [number, number][]) {
      const [w, s, e, n] = nearPoint(point);
      expect(w).toBeLessThan(e);
      expect(s).toBeLessThan(n);
      expect(w).toBeGreaterThanOrEqual(-180);
      expect(e).toBeLessThanOrEqual(180);
    }
  });
  it('uses explicit filters without inheriting stale catalog URL state', () => {
    const params = discoveryFilters(null, undefined, '', '');
    expect(params.get('exclude_filters[gbl_resourceType_sm][]')).toBe(
      'Index maps'
    );
    expect(params.has('include_filters[geo][type]')).toBe(false);
    expect(params.has('include_filters[year_range][start]')).toBe(false);
  });
});
