import { useEffect, useState } from 'react';
import { CHARS } from '../game/data';
import type { CharId } from '../game/data';
import type { Difficulty, Mode } from '../game/engine';
import { audio } from '../game/audio';
import { ACTIONS, ACTION_LABELS, DEFAULT_BINDINGS, keyLabel, loadBindings, saveBindings } from '../game/input';
import type { Action, Bindings } from '../game/input';
import { applyPrefs, loadPrefs, savePrefs } from '../game/prefs';
import type { Prefs } from '../game/prefs';
import { ArtCanvas, SkewBtn } from './common';

// ------------------------------------------------------------------ SPLASH
export function Splash({ onStart }: { onStart: () => void }) {
  useEffect(() => {
    const go = () => onStart();
    window.addEventListener('keydown', go);
    return () => window.removeEventListener('keydown', go);
  }, [onStart]);
  return (
    <div className="absolute inset-0 cursor-pointer" onClick={onStart}>
      <ArtCanvas variant="menu" />
      <div className="absolute inset-0 bg-black/45" />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="title-main text-[24px] tracking-[0.35em] text-white/80">UM JOGO DE LUTA INDEPENDENTE</div>
        <Title big />
        <div className="mt-10 title-main text-2xl blink" style={{ textShadow: '0 0 14px #fde047' }}>
          CLIQUE OU PRESSIONE QUALQUER TECLA
        </div>
      </div>
    </div>
  );
}

function Title({ big }: { big?: boolean }) {
  return (
    <div className="flex flex-col items-start" style={{ transform: 'rotate(-2deg)' }}>
      <div className="title-main" style={{ fontSize: big ? 62 : 46, color: '#fff', WebkitTextStroke: '2px #6d28d9', textShadow: '0 0 24px #a855f7, 4px 4px 0 #1a0a2e' }}>
        Karatê Caetano
      </div>
      <div className="title-main flex items-center gap-3" style={{ fontSize: big ? 30 : 24, color: '#fde047', textShadow: '0 0 14px #f59e0b, 3px 3px 0 #000', marginLeft: 120 }}>
        — VS —
      </div>
      <div className="title-main" style={{ fontSize: big ? 50 : 38, color: '#fff', WebkitTextStroke: '2px #b91c1c', textShadow: '0 0 24px #ef4444, 4px 4px 0 #2a0505' }}>
        Orango Tango Bitencourt
      </div>
      <div className="title-main mt-1 px-3" style={{ fontSize: big ? 30 : 22, letterSpacing: '0.45em', background: 'linear-gradient(90deg,#a855f7,#ef4444)', color: '#fff', textShadow: '2px 2px 0 #000' }}>
        DEDILHO WARS
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ MENU PRINCIPAL
export type MenuChoice = 'play' | 'versus' | 'training' | 'controls' | 'settings';

export function MainMenu({ onChoose }: { onChoose: (c: MenuChoice) => void }) {
  const items: [MenuChoice, string, string][] = [
    ['play', 'JOGAR', '#a855f7'],
    ['versus', 'VERSUS LOCAL', '#f59e0b'],
    ['training', 'TREINAMENTO', '#22c55e'],
    ['controls', 'CONTROLES', '#38bdf8'],
    ['settings', 'CONFIGURAÇÕES', '#ef4444'],
  ];
  const [sel, setSel] = useState(0);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        setSel((s) => (s + 1) % items.length);
        audio.select();
      }
      if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        setSel((s) => (s + items.length - 1) % items.length);
        audio.select();
      }
      if (e.code === 'Enter' || e.code === 'Space') {
        audio.confirm();
        onChoose(items[sel][0]);
      }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel, onChoose]);
  return (
    <div className="absolute inset-0">
      <ArtCanvas variant="menu" />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(5,2,12,0.88) 0%, rgba(5,2,12,0.5) 45%, transparent 75%)' }} />
      <div className="absolute left-8 top-6">
        <Title />
      </div>
      <div className="absolute left-8 top-[212px] flex flex-col gap-[6px]">
        {items.map(([k, label, color], i) => (
          <SkewBtn
            key={k}
            active={sel === i}
            color={color}
            medium
            onHover={() => setSel(i)}
            onClick={() => {
              audio.confirm();
              onChoose(k);
            }}
          >
            {label}
          </SkewBtn>
        ))}
      </div>
      <div className="absolute bottom-3 left-8 text-[11px] tracking-widest text-white/60">↑ ↓ NAVEGAR · ENTER CONFIRMAR · P1: WASD + JKL / UIO / H · P2: SETAS + NUMPAD</div>
    </div>
  );
}

