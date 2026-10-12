import React, { useState } from 'react';
import { X } from 'lucide-react';
import type {
  CartItem,
  CurrencyRate,
  Customer,
  InvoiceRecord,
  LanguageCode,
  PaymentMethod,
  Product,
  Targow,
  TargowRegion,
  User,
} from '../../types';
import { BASE_CURRENCY_CODE, convertToTmt, rateForCode } from '../../db/currencyService';
import { DraftLinesEditor } from './DraftLinesEditor';
import { DraftMetaFields } from './DraftMetaFields';
import { buildDraftInvoice, detectDevice, orderSubtotal } from './draftModel';
import { useT } from '../../locales/LanguageContext';

interface DraftFormModalProps {
  language: LanguageCode;
  targows: readonly Targow[];
  regions: readonly TargowRegion[];
  customers: readonly Customer[];
  products: readonly Product[];
  currencies: readonly CurrencyRate[];
  currentUser: User;
  preselectTargowId: string | null;
  onCreate: (invoice: InvoiceRecord) => void;
  onClose: () => void;
}

const INPUT =
  'w-full h-9 px-3 border border-gray-200 rounded-xl text-sm bg-[#F8FAFC] focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none';
const LABEL = 'block text-[11px] font-bold text-gray-500 mb-1';

function roleLabel(role: User['role']): string {
  if (role === 'admin') return 'Administrator';
  if (role === 'manager') return 'Ýolbaşçy';
  return 'Işgär';
}

export const DraftFormModal: React.FC<DraftFormModalProps> = ({
  language,
  targows,
  regions,
  customers,
  products,
  currencies,
  currentUser,
  preselectTargowId,
  onCreate,
  onClose,
}) => {
  const t = useT();
  const initialTargow =
    targows.find((item) => item.id === preselectTargowId) ??
    targows.find((item) => item.isActive) ??
    targows[0] ??
    null;

  const [targowId, setTargowId] = useState(initialTargow?.id ?? '');
  const [customerId, setCustomerId] = useState('');
  const [regionId, setRegionId] = useState(initialTargow?.regionIds[0] ?? '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [currency, setCurrency] = useState<string>(BASE_CURRENCY_CODE);
  const [lines, setLines] = useState<CartItem[]>([]);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const targow = targows.find((item) => item.id === targowId) ?? null;
  const customer = customers.find((item) => item.id === customerId) ?? null;

  const subtotal = orderSubtotal(lines);
  const rate = rateForCode(currencies, currency);
  const subtotalTmt = currency === BASE_CURRENCY_CODE ? subtotal : convertToTmt(subtotal, rate);

  const addProduct = (product: Product) => {
    setLines((prev) => {
      const existing = prev.find((line) => line.productId === product.id);
      if (existing) {
        return prev.map((line) =>
          line.productId === product.id ? { ...line, qty: line.qty + 1 } : line
        );
      }
      return [
        ...prev,
        {
          id: `drf-${Date.now()}-${Math.random()}`,
          productId: product.id,
          sku: product.sku,
          name: product.name,
          price: product.price,
          qty: 1,
          unit: product.unit,
          imageType: product.imageType,
          imageUrl: product.imageUrl,
        },
      ];
    });
  };

  const changeQty = (productId: string, delta: number) => {
    setLines((prev) =>
      prev
        .map((line) =>
          line.productId === productId ? { ...line, qty: Math.max(0, line.qty + delta) } : line
        )
        .filter((line) => line.qty > 0)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!targow) {
      setError(t('faktura.selectTargow'));
      return;
    }
    if (!customer) {
      setError(t('faktura.selectCustomer'));
      return;
    }
    if (!regionId) {
      setError(t('faktura.selectRegion'));
      return;
    }
    if (lines.length === 0) {
      setError(t('faktura.addOneProduct'));
      return;
    }

    onCreate(
      buildDraftInvoice(
        {
          targow,
          customer,
          regionId,
          lines,
          paymentMethod,
          currency,
          rate,
          note,
          createdBy: currentUser.name,
          createdByRole: roleLabel(currentUser.role),
        },
        detectDevice()
      )
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-5 py-4 bg-gradient-to-r from-[#0B1F3A] to-[#163864] text-white flex items-center justify-between flex-shrink-0">
          <div>
            <span className="font-bold text-sm tracking-wide">{t('faktura.createTitle')}</span>
            <div className="text-[10px] text-gray-300 mt-0.5">
              {t('faktura.draftNoEffect')}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 space-y-4">
          <DraftMetaFields
            targows={targows}
            regions={regions}
            customers={customers}
            currencies={currencies}
            targowId={targowId}
            customerId={customerId}
            regionId={regionId}
            paymentMethod={paymentMethod}
            currency={currency}
            baseCurrency={BASE_CURRENCY_CODE}
            onTargowChange={(id) => {
              setTargowId(id);
              const next = targows.find((item) => item.id === id);
              setRegionId(next?.regionIds[0] ?? '');
            }}
            onCustomerChange={setCustomerId}
            onRegionChange={setRegionId}
            onPaymentChange={setPaymentMethod}
            onCurrencyChange={setCurrency}
          />

          <DraftLinesEditor
            language={language}
            products={products}
            lines={lines}
            currency={currency}
            baseCurrency={BASE_CURRENCY_CODE}
            subtotal={subtotal}
            subtotalTmt={subtotalTmt}
            onAdd={addProduct}
            onQtyChange={changeQty}
          />

          <div>
            <label className={LABEL}>{t('faktura.noteLabel')}</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={`${INPUT} font-medium text-gray-800`}
            />
          </div>

          {error && (
            <div className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs"
            >
              {t('faktura.cancelBtn')}
            </button>
            <button
              type="submit"
              className="h-9 px-5 rounded-xl bg-[#0B1F3A] hover:bg-[#163864] text-white font-bold text-xs"
            >
              {t('faktura.saveDraft')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
