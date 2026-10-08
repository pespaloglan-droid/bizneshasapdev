import React from 'react';
import { AlertCircle, Check } from 'lucide-react';

export const INPUT =
  'w-full h-9 px-3 border border-gray-200 rounded-xl text-sm bg-[#F8FAFC] focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none';
export const LABEL = 'block text-[11px] font-bold text-gray-500 mb-1';
export const CARD = 'bg-white rounded-2xl border border-gray-100 shadow-sm p-5';

interface SettingsCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}

export const SettingsCard: React.FC<SettingsCardProps> = ({
  title,
  description,
  children,
  aside,
}) => (
  <div className={CARD}>
    <div className="flex items-start justify-between gap-3 mb-4">
      <div>
        <div className="text-sm font-bold text-gray-900">{title}</div>
        {description && (
          <div className="text-[11px] text-gray-500 font-medium mt-0.5">{description}</div>
        )}
      </div>
      {aside}
    </div>
    <div className="space-y-3">{children}</div>
  </div>
);

interface FieldProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

export const Field: React.FC<FieldProps> = ({ label, hint, children }) => (
  <div>
    <label className={LABEL}>{label}</label>
    {children}
    {hint && <div className="text-[10px] text-gray-400 font-medium mt-1">{hint}</div>}
  </div>
);

interface ToggleProps {
  checked: boolean;
  label: string;
  description?: string;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  label,
  description,
  onChange,
  disabled,
}) => (
  <button
    type="button"
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`w-full flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
      checked ? 'bg-emerald-50 border-emerald-200' : 'bg-[#F8FAFC] border-gray-200'
    }`}
  >
    <span className="min-w-0">
      <span className="block text-xs font-bold text-gray-800">{label}</span>
      {description && (
        <span className="block text-[10px] text-gray-500 font-medium mt-0.5">{description}</span>
      )}
    </span>
    <span
      className={`relative w-9 h-5 rounded-full flex-shrink-0 transition-colors ${
        checked ? 'bg-emerald-500' : 'bg-gray-300'
      }`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
          checked ? 'left-[18px]' : 'left-0.5'
        }`}
      />
    </span>
  </button>
);

interface StatusDotProps {
  connected: boolean;
  connectedText: string;
  disconnectedText: string;
}

export const StatusDot: React.FC<StatusDotProps> = ({
  connected,
  connectedText,
  disconnectedText,
}) => (
  <span
    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold ${
      connected ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
    }`}
  >
    <span
      className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-rose-500'}`}
    />
    {connected ? connectedText : disconnectedText}
  </span>
);

interface NoticeProps {
  tone: 'success' | 'error' | 'info';
  text: string;
}

export const Notice: React.FC<NoticeProps> = ({ tone, text }) => {
  const cls =
    tone === 'success'
      ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
      : tone === 'error'
      ? 'bg-rose-50 border-rose-100 text-rose-700'
      : 'bg-sky-50 border-sky-100 text-sky-700';
  return (
    <div className={`flex items-center gap-2 text-xs font-semibold border rounded-xl px-3 py-2 ${cls}`}>
      {tone === 'success' ? (
        <Check className="w-3.5 h-3.5 flex-shrink-0" />
      ) : (
        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
      )}
      <span>{text}</span>
    </div>
  );
};

interface SaveBarProps {
  dirty: boolean;
  onSave: () => void;
  onReset: () => void;
  extra?: React.ReactNode;
}

export const SaveBar: React.FC<SaveBarProps> = ({ dirty, onSave, onReset, extra }) => (
  <div className="flex items-center justify-between gap-3 pt-1">
    <div className="flex items-center gap-2">
      {dirty ? (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1">
          <AlertCircle className="w-3 h-3" />
          Ýatda saklanmadyk üýtgeşmeler bar
        </span>
      ) : (
        <span className="text-[11px] font-semibold text-gray-400">Üýtgeşme ýok</span>
      )}
      {extra}
    </div>
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onReset}
        disabled={!dirty}
        className="h-9 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 font-bold text-xs"
      >
        Ýatyr
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={!dirty}
        className="h-9 px-5 rounded-xl bg-[#10b981] hover:bg-[#059669] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs"
      >
        Ýatda sakla
      </button>
    </div>
  </div>
);