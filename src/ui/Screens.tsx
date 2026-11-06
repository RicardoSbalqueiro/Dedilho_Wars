import { FIGHTER_STYLE } from '../game/presentation';
import { useEffect, useRef, useState } from 'react';
import { CHARS, CHAR_CATEGORIES } from '../game/data';
import type { CharId, CharCategory } from '../game/data';
import { STAGE_IDS, STAGES } from '../game/stage';
import type { StageId } from '../game/stage';
import type { Difficulty, Mode } from '../game/engine';
import { audio } from '../game/audio';
import { ACTIONS, ACTION_LABELS, DEFAULT_BINDINGS, bindingConflict, bindingNotices, keyLabel, loadBindings, saveBindings } from '../game/input';
import type { Action, Bindings } from '../game/input';
import { applyPrefs, loadPrefs, savePrefs } from '../game/prefs';
import type { Prefs } from '../game/prefs';
import { ArtCanvas, FighterPortrait, MusicButton, StagePreview, SkewBtn } from './common';

// ------------------------------------------------------------------ SPLASH
export function Splash({ onStart }: { onStart: () => void }) {
  useEffect(() => {
    const go = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || e.code === 'Tab') return;
      e.preventDefault();
      onStart();
    };
    window.addEventListener('keydown', go);
    return () => window.removeEventListener('keydown', go);
  }, [onStart]);
  return (
    <div className="absolute inset-0 cursor-pointer" onClick={onStart}>
      <ArtCanvas variant="splash" />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(6,3,17,.85),rgba(6,3,17,.12) 55%,rgba(6,3,17,.75))' }} />
      <div className="absolute top-[75px] w-full flex justify-center"><Title big /></div>
      <div className="absolute bottom-9 w-full text-center title-main text-xl blink" style={{ textShadow: '0 0 14px #fde047' }}>
        CLIQUE OU PRESSIONE QUALQUER TECLA
      </div>
    </div>
  );
}

function Title({ big }: { big?: boolean }) {
  return (
    <div>
    <div className="title-main" style={{ fontSize: big ? 90 : 53, letterSpacing: big ? '0.04em' : '-0.025em', color: '#fff', WebkitTextStroke: `${big ? 2 : 1}px #6d28d9`, textShadow: '0 0 28px #a855f7, 5px 5px 0 #180a30', transform: 'skewX(-8deg) rotate(-2deg)' }}>
      DEDILHO WARS
    </div>
    <div className="creator-credit" style={{textAlign:big?'center':'left'}}>By Rickzera</div>
    </div>
  );
}

// ------------------------------------------------------------------ MENU PRINCIPAL
export type MenuChoice = 'play' | 'versus' | 'training' | 'controls' | 'settings' | 'radio' | 'online' | 'profile';

