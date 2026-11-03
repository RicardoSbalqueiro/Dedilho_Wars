import { audio } from './audio';
import { settings } from './engine';
import type { Difficulty } from './engine';

export interface Prefs {
  music: number;
  sfx: number;
  voice: boolean;
  shake: boolean;
  hitboxes: boolean;
  difficulty: Difficulty;
}

const KEY = 'dedilho-wars-prefs-v1';
export const DEFAULT_PREFS: Prefs = { music: 0.6, sfx: 0.8, voice: true, shake: true, hitboxes: false, difficulty: 'normal' };

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_PREFS };
}

export function savePrefs(p: Prefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

export function applyPrefs(p: Prefs) {
  audio.setSettings({ music: p.music, sfx: p.sfx, voice: p.voice });
  settings.shake = p.shake ? 1 : 0;
  settings.hitboxes = p.hitboxes;
}
