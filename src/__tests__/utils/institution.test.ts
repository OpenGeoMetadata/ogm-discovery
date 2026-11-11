import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  applyThemeToDom,
  getActiveThemeId,
  getDefaultThemeId,
  getThemeConfig,
  getThemeIdFromCookieHeader,
  getThemeSupportedLocales,
  hasLocationThemeId,
  setActiveThemeId,
  subscribeToThemeChanges,
  THEME_COOKIE_KEY,
  THEME_STORAGE_KEY,
} from '../../config/institution';

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  localStorage.clear();
  window.history.replaceState({}, '', '/');
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  localStorage.clear();
  window.history.replaceState({}, '', '/');
  document
    .querySelectorAll('[data-ogm-theme-stylesheet]')
    .forEach((node) => node.remove());
});

describe('institution theme selection', () => {
  it('reads only recognized theme cookies among unrelated entries', () => {
    expect(getThemeIdFromCookieHeader(null)).toBeNull();
    expect(getThemeIdFromCookieHeader('bare; other=value')).toBeNull();
    expect(
      getThemeIdFromCookieHeader(`other=value; ${THEME_COOKIE_KEY}=btaa`)
    ).toBe('btaa');
    expect(
      getThemeIdFromCookieHeader(`${THEME_COOKIE_KEY}=unknown-theme`)
    ).toBeNull();
  });

  it('persists URL theme selection and prioritizes it over saved preferences', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'nyu');
    window.history.replaceState({}, '', '/?ogm_theme=btaa');
    expect(hasLocationThemeId()).toBe(true);
    expect(getActiveThemeId()).toBe('btaa');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('btaa');
    expect(document.cookie).toContain(`${THEME_COOKIE_KEY}=btaa`);
    expect(getThemeSupportedLocales('btaa')).toEqual(['en', 'es']);
  });

  it('recognizes institution routes beneath a static hosting base path', () => {
    vi.stubEnv('BASE_URL', '/discovery/');
    window.history.replaceState({}, '', '/discovery/nyu/');
    expect(getActiveThemeId()).toBe('nyu');
    window.history.replaceState({}, '', '/discovery');
    expect(hasLocationThemeId()).toBe(false);
    expect(getActiveThemeId()).toBe(getDefaultThemeId());
  });

  it('notifies theme subscribers and supports unsubscribing', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToThemeChanges(listener);
    setActiveThemeId('nyu');
    expect(listener).toHaveBeenCalledOnce();
    expect(getActiveThemeId()).toBe('nyu');
    expect(
      document
        .querySelector('link[data-ogm-theme-head-link="favicon-svg"]')
        ?.getAttribute('href')
    ).toContain('/nyu/');
    unsubscribe();
    setActiveThemeId('btaa');
    expect(listener).toHaveBeenCalledOnce();
    expect(
      document.querySelector('link[data-ogm-theme-head-link="favicon-svg"]')
    ).toBeNull();
    setActiveThemeId('unknown-theme');
    expect(getActiveThemeId()).toBe(getDefaultThemeId());
  });

  it('applies theme changes even if persistent storage and cookies are blocked', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new Error('Blocked');
    });
    vi.spyOn(document, 'cookie', 'set').mockImplementation(() => {
      throw new Error('Blocked');
    });
    expect(getActiveThemeId()).toBe(getDefaultThemeId());
    expect(() => setActiveThemeId('btaa')).not.toThrow();
    expect(
      document.documentElement.style.getPropertyValue('--color-primary')
    ).toBeTruthy();
  });

  it('replaces theme font stylesheets without duplicates or stale links', () => {
    vi.stubEnv('MODE', 'development');
    const theme = getThemeConfig('btaa');
    const branding = theme.branding;
    theme.branding = {
      ...branding,
      colors: { ...branding?.colors, primary: '#abc' },
      assets: {
        ...branding?.assets,
        font_stylesheets: [' ', '/first.css', '/first.css'],
      },
    };
    try {
      applyThemeToDom('btaa');
      applyThemeToDom('btaa');
      expect(
        document.querySelectorAll('link[data-ogm-theme-stylesheet]')
      ).toHaveLength(1);
      expect(
        document.documentElement.style.getPropertyValue('--color-primary')
      ).toBe('170 187 204');
      theme.branding.assets!.font_stylesheets = ['/second.css'];
      applyThemeToDom('btaa');
      const links = document.querySelectorAll<HTMLLinkElement>(
        'link[data-ogm-theme-stylesheet]'
      );
      expect(links).toHaveLength(1);
      expect(links[0].href).toContain('/second.css');
      theme.branding.assets!.font_stylesheets = [];
      applyThemeToDom('btaa');
      expect(
        document.querySelectorAll('link[data-ogm-theme-stylesheet]')
      ).toHaveLength(0);
    } finally {
      theme.branding = branding;
    }
  });
});
