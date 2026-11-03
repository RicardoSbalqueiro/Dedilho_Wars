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

  return (
    <div ref={panelRef} data-radio-panel role="dialog" aria-modal="true" aria-labelledby="radio-heading"
      className="absolute inset-0 z-50 text-white"
      style={{ background: 'radial-gradient(ellipse at 80% 30%,#381459 0%,#100a20 50%,#07060e 100%)' }}>
      <div className="absolute left-6 right-6 top-5 flex justify-between items-center border-b border-white/15 pb-3">
        <div><div className="text-[9px] tracking-[.35em] text-purple-300">DEDILHO WARS · ESTAÇÃO DE RÁDIO</div><h1 id="radio-heading" className="title-main text-[34px] mt-1">DW RADIO <span className="text-purple-400">/</span> ULISSES</h1></div>
        <button ref={closeRef} type="button" onClick={onBack} className="border border-white/40 bg-white/10 px-4 py-2 text-[12px] hover:bg-white/20 focus:outline-2 focus:outline-purple-300">VOLTAR <span className="text-white/50 ml-2">ESC</span></button>
      </div>

      <div className="absolute left-6 top-[112px] bottom-[44px] w-[445px]">
        <div className="flex justify-between text-[9px] tracking-[.2em] text-white/50 mb-3"><span>ESCOLHA SUA ESTAÇÃO</span><span>05 FAIXAS</span></div>
        <div className="flex flex-col gap-[7px]">
          {RADIO_TRACKS.map((track, index) => {
            const selected = track.id === current.id;
            return <button type="button" key={track.id} data-radio-station={track.id} aria-pressed={selected}
              onClick={() => audio.selectRadio(track.id)}
              className="flex items-center gap-3 text-left border px-3 py-3 transition-colors hover:bg-purple-400/20 focus:outline-2 focus:outline-purple-300"
              style={{ minHeight: 63, borderColor: selected ? '#c084fc' : '#ffffff22', background: selected ? 'linear-gradient(90deg,#7e22ce77,#7e22ce11)' : '#ffffff04', boxShadow: selected ? 'inset 3px 0 #d8b4fe' : undefined }}>
              <span className="text-[13px] text-purple-300 w-6 shrink-0">{String(index + 1).padStart(2, '0')}</span>
              <span className="flex-1"><span className="block title-main text-[13px] leading-[17px]">{track.title}</span><span className="block text-[9px] text-white/45 mt-[2px]">{track.artist}{index === 0 ? ' · DINÂMICA' : ' · RAP'}</span></span>
              <span className="text-[8px] tracking-wider text-purple-200 w-12 text-right">{selected ? state.playing ? 'NO AR' : 'PRONTA' : 'TOCAR'}</span>
            </button>;
          })}
        </div>
      </div>

      <div className="absolute right-6 top-[112px] w-[410px] bottom-[44px] border border-purple-300/25 bg-black/25 px-5 py-4 flex flex-col">
        <div className="flex items-center justify-between text-[9px] tracking-[.2em] text-white/40"><span>AGORA NA RÁDIO</span><span className="text-purple-300">● {state.playing ? 'NO AR' : state.loading ? 'CARREGANDO' : 'PAUSADA'}</span></div>
        <div className="flex-1 flex items-center justify-center gap-[7px] py-2" aria-hidden="true">
          {Array.from({ length: 21 }, (_, i) => <span key={i} style={{ width: 8, height: 14 + ((i * 17 + 13) % 57), background: `linear-gradient(0deg,#7e22ce,${original ? '#d8b4fe' : '#f0abfc'})`, opacity: state.playing ? 0.9 : 0.22, transform: state.playing ? `scaleY(${0.55 + Math.sin(state.currentTime * 4 + i) * 0.35})` : 'scaleY(.4)', transition: 'transform .3s ease,opacity .3s ease' }} />)}
        </div>
        <div className="min-h-[65px]"><h2 className="title-main text-[20px] leading-6 text-purple-100">{current.title}</h2><p className="text-[11px] text-white/50 mt-1">{current.artist}{original ? ' · Tema automático do jogo' : ' · Raps do Ulisses'}</p></div>
        <div className="mt-2">
          <input aria-label="Posição da música" type="range" min={0} max={state.duration || 1} step={1} value={Math.min(state.currentTime, state.duration || 1)} disabled={original || state.duration <= 0} onChange={(e) => audio.seekRadio(+e.target.value)} className="w-full h-3 accent-purple-400 disabled:opacity-25" />
          <div className="flex justify-between text-[9px] text-white/40 mt-1"><span>{original ? 'TRILHA ORIGINAL' : radioTime(state.currentTime)}</span><span>{original ? '∞' : state.duration ? radioTime(state.duration) : '—:—'}</span></div>
        </div>
        <div className="flex justify-center items-center gap-3 mt-3">
          <button type="button" aria-label="Faixa anterior" onClick={() => audio.nextRadio(-1)} className="border border-white/25 bg-white/5 px-4 py-2 text-[12px] hover:bg-purple-500/30">◀◀</button>
          <button type="button" aria-label={state.playing ? 'Pausar rádio' : 'Tocar rádio'} onClick={() => audio.toggleRadio()} className="title-main border border-purple-200 bg-purple-600 px-6 py-2 min-w-[132px] text-[15px] hover:bg-purple-500">{state.playing ? 'PAUSAR' : state.loading ? 'PAUSAR' : 'TOCAR'}</button>
          <button type="button" aria-label="Próxima faixa" onClick={() => audio.nextRadio(1)} className="border border-white/25 bg-white/5 px-4 py-2 text-[12px] hover:bg-purple-500/30">▶▶</button>
        </div>
        <div className="mt-3 flex gap-3 items-center"><label htmlFor="radio-volume" className="text-[9px] text-white/50 tracking-widest">VOLUME</label><input id="radio-volume" type="range" min={0} max={1} step={0.01} value={state.volume} onChange={(e) => volume(+e.target.value)} className="flex-1 h-3 accent-purple-400" /><span className="text-[10px] text-white/60 w-8 text-right">{Math.round(state.volume * 100)}%</span></div>
        <p role={state.error ? 'alert' : undefined} className={`text-[9px] leading-3 mt-3 min-h-6 ${state.error ? 'text-amber-200' : 'text-white/40'}`}>{state.error || (original ? 'O tema acompanha o menu, a luta e a vitória.' : 'Os raps continuam durante a partida. Ao terminar, o próximo rap começa.')}</p>
      </div>
      <div className="absolute left-6 right-6 bottom-3 text-[9px] text-white/35 tracking-wider">TRILHA ORIGINAL + RAPS DO ULISSES · A MÚSICA CONTINUA AO FECHAR A RÁDIO · TAB NAVEGAR · ESC VOLTAR</div>
    </div>
  );
}