export function MainMenu({ onChoose, onRadio, suspended = false }: { onChoose: (c: MenuChoice) => void; onRadio: () => void; suspended?: boolean }) {
  const items: [MenuChoice, string, string][] = [
    ['play', 'JOGAR', '#a855f7'],
    ['online', 'ONLINE', '#22d3ee'],
    ['versus', 'VERSUS LOCAL', '#f59e0b'],
    ['training', 'TREINAMENTO', '#22c55e'],
    ['profile', 'PERFIL E RANKING', '#facc15'],
    ['controls', 'CONTROLES', '#38bdf8'],
    ['settings', 'CONFIGURAÇÕES', '#ef4444'],
  ];
  const [sel, setSel] = useState(0);
  useEffect(() => { audio.music('menu'); }, []);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (suspended || !['ArrowDown', 'ArrowUp', 'KeyS', 'KeyW', 'Enter', 'Space'].includes(e.code)) return;
      e.preventDefault();
      if (e.repeat) return;
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
  }, [sel, onChoose, suspended]);
  return (
    <div className="absolute inset-0">
      <ArtCanvas variant="menu" />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(5,2,12,0.88) 0%, rgba(5,2,12,0.5) 45%, transparent 75%)' }} />
      <div className="absolute left-8 top-10">
        <Title />
      </div>
      <div className="absolute left-8 top-[132px] flex flex-col gap-[3px]">
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
      <div className="absolute bottom-3 left-8 text-[10px] tracking-widest text-white/60">↑ ↓ NAVEGAR · ENTER CONFIRMAR · P1: WASD + JKL / UIO / H · P2: SETAS + NUMPAD</div>
      <div className="absolute right-6 bottom-5"><MusicButton onClick={onRadio} /></div>
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
      if (!['ArrowDown', 'ArrowUp', 'KeyS', 'KeyW', 'Enter', 'Space', 'Escape'].includes(e.code)) return;
      e.preventDefault();
      if (e.repeat) return;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') setSel((s) => (s + 1) % 3);
      if (e.code === 'ArrowUp' || e.code === 'KeyW') setSel((s) => (s + 2) % 3);
      if (e.code === 'Enter' || e.code === 'Space') onPick(items[sel][0]);
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
const CATEGORY_ORDER: CharCategory[] = ['Streamers', 'Viewers', 'Especiais'];
const categoryOf = (ch: CharId): CharCategory => CATEGORY_ORDER.find((category) => (CHAR_CATEGORIES[category] as readonly CharId[]).includes(ch)) || 'Streamers';

const MODE_TITLE: Record<Mode, string> = { ai: 'CONTRA O COMPUTADOR', versus: 'VERSUS LOCAL', training: 'TREINAMENTO' };

