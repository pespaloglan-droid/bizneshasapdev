import React, { useRef, useState } from 'react';
import { ImagePlus, Receipt, FileText, Trash2 } from 'lucide-react';
import type { PaperWidth, ReceiptSettings } from '../../types';
import { Field, INPUT, Notice, SaveBar, SettingsCard } from './settingsUi';
import { ReceiptPreview } from './ReceiptPreview';
import { StandardInvoicePreview } from './StandardInvoicePreview';
import { ThermalReceiptSettings } from './ThermalReceiptSettings';
import { StandardPrintPanel } from './StandardPrintPanel';

interface ReceiptSettingsPanelProps {
  value: ReceiptSettings;
  paperWidth: PaperWidth;
  dirty: boolean;
  onChange: (next: ReceiptSettings) => void;
  onSave: () => void;
  onReset: () => void;
}

type ReceiptTab = 'thermal' | 'standard';

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

export const ReceiptSettingsPanel: React.FC<ReceiptSettingsPanelProps> = ({
  value,
  paperWidth,
  dirty,
  onChange,
  onSave,
  onReset,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<ReceiptTab>('thermal');

  const patch = (partial: Partial<ReceiptSettings>) => onChange({ ...value, ...partial });

  const handleLogoFile = (file: File | undefined) => {
    setError('');
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Diňe PNG ýa-da JPG surat kabul edilýär.');
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setError('Suratyň ululygy 2 MB-dan uly bolmaly däl.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === 'string') patch({ logoDataUrl: result });
    };
    reader.readAsDataURL(file);
  };

  const TAB_BUTTONS: { id: ReceiptTab; label: string; icon: React.ReactNode }[] = [
    { id: 'thermal', label: 'Termal çek (80mm)', icon: <Receipt className="w-4 h-4" /> },
    { id: 'standard', label: 'Adaty çap (A4)', icon: <FileText className="w-4 h-4" /> },
  ];

  const activePaper = tab === 'standard' ? 'A4' : value.paperWidth || paperWidth;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-4">
      <div className="space-y-3 min-w-0">
        {/* Sekmeler */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-gray-200 shadow-sm w-fit">
          {TAB_BUTTONS.map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => setTab(btn.id)}
              className={`h-9 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                tab === btn.id ? 'bg-[#10b981] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {btn.icon}
              {btn.label}
            </button>
          ))}
        </div>

        {/* Ortak: Logo */}
        <SettingsCard title="Logo" description="Her iki çap görnüşinde hem ulanylýan surat (PNG/JPG, iň köp 2 MB)">
          <div className="flex items-center gap-3">
            <div className="w-20 h-20 rounded-xl border border-gray-200 bg-[#F8FAFC] flex items-center justify-center overflow-hidden flex-shrink-0">
              {value.logoDataUrl ? (
                <img src={value.logoDataUrl} alt="logo" className="w-full h-full object-contain" />
              ) : (
                <ImagePlus className="w-6 h-6 text-gray-300" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="h-9 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs"
              >
                Logo ýükle
              </button>
              {value.logoDataUrl && (
                <button
                  type="button"
                  onClick={() => patch({ logoDataUrl: '' })}
                  className="h-9 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Aýyr
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={(e) => handleLogoFile(e.target.files?.[0])}
            />
          </div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Logo ini (px; 0 = deslapky)">
              <input
                type="number"
                min="0"
                value={value.logoWidth || 0}
                onChange={(e) => patch({ logoWidth: parseInt(e.target.value) || 0 })}
                className={`${INPUT} font-mono font-bold text-gray-800`}
              />
            </Field>
            <Field label="Logony ortalaşdyr">
              <button
                type="button"
                onClick={() => patch({ logoCenter: !(value.logoCenter ?? true) })}
                className={`h-9 px-4 rounded-xl text-xs font-bold transition-all ${
                  (value.logoCenter ?? true)
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white text-gray-500 border border-gray-200'
                }`}
              >
                {(value.logoCenter ?? true) ? 'Ortada' : 'Çepde'}
              </button>
            </Field>
          </div>
          {error && <Notice tone="error" text={error} />}
        </SettingsCard>

        {/* Ortak: Kärhana maglumatlary */}
        <SettingsCard title="Kärhana maglumatlary" description="Iki çap görnüşinde hem bir hakyky çeşmeden gelýär">
          <Field label="Kärhananyň ady">
            <input
              type="text"
              value={value.companyName}
              onChange={(e) => patch({ companyName: e.target.value })}
              className={`${INPUT} font-medium text-gray-800`}
            />
          </Field>
          <Field label="Salgysy">
            <input
              type="text"
              value={value.address}
              onChange={(e) => patch({ address: e.target.value })}
              className={`${INPUT} font-medium text-gray-800`}
            />
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Telefon belgisi">
              <input
                type="text"
                value={value.phone}
                onChange={(e) => patch({ phone: e.target.value })}
                placeholder="+993 12 ..."
                className={`${INPUT} font-medium text-gray-800`}
              />
            </Field>
            <Field label="Salgyt belgisi / STIR">
              <input
                type="text"
                value={value.taxId}
                onChange={(e) => patch({ taxId: e.target.value })}
                className={`${INPUT} font-mono font-medium text-gray-800`}
              />
            </Field>
          </div>
        </SettingsCard>

        {/* Sekmä özel bölümler */}
        {tab === 'thermal' ? (
          <ThermalReceiptSettings value={value} onChange={onChange} />
        ) : (
          <StandardPrintPanel value={value} onChange={onChange} />
        )}

        <SaveBar dirty={dirty} onSave={onSave} onReset={onReset} />
      </div>

      <div className="xl:w-[360px] flex-shrink-0">
        <div className="xl:sticky xl:top-0">
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 text-center">
            Öňünden görmek ({activePaper})
          </div>
          <div className="bg-[#F1F5F9] rounded-2xl border border-gray-200 p-4">
            {tab === 'thermal' ? (
              <ReceiptPreview settings={value} paperWidth={value.paperWidth || paperWidth} />
            ) : (
              <StandardInvoicePreview settings={value} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};