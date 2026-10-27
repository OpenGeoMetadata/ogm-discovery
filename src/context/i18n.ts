import { createContext, useContext } from 'react';
import type { LocalizedText } from '../config/institution';
import { resolveLocalizedText, translate } from '../i18n/messages';
export interface I18nContextValue {
  locale: string;
  locales: string[];
  setLocale: (locale: string) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  text: (
    value: LocalizedText | undefined,
    vars?: Record<string, string | number>
  ) => string;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

export function useI18nContext(): I18nContextValue {
  const context = useContext(I18nContext);
  if (context) return context;

  return {
    locale: 'en',
    locales: ['en'],
    setLocale: () => {},
    t: (key: string, vars?: Record<string, string | number>) =>
      translate('en', 'en', key, vars),
    text: (value: LocalizedText | undefined) =>
      typeof value === 'string'
        ? value
        : resolveLocalizedText(value, 'en', 'en') || '',
  };
}
