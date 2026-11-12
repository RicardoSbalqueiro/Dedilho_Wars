import { createPortal } from 'react-dom';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { audio } from '../game/audio';
import { RADIO_TRACKS, radioTime } from '../game/radio';
import { keyboard } from '../game/input';
import { loadPrefs, savePrefs } from '../game/prefs';

export function RadioPanel({ onBack }: { onBack: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const state = useSyncExternalStore(audio.subscribeRadio, audio.getRadioSnapshot);
  const current = RADIO_TRACKS.find((track) => track.id === state.station)!;
  const original = current.id === 'original';

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    keyboard.down.clear();
    closeRef.current?.focus();
    const trap = (e: KeyboardEvent) => {
      e.stopImmediatePropagation();
      if (e.type === 'keyup') return;
      if (e.code === 'Escape') { e.preventDefault(); onBack(); return; }
      if (e.code !== 'Tab') return;
      e.preventDefault();
      const focusable = [...(panelRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), [tabindex="0"]') ?? [])];
      if (!focusable.length) return;
      const index = focusable.indexOf(document.activeElement as HTMLElement);
      focusable[(index + (e.shiftKey ? -1 : 1) + focusable.length) % focusable.length].focus();
    };
    window.addEventListener('keydown', trap, true);
    window.addEventListener('keyup', trap, true);
    return () => {
      window.removeEventListener('keydown', trap, true);
      window.removeEventListener('keyup', trap, true);
      keyboard.down.clear();
      if (previous?.isConnected) previous.focus();
    };
  }, [onBack]);

  const volume = (value: number) => {
    const music = Math.max(0, Math.min(1, value));
    audio.setSettings({ music });
    savePrefs({ ...loadPrefs(), music });
  };

  return createPortal(<div className="dw-radio-overlay">
    <div ref={panelRef} data-radio-panel role="dialog" aria-modal="true" aria-labelledby="radio-heading" className="dw-radio">
      <header className="dw-radio-header"><div><p className="dw-eyebrow">DEDILHO WARS · PLAYLIST</p><h1 id="radio-heading">DW Radio</h1></div><button ref={closeRef} className="dw-button" onClick={onBack}>← Voltar</button></header>
      <div className="dw-radio-body">
        <section className="dw-radio-player dw-card" aria-label="Reprodução">
          <div className="dw-radio-status"><span>AGORA NA RÁDIO</span><span>{state.loading ? 'CARREGANDO' : state.playing ? '● NO AR' : 'PAUSADA'}</span></div>
          <div className="dw-radio-wave" aria-hidden="true">{Array.from({ length: 21 }, (_, i) => <span key={i} style={{ height: 18 + ((i * 17 + 13) % 57), opacity: state.playing ? .9 : .3, transform: state.playing ? `scaleY(${.65 + Math.sin(state.currentTime * 4 + i) * .3})` : 'scaleY(.4)' }} />)}</div>
          <div className="dw-radio-current"><h2>{current.title}</h2><p>{current.artist}{original ? ' · Tema automático do jogo' : ''}</p></div>
          <div><input aria-label="Posição da música" type="range" min={0} max={state.duration || 1} step={1} value={Math.min(state.currentTime, state.duration || 1)} disabled={original || state.duration <= 0} onChange={e => audio.seekRadio(+e.target.value)} /><div className="dw-radio-time"><span>{original ? 'TRILHA ORIGINAL' : radioTime(state.currentTime)}</span><span>{original ? '∞' : state.duration ? radioTime(state.duration) : '—:—'}</span></div></div>
          <div className="dw-radio-transport"><button className="dw-button" aria-label="Faixa anterior" onClick={() => audio.nextRadio(-1)}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 5v14M19 5l-11 7 11 7z"/></svg></button><button className="dw-button dw-primary" aria-label={state.playing ? 'Pausar rádio' : 'Tocar rádio'} onClick={() => audio.toggleRadio()}>{state.playing || state.loading ? 'PAUSAR' : 'TOCAR'}</button><button className="dw-button" aria-label="Próxima faixa" onClick={() => audio.nextRadio(1)}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M19 5v14M5 5l11 7-11 7z"/></svg></button></div>
          <label className="dw-radio-volume"><span>Volume</span><input aria-label="Volume da rádio" type="range" min={0} max={1} step={.01} value={state.volume} onChange={e => volume(+e.target.value)} /><output>{Math.round(state.volume * 100)}%</output></label>
          <p role={state.error ? 'alert' : undefined} className={state.error ? 'dw-notice' : 'dw-help'}>{state.error || (original ? 'O tema acompanha o menu, a luta e a vitória.' : 'A playlist continua durante a partida. Ao terminar, o próximo rap começa.')}</p>
        </section>
        <section className="dw-radio-playlist" aria-label="Estações"><div className="dw-radio-list-heading"><h2>Sua playlist</h2><span>{RADIO_TRACKS.length} faixas</span></div>
          {RADIO_TRACKS.map((track, index) => <button key={track.id} data-radio-station={track.id} aria-pressed={track.id === current.id} className="dw-radio-track" onClick={() => audio.selectRadio(track.id)}><span className="dw-track-number">{String(index + 1).padStart(2, '0')}</span><span><strong>{track.title}</strong><small>{track.artist}{index === 0 ? ' · Dinâmica' : ''}</small></span><span className="dw-track-status">{track.id === current.id ? state.playing ? 'No ar' : 'Pronta' : 'Tocar'}</span></button>)}
        </section>
      </div>
      <footer className="dw-radio-footer">A música continua ao fechar a rádio.</footer>
    </div>
  </div>, document.body);
}
