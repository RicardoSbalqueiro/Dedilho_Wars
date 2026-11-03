// IA do computador: aproxima, defende, combina golpes, usa especiais e super.
import type { Game, Fighter, Difficulty } from './engine';
import type { Action } from './input';

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
}

export function newAI(): AIState {
  return { tapAt: {}, thinkT: 0, walk: 0, stopDist: 120, seen: -1, blockT: 0, blockUntil: -1, blockLow: false, guardT: 0, plan: [], planStep: 0, expectSerial: -1, dashAt: -1, crouchT: 0 };
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

  const dx = o.x - f.x;
  const dist = Math.abs(dx);
  const dir = dx >= 0 ? 1 : -1;
  const canAct = f.state === 'ground' || f.state === 'dash';
  let block = false;
  let crouch = false;
  let forced: number | null = null;

  // ---------- defesa ----------
  if (f.state === 'block') {
    block = true;
    crouch = f.crouch;
  }
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
  if (tk >= ai.blockT && tk <= ai.blockUntil && canAct) {
    block = true;
    crouch = ai.blockLow;
  }
  if (tk < ai.guardT && canAct && dist < 230) block = true;

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
    if (rnd() < P.spec && n >= 2) ai.plan[n - 1] = f.ch === 'caetano' ? (['s1', 's2', 's3'] as Action[])[Math.floor(rnd() * 3)] : (['s1', 's3', 's2'] as Action[])[Math.floor(rnd() * 2)];
    ai.planStep = 0;
  }

  function decide() {
    const r = rnd();
    const oDown = o.state === 'down' || o.state === 'getup' || o.state === 'launched';
    if (f.meter >= 100 && dist < 480 && (oDown || o.state === 'hit' || o.state === 'block' || rnd() < 0.2) && rnd() < P.sup) {
      tap('super');
      return;
    }
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
