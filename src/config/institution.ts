import yaml from 'js-yaml';
import defaultThemeYaml from '../../theme.yaml?raw';
import { resolveThemeAssetUrl } from '../utils/themeUrls';

const themeVariationYamlModules = import.meta.glob('../../themes/*.yaml', {
  eager: true,
  import: 'default',
  query: '?raw',
}) as Record<string, string>;

export type ThemeId = string;
export type RouteMode = 'browser' | 'hash';
export type LocalizedText = string | Record<string, string>;

export interface ThemeLink {
  label: LocalizedText;
  href: string;
  external?: boolean;
}

export interface ThemeLockupTextStyle {
  font_family?: string;
  font_weight?: number;
  letter_spacing?: string;
}

export interface ThemeFooterGroup {
  title: LocalizedText;
  links: ThemeLink[];
}

export interface ThemeManifestIcon {
  src: string;
  sizes: string;
  type?: string;
  purpose?: string;
}

export interface ThemeIconPack {
  manifest?: string;
  favicon?: string;
  favicon_svg?: string;
  apple_touch_icon?: string;
  pwa?: ThemeManifestIcon[];
}

export interface ThemePartnerInstitution {
  slug: string;
  name: string;
  iconSlug?: string;
  iconSrc?: string;
  monochrome?: boolean;
  logoClassName?: string;
  campusMap?: {
    latitude: number;
    longitude: number;
    zoom: number;
  };
  searchHref?: string;
  media?: {
    enabled?: boolean;
    embed_url: string;
    title?: LocalizedText;
    subtitle?: LocalizedText;
    button_aria_label?: LocalizedText;
  };
}

export interface FeaturedMapCameraConfig {
  mode?: 'fitBounds' | 'flyTo';
  center?: [number, number];
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  padding?: [number, number];
  paddingTopLeft?: [number, number];
  paddingBottomRight?: [number, number];
  duration?: number;
  verticalOffsetPx?: number;
}

export interface ThemeHeroMapConfig {
  center?: [number, number];
  zoom?: number;
  initial_pan_px?: [number, number];
}

export interface ThemeFeaturedItemConfig {
  id: string;
  camera?: FeaturedMapCameraConfig;
}

export interface ThemeSpotlightCard {
  title: LocalizedText;
  description: LocalizedText;
  collection_url: string;
  collection_label?: LocalizedText;
  browse_url: string;
  browse_label: LocalizedText;
  featured_item_title: LocalizedText;
  featured_item_url?: string;
  image_src?: string;
  image_alt?: LocalizedText;
  reverse?: boolean;
}

export interface BasemapConfig {
  id: string;
  label: LocalizedText;
  style_url?: string;
  tiles?: string[];
  tile_size?: number;
  max_zoom?: number;
  attribution?: string;
  logo?: { src: string; href: string; alt: LocalizedText };
}

export interface ThemeMapConfig {
  basemaps?: BasemapConfig[];
  default_basemap?: string;
  fallback_basemap?: string;
  viewer_light_style?: string;
  viewer_dark_style?: string;
}