// ------------------------------------------------------------------ DIFICULDADE
export function DifficultySelect({ onPick, onBack }: { onPick: (d: Difficulty) => void; onBack: () => void }) {
  const items: [Difficulty, string, string, string][] = [
    ['easy', 'FÁCIL', '#22c55e', 'IA lenta, erra bastante e raramente defende.'],
    ['normal', 'NORMAL', '#f59e0b', 'IA equilibrada: defende, combina e usa especiais.'],
    ['hard', 'DIFÍCIL', '#ef4444', 'IA rápida, defende quase tudo e usa super com estratégia.'],
  ];
  const [sel, setSel] = useState(1);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.code === 'ArrowDown' || e.code === 'KeyS') setSel((s) => (s + 1) % 3);
      if (e.code === 'ArrowUp' || e.code === 'KeyW') setSel((s) => (s + 2) % 3);
      if (e.code === 'Enter') onPick(items[sel][0]);
      if (e.code === 'Escape') onBack();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel]);
  return (
    <div className="absolute inset-0">
      <ArtCanvas variant="menu" />
      <div className="absolute inset-0 bg-black/60" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
        <div className="title-main text-5xl mb-4" style={{ textShadow: '0 0 20px #a855f7, 4px 4px 0 #000' }}>
          DIFICULDADE
        </div>
        {items.map(([d, label, color, desc], i) => (
          <div key={d} className="flex flex-col items-center">
            <SkewBtn active={sel === i} color={color} onHover={() => setSel(i)} onClick={() => onPick(d)}>
              {label}
            </SkewBtn>
            {sel === i && <div className="text-xs text-white/70 mt-1">{desc}</div>}
          </div>
        ))}
        <div className="mt-4">
          <SkewBtn small onClick={onBack}>
            VOLTAR
          </SkewBtn>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ SELEÇÃO DE PERSONAGEM
const MODE_TITLE: Record<Mode, string> = { ai: 'JOGAR CONTRA O COMPUTADOR', versus: 'VERSUS LOCAL', training: 'TREINAMENTO' };

export function CharSelect({ mode, difficulty, onPick, onBack }: { mode: Mode; difficulty: Difficulty; onPick: (c: CharId) => void; onBack: () => void }) {
  const [sel, setSel] = useState<CharId>('caetano');
  const [locked, setLocked] = useState(false);
  const bind = loadBindings();
  const confirm = (c: CharId) => {
    if (locked) return;
    setLocked(true);
    audio.confirm();
    if (c === 'orango') audio.roar();
    else audio.purple();
    window.setTimeout(() => onPick(c), 650);
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        setSel('caetano');
        audio.select();
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        setSel('orango');
        audio.select();
      }
      if (e.code === 'Enter' || e.code === 'Space') confirm(sel);
      if (e.code === 'Escape') onBack();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel, locked]);
  const other: CharId = sel === 'caetano' ? 'orango' : 'caetano';
  const diffName = { easy: 'FÁCIL', normal: 'NORMAL', hard: 'DIFÍCIL' }[difficulty];
  return (
    <div className="absolute inset-0">
      <ArtCanvas variant="select" selected={sel} />
      {locked && <div className="absolute inset-0 bg-white/80 fade-in" style={{ animationDuration: '0.3s' }} />}
      <div className="absolute top-3 w-full text-center pointer-events-none">
        <div className="title-main text-[34px]" style={{ textShadow: '0 0 18px #fff, 3px 3px 0 #000' }}>
          ESCOLHA SEU LUTADOR
        </div>
        <div className="text-[11px] tracking-[0.3em] text-white/70">{MODE_TITLE[mode]}{mode === 'ai' ? ` · ${diffName}` : ''}</div>
      </div>
      <Card ch="caetano" side="L" active={sel === 'caetano'} keys={sel === 'caetano' ? bind[0] : bind[1]} onClick={() => (sel === 'caetano' ? confirm('caetano') : setSel('caetano'))} />
      <Card ch="orango" side="R" active={sel === 'orango'} keys={sel === 'orango' ? bind[0] : bind[1]} onClick={() => (sel === 'orango' ? confirm('orango') : setSel('orango'))} />
      <div className="absolute bottom-[10px] w-full flex flex-col items-center gap-1">
        <div className="text-xs text-white/80">
          VOCÊ: <b style={{ color: CHARS[sel].glow }}>{CHARS[sel].short}</b> · {mode === 'ai' ? 'CPU' : mode === 'versus' ? 'JOGADOR 2' : 'DUMMY'}: <b style={{ color: CHARS[other].glow }}>{CHARS[other].short}</b>
        </div>
        <div className="flex gap-4 items-center">
          <SkewBtn small onClick={onBack}>
            VOLTAR
          </SkewBtn>
          <SkewBtn small color={CHARS[sel].color} onClick={() => confirm(sel)} active>
            LUTAR!
          </SkewBtn>
        </div>
        <div className="text-[10px] tracking-widest text-white/50">← → ESCOLHER · ENTER CONFIRMAR · ESC VOLTAR</div>
      </div>
    </div>
  );
}

