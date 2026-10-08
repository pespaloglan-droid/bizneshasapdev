import React from 'react';

interface PageScrollProps {
  children: React.ReactNode;
  /**
   * Mobil: alt menü + sağ alttaki "+" (FAB) butonları kadar dip boşluk.
   * PC'de gereksiz (md ve üstünde 6 birim).
   */
  bottomPad?: boolean;
}

/**
 * Hasaplama (HasaplamaWorkspace) referanslı ortak scroll konteyneri.
 * Tüm sayfa dikey kayar: başlık kartları, filtreler, sekmeler ve liste hepsi
 * aynı scroll alanında — hiçbir içerik kırpılmaz, alt menü/FAB altında kalmaz.
 *
 * Kullanım: workspace kökü bu bileşen olur; sabit konumlu modallar
 * transform yaratmadığı için içinde sorunsuz çalışır (Hasaplama'da olduğu gibi).
 */
export const PageScroll: React.FC<PageScrollProps> = ({ children, bottomPad = true }) => (
  <div className={`flex-1 overflow-y-auto bg-[#F1F5F9] min-h-0 ${bottomPad ? 'pb-40 md:pb-6' : ''}`}>
    {children}
  </div>
);