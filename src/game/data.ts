import {applyAccessoryNormals} from './accessories';
import {createWocFighters} from './woc-data';
import {SHARK_KISS_DAMAGE} from './shark-choreography';
// Combat attributes, frame data and invisible contact/presentation anchors.

export const CHAR_IDS = ['caetano', 'orango', 'tubarao', 'rickzera', 'bieu', 'nomad', 'renngotti', 'aneninha', 'santox', 'jao', 'jane', 'cristyan', 'eneas', 'patrick', 'gabrielzin', 'ulisses', 'felipence', 'hdsh'] as const;
export type CharId = (typeof CHAR_IDS)[number];

// Três usos compartilham o mesmo limite por lutador; rajadas contam como um uso.
export const RANGED_MOVES: Record<CharId, readonly string[]> = {
  caetano: [], orango: ['s1'], tubarao: [], rickzera: ['s1'],
  bieu: ['s2', 's3'], nomad: ['s1', 's2', 's3'],
  renngotti: ['s2', 's3'], aneninha: ['s2', 's3'],
  santox: ['s1'], jao: ['s1', 's2', 's3'],
  jane:['s1'],cristyan:[],eneas:['s1','s2','s3'],patrick:[],gabrielzin:['s1','s3'],ulisses:['s3'],felipence:['s3'],hdsh:['s1','s2','s3'],
};


export const CHAR_CATEGORIES = {
  Streamers: ['rickzera', 'caetano', 'nomad', 'bieu', 'renngotti', 'aneninha'],
  Especiais: ['tubarao', 'orango', 'eneas'],
  Viewers: ['santox', 'jao', 'jane', 'cristyan', 'patrick', 'gabrielzin', 'ulisses', 'felipence', 'hdsh'],
} as const satisfies Record<string, readonly CharId[]>;
export type CharCategory = keyof typeof CHAR_CATEGORIES;

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
  grab?: 'puxao' | 'mordida' | 'engole' | 'moon' | 'super' | 'throw' | 'vampire' | 'cupid';
  dedilho?: boolean;
  pierce?: number;
  chip?: number; // Individual blocked damage ratio; normals always deal zero chip.
  unblockable?: boolean;
  trail?: 'fw' | 'bw' | 'fa' | 'ba';
  label?: string;
  turn?: [number, number];
  charge?: boolean;
  variant?: 'low' | 'reverse';
  spike?: boolean;
  recoveryPose?: string;
  sound?: 'purple' | 'red';
  accessory?:'katana'|'guitar'|'screwdriver'|'spray';
  resourcePower?:number;
  rangeScale?:number;
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
  mv('jP', { rank: 2, air: true, level: 'high', startup: 5, active: 10, recovery: 0, dmg: 50, hitstun: 18, blockstun: 12, kb: 4, hb: [10, 95, 20, 125], poses: ['jP_s', 'jP_a'], trail: 'fw', hitstop: 7, power: 0.9 }),
  mv('jK', { rank: 2, air: true, level: 'high', startup: 6, active: 10, recovery: 0, dmg: 55, hitstun: 19, blockstun: 12, kb: 5, hb: [5, 100, -10, 85], poses: ['jK_s', 'jK_a'], trail: 'fa', hitstop: 7, power: 1 }),
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
  mv('jP', { rank: 2, air: true, level: 'high', startup: 7, active: 10, recovery: 0, dmg: 65, hitstun: 19, blockstun: 13, kb: 5, hb: [10, 120, 0, 110], poses: ['jP_s', 'jP_a'], trail: 'fw', hitstop: 8, power: 1.1 }),
  mv('jK', { rank: 2, air: true, level: 'high', startup: 8, active: 10, recovery: 0, dmg: 70, hitstun: 20, blockstun: 13, kb: 6, hb: [5, 105, -15, 80], poses: ['jK_s', 'jK_a'], trail: 'fa', hitstop: 8, power: 1.2 }),
  mv('s1', {
    kind: 'special', rank: 9, startup: 24, active: 7, recovery: 28, whiff: 10, dmg: 140, hitstun: 28, blockstun: 18, kb: 11, kbBlock: 7, hb: [60, 280, 95, 135],
    launch: 7, launchVx: 8, hitstop: 13, shake: 16, power: 2.5, poses: ['dedo_s', 'dedo_a'], advance: [20, 27, 5], dedilho: true, label: 'DEDILHO SUPREMO', charge: true, sound: 'red',
  }),
  mv('s2', {
    kind: 'special', rank: 9, startup: 16, active: 3, recovery: 20, whiff: 18, dmg: 140, hitstun: 0, blockstun: 0, kb: 0, kbBlock: 0, hb: [0, 105, 15, 150],
    hitstop: 0, shake: 0, power: 2, poses: ['puxao_s', 'puxao_a'], grab: 'puxao', unblockable: true, label: 'PUXÃO DE CAMISA', sound: 'red',
  }),
  mv('s3', {
    kind: 'special', rank: 9, startup: 18, active: 10, recovery: 24, whiff: 24, dmg: 125, hitstun: 0, blockstun: 0, kb: 0, kbBlock: 0, hb: [0, 100, 0, 70], level: 'low',
    hitstop: 4, shake: 0, power: 2, poses: ['mord_s', 'mord_a'], advance: [18, 28, 9], grab: 'mordida', label: 'MORDIDA NA PERNA', sound: 'red',
  }),
]);

// ---------------------------------------------------------------- TUBARÃO FISCAL E RICKZERA
// Mesmo esqueleto articulado: cada personagem tem dados e silhueta próprios.
const tubaraoPoses: Record<string, Pose> = {
  ...Object.fromEntries(Object.entries(caetanoPoses).map(([k, p]) => [k, { ...p }])),
  idle: cp({ lean: 14, head: -4, fa1: 52, fa2: -54, ba1: 100, ba2: -62, fl1: 72, fl2: 96, bl1: 112, bl2: 86 }),
  roar: cp({ lean: -10, head: -25, mouth: 1, fa1: -40, fa2: -80, ba1: -120, ba2: -85 }),
  bite: cp({ lean: 48, head: 18, mouth: 1, fa1: 15, fa2: 25, ba1: 45, ba2: 35 }),
  bite_s: cp({ lean: -12, head: -12, mouth: 1, fa1: 65, fa2: -80 }),
  bite_a: cp({ lean: 42, head: 18, mouth: 1, fa1: 20, fa2: 10, ba1: 125, ba2: 100, fl1: 45, fl2: 90, bl1: 140, bl2: 100 }),
  swallow_s: cp({ lean: 5, fa1: 5, fa2: -10, ba1: 0, ba2: -5, mouth: 1 }),
  swallow_a: cp({ lean: 30, head: -8, fa1: -8, fa2: -15, ba1: -20, ba2: -10, mouth: 1 }),
  kiss_s: cp({lean:-10,head:10,fa1:65,fa2:-90,ba1:100,ba2:-85}),
  kiss_a: cp({lean:36,head:8,fa1:10,fa2:-65,ba1:15,ba2:-80,mouth:2}),
  fin_s: cp({ lean: -22, head: 8, fa1: 120, fa2: -100, ba1: 150, ba2: -85 }),
  fin_a: cp({ lean: 60, head: -22, fa1: 135, fa2: 135, ba1: 150, ba2: 140, fl1: 30, fl2: 80, bl1: 145, bl2: 100, mouth: 1 }),
  kiss: cp({ lean: 22, head: 10, fa1: -12, fa2: -80, ba1: -20, ba2: -90, mouth: 2 }),
  grabHold: cp({ lean: 14, fa1: -15, fa2: -5, ba1: -10, ba2: 0 }),
  pullIn: cp({ lean: 10, fa1: 40, fa2: -85, ba1: 20, ba2: -95, mouth: 1 }),
  throwUp: cp({ lean: -10, fa1: -95, fa2: -90, ba1: -100, ba2: -95, mouth: 1 }),
  throwDown: cp({ lean: 50, fa1: 40, fa2: 35, ba1: 50, ba2: 40, mouth: 1 }),
  slam: cp({ lean: 50, fa1: 50, fa2: 40, ba1: 65, ba2: 50, mouth: 1 }),
};
const rickzeraPoses: Record<string, Pose> = {
  ...Object.fromEntries(Object.entries(caetanoPoses).map(([k, p]) => [k, { ...p }])),
  idle: cp({ lean: -3, head: 3, fa1: 75, fa2: -38, ba1: 103, ba2: -35, fl1: 78, fl2: 92, bl1: 106, bl2: 88 }),
  taunt: cp({ lean: -8, head: 5, fa1: -25, fa2: -8, finger: 1, ba1: 90, ba2: -35 }),
  // For Rick, the front/near arm is his anatomical left: the golden knuckles.
  franco_s: cp({ lean: -12, fa1: 60, fa2: -65, ba1: 65, ba2: -125 }),
  franco_a: cp({ lean: 14, fa1: 65, fa2: -70, ba1: -10, ba2: -5 }),
  knuckle_s: cp({ lean: -16, head: 10, fa1: -100, fa2: -145, ba1: 65, ba2: -65, fl1: 65, fl2: 101, bl1: 116, bl2: 83 }),
  knuckle_a: cp({ lean: 48, head: -10, fa1: 25, fa2: 66, ba1: 130, ba2: -45, fl1: 26, fl2: 112, bl1: 133, bl2: 76, mouth: 1 }),
  wise_a: cp({ lean: 20, fa1: -12, fa2: 0, ba1: -20, ba2: -5, finger: 1 }),
  double_s: cp({ lean: -12, fl1: 30, fl2: 125, bl1: 135, bl2: 145, fa1: -50, fa2: -110 }),
  double_a: cp({ lean: -18, fl1: -25, fl2: -20, bl1: 110, bl2: 155, fa1: -80, fa2: -120, ba1: 125, ba2: 150 }),
  roar: cp({ lean: -10, fa1: -40, fa2: -90, ba1: -130, ba2: -80, mouth: 1 }),
  slam: cp({ lean: 32, fa1: 45, fa2: 35, ba1: 50, ba2: 40 }),
  bite: cp({ lean: 44, head: 15, mouth: 1 }),
  grabHold: cp({ lean: 8, fa1: -12, fa2: -5, ba1: -18, ba2: -5 }),
  pullIn: cp({ lean: 4, fa1: 40, fa2: -85, ba1: 30, ba2: -95 }),
  throwUp: cp({ lean: -8, fa1: -95, fa2: -90, ba1: -100, ba2: -95 }),
  throwDown: cp({ lean: 45, fa1: 45, fa2: 35, ba1: 50, ba2: 40 }),
};

