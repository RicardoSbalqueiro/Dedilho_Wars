import { matchupLine, FINISHER_CALLS } from './presentation';
import { challengeDefinition, challengeAvailable, saveChallengeBadge } from './challenges';
import type { ChallengeId, ChallengeProgress } from './challenges';
// Lógica de combate (separada da renderização).
import { CHARS, NORMAL_BY_RANK, RANGED_MOVES } from './data';
import type { CharDef, CharId, Move, Pose } from './data';
import { ACTIONS, Pad, keyboard } from './input';
import type { Bindings } from './input';
import { audio } from './audio';
import { computeRig, lerpPose } from './rig';
import type { Rig, P2 } from './rig';
import { FLOOR_Y } from './stage';
import type { StageId } from './stage';
import { aiAct, aiMashRate, newAI } from './ai';
import type { AIState } from './ai';

export type Difficulty = 'easy' | 'normal' | 'hard';
export type Mode = 'ai' | 'versus' | 'training';
export type State = 'ground' | 'jump' | 'dash' | 'attack' | 'hit' | 'block' | 'launched' | 'down' | 'getup' | 'seq' | 'cine' | 'win' | 'dizzy';

export const GRAV = 0.85;
export const METER_GAIN_SCALE = 0.5;
export const settings = { shake: 1, hitboxes: false };

export interface GameConfig {
  mode: Mode;
  p1: CharId;
  p2: CharId;
  stage?: StageId;
  difficulty: Difficulty;
  bindings: [Bindings, Bindings];
  online?: boolean;
}

export interface GameEvent {
  type: 'pause' | 'matchEnd';
  paused?: boolean;
  winner?: number;
}

export interface Particle {
  type: 'spark' | 'dust' | 'ring' | 'streak' | 'leaf' | 'glow' | 'text';
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  g: number;
  rot: number;
  grow: number;
  text?: string;
}

export interface Fighter {
  idx: 0 | 1;
  ch: CharId;
  def: CharDef;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  hp: number;
  maxHp: number;
  dispHp: number;
  meter: number;
  state: State;
  stateT: number;
  move: Move | null;
  moveT: number;
  connected: boolean;
  hitDone: boolean;
  hbActive: boolean;
  serial: number;
  hitstun: number;
  blockstun: number;
  stunLow: boolean;
  crouch: boolean;
  guard: boolean;
  walking: number;
  landLag: number;
  airAttacked: boolean;
  airJumps: number;
  precision:number;
  parryCooldown:number;
  momentum:number;
  momentumT:number;
  throwShield:number;
  throwTechUntil:number;
  rangedUses: number;
  rangedCooldown: number;
  fourthCooldown: number;
  bikeCooldown:number;
  bikeTicks:number;
  bikeHits:number;
  bikeNextHit:number;
  bikeDizzy:number;
  hidden: boolean;
  juggle: number;
  invuln: number;
  armor: boolean;
  ko: boolean;
  pad: Pad;
  cpu: boolean;
  ai: AIState;
  pose: Pose;
  poseOverride: string | null;
  rig: Rig;
  animT: number;
  turn: number;
  rotAdd: number;
  exprT: number;
  exprOverride: 'n' | 'hit' | 'shout';
  expr: 'n' | 'hit' | 'shout';
  glow: number;
  aura: number;
  trail: P2[];
  comboHits: number;
  comboDmg: number;
  wins: number;
}

interface Seq {
  kind: 'puxao' | 'mordida' | 'engole' | 'superC' | 'superO' | 'superT' | 'superR' | 'superB' | 'superN' | 'superG' | 'superA' | 'superS' | 'superJ' | 'superJane' | 'superCristyan' | 'superEneas' | 'moon' | 'throw';
  a: Fighter;
  d: Fighter;
  t: number;
  dur: number;
  x0: number;
}

export interface Projectile {
  owner: 0 | 1;
  kind: 'franco' | 'pix' | 'rat' | 'spray' | 'burger' | 'bullet' | 'boomerang' | 'bazooka' | 'microphone' | 'osasco' | 'chess' | 'formula' | 'basketball' | 'java' | 'ecg' | 'five' | 'six';
  bounces?: number;
  age?: number;
  returning?: boolean;
  anchored?:boolean;
  resonating?:boolean;
  hitMask?: number;
  hitCount?: number;
  lastHitAt?: number;
  radius?: number;
  vy?: number;
  x: number;
  y: number;
  vx: number;
  life: number;
  serial: number;
  move: Move;
}

export interface Cine {
  f: Fighter;
  t: number;
  dur: number;
}

export interface Clash {
  a: Fighter;
  b: Fighter;
  t: number;
  c: [number, number];
  m: [Move, Move];
  x: number;
}

const easeOut = (u: number) => 1 - (1 - u) * (1 - u);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const rand = (a: number, b: number) => a + Math.random() * (b - a);

function makeFighter(idx: 0 | 1, ch: CharId, cpu: boolean): Fighter {
  const def = CHARS[ch];
  const pose = { ...def.poses.idle };
  return {
    idx,
    ch,
    def,
    x: idx === 0 ? 560 : 1040,
    y: 0,
    vx: 0,
    vy: 0,
    facing: idx === 0 ? 1 : -1,
    hp: def.hp,
    maxHp: def.hp,
    dispHp: def.hp,
    meter: 0,
    state: 'ground',
    stateT: 0,
    move: null,
    moveT: 0,
    connected: false,
    hitDone: false,
    hbActive: false,
    serial: 0,
    hitstun: 0,
    blockstun: 0,
    stunLow: false,
    crouch: false,
    guard: false,
    walking: 0,
    landLag: 0,
    airAttacked: false,
    airJumps: 0,
    precision:0,parryCooldown:0,momentum:0,momentumT:0,throwShield:0,throwTechUntil:0,
    rangedUses: 0,
    rangedCooldown: 0,
    fourthCooldown: 0,
    bikeCooldown:0,bikeTicks:0,bikeHits:0,bikeNextHit:0,bikeDizzy:0,
    hidden: false,
    juggle: 0,
    invuln: 0,
    armor: false,
    ko: false,
    pad: new Pad(),
    cpu,
    ai: newAI(),
    pose,
    poseOverride: null,
    rig: computeRig(ch, pose),
    animT: Math.floor(Math.random() * 100),
    turn: 1,
    rotAdd: 0,
    exprT: 0,
    exprOverride: 'n',
    expr: 'n',
    glow: 0,
    aura: 0,
    trail: [],
    comboHits: 0,
    comboDmg: 0,
    wins: 0,
  };
}

export class Game {
  cfg: GameConfig;
  f: [Fighter, Fighter];
  tick = 0;
  hitstop = 0;
  slowmo = 0;
  paused = false;
  phase: 'intro' | 'fight' | 'ko' | 'roundEnd' | 'finishWindow' | 'finisher' | 'matchEnd' = 'intro';
  phaseT = 0;
  round = 1;
  winsNeeded = 2;
  timeLeft = 99;
  timeAcc = 0;
  cam = { x: 800, zoom: 1 };
  camOv: { x: number; zoom: number } | null = null;
  camOvT = 0;
  parts: Particle[] = [];
  projectiles: Projectile[] = [];
  flash = { c: '#fff', a: 0 };
  shake = 0;
  ann: { text: string; sub: string; t: number; dur: number; color: string } | null = null;
  moveBanner: { text: string; color: string; t: number; dur: number } | null = null;
  seq: Seq | null = null;
  cine: Cine | null = null;
  clash: Clash | null = null;
  expl: { t: number; color: string; dur: number } | null = null;
  comboShow: [{ hits: number; dmg: number; t: number }, { hits: number; dmg: number; t: number }] = [
    { hits: 0, dmg: 0, t: 0 },
    { hits: 0, dmg: 0, t: 0 },
  ];
  train = { dummy: 0, lastDmg: 0, combo: 0, total: 0, idle: 0, maxCombo: 0 };
  challenge: ChallengeProgress | null = null;
  private challengeSuperSerial = -1;
  hype = 0;
  speed = 0; // intensidade de linhas de velocidade
  perfect = false;
  winner = -1;
  finisher:{winner:0|1;t:number;dur:number}|null=null;
  finishedBy:0|1|null=null;
  elapsedTicks=0;
  onEvent: (e: GameEvent) => void;
  onlineInputs: [number, number] = [0, 0];
  onlinePressed: [number, number] = [0, 0];
  private acc = 0;
  private last = 0;
  private keyHandler: (code: string, e: KeyboardEvent) => void;

  constructor(cfg: GameConfig, onEvent: (e: GameEvent) => void) {
    this.cfg = cfg;
    audio.setArena(cfg.stage||'dojo');
    this.onEvent = onEvent;
    const other = cfg.p2;
    this.f = [makeFighter(0, cfg.p1, false), makeFighter(1, other, cfg.mode === 'ai')];
    this.keyHandler = (code, e) => this.onKey(code, e);
    keyboard.attach();
    keyboard.listeners.push(this.keyHandler);
    this.resetMatch();
  }

  destroy() {
    keyboard.listeners = keyboard.listeners.filter((l) => l !== this.keyHandler);
    keyboard.detach();
    audio.stopMusic();
  }

  get training() {
    return this.cfg.mode === 'training';
  }

  opp(f: Fighter) {
    return this.f[1 - f.idx];
  }

  // ------------------------------------------------------------ controle de partida
  resetMatch() {
    if (this.challenge) this.challenge = {id:this.challenge.id,current:0,done:false,seen:[]};
    for (const f of this.f) {
      f.wins = 0;
      f.meter = 0;
    }
    this.round = 1;
    this.finisher=null;this.finishedBy=null;this.elapsedTicks=0;
    this.winner = -1;
    this.resetRound();
    audio.music('fight');
  }

  restart() {
    this.paused = false;
    this.resetMatch();
  }

  resetRound() {
    for (const f of this.f) {
      f.x = f.idx === 0 ? 560 : 1040;
      f.y = 0;
      f.vx = f.vy = 0;
      f.facing = f.idx === 0 ? 1 : -1;
      f.hp = f.maxHp;
      f.dispHp = f.maxHp;
      f.state = 'ground';
      f.stateT = 0;
      f.move = null;
      f.hbActive = false;
      f.hitstun = f.blockstun = 0;
      f.landLag = 0;
      f.invuln = 0;
      f.armor = false;
      f.ko = false;
      f.crouch = f.guard = false;
      f.poseOverride = null;
      f.rotAdd = 0;
      f.turn = 1;
      f.glow = f.aura = 0;
      f.comboHits = f.comboDmg = 0;
      f.juggle = 0;
      f.airJumps = 0;
      f.throwTechUntil=0;
      f.precision=f.parryCooldown=f.momentum=f.momentumT=f.throwShield=0;
      f.rangedUses = 0;
      f.rangedCooldown = 0;
      f.fourthCooldown = 0;
      f.bikeCooldown=f.bikeTicks=f.bikeHits=f.bikeNextHit=f.bikeDizzy=0;
      f.airAttacked = false;
      f.hidden = false;
      f.trail = [];
      f.pad.reset();
      f.ai = newAI();
      f.pose = { ...f.def.poses.idle };
    }
    this.seq = this.cine = this.clash = this.expl = null;
    this.projectiles = [];
    this.hitstop = 0;
    this.slowmo = 0;
    this.timeLeft = 99;
    this.timeAcc = 0;
    this.perfect = false;
    this.parts = this.parts.filter((p) => p.type === 'leaf');
    this.phaseT = 0;
    this.phase = this.training ? 'fight' : 'intro';
    this.camOv = null;
    if (this.training) this.announce('TREINAMENTO', '', 60, '#fbbf24');
  }

  startChallenge(id: ChallengeId | null) {
    if (!this.training || id && !challengeAvailable(id,this.f[0].ch)) return;
    this.challenge = id ? {id,current:0,done:false,seen:[]} : null;
    this.challengeSuperSerial = -1;
    this.train.dummy = id === 'block' ? 1 : 0;
    this.f[1].cpu = this.train.dummy === 1;
    this.resetPositions();
    this.f[0].x = 650; this.f[1].x = id === 'block' ? 830 : 760;
    this.train.lastDmg = this.train.combo = this.train.total = this.train.maxCombo = 0;
  }

  private challengeEvent(metric: string, amount = 1, token = '') {
    const c=this.challenge;
    if (!this.training || !c || c.done) return;
    const def=challengeDefinition(c.id);
    if (def.metric !== metric) return;
    if (metric === 'special') { if(c.seen.includes(token)) return; c.seen.push(token); }
    c.current=Math.min(def.target,metric === 'combo' ? Math.max(c.current,amount) : c.current+amount);
    if (c.current >= def.target) { c.done=true; saveChallengeBadge(c.id); audio.confirm(); }
  }

  resetPositions() {
    this.resetRound();
    for (const f of this.f) f.meter = 100;
  }

  private onKey(code: string, e: KeyboardEvent) {
    // evita rolagem da página / busca rápida
    const bound = this.cfg.bindings.some((b) => Object.values(b).some((c) => c.includes(code)));
    if (bound || code === 'Escape' || code === 'Space') e.preventDefault();
    if (e.repeat) return;
    if (code === 'Escape' || code === 'KeyP') {
      if (!this.cfg.online) this.togglePause();
    } else if (this.training && !this.paused) {
      if (code === 'KeyR') this.resetPositions();
      if (code === 'KeyT') {
        this.train.dummy = (this.train.dummy + 1) % 4;
        this.f[1].cpu = this.train.dummy === 1;
        this.f[1].pad.reset();
      }
    }
  }

  togglePause(v?: boolean) {
    if (this.phase === 'matchEnd') return;
    this.paused = v === undefined ? !this.paused : v;
    this.onEvent({ type: 'pause', paused: this.paused });
  }

  announce(text: string, sub = '', dur = 70, color = '#ffffff') {
    this.ann = { text, sub, t: 0, dur, color };
  }

  // ------------------------------------------------------------ loop
  advance(nowMs: number) {
    if (!this.last) this.last = nowMs;
    let dt = nowMs - this.last;
    this.last = nowMs;
    if (dt > 100) dt = 100;
    this.acc += dt;
    while (this.acc >= 1000 / 60) {
      this.acc -= 1000 / 60;
      this.step();
    }
  }

  private pollInputs() {
    if (this.cfg.online) {
      for (const f of this.f) {
        ACTIONS.forEach((a,i) => {f.pad.set(a, !!(this.onlineInputs[f.idx] & (1 << i)), this.tick);if ((this.onlinePressed[f.idx] & (1 << i)) && f.pad.pressedAt[a] !== this.tick) f.pad.tap(a,this.tick)});
        this.onlinePressed[f.idx] = 0;
      }
      return;
    }
    const m = this.cfg.mode;
    const human: [boolean, boolean] = m === 'versus' ? [true, true] : m === 'ai' ? [true, false] : [true, this.train.dummy === 3];
    for (let i = 0; i < 2; i++) if (human[i]) this.f[i].pad.pollKeys(this.cfg.bindings[i], this.tick, i === 0);
  }

