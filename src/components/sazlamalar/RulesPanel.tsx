import React from 'react';
import type { BarcodeReaderSettings, FirmSettings, OperationSettings } from '../../types';
import { Field, INPUT, SaveBar, SettingsCard, Toggle } from './settingsUi';

interface RulesPanelProps {
  firm: FirmSettings;
  operations: OperationSettings;
  barcode: BarcodeReaderSettings;
  dirty: boolean;
  onChange: (patch: { firm: FirmSettings; operations: OperationSettings; barcode: BarcodeReaderSettings }) => void;
  onSave: () => void;
  onReset: () => void;
}

export const RulesPanel: React.FC<RulesPanelProps> = ({
  firm,
  operations,
  barcode,
  dirty,
  onChange,
  onSave,
  onReset,
}) => {
  const patchFirm = (partial: Partial<FirmSettings>) =>
    onChange({ firm: { ...firm, ...partial }, operations, barcode });
  const patchOps = (partial: Partial<OperationSettings>) =>
    onChange({ firm, operations: { ...operations, ...partial }, barcode });
  const patchBarcode = (partial: Partial<BarcodeReaderSettings>) =>
    onChange({ firm, operations, barcode: { ...barcode, ...partial } });

  return (
    <div className="space-y-3">
      {/* ── Firma maglumatlary ─────────────────────────────────────────────── */}
      <SettingsCard title="Firma maglumatlary" description="Ad, kod, başlyk, telefon, faks, salgy we salgyt göterimi">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Firma ady">
            <input
              type="text"
              value={firm.name}
              onChange={(e) => patchFirm({ name: e.target.value })}
              className={`${INPUT} font-medium text-gray-800`}
            />
          </Field>
          <Field label="Firma kody">
            <input
              type="text"
              value={firm.code}
              onChange={(e) => patchFirm({ code: e.target.value })}
              className={`${INPUT} font-mono font-medium text-gray-800`}
            />
          </Field>
          <Field label="Başlyk (beýany)">
            <input
              type="text"
              value={firm.title}
              onChange={(e) => patchFirm({ title: e.target.value })}
              className={`${INPUT} font-medium text-gray-800`}
            />
          </Field>
          <Field label="Telefon">
            <input
              type="text"
              value={firm.phone}
              onChange={(e) => patchFirm({ phone: e.target.value })}
              className={`${INPUT} font-medium text-gray-800`}
            />
          </Field>
          <Field label="Faks">
            <input
              type="text"
              value={firm.fax}
              onChange={(e) => patchFirm({ fax: e.target.value })}
              className={`${INPUT} font-medium text-gray-800`}
            />
          </Field>
          <Field label="Salgy">
            <input
              type="text"
              value={firm.address}
              onChange={(e) => patchFirm({ address: e.target.value })}
              className={`${INPUT} font-medium text-gray-800`}
            />
          </Field>
          <Field label="Salgyt göterimi (%)">
            <input
              type="number"
              min="0"
              step="0.1"
              value={firm.taxPercent || ''}
              onChange={(e) => patchFirm({ taxPercent: parseFloat(e.target.value) || 0 })}
              className={`${INPUT} font-mono font-bold text-gray-800`}
            />
          </Field>
        </div>
      </SettingsCard>

      {/* ── Operasiýa düzgünleri ───────────────────────────────────────────── */}
      <SettingsCard title="Operasiýa düzgünleri" description="Pasif ýazgylar, alş bahasy, nesiýe möhleti we seneler">
        <div className="space-y-2.5">
          <Toggle
            label="Passiw müşderini faktura/kassada ulan"
            checked={operations.allowInactiveCustomer}
            onChange={(checked) => patchOps({ allowInactiveCustomer: checked })}
          />
          <Toggle
            label="Passiw harydy sepete goş"
            checked={operations.allowInactiveProduct}
            onChange={(checked) => patchOps({ allowInactiveProduct: checked })}
          />
          <Toggle
            label="Alş bahasynyň aşagyna sat"
            checked={operations.allowBelowCostSale}
            onChange={(checked) => patchOps({ allowBelowCostSale: checked })}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <Field label="Nesiýä möhleti (iň kiçi gün)">
              <input
                type="number"
                min="1"
                value={operations.creditMinDays || ''}
                onChange={(e) => patchOps({ creditMinDays: parseInt(e.target.value) || 3 })}
                className={`${INPUT} font-mono font-bold text-gray-800`}
              />
            </Field>
            <Field label="Nesiýä möhleti (iň uly gün)">
              <input
                type="number"
                min="1"
                value={operations.creditMaxDays || ''}
                onChange={(e) => patchOps({ creditMaxDays: parseInt(e.target.value) || 360 })}
                className={`${INPUT} font-mono font-bold text-gray-800`}
              />
            </Field>
            <Field label="Nesiýä möhleti (deslapky gün)">
              <input
                type="number"
                min="1"
                value={operations.creditDefaultDays || ''}
                onChange={(e) => patchOps({ creditDefaultDays: parseInt(e.target.value) || 90 })}
                className={`${INPUT} font-mono font-bold text-gray-800`}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <Field label="Operasiýa başlangyç senesi (boş = açyk)">
              <input
                type="date"
                value={operations.operationStartDate}
                onChange={(e) => patchOps({ operationStartDate: e.target.value })}
                className={`${INPUT} font-mono font-medium text-gray-800`}
              />
            </Field>
            <Field label="Operasiýa soňky senesi (boş = açyk)">
              <input
                type="date"
                value={operations.operationEndDate}
                onChange={(e) => patchOps({ operationEndDate: e.target.value })}
                className={`${INPUT} font-mono font-medium text-gray-800`}
              />
            </Field>
          </div>
        </div>
      </SettingsCard>

      {/* ── Barkod okaýjy ──────────────────────────────────────────────────── */}
      <SettingsCard title="Barkod okaýjy" description="Tarapyzdaky okaýjynyň goşýan prefix/suffix belgilerini arassala">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Prefix (başdaky belgiler)">
            <input
              type="text"
              value={barcode.prefix}
              onChange={(e) => patchBarcode({ prefix: e.target.value })}
              placeholder="örn. F1 00"
              className={`${INPUT} font-mono font-medium text-gray-800`}
            />
          </Field>
          <Field label="Suffix (soňky belgiler)">
            <input
              type="text"
              value={barcode.suffix}
              onChange={(e) => patchBarcode({ suffix: e.target.value })}
              placeholder="örn. Enter"
              className={`${INPUT} font-mono font-medium text-gray-800`}
            />
          </Field>
        </div>
      </SettingsCard>

      <SaveBar dirty={dirty} onSave={onSave} onReset={onReset} />
    </div>
  );
};