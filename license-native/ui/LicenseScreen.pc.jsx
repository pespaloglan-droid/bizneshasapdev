// ui/LicenseScreen.pc.jsx - Electron/React lisans ekranı
import React, { useState, useEffect } from 'react';
const native = require('../native');
const gate = require('../gate');

/**
 * PC Lisans Ekranı
 * 
 * @param {string} accountId - Hesap ID (kalıcı depodan gelir - YENİDEN ÜRETİLMEZ)
 * @param {string} blockedRoute - Engellenen rota adı
 * @param {string} reason - Engelleme nedeni
 * @param {Function} onClose - Başarılı aktivasyon sonrası kapatma callback
 */
export default function LicenseScreen({ accountId, blockedRoute, reason, onClose }) {
  const [reqCode, setReqCode] = useState('');
  const [rootCode, setRootCode] = useState('');
  const [key, setKey] = useState('');
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Data dizini main process'ten inject edilir (window.posDataDir)
    if (window.posDataDir) {
      native.setDataDir(window.posDataDir);
    }
    
    // İstek kodunu hesapla (accountId + deviceAnchor)
    const code = native.getRequestCode(accountId);
    if (code) {
      setReqCode(code);
    } else {
      setMsg({ err: 'İstek kodu oluşturulamadı - native modül hatası' });
    }
    
    // Gate'e aktif hesabı bildir
    gate.selectAccount(accountId);
  }, [accountId]);

  const handleActivate = () => {
    setMsg(null);
    setLoading(true);

    try {
      // İlk kurulumda kök kodu gerekli
      if (rootCode.trim()) {
        const rootResult = native.setRootCode(accountId, rootCode.trim());
        if (rootResult !== native.OK) {
          setMsg({ err: 'Kök kodu hatalı: ' + errorText(rootResult) });
          setLoading(false);
          return;
        }
      }

      // Lisans anahtarını aktifleştir
      if (!key.trim()) {
        setMsg({ err: 'Lisans anahtarı girin' });
        setLoading(false);
        return;
      }

      const status = native.activate(accountId, key.trim());
      
      if (status === native.OK) {
        setMsg({ ok: 'Lisans başarıyla aktifleştirildi!' });
        setTimeout(() => {
          if (onClose) onClose();
        }, 800);
      } else {
        setMsg({ err: errorText(status) });
      }
    } catch (err) {
      setMsg({ err: 'Beklenmeyen hata: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // Kısa bildirim gösterilebilir
    });
  };

  return (
    <div className="license-screen-container">
      <div className="license-screen">
        <h2>🔒 Lisans Anahtarı Gerekli</h2>
        
        {blockedRoute && (
          <div className="warning-box">
            <strong>Bu işlem lisans gerektirir:</strong> {blockedRoute}
            {reason && <div className="reason">{reason}</div>}
          </div>
        )}

        <p className="info-text">
          Satış, alış, stok ve tüm işlemler lisansa bağlıdır. 
          Aşağıdaki bilgileri bize göndererek lisans anahtarı alabilirsiniz.
        </p>

        {/* Hesap ID */}
        <div className="info-card">
          <label className="info-label">Hesap ID</label>
          <div className="code-display">
            <code className="mono-code">{accountId}</code>
            <button 
              className="btn-copy" 
              onClick={() => copyToClipboard(accountId)}
              title="Kopyala"
            >
              📋
            </button>
          </div>
          <small className="hint">Bu ID hesabınıza özeldir (değiştirilemez)</small>
        </div>

        {/* İstek Kodu */}
        <div className="info-card">
          <label className="info-label">İstek Kodu (bize gönderin)</label>
          <div className="code-display">
            <code className="mono-code highlight">{reqCode || 'Yükleniyor...'}</code>
            <button 
              className="btn-copy" 
              onClick={() => copyToClipboard(reqCode)}
              disabled={!reqCode}
              title="Kopyala"
            >
              📋
            </button>
          </div>
          <small className="hint">Bu kod hesap + cihaz kimliğinizi içerir</small>
        </div>

        {/* Kök Kod (ilk kurulum) */}
        <div className="input-group">
          <label htmlFor="root-code">Kök Kodu (sadece ilk kurulum için)</label>
          <input
            id="root-code"
            type="text"
            className="input-field"
            value={rootCode}
            onChange={(e) => setRootCode(e.target.value.toUpperCase())}
            placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
            autoCapitalize="characters"
            spellCheck={false}
          />
          <small className="hint">İlk kullanımda bize gönderilen kök kodu girin</small>
        </div>

        {/* Lisans Anahtarı */}
        <div className="input-group">
          <label htmlFor="license-key">Lisans Anahtarı</label>
          <textarea
            id="license-key"
            className="input-field textarea-key"
            value={key}
            onChange={(e) => setKey(e.target.value.toUpperCase())}
            placeholder="Lisans anahtarınızı buraya yapıştırın"
            rows={3}
            autoCapitalize="characters"
            spellCheck={false}
          />
        </div>

        {/* Aktivasyon butonu */}
        <button 
          className="btn-activate"
          onClick={handleActivate}
          disabled={loading || !key.trim()}
        >
          {loading ? 'Aktifleştiriliyor...' : 'Aktifleştir'}
        </button>

        {/* Mesajlar */}
        {msg?.ok && <div className="message success">{msg.ok}</div>}
        {msg?.err && <div className="message error">{msg.err}</div>}
      </div>

      <style jsx>{`
        .license-screen-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
        }

        .license-screen {
          background: white;
          border-radius: 12px;
          padding: 32px;
          max-width: 600px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        }

        h2 {
          margin: 0 0 16px 0;
          color: #333;
          font-size: 24px;
        }

        .warning-box {
          background: #fff3cd;
          border: 2px solid #ffc107;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 16px;
          color: #856404;
        }

        .warning-box .reason {
          margin-top: 4px;
          font-size: 13px;
        }

        .info-text {
          color: #666;
          line-height: 1.5;
          margin-bottom: 24px;
        }

        .info-card {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
        }

        .info-label {
          display: block;
          font-weight: 600;
          margin-bottom: 8px;
          color: #333;
          font-size: 14px;
        }

        .code-display {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .mono-code {
          flex: 1;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          background: white;
          padding: 10px;
          border-radius: 6px;
          border: 1px solid #dee2e6;
          word-break: break-all;
        }

        .mono-code.highlight {
          background: #e7f3ff;
          border-color: #0d6efd;
        }

        .btn-copy {
          padding: 8px 12px;
          border: 1px solid #dee2e6;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 18px;
          transition: all 0.2s;
        }

        .btn-copy:hover:not(:disabled) {
          background: #e9ecef;
        }

        .btn-copy:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .hint {
          display: block;
          margin-top: 6px;
          color: #6c757d;
          font-size: 12px;
        }

        .input-group {
          margin-bottom: 16px;
        }

        .input-group label {
          display: block;
          font-weight: 600;
          margin-bottom: 6px;
          color: #333;
          font-size: 14px;
        }

        .input-field {
          width: 100%;
          padding: 10px;
          border: 2px solid #dee2e6;
          border-radius: 6px;
          font-size: 14px;
          font-family: 'Courier New', monospace;
          transition: border-color 0.2s;
        }

        .input-field:focus {
          outline: none;
          border-color: #0d6efd;
        }

        .textarea-key {
          resize: vertical;
          min-height: 70px;
        }

        .btn-activate {
          width: 100%;
          padding: 14px;
          background: #0d6efd;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-activate:hover:not(:disabled) {
          background: #0b5ed7;
        }

        .btn-activate:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        .message {
          margin-top: 16px;
          padding: 12px;
          border-radius: 6px;
          text-align: center;
          font-weight: 500;
        }

        .message.success {
          background: #d1e7dd;
          color: #0f5132;
          border: 1px solid #badbcc;
        }

        .message.error {
          background: #f8d7da;
          color: #842029;
          border: 1px solid #f5c2c7;
        }
      `}</style>
    </div>
  );
}

// Hata kodları -> açıklama
const ERROR_MESSAGES = {
  [0]:   'Geçersiz anahtar',
  [-1]:  'Lisans süresi dolmuş',
  [-2]:  'Bu anahtar başka bir cihaza ait',
  [-3]:  'Cihaz saati geri alınmış görünüyor',
  [-4]:  'Bu anahtar daha önce kullanılmış',
  [-5]:  'Lisans aktif değil',
  [-6]:  'Geçersiz giriş',
  [-7]:  'Anahtarın aktivasyon süresi geçmiş',
  [-8]:  'Anahtar bu hesaba ait değil',
  [-9]:  'Depolama hatası',
  [-10]: 'Önce kök kodu gerekli',
  [-11]: 'Durum dosyası hasarlı',
};

function errorText(status) {
  return ERROR_MESSAGES[status] || `Hata kodu: ${status}`;
}
