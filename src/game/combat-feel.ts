import { keyLabel } from './input';
import type { Bindings } from './input';
import type { Fighter } from './engine';

/** Advisory cues never consume inputs or change a combat state. */
export function combatHint(f: Fighter, bindings: Bindings, touch: boolean): string {
  const names:Record<string,string>={p:'SOCO',k:'CHUTE',block:'DEFESA',down:'AGACHAR',headbutt:'CABEÇADA'};
  const key=(a:keyof Bindings)=>touch?names[a]||a:keyLabel(bindings[a][0]);
  if(f.state==='hit'||f.state==='launched')return `Segure ${key('block')} para defender assim que recuperar o controle.`;
  if(f.guard)return `${key('down')} + ${key('block')}: defesa baixa. Agarrões vencem uma defesa previsível.`;
  if(f.move&&f.contact==='block')return 'Bloqueado! Espere a recuperação antes de atacar de novo.';
  if(f.contact==='whiff')return 'Errou: a recuperação deixa uma abertura para o adversário.';
  if(f.crouch)return `${key('k')}: rasteira baixa. ${key('down')} + ${key('block')}: defender rasteiras.`;
  return `${key('p')} → ${key('k')}: combo básico. ${key('block')}: defesa. ${key('headbutt')}: cabeçada de perto.`;
}
