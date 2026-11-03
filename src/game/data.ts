// Dados dos personagens: atributos, golpes (frame data) e poses do esqueleto.

export type CharId = 'caetano' | 'orango';

export interface Pose {
  lean: number;
  head: number;
  fa1: number;
  fa2: number;
  ba1: number;
  ba2: number;
  fl1: number;
  fl2: number;
  bl1: number;
  bl2: number;
  rot: number;
  finger: number;
  mouth: number;
}

export interface Move {
  id: string;
  kind: 'normal' | 'special' | 'super';
  rank: number;
  air?: boolean;
  startup: number;
  active: number;
  recovery: number;
  whiff: number;
  dmg: number;
  hitstun: number;
  blockstun: number;
  kb: number;
  kbBlock: number;
  hb: [number, number, number, number]; // x0,x1,yBottom,yTop (relativo ao lutador, olhando p/ a direita)
  level: 'mid' | 'low' | 'high';
  launch: number;
  launchVx: number;
  hitstop: number;
  shake: number;
  power: number;
  poses: [string, string];
  advance?: [number, number, number];
  grab?: 'puxao' | 'mordida' | 'super';
  dedilho?: boolean;
  pierce?: number;
  unblockable?: boolean;
  trail?: 'fw' | 'bw' | 'fa' | 'ba';
  label?: string;
  turn?: [number, number];
  charge?: boolean;
  sound?: 'purple' | 'red';
}

export interface CharDef {
  id: CharId;
  name: string;
  short: string;
  title: string;
  color: string;
  color2: string;
  glow: string;
  hp: number;
  walk: number;
  walkBack: number;
  jumpVy: number;
  jumpVx: number;
  dashVx: number;
  dashDur: number;
  pushW: number;
  hurtH: number;
  crouchH: number;
  moves: Record<string, Move>;
  poses: Record<string, Pose>;
  attrs: { label: string; v: number }[];
  specials: { key: string; name: string; desc: string }[];
  superName: string;
  quote: string;
  bio: string;
}

const mvBase: Move = {
  id: '',
  kind: 'normal',
  rank: 1,
  startup: 5,
  active: 3,
  recovery: 10,
  whiff: 0,
  dmg: 20,
  hitstun: 14,
  blockstun: 9,
  kb: 3,
  kbBlock: 2,
  hb: [20, 90, 100, 140],
  level: 'mid',
  launch: 0,
  launchVx: 0,
  hitstop: 6,
  shake: 2,
  power: 0.6,
  poses: ['idle', 'idle'],
};

function mv(id: string, o: Partial<Move>): [string, Move] {
  return [id, { ...mvBase, id, ...o }];
}

// ---------------------------------------------------------------- CAETANO
const cIdle: Pose = { lean: 6, head: 0, fa1: 45, fa2: -70, ba1: 95, ba2: -75, fl1: 62, fl2: 102, bl1: 118, bl2: 82, rot: 0, finger: 0, mouth: 0 };
const cp = (o: Partial<Pose>): Pose => ({ ...cIdle, ...o });
const cCrouch = cp({ lean: 20, fa1: 50, fa2: -60, ba1: 100, ba2: -70, fl1: 30, fl2: 118, bl1: 148, bl2: 62 });

