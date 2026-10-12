import React from 'react';
import {
  Barcode,
  Ruler,
  Tag,
  Percent,
  Calculator,
  Receipt,
  Coins,
  CreditCard,
  User,
  BookOpen,
} from 'lucide-react';
import type {
  PageOrientation,
  PrintFontScale,
  ReceiptSettings,
  StandardPrintColumns,
  StandardPrintInfo,
} from '../../types';
import { Field, INPUT, SettingsCard, Toggle } from './settingsUi';
import { useT } from '../../locales/LanguageContext';

interface StandardPrintPanelProps {
  value: ReceiptSettings;
  onChange: (next: ReceiptSettings) => void;
}

const ORIENTATIONS: { id: PageOrientation; labelKey: string }[] = [
  { id: 'portrait', labelKey: 'sazlamalar.spOrientPortrait' },
  { id: 'landscape', labelKey: 'sazlamalar.spOrientLandscape' },
];

const FONTS: { id: PrintFontScale; labelKey: string }[] = [
  { id: 'sm', labelKey: 'sazlamalar.fontSm' },
  { id: 'md', labelKey: 'sazlamalar.fontMd' },
  { id: 'lg', labelKey: 'sazlamalar.fontLg' },
];

const COLUMNS: { key: keyof StandardPrintColumns; labelKey: string; icon: React.ReactNode }[] = [
  { key: 'barcode', labelKey: 'sazlamalar.spColBarcode', icon: <Barcode className="w-3.5 h-3.5 text-gray-500" /> },
  { key: 'unit', labelKey: 'sazlamalar.spColUnit', icon: <Ruler className="w-3.5 h-3.5 text-gray-500" /> },
  { key: 'unitPrice', labelKey: 'sazlamalar.spColUnitPrice', icon: <Tag className="w-3.5 h-3.5 text-gray-500" /> },
  { key: 'discount', labelKey: 'sazlamalar.spColDiscount', icon: <Percent className="w-3.5 h-3.5 text-gray-500" /> },
  { key: 'subtotal', labelKey: 'sazlamalar.spColSubtotal', icon: <Calculator className="w-3.5 h-3.5 text-gray-500" /> },
  { key: 'tax', labelKey: 'sazlamalar.spColTax', icon: <Receipt className="w-3.5 h-3.5 text-gray-500" /> },
];

const INFO: { key: keyof StandardPrintInfo; labelKey: string; icon: React.ReactNode }[] = [
  { key: 'currency', labelKey: 'sazlamalar.spInfoCurrency', icon: <Coins className="w-3.5 h-3.5 text-emerald-600" /> },
  { key: 'payment', labelKey: 'sazlamalar.spInfoPayment', icon: <CreditCard className="w-3.5 h-3.5 text-blue-600" /> },
  { key: 'customer', labelKey: 'sazlamalar.spInfoCustomer', icon: <User className="w-3.5 h-3.5 text-violet-600" /> },
  { key: 'ledger', labelKey: 'sazlamalar.spInfoLedger', icon: <BookOpen className="w-3.5 h-3.5 text-amber-600" /> },
];

const segBtn = (active: boolean) =>
  `h-8 px-3 rounded-lg text-[11px] font-bold transition-all ${
    active ? 'bg-emerald-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
  }`;