// Todos possuem socos/chutes de três forças, golpes baixos e golpes aéreos.
const tubaraoMoves: Record<string, Move> = Object.fromEntries(
  Object.entries(caetanoMoves).filter(([, m]) => m.kind === 'normal').map(([id, m]) => [id, {
    ...m, startup: m.startup + 2, recovery: m.recovery + 3,
    dmg: Math.round(m.dmg * 1.3), power: m.power * 1.15,
    hb: [m.hb[0], m.hb[1] + 24, m.hb[2], m.hb[3] + 8] as Move['hb'],
  }]),
);
Object.assign(tubaraoMoves, Object.fromEntries([
  mv('s1', { kind: 'special', rank: 9, startup: 13, active: 8, recovery: 25, whiff: 12, dmg: 100, hitstun: 27, blockstun: 16, kb: 8, kbBlock: 5, hb: [18, 160, 65, 180], hitstop: 10, shake: 10, power: 2, poses: ['bite_s', 'bite_a'], advance: [8, 22, 6], label: 'MORDIDA' }),
  mv('s2', { kind: 'special', rank: 9, startup: 18, active: 4, recovery: 28, whiff: 20, dmg: 125, hitstun: 0, blockstun: 0, kb: 0, hb: [0, 96, 5, 180], hitstop: 0, power: 2, poses: ['swallow_s', 'swallow_a'], grab: 'engole', unblockable: true, label: 'ENGOLE' }),
  mv('s3', {kind:'special',rank:9,startup:18,active:4,recovery:24,whiff:16,dmg:SHARK_KISS_DAMAGE,hitstun:28,blockstun:14,kb:3,kbBlock:4,hb:[10,110,40,172],hitstop:8,shake:6,power:1.3,poses:['kiss_s','kiss_a'],advance:[14,18,2],label:'BEIJO DO FISCALIZADOR'}),
]));
const rickzeraMoves: Record<string, Move> = Object.fromEntries(
  Object.entries(caetanoMoves).filter(([, m]) => m.kind === 'normal').map(([id, m]) => [id, {
    ...m, startup: Math.max(3, m.startup - 1), recovery: Math.max(0, m.recovery - 1),
    dmg: Math.round(m.dmg * 0.9), kb: m.kb * 0.85,
    hb: [...m.hb] as Move['hb'],
  }]),
);
Object.assign(rickzeraMoves, Object.fromEntries([
  mv('s1', { kind: 'special', rank: 9, startup: 12, active: 13, recovery: 19, whiff: 5, dmg: 24, hitstun: 20, blockstun: 12, kb: 5, kbBlock: 3, hb: [20, 105, 80, 145], hitstop: 7, shake: 5, power: 1.3, poses: ['franco_s', 'franco_a'], label: 'ARREMESSO DO FRANCO SUÍÇO · 3 NOTAS' }),
  mv('s2', { kind: 'special', rank: 9, startup: 24, active: 5, recovery: 29, whiff: 14, dmg: 84, hitstun: 24, blockstun: 14, kb: 3, kbBlock: 4, hb: [15, 118, 0, 168], level: 'high', launch: 1, launchVx: 2, spike: true, hitstop: 12, shake: 14, power: 2.3, poses: ['knuckle_s', 'knuckle_a'], advance: [15, 22, 2], trail: 'fw', label: 'SOCO INGLÊS' }),
  mv('s3', { kind: 'special', rank: 9, startup: 3, active: 12, recovery: 12, whiff: 5, dmg: 34, hitstun: 18, blockstun: 12, kb: 4, hb: [5, 110, -15, 130], launch: 5, launchVx: 3, hitstop: 6, shake: 5, power: 1.3, poses: ['double_s', 'double_a'], trail: 'fa', label: 'DOUBLE JUMP' }),
]));