const caetanoPoses: Record<string, Pose> = {
  idle: cIdle,
  crouch: cCrouch,
  jump: cp({ lean: 0, fa1: 30, fa2: -80, ba1: 120, ba2: -60, fl1: 40, fl2: 120, bl1: 100, bl2: 160 }),
  block: cp({ lean: 4, fa1: -10, fa2: -100, ba1: 5, ba2: -95 }),
  blockC: { ...cCrouch, fa1: -10, fa2: -100, ba1: 5, ba2: -95 },
  hit: cp({ lean: -22, head: -18, fa1: 100, fa2: 70, ba1: 130, ba2: 90, fl1: 85, fl2: 95, bl1: 105, bl2: 90, mouth: 1 }),
  hitLow: cp({ lean: 25, head: 15, fa1: 70, fa2: 40, ba1: 90, ba2: 60, fl1: 40, fl2: 110, bl1: 140, bl2: 70, mouth: 1 }),
  air: cp({ lean: -35, head: -25, fa1: -120, fa2: -100, ba1: -150, ba2: -110, fl1: 60, fl2: 90, bl1: 40, bl2: 120, rot: -0.9, mouth: 1 }),
  down: cp({ lean: 0, head: 0, fa1: 85, fa2: 90, ba1: 95, ba2: 100, fl1: 80, fl2: 100, bl1: 95, bl2: 85, rot: -1.5708, mouth: 1 }),
  getup: cp({ lean: 40, fa1: 70, fa2: 40, ba1: 80, ba2: 60, fl1: 30, fl2: 120, bl1: 150, bl2: 60, rot: -0.25 }),
  win: cp({ lean: -4, head: -10, fa1: 70, fa2: -170, ba1: 110, ba2: -10, fl1: 85, fl2: 92, bl1: 95, bl2: 88 }),
  grabbed: cp({ lean: -20, head: -25, fa1: -120, fa2: -100, ba1: -140, ba2: -90, fl1: 85, fl2: 95, bl1: 100, bl2: 80, mouth: 1 }),
  rush: cp({ lean: 45, fa1: 150, fa2: 170, ba1: 160, ba2: 175, fl1: 30, fl2: 80, bl1: 130, bl2: 120 }),
  taunt: cp({ lean: 8, head: -6, fa1: -12, fa2: -8, finger: 1, ba1: 100, ba2: -100, fl1: 70, fl2: 100, bl1: 110, bl2: 85, mouth: 1 }),
  pL_s: cp({ fa1: 70, fa2: -120, lean: 2 }),
  pL_a: cp({ fa1: -5, fa2: -2, lean: 14, ba1: 100, ba2: -100, fl1: 55, fl2: 100 }),
  pM_s: cp({ lean: -6, ba1: 75, ba2: -130, fa1: 80, fa2: -90 }),
  pM_a: cp({ ba1: 0, ba2: -3, lean: 20, fa1: 110, fa2: -110, fl1: 50, fl2: 95, bl1: 135, bl2: 100 }),
  pH_s: cp({ lean: -10, ba1: 70, ba2: -140, fl1: 55, fl2: 105 }),
  pH_a: cp({ ba1: -12, ba2: -8, lean: 28, fl1: 45, fl2: 90, bl1: 140, bl2: 110, fa1: 120, fa2: -60 }),
  kL_s: cp({ fl1: 20, fl2: 120, lean: -4 }),
  kL_a: cp({ fl1: 5, fl2: -5, lean: -8, bl1: 100, bl2: 90 }),
  kM_s: cp({ fl1: 15, fl2: 130, lean: -10 }),
  kM_a: cp({ fl1: -22, fl2: -18, lean: -20, bl1: 100, bl2: 90 }),
  kH_s: cp({ fl1: 10, fl2: 135, lean: -18, fa1: 70, fa2: -110 }),
  kH_a: cp({ fl1: -48, fl2: -44, lean: -32, bl1: 95, bl2: 88, fa1: 110, fa2: 90 }),
  cP_s: { ...cCrouch },
  cP_a: { ...cCrouch, fa1: -20, fa2: -15, lean: 28 },
  cK_s: { ...cCrouch, lean: 5 },
  cK_a: { ...cCrouch, lean: -30, fl1: 25, fl2: 15, ba1: 130, ba2: 100, bl1: 150 },
  jP_s: cp({ lean: 0, fa1: 30, fa2: -80, ba1: 120, ba2: -60, fl1: 40, fl2: 120, bl1: 100, bl2: 160 }),
  jP_a: cp({ lean: 12, fa1: -10, fa2: -5, ba1: 110, ba2: -70, fl1: 40, fl2: 120, bl1: 100, bl2: 160 }),
  jK_s: cp({ lean: 0, fl1: 40, fl2: 120, bl1: 100, bl2: 160 }),
  jK_a: cp({ lean: -22, fl1: 30, fl2: 25, bl1: 120, bl2: 150, fa1: 100, fa2: -120 }),
  chute_s: cp({ lean: 22, fa1: 60, fa2: -20, ba1: 110, ba2: -30, fl1: 45, fl2: 110, bl1: 135, bl2: 70 }),
  chute_a: cp({ lean: -38, fa1: -150, fa2: -170, ba1: 150, ba2: 170, fl1: -8, fl2: -12, bl1: 100, bl2: 92 }),
  dedo_s: cp({ lean: -6, fa1: 80, fa2: -95, finger: 1 }),
  dedo_a: cp({ fa1: -5, fa2: -3, finger: 1, lean: 24, ba1: 110, ba2: -90, fl1: 45, fl2: 90, bl1: 140, bl2: 100 }),
  soco_s: cp({ lean: -30, ba1: 172, ba2: 178, fa1: -20, fa2: -40, fl1: 50, fl2: 100, bl1: 130, bl2: 95, head: -8 }),
  soco_a: cp({ lean: 36, ba1: -3, ba2: 0, fl1: 40, fl2: 95, bl1: 150, bl2: 110, fa1: 140, fa2: -100, mouth: 1 }),
};

