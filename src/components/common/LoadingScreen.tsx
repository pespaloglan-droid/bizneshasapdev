import React from 'react';
import { useT } from '../../locales/LanguageContext';

/** Shared loading state, translated in all four supported languages. */
export const LoadingScreen: React.FC = () => {
  const t = useT();
  return (
    <div role="status" aria-live="polite" className="w-full h-full flex flex-col items-center justify-center bg-white">
      <div aria-hidden="true" className="w-8 h-8 border-[3px] border-gray-200 border-t-[#10b981] rounded-full animate-spin" />
      <p className="mt-3 text-xs font-bold text-gray-400">{t('license.loading')}</p>
    </div>
  );
};
