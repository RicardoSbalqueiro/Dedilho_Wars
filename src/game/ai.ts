// IA do computador: aproxima, defende, combina golpes, usa especiais e super.
import type { Game, Fighter, Difficulty } from './engine';
import type { Action } from './input';

// Include stationary hazards and choose the nearest threat, not array insertion order.
// Chess has no damage and must not trick the CPU into holding guard forever.
export function incomingProjectile(g:Game,f:Fighter){
 return g.projectiles.filter(p=>{
  if(p.owner===f.idx||p.life<=0||p.move.dmg<=0)return false;
  const dx=f.x-p.x;
  if(p.vx===0)return Math.abs(dx)<(p.radius??20)+f.def.pushW+30;
  return Math.abs(dx)<280&&dx*p.vx>0;
 }).sort((a,b)=>Math.abs(a.x-f.x)-Math.abs(b.x-f.x))[0];
}

export interface AIState {
  tapAt: Partial<Record<Action, number>>;
  thinkT: number;
  walk: number; // +1 aproxima, -1 afasta, 0 parado
  stopDist: number;
  seen: number;
  blockT: number;
  blockUntil: number;
  blockLow: boolean;
  guardT: number;
  plan: Action[];
  planStep: number;
  expectSerial: number;
  dashAt: number;
  crouchT: number;
  bikeUntil:number;
}

export function newAI(): AIState {
  return { tapAt: {}, thinkT: 0, walk: 0, stopDist: 120, seen: -1, blockT: 0, blockUntil: -1, blockLow: false, guardT: 0, plan: [], planStep: 0, expectSerial: -1, dashAt: -1, crouchT: 0,bikeUntil:0 };
}

const PROFILE = {
  easy: { react: 22, block: 0.3, aggr: 0.35, spec: 0.25, combo: 2, mistake: 0.25, mash: 4.5, sup: 0.2 },
  normal: { react: 11, block: 0.6, aggr: 0.6, spec: 0.45, combo: 3, mistake: 0.12, mash: 7.5, sup: 0.5 },
  hard: { react: 4, block: 0.85, aggr: 0.85, spec: 0.7, combo: 4, mistake: 0.04, mash: 11, sup: 0.9 },
};

export function aiMashRate(d: Difficulty) {
  return PROFILE[d].mash;
}

const rnd = Math.random;

