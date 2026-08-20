import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  consumeGalleryStateRestoreRequest,
  GALLERY_STATE_STORAGE_KEY,
  requestGalleryStateRestore,
} from '../../utils/galleryState';
import { formatCount } from '../../utils/formatNumber';
import { debugLog, debugWarn, isDebugLoggingEnabled } from '../../utils/logger';
import {
  getAppBasePath,
  isAbsoluteUrl,
  resolveThemeAssetUrl,
} from '../../utils/themeUrls';
import {
  buildAppHashRouteUrl,
  getThemeScopedAppBasePath,
} from '../../utils/appRoutes';
import { zoomToResolution } from '../../utils/h3Resolution';

describe('small UI utilities', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    window.history.replaceState(null, '', '/');
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('formats counts defensively', () => {
    expect(formatCount(143691)).toBe('143,691');
    expect(formatCount('2500')).toBe('2,500');
    expect(formatCount(null)).toBe('0');
    expect(formatCount(undefined)).toBe('0');
    expect(formatCount('not-a-number')).toBe('0');
  });

  it('requests and consumes gallery state restoration once', () => {
    expect(GALLERY_STATE_STORAGE_KEY).toBe('b1g_gallery_state');
    expect(consumeGalleryStateRestoreRequest()).toBe(false);

    requestGalleryStateRestore();

    expect(consumeGalleryStateRestoreRequest()).toBe(true);
    expect(consumeGalleryStateRestoreRequest()).toBe(false);
  });

  it('ignores gallery restore storage failures', () => {
    vi.spyOn(window.sessionStorage, 'setItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });
    vi.spyOn(window.sessionStorage, 'getItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });

    expect(() => requestGalleryStateRestore()).not.toThrow();
    expect(consumeGalleryStateRestoreRequest()).toBe(false);
  });

  it('recognizes URL shapes used by theme assets', () => {
    expect(getAppBasePath()).toBe('/');
    expect(isAbsoluteUrl('https://example.com/logo.svg')).toBe(true);
    expect(isAbsoluteUrl('//cdn.example.com/logo.svg')).toBe(true);
    expect(isAbsoluteUrl('/logo.svg')).toBe(false);
    expect(isAbsoluteUrl(undefined)).toBe(false);

    expect(resolveThemeAssetUrl(undefined)).toBeUndefined();
    expect(resolveThemeAssetUrl('   ')).toBeUndefined();
    expect(resolveThemeAssetUrl('#main')).toBe('#main');
    expect(resolveThemeAssetUrl('https://example.com/logo.svg')).toBe(
      'https://example.com/logo.svg'
    );
    expect(resolveThemeAssetUrl('/logo.svg')).toBe('/logo.svg');
    expect(resolveThemeAssetUrl('images/logo.svg')).toBe('images/logo.svg');
  });

  it('builds internal hash route URLs inside the current theme path', () => {
    vi.stubEnv('BASE_URL', '/ogm-discovery/');
    window.history.replaceState(
      null,
      '',
      '/ogm-discovery/unr/#/resources/unr-example'
    );

    expect(getThemeScopedAppBasePath()).toBe('/ogm-discovery/unr/');

    const url = new URL(
      buildAppHashRouteUrl(
        '/mirador',
        new URLSearchParams({ manifest: 'blob:http://localhost/manifest' })
      )
    );

    expect(url.pathname).toBe('/ogm-discovery/unr/');
    expect(url.search).toBe('');
    expect(url.hash).toBe(
      '#/mirador?manifest=blob%3Ahttp%3A%2F%2Flocalhost%2Fmanifest'
    );
  });

  it('maps Leaflet zoom levels to H3 resolutions', () => {
    expect(zoomToResolution(2)).toBe(2);
    expect(zoomToResolution(4)).toBe(3);
    expect(zoomToResolution(6)).toBe(4);
    expect(zoomToResolution(8)).toBe(5);
    expect(zoomToResolution(10)).toBe(6);
    expect(zoomToResolution(12)).toBe(7);
    expect(zoomToResolution(13)).toBe(8);
  });

  it('logs debug messages when runtime debug logging is enabled', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    window.history.replaceState(null, '', '/?debug_logs=1');

    expect(isDebugLoggingEnabled()).toBe(true);
    debugLog('hello');
    debugWarn('careful');

    expect(logSpy).toHaveBeenCalledWith('hello');
    expect(warnSpy).toHaveBeenCalledWith('careful');
  });
});