const caetanoMoves: Record<string, Move> = Object.fromEntries([
  mv('pL', { rank: 1, startup: 4, active: 3, recovery: 8, dmg: 22, hitstun: 13, blockstun: 8, kb: 2.5, hb: [20, 95, 105, 140], poses: ['pL_s', 'pL_a'], trail: 'fw', hitstop: 5 }),
  mv('pM', { rank: 2, startup: 6, active: 4, recovery: 13, dmg: 40, hitstun: 17, blockstun: 11, kb: 4, hb: [20, 115, 100, 142], poses: ['pM_s', 'pM_a'], trail: 'bw', hitstop: 7, power: 0.9 }),
  mv('pH', { rank: 3, startup: 9, active: 4, recovery: 19, dmg: 65, hitstun: 22, blockstun: 14, kb: 7, kbBlock: 4, hb: [20, 130, 95, 145], poses: ['pH_s', 'pH_a'], trail: 'bw', hitstop: 9, shake: 5, power: 1.2, launch: 6, launchVx: 5 }),
  mv('kL', { rank: 1, startup: 5, active: 3, recovery: 10, dmg: 24, hitstun: 13, blockstun: 8, kb: 2.5, hb: [15, 100, 50, 100], poses: ['kL_s', 'kL_a'], trail: 'fa', hitstop: 5 }),
  mv('kM', { rank: 2, startup: 7, active: 4, recovery: 14, dmg: 45, hitstun: 18, blockstun: 12, kb: 5, hb: [20, 118, 80, 140], poses: ['kM_s', 'kM_a'], trail: 'fa', hitstop: 7, power: 0.9 }),
  mv('kH', { rank: 3, startup: 10, active: 5, recovery: 21, dmg: 70, hitstun: 23, blockstun: 15, kb: 8, kbBlock: 5, hb: [20, 125, 70, 165], poses: ['kH_s', 'kH_a'], trail: 'fa', hitstop: 9, shake: 5, power: 1.2, launch: 6, launchVx: 6 }),
  mv('cP', { rank: 1, startup: 5, active: 3, recovery: 9, dmg: 25, hitstun: 13, blockstun: 8, kb: 2, hb: [20, 100, 50, 95], poses: ['cP_s', 'cP_a'], trail: 'fw', hitstop: 5 }),
  mv('cK', { rank: 2, startup: 8, active: 4, recovery: 22, dmg: 50, hitstun: 22, blockstun: 12, kb: 6, hb: [10, 135, 0, 35], level: 'low', poses: ['cK_s', 'cK_a'], trail: 'fa', hitstop: 8, power: 1, launch: 5, launchVx: 4 }),
  mv('jP', { rank: 2, air: true, startup: 5, active: 10, recovery: 0, dmg: 50, hitstun: 18, blockstun: 12, kb: 4, hb: [10, 95, 20, 125], poses: ['jP_s', 'jP_a'], trail: 'fw', hitstop: 7, power: 0.9 }),
  mv('jK', { rank: 2, air: true, startup: 6, active: 10, recovery: 0, dmg: 55, hitstun: 19, blockstun: 12, kb: 5, hb: [5, 100, -10, 85], poses: ['jK_s', 'jK_a'], trail: 'fa', hitstop: 7, power: 1 }),
  mv('s1', {
    kind: 'special', rank: 9, startup: 12, active: 8, recovery: 22, whiff: 8, dmg: 90, hitstun: 26, blockstun: 16, kb: 9, kbBlock: 6, hb: [10, 155, 25, 155],
    launch: 8, launchVx: 7, hitstop: 10, shake: 9, power: 2, poses: ['chute_s', 'chute_a'], trail: 'fa', advance: [10, 20, 4], label: 'CHUTE DA CONSPIRAÇÃO', turn: [3, 14], sound: 'purple',
  }),
  mv('s2', {
    kind: 'special', rank: 9, startup: 8, active: 5, recovery: 16, whiff: 6, dmg: 55, hitstun: 14, blockstun: 10, kb: 3, kbBlock: 1, hb: [30, 140, 100, 140],
    hitstop: 11, shake: 4, power: 1.5, poses: ['dedo_s', 'dedo_a'], trail: 'fw', advance: [6, 15, 13], dedilho: true, pierce: 0.55, label: 'DEDILHO PERFURANTE', sound: 'purple',
  }),
  mv('s3', {
    kind: 'special', rank: 9, startup: 30, active: 6, recovery: 26, whiff: 34, dmg: 140, hitstun: 30, blockstun: 20, kb: 12, kbBlock: 8, hb: [20, 130, 60, 155],
    launch: 11, launchVx: 9, hitstop: 15, shake: 22, power: 3, poses: ['soco_s', 'soco_a'], advance: [28, 36, 5], label: 'SOCO PEGO!', charge: true, sound: 'purple',
  }),
]);

