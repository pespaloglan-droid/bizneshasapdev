// Platform soyutlaması: Electron (PC) / Capacitor (Android) / Web (tarayıcı)
// Tek karar noktası — tüm UI ve servisler burayı kullanır.

export type AppPlatform = 'electron' | 'native' | 'web';

interface CapacitorLike {
  readonly isNativePlatform?: () => boolean;
  readonly getPlatform?: () => string;
}

function windowAny(): Record<string, unknown> {
  return window as unknown as Record<string, unknown>;
}

function capacitorLike(): CapacitorLike | undefined {
  const cap = windowAny()['Capacitor'] as CapacitorLike | undefined;
  return cap && typeof cap === 'object' ? cap : undefined;
}

export function isElectron(): boolean {
  return Boolean(windowAny()['electronAPI']);
}

export function isNative(): boolean {
  const cap = capacitorLike();
  try {
    if (cap?.isNativePlatform) return cap.isNativePlatform() === true;
    if (cap?.getPlatform) {
      const p = cap.getPlatform();
      return p === 'android' || p === 'ios';
    }
  } catch {
    // yoksay — web varsay
  }
  return false;
}

export function getPlatform(): AppPlatform {
  if (isElectron()) return 'electron';
  if (isNative()) return 'native';
  return 'web';
}

/** Pencere butonları (min/maks/kapat) sadece Electron'da anlamlı. */
export function shouldShowWindowControls(): boolean {
  return isElectron();
}

/** Kompakt 780x425 login sadece PC'de; mobilde tam ekran akış. */
export function shouldUseCompactLogin(): boolean {
  return isElectron();
}
