import { describe, expect, it } from 'vitest';
import { latLngToCell } from 'h3-js';
import {
  hexGeoJSON,
  h3RequestBboxes,
  mapZoomToResolution,
} from '../../utils/h3Map';
import {
  boundsPolygon,
  readSearchBounds,
  writeSearchBounds,
  geometryData,
  dataBounds,
} from '../../utils/mapGeometry';
import { resolveBasemaps } from '../../config/basemaps';
describe('Map migration contracts', () => {
  it('preserves H3 thresholds at equivalent geographic scales', () => {
    expect([2, 3, 5, 7, 9, 11, 12].map(mapZoomToResolution)).toEqual([
      2, 3, 4, 5, 6, 7, 8,
    ]);
  });
  it('splits crossing viewports and unwraps dateline cells', () => {
    expect(
      h3RequestBboxes([
        [170, -10],
        [190, 10],
      ])
    ).toEqual(['170,-10,180,10', '-180,-10,-170,10']);
    const data = hexGeoJSON([
      { h3: latLngToCell(0, 179.99, 3), count: 10 },
      { h3: 'invalid', count: 2 },
    ]);
    expect(data.features).toHaveLength(1);
    const bounds = dataBounds(data)!;
    expect(bounds[1][0] - bounds[0][0]).toBeLessThan(10);
  });
  it('round trips bbox filters and preserves unrelated filters', () => {
    const params = writeSearchBounds(
      new URLSearchParams('q=water&page=3'),
      [
        [170, -10],
        [190, 10],
      ],
      'within'
    )!;
    expect(readSearchBounds(params)).toEqual([
      [170, -10],
      [190, 10],
    ]);
    expect(params.get('q')).toBe('water');
    expect(params.has('page')).toBe(false);
  });
  it('retains polygon holes', () => {
    const geometry = {
      type: 'Polygon',
      coordinates: [
        [
          [0, 0],
          [10, 0],
          [10, 10],
          [0, 0],
        ],
        [
          [1, 1],
          [2, 1],
          [2, 2],
          [1, 1],
        ],
      ],
    };
    expect(geometryData(geometry).features[0].geometry).toEqual(geometry);
    expect(
      boundsPolygon([
        [170, 0],
        [-170, 10],
      ]).features[0].geometry.type
    ).toBe('Polygon');
  });
  it('provides defaults for small institutions and custom provider fallback', () => {
    expect(resolveBasemaps().defaultId).toBe('openFreeMap');
    expect(
      resolveBasemaps({
        basemaps: [
          { id: 'campus', label: { en: 'Campus' }, style_url: '/style.json' },
        ],
      }).defaultId
    ).toBe('campus');
  });
});

it('parses WKT holes and rejects malformed coordinate arrays', () => {
  const data = geometryData('POLYGON ((0 0,10 0,10 10,0 0),(1 1,2 1,2 2,1 1))');
  expect(
    (data.features[0].geometry as GeoJSON.Polygon).coordinates
  ).toHaveLength(2);
  expect(
    geometryData({ type: 'Polygon', coordinates: [[[0, NaN]]] }).features
  ).toHaveLength(0);
});

it('computes bounds for dense H3 responses without argument-stack overflow', () => {
  const hex = hexGeoJSON([{ h3: latLngToCell(40, -90, 4), count: 1 }])
    .features[0];
  expect(
    dataBounds({ type: 'FeatureCollection', features: Array(30000).fill(hex) })
  ).not.toBeNull();
});
