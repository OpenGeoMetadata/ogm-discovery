// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import {
  bboxFeature,
  featureBounds,
  imageryUrl,
  intersects,
  parseBbox,
  parseDailyPeriods,
  sheetKey,
  validDay,
  type IndexFeature,
} from './research';

const feature = (
  id: string,
  bbox: [number, number, number, number]
): IndexFeature => ({
  ...bboxFeature(bbox),
  properties: {
    recId: id,
    title: 'Bright Angel',
    label: 'Bright Angel',
    scale: '1:48,000',
  },
});
describe('research asset semantics', () => {
  it('rejects reversed, empty, polar and antimeridian-crossing study bounds', () => {
    expect(parseBbox('-92.2,41.2,-91.6,41.8')).toEqual([
      -92.2, 41.2, -91.6, 41.8,
    ]);
    for (const value of [
      '-92,,0,42',
      '1,2,1,4',
      '170,0,-170,20',
      '-180,-90,180,90',
      'a,1,2,3',
    ])
      expect(parseBbox(value)).toBeNull();
  });
  it('selects positive-area overlaps, excluding tiles merely touching the study edge', () => {
    expect(intersects([-92.2, 41.2, -91.6, 41.8], [-92, 41, -91, 42])).toBe(
      true
    );
    expect(intersects([-92.2, 41.2, -91.6, 41.8], [-93, 41, -92, 42])).toBe(
      true
    );
    expect(intersects([-92, 41, -91, 42], [-91, 41, -90, 42])).toBe(false);
  });
  it('groups printings with reversed or rotated rings but separates scale and footprint', () => {
    const a = feature('a', [-112.25, 36, -112, 36.25]);
    const b = feature('b', [-112.25, 36, -112, 36.25]);
    b.geometry.coordinates[0].reverse();
    expect(sheetKey(a)).toBe(sheetKey(b));
    expect(featureBounds(a)).toEqual([-112.25, 36, -112, 36.25]);
    b.properties.scale = '1:24,000';
    expect(sheetKey(a)).not.toBe(sheetKey(b));
    expect(sheetKey(a)).not.toBe(
      sheetKey(feature('c', [-112.25, 36, -112, 36.5]))
    );
  });
  it('validates all daily periods and rejects missing days and invalid calendar dates', () => {
    const xml =
      '<Domains xmlns:ows="http://www.opengis.net/ows/1.1"><DimensionDomain><ows:Identifier>time</ows:Identifier><Domain>2024-01-01/2025-08-08/P1D,2025-08-10/2025-11-08/P1D</Domain></DimensionDomain></Domains>';
    const periods = parseDailyPeriods(xml);
    expect(validDay('2025-08-08', periods)).toBe(true);
    expect(validDay('2025-08-09', periods)).toBe(false);
    expect(validDay('2025-08-10', periods)).toBe(true);
    expect(validDay('2025-02-30', periods)).toBe(false);
    expect(() => parseDailyPeriods(xml.replaceAll('P1D', 'P1M'))).toThrow();
    expect(() =>
      parseDailyPeriods('<ServiceException>Unavailable</ServiceException>')
    ).toThrow();
  });
  it('compares identical extents using explicit dates and longitude-first WMS 1.1.1', () => {
    const a = new URL(
      imageryUrl(
        'https://example.org/wms',
        'layer',
        '2024-06-01',
        [-125, 32, -114, 42]
      )
    );
    const b = new URL(
      imageryUrl(
        'https://example.org/wms',
        'layer',
        '2024-12-01',
        [-125, 32, -114, 42]
      )
    );
    expect(a.searchParams.get('VERSION')).toBe('1.1.1');
    expect(a.searchParams.get('SRS')).toBe('EPSG:4326');
    expect(a.searchParams.get('BBOX')).toBe('-125,32,-114,42');
    expect(a.searchParams.get('TIME')).toBe('2024-06-01');
    expect(b.searchParams.get('TIME')).toBe('2024-12-01');
    a.searchParams.delete('TIME');
    b.searchParams.delete('TIME');
    expect(a.toString()).toBe(b.toString());
  });
});