export interface ThemeConfig {
  map?: ThemeMapConfig;
  id?: ThemeId;
  label?: string;
  site?: {
    title?: LocalizedText;
    short_name?: string;
    description?: LocalizedText;
    canonical_url?: string;
    locale?: string;
    supported_locales?: string[];
    show_locale_selector?: boolean;
    show_theme_selector?: boolean;
    direction?: 'ltr' | 'rtl';
    routing?: {
      mode?: RouteMode;
    };
    icons?: ThemeIconPack;
    manifest?: {
      display?: 'standalone' | 'browser' | 'minimal-ui' | 'fullscreen';
      background_color?: string;
      theme_color?: string;
    };
    banner?: {
      enabled?: boolean;
      text: LocalizedText;
      tone?: 'notice' | 'neon';
    };
  };
  institution: {
    name: string;
    logo_url?: string;
    logo_alt?: LocalizedText;
    logo_lockup?: {
      separator?: 'pipe' | 'none' | string;
      right_text?: LocalizedText;
      right_text_style?: ThemeLockupTextStyle;
      subtext?: LocalizedText;
      subtext_style?: ThemeLockupTextStyle;
    };
    header?: {
      logo_height_rem?: number;
      lockup_gap_rem?: number;
      lockup_separator_height_rem?: number;
      lockup_text_size_rem?: number;
    };
    hero_text?: LocalizedText;
    hero_description?: LocalizedText;
  };
  branding?: {
    colors?: {
      primary?: string;
      active?: string;
      surface?: string;
      surface_alt?: string;
      text?: string;
      muted?: string;
      border?: string;
      page_background?: string;
      header_background?: string;
      header_text?: string;
      utility_background?: string;
      utility_text?: string;
      hero_panel_background?: string;
      hero_panel_accent?: string;
      footer_overlay?: string;
      footer_panel_background?: string;
      button_primary_hover?: string;
      button_secondary_background?: string;
      button_secondary_hover?: string;
      button_secondary_text?: string;
      button_secondary_border?: string;
      lockup_background?: string;
      lockup_foreground?: string;
    };
    fonts?: {
      sans?: string;
      heading?: string;
      ui?: string;
    };
    assets?: {
      font_stylesheets?: string[];
    };
  };
  api: {
    base_url: string;
    public_api_key?: string;
    search_path?: string;
    suggest_path?: string;
    gazetteer_search_path?: string;
    facets_path_template?: string;
    map_h3_path?: string;
    home_blog_posts_path?: string;
    turnstile_status_path?: string;
    turnstile_verify_path?: string;
    default_query_params?: string[];
    client_name?: string;
    original_record_url_template?: string;
    nominatim_user_agent?: string;
  };
  navigation?: {
    utility_links?: ThemeLink[];
    cta?: ThemeLink;
    cta_style?: 'button' | 'utility';
    links?: ThemeLink[];
  };
  homepage?: {
    announcement?: {
      enabled?: boolean;
      text: LocalizedText;
      link_label: LocalizedText;
      link_url: string;
    };
    hero_background_image_url?: string;
    hero_map?: ThemeHeroMapConfig;
    hero_actions?: ThemeLink[];
    featured_resource_ids?: string[];
    featured_items?: ThemeFeaturedItemConfig[];
    featured?: Array<{
      title: LocalizedText;
      field: string;
      value: string;
      sort: string;
      limit: number;
    }>;
    collection_spotlights?: ThemeSpotlightCard[];
    partner_institutions?: ThemePartnerInstitution[];
    media?: {
      enabled?: boolean;
      embed_url: string;
      title?: LocalizedText;
      subtitle?: LocalizedText;
      button_aria_label?: LocalizedText;
      modal_test_id?: string;
    };
    blog?: {
      enabled?: boolean;
      title?: LocalizedText;
      subtitle?: LocalizedText;
      limit?: number;
      cta_label?: LocalizedText;
      cta_url?: string;
      pinned_slugs?: string[];
    };
  };
  footer?: {
    style?: 'network' | 'simple' | 'photo';
    title?: LocalizedText;
    logo_url?: string;
    logo_alt?: LocalizedText;
    logo_href?: string;
    address_lines?: LocalizedText[];
    background_image_url?: string;
    link_groups?: ThemeFooterGroup[];
    network_title?: LocalizedText;
    network_members?: LocalizedText[];
    copyright?: LocalizedText;
    bottom_links?: ThemeLink[];
    original_record_label?: LocalizedText;
    original_record_url_template?: string;
    show_api_debug?: boolean;
  };
}

export interface ThemeRegistryConfig {
  default_theme?: ThemeId;
  themes: Record<ThemeId, ThemeConfig>;
}

export const THEME_STORAGE_KEY = 'ogm.theme';
export const THEME_COOKIE_KEY = 'ogm.theme';
const THEME_CHANGED_EVENT = 'ogm:theme-changed';
const THEME_STYLESHEET_ATTR = 'data-ogm-theme-stylesheet';
const THEME_HEAD_LINK_ATTR = 'data-ogm-theme-head-link';
const THEME_HEAD_META_ATTR = 'data-ogm-theme-head-meta';
const DEFAULT_FONT_STACK =
  '"Work Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const DEFAULT_HEADING_STACK = DEFAULT_FONT_STACK;
