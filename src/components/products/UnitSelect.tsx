import React, { useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import type { LanguageCode } from '../../types';
import {
  isUnitNameUnique,
  makeCustomUnit,
  unitLabel,
  type MeasurementUnit,
} from '../../db/unitService';

const CUSTOM_VALUE = '__custom_unit__';

interface UnitSelectProps {
  language: LanguageCode;
  units: readonly MeasurementUnit[];
  value: string;
  className: string;
  onSelect: (code: string) => void;
  onCreate: (unit: MeasurementUnit) => void;
}

/**
 * Ölçeg birligi saýlaýjy. Sanawyň aşagynda "+ Öz ölçeg birligiňi goş"
 * saýlawy bar — täze birlik şol ýerde goşulyp, göni saýlanýar.
 */
export const UnitSelect: React.FC<UnitSelectProps> = ({
  language,
  units,
  value,
  className,
  onSelect,
  onCreate,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');

  const handleChange = (next: string) => {
    if (next === CUSTOM_VALUE) {
      setIsAdding(true);
      setDraft('');
      setError('');
      return;
    }
    onSelect(next);
  };

  const handleAdd = () => {
    const name = draft.trim();
    if (!name) {
      setError(language === 'tm' ? 'At giriziň.' : 'Ad girin.');
      return;
    }
    if (!isUnitNameUnique(name, units)) {
      setError(language === 'tm' ? 'Bu ölçeg birligi eýýäm bar.' : 'Bu ölçü birimi zaten var.');
      return;
    }
    const unit = makeCustomUnit(name);
    onCreate(unit);
    onSelect(unit.code);
    setIsAdding(false);
    setDraft('');
    setError('');
  };

  return (
    <div>
      <select value={value} onChange={(e) => handleChange(e.target.value)} className={className}>
        {units.map((unit) => (
          <option key={unit.id} value={unit.code}>
            {unitLabel(units, unit.code, language)}
          </option>
        ))}
        {value && !units.some((unit) => unit.code === value) && (
          <option value={value}>{value.toUpperCase()}</option>
        )}
        <option value={CUSTOM_VALUE}>+ Öz ölçeg birligiňi goş</option>
      </select>

      {isAdding && (
        <div className="mt-1.5 rounded-xl border border-emerald-200 bg-emerald-50/60 p-2 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={draft}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAdd();
                }
                if (e.key === 'Escape') setIsAdding(false);
              }}
              placeholder={language === 'tm' ? 'Meselem: RULON' : 'Örn: RULON'}
              className="flex-1 min-w-0 h-8 px-2.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-800 bg-white outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="button"
              onClick={handleAdd}
              className="h-8 w-8 flex items-center justify-center rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white flex-shrink-0"
              title={language === 'tm' ? 'Goş' : 'Ekle'}
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="h-8 w-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 hover:bg-gray-100 text-gray-500 flex-shrink-0"
              title="Ýatyr"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {error ? (
            <div className="text-[10px] font-bold text-rose-600">{error}</div>
          ) : (
            <div className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1">
              <Plus className="w-3 h-3" />
              {language === 'tm'
                ? 'Täze birlik sanawa goşulýar we saýlanýar'
                : 'Yeni birim listeye eklenir ve seçilir'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};