// ---------------------------------------------------------------- BIEUBATMAN E NOMAD LOBBY
const bieuPoses: Record<string, Pose> = {
  ...Object.fromEntries(Object.entries(rickzeraPoses).map(([k, p]) => [k, { ...p }])),
  idle: cp({ lean: 4, fa1: 50, fa2: -65, ba1: 105, ba2: -70, fl1: 72, fl2: 94, bl1: 110, bl2: 86 }),
  driver_s: cp({ lean: -12, fa1: 65, fa2: -115, ba1: 100, ba2: -75 }),
  driver_a: cp({ lean: 28, fa1: -12, fa2: -4, ba1: 110, ba2: -80, finger: 1 }),
  rat_s: cp({ lean: 22, fa1: 80, fa2: -85, ba1: 105, ba2: -60 }),
  rat_a: cp({ lean: 42, fa1: 35, fa2: 6, ba1: 105, ba2: -50, fl1: 40, fl2: 110, bl1: 135, bl2: 78 }),
  spray_s: cp({ lean: -10, fa1: 25, fa2: -75, ba1: 105, ba2: -60 }),
  spray_a: cp({ lean: 12, fa1: -8, fa2: -4, ba1: 110, ba2: -70, finger: 1 }),
  spray: cp({ lean: 12, fa1: -8, fa2: -4, ba1: 110, ba2: -70, finger: 1 }),
  drive: cp({ lean: -6, fa1: -8, fa2: -30, ba1: -15, ba2: -38, fl1: 30, fl2: 112, bl1: 145, bl2: 65 }),
};
const nomadPoses: Record<string, Pose> = {
  ...Object.fromEntries(Object.entries(rickzeraPoses).map(([k, p]) => [k, { ...p }])),
  idle: cp({ lean: 9, fa1: 65, fa2: -55, ba1: 112, ba2: -55, fl1: 68, fl2: 98, bl1: 118, bl2: 84 }),
  burger_s: cp({ lean: -12, fa1: 70, fa2: -125, ba1: 105, ba2: -55 }),
  burger_a: cp({ lean: 20, fa1: -8, fa2: -2, ba1: 110, ba2: -70 }),
  glock_s: cp({ lean: -4, fa1: 15, fa2: -70, ba1: -8, ba2: -95 }),
  glock_a: cp({ lean: 7, fa1: -10, fa2: 0, ba1: -18, ba2: -6, finger: 1 }),
  boomerang_s: cp({ lean: -18, fa1: -90, fa2: -140, ba1: 110, ba2: -60 }),
  boomerang_a: cp({ lean: 24, fa1: -10, fa2: -8, ba1: 120, ba2: -75 }),
  bazooka: cp({ lean: -8, fa1: -14, fa2: -10, ba1: -35, ba2: -20, fl1: 65, fl2: 100, bl1: 120, bl2: 80 }),
};
function copyNormals(dmgScale: number, startup: number, reach: number): Record<string, Move> {
  return Object.fromEntries(Object.entries(caetanoMoves).filter(([, m]) => m.kind === 'normal').map(([id, m]) => [id, {
    ...m, startup: Math.max(3, m.startup + startup), dmg: Math.round(m.dmg * dmgScale),
    hb: [m.hb[0], m.hb[1] + reach, m.hb[2], m.hb[3]] as Move['hb'],
  }]));
}
const bieuMoves = copyNormals(1.05, 1, 8);
Object.assign(bieuMoves, Object.fromEntries([
  mv('s1', { kind: 'special', rank: 9, startup: 13, active: 6, recovery: 26, whiff: 11, dmg: 80, hitstun: 25, blockstun: 15, kb: 7, kbBlock: 4, hb: [20, 150, 70, 146], pierce: 0.35, hitstop: 9, shake: 9, power: 1.8, poses: ['driver_s', 'driver_a'], advance: [7, 15, 3.5], label: 'CHAVE DE FENDA', trail: 'fw' }),
  mv('s2', { kind: 'special', rank: 9, startup: 16, active: 3, recovery: 25, whiff: 6, dmg: 42, hitstun: 21, blockstun: 13, kb: 4, kbBlock: 2, hb: [20, 100, 0, 35], level: 'low', hitstop: 6, shake: 4, power: 1.2, poses: ['rat_s', 'rat_a'], label: 'JOGAR RATO' }),
  mv('s3', { kind: 'special', rank: 9, startup: 19, active: 7, recovery: 25, whiff: 8, dmg: 16, hitstun: 15, blockstun: 9, kb: 1, kbBlock: 1, hb: [20, 155, 10, 130], hitstop: 3, shake: 3, power: 0.8, poses: ['spray_s', 'spray_a'], label: 'PICHAÇÃO' }),
]));
const nomadMoves = copyNormals(1, 1, 5);
Object.assign(nomadMoves, Object.fromEntries([
  mv('s1', { kind: 'special', rank: 9, startup: 15, active: 3, recovery: 26, whiff: 8, dmg: 52, hitstun: 23, blockstun: 14, kb: 6, kbBlock: 3, hb: [20, 120, 65, 145], hitstop: 8, shake: 6, power: 1.4, poses: ['burger_s', 'burger_a'], label: 'MARIO BURGER' }),
  mv('s2', { kind: 'special', rank: 9, startup: 15, active: 5, recovery: 29, whiff: 7, dmg: 20, hitstun: 16, blockstun: 9, kb: 2, kbBlock: 1.5, hb: [20, 120, 135, 155], level: 'high', hitstop: 3, shake: 3, power: 0.9, poses: ['glock_s', 'glock_a'], label: 'RAJADA DE GLOCK' }),
  mv('s3', { kind: 'special', rank: 9, startup: 17, active: 4, recovery: 29, whiff: 9, dmg: 38, hitstun: 22, blockstun: 12, kb: 3, kbBlock: 2, hb: [20, 120, 70, 140], hitstop: 6, shake: 5, power: 1.3, poses: ['boomerang_s', 'boomerang_a'], label: 'BOOMERANG' }),
]));


// ---------------------------------------------------------------- RENNGOTTI
const renngottiPoses: Record<string, Pose> = {
  ...Object.fromEntries(Object.entries(rickzeraPoses).map(([k, p]) => [k, { ...p }])),
  idle: cp({ lean: 3, head: -3, fa1: 60, fa2: -62, ba1: 105, ba2: -58, fl1: 74, fl2: 96, bl1: 110, bl2: 87 }),
  moon_s: cp({ lean: 8, fa1: -15, fa2: -8, ba1: -20, ba2: -12 }),
  moon_a: cp({ lean: -18, fa1: -100, fa2: -95, ba1: -110, ba2: -100, mouth: 1 }),
  mic_s: cp({ lean: -10, fa1: 50, fa2: -125, ba1: 100, ba2: -60 }),
  mic_a: cp({ lean: 20, fa1: -10, fa2: -4, ba1: 115, ba2: -70 }),
  shout_s: cp({ lean: -16, head: -12, fa1: 42, fa2: -80, ba1: 112, ba2: -70 }),
  shout_a: cp({ lean: 28, head: 8, fa1: 90, fa2: 30, ba1: 130, ba2: 70, mouth: 1 }),
  tilt_s: cp({ lean: -12, fa1: -100, fa2: -90, ba1: -112, ba2: -98, mouth: 1 }),
  tilt_a: cp({ lean: 42, fa1: 45, fa2: 28, ba1: 65, ba2: 36, mouth: 1 }),
  desk: cp({ lean: -12, fa1: -100, fa2: -90, ba1: -112, ba2: -98, mouth: 1 }),
};
const renngottiMoves = copyNormals(1, 0, 7);
Object.assign(renngottiMoves, Object.fromEntries([
  mv('s1', { kind: 'special', rank: 9, startup: 16, active: 4, recovery: 26, whiff: 18, dmg: 90, hitstun: 0, blockstun: 0, kb: 0, hb: [0, 100, 0, 176], hitstop: 0, shake: 6, power: 1.8, poses: ['moon_s', 'moon_a'], grab: 'moon', unblockable: true, label: 'JOGA PRA LUA' }),
  mv('s2', { kind: 'special', rank: 9, startup: 14, active: 3, recovery: 23, whiff: 8, dmg: 60, hitstun: 23, blockstun: 14, kb: 6, kbBlock: 3, hb: [20, 110, 65, 150], hitstop: 8, shake: 6, power: 1.4, poses: ['mic_s', 'mic_a'], label: 'JOGAR MICROFONE' }),
  mv('s3', { kind: 'special', rank: 9, startup: 17, active: 12, recovery: 30, whiff: 13, dmg: 65, hitstun: 28, blockstun: 17, kb: 13, kbBlock: 7, hb: [10, 300, 20, 190], hitstop: 9, shake: 12, power: 1.9, poses: ['shout_s', 'shout_a'], label: 'GRITO ALTO' }),
]));

