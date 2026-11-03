export type Action = 'left' | 'right' | 'up' | 'down' | 'p' | 'k' | 'block' | 's1' | 's2' | 's3' | 'super';

export const ACTIONS: Action[] = ['left', 'right', 'up', 'down', 'p', 'k', 'block', 's1', 's2', 's3', 'super'];

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
  listeners: ((code: string, e: KeyboardEvent) => void)[] = [];
  private kd = (e: KeyboardEvent) => {
    this.down.add(e.code);
    this.listeners.forEach((l) => l(e.code, e));
  };
  private ku = (e: KeyboardEvent) => {
    this.down.delete(e.code);
  };
  private blur = () => this.down.clear();
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
  }
}

export const keyboard = new Keyboard();

/** Estado de controle de um lutador (humano ou IA). */
export class Pad {
  held = {} as Record<Action, boolean>;
  pressedAt = {} as Record<Action, number>;
  prevAt = {} as Record<Action, number>;
  constructor() {
    this.reset();
  }
  reset() {
    for (const a of ACTIONS) {
      this.held[a] = false;
      this.pressedAt[a] = -999;
      this.prevAt[a] = -999;
    }
  }
  set(a: Action, down: boolean, tick: number) {
    if (down && !this.held[a]) {
      this.prevAt[a] = this.pressedAt[a];
      this.pressedAt[a] = tick;
    }
    this.held[a] = down;
  }
  pollKeys(b: Bindings, tick: number) {
    for (const a of ACTIONS) {
      const [c1, c2] = b[a];
      this.set(a, (!!c1 && keyboard.down.has(c1)) || (!!c2 && keyboard.down.has(c2)), tick);
    }
  }
  buffered(a: Action, tick: number, win = 6) {
    return tick - this.pressedAt[a] <= win;
  }
  consume(a: Action) {
    this.pressedAt[a] = -999;
  }
  tap(a: Action, tick: number) {
    this.prevAt[a] = this.pressedAt[a];
    this.pressedAt[a] = tick;
  }
}
