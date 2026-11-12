import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { CHARS, CHAR_CATEGORIES } from '../game/data';
import type { CharId, CharCategory } from '../game/data';
import { STAGE_IDS, STAGES } from '../game/stage';
import type { StageId } from '../game/stage';
import type { Difficulty, Mode } from '../game/engine';
import { audio } from '../game/audio';
import { FORMS } from '../game/resources';
import { FIGHTER_STYLE } from '../game/presentation';
import { ACTIONS, ACTION_LABELS, DEFAULT_BINDINGS, bindingConflict, bindingNotices, keyLabel, loadBindings, saveBindings } from '../game/input';
import type { Action, Bindings } from '../game/input';
import { applyPrefs, loadPrefs, savePrefs } from '../game/prefs';
import type { Prefs } from '../game/prefs';
import { ArtCanvas, FighterPortrait, MusicButton, StagePreview } from './common';
import { MenuPage, MenuHeader, MenuFooter, useMenuBack } from './MenuLayout';
import { MobileOptions } from './MobileOptions';
import { useMobile } from './TouchControls';
import { DesktopMainMenu } from './DesktopMenu';

const accent = (color: string) => ({ '--accent': color } as CSSProperties);
const isNativeControl = (target: EventTarget | null) => target instanceof Element && !!target.closest('button,input,select,textarea,summary,a');

function Brand() {
  return <div className="dw-brand"><h1>DEDILHO <span>WARS</span></h1><p>By Rickzera</p></div>;
}

export function Splash({ onStart }: { onStart: () => void }) {
  const mobile = useMobile();
  useEffect(() => {
    const go = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || ['Tab', 'Escape'].includes(e.code) || isNativeControl(e.target)) return;
      e.preventDefault(); onStart();
    };
    window.addEventListener('keydown', go);
    return () => window.removeEventListener('keydown', go);
  }, [onStart]);
  return <MenuPage className="dw-splash" background={<ArtCanvas variant="splash" />} label="Dedilho Wars">
    <div className="dw-splash-content"><p className="dw-eyebrow">A ARENA É DE TODOS</p><Brand />
      <button className="dw-button dw-primary dw-start" onClick={onStart}>{mobile ? 'TOQUE PARA COMEÇAR' : 'CLIQUE OU PRESSIONE QUALQUER TECLA'} <span aria-hidden="true">→</span></button>
    </div>
  </MenuPage>;
}

export type MenuChoice = 'play' | 'versus' | 'training' | 'controls' | 'settings' | 'radio' | 'online' | 'profile' | 'campaigns';
const MENU_ITEMS: { id: MenuChoice; label: string; detail: string; color: string; featured?: boolean }[] = [
  { id: 'play', label: 'JOGAR', detail: 'Enfrente o computador', color: '#bd9bff', featured: true },
  { id: 'campaigns', label: 'WARS OF CHAMPIONS', detail: 'Conheça as campanhas · Em breve', color: '#ffd092', featured: true },
  { id: 'online', label: 'ONLINE', detail: 'Desafie um amigo', color: '#67e8f9' },
  { id: 'versus', label: 'VERSUS LOCAL', detail: 'Dois jogadores', color: '#fcd34d' },
  { id: 'training', label: 'TREINAMENTO', detail: 'Pratique seus golpes', color: '#86efac' },
  { id: 'profile', label: 'PERFIL E RANKING', detail: 'Sua evolução na arena', color: '#f9a8d4' },
  { id: 'controls', label: 'CONTROLES', detail: 'Aprenda e personalize', color: '#93c5fd' },
  { id: 'settings', label: 'CONFIGURAÇÕES', detail: 'Som, imagem e conforto', color: '#c4b5fd' },
];
export function MainMenu(props: { onChoose: (c: MenuChoice) => void; onRadio: () => void; suspended?: boolean }) {
  const mobile = useMobile();
  return mobile ? <MobileMainMenu {...props} /> : <DesktopMainMenu {...props} />;
}

