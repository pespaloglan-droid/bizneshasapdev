import React, { useMemo, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import type {
  AccessControlMode,
  Customer,
  LanguageCode,
  Ledger,
  PaymentMethod,
  Product,
  UserAccessControl,
  UserDefaults,
  Warehouse,
} from '../../types';
import { GENERAL_CUSTOMER_ID } from '../../db/customerService';
import { INVOICE_TYPE_OPTIONS } from '../../utils/invoiceTypeOptions';
import type { MeasurementUnit } from '../../db/unitService';
import { translations } from '../../locales/i18n';

// ── Ortak kömekçiler ─────────────────────────────────────────────────────────

interface OptionMeta {
  id: string;
  label: string;
}

function optionLabel(option: OptionMeta): string {
  return option.label || `#${option.id}`;
}

// ── Segmented control (3 görnüşli radio) ─────────────────────────────────────

interface SegmentedProps {
  language: LanguageCode;
  value: AccessControlMode;
  onChange: (mode: AccessControlMode) => void;
}

const MODES: { id: AccessControlMode; tm: string; tr: string }[] = [
  { id: 'all', tm: 'Ählisine rugsat', tr: 'Hepsine izin' },
  { id: 'whitelist', tm: 'Diňe saýlananlara', tr: 'Sadece seçilenlere' },
  { id: 'blacklist', tm: 'Saýlanandan başga', tr: 'Seçilenler hariç' },
];

function SegmentedControl({ language, value, onChange }: SegmentedProps) {
  const isTm = language === 'tm';
  return (
    <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
      {MODES.map((mode) => (
        <button
          key={mode.id}
          type="button"
          onClick={() => onChange(mode.id)}
          className={`flex-1 h-7 px-2 rounded-lg text-[10.5px] font-bold transition-all ${
            value === mode.id
              ? 'bg-[#10b981] text-white shadow-sm'
              : 'bg-transparent text-gray-600 hover:bg-gray-200'
          }`}
        >
          {isTm ? mode.tm : mode.tr}
        </button>
      ))}
    </div>
  );
}

// ── Aramalý çoklu saýlaw (chips + rozet) ─────────────────────────────────────

interface SearchableMultiProps {
  language: LanguageCode;
  options: readonly OptionMeta[];
  selected: string[];
  onChange: (ids: string[]) => void;
  placeholder: string;
}

/**
 * Arama meýdançasy + saýlananlaryň chip etiketleri + açylan sanaw.
 * Boş sanaw ("all" mod) üçin görkezilmeýär — diňe whitelist/blacklistde.
 */
function SearchableMultiSelect({
  language,
  options,
  selected,
  onChange,
  placeholder,
}: SearchableMultiProps) {
  const isTm = language === 'tm';
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const available = useMemo(() => {
    const q = query.trim().toLowerCase();
    return options.filter((option) => {
      if (selectedSet.has(option.id)) return false;
      if (!q) return true;
      return option.label.toLowerCase().includes(q) || option.id.toLowerCase().includes(q);
    });
  }, [options, selectedSet, query]);

  const selectedOptions = useMemo(
    () =>
      selected
        .map((id) => options.find((option) => option.id === id))
        .filter((option) => option !== undefined),
    [selected, options]
  );

  const toggle = (id: string) => {
    const next = selectedSet.has(id)
      ? selected.filter((item) => item !== id)
      : [...selected, id];
    onChange(next);
  };

  return (
    <div className="space-y-1.5">
      {/* Saýlananlar (chips) + rozet */}
      <div className="flex flex-wrap items-center gap-1.5 min-h-[26px]">
        {selectedOptions.map((option) => (
          <span
            key={option!.id}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 text-[10px] font-bold"
          >
            <Check className="w-3 h-3" />
            {optionLabel(option!)}
            <button
              type="button"
              onClick={() => toggle(option!.id)}
              className="text-emerald-700 hover:text-rose-600 ml-0.5"
              title={isTm ? 'Aýyr' : 'Kaldır'}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {selected.length > 0 && (
          <span className="inline-flex px-1.5 py-0.5 rounded-lg bg-gray-100 text-gray-600 text-[10px] font-bold">
            {selected.length} {isTm ? 'saýlandy' : 'seçildi'}
          </span>
        )}
        {selected.length === 0 && (
          <span className="text-[10px] text-gray-400 italic">
            {isTm ? 'Entek saýlanmady' : 'Henüz seçilmedi'}
          </span>
        )}
      </div>

      {/* Arama + sanaw */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 120)}
          placeholder={placeholder}
          className="w-full pl-7 pr-3 h-8 bg-[#F8FAFC] border border-gray-200 rounded-lg text-[11px] text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-emerald-500"
        />
        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-1 max-h-44 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            {available.length === 0 ? (
              <div className="px-3 py-2 text-[10.5px] text-gray-400">
                {isTm ? 'Tapylmady' : 'Bulunamadı'}
              </div>
            ) : (
              available.slice(0, 60).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggle(option.id)}
                  className="w-full text-left px-3 py-1.5 hover:bg-emerald-50 text-[11px] text-gray-700"
                >
                  {optionLabel(option)}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Kategoriýa karty (erişim) ────────────────────────────────────────────────

interface AccessCardProps {
  language: LanguageCode;
  title: string;
  entry: { mode: AccessControlMode; list: string[] };
  options: readonly OptionMeta[];
  onModeChange: (mode: AccessControlMode) => void;
  onListChange: (ids: string[]) => void;
  placeholder: string;
}

function AccessCard({
  language,
  title,
  entry,
  options,
  onModeChange,
  onListChange,
  placeholder,
}: AccessCardProps) {
  const isTm = language === 'tm';
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-2.5">
      <div className="text-[10.5px] font-bold text-gray-600 mb-1">{title}</div>
      <SegmentedControl
        language={language}
        value={entry.mode}
        onChange={onModeChange}
      />
      {entry.mode !== 'all' && (
        <div className="mt-1.5">
          <SearchableMultiSelect
            language={language}
            options={options}
            selected={entry.list}
            onChange={onListChange}
            placeholder={
              isTm
                ? `${placeholder} — gözle...`
                : `${placeholder} — ara...`
            }
          />
        </div>
      )}
    </div>
  );
}

// ── Esasy bölüm ──────────────────────────────────────────────────────────────

export interface UserAdvancedPermissionsProps {
  language: LanguageCode;
  defaults: UserDefaults;
  accessControl: UserAccessControl;
  onChange: (patch: { defaults?: UserDefaults; accessControl?: UserAccessControl }) => void;
  warehouses: readonly Warehouse[];
  ledgers: readonly Ledger[];
  units: readonly MeasurementUnit[];
  customers: readonly Customer[];
  products: readonly Product[];
}

export const UserAdvancedPermissions: React.FC<UserAdvancedPermissionsProps> = ({
  language,
  defaults,
  accessControl,
  onChange,
  warehouses,
  ledgers,
  units,
  customers,
  products,
}) => {
  const isTm = language === 'tm';
  const t = translations[language] || translations.en;
  const [isOpen, setIsOpen] = useState(false);

  const customerOptions: OptionMeta[] = useMemo(() => {
    const general = customers.find((c) => c.id === GENERAL_CUSTOMER_ID);
    const rest = customers.filter((c) => c.id !== GENERAL_CUSTOMER_ID);
    const head = general ? [general] : [];
    return [...head, ...rest].map((c) => ({ id: c.id, label: c.name }));
  }, [customers]);

  const productOptions: OptionMeta[] = useMemo(
    () => products.map((p) => ({ id: p.id, label: p.name })),
    [products]
  );

  const warehouseOptions: OptionMeta[] = useMemo(
    () => warehouses.map((w) => ({ id: w.id, label: w.name })),
    [warehouses]
  );

  const ledgerOptions: OptionMeta[] = useMemo(
    () => ledgers.map((l) => ({ id: l.id, label: l.name })),
    [ledgers]
  );

  const unitOptions: OptionMeta[] = useMemo(
    () => units.map((u) => ({ id: u.code, label: isTm ? u.labelTm : u.labelTr })),
    [units, isTm]
  );

  const invoiceTypeOptions: OptionMeta[] = useMemo(
    () =>
      INVOICE_TYPE_OPTIONS.map((o) => ({
        id: o.id,
        label: isTm ? o.labelTm : o.labelTr,
      })),
    [isTm]
  );

  const paymentOptions: { id: PaymentMethod; label: string }[] = [
    { id: 'cash', label: t.cashMethod },
    { id: 'card', label: t.cardMethod },
    { id: 'credit', label: t.creditMethod },
    { id: 'split', label: t.splitMethod },
  ];

  const patchDefaults = (field: keyof UserDefaults, value: string) => {
    onChange({ defaults: { ...defaults, [field]: value } });
  };

  const patchEntry = (
    key:
      | 'invoiceTypes'
      | 'paymentTypes'
      | 'customers'
      | 'products'
      | 'warehouses'
      | 'warehousesForInvoice'
      | 'depders',
    patch: Partial<{ mode: AccessControlMode; list: string[] }>
  ) => {
    const current = key === 'warehousesForInvoice'
      ? accessControl.warehousesForInvoice ?? { mode: 'all' as AccessControlMode, list: [] }
      : accessControl[key];
    const next: { mode: AccessControlMode; list: string[] } = {
      ...current,
      ...patch,
    };
    // "all" modda sanaw hemiselik boş saklanýr.
    if (next.mode === 'all') next.list = [];
    onChange({
      accessControl: {
        ...accessControl,
        [key]: next,
      },
    });
  };

  // "Faktura üçin aýratyn ambar" geçiriji — kapalysa null (umumy ambar rugsaty ulanylýar).
  const toggleInvoiceWarehouseOverride = () => {
    onChange({
      accessControl: {
        ...accessControl,
        warehousesForInvoice: accessControl.warehousesForInvoice
          ? null
          : { mode: 'all', list: [] },
      },
    });
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Başlyk — deslapky kapaly */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50/80 hover:bg-gray-100 text-[11.5px] font-bold text-gray-700 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <span className="text-emerald-700">✦</span>
          {isTm
            ? 'Ýörite rugsatlar (Warsaýylan bahalar we elýeterlilik)'
            : 'Gelişmiş İzinler (Varsayılan Değerler ve Erişim)'}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="px-3 py-3 space-y-3">
          {/* ── A) Warsaýylan bahalar ─────────────────────────────────────────── */}
          <div className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider">
            {isTm ? 'Warsaýylan bahalar' : 'Varsayılan Değerler'}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <label className="block text-[10px] font-bold text-gray-500">
              {isTm ? 'Başdaky faktura görnüşi' : 'Varsayılan fatura türü'}
              <select
                value={defaults.invoiceType ?? ''}
                onChange={(e) => patchDefaults('invoiceType', e.target.value)}
                className="w-full h-8 px-2 border border-gray-200 rounded-lg text-[11px] text-gray-700 bg-[#F8FAFC] focus:ring-2 focus:ring-emerald-500 outline-none mt-0.5"
              >
                <option value="">—</option>
                {invoiceTypeOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {optionLabel(option)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-[10px] font-bold text-gray-500">
              {isTm ? 'Başdaky töleg görnüşi' : 'Varsayılan ödeme türü'}
              <select
                value={defaults.paymentType ?? ''}
                onChange={(e) => patchDefaults('paymentType', e.target.value)}
                className="w-full h-8 px-2 border border-gray-200 rounded-lg text-[11px] text-gray-700 bg-[#F8FAFC] focus:ring-2 focus:ring-emerald-500 outline-none mt-0.5"
              >
                <option value="">—</option>
                {paymentOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {optionLabel(option)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-[10px] font-bold text-gray-500">
              {isTm ? 'Başdaky ölçeg (esas)' : 'Varsayılan ölçü birimi (ana)'}
              <select
                value={defaults.unit ?? ''}
                onChange={(e) => patchDefaults('unit', e.target.value)}
                className="w-full h-8 px-2 border border-gray-200 rounded-lg text-[11px] text-gray-700 bg-[#F8FAFC] focus:ring-2 focus:ring-emerald-500 outline-none mt-0.5"
              >
                <option value="">—</option>
                {unitOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {optionLabel(option)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-[10px] font-bold text-gray-500">
              {isTm ? 'Başdaky ikinji ölçeg (paket/koli)' : 'Varsayılan ikinci ölçü birimi (paket/koli)'}
              <select
                value={defaults.unit2 ?? ''}
                onChange={(e) => patchDefaults('unit2', e.target.value)}
                className="w-full h-8 px-2 border border-gray-200 rounded-lg text-[11px] text-gray-700 bg-[#F8FAFC] focus:ring-2 focus:ring-emerald-500 outline-none mt-0.5"
              >
                <option value="">—</option>
                {unitOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {optionLabel(option)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-[10px] font-bold text-gray-500">
              {isTm ? 'Başdaky müşderi' : 'Varsayılan müşteri'}
              <select
                value={defaults.customerId ?? ''}
                onChange={(e) => patchDefaults('customerId', e.target.value)}
                className="w-full h-8 px-2 border border-gray-200 rounded-lg text-[11px] text-gray-700 bg-[#F8FAFC] focus:ring-2 focus:ring-emerald-500 outline-none mt-0.5"
              >
                <option value="">
                  {isTm ? 'Hiç kim (Umumy Müşderi)' : 'Hiç kim (Genel Müşteri)'}
                </option>
                {customerOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {optionLabel(option)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-[10px] font-bold text-gray-500">
              {isTm ? 'Başdaky ambar' : 'Varsayılan ambar'}
              <select
                value={defaults.warehouseId ?? ''}
                onChange={(e) => patchDefaults('warehouseId', e.target.value)}
                className="w-full h-8 px-2 border border-gray-200 rounded-lg text-[11px] text-gray-700 bg-[#F8FAFC] focus:ring-2 focus:ring-emerald-500 outline-none mt-0.5"
              >
                <option value="">—</option>
                {warehouseOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {optionLabel(option)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-[10px] font-bold text-gray-500">
              {isTm ? 'Başdaky depder' : 'Varsayılan kasa defteri'}
              <select
                value={defaults.depderId ?? ''}
                onChange={(e) => patchDefaults('depderId', e.target.value)}
                className="w-full h-8 px-2 border border-gray-200 rounded-lg text-[11px] text-gray-700 bg-[#F8FAFC] focus:ring-2 focus:ring-emerald-500 outline-none mt-0.5"
              >
                <option value="">—</option>
                {ledgerOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {optionLabel(option)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* ── B) Elýeterlilik kontroli ─────────────────────────────────────── */}
          <div className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider mt-1">
            {isTm ? 'Elýeterlilik (Erişim) kontroli' : 'Erişim Kontrolü'}
          </div>
          <div className="grid grid-cols-1 gap-2.5">
            <AccessCard
              language={language}
              title={
                isTm
                  ? 'Tölegleriň haýsy görnüşlerini emele getirip bilýär?'
                  : 'Hangi ödeme türlerini oluşturabilir?'
              }
              entry={accessControl.paymentTypes}
              options={paymentOptions}
              onModeChange={(mode) => patchEntry('paymentTypes', { mode })}
              onListChange={(list) => patchEntry('paymentTypes', { list })}
              placeholder={isTm ? 'Töleg görnüşi' : 'Ödeme türü'}
            />

            <AccessCard
              language={language}
              title={isTm ? 'Müşderi rugsatlary' : 'Müşteri İzinleri'}
              entry={accessControl.customers}
              options={customerOptions}
              onModeChange={(mode) => patchEntry('customers', { mode })}
              onListChange={(list) => patchEntry('customers', { list })}
              placeholder={isTm ? 'Müşderi' : 'Müşteri'}
            />

            <AccessCard
              language={language}
              title={isTm ? 'Haryt rugsatlary' : 'Ürün İzinleri'}
              entry={accessControl.products}
              options={productOptions}
              onModeChange={(mode) => patchEntry('products', { mode })}
              onListChange={(list) => patchEntry('products', { list })}
              placeholder={isTm ? 'Haryt' : 'Ürün'}
            />

            <AccessCard
              language={language}
              title={isTm ? 'Ambar rugsatlary' : 'Ambar İzinleri'}
              entry={accessControl.warehouses}
              options={warehouseOptions}
              onModeChange={(mode) => patchEntry('warehouses', { mode })}
              onListChange={(list) => patchEntry('warehouses', { list })}
              placeholder={isTm ? 'Ambar' : 'Ambar'}
            />

            {/* Ambar — Faktura üçin aýratyn rugsat */}
            <div className="bg-white border border-gray-200 rounded-xl p-2.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={accessControl.warehousesForInvoice !== null}
                  onChange={toggleInvoiceWarehouseOverride}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-[10.5px] font-bold text-gray-600">
                  {isTm
                    ? 'Faktura üçin rugsatly ambarlar (umumy ambar rugsatyndan tapawutly bolsa)'
                    : 'Fatura için izinli ambarlar (genel ambar izninden farklıysa)'}
                </span>
              </label>
              {accessControl.warehousesForInvoice && (
                <div className="mt-1.5">
                  <SegmentedControl
                    language={language}
                    value={accessControl.warehousesForInvoice.mode}
                    onChange={(mode) => patchEntry('warehousesForInvoice', { mode })}
                  />
                  {accessControl.warehousesForInvoice.mode !== 'all' && (
                    <div className="mt-1.5">
                      <SearchableMultiSelect
                        language={language}
                        options={warehouseOptions}
                        selected={accessControl.warehousesForInvoice.list}
                        onChange={(list) => patchEntry('warehousesForInvoice', { list })}
                        placeholder={isTm ? 'Ambar — gözle...' : 'Ambar — ara...'}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <AccessCard
              language={language}
              title={isTm ? 'Depder rugsatlary' : 'Kasa Defteri İzinleri'}
              entry={accessControl.depders}
              options={ledgerOptions}
              onModeChange={(mode) => patchEntry('depders', { mode })}
              onListChange={(list) => patchEntry('depders', { list })}
              placeholder={isTm ? 'Depder' : 'Kasa defteri'}
            />
          </div>
        </div>
      )}
    </div>
  );
};