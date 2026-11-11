// Experimental tuning lives here, separate from animation and competitive frame data.
import type {CharId,Move} from './data';
export const RESOURCE_RULES={meterMax:200,ultimateCost:100,transformationCost:200,staminaMax:120,
 regenDelay:32,regenIdle:.48,regenMoving:.24,exhaustFrames:120,exhaustRelease:24,
 jumpCost:5,dashCost:7,blockCost:3,activationFrames:72,commitFrame:36,
 energyMax:100,energyStart:40,energyCharge:.42,energyOnDamage:.22,energyCosts:{s1:16,s2:22,s3:18},
 batteryMax:100,regenerationBloodMax:3} as const;
export interface ResourceState {
 stamina:number;staminaDelay:number;exhaustT:number;energy:number;blood:number;battery:number;
 formT:number;formStartup:number;formElapsed:number;formVariant:number;aftermathT:number;
 charging:boolean;formShield:number;confusionT:number;predictionCooldown:number;
}
export const freshResources=():ResourceState=>({stamina:RESOURCE_RULES.staminaMax,staminaDelay:0,exhaustT:0,energy:RESOURCE_RULES.energyStart,blood:1,battery:100,formT:0,formStartup:0,formElapsed:0,formVariant:0,aftermathT:0,charging:false,formShield:0,confusionT:0,predictionCooldown:0});
export interface FormDefinition {name:string;duration:number;damage:number;speed:number;defense:number;reach:number;scale:number;drain:number;aftermath:number;cost:string;help:string}
const form=(name:string,seconds:number,damage:number,speed:number,drain:number,help:string,extra:Partial<FormDefinition>={}):FormDefinition=>({name,duration:seconds*60,damage,speed,defense:1,reach:1,scale:1,drain,aftermath:120,cost:'200 ULT + fôlego',help,...extra});
export const FORMS:Record<CharId,FormDefinition>={
 rickzera:form('Cruz de Energia',10,2,2,.18,'Consome toda a energia. Atributos físicos 2×; não recarrega energia durante a forma. Ao terminar, especiais exigem nova carga.',{defense:.5,reach:1.12,cost:'200 ULT + toda a energia'}),
 caetano:form('Karatê Prime',12,1.35,1.2,.24,'Precisão, foco e pressão laranja. A leitura perfeita exclusiva continua valendo.'),
 orango:form('Albino 00',12,1.35,1.08,.27,'Pelagem branca, levitação visual e pulsos psíquicos. Agarrões continuam exigindo aproximação.',{defense:.8,reach:1.15}),
 tubarao:form('Benzinho, Fiquei Puto',10,1.5,.9,.3,'Forma Megalodonte. Stomp e devorar de perto; depois retorna filhote e cresce em dois minutos.',{scale:1.22,reach:1.25,defense:.8,aftermath:7200}),
 bieu:form('Maldito BuggyBatman',12,1.25,1.15,.28,'Domínio de ilusões: nuvens de tinta causam confusão curta. Agarrões e pressão ainda podem interromper.'),
 nomad:form('Jogatina',10,1,1,.16,'Paga 10% do HP máximo; sorteia força, velocidade ou tamanho. O resultado aparece na tela.',{cost:'200 ULT + 10% HP máximo'}),
 renngotti:form('Berserker',10,2,2,.28,'Atributos físicos 2×. Após o fim, força/mobilidade caem pela metade por 15 segundos.',{defense:.5,aftermath:900}),
 aneninha:form('Raiane Rindo',12,1.2,1.2,.25,'Fumaça rosa amplia o controle de Osasco. Efeito de confusão curto, com proteção contra repetição.'),
 santox:form('Jax — Domínio de Loucura',10,1.35,1.2,.3,'Coelho glitch, membros elásticos e domínio instável. A esquiva mantém seu startup e cooldown.',{reach:1.18,aftermath:180}),
 jao:form('Falso Gênio',12,1.2,1.1,.24,'Antecipação sinalizada: auxilia uma guarda em neutro a cada segundo. Não escapa de hitstun, agarrões ou baixos.',{aftermath:180}),
 jane:form('EVA',12,1.35,1.1,.12,'Traje robótico de 3 m: lasers nas mãos, dash ampliado e bateria finita. Hurtbox também cresce.',{scale:2.65,reach:1.2,defense:.75,cost:'200 ULT + bateria do robô'}),
 cristyan:form('Muayfimeu',10,1.4,1.15,.3,'Sequência dourada de Muay Thai. Golpes fortes continuam comprometidos e a guarda perfeita é preservada.'),
 eneas:form('Quando Debate não Resolve',12,2,1.05,.33,'Dr. Acreano rasga o paletó e revela as tatuagens do Brasil. Dobra a força física, com alto desgaste.'),
 patrick:form('Rei Tatu',12,1.5,.9,.32,'Couraça vermelha reduz dano. Três contatos têm armadura, mas agarrões/ULTs vencem a proteção.',{defense:.6,cost:'200 ULT + alto desgaste',aftermath:180}),
 gabrielzin:form('Gatito',12,1.3,1.1,.25,'Fantasia de gato bege: patas, força e alcance ampliados. A melodia é sintetizada pelo jogo.',{reach:1.2}),
 ulisses:form('Regeneração Imediata',15,1.15,1.08,.22,'Consome um estoque de sangue a cada 5 s para curar 100 HP. Sem estoque, a forma acaba; HP nunca excede o máximo.',{cost:'200 ULT + sangue capturado'}),
 felipence:form('Sinfonia do Caos',12,1.3,1.08,.27,'Sobrecarga sonora laranja amplia o alcance. Ondas continuam bloqueáveis e limitadas.',{reach:1.18}),
 hdsh:form('Overclock Analítico',12,1.2,1.2,.25,'Predição sinalizada ajuda a guarda em neutro, com intervalo. Exaustão mental após a forma.',{aftermath:180}),
};
export type ResourceFighter=ResourceState&{ch:CharId;hp:number;maxHp:number;meter:number;state:string;y:number;landLag:number;ko:boolean};
export function formStats(f:Pick<ResourceFighter,'ch'|'formT'|'formVariant'|'aftermathT'>){
 let damage=1,speed=1,defense=1,reach=1,scale=1;
 if(f.formT>0){({damage,speed,defense,reach,scale}=FORMS[f.ch]);
  if(f.ch==='nomad'){if(f.formVariant===0)damage=2;else if(f.formVariant===1)speed=1.6;else {scale=1.25;reach=1.25;defense=.8;}}
 }else if(f.aftermathT>0){if(f.ch==='renngotti'){damage=.5;speed=.5;defense=2;}if(f.ch==='tubarao'){const growth=1-Math.min(1,f.aftermathT/7200);damage=.65+.35*growth;scale=.55+.45*growth;speed=.8+.2*growth;}}
 return {damage,speed,defense,reach,scale};
}
export function staminaCost(m:Move){if(m.kind==='super')return 0;if(m.id==='bikeRush')return 0;if(m.kind==='special')return m.dmg===0?6:m.grab?12:10;return m.rank===1?3:m.rank===2?5:8;}
export function canTransform(f:ResourceFighter){return !f.ko&&f.formT===0&&f.formStartup===0&&f.aftermathT===0&&f.exhaustT===0&&f.stamina>=30&&f.meter>=200&&f.y===0&&f.landLag===0&&f.state==='ground'&&(f.ch!=='rickzera'||f.energy>=20)&&(f.ch!=='ulisses'||f.blood>=1)&&(f.ch!=='jane'||f.battery>=25)&&(f.ch!=='nomad'||f.hp>f.maxHp*.1);}
export function gainEnergy(f:Pick<ResourceFighter,'ch'|'formT'|'formStartup'|'energy'>,amount:number){if(f.ch==='rickzera'&&f.formT===0&&f.formStartup===0)f.energy=Math.min(100,f.energy+Math.max(0,amount));}
export function payStamina(f:ResourceState,cost:number){
 f.stamina=Math.max(0,f.stamina-cost);f.staminaDelay=RESOURCE_RULES.regenDelay;
 if(f.stamina===0)f.exhaustT=Math.max(f.exhaustT,RESOURCE_RULES.exhaustFrames);
}
