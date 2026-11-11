import { describe, expect, it } from 'vitest';
import { transform } from 'ol/proj';
import { ensureOpenLayersProjection } from '../../utils/openlayersProjection';

describe('openlayersProjection', () => {
  it.each([
    ['  epsg:32633  ', 'EPSG:32633', 0],
    ['32733', 'EPSG:32733', 10000000],
  ])(
    'registers WGS84 UTM coordinates for %s locally',
    async (input, code, northing) => {
      await ensureOpenLayersProjection(input);
      const coordinate = transform([500000, northing], code, 'EPSG:4326');
      expect(coordinate[0]).toBeCloseTo(15, 5);
      expect(coordinate[1]).toBeCloseTo(0, 5);
      await ensureOpenLayersProjection(code);
      expect(transform([500000, northing], code, 'EPSG:4326')).toEqual(
        coordinate
      );
    }
  );

  it.each([undefined, null, '', 'not-an-epsg-code', 'EPSG:4326', 'EPSG:3857'])(
    'does not fetch projections for built-in or invalid code %s',
    async (code) => {
      await expect(ensureOpenLayersProjection(code)).resolves.toBeUndefined();
    }
  );
  it('registers NAD83 UTM zone projections used by COG metadata', async () => {
    await ensureOpenLayersProjection('EPSG:26911');

    const webMercator = transform(
      [694661.1399468984, 3983100.1619066237],
      'EPSG:26911',
      'EPSG:3857'
    );

    expect(webMercator[0]).toBeCloseTo(-12784048, 0);
    expect(webMercator[1]).toBeCloseTo(4296896, 0);
  });
});