// ---------------------------------------------------------------- ORANGO
const oIdle: Pose = { lean: 38, head: -8, fa1: 70, fa2: 78, ba1: 98, ba2: 92, fl1: 60, fl2: 100, bl1: 120, bl2: 80, rot: 0, finger: 0, mouth: 0 };
const op = (o: Partial<Pose>): Pose => ({ ...oIdle, ...o });
const oCrouch = op({ lean: 55, fa1: 40, fa2: 100, ba1: 40, ba2: 110, fl1: 35, fl2: 115, bl1: 145, bl2: 65 });

const orangoPoses: Record<string, Pose> = {
  idle: oIdle,
  crouch: oCrouch,
  jump: op({ lean: 20, fa1: -40, fa2: -70, ba1: -20, ba2: -50, fl1: 50, fl2: 120, bl1: 100, bl2: 150 }),
  block: op({ lean: 25, fa1: -20, fa2: -110, ba1: -5, ba2: -100 }),
  blockC: { ...oCrouch, fa1: -20, fa2: -110, ba1: -5, ba2: -100, lean: 45 },
  hit: op({ lean: 12, head: -28, fa1: 120, fa2: 100, ba1: 140, ba2: 110, fl1: 80, fl2: 95, bl1: 105, bl2: 90, mouth: 1 }),
  hitLow: op({ lean: 50, head: 10, fa1: 80, fa2: 70, ba1: 100, ba2: 80, mouth: 1 }),
  air: op({ lean: 0, head: -25, fa1: -130, fa2: -100, ba1: -150, ba2: -110, fl1: 60, fl2: 100, bl1: 40, bl2: 120, rot: -0.9, mouth: 1 }),
  down: op({ lean: 0, head: 0, fa1: 100, fa2: 105, ba1: 110, ba2: 100, fl1: 80, fl2: 100, bl1: 95, bl2: 85, rot: -1.5708, mouth: 1 }),
  getup: op({ lean: 60, rot: -0.2 }),
  win: op({ lean: -4, head: -20, fa1: 50, fa2: -150, ba1: 130, ba2: -150, fl1: 85, fl2: 92, bl1: 95, bl2: 88, mouth: 1 }),
  grabbed: op({ lean: -10, head: -30, fa1: -130, fa2: -100, ba1: -140, ba2: -90, fl1: 85, fl2: 95, bl1: 100, bl2: 80, mouth: 1 }),
  rush: op({ lean: 62, fa1: 30, fa2: 20, ba1: 110, ba2: 100, fl1: 20, fl2: 90, bl1: 150, bl2: 80, mouth: 1 }),
  roar: op({ lean: -10, head: -32, mouth: 1, fa1: -60, fa2: -110, ba1: -120, ba2: -80, fl1: 80, fl2: 95, bl1: 100, bl2: 85 }),
  slam: op({ lean: 62, fa1: 75, fa2: 65, ba1: 85, ba2: 75, mouth: 1 }),
  taunt: op({ lean: -10, head: -32, mouth: 1, fa1: -60, fa2: -110, ba1: -120, ba2: -80, fl1: 80, fl2: 95, bl1: 100, bl2: 85 }),
  grabHold: op({ lean: 42, fa1: -8, fa2: -5, ba1: 80, ba2: 85, mouth: 1 }),
  pullIn: op({ lean: 50, fa1: 50, fa2: -70, ba1: 90, ba2: 90, mouth: 1 }),
  throwUp: op({ lean: -4, fa1: -95, fa2: -90, ba1: -100, ba2: -95, fl1: 85, fl2: 92, bl1: 95, bl2: 88, mouth: 1 }),
  throwDown: op({ lean: 58, fa1: 60, fa2: 55, ba1: 65, ba2: 60, mouth: 1 }),
  bite: op({ lean: 76, head: 28, mouth: 1, fa1: 20, fa2: 40, ba1: 30, ba2: 50, fl1: 35, fl2: 115, bl1: 145, bl2: 65 }),
  pL_s: op({ fa1: 30, fa2: -70, lean: 30 }),
  pL_a: op({ fa1: 5, fa2: 0, lean: 44 }),
  pM_s: op({ fa1: -130, fa2: -110, lean: 24 }),
  pM_a: op({ fa1: 25, fa2: 15, lean: 50 }),
  pH_s: op({ fa1: -120, fa2: -130, ba1: -110, ba2: -120, lean: 8, head: -22 }),
  pH_a: op({ fa1: 60, fa2: 50, ba1: 65, ba2: 55, lean: 58, mouth: 1 }),
  kL_s: op({ fl1: 20, fl2: 100, lean: 32 }),
  kL_a: op({ fl1: 8, fl2: 0, lean: 40 }),
  kM_s: op({ fl1: 15, fl2: 115, lean: 44 }),
  kM_a: op({ fl1: -14, fl2: -8, lean: 48 }),
  kH_s: op({ lean: 52, fl1: 30, fl2: 110, bl1: 140, bl2: 100 }),
  kH_a: op({ lean: 72, fl1: -35, fl2: -30, bl1: -20, bl2: -25, fa1: 80, fa2: 85, ba1: 100, ba2: 95, mouth: 1 }),
  cP_s: { ...oCrouch },
  cP_a: { ...oCrouch, fa1: 10, fa2: 5, lean: 62 },
  cK_s: { ...oCrouch },
  cK_a: { ...oCrouch, lean: 66, fl1: 15, fl2: 5 },
  jP_s: op({ lean: 30, fa1: -40, fa2: -70, ba1: -20, ba2: -50, fl1: 50, fl2: 120, bl1: 100, bl2: 150 }),
  jP_a: op({ lean: 44, fa1: 20, fa2: 15, ba1: 30, ba2: 20, fl1: 50, fl2: 120, bl1: 100, bl2: 150, mouth: 1 }),
  jK_s: op({ lean: 20, fl1: 50, fl2: 120, bl1: 100, bl2: 150, fa1: -40, fa2: -70 }),
  jK_a: op({ lean: 30, fl1: 25, fl2: 20, bl1: 100, bl2: 150, fa1: -60, fa2: -80, ba1: -40, ba2: -70 }),
  dedo_s: op({ lean: 20, fa1: 60, fa2: -100, finger: 1, ba1: 90, ba2: 90 }),
  dedo_a: op({ lean: 46, fa1: -3, fa2: -1, finger: 1, ba1: 80, ba2: 85, mouth: 1 }),
  puxao_s: op({ lean: 30, fa1: -20, fa2: -10, ba1: -20, ba2: -10 }),
  puxao_a: op({ lean: 48, fa1: -5, fa2: 5, ba1: 5, ba2: 10, mouth: 1 }),
  mord_s: op({ lean: 70, fa1: 80, fa2: 85, ba1: 90, ba2: 92, fl1: 30, fl2: 110, bl1: 140, bl2: 70 }),
  mord_a: op({ lean: 80, fa1: -20, fa2: -10, ba1: -15, ba2: -5, fl1: 120, fl2: 150, bl1: 60, bl2: 120, mouth: 1 }),
};

