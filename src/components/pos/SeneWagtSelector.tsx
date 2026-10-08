import React, { useEffect, useState } from 'react';
import { CalendarClock, RotateCcw } from 'lucide-react';
import type { LanguageCode } from '../../types';

interface SeneWagtSelectorProps {
  language: LanguageCode;
  /** null → häzirki wagt (canly); baha → el bilen saýlanan wagt. */
  value: Date | null;
  onChange: (value: Date | null) => void;
}

function two(value: number): string {
  return String(value).padStart(2, '0');
}

function inputValue(date: Date): string {
  return `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}T${two(
    date.getHours()
  )}:${two(date.getMinutes())}:${two(date.getSeconds())}`;
}

/**
 * Faktura senesi/ wagty üçin kiçijik saýlaýjy.
 * - Ýokarda SENE, aşakda WAGT.
 * - Sagdaky kalendar ikony → takwimi el bilen saýlamak.
 * - Aşaky öwrülişik ikony → üýtgedilen wagty häzirki wagta dolandyrýar.
 */
export const SeneWagtSelector: React.FC<SeneWagtSelectorProps> = ({ language, value, onChange }) => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const shown = value ?? now;
  const isManual = value !== null;
  const dateText = `${two(shown.getDate())}.${two(shown.getMonth() + 1)}.${shown.getFullYear()}`;
  const timeText = `${two(shown.getHours())}:${two(shown.getMinutes())}:${two(shown.getSeconds())}`;

  return (
    <div
      className={`rounded-lg border px-1.5 py-1 h-full flex items-center gap-1 transition-colors ${
        isManual ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-[#F8FAFC]'
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="text-[8px] font-bold text-gray-400 uppercase tracking-wide leading-none">
          {language === 'tm' ? 'Sene / Wagt' : 'Tarih / Saat'}
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="font-mono text-[10px] font-bold text-gray-800 leading-none">{dateText}</span>
          <span className="relative inline-flex w-4 h-4 items-center justify-center text-sky-600 hover:text-sky-700">
            <CalendarClock className="w-3.5 h-3.5" />
            <input
              type="datetime-local"
              step={1}
              value={inputValue(shown)}
              onChange={(e) => {
                const next = new Date(e.target.value);
                if (!Number.isNaN(next.getTime())) onChange(next);
              }}
              title={language === 'tm' ? 'Senäni we wagty el bilen saýla' : 'Tarih ve saati elle seç'}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </span>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="font-mono text-[10px] font-bold text-gray-800 leading-none">{timeText}</span>
          <button
            type="button"
            onClick={() => onChange(null)}
            disabled={!isManual}
            title={language === 'tm' ? 'Häzirki wagta dolan' : 'Şimdiki ana dön'}
            className={`w-4 h-4 inline-flex items-center justify-center rounded transition-colors ${
              isManual
                ? 'text-amber-600 hover:bg-amber-100'
                : 'text-gray-300 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>
      <span
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isManual ? 'bg-amber-400' : 'bg-emerald-400'}`}
        title={isManual ? 'El bilen saýlanan wagt' : 'Häzirki wagt'}
      />
    </div>
  );
};