/**
 * Ürün görseli sıkıştırma — PC (offline-pos) ile aynı algoritma.
 * 400x400 px, JPEG, ~150KB altına kadar kalite düşürülür.
 * Telefondan çekilen fotoğraflar ham base64 olarak 3-5MB tutabiliyor;
 * PouchDB'yi şişirmemek için yüklemeden önce küçültülür.
 */

const MAX_DIMENSION = 400;
/** data URL karakter sayısı ≈ dosya boyutunun 4/3'ü → ~150KB. */
const MAX_DATA_URL_LENGTH = 200_000;
const MIN_QUALITY = 0.3;
const INITIAL_QUALITY = 0.85;

export async function compressImage(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('image-read-failed'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('image-decode-failed'));
      img.onload = () => {
        let w = img.naturalWidth || img.width;
        let h = img.naturalHeight || img.height;

        if (w <= 0 || h <= 0) {
          reject(new Error('image-empty'));
          return;
        }

        if (w > h) {
          if (w > MAX_DIMENSION) {
            h = Math.round((h * MAX_DIMENSION) / w);
            w = MAX_DIMENSION;
          }
        } else if (h > MAX_DIMENSION) {
          w = Math.round((w * MAX_DIMENSION) / h);
          h = MAX_DIMENSION;
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('canvas-unavailable'));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', INITIAL_QUALITY));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });

  if (dataUrl.length <= MAX_DATA_URL_LENGTH) return dataUrl;

  // Data URL'i yeniden çizerek kaliteyi kademeli düşür (Canvas'a geri yüklemeden).
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('image-reencode-failed'));
    el.src = dataUrl;
  });

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0);

  let quality = INITIAL_QUALITY;
  let result = canvas.toDataURL('image/jpeg', quality);
  while (result.length > MAX_DATA_URL_LENGTH && quality > MIN_QUALITY) {
    quality -= 0.1;
    result = canvas.toDataURL('image/jpeg', quality);
  }
  return result;
}