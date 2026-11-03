import type { CharId } from '../game/data';
import type { StageId } from '../game/stage';
export interface User {id: string;username:string}
export interface Player extends User {char:CharId;ready:boolean;seen:number}
export interface Room {code:string;status:'waiting'|'playing'|'finished';epoch:string;stage:StageId;host:Player;guest:Player|null;protocol:string}
export interface Signal {id:number;payload:{type:'offer'|'answer'|'ice';sdp?:RTCSessionDescriptionInit;candidate?:RTCIceCandidateInit}}
export class ApiError extends Error {constructor(public status:number,message:string){super(message)}}
export async function api<T>(path:string,data?:unknown,signal?:AbortSignal):Promise<T> {
  if(location.protocol==='file:')throw new ApiError(0,'O modo online funciona no site. Os modos locais continuam disponíveis neste arquivo.');
  const timeout=AbortSignal.timeout(10000);
  const response=await fetch('/api'+path,{method:data===undefined?'GET':'POST',credentials:'same-origin',cache:'no-store',headers:data===undefined?{}:{'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data),signal:signal?AbortSignal.any([signal,timeout]):timeout});
  let result;try{result=await response.json()}catch{throw new ApiError(response.status,'Não foi possível acessar o serviço online. Tente novamente.')}
  if(!response.ok)throw new ApiError(response.status,result.error||'Não foi possível concluir a solicitação.');
  return result as T;
}
export const errorText=(e:unknown)=>e instanceof ApiError?e.message:e instanceof Error&&e.name==='AbortError'?'Solicitação cancelada.':'A conexão falhou. Confira a internet e tente novamente.';
