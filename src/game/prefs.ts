import { audio } from './audio';
import { settings } from './engine';
import type { Difficulty } from './engine';

export interface Prefs {
  music: number;
  sfx: number;
  voice: boolean;
  shake: boolean;
  hitboxes: boolean;
  reducedFlash: boolean;
  combatHints: boolean;
  effects?:'auto'|'full'|'light';
  difficulty: Difficulty;
}

const KEY = 'dedilho-wars-prefs-v1';
export const DEFAULT_PREFS: Prefs = { music: 0.6, sfx: 0.8, voice: true, shake: true, hitboxes: false, reducedFlash: false, combatHints: true,effects:'auto', difficulty: 'normal' };

export function loadPrefs(): Prefs {
  const reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  const defaults={...DEFAULT_PREFS,reducedFlash:reduced,shake:!reduced};
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...defaults, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return defaults;
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
  settings.reducedFlash=p.reducedFlash;
  settings.combatHints=p.combatHints;
  settings.effects=p.effects==='full'||p.effects==='light'?p.effects:'auto';
}
