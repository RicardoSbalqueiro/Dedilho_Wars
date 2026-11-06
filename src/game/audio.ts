// Música original sintetizada + rádio com os raps locais enviados pelo usuário.
import { RADIO_TRACKS, isRadioStation } from './radio';
import type { RadioSnapshot, RadioStation } from './radio';
import type { CharId, Move } from './data';

type MusicMode = 'menu' | 'fight' | 'victory' | null;
const RADIO_STORE = 'dedilho-wars-radio-v1';

export interface AudioSettings {
  music: number;
  sfx: number;
  voice: boolean;
}

type Wave = OscillatorType;

class AudioEngine {
  ctx: AudioContext | null = null;
  master!: GainNode;
  sfxGain!: GainNode;
  musicGain!: GainNode;
  settings: AudioSettings = { music: 0.5, sfx: 0.8, voice: true };
  private noiseBuf: AudioBuffer | null = null;
  private timer: number | null = null;
  private step = 0;
  private arenaTheme='dojo';
  setArena(id:string){this.arenaTheme=['bolivia'].includes(id)?'andes':['letsgay','termodinamica'].includes(id)?'beach':['casabranca','ngb'].includes(id)?'cosmic':id==='zoologico'?'jungle':['dojo','liberdade'].includes(id)?'dojo':'urban';}
  private nextTime = 0;
  private mode: MusicMode = null;
  private requestedMode: MusicMode = null;
  private radioElement: HTMLAudioElement | null = null;
  private radioListeners = new Set<() => void>();
  private radioPaused = false;
  private radioRequest = 0;
  private radioState: RadioSnapshot = {
    station: 'original', playing: false, loading: false, error: null,
    currentTime: 0, duration: 0, volume: this.settings.music,
  };

  constructor() {
    try {
      const saved = JSON.parse(localStorage.getItem(RADIO_STORE) || 'null');
      if (isRadioStation(saved?.station)) this.radioState = { ...this.radioState, station: saved.station };
      this.radioPaused = saved?.paused === true;
    } catch { /* configurações ausentes ou inválidas usam a rádio original */ }
  }

  getRadioSnapshot = () => this.radioState;
  subscribeRadio = (listener: () => void) => {
    this.radioListeners.add(listener);
    return () => { this.radioListeners.delete(listener); };
  };

  private publishRadio(update: Partial<RadioSnapshot> = {}) {
    this.radioState = { ...this.radioState, ...update, volume: this.settings.music };
    this.radioListeners.forEach((listener) => listener());
  }

  private saveRadio() {
    try { localStorage.setItem(RADIO_STORE, JSON.stringify({ station: this.radioState.station, paused: this.radioPaused })); }
    catch { /* tocar música continua funcionando sem armazenamento */ }
  }

  private ensureRadioElement() {
    if (this.radioElement) return this.radioElement;
    const element = new Audio();
    element.preload = 'metadata';
    element.volume = this.settings.music;
    element.addEventListener('timeupdate', () => this.publishRadio({ currentTime: element.currentTime }));
    element.addEventListener('loadedmetadata', () => this.publishRadio({ duration: Number.isFinite(element.duration) ? element.duration : 0 }));
    element.addEventListener('playing', () => this.publishRadio({ playing: true, loading: false, error: null }));
    element.addEventListener('pause', () => this.publishRadio({ playing: false }));
    element.addEventListener('waiting', () => {
      if (!this.radioPaused) this.publishRadio({ loading: true });
    });
    element.addEventListener('ended', () => {
      if (this.radioPaused || this.radioState.station === 'original') return;
      // A estação original é infinita; a sequência automática percorre os quatro raps.
      const i = RADIO_TRACKS.findIndex((track) => track.id === this.radioState.station);
      this.selectRadio(RADIO_TRACKS[i >= RADIO_TRACKS.length - 1 ? 1 : i + 1].id);
    });
    element.addEventListener('error', () => this.publishRadio({ playing: false, loading: false, error: 'Não foi possível carregar esta faixa. Tente tocar novamente ou escolha outra.' }));
    this.radioElement = element;
    return element;
  }

