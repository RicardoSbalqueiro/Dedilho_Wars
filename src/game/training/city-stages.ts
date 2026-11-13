import {layerCanvas} from '../canvas';

/** Training-only districts. These IDs do not extend the online map protocol. */
export const TRAINING_STAGE_IDS=['twitchcity-capital','twitchcity-military','twitchcity-conservator'] as const;
export type TrainingStageId=(typeof TRAINING_STAGE_IDS)[number];
export const TRAINING_STAGES:Record<TrainingStageId,{id:TrainingStageId;name:string;subtitle:string;accent:string;district:string}>={
 'twitchcity-capital':{id:'twitchcity-capital',name:'Twitchcity · Capital',subtitle:'PRAÇA CÍVICA · CANAL DA CAPITAL',accent:'#c478ff',district:'Distrito Capital'},
 'twitchcity-military':{id:'twitchcity-military',name:'Twitchcity · Distrito Militar',subtitle:'BASE DOS SHOOTER · PÁTIO DE OPERAÇÕES',accent:'#44dfff',district:'Distrito Militar'},
 'twitchcity-conservator':{id:'twitchcity-conservator',name:'Twitchcity · Distrito Conservador',subtitle:'MORRO SENBUKAN · CAMINHO DO DOJO',accent:'#ffc36c',district:'Distrito Conservador'},
};
export interface TrainingCityScene {sky:HTMLCanvasElement;mountains:HTMLCanvasElement;hall:HTMLCanvasElement;floor:HTMLCanvasElement}
type Ctx=CanvasRenderingContext2D;
type Palette={accent:string;soft:string;night:string;glass:string;secondary:string};
const PALETTES:Record<TrainingStageId,Palette>={
 'twitchcity-capital':{accent:'#bc69ff',soft:'#f0bbff',night:'#100b28',glass:'#3b2469',secondary:'#fa70c8'},
 'twitchcity-military':{accent:'#33d7ff',soft:'#b6f1ff',night:'#091726',glass:'#1c3a59',secondary:'#72a1ff'},
 'twitchcity-conservator':{accent:'#ffbc55',soft:'#ffe0a1',night:'#1a1029',glass:'#533658',secondary:'#f28ec3'},
};
const TAU=Math.PI*2;
const isCity=(id:string):id is TrainingStageId=>(TRAINING_STAGE_IDS as readonly string[]).includes(id);
const rect=(c:Ctx,x:number,y:number,w:number,h:number,col:string)=>{c.fillStyle=col;c.fillRect(x,y,w,h);};
function poly(c:Ctx,points:readonly(readonly[number,number])[],col:string,stroke?:string,width=1.5){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=col;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
function line(c:Ctx,points:readonly(readonly[number,number])[],col:string,width=1){c.strokeStyle=col;c.lineWidth=width;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();}
function ellipse(c:Ctx,x:number,y:number,rx:number,ry:number,col:string){c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fill();}
function label(c:Ctx,text:string,x:number,y:number,size:number,col:string){c.font=`900 ${size}px 'Russo One',Impact,sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillStyle=col;c.fillText(text,x,y);}
function gradient(c:Ctx,w:number,h:number,top:string,bottom:string){const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,top);g.addColorStop(1,bottom);c.fillStyle=g;c.fillRect(0,0,w,h);}
function haze(c:Ctx,x:number,y:number,rx:number,ry:number,color:string){c.save();c.translate(x,y);c.scale(1,ry/rx);const g=c.createRadialGradient(0,0,0,0,0,rx);g.addColorStop(0,color);g.addColorStop(1,color.slice(0,7)+'00');c.fillStyle=g;c.fillRect(-rx,-rx,rx*2,rx*2);c.restore();}
function random(seed:number){let value=seed>>>0;return()=>{value=(Math.imul(value,1664525)+1013904223)>>>0;return value/4294967296;};}
function shield(c:Ctx,x:number,y:number,r:number,color:string,fill='#22133b',star=true){
 poly(c,[[x-r,y-r*.82],[x+r,y-r*.82],[x+r*.91,y+r*.32],[x,y+r],[x-r*.91,y+r*.32]],fill,color,2.3);
 if(star){const pts:[number,number][]=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=r*(i%2?.24:.55);pts.push([x+Math.cos(a)*rr,y+Math.sin(a)*rr]);}poly(c,pts,color);}
 else {poly(c,[[x-r*.48,y-r*.5],[x+r*.51,y-r*.5],[x+r*.51,y+r*.13],[x+r*.14,y+r*.47],[x-r*.02,y+r*.27],[x-r*.48,y+r*.27]],color);rect(c,x-r*.22,y-r*.26,r*.12,r*.3,fill);rect(c,x+r*.1,y-r*.26,r*.12,r*.3,fill);}
}
function tower(c:Ctx,x:number,base:number,w:number,h:number,p:Palette,rnd:()=>number,near=false){
 const top=base-h;rect(c,x,top,w,h,near?'#1a1835':'#15132e');poly(c,[[x+w,top],[x+w+8,top-5],[x+w+8,base],[x+w,base]],near?'#111327':'#100f26');
 rect(c,x+2,top+2,w-4,3,p.accent+'66');rect(c,x+w-4,top+10,2,h-13,p.accent+'7a');
 for(let row=top+13;row<base-9;row+=12)for(let col=x+8;col<x+w-7;col+=12){const lit=rnd();if(lit>.32)rect(c,col,row,3+(lit>.85?3:0),4,lit>.88?'#ffcf8b9c':p.accent+(near?'a0':'62'));}
 if(h>180){line(c,[[x+w*.5,top],[x+w*.5,top-22-rnd()*21]],p.accent+'a8',1.5);ellipse(c,x+w*.5,top-23,2,2,p.soft);}
 if(w>65&&near){rect(c,x+w*.25,top+25,w*.48,29,'#140e28');label(c,'▰',x+w*.5,top+38,19,p.accent);}
}
function skyline(c:Ctx,p:Palette,seed:number){
 const rnd=random(seed);haze(c,800,295,660,205,p.accent+'38');
 for(let layer=0;layer<2;layer++)for(let i=0;i<31;i++){const x=-75+i*57+(layer?16:0),h=52+rnd()*(layer?192:264),w=29+rnd()*44;tower(c,x,377,w,h,p,rnd,!!layer);}
 // Connected elevated expressways keep the city a single inhabited place.
 for(const y of [256,337]){line(c,[[0,y],[325,y-8],[663,y+9],[981,y-3],[1290,y+6],[1600,y-12]],'#18132f',10);line(c,[[0,y-3],[325,y-11],[663,y+6],[981,y-6],[1290,y+3],[1600,y-15]],p.accent+'78',1.8);}
}
function streetLamp(c:Ctx,x:number,y:number,p:Palette,short=false){
 const h=short?83:137;rect(c,x-3,y-h,6,h,'#202137');line(c,[[x-12,y-h],[x+25,y-h]],'#454159',6);rect(c,x-11,y-h-5,37,7,p.soft);rect(c,x-9,y-h+3,32,2,p.accent);haze(c,x+7,y-h+7,41,57,p.accent+'29');
}
function flag(c:Ctx,x:number,y:number,col:string,mark:string){rect(c,x-2,y,4,143,'#7b7296');poly(c,[[x+3,y+4],[x+48,y+4],[x+43,y+73],[x+3,y+64]],col,'#d9c6fa44',1);label(c,mark,x+25,y+29,20,'#f4e8ff');line(c,[[x+10,y+51],[x+37,y+54]],'#eee0ff99',2);}
function bank(c:Ctx,p:Palette){
 rect(c,0,393,1600,38,'#101b35');rect(c,0,391,1600,3,p.accent+'a0');
 for(let i=0;i<28;i++){const x=20+i*59,w=11+i%4*9;rect(c,x,399+i%3*7,w,1.3,i%4?'#ba83f34a':'#ffc78066');rect(c,x+7,410+i%3*4,w*.6,1,p.accent+'3d');}
 rect(c,0,430,1600,14,'#333044');rect(c,0,430,1600,3,'#716478');rect(c,0,440,1600,5,'#181a2e');
 for(let x=28;x<1600;x+=117){rect(c,x,421,8,22,'#817b92');rect(c,x+2,422,2,10,p.soft+'9a');}
 line(c,[[0,422],[1600,422]],'#a398b2',2);line(c,[[0,427],[1600,427]],p.accent+'52',1.5);
}
function capital(c:Ctx,p:Palette){
 // Police civic complex sits beyond the canal, with an unbroken plaza foreground.
 for(const side of [-1,1]){
  const x=800+side*235-76;rect(c,x,197,152,192,'#242039');rect(c,x+12,186,128,14,'#4a3a5b');rect(c,x+20,174,112,10,'#1b1630');
  for(let row=0;row<4;row++)for(let col=0;col<4;col++){const xx=x+15+col*32,yy=217+row*35;rect(c,xx,yy,21,20,'#5a3781');rect(c,xx+2,yy+2,17,3,p.accent+'b0');rect(c,xx+2,yy+7,17,9,'#c6a4e12e');}
  rect(c,x+6,198,3,181,p.accent);rect(c,x+143,198,3,181,p.accent+'8f');
 }
 rect(c,641,235,318,153,'#322544');poly(c,[[626,236],[800,200],[974,236]],'#4e3860','#d998ed66',2);poly(c,[[651,231],[800,211],[948,231]],'#25182f');
 rect(c,633,240,334,12,'#795574');rect(c,651,254,298,119,'#2b213d');
 for(const x of [657,704,890,937]){rect(c,x,252,12,128,'#6b506b');rect(c,x,253,3,125,p.soft+'4d');}
 rect(c,727,301,146,79,'#151327');rect(c,732,306,136,65,'#4d306f');for(const x of [750,797,844])rect(c,x,309,2,62,'#d898ec7a');line(c,[[731,332],[868,332]],'#b578d36f',2);
 shield(c,800,266,24,'#f2d5ff','#42255d');haze(c,800,266,64,49,p.accent+'39');
 label(c,'POLÍCIA DE TWITCHCITY',800,292,11,'#f1d6fa');label(c,'CAPITAL',800,217,14,'#f9e4ff');
 for(let i=0;i<4;i++)rect(c,630-i*13,382+i*3,340+i*26,4,'#5d4c68');
 for(const x of [443,1157]){rect(c,x-28,344,56,45,'#27243b');shield(c,x,353,17,p.accent,'#16172a');flag(c,x-58,241,'#5b2879','★');streetLamp(c,x+56,389,p);}
 for(const x of [242,1358]){streetLamp(c,x,409,p);rect(c,x-34,406,69,9,'#4e405a');rect(c,x-28,411,7,12,'#20192b');rect(c,x+21,411,7,12,'#20192b');}
 bank(c,p);
 // A crossing bridge and its lights connect the two banks, rather than a flat backdrop.
 poly(c,[[764,430],[836,430],[815,393],[785,393]],'#74617e');for(let i=0;i<6;i++)line(c,[[782-i*3,399+i*5],[818+i*3,399+i*5]],'#c09bc43a',1);
 for(const x of [773,827])line(c,[[x,429],[x+(x<800?13:-13),394]],'#b088bb',3);
 for(const x of [114,1486]){rect(c,x-23,369,46,58,'#34223e');poly(c,[[x-32,369],[x+32,369],[x+20,356],[x-20,356]],'#705173');ellipse(c,x,354,26,18,'#792d63');ellipse(c,x-17,347,23,17,'#b8468d');ellipse(c,x+13,339,28,19,'#ce68b1');ellipse(c,x+25,354,20,16,'#8c3371');}
}
function military(c:Ctx,p:Palette){
 // Fortified training courtyard, comms tower and air-base hangars.
 rect(c,0,353,1600,87,'#1b2b3c');for(let x=0;x<1600;x+=103){rect(c,x,354,99,71,'#24384a');rect(c,x+3,357,93,4,'#3f6879');line(c,[[x+14,372],[x+83,372]],'#4d74815c',2);}
 for(const x of [346,946]){rect(c,x,236,308,146,'#233b4d');poly(c,[[x-19,239],[x+324,239],[x+285,207],[x+12,207]],'#324d5f','#81c5d76c',2);rect(c,x+22,264,264,115,'#102b3c');
  for(let k=0;k<10;k++)rect(c,x+27+k*25,269,20,106,k%2?'#1f3b4c':'#193343');rect(c,x+24,263,260,4,p.accent+'c0');line(c,[[x+22,291],[x+286,291]],'#5d9daf55',1);label(c,'SHOOTER',x+154,249,13,'#a7e9fa');
 }
 // Operations building: lit command windows and a substantial central emblem.
 rect(c,669,270,263,112,'#344859');rect(c,661,260,279,14,'#4e6c7c');rect(c,680,288,242,53,'#0b2b3c');
 for(let k=0;k<6;k++){rect(c,688+k*38,295,30,36,'#286b83');rect(c,692+k*38,299,3,27,'#70dfff6d');}
 rect(c,752,345,95,39,'#11293a');shield(c,800,239,27,p.soft,'#1b465e',false);label(c,'DISTRITO MILITAR',800,366,11,'#bbeeff');
 // Communications dish at the left and radar mast at the right.
 rect(c,238,158,11,226,'#425b68');line(c,[[204,382],[246,209],[284,382]],'#365260',5);
 c.save();c.translate(244,164);c.rotate(-.43);c.fillStyle='#5b7886';c.beginPath();c.ellipse(0,0,51,18,0,0,Math.PI);c.fill();line(c,[[-48,0],[47,0]],'#a1d7e0',3);line(c,[[0,5],[0,-21],[22,-37]],'#7da9b6',3);ellipse(c,24,-39,5,5,p.accent);c.restore();
 rect(c,1321,132,9,251,'#435b6d');for(let y=181;y<370;y+=29){line(c,[[1300,y],[1349,y+26],[1300,y+52]],'#365666',3);}
 line(c,[[1287,132],[1362,132]],'#7aa7b2',4);rect(c,1288,114,75,20,'#17374a');rect(c,1292,118,67,11,p.accent+'94');line(c,[[1325,114],[1325,89]],'#7ca6b3',2);
 for(const x of [97,1503]){streetLamp(c,x,431,p);rect(c,x-34,400,68,30,'#344a54');for(let k=0;k<4;k++)poly(c,[[x-33+k*18,401],[x-24+k*18,401],[x-36+k*18,428],[x-45+k*18,428]],'#d8b858');}
 for(const [x,y] of [[399,379],[1066,380],[1130,380]]){rect(c,x,y,57,42,'#35484c');rect(c,x+3,y+3,51,35,'#25363e');line(c,[[x+6,y+5],[x+50,y+35]],'#627d7c',3);line(c,[[x+50,y+5],[x+6,y+35]],'#627d7c',3);rect(c,x+23,y+14,12,12,p.accent+'6c');}
 rect(c,0,433,1600,13,'#374e5c');rect(c,0,434,1600,2,'#b3d7dd6b');line(c,[[0,442],[1600,442]],p.accent+'73',2);
 for(let x=40;x<1600;x+=120){rect(c,x,428,4,8,'#8cefff');rect(c,x-4,436,12,2,'#43c4f2aa');}
}
function roof(c:Ctx,x:number,y:number,w:number,p:Palette){
 poly(c,[[x-w*.56,y+13],[x-w*.42,y-2],[x,y-24],[x+w*.42,y-2],[x+w*.56,y+13],[x+w*.42,y+7],[x-w*.42,y+7]],'#281b34','#a67862',2);
 line(c,[[x-w*.53,y+9],[x+w*.53,y+9]],p.accent+'b0',2);
 for(let dx=-w*.39;dx<w*.4;dx+=15)line(c,[[x+dx,y-1-Math.max(0,1-Math.abs(dx)/(w*.42))*19],[x+dx*1.16,y+8]],'#a98e6f36',1);
}
function pagoda(c:Ctx,x:number,base:number,w:number,levels:number,p:Palette){
 for(let level=0;level<levels;level++){const ww=w*(1-level*.12),yy=base-level*45;rect(c,x-ww*.38,yy-43,ww*.76,44,'#463034');
  for(let k=0;k<6;k++){rect(c,x-ww*.34+k*ww*.12,yy-35,ww*.085,22,'#ffc766b8');rect(c,x-ww*.34+k*ww*.12,yy-35,ww*.085,3,'#fff1a26e');}
  for(const side of [-1,1])rect(c,x+side*ww*.34-3,yy-42,6,43,'#2c1d2d');roof(c,x,yy-44,ww,p);
 }line(c,[[x,base-levels*45-13],[x,base-levels*45-37]],'#deb67b',2);ellipse(c,x,base-levels*45-40,3,3,p.accent);
}
function conservator(c:Ctx,p:Palette){
 // The Senbukan complex rises above an amber-lit terraced district.
 poly(c,[[0,410],[0,342],[204,301],[405,330],[569,255],[744,280],[884,234],[1133,278],[1328,252],[1600,323],[1600,445]],'#282337');
 poly(c,[[554,398],[650,277],[812,266],[983,303],[1112,257],[1266,292],[1480,401]],'#3b3043');
 for(let i=0;i<6;i++){const y=309+i*19;line(c,[[610-i*13,y],[1056+i*35,y]],'#8c6b5c55',2);}
 pagoda(c,1092,328,217,3,p);pagoda(c,1237,345,154,2,p);pagoda(c,657,346,148,2,p);
 // Front gate frames the playable promenade without covering its centre.
 for(const x of [508,1092]){rect(c,x-17,242,34,194,'#5e3436');rect(c,x-13,247,6,181,'#b97657');rect(c,x-25,427,50,13,'#767082');}
 rect(c,476,241,648,20,'#572d35');roof(c,800,224,716,p);rect(c,728,221,144,66,'#33263c');line(c,[[733,227],[867,227],[867,281],[733,281],[733,227]],'#e6bd6c',2);label(c,'千武館',800,249,26,'#ffd584');label(c,'SENBUKAN',800,274,9,'#ebbf79');
 for(const x of [561,1039]){rect(c,x-3,261,6,64,'#3b2730');rect(c,x-20,306,40,45,'#49303c');rect(c,x-14,311,28,34,'#ffcc77');line(c,[[x-18,306],[x+18,306]],'#2b2330',5);line(c,[[x-18,351],[x+18,351]],'#2b2330',5);haze(c,x,331,68,63,p.accent+'29');}
 // Stone stairs and a low rail lead toward the gate. The rail stays behind feet.
 for(let i=0;i<6;i++)rect(c,690-i*18,376+i*8,220+i*36,7,i%2?'#887a7b':'#736575');
 for(const side of [-1,1]){const x=800+side*448;line(c,[[x,432],[x,353],[x+side*76,304]],'#4d3040',11);for(let j=0;j<13;j++){const xx=x+Math.sin(j*2.1)*68,yy=292+(j%4)*18;ellipse(c,xx,yy,27+(j%3)*5,17,['#9a416d','#d16b9e','#bc578b'][j%3]);}line(c,[[x,435],[x+side*56,348]],'#694052',8);}
 rect(c,0,434,1600,13,'#6c5a65');rect(c,0,434,1600,3,'#a68a8c');
 for(let x=68;x<1600;x+=112){rect(c,x,402,7,31,'#563a46');rect(c,x-4,398,15,5,'#bf965d');}line(c,[[0,407],[1600,407]],'#6d4c54',5);line(c,[[0,421],[1600,421]],'#4d3545',3);
}
function floor(c:Ctx,id:TrainingStageId,w:number){
 const p=PALETTES[id],military=id==='twitchcity-military',warm=id==='twitchcity-conservator';
 gradient(c,w,150,warm?'#6e5861':military?'#384654':'#42374f',warm?'#30293b':military?'#172431':'#1b192d');
 rect(c,0,0,w,3,'#0f1021');rect(c,0,4,w,1,p.soft+'75');
 const rows=[0,15,36,67,108,150];
 for(let row=0;row<rows.length-1;row++){line(c,[[0,rows[row]],[w,rows[row]]],'#11132166',1.3);for(let i=-12;i<25;i++){const x=i*(military?140:95)+(row%2?47:0);line(c,[[800+(x-800)*(1+rows[row]/310),rows[row]],[800+(x-800)*(1+rows[row+1]/310),rows[row+1]]],'#0b12234f',1);}}
 haze(c,460,55,320,79,p.accent+'24');haze(c,1140,41,290,70,p.secondary+'24');
 for(let i=0;i<17;i++){const x=38+i*95,y=29+i%4*23;rect(c,x,y,30+i%3*11,1,p.soft+'19');}
 if(military){for(let x=0;x<w;x+=105)rect(c,x,97,51,3,'#d5d19b60');line(c,[[735,12],[865,12],[930,119],[670,119],[735,12]],'#7dc8df45',1.8);ellipse(c,800,61,52,15,'#7ac9d714');label(c,'03',800,64,18,'#a1dce344');}
 else if(warm){c.strokeStyle='#e0b66b4f';c.lineWidth=1.8;for(const r of [27,35]){c.beginPath();c.ellipse(800,48,r*2.2,r*.6,0,0,TAU);c.stroke();}line(c,[[778,46],[825,46],[811,35],[803,62]],'#ffd58d42',2);}
 else {c.save();c.translate(800,46);c.scale(1,.38);shield(c,0,0,48,'#e4beff3d','#56446613');c.restore();for(const x of [100,1450])line(c,[[x,22],[x+48,22],[x+66,37]],p.accent+'58',2);}
}

/** Bake layers once. Coordinates: world1600×540; floor asset150px begins at y448. */
export function buildTrainingCityScene(id:string,w=1600,h=540,density=1):TrainingCityScene|null{
 if(!isCity(id))return null;const p=PALETTES[id],sky=layerCanvas(960,h,density),sc=sky.getContext('2d')!;
 sc.save();sc.scale(1,h/540);gradient(sc,960,540,p.night,id==='twitchcity-military'?'#18364c':'#40234d');
 const stars=random(814+TRAINING_STAGE_IDS.indexOf(id)*37);for(let i=0;i<88;i++){const a=.16+stars()*.48;sc.globalAlpha=a;rect(sc,stars()*960,12+stars()*220,i%7?1:1.5,i%7?1:1.5,'#eadbff');}sc.globalAlpha=1;
 haze(sc,732,102,95,92,p.accent+'24');ellipse(sc,732,91,26,26,id==='twitchcity-conservator'?'#ffe6be':'#e5d7ff');ellipse(sc,723,86,25,25,id==='twitchcity-military'?'#0f2136':'#211438');
 for(let i=0;i<4;i++){sc.fillStyle=p.accent+'09';sc.beginPath();sc.ellipse(210+i*231,115+i%2*43,160,14,-.11,0,TAU);sc.fill();}sc.restore();
 const mountains=layerCanvas(w,h,density),mc=mountains.getContext('2d')!,hall=layerCanvas(w,h,density),hc=hall.getContext('2d')!,ground=layerCanvas(w,150,density),fc=ground.getContext('2d')!;
 mc.save();mc.scale(w/1600,h/540);skyline(mc,p,8219+TRAINING_STAGE_IDS.indexOf(id)*179);mc.restore();
 hc.save();hc.scale(w/1600,h/540);if(id==='twitchcity-capital')capital(hc,p);else if(id==='twitchcity-military')military(hc,p);else conservator(hc,p);hc.restore();
 fc.save();fc.scale(w/1600,1);floor(fc,id,1600);fc.restore();return {sky,mountains,hall,floor:ground};
}

/** Tiny animated overlay; draw within Stage's architecture parallax transform. */
export function drawCityAmbient(c:Ctx,id:string,time:number,camX=800){
 if(!isCity(id))return;const p=PALETTES[id],t=time/60;c.save();
 if(id==='twitchcity-capital'){
  // Distant traffic on the elevated expressway, plus slow reflections in the canal.
  for(let i=0;i<3;i++){const x=((t*25+i*579)%1800)-90;rect(c,x,333,20,4,'#cdb0ed');rect(c,x+17,334,3,2,'#ffbec5');rect(c,x-5,334,4,1,p.soft+'66');}
  for(let i=0;i<11;i++){const x=60+i*142+Math.sin(t*.55+i)*9,y=401+i%4*6;line(c,[[x,y],[x+16+Math.sin(t*1.2+i)*6,y]],p.accent+'45',1.2);}
  c.globalAlpha=.28+Math.sin(t*.8)*.09;line(c,[[635,242],[965,242]],'#e9b8ff',2);c.globalAlpha=1;
  const x=1330+Math.sin(t*.18)*89,y=100+Math.sin(t*.54)*7;poly(c,[[x-13,y],[x+12,y],[x+5,y+4],[x-7,y+4]],'#30243e');ellipse(c,x-6,y+4,2.2,1,p.accent);ellipse(c,x+6,y+4,2.2,1,'#d8b5ff');
 }else if(id==='twitchcity-military'){
  const angle=t*.58;c.save();c.translate(1325,124);c.strokeStyle='#8beaff67';c.lineWidth=1.4;c.beginPath();c.arc(0,0,39,Math.PI,TAU);c.stroke();c.beginPath();c.moveTo(0,0);c.arc(0,0,36,angle,angle+.26);c.closePath();c.fillStyle='#5edcff18';c.fill();c.restore();
  for(let i=0;i<3;i++){const x=270+i*501,y=179+(i%2)*47;ellipse(c,x,y,2.6,2.6,Math.sin(t*2.5+i)>-.35?'#ff7e886e':'#eb788a19');}
  const x=((t*18)%1920)-160,y=112+Math.sin(t*.35)*4;line(c,[[x-8,y],[x+8,y]],'#b6e7f1',2);poly(c,[[x,y-3],[x+18,y+2],[x+5,y+6],[x-12,y+2]],'#243947');rect(c,x-10,y+4,4,1,p.accent);
 }else{
  for(let i=0;i<7;i++){const phase=(t*.055+i*.143)%1,x=185+i*195+Math.sin(t*.5+i)*22,y=175+phase*248;c.save();c.translate(x,y);c.rotate(t*.5+i);ellipse(c,0,0,3.2,1.7,i%2?'#ffbad07a':'#c775a3a0');c.restore();}
  for(const x of [561,1039]){c.globalAlpha=.24+Math.sin(t*1.6+x)*.055;ellipse(c,x,330,22,31,'#ffc66e');}c.globalAlpha=1;
 }
 // A single dim scan at the far skyline gives depth without covering combatants.
 const sx=800+(camX-800)*.08+Math.sin(t*.13)*280;c.fillStyle=p.accent+'09';c.beginPath();c.moveTo(sx,310);c.lineTo(sx-35,62);c.lineTo(sx+13,62);c.closePath();c.fill();c.restore();
}
