import React, { useMemo, useState } from 'react';
import { Bell, BellOff, Plus, X } from 'lucide-react';
import type { InvoiceRecord, LanguageCode, Targow, TargowRegion } from '../../types';
import {
  DraftFilterState,
  EMPTY_DRAFT_FILTER,
  draftCreators,
  draftsFor,
} from '../../db/draftService';
import { GaralamaFilters } from './GaralamaFilters';
import { GaralamaTable } from './GaralamaTable';
import { GaralamaRejectDialog } from './GaralamaRejectDialog';

interface GaralamaListModalProps {
  language: LanguageCode;
  invoices: readonly InvoiceRecord[];
  targows: readonly Targow[];
  regions: readonly TargowRegion[];
  /** Saýlanan garalamany esasy Faktura ekranynda açýar. */
  onOpenDraft: (invoice: InvoiceRecord) => void;
  onAccept: (invoice: InvoiceRecord) => void;
  onReject: (invoice: InvoiceRecord, reason: string) => void;
  onCreateDraft?: () => void;
  /** Ana Faktura ekrany bilen paýlaşylýan ses tercihi. */
  soundEnabled: boolean;
  onToggleSound: () => void;
  onClose: () => void;
}

export const GaralamaListModal: React.FC<GaralamaListModalProps> = ({
  language,
  invoices,
  targows,
  regions,
  onOpenDraft,
  onAccept,
  onReject,
  onCreateDraft,
  soundEnabled,
  onToggleSound,
  onClose,
}) => {
  const [filters, setFilters] = useState<DraftFilterState>(EMPTY_DRAFT_FILTER);
  const [rejectTarget, setRejectTarget] = useState<InvoiceRecord | null>(null);

  const drafts = useMemo(() => draftsFor(invoices, filters), [invoices, filters]);
  const creators = useMemo(() => draftCreators(invoices), [invoices]);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-5 py-4 bg-gradient-to-r from-[#0B1F3A] to-[#163864] text-white flex items-center justify-between flex-shrink-0">
          <div>
            <span className="font-bold text-sm tracking-wide">Garalama fakturalar</span>
            <div className="text-[10px] text-gray-300 mt-0.5">
              {drafts.length} {language === 'tm' ? 'ýazgy görkezilýär' : 'kayıt gösteriliyor'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onCreateDraft && (
              <button
                type="button"
                onClick={onCreateDraft}
                className="h-8 px-3 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-bold text-[11px] flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Garalama döret
              </button>
            )}
            <button
              type="button"
              onClick={onToggleSound}
              className={`h-8 w-8 rounded-xl flex items-center justify-center transition-colors ${
                soundEnabled
                  ? 'bg-emerald-500/25 text-emerald-300 hover:bg-emerald-500/35'
                  : 'bg-white/10 text-gray-400 hover:bg-white/20'
              }`}
              title={
                soundEnabled
                  ? language === 'tm'
                    ? 'Bildirim sesi açyk — basyp öçür'
                    : 'Bildirim sesi açık — kapatmak için bas'
                  : language === 'tm'
                  ? 'Bildirim sesi ýapyk — basyp aç'
                  : 'Bildirim sesi kapalı — açmak için bas'
              }
            >
              {soundEnabled ? (
                <Bell className="w-4 h-4" />
              ) : (
                <BellOff className="w-4 h-4" />
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-3">
          <GaralamaFilters
            language={language}
            filters={filters}
            creators={creators}
            targows={targows}
            regions={regions}
            onChange={setFilters}
          />
          <GaralamaTable
            language={language}
            drafts={drafts}
            targows={targows}
            regions={regions}
            onOpen={(invoice) => onOpenDraft(invoice)}
            onAccept={(invoice) => onAccept(invoice)}
            onReject={(invoice) => setRejectTarget(invoice)}
          />
        </div>
      </div>

      {rejectTarget && (
        <GaralamaRejectDialog
          language={language}
          invoice={rejectTarget}
          onCancel={() => setRejectTarget(null)}
          onConfirm={(reason) => {
            onReject(rejectTarget, reason);
            setRejectTarget(null);
          }}
        />
      )}
    </div>
  );
};