function MobileMainMenu({ onChoose, onRadio, suspended = false }: { onChoose: (c: MenuChoice) => void; onRadio: () => void; suspended?: boolean }) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const [selected, setSelected] = useState(0);
  useEffect(() => { audio.music('menu'); }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (suspended || e.repeat || e.altKey || e.ctrlKey || e.metaKey) return;
      if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'KeyS', 'KeyW'].includes(e.code)) {
        if (isNativeControl(e.target) && !buttons.current.includes(e.target as HTMLButtonElement)) return;
        e.preventDefault();
        const step = ['ArrowUp', 'ArrowLeft', 'KeyW'].includes(e.code) ? -1 : 1;
        const next = (selected + step + MENU_ITEMS.length) % MENU_ITEMS.length;
        setSelected(next); buttons.current[next]?.focus(); audio.select();
      } else if (['Enter', 'Space'].includes(e.code) && !isNativeControl(e.target)) {
        e.preventDefault(); onChoose(MENU_ITEMS[selected].id);
      }
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [selected, suspended, onChoose]);
  return <MenuPage className="dw-home" label="Menu inicial" background={<ArtCanvas variant="menu" paused={suspended} />}>
    <div className="dw-home-top"><span className="dw-eyebrow">ESCOLHA SEU PRÓXIMO CONFRONTO</span><MusicButton onClick={onRadio} /></div>
    <div className="dw-home-panel"><Brand />
      <nav className="dw-home-actions" aria-label="Modos de jogo">{MENU_ITEMS.map((item, i) => <button key={item.id} ref={el => { buttons.current[i] = el; }} className={`dw-mode ${item.featured ? 'dw-mode-featured' : ''}`} aria-label={item.label} aria-describedby={`dw-mode-${item.id}`} style={accent(item.color)} onFocus={() => setSelected(i)} onClick={() => { audio.confirm(); onChoose(item.id); }}>
        <span><strong>{item.label}</strong><small id={`dw-mode-${item.id}`}>{item.detail}</small></span><svg className="dw-arrow" aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>
      </button>)}</nav>
      <p className="dw-keyboard-hint">Setas para navegar · Enter para escolher</p>
    </div>
  </MenuPage>;
}

export function DifficultySelect({ onPick, onBack }: { onPick: (d: Difficulty) => void; onBack: () => void }) {
  const items: [Difficulty, string, string, string][] = [
    ['easy', 'FÁCIL', '#86efac', 'Uma luta mais tranquila para aprender os golpes e explorar a arena.'],
    ['normal', 'NORMAL', '#fcd34d', 'Um desafio equilibrado, com defesas, combos e especiais.'],
    ['hard', 'DIFÍCIL', '#fda4af', 'Um oponente rápido, que combina ataques e reage com estratégia.'],
  ];
  const [selected, setSelected] = useState(1);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  useMenuBack(onBack);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault(); const next = (selected + (['ArrowUp', 'ArrowLeft'].includes(e.code) ? 2 : 1)) % 3;
        setSelected(next); buttons.current[next]?.focus();
      } else if (['Enter', 'Space'].includes(e.code) && !isNativeControl(e.target)) { e.preventDefault(); onPick(items[selected][0]); }
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  });
  return <MenuPage label="Dificuldade"><MenuHeader title="Dificuldade" eyebrow="PARTIDA CONTRA O COMPUTADOR" description="Escolha o ritmo da sua próxima luta." onBack={onBack} />
    <section className="dw-difficulty">{items.map(([id, label, color, description], i) => <button key={id} ref={el => { buttons.current[i] = el; }} className="dw-card dw-difficulty-card" style={accent(color)} onFocus={() => setSelected(i)} onClick={() => onPick(id)}>
      <span className="dw-card-number">0{i + 1}</span><h2>{label}</h2><p>{description}</p><span className="dw-card-link">Escolher <span aria-hidden="true">→</span></span>
    </button>)}</section>
  </MenuPage>;
}

const CATEGORY_ORDER: CharCategory[] = ['Streamers', 'Viewers', 'Especiais'];
const categoryOf = (ch: CharId): CharCategory => CATEGORY_ORDER.find(category => (CHAR_CATEGORIES[category] as readonly CharId[]).includes(ch)) || 'Streamers';
const MODE_TITLE: Record<Mode, string> = { ai: 'CONTRA O COMPUTADOR', versus: 'VERSUS LOCAL', training: 'TREINAMENTO' };

