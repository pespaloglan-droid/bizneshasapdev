const SOUND_KEY_PREFIX = 'bh_notify_sound_';

/** Bildirim sesi tercihi ulanyjy boýunça ýatda saklanýar. */
export function readSoundEnabled(userKey: string): boolean {
  try {
    const raw = localStorage.getItem(`${SOUND_KEY_PREFIX}${userKey}`);
    return raw === null ? true : raw === '1';
  } catch {
    // no-excuse-ok: catch — localStorage elýeterli däl, ses açyk kabul edilýär
    return true;
  }
}

export function writeSoundEnabled(userKey: string, enabled: boolean): void {
  try {
    localStorage.setItem(`${SOUND_KEY_PREFIX}${userKey}`, enabled ? '1' : '0');
  } catch {
    // no-excuse-ok: catch — ýazyp bolmasa, sazlama saklanmaýar (ähmiýetsiz)
  }
}

interface AudioCapableWindow {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
}

/**
 * Gysga "ping" bildirimi. Daşarky ses faýly gerek däl —
 * Web Audio API bilen sintez edilýär (~0.4 sekunt).
 */
export function playNotificationPing(): void {
  try {
    const scope = window as unknown as AudioCapableWindow;
    const Ctor = scope.AudioContext ?? scope.webkitAudioContext;
    if (!Ctor) return;

    const ctx = new Ctor();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(1318.5, now + 0.11);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
    osc.onended = () => {
      void ctx.close();
    };
  } catch {
    // no-excuse-ok: catch — ses çalyp bolmady (audio elýeterli däl), UI dowam edýär
  }
}