const DEFAULT_UI_STACK = DEFAULT_FONT_STACK;
const FALLBACK_ICON_PACK: Required<
  Pick<ThemeIconPack, 'manifest' | 'favicon' | 'apple_touch_icon' | 'pwa'>
> &
  Pick<ThemeIconPack, 'favicon_svg'> = {
  manifest: '/manifest.webmanifest',
  favicon: '/favicon.ico',
  apple_touch_icon: '/apple-touch-icon-180x180.png',
  pwa: [
    {
      src: '/pwa-64x64.png',
      sizes: '64x64',
      type: 'image/png',
    },
    {
      src: '/pwa-192x192.png',
      sizes: '192x192',
      type: 'image/png',
    },
    {
      src: '/pwa-512x512.png',
      sizes: '512x512',
      type: 'image/png',
    },
  ],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function looksLikeThemeConfig(value: unknown): value is ThemeConfig {
  return isRecord(value) && isRecord(value.institution) && isRecord(value.api);
}

function modulePathToThemeId(path: string): ThemeId {
  const match = path.match(/\/([^/]+)\.ya?ml$/);
  return match?.[1] || 'default';
}

function withThemeId(themeId: ThemeId, theme: ThemeConfig): ThemeConfig {
  return {
    ...theme,
    id: theme.id || themeId,
  };
}

function parseThemeYaml(
  raw: string,
  source = 'theme.yaml',
  fallbackThemeId: ThemeId = 'default'
): ThemeRegistryConfig {
  const parsed = yaml.load(raw);
  if (!isRecord(parsed)) {
    throw new Error(`Invalid ${source}: expected an object at top-level`);
  }

  if (isRecord(parsed.themes)) {
    const themes: Record<ThemeId, ThemeConfig> = {};
    Object.entries(parsed.themes).forEach(([themeId, theme]) => {
      if (!looksLikeThemeConfig(theme)) {
        throw new Error(
          `Invalid ${source}: expected theme "${themeId}" to define institution and api`
        );
      }
      themes[themeId] = withThemeId(themeId, theme);
    });

    return {
      default_theme:
        typeof parsed.default_theme === 'string'
          ? parsed.default_theme
          : undefined,
      themes,
    };
  }

  if (looksLikeThemeConfig(parsed)) {
    const themeId = typeof parsed.id === 'string' ? parsed.id : fallbackThemeId;
    return {
      default_theme: themeId,
      themes: {
        [themeId]: withThemeId(themeId, parsed),
      },
    };
  }

  const entries = Object.entries(parsed);
  if (entries.length === 1) {
    const [themeId, theme] = entries[0];
    if (looksLikeThemeConfig(theme)) {
      return {
        default_theme: themeId,
        themes: {
          [themeId]: withThemeId(themeId, theme),
        },
      };
    }
  }

  throw new Error(
    `Invalid ${source}: expected a single theme object, one theme entry, or a themes map`
  );
}

function buildThemeRegistry(
  defaultThemeRaw: string,
  variationModules: Record<string, string>
): ThemeRegistryConfig {
  const registry = parseThemeYaml(defaultThemeRaw);
  const themes = { ...registry.themes };

  Object.entries(variationModules)
    .sort(([leftPath], [rightPath]) => leftPath.localeCompare(rightPath))
    .forEach(([path, raw]) => {
      const variationRegistry = parseThemeYaml(
        raw,
        path,
        modulePathToThemeId(path)
      );
      Object.assign(themes, variationRegistry.themes);
    });

  return {
    default_theme: registry.default_theme || Object.keys(themes)[0],
    themes,
  };
}

const registry = buildThemeRegistry(
  defaultThemeYaml,
  themeVariationYamlModules
);

function safeReadLocalStorage(key: string): string | null {
  try {
    return typeof window !== 'undefined'
      ? window.localStorage.getItem(key)
      : null;
  } catch {
    return null;
  }
}

function safeWriteLocalStorage(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // ignore
  }
}

