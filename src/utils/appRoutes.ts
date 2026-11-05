import { isKnownThemeId } from '../config/institution';
import { getAppBasePath } from './themeUrls';

function normalizeRoutePath(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed === '/') return '/';
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

function decodePathSegment(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function getThemeScopedAppBasePath(): string {
  const basePath = getAppBasePath();
  if (typeof window === 'undefined') return basePath;

  const baseWithoutTrailingSlash = basePath.replace(/\/$/, '');
  let pathname = window.location.pathname;

  if (basePath !== '/') {
    if (pathname === baseWithoutTrailingSlash) return basePath;
    if (!pathname.startsWith(basePath)) return basePath;
    pathname = `/${pathname.slice(basePath.length)}`;
  }

  const requestedThemeId = decodePathSegment(
    pathname.replace(/^\/+/, '').split('/')[0] || ''
  );

  if (!isKnownThemeId(requestedThemeId)) return basePath;
  return `${basePath}${encodeURIComponent(requestedThemeId)}/`;
}

/** Switch to a shareable theme home, clearing filters from the previous catalog. */
export function buildThemeHomePath(themeId: string): string {
  if (!isKnownThemeId(themeId)) return getAppBasePath();
  return `${getAppBasePath()}${encodeURIComponent(themeId)}/`;
}

export function buildAppHashRouteUrl(
  routePath: string,
  searchParams?: URLSearchParams
): string {
  const origin =
    typeof window === 'undefined' ? 'http://localhost' : window.location.origin;
  const url = new URL(getThemeScopedAppBasePath(), origin);
  const queryString = searchParams?.toString();

  url.hash = queryString
    ? `${normalizeRoutePath(routePath)}?${queryString}`
    : normalizeRoutePath(routePath);

  return url.toString();
}
