// Shared competitive rules, also exposed in the training frame-data inspector.
export const SUPER_STARTUP_FRAMES = 12;
export const SUPER_CAPTURE_HEIGHT = 100;
export const MICROPHONE_LIMIT = 2;
// These three slow ranged attacks need a dedicated, confirmed medium link.
// The standalone move, blocked hits, throws, utility and ULTs get no discount.
export const CONFIRMED_SPECIAL_LINKS = {orango:'s1',jao:'s2',eneas:'s2',ulisses:'s1',felipence:'s1',patrick:'s1',hdsh:'s2',gabrielzin:'s1'} as const;
export const LINK_STARTUP_CREDIT = 8;

// priorHits counts actual contacts in the same uninterrupted combo.
// Cinematic attacks sample once on entry: their visual hit count must not penalize
// a multi-hit Ultimate more than a single-impact Ultimate of the same total damage.
const COMBO_SCALE = [1, .9, .8, .7, .6, .5, .4, .3, .2] as const;
export function comboDamageScale(priorHits:number) {
 return COMBO_SCALE[Math.min(COMBO_SCALE.length-1,Math.max(0,Math.floor(priorHits)))];
}
