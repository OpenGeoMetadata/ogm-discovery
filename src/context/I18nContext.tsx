import { I18nContext, type I18nContextValue } from './i18n';
import React, { useEffect, useMemo, useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import type { LocalizedText } from '../config/institution';
import { resolveLocalizedText, translate } from '../i18n/messages';

const LOCALE_STORAGE_KEY = 'ogm.locale';

function readStoredLocale(): string | null {
  try {
    return typeof window !== 'undefined'
      ? window.localStorage.getItem(LOCALE_STORAGE_KEY)
      : null;
  } catch {
    return null;
  }
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { theme, themeId } = useTheme();
  const fallbackLocale = theme.site?.locale || 'en';
  const configuredLocales = theme.site?.supported_locales || [fallbackLocale];
  const locales = Array.from(new Set([fallbackLocale, ...configuredLocales]));

  const [locale, setLocaleState] = useState(() => {
    const stored = readStoredLocale();
    if (stored && locales.includes(stored)) return stored;
    return fallbackLocale;
  });

  useEffect(() => {
    if (!locales.includes(locale)) {
      setLocaleState(fallbackLocale);
    }
  }, [fallbackLocale, locale, locales, themeId]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = locale;
    document.documentElement.dir = theme.site?.direction || 'ltr';
  }, [locale, theme.site?.direction]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      locales,
      setLocale: (nextLocale: string) => {
        const safeLocale = locales.includes(nextLocale)
          ? nextLocale
          : fallbackLocale;
        setLocaleState(safeLocale);
        try {
          window.localStorage.setItem(LOCALE_STORAGE_KEY, safeLocale);
        } catch {
          // ignore
        }
      },
      t: (key: string, vars?: Record<string, string | number>) =>
        translate(locale, fallbackLocale, key, vars),
      text: (
        localizedValue: LocalizedText | undefined,
        vars?: Record<string, string | number>
      ) => {
        const resolved =
          resolveLocalizedText(localizedValue, locale, fallbackLocale) || '';

        if (!vars) return resolved;

        return resolved.replace(/\{(\w+)\}/g, (_, key) =>
          key in vars ? String(vars[key]) : `{${key}}`
        );
      },
    }),
    [fallbackLocale, locale, locales]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