export function CharSelect({ mode, difficulty, initialP1 = 'caetano', initialP2 = 'orango', onPick, onBack, onRadio, suspended = false }: {
  mode: Mode; difficulty: Difficulty; initialP1?: CharId; initialP2?: CharId;
  onPick: (p1: CharId, p2: CharId) => void; onBack: () => void; onRadio: () => void; suspended?: boolean;
}) {
  const [phase, setPhase] = useState<0 | 1>(0);
  const [picks, setPicks] = useState<[CharId, CharId]>([initialP1, initialP2]);
  const [categories, setCategories] = useState<[CharCategory, CharCategory]>([categoryOf(initialP1), categoryOf(initialP2)]);
  const remembered = useRef<Partial<Record<CharCategory, CharId>>[]>([
    { [categoryOf(initialP1)]: initialP1 }, { [categoryOf(initialP2)]: initialP2 },
  ]);
  const [locked, setLocked] = useState(false);
  const lockedRef = useRef(false);
  const timerRef = useRef<number | undefined>(undefined);
  const sel = picks[phase];
  const category = categories[phase];
  const roster = CHAR_CATEGORIES[category] as readonly CharId[];
  const hasSelection = roster.includes(sel);
  const d = CHARS[sel];
  const bindings = loadBindings()[phase];
  const opponentLabel = mode === 'ai' ? 'COMPUTADOR' : mode === 'versus' ? 'JOGADOR 2' : 'OPONENTE DE TREINO';
  const diffName = { easy: 'FÁCIL', normal: 'NORMAL', hard: 'DIFÍCIL' }[difficulty];

  useEffect(() => {
    audio.music('menu');
    return () => window.clearTimeout(timerRef.current);
  }, []);

  const select = (ch: CharId) => {
    if (lockedRef.current) return;
    remembered.current[phase][category] = ch;
    setPicks((prev) => phase === 0 ? [ch, prev[1]] : [prev[0], ch]);
    audio.select();
  };
  const changeCategory = (next: CharCategory) => {
    if (lockedRef.current) return;
    setCategories((prev) => phase === 0 ? [next, prev[1]] : [prev[0], next]);
    const available = CHAR_CATEGORIES[next] as readonly CharId[];
    const candidate = remembered.current[phase][next] || available[0];
    if (candidate) {
      remembered.current[phase][next] = candidate;
      setPicks((prev) => phase === 0 ? [candidate, prev[1]] : [prev[0], candidate]);
    }
    audio.select();
  };
  const confirm = () => {
    if (lockedRef.current || !hasSelection) return;
    audio.confirm();
    if (phase === 0) {
      setPhase(1);
      return;
    }
    lockedRef.current = true;
    setLocked(true);
    timerRef.current = window.setTimeout(() => onPick(picks[0], picks[1]), 420);
  };
  const back = () => {
    if (lockedRef.current) return;
    if (phase === 1) setPhase(0);
    else onBack();
  };

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const codes = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD', 'KeyW', 'KeyS', 'KeyQ', 'KeyE', 'Tab', 'Enter', 'Space', 'Escape'];
      if (suspended || !codes.includes(e.code)) return;
      e.preventDefault();
      if (e.repeat || lockedRef.current) return;
      if (e.code === 'KeyQ' || e.code === 'KeyE' || e.code === 'Tab') {
        const delta = e.code === 'KeyQ' || (e.code === 'Tab' && e.shiftKey) ? -1 : 1;
        changeCategory(CATEGORY_ORDER[(CATEGORY_ORDER.indexOf(category) + delta + CATEGORY_ORDER.length) % CATEGORY_ORDER.length]);
      }
      const index = roster.indexOf(sel);
      if (roster.length) {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') select(roster[(index + roster.length - 1) % roster.length]);
        if (e.code === 'ArrowRight' || e.code === 'KeyD') select(roster[(index + 1) % roster.length]);
        const rowStep = roster.length > 2 ? 2 : 1;
        if (['ArrowUp', 'KeyW'].includes(e.code)) select(roster[(index - rowStep + roster.length) % roster.length]);
        if (['ArrowDown', 'KeyS'].includes(e.code)) select(roster[(index + rowStep) % roster.length]);
      }
      if (e.code === 'Enter' || e.code === 'Space') confirm();
      if (e.code === 'Escape') back();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });

  return (
    <div className="absolute inset-0" data-select-phase={phase} data-select-category={category}>
      <ArtCanvas variant="select" selected={hasSelection ? sel : undefined} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(90deg,rgba(6,3,15,.94),rgba(6,3,15,.55) 30%,transparent 48%,rgba(6,3,15,.9) 69%)' }} />
      <div className="absolute left-6 top-4 title-main text-[28px]">ESCOLHA OS LUTADORES</div>
      <div className="absolute right-6 top-5 text-[10px] tracking-[.16em] text-white/65">{MODE_TITLE[mode]}{mode === 'ai' ? ` · ${diffName}` : ''}</div>
      <div className="absolute left-6 right-6 top-[60px] flex gap-4">
        {picks.map((ch, i) => (
          <button key={i} type="button" disabled={locked} onClick={() => setPhase(i as 0 | 1)}
            className="flex-1 text-left px-4 py-2 border-2 transition-colors"
            style={{ borderColor: phase === i ? CHARS[ch].glow : '#ffffff33', background: `linear-gradient(100deg, ${CHARS[ch].color}66, #090511dd)`, boxShadow: phase === i ? `0 0 18px ${CHARS[ch].color}66` : 'none' }}>
            <div className="text-[9px] tracking-[.2em] text-white/70">{i === 0 ? 'JOGADOR 1' : opponentLabel} · {phase === i ? 'ESCOLHENDO' : i === 0 && phase === 1 ? 'PRONTO' : 'CLIQUE PARA EDITAR'}</div>
            <div className="title-main text-[20px] mt-1" style={{ color: CHARS[ch].glow }}>{CHARS[ch].name}</div>
          </button>
        ))}
      </div>
      <div className="absolute left-6 top-[140px] w-[296px]">
        <div role="tablist" aria-label="Categorias de lutadores" className="flex gap-1 mb-3">
          {CATEGORY_ORDER.map((tab) => <button key={tab} type="button" role="tab" data-category={tab} aria-selected={category === tab} disabled={locked} onClick={() => changeCategory(tab)}
            className="flex-1 text-[10px] py-[9px] border transition-colors cursor-pointer"
            style={{ background: category === tab ? '#8b5cf6' : '#130b22dd', borderColor: category === tab ? '#ddd6fe' : '#ffffff33', color: category === tab ? '#fff' : '#b9accd' }}>{tab.toUpperCase()}</button>)}
        </div>
        <div className="text-[9px] tracking-[.2em] text-white/60 mb-2">{phase === 0 ? '01 / SEU LUTADOR' : `02 / ${opponentLabel}`}</div>
        <div className="grid grid-cols-2 gap-[8px]">
          {roster.map((ch, i) => {
            const c = CHARS[ch];
            const active = sel === ch;
            return (
              <button key={ch} type="button" data-char={ch} aria-label={`Selecionar ${c.name}`} aria-pressed={active} disabled={locked}
                onClick={() => select(ch)}
                className="relative text-left border-2 overflow-hidden transition-all cursor-pointer"
                style={{ height: roster.length > 4 ? 70 : 100, borderColor: active ? c.glow : '#ffffff33', background: `linear-gradient(135deg,${c.color}${active ? '88' : '33'},#090511)`, boxShadow: active ? `0 0 18px ${c.color}77` : 'none', transform: active ? 'translateY(-2px)' : undefined }}>
                <div className="absolute top-2 left-2 text-[9px] text-white/40">0{i + 1}</div>
                <FighterPortrait ch={ch} size={roster.length > 4 ? 22 : 29} className={roster.length > 4 ? "absolute top-0 left-[49px]" : "absolute top-0 left-[41px]"} />
                <div className="absolute bottom-2 left-2 right-1 title-main text-[13px] leading-4" style={{ color: active ? '#fff' : c.glow }}>{c.name}</div>
                {(ch === 'jane' || ch === 'cristyan' || ch === 'eneas') ? <div className="absolute right-1 top-1 text-[7px] bg-white text-black px-1">NOVO</div> : null}
              </button>
            );
          })}
        </div>
        {roster.length === 0 && <div className="h-[210px] border border-dashed border-white/25 flex flex-col items-center justify-center text-center px-5 bg-black/30">
          <div className="title-main text-[25px] text-white/80">EM BREVE</div>
          <p className="text-[11px] leading-4 text-white/55 mt-3">Os viewers terão seu lugar na arena.<br />Escolha outra categoria para lutar.</p>
        </div>}
        <div className="text-[9px] mt-2 leading-[13px] text-white/55">Q / E ou TAB: trocar categoria<br />Todos podem se enfrentar, inclusive espelhados.</div>
      </div>
      {hasSelection && <div className="absolute left-[344px] top-[424px] w-[286px] text-center pointer-events-none">
        <div className="title-main text-[22px]" style={{ color: d.glow, textShadow: '2px 2px 0 #000' }}>{d.short}</div>
        <div className="text-[9px] tracking-wider text-white/70 mt-1">{FIGHTER_STYLE[sel].name} · {d.title}</div>
      </div>}
      <div className="absolute right-6 top-[147px] w-[284px]">
        {hasSelection ? <FighterDetails ch={sel} bindings={bindings} /> : <div className="mt-20 text-center text-white/45 text-sm leading-6">Novos desafiantes estão chegando.<br />STREAMERS e ESPECIAIS já estão prontos para lutar.</div>}
      </div>
      <div className="absolute left-8 right-8 bottom-[28px] flex justify-between items-center">
        <SkewBtn small onClick={back}>VOLTAR</SkewBtn>
        <div className="text-[8px] tracking-wider text-white/60">SETAS / WASD · ENTER CONFIRMAR</div>
        <div className="flex items-center gap-5"><MusicButton onClick={onRadio} /><SkewBtn small active disabled={!hasSelection || locked} color={hasSelection ? d.color : '#555'} onClick={confirm}>{locked ? 'PREPARE-SE!' : !hasSelection ? 'EM BREVE' : phase === 0 ? 'CONFIRMAR P1' : 'ESCOLHER MAPA'}</SkewBtn></div>
      </div>
      <div className="absolute bottom-2 w-full text-center text-[9px] text-white/40">ESC VOLTAR · CLIQUE NOS PAINÉIS P1 / P2 PARA REVISAR A ESCOLHA</div>
      {locked && <div className="absolute inset-0 bg-white/50 pointer-events-none fade-in" style={{ animationDuration: '.4s' }} />}
    </div>
  );
}