function safeWriteCookie(key: string, value: string): void {
  try {
    if (typeof document === 'undefined') return;
    document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(
      value
    )}; Path=/; Max-Age=31536000; SameSite=Lax`;
  } catch {
    // ignore
  }
}

function normalizeHexColor(
  value: string | undefined,
  fallback: string
): string {
  if (!value || typeof value !== 'string') return fallback;
  const normalized = value.trim();
  return normalized || fallback;
}

function normalizeCssValue(
  value: string | undefined,
  fallback: string
): string {
  if (!value || typeof value !== 'string') return fallback;
  const normalized = value.trim();
  return normalized || fallback;
}

function hexToRgbChannels(value: string | undefined, fallback: string): string {
  const color = normalizeHexColor(value, fallback).replace('#', '');
  const expanded =
    color.length === 3
      ? color
          .split('')
          .map((char) => `${char}${char}`)
          .join('')
      : color;

  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) {
    return (
      fallback
        .replace('#', '')
        .match(/.{1,2}/g)
        ?.map((part) => parseInt(part, 16))
        .join(' ') || '0 60 91'
    );
  }

  return (
    expanded
      .match(/.{1,2}/g)
      ?.map((part) => parseInt(part, 16))
      .join(' ') || '0 60 91'
  );
}

function setCssVariable(name: string, value: string | undefined) {
  if (typeof document === 'undefined' || !value) return;
  document.documentElement.style.setProperty(name, value);
}

function syncThemeStylesheets(urls: string[] | undefined): void {
  if (typeof document === 'undefined') return;
  if (import.meta.env.MODE === 'test') return;

  const normalizedUrls = Array.from(
    new Set(
      (urls || [])
        .map((url) => url?.trim())
        .filter((url): url is string => !!url)
        .map((url) => resolveThemeAssetUrl(url) || url)
        .map((url) => new URL(url, document.baseURI).href)
    )
  );

  const existingLinks = Array.from(
    document.head.querySelectorAll<HTMLLinkElement>(
      `link[${THEME_STYLESHEET_ATTR}="true"]`
    )
  );

  existingLinks.forEach((link) => {
    if (!normalizedUrls.includes(link.href)) {
      link.remove();
    }
  });

  normalizedUrls.forEach((href) => {
    const alreadyPresent = existingLinks.some((link) => link.href === href);
    if (alreadyPresent) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute(THEME_STYLESHEET_ATTR, 'true');
    document.head.appendChild(link);
  });
}

function setManagedHeadLink(
  key: string,
  attrs: Record<string, string | undefined>
): void {
  if (typeof document === 'undefined') return;

  const selector = `link[${THEME_HEAD_LINK_ATTR}="${key}"]`;
  let link = document.head.querySelector<HTMLLinkElement>(selector);
  const href = attrs.href;

  if (!href) {
    link?.remove();
    return;
  }

  if (!link) {
    link = document.createElement('link');
    link.setAttribute(THEME_HEAD_LINK_ATTR, key);
    document.head.appendChild(link);
  }

  ['rel', 'href', 'sizes', 'type', 'purpose'].forEach((name) => {
    const value = attrs[name];
    if (value) {
      link.setAttribute(name, value);
    } else {
      link.removeAttribute(name);
    }
  });
}

function setManagedHeadMeta(key: string, content: string | undefined): void {
  if (typeof document === 'undefined') return;

  const selector = `meta[${THEME_HEAD_META_ATTR}="${key}"]`;
  let meta = document.head.querySelector<HTMLMetaElement>(selector);

  if (!content) {
    meta?.remove();
    return;
  }

  if (!meta) {
    meta = document.createElement('meta');
    meta.name = key;
    meta.setAttribute(THEME_HEAD_META_ATTR, key);
    document.head.appendChild(meta);
  }

  meta.content = content;
}

function syncThemeHeadLinks(theme: ThemeConfig): void {
  const iconPack = getThemeIconPack(theme.id || getDefaultThemeId());
  const resolvedManifest = resolveThemeAssetUrl(iconPack.manifest);
  const resolvedFavicon = resolveThemeAssetUrl(iconPack.favicon);
  const resolvedSvgFavicon = resolveThemeAssetUrl(iconPack.favicon_svg);
  const resolvedAppleTouchIcon = resolveThemeAssetUrl(
    iconPack.apple_touch_icon
  );

  setManagedHeadLink('manifest', {
    rel: 'manifest',
    href: resolvedManifest,
  });
  setManagedHeadLink('favicon-svg', {
    rel: 'icon',
    type: 'image/svg+xml',
    href: resolvedSvgFavicon,
  });
  setManagedHeadLink('favicon', {
    rel: resolvedSvgFavicon ? 'alternate icon' : 'icon',
    href: resolvedFavicon,
    sizes: '48x48',
  });
  setManagedHeadLink('apple-touch-icon', {
    rel: 'apple-touch-icon',
    href: resolvedAppleTouchIcon,
  });

  setManagedHeadMeta(
    'theme-color',
    theme.site?.manifest?.theme_color || theme.branding?.colors?.primary
  );
}

export function getThemeIds(): ThemeId[] {
  return Object.keys(registry.themes);
}

export function isKnownThemeId(themeId: string | null | undefined): boolean {
  return !!themeId && !!registry.themes[themeId];
}

export function getDefaultThemeId(): ThemeId {
  const ids = getThemeIds();
  return registry.default_theme && registry.themes[registry.default_theme]
    ? registry.default_theme
    : ids[0] || 'default';
}

export function getThemeConfig(themeId: ThemeId): ThemeConfig {
  return registry.themes[themeId] || registry.themes[getDefaultThemeId()];
}

export function getThemeLabel(themeId: ThemeId): string {
  const theme = getThemeConfig(themeId);
  return (
    theme.label || theme.site?.short_name || theme.institution?.name || themeId
  );
}

export function getAvailableThemes(): Array<{ id: ThemeId; label: string }> {
  return getThemeIds().map((id) => ({ id, label: getThemeLabel(id) }));
}

export function isThemeSelectorEnabled(): boolean {
  return getThemeIds().some(
    (themeId) => getThemeConfig(themeId).site?.show_theme_selector === true
  );
}

export function getThemeIdFromCookieHeader(
  cookieHeader: string | null
): ThemeId | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(';').map((p) => p.trim());
  for (const part of parts) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const key = decodeURIComponent(part.slice(0, eq));
    if (key !== THEME_COOKIE_KEY) continue;
    const value = decodeURIComponent(part.slice(eq + 1));
    return isKnownThemeId(value) ? (value as ThemeId) : null;
  }
  return null;
}

export function getThemeDefaultLocale(themeId: ThemeId): string {
  return getThemeConfig(themeId).site?.locale || 'en';
}

export function getThemeSupportedLocales(themeId: ThemeId): string[] {
  const theme = getThemeConfig(themeId);
  const defaultLocale = getThemeDefaultLocale(themeId);
  const locales = theme.site?.supported_locales || [defaultLocale];
  return Array.from(new Set([defaultLocale, ...locales]));
}

export function getThemeRouteMode(themeId: ThemeId): RouteMode {
  void themeId;
  return 'hash';
}

export function getThemeCanonicalUrl(themeId: ThemeId): string | undefined {
  return getThemeConfig(themeId).site?.canonical_url;
}

export function getThemeIconPack(themeId: ThemeId): ThemeIconPack {
  const icons = getThemeConfig(themeId).site?.icons || {};
  const pwaIcons =
    Array.isArray(icons.pwa) && icons.pwa.length > 0
      ? icons.pwa
      : FALLBACK_ICON_PACK.pwa;

  return {
    manifest: icons.manifest || FALLBACK_ICON_PACK.manifest,
    favicon: icons.favicon || FALLBACK_ICON_PACK.favicon,
    favicon_svg: icons.favicon_svg,
    apple_touch_icon:
      icons.apple_touch_icon || FALLBACK_ICON_PACK.apple_touch_icon,
    pwa: pwaIcons,
  };
}

function getThemeIdFromLocation(): ThemeId | null {
  return getThemeIdFromUrlSearch() || getThemeIdFromPathname();
}

function getThemeIdFromUrlSearch(): ThemeId | null {
  try {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const requested = params.get('ogm_theme');
    return isKnownThemeId(requested) ? requested : null;
  } catch {
    return null;
  }
}

function normalizeBasePath(value: string | undefined): string {
  if (!value || value === '/') return '/';
  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`;
  return withLeadingSlash.endsWith('/')
    ? withLeadingSlash
    : `${withLeadingSlash}/`;
}