export function aiAct(g: Game, f: Fighter, diff: Difficulty) {
  const o = g.opp(f);
  const P = PROFILE[diff];
  const ai = f.ai;
  const pad = f.pad;
  const tk = g.tick;

  for (const k in ai.tapAt) {
    const a = k as Action;
    if (tk - (ai.tapAt[a] as number) >= 2) {
      pad.set(a, false, tk);
      delete ai.tapAt[a];
    }
  }
  const tap = (a: Action) => {
    pad.set(a, true, tk);
    ai.tapAt[a] = tk;
  };
  if(f.ch==='jane'&&f.move?.id==='s2')pad.set('s2',tk<ai.bikeUntil,tk);

  const dx = o.x - f.x;
  const dist = Math.abs(dx);
  const dir = dx >= 0 ? 1 : -1;
  const canAct = f.state === 'ground' || f.state === 'dash';
  // Prepare held defense during stun/recovery; the engine alone decides when it is legal.
  const canPrepareGuard=['ground','dash','hit','block','getup'].includes(f.state)&&!f.ko;
  let block = false;
  let crouch = false;
  let forced: number | null = null;

  // ---------- defesa ----------
  if (f.state === 'block') {
    block = true;
    crouch = f.crouch;
  }
  const incoming = incomingProjectile(g,f);
  if (incoming && canPrepareGuard && rnd() < P.block * 0.12) ai.guardT = tk + 24;
  if (f.ch === 'rickzera' && f.state === 'jump' && f.airJumps < 2 && f.vy > 0 && dist > 170 && rnd() < P.aggr * 0.08) tap('up');
  if (f.ch === 'renngotti' && f.state === 'jump' && !f.airAttacked && Math.abs(o.y - f.y) < 125 && dist < 150 && rnd() < P.aggr * 0.2) tap(rnd() < 0.5 ? 'p' : 'k');
  const mv = o.move;
  if (o.state === 'attack' && mv && !mv.grab && o.serial !== ai.seen && dist < mv.hb[1] + 60) {
    ai.seen = o.serial;
    if (rnd() < P.block) {
      ai.blockT = tk + P.react + Math.floor(rnd() * 4);
      ai.blockUntil = ai.blockT + mv.startup + mv.active + 6;
      ai.blockLow = mv.level === 'low';
    }
  }
  if (o.state === 'attack' && mv && mv.grab && dist < 170 && P.react < 12 && rnd() < 0.04 && canAct) tap('up');
  if (tk >= ai.blockT && tk <= ai.blockUntil && canPrepareGuard) {
    block = true;
    crouch = ai.blockLow;
  }
  if (tk < ai.guardT && canPrepareGuard && (dist < 230 || incoming)) {
    block = true;
    if (incoming?.move.level === 'low') crouch = true;
  }

  if(f.manualFacing&&f.facing!==dir&&f.state==='ground'&&f.landLag===0)tap('turn');

  // ---------- planos de combo ----------
  if (ai.plan.length) {
    if (ai.planStep === 0) {
      if (f.state === 'ground' && !block) {
        const a = ai.plan[0];
        ai.expectSerial = f.serial + 1;
        ai.planStep = 1;
        forced = a === 'p' || a === 'k' ? 0 : null;
        tap(a);
      }
    } else if (f.state === 'attack' && f.serial === ai.expectSerial) {
      if (f.connected && ai.planStep < ai.plan.length) {
        const a = ai.plan[ai.planStep];
        ai.expectSerial = f.serial + 1;
        ai.planStep++;
        forced = 0;
        tap(a);
      } else if (!f.connected && f.move && f.moveT > f.move.startup + f.move.active + 2) {
        ai.plan = [];
        ai.planStep = 0;
      }
    } else if (f.state !== 'attack') {
      ai.plan = [];
      ai.planStep = 0;
    }
    if (f.state === 'attack' && f.connected && f.meter >= 100 && rnd() < P.sup * 0.05 && f.move && f.move.kind !== 'super') tap('super');
  }

  // ---------- decisão ----------
  if (canAct && !block && !ai.plan.length && tk >= ai.thinkT) {
    ai.thinkT = tk + 5 + Math.floor(rnd() * (10 + (1 - P.aggr) * 30));
    if (rnd() < P.mistake) {
      ai.walk = rnd() < 0.5 ? 0 : rnd() < 0.5 ? 1 : -1;
    } else decide();
  }

  function startPlan(list: Action[]) {
    const n = Math.max(1, Math.min(list.length, P.combo));
    ai.plan = list.slice(0, n);
    if (rnd() < P.spec && n >= 2) {
      const choices: Action[] = f.ch === 'caetano' ? ['s1', 's2', 's3'] : f.ch==='santox'?['s1','s2']:f.ch==='jao'?['s2','s3']:f.ch === 'renngotti' ? ['s2', 's3'] : ['s1', 's3'];
      ai.plan[n - 1] = choices[Math.floor(rnd() * choices.length)];
    }
    ai.planStep = 0;
  }

  function decide() {
    const r = rnd();
    const oDown = o.state === 'down' || o.state === 'getup' || o.state === 'launched';
    if (f.meter >= 100 && dist < 480 && (oDown || o.state === 'hit' || o.state === 'block' || rnd() < 0.2) && rnd() < P.sup) {
      tap('super');
      return;
    }
    if(dist<82&&o.y===0&&o.guard&&o.blockstun<=0&&o.throwShield===0&&r<.3){tap('grab');return;}
    if(o.move&&o.state==='attack'&&o.y===0&&o.moveT>=o.move.startup+o.move.active&&
      o.move.startup+o.move.active+o.move.recovery+(o.connected?0:o.move.whiff)-o.moveT>f.def.moves.headbutt.startup+2&&
      dist<f.def.moves.headbutt.hb[1]+o.def.pushW&&r<P.aggr*.3){tap('headbutt');ai.walk=0;return;}
    if (f.ch === 'caetano') {
      if (dist > 300) {
        ai.walk = 1;
        ai.stopDist = 150;
        if (r < 0.2 * P.aggr && f.state === 'ground') ai.dashAt = tk + 4;
        else if (r < 0.28) tap('up');
      } else if (dist > 170) {
        if (r < 0.35 * P.spec + 0.1) tap('s2');
        else if (r < 0.5) {
          forced = -1;
          tap('k');
        } else if (r < 0.6 && oDown) tap('s3');
        else {
          ai.walk = 1;
          ai.stopDist = 110;
        }
      } else if (r < P.aggr) {
        const plans: Action[][] = [['p', 'p', 'p', 's1'], ['k', 'k', 'k', 's2'], ['p', 'p', 'k', 's1'], ['k', 'p', 'p', 's3'], ['p', 'k', 'p', 's1']];
        startPlan(plans[Math.floor(rnd() * plans.length)]);
      } else if (r < P.aggr + 0.15) {
        ai.walk = -1;
        ai.stopDist = 400;
      } else ai.guardT = tk + 20 + Math.floor(rnd() * 30);
    } else if(f.ch==='jane'){
      if(dist>420){ai.walk=1;ai.stopDist=300;if(f.rangedCooldown===0&&r<P.spec*.5)tap('s1');}
      else if(dist>180&&f.rangedCooldown===0){tap('s1');ai.walk=dist<230?-1:0;ai.stopDist=270;}
      else if(dist<120&&f.bikeCooldown===0&&r<P.spec*.35){ai.bikeUntil=tk+45+Math.floor(rnd()*110);tap('s2');ai.walk=0;}
      else if(dist<150&&r<P.spec*.65){tap('s3');ai.walk=0;}
      else if(dist<110&&r<P.aggr)startPlan(['p','p','k','s3']);
      else {ai.walk=dist<180?-1:1;ai.stopDist=260;}
    } else if(f.ch==='cristyan'){
      if(dist>270){ai.walk=1;ai.stopDist=140;if(r>.8)ai.dashAt=tk+4;}
      else if(dist>150){if(r<P.spec*.55)tap('s1');else {ai.walk=1;ai.stopDist=95;}}
      else if(o.state==='attack'&&o.move&&o.moveT>=o.move.startup+o.move.active&&r<P.spec)tap('s2');
      else if(r<P.aggr+.1)startPlan(rnd()<.5?['p','p','k','s1']:['k','p','k','s3']);
      else ai.guardT=tk+22;
    } else if(f.ch==='eneas'){
      if(dist>480){ai.walk=1;ai.stopDist=320;}
      else if(dist>150&&f.rangedCooldown===0){ai.walk=0;tap(dist<275&&r<.35?'s1':r<.7?'s2':'s3');}
      else if(dist<145&&r<P.aggr)startPlan(['p','k','p','s1']);
      else {ai.walk=dist<230?-1:1;ai.stopDist=280;if(r>.75)ai.guardT=tk+18;}
    } else if(f.ch==='santox'){
      if(o.state==='attack'&&dist<220&&f.fourthCooldown===0&&r<P.spec*.6){tap('s3');ai.walk=0;}
      else if(dist>390){ai.walk=1;ai.stopDist=280;if(r>.85)tap('up');}
      else if(dist>180){ai.walk=dist<240?-1:0;ai.stopDist=270;if(f.rangedCooldown===0&&r<P.spec+.1)tap('s1');else if(r>.8)ai.walk=1;}
      else if(r<P.spec*.5){tap('s2');ai.walk=0;}
      else if(r<P.aggr+.15)startPlan(['p','p','k','s1']);
      else {ai.walk=-1;ai.stopDist=260;}
    } else if(f.ch==='jao'){
      if(dist>570){ai.walk=1;ai.stopDist=400;}
      else if(dist>180&&f.rangedCooldown===0){
        ai.walk=0;
        if(!g.projectiles.some(p=>p.kind==='chess'&&p.owner===f.idx&&p.life>0)&&dist<380&&r<.35)tap('s1');
        else tap(r<.65?'s2':'s3');
      }else if(dist<150&&r<P.aggr)startPlan(['p','p','k','s3']);
      else {ai.walk=dist<260?-1:1;ai.stopDist=310;if(r>.85)tap('up');}
    } else if (f.ch === 'rickzera') {
      if (dist > 270) {
        ai.walk = dist > 620 || f.rangedCooldown>0 ? 1 : 0;
        ai.stopDist = f.rangedCooldown>0 ? 140 : 480;
        if (f.rangedCooldown===0&&r < 0.45 * P.spec + 0.2) tap('s1');
        else if (r > 0.8 && dist < 550) tap('s3');
      } else if (dist > 145) {
        if (dist<175&&o.y===0&&r < 0.2 + P.spec * 0.35) tap('s2');
        else if (r < 0.5) tap('s3');
        else { ai.walk = 1; ai.stopDist = 100; }
      } else if (r < P.aggr) {
        startPlan((rnd() < 0.5 ? ['p', 'p', 'k', 's2'] : ['k', 'p', 'k', 's1']) as Action[]);
      } else if (r > 0.82) {
        ai.walk = -1;
        ai.stopDist = 380;
      } else ai.guardT = tk + 22;
    } else if (f.ch === 'aneninha') {
      if (dist > 290) { ai.walk = 1; ai.stopDist = 175; if (r > .8) tap('up'); }
      else if (dist > 150) {
        if (r < .2 + P.spec * .4) tap('s3');
        else { ai.walk = 1; ai.stopDist = 105; }
      } else if (r < P.spec * .45) {
        tap(rnd() < .55 ? 's2' : 's1'); ai.walk = 0;
      } else if (r < P.aggr + .15) {
        startPlan((rnd() < .5 ? ['p', 'p', 'k', 's1'] : ['k', 'p', 'p', 's3']) as Action[]);
      } else ai.guardT = tk + 20;
    } else if (f.ch === 'renngotti') {
      if (o.state === 'launched' && o.y < -140 && dist < 180 && r < 0.7 * P.aggr) {
        ai.walk = 1;
        tap('up');
      } else if (dist > 300) {
        ai.walk = dist > 550 ? 1 : 0;
        ai.stopDist = 210;
        if (r < 0.25 + P.spec * 0.5) tap('s2');
        else { ai.walk = 1; ai.stopDist = 160; }
      } else if (dist > 150) {
        if (r < 0.2 + P.spec * 0.45) tap('s3');
        else if (r < 0.65) tap('s2');
        else { ai.walk = 1; ai.stopDist = 95; }
      } else if (dist < 115 && r < 0.15 + P.spec * 0.4) {
        tap('s1');
        ai.walk = 0;
      } else if (r < P.aggr + 0.15) {
        startPlan((rnd() < 0.5 ? ['p', 'p', 'k', 's3'] : ['k', 'p', 'p', 's2']) as Action[]);
      } else ai.guardT = tk + 24;
    } else if (f.ch === 'bieu') {
      if (dist > 245) {
        ai.walk = dist > 500 ? 1 : 0;
        ai.stopDist = 150;
        if (r < 0.25 + P.spec * 0.5) tap('s2');
        else { ai.walk = 1; ai.stopDist = 130; }
      } else if (dist > 150) {
        if (r < 0.25 + P.spec * 0.4) tap('s2');
        else { ai.walk = 1; ai.stopDist = 100; }
      } else if (r < P.spec * 0.45) {
        tap(rnd() < 0.55 ? 's3' : 's1');
      } else if (r < P.aggr + 0.2) {
        startPlan((rnd() < 0.5 ? ['p', 'k', 'p', 's1'] : ['k', 'p', 'k', 's3']) as Action[]);
      } else ai.guardT = tk + 24;
    } else if (f.ch === 'nomad') {
      if (dist > 220) {
        ai.walk = dist > 650 ? 1 : 0;
        ai.stopDist = 430;
        if (r < 0.3 + P.spec * 0.3) tap('s1');
        else if (r < 0.6 + P.spec * 0.25) tap(dist < 440 && rnd() < 0.55 ? 's3' : 's2');
        else ai.guardT = tk + 18;
      } else if (dist > 125) {
        if (r < 0.25 + P.spec * 0.4) tap('s3');
        else if (r < 0.65) tap('s1');
        else { ai.walk = 1; ai.stopDist = 100; }
      } else if (r < P.aggr + 0.1) {
        startPlan((rnd() < 0.5 ? ['p', 'p', 'k', 's1'] : ['k', 'p', 'p', 's3']) as Action[]);
      } else ai.guardT = tk + 25;
    } else if (f.ch === 'tubarao') {
      if (dist > 290) {
        ai.walk = 1;
        ai.stopDist = 120;
        if(r>.85)ai.dashAt=tk+4;
      } else if (dist > 145) {
        ai.walk = 1;
        ai.stopDist = 90;
        if(r<.25+P.spec*.4)tap('s1');
      } else if(dist<130&&r<P.spec*.25&&!o.guard){tap('s3');ai.walk=0;
      } else if (dist < 115 && r < P.spec * 0.55) {
        tap('s2');
        ai.walk = 0;
      } else if (r < P.aggr + 0.1) {
        startPlan((rnd() < 0.5 ? ['p', 'p', 'k', 's1'] : ['k', 'p', 'p', 's3']) as Action[]);
      } else ai.guardT = tk + 20;
    } else {
      if (dist > 340) {
        ai.walk = 1;
        ai.stopDist = 200;
        if (r < 0.1 * P.aggr) ai.dashAt = tk + 4;
      } else if (dist > 200) {
        if (r < 0.4 * P.spec + 0.05) tap('s1');
        else if (r < 0.2 + 0.45 * P.spec) tap('s3');
        else {
          ai.walk = 1;
          ai.stopDist = 130;
        }
      } else if (dist > 125) {
        if (r < 0.3 * P.spec + 0.05) tap('s3');
        else if (r < 0.55) {
          forced = -1;
          tap('p');
        } else {
          ai.walk = 1;
          ai.stopDist = 100;
        }
      } else if (r < 0.3 + 0.2 * P.spec) tap('s2');
      else if (r < P.aggr + 0.2) {
        const plans: Action[][] = [['p', 'p', 'p', 's1'], ['k', 'k', 'p', 's3'], ['p', 'k', 'k', 's1'], ['p', 'p', 'k', 's2']];
        startPlan(plans[Math.floor(rnd() * plans.length)]);
      } else if (r < P.aggr + 0.3) {
        ai.walk = -1;
        ai.stopDist = 300;
      } else ai.guardT = tk + 20 + Math.floor(rnd() * 30);
    }
  }

  // ---------- movimento ----------
  if (ai.walk === 1 && dist < ai.stopDist) ai.walk = 0;
  if (ai.walk === -1 && dist > ai.stopDist) ai.walk = 0;
  if (tk === ai.dashAt && canAct) {
    pad.tap(dir > 0 ? 'right' : 'left', tk);
    ai.walk = 1;
  }
  let w = block || crouch ? 0 : forced !== null ? forced : ai.walk;
  if (f.state === 'attack') w = forced !== null ? forced : 0;
  if (f.state === 'jump') w = ai.walk;
  const worldDir = w * dir;
  pad.set('right', worldDir > 0, tk);
  pad.set('left', worldDir < 0, tk);
  pad.set('block', block, tk);
  pad.set('down', crouch, tk);
}