  step() {
    this.tick++;
    if (this.paused) return;
    for (const f of this.f) {
      if(f.fourthCooldown>0)f.fourthCooldown--;
      if(f.bikeCooldown>0)f.bikeCooldown--;
      if (f.rangedCooldown > 0 && --f.rangedCooldown === 0) { f.rangedUses = 0; if(f.idx===0)this.challengeEvent('range'); }
    }
    this.pollInputs();
    for(const f of this.f)if(f.ch==='jane'&&f.move?.id==='s2'&&f.bikeCooldown===0&&f.moveT>=f.move.startup&&f.moveT<=f.move.startup+f.move.active){
      f.bikeTicks++;
      if(f.bikeTicks>300)this.stopBike(f,!!f.pad.held.s2);
      else if(f.bikeTicks>=12&&!f.pad.held.s2)this.stopBike(f);
    }
    if(this.phase==='fight')this.elapsedTicks++;
    for(const f of this.f){if(f.precision>0)f.precision--;if(f.parryCooldown>0)f.parryCooldown--;if(f.momentumT>0&&--f.momentumT===0)f.momentum=0;}
    if(this.phase==='finishWindow'||this.phase==='finisher'){this.updateFinish();return;}
    if (this.phase !== 'fight') for (const f of this.f) f.pad.reset();

    if (this.camOvT > 0) this.camOvT--;
    else this.camOv = null;
    this.shake *= 0.88;
    if (this.shake < 0.3) this.shake = 0;
    if (this.flash.a > 0) this.flash.a = Math.max(0, this.flash.a - 0.035);
    if (this.ann) {
      this.ann.t++;
      if (this.ann.t > this.ann.dur) this.ann = null;
    }
    if (this.moveBanner) {
      this.moveBanner.t++;
      if (this.moveBanner.t > this.moveBanner.dur) this.moveBanner = null;
    }
    for (const c of this.comboShow) if (c.t > 0) c.t--;
    for (const f of this.f) f.dispHp += (f.hp - f.dispHp) * (f.hp < f.dispHp ? 0.04 : 1);
    if (this.speed > 0) this.speed = Math.max(0, this.speed - 0.04);
    if (this.expl) {
      this.expl.t++;
      if (this.expl.t > this.expl.dur) this.expl = null;
    }

    if (this.hitstop > 0) {
      for(const f of this.f)f.pad.freezeBuffers(this.tick);
      this.hitstop--;
      this.updateCamera();
      return;
    }
    if (this.slowmo > 0) {
      this.slowmo--;
      if (this.tick % 3 !== 0) {
        this.updateCamera();
        return;
      }
    }
    if (this.clash) {
      this.updateClash();
      this.updateFx();
      this.updateCamera();
      return;
    }
    if (this.cine) {
      this.updateCine();
      this.updateFx();
      this.updateCamera();
      return;
    }
    if (this.seq) {
      this.updateSeq();
      this.updateFx();
      this.updateCamera();
      return;
    }

    this.updatePhase();

    // controle do computador / boneco de treino
    if (this.phase === 'fight') {
      const [a, b] = this.f;
      if (this.cfg.mode === 'ai') aiAct(this, b, this.cfg.difficulty);
      if (this.training) {
        const d = this.train.dummy;
        if (d === 1) aiAct(this, b, 'normal');
        else if (d === 2) {
          b.pad.set('block', true, this.tick);
          const incomingLow = this.projectiles.some((p) => p.owner !== b.idx && p.move.level === 'low' && Math.abs(p.x - b.x) < 280 && (p.vx===0 || (b.x-p.x)*p.vx>0));
          b.pad.set('down', (!!a.move && a.move.level === 'low') || incomingLow, this.tick);
        } else if (d === 0) b.pad.reset();
        a.meter = b.meter = 100;
      }
    }

    for (const f of this.f) this.updateFighter(f, this.opp(f));
    this.resolvePush();
    for (const f of this.f) this.clampX(f);
    this.updateProjectiles();
    this.resolveHits();
    for (const f of this.f) this.animate(f);
    this.updateFx();
    this.updateCamera();
    this.updateTraining();
  }

  // ------------------------------------------------------------ fases do round
  private updatePhase() {
    this.phaseT++;
    const [a, b] = this.f;
    switch (this.phase) {
      case 'intro':
        if (this.phaseT === 1) {
          const last = a.wins + 1 >= this.winsNeeded && b.wins + 1 >= this.winsNeeded;
          this.announce(last ? 'ROUND FINAL' : `ROUND ${this.round}`, '', 70, '#fde68a');
          audio.bell();
          audio.say(last ? 'Round final' : `Round ${this.round}`, 0.8, 0.95);
        }
        if(this.round===1&&this.phaseT===8)this.text(a.x,FLOOR_Y-225,matchupLine(a.ch,b.ch),a.def.glow,18);
        if(this.round===1&&this.phaseT===64){this.text(b.x,FLOOR_Y-225,matchupLine(b.ch,a.ch),b.def.glow,18);audio.say(matchupLine(b.ch,a.ch),1.2,1.2);}
        if (this.phaseT === (this.round===1?125:72)) {
          this.announce('FIGHT!', '', 50, '#fb923c');
          audio.gong();
          audio.say('Liberou o dedilho!', 1.1, 1.3);
        }
        if (this.phaseT >= (this.round===1?165:110)) {
          this.phase = 'fight';
          this.phaseT = 0;
        }
        break;
      case 'fight':
        if (!this.training) {
          this.timeAcc++;
          if (this.timeAcc >= 60) {
            this.timeAcc = 0;
            this.timeLeft--;
            if (this.timeLeft <= 0) this.timeUp();
          }
        }
        break;
      case 'ko': {
        const loser = a.ko ? a : b;
        if(this.phaseT>100&&a.ko&&b.ko&&a.state==='down'&&b.state==='down')this.endRound(-1);
        else if (this.phaseT > 100 && loser.state === 'down') this.endRound(loser === a ? 1 : 0);
        else if (this.phaseT > 400) this.endRound(loser === a ? 1 : 0);
        break;
      }
      case 'roundEnd':
        if (this.phaseT >= ((a.wins>=this.winsNeeded||b.wins>=this.winsNeeded)?70:160)) {
          const done = a.wins >= this.winsNeeded || b.wins >= this.winsNeeded;
          if (done && a.wins !== b.wins) {
            this.winner = a.wins > b.wins ? 0 : 1;
            if(this.f[1-this.winner].ko) {
              this.phase='finishWindow';this.phaseT=0;this.hitstop=this.slowmo=0;
              for(const f of this.f){const held=f.pad.held.super;f.move=null;f.hbActive=false;f.pad.reset();f.pad.held.super=held;}
              this.announce('HORA DO FINISHER!', 'ULT PARA FINALIZAR · OU AGUARDE', 240, '#fde047');audio.say('Fecha a conta com um finisher!',1.2,1.15);
            } else this.completeMatch();
          } else {
            this.round++;
            this.resetRound();
          }
        }
        break;
      default:
        break;
    }
  }

  requestFinisher(idx:number) {
    if(this.phase!=='finishWindow'||idx!==this.winner)return false;
    this.finisher={winner:idx as 0|1,t:0,dur:210};this.finishedBy=idx as 0|1;
    this.phase='finisher';this.phaseT=0;this.ann=null;this.projectiles=[];this.seq=this.cine=this.clash=null;
    audio.boom(1.1);audio.say(FINISHER_CALLS[this.f[idx].ch],1.2,1.1);return true;
  }
  private updateFinish(){
    this.phaseT++;
    if(this.phase==='finishWindow'){
      const f=this.f[this.winner];
      if(f.pad.buffered('super',this.tick,8)||(f.cpu&&this.phaseT===70))this.requestFinisher(this.winner);
      else if(this.phaseT>=240)this.completeMatch();
    }else if(this.finisher){
      this.finisher.t++;if(this.finisher.t===95)audio.boom(1.6);
      if(this.finisher.t>=this.finisher.dur)this.completeMatch();
    }
  }
  private completeMatch(){
    if(this.phase==='matchEnd')return;
    this.phase='matchEnd';this.phaseT=0;this.finisher=null;this.ann=null;
    audio.music('victory');audio.say(this.finishedBy!==null?'Finisher! Vitória absurda!':`Vitória de ${this.f[this.winner].def.short}!`,1.1,1.15);
    this.onEvent({type:'matchEnd',winner:this.winner});
  }

  private timeUp() {
    const [a, b] = this.f;
    this.announce('TEMPO!', '', 80, '#fde68a');
    const pa = a.hp / a.maxHp;
    const pb = b.hp / b.maxHp;
    if (Math.abs(pa - pb) < 0.0001) this.endRound(-1);
    else this.endRound(pa > pb ? 0 : 1);
  }

  private endRound(w: number) {
    this.phase = 'roundEnd';
    this.phaseT = 0;
    this.slowmo = 0;
    if (w < 0) {
      this.announce('EMPATE', '', 100, '#fde68a');
      return;
    }
    const win = this.f[w];
    const lose = this.f[1 - w];
    win.wins++;
    win.state = 'win';
    win.stateT = 0;
    win.vx = 0;
    win.y = 0;
    win.move = null;
    win.poseOverride = null;
    win.glow = win.aura = 0;
    if (lose.state !== 'down') {
      lose.state = 'down';
      lose.stateT = 0;
      lose.ko = true;
      lose.y = 0;
      lose.vx = 0;
    }
    this.perfect = win.hp >= win.maxHp;
    if (this.perfect) {
      this.announce('PERFECT', '', 110, '#fde047');
      audio.say('Perfeito!', 0.8, 1);
    }
    if (win.ch === 'orango') audio.roar();
    this.hype = 1;
  }

  private triggerKO(a: Fighter, d: Fighter) {
    if (this.training) {
      d.hp = d.maxHp;
      return;
    }
    if (this.phase !== 'fight') return;
    this.phase = 'ko';
    this.phaseT = 0;
    d.ko = true;
    const decisive = a.wins + 1 >= this.winsNeeded;
    this.slowmo = decisive ? 110 : 60;
    this.hitstop = Math.max(this.hitstop, 14);
    this.announce('K.O.', '', 130, '#ef4444');
    audio.ko();
    audio.say('Nocaute!', 0.7, 0.9);
    this.flash = { c: '#ffffff', a: 1 };
    this.shake = Math.max(this.shake, 30);
    this.hype = 1;
    this.camOv = { x: d.x, zoom: decisive ? 1.7 : 1.4 };
    this.camOvT = 90;
    if (d.state !== 'launched' && d.state !== 'seq') {
      d.state = 'launched';
      d.vy = -11;
      d.vx = a.facing * 7;
      d.y = Math.min(d.y, -2);
    }
  }

  // ------------------------------------------------------------ atualização do lutador
  private canSuper(f: Fighter) {
    return (f.meter >= 100 || this.training) && this.phase === 'fight';
  }

  private pickNormal(f: Fighter, btn: 'p' | 'k'): string {
    const pad = f.pad;
    const fwd = f.facing > 0 ? 'right' : 'left';
    const back = f.facing > 0 ? 'left' : 'right';
    if (f.y < 0 || f.state === 'jump') return btn === 'p' ? 'jP' : 'jK';
    if (pad.held.down) return btn === 'p' ? 'cP' : 'cK';
    if (pad.held[fwd]) return btn === 'p' ? 'pM' : 'kM';
    if (pad.held[back]) return btn === 'p' ? 'pH' : 'kH';
    return btn === 'p' ? 'pL' : 'kL';
  }

  private tryGroundActions(f: Fighter): boolean {
    const pad = f.pad;
    const tk = this.tick;
    if (this.phase !== 'fight') return false;
    if (pad.buffered('super', tk, 5) && this.canSuper(f)) {
      pad.consume('super');
      this.startSuper(f);
      return true;
    }
    if(pad.buffered('grab',tk,8)) {
      pad.consume('grab');
      return this.startMove(f,{...f.def.moves.pH,id:'throw',kind:'special',startup:9,active:3,recovery:26,whiff:16,dmg:70,grab:'throw',unblockable:true,hb:[0,84,0,170],advance:undefined,poses:['pH_s','pH_a'],label:'AGARRÃO'});
    }
    for (const s of ['s1', 's2', 's3'] as const) {
      if (pad.buffered(s, tk, 8)) {
        pad.consume(s);
        return this.startMove(f, f.def.moves[s]);
      }
    }
    for (const b of ['p', 'k'] as const) {
      if (pad.buffered(b, tk, 8)) {
        pad.consume(b);
        this.startMove(f, f.def.moves[this.pickNormal(f, b)]);
        return true;
      }
    }
    return false;
  }

  startMove(f: Fighter, m: Move) {
    if(m.id==='throw')f.throwTechUntil=this.tick+12;
    if(f.ch==='santox'&&m.id==='s2'&&f.y<0)return false;
    if(f.y<0&&!m.air&&!(f.ch==='rickzera'&&m.id==='s3'))return false;
    if(f.ch==='jane'&&m.id==='s2'){
      if(f.bikeCooldown>0||f.move?.id==='s2')return false;
      f.bikeTicks=f.bikeHits=f.bikeNextHit=0;
    }
    if(f.ch==='santox'&&m.id==='s3'){
      if(f.fourthCooldown>0)return false;
      f.fourthCooldown=480;this.moveBanner=null;
    }
    if(f.ch==='caetano'&&m.id==='s2'&&f.precision>0){m={...m,dmg:73,hitstun:20,label:'DEDILHO: LEITURA PERFEITA'};f.precision=0;}
    if(f.ch==='aneninha'&&m.id==='s1'&&f.pad.held.down)m={...m,dmg:78,level:'low',hb:[15,145,0,70],launch:4,poses:['cK_s','cK_a'],variant:'low',label:'RASTEIRA DE OSASCO'};
    if(f.ch==='aneninha'&&m.id==='s2'&&f.pad.held[f.facing>0?'right':'left'])m={...m,variant:'reverse',label:'OSASCO DO OUTRO LADO'};
    if (RANGED_MOVES[f.ch].includes(m.id)) {
      if (f.rangedCooldown > 0) return false;
      if (++f.rangedUses === 3) f.rangedCooldown = 300;
    }
    if (f.ch === 'rickzera' && m.id === 's3') {
      if (f.y < 0 && f.airJumps >= 2) return false;
      if(f.idx===0)this.challengeEvent('jump');
      f.airJumps = f.y < 0 ? f.airJumps + 1 : 1;
      f.vy = -f.def.jumpVy;
      f.y = Math.min(f.y, -1);
      f.vx = (((f.pad.held.right ? 1 : 0) - (f.pad.held.left ? 1 : 0)) || f.facing) * f.def.jumpVx;
      m = { ...m, air: true };
      this.ring(f.x, FLOOR_Y + f.y, f.def.glow, 70, 18, 4);
      this.spark(f.x, FLOOR_Y + f.y, f.def.color, 12, 5, 3, 18);
      audio.jump();
    }
    if(f.ch==='santox'&&m.id==='s2'){
      f.y=-1;f.vy=-9.2;f.vx=f.facing*3.6;f.airJumps=1;f.landLag=12;
      audio.jump();this.dust(f.x,FLOOR_Y,5);
    }
    f.state = 'attack';
    f.stateT = 0;
    f.move = m;
    f.moveT = 0;
    f.connected = false;
    f.hitDone = false;
    f.hbActive = false;
    f.serial++;
    f.guard = false;
    f.crouch = m.id === 'cP' || m.id === 'cK';
    f.turn = 1;
    if (m.air) f.airAttacked = true;
    else if (f.y === 0 && !f.move.advance) f.vx *= 0.3;
    if (m.label && !(f.ch==='santox'&&m.id==='s3')) {
      this.moveBanner = { text: m.label, color: f.def.color, t: 0, dur: 75 };
      if (m.kind === 'special') this.hype = Math.max(this.hype, 0.5);
    }
    if (f.ch === 'aneninha' && m.id === 's3') { audio.say('Osasco!', 1.4, 1.1); audio.noise(.35, .17, 1300, 'bandpass'); }
    if(f.ch==='santox'&&m.id==='s3')audio.say('Você aí. Está me vendo?',1.25,1.15);
    if (f.ch === 'tubarao' && m.id === 's1') audio.bite();
    if (f.ch === 'tubarao' && m.id === 's3') audio.whoosh(1.8);
    if (m.id === 's3' && f.ch === 'orango') audio.roar();
    if (m.id === 's3' && f.ch === 'caetano') audio.say('Soco pego!', 1.2, 1.1);
    if (m.id === 's1' && f.ch === 'caetano') audio.say('Chute da conspiração!', 1.2, 1.1);
    if (m.id === 's2' && f.ch === 'caetano') audio.say('Dedilho!', 1.3, 1.2);
    return true;
  }

