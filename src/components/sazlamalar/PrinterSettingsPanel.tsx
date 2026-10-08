import React, { useCallback, useEffect, useState } from 'react';
import { Bluetooth, Printer, RefreshCw, Search, TestTube2, Usb, Wifi, XCircle } from 'lucide-react';
import type { PrinterSettings, SystemPrinter } from '../../types';
import { electronBridge, isElectron } from '../../utils/electron';
import { isNative } from '../../utils/platform';
import {
  connectBleDevice,
  disconnectBlePrinter,
  getConnectedBlePrinter,
  printBtTestPage,
  scanAndConnectBlePrinter,
  scanBleDevices,
  type BlePrinterDevice
} from '../../services/bluetoothPrinterService';
import { Field, INPUT, Notice, SaveBar, SettingsCard, StatusDot } from './settingsUi';

interface PrinterSettingsPanelProps {
  value: PrinterSettings;
  companyName: string;
  dirty: boolean;
  onChange: (next: PrinterSettings) => void;
  onSave: () => void;
  onReset: () => void;
}

const KINDS: { id: PrinterSettings['kind']; label: string }[] = [
  { id: 'standard', label: 'Adaty printer' },
  { id: 'receipt', label: 'Çek printeri' },
];

export const PrinterSettingsPanel: React.FC<PrinterSettingsPanelProps> = ({
  value,
  companyName,
  dirty,
  onChange,
  onSave,
  onReset,
}) => {
  const [printers, setPrinters] = useState<SystemPrinter[]>([]);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [btBusy, setBtBusy] = useState(false);
  const [btScanning, setBtScanning] = useState(false);
  const [btDevices, setBtDevices] = useState<BlePrinterDevice[]>([]);
  const [btName, setBtName] = useState<string | undefined>(() => getConnectedBlePrinter()?.name);
  const [btTesting, setBtTesting] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'success' | 'error' | 'info'; text: string } | null>(
    null
  );

  const handleBtConnect = async () => {
    setBtBusy(true);
    try {
      const dev = await scanAndConnectBlePrinter();
      setBtName(dev.name);
      setNotice({ tone: 'success', text: `Bluetooth yazıcı bağlandı: ${dev.name}` });
    } catch (err) {
      setNotice({ tone: 'error', text: `Bluetooth bağlanamadı: ${err instanceof Error ? err.message : String(err)}` });
    } finally {
      setBtBusy(false);
    }
  };

  const handleBtScan = async () => {
    setBtScanning(true);
    setBtDevices([]);
    try {
      await scanBleDevices((devices) => setBtDevices(devices));
      setNotice({ tone: 'info', text: 'Tarama bitti — listeden yazıcını seç.' });
    } catch (err) {
      setNotice({ tone: 'error', text: `Tarama başarısız: ${err instanceof Error ? err.message : String(err)}` });
    } finally {
      setBtScanning(false);
    }
  };

  const handleBtPick = async (device: BlePrinterDevice) => {
    setBtBusy(true);
    try {
      const dev = await connectBleDevice(device.deviceId, device.name);
      setBtName(dev.name);
      setNotice({ tone: 'success', text: `Bağlandı: ${dev.name} — deneme baskısı yap.` });
    } catch (err) {
      setNotice({ tone: 'error', text: `Bağlanamadı: ${err instanceof Error ? err.message : String(err)}` });
    } finally {
      setBtBusy(false);
    }
  };

  const handleBtTest = async () => {
    setBtTesting(true);
    try {
      const ok = await printBtTestPage(companyName);
      setNotice(ok
        ? { tone: 'success', text: 'Deneme fişi gönderildi — yazıcıya bak.' }
        : { tone: 'error', text: 'Yazıcı bağlı değil. Önce bağlan.' });
    } finally {
      setBtTesting(false);
    }
  };

  const handleBtDisconnect = async () => {
    await disconnectBlePrinter();
    setBtName(undefined);
  };

  const patch = (partial: Partial<PrinterSettings>) => onChange({ ...value, ...partial });

  const refreshPrinters = useCallback(async () => {
    const bridge = electronBridge();
    if (!bridge.listPrinters) {
      setNotice({ tone: 'info', text: 'Printerleri diňe masaüstü (Electron) programmada görmek bolýar.' });
      return;
    }
    setLoading(true);
    try {
      const list = await bridge.listPrinters();
      setPrinters(list);
      if (list.length === 0) {
        setNotice({ tone: 'error', text: 'Hiç printer tapylmady. Windows-da printer goşuň.' });
      } else {
        setNotice(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshPrinters();
  }, [refreshPrinters]);

  const handleTestPrint = async () => {
    const bridge = electronBridge();
    if (!bridge.printTestPage) {
      setNotice({ tone: 'info', text: 'Synag çap diňe masaüstü programmada elýeterli.' });
      return;
    }
    setTesting(true);
    setNotice(null);
    try {
      const result = await bridge.printTestPage({
        deviceName: value.defaultPrinter || undefined,
        paperWidth: value.paperWidth,
        connection: value.connection,
        companyName,
      });
      setNotice(
        result.success
          ? { tone: 'success', text: 'Synag çap iberildi — printeri barlaň.' }
          : { tone: 'error', text: `Çap başartmady: ${result.failureReason || 'näbelli säwlik'}` }
      );
    } finally {
      setTesting(false);
    }
  };

  const connected = printers.length > 0 && Boolean(value.defaultPrinter);

  return (
    <div className="space-y-3">
      <SettingsCard
        title="Printer agdaýy"
        description="Sistemada tapylan printerler we baglanyşyk ýagdaýy"
        aside={<StatusDot connected={connected} connectedText="Birikdi" disconnectedText="Birikmedi" />}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void refreshPrinters()}
            disabled={loading}
            className="h-9 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 font-bold text-xs flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Printerleri täzele
          </button>
          <span className="text-[11px] font-semibold text-gray-500">
            {printers.length} printer tapyldy
          </span>
          {!isElectron() && (
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2 py-0.5">
              Brauzer režimi
            </span>
          )}
        </div>

        {printers.length > 0 && (
          <div className="border border-gray-200 rounded-xl divide-y divide-gray-50 overflow-hidden">
            {printers.map((printer) => (
              <div
                key={printer.name}
                className="flex items-center gap-2 px-3 py-2 text-xs bg-white"
              >
                <Printer className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="font-semibold text-gray-700 truncate flex-1">
                  {printer.displayName ?? printer.name}
                </span>
                {printer.isDefault && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 rounded px-1.5 py-0.5">
                    Esasy
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </SettingsCard>

      <SettingsCard title="Printer sazlamalary" description="Esasy printer we çap görnüşi">
        {isNative() && (
          <div className="mb-3 rounded-2xl border border-sky-200 bg-sky-50/60 p-3 space-y-2.5">
            <div className="flex items-center gap-2">
              <Bluetooth className="w-4 h-4 text-sky-700 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-sky-900">
                  {btName ? `Bluetooth: ${btName}` : 'Bluetooth termal yazıcı'}
                </div>
                <div className="text-[11px] text-sky-800/80">58/80mm mobil yazıcı (XPrinter uyumlu)</div>
              </div>
              <StatusDot connected={Boolean(btName)} connectedText="Bağlı" disconnectedText="Yok" />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void handleBtScan()}
                disabled={btScanning || btBusy}
                className="flex-1 h-11 rounded-xl bg-white border border-sky-200 text-sky-800 text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 active:bg-sky-100"
              >
                <Search className="w-4 h-4" />
                {btScanning ? 'Taranıyor...' : 'Cihazları tara'}
              </button>
              {btName ? (
                <button
                  type="button"
                  onClick={() => void handleBtDisconnect()}
                  className="h-11 px-4 rounded-xl bg-white border border-sky-200 text-sky-800 text-xs font-bold active:bg-sky-100"
                >
                  Kes
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleBtConnect()}
                  disabled={btBusy || btScanning}
                  className="h-11 px-4 rounded-xl bg-sky-700 text-white text-xs font-bold disabled:opacity-50 active:bg-sky-800"
                >
                  {btBusy ? '...' : 'Seç-bağlan'}
                </button>
              )}
            </div>

            {btScanning && btDevices.length === 0 && (
              <div className="text-[11px] font-semibold text-sky-800/80 text-center py-1">
                Yakındaki Bluetooth cihazlar aranıyor... yazıcıyı açıp eşleşme moduna al.
              </div>
            )}

            {btDevices.length > 0 && !btName && (
              <div className="border border-sky-200 rounded-xl divide-y divide-sky-100 overflow-hidden bg-white max-h-44 overflow-y-auto">
                {btDevices.map((d) => (
                  <button
                    key={d.deviceId}
                    type="button"
                    disabled={btBusy}
                    onClick={() => void handleBtPick(d)}
                    className="w-full flex items-center gap-2 px-3 py-3 text-left active:bg-sky-50 disabled:opacity-50"
                  >
                    <Bluetooth className="w-4 h-4 text-sky-600 flex-shrink-0" />
                    <span className="flex-1 min-w-0">
                      <span className="block text-xs font-bold text-gray-800 truncate">{d.name}</span>
                      <span className="block text-[10px] text-gray-400 font-mono truncate">{d.deviceId}</span>
                    </span>
                    <span className="text-[11px] font-bold text-sky-700 flex-shrink-0">Bağlan ›</span>
                  </button>
                ))}
              </div>
            )}

            {btName && (
              <button
                type="button"
                onClick={() => void handleBtTest()}
                disabled={btTesting}
                className="w-full h-11 rounded-xl bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 active:bg-emerald-600"
              >
                <TestTube2 className="w-4 h-4" />
                {btTesting ? 'Basılıyor...' : 'Deneme fişi bas'}
              </button>
            )}

            <div className="space-y-1.5 text-[11px] text-sky-900/80 font-medium">
              <div className="flex items-start gap-1.5">
                <Usb className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>USB yazıcı: OTG kablosuyla tak, Android sistem penceresinden izin ver — fiş yine bu uygulamadan basılır.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <Wifi className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>Ağ (WiFi) yazıcı: aynı ağda ol, IP'yi Bağlantı → Tor bölümüne yaz.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <XCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>Eski tip (klasik) Bluetooth yazıcılar listede görünmez — BLE destekli termal yazıcı gerekir.</span>
              </div>
            </div>
          </div>
        )}
        <Field label="Esasy printer">
          <select
            value={value.defaultPrinter}
            onChange={(e) => patch({ defaultPrinter: e.target.value })}
            className={`${INPUT} cursor-pointer font-medium text-gray-800`}
          >
            <option value="">— Saýla —</option>
            {printers.map((printer) => (
              <option key={printer.name} value={printer.name}>
                {printer.displayName ?? printer.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Printer görnüşi">
          <div className="flex items-center gap-2">
            {KINDS.map((kind) => (
              <button
                key={kind.id}
                type="button"
                onClick={() => patch({ kind: kind.id })}
                className={`h-9 px-4 rounded-xl text-xs font-bold transition-all ${
                  value.kind === kind.id
                    ? 'bg-[#10b981] text-white'
                    : 'bg-white text-gray-600 border border-gray-200'
                }`}
              >
                {kind.label}
              </button>
            ))}
          </div>
        </Field>

        {value.kind === 'receipt' && (
          <Field label="Kagyz ini" hint="Termal çek printerleri üçin">
            <div className="flex items-center gap-2">
              {(['58mm', '80mm'] as const).map((width) => (
                <button
                  key={width}
                  type="button"
                  onClick={() => patch({ paperWidth: width })}
                  className={`h-9 px-5 rounded-xl text-xs font-bold font-mono transition-all ${
                    value.paperWidth === width
                      ? 'bg-[#0B1F3A] text-white'
                      : 'bg-white text-gray-600 border border-gray-200'
                  }`}
                >
                  {width}
                </button>
              ))}
            </div>
          </Field>
        )}

        <Field label="Baglanyşyk görnüşi">
          <div className="flex items-center gap-2">
            {(
              [
                { id: 'usb', label: 'USB' },
                { id: 'network', label: 'Tor (IP)' },
              ] as const
            ).map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => patch({ connection: option.id })}
                className={`h-9 px-4 rounded-xl text-xs font-bold transition-all ${
                  value.connection === option.id
                    ? 'bg-[#0B1F3A] text-white'
                    : 'bg-white text-gray-600 border border-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </Field>

        {value.connection === 'network' && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="IP adres">
              <input
                type="text"
                value={value.ipAddress}
                onChange={(e) => patch({ ipAddress: e.target.value })}
                placeholder="192.168.1.50"
                className={`${INPUT} font-mono font-medium text-gray-800`}
              />
            </Field>
            <Field label="Port">
              <input
                type="text"
                value={value.port}
                onChange={(e) => patch({ port: e.target.value })}
                placeholder="9100"
                className={`${INPUT} font-mono font-medium text-gray-800`}
              />
            </Field>
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => void handleTestPrint()}
            disabled={testing}
            className="h-9 px-4 rounded-xl bg-[#0B1F3A] hover:bg-[#163864] disabled:opacity-50 text-white font-bold text-xs"
          >
            {testing ? 'Çap edilýär...' : 'Synag çap et'}
          </button>
        </div>

        {notice && <Notice tone={notice.tone} text={notice.text} />}
      </SettingsCard>

      <SaveBar dirty={dirty} onSave={onSave} onReset={onReset} />
    </div>
  );
};