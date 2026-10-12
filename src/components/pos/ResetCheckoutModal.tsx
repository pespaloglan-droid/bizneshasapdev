import { useEffect } from 'react';
import { useT } from '../../locales/LanguageContext';
export function ResetCheckoutModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  const t = useT();
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onCancel(); }
      else if (event.key === 'Enter') { event.preventDefault(); onConfirm(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel, onConfirm]);
  return <div role="dialog" aria-modal="true" aria-label={t('pos.resetTitle')} className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5">
      <div className="text-sm font-bold text-gray-800 mb-1">{t('pos.resetTitle')}</div>
      <p className="text-xs text-gray-500 leading-relaxed">{t('pos.resetMsg')}</p>
      <div className="flex justify-end gap-2 pt-3">
        <button type="button" onClick={onCancel} className="h-9 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs">{t('pos.resetCancel')}</button>
        <button type="button" onClick={onConfirm} className="h-9 px-5 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs">{t('pos.resetConfirm')}</button>
      </div>
    </div>
  </div>;
}