function getThemeIdFromPathname(): ThemeId | null {
  try {
    if (typeof window === 'undefined') return null;

    const basePath = normalizeBasePath(import.meta.env.BASE_URL || '/');
    const baseWithoutTrailingSlash = basePath.replace(/\/$/, '');
    let pathname = window.location.pathname;

    if (basePath !== '/') {
      if (pathname === baseWithoutTrailingSlash) {
        pathname = '/';
      } else if (pathname.startsWith(basePath)) {
        pathname = `/${pathname.slice(basePath.length)}`;
      }
    }

    const requested = pathname.replace(/^\/+/, '').split('/')[0];
    return isKnownThemeId(requested) ? requested : null;
  } catch {
    return null;
  }
}

export function hasLocationThemeId(): boolean {
  return Boolean(getThemeIdFromLocation());
}

export function getActiveThemeId(): ThemeId {
  const urlTheme = getThemeIdFromLocation();
  if (urlTheme) {
    if (urlTheme === getThemeIdFromUrlSearch()) {
      safeWriteLocalStorage(THEME_STORAGE_KEY, urlTheme);
      safeWriteCookie(THEME_COOKIE_KEY, urlTheme);
    }
    return urlTheme;
  }

  const stored = safeReadLocalStorage(THEME_STORAGE_KEY);
  if (stored && isKnownThemeId(stored)) return stored;
  return getDefaultThemeId();
}