// ---------------------------------------------------------------- ANENINHA
const aneninhaPoses: Record<string, Pose> = {
  ...Object.fromEntries(Object.entries(caetanoPoses).map(([k, p]) => [k, { ...p }])),
  idle: cp({ lean: -2, head: 3, fa1: 48, fa2: -78, ba1: 110, ba2: -60, fl1: 72, fl2: 98, bl1: 112, bl2: 86 }),
  osasco_s: cp({ lean: -22, fa1: 75, fa2: -130, ba1: 100, ba2: -110 }),
  osasco_a: cp({ lean: 30, fa1: -5, fa2: -2, ba1: 125, ba2: -100, fl1: 45, fl2: 90, bl1: 140, bl2: 105, mouth: 1 }),
  paint_s: cp({ lean: 0, fa1: 45, fa2: -80, ba1: 100, ba2: -50 }),
  paint_a: cp({ lean: 15, fa1: -12, fa2: 0, ba1: 115, ba2: -60, finger: 1 }),
  shout_s: cp({ lean: -10, head: -12, fa1: -30, fa2: -80, ba1: -140, ba2: -90 }),
  shout_a: cp({ lean: 18, head: 12, mouth: 1, fa1: -20, fa2: -80, ba1: -150, ba2: -95 }),
  dance1: cp({ lean: -12, head: -5, fa1: -60, fa2: -120, ba1: -135, ba2: -165, fl1: 42, fl2: 110, bl1: 112, bl2: 87, mouth: 1 }),
  dance2: cp({ lean: 12, head: -8, fa1: -125, fa2: -155, ba1: -40, ba2: -95, fl1: 76, fl2: 92, bl1: 143, bl2: 64, mouth: 1 }),
  roar: cp({ lean: -8, head: -18, fa1: -60, fa2: -100, ba1: -135, ba2: -100, mouth: 1 }),
  taunt: cp({ lean: -8, head: 4, fa1: -20, fa2: -10, ba1: 100, ba2: -70 }),
  win: cp({ lean: -7, head: -8, fa1: -65, fa2: -120, ba1: -140, ba2: -155, fl1: 70, fl2: 96, bl1: 115, bl2: 84, mouth: 1 }),
};
const aneninhaMoves = copyNormals(.98, 0, 0);
Object.assign(aneninhaMoves, Object.fromEntries([
  mv('s1', { kind: 'special', rank: 9, startup: 14, active: 6, recovery: 22, whiff: 12, dmg: 95, hitstun: 28, blockstun: 16, kb: 9, kbBlock: 5, hb: [15, 150, 65, 160], launch: 6, launchVx: 5, hitstop: 12, shake: 13, power: 2.2, poses: ['osasco_s', 'osasco_a'], advance: [10, 21, 5], trail: 'fw', label: 'SOCO DE OSASCO' }),
  mv('s2', { kind: 'special', rank: 9, startup: 17, active: 5, recovery: 25, whiff: 8, dmg: 20, hitstun: 16, blockstun: 9, kb: 3, kbBlock: 2, hb: [20, 145, 5, 145], hitstop: 5, shake: 3, power: 1, poses: ['paint_s', 'paint_a'], label: 'PICHAR MURO — OSASCO' }),
  mv('s3', { kind: 'special', rank: 9, startup: 18, active: 8, recovery: 25, whiff: 10, dmg: 65, hitstun: 27, blockstun: 15, kb: 12, kbBlock: 7, hb: [10, 275, 15, 185], hitstop: 8, shake: 11, power: 1.8, poses: ['shout_s', 'shout_a'], label: 'GRITO ALTO' }),
]));

// ---------------------------------------------------------------- VIEWERS
const santoxPoses: Record<string, Pose> = {
  ...Object.fromEntries(Object.entries(caetanoPoses).map(([k,p])=>[k,{...p}])),
  idle: cp({lean:-5,head:6,fa1:65,fa2:-50,ba1:110,ba2:-35,fl1:77,fl2:96,bl1:108,bl2:87}),
  elastic_s: cp({lean:-20,fa1:85,fa2:-130,ba1:110,ba2:-40}),
  elastic_a: cp({lean:18,fa1:-5,fa2:0,ba1:115,ba2:-60,fl1:58,fl2:100,bl1:124,bl2:82}),
  rabbit_s: cp({lean:-16,fl1:10,fl2:145,fa1:80,fa2:-90}),
  rabbit_a: cp({lean:-28,fl1:-18,fl2:-12,bl1:108,bl2:135,fa1:100,fa2:-110}),
  fourth_s: cp({lean:-4,head:-10,fa1:25,fa2:-85,ba1:120,ba2:-70}),
  fourth_a: cp({lean:0,head:0,fa1:30,fa2:-20,ba1:130,ba2:155,finger:1}),
  abstract_s: cp({lean:-8,fa1:-60,fa2:-100,ba1:-130,ba2:-160}),
  abstract_a: cp({lean:17,fa1:-15,fa2:-5,ba1:150,ba2:155,mouth:1}),
  taunt: cp({lean:0,head:0,fa1:30,fa2:-20,ba1:130,ba2:155,finger:1}),
  win: cp({lean:-6,head:5,fa1:40,fa2:-20,ba1:115,ba2:160}),
};
const santoxMoves=copyNormals(.9,1,4);
Object.assign(santoxMoves,Object.fromEntries([
  mv('s1',{kind:'special',rank:9,startup:20,active:4,recovery:30,whiff:12,dmg:52,hitstun:21,blockstun:12,kb:6,kbBlock:3,hb:[45,370,80,145],hitstop:9,shake:7,power:1.5,poses:['elastic_s','elastic_a'],label:'SOCO ELÁSTICO A LONGA DISTÂNCIA'}),
  mv('s2',{kind:'special',rank:9,air:true,startup:13,active:6,recovery:24,whiff:10,dmg:68,hitstun:22,blockstun:13,kb:6,kbBlock:4,hb:[15,155,20,130],level:'high',launch:5,launchVx:4,hitstop:9,shake:8,power:1.7,poses:['rabbit_s','rabbit_a'],trail:'fa',label:'CHUTE DO COELHO'}),
  mv('s3',{kind:'special',rank:9,startup:8,active:18,recovery:28,whiff:0,dmg:0,hitstun:0,blockstun:0,kb:0,hb:[0,0,0,0],hitstop:0,shake:0,power:0,poses:['fourth_s','fourth_a'],label:'QUEBRAR A QUARTA PAREDE'}),
]));
const jaoPoses:Record<string,Pose>={
  ...Object.fromEntries(Object.entries(caetanoPoses).map(([k,p])=>[k,{...p}])),
  idle:cp({lean:2,head:-3,fa1:55,fa2:-80,ba1:104,ba2:-65,fl1:75,fl2:94,bl1:110,bl2:88}),
  chess_s:cp({lean:-12,fa1:30,fa2:-105,ba1:100,ba2:-70}),
  chess_a:cp({lean:25,fa1:35,fa2:5,ba1:110,ba2:-60,fl1:48,fl2:108,bl1:133,bl2:78,finger:1}),
  math_s:cp({lean:-8,fa1:50,fa2:-115,ba1:110,ba2:-65}),
  math_a:cp({lean:16,fa1:-10,fa2:-5,ba1:110,ba2:-80,finger:1}),
  ball_s:cp({lean:-18,fa1:-65,fa2:-100,ba1:-100,ba2:-130}),
  ball_a:cp({lean:25,fa1:-8,fa2:0,ba1:115,ba2:-80,fl1:54,fl2:98,bl1:125,bl2:85}),
  calculation_s:cp({lean:-5,fa1:-60,fa2:-95,ba1:-130,ba2:-155}),
  calculation_a:cp({lean:8,fa1:10,fa2:-5,ba1:155,ba2:165,finger:1}),
  taunt:cp({lean:-4,fa1:20,fa2:-95,ba1:108,ba2:-65,finger:1}),
  win:cp({lean:-4,fa1:68,fa2:-165,ba1:104,ba2:-15}),
};
const jaoMoves=copyNormals(.95,1,0);
Object.assign(jaoMoves,Object.fromEntries([
  mv('s1',{kind:'special',rank:9,startup:24,active:1,recovery:30,whiff:0,dmg:0,hitstun:0,blockstun:0,kb:0,hb:[0,0,0,0],hitstop:0,power:.7,poses:['chess_s','chess_a'],label:'TABULEIRO DE XADREZ'}),
  mv('s2',{kind:'special',rank:9,startup:18,active:3,recovery:26,whiff:8,dmg:44,hitstun:21,blockstun:12,kb:5,kbBlock:3,hb:[20,110,70,140],hitstop:7,shake:5,power:1.3,poses:['math_s','math_a'],label:'SÍMBOLOS DA MATEMÁTICA'}),
  mv('s3',{kind:'special',rank:9,startup:22,active:3,recovery:32,whiff:10,dmg:62,hitstun:25,blockstun:14,kb:10,kbBlock:5,hb:[20,110,65,140],hitstop:10,shake:8,power:1.8,poses:['ball_s','ball_a'],label:'ARREMESSO ABSOLUTO'}),
]));

