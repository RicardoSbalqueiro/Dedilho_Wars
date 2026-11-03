/** A trilha original é sintetizada; os raps enviados fazem parte do próprio jogo. */
export const RADIO_TRACKS = [
  { id: 'original', title: 'Trilha original do Dedilho Wars', artist: 'Dedilho Wars', detail: 'Música dinâmica de menu, combate e vitória.', url: null },
  { id: 'caetano', title: 'Rap do Caetano Neandertal', artist: 'Orangotango Esfolador Rapper', detail: 'Orangotango Esfolador Rapper · Caetano', url: new URL('../assets/radio/caetano.mp3', import.meta.url).href },
  { id: 'sofa', title: 'Rap do Sofá do Renngotti', artist: 'Orangotango Esfolador Rapper', detail: 'Orangotango Esfolador Rapper · Renngotti', url: new URL('../assets/radio/sofa.mp3', import.meta.url).href },
  { id: 'tubarao', title: 'Rap do Tubarão amante do Pablão', artist: 'Orangotango Esfolador Rapper', detail: 'Orangotango Esfolador Rapper · Tubarão', url: new URL('../assets/radio/tubarao.mp3', import.meta.url).href },
  { id: 'orango', title: 'Rap do Amante Oragutango', artist: 'Orangotango Esfolador Rapper', detail: 'Orangotango Esfolador Rapper · Orangotango', url: new URL('../assets/radio/orango.mp3', import.meta.url).href },
  { id: 'gaystavao', title: 'Diário de um Viadão (Gaystavão)', artist: 'Orangotango Esfolador Rapper', detail: 'Diário de um Viadão (Gaystavão)', url: new URL('../assets/radio/gaystavao.mp3', import.meta.url).href },
  { id: 'lets-gay', title: "Sequência Let’s Gay 1", artist: 'Dornelles', detail: 'Sequência Let’s Gay 1', url: new URL('../assets/radio/lets-gay.mp3', import.meta.url).href },
  { id: 'renngotti', title: 'Rap do Renngotti Cria de Exu Traficante de Anões Cubanos', artist: 'Orangotango Esfolador Rapper', detail: 'Renngotti', url: new URL('../assets/radio/renngotti.mp3', import.meta.url).href },
] as const;

export type RadioStation = (typeof RADIO_TRACKS)[number]['id'];
export interface RadioSnapshot {
  station: RadioStation;
  playing: boolean;
  loading: boolean;
  error: string | null;
  currentTime: number;
  duration: number;
  volume: number;
}
export function isRadioStation(id: unknown): id is RadioStation {
  return RADIO_TRACKS.some((track) => track.id === id);
}
export const radioTime = (seconds: number) => {
  const t = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
};
