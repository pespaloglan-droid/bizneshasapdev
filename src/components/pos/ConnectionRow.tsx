import React from 'react';
import { Eye, EyeOff, Loader2, Play, Square, Wifi, WifiOff } from 'lucide-react';
import type { LanguageCode } from '../../types';
import { translations } from '../../locales/i18n';
import { maskAddress, type ConnectionKind, type LinkState } from '../../db/connectionStore';

/**
 * Tek bir CouchDB bağlantı satırı — adres kutusu, göz simgesi,
 * "Sadece bağlantıyı sına", bağlan/durdur tuşu ve durum noktası.
 *
 * Hem ayarlar ekranındaki "Bulut eşitleme" panelinde hem de
 * "Yeni Hesap" / "Hesabı Düzenle" ekranlarında kullanılır (tek bileşen — kod tekrarı yok).
 */

export interface ConnectionRowProps {
  kind: ConnectionKind;
  title: string;
  placeholder: string;
  value: string;
  state: LinkState;
  message: string;
  busy: boolean;
  /** Adres alanı maskeli mi gösterilsin. */
  revealed: boolean;
  onChange: (value: string) => void;
  onToggleReveal: () => void;
  /** Yeşilken durdurur, değilse bağlanmayı başlatır. */
  onToggle: () => void;
  onTestOnly: () => void;
  /** Bu satır hesap henüz kaydedilmemiş taslak için mi? */
  hint?: string;
  language: LanguageCode;
}

function dotClass(state: LinkState): string {
  switch (state) {
    case 'connected':
      return 'bg-emerald-500';
    case 'connecting':
      return 'bg-amber-400 animate-pulse';
    case 'ok':
      return 'bg-sky-500';
    case 'error':
      return 'bg-rose-500';
    default:
      return 'bg-gray-300';
  }
}

export const ConnectionRow: React.FC<ConnectionRowProps> = ({
  kind,
  title,
  placeholder,
  value,
  state,
  message,
  busy,
  revealed,
  language,
  onChange,
  onToggleReveal,
  onToggle,
  onTestOnly,
  hint,
}) => {
  const t = translations[language]?.conn ?? translations.en.conn;
  const isConnected = state === 'connected';
  const disabled = !value.trim() || busy;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] font-bold text-gray-700">{title}</div>
        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotClass(state)}`} />
      </div>

      <div className="flex gap-2">
        <input
          type={revealed ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          data-testid={`conn-${kind}`}
          className="flex-1 min-w-0 h-11 px-3 border border-gray-200 rounded-xl text-xs font-mono text-gray-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
        />
        <button
          type="button"
          onClick={onToggleReveal}
          title={revealed ? t.hidePassword : t.showPassword}
          className="w-11 h-11 rounded-xl border border-gray-200 text-gray-500 flex items-center justify-center flex-shrink-0 hover:bg-gray-50"
        >
          {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          title={isConnected ? t.stop : t.connect}
          data-testid={`conn-btn-${kind}`}
          className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-40 ${
            isConnected ? 'bg-rose-500 hover:bg-rose-600 text-white' : 'bg-sky-500 hover:bg-sky-600 text-white'
          }`}
        >
          {busy ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isConnected ? (
            <Square className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </button>
      </div>

      {message && (
        <div
          data-testid={`conn-msg-${kind}`}
          className={`text-[11px] font-bold rounded-xl px-3 py-2 border flex items-start gap-2 ${
            state === 'connected' || state === 'ok'
              ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
              : state === 'error'
                ? 'bg-rose-50 border-rose-100 text-rose-700'
                : 'bg-amber-50 border-amber-100 text-amber-700'
          }`}
        >
          {state === 'connected' || state === 'ok' ? (
            <Wifi className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          )}
          <span className="min-w-0 break-words">{message}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onTestOnly}
          disabled={disabled}
          data-testid={`conn-test-${kind}`}
          className="text-[11px] font-bold text-sky-600 hover:text-sky-700 disabled:opacity-40 whitespace-nowrap flex-shrink-0"
        >
          {t.testOnly}
        </button>
        {value.trim() && (
          <span className="text-[10px] font-mono text-gray-400 truncate min-w-0 text-right" title={maskAddress(value)}>
            {maskAddress(value)}
          </span>
        )}
      </div>

      {hint && <p className="text-[10px] text-gray-400 leading-relaxed">{hint}</p>}
      <span className="sr-only">{kind}</span>
    </div>
  );
};

export default ConnectionRow;