// ---------------------------------------------------------------- JANE / CRISTYAN / ENÉAS
const janePoses:Record<string,Pose>={
  ...Object.fromEntries(Object.entries(caetanoPoses).map(([k,p])=>[k,{...p}])),
  idle:cp({lean:0,head:2,fa1:55,fa2:-80,ba1:112,ba2:-60,fl1:72,fl2:98,bl1:110,bl2:86}),
  laptop_s:cp({lean:4,fa1:35,fa2:-30,ba1:135,ba2:160,fl1:42,fl2:110,bl1:140,bl2:65}),
  laptop_a:cp({lean:18,head:14,fa1:30,fa2:-18,ba1:140,ba2:160,fl1:38,fl2:112,bl1:145,bl2:62}),
  moto_s:cp({lean:24,fa1:15,fa2:-8,ba1:50,ba2:10,fl1:38,fl2:112,bl1:140,bl2:62}),
  moto_a:cp({lean:-10,fa1:-12,fa2:-4,ba1:25,ba2:-15,fl1:20,fl2:105,bl1:150,bl2:65}),
  slide_s:cp({lean:45,fa1:120,fa2:160,ba1:150,ba2:170,fl1:20,fl2:125,bl1:160,bl2:35}),
  slide_a:cp({lean:48,fa1:100,fa2:145,ba1:130,ba2:160,fl1:10,fl2:25,bl1:145,bl2:55}),
  kick_a:cp({lean:-25,fl1:-20,fl2:-15,bl1:105,bl2:94,fa1:80,fa2:-100}),
  zord_s:cp({lean:-6,fa1:-80,fa2:-110,ba1:-125,ba2:-155}),
  zord_a:cp({lean:15,fa1:-10,fa2:-2,ba1:125,ba2:-70,finger:1}),
  dizzy:cp({lean:12,head:18,fa1:90,fa2:65,ba1:120,ba2:90,mouth:.2}),
  win:cp({lean:-4,fa1:-65,fa2:-140,ba1:112,ba2:-40}),
};
const janeMoves=copyNormals(.78,0,-24);
for(const m of Object.values(janeMoves))m.hb=[m.hb[0]*.75,Math.max(65,m.hb[1]),m.hb[2]*.58,m.hb[3]*.65];
Object.assign(janeMoves,Object.fromEntries([
 mv('s1',{kind:'special',rank:9,startup:18,active:12,recovery:22,whiff:0,dmg:18,hitstun:13,blockstun:8,kb:3,kbBlock:2,hb:[15,85,35,100],hitstop:4,shake:3,power:.8,poses:['laptop_s','laptop_a'],label:'FINGINDO QUE TÁ TRABALHANDO'}),
 mv('s2',{kind:'special',rank:9,startup:12,active:300,recovery:24,whiff:0,dmg:11,hitstun:13,blockstun:8,kb:3,kbBlock:2,hb:[-65,110,0,115],hitstop:4,shake:4,power:.9,poses:['moto_s','moto_a'],label:'DANDO GRAU DE MOTO'}),
 mv('s3',{kind:'special',rank:9,startup:30,active:6,recovery:25,whiff:10,dmg:58,hitstun:23,blockstun:13,kb:6,kbBlock:4,hb:[-35,115,-10,100],level:'high',launch:4,launchVx:3,hitstop:8,shake:7,power:1.4,poses:['slide_s','kick_a'],advance:[1,17,9],turn:[24,36],trail:'fa',label:'POR BAIXO, SALTO E GIRO'}),
]));
const cristyanPoses:Record<string,Pose>={
 ...Object.fromEntries(Object.entries(caetanoPoses).map(([k,p])=>[k,{...p}])),
 idle:cp({lean:5,fa1:25,fa2:-100,ba1:75,ba2:-120,fl1:66,fl2:100,bl1:120,bl2:82}),
 teep_s:cp({lean:-5,fl1:5,fl2:130,fa1:35,fa2:-105,ba1:90,ba2:-110}),
 teep_a:cp({lean:-24,fl1:-5,fl2:-3,bl1:101,bl2:88,fa1:45,fa2:-105,ba1:100,ba2:-100}),
 power_s:cp({lean:-26,ba1:135,ba2:-150,fa1:15,fa2:-100}),
 power_a:cp({lean:28,ba1:-3,ba2:0,fa1:95,fa2:-110,fl1:50,fl2:100,bl1:135,bl2:90}),
 spin_s:cp({lean:-15,fl1:10,fl2:135,fa1:-50,fa2:-110,ba1:130,ba2:170}),
 spin_a:cp({lean:-35,fl1:-20,fl2:-18,bl1:100,bl2:90,fa1:-120,fa2:-155,ba1:145,ba2:165}),
 hammock_s:cp({lean:8,fa1:20,fa2:-15,ba1:150,ba2:160}),
 hammock_a:cp({lean:-10,fa1:-80,fa2:-120,ba1:-115,ba2:-150,fl1:35,fl2:110,bl1:135,bl2:70}),
 slam_a:cp({lean:40,fa1:38,fa2:25,ba1:70,ba2:42,fl1:35,fl2:110,bl1:145,bl2:60}),
};
const cristyanMoves=copyNormals(.99,1,4);
Object.assign(cristyanMoves,Object.fromEntries([
 mv('s1',{kind:'special',rank:9,startup:11,active:4,recovery:23,whiff:10,dmg:62,hitstun:21,blockstun:13,kb:12,kbBlock:5,hb:[20,158,40,132],hitstop:8,shake:7,power:1.5,poses:['teep_s','teep_a'],trail:'fa',label:'CHUTE TEEP EMPURRANDO'}),
 mv('s2',{kind:'special',rank:9,startup:21,active:4,recovery:32,whiff:16,dmg:90,hitstun:26,blockstun:15,kb:13,kbBlock:6,hb:[15,135,80,145],launch:7,launchVx:10,hitstop:12,shake:13,power:2.1,poses:['power_s','power_a'],trail:'bw',charge:true,label:'SOCO PODEROSO'}),
 mv('s3',{kind:'special',rank:9,startup:17,active:7,recovery:28,whiff:12,dmg:74,hitstun:23,blockstun:14,kb:8,kbBlock:5,hb:[-45,155,40,160],launch:5,launchVx:5,hitstop:9,shake:9,power:1.8,poses:['spin_s','spin_a'],advance:[10,21,2.4],trail:'fa',turn:[5,22],label:'PIRUETA COM CHUTE'}),
]));
const eneasPoses:Record<string,Pose>={
 ...Object.fromEntries(Object.entries(caetanoPoses).map(([k,p])=>[k,{...p}])),
 idle:cp({lean:1,fa1:55,fa2:-65,ba1:105,ba2:-65,fl1:77,fl2:94,bl1:107,bl2:88}),
 shout_s:cp({lean:-15,head:-12,fa1:30,fa2:-80,ba1:115,ba2:-70}),
 shout_a:cp({lean:20,head:10,fa1:95,fa2:15,ba1:135,ba2:65,mouth:1}),
 ecg_s:cp({lean:8,fa1:15,fa2:-90,ba1:110,ba2:-60}),
 ecg_a:cp({lean:18,fa1:-5,fa2:0,ba1:125,ba2:-70,finger:1}),
 five_s:cp({lean:-8,fa1:-55,fa2:-100,ba1:110,ba2:-65}),
 five_a:cp({lean:15,fa1:-8,fa2:0,ba1:120,ba2:-65}),
 six_a:cp({lean:20,fa1:25,fa2:10,ba1:130,ba2:145}),
 atom_s:cp({lean:-4,fa1:-10,fa2:-105,ba1:110,ba2:-70,finger:1}),
 atom_a:cp({lean:24,fa1:30,fa2:15,ba1:130,ba2:-40,mouth:1}),
};
const eneasMoves=copyNormals(.98,2,10);
Object.assign(eneasMoves,Object.fromEntries([
 mv('s1',{kind:'special',rank:9,startup:18,active:8,recovery:28,whiff:12,dmg:60,hitstun:25,blockstun:14,kb:11,kbBlock:6,hb:[15,275,20,180],hitstop:8,shake:10,power:1.7,poses:['shout_s','shout_a'],label:'MEU NOME É ENÉAS!'}),
 mv('s2',{kind:'special',rank:9,startup:20,active:3,recovery:29,whiff:8,dmg:46,hitstun:22,blockstun:13,kb:6,kbBlock:3,hb:[20,110,65,140],hitstop:7,shake:6,power:1.3,poses:['ecg_s','ecg_a'],label:'DIAGNÓSTICO FATAL'}),
 mv('s3',{kind:'special',rank:9,startup:22,active:14,recovery:30,whiff:8,dmg:28,hitstun:21,blockstun:11,kb:3,kbBlock:2,hb:[20,110,55,145],launch:8,launchVx:2,hitstop:5,shake:6,power:1.2,poses:['five_s','five_a'],recoveryPose:'six_a',label:'56 NA TESTA!'}),
]));

