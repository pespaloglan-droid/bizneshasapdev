import React from 'react';
import type { PaperWidth, PrintFontScale, QrContent, ReceiptFieldFlags, ReceiptSettings } from '../../types';
import { Field, INPUT, SettingsCard, Toggle } from './settingsUi';
import { useT } from '../../locales/LanguageContext';

interface ThermalReceiptSettingsProps {
  value: ReceiptSettings;
  onChange: (next: ReceiptSettings) => void;
}

const FIELD_LABELS: { key: keyof ReceiptFieldFlags; labelKey: string }[] = [
  { key: 'logo', labelKey: 'sazlamalar.thShowLogo' },
  { key: 'address', labelKey: 'sazlamalar.thShowAddress' },
  { key: 'phone', labelKey: 'sazlamalar.thShowPhone' },
  { key: 'taxId', labelKey: 'sazlamalar.thShowTaxId' },
  { key: 'qr', labelKey: 'sazlamalar.thShowQr' },
  { key: 'barcode', labelKey: 'sazlamalar.thShowBarcode' },
  { key: 'cashier', labelKey: 'sazlamalar.thShowCashier' },
  { key: 'customer', labelKey: 'sazlamalar.thShowCustomer' },
];

const WIDTHS: { id: PaperWidth; label: string }[] = [
  { id: '58mm', label: '58 mm' },
  { id: '80mm', label: '80 mm' },
];

const FONTS: { id: PrintFontScale; labelKey: string }[] = [
  { id: 'sm', labelKey: 'sazlamalar.fontSm' },
  { id: 'md', labelKey: 'sazlamalar.fontMd' },
  { id: 'lg', labelKey: 'sazlamalar.fontLg' },
];

const QR_OPTIONS: { id: QrContent; labelKey: string }[] = [
  { id: 'invoice', labelKey: 'sazlamalar.qrInvoice' },
  { id: 'website', labelKey: 'sazlamalar.qrWebsite' },
  { id: 'payment', labelKey: 'sazlamalar.qrPayment' },
];

const segBtn = (active: boolean) =>
  `h-8 px-3 rounded-lg text-[11px] font-bold transition-all ${
    active ? 'bg-emerald-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
  }`;

export const ThermalReceiptSettings: React.FC<ThermalReceiptSettingsProps> = ({ value, onChange }) => {
  const t = useT();
  const patch = (partial: Partial<ReceiptSettings>) => onChange({ ...value, ...partial });
  const toggleField = (key: keyof ReceiptFieldFlags) =>
    patch({ fields: { ...value.fields, [key]: !value.fields[key] } });

  return (
    <>
      <SettingsCard title={t('sazlamalar.thFieldsTitle')} description={t('sazlamalar.thFieldsDesc')}>
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
              <span className="text-[11px] font-bold text-gray-700">{t(item.labelKey)}</span>
            </label>
          ))}
        </div>
      </SettingsCard>

      <SettingsCard title={t('sazlamalar.thPaperTitle')} description={t('sazlamalar.thPaperDesc')}>
        <Field label={t('sazlamalar.prPaperWidth')}>
          <div className="flex items-center gap-2">
            {WIDTHS.map((w) => (
              <button key={w.id} type="button" onClick={() => patch({ paperWidth: w.id })} className={segBtn(value.paperWidth === w.id)}>
                {w.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label={t('sazlamalar.thFontSize')} hint={t('sazlamalar.thFontHint')}>
          <div className="flex items-center gap-2">
            {FONTS.map((f) => (
              <button key={f.id} type="button" onClick={() => patch({ fontScale: f.id })} className={segBtn(value.fontScale === f.id)}>
                {t(f.labelKey)}
              </button>
            ))}
          </div>
        </Field>
      </SettingsCard>

      <SettingsCard title={t('sazlamalar.thQrTitle')} description={t('sazlamalar.thQrDesc')}>
        <Field label={t('sazlamalar.thQrContent')}>
          <select
            value={value.qrContent}
            onChange={(e) => patch({ qrContent: e.target.value as QrContent })}
            className={`${INPUT} cursor-pointer font-medium text-gray-800`}
          >
            {QR_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {t(o.labelKey)}
              </option>
            ))}
          </select>
        </Field>
        <Toggle
          checked={value.autoPrint}
          label={t('sazlamalar.thAutoPrint')}
          description={t('sazlamalar.thAutoPrintDesc')}
          onChange={(v) => patch({ autoPrint: v })}
        />
        <Field label={t('sazlamalar.thCopies')}>
          <input
            type="number"
            min={1}
            max={3}
            value={value.copies}
            onChange={(e) => patch({ copies: Math.min(3, Math.max(1, parseInt(e.target.value) || 1)) })}
            className={`${INPUT} font-mono font-bold text-gray-800 w-24`}
          />
        </Field>
        <Field label={t('sazlamalar.thFooterNote')}>
          <input
            type="text"
            value={value.footerNote}
            onChange={(e) => patch({ footerNote: e.target.value })}
            placeholder={t('sazlamalar.thFooterPh')}
            className={`${INPUT} font-medium text-gray-800`}
          />
        </Field>
      </SettingsCard>
    </>
  );
};