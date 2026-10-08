import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import type { CurrencyRate, LanguageCode } from '../../types';
import { getBaseCurrencyCode } from '../../db/currencyService';
import { saveBaseCurrency } from '../../db/settingsService';
import { BaseCurrencyCard } from './BaseCurrencyCard';
import { CurrencyTable } from './CurrencyTable';
import { CurrencyFormModal } from './CurrencyFormModal';
import { CurrencyDeleteDialog } from './CurrencyDeleteDialog';
import { CurrencyBaseConfirmDialog } from './CurrencyBaseConfirmDialog';
import { onMobileAdd } from '../../utils/mobileEvents';
import { PageScroll } from '../common/PageScroll';

interface WalyutaWorkspaceProps {
  currencies: readonly CurrencyRate[];
  language: LanguageCode;
  inUseCodes: readonly string[];
  storeDb: string;
  onSaveCurrency: (currency: CurrencyRate) => void;
  onDeleteCurrency: (currency: CurrencyRate) => void;
}

export const WalyutaWorkspace: React.FC<WalyutaWorkspaceProps> = ({
  currencies,
  language,
  inUseCodes,
  storeDb,
  onSaveCurrency,
  onDeleteCurrency,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<CurrencyRate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CurrencyRate | null>(null);
  const [baseCode, setBaseCode] = useState<string>(() => getBaseCurrencyCode());
  const [basePickTarget, setBasePickTarget] = useState<CurrencyRate | null>(null);
  const [notice, setNotice] = useState('');

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingCurrency(null);
  };

  const handleSave = (currency: CurrencyRate) => {
    onSaveCurrency(currency);
    closeForm();
  };

  const handleUpdateRate = (currency: CurrencyRate, rate: number) => {
    onSaveCurrency({ ...currency, rate, updatedAt: new Date().toISOString() });
  };

  /** Taban walyuta seçimi — onay sonrası kalıcı olarak kaydedilir. */
  const confirmSetBase = async (currency: CurrencyRate) => {
    setBasePickTarget(null);
    try {
      await saveBaseCurrency(storeDb, currency);
      setBaseCode(currency.code);
      setNotice(
        language === 'tm'
          ? `Esas walýuta: ${currency.code}`
          : `Esas para birimi: ${currency.code}`
      );
    } catch {
      setNotice(
        language === 'tm'
          ? 'Esas walýuta üýtgedilmedi.'
          : 'Esas para birimi değiştirilemedi.'
      );
    }
  };

  // Mobil yüzen + butonu — täze walýuta formuny açýar.
  useEffect(
    () =>
      onMobileAdd(() => {
        setEditingCurrency(null);
        setIsFormOpen(true);
      }),
    []
  );

  /** Taban seçimi için aday listesi (şu anki taban hariç). */
  const baseCandidates = currencies.filter((c) => c.code !== baseCode);

  return (
    <div className="flex-1 flex flex-col bg-[#F1F5F9] overflow-hidden">
      <PageScroll>
        <div className="px-3 md:px-6 pt-3 md:pt-5 pb-3 space-y-3">
          <BaseCurrencyCard
            language={language}
            currencies={currencies}
            baseCode={baseCode}
            onPickBase={() => {
              const first = baseCandidates[0];
              if (first) setBasePickTarget(first);
              else
                setNotice(
                  language === 'tm'
                    ? 'Öň başga walýuta goşuň.'
                    : 'Önce başka bir para birimi ekleyin.'
                );
            }}
          />

          {notice && (
            <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
              {notice}
            </div>
          )}

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              {language === 'tm' ? 'Goşulan walýutalar' : 'Eklenen para birimleri'} (
              {currencies.length})
            </span>
            <button
              type="button"
              onClick={() => {
                setEditingCurrency(null);
                setIsFormOpen(true);
              }}
              className="h-10 px-5 bg-[#10b981] hover:bg-[#059669] text-white font-bold text-sm rounded-xl flex items-center gap-2 transition-colors shadow-sm flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              Walýuta goş
            </button>
          </div>
        </div>

        <div className="px-3 md:px-6">
          <CurrencyTable
            currencies={currencies}
            language={language}
            baseCode={baseCode}
            onUpdateRate={handleUpdateRate}
            onEdit={(currency) => {
              setEditingCurrency(currency);
              setIsFormOpen(true);
            }}
            onDelete={(currency) => setDeleteTarget(currency)}
            onSetBase={(currency) => setBasePickTarget(currency)}
          />
        </div>
      </PageScroll>

      {isFormOpen && (
        <CurrencyFormModal
          language={language}
          currencies={currencies}
          editingCurrency={editingCurrency}
          onSave={handleSave}
          onClose={closeForm}
        />
      )}

      {deleteTarget && (
        <CurrencyDeleteDialog
          currency={deleteTarget}
          language={language}
          isInUse={inUseCodes.includes(deleteTarget.code)}
          isBase={deleteTarget.code === baseCode}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            onDeleteCurrency(deleteTarget);
            setDeleteTarget(null);
          }}
        />
      )}

      {basePickTarget && (
        <CurrencyBaseConfirmDialog
          currency={basePickTarget}
          currentBaseCode={baseCode}
          language={language}
          onCancel={() => setBasePickTarget(null)}
          onConfirm={() => void confirmSetBase(basePickTarget)}
        />
      )}
    </div>
  );
};