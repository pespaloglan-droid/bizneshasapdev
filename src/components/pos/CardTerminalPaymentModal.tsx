import React, { useState, useEffect, useCallback } from 'react';
import { CreditCard, Wifi, CheckCircle2, XCircle, Loader2, ArrowRight, X, AlertTriangle, RefreshCw, SmartphoneNfc } from 'lucide-react';
import { LanguageCode } from '../../types';
import { translations, translate } from '../../locales/i18n';
import { checkPosDeviceConnection, PosConnectionResult } from '../../services/posDeviceService';
import { playCardBeep, playPaymentSuccessChime } from '../../utils/audio';

interface CardTerminalPaymentModalProps {
  amountDue: number;
  language: LanguageCode;
  onApprove: (authCode: string) => void;
  onCancel: () => void;
}

export const CardTerminalPaymentModal: React.FC<CardTerminalPaymentModalProps> = ({
  amountDue,
  language,
  onApprove,
  onCancel
}) => {
  const t = translations[language] || translations.en;

  // Aşama Durumları: 'analyzing' | 'not_connected' | 'waiting' | 'processing' | 'approved' | 'declined'
  const [stage, setStage] = useState<'analyzing' | 'not_connected' | 'waiting' | 'processing' | 'approved' | 'declined'>('analyzing');
  const [deviceInfo, setDeviceInfo] = useState<PosConnectionResult | null>(null);
  const [authCode, setAuthCode] = useState<string>('');

  // 1. Cihaz Bağlantısını Analiz Etme
  const runDeviceCheck = useCallback(async () => {
    setStage('analyzing');
    // Gerçekçi tarama gecikmesi (0.5 saniye)
    setTimeout(async () => {
      const result = await checkPosDeviceConnection();
      setDeviceInfo(result);
      if (result.connected) {
        setStage('waiting');
      } else {
        setStage('not_connected');
      }
    }, 600);
  }, []);

  useEffect(() => {
    runDeviceCheck();
  }, [runDeviceCheck]);

  // Test / Simülasyon Modunda Bağlantıyı Manuel Aktif Etme
  const handleEnableTestDevice = () => {
    localStorage.setItem(
      'biznes_pos_terminal_config',
      JSON.stringify({ alwaysConnected: true, port: 'USB-COM3 (Ingenico POS)', deviceName: 'Banka Kart Terminaly' })
    );
    setDeviceInfo({
      connected: true,
      port: 'USB-COM3 (Ingenico POS)',
      deviceName: 'Banka Kart Terminaly'
    });
    setStage('waiting');
  };

  // Kartla Ödemeyi Onaylama (Cihazdan onay sinyali geldiğinde veya kasiyer onayladığında)
  const handleApprovePayment = () => {
    setStage('processing');
    playCardBeep();

    setTimeout(() => {
      const generatedCode = `AUTH-${Math.floor(100000 + Math.random() * 900000)}`;
      setAuthCode(generatedCode);
      setStage('approved');
      playPaymentSuccessChime();

      // 1 saniye sonra faturayı tamamlayıp çeke geç
      setTimeout(() => {
        onApprove(generatedCode);
      }, 1000);
    }, 800);
  };

  // Ödeme Reddedildiğinde
  const handleDeclinePayment = () => {
    setStage('declined');
    setTimeout(() => {
      onCancel();
    }, 1500);
  };

  // Klavye Kısayolları (Esc = İptal, Enter = Onayla eğer bağlıysa)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key === 'Enter' && stage === 'waiting') {
        e.preventDefault();
        handleApprovePayment();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stage, onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Modal Başlığı */}
        <div className="bg-[#0B1F3A] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-white/10 text-emerald-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">{t.posTerminalTitle}</h3>
              <p className="text-[10px] text-gray-300 font-mono flex items-center space-x-1 mt-0.5">
                {stage === 'analyzing' && <span className="text-amber-300">{t.posAnalyzing}</span>}
                {stage === 'not_connected' && <span className="text-rose-400 font-bold">● {t.posDeviceNotConnectedTitle}</span>}
                {stage !== 'analyzing' && stage !== 'not_connected' && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>{deviceInfo?.port || t.posTerminalConnected}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Gövdesi */}
        <div className="p-6 flex flex-col items-center text-center">
          {/* Tutar Kartı */}
          <div className="w-full bg-emerald-50 border border-emerald-200 rounded-xl py-3 px-4 mb-4">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
              {t.amountDueLabel}
            </span>
            <div className="text-3xl font-black text-emerald-600 font-mono mt-0.5">
              {amountDue.toFixed(2)} <span className="text-lg">TMT</span>
            </div>
          </div>

          {/* 1. Aşama: Cihaz Bağlantısı Analiz Ediliyor */}
          {stage === 'analyzing' && (
            <div className="flex flex-col items-center my-4 py-2">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-3" />
              <h4 className="text-sm font-bold text-gray-800">{t.posAnalyzing}</h4>
              <p className="text-xs text-gray-500 mt-1">{translate(language, 'pos.cardScanningPorts')}</p>
            </div>
          )}

          {/* 2. Aşama: CİHAZ BAĞLI DEĞİL UYARISI */}
          {stage === 'not_connected' && (
            <div className="flex flex-col items-center my-2 p-4 bg-rose-50 border border-rose-200 rounded-xl w-full text-center">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-2.5">
                <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h4 className="text-sm font-bold text-rose-800 mb-1">
                {t.posDeviceNotConnectedTitle}
              </h4>
              <p className="text-xs text-rose-700 leading-relaxed max-w-xs mb-3">
                {t.posConnectDeviceMsg}
              </p>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={runDeviceCheck}
                  className="px-3.5 py-1.5 bg-white border border-rose-300 hover:bg-rose-100 rounded-lg text-xs font-bold text-rose-800 flex items-center space-x-1.5 shadow-2xs transition-all active:scale-95"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{t.posRetryScan}</span>
                </button>
                <button
                  type="button"
                  onClick={handleEnableTestDevice}
                  className="px-2.5 py-1.5 bg-rose-200/70 hover:bg-rose-200 rounded-lg text-[11px] font-semibold text-rose-900 transition-all"
                  title={translate(language, 'pos.cardTestModeTip')}
                >
                  {translate(language, 'pos.cardTestMode')}
                </button>
              </div>
            </div>
          )}

          {/* 3. Aşama: Cihaz Bağlı - Ödeme Bekleniyor */}
          {stage === 'waiting' && (
            <div className="flex flex-col items-center my-2">
              <div className="relative mb-3">
                <div className="w-20 h-20 rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center text-blue-600 shadow-inner">
                  <SmartphoneNfc className="w-10 h-10 animate-pulse text-blue-600" />
                </div>
                <div className="absolute -top-1 -right-1 p-1.5 rounded-full bg-blue-600 text-white shadow-sm">
                  <Wifi className="w-3.5 h-3.5" />
                </div>
              </div>
              <h4 className="text-sm font-bold text-gray-800 mb-1">{t.posWaitingCard}</h4>
              <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                {translate(language, 'pos.cardWaitingBefore')} <strong>{translate(language, 'pos.cardApprove')}</strong> {translate(language, 'pos.cardWaitingAfter')}
              </p>
            </div>
          )}

          {/* 4. Aşama: İşleniyor */}
          {stage === 'processing' && (
            <div className="flex flex-col items-center my-3">
              <div className="w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center text-amber-600 mb-3">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <h4 className="text-sm font-bold text-gray-800 mb-1">{t.posProcessing}</h4>
              <p className="text-xs text-gray-500 font-mono">{translate(language, 'pos.cardBankApproval')}</p>
            </div>
          )}

          {/* 5. Aşama: Kabul Edildi */}
          {stage === 'approved' && (
            <div className="flex flex-col items-center my-3 animate-in zoom-in-90 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center text-emerald-600 mb-3 shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-base font-black text-emerald-600 mb-1">{t.posApproved}</h4>
              <div className="text-xs font-mono font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-md border border-gray-200 my-1">
                {t.posAuthCode}: {authCode}
              </div>
              <p className="text-xs text-gray-500 mt-1 font-medium">{t.posAutoPrinting}</p>
            </div>
          )}

          {/* 6. Aşama: Reddedildi */}
          {stage === 'declined' && (
            <div className="flex flex-col items-center my-3">
              <div className="w-16 h-16 rounded-full bg-red-100 border-2 border-red-300 flex items-center justify-center text-red-600 mb-3">
                <XCircle className="w-10 h-10" />
              </div>
              <h4 className="text-sm font-bold text-red-600 mb-1">{t.posDeclined}</h4>
              <p className="text-xs text-gray-500">{translate(language, 'pos.cardPaymentFailed')}</p>
            </div>
          )}
        </div>

        {/* Alt Aksiyon Butonları */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-100 text-xs font-bold text-gray-700 transition-colors"
          >
            {t.cancel} (Esc)
          </button>

          {stage === 'waiting' && (
            <button
              type="button"
              onClick={handleApprovePayment}
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-sm cursor-pointer"
            >
              <span>{translate(language, 'pos.cardApproveBtn')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {stage === 'not_connected' && (
            <button
              type="button"
              onClick={runDeviceCheck}
              className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{t.posRetryScan}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
