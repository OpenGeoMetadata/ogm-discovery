import Cookies from 'js-cookie';
import type { StyleSpecification } from 'maplibre-gl';
import type { BasemapConfig, ThemeMapConfig } from './institution';

export const OPEN_FREE_MAP_LIGHT =
  'https://tiles.openfreemap.org/styles/liberty';
export const OPEN_FREE_MAP_DARK = 'https://tiles.openfreemap.org/styles/dark';
export const DEFAULT_BASEMAPS: BasemapConfig[] = [
  {
    id: 'openFreeMap',
    label: { en: 'OpenFreeMap Liberty' },
    style_url: OPEN_FREE_MAP_LIGHT,
  },
  {
    id: 'openFreeMapPositron',
    label: { en: 'OpenFreeMap Positron' },
    style_url: 'https://tiles.openfreemap.org/styles/positron',
  },
  {
    id: 'openFreeMapDark',
    label: { en: 'OpenFreeMap Dark' },
    style_url: OPEN_FREE_MAP_DARK,
  },
];
export const EMPTY_STYLE: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#f1f3f2' },
    },
  ],
};
export function resolveBasemaps(config?: ThemeMapConfig) {
  const candidates = config?.basemaps?.filter(
    (b) => b.id && (b.style_url || b.tiles?.length)
  );
  const basemaps = candidates?.length ? candidates : DEFAULT_BASEMAPS;
  const defaultId = basemaps.some((b) => b.id === config?.default_basemap)
    ? config!.default_basemap!
    : basemaps[0].id;
  const fallback =
    basemaps.find((b) => b.id === config?.fallback_basemap) ??
    DEFAULT_BASEMAPS[0];
  return { basemaps, defaultId, fallback };
}
export function getSavedBasemapKey(config?: ThemeMapConfig): string {
  const { basemaps, defaultId } = resolveBasemaps(config);
  const saved = Cookies.get('preferred_basemap');
  return basemaps.some((b) => b.id === saved) ? saved! : defaultId;
}
export function saveBasemapKey(key: string) {
  Cookies.set('preferred_basemap', key, { expires: 365 });
}
export function basemapStyle(
  basemap: BasemapConfig
): string | StyleSpecification {
  if (basemap.style_url) return basemap.style_url;
  return {
    version: 8,
    sources: {
      basemap: {
        type: 'raster',
        tiles: basemap.tiles,
        tileSize: basemap.tile_size ?? 256,
        maxzoom: basemap.max_zoom ?? 19,
        attribution: basemap.attribution,
      },
    },
    layers: [{ id: 'basemap', type: 'raster', source: 'basemap' }],
  };
}
