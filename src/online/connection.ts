import { api } from './api';
import type { Room, Signal, User } from './api';
import type { NetState } from '../game/net-state';
export interface NetInput {mask:number;events:{id:number;mask:number}[]}
interface Packet {type:'state'|'input';n:number;state?:NetState;input?:NetInput}
interface Callbacks {state:(s:NetState)=>void;input:(n:NetInput)=>void;status:(s:string,latency:number)=>void;lost:(message:string)=>void}
// WebRTC direto para menor atraso; o mesmo servidor da conta retransmite se a rede bloquear P2P.
export class FightConnection {
  private peer:RTCPeerConnection|null=null;
  private channel:RTCDataChannel|null=null;
  private stopped=false;
  private timers:number[]=[];
  private after=0;
  private n=0;
  private received=0;
  private own:Packet|null=null;
  private peerSeen=performance.now();
  private pendingIce:RTCIceCandidateInit[]=[];
  private roomPath:string;
    private roundTrip=0;
  readonly host:boolean;
  constructor(private room:Room,user:User,private cb:Callbacks) {this.host=room.host.id===user.id;this.roomPath='/rooms/'+room.code}
  async start() {
    if(typeof RTCPeerConnection!=='undefined') {
      try {
        const peer=new RTCPeerConnection({iceServers:[{urls:'stun:stun.cloudflare.com:3478'},{urls:'stun:stun.l.google.com:19302'}]});this.peer=peer;
        peer.onicecandidate=e=>{if(e.candidate)this.signal({type:'ice',candidate:e.candidate.toJSON()}).catch(()=>{})};
        peer.ondatachannel=e=>this.bind(e.channel);
        if(this.host) {this.bind(peer.createDataChannel('dedilho-wars',{ordered:false,maxRetransmits:0}));await peer.setLocalDescription(await peer.createOffer());await this.signal({type:'offer',sdp:peer.localDescription!.toJSON()})}
      } catch {this.peer?.close();this.peer=null}
    }
    if(this.stopped)return;
    this.pollRoom();this.relay();
    const ping=window.setInterval(()=>{
      if(this.stopped)return;
      if(this.channel?.readyState==='open')this.channel.send(JSON.stringify({type:'ping',time:performance.now()}));
      const age=performance.now()-this.peerSeen;
      this.cb.status(age>4500?'RECONECTANDO':this.channel?.readyState==='open'?'DIRETO':'VIA SERVIDOR',Math.round(this.roundTrip/2));
      if(age>20000)this.cb.lost('A conexão com o adversário foi interrompida.');
    },1000);this.timers.push(ping);
  }
  private async signal(payload:Signal['payload']) {if(!this.stopped)await api(this.roomPath+'/signal',{epoch:this.room.epoch,payload})}
  private bind(channel:RTCDataChannel) {
    this.channel=channel;
    channel.onmessage=e=>{
      if(this.stopped||typeof e.data!=='string'||e.data.length>65000)return;
      try {const p=JSON.parse(e.data);if(p.type==='ping'){channel.send(JSON.stringify({type:'pong',time:p.time}));return}if(p.type==='pong'){this.roundTrip=performance.now()-p.time;return}this.accept(p)}catch{/* malformed peer packet is ignored */}
    };
    channel.onopen=()=>{if(this.own)channel.send(JSON.stringify(this.own))};
  }
  private accept(p:Packet) {
    if(!Number.isSafeInteger(p.n)||p.n<=this.received)return;
    if(this.host?(p.type!=='input'||!p.input||!Number.isInteger(p.input.mask)||p.input.mask<0||p.input.mask>4095||!Array.isArray(p.input.events)||p.input.events.length>32):(p.type!=='state'||!p.state))return;
    this.received=p.n;this.peerSeen=performance.now();
    if(this.host)this.cb.input(p.input!);else this.cb.state(p.state!);
  }
  sendState(state:NetState) {if(this.host)this.send({type:'state',state,n:++this.n})}
  sendInput(input:NetInput) {if(!this.host)this.send({type:'input',input,n:++this.n})}
  private send(packet:Packet) {
    this.own=packet;
    if(this.channel?.readyState==='open'&&this.channel.bufferedAmount<100000)try{this.channel.send(JSON.stringify(packet))}catch{/* relay takes over */}
  }
  private async pollRoom() {
    if(this.stopped)return;
    try {
      const result=await api<{room:Room;signals:Signal[]}>(this.roomPath+'?after='+this.after);
      if(this.stopped)return;
      if(!result.room.guest||result.room.epoch!==this.room.epoch){this.cb.lost('O adversário saiu da sala.');this.close();return}
      for(const signal of result.signals) {
        this.after=Math.max(this.after,signal.id);
        const p=signal.payload,peer=this.peer;if(!peer)continue;
        try {
          if(p.type==='ice'&&p.candidate) {if(peer.remoteDescription)await peer.addIceCandidate(p.candidate);else this.pendingIce.push(p.candidate)}
          else if(p.type==='offer'&&!this.host&&p.sdp) {
            await peer.setRemoteDescription(p.sdp);for(const c of this.pendingIce.splice(0))await peer.addIceCandidate(c);
            await peer.setLocalDescription(await peer.createAnswer());await this.signal({type:'answer',sdp:peer.localDescription!.toJSON()});
          } else if(p.type==='answer'&&this.host&&p.sdp) {await peer.setRemoteDescription(p.sdp);for(const c of this.pendingIce.splice(0))await peer.addIceCandidate(c)}
        } catch {/* a relay match continues when WebRTC negotiation fails */}
      }
    } catch(e) {if((e as {status?:number}).status===403||(e as {status?:number}).status===404){this.cb.lost('A sala foi encerrada.');this.close()}}
    if(!this.stopped)this.timers.push(window.setTimeout(()=>this.pollRoom(),this.channel?.readyState==='open'?2500:650));
  }
  private async relay() {
    if(this.stopped)return;
    // Also falls back if a nominally open channel stops delivering packets.
    if(this.own&&(this.channel?.readyState!=='open'||performance.now()-this.peerSeen>1500)) {
      const packet=this.own,t=performance.now();
      try {
        const result=await api<{n:number;value:NetState|NetInput|null;seen:number}>(this.roomPath+'/sync',{epoch:this.room.epoch,n:packet.n,...(this.host?{state:packet.state}:{input:packet.input})});
        if(!this.stopped&&result.value!==null){this.roundTrip=performance.now()-t;this.accept(this.host?{type:'input',n:result.n,input:result.value as NetInput}:{type:'state',n:result.n,state:result.value as NetState})}
      } catch {/* retry transient errors without losing the match */}
    }
    if(!this.stopped)this.timers.push(window.setTimeout(()=>this.relay(),120));
  }
  stale() {return this.stopped||this.received===0||performance.now()-this.peerSeen>4500}
  inputStale() {return performance.now()-this.peerSeen>450}
  close() {this.stopped=true;this.timers.forEach(t=>{clearTimeout(t);clearInterval(t)});this.timers=[];this.channel?.close();this.peer?.close()}
}
