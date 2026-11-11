import type {CharId,Move} from './data';
export type AccessoryId='katana'|'guitar'|'screwdriver'|'spray';
export const ACCESSORY_STYLES:Partial<Record<CharId,{id:AccessoryId;name:string;allNormals:boolean}>>={
 ulisses:{id:'katana',name:'Katana Rakuyo',allNormals:true},
 felipence:{id:'guitar',name:'Guitarra',allNormals:true},
 bieu:{id:'screwdriver',name:'Chave de fenda',allNormals:false},
 aneninha:{id:'spray',name:'Lata de spray',allNormals:false},
};
const NAMES:Partial<Record<CharId,Record<string,string>>>={
 ulisses:{pL:'Corte Rápido',pM:'Corte Cruzado',pH:'Corte Descendente',kL:'Golpe de Cabo',kM:'Corte de Retorno',kH:'Corte Ascendente',cP:'Corte Baixo',cK:'Varredura de Lâmina',jP:'Corte Aéreo',jK:'Queda da Lâmina'},
 felipence:{pL:'Batida de Guitarra',pM:'Varredura de Guitarra',pH:'Quebra Acorde',kL:'Toque do Braço',kM:'Balanço da Guitarra',kH:'Guitarra Ascendente',cP:'Riff Rasteiro',cK:'Varredura do Corpo',jP:'Riff Aéreo',jK:'Queda da Guitarra'},
 bieu:{pL:'Cabo da Chave',pM:'Chave Cruzada',pH:'Chave de Impacto',cP:'Chave Rasteira',jP:'Chave Aérea'},
 aneninha:{pL:'Batida de Lata',pM:'Lata Cruzada',pH:'Lata de Impacto',cP:'Lata Rasteira',jP:'Lata Aérea'},
};
/** Weapons change the authored animation/material of normals, never grant an
 * invisible extra hit, projectile, invulnerability or free range. */
export function applyAccessoryNormals(ch:CharId,moves:Record<string,Move>){
 const style=ACCESSORY_STYLES[ch];if(!style)return;
 for(const m of Object.values(moves))if(m.kind==='normal'&&!m.grab&&m.id!=='headbutt'&&(style.allNormals||/^(p[LMH]|cP|jP)$/.test(m.id))){m.accessory=style.id;m.label=NAMES[ch]?.[m.id]??m.label;}
}
/** Active-frame-only material trails. Geometry/damage is still the move's box. */
export function drawAccessoryNormal(c:CanvasRenderingContext2D,m:Move,frame:number){
 if(!m.accessory||frame<m.startup||frame>=m.startup+m.active)return;
 const x=Math.max(20,m.hb[1]*(m.rangeScale??1)),y=-(m.hb[2]+m.hb[3])*.5,progress=(frame-m.startup+.5)/Math.max(1,m.active);
 c.save();c.lineCap='round';c.lineJoin='round';c.globalAlpha*=.85;
 if(m.accessory==='katana'){
  c.beginPath();c.moveTo(x*.22,y-19+progress*7);c.quadraticCurveTo(x*.95,y-31,x,y+11);c.strokeStyle='#bdedf6';c.lineWidth=4+m.rank;c.stroke();c.strokeStyle='#fff9eb';c.lineWidth=1.4;c.stroke();
 }else if(m.accessory==='guitar'){
  c.strokeStyle='#ffb453';c.lineWidth=2;c.beginPath();c.arc(x-8,y,13+progress*10,-1.1,1.1);c.stroke();c.beginPath();c.moveTo(x-9,y-10);c.lineTo(x-9,y+5);c.moveTo(x-9,y-10);c.lineTo(x+2,y-13);c.stroke();c.fillStyle='#ffe0a0';c.beginPath();c.ellipse(x-12,y+6,4,2,-.2,0,Math.PI*2);c.fill();
 }else{
  c.strokeStyle=m.accessory==='spray'?'#f8a5ce':'#daeaf3';c.lineWidth=1.5;for(let i=0;i<3;i++){c.beginPath();c.moveTo(x-9,y-4+i*4);c.lineTo(x+2+i*2,y-9+i*7);c.stroke();}
 }
 c.restore();
}
