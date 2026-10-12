import React from 'react';
import type {
  CurrencyRate,
  Customer,
  PaymentMethod,
  Targow,
  TargowRegion,
} from '../../types';
import { useT } from '../../locales/LanguageContext';

interface DraftMetaFieldsProps {
  targows: readonly Targow[];
  regions: readonly TargowRegion[];
  customers: readonly Customer[];
  currencies: readonly CurrencyRate[];
  targowId: string;
  customerId: string;
  regionId: string;
  paymentMethod: PaymentMethod;
  currency: string;
  baseCurrency: string;
  onTargowChange: (id: string) => void;
  onCustomerChange: (id: string) => void;
  onRegionChange: (id: string) => void;
  onPaymentChange: (method: PaymentMethod) => void;
  onCurrencyChange: (code: string) => void;
}

const INPUT =
  'w-full h-9 px-3 border border-gray-200 rounded-xl text-sm bg-[#F8FAFC] focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none';
const LABEL = 'block text-[11px] font-bold text-gray-500 mb-1';

const PAYMENT_OPTIONS: { value: PaymentMethod; labelKey: string }[] = [
  { value: 'cash', labelKey: 'faktura.payCash' },
  { value: 'card', labelKey: 'faktura.payCard' },
  { value: 'credit', labelKey: 'faktura.payCredit' },
];

export const DraftMetaFields: React.FC<DraftMetaFieldsProps> = ({
  targows,
  regions,
  customers,
  currencies,
  targowId,
  customerId,
  regionId,
  paymentMethod,
  currency,
  baseCurrency,
  onTargowChange,
  onCustomerChange,
  onRegionChange,
  onPaymentChange,
  onCurrencyChange,
}) => {
  const t = useT();
  const targow = targows.find((item) => item.id === targowId) ?? null;
  const availableRegions = regions.filter((region) =>
    targow ? targow.regionIds.includes(region.id) : false
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div>
        <label className={LABEL}>{t('faktura.targowLabel')}</label>
        <select
          value={targowId}
          onChange={(e) => onTargowChange(e.target.value)}
          className={`${INPUT} cursor-pointer font-medium text-gray-800`}
        >
          {targows.map((item) => (
            <option key={item.id} value={item.id}>
              {item.fullName}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={LABEL}>{t('faktura.customerLabel')}</label>
        <select
          value={customerId}
          onChange={(e) => onCustomerChange(e.target.value)}
          className={`${INPUT} cursor-pointer font-medium text-gray-800`}
        >
          <option value="">{t('faktura.selectOption')}</option>
          {customers.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={LABEL}>{t('faktura.regionLabel')}</label>
        <select
          value={regionId}
          onChange={(e) => onRegionChange(e.target.value)}
          className={`${INPUT} cursor-pointer font-medium text-gray-800`}
        >
          <option value="">{t('faktura.selectOption')}</option>
          {availableRegions.map((region) => (
            <option key={region.id} value={region.id}>
              {region.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>{t('faktura.paymentLabel')}</label>
          <select
            value={paymentMethod}
            onChange={(e) => onPaymentChange(e.target.value as PaymentMethod)}
            className={`${INPUT} cursor-pointer font-medium text-gray-800`}
          >
            {PAYMENT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL}>{t('faktura.currencyLabel')}</label>
          <select
            value={currency}
            onChange={(e) => onCurrencyChange(e.target.value)}
            className={`${INPUT} cursor-pointer font-medium text-gray-800`}
          >
            <option value={baseCurrency}>{baseCurrency}</option>
            {currencies.map((item) => (
              <option key={item.id} value={item.code}>
                {item.code}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
