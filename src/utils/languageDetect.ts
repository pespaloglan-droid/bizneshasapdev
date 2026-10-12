import type { LanguageCode } from '../types';

/**
 * İlk açılışta kayıtlı dil yoksa tarayıcı/cihaz dilinden türetir:
 * tr* → tr, tk* → tm, ru* → ru, diğerleri → en.
 */
export function detectInitialLanguage(): LanguageCode {
  try {
    const tag = (typeof navigator !== 'undefined' ? navigator.language : '') || '';
    const lower = tag.toLowerCase();
    if (lower.startsWith('tr')) return 'tr';
    if (lower.startsWith('tk')) return 'tm';
    if (lower.startsWith('ru')) return 'ru';
    return 'en';
  } catch {
    return 'en';
  }
}
