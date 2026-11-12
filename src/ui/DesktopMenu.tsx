import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, MouseEvent } from 'react';
import type { MenuChoice } from './Screens';
import { ArtCanvas, MusicButton } from './common';
import { MenuPage } from './MenuLayout';
import { audio } from '../game/audio';
import './desktop-menu.css';

type MainMenuProps = { onChoose: (choice: MenuChoice) => void; onRadio: () => void; suspended?: boolean };
const OPTIONS: { id: MenuChoice; label: string; caption: string; detail: string; color: string }[] = [
  { id: 'play', label: 'JOGAR', caption: 'ENFRENTE O COMPUTADOR', detail: 'Escolha seu lutador e conquiste a arena.', color: '#be94ff' },
  { id: 'online', label: 'ONLINE', caption: 'DESAFIE UM RIVAL', detail: 'Crie uma sala, convide um amigo e entre na luta.', color: '#60deef' },
  { id: 'campaigns', label: 'WARS OF CHAMPIONS', caption: 'QUATRO HISTÓRIAS. QUATRO CAMINHOS.', detail: 'Conheça Senbukan, Resenha, Got e Campeões. Campanhas em breve.', color: '#f0c28b' },
  { id: 'versus', label: 'VERSUS LOCAL', caption: 'LADO A LADO. FRENTE A FRENTE.', detail: 'Dois jogadores, um teclado e uma arena.', color: '#f5bb5b' },
  { id: 'training', label: 'TREINAMENTO', caption: 'DOMINE SEU ESTILO', detail: 'Treine movimentos, combos e transformações no seu ritmo.', color: '#86dfb1' },
  { id: 'profile', label: 'PERFIL E RANKING', caption: 'SUA HISTÓRIA NA ARENA', detail: 'Acompanhe suas partidas, seu nível e suas vitórias.', color: '#eaa8cb' },
  { id: 'controls', label: 'CONTROLES', caption: 'ENCONTRE SEU JEITO DE LUTAR', detail: 'Aprenda os comandos e personalize seu teclado.', color: '#9cc7ff' },
  { id: 'settings', label: 'CONFIGURAÇÕES', caption: 'PREPARE A PRÓXIMA LUTA', detail: 'Ajuste o som, a imagem e suas preferências.', color: '#cbb7ed' },
];
const nativeControl = (target: EventTarget | null) => target instanceof Element && !!target.closest('button,input,select,textarea,summary,a');

/** Desktop presentation stays outside the arena's logical zoom and never changes touch menus. */
export function DesktopMainMenu({ onChoose, onRadio, suspended = false }: MainMenuProps) {
  const [selected, setSelected] = useState(0);
  const [rallies, setRallies] = useState(0);
  const active = useRef(0);
  const modality = useRef<'keyboard' | 'pointer'>('pointer');
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const choice = OPTIONS[selected];
  const highlight = (index: number) => {
    if (suspended || active.current === index) return;
    active.current = index;
    setSelected(index);
    audio.select();
  };
  useEffect(() => { audio.music('menu'); }, []);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (suspended || event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.code === 'KeyM') { event.preventDefault(); onRadio(); return; }
      if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyS', 'Home', 'End'].includes(event.code)) {
        if (nativeControl(event.target) && !buttons.current.includes(event.target as HTMLButtonElement)) return;
        event.preventDefault(); modality.current = 'keyboard';
        const next = event.code === 'Home' ? 0 : event.code === 'End' ? OPTIONS.length - 1 : (active.current + (['ArrowUp', 'ArrowLeft', 'KeyW'].includes(event.code) ? -1 : 1) + OPTIONS.length) % OPTIONS.length;
        buttons.current[next]?.focus();
      } else if (['Enter', 'Space'].includes(event.code) && !nativeControl(event.target)) {
        event.preventDefault(); audio.confirm(); onChoose(OPTIONS[active.current].id);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onChoose, onRadio, suspended]);
  const rally = (event: MouseEvent<HTMLButtonElement>) => {
    if (suspended) return;
    const x = event.detail ? event.clientX / window.innerWidth * 960 : 700;
    window.dispatchEvent(new CustomEvent('dedilho-menu-rally', { detail: { x } }));
    setRallies(value => value + 1);
    audio.hit(1);
  };
  return <MenuPage className="dw-pc-home" label="Menu inicial" style={{ '--pc-accent': choice.color } as CSSProperties} background={<ArtCanvas variant="menu" paused={suspended} />}>
    <div className="pc-speed-lines" aria-hidden="true"><i /><i /><i /></div>
    <header className="pc-topbar"><p>WAR OF CHAMPIONS <span>/ MENU PRINCIPAL</span></p><MusicButton onClick={onRadio} /></header>
    <div className="pc-main">
      <section className="pc-navigation" aria-label="Escolha seu modo">
        <div className="pc-logo"><h1>DEDILHO <span>WARS</span></h1><p>By Rickzera</p></div>
        <nav className="pc-options" aria-label="Modos de jogo">{OPTIONS.map((option, index) => <button key={option.id} ref={element => { buttons.current[index] = element; }} className="pc-option" data-menu-choice={option.id} data-active={selected === index ? '1' : '0'} aria-label={option.label} aria-describedby={selected === index ? 'pc-mode-description' : undefined} onFocus={() => highlight(index)} onPointerEnter={event => { if (modality.current === 'pointer') { highlight(index); event.currentTarget.focus({ preventScroll: true }); } }} onPointerMove={event => { modality.current = 'pointer'; highlight(index); event.currentTarget.focus({ preventScroll: true }); }} onClick={() => { audio.confirm(); onChoose(option.id); }}>
          <span className="pc-option-content"><span className="pc-option-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><strong>{option.label}</strong><svg className="pc-option-arrow" aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m8 4 8 8-8 8" /></svg></span>
        </button>)}</nav>
      </section>
      <button type="button" className="pc-arena-interaction" aria-label="Agitar a pancadaria ao fundo" data-rally-count={rallies} onClick={rally}>
        <span className="pc-arena-word" aria-hidden="true">FIGHT</span>
        <span className="pc-scene-spark" key={rallies} data-visible={rallies > 0 ? '1' : '0'} aria-hidden="true" />
        <span className="pc-scene-hint" aria-hidden="true"><svg width="17" height="21" viewBox="0 0 20 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="1" width="14" height="22" rx="7" /><path d="M10 1v8" /></svg>CLIQUE NO CENÁRIO PARA AGITAR</span>
      </button>
    </div>
    <footer className="pc-bottom-bar"><div className="pc-description" aria-live="polite"><p>{choice.caption}</p><span id="pc-mode-description">{choice.detail}</span></div><div className="pc-commands"><span><kbd>↑</kbd><kbd>↓</kbd> NAVEGAR</span><span><kbd>ENTER</kbd> CONFIRMAR</span><span><kbd>M</kbd> MÚSICA</span></div></footer>
  </MenuPage>;
}