export const CHARS: Record<CharId, CharDef> = {
  caetano: {
    id: 'caetano',
    name: 'KARATÊ CAETANO',
    short: 'CAETANO',
    title: 'O MAIOR ARTISTA MARCIAL DO MUNDO (segundo ele)',
    color: '#f97316',
    color2: '#9a3412',
    glow: '#fed7aa',
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
    bio: 'Técnico: defesa precisa carrega um Dedilho reforçado. Confirme o Dedilho em Chute para estender combos.',
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
    bio: 'Agressivo: acertos acumulam Ímpeto, aumentando dano e avanço. Agarrões punem rivais defensivos.',
  },
  tubarao: {
    id: 'tubarao', name: 'TUBARÃO FISCAL', short: 'TUBARÃO', title: 'O FISCAL DOS SETE MARES',
    color: '#06b6d4', color2: '#155e75', glow: '#a5f3fc',
    hp: 1230, walk: 3.25, walkBack: 2.6, jumpVy: 15.5, jumpVx: 4, dashVx: 8.5, dashDur: 17,
    pushW: 39, hurtH: 196, crouchH: 122, moves: tubaraoMoves, poses: tubaraoPoses,
    attrs: [{ label: 'VELOCIDADE', v: 2 }, { label: 'FORÇA', v: 5 }, { label: 'ALCANCE', v: 4 }, { label: 'RESISTÊNCIA', v: 5 }, { label: 'MOBILIDADE', v: 3 }],
    specials: [
      { key: 'U', name: 'MORDIDA', desc: 'Avança com uma mordida poderosa. Pode ser defendida.' },
      { key: 'I', name: 'ENGOLE', desc: 'Agarrão de perto: engole e cospe o rival. Ignora defesa.' },
      { key:'O',name:'BEIJO DO FISCALIZADOR',desc:'Beijo de perto com corações e 64 de dano. Bloqueável, sem armadura; errar deixa uma abertura.' },
    ],
    superName:'QUANDO TERÁ LIVE?', quote: 'SUA DECLARAÇÃO CAIU NA MALHA FINA.',
    bio:'Mordidas, Engole e um Beijo de perto. Na ULT, vira um tubarão com rosto humanoide, lambe o rival e o lança para longe com uma rabada.',
  },
  rickzera: {
    id: 'rickzera', name: 'RICKZERA', short: 'RICKZERA', title: 'O REI DAS TRANSFERÊNCIAS',
    color: '#22c55e', color2: '#166534', glow: '#bbf7d0',
    hp: 940, walk: 4.8, walkBack: 3.9, jumpVy: 16, jumpVx: 5.6, dashVx: 12, dashDur: 14,
    pushW: 26, hurtH: 172, crouchH: 108, moves: rickzeraMoves, poses: rickzeraPoses,
    attrs: [{ label: 'VELOCIDADE', v: 5 }, { label: 'FORÇA', v: 2 }, { label: 'ALCANCE', v: 5 }, { label: 'RESISTÊNCIA', v: 2 }, { label: 'MOBILIDADE', v: 5 }],
    specials: [
      { key: 'U', name: 'ARREMESSO DO FRANCO SUÍÇO', desc: 'Arremessa três notas em sequência. A rajada pode ser defendida e conta como um uso de distância.' },
      { key: 'I', name: 'SOCO INGLÊS', desc: 'Soco descendente com energia verde e soco inglês dourado na mão esquerda. Esmaga o rival no chão e abre uma cratera. Defenda em pé; errar deixa uma abertura.' },
      { key: 'O', name: 'DOUBLE JUMP', desc: 'Salto com chute; no ar, ganha um segundo impulso. A tecla de pulo também dá o segundo salto.' },
    ],
    superName: 'WISE 6X', quote: 'TRANSFERÊNCIA CONCLUÍDA. SEIS VEZES.',
    bio: 'Camiseta preta, calça cargo bege e soco inglês dourado na mão esquerda. Pressiona com três francos suíços, derrubada de perto e salto duplo.',
  },
  bieu: {
    id: 'bieu', name: 'BIEUBATMAN', short: 'BIEU', title: 'O PRESTÍGIO DA RUA',
    color: '#a855f7', color2: '#581c87', glow: '#e9d5ff',
    hp: 1080, walk: 3.9, walkBack: 3.1, jumpVy: 16, jumpVx: 4.8, dashVx: 10, dashDur: 16,
    pushW: 30, hurtH: 178, crouchH: 110, moves: bieuMoves, poses: bieuPoses,
    attrs: [{ label: 'VELOCIDADE', v: 3 }, { label: 'FORÇA', v: 4 }, { label: 'ALCANCE', v: 4 }, { label: 'RESISTÊNCIA', v: 4 }, { label: 'MOBILIDADE', v: 3 }],
    specials: [
      { key: 'U', name: 'CHAVE DE FENDA', desc: 'Estocada de perto que atravessa parte da defesa.' },
      { key: 'I', name: 'JOGAR RATO', desc: 'Rato pelo chão: pule ou use defesa agachada.' },
      { key: 'O', name: 'PICHAÇÃO', desc: 'Nuvem de tinta que permanece e pressiona com até quatro acertos.' },
    ],
    superName: 'PRESTÍGIO', quote: 'PASSANDO COM PRESTÍGIO.',
    bio: 'Regata branca, cachos curtos e atitude. Combina pressão de perto, rato rasteiro e controle com tinta.',
  },
  nomad: {
    id: 'nomad', name: 'NOMAD LOBBY', short: 'NOMAD', title: 'O DONO DA ARENA',
    color: '#f59e0b', color2: '#9a3412', glow: '#fde68a',
    hp: 1100, walk: 3.6, walkBack: 2.9, jumpVy: 15.8, jumpVx: 4.5, dashVx: 9.4, dashDur: 16,
    pushW: 33, hurtH: 171, crouchH: 104, moves: nomadMoves, poses: nomadPoses,
    attrs: [{ label: 'VELOCIDADE', v: 3 }, { label: 'FORÇA', v: 4 }, { label: 'ALCANCE', v: 5 }, { label: 'RESISTÊNCIA', v: 4 }, { label: 'MOBILIDADE', v: 3 }],
    specials: [
      { key: 'U', name: 'MARIO BURGER', desc: 'Arremessa um hambúrguer que empurra o adversário.' },
      { key: 'I', name: 'RAJADA DE GLOCK', desc: 'Três disparos altos: agache para evitar ou defenda em pé.' },
      { key: 'O', name: 'BOOMERANG', desc: 'Vai e volta, podendo acertar uma vez em cada trajeto.' },
    ],
    superName: 'ARENA', quote: 'BEM-VINDO À MINHA ARENA.',
    bio: 'Boné vermelho, macacão azul e barba loira. Domina a distância com lanche, rajada e boomerang.',
  },
  renngotti: {
    id: 'renngotti', name: 'RENNGOTTI', short: 'RENNGOTTI', title: 'A VOZ DO CAOS',
    color: '#e2e8f0', color2: '#475569', glow: '#f8fafc',
    hp: 1020, walk: 4.1, walkBack: 3.3, jumpVy: 16.2, jumpVx: 5, dashVx: 10.5, dashDur: 15,
    pushW: 29, hurtH: 180, crouchH: 110, moves: renngottiMoves, poses: renngottiPoses,
    attrs: [{ label: 'VELOCIDADE', v: 4 }, { label: 'FORÇA', v: 3 }, { label: 'ALCANCE', v: 4 }, { label: 'RESISTÊNCIA', v: 3 }, { label: 'MOBILIDADE', v: 4 }],
    specials: [
      { key: 'U', name: 'JOGA PRA LUA', desc: 'Agarrão de perto que lança alto e abre espaço para um combo aéreo.' },
      { key: 'I', name: 'JOGAR MICROFONE', desc: 'Arremessa o microfone em arco para pressionar à distância.' },
      { key: 'O', name: 'GRITO ALTO', desc: 'Onda sonora à frente: interrompe golpes e empurra. Pode ser defendida.' },
    ],
    superName: 'TILT', quote: 'A MESA NÃO AGUENTOU O TILT.',
    bio: 'Alcance: o microfone vira armadilha ao cair. Grito amplia sua zona de ressonância; agarrão lunar abre juggle.',
  },
  aneninha: {
    id: 'aneninha', name: 'ANENINHA', short: 'ANENINHA', title: 'OSASCO NO CORAÇÃO, BOLÍVIA NO RITMO',
    color: '#ec4899', color2: '#9d174d', glow: '#fbcfe8',
    hp: 1000, walk: 4.3, walkBack: 3.5, jumpVy: 16.3, jumpVx: 5.1, dashVx: 10.8, dashDur: 15,
    pushW: 27, hurtH: 169, crouchH: 105, moves: aneninhaMoves, poses: aneninhaPoses,
    attrs: [{ label: 'VELOCIDADE', v: 4 }, { label: 'FORÇA', v: 3 }, { label: 'ALCANCE', v: 4 }, { label: 'RESISTÊNCIA', v: 3 }, { label: 'MOBILIDADE', v: 4 }],
    specials: [
      { key: 'U', name: 'SOCO DE OSASCO', desc: 'Soco com avanço que lança e abre combos.' },
      { key: 'I', name: 'PICHAR MURO PARA REPRESENTAR OSASCO', desc: 'Pinta um muro que pressiona com até três acertos. Pode ser defendido ou saltado.' },
      { key: 'O', name: 'GRITO ALTO', desc: 'Onda de voz frontal que interrompe e empurra. Pode ser defendida.' },
    ],
    superName: 'YO SOY DE BOLIVIA', quote: 'OSASCO NO CORAÇÃO, BOLÍVIA NO RITMO!',
    bio: 'Imprevisível: baixo + ESP 1 vira rasteira; frente + ESP 2 pinta atrás do rival próximo. Alterne alturas e lados.',
  },
  santox: {
    id:'santox',name:'1SANT0X',short:'1SANT0X',title:'O COELHO FORA DO ROTEIRO',
    color:'#c026d3',color2:'#581c87',glow:'#f5d0fe',
    hp:950,walk:4.15,walkBack:3.3,jumpVy:16.4,jumpVx:5,dashVx:10,dashDur:15,
    pushW:26,hurtH:186,crouchH:111,moves:santoxMoves,poses:santoxPoses,
    attrs:[{label:'VELOCIDADE',v:4},{label:'FORÇA',v:2},{label:'ALCANCE',v:5},{label:'RESISTÊNCIA',v:2},{label:'MOBILIDADE',v:4}],
    specials:[
      {key:'U',name:'SOCO ELÁSTICO A LONGA DISTÂNCIA',desc:'Alcance de 370, dano moderado e recuperação longa. Pode ser bloqueado; conta no limite de longa distância.'},
      {key:'I',name:'CHUTE DO COELHO',desc:'Pequeno salto com chute alto que lança. Defenda em pé e puna a aterrissagem.'},
      {key:'O',name:'QUEBRAR A QUARTA PAREDE',desc:'Olha para a câmera e sorri: evita golpes por 0,3 s após a preparação. Recarga de 8 s e recuperação vulnerável.'},
    ],
    superName:'ABSTRAÇÃO',quote:'VOCÊ ESTÁ JOGANDO. EU ESTOU OLHANDO.',
    bio:'Alcance elástico e esquiva calculada. Acerte à média distância; a Quarta Parede exige antecipação e não causa dano.',
  },
  jao: {
    id:'jao',name:'JaoDoPikles',short:'JAODOPIKLES',title:'CADA ROUND É UMA EQUAÇÃO',
    color:'#818cf8',color2:'#312e81',glow:'#e0e7ff',
    hp:990,walk:3.8,walkBack:3.1,jumpVy:15.6,jumpVx:4.5,dashVx:9.1,dashDur:16,
    pushW:28,hurtH:177,crouchH:108,moves:jaoMoves,poses:jaoPoses,
    attrs:[{label:'VELOCIDADE',v:3},{label:'FORÇA',v:3},{label:'ALCANCE',v:4},{label:'RESISTÊNCIA',v:3},{label:'TÉCNICA',v:5}],
    specials:[
      {key:'U',name:'TABULEIRO DE XADREZ',desc:'Uma zona por vez, por até 3 s: reduz em 35% o avanço no chão. Pule para escapar; acertar Jao desfaz o tabuleiro.'},
      {key:'I',name:'SÍMBOLOS DA MATEMÁTICA',desc:'Dispara uma fórmula em linha reta. Um acerto, dano moderado, sem perseguição.'},
      {key:'O',name:'ARREMESSO ABSOLUTO',desc:'Bola em arco com um quique: atordoa e empurra. Pode ser defendida ou saltada.'},
    ],
    superName:'CHESS IS LIFE',quote:'XEQUE-MATE. A CONTA FECHOU.',
    bio:'Estratégia com xadrez, matemática e basquete. Crie espaço com o tabuleiro, depois confirme a fórmula ou o arremesso.',
  },
  jane:{
    id:'jane',name:'JANE',short:'JANE',title:'PEQUENA NO TAMANHO, GIGANTE NO DEPLOY',
    color:'#eab308',color2:'#854d0e',glow:'#fef08a',
    hp:860,walk:4.6,walkBack:3.7,jumpVy:15.8,jumpVx:5.4,dashVx:11,dashDur:14,pushW:20,hurtH:115,crouchH:72,moves:janeMoves,poses:janePoses,
    attrs:[{label:'VELOCIDADE',v:5},{label:'FORÇA',v:2},{label:'ALCANCE',v:3},{label:'RESISTÊNCIA',v:2},{label:'MOBILIDADE',v:5}],
    specials:[
      {key:'U',name:'FINGINDO QUE TÁ TRABALHANDO',desc:'Cochila com o laptop e lança dois comandos Java. Dano baixo; a dupla conta como um uso à distância.'},
      {key:'I',name:'DANDO GRAU DE MOTO',desc:'Segure até 5 s. Soltar a tempo dispara uma arrancada sem controle; ambos compartilham seis contatos. Exceder o limite causa queda e tontura de 1 s. Recarga de 3 s.'},
      {key:'O',name:'POR BAIXO, SALTO E GIRO',desc:'Desliza, vira, salta e anuncia um chute giratório aéreo. Defenda em pé ou puna a recuperação; baixos interrompem a passagem.'},
    ],
    superName:'AREIAZORD',quote:'FUNCIONA NA MINHA MÁQUINA. E NO MEU ROBÔ.',
    bio:'Adulta de baixa estatura, loira com franja e jaqueta branca. Mobilidade e comandos Java compensam vida e alcance curtos.',
  },
  cristyan:{
    id:'cristyan',name:'CRISTYAN',short:'CRISTYAN',title:'O PESO DO MUAY THAI BAIANO',
    color:'#f97316',color2:'#7c2d12',glow:'#fed7aa',
    hp:1060,walk:3.9,walkBack:3.1,jumpVy:15.7,jumpVx:4.6,dashVx:9.6,dashDur:16,pushW:30,hurtH:179,crouchH:109,moves:cristyanMoves,poses:cristyanPoses,
    attrs:[{label:'VELOCIDADE',v:3},{label:'FORÇA',v:4},{label:'ALCANCE',v:3},{label:'RESISTÊNCIA',v:4},{label:'TÉCNICA',v:4}],
    specials:[
      {key:'U',name:'CHUTE TEEP EMPURRANDO',desc:'Chute frontal que afasta o rival. Pode ser defendido; use para controlar o espaço.'},
      {key:'I',name:'SOCO PODEROSO',desc:'Prepara um soco que arremessa para longe. O erro deixa uma recuperação longa e vulnerável.'},
      {key:'O',name:'PIRUETA COM CHUTE',desc:'Gira com um chute amplo de um acerto. Sem invulnerabilidade: antecipe ou defenda.'},
    ],
    superName:'REDE BAIANA',quote:'DESCANSOU? AGORA ACORDA PRA REVANCHE.',
    bio:'Pressão de perto com teep, força e giro. Precisa se aproximar e confirmar acertos; não tem projéteis.',
  },
  eneas:{
    id:'eneas',name:'DOUTOR ENÉAS',short:'ENÉAS',title:'CIÊNCIA EM VOLUME MÁXIMO',
    color:'#22c55e',color2:'#166534',glow:'#fef08a',
    hp:1080,walk:3.2,walkBack:2.6,jumpVy:15,jumpVx:4,dashVx:8.5,dashDur:17,pushW:31,hurtH:184,crouchH:114,moves:eneasMoves,poses:eneasPoses,
    attrs:[{label:'VELOCIDADE',v:2},{label:'FORÇA',v:3},{label:'ALCANCE',v:4},{label:'RESISTÊNCIA',v:4},{label:'CIÊNCIA',v:5}],
    specials:[
      {key:'U',name:'MEU NOME É ENÉAS!',desc:'Onda sonora de médio alcance que atordoa brevemente e empurra. Pode ser defendida.'},
      {key:'I',name:'DIAGNÓSTICO FATAL',desc:'Dispara um eletrocardiograma elétrico pelo estetoscópio. No acerto: CASO GRAVE!'},
      {key:'O',name:'56 NA TESTA!',desc:'O 5 lança e o 6 derruba. Dois projéteis bloqueáveis; a sequência conta como um uso à distância.'},
    ],
    superName:'BOMBA ATÔMICA BRASILEIRA',quote:'MEU NOME É ENÉAS!',
    bio:'Médio alcance com voz, ECG e números. Preparação e recuperação lentas exigem controlar a distância e respeitar a recarga.',
  },
  ...createWocFighters(copyNormals,caetanoPoses),
};