export function CharSelect({ mode, difficulty, initialP1 = 'caetano', initialP2 = 'orango', onPick, onBack, onRadio, suspended = false }: {
  mode: Mode; difficulty: Difficulty; initialP1?: CharId; initialP2?: CharId;
  onPick: (p1: CharId, p2: CharId) => void; onBack: () => void; onRadio: () => void; suspended?: boolean;
}) {
  const [phase, setPhase] = useState<0 | 1>(0);
  const [picks, setPicks] = useState<[CharId, CharId]>([initialP1, initialP2]);
  const [categories, setCategories] = useState<[CharCategory, CharCategory]>([categoryOf(initialP1), categoryOf(initialP2)]);
  const remembered = useRef<Partial<Record<CharCategory, CharId>>[]>([{ [categoryOf(initialP1)]: initialP1 }, { [categoryOf(initialP2)]: initialP2 }]);
  const selected = picks[phase], category = categories[phase], roster = CHAR_CATEGORIES[category] as readonly CharId[];
  const d = CHARS[selected];
  const opponent = mode === 'ai' ? 'COMPUTADOR' : mode === 'versus' ? 'JOGADOR 2' : 'OPONENTE DE TREINO';
  const back = () => phase === 1 ? setPhase(0) : onBack();
  useMenuBack(back, suspended);
  useEffect(() => { audio.music('menu'); }, []);
  const select = (ch: CharId) => { remembered.current[phase][category] = ch; setPicks(prev => phase === 0 ? [ch, prev[1]] : [prev[0], ch]); audio.select(); };
  const changeCategory = (next: CharCategory) => {
    const ch = remembered.current[phase][next] || CHAR_CATEGORIES[next][0];
    setCategories(prev => phase === 0 ? [next, prev[1]] : [prev[0], next]);
    if (ch) setPicks(prev => phase === 0 ? [ch, prev[1]] : [prev[0], ch]);
    audio.select();
  };
  const confirm = () => { if (suspended || !roster.includes(selected)) return; audio.confirm(); if (phase === 0) setPhase(1); else onPick(picks[0], picks[1]); };
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (suspended || e.repeat || e.ctrlKey || e.metaKey || e.altKey || e.target instanceof HTMLInputElement) return;
      if (e.code === 'KeyQ' || e.code === 'KeyE') { e.preventDefault(); changeCategory(CATEGORY_ORDER[(CATEGORY_ORDER.indexOf(category) + (e.code === 'KeyQ' ? 2 : 1)) % 3]); }
      const delta: Record<string, number> = { ArrowLeft: -1, KeyA: -1, ArrowRight: 1, KeyD: 1, ArrowUp: -3, KeyW: -3, ArrowDown: 3, KeyS: 3 };
      if (e.code in delta && roster.length) { e.preventDefault(); select(roster[(roster.indexOf(selected) + delta[e.code] + roster.length) % roster.length]); }
      if (['Enter', 'Space'].includes(e.code) && !isNativeControl(e.target)) { e.preventDefault(); confirm(); }
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  });
  return <MenuPage className="dw-select" label="Seleção de lutadores"><MenuHeader title="Escolha os lutadores" eyebrow={MODE_TITLE[mode]} description={mode === 'ai' ? `Dificuldade: ${{ easy: 'Fácil', normal: 'Normal', hard: 'Difícil' }[difficulty]}` : 'Escolha um lutador para cada lado da arena.'} onBack={back} actions={<MusicButton onClick={onRadio} />} />
    <div data-select-phase={phase} data-select-category={category}>
      <div className="dw-picks">{picks.map((ch, i) => <button key={i} className="dw-pick" style={accent(CHARS[ch].glow)} aria-pressed={phase === i} onClick={() => setPhase(i as 0 | 1)}>
        <span>{i === 0 ? 'JOGADOR 1' : opponent} <small>{phase === i ? 'Escolhendo' : 'Editar'}</small></span><strong>{CHARS[ch].name}</strong>
      </button>)}</div>
      <div className="dw-select-grid"><section className="dw-card dw-roster-panel" aria-label="Lutadores disponíveis">
        <div className="dw-tabs" role="tablist" aria-label="Categorias de lutadores">{CATEGORY_ORDER.map(tab => <button key={tab} role="tab" data-category={tab} aria-selected={category === tab} onClick={() => changeCategory(tab)}>{tab}</button>)}</div>
        <p className="dw-label">{phase === 0 ? '01 / SEU LUTADOR' : `02 / ${opponent}`}</p>
        <div className="dw-roster">{roster.map(ch => <button key={ch} data-char={ch} aria-label={`Selecionar ${CHARS[ch].name}`} aria-pressed={ch === selected} className="dw-fighter" style={accent(CHARS[ch].glow)} onClick={() => select(ch)}>
          <FighterPortrait ch={ch} size={37} /><span>{CHARS[ch].name}</span>
        </button>)}</div>
        {!roster.length && <p className="dw-empty">Novos lutadores em breve. Escolha outra categoria.</p>}
        <p className="dw-help dw-keyboard-hint">Setas / WASD: escolher · Q / E: categorias</p>
      </section><section className="dw-card dw-fighter-preview" style={accent(d.glow)} aria-label={`Prévia de ${d.name}`}>
        <div className="dw-fighter-art"><ArtCanvas variant="select" selected={selected} paused={suspended} /></div>
        <div className="dw-fighter-description"><p className="dw-eyebrow">{FIGHTER_STYLE[selected].name}</p><h2>{d.name}</h2><p>{d.bio}</p>
          <details className="dw-details"><summary>Golpes e transformação</summary><FighterDetails ch={selected} bindings={loadBindings()[phase]} /></details>
        </div>
      </section></div>
    </div>
    <MenuFooter><p>{phase === 0 ? 'Escolha seu lutador e confirme.' : 'Os dois lados podem usar o mesmo lutador.'}</p><button className="dw-button dw-primary" disabled={!roster.includes(selected)} onClick={confirm}>{phase === 0 ? 'CONFIRMAR P1' : 'ESCOLHER MAPA'} <span aria-hidden="true">→</span></button></MenuFooter>
  </MenuPage>;
}