function FighterDetails({ ch, bindings }: { ch: CharId; bindings: Bindings }) {
  const d = CHARS[ch];
  const keys = [bindings.s1[0], bindings.s2[0], bindings.s3[0]];
  return (
    <div>
      <div className="text-[10px] text-white/75 leading-[13px] mb-2">{d.bio}</div>
      <div className="flex flex-col gap-[3px] mb-2">
        {d.attrs.map((a) => <div key={a.label} className="flex gap-3 items-center text-[9px]"><span className="w-[82px] text-white/70">{a.label}</span><div className="stat-bar flex-1"><i style={{ width: `${a.v * 20}%`, background: `linear-gradient(90deg, ${d.color2}, ${d.glow})` }} /></div></div>)}
      </div>
      <div className="title-main text-[13px] mb-1" style={{ color: d.glow }}>GOLPES ESPECIAIS</div>
      {d.specials.map((move, i) => (
        <div key={move.name} className="flex items-start gap-2 mb-[5px]">
          <span className="text-[9px] px-1 py-1 text-center whitespace-nowrap" style={{ background: d.color, flexShrink: 0, minWidth: keys[i]?.startsWith('Numpad') ? 38 : 28 }}>{keyLabel(keys[i]).replace('NUM ', 'NUM')}</span>
          <div><div className="title-main text-[12px] leading-[13px]">{move.name}</div><div className="text-[9px] text-white/60 leading-[11px]">{move.desc}</div></div>
        </div>
      ))}
      <div className="px-2 py-1 border-l-2 mt-2" style={{ borderColor: d.glow, background: `${d.color}33` }}>
        <div className="text-[8px] tracking-widest text-white/60">SUPER ESPECIAL · {keyLabel(bindings.super[0])}</div>
        <div className="title-main text-[14px] leading-4 mt-1" style={{ color: d.glow }}>{d.superName}</div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ SELEÇÃO DE MAPA
export function StageSelect({ p1, p2, initialStage = 'dojo', onPick, onBack, onRadio, suspended = false }: {
  p1: CharId; p2: CharId; initialStage?: StageId; onPick: (stage: StageId) => void;
  onBack: () => void; onRadio: () => void; suspended?: boolean;
}) {
  const [page,setPage]=useState(Math.floor(STAGE_IDS.indexOf(initialStage)/6));
  const [selected, setSelected] = useState<StageId | 'random'>(initialStage);
  const [locked, setLocked] = useState(false);
  const lockedRef = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  const randomPreview = useRef(STAGE_IDS[Math.floor(Math.random() * STAGE_IDS.length)]);
  const options: (StageId | 'random')[] = [...STAGE_IDS, 'random'];
  const preview = selected === 'random' ? randomPreview.current : selected;
  useEffect(() => { audio.music('menu'); return () => window.clearTimeout(timer.current); }, []);
  const confirm = () => {
    if (lockedRef.current || suspended) return;
    lockedRef.current = true;
    setLocked(true);
    audio.confirm();
    const chosen = selected === 'random' ? STAGE_IDS[Math.floor(Math.random() * STAGE_IDS.length)] : selected;
    timer.current = window.setTimeout(() => onPick(chosen), 260);
  };
  const select = (id: StageId | 'random') => {
    if (lockedRef.current || suspended) return;
    setSelected(id);
    if(id!=='random')setPage(Math.floor(STAGE_IDS.indexOf(id)/6));
    audio.select();
  };
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (suspended || lockedRef.current || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD', 'KeyW', 'KeyS', 'Enter', 'Space', 'Escape'].includes(e.code)) return;
      e.preventDefault();
      if (e.repeat) return;
      const i = options.indexOf(selected);
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') select(options[(i + options.length - 1) % options.length]);
      if (e.code === 'ArrowRight' || e.code === 'KeyD') select(options[(i + 1) % options.length]);
      if (e.code === 'ArrowUp' || e.code === 'KeyW') select(options[(i + options.length - 3) % options.length]);
      if (e.code === 'ArrowDown' || e.code === 'KeyS') select(options[(i + 3) % options.length]);
      if (e.code === 'Enter' || e.code === 'Space') confirm();
      if (e.code === 'Escape') onBack();
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });
  return (
    <div className="absolute inset-0" data-stage-select data-stage-choice={selected}>
      <StagePreview stageId={preview} animated className="absolute inset-0 w-full h-full" />
      <div className="absolute inset-0 bg-black/75" />
      <div className="absolute left-6 top-5 title-main text-[30px]">ESCOLHA O MAPA</div>
      <div className="absolute right-6 top-6 text-[9px] tracking-widest text-white/55">03 / ARENA DO CONFRONTO</div>
      <div className="absolute left-6 top-[66px] flex items-center gap-3 text-[13px]">
        <span style={{ color: CHARS[p1].glow }}>{CHARS[p1].name}</span><span className="title-main text-amber-300 text-[18px]">VS</span><span style={{ color: CHARS[p2].glow }}>{CHARS[p2].name}</span>
      </div>
      <div className="absolute top-[108px] left-6 right-6 grid grid-cols-3 gap-3">
        {STAGE_IDS.slice(page*6,page*6+6).map((id, index) => {
          const info = STAGES[id];
          return <button key={id} type="button" data-stage={id} aria-label={`Selecionar mapa ${info.name}`} aria-pressed={selected === id} onClick={() => select(id)} disabled={locked}
            className="relative overflow-hidden h-[136px] border-2 text-left cursor-pointer transition-transform"
            style={{ borderColor: selected === id ? info.accent : '#ffffff33', transform: selected === id ? 'translateY(-2px)' : undefined, boxShadow: selected === id ? `0 0 20px ${info.accent}55` : undefined }}>
            <StagePreview stageId={id} className="absolute inset-0 w-full h-full" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,transparent 25%,rgba(0,0,0,.95))' }} />
            <span className="absolute top-2 left-2 text-[9px] px-1 bg-black/60 text-white/70">{String(page*6+index+1).padStart(2,'0')}</span>
            <div className="absolute left-3 right-3 bottom-3"><div className="title-main text-[18px]" style={{ color: selected === id ? info.accent : '#fff' }}>{info.name}</div><div className="text-[9px] text-white/65 mt-1">{info.subtitle}</div></div>
          </button>;
        })}
      </div>
      <button type="button" data-stage="random" aria-pressed={selected === 'random'} onClick={() => select('random')} disabled={locked}
        className="absolute left-6 top-[404px] w-[296px] h-[45px] border-2 text-left px-4 cursor-pointer"
        style={{ borderColor: selected === 'random' ? '#fcd34d' : '#ffffff33', background: selected === 'random' ? '#785311cc' : '#0a061acc' }}>
        <span className="title-main text-[17px]">? ALEATÓRIO</span><span className="text-[8px] text-white/50 float-right mt-1">SURPREENDA-ME</span>
      </button>
      <div className="absolute left-[348px] top-[404px] flex items-center gap-2"><button aria-label="Página anterior de mapas" className="border border-white/25 px-3 py-3 cursor-pointer disabled:opacity-30" disabled={page===0} onClick={()=>setPage(page-1)}>◀</button><span className="text-xs">{page+1}/{Math.ceil(STAGE_IDS.length/6)}</span><button aria-label="Próxima página de mapas" className="border border-white/25 px-3 py-3 cursor-pointer disabled:opacity-30" disabled={page>=Math.ceil(STAGE_IDS.length/6)-1} onClick={()=>setPage(page+1)}>▶</button></div><div className="absolute right-6 top-[412px] text-right max-w-[350px]"><div className="title-main text-[17px]" style={{ color: STAGES[preview].accent }}>{selected === 'random' ? 'O DESTINO ESCOLHE A ARENA' : STAGES[preview].name}</div><div className="text-[9px] mt-1 text-white/50">{STAGES[preview].credit?`Ideia: ${STAGES[preview].credit}`:'17 arenas para cada confronto.'}</div></div>
      <div className="absolute bottom-7 left-8 right-8 flex items-center justify-between">
        <SkewBtn small onClick={onBack} disabled={locked}>LUTADORES</SkewBtn>
        <span className="text-[8px] tracking-wider text-white/55">SETAS / WASD ESCOLHER · ENTER CONFIRMAR</span>
        <div className="flex items-center gap-5"><MusicButton onClick={onRadio} /><SkewBtn small active color={STAGES[preview].accent} disabled={locked} onClick={confirm}>{locked ? 'PREPARE-SE!' : 'LUTAR!'}</SkewBtn></div>
      </div>
      <div className="absolute bottom-2 w-full text-center text-[9px] text-white/35">ESC VOLTAR À ESCOLHA DOS LUTADORES</div>
    </div>
  );
}

