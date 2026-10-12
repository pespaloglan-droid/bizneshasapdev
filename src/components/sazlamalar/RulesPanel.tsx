import React from 'react';
import type { BarcodeReaderSettings, FirmSettings, OperationSettings } from '../../types';
import { Field, INPUT, SaveBar, SettingsCard, Toggle } from './settingsUi';
import { useT } from '../../locales/LanguageContext';

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
  const t = useT();
  const patchFirm = (partial: Partial<FirmSettings>) =>
    onChange({ firm: { ...firm, ...partial }, operations, barcode });
  const patchOps = (partial: Partial<OperationSettings>) =>
    onChange({ firm, operations: { ...operations, ...partial }, barcode });
  const patchBarcode = (partial: Partial<BarcodeReaderSettings>) =>
    onChange({ firm, operations, barcode: { ...barcode, ...partial } });

  return (
    <div className="space-y-3">
      {/* ── Firma maglumatlary ─────────────────────────────────────────────── */}
      <SettingsCard title={t('sazlamalar.firmTitle')} description={t('sazlamalar.firmDesc')}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label={t('sazlamalar.firmName')}>
            <input
              type="text"
              value={firm.name}
              onChange={(e) => patchFirm({ name: e.target.value })}
              className={`${INPUT} font-medium text-gray-800`}
            />
          </Field>
          <Field label={t('sazlamalar.firmCode')}>
            <input
              type="text"
              value={firm.code}
              onChange={(e) => patchFirm({ code: e.target.value })}
              className={`${INPUT} font-mono font-medium text-gray-800`}
            />
          </Field>
          <Field label={t('sazlamalar.firmTitleField')}>
            <input
              type="text"
              value={firm.title}
              onChange={(e) => patchFirm({ title: e.target.value })}
              className={`${INPUT} font-medium text-gray-800`}
            />
          </Field>
          <Field label={t('sazlamalar.firmPhone')}>
            <input
              type="text"
              value={firm.phone}
              onChange={(e) => patchFirm({ phone: e.target.value })}
              className={`${INPUT} font-medium text-gray-800`}
            />
          </Field>
          <Field label={t('sazlamalar.firmFax')}>
            <input
              type="text"
              value={firm.fax}
              onChange={(e) => patchFirm({ fax: e.target.value })}
              className={`${INPUT} font-medium text-gray-800`}
            />
          </Field>
          <Field label={t('sazlamalar.firmAddress')}>
            <input
              type="text"
              value={firm.address}
              onChange={(e) => patchFirm({ address: e.target.value })}
              className={`${INPUT} font-medium text-gray-800`}
            />
          </Field>
          <Field label={t('sazlamalar.firmTax')}>
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
      <SettingsCard title={t('sazlamalar.opsTitle')} description={t('sazlamalar.opsDesc')}>
        <div className="space-y-2.5">
          <Toggle
            label={t('sazlamalar.opsInactiveCustomer')}
            checked={operations.allowInactiveCustomer}
            onChange={(checked) => patchOps({ allowInactiveCustomer: checked })}
          />
          <Toggle
            label={t('sazlamalar.opsInactiveProduct')}
            checked={operations.allowInactiveProduct}
            onChange={(checked) => patchOps({ allowInactiveProduct: checked })}
          />
          <Toggle
            label={t('sazlamalar.opsBelowCost')}
            checked={operations.allowBelowCostSale}
            onChange={(checked) => patchOps({ allowBelowCostSale: checked })}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <Field label={t('sazlamalar.creditMin')}>
              <input
                type="number"
                min="1"
                value={operations.creditMinDays || ''}
                onChange={(e) => patchOps({ creditMinDays: parseInt(e.target.value) || 3 })}
                className={`${INPUT} font-mono font-bold text-gray-800`}
              />
            </Field>
            <Field label={t('sazlamalar.creditMax')}>
              <input
                type="number"
                min="1"
                value={operations.creditMaxDays || ''}
                onChange={(e) => patchOps({ creditMaxDays: parseInt(e.target.value) || 360 })}
                className={`${INPUT} font-mono font-bold text-gray-800`}
              />
            </Field>
            <Field label={t('sazlamalar.creditDefault')}>
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
            <Field label={t('sazlamalar.opStart')}>
              <input
                type="date"
                value={operations.operationStartDate}
                onChange={(e) => patchOps({ operationStartDate: e.target.value })}
                className={`${INPUT} font-mono font-medium text-gray-800`}
              />
            </Field>
            <Field label={t('sazlamalar.opEnd')}>
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
      <SettingsCard title={t('sazlamalar.barcodeTitle')} description={t('sazlamalar.barcodeDesc')}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label={t('sazlamalar.barcodePrefix')}>
            <input
              type="text"
              value={barcode.prefix}
              onChange={(e) => patchBarcode({ prefix: e.target.value })}
              placeholder="örn. F1 00"
              className={`${INPUT} font-mono font-medium text-gray-800`}
            />
          </Field>
          <Field label={t('sazlamalar.barcodeSuffix')}>
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