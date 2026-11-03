// Motor de áudio 100% sintetizado (Web Audio API) — sem arquivos externos.

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
  private nextTime = 0;
  private mode: 'menu' | 'fight' | 'victory' | null = null;
  private fightBoost = 0;

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
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
    if (this.mode) {
      const m = this.mode;
      this.mode = null;
      this.music(m);
    }
  }

  setSettings(s: Partial<AudioSettings>) {
    Object.assign(this.settings, s);
    this.applySettings();
  }

  private applySettings() {
    if (!this.ctx) return;
    this.sfxGain.gain.value = this.settings.sfx;
    this.musicGain.gain.value = this.settings.music * 0.55;
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
    this.noise(0.07 + 0.05 * power, 0.4 + 0.2 * power, 2500 - power * 700, 'lowpass');
    this.tone(180 - power * 30, 0.12 + 0.05 * power, 'sine', 0.5 + 0.2 * power, 45);
    if (power >= 1.5) this.tone(70, 0.35, 'sine', 0.6, 30);
  }
  block() {
    this.noise(0.05, 0.3, 3000, 'highpass');
    this.tone(320, 0.07, 'triangle', 0.3, 180);
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

  music(kind: 'menu' | 'fight' | 'victory' | null) {
    if (kind === this.mode && this.timer !== null) return;
    this.mode = kind;
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (!kind || !this.ctx) return;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.1;
    this.timer = window.setInterval(() => this.schedule(), 30);
  }

  stopMusic() {
    this.music(null);
  }

  private schedule() {
    const c = this.ctx;
    if (!c || !this.mode) return;
    const tempo = this.mode === 'fight' ? 158 : this.mode === 'menu' ? 96 : 120;
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
    const D = 146.83;
    const scale = [0, 1, 5, 7, 8]; // escala "In" japonesa
    const deg = (i: number) => scale[((i % 5) + 5) % 5] + 12 * Math.floor(i / 5);
    const m = this.musicGain;
    const st = s % 16;
    const bar = Math.floor(s / 16) % 4;
    if (this.mode === 'fight') {
      const kick = [1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 1, 0, 1, 0];
      const snare = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1];
      if (kick[st]) this.tone(150, 0.16, 'sine', 0.9, 38, delay, m);
      if (snare[st]) this.noise(0.12, 0.45, 1800, 'bandpass', delay, undefined, m);
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