export function applyThemeToDom(themeId: ThemeId): void {
  if (typeof document === 'undefined') return;

  const theme = getThemeConfig(themeId);
  const primaryHex = normalizeHexColor(
    theme.branding?.colors?.primary,
    '#003C5B'
  );
  const activeHex = normalizeHexColor(
    theme.branding?.colors?.active,
    '#2563EB'
  );
  const lockupBackground = normalizeHexColor(
    theme.branding?.colors?.lockup_background,
    primaryHex
  );
  const lockupForeground = normalizeHexColor(
    theme.branding?.colors?.lockup_foreground,
    '#FFFFFF'
  );
  const surfaceColor = normalizeCssValue(
    theme.branding?.colors?.surface,
    '#FFFFFF'
  );
  const surfaceAltColor = normalizeCssValue(
    theme.branding?.colors?.surface_alt,
    '#E6EEF3'
  );
  const textColor = normalizeCssValue(theme.branding?.colors?.text, '#10212E');
  const mutedColor = normalizeCssValue(
    theme.branding?.colors?.muted,
    '#5F6E7D'
  );
  const borderColor = normalizeCssValue(
    theme.branding?.colors?.border,
    '#D5DEE6'
  );
  const pageBackground = normalizeCssValue(
    theme.branding?.colors?.page_background,
    '#F7FAFC'
  );
  const headerBackground = normalizeCssValue(
    theme.branding?.colors?.header_background,
    primaryHex
  );
  const headerText = normalizeCssValue(
    theme.branding?.colors?.header_text,
    '#FFFFFF'
  );
  const utilityBackground = normalizeCssValue(
    theme.branding?.colors?.utility_background,
    '#002A41'
  );
  const utilityText = normalizeCssValue(
    theme.branding?.colors?.utility_text,
    'rgba(255, 255, 255, 0.92)'
  );
  const heroPanelBackground = normalizeCssValue(
    theme.branding?.colors?.hero_panel_background,
    'rgba(255, 255, 255, 0.88)'
  );
  const heroPanelAccent = normalizeCssValue(
    theme.branding?.colors?.hero_panel_accent,
    primaryHex
  );
  const footerOverlay = normalizeCssValue(
    theme.branding?.colors?.footer_overlay,
    'rgba(0, 42, 65, 0.88)'
  );
  const footerPanelBackground = normalizeCssValue(
    theme.branding?.colors?.footer_panel_background,
    'rgba(255, 255, 255, 0.08)'
  );
  const buttonPrimaryHover = normalizeCssValue(
    theme.branding?.colors?.button_primary_hover,
    primaryHex
  );
  const buttonSecondaryBackground = normalizeCssValue(
    theme.branding?.colors?.button_secondary_background,
    surfaceColor
  );
  const buttonSecondaryHover = normalizeCssValue(
    theme.branding?.colors?.button_secondary_hover,
    surfaceAltColor
  );
  const buttonSecondaryText = normalizeCssValue(
    theme.branding?.colors?.button_secondary_text,
    primaryHex
  );
  const buttonSecondaryBorder = normalizeCssValue(
    theme.branding?.colors?.button_secondary_border,
    borderColor
  );
  const footerBackgroundImage = resolveThemeAssetUrl(
    theme.footer?.background_image_url
  );
  const heroBackgroundImage = resolveThemeAssetUrl(
    theme.homepage?.hero_background_image_url
  );

  document.documentElement.dataset.theme = themeId;
  setCssVariable('--color-primary', hexToRgbChannels(primaryHex, '#003C5B'));
  setCssVariable('--color-active', hexToRgbChannels(activeHex, '#2563EB'));
  setCssVariable(
    '--font-sans',
    theme.branding?.fonts?.sans || DEFAULT_FONT_STACK
  );
  setCssVariable(
    '--font-heading',
    theme.branding?.fonts?.heading || DEFAULT_HEADING_STACK
  );
  setCssVariable('--font-ui', theme.branding?.fonts?.ui || DEFAULT_UI_STACK);
  setCssVariable('--header-lockup-bg', lockupBackground);
  setCssVariable('--header-lockup-fg', lockupForeground);
  setCssVariable('--color-surface', surfaceColor);
  setCssVariable('--color-surface-alt', surfaceAltColor);
  setCssVariable('--color-text', textColor);
  setCssVariable('--color-muted', mutedColor);
  setCssVariable('--color-border', borderColor);
  setCssVariable('--color-page-bg', pageBackground);
  setCssVariable('--color-header-bg', headerBackground);
  setCssVariable('--color-header-text', headerText);
  setCssVariable('--color-utility-bg', utilityBackground);
  setCssVariable('--color-utility-text', utilityText);
  setCssVariable('--color-hero-panel-bg', heroPanelBackground);
  setCssVariable('--color-hero-panel-accent', heroPanelAccent);
  setCssVariable('--color-footer-overlay', footerOverlay);
  setCssVariable('--color-footer-panel-bg', footerPanelBackground);
  setCssVariable('--button-primary-hover', buttonPrimaryHover);
  setCssVariable('--button-secondary-bg', buttonSecondaryBackground);
  setCssVariable('--button-secondary-hover', buttonSecondaryHover);
  setCssVariable('--button-secondary-text', buttonSecondaryText);
  setCssVariable('--button-secondary-border', buttonSecondaryBorder);
  setCssVariable(
    '--footer-bg-image',
    footerBackgroundImage ? `url("${footerBackgroundImage}")` : 'none'
  );
  setCssVariable(
    '--hero-bg-image',
    heroBackgroundImage ? `url("${heroBackgroundImage}")` : 'none'
  );
  syncThemeHeadLinks(theme);
  syncThemeStylesheets(theme.branding?.assets?.font_stylesheets);
}

export function setActiveThemeId(themeId: ThemeId): void {
  const next = isKnownThemeId(themeId) ? themeId : getDefaultThemeId();
  safeWriteLocalStorage(THEME_STORAGE_KEY, next);
  safeWriteCookie(THEME_COOKIE_KEY, next);
  applyThemeToDom(next);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(THEME_CHANGED_EVENT, { detail: next })
    );
  }
}

export function subscribeToThemeChanges(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => callback();
  window.addEventListener(THEME_CHANGED_EVENT, handler as EventListener);
  return () =>
    window.removeEventListener(THEME_CHANGED_EVENT, handler as EventListener);
}

export function getActiveThemeConfig(): ThemeConfig {
  return getThemeConfig(getActiveThemeId());
}