// ------------------------------------------------------------------ CONTROLES
export function Controls({ onBack }: { onBack: () => void }) {
  const [b, setB] = useState<[Bindings, Bindings]>(loadBindings());
  const [listen, setListen] = useState<{ p: 0 | 1; a: Action; s: 0 | 1 } | null>(null);
  const [notice,setNotice]=useState('');

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      e.preventDefault();
      if (listen) {
        if (e.code === 'Escape') {
          setListen(null);
          return;
        }
        const conflict=bindingConflict(b,listen.p,listen.a,e.code);
        if(conflict){setNotice(`${keyLabel(e.code)} já está em ${conflict}. Escolha outra tecla; o controle anterior foi preservado.`);return;}
        setNotice('');
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
  }, [listen, onBack,b]);

  const reset = () => {
    const n = JSON.parse(JSON.stringify(DEFAULT_BINDINGS)) as [Bindings, Bindings];
    saveBindings(n);
    setB(n);
    setNotice('');
  };

  const panel = (p: 0 | 1) => {
    const ch = p === 0 ? 'caetano' : 'orango';
    const d = CHARS[ch];
    return (
      <div className="absolute" style={{ left: p === 0 ? 14 : 490, top: 58, width: 456 }}>
        <div className="title-main text-xl px-3 py-1 mb-1" style={{ background: `linear-gradient(90deg, ${d.color}, transparent)` }}>
          JOGADOR {p + 1} — <span className="text-white/90 text-base">qualquer lutador</span>
        </div>
        <div className="grid" style={{ gridTemplateColumns: '1fr 120px 120px', gap: 2 }}>
          <div className="text-[10px] text-white/50">AÇÃO</div>
          <div className="text-[10px] text-white/50 text-center">TECLA</div>
          <div className="text-[10px] text-white/50 text-center">ALTERNATIVA</div>
          {ACTIONS.map((a) => (
            <div key={a} className="contents">
              <div className="text-[12px] leading-[15px] flex items-center" style={{ color: a === 'super' ? '#fde047' : '#fff' }}>
                {ACTION_LABELS[a]}
              </div>
              {([0, 1] as const).map((s) => {
                const on = listen && listen.p === p && listen.a === a && listen.s === s;
                return (
                  <button
                    key={s}
                    onClick={() => setListen({ p, a, s })}
                    className="text-[11px] leading-[15px] border cursor-pointer"
                    aria-label={`P${p+1} ${ACTION_LABELS[a]} ${s===0?'principal':'alternativa'}`}
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
      <div role="status" className="absolute left-4 right-4 text-[10px] leading-[13px] text-amber-200" style={{top:370,maxHeight:32,overflowY:'auto'}}>{notice||bindingNotices(b).join(' ')}</div>
      <div className="absolute left-4 right-4 text-[10px] leading-[13px] text-white/80" role="region" aria-label="Ajuda dos controles" tabIndex={0} style={{ top: 405,maxHeight:82,overflowY:'auto',paddingRight:4 }}>
        <b className="text-yellow-300">GOLPES NORMAIS:</b> soco/chute parado = <b>fraco</b> · <b>→ + botão</b> = <b>médio</b> · <b>← + botão</b> = <b>forte</b> · <b>↓ + botão</b> = agachado · no ar = golpe aéreo. <b className="text-yellow-300">CABEÇADA:</b> L / Num9, golpe de perto com recuperação. <b className="text-yellow-300">COMBOS:</b> aperte o botão em sequência
        (fraco → médio → forte) e cancele em um especial ou super quando acertar. <b className="text-yellow-300">DEFESA:</b> E / Num3 (padrão), segure para altos/médios; ↓ + Defesa para baixos/médios. Pode manter durante hitstun. Aperte até 3 frames antes do contato para defesa perfeita; Caetano tem Leitura de 5 frames e Precisão. Normais não causam chip. Agarrões ignoram defesa: G / Num7 de perto. Agarrar junto escapa. <b className="text-yellow-300">VIRAR:</b> Q / N (padrão) no chão, sem interromper golpes. Mantém direção manual até sofrer golpe, agarrão, ULT ou rotação própria. Q/E continuam trocando categorias nos menus. <b className="text-yellow-300">DASH:</b> toque duas vezes ← ou →.{' '}
        <b className="text-yellow-300">CHOQUES:</b> Dedilho × Dedilho → SOCO repetidamente; ULT × ULT → seu botão de ULT! <b className="text-yellow-300">PAUSA:</b> ESC ou P. <b className="text-yellow-300">TREINO:</b> R reinicia posições, T troca o dummy. Teclado sem numpad? O Jogador 2 também usa , . / ; &apos; Enter e Shift direito
        (clique em qualquer tecla acima para reconfigurar). FINISHER: use ULT após o KO decisivo.
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
    <button aria-pressed={v} onClick={() => f(!v)} className="title-main px-5 py-1 border-2" style={{ background: v ? '#16a34a' : '#7f1d1d', borderColor: '#fff' }}>
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
        {row('MÚSICA', <input aria-label="Volume da música" type="range" min={0} max={1} step={0.05} value={p.music} onChange={(e) => upd({ music: +e.target.value })} className="w-60" />)}
        {row('EFEITOS SONOROS', <input aria-label="Volume dos efeitos" type="range" min={0} max={1} step={0.05} value={p.sfx} onChange={(e) => upd({ sfx: +e.target.value })} className="w-60" />)}
        {row('VOZES (NARRADOR)', toggle(p.voice, (v) => upd({ voice: v })))}
        {row('TREMOR DE TELA', toggle(p.shake, (v) => upd({ shake: v })))}
        {row('REDUZIR FLASHES', toggle(p.reducedFlash, (v) => upd({ reducedFlash: v })))}
        {row('DICAS DE COMBATE', toggle(p.combatHints, (v) => upd({ combatHints: v })))}
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
