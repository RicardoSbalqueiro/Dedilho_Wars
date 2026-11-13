import type {Game} from '../engine';
import type {CharId} from '../data';
import {CHAR_IDS} from '../data';
import {ACTIONS} from '../input';
import {activity,DEFAULT_LAB,TRAINING_VERSION} from './catalog';
import {evaluate,freshMetrics} from './evaluation';
import {TrainingBrain} from './ai';
import type {Activity,CombatEvent,InputSlice,LabConfig,Metric,TrainingMetrics,TrainingResult,TrainingSpec} from './types';
export class TrainingSession {
 readonly def:Activity|null;readonly metrics:TrainingMetrics=freshMetrics();readonly transcript:InputSlice[]=[];
 result:TrainingResult|null=null;notice='Observe o alcance e confirme seus ataques.';revision=0;brain:TrainingBrain;
 lab:LabConfig;recording:InputSlice[]=[];recordTicks=0;playbackTick=0;private playbackIndex=0;private playbackLeft=0;
 private specials=new Set<string>();private connected=new Set<string>();private superSerials=new Set<number>();private startHp=0;
 private beforeX=0;private beforeStamina=100;private exhausted=false;private wave=0;private scriptLast=-1000;private formActive=false;
 constructor(readonly game:Game,readonly spec:TrainingSpec){
  if(spec.version!==TRAINING_VERSION)throw new Error('Atualize o jogo para abrir este treino.');
  this.def=spec.activityId==='lab'?null:activity(spec.activityId)??null;
  if(spec.activityId!=='lab'&&!this.def)throw new Error('Atividade de treinamento inválida.');
  this.lab={...DEFAULT_LAB,...spec.lab};this.brain=new TrainingBrain(this.def?.tier??this.lab.tier,spec.style??this.def?.style??'adaptive');
 }
 get finite(){return !!this.def?.finite;}
 get isLab(){return this.spec.activityId==='lab';}
 setup(){
  const g=this.game,a=g.f[0],b=g.f[1],d=this.def;
  g.winsNeeded=1;g.phase='fight';g.phaseT=0;g.ann=null;
  const distance=this.isLab?this.lab.distance:d?.distance??180;
  a.x=800-distance/2;b.x=800+distance/2;
  a.meter=d?.meter??(this.isLab?this.lab.meter:0);b.meter=0;
  if(d?.health)a.hp=a.maxHp*d.health;
  if(this.isLab){a.hp=a.maxHp*this.lab.hp/100;b.hp=b.maxHp*this.lab.hp/100;for(const f of g.f){f.meter=f.npc?0:this.lab.meter;f.energy=f.battery=this.lab.resource;f.blood=Math.floor(this.lab.resource*3/100);}if(this.lab.side===1){const x=a.x;a.x=b.x;b.x=x;a.facing=-1;b.facing=1;}}
  this.startHp=a.hp;g.train.dummy=this.isLab&&this.lab.dummy==='p2'?3:0;b.cpu=this.finite||this.isLab&&['aggressive','defensive','adaptive'].includes(this.lab.dummy);
  if(d?.routeId){g.startComboLesson(d.routeId);a.meter=0;}
  this.beforeX=a.x;this.beforeStamina=a.stamina;this.notice=d?.hint??'Laboratório livre: as alterações não concedem XP de conta.';
 }
 beforeTick(){this.beforeX=this.game.f[0].x;this.beforeStamina=this.game.f[0].stamina;}
 recordInputs(){
  if(this.result)return;
  const f=this.game.f[0],held=ACTIONS.reduce((n,a,i)=>n+(f.pad.held[a]?(1<<i):0),0),pressed=ACTIONS.reduce((n,a,i)=>n+(f.pad.pressedAt[a]===this.game.tick?(1<<i):0),0);
  if(!this.isLab)this.append(this.transcript,held,pressed);
  else if(this.lab.dummy==='record'&&this.recordTicks<900){
   this.append(this.recording,held,pressed);this.recordTicks++;const b=this.game.f[1];
   ACTIONS.forEach((a,i)=>{b.pad.set(a,!!(held&(1<<i)),this.game.tick);if(pressed&(1<<i)&&b.pad.pressedAt[a]!==this.game.tick)b.pad.tap(a,this.game.tick);});f.pad.reset();
  }
 }
 private append(trace:InputSlice[],held:number,pressed:number){const previous=trace[trace.length-1];if(previous&&previous[1]===held&&previous[2]===0&&pressed===0)previous[0]++;else trace.push([1,held,pressed]);}
 metric(metric:string,amount:number,token=''){
  if(this.result)return;
  const aliases:Record<string,Metric>={jump:'jump',dash:'dash',turn:'turn',crouch:'crouch',transform:'forms',stamina:'staminaRecovered',energy:'energyCharged',range:'cooldowns',resource:'resourceRecovered',grabs:'grabs'};
  if(metric==='special'){if(token)this.specials.add(token);this.metrics.uniqueSpecials=this.specials.size;}
  else if(aliases[metric])this.metrics[aliases[metric]]+=Math.max(0,amount);
 }
 combat(e:CombatEvent){
  if(this.result)return;const m=this.metrics;
  if(e.type==='super'){if(e.actor===0){m.attempts++;m.specialStarts++;}else m.enemyStarts++;}
  if(e.type==='start'){
   if(e.actor===0){const move=this.game.f[0].move;if(move?.kind!=='super')m.attempts++;if(move?.kind==='special')m.specialStarts++;if(e.move==='super')m.specialStarts++;}
   else if(this.game.f[e.actor].move?.kind!=='super')m.enemyStarts++;
  }
  if(e.type==='chip'){if(e.actor===0)m.damage+=e.amount;else m.damageTaken+=e.amount;}
  if(e.type==='hit'&&e.actor===0)m.bestCombo=Math.max(m.bestCombo,e.hits);
  if(e.type==='damage'){
   if(e.actor===0){
    m.damage+=e.amount;m.hits++;m.bestCombo=Math.max(m.bestCombo,e.hits);const key=e.actor+':'+e.serial;if(!this.connected.has(key)){this.connected.add(key);m.connected++;}
    if(e.move==='super'){if(!this.superSerials.has(e.serial)){m.superHits++;this.superSerials.add(e.serial);}if(e.hits>=5)m.comboUlt=1;}
    else {const move=this.game.f[0].move;if(move?.kind==='normal')m.normalHits++;if(move?.kind==='special'||e.move.startsWith('s'))m.specialHits++;}
    if(e.low)m.lowHits++;if(e.air)m.airHits++;if(e.move==='headbutt')m.headHits++;
    if(e.targetAir&&!e.air)m.antiAir++;if(e.combo==='punish'&&e.hits<=1)m.punishes++;
    if(this.game.f[0].formT>0)m.formHits++;
   }else m.damageTaken+=e.amount;
  }
  if(e.type==='block'){
   if(e.target===0){m.blocks++;if(e.low)m.lowBlocks++;if(e.perfect)m.perfects++;this.notice=e.perfect?'Defesa no instante certo. Repita o mesmo ritmo.':'Você bloqueou. Para a perfeita, solte Defesa e aperte mais perto do contato.';}
  }
  if(e.type==='guardBreak'&&e.actor===0)m.guardBreaks++;
  if(e.type==='whiff'&&e.actor===0){m.whiffs++;this.notice='O golpe ficou fora do alcance. Aproxime-se antes de confirmar.';}
  if(e.type==='damage'&&e.target===0)this.notice='Você recebeu o golpe. Observe a preparação e preserve a guarda antes de responder.';
 }
 controlOpponent(){
  const g=this.game,b=g.f[1];if(this.result){b.pad.reset();return;}
  if(this.isLab){
   const mode=this.lab.dummy;
   if(mode==='record'||mode==='p2')return;
   if(mode==='playback'){this.playRecording();return;}
   if(['aggressive','defensive','adaptive'].includes(mode)){this.brain.act(g,b);return;}
   if(mode==='script'){this.script(this.lab.script);return;}
   b.pad.reset();if(this.lab.guard!=='normal'){b.pad.set('block',true,g.tick);b.pad.set('down',this.lab.guard==='low',g.tick);}return;
  }
  if(this.def?.script){this.script(this.def.script);return;}
  if(this.finite){this.brain.act(g,b);return;}
  b.pad.reset();
  if(this.game.coach&&this.game.coach.progress>0)b.pad.set('block',true,g.tick);
  // Non-damaging territory and evasion powers require a genuinely active target.
  if(this.def?.goals.some(t=>t.metric==='uniqueSpecials')&&['jao','hdsh','santox'].includes(g.f[0].ch)){
   b.pad.set('left',Math.abs(b.x-g.f[0].x)>120,g.tick);if(g.tick-this.scriptLast>105&&b.state==='ground'){b.pad.set('p',true,g.tick);this.scriptLast=g.tick;}
  }
 }
 private script(kind:NonNullable<Activity['script']>){
  const g=this.game,b=g.f[1],a=g.f[0];b.pad.reset();
  if(kind==='guard'){b.pad.set('block',true,g.tick);b.pad.set('down',a.move?.level==='low',g.tick);return;}
  if(kind==='air'){if(g.tick-this.scriptLast>=85&&b.state==='ground'){b.pad.set('up',true,g.tick);this.scriptLast=g.tick;}return;}
  if(g.tick-this.scriptLast<110||b.state!=='ground'||b.landLag>0)return;
  const distance=Math.abs(a.x-b.x),desired=kind==='whiff'?Math.max(155,b.def.moves.headbutt.hb[1]+a.def.pushW+20):Math.min(92,b.def.moves.pL.hb[1]+a.def.pushW-5);
  if(kind!=='whiff'&&distance>desired+8){b.pad.set(a.x>b.x?'right':'left',true,g.tick);return;}
  if(kind==='whiff'&&distance<desired-10){b.pad.set(a.x>b.x?'left':'right',true,g.tick);return;}
  this.scriptLast=g.tick;
  if(kind==='low'||kind==='mixed'&&Math.floor(g.tick/110)%2===0)b.pad.set('down',true,g.tick);
  const key=kind==='whiff'?'headbutt':kind==='projectile'?'s2':kind==='low'?'k':'p';b.pad.set(key,true,g.tick);b.pad.tap(key,g.tick);
 }
 afterTick(){
  if(this.result)return;const g=this.game,a=g.f[0],b=g.f[1],m=this.metrics;
  m.activeTicks++;if((a.walking!==0||a.state==='dash')&&a.state!=='hit')m.walk+=Math.abs(a.x-this.beforeX);m.minHp=Math.min(m.minHp,a.hp/a.maxHp);
  m.staminaUsed+=Math.max(0,this.beforeStamina-a.stamina);
  if(a.exhaustT>0&&!this.exhausted)m.exhausts++;this.exhausted=a.exhaustT>0;
  if(a.formStartup>0&&!this.formActive)m.formStarts++;this.formActive=a.formStartup>0||a.formT>0;
  if(g.coach?.status==='success')m.route=1;
  if(this.isLab){
   for(const f of g.f){if(this.lab.stamina){f.stamina=100;f.exhaustT=0;}f.meter=f.npc?0:this.lab.meter;}
   if(this.lab.dummy==='record'&&this.recordTicks>=900){this.lab.dummy='idle';b.pad.reset();this.notice='Gravação concluída. Abra Configurar e selecione a reprodução.';}
   if(g.tick%15===0)this.changed();return;
  }
  const d=this.def!;
  if(a.hp<=0||a.ko||b.wins>=g.winsNeeded){this.finish(false,'O adversário venceu. O resultado foi registrado para orientar seu próximo treino.');return;}
  if(this.finite&&(b.hp<=0||b.ko||g.winner===0||a.wins>=g.winsNeeded)){
   m.wins++;if(d.goals.some(t=>t.metric==='wins'&&m.wins<t.target)){
    const hp=Math.min(a.maxHp,a.hp+a.maxHp*.15),resources={stamina:a.stamina,meter:a.meter,energy:a.energy,battery:a.battery,blood:a.blood};
    this.wave++;g.replaceTrainingOpponent(CHAR_IDS[(this.wave*5+3)%18]);a.hp=hp;Object.assign(a,resources);a.x=630;g.f[1].x=970;this.brain=new TrainingBrain(d.tier,d.style);this.notice='Próximo adversário. Você recuperou 15% de vida; os demais recursos foram preservados.';
   }else if(!d.goals.every(goal=>m[goal.metric]>=goal.target)){this.finish(false,'Você venceu o adversário, mas ainda faltou demonstrar o objetivo adicional do exercício.');return;}
  }
  const c=d.constraints;
  if(c?.noSpecial&&m.specialStarts||c?.noForm&&m.formStarts||c?.noExhaust&&m.exhausts||c?.noDamage&&m.damageTaken>0||c?.maxDamage&&m.damageTaken>c.maxDamage){this.finish(false,'Uma restrição do exercício foi ultrapassada. Veja a análise para ajustar a próxima tentativa.');return;}
  if(d.goals.every(goal=>m[goal.metric]>=goal.target)){this.finish(true,'Objetivo demonstrado com ações reais do combate.');return;}
  if(m.activeTicks>=d.maxTicks){this.finish(false,'O tempo ativo da tentativa terminou. Você pode tentar novamente.');return;}
  if(g.tick%15===0)this.changed();
 }
 private changed(){this.revision++;this.game.onEvent({type:'training'});}
 private finish(success:boolean,reason:string){
  const d=this.def!,evaluation=evaluate(d,this.metrics,success);
  this.result={id:this.spec.verifiedSession??`local-${this.spec.seed}-${d.id}`,activityId:d.id,character:this.game.f[0].ch,opponent:d.opponent,success,reason,...evaluation,metrics:{...this.metrics},activeSeconds:this.metrics.activeTicks/60,at:Date.now(),xp:0,masteryGained:0,promoted:false,verified:false};
  this.game.togglePause(true);this.changed();this.game.onEvent({type:'trainingResult',result:this.result});
 }
 configureLab(next:LabConfig){
  if(!this.isLab)return false;this.lab={...next};this.game.train.dummy=next.dummy==='p2'?3:0;
  this.game.resetPositions();Object.assign(this.metrics,freshMetrics());this.brain=new TrainingBrain(next.tier,['aggressive','defensive','adaptive'].includes(next.dummy)?next.dummy as 'aggressive'|'defensive'|'adaptive':'technical');this.setup();this.playbackIndex=this.playbackLeft=this.playbackTick=0;this.changed();return true;
 }
 clearRecording(){this.recording=[];this.recordTicks=0;this.playbackIndex=this.playbackLeft=this.playbackTick=0;}
 private playRecording(){
  const g=this.game,b=g.f[1];if(!this.recording.length){b.pad.reset();return;}
  if(this.playbackLeft===0){if(this.playbackIndex>=this.recording.length){this.playbackIndex=0;b.pad.reset();}this.playbackLeft=this.recording[this.playbackIndex][0];}
  const row=this.recording[this.playbackIndex],first=this.playbackLeft===row[0];ACTIONS.forEach((a,i)=>{b.pad.set(a,!!(row[1]&(1<<i)),g.tick);if(first&&row[2]&(1<<i)&&b.pad.pressedAt[a]!==g.tick)b.pad.tap(a,g.tick);});
  this.playbackTick++;if(--this.playbackLeft===0)this.playbackIndex++;
 }
 get initialHp(){return this.startHp;}
 get actor(){return this.spec.p1 as CharId;}
}
