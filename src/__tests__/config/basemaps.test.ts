import { afterEach, describe, expect, it } from 'vitest';
import Cookies from 'js-cookie';
import { basemapStyle, getSavedBasemapKey, resolveBasemaps } from '../../config/basemaps';

describe('basemap preferences', () => {
  afterEach(() => Cookies.remove('preferred_basemap'));

  it.each([undefined, 'cartoLight', 'openStreetMap', 'esriWorldImagery', 'unknown', 'constructor', '__proto__'])(
    'uses OpenFreeMap for missing or obsolete preference %s',
    (value) => {
      if (value) Cookies.set('preferred_basemap', value);
      expect(getSavedBasemapKey()).toBe('openFreeMap');
    }
  );

  it('preserves a supported preference', () => {
    Cookies.set('preferred_basemap', 'openFreeMapDark');
    expect(getSavedBasemapKey()).toBe('openFreeMapDark');
  });

  it('supports institution-specific raster styles with attribution and zoom limits', () => {
    const basemap = { id: 'institution', label: { en: 'Institution' }, tiles: ['https://example.org/{z}/{x}/{y}.png'], attribution: 'Institution credit', tile_size: 256, max_zoom: 18 };
    const config = { basemaps: [basemap], default_basemap: 'institution' };
    expect(getSavedBasemapKey(config)).toBe('institution');
    expect(resolveBasemaps(config).fallback.id).toBe('openFreeMap');
    expect(basemapStyle(basemap)).toMatchObject({
      sources: { basemap: { type: 'raster', tiles: basemap.tiles, attribution: 'Institution credit', tileSize: 256, maxzoom: 18 } },
    });
  });
});
