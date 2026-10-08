import type { InvoiceType, LanguageCode } from '../types';

/**
 * Faktura modulundyky haýsy görnüşleri döredip bolýar — seçim sanawy.
 * InvoiceControlBar-daky 7 görnüş bilen deň: proforma/quotation ýagzy
 * aýratyn interfeýsde döredilýär, şonuň üçin bu sanawa girilmeýär.
 */
export interface InvoiceTypeOptionMeta {
  id: InvoiceType;
  labelTm: string;
  labelTr: string;
}

export const INVOICE_TYPE_OPTIONS: readonly InvoiceTypeOptionMeta[] = [
  { id: 'sales', labelTm: 'Satuw (Çykyş)', labelTr: 'Satış' },
  { id: 'purchase', labelTm: 'Satyn Alyş (Giriş)', labelTr: 'Alış' },
  { id: 'sales_return', labelTm: 'Yzyna gaýtarmak (Müşderiden)', labelTr: 'İade (Müşteriden)' },
  { id: 'purchase_return', labelTm: 'Yzyna gaýtarmak (Üpjün edijä)', labelTr: 'Bizden İade (Tedarikçiye)' },
  { id: 'other_in', labelTm: 'Başga Giriş', labelTr: 'Farklı Giriş' },
  { id: 'other_out', labelTm: 'Başga Çykyş', labelTr: 'Farklı Çıkış' },
  { id: 'warehouse_move', labelTm: 'Ammarlaryň Hereketleri', labelTr: 'Ambarlar Arası Hareket' },
];

export function invoiceTypeLabel(
  id: InvoiceType | '',
  language: LanguageCode
): string {
  const found = INVOICE_TYPE_OPTIONS.find((option) => option.id === id);
  if (!found) return '';
  return language === 'tm' ? found.labelTm : found.labelTr;
}