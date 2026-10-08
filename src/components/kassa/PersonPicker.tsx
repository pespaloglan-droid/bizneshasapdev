import React, { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { Customer, LanguageCode } from '../../types';
import { formatMoney } from '../../utils/money';

interface PersonPickerProps {
  customers: readonly Customer[];
  language: LanguageCode;
  value: string;
  label: string;
  required?: boolean;
  selectedBalance?: number;
  onSelect: (customer: Customer) => void;
  onClear: () => void;
  onQuickAdd: (name: string) => void;
}

export const PersonPicker: React.FC<PersonPickerProps> = ({
  customers,
  language,
  value,
  label,
  required,
  selectedBalance,
  onSelect,
  onClear,
  onQuickAdd,
}) => {
  const selectedCustomer = customers.find((customer) => customer.id === value) ?? null;
  const selectedName = selectedCustomer?.name ?? '';
  const [query, setQuery] = useState(selectedName);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setQuery(selectedName);
  }, [selectedName]);

  const trimmed = query.trim();
  const results = useMemo(() => {
    const q = trimmed.toLowerCase();
    if (!q) return [];
    return customers
      .filter(
        (customer) =>
          customer.name.toLowerCase().includes(q) ||
          (customer.phone ?? '').toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [customers, trimmed]);

  const hasExactMatch = customers.some(
    (customer) => customer.name.toLowerCase() === trimmed.toLowerCase()
  );
  const canQuickAdd = trimmed.length > 0 && !hasExactMatch && !selectedCustomer;

  const handlePick = (customer: Customer) => {
    setQuery(customer.name);
    setIsOpen(false);
    onSelect(customer);
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    onClear();
  };

  return (
    <div className="relative">
      <label className="block text-[11px] font-bold text-gray-500 mb-1">
        {label}
        {required ? ' *' : ''}
      </label>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => window.setTimeout(() => setIsOpen(false), 150)}
          placeholder={language === 'tm' ? 'Gözle ýa-da ýaz...' : 'Ara veya yaz...'}
          className="w-full h-10 pl-9 pr-8 bg-[#F8FAFC] border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
        {(query || selectedCustomer) && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && (results.length > 0 || canQuickAdd) && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
          {results.map((customer) => (
            <button
              key={customer.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handlePick(customer);
              }}
              className="w-full text-left px-3 py-2 hover:bg-emerald-50 transition-colors flex items-center justify-between gap-2"
            >
              <span className="text-xs font-semibold text-gray-800">{customer.name}</span>
              {customer.phone && (
                <span className="text-[10px] text-gray-400 font-mono">{customer.phone}</span>
              )}
            </button>
          ))}
          {canQuickAdd && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setIsOpen(false);
                onQuickAdd(trimmed);
              }}
              className="w-full text-left px-3 py-2 bg-emerald-50/60 hover:bg-emerald-100 transition-colors text-xs font-bold text-emerald-700 border-t border-gray-100"
            >
              Ýazgyda ýok — täze goş: "{trimmed}"
            </button>
          )}
        </div>
      )}

      {selectedCustomer && selectedBalance !== undefined && (
        <div className="mt-1.5 bg-[#F8FAFC] border border-gray-200 rounded-xl px-3 py-2 text-[11px] font-bold">
          {selectedBalance > 0 ? (
            <span className="text-rose-600">Bergi: {formatMoney(Math.abs(selectedBalance))}</span>
          ) : selectedBalance < 0 ? (
            <span className="text-emerald-600">
              Aljy (kredit): {formatMoney(Math.abs(selectedBalance))}
            </span>
          ) : (
            <span className="text-gray-500">Hasaby arassa</span>
          )}
        </div>
      )}
    </div>
  );
};
