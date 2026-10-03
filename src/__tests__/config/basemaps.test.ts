import { afterEach, describe, expect, it, vi } from 'vitest';
import Cookies from 'js-cookie';
import type L from 'leaflet';
import { createBasemapLayer, getSavedBasemapKey } from '../../config/basemaps';
import style from '../../config/openStreetMapStyle.json';

describe('basemap preferences', () => {
  afterEach(() => Cookies.remove('preferred_basemap'));

  it.each([undefined, 'cartoLight', 'unknown', 'constructor', '__proto__'])(
    'uses OpenStreetMap for missing or obsolete preference %s',
    (value) => {
      if (value) Cookies.set('preferred_basemap', value);
      expect(getSavedBasemapKey()).toBe('openStreetMap');
    }
  );

  it('preserves an imagery preference', () => {
    Cookies.set('preferred_basemap', 'esriWorldImagery');
    expect(getSavedBasemapKey()).toBe('esriWorldImagery');
  });

  it('uses the same tiles, attribution, and native zoom limit in both map engines', () => {
    const tileLayer = vi.fn();
    createBasemapLayer({ tileLayer } as unknown as typeof L, 'openStreetMap');
    expect(tileLayer).toHaveBeenCalledWith(
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: style.sources.openStreetMap.attribution,
        maxZoom: style.sources.openStreetMap.maxzoom,
      }
    );
    expect(style.sources.openStreetMap.tileSize).toBe(256);
    expect(style.layers[0].source).toBe('openStreetMap');
  });
});
