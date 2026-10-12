import React, { useState } from 'react';
import { AlertTriangle, Check, Pencil, Plus, Trash2 } from 'lucide-react';
import type { LanguageCode, Product } from '../../types';
import {
  DEFAULT_UNITS,
  isUnitInUse,
  isUnitNameUnique,
  makeCustomUnit,
  makeUnitCode,
  type MeasurementUnit,
} from '../../db/unitService';
import { Notice, SettingsCard } from './settingsUi';
import { useT } from '../../locales/LanguageContext';

interface UnitsPanelProps {
  units: readonly MeasurementUnit[];
  products: readonly Product[];
  language: LanguageCode;
  onSaveUnit: (unit: MeasurementUnit) => void;
  onDeleteUnit: (unit: MeasurementUnit) => void;
}

export const UnitsPanel: React.FC<UnitsPanelProps> = ({
  units,
  products,
  language,
  onSaveUnit,
  onDeleteUnit,
}) => {
  const t = useT();
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [error, setError] = useState('');

  const defaultIds = new Set(DEFAULT_UNITS.map((unit) => unit.id));

  const handleAdd = () => {
    const name = draft.trim();
    if (!name) {
      setError(t('sazlamalar.unitNameRequired'));
      return;
    }
    if (!isUnitNameUnique(name, units)) {
      setError(t('sazlamalar.unitExists'));
      return;
    }
    onSaveUnit(makeCustomUnit(name));
    setDraft('');
    setError('');
  };

  const commitEdit = (unit: MeasurementUnit) => {
    const name = editingName.trim();
    if (!name) {
      setError(t('sazlamalar.unitNameRequiredEdit'));
      return;
    }
    if (!isUnitNameUnique(name, units, unit.id)) {
      setError(t('sazlamalar.unitExists'));
      return;
    }
    const label = name.toUpperCase();
    onSaveUnit({ ...unit, labelTm: label, labelTr: label });
    setEditingId(null);
    setEditingName('');
    setError('');
  };

  const handleDelete = (unit: MeasurementUnit) => {
    if (isUnitInUse(unit.code, products)) {
      setError(t('sazlamalar.unitInUse', { name: unit.labelTm }));
      return;
    }
    onDeleteUnit(unit);
    setError('');
  };

  return (
    <div className="space-y-3">
      <SettingsCard
        title={t('sazlamalar.secUnits')}
        description={t('sazlamalar.unitsDesc')}
      >
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
            }}
            placeholder={t('sazlamalar.unitNewPh')}
            className="flex-1 h-9 px-3 border border-gray-200 rounded-xl text-sm bg-[#F8FAFC] focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-gray-800"
          />
          <button
            type="button"
            onClick={handleAdd}
            className="h-9 px-4 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('sazlamalar.unitAdd')}
          </button>
        </div>

        {error && <Notice tone="error" text={error} />}

        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gray-50/80 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="py-2 px-3">{t('sazlamalar.unitColName')}</th>
                <th className="py-2 px-3">{t('sazlamalar.unitColCode')}</th>
                <th className="py-2 px-3 text-center">{t('sazlamalar.unitColUsedBy')}</th>
                <th className="py-2 px-3 text-center">{t('sazlamalar.unitColAction')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {units.map((unit) => {
                const usage = products.filter(
                  (product) => product.unit === unit.code || product.unit2 === unit.code
                ).length;
                const isEditing = editingId === unit.id;
                return (
                  <tr key={unit.id} className="hover:bg-gray-50/60">
                    <td className="py-1.5 px-3">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingName}
                          autoFocus
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitEdit(unit);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          className="w-full h-7 px-2 border border-emerald-300 rounded-lg text-xs font-bold outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      ) : (
                        <span className="font-bold text-gray-800">{unit.labelTm}</span>
                      )}
                    </td>
                    <td className="py-1.5 px-3 font-mono text-[10px] text-gray-400">
                      {isEditing ? makeUnitCode(editingName) : unit.code}
                    </td>
                    <td className="py-1.5 px-3 text-center">
                      {usage > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-50 text-sky-700 text-[10px] font-bold">
                          {usage}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="py-1.5 px-3">
                      <div className="flex items-center justify-center gap-1.5">
                        {isEditing ? (
                          <button
                            type="button"
                            onClick={() => commitEdit(unit)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(unit.id);
                              setEditingName(unit.labelTm);
                              setError('');
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-[#0B1F3A] hover:text-white text-gray-500 transition-colors"
                            title={t('sazlamalar.unitEditTitle')}
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(unit)}
                          disabled={defaultIds.has(unit.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-rose-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed text-gray-500 transition-colors"
                          title={
                            defaultIds.has(unit.id)
                              ? t('sazlamalar.unitFixedNoDelete')
                              : t('delete')
                          }
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-start gap-2 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>
            {t('sazlamalar.unitRuleHint')}
          </span>
        </div>
      </SettingsCard>
    </div>
  );
};