function FighterDetails({ ch, bindings }: { ch: CharId; bindings: Bindings }) {
  const d = CHARS[ch];
  return <div className="dw-move-list">{d.specials.map((move, i) => <div key={move.name}><kbd>{keyLabel(bindings[(['s1', 's2', 's3'] as const)[i]][0])}</kbd><p><strong>{move.name}</strong><span>{move.desc}</span></p></div>)}
    <div><kbd>{keyLabel(bindings.super[0])}</kbd><p><strong>{d.superName}</strong><span>Ultimate · 100 de ULT</span></p></div>
    <div><kbd>{keyLabel(bindings.transform[0])}</kbd><p><strong>{FORMS[ch].name}</strong><span>Transformação · 200 de ULT · 10 segundos</span></p></div>
  </div>;
}

export function StageSelect({ p1, p2, initialStage = 'dojo', onPick, onBack, onRadio, suspended = false }: {
  p1: CharId; p2: CharId; initialStage?: StageId; onPick: (stage: StageId) => void; onBack: () => void; onRadio: () => void; suspended?: boolean;
}) {
  const [page, setPage] = useState(Math.floor(STAGE_IDS.indexOf(initialStage) / 6));
  const [selected, setSelected] = useState<StageId>(initialStage);
  const choose = (id: StageId) => { setSelected(id); setPage(Math.floor(STAGE_IDS.indexOf(id) / 6)); audio.select(); };
  useMenuBack(onBack, suspended);
  useEffect(() => { audio.music('menu'); }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (suspended || e.repeat) return;
      const delta: Record<string, number> = { ArrowLeft: -1, KeyA: -1, ArrowRight: 1, KeyD: 1, ArrowUp: -3, KeyW: -3, ArrowDown: 3, KeyS: 3 };
      if (e.code in delta) { e.preventDefault(); choose(STAGE_IDS[(STAGE_IDS.indexOf(selected) + delta[e.code] + STAGE_IDS.length) % STAGE_IDS.length]); }
      if (['Enter', 'Space'].includes(e.code) && !isNativeControl(e.target)) { e.preventDefault(); onPick(selected); }
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  });
  return <MenuPage label="Seleção de mapa"><MenuHeader title="Escolha o mapa" eyebrow="03 / ARENA DO CONFRONTO" description={`${CHARS[p1].name}  ×  ${CHARS[p2].name}`} onBack={onBack} actions={<MusicButton onClick={onRadio} />} />
    <div data-stage-select data-stage-choice={selected}>
      <div className="dw-stage-grid">{STAGE_IDS.slice(page * 6, page * 6 + 6).map(id => <button key={id} data-stage={id} className="dw-stage dw-card" style={accent(STAGES[id].accent)} aria-label={`Selecionar mapa ${STAGES[id].name}`} aria-pressed={selected === id} onClick={() => choose(id)}>
        <div className="dw-stage-art"><StagePreview stageId={id} className="dw-stage-canvas" /></div><div className="dw-stage-caption"><strong>{STAGES[id].name}</strong><span>{STAGES[id].subtitle}</span></div>
      </button>)}</div>
      <div className="dw-stage-tools"><button data-stage="random" className="dw-button" onClick={() => choose(STAGE_IDS[Math.floor(Math.random() * STAGE_IDS.length)])}>↻ MAPA ALEATÓRIO</button>
        <div className="dw-pagination"><button className="dw-button" aria-label="Página anterior de mapas" disabled={page === 0} onClick={() => setPage(page - 1)}>←</button><span>{page + 1} / {Math.ceil(STAGE_IDS.length / 6)}</span><button className="dw-button" aria-label="Próxima página de mapas" disabled={page >= Math.ceil(STAGE_IDS.length / 6) - 1} onClick={() => setPage(page + 1)}>→</button></div>
      </div>
    </div>
    <MenuFooter><div><strong>{STAGES[selected].name}</strong><p>{STAGES[selected].credit ? `Ideia: ${STAGES[selected].credit}` : '17 arenas para cada confronto.'}</p></div><button className="dw-button dw-primary" onClick={() => { audio.confirm(); onPick(selected); }}>LUTAR! <span aria-hidden="true">→</span></button></MenuFooter>
  </MenuPage>;
}

