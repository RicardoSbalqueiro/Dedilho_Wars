import { useEffect, useRef } from 'react';
import type { CharId } from '../game/data';
import { CHARS, movePhase } from '../game/data';
import { CanvasSurface } from '../game/canvas';
import { FrameTimer } from '../game/timing';
import { PaintCadence } from '../game/mobile-settings';
import { drawFullBody } from '../game/rig';
import { attackAnimation } from '../game/animation';
import { modelSheetPose } from '../game/model-sheet';
import { preloadAnimeSprite, animeSpriteReady } from '../game/anime-sprite';
import { settings } from '../game/visual-settings';
import { drawFormPreview } from '../game/form-effects';

/** An illustrated fighter with accessory normals; never creates a match or changes combat. */
export function MenuFighter({ ch, strike, transformed, paused }: { ch: CharId; strike: number; transformed: boolean; paused: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const props = useRef({ ch, strike, transformed, paused });
  props.current = { ch, strike, transformed, paused };
  useEffect(() => { void preloadAnimeSprite(ch, transformed); }, [ch, transformed]);
  useEffect(() => {
    const canvas = ref.current!, surface = new CanvasSurface(canvas, 620, 600), c = surface.ctx;
    const clock = new FrameTimer(), cadence = new PaintCadence(60), reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let raf = 0, inView = true, lastCharacter = props.current.ch, lastStrike = props.current.strike, started = -1000;
    const rebase = () => clock.rebase();
    const observer = new IntersectionObserver(entries => { inView = entries[0]?.isIntersecting ?? true; rebase(); }); observer.observe(canvas);
    const draw = (now: number) => {
      const p = props.current;
      if (document.hidden || !inView || p.paused) { rebase(); raf = requestAnimationFrame(draw); return; }
      clock.sample(now); const t = clock.frames;
      if (!cadence.due(now)) { raf = requestAnimationFrame(draw); return; }
      if (p.ch !== lastCharacter) { lastCharacter = p.ch; lastStrike = p.strike; started = -1000; }
      if (lastStrike !== p.strike) { lastStrike = p.strike; started = t; }
      surface.prepare(); c.clearRect(0, 0, 620, 600);
      const character = CHARS[p.ch], age = t - started, move = character.moves[p.strike % 2 ? 'pM' : 'kH'];
      const duration = move.startup + move.active + move.recovery, frame = Math.min(duration, age * .8), attacking = age >= 0 && frame < duration;
      const pose = attacking ? attackAnimation(p.ch, move, frame, true) : modelSheetPose(p.ch, reduced.matches ? 0 : t);
      const name = attacking ? move.poses[frame < move.startup ? 0 : 1] : 'model';
      const phase = attacking ? movePhase(move, frame, true) : undefined;
      const targetHeight = p.ch === 'jane' && !p.transformed ? 360 : 520;
      const scale = targetHeight / ((p.ch === 'tubarao' && p.transformed ? 155 : character.hurtH) * 1.055);
      c.fillStyle = '#080a1070'; c.beginPath(); c.ellipse(320, 560, 122, 14, -.03, 0, Math.PI * 2); c.fill();
      if (p.transformed) {
        c.save(); c.translate(320, 558); c.scale(scale, scale);
        drawFormPreview(c, p.ch, reduced.matches ? 30 : t); c.restore();
      }
      drawFullBody(c, p.ch, 320, 558, scale, reduced.matches ? 0 : t, name, false, pose, {
        poseName: name, transformation: p.transformed, spriteState: attacking ? 'attack' : 'idle',
        spritePhase: phase?.phase, spriteProgress: phase?.progress ?? 0, spriteMove: move.id,
        spriteKind: p.strike % 2 ? 'punch' : 'kick', spriteRank: move.rank, normalAccessory: attacking ? move.accessory : undefined,
      });
      if (attacking && phase?.phase === 'active' && !settings.reducedFlash) {
        c.strokeStyle = character.glow; c.lineWidth = 2; c.globalAlpha = .75;
        for (let i = 0; i < 6; i++) { const y = 210 + i * 48; c.beginPath(); c.moveTo(50, y); c.lineTo(150 - i * 10, y - 26); c.stroke(); }
        c.globalAlpha = 1;
      }
      canvas.dataset.fighter = p.ch; canvas.dataset.loaded = animeSpriteReady(p.ch, p.transformed) ? '1' : '0';
      canvas.dataset.form = p.transformed ? '1' : '0'; canvas.dataset.action = attacking ? 'attack' : 'idle'; canvas.dataset.animationFrame = t.toFixed(2);
      raf = requestAnimationFrame(draw);
    };
    document.addEventListener('visibilitychange', rebase); raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); observer.disconnect(); document.removeEventListener('visibilitychange', rebase); };
  }, []);
  return <canvas ref={ref} width={620} height={600} className="pc-featured-fighter" aria-hidden="true" />;
}
