import { touchInput } from './touch';
export type Action = 'left' | 'right' | 'up' | 'down' | 'p' | 'k' | 'block' | 's1' | 's2' | 's3' | 'super' | 'grab';

export const ACTIONS: Action[] = ['left', 'right', 'up', 'down', 'p', 'k', 'block', 's1', 's2', 's3', 'super', 'grab'];
// Includes the press frame: ages 0 through 8 remain executable.
export const INPUT_BUFFER_FRAMES = 9;
export const DASH_TAP_FRAMES = 14;

export const ACTION_LABELS: Record<Action, string> = {
  left: 'Esquerda',
  right: 'Direita',
  up: 'Pular',
  down: 'Agachar',
  p: 'Soco',
  k: 'Chute',
  block: 'Defesa',
  s1: 'Especial 1',
  s2: 'Especial 2',
  s3: 'Especial 3',
  super: 'Super Especial',
  grab: 'Agarrão',
};

export type Bindings = Record<Action, [string, string]>;

export const DEFAULT_BINDINGS: [Bindings, Bindings] = [
  {
    left: ['KeyA', ''],
    right: ['KeyD', ''],
    up: ['KeyW', ''],
    down: ['KeyS', ''],
    p: ['KeyJ', ''],
    k: ['KeyK', ''],
    block: ['KeyL', ''],
    s1: ['KeyU', ''],
    s2: ['KeyI', ''],
    s3: ['KeyO', ''],
    super: ['KeyH', ''],
    grab: ['KeyG', ''],
  },
  {
    left: ['ArrowLeft', ''],
    right: ['ArrowRight', ''],
    up: ['ArrowUp', ''],
    down: ['ArrowDown', ''],
    p: ['Numpad1', 'Comma'],
    k: ['Numpad2', 'Period'],
    block: ['Numpad3', 'Slash'],
    s1: ['Numpad4', 'Semicolon'],
    s2: ['Numpad5', 'Quote'],
    s3: ['Numpad6', 'Enter'],
    super: ['Numpad0', 'ShiftRight'],
    grab: ['Numpad7', 'KeyB'],
  },
];

const STORE = 'dedilho-wars-bindings-v1';

export function loadBindings(): [Bindings, Bindings] {
  try {
    const raw = localStorage.getItem(STORE);
    if (raw) {
      const parsed = JSON.parse(raw);
      const out = JSON.parse(JSON.stringify(DEFAULT_BINDINGS)) as [Bindings, Bindings];
      for (let i = 0; i < 2; i++) for (const a of ACTIONS) if (parsed?.[i]?.[a]) out[i][a] = parsed[i][a];
      for(let i=0;i<2;i++)if(!parsed?.[i]?.grab){
        const used=new Set(ACTIONS.filter(a=>a!=='grab').flatMap(a=>out[i][a]));
        const options=i===0?['KeyG','KeyF','KeyV','KeyQ']:['Numpad7','KeyB','Numpad8','KeyN'];
        out[i].grab=[options.find(c=>!used.has(c))||'',''];
      }
      return out;
    }
  } catch {
    /* ignore */
  }
  return JSON.parse(JSON.stringify(DEFAULT_BINDINGS));
}

export function saveBindings(b: [Bindings, Bindings]) {
  try {
    localStorage.setItem(STORE, JSON.stringify(b));
  } catch {
    /* ignore */
  }
}

export function keyLabel(code: string): string {
  if (!code) return '—';
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) return 'NUM ' + code.slice(6).replace('Add', '+').replace('Subtract', '-').replace('Multiply', '*').replace('Decimal', '.').replace('Enter', '⏎');
  const map: Record<string, string> = {
    ArrowLeft: '←',
    ArrowRight: '→',
    ArrowUp: '↑',
    ArrowDown: '↓',
    Comma: ',',
    Period: '.',
    Slash: '/',
    Semicolon: ';',
    Quote: "'",
    Enter: 'ENTER',
    ShiftRight: 'SHIFT D.',
    ShiftLeft: 'SHIFT E.',
    Space: 'ESPAÇO',
    BracketLeft: '[',
    BracketRight: ']',
    Backslash: '\\',
    ControlRight: 'CTRL D.',
    ControlLeft: 'CTRL E.',
    Minus: '-',
    Equal: '=',
  };
  return map[code] || code;
}