// Preserve the legacy eneas key for stored profiles, rooms and match history.
// The replacement is Dr. Acreano everywhere visible to players.
export const BASE_HP=Object.fromEntries(CHAR_IDS.map(id=>[id,CHARS[id].hp])) as Record<CharId,number>;
for(const def of Object.values(CHARS))def.hp*=2;
CHARS.eneas.name='DR. ACREANO';CHARS.eneas.short='ACREANO';CHARS.eneas.quote='MEU NOME É ACREANO!';
CHARS.eneas.moves.s1.label='MEU NOME É ACREANO!';CHARS.eneas.specials[0].name='MEU NOME É ACREANO!';
CHARS.caetano.superName='SEQUÊNCIA DE GOLPES KARATEKA';CHARS.caetano.moves.s1.label='CHUTE SENBUKAN';CHARS.caetano.moves.s1.sound=undefined;
CHARS.caetano.specials[0]={key:'U',name:'CHUTE SENBUKAN',desc:'Chute giratório com energia laranja. Preparação, defesa e punição preservadas.'};
CHARS.orango.superName='INSTINTO DESCONTROLADO';CHARS.tubarao.name='TUBARÃO FISCALIZADOR';
CHARS.rickzera.superName='COMBO WISE';CHARS.rickzera.bio='Mercenário atlético. Segure CARREGAR em neutro ou receba dano para acumular energia. Especiais consomem energia, separada da stamina e da ULT.';
CHARS.rickzera.specials=[{key:'U',name:'PROJETOS DE TRANSFERÊNCIAS',desc:'Converte 16 de energia em três orbes verdes. Uma rajada conta como um uso de distância.'},{key:'I',name:'SOCO DE ENERGIA',desc:'Gasta 22 de energia em uma projeção de punho verde, bloqueável e sem rastreamento.'},{key:'O',name:'SALTO DE ENERGIA',desc:'Gasta 18 de energia para um salto elevado. O segundo impulso no ar também tem custo.'}];
for(const [i,k]of ['s1','s2','s3'].entries())CHARS.rickzera.moves[k].label=CHARS.rickzera.specials[i].name;
Object.assign(CHARS.rickzera.moves.s2,{dmg:72,startup:18,active:3,recovery:28,whiff:10,launch:0,spike:false,kb:8,advance:undefined,poses:['pH_s','pH_a']});
RANGED_MOVES.rickzera=['s1','s2'];
CHARS.bieu.color='#22b8ef';CHARS.bieu.glow='#a5e9ff';CHARS.bieu.superName='CRIAS DO CAPÃO REDONDO';
CHARS.nomad.color='#9ae042';CHARS.nomad.color2='#4b1689';CHARS.nomad.glow='#d7b4ff';CHARS.nomad.specials[0].name='BURGER CÓSMICO';CHARS.nomad.specials[1]={key:'I',name:'SOCO GIGANTE',desc:'Punho cósmico de alcance médio, preparação visível e recuperação longa. Pode ser defendido.'};CHARS.nomad.specials[2].name='BOOMERANG NÔMADE';
Object.assign(CHARS.nomad.moves.s2,{startup:20,active:4,recovery:30,whiff:12,dmg:72,hb:[15,180,55,155],poses:['pH_s','pH_a'],label:'SOCO GIGANTE',level:'mid',kb:9});RANGED_MOVES.nomad=['s1','s3'];
CHARS.aneninha.superName='CRIAS DE OSASCO';CHARS.aneninha.specials[2]={key:'O',name:'LANÇAR BARATAS',desc:'Barata rasteira de um acerto. Salte ou use defesa agachada.'};Object.assign(CHARS.aneninha.moves.s3,{dmg:38,level:'low',launch:0,label:'LANÇAR BARATAS'});
CHARS.santox.title='A LOUCURA CÔMICA';CHARS.jao.color='#9333ea';CHARS.jao.glow='#d8b4fe';
CHARS.jane.hurtH=96;CHARS.jane.crouchH=60;
CHARS.cristyan.color='#eab308';CHARS.cristyan.glow='#fef08a';CHARS.cristyan.specials[2]={key:'O',name:'JOELHADA DO GARUDA',desc:'Joelhada giratória anunciada. Um acerto, sem invulnerabilidade e com recuperação punível.'};CHARS.cristyan.moves.s3.label='JOELHADA DO GARUDA';