const orangoMoves: Record<string, Move> = Object.fromEntries([
  mv('pL', { rank: 1, startup: 6, active: 3, recovery: 11, dmg: 30, hitstun: 14, blockstun: 9, kb: 3.5, hb: [25, 140, 85, 130], poses: ['pL_s', 'pL_a'], trail: 'fw', hitstop: 6 }),
  mv('pM', { rank: 2, startup: 9, active: 4, recovery: 17, dmg: 55, hitstun: 18, blockstun: 12, kb: 5, hb: [25, 150, 60, 125], poses: ['pM_s', 'pM_a'], trail: 'fw', hitstop: 8, shake: 3, power: 1 }),
  mv('pH', { rank: 3, startup: 14, active: 5, recovery: 25, dmg: 90, hitstun: 24, blockstun: 16, kb: 9, kbBlock: 5, hb: [20, 160, 20, 125], poses: ['pH_s', 'pH_a'], trail: 'fw', hitstop: 11, shake: 8, power: 1.6, launch: 7, launchVx: 6 }),
  mv('kL', { rank: 1, startup: 7, active: 3, recovery: 12, dmg: 32, hitstun: 14, blockstun: 9, kb: 3.5, hb: [20, 108, 20, 65], poses: ['kL_s', 'kL_a'], trail: 'fa', hitstop: 6 }),
  mv('kM', { rank: 2, startup: 10, active: 4, recovery: 18, dmg: 60, hitstun: 19, blockstun: 12, kb: 5.5, hb: [20, 120, 25, 90], poses: ['kM_s', 'kM_a'], trail: 'fa', hitstop: 8, shake: 3, power: 1 }),
  mv('kH', { rank: 3, startup: 14, active: 5, recovery: 27, dmg: 95, hitstun: 25, blockstun: 16, kb: 10, kbBlock: 6, hb: [20, 150, 30, 140], poses: ['kH_s', 'kH_a'], trail: 'fa', hitstop: 11, shake: 8, power: 1.6, launch: 7, launchVx: 7 }),
  mv('cP', { rank: 1, startup: 7, active: 3, recovery: 12, dmg: 34, hitstun: 14, blockstun: 9, kb: 3, hb: [25, 135, 30, 80], poses: ['cP_s', 'cP_a'], trail: 'fw', hitstop: 6 }),
  mv('cK', { rank: 2, startup: 11, active: 4, recovery: 26, dmg: 65, hitstun: 22, blockstun: 13, kb: 7, hb: [10, 130, 0, 35], level: 'low', poses: ['cK_s', 'cK_a'], trail: 'fa', hitstop: 9, shake: 4, power: 1.2, launch: 5, launchVx: 5 }),
  mv('jP', { rank: 2, air: true, startup: 7, active: 10, recovery: 0, dmg: 65, hitstun: 19, blockstun: 13, kb: 5, hb: [10, 120, 0, 110], poses: ['jP_s', 'jP_a'], trail: 'fw', hitstop: 8, power: 1.1 }),
  mv('jK', { rank: 2, air: true, startup: 8, active: 10, recovery: 0, dmg: 70, hitstun: 20, blockstun: 13, kb: 6, hb: [5, 105, -15, 80], poses: ['jK_s', 'jK_a'], trail: 'fa', hitstop: 8, power: 1.2 }),
  mv('s1', {
    kind: 'special', rank: 9, startup: 24, active: 7, recovery: 28, whiff: 10, dmg: 140, hitstun: 28, blockstun: 18, kb: 11, kbBlock: 7, hb: [60, 280, 95, 135],
    launch: 7, launchVx: 8, hitstop: 13, shake: 16, power: 2.5, poses: ['dedo_s', 'dedo_a'], advance: [20, 27, 5], dedilho: true, label: 'DEDILHO SUPREMO', charge: true, sound: 'red',
  }),
  mv('s2', {
    kind: 'special', rank: 9, startup: 8, active: 3, recovery: 20, whiff: 18, dmg: 160, hitstun: 0, blockstun: 0, kb: 0, kbBlock: 0, hb: [0, 125, 15, 150],
    hitstop: 0, shake: 0, power: 2, poses: ['puxao_s', 'puxao_a'], grab: 'puxao', unblockable: true, label: 'PUXÃO DE CAMISA', sound: 'red',
  }),
  mv('s3', {
    kind: 'special', rank: 9, startup: 10, active: 16, recovery: 24, whiff: 24, dmg: 125, hitstun: 0, blockstun: 0, kb: 0, kbBlock: 0, hb: [0, 100, 0, 70], level: 'low',
    hitstop: 4, shake: 0, power: 2, poses: ['mord_s', 'mord_a'], advance: [10, 26, 11], grab: 'mordida', label: 'MORDIDA NA PERNA', sound: 'red',
  }),
]);

