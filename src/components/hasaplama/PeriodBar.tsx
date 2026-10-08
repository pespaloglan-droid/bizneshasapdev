import React from 'react';
import { CalendarDays } from 'lucide-react';
import { CALC_PERIODS, type CalcPeriod, type DateWindow } from '../../utils/calcPeriods';

interface PeriodBarProps {
  period: CalcPeriod;
  customFrom: string;
  customTo: string;
  resolved: DateWindow;
  onPeriodChange: (period: CalcPeriod) => void;
  onCustomFromChange: (value: string) => void;
  onCustomToChange: (value: string) => void;
}

function formatDay(date: Date): string {
  return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export const PeriodBar: React.FC<PeriodBarProps> = ({
  period,
  customFrom,
  customTo,
  resolved,
  onPeriodChange,
  onCustomFromChange,
  onCustomToChange,
}) => {
  const toInclusive = new Date(resolved.to.getTime() - 86400000);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex items-center gap-2 flex-wrap">
      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
        <CalendarDays className="w-3.5 h-3.5" />
        Döwür
      </span>

      {CALC_PERIODS.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onPeriodChange(item.id)}
          className={`h-9 px-3 rounded-xl text-[11px] font-bold transition-all ${
            period === item.id
              ? 'bg-[#10b981] text-white shadow-sm'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {item.label}
        </button>
      ))}

      {period === 'custom' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => onCustomFromChange(e.target.value)}
            className="h-9 px-2 bg-[#F8FAFC] border border-gray-200 rounded-xl text-[11px] font-medium text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <span className="text-gray-400 text-xs">—</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => onCustomToChange(e.target.value)}
            className="h-9 px-2 bg-[#F8FAFC] border border-gray-200 rounded-xl text-[11px] font-medium text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      )}

      <span className="ml-auto text-[11px] font-bold text-gray-400 font-mono">
        {formatDay(resolved.from)} — {formatDay(toInclusive)}
      </span>
    </div>
  );
};