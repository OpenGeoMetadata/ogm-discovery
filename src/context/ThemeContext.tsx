import { ThemeContext, type ThemeContextValue } from './theme';
import React, { useEffect, useMemo, useState } from 'react';
import { useSyncExternalStore } from 'react';
import {
  applyThemeToDom,
  getActiveThemeId,
  getDefaultThemeId,
  getAvailableThemes,
  getThemeConfig,
  hasLocationThemeId,
  isThemeSelectorEnabled,
  isKnownThemeId,
  setActiveThemeId,
  subscribeToThemeChanges,
  THEME_STORAGE_KEY,
  type ThemeConfig,
  type ThemeId,
} from '../config/institution';

const AVAILABLE_THEMES = getAvailableThemes();
const THEME_SELECTOR_ENABLED = isThemeSelectorEnabled();

export function ThemeProvider({
  children,
  initialThemeId,
}: {
  children: React.ReactNode;
  /**
   * Theme id used for SSR HTML + the client's first render, so hydration matches.
   * After mount, we reconcile with localStorage (if present) to respect user choice.
   */
  initialThemeId?: ThemeId;
}) {
  const initial = initialThemeId || getDefaultThemeId();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const themeId = useSyncExternalStore(
    subscribeToThemeChanges,
    () => (hydrated ? getActiveThemeId() : initial),
    () => initial
  );

  // After hydration, if localStorage has a valid theme that differs from the SSR theme,
  // promote it via setActiveThemeId so cookies stay in sync and subscribers update.
  useEffect(() => {
    if (!hydrated) return;
    if (hasLocationThemeId()) return;
    const stored =
      typeof window !== 'undefined'
        ? window.localStorage.getItem(THEME_STORAGE_KEY)
        : null;
    if (stored && isKnownThemeId(stored) && stored !== themeId) {
      setActiveThemeId(stored);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // Ensure the DOM reflects the current theme even on first load.
  // Use useEffect (not useLayoutEffect) so SSR doesn't warn; theme is already set
  // on <html data-theme> from the server, so this just syncs client state.
  useEffect(() => {
    applyThemeToDom(themeId);
  }, [themeId]);

  const theme = useMemo<ThemeConfig>(() => getThemeConfig(themeId), [themeId]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeId,
      theme,
      themes: AVAILABLE_THEMES,
      themeSelectorEnabled: THEME_SELECTOR_ENABLED,
      setThemeId: (id: ThemeId) => setActiveThemeId(id),
    }),
    [themeId, theme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
