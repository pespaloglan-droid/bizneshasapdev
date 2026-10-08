import React from 'react';
import type { PaperWidth, PrintFontScale, QrContent, ReceiptFieldFlags, ReceiptSettings } from '../../types';
import { Field, INPUT, SettingsCard, Toggle } from './settingsUi';

interface ThermalReceiptSettingsProps {
  value: ReceiptSettings;
  onChange: (next: ReceiptSettings) => void;
}

const FIELD_LABELS: { key: keyof ReceiptFieldFlags; label: string }[] = [
  { key: 'logo', label: 'Logo görkez' },
  { key: 'address', label: 'Salgy görkez' },
  { key: 'phone', label: 'Telefon görkez' },
  { key: 'taxId', label: 'Salgyt belgisi görkez' },
  { key: 'qr', label: 'QR kod görkez' },
  { key: 'barcode', label: 'Barkod görkez' },
  { key: 'cashier', label: 'Kassir ady görkez' },
  { key: 'customer', label: 'Müşderi ady görkez' },
];

const WIDTHS: { id: PaperWidth; label: string }[] = [
  { id: '58mm', label: '58 mm' },
  { id: '80mm', label: '80 mm' },
];

const FONTS: { id: PrintFontScale; label: string }[] = [
  { id: 'sm', label: 'Kiçi' },
  { id: 'md', label: 'Orta' },
  { id: 'lg', label: 'Uly' },
];

const QR_OPTIONS: { id: QrContent; label: string }[] = [
  { id: 'invoice', label: 'Faktura belgisi (çek №)' },
  { id: 'website', label: 'Kärhananyň ady / saýt' },
  { id: 'payment', label: 'Töleg maglumaty' },
];

const segBtn = (active: boolean) =>
  `h-8 px-3 rounded-lg text-[11px] font-bold transition-all ${
    active ? 'bg-emerald-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
  }`;

export const ThermalReceiptSettings: React.FC<ThermalReceiptSettingsProps> = ({ value, onChange }) => {
  const patch = (partial: Partial<ReceiptSettings>) => onChange({ ...value, ...partial });
  const toggleField = (key: keyof ReceiptFieldFlags) =>
    patch({ fields: { ...value.fields, [key]: !value.fields[key] } });

  return (
    <>
      <SettingsCard title="Görkezmeli meýdançalar" description="Çekde haýsy maglumatlar çap edilsin">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {FIELD_LABELS.map((item) => (
            <label
              key={item.key}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-[#F8FAFC] px-3 py-2 cursor-pointer hover:border-emerald-300 transition-colors"
            >
              <input
                type="checkbox"
                checked={value.fields[item.key]}
                onChange={() => toggleField(item.key)}
                className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-[11px] font-bold text-gray-700">{item.label}</span>
            </label>
          ))}
        </div>
      </SettingsCard>

      <SettingsCard title="Kagyz we ýazy" description="Termal rulonyň ini we ýazy ölçüsi">
        <Field label="Kagyz ini">
          <div className="flex items-center gap-2">
            {WIDTHS.map((w) => (
              <button key={w.id} type="button" onClick={() => patch({ paperWidth: w.id })} className={segBtn(value.paperWidth === w.id)}>
                {w.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Ýazy ölçüsi" hint="Göz zorlugy bolan kassirler üçin ulaldyp bolýar.">
          <div className="flex items-center gap-2">
            {FONTS.map((f) => (
              <button key={f.id} type="button" onClick={() => patch({ fontScale: f.id })} className={segBtn(value.fontScale === f.id)}>
                {f.label}
              </button>
            ))}
          </div>
        </Field>
      </SettingsCard>

      <SettingsCard title="QR we çap hereketi" description="QR mazmuny, awtomatik çap we nusga sany">
        <Field label="QR kod mazmuny">
          <select
            value={value.qrContent}
            onChange={(e) => patch({ qrContent: e.target.value as QrContent })}
            className={`${INPUT} cursor-pointer font-medium text-gray-800`}
          >
            {QR_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Toggle
          checked={value.autoPrint}
          label="Awtomatik çap"
          description="Satýyş tamamlananda çek awtomatik çap edilsin (Faktura ekranynda)."
          onChange={(v) => patch({ autoPrint: v })}
        />
        <Field label="Nusga sany (1–3)">
          <input
            type="number"
            min={1}
            max={3}
            value={value.copies}
            onChange={(e) => patch({ copies: Math.min(3, Math.max(1, parseInt(e.target.value) || 1)) })}
            className={`${INPUT} font-mono font-bold text-gray-800 w-24`}
          />
        </Field>
        <Field label="Çekiň aşagyndaky ýazgy">
          <input
            type="text"
            value={value.footerNote}
            onChange={(e) => patch({ footerNote: e.target.value })}
            placeholder="Sag boluň, ýene geliň!"
            className={`${INPUT} font-medium text-gray-800`}
          />
        </Field>
      </SettingsCard>
    </>
  );
};