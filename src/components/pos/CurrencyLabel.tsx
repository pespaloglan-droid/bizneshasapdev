import React from 'react';
import { BASE_CURRENCY_CODE } from '../../db/currencyService';

interface CurrencyLabelProps {
  className?: string;
}

/**
 * Pul mukdaryndan soň görkezilýän walýuta kody (TMT).
 * Ähli baha görkezijilerinde bitewüleşdirilen görnüş üçin ulanylýar.
 */
export const CurrencyLabel: React.FC<CurrencyLabelProps> = ({ className }) => (
  <span className={className ?? 'text-[0.8em] font-bold opacity-70'}>
    {BASE_CURRENCY_CODE}
  </span>
);