// Bluetooth termal yazıcı servisi — BLE UART (Nordic NUS) üzerinden ESC/POS.
// XPrinter / çoğu 58-80mm mobil termal yazıcı NUS'u destekler.
// Genişleme: WiFi yazıcı için ayrı adapter yazılır, mobilePrintService seçer.

import { registerBluetoothPrinter } from './mobilePrintService';

// Nordic UART Service
const NUS_SERVICE = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const NUS_TX = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'; // phone -> printer (write)
// Bazı yazıcılar 128-byte MTU ister — 100 byte parça güvenli.
const CHUNK = 100;

export interface BlePrinterDevice {
  readonly deviceId: string;
  readonly name: string;
}

type BleClientLike = {
  initialize: () => Promise<void>;
  requestDevice: (opts: { services?: string[]; optionalServices?: string[] }) => Promise<BlePrinterDevice>;
  requestLEScan: (
    opts: { services?: string[]; allowDuplicates?: boolean },
    cb: (res: { device: { deviceId: string; name?: string } }) => void
  ) => Promise<void>;
  stopLEScan: () => Promise<void>;
  connect: (deviceId: string, onDisconnect?: (id: string) => void) => Promise<void>;
  disconnect: (deviceId: string) => Promise<void>;
  write: (deviceId: string, service: string, characteristic: string, value: DataView) => Promise<void>;
};

let ble: BleClientLike | undefined;
let connectedId: string | undefined;
let connectedName = '';

async function getBle(): Promise<BleClientLike> {
  if (ble) return ble;
  const mod = await import('@capacitor-community/bluetooth-le');
  const client = (mod as unknown as { BleClient: BleClientLike }).BleClient;
  await client.initialize();
  ble = client;
  return client;
}

export function getConnectedBlePrinter(): { id: string; name: string } | undefined {
  return connectedId ? { id: connectedId, name: connectedName } : undefined;
}

/** HTML fişi sade metne çevir — termal yazıcı HTML anlamaz. */
export function htmlToThermalText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function escPosBytes(text: string): Uint8Array {
  const enc = new TextEncoder();
  const body = enc.encode(text + '\n\n\n');
  // INIT + ALIGN CENTER varsayılan, kesme komutu sonda
  const init = [0x1b, 0x40];
  const cut = [0x1d, 0x56, 0x00];
  const out = new Uint8Array(init.length + body.length + cut.length);
  out.set(init, 0);
  out.set(body, init.length);
  out.set(cut, init.length + body.length);
  return out;
}

export async function scanAndConnectBlePrinter(): Promise<BlePrinterDevice> {
  const client = await getBle();
  if (connectedId) {
    try {
      await client.disconnect(connectedId);
    } catch {
      // yoksay
    }
    connectedId = undefined;
  }
  const device = await client.requestDevice({ services: [NUS_SERVICE], optionalServices: [NUS_SERVICE] });
  await client.connect(device.deviceId, () => {
    connectedId = undefined;
  });
  connectedId = device.deviceId;
  connectedName = device.name || 'Bluetooth Yazıcı';
  registerBluetoothPrinter({
    name: connectedName,
    printHtml: async (html: string) => printThermalHtml(html)
  });
  try {
    localStorage.setItem('biznes_bt_printer_name', connectedName);
  } catch {
    // yoksay
  }
  return { deviceId: device.deviceId, name: connectedName };
}

export async function printThermalHtml(html: string): Promise<boolean> {
  if (!connectedId) return false;
  const client = await getBle();
  const bytes = escPosBytes(htmlToThermalText(html));
  for (let i = 0; i < bytes.length; i += CHUNK) {
    const slice = bytes.slice(i, i + CHUNK);
    const view = new DataView(slice.buffer, slice.byteOffset, slice.byteLength);
    await client.write(connectedId, NUS_SERVICE, NUS_TX, view);
  }
  return true;
}

export async function disconnectBlePrinter(): Promise<void> {
  if (!connectedId || !ble) {
    connectedId = undefined;
    return;
  }
  try {
    await ble.disconnect(connectedId);
  } finally {
    connectedId = undefined;
  }
}

/** Yakındaki BLE cihazları listeler (termo yazıcı avı). Süre bitince durur. */
export async function scanBleDevices(
  onFound: (devices: BlePrinterDevice[]) => void,
  durationMs = 9000
): Promise<void> {
  const client = await getBle();
  const seen = new Map<string, string>();
  const emit = () => {
    onFound(
      Array.from(seen.entries()).map(([deviceId, name]) => ({
        deviceId,
        name: name || 'İsimsiz cihaz'
      }))
    );
  };
  await client.requestLEScan({ services: [], allowDuplicates: false }, (res) => {
    const id = res.device.deviceId;
    if (!seen.has(id)) {
      seen.set(id, res.device.name ?? '');
      emit();
    }
  });
  await new Promise((resolve) => window.setTimeout(resolve, durationMs));
  try {
    await client.stopLEScan();
  } catch {
    // yoksay
  }
  emit();
}

/** Listeden seçilen cihaza bağlanır. */
export async function connectBleDevice(deviceId: string, name: string): Promise<BlePrinterDevice> {
  const client = await getBle();
  if (connectedId && connectedId !== deviceId) {
    try {
      await client.disconnect(connectedId);
    } catch {
      // yoksay
    }
    connectedId = undefined;
  }
  await client.connect(deviceId, () => {
    connectedId = undefined;
  });
  connectedId = deviceId;
  connectedName = name || 'Bluetooth Yazıcı';
  registerBluetoothPrinter({
    name: connectedName,
    printHtml: async (html: string) => printThermalHtml(html)
  });
  try {
    localStorage.setItem('biznes_bt_printer_name', connectedName);
    localStorage.setItem('biznes_bt_printer_id', deviceId);
  } catch {
    // yoksay
  }
  return { deviceId, name: connectedName };
}

/** Bağlı yazıcıya deneme fişi basar. */
export async function printBtTestPage(companyName: string): Promise<boolean> {
  const now = new Date().toLocaleString('tr-TR');
  const html =
    `<div>${companyName || 'BIZNES HASAP'}</div>` +
    `<div>SYNAG ÇAP</div><div>${now}</div><div>Baglanyşyk üstünlikli!</div>`;
  return printThermalHtml(html);
}
