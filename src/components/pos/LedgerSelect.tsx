import React from 'react';
import { BookOpen } from 'lucide-react';
import type { LanguageCode, Ledger } from '../../types';

interface LedgerSelectProps {
  language: LanguageCode;
  ledgers: readonly Ledger[];
  value: string;
  onChange: (id: string) => void;
}

/** Ýaşyl kartoçkanyň aşagynda ýerleşýän Depder saýlaýjy. */
export const LedgerSelect: React.FC<LedgerSelectProps> = ({ language, ledgers, value, onChange }) => (
  <div className="relative w-full">
    <BookOpen className="absolute left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-sky-600 pointer-events-none" />
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      title={language === 'tm' ? 'Depder saýla' : 'Defter seç'}
      className="w-full h-9 pl-6 pr-1 rounded-lg text-[11px] font-bold outline-none truncate border bg-[#F8FAFC] border-gray-200 text-gray-700 focus:ring-1 focus:ring-emerald-500 cursor-pointer"
    >
      <option value="">Depder</option>
      {ledgers.map((ledger) => (
        <option key={ledger.id} value={ledger.id}>
          {ledger.name}
        </option>
      ))}
    </select>
  </div>
);