// Multi-hit projectiles/zones cost less chip per contact than committed single hits.
export const SPECIAL_CHIP:Record<CharId,readonly [number,number,number]>={
  caetano:[.04,.08,.06],orango:[.06,0,0],tubarao:[.05,0,.025],
  rickzera:[.025,.015,.025],bieu:[.06,.03,.015],nomad:[.03,.01,.02],
  renngotti:[0,.04,.04],aneninha:[.04,.015,.035],santox:[.035,.04,0],
  jao:[0,.025,.035],jane:[.015,.015,.035],cristyan:[.035,.05,.04],eneas:[.04,.035,.025],patrick:[.03,.035,.06],gabrielzin:[.02,0,.02],ulisses:[.03,0,.025],felipence:[.035,.03,.04],hdsh:[0,.025,.03],
};
for(const id of CHAR_IDS)for(const [i,key] of ['s1','s2','s3'].entries())CHARS[id].moves[key].chip=SPECIAL_CHIP[id][i];

// Only quick grounded normals get a one-frame adjustment. Heavy/special risk is intact.
for(const def of Object.values(CHARS))for(const move of Object.values(def.moves))
  if(move.kind==='normal'&&!move.air&&move.rank===1)move.startup=Math.max(3,move.startup-1);

// Universal committed close-range normal. Preserve each fighter's stance,
// silhouette and strength instead of giving a ranged or invulnerable attack.
for(const def of Object.values(CHARS)){
  def.poses.headbutt_s={...def.poses.idle,lean:-12,head:12,fa1:65,fa2:-95,ba1:90,ba2:-105};
  def.poses.headbutt_a={...def.poses.idle,lean:40,head:-22,fa1:88,fa2:-65,ba1:120,ba2:-85,mouth:1};
  def.moves.headbutt=mv('headbutt',{rank:3,startup:14,active:3,recovery:24,whiff:12,
    dmg:Math.round(def.moves.pM.dmg*1.05),hitstun:20,blockstun:12,kb:5,kbBlock:3,
    hb:[15,Math.round(def.hurtH*.34+25),Math.round(def.hurtH*.45),Math.round(def.hurtH*.94)],
    poses:['headbutt_s','headbutt_a'],hitstop:8,shake:5,power:1.2,label:'CABEÇADA'})[1];
}

for(const ch of CHAR_IDS)applyAccessoryNormals(ch,CHARS[ch].moves);

export function movePhase(move:Move,frame:number,connected:boolean){
  if(frame<move.startup)return {phase:'startup' as const,progress:0};
  if(frame<move.startup+move.active)return {phase:'active' as const,progress:0};
  const duration=move.recovery+(connected?0:move.whiff);
  return {phase:'recovery' as const,progress:Math.min(1,Math.max(0,(frame-move.startup-move.active+1)/Math.max(1,duration)))};
}

// Presentation strength only: never changes damage, hitstun or knockback.
export function impactStrength(move:Move){
  return move.kind==='normal'?(move.rank===1?.55:move.rank===2?1:1.65):move.power;
}

export const NORMAL_BY_RANK: Record<string, string[]> = { p: ['pL', 'pM', 'pH'], k: ['kL', 'kM', 'kH'] };