/** Estado de teclado global (suporta várias teclas simultâneas). */
export class Keyboard {
  down = new Set<string>();
  pressed = new Set<string>();
  listeners: ((code: string, e: KeyboardEvent) => void)[] = [];
  private kd = (e: KeyboardEvent) => {
    if (!e.repeat && !this.down.has(e.code)) this.pressed.add(e.code);
    this.down.add(e.code);
    this.listeners.forEach((l) => l(e.code, e));
  };
  private ku = (e: KeyboardEvent) => {
    this.down.delete(e.code);
  };
  private blur = () => { this.down.clear(); this.pressed.clear(); };
  consumePressed() { const out = new Set(this.pressed); this.pressed.clear(); return out; }
  attach() {
    window.addEventListener('keydown', this.kd);
    window.addEventListener('keyup', this.ku);
    window.addEventListener('blur', this.blur);
  }
  detach() {
    window.removeEventListener('keydown', this.kd);
    window.removeEventListener('keyup', this.ku);
    window.removeEventListener('blur', this.blur);
    this.down.clear();
    this.pressed.clear();
  }
}

export const keyboard = new Keyboard();

/** Estado de controle de um lutador (humano ou IA). */
export class Pad {
  held = {} as Record<Action, boolean>;
  pressedAt = {} as Record<Action, number>;
  prevAt = {} as Record<Action, number>;
  edgeAt = {} as Record<Action, number>;
  constructor() {
    this.reset();
  }
  reset() {
    for (const a of ACTIONS) {
      this.held[a] = false;
      this.pressedAt[a] = -999;
      this.prevAt[a] = -999;
      this.edgeAt[a] = -999;
    }
  }
  set(a: Action, down: boolean, tick: number) {
    if (down && !this.held[a]) {
      this.tap(a,tick);
    }
    this.held[a] = down;
  }
  pollKeys(b: Bindings, tick: number, touch = false, presses: ReadonlySet<string> = keyboard.consumePressed()) {
    for (const a of ACTIONS) {
      const [c1, c2] = b[a];
      this.set(a, (!!c1 && keyboard.down.has(c1)) || (!!c2 && keyboard.down.has(c2)) || (touch && touchInput.held.has(a)), tick);
      if ((presses.has(c1) || presses.has(c2)) && this.pressedAt[a] !== tick) this.tap(a,tick);
    }
    if (touch) for (const a of touchInput.consume()) if (this.pressedAt[a] !== tick) this.tap(a,tick);
  }
  buffered(a: Action, tick: number, win = INPUT_BUFFER_FRAMES) {
    const age=tick-this.pressedAt[a];
    return age>=0 && age<win;
  }
  doubleTapped(a:Action,tick:number) {
    const gap=this.edgeAt[a]-this.prevAt[a];
    return this.buffered(a,tick) && this.prevAt[a]>=0 && gap>0 && gap<=DASH_TAP_FRAMES;
  }
  consumeDash(a:Action) {
    this.consume(a);this.edgeAt[a]=this.prevAt[a]=-999;
  }
  freezeBuffers(tick:number) {
    for(const a of ACTIONS) {
      if(this.pressedAt[a]<tick && tick-this.pressedAt[a]<=INPUT_BUFFER_FRAMES)this.pressedAt[a]++;
    }
  }
  consume(a: Action) {
    this.pressedAt[a] = -999;
  }
  tap(a: Action, tick: number) {
    this.prevAt[a] = this.edgeAt[a];
    this.edgeAt[a] = tick;
    this.pressedAt[a] = tick;
  }
}
