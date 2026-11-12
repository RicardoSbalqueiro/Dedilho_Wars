import { useEffect, useRef, useState } from 'react';
import { api, errorText, ApiError } from '../online/api';
import type { User, Room } from '../online/api';
import { ONLINE_PROTOCOL } from '../game/net-state';
import { CHARS, CHAR_CATEGORIES } from '../game/data';
import type { CharCategory } from '../game/data';
import { STAGES, STAGE_IDS } from '../game/stage';
import { Frame, FighterPortrait, StagePreview } from './common';
import { MenuPage, MenuHeader, MenuFooter } from './MenuLayout';
import { audio } from '../game/audio';
import { OnlineGame } from './OnlineGame';

const inputClass = 'dw-input';
export function Online({onBack}:{onBack:()=>void}) {
 const [user,setUser]=useState<User|null>(null),[loading,setLoading]=useState(true),[register,setRegister]=useState(false);
 const [username,setUsername]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState('');
 const [error,setError]=useState(''),[busy,setBusy]=useState(false),[room,setRoom]=useState<Room|null>(null),[code,setCode]=useState('');
 const [match,setMatch]=useState<Room|null>(null),[category,setCategory]=useState<CharCategory>('Streamers'),[copied,setCopied]=useState(false);
 const [pollError,setPollError]=useState('');
 const active=useRef(true);useEffect(()=>{active.current=true;return()=>{active.current=false}},[]);
 const seenEpoch=useRef('');
 useEffect(()=>{audio.music(match?'fight':'menu')},[match]);
 useEffect(()=>{
  const ctrl=new AbortController();api<{user:User|null;protocol:string}>('/session',undefined,ctrl.signal).then(r=>{if(r.protocol!==ONLINE_PROTOCOL)throw new Error('Versão incompatível');setUser(r.user)}).catch(e=>{if(e.name!=='AbortError')setError(errorText(e))}).finally(()=>{if(!ctrl.signal.aborted)setLoading(false)});return()=>ctrl.abort();
 },[]);
 useEffect(()=>{
  if(!room)return;let stop=false,timer=0;const ctrl=new AbortController();
  const poll=async()=>{
   try{const r=await api<{room:Room}>('/rooms/'+room.code,undefined,ctrl.signal);if(stop)return;
    if(r.room.protocol!==ONLINE_PROTOCOL){setPollError('O jogo foi atualizado. Recarregue a página.');return}
    setRoom(r.room);setPollError('');
    if(r.room.status==='playing'&&r.room.epoch!==seenEpoch.current){seenEpoch.current=r.room.epoch;setMatch(r.room)}
   }catch(e){if(stop)return;if(e instanceof ApiError&&(e.status===404||e.status===403)){setRoom(null);setMatch(null);setError(e.message)}else setPollError('Reconectando à sala…')}
   if(!stop)timer=window.setTimeout(poll,1400);
  };poll();return()=>{stop=true;ctrl.abort();clearTimeout(timer)};
 },[room?.code]);
 async function run(task:()=>Promise<void>) {if(busy)return;setBusy(true);setError('');try{await task()}catch(e){setError(errorText(e))}finally{if(active.current)setBusy(false)}}
 const leave=()=>run(async()=>{if(room)await api('/rooms/'+room.code+'/leave',{});setMatch(null);setRoom(null);seenEpoch.current=''});
 const create=()=>run(async()=>{const r=await api<{room:Room}>('/rooms',{});setRoom(r.room)});
 const join=()=>run(async()=>{if(!/^[A-Z2-9]{8}$/.test(code))throw new ApiError(400,'Digite o código de 8 caracteres da sala.');const r=await api<{room:Room}>('/rooms/'+code+'/join',{});setRoom(r.room)});
 const configure=(data:unknown)=>run(async()=>{const r=await api<{room:Room}>('/rooms/'+room!.code+'/configure',data);setRoom(r.room)});
 if(match&&user){const fight=<OnlineGame room={match} user={user} onLobby={()=>setMatch(null)} onLeave={leave}/>;return <Frame game>{fight}</Frame>;}
 const host=room?.host.id===user?.id,me=host?room?.host:room?.guest,opponent=host?room?.guest:room?.host;
 return <MenuPage className="dw-online" label="Dedilho Online">
  <MenuHeader title="Dedilho Online" description="Crie sua sala, convide um amigo e entre na arena." onBack={room ? leave : onBack} actions={user && <div className="dw-online-account"><strong>{user.username}</strong>{!room && <button className="dw-button" disabled={busy} onClick={() => run(async () => { await api('/auth/logout', {}); setUser(null); setPassword(''); })}>Sair da conta</button>}</div>} />
  {pollError && <p className="dw-notice" role="status">{pollError}</p>}
  {error && <p role="alert" className="dw-online-error">{error}{location.protocol === 'file:' && <a href="https://dedilho-wars-luta.pithyblimp1.chatgpt.site"> Abrir site</a>}</p>}
  {loading ? <div className="dw-empty" role="status">Conectando ao serviço online…</div> : !user ? <section className="dw-online-auth">
    <div className="dw-online-intro"><p className="dw-eyebrow">UM NOVO RIVAL ESPERA POR VOCÊ</p><h2>{register ? 'Crie sua conta' : 'Entre na arena'}</h2><p>Desafie um amigo pelo código da sala. Escolha entre os {Object.keys(CHARS).length} lutadores e as {STAGE_IDS.length} arenas.</p><p>Use apenas seu nome de usuário e sua senha.</p></div>
    <form className="dw-card dw-auth-form" onSubmit={e => { e.preventDefault(); run(async () => { if (register && password !== confirm) throw new ApiError(400, 'As senhas precisam ser iguais.'); const r = await api<{ user: User; protocol: string }>('/auth/' + (register ? 'register' : 'login'), { username, password }); setUser(r.user); setPassword(''); setConfirm(''); }); }}>
      <h2>{register ? 'Registrar' : 'Acessar conta'}</h2>
      <label>Usuário<input className={inputClass} name="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="username" minLength={3} maxLength={24} pattern="[A-Za-z0-9_]+" required value={username} onChange={e => setUsername(e.target.value)} placeholder="Seu nome na arena"/><small>3 a 24 caracteres: letras, números e _</small></label>
      <label>Senha<input className={inputClass} type="password" name="password" autoComplete={register ? 'new-password' : 'current-password'} minLength={8} maxLength={128} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Pelo menos 8 caracteres"/></label>
      {register && <label>Confirme a senha<input className={inputClass} type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={confirm} onChange={e => setConfirm(e.target.value)}/></label>}
      <button className="dw-button dw-primary" disabled={busy} type="submit">{busy ? 'AGUARDE…' : register ? 'CRIAR CONTA' : 'ENTRAR'}</button>
      <button className="dw-button dw-text-button" type="button" disabled={busy} onClick={() => { setRegister(!register); setError(''); setConfirm(''); }}>{register ? 'Já tenho conta' : 'Ainda não tenho conta — registrar'}</button>
    </form>
  </section> : !room ? <section className="dw-online-rooms">
    <article className="dw-card"><h2>Criar sala</h2><p>Convide um amigo pelo código. Você escolhe o mapa e inicia quando os dois estiverem prontos.</p><button className="dw-button dw-primary" disabled={busy} onClick={create}>CRIAR SALA</button></article>
    <form className="dw-card" onSubmit={e => { e.preventDefault(); join(); }}><h2>Entrar na sala</h2><label>Código do seu amigo<input aria-label="Código da sala" className={inputClass} maxLength={8} value={code} onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, ''))} required placeholder="XXXXXXXX"/></label><button className="dw-button" disabled={busy} type="submit">ENTRAR NA SALA</button></form>
  </section> : me ? <section className="dw-online-lobby">
    <div className="dw-room-status dw-card"><div><span className="dw-eyebrow">CÓDIGO DA SALA</span><strong>{room.code}</strong><button className="dw-button" onClick={async () => { try { await navigator.clipboard.writeText(room.code); setCopied(true); } catch { setError('Copie o código exibido ao lado.'); } }}>{copied ? 'COPIADO' : 'COPIAR CÓDIGO'}</button></div><p>{opponent ? `${opponent.username} · ${opponent.ready ? 'PRONTO' : 'ESCOLHENDO'}` : 'Aguardando seu amigo…'}</p></div>
    <div className="dw-lobby-grid"><section className="dw-card"><h2>Seu lutador</h2><div className="dw-tabs" role="tablist" aria-label="Categorias online">{(['Streamers', 'Viewers', 'Especiais'] as CharCategory[]).map(c => <button key={c} role="tab" aria-selected={category === c} onClick={() => setCategory(c)}>{c}</button>)}</div>
      <div className="dw-roster">{CHAR_CATEGORIES[category].map(ch => <button key={ch} data-online-char={ch} aria-label={`Selecionar ${CHARS[ch].name}`} aria-pressed={me.char === ch} disabled={busy || room.status === 'playing'} onClick={() => configure({ char: ch, ready: false })} className="dw-fighter" style={{ '--accent': CHARS[ch].glow } as import('react').CSSProperties}><FighterPortrait ch={ch} size={37}/><span>{CHARS[ch].name}</span></button>)}</div>
    </section><section className="dw-card dw-lobby-ready"><div className="dw-lobby-fighter"><FighterPortrait ch={me.char} size={37}/><div><span className="dw-eyebrow">SEU LUTADOR</span><h2>{CHARS[me.char].name}</h2></div></div>
      <label>{host ? 'Mapa da partida' : 'Mapa escolhido pelo criador'}<select aria-label="Mapa online" className={inputClass} value={room.stage} disabled={!host || busy} onChange={e => configure({ stage: e.target.value, ready: false })}>{STAGE_IDS.map(id => <option key={id} value={id}>{STAGES[id].name}</option>)}</select></label>
      <div className="dw-stage-art"><StagePreview stageId={room.stage} className="dw-stage-canvas"/></div>
      <div className="dw-lobby-actions"><button className="dw-button" aria-pressed={me.ready} disabled={busy || room.status === 'playing'} onClick={() => configure({ ready: !me.ready })}>{me.ready ? '✓ PRONTO' : 'CONFIRMAR PRONTO'}</button>{host && <button className="dw-button dw-primary" disabled={busy || !room.host.ready || !room.guest?.ready} onClick={() => run(async () => { const r = await api<{ room: Room }>('/rooms/' + room.code + '/start', {}); setRoom(r.room); seenEpoch.current = r.room.epoch; setMatch(r.room); })}>LUTAR!</button>}</div>
      <p className="dw-help">{host ? 'A luta fica disponível quando os dois confirmarem.' : 'O criador inicia quando os dois estiverem prontos.'}</p>
    </section></div>
  </section> : null}
  {room && <MenuFooter><p>Compartilhe o código para convidar seu rival.</p><button className="dw-button" disabled={busy} onClick={leave}>SAIR DA SALA</button></MenuFooter>}
 </MenuPage>;
}
