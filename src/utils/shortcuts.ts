/** Klawiatura gysgaltmalarynyň sanawy — ýardam paneli üçin. */

export interface ShortcutDef {
  readonly key: string;
  readonly categoryTm: string;
  readonly categoryTr: string;
  readonly labelTm: string;
  readonly labelTr: string;
}

export const SHORTCUTS: readonly ShortcutDef[] = [
  { key: 'F1', categoryTm: 'Gözleg', categoryTr: 'Arama', labelTm: 'Haryt gözlegi', labelTr: 'Ürün arama' },
  { key: 'F2', categoryTm: 'Gözleg', categoryTr: 'Arama', labelTm: 'Müşderi gözlegi', labelTr: 'Müşteri arama' },
  { key: 'F3', categoryTm: 'Gözleg', categoryTr: 'Arama', labelTm: 'Kassa hereketi gözlegi', labelTr: 'Kasa hareketi arama' },

  { key: 'F4', categoryTm: 'Faktura', categoryTr: 'Fatura İşlemleri', labelTm: 'Fakturalaryň sanawy', labelTr: 'Faturaları görüntüle' },
  { key: 'F5', categoryTm: 'Faktura', categoryTr: 'Fatura İşlemleri', labelTm: 'Göni satuw', labelTr: 'Otomatik satış' },
  { key: 'F6', categoryTm: 'Baha', categoryTr: 'Fiyat', labelTm: 'Elle girilen bahalary müşteriýe sakla', labelTr: 'Elle girilen fiyatları müşteriye kaydet' },
  { key: 'F7', categoryTm: 'Baha', categoryTr: 'Fiyat', labelTm: 'Müşderiniň ozel bahalaryny ulan', labelTr: 'Müşterinin özel fiyatlarını uygula' },
  { key: 'F8', categoryTm: 'Baha', categoryTr: 'Fiyat', labelTm: 'Baha görnüşini çalyş (perakende / lomoy)', labelTr: 'Fiyat görünümü değiştir (perakende / toptan)' },

  { key: 'F9', categoryTm: 'Geri alma', categoryTr: 'Geri Alma', labelTm: 'Silinen fakturalar', labelTr: 'Silinen faturalar' },
  { key: 'F10', categoryTm: 'Geri alma', categoryTr: 'Geri Alma', labelTm: 'Soňky fakturany onayly geri al', labelTr: 'Son faturayı onaylı geri al' },

  { key: 'F11', categoryTm: 'Çap / Eksport', categoryTr: 'Yazdırma / Aktarma', labelTm: 'Fakturalary Excel-e eksport', labelTr: "Faturaları Excel'e aktar" },
  { key: 'F12', categoryTm: 'Çap / Eksport', categoryTr: 'Yazdırma / Aktarma', labelTm: 'Fakturany önizle we çap et', labelTr: 'Faturayı önizle ve yazdır' },
];

export const SHORTCUT_CATEGORY_ORDER: readonly string[] = [
  'Gözleg',
  'Faktura',
  'Baha',
  'Geri alma',
  'Çap / Eksport',
];