const GUIDE = [
  ['Golpes normais', 'Soco e chute parados são fracos. Segure para a frente para o médio ou para trás para o forte. Agachado ou no ar, os golpes mudam.'],
  ['Defesa e agarrão', 'Segure Defesa para bloquear altos e médios; agache para defender baixos. O agarrão funciona de perto e ignora a defesa. Agarrar ao mesmo tempo permite escapar.'],
  ['Combos e movimento', 'Combine fraco → médio → forte e cancele em um especial ou Ultimate ao acertar. Toque duas vezes para a frente ou para trás para dar um dash. Virar troca sua direção manualmente.'],
  ['Recursos e transformação', 'Descanse para recuperar stamina. Ultimate custa 100 de ULT. Transformar usa 200 e dura 10 segundos, com preparação vulnerável. Rickzera carrega energia segurando Carregar em neutro.'],
  ['Choques e finalizações', 'Dedilho contra Dedilho: toque Soco repetidamente. Ultimate contra Ultimate: toque ULT. Após o KO decisivo, use ULT para o Finisher.'],
  ['No celular e no treino', 'Use o direcional e os botões de toque. Em Configurações, ajuste o lado do direcional, o tamanho dos botões e a qualidade. No treino: R reinicia posições, T troca o oponente. ESC / P ou Menu pausa a luta.'],
];
export function Controls({ onBack }: { onBack: () => void }) {
  const mobile = useMobile();
  const [b, setB] = useState<[Bindings, Bindings]>(loadBindings());
  const [listen, setListen] = useState<{ p: 0 | 1; a: Action; s: 0 | 1 } | null>(null);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (!listen) { if (e.code === 'Escape') onBack(); return; }
      e.preventDefault(); if (e.repeat) return;
      if (e.code === 'Escape') { setListen(null); return; }
      const conflict = bindingConflict(b, listen.p, listen.a, e.code);
      if (conflict) { setNotice(`${keyLabel(e.code)} já está em ${conflict}. Escolha outra tecla; o controle anterior foi preservado.`); return; }
      const next = structuredClone(b);
      for (const a of ACTIONS) for (const slot of [0, 1] as const) if (next[listen.p][a][slot] === e.code) next[listen.p][a][slot] = '';
      next[listen.p][listen.a][listen.s] = e.code;
      if (!next[listen.p][listen.a][0] && next[listen.p][listen.a][1]) { next[listen.p][listen.a][0] = next[listen.p][listen.a][1]; next[listen.p][listen.a][1] = ''; }
      saveBindings(next); setB(next); setListen(null); setNotice('Controle salvo neste dispositivo.');
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [listen, b, onBack]);
  const reset = () => { const next = structuredClone(DEFAULT_BINDINGS); saveBindings(next); setB(next); setNotice('Controles padrão restaurados.'); };
  return <MenuPage label="Controles"><MenuHeader title="Controles" description="Aprenda os movimentos e monte seu jeito de lutar." onBack={onBack} />
    <section className="dw-guide" aria-label="Ajuda dos controles">{GUIDE.map(([title, detail]) => <article className="dw-card" key={title}><h2>{title}</h2><p>{detail}</p></article>)}</section>
    <details className="dw-card dw-keyboard-controls" open={!mobile}><summary>Personalizar teclado · Jogadores 1 e 2</summary><p className="dw-help">Clique em uma tecla e pressione a nova. Use Esc para cancelar. A alternativa permite jogar sem teclado numérico.</p>
      <div className="dw-bindings">{([0, 1] as const).map(p => <section key={p}><h2>Jogador {p + 1}</h2><div className="dw-binding-row dw-binding-head"><span>Ação</span><span>Principal</span><span>Alternativa</span></div>
        {ACTIONS.map(a => <div key={a} className="dw-binding-row"><span>{ACTION_LABELS[a]}</span>{([0, 1] as const).map(s => <button key={s} className="dw-button" aria-label={`P${p + 1} ${ACTION_LABELS[a]} ${s === 0 ? 'principal' : 'alternativa'}`} onClick={() => { setNotice(''); setListen({ p, a, s }); }}>{keyLabel(b[p][a][s])}</button>)}</div>)}
      </section>)}</div>
      <button className="dw-button" onClick={reset}>RESTAURAR PADRÃO</button>
    </details>
    <p role="status" className="dw-notice">{notice || bindingNotices(b).join(' ')}</p>
    {listen && <div className="dw-listening" role="dialog" aria-modal="true" aria-label="Escolher nova tecla"><div className="dw-card"><h2>Pressione a nova tecla</h2><p>P{listen.p + 1} · {ACTION_LABELS[listen.a]}</p>{notice && <p role="alert" className="dw-notice">{notice}</p>}<button className="dw-button" onClick={() => setListen(null)}>CANCELAR</button></div></div>}
  </MenuPage>;
}

