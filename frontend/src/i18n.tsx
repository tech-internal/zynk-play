import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { translations, type TranslationKey } from './i18n/translations';

export type Language = 'en' | 'fa' | 'ps';

type I18nContextValue = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey | string, fallback?: string) => string;
  isRtl: boolean;
};

const STORAGE_KEY = 'gp_lang';

const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) as Language | null;
    return saved === 'fa' || saved === 'ps' || saved === 'en' ? saved : 'en';
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const isRtl = language === 'fa' || language === 'ps';

  useEffect(() => {
    document.documentElement.lang = language === 'fa' ? 'fa-AF' : language === 'ps' ? 'ps-AF' : 'en';
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  }, [language, isRtl]);

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage,
      isRtl,
      t: (key: TranslationKey | string, fallback?: string) =>
        translations[language][key] ?? fallback ?? key,
    }),
    [language, isRtl],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return ctx;
}

/** Sync document.title when language changes. */
export function usePageTitle(key: TranslationKey, fallback?: string) {
  const { t, language } = useI18n();
  useEffect(() => {
    document.title = t(key, fallback);
  }, [t, language, key, fallback]);
}