  private async playRadioElement() {
    const station = RADIO_TRACKS.find((track) => track.id === this.radioState.station)!;
    if (!station.url || this.radioPaused) return;
    const request = ++this.radioRequest;
    const element = this.ensureRadioElement();
    if (element.getAttribute('src') !== station.url) {
      element.src = station.url;
      this.publishRadio({ currentTime: 0, duration: 0 });
    }
    this.publishRadio({ loading: true, error: null });
    try {
      await element.play();
      if (request === this.radioRequest && !this.radioPaused) this.publishRadio({ playing: true, loading: false, error: null });
    } catch (error) {
      if (request !== this.radioRequest) return;
      if (error instanceof DOMException && error.name === 'AbortError') return;
      this.publishRadio({ playing: false, loading: false, error: 'Clique em Tocar para liberar o áudio no navegador.' });
    }
  }

  selectRadio(station: RadioStation) {
    if (!isRadioStation(station)) return;
    this.radioRequest++;
    this.radioElement?.pause();
    this.synthMusic(null);
    this.radioPaused = false;
    this.publishRadio({ station, playing: false, loading: false, error: null, currentTime: 0, duration: 0 });
    this.saveRadio();
    if (station === 'original') {
      this.init();
      this.synthMusic(this.requestedMode || 'menu');
    } else {
      // Selecting an entry is a user gesture; the MP3 can start without Web Audio.
      const element = this.ensureRadioElement();
      element.currentTime = 0;
      void this.playRadioElement();
    }
  }

  toggleRadio() {
    this.radioPaused = this.radioState.playing || this.radioState.loading;
    this.radioRequest++;
    this.saveRadio();
    if (this.radioPaused) {
      this.radioElement?.pause();
      this.synthMusic(null);
      this.publishRadio({ playing: false, loading: false });
    } else if (this.radioState.station === 'original') {
      this.init();
      this.synthMusic(this.requestedMode || 'menu');
    } else void this.playRadioElement();
  }

  nextRadio(direction: 1 | -1 = 1) {
    const i = RADIO_TRACKS.findIndex((track) => track.id === this.radioState.station);
    this.selectRadio(RADIO_TRACKS[(i + direction + RADIO_TRACKS.length) % RADIO_TRACKS.length].id);
  }

