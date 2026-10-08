// Banka POS Terminali Donanım Bağlantı ve İletişim Servisi

export interface PosConnectionResult {
  connected: boolean;
  port?: string;
  deviceName?: string;
  errorMessage?: string;
}

export interface PosTransactionResult {
  success: boolean;
  authCode?: string;
  cardLastFour?: string;
  errorMessage?: string;
}

// Fiziksel USB / COM / Ağ Kart Cihazını Analiz Etme
export const checkPosDeviceConnection = async (): Promise<PosConnectionResult> => {
  try {
    // 1. Web Serial API Desteği Kontrolü (Elektron / Chromium)
    if ('serial' in navigator) {
      try {
        const ports = await (navigator as any).serial.getPorts();
        if (ports && ports.length > 0) {
          return {
            connected: true,
            port: 'COM3 / USB-Serial',
            deviceName: 'Bank EFT-POS Terminal (Ingenico/Verifone/Pax)'
          };
        }
      } catch (e) {
        console.warn('Serial check fallback', e);
      }
    }

    // 2. USB WebHID Kontrolü
    if ('hid' in navigator) {
      try {
        const devices = await (navigator as any).hid.getDevices();
        if (devices && devices.length > 0) {
          return {
            connected: true,
            port: 'USB-HID',
            deviceName: 'USB POS Terminal'
          };
        }
      } catch (e) {
        console.warn('HID check fallback', e);
      }
    }

    // 3. LocalStorage'da Kayıtlı POS Yapılandırması Kontrolü
    const savedConfig = localStorage.getItem('biznes_pos_terminal_config');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      if (parsed.alwaysConnected) {
        return {
          connected: true,
          port: parsed.port || 'LAN: 192.168.1.150',
          deviceName: parsed.deviceName || 'Network POS Terminal'
        };
      }
    }

    // Cihaz Fiziksel Olarak Bulunamadı
    return {
      connected: false,
      errorMessage: 'Fiziki kart terminaly kompýutere birikdirilmedik.'
    };
  } catch (err: any) {
    return {
      connected: false,
      errorMessage: err.message || 'Baglanyşyk ýalňyşlygy'
    };
  }
};
