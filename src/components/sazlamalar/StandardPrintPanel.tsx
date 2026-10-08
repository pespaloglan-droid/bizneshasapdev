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

interface StandardPrintPanelProps {
  value: ReceiptSettings;
  onChange: (next: ReceiptSettings) => void;
}

const ORIENTATIONS: { id: PageOrientation; label: string }[] = [
  { id: 'portrait', label: 'Dik (Portrait)' },
  { id: 'landscape', label: 'Ýatyk (Landscape)' },
];

const FONTS: { id: PrintFontScale; label: string }[] = [
  { id: 'sm', label: 'Kiçi' },
  { id: 'md', label: 'Orta' },
  { id: 'lg', label: 'Uly' },
];

const COLUMNS: { key: keyof StandardPrintColumns; label: string; icon: React.ReactNode }[] = [
  { key: 'barcode', label: 'Barkod / SKU', icon: <Barcode className="w-3.5 h-3.5 text-gray-500" /> },
  { key: 'unit', label: 'Ölçeg birligi', icon: <Ruler className="w-3.5 h-3.5 text-gray-500" /> },
  { key: 'unitPrice', label: 'Birlik bahasy', icon: <Tag className="w-3.5 h-3.5 text-gray-500" /> },
  { key: 'discount', label: 'Ýeňillik (%)', icon: <Percent className="w-3.5 h-3.5 text-gray-500" /> },
  { key: 'subtotal', label: 'Aralyk jemi', icon: <Calculator className="w-3.5 h-3.5 text-gray-500" /> },
  { key: 'tax', label: 'Salgyt (KDV)', icon: <Receipt className="w-3.5 h-3.5 text-gray-500" /> },
];

const INFO: { key: keyof StandardPrintInfo; label: string; icon: React.ReactNode }[] = [
  { key: 'currency', label: 'Pul birligi (TMT)', icon: <Coins className="w-3.5 h-3.5 text-emerald-600" /> },
  { key: 'payment', label: 'Kassa (töleg usuly)', icon: <CreditCard className="w-3.5 h-3.5 text-blue-600" /> },
  { key: 'customer', label: 'Müşderi ady', icon: <User className="w-3.5 h-3.5 text-violet-600" /> },
  { key: 'ledger', label: 'Depder ady', icon: <BookOpen className="w-3.5 h-3.5 text-amber-600" /> },
];

const segBtn = (active: boolean) =>
  `h-8 px-3 rounded-lg text-[11px] font-bold transition-all ${
    active ? 'bg-emerald-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
  }`;

export const StandardPrintPanel: React.FC<StandardPrintPanelProps> = ({ value, onChange }) => {
  const std = value.standard;
  const patchStd = (partial: Partial<ReceiptSettings['standard']>) =>
    onChange({ ...value, standard: { ...std, ...partial } });
  const toggleColumn = (key: keyof StandardPrintColumns) =>
    patchStd({ columns: { ...std.columns, [key]: !std.columns[key] } });
  const toggleInfo = (key: keyof StandardPrintInfo) =>
    patchStd({ info: { ...std.info, [key]: !std.info[key] } });

  return (
    <>
      <SettingsCard title="Sahypa düzeni" description="A4 kagyzynyň ugry we ýaz ölçüsi">
        <Field label="Kagyz ugry">
          <div className="flex items-center gap-2">
            {ORIENTATIONS.map((o) => (
              <button key={o.id} type="button" onClick={() => patchStd({ orientation: o.id })} className={segBtn(std.orientation === o.id)}>
                {o.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Ýazy ölçüsi">
          <div className="flex items-center gap-2">
            {FONTS.map((f) => (
              <button key={f.id} type="button" onClick={() => patchStd({ fontScale: f.id })} className={segBtn(std.fontScale === f.id)}>
                {f.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Nusga sany (1–3)">
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

      <SettingsCard title="Harytlar" description="Ürün satyrlary nähili görkezilsin">
        <Toggle
          checked={std.showImages}
          label="Harytlary resim bilen görkez"
          description="Açyk bolsa her haryt satyrynda onuň suraty hem çap edilýär."
          onChange={(v) => patchStd({ showImages: v })}
        />
        <Field label="Görkeziljek sütünler">
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
                <span className="text-[11px] font-bold text-gray-700">{col.label}</span>
              </label>
            ))}
          </div>
        </Field>

        <Field label="Görkeziljek maglumatlar" hint="Kassa, müşderi, depder we pul birligi çapda görkezilsinmi.">
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
                <span className="text-[11px] font-bold text-gray-700">{item.label}</span>
              </label>
            ))}
          </div>
        </Field>
      </SettingsCard>

      <SettingsCard title="Sahypa başlygy / aýagy" description="Ýokarsy we aşaky düzenlemeler">
        <Toggle
          checked={std.header}
          label="Sahypa başlygy"
          description="Ýokarsynda uly logo we kärhana maglumatlary görkezilsin."
          onChange={(v) => patchStd({ header: v })}
        />
        <Toggle
          checked={std.pageNumbers}
          label="Sahypa aýagy"
          description="Aşaky böleginde kärhana ady we sahypa belgisi görkezilsin."
          onChange={(v) => patchStd({ pageNumbers: v })}
        />
        <Toggle
          checked={std.signature}
          label="Imza / Möhür ýeri"
          description="Aşaky böleginde 'Satyjy' we 'Alyjy' imza gutulary."
          onChange={(v) => patchStd({ signature: v })}
        />
      </SettingsCard>

      <SettingsCard title="Bellikler / Şertler" description="A4 çapynyň aşagyna goşulýan goşmaça tekst">
        <textarea
          value={std.notes}
          onChange={(e) => patchStd({ notes: e.target.value })}
          rows={3}
          placeholder="Mysal: Haryt 14 günüň dowamynda yzyna alynýar. Töleg şertleri..."
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-[#F8FAFC] focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-y font-medium text-gray-800"
        />
      </SettingsCard>
    </>
  );
};