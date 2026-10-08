// Mobil çap katmanı — genişlemeye açık iskelet.
// Bugün: Electron varsa sessiz çap, yoksa window.print().
// Yarın: Bluetooth termal yazıcı için registerBluetoothPrinter() ile adapter takılır.

import { printHtmlOrFallback, type PrintHtmlOptions } from '../utils/electron';

export interface BluetoothPrinterAdapter {
  readonly name: string;
  printHtml: (html: string) => Promise<boolean>;
}

let btAdapter: BluetoothPrinterAdapter | undefined;

export function registerBluetoothPrinter(adapter: BluetoothPrinterAdapter): void {
  btAdapter = adapter;
}

export function getBluetoothPrinter(): BluetoothPrinterAdapter | undefined {
  return btAdapter;
}

export interface SmartPrintOptions extends PrintHtmlOptions {
  /** Bluetooth bağlıysa önce onu dene. */
  readonly preferBluetooth?: boolean;
}

export async function printInvoiceSmart(options: SmartPrintOptions): Promise<boolean> {
  if (options.preferBluetooth !== false && btAdapter) {
    try {
      const ok = await btAdapter.printHtml(options.html);
      if (ok) return true;
    } catch {
      // alta düş — Electron / fallback
    }
  }
  return printHtmlOrFallback(options);
}