function Card({ ch, side, active, keys, onClick }: { ch: CharId; side: 'L' | 'R'; active: boolean; keys: Bindings; onClick: () => void }) {
  const d = CHARS[ch];
  const ks = [keys.s1[0], keys.s2[0], keys.s3[0]].map(keyLabel);
  return (
    <div
      onClick={onClick}
      className="absolute cursor-pointer transition-all duration-200"
      style={{
        top: 78,
        width: 236,
        left: side === 'L' ? 10 : 714,
        padding: 10,
        background: active ? 'rgba(10,4,24,0.88)' : 'rgba(8,4,16,0.6)',
        border: `2px solid ${active ? d.color : 'rgba(255,255,255,0.15)'}`,
        boxShadow: active ? `0 0 28px ${d.color}` : 'none',
        transform: `skewX(${side === 'L' ? -3 : 3}deg) scale(${active ? 1 : 0.96})`,
        opacity: active ? 1 : 0.7,
      }}
    >
      <div className="title-main text-[22px] leading-6" style={{ color: '#fff', textShadow: `0 0 12px ${d.color}, 2px 2px 0 #000` }}>
        {d.name}
      </div>
      <div className="text-[9px] tracking-wider mb-2" style={{ color: d.glow }}>
        {d.title}
      </div>
      <div className="text-[10px] text-white/70 mb-2 leading-3">{d.bio}</div>
      <div className="flex flex-col gap-[3px] mb-2">
        {d.attrs.map((a) => (
          <div key={a.label} className="flex items-center gap-2 text-[9px]">
            <span className="w-[78px] text-white/80">{a.label}</span>
            <div className="stat-bar flex-1">
              <i style={{ width: `${a.v * 20}%`, background: `linear-gradient(90deg, ${d.color2}, ${d.glow})` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="title-main text-[11px] px-2 py-[1px] mb-1 inline-block" style={{ background: '#fff', color: '#111' }}>
        GOLPES ESPECIAIS
      </div>
      {d.specials.map((s, i) => (
        <div key={s.name} className="flex gap-2 mb-[5px] items-start">
          <span className="text-[10px] px-[5px] py-[1px] font-bold" style={{ background: d.color, color: '#fff', minWidth: 22, textAlign: 'center' }}>
            {ks[i]}
          </span>
          <div>
            <div className="title-main text-[11px] leading-3" style={{ color: d.glow }}>
              {s.name}
            </div>
            <div className="text-[9px] text-white/65 leading-[11px]">{s.desc}</div>
          </div>
        </div>
      ))}
      <div className="mt-1 text-[10px] title-main px-2 py-[3px]" style={{ background: `linear-gradient(90deg, ${d.color}, transparent)` }}>
        SUPER: {d.superName} <span className="opacity-80">[{keyLabel(keys.super[0])}]</span>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ CONTROLES
export function Controls({ onBack }: { onBack: () => void }) {
  const [b, setB] = useState<[Bindings, Bindings]>(loadBindings());
  const [listen, setListen] = useState<{ p: 0 | 1; a: Action; s: 0 | 1 } | null>(null);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      e.preventDefault();
      if (listen) {
        if (e.code === 'Escape') {
          setListen(null);
          return;
        }
        setB((prev) => {
          const n = JSON.parse(JSON.stringify(prev)) as [Bindings, Bindings];
          // remove duplicata no mesmo jogador
          for (const a of ACTIONS) for (const s of [0, 1] as const) if (n[listen.p][a][s] === e.code) n[listen.p][a][s] = '';
          n[listen.p][listen.a][listen.s] = e.code;
          if (!n[listen.p][listen.a][0] && n[listen.p][listen.a][1]) {
            n[listen.p][listen.a][0] = n[listen.p][listen.a][1];
            n[listen.p][listen.a][1] = '';
          }
          saveBindings(n);
          return n;
        });
        setListen(null);
      } else if (e.code === 'Escape') onBack();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [listen, onBack]);

  const reset = () => {
    const n = JSON.parse(JSON.stringify(DEFAULT_BINDINGS)) as [Bindings, Bindings];
    saveBindings(n);
    setB(n);
  };

  const panel = (p: 0 | 1) => {
    const ch = p === 0 ? 'caetano' : 'orango';
    const d = CHARS[ch];
    return (
      <div className="absolute" style={{ left: p === 0 ? 14 : 490, top: 58, width: 456 }}>
        <div className="title-main text-xl px-3 py-1 mb-1" style={{ background: `linear-gradient(90deg, ${d.color}, transparent)` }}>
          JOGADOR {p + 1} — <span className="text-white/90 text-base">padrão: {p === 0 ? 'Caetano' : 'Orango'}</span>
        </div>
        <div className="grid" style={{ gridTemplateColumns: '1fr 120px 120px', gap: 3 }}>
          <div className="text-[10px] text-white/50">AÇÃO</div>
          <div className="text-[10px] text-white/50 text-center">TECLA</div>
          <div className="text-[10px] text-white/50 text-center">ALTERNATIVA</div>
          {ACTIONS.map((a) => (
            <div key={a} className="contents">
              <div className="text-[13px] flex items-center" style={{ color: a === 'super' ? '#fde047' : '#fff' }}>
                {ACTION_LABELS[a]}
              </div>
              {([0, 1] as const).map((s) => {
                const on = listen && listen.p === p && listen.a === a && listen.s === s;
                return (
                  <button
                    key={s}
                    onClick={() => setListen({ p, a, s })}
                    className="text-[12px] py-[3px] border"
                    style={{ background: on ? d.color : 'rgba(255,255,255,0.08)', borderColor: on ? '#fff' : 'rgba(255,255,255,0.2)', color: '#fff' }}
                  >
                    {on ? 'PRESSIONE...' : keyLabel(b[p][a][s])}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="absolute inset-0">
      <ArtCanvas variant="menu" />
      <div className="absolute inset-0 bg-black/80" />
      <div className="absolute top-2 w-full text-center title-main text-3xl" style={{ textShadow: '0 0 18px #38bdf8, 3px 3px 0 #000' }}>
        CONTROLES
      </div>
      {panel(0)}
      {panel(1)}
      <div className="absolute left-4 right-4 text-[11px] leading-[15px] text-white/80" style={{ top: 392 }}>
        <b className="text-yellow-300">GOLPES NORMAIS:</b> soco/chute parado = <b>fraco</b> · <b>→ + botão</b> = <b>médio</b> · <b>← + botão</b> = <b>forte</b> · <b>↓ + botão</b> = agachado · no ar = golpe aéreo. <b className="text-yellow-300">COMBOS:</b> aperte o botão em sequência
        (fraco → médio → forte) e cancele em um especial ou super quando acertar. <b className="text-yellow-300">DEFESA:</b> segure Defesa (↓ + Defesa para golpes baixos). Agarrões (Puxão de Camisa) ignoram a defesa. <b className="text-yellow-300">DASH:</b> toque duas vezes ← ou →.{' '}
        <b className="text-yellow-300">DEDILHO CLASH:</b> Dedilho vs Dedilho → aperte SOCO repetidamente! <b className="text-yellow-300">PAUSA:</b> ESC ou P. <b className="text-yellow-300">TREINO:</b> R reinicia posições, T troca o dummy. Teclado sem numpad? O Jogador 2 também usa , . / ; &apos; Enter e Shift direito
        (clique em qualquer tecla acima para reconfigurar). Teclados comuns podem bloquear combinações de várias teclas (ghosting).
      </div>
      <div className="absolute bottom-3 w-full flex justify-center gap-4">
        <SkewBtn small onClick={reset} color="#f59e0b">
          RESTAURAR PADRÃO
        </SkewBtn>
        <SkewBtn small onClick={onBack}>
          VOLTAR
        </SkewBtn>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ CONFIGURAÇÕES
export function Settings({ onBack }: { onBack: () => void }) {
  const [p, setP] = useState<Prefs>(loadPrefs());
  const upd = (n: Partial<Prefs>) => {
    const np = { ...p, ...n };
    setP(np);
    savePrefs(np);
    applyPrefs(np);
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.code === 'Escape') onBack();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onBack]);
  const row = (label: string, ctl: React.ReactNode) => (
    <div className="flex items-center justify-between w-[560px] py-2 border-b border-white/15">
      <span className="title-main text-xl">{label}</span>
      {ctl}
    </div>
  );
  const toggle = (v: boolean, f: (v: boolean) => void) => (
    <button onClick={() => f(!v)} className="title-main px-5 py-1 border-2" style={{ background: v ? '#16a34a' : '#7f1d1d', borderColor: '#fff' }}>
      {v ? 'LIGADO' : 'DESLIGADO'}
    </button>
  );
  return (
    <div className="absolute inset-0">
      <ArtCanvas variant="menu" />
      <div className="absolute inset-0 bg-black/80" />
      <div className="absolute inset-0 flex flex-col items-center pt-8">
        <div className="title-main text-5xl mb-3" style={{ textShadow: '0 0 20px #ef4444, 4px 4px 0 #000' }}>
          CONFIGURAÇÕES
        </div>
        {row('MÚSICA', <input type="range" min={0} max={1} step={0.05} value={p.music} onChange={(e) => upd({ music: +e.target.value })} className="w-60" />)}
        {row('EFEITOS SONOROS', <input type="range" min={0} max={1} step={0.05} value={p.sfx} onChange={(e) => upd({ sfx: +e.target.value })} className="w-60" />)}
        {row('VOZES (NARRADOR)', toggle(p.voice, (v) => upd({ voice: v })))}
        {row('TREMOR DE TELA', toggle(p.shake, (v) => upd({ shake: v })))}
        {row('MOSTRAR HITBOXES', toggle(p.hitboxes, (v) => upd({ hitboxes: v })))}
        {row(
          'DIFICULDADE PADRÃO',
          <div className="flex gap-2">
            {(['easy', 'normal', 'hard'] as Difficulty[]).map((d) => (
              <button key={d} onClick={() => upd({ difficulty: d })} className="title-main px-3 py-1 border-2 text-sm" style={{ background: p.difficulty === d ? '#a855f7' : 'rgba(255,255,255,0.08)', borderColor: '#fff' }}>
                {{ easy: 'FÁCIL', normal: 'NORMAL', hard: 'DIFÍCIL' }[d]}
              </button>
            ))}
          </div>,
        )}
        <div className="mt-6">
          <SkewBtn onClick={onBack} small>
            VOLTAR
          </SkewBtn>
        </div>
      </div>
    </div>
  );
}
