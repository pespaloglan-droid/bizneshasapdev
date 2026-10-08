import React, { useState } from 'react';
import type { ScaleSettings } from '../../types';
import { SCALE_MODELS, SCALE_PORTS } from '../../db/settingsService';
import { electronBridge } from '../../utils/electron';
import { isNative } from '../../utils/platform';
import { Field, INPUT, Notice, SaveBar, SettingsCard, StatusDot, Toggle } from './settingsUi';

interface ScaleSettingsPanelProps {
  value: ScaleSettings;
  dirty: boolean;
  onChange: (next: ScaleSettings) => void;
  onSave: () => void;
  onReset: () => void;
}

export const ScaleSettingsPanel: React.FC<ScaleSettingsPanelProps> = ({
  value,
  dirty,
  onChange,
  onSave,
  onReset,
}) => {
  const [connected, setConnected] = useState(false);
  const [testing, setTesting] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'success' | 'error' | 'info'; text: string } | null>(
    null
  );

  const patch = (partial: Partial<ScaleSettings>) => onChange({ ...value, ...partial });

  const handleTest = async () => {
    const bridge = electronBridge();
    if (!bridge.getScaleStatus) {
      setConnected(false);
      setNotice({ tone: 'info', text: 'Terezi barlagy diňe masaüstü programmada elýeterli.' });
      return;
    }
    setTesting(true);
    setNotice(null);
    try {
      const result = await bridge.getScaleStatus();
      setConnected(result.connected);
      setNotice({ tone: result.connected ? 'success' : 'error', text: result.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-3">
      {isNative() && (
        <Notice
          tone="info"
          text="Telefonda seri port (COM) yok. Bluetooth teraziler bir sonraki sürümde eklenecek — şimdilik kiloyu el ile gir."
        />
      )}
      <SettingsCard
        title="Terezi ýagdaýy"
        description="Enjam bilen aragatnaşygy barlaň"
        aside={<StatusDot connected={connected} connectedText="Birikdi" disconnectedText="Birikmedi" />}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void handleTest()}
            disabled={testing}
            className="h-9 px-4 rounded-xl bg-[#0B1F3A] hover:bg-[#163864] disabled:opacity-50 text-white font-bold text-xs"
          >
            {testing ? 'Barlanýar...' : 'Synag'}
          </button>
          <span className="text-[11px] font-semibold text-gray-500">
            Anluk agram okamak barlagy
          </span>
        </div>
        {notice && <Notice tone={notice.tone} text={notice.text} />}
      </SettingsCard>

      <SettingsCard title="Terezi sazlamalary" description="Port, model we ölçeg birligi">
        {!isNative() && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Baglanyşyk porty">
            <select
              value={value.port}
              onChange={(e) => patch({ port: e.target.value })}
              className={`${INPUT} cursor-pointer font-medium text-gray-800`}
            >
              {SCALE_PORTS.map((port) => (
                <option key={port} value={port}>
                  {port}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Terezi modeli / markasy">
            <select
              value={value.model}
              onChange={(e) => patch({ model: e.target.value })}
              className={`${INPUT} cursor-pointer font-medium text-gray-800`}
            >
              {SCALE_MODELS.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </Field>
        </div>
        )}

        {value.model === 'Şuni özi giriz' && (
          <Notice
            tone="info"
            text="Ýörite protokol üçin marka adyny giriziň (meselem: KELLER, RADWAG)."
          />
        )}

        <Field label="Ölçeg birligi">
          <div className="flex items-center gap-2">
            {(
              [
                { id: 'kg', label: 'kilogram (kg)' },
                { id: 'g', label: 'gram (g)' },
              ] as const
            ).map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => patch({ unit: option.id })}
                className={`h-9 px-4 rounded-xl text-xs font-bold transition-all ${
                  value.unit === option.id
                    ? 'bg-[#10b981] text-white'
                    : 'bg-white text-gray-600 border border-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </Field>

        <Toggle
          checked={value.autoRead}
          onChange={(next) => patch({ autoRead: next })}
          label="Awtomatik agram alma"
          description="Haryt / Faktura ekranlarynda ölçenen agram awtomatik çekilsin"
        />
      </SettingsCard>

      <SaveBar dirty={dirty} onSave={onSave} onReset={onReset} />
    </div>
  );
};