export const StandardPrintPanel: React.FC<StandardPrintPanelProps> = ({ value, onChange }) => {
  const t = useT();
  const std = value.standard;
  const patchStd = (partial: Partial<ReceiptSettings['standard']>) =>
    onChange({ ...value, standard: { ...std, ...partial } });
  const toggleColumn = (key: keyof StandardPrintColumns) =>
    patchStd({ columns: { ...std.columns, [key]: !std.columns[key] } });
  const toggleInfo = (key: keyof StandardPrintInfo) =>
    patchStd({ info: { ...std.info, [key]: !std.info[key] } });

  return (
    <>
      <SettingsCard title={t('sazlamalar.spLayoutTitle')} description={t('sazlamalar.spLayoutDesc')}>
        <Field label={t('sazlamalar.spOrientation')}>
          <div className="flex items-center gap-2">
            {ORIENTATIONS.map((o) => (
              <button key={o.id} type="button" onClick={() => patchStd({ orientation: o.id })} className={segBtn(std.orientation === o.id)}>
                {t(o.labelKey)}
              </button>
            ))}
          </div>
        </Field>
        <Field label={t('sazlamalar.thFontSize')}>
          <div className="flex items-center gap-2">
            {FONTS.map((f) => (
              <button key={f.id} type="button" onClick={() => patchStd({ fontScale: f.id })} className={segBtn(std.fontScale === f.id)}>
                {t(f.labelKey)}
              </button>
            ))}
          </div>
        </Field>
        <Field label={t('sazlamalar.thCopies')}>
          <input
            type="number"
            min={1}
            max={3}
            value={std.copies}
            onChange={(e) => patchStd({ copies: Math.min(3, Math.max(1, parseInt(e.target.value) || 1)) })}
            className={`${INPUT} font-mono font-bold text-gray-800 w-24`}
          />
        </Field>
      </SettingsCard>

      <SettingsCard title={t('sazlamalar.spItemsTitle')} description={t('sazlamalar.spItemsDesc')}>
        <Toggle
          checked={std.showImages}
          label={t('sazlamalar.spShowImages')}
          description={t('sazlamalar.spShowImagesDesc')}
          onChange={(v) => patchStd({ showImages: v })}
        />
        <Field label={t('sazlamalar.spColumns')}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {COLUMNS.map((col) => (
              <label
                key={col.key}
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-[#F8FAFC] px-3 py-2 cursor-pointer hover:border-emerald-300 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={std.columns[col.key]}
                  onChange={() => toggleColumn(col.key)}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                {col.icon}
                <span className="text-[11px] font-bold text-gray-700">{t(col.labelKey)}</span>
              </label>
            ))}
          </div>
        </Field>

        <Field label={t('sazlamalar.spInfo')} hint={t('sazlamalar.spInfoHint')}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {INFO.map((item) => (
              <label
                key={item.key}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 cursor-pointer transition-colors ${
                  std.info[item.key]
                    ? 'border-emerald-300 bg-emerald-50/60'
                    : 'border-gray-200 bg-[#F8FAFC] hover:border-emerald-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={std.info[item.key]}
                  onChange={() => toggleInfo(item.key)}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                {item.icon}
                <span className="text-[11px] font-bold text-gray-700">{t(item.labelKey)}</span>
              </label>
            ))}
          </div>
        </Field>
      </SettingsCard>

      <SettingsCard title={t('sazlamalar.spHeadFootTitle')} description={t('sazlamalar.spHeadFootDesc')}>
        <Toggle
          checked={std.header}
          label={t('sazlamalar.spHeader')}
          description={t('sazlamalar.spHeaderDesc')}
          onChange={(v) => patchStd({ header: v })}
        />
        <Toggle
          checked={std.pageNumbers}
          label={t('sazlamalar.spFooter')}
          description={t('sazlamalar.spFooterDesc')}
          onChange={(v) => patchStd({ pageNumbers: v })}
        />
        <Toggle
          checked={std.signature}
          label={t('sazlamalar.spSignature')}
          description={t('sazlamalar.spSignatureDesc')}
          onChange={(v) => patchStd({ signature: v })}
        />
      </SettingsCard>

      <SettingsCard title={t('sazlamalar.spNotesTitle')} description={t('sazlamalar.spNotesDesc')}>
        <textarea
          value={std.notes}
          onChange={(e) => patchStd({ notes: e.target.value })}
          rows={3}
          placeholder={t('sazlamalar.spNotesPh')}
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-[#F8FAFC] focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-y font-medium text-gray-800"
        />
      </SettingsCard>
    </>
  );
};