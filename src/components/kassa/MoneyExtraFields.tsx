import React from 'react';
import type { AppUser, Customer, LanguageCode, MoneySubCategoryId } from '../../types';
import { SUB_CATEGORY_LABELS, MoneyExtraField } from '../../db/moneyService';
import { PersonPicker } from './PersonPicker';
import { INPUT, LABEL } from './kassaStyles';
import type { MoneyFormState } from './moneyFormModel';
import { useT } from '../../locales/LanguageContext';

interface MoneyExtraFieldsProps {
  extra: MoneyExtraField;
  form: MoneyFormState;
  customers: readonly Customer[];
  appUsers: readonly AppUser[];
  language: LanguageCode;
  selectedCustomer: Customer | null;
  patch: (partial: Partial<MoneyFormState>) => void;
  onQuickAdd: (name: string) => void;
}

function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${String(value)}`);
}

export const MoneyExtraFields: React.FC<MoneyExtraFieldsProps> = ({
  extra,
  form,
  customers,
  appUsers,
  language,
  selectedCustomer,
  patch,
  onQuickAdd,
}) => {
  const t = useT();
  switch (extra) {
    case 'none':
      return null;

    case 'customer':
      return (
        <PersonPicker
          label={t('kassa.customerOptional')}
          customers={customers}
          language={language}
          value={form.customerId}
          onSelect={(customer) => patch({ customerId: customer.id })}
          onClear={() => patch({ customerId: '' })}
          onQuickAdd={onQuickAdd}
        />
      );

    case 'customer-required':
      return (
        <PersonPicker
          label={t('kassa.customerLabel')}
          required
          customers={customers}
          language={language}
          value={form.customerId}
          selectedBalance={selectedCustomer?.balance}
          onSelect={(customer) => patch({ customerId: customer.id })}
          onClear={() => patch({ customerId: '' })}
          onQuickAdd={onQuickAdd}
        />
      );

    case 'supplier': {
      const suppliers = customers.filter((customer) => customer.type === 'supplier');
      return (
        <PersonPicker
          label={t('kassa.supplierOptional')}
          customers={suppliers.length > 0 ? suppliers : customers}
          language={language}
          value={form.customerId}
          onSelect={(customer) => patch({ customerId: customer.id })}
          onClear={() => patch({ customerId: '' })}
          onQuickAdd={onQuickAdd}
        />
      );
    }

    case 'person':
    case 'person-required':
      return (
        <div>
          <label className={LABEL}>
            {form.category === 'karz_almak' ? t('kassa.fromWhom') : t('kassa.toWhom')}
            {extra === 'person-required' ? ' *' : ''}
          </label>
          <input
            type="text"
            value={form.personName}
            onChange={(e) => patch({ personName: e.target.value })}
            className={`${INPUT} font-medium text-gray-800`}
          />
        </div>
      );

    case 'staff':
      return appUsers.length > 0 ? (
        <div>
          <label className={LABEL}>{t('kassa.staffLabel')}</label>
          <select
            value={form.staffUserId}
            onChange={(e) => patch({ staffUserId: e.target.value })}
            className={`${INPUT} cursor-pointer font-medium text-gray-800`}
          >
            <option value="">{t('kassa.selectOption')}</option>
            {appUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.fullName} ({user.role})
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div>
          <label className={LABEL}>{t('kassa.staffNameLabel')}</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => patch({ description: e.target.value })}
            className={`${INPUT} font-medium text-gray-800`}
          />
        </div>
      );

    case 'subcategory':
      return (
        <div>
          <label className={LABEL}>{t('kassa.subCategoryLabel')}</label>
          <select
            value={form.subCategory}
            onChange={(e) => patch({ subCategory: e.target.value as MoneySubCategoryId | '' })}
            className={`${INPUT} cursor-pointer font-medium text-gray-800`}
          >
            <option value="">{t('kassa.selectOption')}</option>
            {(Object.keys(SUB_CATEGORY_LABELS) as MoneySubCategoryId[]).map((key) => (
              <option key={key} value={key}>
                {SUB_CATEGORY_LABELS[key]}
              </option>
            ))}
          </select>
        </div>
      );

    default:
      return assertNever(extra);
  }
};