export const CHARS: Record<CharId, CharDef> = {
  caetano: {
    id: 'caetano',
    name: 'KARATÊ CAETANO',
    short: 'CAETANO',
    title: 'O MAIOR ARTISTA MARCIAL DO MUNDO (segundo ele)',
    color: '#a855f7',
    color2: '#6d28d9',
    glow: '#d8b4fe',
    hp: 1000,
    walk: 4.4,
    walkBack: 3.6,
    jumpVy: 16.5,
    jumpVx: 5.4,
    dashVx: 11.5,
    dashDur: 15,
    pushW: 26,
    hurtH: 172,
    crouchH: 110,
    moves: caetanoMoves,
    poses: caetanoPoses,
    attrs: [
      { label: 'VELOCIDADE', v: 5 },
      { label: 'FORÇA', v: 3 },
      { label: 'ALCANCE', v: 3 },
      { label: 'RESISTÊNCIA', v: 3 },
      { label: 'MOBILIDADE', v: 5 },
    ],
    specials: [
      { key: 'U', name: 'CHUTE DA CONSPIRAÇÃO', desc: 'Chute giratório com rastro roxo. Empurra e derruba.' },
      { key: 'I', name: 'DEDILHO PERFURANTE', desc: 'Estocada ultrarrápida que fura a defesa.' },
      { key: 'O', name: 'SOCO PEGO', desc: 'Soco exagerado, dano enorme. Se errar, paga caro.' },
    ],
    superName: 'CONSPIRAÇÃO ABSOLUTA',
    quote: 'ERA TUDO PARTE DA CONSPIRAÇÃO.',
    bio: 'Cabelo cacheado, faixa roxa e confiança infinita. Mestre dos combos e da velocidade.',
  },
  orango: {
    id: 'orango',
    name: 'ORANGO TANGO BITENCOURT',
    short: 'ORANGO',
    title: 'O REI DA SELVA',
    color: '#ef4444',
    color2: '#991b1b',
    glow: '#fca5a5',
    hp: 1150,
    walk: 3.0,
    walkBack: 2.4,
    jumpVy: 15,
    jumpVx: 3.6,
    dashVx: 7.5,
    dashDur: 16,
    pushW: 44,
    hurtH: 150,
    crouchH: 95,
    moves: orangoMoves,
    poses: orangoPoses,
    attrs: [
      { label: 'VELOCIDADE', v: 3 },
      { label: 'FORÇA', v: 5 },
      { label: 'ALCANCE', v: 5 },
      { label: 'RESISTÊNCIA', v: 5 },
      { label: 'MOBILIDADE', v: 2 },
    ],
    specials: [
      { key: 'U', name: 'DEDILHO SUPREMO', desc: 'Estocada colossal com onda de choque vermelha.' },
      { key: 'I', name: 'PUXÃO DE CAMISA', desc: 'Agarrão impossível de bloquear. Só de perto.' },
      { key: 'O', name: 'MORDIDA NA PERNA', desc: 'Avança, agarra a perna e morde. Derruba.' },
    ],
    superName: 'INSTINTO PRIMORDIAL',
    quote: 'O REI DA SELVA NÃO PRECISA DE FAIXA.',
    bio: 'Um orangotango furioso. Força bruta, alcance absurdo e agarrões devastadores.',
  },
};

export const NORMAL_BY_RANK: Record<string, string[]> = { p: ['pL', 'pM', 'pH'], k: ['kL', 'kM', 'kH'] };
