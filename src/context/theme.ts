import { createContext, useContext } from 'react';
import {
  getDefaultThemeId,
  getThemeConfig,
  getAvailableThemes,
  isThemeSelectorEnabled,
  type ThemeConfig,
  type ThemeId,
} from '../config/institution';
export interface ThemeContextValue {
  themeId: ThemeId;
  theme: ThemeConfig;
  themes: Array<{ id: ThemeId; label: string }>;
  themeSelectorEnabled: boolean;
  setThemeId: (id: ThemeId) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (ctx) return ctx;

  // Safe fallback for tests or non-provider renders (keeps components from hard-crashing).
  const fallbackId = getDefaultThemeId();
  return {
    themeId: fallbackId,
    theme: getThemeConfig(fallbackId),
    themes: getAvailableThemes(),
    themeSelectorEnabled: isThemeSelectorEnabled(),
    setThemeId: () => {},
  };
}
