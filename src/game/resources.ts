// Experimental tuning lives here, separate from animation and competitive frame data.
import type {CharId,Move} from './data';
export const RESOURCE_RULES={meterMax:200,ultimateCost:100,transformationCost:200,staminaMax:120,
 regenDelay:32,regenIdle:.48,regenMoving:.24,exhaustFrames:120,exhaustRelease:24,
 jumpCost:5,dashCost:7,blockCost:3,activationFrames:72,commitFrame:36,transformationFrames:600,
 energyMax:100,energyStart:40,energyCharge:.42,energyOnDamage:.22,energyCosts:{s1:16,s2:22,s3:18},
 batteryMax:100,regenerationBloodMax:3,onHit:{energy:5,battery:4,blood:1}} as const;
export interface ResourceState {
 stamina:number;staminaDelay:number;exhaustT:number;energy:number;blood:number;battery:number;
 formT:number;formStartup:number;formElapsed:number;formVariant:number;aftermathT:number;
 charging:boolean;formShield:number;confusionT:number;predictionCooldown:number;
}
export const freshResources=():ResourceState=>({stamina:RESOURCE_RULES.staminaMax,staminaDelay:0,exhaustT:0,energy:RESOURCE_RULES.energyStart,blood:1,battery:100,formT:0,formStartup:0,formElapsed:0,formVariant:0,aftermathT:0,charging:false,formShield:0,confusionT:0,predictionCooldown:0});
export const formPowerActive=(f:Pick<ResourceState,'formT'>)=>f.formT>0;
export const FORM_POWER_HELP='Forma ativa: invulnerável a ataques e atravessa guarda, aparo, esquiva e armadura. Outra forma ativa continua invulnerável.';
export interface FormDefinition {name:string;duration:number;damage:number;speed:number;defense:number;reach:number;scale:number;drain:number;aftermath:number;cost:string;help:string}
const form=(name:string,damage:number,speed:number,drain:number,help:string,extra:Partial<FormDefinition>={}):FormDefinition=>({name,duration:RESOURCE_RULES.transformationFrames,damage,speed,reach:1,scale:1,drain,aftermath:120,cost:'200 ULT + fôlego',help,...extra,defense:0});
export const FORMS:Record<CharId,FormDefinition>={
 rickzera:form('Cruz de Energia',2,2,.18,'Consome toda a energia. Atributos físicos 2×; cada acerto recupera energia, inclusive na forma. Ao terminar, especiais exigem nova carga.',{reach:1.12,cost:'200 ULT + toda a energia'}),
 caetano:form('Karatê Prime',1.35,1.2,.24,'Precisão, foco e pressão laranja. Seus golpes atravessam a defesa durante a forma.'),
 orango:form('Albino 00',1.35,1.08,.27,'Pelagem branca, levitação visual e pulsos psíquicos. Agarrões continuam exigindo aproximação.',{reach:1.15}),
 tubarao:form('Benzinho, Fiquei Puto',1.5,.9,.3,'Forma Megalodonte. Stomp e devorar de perto; depois retorna filhote e cresce em dois minutos.',{scale:1.22,reach:1.25,aftermath:7200}),
 bieu:form('Maldito BuggyBatman',1.25,1.15,.28,'Domínio de ilusões: nuvens de tinta causam confusão curta. A forma ativa protege contra qualquer ataque.'),
 nomad:form('Jogatina',1,1,.16,'Paga 10% do HP máximo; sorteia força, velocidade ou tamanho. O resultado aparece na tela.',{cost:'200 ULT + 10% HP máximo'}),
 renngotti:form('Berserker',2,2,.28,'Atributos físicos 2×. Após o fim, força/mobilidade caem pela metade por 15 segundos.',{aftermath:900}),
 aneninha:form('Raiane Rindo',1.2,1.2,.25,'Fumaça rosa amplia o controle de Osasco. Efeito de confusão curto, com proteção contra repetição.'),
 santox:form('Jax — Domínio de Loucura',1.35,1.2,.3,'Coelho glitch, membros elásticos e domínio instável. A esquiva mantém seu startup e cooldown.',{reach:1.18,aftermath:180}),
 jao:form('Falso Gênio',1.2,1.1,.24,'Antecipação sinalizada: auxilia uma guarda em neutro a cada segundo. A forma ativa concede imunidade total a ataques.',{aftermath:180}),
 jane:form('EVA',1.35,1.1,.12,'Traje robótico de 3 m: lasers nas mãos, dash ampliado e bateria finita. Hurtbox também cresce.',{scale:2.65,reach:1.2,cost:'200 ULT + bateria do robô'}),
 cristyan:form('Muayfimeu',1.4,1.15,.3,'Sequência dourada de Muay Thai. Combina golpes fortes com a proteção da forma ativa.'),
 eneas:form('Quando Debate não Resolve',2,1.05,.33,'Dr. Acreano rasga o paletó e revela as tatuagens do Brasil. Dobra a força física, com alto desgaste.'),
 patrick:form('Rei Tatu',1.5,.9,.32,'Couraça vermelha concede imunidade a ataques; seus golpes atravessam a defesa.',{cost:'200 ULT + alto desgaste',aftermath:180}),
 gabrielzin:form('Gatito',1.3,1.1,.25,'Fantasia de gato bege: patas, força e alcance ampliados. A melodia é sintetizada pelo jogo.',{reach:1.2}),
 ulisses:form('Regeneração Imediata',1.15,1.08,.22,'Luta com braços e garras. Consome um estoque de sangue a cada 5 s para curar 100 HP. Sem estoque, deixa de curar; a forma continua por 10 s.',{cost:'200 ULT + sangue capturado'}),
 felipence:form('Sinfonia do Caos',1.3,1.08,.27,'Sobrecarga sonora laranja amplia o alcance. Ondas atravessam a defesa durante a forma ativa.',{reach:1.18}),
 hdsh:form('Overclock Analítico',1.2,1.2,.25,'Predição sinalizada ajuda a guarda em neutro, com intervalo. Exaustão mental após a forma.',{aftermath:180}),
};
export type ResourceFighter=ResourceState&{ch:CharId;hp:number;maxHp:number;meter:number;state:string;y:number;landLag:number;ko:boolean};
export function formStats(f:Pick<ResourceFighter,'ch'|'formT'|'formVariant'|'aftermathT'>){
 let damage=1,speed=1,defense=1,reach=1,scale=1;
 if(f.formT>0){({damage,speed,defense,reach,scale}=FORMS[f.ch]);
  if(f.ch==='nomad'){if(f.formVariant===0)damage=2;else if(f.formVariant===1)speed=1.6;else {scale=1.25;reach=1.25;defense=.8;}}
 }else if(f.aftermathT>0){if(f.ch==='renngotti'){damage=.5;speed=.5;defense=2;}if(f.ch==='tubarao'){const growth=1-Math.min(1,f.aftermathT/7200);damage=.65+.35*growth;scale=.55+.45*growth;speed=.8+.2*growth;}}
 if(formPowerActive(f))defense=0;
 return {damage,speed,defense,reach,scale,invulnerable:formPowerActive(f),defenseBreak:formPowerActive(f)};
}
export function staminaCost(m:Move){if(m.kind==='super')return 0;if(m.id==='bikeRush')return 0;if(m.kind==='special')return m.dmg===0?6:m.grab?12:10;return m.rank===1?3:m.rank===2?5:8;}
export function canTransform(f:ResourceFighter){return !f.ko&&f.formT===0&&f.formStartup===0&&f.aftermathT===0&&f.exhaustT===0&&f.stamina>=30&&f.meter>=200&&f.y===0&&f.landLag===0&&f.state==='ground'&&(f.ch!=='rickzera'||f.energy>=20)&&(f.ch!=='ulisses'||f.blood>=1)&&(f.ch!=='jane'||f.battery>=25)&&(f.ch!=='nomad'||f.hp>f.maxHp*.1);}
export function gainEnergy(f:Pick<ResourceFighter,'ch'|'formT'|'formStartup'|'energy'>,amount:number){if(f.ch==='rickzera'&&f.formT===0&&f.formStartup===0)f.energy=Math.min(100,f.energy+Math.max(0,amount));}
/** A real damaging contact restores the attacker's resource, including inside
 * an active form. Charge/damage-received rules remain separate from this gain. */
export function recoverAttackResource(f:Pick<ResourceFighter,'ch'|'energy'|'battery'|'blood'>){
 const key=f.ch==='rickzera'?'energy':f.ch==='jane'?'battery':f.ch==='ulisses'?'blood':null;
 if(!key)return null;
 const max=key==='blood'?RESOURCE_RULES.regenerationBloodMax:100,before=f[key];
 f[key]=Math.min(max,before+RESOURCE_RULES.onHit[key]);
 const amount=f[key]-before;
 return amount>0?{key,amount,label:key==='energy'?'ENERGIA':key==='battery'?'BATERIA':'SANGUE'}:null;
}
export function payStamina(f:ResourceState,cost:number){
 f.stamina=Math.max(0,f.stamina-cost);f.staminaDelay=RESOURCE_RULES.regenDelay;
 if(f.stamina===0)f.exhaustT=Math.max(f.exhaustT,RESOURCE_RULES.exhaustFrames);
}
