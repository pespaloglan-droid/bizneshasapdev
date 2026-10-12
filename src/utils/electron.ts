import type { SystemPrinter } from '../types';
import { isNative } from './platform';

export interface PrintTestResult {
  readonly success: boolean;
  readonly failureReason: string;
}

export interface ScaleStatusResult {
  readonly connected: boolean;
  readonly message: string;
}

export interface PrintTestOptions {
  readonly deviceName?: string;
  readonly paperWidth?: string;
  readonly connection?: string;
  readonly companyName?: string;
}

interface ElectronBridge {
  readonly listPrinters?: () => Promise<SystemPrinter[]>;
  readonly printTestPage?: (options: PrintTestOptions) => Promise<PrintTestResult>;
  readonly getScaleStatus?: () => Promise<ScaleStatusResult>;
  readonly printHtml?: (options: PrintHtmlOptions) => Promise<PrintTestResult>;
  /** F11 — Excel eksporty: "Sakla" diýalogy + faýl ýazmak. */
  readonly saveFileAs?: (options: SaveFileAsOptions) => Promise<SaveFileAsResult>;
}

export interface SaveFileAsOptions {
  readonly title?: string;
  readonly defaultName?: string;
  readonly filters?: { name: string; extensions: string[] }[];
  /** Base64 bilen berlen faýl mazmuny. */
  readonly data: string;
}

export interface SaveFileAsResult {
  readonly saved: boolean;
  readonly canceled?: boolean;
  readonly path?: string;
  readonly error?: string;
}

export interface PrintHtmlOptions {
  readonly html: string;
  readonly deviceName?: string;
  readonly paperWidth?: string;
  /** 'A4' bolsa adaty sahypa; boş bolsa termal rulon (58/80mm). */
  readonly pageSize?: string;
  readonly landscape?: boolean;
}

export function electronBridge(): ElectronBridge {
  return (window as unknown as { electronAPI?: ElectronBridge }).electronAPI ?? {};
}

/** Base64 → baýtlar (tarayıcıda `Buffer` ýok). */
function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * F11 — faýl sakla diýalogy açyp base64 mazmuny ýazýar.
 * Capacitor (Android) bolsa Documents bukjasyna native ýazýar;
 * Electron ýok we web bolsa download hökmünde işleýär.
 */
export function uniqueNativeExportName(name: string): string {
  // Android otomatik kayıtta eski dışa aktarmayı ezmez; PC diyaloğu değişmez.
  const base = name.replace(/[\\/]/g, '_');
  const dot = base.lastIndexOf('.');
  const stem = dot > 0 ? base.slice(0, dot) : base;
  const extension = dot > 0 ? base.slice(dot) : '';
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${stem}-${stamp}-${crypto.randomUUID().slice(0, 8)}${extension}`;
}

export async function saveFileAs(options: SaveFileAsOptions): Promise<boolean> {
  const bridge = electronBridge();
  if (bridge.saveFileAs) {
    const result = await bridge.saveFileAs(options);
    return Boolean(result?.saved);
  }
  // Android (Capacitor): WebView'de blob download güvenilmez — native Filesystem.
  if (isNative()) {
    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      await Filesystem.writeFile({
        path: uniqueNativeExportName(options.defaultName || 'faýl.xlsx'),
        data: options.data,
        directory: Directory.Documents,
        recursive: true,
      });
      return true;
    } catch {
      return false;
    }
  }
  // Web gurşawy: blob hökmünde ýükle (diýalog bolmasa-da faýl ineşýär).
  try {
    const bytes = base64ToBytes(options.data);
    const blob = new Blob([bytes as BlobPart], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = options.defaultName || 'faýl.xlsx';
    link.click();
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}

export function isElectron(): boolean {
  return Boolean((window as unknown as { electronAPI?: unknown }).electronAPI);
}

/** Electron yoksa boş liste — mobil/web'de crash yerine graceful. */
export async function listPrintersOrEmpty(): Promise<readonly SystemPrinter[]> {
  const bridge = electronBridge();
  if (!bridge.listPrinters) return [];
  try {
    return (await bridge.listPrinters()) ?? [];
  } catch {
    return [];
  }
}

/** Electron varsa sessiz çap, yoksa tarayıcı diyaloğu. boolean döner. */
export async function printHtmlOrFallback(options: PrintHtmlOptions): Promise<boolean> {
  const bridge = electronBridge();
  if (!bridge.printHtml) {
    window.print();
    return true;
  }
  try {
    const res = await bridge.printHtml(options);
    return res.success;
  } catch {
    window.print();
    return true;
  }
}