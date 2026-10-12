import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { LanguageCode } from '../types';
import { translations, translate, type TranslationDict } from './i18n';
import { detectInitialLanguage } from '../utils/languageDetect';

interface LanguageContextValue {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

interface LanguageProviderProps {
  /** Kontrollü mod: dışarıdaki state'e bağlanır (App.tsx bu modu kullanır). */
  language?: LanguageCode;
  onLanguageChange?: (lang: LanguageCode) => void;
  /** Kontrolsüz mod başlangıcı — language verilmezse kullanılır. */
  initialLanguage?: LanguageCode;
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  language,
  onLanguageChange,
  initialLanguage,
  children,
}) => {
  const [innerLanguage, setInnerLanguage] = useState<LanguageCode>(
    () => initialLanguage ?? detectInitialLanguage()
  );

  const value = useMemo<LanguageContextValue>(() => {
    const controlled = language !== undefined;
    return {
      language: controlled ? language : innerLanguage,
      setLanguage: (lang: LanguageCode) => {
        if (controlled) onLanguageChange?.(lang);
        else setInnerLanguage(lang);
      },
    };
  }, [language, innerLanguage, onLanguageChange]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage, LanguageProvider içinde kullanılmalı');
  return ctx;
}

/**
 * Aktif dilin sözlüğünü döndürür. Savunma amaçlı anahtar seviyesinde fallback:
 * dil paketinde düz anahtar eksikse en'deki değer kullanılır (iç içe ad alanlarında
 * derin fallback için `useT` / `translate` kullanın).
 */
export function useTranslation(): TranslationDict {
  const { language } = useLanguage();
  const dict = translations[language];
  return language === 'en' || !dict ? translations.en : { ...translations.en, ...dict };
}

/**
 * `t('anahtar')` / `t('adalanı.anahtar', { param })` — interpolasyonlu,
 * en fallback'li çeviri fonksiyonu döndürür.
 * Örn: `t('productNotFoundToast', { code: barcode })`, `t('excel.exportedRows', { count: n })`.
 */
export function useT() {
  const { language } = useLanguage();
  return useCallback(
    (key: string, params?: Record<string, string | number>) => translate(language, key, params),
    [language]
  );
}