  private tryCancel(f: Fighter): boolean {
    const m = f.move!;
    const pad = f.pad;
    const tk = this.tick;
    if (!f.connected || this.phase !== 'fight' || m.air || (f.ch==='jane'&&m.id==='s2')) return false;
    if(f.ch==='caetano'&&m.id==='s2'&&f.hitDone&&this.opp(f).state!=='block'&&pad.buffered('s1',tk,8)){pad.consume('s1');return this.startMove(f,f.def.moves.s1);}
    if (m.kind !== 'super' && pad.buffered('super', tk, 4) && this.canSuper(f)) {
      pad.consume('super');
      this.startSuper(f);
      return true;
    }
    if (m.kind === 'normal') {
      for (const s of ['s1', 's2', 's3'] as const) {
        if (pad.buffered(s, tk, 4)) {
          pad.consume(s);
          return this.startMove(f, f.def.moves[s]);
        }
      }
      if (!m.air && m.rank < 3) {
        for (const b of ['p', 'k'] as const) {
          if (pad.buffered(b, tk, 3)) {
            let cand = this.pickNormal(f, b);
            let cm = f.def.moves[cand];
            if (cm.rank <= m.rank) {
              cand = NORMAL_BY_RANK[b][m.rank];
              cm = f.def.moves[cand];
            }
            if (cm && cm.rank > m.rank && !cm.air) {
              pad.consume(b);
              this.startMove(f, cm);
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  private endAttack(f: Fighter) {
    const m = f.move;
    if(f.ch==='jane'&&m?.id==='s2'&&f.bikeCooldown===0)f.bikeCooldown=180;
    if (m && m.kind === 'super') {
      f.armor = false;
      f.glow = 0;
      f.aura = 0;
    }
    f.armor = false;
    f.move = null;
    f.hbActive = false;
    f.poseOverride = null;
    f.turn = 1;
    f.stateT = 0;
    f.state = f.y < 0 ? 'jump' : 'ground';
  }

  private stopBike(f:Fighter,crash=false){
    const m=f.move;if(f.ch!=='jane'||m?.id!=='s2')return;
    f.bikeCooldown=180;f.hbActive=false;f.vx=0;
    if(crash){
      f.move=null;f.state='dizzy';f.stateT=0;f.bikeDizzy=60;f.poseOverride='dizzy';f.guard=f.crouch=false;f.invuln=0;
      this.text(f.x,FLOOR_Y-145,'PASSOU DO PONTO!', '#fde047',25);this.dust(f.x,FLOOR_Y,8);audio.land();
    }else f.moveT=m.startup+m.active;
  }

  private interruptBike(f:Fighter){
    if(f.ch==='jane'&&f.move?.id==='s2')f.bikeCooldown=180;
    f.bikeDizzy=0;
  }

  private resetComboOf(f: Fighter) {
    if (f.comboHits > 0) {
      const att = 1 - f.idx;
      if (f.comboHits >= 2) this.comboShow[att] = { hits: f.comboHits, dmg: f.comboDmg, t: 90 };
      if (this.training) {
        this.train.combo = f.comboHits;
        this.train.total = f.comboDmg;
        this.train.maxCombo = Math.max(this.train.maxCombo, f.comboHits);
      }
      f.comboHits = 0;
      f.comboDmg = 0;
    }
    f.juggle = 0;
  }

  private updateFighter(f: Fighter, o: Fighter) {
    const previousX=f.x;
    f.stateT++;
    if (f.invuln > 0) f.invuln--;
    if (f.throwShield>0) f.throwShield--;
    const def = f.def;
    const pad = f.pad;
    const tk = this.tick;
    f.walking = 0;
    if (f.state === 'ground' || f.state === 'jump' || f.state === 'dash' || f.state === 'getup') this.resetComboOf(f);

    switch (f.state) {
      case 'ground':
      case 'dash': {
        f.y = 0;
        const dashing = f.state === 'dash';
        if (!dashing) f.facing = o.x >= f.x ? 1 : -1;
        const fwd = f.facing > 0 ? 'right' : 'left';
        const back = f.facing > 0 ? 'left' : 'right';
        if (dashing) {
          f.vx *= 0.98;
          f.x += f.vx;
          if (f.stateT >= def.dashDur) {
            f.state = 'ground';
            f.stateT = 0;
            f.vx = 0;
          }
          if (f.stateT > 7 && this.tryGroundActions(f)) return;
          if (f.stateT % 3 === 0) this.dust(f.x - f.facing * 20, FLOOR_Y, 1);
          break;
        }
        f.crouch = pad.held.down;
        f.guard = pad.held.block;
        if (f.landLag > 0) {
          f.landLag--;
          f.vx *= 0.7;
          f.x += f.vx;
          break;
        }
        if (this.tryGroundActions(f)) return;
        if (!f.crouch && pad.buffered('up', tk, 8)) {
          pad.consume('up');
          f.vy = -def.jumpVy;
          f.vx = ((pad.held.right ? 1 : 0) - (pad.held.left ? 1 : 0)) * def.jumpVx;
          if(f.idx===0)this.challengeEvent('jump');
          f.state = 'jump';
          f.stateT = 0;
          f.airAttacked = false;
          f.airJumps = 1;
          f.guard = false;
          audio.jump();
          this.dust(f.x, FLOOR_Y, 4);
          break;
        }
        // dash (toque duplo)
        const dashDir = pad.pressedAt[fwd] === tk && tk - pad.prevAt[fwd] <= 14 ? 1 : pad.pressedAt[back] === tk && tk - pad.prevAt[back] <= 14 ? -1 : 0;
        if (dashDir !== 0 && !f.crouch && !f.guard) {
          if(f.idx===0)this.challengeEvent('dash');
          f.state = 'dash';
          f.stateT = 0;
          f.vx = dashDir * f.facing * (dashDir > 0 ? def.dashVx : def.dashVx * 0.85);
          pad.prevAt[dashDir > 0 ? fwd : back] = -999;
          audio.whoosh(0.5);
          break;
        }
        if (f.guard || f.crouch) {
          f.vx = 0;
        } else {
          const dir = (pad.held.right ? 1 : 0) - (pad.held.left ? 1 : 0);
          if (dir !== 0) {
            const forward = dir === f.facing;
            f.vx += (dir * ((forward ? def.walk : def.walkBack)+(f.ch==='orango'&&forward?f.momentum*.25:0))-f.vx)*.65;
            f.walking = forward ? 1 : -1;
          } else f.vx = 0;
        }
        f.x += f.vx;
        break;
      }
      case 'jump': {
        const steer=(pad.held.right?1:0)-(pad.held.left?1:0);if(steer)f.vx=clamp(f.vx+steer*.28,-def.jumpVx,def.jumpVx);
        if (f.ch === 'rickzera' && f.airJumps < 2 && this.phase === 'fight') {
          if (pad.buffered('s3', tk, 4)) {
            pad.consume('s3');
            this.startMove(f, f.def.moves.s3);
            return;
          }
          if (pad.buffered('up', tk, 8)) {
            pad.consume('up');
            f.airJumps++;
            f.vy = -def.jumpVy * 0.92;
            f.airAttacked = false;
            this.ring(f.x, FLOOR_Y + f.y, def.glow, 68, 16, 4);
            audio.jump();
          }
        }
        f.vy += GRAV;
        f.y += f.vy;
        f.x += f.vx;
        if (!f.airAttacked && this.phase === 'fight') {
          for (const b of ['p', 'k'] as const) {
            if (pad.buffered(b, tk, 4)) {
              pad.consume(b);
              this.startMove(f, f.def.moves[b === 'p' ? 'jP' : 'jK']);
              return;
            }
          }
        }
        if (f.y >= 0) this.land(f);
        break;
      }
      case 'attack':
        this.updateAttack(f, o);
        break;
      case 'dizzy':
        f.vx=0;f.y=0;if(f.stateT>1)f.bikeDizzy=Math.max(0,f.bikeDizzy-1);
        if(f.bikeDizzy===0){f.state='ground';f.stateT=0;f.poseOverride=null;}
        break;
      case 'hit':
        f.hitstun--;
        f.x += f.vx;
        f.vx *= 0.86;
        if (f.hitstun <= 0) {
          f.state = 'ground';
          f.stateT = 0;
          f.vx = 0;f.throwShield=10;f.guard=pad.held.block;f.crouch=pad.held.down;
        }
        break;
      case 'block':
        f.crouch = pad.held.down;
        f.blockstun--;
        f.x += f.vx;
        f.vx *= 0.86;
        if (f.blockstun <= 0) {
          f.state = 'ground';
          f.stateT = 0;
          f.vx = 0;f.throwShield=10;f.guard=pad.held.block;f.crouch=pad.held.down;
        }
        break;
      case 'launched':
        f.vy += GRAV * 0.9;
        f.y += f.vy;
        f.x += f.vx;
        f.vx *= 0.992;
        if (f.y >= 0) {
          f.y = 0;
          f.vy = 0;
          f.vx *= 0.4;
          f.state = 'down';
          f.stateT = 0;
          audio.land();
          this.dust(f.x, FLOOR_Y, 8);
          this.shake = Math.max(this.shake, f.ko ? 14 : 6);
        }
        break;
      case 'down':
        f.x += f.vx;
        f.vx *= 0.85;
        if (!f.ko && f.stateT >= 42 && this.phase !== 'roundEnd') {
          f.state = 'getup';
          f.stateT = 0;
          f.invuln = 22;
        }
        break;
      case 'getup':
        if (f.stateT >= 18) {
          f.state = 'ground';
          f.stateT = 0;
        }
        break;
      case 'win':
      case 'seq':
      case 'cine':
        f.x += f.vx;
        f.vx *= 0.8;
        break;
    }
    if(f.y===0&&(f.state==='ground'||f.state==='dash')&&this.projectiles.some(p=>p.kind==='chess'&&p.owner!==f.idx&&p.life>0&&Math.abs(p.x-f.x)<(p.radius??110))){
      f.x=previousX+(f.x-previousX)*.65;
      if(f.x!==previousX&&this.opp(f).idx===0)this.challengeEvent('special',1,'s1');
    }
  }

  private land(f: Fighter) {
    f.airJumps = 0;
    f.airAttacked = false;
    f.y = 0;
    f.vy = 0;
    f.vx = 0;
    f.state = 'ground';
    f.stateT = 0;
    f.landLag = Math.max(3,f.landLag);f.throwShield=10;
    audio.land();
    this.dust(f.x, FLOOR_Y, 5);
  }

  private updateAttack(f: Fighter, o: Fighter) {
    const m = f.move!;
    const t = f.moveT;
    if(f.ch==='eneas'&&m.id==='s3'&&t>=m.startup+10)f.poseOverride='six_a';
    if(f.ch==='renngotti'&&m.id==='s3'&&t===m.startup)for(const p of this.projectiles)if(p.owner===f.idx&&p.anchored&&!p.resonating){p.resonating=true;p.radius=90;p.life=Math.min(p.life,24);p.move={...p.move,dmg:35,level:'mid',hitstun:20};this.ring(p.x,FLOOR_Y-35,f.def.glow,150,22,5);}
    f.hbActive = false;
    if (m.air) {
      f.vy += GRAV;
      f.y += f.vy;
      f.x += f.vx;
      if (f.y >= 0) {
        this.endAttack(f);
        this.land(f);
        f.landLag = f.ch==='santox'&&m.id==='s2'?12:5;
        return;
      }
    } else {
      if(f.ch==='jane'&&m.id==='s3'){
        f.crouch=t<18;
        if(t===18)f.facing=o.x>=f.x?1:-1;
        if(t>=17)f.vx=0;
      }
      if(f.ch==='jane'&&m.id==='s2')f.vx=0;
      else if (m.advance && t >= m.advance[0] && t < m.advance[1]) f.vx = m.advance[2] * f.facing;
      else f.vx *= 0.75;
      f.x += f.vx;
    }
    const a0 = m.startup;
    const a1 = m.startup + m.active;
    const rangedKind = this.projectileKind(f, m);
    const ranged = rangedKind !== null;
    f.hbActive = !ranged && !(f.ch==='santox'&&m.id==='s3') && t >= a0 && t < a1 && !f.hitDone;
    if(f.ch==='jane'&&m.id==='s2'&&t>=a0&&t<a1){
      f.hbActive=f.bikeHits<6&&f.bikeTicks>=f.bikeNextHit;
      if(f.hbActive){f.hitDone=false;f.move={...m,dmg:Math.min(15,11+Math.floor(f.bikeTicks/60))};}
    }
    if(f.ch==='santox'&&m.id==='s3'&&t>=a0&&t<a1){f.invuln=1;this.camOv={x:f.x,zoom:1.75};this.camOvT=2;}
    if (f.ch === 'tubarao' && m.id === 's3') f.armor = t >= 4 && t < a1;
    if (ranged && (t === a0 || ((rangedKind==='java'||rangedKind==='five')&&t===a0+10) || ((rangedKind === 'pix' || rangedKind === 'bullet') && (t === a0 + 8 || t === a0 + 16)))) this.spawnProjectile(f, m);
    this.moveFx(f, m, t, o);
    if (f.connected && this.tryCancel(f)) return;
    f.moveT++;
    if (m.air) {
      if (f.moveT >= a1) this.endAttack(f);
    } else {
      const total = a1 + m.recovery + (f.connected ? 0 : m.whiff);
      if (f.moveT >= total) this.endAttack(f);
    }
  }

  private tipPos(f: Fighter, joint: string): P2 {
    const p = f.rig.p[joint];
    return { x: f.x + f.facing * f.turn * p.x, y: FLOOR_Y + f.y + p.y };
  }

  private moveFx(f: Fighter, m: Move, t: number, _o: Fighter) {
    const col = f.def.color;
    if (m.turn) {
      const [t0, t1] = m.turn;
      if (t >= t0 && t <= t1) {
        const u = (t - t0) / (t1 - t0);
        const c = Math.cos(u * Math.PI * 2);
        f.turn = Math.abs(c) < 0.18 ? (c < 0 ? -0.18 : 0.18) : c;
      } else f.turn = 1;
    }
    if (t === m.startup) {
      audio.whoosh(m.power);
      if (m.sound === 'purple') audio.purple();
      if (m.sound === 'red') audio.red();
      if (m.kind === 'special') this.speed = Math.max(this.speed, 0.5);
    }
    if (m.charge && t < m.startup && t % 2 === 0) {
      const tip = this.tipPos(f, f.ch === 'orango' ? 'wF' : 'wB');
      const ang = rand(0, Math.PI * 2);
      const d = 60 * (1 - t / m.startup) + 25;
      this.parts.push({ type: 'spark', x: tip.x + Math.cos(ang) * d, y: tip.y + Math.sin(ang) * d, vx: -Math.cos(ang) * 3, vy: -Math.sin(ang) * 3, life: 12, max: 12, size: 3, color: f.def.glow, g: 0, rot: 0, grow: 0 });
      f.aura = Math.min(1, t / m.startup);
    } else if (m.charge && t >= m.startup + m.active) f.aura = Math.max(0, f.aura - 0.1);
    // rastro
    if (m.trail && t >= m.startup - 2 && t < m.startup + m.active + 5) {
      const j = m.trail === 'fw' ? 'wF' : m.trail === 'bw' ? 'wB' : m.trail === 'fa' ? 'aF' : 'aB';
      f.trail.push(this.tipPos(f, j));
      if (f.trail.length > 14) f.trail.shift();
    }
    if (m.id === 's1' && f.ch === 'caetano' && t >= 3 && t < 16) this.spark(f.x + f.facing * 60, FLOOR_Y + f.y - 80, col, 1, 2, 3, 14);
    void col;
  }

  private projectileKind(f: Fighter, m: Move): Projectile['kind'] | null {
    if (f.ch === 'rickzera') return m.id === 's1' ? 'franco' : m.id === 's2' ? 'pix' : null;
    if (f.ch === 'bieu') return m.id === 's2' ? 'rat' : m.id === 's3' ? 'spray' : null;
    if (f.ch === 'nomad') return m.id === 's1' ? 'burger' : m.id === 's2' ? 'bullet' : m.id === 's3' ? 'boomerang' : null;
    if (f.ch === 'renngotti') return m.id === 's2' ? 'microphone' : null;
    if (f.ch === 'aneninha') return m.id === 's2' ? 'osasco' : null;
    if(f.ch==='jao')return m.id==='s1'?'chess':m.id==='s2'?'formula':m.id==='s3'?'basketball':null;
    if(f.ch==='jane')return m.id==='s1'?'java':null;
    if(f.ch==='eneas')return m.id==='s2'?'ecg':m.id==='s3'?'five':null;
    return null;
  }

  private spawnProjectile(f: Fighter, m: Move) {
    let kind = this.projectileKind(f, m);
    if (!kind) return;
    if(kind==='chess'){
      this.projectiles=this.projectiles.filter(p=>p.kind!=='chess'||p.owner!==f.idx);
      this.projectiles.push({owner:f.idx,kind,x:clamp(f.x+f.facing*230,115,1485),y:0,vx:0,life:180,serial:f.serial,move:m,age:0,radius:110});
      this.ring(f.x+f.facing*230,FLOOR_Y-5,f.def.glow,220,25,4);audio.tone(330,.2,'triangle',.14,660);return;
    }
    if(kind==='five'&&f.moveT>m.startup){kind='six';m={...m,dmg:34,launch:0,spike:true,kb:6,hitstun:22,poses:['five_s','six_a']};}
    const speed = { franco: 12, pix: 16, rat: 8, spray: 0, burger: 9, bullet: 20, boomerang: 11, bazooka: 20, microphone: 11, osasco: 0,formula:10,basketball:9,java:10,ecg:11,five:10,six:10 }[kind];
    const y = kind==='java'?-72:kind==='ecg'?-96:kind==='five'||kind==='six'?-100:kind === 'rat' ? -18 : kind === 'bullet' ? -145 : kind === 'spray' || kind === 'osasco' ? -70 : kind === 'microphone' ? -115 : -104;
    const radius = kind === 'osasco' ? 48 : kind === 'spray' ? 62 : kind === 'rat' ? 14 : kind === 'bullet' ? 6 : kind === 'burger' ? 25 : 20;
    this.projectiles.push({ owner: f.idx, kind, x: kind==='osasco'&&m.variant==='reverse'&&Math.abs(f.x-this.opp(f).x)<220?this.opp(f).x+f.facing*80:f.x + f.facing * (kind === 'spray' || kind === 'osasco' ? 115 : 65), y, vx: f.facing * speed, life: kind === 'osasco' ? 96 : kind === 'spray' ? 64 : kind === 'boomerang' ? 110 : 95, serial: f.serial, move: m, age: 0, radius:kind==='basketball'?23:radius, vy: kind === 'microphone' ? -2.4 : kind==='basketball'?-2.3:undefined });
    audio.tone(kind === 'bullet' ? 220 : kind === 'rat' ? 900 : 640, 0.1, 'triangle', 0.14, kind === 'bullet' ? 70 : 1500);
    this.spark(f.x + f.facing * 60, FLOOR_Y + y, f.def.glow, 5, 4, 2, 12);
  }

  private updateProjectiles() {
    if (this.phase !== 'fight') {
      this.projectiles = [];
      return;
    }
    this.projectiles = this.projectiles.filter((p) => {
      p.age = (p.age ?? 0) + 1;
      const a = this.f[p.owner];
      if(p.kind==='chess'){p.life--;return p.life>0;}
      if (p.kind === 'boomerang') {
        if (!p.returning && (p.age >= 32 || p.x < 35 || p.x > 1565)) p.returning = true;
        if (p.returning) {
          p.vx = clamp((a.x - p.x) * 0.16, -13, 13);
          p.y += (a.y - 100 - p.y) * 0.1;
          if (Math.abs(p.x - a.x) < 24) return false;
        }
      }
      p.x += p.vx;
      if(p.kind==='basketball'){
        p.vy=(p.vy??0)+.12;p.y+=p.vy;
        if(p.y>=-23){if((p.bounces??0)>=1)return false;p.bounces=1;p.y=-23;p.vy=-Math.abs(p.vy)*.72;audio.tone(150,.08,'sine',.1,70);}
      }
      if (p.kind === 'microphone'&&!p.anchored) {
        p.vy = (p.vy ?? 0) + 0.075;
        p.y += p.vy;
      }
      if(p.kind==='microphone'&&!p.anchored&&(p.age>=50||p.y>=-18)){
        p.anchored=true;p.vx=0;p.vy=0;p.y=-14;p.life=80;p.radius=48;p.move={...p.move,dmg:28,level:'low',hitstun:16,kb:3};
      }
      p.life--;
      if (p.life <= 0 || p.x < -40 || p.x > 1640) return false;
      const d = this.opp(a);
      if ((d.state==='launched'&&d.juggle>=4) || ['down', 'getup', 'seq', 'cine', 'win'].includes(d.state)) return true;
      const phaseMask = p.returning ? 2 : 1;
      if (p.kind === 'boomerang' && ((p.hitMask ?? 0) & phaseMask)) return true;
      if ((p.kind === 'spray' || p.kind === 'osasco') && ((p.hitCount ?? 0) >= (p.kind === 'osasco' ? 3 : 4) || p.age - (p.lastHitAt ?? -99) < (p.kind === 'osasco' ? 20 : 14))) return true;
      const r = p.radius ?? 20;
      const ry = p.kind === 'osasco' ? 65 : p.kind === 'spray' ? 55 : p.anchored?28:p.kind==='basketball'?23:p.kind==='five'||p.kind==='six'?30:p.kind === 'bullet' ? 6 : 15;
      const box = { x0: p.x - r, x1: p.x + r, y0: p.y - ry, y1: p.y + ry };
      if (!this.overlap(box, this.hurtBox(d))) return true;
      if(d.invuln>0){if(d.idx===0&&d.ch==='santox'&&d.move?.id==='s3')this.challengeEvent('special',1,'s3');return true;}
      this.applyHit(a, d, p.move, { x: p.x, y: FLOOR_Y + p.y, dir: Math.sign(p.vx) || Math.sign(d.x-p.x) || a.facing, serial: p.serial });
      if (p.kind === 'boomerang') {
        p.hitMask = (p.hitMask ?? 0) | phaseMask;
        return true;
      }
      if (p.kind === 'spray' || p.kind === 'osasco') {
        p.lastHitAt = p.age;
        p.hitCount = (p.hitCount ?? 0) + 1;
        return true;
      }
      return false;
    });
  }

  // ------------------------------------------------------------ colisão
  hurtBox(f: Fighter) {
    const w = f.def.pushW + 4;
    let h = f.crouch && f.y === 0 ? f.def.crouchH : f.def.hurtH;
    if (f.y < 0) h = f.def.hurtH * 0.9;
    if (f.state === 'launched') h = f.def.hurtH * 0.6;
    return { x0: f.x - w, x1: f.x + w, y0: f.y - h, y1: f.y - (f.state === 'launched' ? 20 : 0) };
  }

  boxOf(f: Fighter) {
    const m = f.move!;
    const xa = f.x + f.facing * m.hb[0];
    const xb = f.x + f.facing * m.hb[1];
    return { x0: Math.min(xa, xb), x1: Math.max(xa, xb), y0: f.y - m.hb[3], y1: f.y - m.hb[2] };
  }

  private overlap(a: { x0: number; x1: number; y0: number; y1: number }, b: { x0: number; x1: number; y0: number; y1: number }) {
    return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
  }

  private canHit(att: Fighter, def: Fighter) {
    const m = att.move!;
    if (def.invuln > 0) return false;
    const dead = ['down', 'getup', 'seq', 'cine', 'win'];
    if (m.grab === 'super') return !dead.includes(def.state);
    if(m.grab)return def.throwShield===0&&def.y===0&&(def.state==='ground'||def.state==='dash'||def.state==='dizzy'||(def.state==='block'&&def.blockstun<=0)||(def.state==='attack'&&!!def.move&&(def.armor||(def.ch==='jane'&&def.move.id==='s2')||def.moveT>=def.move.startup+def.move.active))||(m.grab==='throw'&&def.move?.id==='throw'));
    if (dead.includes(def.state)) return false;
    if (def.state === 'launched' && def.juggle >= 4) return false;
    return true;
  }

  private resolvePush() {
    const [a, b] = this.f;
    const skip = ['seq', 'cine'];
    if (skip.includes(a.state) || skip.includes(b.state)) return;
    if([a,b].some(f=>f.ch==='jane'&&f.move?.id==='s3'&&f.moveT<18&&this.opp(f).y===0))return;
    if (a.y < -105 || b.y < -105) return;
    if (a.state === 'down' || b.state === 'down') return;
    const need = a.def.pushW + b.def.pushW;
    const dx = b.x - a.x;
    const over = need - Math.abs(dx);
    if (over > 0) {
      const dir = dx === 0 ? (a.facing > 0 ? 1 : -1) : Math.sign(dx);
      a.x -= (dir * over) / 2;
      b.x += (dir * over) / 2;
    }
  }

  private clampX(f: Fighter) {
    if (f.state === 'seq') return;
    const o = this.opp(f);
    const min = 40;
    const max = 1560;
    if (f.x < min) {
      const over = min - f.x;
      f.x = min;
      if ((f.state === 'hit' || f.state === 'block') && o.y === 0 && o.state !== 'seq') o.x += over * 0.9;
    }
    if (f.x > max) {
      const over = f.x - max;
      f.x = max;
      if ((f.state === 'hit' || f.state === 'block') && o.y === 0 && o.state !== 'seq') o.x -= over * 0.9;
    }
    if (o.state !== 'seq') {
      if (Math.abs(f.x - o.x) > 880) f.x = o.x + Math.sign(f.x - o.x) * 880;
    }
  }

  private clashWindow(f: Fighter) {
    const m = f.move;
    return f.state === 'attack' && !!m && !!m.dedilho && f.moveT < m.startup + m.active + 3 && !f.hitDone;
  }

  private resolveHits() {
    const [a, b] = this.f;
    if (this.phase !== 'fight') return;
    if (this.clashWindow(a) && this.clashWindow(b)) {
      if (this.overlap(this.boxOf(a), this.boxOf(b))) {
        this.startClash(a, b);
        return;
      }
    }
    const hits:{a:Fighter;d:Fighter;m:Move;impact:{x:number;y:number;dir:number;serial:number}}[]=[];
    for(const [x,y] of [[a,b],[b,a]] as [Fighter,Fighter][])if(y.idx===0&&y.ch==='santox'&&y.move?.id==='s3'&&y.invuln>0&&x.hbActive&&x.move&&this.overlap(this.boxOf(x),this.hurtBox(y)))this.challengeEvent('special',1,'s3');
    for(const [x,y] of [[a,b],[b,a]] as [Fighter,Fighter][])if(x.hbActive&&x.move&&this.canHit(x,y)&&this.overlap(this.boxOf(x),this.hurtBox(y))){
      const ba=this.boxOf(x),bd=this.hurtBox(y);
      hits.push({a:x,d:y,m:x.move,impact:{x:(Math.max(ba.x0,bd.x0)+Math.min(ba.x1,bd.x1))/2,y:FLOOR_Y+(Math.max(ba.y0,bd.y0)+Math.min(ba.y1,bd.y1))/2,dir:(x.ch==='jane'&&x.move.id==='s2')||(x.ch==='cristyan'&&x.move.id==='s3')?(Math.sign(y.x-x.x)||x.facing):x.facing,serial:x.serial}});
    }
    for(const h of hits){
      if(h.m.grab&&hits.some(other=>other.d===h.a&&!other.m.grab))continue;
      if(this.seq)break;
      this.applyHit(h.a,h.d,h.m,h.impact);
      if(h.m.grab)break;
    }
    if(!this.training&&a.hp<=0&&b.hp<=0){a.ko=b.ko=true;this.phase='ko';}
  }

  private gainMeter(f: Fighter, amount: number) {
    f.meter = Math.min(100, f.meter + amount * METER_GAIN_SCALE);
  }

  private dealDamage(a: Fighter, d: Fighter, dmg: number) {
    if(d.ch==='orango')d.momentum=d.momentumT=0;
    if(a.idx===0) {
      this.challengeEvent('hits');
      this.challengeEvent('damage',dmg);
      if(this.seq?.kind.startsWith('super') && this.challengeSuperSerial!==a.serial) {this.challengeSuperSerial=a.serial;this.challengeEvent('super');}
    }
    if (this.training) {
      this.train.lastDmg = Math.round(dmg);
      d.comboDmg += dmg;
      d.hp = Math.max(1, d.hp - dmg);
      this.train.idle = 0;
    } else {
      d.hp = Math.max(0, d.hp - dmg);
      d.comboDmg += dmg;
    }
    this.gainMeter(a, dmg * 0.16);
    this.gainMeter(d, dmg * 0.11);
  }

  private applyHit(a: Fighter, d: Fighter, m = a.move!, impact?: { x: number; y: number; dir: number; serial: number }) {
    const tracked = a.move === m && (!impact || impact.serial === a.serial);
    if (tracked) {
      a.hitDone = true;
      a.hbActive = false;
      if(a.ch==='jane'&&m.id==='s2'){a.bikeHits++;a.bikeNextHit=a.bikeTicks+30;}
    }
    const ba = impact ? this.hurtBox(d) : this.boxOf(a);
    const bd = this.hurtBox(d);
    const px = impact?.x ?? (Math.max(ba.x0, bd.x0) + Math.min(ba.x1, bd.x1)) / 2;
    const py = impact?.y ?? FLOOR_Y + (Math.max(ba.y0, bd.y0) + Math.min(ba.y1, bd.y1)) / 2;
    const dir = impact?.dir ?? a.facing;

    // --- agarrões ---
    if (m.grab) {
      if(a.ch==='orango'&&m.kind!=='super'){a.momentum=Math.min(3,a.momentum+1);a.momentumT=180;}
      if(m.grab==='throw'&&(this.tick-d.pad.pressedAt.grab<=8||(d.move?.id==='throw'&&this.tick<=d.throwTechUntil))){
        for(const f of [a,d]){f.move=null;f.hbActive=false;f.state='ground';f.stateT=0;f.landLag=10;f.throwShield=25;f.pad.consume('grab');}
        a.vx=-a.facing*4;d.vx=a.facing*4;this.text(px,py-40,'ESCAPOU!', '#bae6fd',28);audio.block();return;
      }
      if(a.idx===0 && m.kind==='special' && /^s[123]$/.test(m.id))this.challengeEvent('special',1,m.id);
      if (tracked) a.connected = true;
      if (m.grab === 'super') this.startSeq(({ caetano: 'superC', orango: 'superO', tubarao: 'superT', rickzera: 'superR', bieu: 'superB', nomad: 'superN', renngotti: 'superG', aneninha: 'superA',santox:'superS',jao:'superJ',jane:'superJane',cristyan:'superCristyan',eneas:'superEneas' } as const)[a.ch], a, d);
      else this.startSeq(m.grab, a, d);
      return;
    }

    const blocked = d.guard && d.y === 0 && (d.state === 'ground' || d.state === 'block') && !m.unblockable && (m.level !== 'low' || d.crouch) && (m.level !== 'high' || !d.crouch);
    if (tracked) a.connected = true;
    if (blocked) {
      if(d.ch==='caetano'&&d.parryCooldown===0&&this.tick-d.pad.pressedAt.block<=5){
        if(d.idx===0)this.challengeEvent('block');
        d.precision=120;d.parryCooldown=24;d.state='block';d.blockstun=4;d.vx=0;d.move=null;d.hbActive=false;this.gainMeter(d,6);
        this.flash={c:'#fef3c7',a:.4};this.text(px,py-40,'LEITURA!', '#fef08a',27);this.ring(px,py,'#fef08a',90,18,5);audio.block();return;
      }
      if (d.idx === 0) this.challengeEvent('block');
      const chip = m.dmg * Math.min(.2,m.pierce ?? (m.kind === 'special' ? 0.1 : 0.025));
      const prev = d.hp;
      d.hp = Math.max(this.training||m.kind!=='super'?1:0,d.hp-chip);
      d.dispHp = Math.max(d.hp, d.dispHp);
      this.gainMeter(a, m.dmg * 0.08);
      this.gainMeter(d, m.dmg * 0.05);
      d.state = 'block';
      d.stateT = 0;
      d.blockstun = m.blockstun;
      d.guard = true;
      d.vx = dir * m.kbBlock * 1.3;
      d.move = null;
      this.hitstop = Math.max(this.hitstop, Math.round(m.hitstop * 0.6));
      this.shake = Math.max(this.shake, 2 + m.power);
      audio.block();
      this.spark(px, py, '#bfe3ff', 6, 5, 3, 12);
      this.ring(px, py, '#bfe3ff', 36, 12, 3);
      this.hype = Math.max(this.hype, 0.1);
      if (this.training) this.train.lastDmg = 0;
      if (a.x === d.x) a.x -= dir;
      if (d.hp <= 0 && prev > 0) this.triggerKO(a, d);
      return;
    }

    if(d.armor) {
      this.dealDamage(a,d,Math.max(1,m.dmg*.75));this.hitstop=Math.max(this.hitstop,4);
      this.spark(px,py,'#e2e8f0',10,6,3,16);this.text(px,py-30,'ARMADURA', '#cbd5e1',18);audio.hit(.7);
      if(d.hp<=0){d.armor=false;d.move=null;d.hbActive=false;d.state='launched';d.y=-2;d.vy=-9;d.vx=dir*6;this.triggerKO(a,d);}
      return;
    }

    // --- acerto ---
    if (a.idx === 0) { if(m.level==='low')this.challengeEvent('low'); if(m.air)this.challengeEvent('air'); if(m.kind==='special'&&/^s[123]$/.test(m.id))this.challengeEvent('special',1,m.id); }
    const air = d.y < 0 || d.state === 'launched';
    if (d.state === 'hit' || d.state === 'launched') d.comboHits++;
    else d.comboHits = 1;
    if (a.idx === 0) this.challengeEvent('combo',d.comboHits);
    const scale = [1, 1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.45][Math.min(d.comboHits - 1, 7)];
    const dmg = Math.max(1, m.dmg * scale * (a.ch==='orango'?1+a.momentum*.03:1));
    if(a.ch==='orango'){a.momentum=Math.min(3,a.momentum+1);a.momentumT=180;}
    if(d.ch==='orango')d.momentum=d.momentumT=0;
    this.dealDamage(a, d, dmg);
    this.interruptBike(d);
    if(d.ch==='jao')for(const p of this.projectiles)if(p.kind==='chess'&&p.owner===d.idx)p.life=0;
    d.move = null;
    d.hbActive = false;
    d.guard = false;
    d.armor = false;
    d.poseOverride = null;
    d.turn = 1;
    d.stunLow = m.level === 'low' || d.crouch;
    d.hitstun = m.hitstun;
    d.stateT = 0;
    if (m.launch > 0 || air) {
      d.state = 'launched';
      d.vy = m.spike?9:-(m.launch > 0 ? m.launch : 6.5);
      d.vx = dir * (m.launchVx || m.kb + 1);
      d.y = Math.min(d.y, -1);
      d.juggle++;
    } else {
      d.state = 'hit';
      d.vx = dir * m.kb;
    }
    d.invuln = 0;
    this.hitstop = Math.max(this.hitstop, m.hitstop);
    this.shake = Math.max(this.shake, m.shake);
    this.hype = Math.max(this.hype, 0.25 * m.power);
    this.hitFx(a, d, m, px, py);
    if (this.training) this.train.idle = 0;
    if (d.hp <= 0) {
      d.vy = -11;
      d.vx = dir * 7;
      d.y = Math.min(d.y, -2);
      d.state = 'launched';
      this.triggerKO(a, d);
    }
  }

  private hitFx(a: Fighter, d: Fighter, m: Move, px: number, py: number) {
    if(a.ch==='eneas'&&m.id==='s2')this.text(px,py-40,'CASO GRAVE!', '#86efac',30);
    const col = a.def.color;
    const glow = a.def.glow;
    audio.hit(m.power);
    this.spark(px, py, glow, 8 + Math.round(m.power * 6), 4 + m.power * 3, 3 + m.power, 16 + m.power * 4);
    this.spark(px, py, '#ffffff', 5, 6, 2, 10);
    this.glowFx(px, py, '#ffffff', 40 + m.power * 25, 8);
    if (m.power >= 1) this.ring(px, py, col, 50 + m.power * 25, 16, 5);
    if (m.power >= 2) {
      this.flash = { c: glow, a: Math.min(0.55, 0.2 * m.power) };
    }
    if (a.ch === 'caetano' && m.id === 's2') {
      this.flash = { c: '#c084fc', a: 0.55 };
      this.glowFx(px, py, '#e9d5ff', 130, 14);
      this.spark(px, py, '#e9d5ff', 20, 9, 3, 18);
      this.ring(px, py, '#e9d5ff', 120, 18, 4);
      this.hitstop=Math.max(this.hitstop,13);audio.purple();this.streak(px,py,0,'#fff7ed');this.streak(px,py,Math.PI,'#c084fc');this.text(px,py-58,m.dmg>55?'PRECISÃO!':'PERFURANTE!', '#f5d0fe',30);
    }
    if (a.ch === 'caetano' && m.id === 's3') {
      this.flash = { c: '#ffffff', a: 0.7 };
      for (let i = 0; i < 4; i++) this.ring(px, py, i % 2 ? '#c084fc' : '#7e22ce', 100 + i * 60, 22 + i * 4, 10);
      this.spark(px, py, '#c084fc', 45, 14, 5, 28);
      this.glowFx(px, py, '#a855f7', 260, 22);
      audio.boom(0.9);
      this.text(px, py - 60, 'POW!', '#e9d5ff', 54);
    }
    if (a.ch === 'orango' && m.id === 's1') {
      this.flash = { c: '#ff3b2f', a: 0.6 };
      for (let i = 0; i < 3; i++) this.ring(px, py, i % 2 ? '#ff7a5c' : '#ff2a2a', 90 + i * 80, 20 + i * 4, 12);
      for (let i = 0; i < 16; i++) this.streak(px, py, (i / 16) * Math.PI * 2, '#ff6a4a');
      this.glowFx(px, py, '#ff3b2f', 240, 20);
      audio.boom(0.8);
      this.text(px, py - 60, 'SMASH!', '#fecaca', 50);
    }
    if (a.ch === 'caetano' && m.id === 's1') this.spark(px, py, '#e9d5ff', 22, 11, 4, 20);
    void d;
  }

  // ------------------------------------------------------------ DEDILHO CLASH
  private startClash(a: Fighter, b: Fighter) {
    this.clash = { a, b, t: 0, c: [0, 0], m: [a.move!, b.move!], x: (a.x + b.x) / 2 };
    for (const f of [a, b]) {
      f.state = 'seq';
      f.poseOverride = 'dedo_a';
      f.vx = 0;
      f.move = null;
      f.hbActive = false;
      f.aura = 1;
    }
    audio.clash();
    this.shake = 28;
    this.flash = { c: '#ffffff', a: 0.8 };
    this.moveBanner = null;
    this.announce('DEDILHO CLASH!', 'APERTE SOCO REPETIDAMENTE!', 150, '#fde047');
  }

  private updateClash() {
    const c = this.clash!;
    c.t++;
    const mid = (c.a.x + c.b.x) / 2;
    this.camOv = { x: mid, zoom: 1.45 };
    this.camOvT = 2;
    const fs = [c.a, c.b];
    for (let i = 0; i < 2; i++) {
      const f = fs[i];
      if (f.cpu || (this.training && i === 1 && this.train.dummy === 1)) {
        if (Math.random() < aiMashRate(this.cfg.difficulty) / 60) c.c[i]++;
      } else if (f.pad.pressedAt.p === this.tick) {
        c.c[i]++;
        audio.tone(500 + c.c[i] * 12, 0.05, 'square', 0.06);
      }
    }
    this.shake = Math.max(this.shake, 8);
    if (c.t % 2 === 0) {
      const lead = (c.c[0] - c.c[1]) * 6;
      const cx = mid + lead;
      this.spark(cx, FLOOR_Y - 115, c.t % 4 === 0 ? '#c084fc' : '#ff4a3a', 4, 9, 3, 14);
      this.spark(cx, FLOOR_Y - 115, '#ffffff', 2, 12, 2, 10);
    }
    if (c.t % 12 === 0) audio.clash();
    const diff = c.c[0] - c.c[1];
    if ((c.t >= 50 && Math.abs(diff) >= 10) || c.t >= 150) {
      const w = diff > 0 ? 0 : diff < 0 ? 1 : Math.random() < 0.5 ? 0 : 1;
      const win = fs[w];
      const lose = fs[1 - w];
      const m = c.m[w];
      this.clash = null;
      this.announce('', '', 0);
      this.ann = null;
      win.state = 'ground';
      win.poseOverride = null;
      win.aura = 0;
      win.landLag = 14;
      win.stateT = 0;
      lose.aura = 0;
      lose.poseOverride = null;
      lose.state = 'hit';
      lose.comboHits = 1;
      lose.invuln = 0;
      this.dealDamage(win, lose, m.dmg);
      lose.state = 'launched';
      lose.vy = -10;
      lose.vx = win.facing * 9;
      lose.y = -2;
      lose.juggle = 1;
      const px = lose.x;
      this.flash = { c: win.def.glow, a: 0.9 };
      this.shake = 36;
      this.hitstop = 12;
      for (let i = 0; i < 4; i++) this.ring(px, FLOOR_Y - 100, win.def.color, 120 + i * 70, 24, 10);
      this.spark(px, FLOOR_Y - 100, win.def.glow, 40, 14, 5, 26);
      this.text(px, FLOOR_Y - 190, `${win.def.short} VENCEU!`, win.def.glow, 40);
      audio.boom(1);
      audio.hit(3);
      if (lose.hp <= 0) this.triggerKO(win, lose);
    }
  }

  // ------------------------------------------------------------ SEQUÊNCIAS (agarrões e supers)
  private startSuper(f: Fighter) {
    this.interruptBike(f);
    if (!this.training) f.meter = 0;
    f.state = 'cine';
    f.stateT = 0;
    f.move = null;
    f.vx = 0;
    f.guard = f.crouch = false;
    f.hbActive = false;
    f.turn = 1;
    f.glow = 1;
    f.aura = 1;
    f.poseOverride = f.ch === 'orango' || f.ch === 'tubarao' ? 'roar' : f.ch === 'bieu' ? 'drive' : f.ch === 'nomad' ? 'bazooka' : f.ch === 'renngotti' ? 'tilt_s' : f.ch === 'aneninha' ? 'roar' : f.ch==='santox'?'abstract_s':f.ch==='jao'?'calculation_s':f.ch==='jane'?'zord_s':f.ch==='cristyan'?'hammock_s':f.ch==='eneas'?'atom_s':'taunt';
    this.cine = { f, t: 0, dur: f.ch === 'caetano' ? 100 : f.ch === 'orango' ? 120 : 75 };
    this.moveBanner = { text: f.def.superName, color: f.def.color, t: 0, dur: 150 };
    this.flash = { c: f.def.glow, a: 0.8 };
    this.hype = 1;
  }

  private updateCine() {
    const c = this.cine!;
    const f = c.f;
    c.t++;
    const o = this.opp(f);
    this.camOv = { x: f.x + f.facing * 50, zoom: 1.75 };
    this.camOvT = 2;
    this.speed = 1;
    if (f.ch === 'caetano') {
      if (c.t === 1) {
        audio.purple();
        audio.boom(0.6);
        audio.say('Você não sabe de nada!', 1.1, 0.95);
      }
      if (c.t % 5 === 0) this.spark(f.x, FLOOR_Y - 100, '#c084fc', 3, 6, 3, 20);
    } else if (f.ch === 'orango') {
      if (c.t === 1) audio.roar();
      this.shake = Math.max(this.shake, 7);
      if (c.t % 4 === 0) this.spark(f.x, FLOOR_Y - 90, '#ff4a3a', 3, 7, 3, 20);
      if (c.t === c.dur - 22) {
        f.poseOverride = 'slam';
      }
      if (c.t === c.dur - 10) {
        this.ring(f.x + f.facing * 80, FLOOR_Y, '#ff3b2f', 380, 28, 14);
        this.ring(f.x + f.facing * 80, FLOOR_Y, '#ffb4a0', 240, 22, 8);
        this.shake = 34;
        this.flash = { c: '#ff2a2a', a: 0.7 };
        this.dust(f.x + f.facing * 80, FLOOR_Y, 16);
        audio.boom(1);
      }
    }
    if (f.ch !== 'caetano' && f.ch !== 'orango') {
      if (c.t === 1) {
        audio.tone(f.ch === 'tubarao' ? 160 : 520, 0.7, 'sawtooth', 0.22, 1000);
        audio.say(f.ch==='eneas'?'Ciência! Saúde! Tecnologia! Meu nome é Enéas!':f.def.superName, f.ch==='eneas'?1.8:f.ch === 'tubarao' ? 0.7 : 1.1, 1.05);
      }
      if (c.t % 5 === 0) {
        this.ring(f.x, FLOOR_Y - 100, f.def.glow, 90 + c.t * 2, 18, 3);
        this.spark(f.x, FLOOR_Y - 95, f.def.color, 4, 7, 3, 20);
      }
      this.shake = Math.max(this.shake, 3);
    }
    if (c.t >= c.dur) {
      this.cine = null;
      f.poseOverride = null;
      f.facing = o.x >= f.x ? 1 : -1;
      const sp = f.ch === 'caetano' ? 17 : f.ch === 'rickzera' ? 19 : 14;
      const m: Move = {
        ...f.def.moves.pL,
        id: 'super',
        kind: 'super',
        rank: 9,
        startup: 0,
        active: ['santox','jao','jane','cristyan','eneas'].includes(f.ch)?24:34,
        recovery: 34,
        whiff: 0,
        dmg: 0,
        hb: [0, 100, -10, 120],
        grab: 'super',
        unblockable: true,
        poses: ['rush', 'rush'],
        advance: [0, ['santox','jao','jane','cristyan','eneas'].includes(f.ch)?24:34, ['santox','jao','jane','cristyan','eneas'].includes(f.ch)?12:sp],
        trail: 'fa',
        label: undefined,
        turn: undefined,
        charge: false,
      };
      this.startMove(f, m);
      f.armor = true;
      f.glow = 1;
      f.aura = 1;
      audio.whoosh(2);
    }
  }

  private startSeq(kind: Seq['kind'], a: Fighter, d: Fighter) {
    const dur = { puxao: 86, mordida: 78, engole: 100, superC: 215, superO: 215, superT: 150, superR: 170, superB: 160, superN: 150, superG: 155, superA: 206,superS:180,superJ:195,superJane:180,superCristyan:185,superEneas:195, moon: 74, throw:60 }[kind];
    this.seq = { kind, a, d, t: 0, dur, x0: d.x };
    a.state = 'seq';
    d.state = 'seq';
    this.interruptBike(a);this.interruptBike(d);
    a.move = d.move = null;
    a.hbActive = d.hbActive = false;
    a.vx = d.vx = 0;
    a.armor = false;
    a.guard = d.guard = false;
    for(const p of this.projectiles)if(p.kind==='chess'&&p.owner===d.idx)p.life=0;
    a.crouch = d.crouch = false;
    a.turn = d.turn = 1;
    d.facing = (-a.facing) as 1 | -1;
    d.comboHits = ['superR','superG','superA','superS','superJ','superJane','superCristyan','superEneas','moon','throw'].includes(kind)?0:1;
    d.comboDmg = 0;
    if (kind.startsWith('super')) {
      a.y = 0;
      d.y = 0;
      this.seq.x0 = a.x + a.facing * 80;
      d.x = a.x + a.facing * 80;
    }
    this.hitstop = Math.max(this.hitstop, kind === 'puxao' || kind === 'mordida' ? 8 : 0);
    if (kind === 'puxao') {
      this.moveBanner = { text: 'PUXÃO DE CAMISA', color: a.def.color, t: 0, dur: 75 };
      audio.roar();
    }
    if (kind === 'mordida') audio.roar();
    this.shake = Math.max(this.shake, 6);
  }

  private seqHit(a: Fighter, d: Fighter, dmg: number, power: number, color: string) {
    this.dealDamage(a, d, dmg);
    d.comboHits++;
    if(a.idx===0)this.challengeEvent('combo',d.comboHits);
    const px = d.x + rand(-14, 14);
    const py = FLOOR_Y + d.y - rand(60, 120);
    audio.hit(Math.min(power, 3));
    this.spark(px, py, color, 10 + power * 4, 5 + power * 3, 3 + power, 16);
    this.spark(px, py, '#ffffff', 4, 7, 2, 9);
    this.glowFx(px, py, '#ffffff', 40 + power * 30, 7);
    this.ring(px, py, color, 40 + power * 25, 12, 4);
    this.shake = Math.max(this.shake, 5 + power * 4);
    this.hype = 1;
  }

  private updateSeq() {
    const s = this.seq!;
    const { a, d } = s;
    s.t++;
    const t = s.t;
    const f = a.facing;
    a.facing = f;
    d.facing = (-f) as 1 | -1;
    const lerpTo = (obj: Fighter, x: number, k: number) => {
      obj.x += (x - obj.x) * k;
    };

    if(s.kind==='throw'){
      a.poseOverride=t<28?'pH_s':'pH_a';d.poseOverride=t<28?'grabbed':'air';
      if(t<28){d.x=a.x+f*60;d.y=-Math.sin(t/28*Math.PI/2)*55;}
      if(t===28){s.x0=d.x;this.seqHit(a,d,70,1.6,a.def.glow);}
      if(t>=28){const u=Math.min(1,(t-28)/27);d.x=s.x0+f*145*u;d.y=-100*Math.sin(u*Math.PI);d.rotAdd=-u*Math.PI;if(t>55)d.poseOverride='down';}
    } else if (s.kind === 'puxao') {
      this.camOv = { x: (a.x + d.x) / 2, zoom: 1.35 };
      this.camOvT = 2;
      if (t <= 8) {
        lerpTo(d, a.x + f * 150, 0.4);
        a.poseOverride = 'grabHold';
        d.poseOverride = 'grabbed';
      } else if (t <= 28) {
        const u = (t - 8) / 20;
        d.x = a.x + f * (150 - 55 * easeOut(u));
        a.poseOverride = 'pullIn';
        d.poseOverride = 'grabbed';
        if (t % 3 === 0) this.dust(d.x, FLOOR_Y, 2);
        this.shake = Math.max(this.shake, 3);
        if (t === 12) audio.tone(200, 0.3, 'sawtooth', 0.25, 90);
      } else if (t <= 50) {
        const u = (t - 28) / 22;
        a.poseOverride = 'throwUp';
        d.poseOverride = 'grabbed';
        d.x = a.x + f * (95 - 215 * u);
        d.y = -200 * Math.sin(Math.PI * u);
        d.rotAdd = -u * Math.PI * 2.5;
        if (t === 29) audio.whoosh(2);
      } else {
        if (t === 51) {
          d.rotAdd = 0;
          d.y = 0;
          d.x = a.x - f * 120;
          d.poseOverride = 'down';
          a.poseOverride = 'throwDown';
          this.seqHit(a, d, a.def.moves.s2.dmg, 3, '#ff3b2f');
          this.shake = 30;
          this.flash = { c: '#ff2a2a', a: 0.6 };
          this.ring(d.x, FLOOR_Y, '#ff3b2f', 260, 24, 12);
          this.dust(d.x, FLOOR_Y, 18);
          audio.boom(0.9);
          this.hitstop = 8;
          this.text(d.x, FLOOR_Y - 110, 'BAM!', '#fecaca', 56);
        }
      }
    } else if (s.kind === 'mordida') {
      this.camOv = { x: (a.x + d.x) / 2, zoom: 1.5 };
      this.camOvT = 2;
      if (t <= 6) lerpTo(a, d.x - f * 70, 0.5);
      a.poseOverride = 'bite';
      d.poseOverride = 'hitLow';
      d.rotAdd = -0.25;
      d.y = Math.min(0, d.y * 0.8);
      if (t === 12 || t === 28 || t === 44) {
        this.seqHit(a, d, 28, 1.6, '#ff2a2a');
        audio.bite();
        d.y = -14;
        a.exprT = 6;
        a.exprOverride = 'n';
        this.text(d.x + f * 20, FLOOR_Y - 60, ['CRUNCH!', 'NHAC!', 'MORDE!'][(t - 12) / 16], '#fecaca', 40);
        this.shake = Math.max(this.shake, 9);
      }
      if (t === 60) {
        this.seqHit(a, d, 41, 2.6, '#ff2a2a');
        this.ring(d.x, FLOOR_Y - 30, '#ff3b2f', 200, 22, 10);
        this.flash = { c: '#ff2a2a', a: 0.5 };
        audio.roar();
      }
    } else if (s.kind === 'engole') {
      this.updateEngole(s);
    } else if (s.kind === 'superT') {
      this.updateSuperT(s);
    } else if (s.kind === 'superR') {
      this.updateSuperR(s);
    } else if (s.kind === 'moon') {
      this.updateMoon(s);
    } else if(s.kind==='superJane'||s.kind==='superCristyan'||s.kind==='superEneas'){
      this.updateTrioSuper(s);
    } else if(s.kind==='superS'||s.kind==='superJ'){
      this.updateViewerSuper(s);
    } else if (s.kind === 'superA') {
      this.updateSuperA(s);
    } else if (s.kind === 'superG') {
      this.updateSuperG(s);
    } else if (s.kind === 'superB') {
      this.updateSuperB(s);
    } else if (s.kind === 'superN') {
      this.updateSuperN(s);
    } else if (s.kind === 'superC') {
      this.updateSuperC(s);
    } else {
      this.updateSuperO(s);
    }

    this.pushAttackerBack(s);
    d.x = clamp(d.x, 40, 1560);
    a.x = clamp(a.x, 40, 1560);
    this.animate(a);
    this.animate(d);
    if (t >= s.dur) this.finishSeq(s);
  }

  private pushAttackerBack(_s: Seq) {
    /* reservado */
  }

  private updateViewerSuper(s:Seq){
    const {a,d,t}=s,santox=s.kind==='superS';
    a.poseOverride=santox?(t<45?'abstract_s':'abstract_a'):(t<48?'calculation_s':'calculation_a');
    d.poseOverride=t<45?'grabbed':t>s.dur-20?'down':'air';
    d.x=clamp(s.x0+a.facing*Math.sin(t*.04)*50,40,1560);d.y=t<45?0:-Math.sin(Math.min(1,(t-45)/(s.dur-65))*Math.PI)*110;
    const times=santox?[48,78,108,144]:[52,90,128,162];
    if(times.includes(t)){this.seqHit(a,d,santox?60:65,t===times[3]?2.8:1.5,a.def.glow);this.flash={c:a.def.color,a:.25};}
  }

  private updateTrioSuper(s:Seq){
    const {a,d,t}=s;
    a.poseOverride=a.ch==='jane'?(t<50?'zord_s':'zord_a'):a.ch==='cristyan'?(t<100?'hammock_s':t<145?'hammock_a':'slam_a'):(t<75?'atom_s':t>175?'shout_a':'atom_a');
    d.poseOverride=a.ch==='cristyan'&&t<125?'down':t>s.dur-18?'down':'air';
    d.x=clamp(s.x0+a.facing*45,40,1560);d.y=a.ch==='cristyan'&&t<125?-45:-Math.sin(t/s.dur*Math.PI)*75;
    const hits=a.ch==='jane'?[[65,50],[86,50],[107,50],[128,50],[149,50]]:a.ch==='cristyan'?[[55,30],[118,30],[153,200]]:[[143,240],[178,35]];
    for(const [at,dmg] of hits)if(t===at)this.seqHit(a,d,dmg,dmg>100?3:1.5,a.def.glow);
    if(a.ch==='eneas'&&t===178)audio.say('Meu nome é Enéas!',1.4,.75);
  }

  private updateEngole(s: Seq) {
    const { a, d, t } = s;
    const f = a.facing;
    this.camOv = { x: a.x + f * 35, zoom: 1.4 };
    this.camOvT = 2;
    a.poseOverride = t < 58 ? 'swallow_a' : 'bite_a';
    d.poseOverride = 'grabbed';
    if (t < 24) {
      d.x += (a.x + f * 35 - d.x) * 0.24;
      d.y = -Math.sin(t / 24 * Math.PI / 2) * 65;
    } else if (t < 58) {
      d.hidden = true;
      d.x = a.x;
      this.shake = Math.max(this.shake, 4);
      if (t % 8 === 0) this.ring(a.x, FLOOR_Y - 110, a.def.glow, 65, 16, 3);
    }
    if (t === 24) audio.bite();
    if (t === 58) {
      d.hidden = false;
      this.seqHit(a, d, a.def.moves.s2.dmg, 3, a.def.glow);
      this.text(a.x, FLOOR_Y - 180, 'DEVOLVIDO!', a.def.glow, 35);
      audio.boom(0.8);
    }
    if (t >= 58) {
      const u = clamp((t - 58) / 30, 0, 1);
      d.x = a.x + f * (50 + 270 * u);
      d.y = -160 * Math.sin(u * Math.PI);
      d.rotAdd = u * Math.PI * 2;
      d.poseOverride = t > 88 ? 'down' : 'air';
      if (t % 4 === 0) this.spark(d.x, FLOOR_Y + d.y - 70, a.def.glow, 5, 5, 3, 18);
    }
  }

  private updateSuperT(s: Seq) {
    const { a, d, t } = s;
    const f = a.facing;
    this.camOv = { x: (a.x + d.x) / 2, zoom: t < 85 ? 1.65 : 1.2 };
    this.camOvT = 2;
    a.aura = 1;
    a.poseOverride = t < 72 ? 'kiss' : 'fin_a';
    d.poseOverride = t < 72 ? 'grabbed' : 'air';
    if (t < 50) d.x += (a.x + f * 60 - d.x) * 0.15;
    if (t >= 28 && t <= 68 && t % 8 === 4) {
      this.text(a.x + f * 45, FLOOR_Y - 175, '♥', '#fb7185', 30 + (t % 3) * 8);
      this.ring(a.x + f * 45, FLOOR_Y - 145, '#fda4af', 50, 22, 3);
    }
    if (t === 72) {
      this.seqHit(a, d, 290, 4, a.def.glow);
      this.flash = { c: '#e0f2fe', a: 0.95 };
      this.shake = 40;
      this.hitstop = 12;
      this.text(d.x, FLOOR_Y - 160, 'FISCALIZADO!', '#bae6fd', 46);
      audio.boom(1.5);
      for (let i = 0; i < 5; i++) this.ring(d.x, FLOOR_Y - 80, i % 2 ? '#7dd3fc' : '#ffffff', 140 + i * 60, 30, 6);
    }
    if (t >= 72 && t < 110) {
      const u = (t - 72) / 38;
      d.x = s.x0 + f * 340 * u;
      d.y = -230 * Math.sin(u * Math.PI);
      d.rotAdd = -u * Math.PI * 2;
    }
    if (t >= 110) {
      d.y = 0;
      d.rotAdd = 0;
      d.poseOverride = 'down';
      a.poseOverride = 'win';
    }
  }

  private updateSuperR(s: Seq) {
    const { a, d, t } = s;
    const f = a.facing;
    this.camOv = { x: (a.x + d.x) / 2, zoom: 1.4 };
    this.camOvT = 2;
    a.aura = a.glow = 1;
    const beats = [18, 38, 58, 78, 98, 122];
    const i = beats.indexOf(t);
    a.poseOverride = t < 122 ? ['franco_a', 'pM_a', 'pix_a', 'kM_a', 'pH_a'][Math.min(4, Math.floor(t / 24))] : 'pix_a';
    d.poseOverride = 'hit';
    d.x = a.x + f * 105;
    if (i >= 0) {
      this.seqHit(a, d, i === 5 ? 155 : 25, i === 5 ? 4 : 1.4, a.def.glow);
      this.text(d.x, FLOOR_Y - 160, `WISE ${i + 1}x`, a.def.glow, i === 5 ? 54 : 32);
      for (let k = 0; k < 8; k++) this.streak(d.x, FLOOR_Y - 100, k * Math.PI / 4, '#86efac');
      if (i === 5) {
        this.flash = { c: '#86efac', a: 0.9 };
        this.shake = 42;
        this.hitstop = 12;
        audio.boom(1.4);
        this.ring(d.x, FLOOR_Y - 100, '#4ade80', 380, 28, 8);
      }
    }
    if (t > 122) {
      const u = clamp((t - 122) / 30, 0, 1);
      d.x = a.x + f * (105 + 300 * u);
      d.y = -120 * Math.sin(u * Math.PI);
      d.rotAdd = -u * Math.PI;
      d.poseOverride = t > 152 ? 'down' : 'air';
      if (t > 152) a.poseOverride = 'win';
    }
  }

  private updateMoon(s: Seq) {
    const { a, d, t } = s;
    const f = a.facing;
    this.camOv = { x: (a.x + d.x) / 2, zoom: t < 25 ? 1.3 : 0.9 };
    this.camOvT = 2;
    if (t < 25) {
      a.poseOverride = 'grabHold';
      d.poseOverride = 'grabbed';
      d.x += (a.x + f * 78 - d.x) * 0.3;
      d.y = 0;
    } else {
      a.poseOverride = t < 45 ? 'moon_a' : 'idle';
      d.poseOverride = 'air';
      const u = t - 25;
      d.x = a.x + f * (80 + u * 0.9);
      d.y = -14 * u + 0.18 * u * u;
      d.rotAdd = -Math.min(1, u / 35) * Math.PI * 2;
      if (t % 5 === 0) this.spark(d.x, FLOOR_Y + d.y - 70, '#e2e8f0', 4, 4, 3, 16);
    }
    if (t === 25) {
      this.seqHit(a, d, a.def.moves.s1.dmg, 2.4, a.def.glow);
      this.text(d.x, FLOOR_Y - 200, 'PRA LUA!', '#f8fafc', 42);
      this.ring(a.x + f * 65, FLOOR_Y - 70, '#e2e8f0', 140, 20, 5);
      audio.whoosh(2);
      audio.tone(260, 0.6, 'triangle', 0.15, 1500);
    }
  }

  private updateSuperA(s: Seq) {
    const { a, d, t } = s;
    const f = a.facing;
    this.camOv = { x: (a.x + d.x) / 2, zoom: 1.02 };
    this.camOvT = 2;
    a.y = -Math.abs(Math.sin(t * Math.PI / 12)) * 8;
    a.aura = a.glow = 1;
    a.poseOverride = Math.floor(t / 12) % 2 ? 'dance1' : 'dance2';
    d.poseOverride = t < 156 ? 'hit' : 'air';
    if (t < 45) d.x += (a.x + f * 155 - d.x) * .12;
    if (t === 1) audio.say('Yo soy de Bolivia!', 1.35, 1.05);
    if (t <= 156 && t % 12 === 0) {
      const notes = [392, 494, 587, 494, 440, 523, 659, 523];
      audio.tone(notes[Math.floor(t / 12) % notes.length], .16, 'triangle', .08);
      audio.noise(.045, .08, 1500, 'bandpass');
    }
    if (t >= 56 && t <= 136 && (t - 56) % 20 === 0) {
      this.seqHit(a, d, 24, 1.1, a.def.glow);
      d.x = a.x + f * (155 + (t - 56) * .65);
      if (t === 56) this.text(d.x, FLOOR_Y - 190, '¡BOLIVIA!', a.def.glow, 25);
    }
    if (t === 156) {
      s.x0 = d.x;
      this.seqHit(a, d, 170, 4, a.def.glow);
      this.flash = { c: '#fbcfe8', a: .85 };
      this.shake = 35;
      this.hitstop = 10;
      this.text(d.x, FLOOR_Y - 180, 'YO SOY DE BOLIVIA!', '#fef08a', 39);
      audio.boom(1.2);
    }
    if (t > 156 && t < 187) {
      const u = (t - 156) / 31;
      d.x = s.x0 + f * 200 * u;
      d.y = -150 * Math.sin(u * Math.PI);
      d.rotAdd = -u * Math.PI;
    }
    if (t >= 187) { d.y = 0; d.rotAdd = 0; d.poseOverride = 'down'; a.poseOverride = 'win'; }
    if (t % 3 === 0) {
      const colors = ['#ef4444', '#facc15', '#22c55e', '#ec4899'];
      this.spark(a.x + f * rand(-150, 360), FLOOR_Y - rand(140, 260), colors[Math.floor(t / 3) % 4], 3, 3, 3, 36);
    }
  }

  private updateSuperG(s: Seq) {
    const { a, d, t } = s;
    const f = a.facing;
    this.camOv = { x: (a.x + d.x) / 2, zoom: t < 65 ? 1.3 : 1.15 };
    this.camOvT = 2;
    a.aura = a.glow = 1;
    a.poseOverride = t < 65 ? 'tilt_s' : t < 105 ? 'tilt_a' : 'win';
    d.poseOverride = t < 65 ? 'grabbed' : t < 95 ? 'hitLow' : 'down';
    if (t < 65) d.x = a.x + f * 120;
    if (t >= 35 && t < 65) this.shake = Math.max(this.shake, 3 + (t - 35) * 0.2);
    if (t === 40) audio.tone(100, 0.5, 'sawtooth', 0.2, 400);
    if (t === 65) {
      s.x0 = d.x;
      this.seqHit(a, d, 315, 4.5, '#f8fafc');
      this.flash = { c: '#ffffff', a: 0.95 };
      this.expl = { t: 0, color: '#cbd5e1', dur: 50 };
      this.hitstop = 12;
      this.shake = 48;
      this.text(d.x, FLOOR_Y - 165, 'TILT!', '#f8fafc', 64);
      for (let i = 0; i < 6; i++) this.ring(d.x, FLOOR_Y - 55, i % 2 ? '#e2e8f0' : '#64748b', 130 + i * 65, 25 + i * 3, 8);
      this.dust(d.x, FLOOR_Y, 22);
      this.spark(d.x, FLOOR_Y - 70, '#d6b78b', 38, 13, 5, 32);
      audio.boom(1.7);
    }
    if (t >= 65 && t < 95) {
      const u = (t - 65) / 30;
      d.x = s.x0 + f * 160 * u;
      d.y = -45 * Math.sin(u * Math.PI);
      d.rotAdd = -u * Math.PI * 0.5;
    }
    if (t >= 95) {
      d.y = 0;
      d.rotAdd = 0;
    }
  }

  private updateSuperB(s: Seq) {
    const { a, d, t } = s;
    const f = a.facing;
    this.camOv = { x: (a.x + d.x) / 2, zoom: t < 70 ? 1.1 : 1.3 };
    this.camOvT = 2;
    a.poseOverride = t < 112 ? 'drive' : 'win';
    a.aura = 1;
    d.poseOverride = t < 70 ? 'grabbed' : t < 112 ? 'air' : 'down';
    if (t < 70) {
      a.x += f * (t < 35 ? 0.5 : 2);
      d.x = a.x + f * 112;
      if (t % 5 === 0) this.dust(a.x - f * 55, FLOOR_Y, 3);
    }
    if (t === 35) audio.tone(85, 0.8, 'sawtooth', 0.25, 340);
    if (t === 70) {
      s.x0 = d.x;
      this.seqHit(a, d, 275, 4, a.def.glow);
      this.flash = { c: '#e9d5ff', a: 0.9 };
      this.shake = 42;
      this.hitstop = 12;
      this.text(d.x, FLOOR_Y - 170, 'PRESTÍGIO!', a.def.glow, 47);
      for (let i = 0; i < 5; i++) this.ring(d.x, FLOOR_Y - 80, i % 2 ? '#ffffff' : a.def.color, 140 + i * 55, 28, 7);
      audio.boom(1.5);
    }
    if (t >= 70 && t < 112) {
      const u = (t - 70) / 42;
      d.x = s.x0 + f * 310 * u;
      d.y = -245 * Math.sin(u * Math.PI);
      d.rotAdd = -u * Math.PI * 3;
    }
    if (t >= 112) {
      d.y = 0;
      d.rotAdd = 0;
      if (t === 112) {
        this.dust(d.x, FLOOR_Y, 18);
        this.ring(d.x, FLOOR_Y, a.def.color, 230, 24, 8);
      }
    }
  }

  private updateSuperN(s: Seq) {
    const { a, d, t } = s;
    const f = a.facing;
    this.camOv = { x: (a.x + d.x) / 2, zoom: t < 60 ? 1.3 : 1.1 };
    this.camOvT = 2;
    a.poseOverride = t < 100 ? 'bazooka' : 'win';
    a.aura = a.glow = 1;
    d.poseOverride = t < 60 ? 'grabbed' : t < 105 ? 'air' : 'down';
    if (t < 35) d.x = a.x + f * 300;
    if (t === 35) {
      const move: Move = { ...a.def.moves.s1, id: 'arena', dmg: 285, kind: 'super' };
      this.projectiles.push({ owner: a.idx, kind: 'bazooka', x: a.x + f * 70, y: -105, vx: f * 10, life: 30, serial: a.serial, move, age: 0, radius: 24 });
      audio.noise(0.25, 0.3, 1500, 'lowpass');
      audio.tone(120, 0.3, 'sawtooth', 0.24, 40);
    }
    // The bazooka is simulated in this cinematic; its impact is synchronized below.
    for (const p of this.projectiles.filter((p) => p.kind === 'bazooka' && p.owner === a.idx)) {
      p.x += p.vx;
      p.age = (p.age ?? 0) + 1;
      p.life--;
    }
    if (t === 60) {
      this.projectiles = this.projectiles.filter((p) => p.kind !== 'bazooka' || p.owner !== a.idx);
      s.x0 = d.x;
      this.seqHit(a, d, 285, 4.5, '#fde68a');
      this.expl = { t: 0, color: '#f59e0b', dur: 65 };
      this.flash = { c: '#fff7d6', a: 1 };
      this.shake = 48;
      this.hitstop = 12;
      this.text(d.x, FLOOR_Y - 180, 'ARENA!', '#fde68a', 60);
      for (let i = 0; i < 7; i++) this.ring(d.x, FLOOR_Y - 90, i % 2 ? '#fff7d6' : '#f97316', 130 + i * 65, 28 + i * 2, 9);
      this.spark(d.x, FLOOR_Y - 85, '#fde68a', 55, 15, 5, 30);
      audio.boom(1.8);
    }
    if (t >= 60 && t < 105) {
      const u = (t - 60) / 45;
      d.x = s.x0 + f * 250 * u;
      d.y = -225 * Math.sin(u * Math.PI);
      d.rotAdd = -u * Math.PI * 2;
    }
    if (t >= 105) {
      d.y = 0;
      d.rotAdd = 0;
      if (t === 105) this.dust(d.x, FLOOR_Y, 20);
    }
  }

  private updateSuperC(s: Seq) {
    const { a, d, t } = s;
    const f = a.facing;
    const mid = (a.x + d.x) / 2;
    this.camOv = { x: mid, zoom: t > 56 && t < 165 ? 1.25 : 1.6 };
    this.camOvT = 2;
    this.speed = Math.max(this.speed, 0.6);
    a.aura = 1;
    a.glow = 1;
    if (t <= 6) a.x += (s.x0 - f * 75 - a.x) * 0.4;
    if (t >= 4 && t <= 52 && (t - 4) % 8 === 0) {
      const i = (t - 4) / 8;
      a.poseOverride = ['pL_a', 'kM_a', 'pM_a', 'kL_a', 'pH_a', 'kH_a', 'pM_a'][i];
      d.poseOverride = i % 2 ? 'hit' : 'hitLow';
      d.x = a.x + f * (75 + (i % 2 ? 6 : -6));
      this.seqHit(a, d, 14, 1.0, '#c084fc');
      for (let k = 0; k < 6; k++) this.streak(d.x, FLOOR_Y - 90, rand(0, Math.PI * 2), '#e9d5ff');
    }
    if (t === 58) {
      a.poseOverride = 'kH_a';
      this.seqHit(a, d, 20, 2, '#e9d5ff');
      audio.purple();
    }
    if (t >= 58 && t <= 86) {
      const u = clamp((t - 58) / 26, 0, 1);
      d.y = -170 * easeOut(u);
      d.poseOverride = 'air';
      if (t > 64) a.y = -160 * easeOut(clamp((t - 64) / 22, 0, 1));
    }
    if (t > 86 && t < 140) {
      d.y = -170 + Math.sin(t * 0.4) * 6;
      a.y = d.y * 0.93;
      d.x = a.x + f * 74;
      d.rotAdd = Math.sin(t * 0.3) * 0.2;
    }
    if (t >= 90 && t <= 117 && (t - 90) % 9 === 0) {
      const i = (t - 90) / 9;
      a.poseOverride = ['pL_a', 'kM_a', 'pM_a', 'kL_a'][i];
      this.seqHit(a, d, 18, 1.2, '#c084fc');
    }
    if (t === 124) {
      a.poseOverride = 'chute_s';
      audio.purple();
    }
    if (t >= 124 && t <= 138) {
      const u = (t - 124) / 14;
      const c = Math.cos(u * Math.PI * 2);
      a.turn = Math.abs(c) < 0.18 ? (c < 0 ? -0.18 : 0.18) : c;
      a.aura = 1;
    }
    if (t === 139) {
      a.turn = 1;
      a.poseOverride = 'chute_a';
      audio.whoosh(3);
      this.flash = { c: '#c084fc', a: 0.5 };
    }
    if (t === 142) {
      this.seqHit(a, d, 130, 4, '#e9d5ff');
      this.flash = { c: '#ffffff', a: 1 };
      this.shake = 42;
      this.hitstop = 10;
      audio.boom(1.2);
      this.text(d.x, FLOOR_Y + d.y - 90, 'CONSPIRAÇÃO!', '#f5d0fe', 56);
    }
    if (t > 142 && t <= 158) {
      const u = (t - 142) / 16;
      d.x = s.x0 + f * 380 * u;
      d.y = -170 * (1 - u * u);
      d.poseOverride = 'air';
      d.rotAdd = -u * Math.PI * 3;
      a.y += (0 - a.y) * 0.12;
    }
    if (t === 159) {
      d.y = 0;
      d.rotAdd = 0;
      d.poseOverride = 'down';
      this.expl = { t: 0, color: '#c084fc', dur: 55 };
      for (let i = 0; i < 5; i++) this.ring(d.x, FLOOR_Y - 20, i % 2 ? '#e9d5ff' : '#a855f7', 160 + i * 110, 26 + i * 4, 14);
      this.spark(d.x, FLOOR_Y - 40, '#e9d5ff', 90, 18, 6, 40);
      this.spark(d.x, FLOOR_Y - 40, '#a855f7', 60, 12, 8, 46);
      this.glowFx(d.x, FLOOR_Y - 60, '#ffffff', 520, 30);
      this.dust(d.x, FLOOR_Y, 24);
      this.flash = { c: '#ffffff', a: 1 };
      this.shake = 55;
      this.camOv = { x: d.x, zoom: 1.2 };
      audio.boom(2);
    }
    if (t > 158) {
      a.y += (0 - a.y) * 0.15;
      if (t > 170) {
        a.poseOverride = 'win';
        a.turn = 1;
      }
      this.camOv = { x: (a.x + d.x) / 2 + f * 120, zoom: 1.15 };
    }
  }

  private updateSuperO(s: Seq) {
    const { a, d, t } = s;
    const f = a.facing;
    const mid = (a.x + d.x) / 2;
    this.camOv = { x: mid, zoom: t > 74 && t < 190 ? 1.25 : 1.55 };
    this.camOvT = 2;
    this.speed = Math.max(this.speed, 0.6);
    a.aura = 1;
    a.glow = 1;
    if (t <= 6) a.x += (s.x0 - f * 105 - a.x) * 0.4;
    if (t >= 4 && t <= 68 && (t - 4) % 8 === 0) {
      const i = (t - 4) / 8;
      a.poseOverride = ['pL_a', 'pM_a', 'pH_a', 'kL_a', 'pM_a', 'pH_a', 'kM_a', 'pL_a', 'pH_a'][i];
      d.poseOverride = i % 2 ? 'hit' : 'hitLow';
      d.x = a.x + f * (105 + (i % 2 ? 8 : -8));
      this.seqHit(a, d, i === 8 ? 24 : 14, 1.5, '#ff3b2f');
      if (i % 3 === 0) a.exprT = 8;
      a.exprOverride = 'shout';
      this.shake = Math.max(this.shake, 12);
      for (let k = 0; k < 6; k++) this.streak(d.x, FLOOR_Y - 90, rand(0, Math.PI * 2), '#ff7a5c');
    }
    if (t === 76) {
      a.poseOverride = 'throwUp';
      this.seqHit(a, d, 25, 2.2, '#ff3b2f');
      audio.roar();
    }
    if (t >= 76 && t <= 100) {
      const u = clamp((t - 76) / 24, 0, 1);
      d.y = -170 * easeOut(u);
      d.poseOverride = 'air';
    }
    if (t > 100 && t < 154) {
      d.y = -170 + Math.sin(t * 0.4) * 6;
      d.rotAdd = Math.sin(t * 0.3) * 0.2;
    }
    if (t === 104) {
      a.poseOverride = 'roar';
      audio.roar();
      this.flash = { c: '#ff2a2a', a: 0.6 };
    }
    if (t >= 104 && t < 150) {
      this.shake = Math.max(this.shake, 6 + (t - 104) * 0.2);
      if (t % 2 === 0) {
        const tip = this.tipPos(a, 'wF');
        const ang = rand(0, Math.PI * 2);
        const dd = 130 - (t - 104) * 2;
        this.parts.push({ type: 'spark', x: tip.x + Math.cos(ang) * dd, y: tip.y + Math.sin(ang) * dd, vx: -Math.cos(ang) * 6, vy: -Math.sin(ang) * 6, life: 18, max: 18, size: 4, color: '#ff5a3a', g: 0, rot: 0, grow: 0 });
      }
    }
    if (t === 118) a.poseOverride = 'dedo_s';
    if (t === 150) {
      a.poseOverride = 'dedo_a';
      audio.red();
      audio.whoosh(3);
      this.flash = { c: '#ff2a2a', a: 0.8 };
    }
    if (t === 154) {
      this.seqHit(a, d, 180, 4.5, '#ff3b2f');
      this.flash = { c: '#ff2a2a', a: 1 };
      this.shake = 50;
      this.hitstop = 10;
      this.expl = { t: 0, color: '#ff2a2a', dur: 70 };
      for (let i = 0; i < 6; i++) this.ring(d.x, FLOOR_Y + d.y, i % 2 ? '#ffb4a0' : '#ff2a2a', 200 + i * 110, 28 + i * 4, 16);
      this.text(d.x, FLOOR_Y + d.y - 90, 'DEDILHO SUPREMO!', '#fecaca', 60);
      audio.boom(2);
    }
    if (t > 154 && t <= 174) {
      const u = (t - 154) / 20;
      d.x = s.x0 + f * 440 * u;
      d.y = -170 * (1 - u * u);
      d.poseOverride = 'air';
      d.rotAdd = -u * Math.PI * 3;
    }
    if (t === 175) {
      d.y = 0;
      d.rotAdd = 0;
      d.poseOverride = 'down';
      for (let i = 0; i < 4; i++) this.ring(d.x, FLOOR_Y - 20, '#ff2a2a', 200 + i * 130, 28, 14);
      this.spark(d.x, FLOOR_Y - 40, '#ff6a4a', 80, 18, 7, 40);
      this.glowFx(d.x, FLOOR_Y - 60, '#ffffff', 560, 30);
      this.dust(d.x, FLOOR_Y, 24);
      this.flash = { c: '#ff2a2a', a: 1 };
      this.shake = 55;
      audio.boom(2);
      this.camOv = { x: d.x, zoom: 1.2 };
    }
    if (t > 175) {
      this.camOv = { x: (a.x + d.x) / 2 + f * 120, zoom: 1.15 };
      if (t === 190) {
        a.poseOverride = 'roar';
        audio.roar();
      }
    }
  }

  private finishSeq(s: Seq) {
    const { a, d } = s;
    this.seq = null;
    a.state = 'ground';
    a.stateT = 0;
    a.poseOverride = null;
    a.landLag = 10;
    a.y = 0;
    a.turn = 1;
    a.glow = a.aura = 0;
    a.armor = false;
    d.hidden = false;
    d.rotAdd = 0;
    d.poseOverride = null;
    d.turn = 1;
    d.facing = (-a.facing) as 1 | -1;
    if (s.kind === 'moon') {
      a.landLag = 3;
      d.state = 'launched';
      d.y = Math.min(-200, d.y);
      d.vy = 1.5;
      d.vx = a.facing * 2;
      d.juggle = 1;
    } else if (s.kind === 'mordida') {
      d.state = 'launched';
      d.y = -2;
      d.vy = -8;
      d.vx = a.facing * 6;
      d.juggle = 1;
    } else {
      d.state = 'down';
      d.stateT = s.kind === 'puxao' ? 18 : 0;
      d.y = 0;
      d.vx = 0;
    }
    d.x = clamp(d.x, 40, 1560);
    a.x = clamp(a.x, 40, 1560);
    if (Math.abs(a.x - d.x) < 60) a.x = d.x - a.facing * 60;
    a.x = clamp(a.x, 40, 1560);
    if (d.hp <= 0) this.triggerKO(a, d);
  }

  // ------------------------------------------------------------ animação
  private animate(f: Fighter) {
    f.animT++;
    const def = f.def;
    let name = 'idle';
    let k = 0.32;
    const m = f.move;
    switch (f.state) {
      case 'ground':
        name = f.guard ? (f.crouch ? 'blockC' : 'block') : f.crouch ? 'crouch' : 'idle';
        if (f.landLag > 0) name = 'crouch';
        break;
      case 'dash':
        name = f.vx * f.facing > 0 ? 'rush' : 'jump';
        k = 0.4;
        break;
      case 'jump':
        name = 'jump';
        break;
      case 'dizzy':
        name='dizzy';break;
      case 'attack':
        if (m) {
          const t = f.moveT;
          if (t < m.startup) {
            name = m.poses[0];
            k = 0.4;
          } else if (t < m.startup + m.active) {
            name = m.poses[1];
            k = 0.8;
          } else name = m.air ? 'jump' : f.crouch ? 'crouch' : 'idle';
        }
        break;
      case 'hit':
        name = f.stunLow ? 'hitLow' : 'hit';
        k = 0.5;
        break;
      case 'block':
        name = f.crouch ? 'blockC' : 'block';
        k = 0.5;
        break;
      case 'launched':
        name = 'air';
        k = 0.25;
        break;
      case 'down':
        name = 'down';
        k = 0.35;
        break;
      case 'getup':
        name = 'getup';
        break;
      case 'win':
        name = 'win';
        break;
      default:
        break;
    }
    if (f.poseOverride) {
      name = f.poseOverride;
      k = 0.5;
    }
    const base = def.poses[name] || def.poses.idle;
    const t: Pose = { ...base };
    const s = Math.sin(f.animT * (f.ch === 'orango' ? 0.2 : 0.27));
    if (f.state === 'ground' && !f.guard && !f.crouch && !f.poseOverride) {
      if (f.walking !== 0) {
        t.fl1 += s * 22;
        t.bl1 -= s * 22;
        t.fl2 += s * 12;
        t.bl2 -= s * 12;
        if (f.ch === 'orango') {
          t.fa1 += s * 10;
          t.ba1 -= s * 10;
        }
      } else {
        t.lean += Math.sin(f.animT * 0.09) * 1.6;
        t.fa1 += Math.sin(f.animT * 0.09) * 3;
      }
    }
    if (f.state === 'launched') t.rot = -0.5 - Math.min(f.stateT * 0.09, 1.9);
    if (f.state === 'win') {
      if (f.ch === 'orango') {
        const w = Math.sin(f.animT * 0.55);
        t.fa2 = -150 + 30 * w;
        t.ba2 = -150 - 30 * w;
        t.lean += Math.sin(f.animT * 0.27) * 3;
      } else {
        t.lean += Math.sin(f.animT * 0.07) * 1.5;
      }
    }
    f.pose = lerpPose(f.pose, t, k);
    f.rig = computeRig(f.ch, f.pose);
    // expressão
    let expr: 'n' | 'hit' | 'shout' = 'n';
    if (f.exprT > 0) {
      f.exprT--;
      expr = f.exprOverride;
    } else if (f.state === 'hit' || f.state === 'launched' || f.state === 'down' || (f.state === 'seq' && f.poseOverride && ['hit', 'hitLow', 'grabbed', 'air', 'down'].includes(f.poseOverride))) expr = 'hit';
    else if (f.pose.mouth > 0.5 && !(f.ch === 'caetano' && f.state === 'win')) expr = 'shout';
    f.expr = expr;
    // rastro
    if (!(f.state === 'attack' && m && m.trail)) {
      if (f.trail.length) f.trail.shift();
    }
    if (f.state !== 'attack' && f.state !== 'cine' && f.aura > 0 && f.glow === 0) f.aura = Math.max(0, f.aura - 0.08);
    // Caetano vence com sorriso confiante; Orango ruge
    if (f.state === 'win' && f.ch === 'orango' && f.animT % 60 === 0) audio.roar();
  }

  // ------------------------------------------------------------ câmera & efeitos
  private updateCamera() {
    const [a, b] = this.f;
    const sep = Math.abs(a.x - b.x);
    let tx = (a.x + b.x) / 2;
    let tz = clamp(1.0 + ((880 - sep) / 880) * 0.38, 1.0, 1.3);
    if (this.camOv) {
      tx = this.camOv.x;
      tz = this.camOv.zoom;
    } else if (this.phase === 'roundEnd' || this.phase === 'matchEnd') {
      const w = a.state === 'win' ? a : b.state === 'win' ? b : null;
      if (w) {
        tx = w.x;
        tz = 1.45;
      }
    }
    const kx = this.camOv ? 0.2 : 0.14;
    this.cam.x += (tx - this.cam.x) * kx;
    this.cam.zoom += (tz - this.cam.zoom) * (this.camOv ? 0.18 : 0.1);
    const half = 480 / this.cam.zoom;
    this.cam.x = clamp(this.cam.x, half, 1600 - half);
  }

  private updateTraining() {
    if (!this.training) return;
    const d = this.f[1];
    const a = this.f[0];
    if(a.crouch&&a.y===0)this.challengeEvent('crouch');
    for (const f of this.f) {
      if (f.state === 'ground' && f.hp < f.maxHp) {
        this.train.idle++;
        if (this.train.idle > 90) f.hp = Math.min(f.maxHp, f.hp + 12);
      }
    }
    if (d.hp < d.maxHp && (d.state === 'hit' || d.state === 'launched')) this.train.idle = 0;
    if (a.hp < a.maxHp && (a.state === 'hit' || a.state === 'launched')) this.train.idle = 0;
    if (d.comboHits > 0) {
      this.train.combo = d.comboHits;
      this.train.total = d.comboDmg;
    }
  }

  private updateFx() {
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.life--;
      if (p.life <= 0) {
        this.parts.splice(i, 1);
        continue;
      }
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.g;
      p.size += p.grow;
      if (p.type === 'spark' || p.type === 'dust') {
        p.vx *= 0.96;
      }
      if (p.type === 'leaf') {
        p.x += Math.sin(this.tick * 0.05 + p.rot) * 0.6;
        if (p.x < -50) p.x = 1650;
        if (p.y > FLOOR_Y + 90) {
          p.y = -20;
          p.life = p.max;
        }
      }
    }
    if (this.parts.length > 700) this.parts.splice(0, this.parts.length - 700);
    // folhas ambientes
    if (this.tick % 40 === 0 && this.parts.filter((p) => p.type === 'leaf').length < 22) {
      this.parts.push({ type: 'leaf', x: rand(0, 1600), y: rand(-20, 200), vx: rand(-2.2, -0.7), vy: rand(0.4, 1.2), life: 100000, max: 100000, size: rand(4, 8), color: Math.random() < 0.5 ? '#e8764a' : '#f2b366', g: 0, rot: rand(0, 6), grow: 0 });
    }
  }

  // ------------------------------------------------------------ helpers de partículas
  spark(x: number, y: number, color: string, n: number, spd: number, size = 3, life = 18) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const v = rand(spd * 0.3, spd);
      this.parts.push({ type: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1, life: life * rand(0.6, 1), max: life, size: size * rand(0.6, 1.2), color, g: 0.15, rot: a, grow: -0.05 });
    }
  }
  ring(x: number, y: number, color: string, maxR: number, life = 20, lw = 6) {
    this.parts.push({ type: 'ring', x, y, vx: 0, vy: 0, life, max: life, size: 8, color, g: 0, rot: lw, grow: (maxR - 8) / life });
  }
  glowFx(x: number, y: number, color: string, size: number, life = 10) {
    this.parts.push({ type: 'glow', x, y, vx: 0, vy: 0, life, max: life, size, color, g: 0, rot: 0, grow: 0 });
  }
  streak(x: number, y: number, ang: number, color: string) {
    const v = rand(10, 22);
    this.parts.push({ type: 'streak', x, y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, life: 12, max: 12, size: rand(20, 50), color, g: 0, rot: ang, grow: 0 });
  }
  dust(x: number, y: number, n: number) {
    for (let i = 0; i < n; i++) this.parts.push({ type: 'dust', x: x + rand(-16, 16), y: y + rand(-4, 4), vx: rand(-2, 2), vy: rand(-1.8, -0.2), life: 26, max: 26, size: rand(4, 9), color: '#d7b894', g: -0.02, rot: 0, grow: 0.25 });
  }
  text(x: number, y: number, txt: string, color: string, size = 40) {
    this.parts.push({ type: 'text', x, y, vx: 0, vy: -0.7, life: 50, max: 50, size, color, g: 0, rot: rand(-0.12, 0.12), grow: 0, text: txt });
  }
}
