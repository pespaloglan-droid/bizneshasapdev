// Mobil "hızlı ekle" köprüsü: ürün/müşteri ekranlarındaki formlar
// bu olayı dinler, PosWorkspace'teki yüzen + butonu tetikler.

export const MOBILE_ADD_EVENT = 'bh:mobile-add';

export function requestMobileAdd(): void {
  window.dispatchEvent(new CustomEvent(MOBILE_ADD_EVENT));
}

export function onMobileAdd(handler: () => void): () => void {
  const listener = () => handler();
  window.addEventListener(MOBILE_ADD_EVENT, listener);
  return () => window.removeEventListener(MOBILE_ADD_EVENT, listener);
}
