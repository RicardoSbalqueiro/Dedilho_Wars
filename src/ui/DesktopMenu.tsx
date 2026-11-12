import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent } from 'react';
import type { MenuChoice } from './Screens';
import { ArtCanvas, FighterPortrait, MusicButton } from './common';
import { MenuPage } from './MenuLayout';
import { MenuFighter } from './MenuFighter';
import { CHARS, CHAR_IDS } from '../game/data';
import type { CharId } from '../game/data';
import { audio } from '../game/audio';
import { FORMS } from '../game/resources';
import { settings } from '../game/visual-settings';
import './desktop-menu.css';

type MainMenuProps = { onChoose: (choice: MenuChoice) => void; onRadio: () => void; suspended?: boolean };
const MODES: { id: MenuChoice; label: string; lines: string[]; detail: string; color: string; fighter: CharId }[] = [
  { id: 'play', label: 'JOGAR', lines: ['JOGAR'], detail: 'Escolha seu lutador, a dificuldade e a arena. Enfrente o computador.', color: '#e1ff63', fighter: 'caetano' },
  { id: 'versus', label: 'VERSUS LOCAL', lines: ['VERSUS LOCAL'], detail: 'Dois jogadores no mesmo teclado. Escolham seus lutadores e entrem na arena.', color: '#ff977e', fighter: 'bieu' },
  { id: 'online', label: 'ONLINE', lines: ['ONLINE'], detail: 'Crie uma sala ou entre na partida de um amigo para lutar online.', color: '#74edee', fighter: 'rickzera' },
  { id: 'training', label: 'TREINAMENTO', lines: ['TREINAMENTO'], detail: 'Pratique golpes, combinações e transformações com os controles de treino.', color: '#c6a4ff', fighter: 'ulisses' },
  { id: 'campaigns', label: 'WARS OF CHAMPIONS', lines: ['WARS OF', 'CHAMPIONS'], detail: 'Senbukan, Resenha, Got e Campeões. Conheça as quatro campanhas que estão chegando.', color: '#f5ce90', fighter: 'renngotti' },
];
const UTILITIES: { id: MenuChoice; label: string; icon: 'profile' | 'controls' | 'settings' }[] = [
  { id: 'profile', label: 'PERFIL E RANKING', icon: 'profile' },
  { id: 'controls', label: 'CONTROLES', icon: 'controls' },
  { id: 'settings', label: 'CONFIGURAÇÕES', icon: 'settings' },
];
const nativeControl = (target: EventTarget | null) => target instanceof Element && !!target.closest('button,input,select,textarea,summary,a');

function MenuIcon({ icon }: { icon: 'profile' | 'controls' | 'settings' | 'arrow' | 'spark' }) {
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    {icon === 'profile' ? <><circle cx="12" cy="7" r="3.5" /><path d="M4 21v-3a8 8 0 0 1 16 0v3M8 21h8" /></> : icon === 'controls' ? <><path d="M7 7h10c3 0 4 2 5 10 0 3-3 3-5-1H7c-2 4-5 4-5 1 1-8 2-10 5-10ZM7 9v5M4.5 11.5h5" /><path d="M16 10h.01M19 13h.01" strokeWidth="3" /></> : icon === 'settings' ? <path d="M4 5h16M4 12h16M4 19h16M8 2v6M16 9v6M10 16v6" /> : icon === 'spark' ? <path d="m13 2-9 12h7l-1 8 10-13h-8l1-7Z" /> : <path d="M4 12h16m-7-7 7 7-7 7" />}
  </svg>;
}

