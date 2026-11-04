import { useEffect, useRef, useState } from 'react';
import { api, errorText, ApiError } from '../online/api';
import type { User, Room } from '../online/api';
import { ONLINE_PROTOCOL } from '../game/net-state';
import { CHARS, CHAR_CATEGORIES } from '../game/data';
import type { CharCategory } from '../game/data';
import { STAGES, STAGE_IDS } from '../game/stage';
import { ArtCanvas, Frame, FighterPortrait, SkewBtn, StagePreview } from './common';
import { audio } from '../game/audio';
import { OnlineGame } from './OnlineGame';

const inputClass='w-full bg-[#090512] border border-white/25 focus:border-cyan-300 focus:outline-none rounded px-3 py-2 text-sm';
export function Online({onBack,mobile=false}:{onBack:()=>void;mobile?:boolean}) {
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
 if(match&&user){const fight=<OnlineGame room={match} user={user} onLobby={()=>setMatch(null)} onLeave={leave}/>;return mobile?<Frame game>{fight}</Frame>:fight;}
 const host=room?.host.id===user?.id,me=host?room?.host:room?.guest,opponent=host?room?.guest:room?.host;
 return <div className={"online-screen absolute inset-0"+(mobile?" online-mobile":"")}>
  <ArtCanvas variant="menu"/><div className="absolute inset-0 bg-[#080312]/90"/>
  <div className="online-header absolute left-7 top-5 right-7 flex items-center justify-between"><div><h1 className="title-main text-[31px] text-cyan-200">DEDILHO ONLINE</h1><p className="text-[10px] text-white/55">CONTAS POR USUÁRIO · SALAS PARA DOIS LUTADORES</p></div>{user&&<div className="text-right text-xs"><div className="text-cyan-200 mb-1">{user.username}</div>{!room&&<button disabled={busy} className="text-white/60 hover:text-white underline cursor-pointer" onClick={()=>run(async()=>{await api('/auth/logout',{});setUser(null);setPassword('')})}>Sair da conta</button>}</div>}</div>
  <div className="online-body absolute left-7 right-7 top-[83px] bottom-[67px]">
   {loading?<div className="text-center mt-24 text-white/70">Conectando ao serviço online…</div>:!user?<div className="online-auth flex gap-12 items-center h-full px-16">
    <div className="online-intro w-[310px] shrink-0"><div className="title-main text-[28px] text-white mb-4">{register?'CRIE SUA CONTA':'ENTRE NA ARENA'}</div><p className="text-sm leading-6 text-white/65 mb-5">Desafie um amigo pelo código da sala. Escolha entre os oito lutadores e as 17 arenas.</p><p className="text-xs text-cyan-200/85">Sem e-mail: use apenas seu nome de usuário e sua senha.</p></div>
    <form className="online-auth-form flex-1 max-w-[350px] space-y-3" onSubmit={e=>{e.preventDefault();run(async()=>{if(register&&password!==confirm)throw new ApiError(400,'As senhas precisam ser iguais.');const r=await api<{user:User;protocol:string}>('/auth/'+(register?'register':'login'),{username,password});setUser(r.user);setPassword('');setConfirm('')})}}>
     <label className="block text-xs text-white/80">Usuário<input className={inputClass+' mt-1'} name="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="username" minLength={3} maxLength={24} pattern="[A-Za-z0-9_]+" required value={username} onChange={e=>setUsername(e.target.value)} placeholder="Seu nome na arena"/></label>
     <label className="block text-xs text-white/80">Senha<input className={inputClass+' mt-1'} type="password" name="password" autoComplete={register?'new-password':'current-password'} minLength={8} maxLength={128} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Pelo menos 8 caracteres"/></label>
     {register&&<label className="block text-xs text-white/80">Confirme a senha<input className={inputClass+' mt-1'} type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={confirm} onChange={e=>setConfirm(e.target.value)}/></label>}
     <button type="submit" disabled={busy} className="w-full bg-cyan-300 text-[#080312] title-main py-2 text-xl rounded cursor-pointer disabled:opacity-50">{busy?'AGUARDE…':register?'CRIAR CONTA':'ENTRAR'}</button>
     <button type="button" disabled={busy} onClick={()=>{setRegister(!register);setError('');setConfirm('')}} className="w-full text-xs text-white/70 underline cursor-pointer">{register?'Já tenho conta':'Ainda não tenho conta — registrar'}</button>
    </form>
   </div>:!room?<div className="online-rooms flex gap-8 items-center justify-center h-full">
    <div className="w-[350px] border border-cyan-300/30 bg-cyan-300/5 p-7 rounded-xl"><h2 className="title-main text-3xl mb-3">CRIAR SALA</h2><p className="text-sm text-white/65 mb-7 leading-6">Convide um amigo pelo código. Você escolhe o mapa e inicia quando os dois estiverem prontos.</p><SkewBtn small onClick={create} disabled={busy} color="#22d3ee">CRIAR SALA</SkewBtn></div>
    <form className="w-[350px] border border-fuchsia-300/30 bg-fuchsia-300/5 p-7 rounded-xl" onSubmit={e=>{e.preventDefault();join()}}><h2 className="title-main text-3xl mb-3">ENTRAR NA SALA</h2><label className="block text-xs text-white/65">Código do seu amigo<input aria-label="Código da sala" className={inputClass+' mt-3 mb-4 tracking-[.3em] uppercase'} maxLength={8} value={code} onChange={e=>setCode(e.target.value.toUpperCase().replace(/[^A-Z2-9]/g,''))} required placeholder="XXXXXXXX"/></label><button disabled={busy} className="title-main bg-fuchsia-400 text-black text-lg py-2 px-5 rounded cursor-pointer disabled:opacity-40" type="submit">ENTRAR NA SALA</button></form>
   </div>:me?<div>
    <div className="flex justify-between items-center mb-3"><div className="text-xs"><span className="text-white/50">SALA </span><strong className="text-cyan-200 tracking-[.15em] text-lg">{room.code}</strong><button className="ml-4 underline text-white/60 cursor-pointer" onClick={()=>{navigator.clipboard?.writeText(room.code).then(()=>setCopied(true)).catch(()=>setError('Copie o código exibido ao lado.'))}}>{copied?'COPIADO':'COPIAR CÓDIGO'}</button></div><div className="text-xs text-white/60">{opponent?`${opponent.username} · ${opponent.ready?'PRONTO':'ESCOLHENDO'}`:'Aguardando seu amigo…'}</div></div>
    <div className="online-lobby-grid grid grid-cols-[440px_1fr] gap-6">
     <div><div className="flex gap-2 mb-2">{(['Streamers','Viewers','Especiais'] as CharCategory[]).map(c=><button key={c} onClick={()=>setCategory(c)} className={'text-xs px-4 py-2 border cursor-pointer '+(category===c?'border-cyan-300 bg-cyan-300/15':'border-white/20 bg-black/30')}>{c}</button>)}</div>
      <div className="online-roster grid grid-cols-3 gap-2">{CHAR_CATEGORIES[category].map(ch=><button key={ch} data-online-char={ch} disabled={busy||room.status==='playing'} onClick={()=>configure({char:ch,ready:false})} className="relative border rounded h-[91px] cursor-pointer disabled:opacity-50" style={{borderColor:me.char===ch?CHARS[ch].glow:'#ffffff33',background:me.char===ch?CHARS[ch].color+'55':'#080312bb'}}><FighterPortrait ch={ch} size={25} className="absolute top-0 left-[39px]"/><span className="absolute bottom-2 left-1 right-1 title-main text-[10px]">{CHARS[ch].name}</span></button>)}</div>{category==='Viewers'&&<div className="h-[180px] flex items-center justify-center title-main text-2xl text-white/40 border border-dashed border-white/20">EM BREVE</div>}
     </div>
     <div><div className="flex gap-3 items-center mb-3"><FighterPortrait ch={me.char} size={25}/><div><span className="text-white/50 text-[10px]">SEU LUTADOR</span><div className="title-main text-lg" style={{color:CHARS[me.char].glow}}>{CHARS[me.char].name}</div></div></div>
      <label className="block text-xs text-white/60 mb-2">{host?'MAPA DA PARTIDA':'MAPA ESCOLHIDO PELO CRIADOR'}<select aria-label="Mapa online" className={inputClass+' mt-1'} value={room.stage} disabled={!host||busy} onChange={e=>configure({stage:e.target.value,ready:false})}>{STAGE_IDS.map(id=><option key={id} value={id}>{STAGES[id].name}</option>)}</select></label>
      <div className="relative h-[95px] rounded overflow-hidden border border-white/15"><StagePreview stageId={room.stage} className="w-full h-full object-cover"/></div>
      <div className="flex gap-3 mt-3"><button disabled={busy||room.status==='playing'} onClick={()=>configure({ready:!me.ready})} className={'title-main text-base px-4 py-2 rounded cursor-pointer disabled:opacity-50 '+(me.ready?'bg-emerald-400 text-black':'bg-white/10 border border-white/25')}>{me.ready?'✓ PRONTO':'CONFIRMAR PRONTO'}</button>{host&&<button disabled={busy||!room.host.ready||!room.guest?.ready} onClick={()=>run(async()=>{const r=await api<{room:Room}>('/rooms/'+room.code+'/start',{});setRoom(r.room);seenEpoch.current=r.room.epoch;setMatch(r.room)})} className="title-main bg-cyan-300 text-black px-5 py-2 rounded cursor-pointer disabled:opacity-30">LUTAR!</button>}</div>
      {!host&&<p className="text-[10px] text-white/50 mt-2">O criador inicia quando os dois estiverem prontos.</p>}
     </div>
    </div>
   </div>:null}
  </div>
  {error&&<div role="alert" className="online-error absolute left-[235px] right-7 bottom-[18px] rounded border border-rose-400/50 bg-[#290d24] px-4 py-3 text-[11px] text-rose-100">{error}{location.protocol==='file:'&&<a href="https://dedilho-wars-luta.pithyblimp1.chatgpt.site" className="underline ml-2">ABRIR SITE</a>}</div>}
  {pollError&&<div role="status" className="absolute right-7 top-[70px] text-xs text-amber-300">{pollError}</div>}
  <div className="online-footer absolute bottom-5 left-7"><SkewBtn small disabled={busy} onClick={room?leave:onBack}> {room?'SAIR DA SALA':'VOLTAR'} </SkewBtn></div>
 </div>;
}