  seekRadio(time: number) {
    if (!this.radioElement || !Number.isFinite(time)) return;
    const duration = this.radioElement.duration;
    if (!Number.isFinite(duration) || duration <= 0) return;
    this.radioElement.currentTime = Math.min(duration, Math.max(0, time));
    this.publishRadio({ currentTime: this.radioElement.currentTime });
  }
  private fightBoost = 0;

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume().catch(() => {});
      return;
    }
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AC();
    } catch {
      return;
    }
    const c = this.ctx!;
    this.master = c.createGain();
    this.master.gain.value = 0.9;
    const comp = c.createDynamicsCompressor();
    this.master.connect(comp);
    comp.connect(c.destination);
    this.sfxGain = c.createGain();
    this.musicGain = c.createGain();
    this.sfxGain.connect(this.master);
    this.musicGain.connect(this.master);
    this.applySettings();
    const len = c.sampleRate * 1.5;
    this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    if (!this.radioPaused && this.radioState.station === 'original' && this.requestedMode) {
      this.synthMusic(this.requestedMode);
    }
  }

  setSettings(s: Partial<AudioSettings>) {
    Object.assign(this.settings, s);
    this.applySettings();
  }

  private applySettings() {
    if (this.radioElement) this.radioElement.volume = this.settings.music;
    if (this.ctx) {
      this.sfxGain.gain.value = this.settings.sfx;
      this.musicGain.gain.value = this.mode && this.radioState.station === 'original' && !this.radioPaused ? this.settings.music * 0.55 : 0;
    }
    this.publishRadio();
  }

  // ---------- primitivas ----------
  tone(freq: number, dur: number, type: Wave = 'sine', vol = 0.3, slideTo?: number, delay = 0, dest?: AudioNode) {
    const c = this.ctx;
    if (!c) return;
    const t = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(dest || this.sfxGain);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  noise(dur: number, vol = 0.3, freq = 1000, type: BiquadFilterType = 'lowpass', delay = 0, freqTo?: number, dest?: AudioNode) {
    const c = this.ctx;
    if (!c || !this.noiseBuf) return;
    const t = c.currentTime + delay;
    const s = c.createBufferSource();
    s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    if (freqTo) f.frequency.exponentialRampToValueAtTime(freqTo, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f);
    f.connect(g);
    g.connect(dest || this.sfxGain);
    s.start(t, Math.random());
    s.stop(t + dur + 0.05);
  }

  // ---------- efeitos ----------
  hit(power = 1) {
    const p=Math.max(.25,Math.min(3,power));
    // Light hits are short and crisp; heavy hits have a separate low body and tail.
    this.noise(.035+p*.027,.23+p*.09,3400-p*620,'bandpass');
    this.tone(210-p*35,.065+p*.036,'sine',.25+p*.1,52);
    if(p>=1.5){this.tone(68,.21,'sine',.3,33,.018);this.noise(.13,.12,680,'lowpass',.018,170);}
    else this.tone(1100,.025,'triangle',.045,440);
  }
  swing(ch:CharId,m:Move) {
    const p=Math.max(.4,Math.min(2.6,m.power));
    const kick=/^(k|cK|jK)/.test(m.id)||m.trail==='fa'||m.trail==='ba';
    this.noise(kick?.09:.05,.07+p*.025,kick?720:1200,'bandpass',0,kick?2400:3600);
    // Identifiable material accents. Nothing plays twice for a held input.
    if(m.kind==='special') {
      if(ch==='tubarao')this.noise(.16,.12,3200,'highpass',0,650);
      else if(ch==='santox')this.tone(180,.13,'triangle',.08,740);
      else if(ch==='jane')this.tone(m.id==='s1'?780:130,.11,'triangle',.07,m.id==='s1'?1300:70);
      else if(ch==='renngotti'||ch==='eneas')this.tone(125,.14,'sine',.1,65);
      else if(ch==='orango')this.noise(.11,.1,420,'lowpass');
      else this.tone(350,.08,'triangle',.04,800);
    }
  }
  block() {
    this.noise(0.05, 0.3, 3000, 'highpass');
    this.tone(320, 0.07, 'triangle', 0.3, 180);
  }
  perfectBlock(precision=false) {
    this.block();
    this.tone(precision?880:660,.12,'sine',.24,precision?1760:1320);
    this.tone(precision?1320:990,.18,'triangle',.12,precision?1980:1485);
  }
  whoosh(p = 1) {
    this.noise(0.12 + 0.06 * p, 0.12 + 0.05 * p, 500, 'bandpass', 0, 2600);
  }
  jump() {
    this.tone(260, 0.12, 'sine', 0.12, 520);
  }
  land() {
    this.noise(0.06, 0.15, 400, 'lowpass');
  }
  roar() {
    const c = this.ctx;
    if (!c) return;
    const t = c.currentTime;
    const o = c.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(95, t);
    o.frequency.linearRampToValueAtTime(140, t + 0.25);
    o.frequency.exponentialRampToValueAtTime(55, t + 1.0);
    const lfo = c.createOscillator();
    const lg = c.createGain();
    lfo.frequency.value = 28;
    lg.gain.value = 22;
    lfo.connect(lg);
    lg.connect(o.frequency);
    const f = c.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.setValueAtTime(500, t);
    f.frequency.linearRampToValueAtTime(900, t + 0.3);
    f.frequency.linearRampToValueAtTime(350, t + 1);
    f.Q.value = 1.4;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.7, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.05);
    o.connect(f);
    f.connect(g);
    g.connect(this.sfxGain);
    o.start(t);
    lfo.start(t);
    o.stop(t + 1.1);
    lfo.stop(t + 1.1);
    this.noise(1.0, 0.35, 700, 'bandpass', 0, 300);
  }
  purple() {
    [0, 1, 2, 3, 4].forEach((i) => this.tone(500 * Math.pow(1.26, i), 0.18, 'sine', 0.15, 700 * Math.pow(1.26, i), i * 0.04));
    this.tone(1400, 0.4, 'triangle', 0.08, 2400);
  }
  red() {
    this.tone(55, 0.6, 'sawtooth', 0.3, 160);
    this.noise(0.5, 0.25, 300, 'lowpass', 0, 1200);
  }
  boom(big = 1) {
    this.noise(0.9 * big, 0.7, 900, 'lowpass', 0, 60);
    this.tone(90, 0.8 * big, 'sine', 0.9, 25);
  }
  clash() {
    this.noise(0.25, 0.4, 5000, 'highpass');
    this.tone(880, 0.25, 'square', 0.15, 440);
    this.tone(1320, 0.25, 'sawtooth', 0.1, 600);
  }
  bite() {
    this.noise(0.05, 0.4, 1800, 'bandpass');
    this.tone(120, 0.1, 'square', 0.3, 60);
    this.noise(0.05, 0.4, 2200, 'bandpass', 0.08);
  }
  ko() {
    this.boom(1.4);
    this.tone(440, 0.8, 'sawtooth', 0.2, 80, 0.05);
    this.noise(1.0, 0.3, 4000, 'highpass', 0, 200);
  }
  select() {
    this.tone(660, 0.07, 'square', 0.12);
  }
  confirm() {
    this.tone(520, 0.08, 'square', 0.14);
    this.tone(780, 0.14, 'square', 0.14, undefined, 0.07);
  }
  bell() {
    this.tone(880, 1.2, 'sine', 0.2);
    this.tone(1320, 1.0, 'sine', 0.1);
  }
  gong() {
    this.tone(110, 1.6, 'sine', 0.5, 90);
    this.tone(220, 1.2, 'triangle', 0.2);
    this.noise(1.2, 0.2, 800, 'bandpass', 0, 200);
  }
  say(text: string, pitch = 1, rate = 1) {
    if (!this.settings.voice) return;
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'pt-BR';
      u.pitch = pitch;
      u.rate = rate;
      u.volume = Math.min(1, this.settings.sfx);
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    } catch {
      /* sem voz */
    }
  }

  // ---------- música ----------
  setIntensity(v: number) {
    this.fightBoost = v;
  }

  music(kind: MusicMode) {
    this.requestedMode = kind;
    if (this.radioState.station !== 'original') {
      this.synthMusic(null);
      if (!this.radioPaused && !this.radioState.playing && !this.radioState.loading && kind) void this.playRadioElement();
      return;
    }
    this.synthMusic(this.radioPaused ? null : kind);
  }

  private synthMusic(kind: MusicMode) {
    if (kind === this.mode && this.timer !== null) return;
    this.mode = kind;
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.musicGain) this.musicGain.gain.value = kind ? this.settings.music * 0.55 : 0;
    if (!kind || !this.ctx) {
      if (this.radioState.station === 'original') this.publishRadio({ playing: false, loading: false });
      return;
    }
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.1;
    this.timer = window.setInterval(() => this.schedule(), 30);
    if (this.radioState.station === 'original') this.publishRadio({ playing: true, loading: false, error: null });
  }

  stopMusic() {
    this.requestedMode = null;
    this.synthMusic(null);
    // A estação escolhida pelo jogador continua entre partidas e menus.
  }

  private schedule() {
    const c = this.ctx;
    if (!c || !this.mode) return;
    const tempo = this.mode === 'fight' ? ({andes:144,beach:134,cosmic:150,jungle:166,urban:158,dojo:158}[this.arenaTheme]||158) : this.mode === 'menu' ? 96 : 120;
    const stepDur = 60 / tempo / 4;
    while (this.nextTime < c.currentTime + 0.15) {
      this.playStep(this.step, this.nextTime - c.currentTime, stepDur);
      this.step++;
      this.nextTime += stepDur;
    }
  }

  private n(root: number, semis: number) {
    return root * Math.pow(2, semis / 12);
  }

  private playStep(s: number, delay: number, sd: number) {
    const theme=this.mode==='fight'?this.arenaTheme:'dojo';
    const D = theme==='andes'?174.61:theme==='beach'?164.81:theme==='cosmic'?130.81:146.83;
    const scale = theme==='andes'||theme==='beach'?[0,2,4,7,9]:theme==='cosmic'?[0,2,4,6,8]:theme==='jungle'||theme==='urban'?[0,3,5,7,10]:[0, 1, 5, 7, 8]; // escala "In" japonesa
    const deg = (i: number) => scale[((i % 5) + 5) % 5] + 12 * Math.floor(i / 5);
    const m = this.musicGain;
    const st = s % 16;
    const bar = Math.floor(s / 16) % 4;
    if (this.mode === 'fight') {
      const kick = [1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 1, 0, 1, 0];
      const snare = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1];
      if (kick[st]) this.tone(150, 0.16, 'sine', 0.9, 38, delay, m);
      if (snare[st]) this.noise(0.12, 0.45, 1800, 'bandpass', delay, undefined, m);
      if(theme==='jungle'&&st%4===1)this.tone(90,.08,'sine',.25,45,delay,m);
      if(theme==='beach'&&st%4===2)this.noise(.055,.13,4500,'bandpass',delay,undefined,m);
      if (st % 2 === 0) this.noise(0.03, 0.12, 8000, 'highpass', delay, undefined, m);
      if (st === 0 && bar % 2 === 0) this.tone(110, 0.6, 'sine', 0.7, 55, delay, m);
      const bassPat = [0, -1, 0, 0, -1, 0, 1, -1, 0, -1, 0, 0, 3, -1, 2, 1];
      const bp = bassPat[st];
      if (bp >= 0) {
        const off = bar === 3 ? 2 : bar === 2 ? 1 : 0;
        this.tone(this.n(D / 2, deg(bp + off)), sd * 1.6, 'sawtooth', 0.22, undefined, delay, m);
      }
      const lead = [
        [7, -1, -1, 6, -1, 5, -1, 3, 4, -1, 3, -1, 2, -1, -1, -1],
        [7, -1, 8, -1, 7, 6, -1, 5, 6, -1, -1, 3, 4, 2, -1, -1],
        [5, -1, 5, 6, -1, 7, -1, 8, 9, -1, 8, -1, 7, -1, 6, -1],
        [8, -1, 7, -1, 6, -1, 5, 3, 4, -1, 2, 3, 4, -1, -1, -1],
      ][bar];
      const ln = lead[st];
      if (ln >= 0) {
        const f = this.n(D * 2, deg(ln));
        this.tone(f, sd * 3.2, 'triangle', 0.2 + this.fightBoost * 0.05, undefined, delay, m);
        this.tone(f * 2, sd * 1.2, 'sine', 0.06, undefined, delay, m);
      }
      if (this.fightBoost > 0.5 && st % 4 === 2) this.tone(this.n(D * 4, deg(bar + st / 2)), sd, 'square', 0.04, undefined, delay, m);
    } else if (this.mode === 'menu') {
      if (st % 8 === 0) this.tone(70, 0.4, 'sine', 0.5, 40, delay, m);
      if (st % 4 === 2) this.noise(0.04, 0.1, 6000, 'highpass', delay, undefined, m);
      const mel = [7, -1, -1, -1, 5, -1, 3, -1, 4, -1, -1, -1, 2, -1, -1, -1];
      const drone = [0, -1, -1, -1, -1, -1, -1, -1, 3, -1, -1, -1, -1, -1, -1, -1];
      if (drone[st] >= 0) this.tone(this.n(D / 2, deg(drone[st])), sd * 8, 'sawtooth', 0.12, undefined, delay, m);
      if (mel[st] >= 0 && bar !== 3) this.tone(this.n(D * 2, deg(mel[st])), sd * 5, 'triangle', 0.2, undefined, delay, m);
    } else if (this.mode === 'victory') {
      const mel = [0, 2, 4, 7, 9, 7, 4, 2, 0, 2, 4, 7, 12, -1, -1, -1];
      if (mel[st] >= 0) this.tone(this.n(D * 2, mel[st]), sd * 2, 'square', 0.12, undefined, delay, m);
      if (st % 4 === 0) this.tone(130, 0.3, 'sine', 0.5, 50, delay, m);
    }
  }
}

export const audio = new AudioEngine();