/** Desktop-only illustrated selector; touch keeps its native, approved layout. */
export function DesktopMainMenu({ onChoose, onRadio, suspended = false }: MainMenuProps) {
  const [selected, setSelected] = useState(0);
  const [fighter, setFighter] = useState<CharId>('caetano');
  const [strike, setStrike] = useState(0);
  const [formMs, setFormMs] = useState(0);
  const [rallies, setRallies] = useState(0);
  const active = useRef(0);
  const modality = useRef<'keyboard' | 'pointer'>('pointer');
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const stage = useRef<HTMLDivElement>(null);
  const choice = MODES[selected];
  const transformed = formMs > 0;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const changeFighter = (ch: CharId) => { setFighter(ch); setFormMs(0); setStrike(0); };
  const cycleFighter = (direction: number) => {
    if (suspended) return;
    changeFighter(CHAR_IDS[(CHAR_IDS.indexOf(fighter) + direction + CHAR_IDS.length) % CHAR_IDS.length]); audio.select();
  };
  const highlight = (index: number) => {
    if (suspended || active.current === index) return;
    active.current = index; setSelected(index); changeFighter(MODES[index].fighter); audio.select();
  };
  const enter = (id: MenuChoice) => { if (!suspended) { audio.confirm(); onChoose(id); } };
  useEffect(() => { audio.music('menu'); }, []);
  // Radio and hidden tabs pause the preview countdown as well as its animation.
  useEffect(() => {
    if (!transformed || suspended) return;
    let last = performance.now();
    const reset = () => { last = performance.now(); };
    const interval = window.setInterval(() => {
      const now = performance.now(), elapsed = now - last; last = now;
      if (!document.hidden) setFormMs(value => Math.max(0, value - elapsed));
    }, 100);
    document.addEventListener('visibilitychange', reset);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', reset); };
  }, [transformed, suspended]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (suspended || event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.code === 'KeyM') { event.preventDefault(); onRadio(); return; }
      if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyS', 'Home', 'End'].includes(event.code)) {
        if (nativeControl(event.target) && !buttons.current.includes(event.target as HTMLButtonElement)) return;
        event.preventDefault(); modality.current = 'keyboard';
        const next = event.code === 'Home' ? 0 : event.code === 'End' ? MODES.length - 1 : (active.current + (['ArrowUp', 'ArrowLeft', 'KeyW'].includes(event.code) ? -1 : 1) + MODES.length) % MODES.length;
        buttons.current[next]?.focus({ preventScroll: true });
      } else if (['Enter', 'Space'].includes(event.code) && !nativeControl(event.target)) {
        event.preventDefault(); audio.confirm(); onChoose(MODES[active.current].id);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onChoose, onRadio, suspended]);
  const parallax = (event: PointerEvent<HTMLDivElement>) => {
    if (suspended || reduced || settings.shake === 0) return;
    const r = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--look-x', `${((event.clientX - r.left) / r.width - .5) * 12}px`);
    event.currentTarget.style.setProperty('--look-y', `${((event.clientY - r.top) / r.height - .5) * 8}px`);
  };
  const rally = () => {
    if (suspended) return;
    window.dispatchEvent(new CustomEvent('dedilho-menu-rally', { detail: { x: 650 } }));
    setRallies(value => value + 1); audio.hit(1);
  };
  return <MenuPage className="dw-pc-home" label="Menu inicial" style={{ '--pc-accent': choice.color } as CSSProperties} background={<ArtCanvas variant="menu" paused={suspended} />}>
    <div className="pc-comic-field" aria-hidden="true"><span /><i /><i /><i /></div>
    <div className="pc-home-shell" data-suspended={suspended ? '1' : '0'}>
      <header className="pc-topbar">
        <div className="pc-logo"><svg aria-hidden="true" viewBox="0 0 62 32"><path d="m3 24-2-19 15 9L29 1l11 14L60 5l-7 21Z" fill="none" stroke="currentColor" strokeWidth="3" /><path d="m7 31 44-1" stroke="currentColor" strokeWidth="3" /></svg><h1>DEDILHO <span>WARS</span></h1><p>By Rickzera</p></div>
        <nav className="pc-utilities" aria-label="Opções do jogo">{UTILITIES.map(option => <button key={option.id} data-menu-choice={option.id} aria-label={option.label} onClick={() => enter(option.id)}><MenuIcon icon={option.icon} /><span>{option.label}</span></button>)}<MusicButton onClick={onRadio} /></nav>
      </header>
      <div className="pc-main">
        <section className="pc-mode-preview" aria-label={choice.label}>
          <div className="pc-mode-copy" key={choice.id}>
            <h2 className="pc-mode-title" data-mode={choice.id} aria-label={choice.label}>{choice.lines.map(line => <span key={line} aria-hidden="true">{line}</span>)}</h2>
            <p id="pc-mode-description">{choice.detail}</p>
            <button className="pc-enter" onClick={() => enter(choice.id)} aria-label={`Entrar em ${choice.label}`}><span>ENTRAR</span><MenuIcon icon="arrow" /></button>
          </div>
          <button className="pc-rally" onClick={rally} data-rally-count={rallies}><MenuIcon icon="spark" /><span>Agitar a luta ao fundo</span><i key={rallies} data-pulse={rallies ? '1' : '0'} aria-hidden="true" /></button>
        </section>
        <div className="pc-showcase" ref={stage} onPointerMove={parallax} onPointerLeave={() => { stage.current?.style.setProperty('--look-x', '0px'); stage.current?.style.setProperty('--look-y', '0px'); }} style={{ '--fighter-color': CHARS[fighter].color } as CSSProperties} data-form={transformed ? '1' : '0'}>
          <div className="pc-fighter-ink" aria-hidden="true"><span /><div className="pc-face-echo" key={fighter}><FighterPortrait ch={fighter} size={190} /></div><i /><i /></div>
          <button className="pc-fighter-action" aria-label={`Ver golpe de ${CHARS[fighter].name}`} onClick={() => { if (!suspended) { setStrike(value => value + 1); audio.hit(1); } }}>
            <MenuFighter ch={fighter} strike={strike} transformed={transformed} paused={suspended} />
            <span className="pc-fighter-hint">Clique no lutador para atacar <MenuIcon icon="arrow" /></span>
          </button>
          <div className="pc-fighter-toolbar">
            <div className="pc-fighter-picker"><button onClick={() => cycleFighter(-1)} aria-label="Lutador anterior">‹</button><strong aria-live="polite">{CHARS[fighter].name}</strong><button onClick={() => cycleFighter(1)} aria-label="Próximo lutador">›</button></div>
            <button className="pc-transform" aria-label={transformed ? `${FORMS[fighter].name} ativa` : `Ver transformação de ${CHARS[fighter].name}`} disabled={transformed} onClick={() => { if (!suspended) { setFormMs(10000); audio.confirm(); } }} data-active={transformed ? '1' : '0'}><MenuIcon icon="spark" /><span>{transformed ? FORMS[fighter].name : 'Transformar'}</span><small>{transformed ? `${Math.ceil(formMs / 1000)}s` : '10s'}</small><i style={{ transform: `scaleX(${formMs / 10000})` }} aria-hidden="true" /></button>
          </div>
        </div>
      </div>
      <nav className="pc-mode-dock" aria-label="Modos de jogo">{MODES.map((option, index) => <button key={option.id} ref={element => { buttons.current[index] = element; }} className="pc-mode-card" data-menu-choice={option.id} data-active={selected === index ? '1' : '0'} aria-label={option.label} aria-describedby={selected === index ? 'pc-mode-description' : undefined} style={{ '--card-accent': option.color } as CSSProperties} onFocus={() => highlight(index)} onPointerEnter={event => { if (modality.current === 'pointer') { highlight(index); event.currentTarget.focus({ preventScroll: true }); } }} onPointerMove={event => { modality.current = 'pointer'; highlight(index); event.currentTarget.focus({ preventScroll: true }); }} onClick={() => enter(option.id)}>
        <div className="pc-card-art"><FighterPortrait ch={option.fighter} size={90} /></div><span className="pc-card-speed" aria-hidden="true" /><strong>{option.label}</strong><span className="pc-card-arrow"><MenuIcon icon="arrow" /></span>
      </button>)}</nav>
      <footer className="pc-bottom-bar"><span>DEDILHO WARS</span><div className="pc-commands"><span><kbd>←</kbd><kbd>→</kbd> Navegar</span><span><kbd>ENTER</kbd> Entrar</span><span><kbd>TAB</kbd> Opções</span><span><kbd>M</kbd> Música</span></div></footer>
    </div>
  </MenuPage>;
}