export function Settings({ onBack }: { onBack: () => void }) {
  const [p, setP] = useState<Prefs>(loadPrefs());
  const upd = (change: Partial<Prefs>) => { const next = { ...p, ...change }; setP(next); savePrefs(next); applyPrefs(next); };
  useMenuBack(onBack);
  const row = (label: string, control: ReactNode, detail?: string) => <div className="dw-setting-row"><div><strong>{label}</strong>{detail && <small>{detail}</small>}</div><div className="dw-setting-control">{control}</div></div>;
  const toggle = (label: string, value: boolean, change: (v: boolean) => void) => <button className="dw-button dw-toggle" aria-label={label} aria-pressed={value} onClick={() => change(!value)}>{value ? 'Ligado' : 'Desligado'}</button>;
  const volume = (label: string, key: 'music' | 'sfx') => <div className="dw-volume"><input aria-label={label} type="range" min={0} max={1} step={0.05} value={p[key]} onChange={e => upd({ [key]: +e.target.value })} /><output>{Math.round(p[key] * 100)}%</output></div>;
  return <MenuPage className="dw-settings" label="Configurações"><MenuHeader title="Configurações" description="Seus ajustes são salvos neste dispositivo." onBack={onBack} />
    <div className="dw-settings-grid"><section className="dw-card"><h2>Áudio</h2>{row('Música', volume('Volume da música', 'music'))}{row('Efeitos sonoros', volume('Volume dos efeitos', 'sfx'))}{row('Vozes do narrador', toggle('Vozes do narrador', p.voice, v => upd({ voice: v })))}</section>
      <section className="dw-card"><h2>Imagem e combate</h2>{row('Tremor de tela', toggle('Tremor de tela', p.shake, v => upd({ shake: v })))}{row('Reduzir flashes', toggle('Reduzir flashes', p.reducedFlash, v => upd({ reducedFlash: v })))}{row('Dicas de combate', toggle('Dicas de combate', p.combatHints, v => upd({ combatHints: v })))}{row('Mostrar hitboxes', toggle('Mostrar hitboxes', p.hitboxes, v => upd({ hitboxes: v })))}</section>
      <section className="dw-card"><h2>Dificuldade padrão</h2><div className="dw-tabs">{(['easy', 'normal', 'hard'] as const).map(d => <button key={d} aria-pressed={p.difficulty === d} onClick={() => upd({ difficulty: d })}>{{ easy: 'Fácil', normal: 'Normal', hard: 'Difícil' }[d]}</button>)}</div></section>
      <section className="dw-card dw-mobile-options"><MobileOptions /></section>
    </div>
  </MenuPage>;
}
