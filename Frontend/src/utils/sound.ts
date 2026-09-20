/**
 * Audio synthesis utility for subtle notification and UI sounds
 * Uses the Web Audio API without requiring any external audio files.
 */

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!sharedAudioCtx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        sharedAudioCtx = new AudioCtx();
      }
    }
    if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume();
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

/**
 * Check if sound effects are enabled in user preferences
 */
export function areSoundsEnabled(): boolean {
  try {
    const raw = localStorage.getItem('user_profile_preferences');
    if (!raw) return true; // default true
    const prefs = JSON.parse(raw);
    return prefs.soundEffects ?? true;
  } catch {
    return true;
  }
}

/**
 * Check if desktop notifications are enabled in user preferences
 */
export function areDesktopNotificationsEnabled(): boolean {
  try {
    const raw = localStorage.getItem('user_profile_preferences');
    if (!raw) return false; // default false
    const prefs = JSON.parse(raw);
    return prefs.desktopNotifications ?? false;
  } catch {
    return false;
  }
}

/**
 * Plays a pleasant 2-tone chime for incoming notifications
 */
export function playNotificationSound(): void {
  if (!areSoundsEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Tone 1: 587.33 Hz (D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.18);

    // Tone 2: 880.00 Hz (A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.0, now + 0.09);
    gain2.gain.setValueAtTime(0.15, now + 0.09);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.09);
    osc2.stop(now + 0.32);
  } catch {
    // Ignore audio context errors (e.g. user hasn't interacted yet)
  }
}

/**
 * Plays a subtle pop/drop sound when a card is moved or dropped
 */
export function playCardDropSound(): void {
  if (!areSoundsEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  } catch {
    // Ignore audio context errors
  }
}
