/**
 * Ähli Excel çyktylaryň STIL KONFIGURASIÝASY — bir ýerden.
 *
 * Renkler, logo we ad programmanyň temasyndan gelip çykýar; kodda rastgele
 * reňk ýazylmaýar. Şu faýl üýtgedilse, ähli aktarma tablalary bir ýere göre
 * üýtgär — şoňa görä hiç bir ekranda ayrı reňk gömülmeýär.
 */

/** Logotip build-time gömülýär (Vite `?inline` → base64 data-URL). */
import logoDataUrl from '../assets/bh_logo.png?inline';

// ── Tema (programmanyň reňk palitrasy) ──────────────────────────────────────
export const THEME = {
  /** Esasy lacivert — başlık zolagy, toplam setiri. */
  navy: '0B1F3A',
  /** Ýumşak lacivert — ikinji derejeli başlýanlar. */
  navySoft: '163864',
  /** Esasy ýaşyl — aksent, kurallar, vurgu. */
  green: '10b981',
  greenSoft: 'D1FAE5',
  /** Tekiz zolagy we öýjük çarçuwasy. */
  border: 'E2E8F0',
  zebra: 'F8FAFC',
  /** Durum reňkleri. */
  danger: 'DC2626',
  dangerSoft: 'FEE2E2',
  warning: 'D97706',
  warningSoft: 'FEF3C7',
  white: 'FFFFFF',
  textDark: '1E293B',
  textMuted: '64748B',
} as const;

/** Uygulama adı — Excel başlığında ve _meta sayfasında. */
export const APP_NAME = 'Biznes Hasap';

/** Gerçek Excel hüýr formatlary (METIN DEGIL — san/numara). */
export const NUMBER_FORMAT = {
  /** Para: 1 234.56 */
  money: '#,##0.00',
  /** Mikdar: 1 234 (tam san) */
  qty: '#,##0',
  /** Ýüzde: %12.5 */
  percent: '0.00"%"',
  /** Tarih: 2026-10-06 */
  date: 'yyyy-mm-dd',
} as const;

/** Hüýr içerik görnüşi — stil ve numara formatını belirler. */
export type CellKind = 'text' | 'money' | 'qty' | 'percent' | 'date';

/** Satır vurgusu — tableda renkle işaretlenir. */
export type RowTone = 'danger' | 'warning' | null;

/** Excel eýik (sayfasy) görnüşi. */
export type SheetKind =
  | 'urun'
  | 'musteri'
  | 'tedarikci'
  | 'faktura'
  | 'stok'
  | 'satis'
  | 'borc'
  | 'genel'
  | 'template';

export interface ExcelColumn<Row> {
  /** Başlyk teksti (şablonlarda bu düzde import başlygyna öwrülýär). */
  readonly header: string;
  /** Sütundyň bahasyny alýan funksiýa. */
  readonly get: (row: Row) => string | number | Date | null;
  /** Sütun giňligi (Excel birligi — ýok bolsa awtomatik hasaplanýar). */
  readonly width?: number;
  /** Görnüşi — numara formatyny kesgitleýär. */
  readonly kind?: CellKind;
  /** Aşaky jem setirinde toplam alnyp biler mi? */
  readonly total?: 'sum' | 'none';
  /** Bu satyry nämä görä vurgulamaly (düşük stok, borçly müşteri). */
  readonly tone?: (row: Row) => RowTone;
}

/** Şablonyň / çyktynyň metadata — _meta gizli sayfasyna ýazylýar. */
export interface ExcelMeta {
  readonly kind: SheetKind;
  readonly accountName: string;
  /** Şablon görnüşi: 'urun' | 'musteri' ... (template = boş şablon) */
  readonly template: string;
  readonly templateVersion: number;
  /** Diňe şeýle görnüşde ýazylan soň görkezilýär. */
  readonly options: Readonly<Record<string, boolean | string | number>>;
}

/** Ýerine ýetiriji hökmünde ulanylýar (stil motoru). */
export const excelTheme = {
  appName: APP_NAME,
  colors: THEME,
  numberFormat: NUMBER_FORMAT,
  logoDataUrl,
} as const;
