// War of Champions model sheets translated into original articulated anime art.
// This module paints only. Joint poses, frame data, collision and resources live elsewhere.
import type {CharId,Pose} from './data';
import type {DrawOpts,P2,Rig} from './rig';
type C=CanvasRenderingContext2D;
type Style={skin:string;shadow:string;light:string;hair:string;hairLight:string;eye:string;cloth:string;dark:string;accent:string;pants:string;shoe:string;head:number;shoulder:number;waist:number;arms:'skin'|'short'|'long';leg:'pants'|'shorts'|'skirt';haircut:'spike'|'curl'|'shag'|'long'|'fringe'|'bald'|'swept'};
const ink='#16131c',ivory='#fff3df';
const base:Style={skin:'#e7b18b',shadow:'#af745f',light:'#ffdbc0',hair:'#32232a',hairLight:'#785044',eye:'#a77955',cloth:'#22232b',dark:'#10141d',accent:'#b38be5',pants:'#24222c',shoe:'#1e2028',head:12.7,shoulder:24,waist:15,arms:'long',leg:'pants',haircut:'shag'};
const styles:Record<string,Style>={
 rickzera:{...base,skin:'#edb785',shadow:'#b77d59',light:'#ffdeb5',hair:'#eeb966',hairLight:'#ffe6a3',eye:'#76b83c',cloth:'#202323',dark:'#101619',accent:'#83de49',pants:'#c6ac7d',shoe:'#171c20',arms:'short',haircut:'spike',shoulder:24},
 caetano:{...base,skin:'#d6935e',shadow:'#9d573d',light:'#f2bc7f',hair:'#392522',hairLight:'#7b4b37',eye:'#6c3c26',cloth:'#e6e0d7',pants:'#efebe1',dark:'#77767b',accent:'#ed8c32',shoe:'#d6935e',arms:'skin',haircut:'curl',shoulder:25},
 bieu:{...base,skin:'#ce966f',shadow:'#9f5f4b',light:'#efbd90',hair:'#302024',hairLight:'#704335',eye:'#62432f',cloth:'#ede8e6',dark:'#b0a1a4',accent:'#36b6da',pants:'#29252b',shoe:'#eee9e6',arms:'skin',haircut:'curl',shoulder:23},
 nomad:{...base,skin:'#e2a275',shadow:'#a7634d',light:'#ffcca0',hair:'#d7b476',hairLight:'#ffe1a4',eye:'#88763b',cloth:'#689b3a',dark:'#1c3b2e',accent:'#ae71f4',pants:'#254b37',shoe:'#26312c',head:13.8,shoulder:27,waist:19,arms:'short',haircut:'spike'},
 renngotti:{...base,skin:'#d9a17c',shadow:'#9f664f',light:'#f3c8a5',hair:'#252427',hairLight:'#54515b',eye:'#463b37',cloth:'#f2efeb',dark:'#ada9b5',accent:'#a7a3aa',pants:'#e7e4e2',shoe:'#eae5e0',head:13.5,shoulder:25,waist:17,haircut:'spike'},
 aneninha:{...base,skin:'#e1aa85',shadow:'#aa6959',light:'#ffd0a7',hair:'#973d2b',hairLight:'#df7a4c',eye:'#b25247',cloth:'#e26c98',dark:'#843554',accent:'#ffc2d5',pants:'#28232a',shoe:'#dc6d95',head:12.8,shoulder:21,waist:14,haircut:'long'},
 santox:{...base,skin:'#e9ba95',shadow:'#ab7b6c',light:'#ffdec0',hair:'#64355f',hairLight:'#b05a9e',eye:'#d8ab4d',cloth:'#613369',dark:'#301e42',accent:'#d3b4e5',pants:'#252430',shoe:'#e7dee9',head:13,shoulder:24,waist:15,leg:'shorts',haircut:'spike'},
 jao:{...base,skin:'#d99664',shadow:'#9b5c43',light:'#f9c798',hair:'#282120',hairLight:'#64503b',eye:'#654b36',cloth:'#27202c',dark:'#121320',accent:'#b69ae4',pants:'#25202a',shoe:'#e7e3e2',head:12.5,shoulder:23,haircut:'curl'},
 jane:{...base,skin:'#f2c4a2',shadow:'#c18e76',light:'#ffe2bd',hair:'#e7bd5a',hairLight:'#ffe598',eye:'#9d763f',cloth:'#f1eee4',dark:'#b4afb3',accent:'#efc326',pants:'#242631',shoe:'#ece8d7',head:10.8,shoulder:13.5,waist:9,haircut:'fringe'},
 cristyan:{...base,skin:'#b3784d',shadow:'#7c4530',light:'#dca16c',hair:'#292320',hairLight:'#62442c',eye:'#5e422c',cloth:'#242127',dark:'#11151d',accent:'#e2b344',pants:'#272329',shoe:'#b3784d',head:12.8,shoulder:26,waist:16,arms:'skin',leg:'shorts',haircut:'curl'},
 eneas:{...base,skin:'#e2b18a',shadow:'#aa785d',light:'#f6d1ae',hair:'#292727',hairLight:'#5f5b51',eye:'#63563f',cloth:'#2c2b30',dark:'#141922',accent:'#e1c844',pants:'#282a30',shoe:'#191d22',head:14,shoulder:26,waist:18,haircut:'bald'},
 patrick:{...base,skin:'#e6b695',shadow:'#ac7d6d',light:'#ffdec6',hair:'#352d2c',hairLight:'#73554b',eye:'#7e4540',cloth:'#493837',dark:'#271f25',accent:'#b14242',pants:'#3d3032',shoe:'#30262b',head:12.8,shoulder:26,waist:17,haircut:'swept'},
 gabrielzin:{...base,skin:'#f0c3aa',shadow:'#bb887f',light:'#ffe3cb',hair:'#513439',hairLight:'#95634e',eye:'#ca6b91',cloth:'#373039',dark:'#181b27',accent:'#ed8bb5',pants:'#ba638c',shoe:'#e4c9d8',head:12.3,shoulder:19,waist:13,leg:'skirt',haircut:'shag'},
 ulisses:{...base,skin:'#e4c5b8',shadow:'#ac8891',light:'#ffeddb',hair:'#30252d',hairLight:'#6b4650',eye:'#b74b52',cloth:'#722737',dark:'#311d29',accent:'#c66a70',pants:'#28222d',shoe:'#1a1b26',head:13,shoulder:25,waist:16,haircut:'long'},
 felipence:{...base,skin:'#deb18f',shadow:'#a47b67',light:'#f8d5af',hair:'#432e26',hairLight:'#8a5740',eye:'#b6864c',cloth:'#292329',dark:'#12151f',accent:'#ec9650',pants:'#28232b',shoe:'#21232b',head:13,shoulder:24,waist:15,haircut:'shag'},
 hdsh:{...base,skin:'#ddb28f',shadow:'#a57666',light:'#f6d8b8',hair:'#5d3039',hairLight:'#a45854',eye:'#aa8f71',cloth:'#573763',dark:'#2c243c',accent:'#e0b645',pants:'#403048',shoe:'#766082',head:13,shoulder:24,waist:16,haircut:'spike'},
 tubarao:{...base,skin:'#e6e8df',shadow:'#abb9be',light:'#f5f4e9',hair:'#35445c',hairLight:'#61738b',eye:'#8ca7bb',cloth:'#3a4e66',dark:'#243046',accent:'#8bb2ca',pants:'#34495f',head:18,shoulder:32,waist:19,arms:'skin'},
 orango:{...base,skin:'#825341',shadow:'#513229',light:'#c18d66',hair:'#db592d',hairLight:'#ff9b4d',eye:'#ad712c',cloth:'#c94e25',dark:'#6a2f22',accent:'#ed9663',pants:'#bd4b28',head:19,shoulder:38,waist:23,arms:'skin'},
};
const FORM_EYES:Record<string,string>={rickzera:'#aff43c',caetano:'#f8ab41',bieu:'#d358dc',nomad:'#ba7de9',renngotti:'#e87876',aneninha:'#f18baa',santox:'#edd16f',jao:'#b785ef',jane:'#7be6d5',cristyan:'#eec251',eneas:'#8ac768',patrick:'#d88c8c',gabrielzin:'#f092ba',ulisses:'#e35270',felipence:'#f4ab4b',hdsh:'#b688ed',orango:'#c7a0ee',tubarao:'#84b8ce'};
const S=(ch:CharId)=>styles[ch]||base;
const mix=(a:P2,b:P2,t:number):P2=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
const xy=(x:number,y:number):P2=>({x,y});
const shade=(color:string,k=.7)=>/^#[0-9a-f]{6}$/i.test(color)?'#'+[1,3,5].map(i=>Math.round(parseInt(color.slice(i,i+2),16)*k).toString(16).padStart(2,'0')).join(''):color;
function polygon(c:C,pts:P2[],fill:string,edge=ink,w=1.2){c.beginPath();c.moveTo(pts[0].x,pts[0].y);for(const p of pts.slice(1))c.lineTo(p.x,p.y);c.closePath();c.fillStyle=fill;c.fill();if(w){c.strokeStyle=edge;c.lineWidth=w;c.lineJoin='round';c.stroke()}}
function poly(c:C,pts:number[][],fill:string,edge=ink,w=1.2){polygon(c,pts.map(p=>xy(p[0],p[1])),fill,edge,w)}
function line(c:C,pts:P2[],color=ink,w=1){c.beginPath();c.moveTo(pts[0].x,pts[0].y);for(const p of pts.slice(1))c.lineTo(p.x,p.y);c.strokeStyle=color;c.lineWidth=w;c.lineCap='round';c.lineJoin='round';c.stroke()}
function oval(c:C,x:number,y:number,rx:number,ry:number,fill:string,stroke='',w=1,rot=0){c.beginPath();c.ellipse(x,y,Math.max(.05,rx),Math.max(.05,ry),rot,0,Math.PI*2);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke()}}
function text(c:C,value:string,x:number,y:number,size:number,color:string,weight=800){c.font=`${weight} ${size}px sans-serif`;c.textAlign='center';c.fillStyle=color;c.fillText(value,x,y)}
function axes(p:Rig['p']){const h=p.hip,n=p.neck,L=Math.hypot(n.x-h.x,n.y-h.y)||1,up=xy((n.x-h.x)/L,(n.y-h.y)/L),side=xy(-up.y,up.x);return {at:(t:number,w:number)=>xy(h.x+(n.x-h.x)*t+side.x*w,h.y+(n.y-h.y)*t+side.y*w),up,side,L}}
function segment(c:C,a:P2,b:P2,r0:number,r1:number,color:string,dark:string,light:string,cloth=false){
 const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;c.save();c.translate(a.x,a.y);c.rotate(Math.atan2(dy,dx));
 const outline=()=>{c.beginPath();c.moveTo(-1,-r0);c.bezierCurveTo(len*.22,-r0*1.18,len*.65,-r1*.8,len,-r1);c.quadraticCurveTo(len+r1*.48,0,len,r1);c.bezierCurveTo(len*.58,r1*1.2,len*.25,r0*.84,-1,r0);c.quadraticCurveTo(-r0*.45,0,-1,-r0);c.closePath()};outline();c.fillStyle=color;c.fill();c.save();c.clip();
 poly(c,[[-r0,0],[len*.3,-r0*.1],[len*.68,r1*.45],[len+r1,-r1*.1],[len+r1,r1*2],[-r0,r0*2]],dark,'',0);
 if(cloth){poly(c,[[len*.16,-r0*.9],[len*.35,-r0*.25],[len*.58,-r1*.8],[len*.41,-r1*.56]],light,'',0);line(c,[xy(len*.72,-r1*.75),xy(len*.55,r1*.55),xy(len*.81,r1*.2)],dark,.65)}else {line(c,[xy(len*.2,-r0*.55),xy(len*.48,-r0*.78),xy(len*.7,-r1*.48)],light,1.2);line(c,[xy(len*.66,r1*.43),xy(len*.83,0)],dark,.7)}
 c.restore();outline();c.strokeStyle=ink;c.lineWidth=1.15;c.stroke();c.restore();
}
function glove(c:C,e:P2,w:P2,s:Style,pose:Pose,front:boolean,white=false,cat=false){
 const angle=Math.atan2(w.y-e.y,w.x-e.x);c.save();c.translate(w.x,w.y);c.rotate(angle);const skin=white?'#ece8de':s.skin,shadow=white?'#a7a5b2':s.shadow;
 // Palm, four curled knuckles, thumb joint and nail planes are independently drawn.
 poly(c,[[-3,-3],[1,-4.6],[7,-3.8],[9,-.5],[8,3.2],[3,4.1],[-2,2.5]],skin,ink,.8);
 for(let i=0;i<4;i++){const y=-3.2+i*1.9;line(c,[xy(4,y),xy(7.8,y+.25)],shadow,.7);if(i<3)line(c,[xy(4.5,y+.9),xy(5.2,y+1.5)],shadow,.4)}
 oval(c,1.3,3.1,3.2,1.8,skin,ink,.6,-.4);line(c,[xy(.8,2),xy(3,1.4),xy(5,2)],shadow,.5);
 if(front&&pose.finger>.5){segment(c,xy(6,-2.6),xy(21,-3),1.7,1.2,skin,shadow,s.light);line(c,[xy(12,-3.7),xy(12,-2.1)],shadow,.5)}
 if(cat){oval(c,5,0,10.2,8.4,'#e9cda4',ink,1);oval(c,6,1,4.4,3.4,'#d77e9d');for(let i=0;i<3;i++)oval(c,9-i*3,-4.7,1.6,1.9,'#d77e9d')}
 c.restore();
}
function shoe(c:C,a:P2,t:P2,s:Style,bare:boolean,boots=false,back=false){
 const u=xy(t.x-a.x,t.y-a.y),ang=Math.atan2(u.y,u.x);c.save();c.translate(a.x,a.y);c.rotate(ang);const fill=bare?s.skin:back?s.dark:s.shoe;
 poly(c,[[-5,-6],[4,-6],[10,-3],[19,-2.5],[21,1.8],[18,4.7],[-4,4.7]],fill,ink,1.1);poly(c,[[-4,2.8],[11,2.6],[20,.6],[20,3.7],[-4,4.7]],bare?s.shadow:'#a9a4a9','',0);
 if(bare){for(let i=0;i<4;i++)line(c,[xy(13+i*1.6,-1.4),xy(13.8+i*1.4,1.3)],s.shadow,.55)}else {for(let i=0;i<3;i++)line(c,[xy(1+i*2.1,-4),xy(4+i*2.1,.2)],'#eee6d7',.85);line(c,[xy(10,-1),xy(15,.7),xy(18,-.5)],s.accent,1.2);if(boots){for(let i=0;i<2;i++){c.strokeStyle='#a2a0a5';c.lineWidth=.7;c.strokeRect(-4,-6+i*4,6,2.5)}}}
 c.restore();
}
function hair(c:C,s:Style,ch:CharId,o:DrawOpts,back=false){
 const wobble=Math.sin(o.time*.065)*.35,bright=o.transformation&&ch==='rickzera',fill=bright?'#b7ef3f':o.transformation&&ch==='bieu'?'#218ddd':s.hair,light=bright?'#efff95':o.transformation&&ch==='bieu'?'#7ae8ff':s.hairLight;
 if(s.haircut==='bald')return;
 if(ch==='aneninha'&&back){
  for(let side=-1;side<=1;side+=2)for(let i=0;i<7;i++){
   const x=side*(10+Math.sin(i*1.6)*1.5),y=-8+i*4.4+Math.sin(o.time*.075+i)*.25;
   oval(c,x,y,3.5,4,fill,ink,.65);c.beginPath();c.arc(x+.5,y-.2,2.2,-2.8,1.6);c.strokeStyle=light;c.lineWidth=.6;c.stroke();
  }
  return;
 }
 if(back&&(['long','fringe','shag'].includes(s.haircut))){
  poly(c,[[-10,-11],[-14,-7],[-15,4],[-13+wobble,13],[-16,20],[-10,18],[-7,24],[-5,16],[4,19],[7,13],[6,-3]],fill,ink,.95);
  for(let i=0;i<4;i++)line(c,[xy(-12+i*3,-3),xy(-13+i*3,9),xy(-11+i*3+wobble,17)],light,.7);
  if(s.haircut!=='long'&&s.haircut!=='fringe')return;
 }
 if(back)return;
 if(s.haircut==='curl'){
  for(let j=0;j<3;j++)for(let i=0;i<5;i++){
   const x=-10+i*4.2+(j%2)*1.5,y=-9-j*2.2-Math.sqrt(Math.max(0,1-((i-2)/3)**2))*3;
   oval(c,x,y,3.1,2.9,fill,ink,.65);c.beginPath();c.arc(x+.4,y-.4,1.6,-2.6,.7);c.strokeStyle=light;c.lineWidth=.65;c.stroke();
  }
  poly(c,[[-12,-11],[-10,-3],[-8,-7],[-7,-10]],fill,ink,.5);return;
 }
 if(s.haircut==='swept'){
  poly(c,[[-12,-1],[-14,-10],[-10,-16],[-1,-18],[8,-13],[12,-9],[6,-7],[10,-4],[3,-7],[-1,-13],[-7,-7],[-9,2]],fill);
  for(let i=0;i<4;i++)line(c,[xy(-11+i*3,-12),xy(-6+i*2,-15),xy(1+i*2,-11)],light,.85);return;
 }
 if(s.haircut==='fringe'){
  poly(c,[[-12,0],[-13,-11],[-8,-17],[1,-18],[9,-13],[12,-4],[9,-5],[7,-11],[8,-3],[3,-5],[1,-12],[0,-3],[-4,-6],[-5,-12],[-7,-4],[-9,-1],[-9,11],[-13,14]],fill);
  for(const x of [-8,-3,2,6])line(c,[xy(x-2,-14),xy(x,-7)],light,.8);return;
 }
 const long=s.haircut==='shag';
 const pts=[[-13,3],[-15,-4],[-12,-6],[-15,-10],[-10,-10],[-12,-16],[-6,-14],[-3,-19],[0,-16],[6,-18],[5,-14],[12,-13],[9,-10],[15,-8],[9,-6],[11,-3],[5,-5],[3,-11],[0,-5],[-3,-9],[-6,-4],[-8,-7],[-10,long?5:0]];
 poly(c,pts.map(([x,y])=>[x+(y<0?wobble*.3:wobble),y]),fill);
 for(const p of [[-10,-12,-7,-9],[-5,-15,-2,-10],[2,-15,5,-11],[7,-11,9,-8]])line(c,[xy(p[0],p[1]),xy(p[2],p[3])],light,.95);
}
function eye(c:C,x:number,y:number,width:number,s:Style,o:DrawOpts,far=false){
 const blink=o.expr!=='shout'&&o.time%193>187,angry=o.expr==='hit'||o.expr==='shout',open=o.expr==='shout'?1.6:1;
 if(blink){line(c,[xy(x-width*.5,y),xy(x,y+.8),xy(x+width*.5,y-.6)],ink,1);return;}
 c.save();c.translate(x,y);c.scale(width/7,open);
 poly(c,[[-3.6,-.6],[-.6,-2.1],[3.4,-1.1],[2.2,1.5],[-1.2,1.8]],'#f8f3e9',ink,.65);
 const transformed=o.transformation||(o.glow??0)>.1,iris=transformed?(o.glowColor||s.accent):s.eye;
 oval(c,.9,-.1,1.3,1.7,iris);oval(c,1.15,-.15,.5,1.25,'#171821');oval(c,.55,-.95,.35,.45,'#fff8e3');
 line(c,[xy(-3.8,-.9),xy(-.8,-2.15),xy(3.6,-1.15)],ink,far?.65:1);
 if(angry)line(c,[xy(-3.3,-4),xy(3.7,-2.6)],s.hair,1.3);else line(c,[xy(-3.3,-4.3),xy(1.8,-4.8),xy(3.8,-3.1)],s.hair,1.35);
 c.restore();
}
export function animeHead(c:C,ch:CharId,r:number,o:DrawOpts){
 const s=S(ch);c.save();c.scale(r/12.7,r/12.7);
 if(ch==='tubarao'){sharkHead(c,s,o);c.restore();return;}
 if(ch==='orango'){primateHead(c,s,o);c.restore();return;}
 if(ch==='santox'&&o.transformation){rabbitHead(c,o);c.restore();return;}
 if(ch==='jane'&&o.transformation){robotHead(c,o);c.restore();return;}
 hair(c,s,ch,o,true);
 if(ch==='aneninha'||ch==='gabrielzin'&&o.transformation){
  const cat=ch==='gabrielzin',fill=cat?'#dec394':s.cloth;
  poly(c,[[-14,10],[-16,-6],[-12,-17],[1,-21],[13,-16],[17,-2],[13,13],[9,7],[11,-6],[5,-13],[-6,-12],[-10,-1],[-9,9]],fill,ink,1.2);
  if(cat){poly(c,[[-13,-14],[-16,-26],[-4,-19]],fill);poly(c,[[8,-18],[18,-25],[16,-9]],fill);poly(c,[[-12,-17],[-13,-23],[-7,-18]],'#d5949c','',0);poly(c,[[12,-18],[16,-22],[14,-13]],'#d5949c','',0)}
 }
 // Draw the jaw, ear, forehead and neck as a single anatomical silhouette.
 c.beginPath();c.moveTo(-8,-12);c.quadraticCurveTo(-2,-15,1,-14);c.quadraticCurveTo(8,-12,9,-9);c.lineTo(10,-1);c.lineTo(13,3);c.lineTo(9.8,5.1);c.quadraticCurveTo(10,9,9.1,11);c.lineTo(4,15);c.quadraticCurveTo(-1,14,-2,13);c.quadraticCurveTo(-7,9,-7,7);c.quadraticCurveTo(-11,1,-10,.7);c.closePath();c.fillStyle=s.skin;c.fill();c.strokeStyle=ink;c.lineWidth=.9;c.stroke();
 poly(c,[[-8,-8],[-3,-5],[-5,4],[.4,9],[5,13],[4,15],[-3,12],[-8,7],[-11,-2]],s.shadow,'',0);
 poly(c,[[-4,-10],[4,-11],[8,-8],[6,-3],[1,-2]],s.light,'',0);
 oval(c,-8.7,1.7,3,4.3,s.skin,ink,.7);line(c,[xy(-9.7,.1),xy(-7.5,-.2),xy(-7.1,2.4),xy(-8.5,3)],s.shadow,.7);
 const eyes=o.transformation?{...o,glowColor:FORM_EYES[ch]}:o;eye(c,-.9,-1.2,4.4,s,eyes,true);eye(c,6.2,-.5,6.6,s,eyes);
 line(c,[xy(8.8,.2),xy(8,3.9),xy(10.7,4.7),xy(8.5,5.5)],s.shadow,.7);
 if(o.expr==='shout'){
  c.beginPath();c.moveTo(0,7.6);c.quadraticCurveTo(4.5,6.3,8,7.1);c.lineTo(6.5,12.2);c.quadraticCurveTo(3.7,13.5,1.6,10.8);c.closePath();c.fillStyle='#49232f';c.fill();c.strokeStyle=ink;c.lineWidth=.65;c.stroke();poly(c,[[1,7.7],[7.1,7.5],[6.6,9],[2,9.2]],ivory,'',0);oval(c,4.8,11.8,1.8,.6,'#c47980');
 }else if(o.expr==='hit')line(c,[xy(.6,9.7),xy(3.2,8.6),xy(6.8,9.3)],ink,.8);
 else if(ch==='gabrielzin'||ch==='santox'||ch==='ulisses'||ch==='nomad'){
  c.beginPath();c.moveTo(.1,8);c.quadraticCurveTo(5,9.8,8.8,6.6);c.quadraticCurveTo(5,12,1.5,10);c.closePath();c.fillStyle='#5e3035';c.fill();c.strokeStyle=ink;c.lineWidth=.5;c.stroke();poly(c,[[1,8.4],[7.8,7.7],[6.8,9.3],[2.5,9.6]],ivory,'',0);
  if(ch==='ulisses')poly(c,[[7,8],[5.7,10.4],[5.5,8.5]],'#fff7de','',0);
 }else line(c,[xy(1.5,9),xy(5.1,8.8),xy(7.8,8.3)],ink,.75);
 line(c,[xy(1.8,11.9),xy(4.6,12.3)],s.shadow,.6);
 if(['rickzera','bieu','nomad','renngotti','hdsh','felipence','jao'].includes(ch)){
  for(let i=0;i<5;i++)line(c,[xy(-.7+i*1.2,11),xy(-.5+i*1.2,11.9)],s.hair,.35);if(ch==='bieu'||ch==='renngotti')poly(c,[[1.3,12.3],[4,13.6],[5.9,12.1],[4.2,14.1],[2.3,14]],s.hair,'',0);
 }
 if(ch==='eneas'){
  poly(c,[[-9,5],[-5,7],[-1,6],[1,8],[6.5,6.5],[9,8],[7,15],[5,17],[2,17.6],[0,20],[-3,17.5],[-6,18],[-7,14],[-10,12]],s.hair,ink,.6);
  for(let i=0;i<5;i++)line(c,[xy(-8+i*3,9),xy(-7+i*3,14),xy(-6+i*2.7,16)],s.hairLight,.6);
  line(c,[xy(-3,6.3),xy(2,5.8),xy(6.3,6.8)],s.hair,1.5);
  c.strokeStyle='#3b3e40';c.lineWidth=1;c.strokeRect(-4,-3.6,6.7,4.8);c.strokeRect(4.2,-3.7,7.6,5);line(c,[xy(2.7,-2),xy(4.2,-2)],'#62666a',.8);line(c,[xy(-4,-2.9),xy(-10,-3.4)],'#555b5e',.8);line(c,[xy(-2.8,-2.8),xy(-1.1,-1.8)],'#ffffff',.5);
 }
 hair(c,s,ch,o);
 if(ch==='gabrielzin'){line(c,[xy(-4,-11),xy(-.4,-7)],'#ed94ba',1.4);line(c,[xy(-.4,-11),xy(-4,-7)],'#ed94ba',1.4)}
 if(['gabrielzin','aneninha','jane'].includes(ch))line(c,[xy(8.8,-1.8),xy(11,-3.1)],ink,.75);
 if(ch==='ulisses'){
  poly(c,[[-19,-10],[-11,-13],[-8,-24],[8,-26],[14,-13],[24,-10],[11,-6],[-8,-5]],'#5b2030',ink,1.2);poly(c,[[-11,-14],[14,-15],[14,-11],[-12,-10]],'#271d28','',0);line(c,[xy(-6,-22),xy(6,-23),xy(11,-17)],'#9c4850',.9);
 }
 if(ch==='nomad'){
  poly(c,[[-14,-10],[-12,-19],[0,-23],[10,-18],[12,-10],[20,-5],[10,-2],[-5,-6]],'#5e8b37',ink,1.1);poly(c,[[-12,-12],[11,-12],[11,-8],[-12,-8]],'#2b4c32','',0);text(c,'N',1,-12,9,'#efebda');
 }
 if(['renngotti','santox','hdsh','jane'].includes(ch)){
  const col=ch==='jane'?'#dcc13e':ch==='santox'?'#8b5c9c':'#39343e';
  if(ch==='renngotti'){
   c.beginPath();c.arc(-1,0,15,Math.PI,Math.PI*1.75);c.strokeStyle='#191c24';c.lineWidth=2.6;c.stroke();oval(c,-12,3,3.8,7.3,'#21232b',ink,.8);oval(c,-12.4,2.4,2,5.1,'#4f4f57');
   poly(c,[[-7,-10],[-1,-8],[9,-11],[11,-7],[1,-4],[-6,-6]],'#171e27',ink,.5);
  }else if(ch==='jane'){
   oval(c,-7,17,6.2,5.2,col,ink,1);oval(c,-7,17,3.8,3.7,'#29252c');oval(c,6,16,5.3,4.9,col,ink,.8);line(c,[xy(-5,16),xy(2,14),xy(7,15)],'#373039',2);
   line(c,[xy(-5,-6),xy(-.4,-6)],'#302c31',1.4);
  }
 }
 if(ch==='bieu'||ch==='aneninha'||ch==='gabrielzin'||ch==='felipence'||ch==='ulisses'){
  const col=ch==='aneninha'?'#e9bd56':ch==='gabrielzin'?'#dd7f9f':'#b9b0a8';c.strokeStyle=col;c.lineWidth=.7;c.beginPath();c.ellipse(-9.4,5,1.2,ch==='aneninha'?3:1.6,0,0,Math.PI*2);c.stroke();
 }
 if(ch==='bieu'&&o.transformation)oval(c,9.6,4,2.6,2.3,'#dc3c49',ink,.7);
 if(ch==='aneninha'&&o.transformation){poly(c,[[-2,6],[4,7],[10,5],[9,10],[4,12],[-1,10]],'#f6ece1',ink,.6);oval(c,8,5.6,1.4,1.3,'#352837');line(c,[xy(1,9.2),xy(5,10.1),xy(8.1,8)],'#22202b',.85)}
 if(o.transformation&&ch==='gabrielzin'){oval(c,-1,10.7,.7,.7,'#ba7789');line(c,[xy(-1,11.4),xy(-3,12),xy(-4.3,11.5)],'#b27687',.5)}
 c.restore();
}
function sharkHead(c:C,s:Style,o:DrawOpts){
 poly(c,[[-15,7],[-18,-4],[-10,-15],[3,-16],[18,-10],[25,-1],[25,5],[14,12],[2,15],[-7,12]],s.cloth,ink,1.2);
 poly(c,[[-11,1],[2,-3],[24,0],[25,5],[14,12],[2,15],[-7,12]],s.skin,'',0);poly(c,[[-12,-9],[-5,-13],[4,-12],[-2,-8]],s.hairLight,'',0);
 poly(c,[[1,-7],[11,-7],[7,-3],[2,-3]],'#e8ece1',ink,.6);oval(c,6,-5,1.3,1.6,o.transformation?'#f9f5cb':'#618ca5');oval(c,6,-5,.5,1.4,'#151b2a');line(c,[xy(0,-8),xy(11,-7)],ink,1.1);
 const bite=o.expr==='shout';line(c,[xy(1,6),xy(13,6.5),xy(24,3)],ink,1.1);
 if(bite){poly(c,[[1,6],[14,5],[24,3],[17,12],[6,13]],'#292538',ink,.8);for(let i=0;i<6;i++){poly(c,[[3+i*3,6],[5.5+i*3,5.5],[4.7+i*3,9]],ivory,'',0);poly(c,[[6+i*2.1,12],[8+i*2.1,11.5],[7+i*2.1,9.5]],ivory,'',0)}}
 for(let i=0;i<3;i++)line(c,[xy(-10+i*2.5,2),xy(-7+i*2.5,8)],s.shadow,.85);
 if(o.kiss){oval(c,24,2,3,1.8,'#d7a2aa',ink,.6);oval(c,25,4,2.5,1.3,'#e7bbc0',ink,.5)}
}
function primateHead(c:C,s:Style,o:DrawOpts){
 const fur=o.transformation?'#eee9ea':s.hair,shade=o.transformation?'#9a92aa':s.dark;
 poly(c,[[-17,10],[-19,-3],[-22,-8],[-17,-10],[-18,-17],[-9,-15],[-6,-20],[-1,-17],[5,-20],[8,-15],[17,-12],[14,-7],[20,1],[17,12],[8,18],[-6,16]],fur,ink,1.3);
 poly(c,[[-11,-8],[8,-10],[13,-5],[11,3],[16,9],[8,15],[-4,13],[-12,7]],o.transformation?'#bba8be':'#a77d62',ink,.85);
 poly(c,[[-8,1],[5,-1],[13,4],[14,9],[7,13],[-4,11]],o.transformation?'#d3c2d0':'#bc9470','',0);
 line(c,[xy(-11,-8),xy(-2,-5),xy(9,-8)],shade,3);const eyes=o.transformation?{...o,glowColor:FORM_EYES.orango}:o;eye(c,-5,-3.5,5,s,eyes,true);eye(c,5,-4,5,s,eyes);
 oval(c,4,3,3.4,1.8,shade);line(c,[xy(-5,8),xy(3,9),xy(10,7)],ink,1.2);
 if(o.expr==='shout'){oval(c,3,10,7.5,6,'#442932',ink,.9);poly(c,[[-3,5],[8,5],[8,7],[-2,7]],ivory,'',0);poly(c,[[-3,5],[-1,10],[1,6]],ivory,'',0);poly(c,[[5,5],[7,10],[9,5]],ivory,'',0)}
}
function rabbitHead(c:C,o:DrawOpts){
 const t=o.time;
 for(let side=-1;side<=1;side+=2){c.save();c.translate(side*7,-9);c.rotate(side*.22+Math.sin(t*.07)*.05);oval(c,0,-15,3.8,18,'#8150ae',ink,1.1);oval(c,.4,-16,1.2,13,'#dbafe8');c.restore()}
 oval(c,0,0,18,13,'#9161bb',ink,1.2);poly(c,[[-13,1],[13,-1],[11,9],[0,12],[-9,8]],'#e9bf64',ink,.8);for(let i=-2;i<=2;i++)line(c,[xy(i*4,-.2),xy(i*4,10.5-Math.abs(i)*1.1)],'#bd8d53',.6);
 for(const x of [-8,7]){poly(c,[[x-4,-7],[x+5,-7],[x+3,-2],[x-4,-2]],'#f5e5c6',ink,.7);poly(c,[[x+1,-7],[x+4,-7],[x+2,-2],[x,-2]],'#2e2245','',0)}
}
function robotHead(c:C,_o:DrawOpts){
 poly(c,[[-13,7],[-15,-7],[-6,-16],[7,-15],[14,-5],[11,8],[0,14]],'#e9e5db',ink,1.1);poly(c,[[-14,-8],[-6,-16],[7,-15],[5,-8],[-4,-4]],'#e6ba29',ink,.8);poly(c,[[-11,-4],[0,-1],[12,-5],[7,4],[-6,4]],'#2b3442',ink,.8);line(c,[xy(-9,-1),xy(-1,1),xy(10,-2)],'#79e8dc',1.8);poly(c,[[-6,4],[7,4],[5,9],[0,12],[-4,9]],'#edc33e',ink,.7);line(c,[xy(0,6),xy(3,5)],'#fff1a0',.7);
}

function paintedTorso(c:C,ch:CharId,p:Rig['p'],s:Style,o:DrawOpts){
 const {at}=axes(p),bare=ch==='caetano'||ch==='cristyan'||o.transformation&&['renngotti','eneas','ulisses'].includes(ch),w=s.shoulder,wa=s.waist;
 const outline=[at(-.12,-wa),at(-.13,wa),at(.25,wa+1),at(.57,w*.85),at(.88,w),at(1.09,w*.76),at(1.15,w*.38),at(1.01,0),at(1.15,-w*.38),at(1.09,-w*.76),at(.88,-w),at(.55,-w*.85),at(.22,-wa)];
 polygon(c,outline,bare?s.skin:s.cloth,ink,1.35);
 polygon(c,[at(-.12,-wa),at(.54,-w*.83),at(.96,-w*.85),at(1.1,-w*.51),at(.82,-w*.22),at(.48,-wa*.7),at(.14,-wa*.51),at(-.12,-wa*.56)],bare?s.shadow:s.dark,'',0);
 if(bare){
  // Pectoral planes, sternum, serratus, obliques and six separate abdominal planes.
  polygon(c,[at(.95,-w*.55),at(.89,-2),at(.69,-1.6),at(.7,-w*.69),at(.84,-w*.85)],s.light,'',0);
  polygon(c,[at(.89,2),at(1.01,w*.47),at(.83,w*.85),at(.69,w*.66),at(.68,3)],s.light,'',0);
  line(c,[at(.96,-w*.58),at(.86,-2),at(.7,0),at(.87,2),at(1.03,w*.5)],s.shadow,1);
  line(c,[at(.69,-w*.75),at(.64,-8),at(.69,-1),at(.63,6),at(.72,w*.78)],s.shadow,1);
  for(let i=0;i<3;i++){const y=.18+i*.145;polygon(c,[at(y,-1),at(y+.12,-1.5),at(y+.14,-9+i*.5),at(y+.02,-11+i*.4)],s.light,'',0);polygon(c,[at(y,1.2),at(y+.13,1.3),at(y+.16,10-i*.2),at(y+.02,9.4-i*.2)],s.skin,'',0);line(c,[at(y,-9),at(y-.014,-2)],s.shadow,.6);line(c,[at(y+.01,2),at(y+.02,8.4)],s.shadow,.7)}
  line(c,[at(.16,0),at(.14,1.1)],s.shadow,1);
  for(const k of [-1,1])for(let i=0;i<3;i++)line(c,[at(.34+i*.11,k*(wa-2)),at(.39+i*.1,k*(wa-6))],s.shadow,.65);
  if(o.transformation&&ch==='eneas'){
   const badge=at(.78,0);oval(c,badge.x,badge.y,9,7,'#295e67',ink,.65);text(c,'BR',badge.x,badge.y+2.5,6,'#ead275');for(let side=-1;side<=1;side+=2)for(let i=0;i<6;i++){const a=at(.21+i*.105,side*(10+Math.sin(i)*2)),b=at(.27+i*.1,side*(17+Math.sin(i)*2));line(c,[a,b,at(.32+i*.1,side*15)],'#38594a',1.5)}
  }
  if(o.transformation&&ch==='ulisses')for(let i=0;i<4;i++)line(c,[at(.33+i*.14,-15),at(.29+i*.14,-3),at(.36+i*.14,6)],'#982e4b',1.2);
 }else{
  // Hard cel shadow planes and tailored seams replace a single flat torso polygon.
  polygon(c,[at(.95,-w*.55),at(.88,-w*.13),at(.77,-w*.58),at(.69,-w*.69)],ch==='rickzera'?'#474d4b':s.accent,'',0);
  polygon(c,[at(.65,-w*.44),at(.52,wa*.4),at(.4,wa*.55),at(.53,-wa*.52)],s.dark,'',0);
  for(let i=0;i<3;i++)line(c,[at(.19+i*.14,-wa+3),at(.14+i*.14,wa*.25),at(.2+i*.14,wa*.55)],s.dark,.7);
  line(c,[at(.33,wa-1),at(.78,w*.82)],ch==='rickzera'?'#5c605b':'#ffffff35',.75);
 }
 if(ch==='bieu'){
  // Singlet straps follow the two clavicles; fine silver chain remains articulated.
  polygon(c,[at(1.13,-w*.5),at(1.03,-w*.26),at(.88,-5),at(.84,2),at(.96,w*.35),at(1.12,w*.5),at(1.06,w*.27),at(.96,1),at(.98,-5),at(1.1,-w*.27)],s.skin,ink,.65);
  const chain=[at(1.08,-w*.3),at(.85,-8),at(.77,2),at(.85,11),at(1.09,w*.36)];line(c,chain,'#6f717d',2);line(c,chain,'#e6e2dc',.8);
 }
 if(ch==='patrick'||ch==='eneas'||ch==='jao'){
  if(ch==='jao'){
   line(c,[at(.1,2),at(1.08,2)],'#141821',.9);polygon(c,[at(1.12,-10),at(1.06,0),at(1.13,11),at(.98,10),at(.96,-10)],'#29242d',ink,.75);line(c,[at(1.1,-9),at(1.06,0),at(1.11,10)],'#ece3d7',1);
   for(let i=0;i<4;i++){const b=at(.22+i*.19,3);oval(c,b.x,b.y,1.5,1.4,'#bfa36b',ink,.4)}
  }else{
   polygon(c,[at(1.13,-12),at(.84,0),at(1.14,12),at(.93,8),at(.89,-7)],'#e8ded6',ink,.7);polygon(c,[at(1.08,1),at(.99,-3),at(.65,0),at(.98,4)],ch==='patrick'?'#a74646':'#384847',ink,.5);
   for(const side of [-1,1])polygon(c,[at(1.1,side*13),at(.93,side*22),at(.72,side*9),at(.45,side*2),at(.83,side*3)],ch==='patrick'?'#65504b':'#48464a',ink,.8);
   for(let i=0;i<3;i++){const b=at(.12+i*.17,2);oval(c,b.x,b.y,1.4,1.2,'#b89b63',ink,.35)}
   if(ch==='patrick'){polygon(c,[at(.75,14),at(.84,15),at(.77,18),at(.86,19),at(.73,21)],'#af4947',ink,.5);line(c,[at(.72,12),at(.72,22)],'#211d26',1)}
   else {polygon(c,[at(1.13,-16),at(1.17,-9),at(-.1,17),at(-.14,9)],'#42794b',ink,.8);line(c,[at(1.15,-14),at(-.12,12)],'#e3ce5b',3.1);const medal=at(.55,4);oval(c,medal.x,medal.y,5.4,6,'#d3ba59',ink,.5);oval(c,medal.x,medal.y,2.8,3,'#3e6c91')}
  }
 }
 if(ch==='nomad'){
  polygon(c,[at(.62,-wa-2),at(.62,wa+3),at(.1,wa+4),at(-.12,-wa-4)],s.pants,ink,1);for(const side of [-1,1]){line(c,[at(.5,side*12),at(1.12,side*15)],'#23372d',6.5);line(c,[at(.5,side*12),at(1.12,side*15)],'#8652c2',3);const clip=at(.68,side*12);c.strokeStyle='#d6c260';c.lineWidth=1;c.strokeRect(clip.x-2,clip.y-2,4,4)}
  line(c,[at(.22,-8),at(.48,-8),at(.48,8),at(.22,8)],'#101f22',.8);
 }
 if(['jane','hdsh','aneninha','renngotti','santox','gabrielzin'].includes(ch)){
  const hoodie=ch!=='jane',striped=ch==='gabrielzin'&&!o.transformation;
  if(hoodie){polygon(c,[at(1.14,-17*(w/24)),at(1.3,-12*(w/24)),at(1.24,10*(w/24)),at(1.08,18*(w/24)),at(.99,10*(w/24)),at(1.15,2),at(.99,-6)],s.dark,ink,.9)}
  if(ch==='aneninha'||ch==='jane'||ch==='hdsh'){
   polygon(c,[at(1.04,-6),at(.13,-5),at(-.13,-wa),at(.5,-wa-2),at(1.13,-w*.5)],s.cloth,ink,.8);polygon(c,[at(1.14,w*.48),at(.53,wa+2),at(-.1,wa),at(.11,6),at(1.04,5)],s.cloth,ink,.8);
   polygon(c,[at(.16,-5),at(.8,-7),at(.81,6),at(.16,6)],ch==='aneninha'?'#e8e0da':'#25232b',ink,.5);if(ch==='aneninha')polygon(c,[at(.06,-8),at(.17,-8),at(.18,8),at(.06,8)],s.skin,ink,.5);
   for(const side of [-1,1])line(c,[at(1.01,side*7),at(.3,side*8)],ch==='hdsh'?'#e2bd55':'#f7e9dc',1);
   if(ch==='hdsh'){line(c,[at(.1,1),at(1.01,1)],s.accent,1.1);const label=at(.69,11);c.strokeStyle=s.accent;c.lineWidth=.6;c.strokeRect(label.x-5,label.y-5,9,9);for(let i=0;i<3;i++)line(c,[xy(label.x-3+i*2,label.y+2),xy(label.x-3+i*2,label.y+2-i*2-2)],s.accent,1)}
   if(ch==='jane'){
    const code=at(.61,0);text(c,'</>',code.x,code.y+2.5,5.5,'#edc941');for(const side of [-1,1]){line(c,[at(.28,side*11),at(.13,side*11)],s.accent,2);const h=at(.27,side*11);oval(c,h.x,h.y,.7,.7,'#fff2aa')}
   }
  }
  if(striped){polygon(c,[at(.46,-w*.86),at(.58,w*.86),at(.78,w*.93),at(.67,-w*.91)],s.accent,ink,.55);const badge=at(.85,9);text(c,'G',badge.x,badge.y+2.5,7,s.accent);const strap=[at(1.08,13),at(.56,10),at(.1,12)];line(c,strap,'#1a1d27',3.5);line(c,strap,'#8d7d82',.6)}
  if(ch==='santox'){
   polygon(c,[at(1.08,-7),at(.93,0),at(1.1,9),at(1.04,11),at(.87,0),at(1.02,-9)],'#e8dce5',ink,.7);const num=at(.44,0);text(c,'12',num.x,num.y+7,19,'#e4d6eb');for(const side of [-1,1])line(c,[at(.02,side*13),at(.9,side*18)],'#e8d9ed',2);for(const side of [-1,1]){const h=at(1.06,side*11);oval(c,h.x,h.y,5,6,'#59356e',ink,.8);oval(c,h.x,h.y,3.2,3.5,'#b591ca')}
  }
  if(ch==='renngotti'){const a=at(.4,-7),b=at(.4,12);line(c,[a,at(.29,-5),at(.28,9),b],s.dark,.75);for(const side of [-1,1])line(c,[at(1.12,side*7),at(.8,side*6)],'#f5f0e8',1.4)}
 }
 if(ch==='ulisses'||ch==='felipence'){
  for(const side of [-1,1])polygon(c,[at(1.12,side*10),at(.91,side*21),at(.83,side*13),at(.49,side*5),at(.92,side*4)],ch==='ulisses'?'#9c3b45':'#44404a',ink,.8);
  if(ch==='felipence'){const mark=at(.66,0);text(c,'W',mark.x,mark.y+8,17,'#e8e0d7');for(const side of [-1,1])for(let i=0;i<4;i++){const rivet=at(.72+i*.09,side*17);oval(c,rivet.x,rivet.y,.8,.8,'#bdb7b6')}}
  if(ch==='ulisses'){polygon(c,[at(1.06,1),at(.95,-3),at(.62,1),at(.95,5)],'#9b3d4a',ink,.6);for(let i=0;i<3;i++){const b=at(.15+i*.17,2);oval(c,b.x,b.y,1,1,'#ceb177')}}
 }
}
function pantLeg(c:C,ch:CharId,p:Rig['p'],s:Style,k:P2,a:P2,t:P2,front:boolean,_o:DrawOpts){
 const shorts=s.leg==='shorts',skirt=s.leg==='skirt',bare=ch==='caetano'||ch==='cristyan',root=xy(p.hip.x+(front?3:-4),p.hip.y),shadeColor=front?s.pants:shade(s.pants,.77),pantShadow=shade(s.pants,.61);
 if(shorts||skirt){
  segment(c,root,k,Math.min(s.waist*.65,10),6.5,s.skin,s.shadow,s.light);segment(c,k,a,6.5,3.6,s.skin,s.shadow,s.light);
  if(shorts){const hem=mix(root,k,.72);segment(c,root,hem,s.waist*.83,s.waist*.73,shadeColor,pantShadow,'#6c6572',true);const u=xy(k.x-root.x,k.y-root.y);c.save();c.translate(hem.x,hem.y);c.rotate(Math.atan2(u.y,u.x));line(c,[xy(-1,-s.waist*.7),xy(-1,s.waist*.7)],ch==='cristyan'?'#e3ba57':'#cbb5df',1.9);c.restore();if(ch==='cristyan'){const mark=mix(root,k,.43);text(c,'มวย',mark.x,mark.y+1.6,5.5,'#dfb64e')}}
  if(ch==='gabrielzin'){
   segment(c,mix(k,a,.38),a,8,7,'#e8d4da','#c7aab8','#fff2e8',true);line(c,[mix(k,a,.44),mix(k,a,.55)],'#fff1e5',1);
  }
  if(ch==='cristyan'){
   segment(c,mix(k,a,.6),a,5,4,'#e8dfce','#a8a4a3','#fff4dc');const u=xy(a.x-k.x,a.y-k.y),L=Math.hypot(u.x,u.y)||1;for(let i=0;i<5;i++){const n=mix(k,a,.59+i*.075);line(c,[xy(n.x-u.y/L*4.4,n.y+u.x/L*4.4),xy(n.x+u.y/L*4.4,n.y-u.x/L*4.4)],'#8f8e91',.5)}
  }
 }else{
  const cuff=ch==='caetano'?mix(k,a,.88):a;segment(c,root,k,s.waist*.84,Math.min(s.waist*.81,13.5),shadeColor,pantShadow,front?'#ffffff32':'#ffffff18',true);segment(c,k,cuff,Math.min(s.waist*.84,13.5),s.waist*.49,shadeColor,pantShadow,front?'#ffffff32':'#ffffff18',true);
  if(ch==='caetano')segment(c,cuff,a,4.5,3.5,s.skin,s.shadow,s.light);
  if(['rickzera','jane','hdsh','aneninha','renngotti'].includes(ch)){
   const m=mix(root,k,.58),ang=Math.atan2(k.y-root.y,k.x-root.x);c.save();c.translate(m.x,m.y);c.rotate(ang);poly(c,[[-4,-1],[-4,-s.waist*.73],[7,-s.waist*.7],[9,-2]],front?s.pants:pantShadow,ink,.6);line(c,[xy(-4,-1),xy(-2,-4),xy(3,-3),xy(7,-2)],pantShadow,.7);line(c,[xy(1,-s.waist*.63),xy(1,-s.waist*.49)],s.accent,.65);c.restore();
  }
  if(ch==='felipence'){const n=mix(root,k,.8);line(c,[xy(n.x-6,n.y),xy(n.x-2,n.y-2),xy(n.x+4,n.y),xy(n.x+7,n.y-1)],s.skin,2.3);line(c,[xy(n.x-5,n.y+3),xy(n.x+5,n.y+2)],'#aaa1a1',.7)}
  if(ch==='nomad'){line(c,[mix(root,k,.23),mix(root,k,.79)],'#8750c0',3.3);const star=mix(root,k,.51);oval(c,star.x,star.y,.8,.8,'#e7d7f0')}
 }
 shoe(c,a,t,s,bare,ch==='ulisses'||ch==='felipence',!front);
}
function arm(c:C,ch:CharId,p:Rig['p'],s:Style,pose:Pose,e:P2,w:P2,front:boolean,o:DrawOpts){
 const {at}=axes(p),sh=at(.91,(front?1:-1)*s.shoulder*.7),cat=o.transformation&&ch==='gabrielzin';
 const bare=s.arms==='skin'||o.transformation&&['renngotti','eneas','ulisses'].includes(ch),skin=front?s.skin:s.shadow;
 segment(c,sh,e,s.shoulder*.27,s.shoulder*.225,skin,s.shadow,s.light);segment(c,e,w,s.shoulder*.22,s.shoulder*.13,skin,s.shadow,s.light);
 if(!bare){
  if(s.arms==='short')segment(c,sh,mix(sh,e,.43),s.shoulder*.31,s.shoulder*.29,front?s.cloth:s.dark,s.dark,'#ffffff25',true);
  else{
   segment(c,sh,e,s.shoulder*.34,s.shoulder*.3,front?s.cloth:s.dark,s.dark,'#ffffff28',true);segment(c,e,w,s.shoulder*.3,s.shoulder*.21,front?s.cloth:s.dark,s.dark,'#ffffff28',true);
   if(ch==='gabrielzin'&&!o.transformation){segment(c,mix(e,w,.17),mix(e,w,.6),s.shoulder*.31,s.shoulder*.27,s.accent,'#b66b94','#ffbdd3',true)}
   if(ch==='aneninha'){line(c,[mix(sh,e,.3),mix(sh,e,.91)],'#f2d2d3',1.6);line(c,[mix(e,w,.1),mix(e,w,.77)],'#f2d2d3',1.6)}
   if(ch==='hdsh'||ch==='jane')line(c,[mix(sh,e,.35),mix(sh,e,.65)],s.accent,3.3);
   segment(c,mix(e,w,.86),w,s.shoulder*.22,s.shoulder*.17,ch==='hdsh'?s.accent:ch==='santox'?'#eadfeb':s.dark,s.dark,'#ffffff20',true);
  }
 }
 if(ch==='caetano'||ch==='cristyan'){
  segment(c,mix(e,w,.72),w,s.shoulder*.145,s.shoulder*.12,ch==='caetano'?'#292528':'#ddd7cb',ch==='caetano'?'#151921':'#9d9999',ch==='caetano'?'#4b4248':'#fff2d9');
  if(ch==='cristyan')for(let i=0;i<4;i++){const pt=mix(e,w,.73+i*.065);line(c,[xy(pt.x-3,pt.y),xy(pt.x+3,pt.y+1)],'#929093',.4)}
  if(ch==='cristyan'){const circ=mix(sh,e,.28);c.strokeStyle='#574433';c.lineWidth=1.5;c.beginPath();c.ellipse(circ.x,circ.y,8,3,.25,0,Math.PI*2);c.stroke();line(c,[circ,xy(circ.x-3,circ.y+13)],s.accent,1.5)}
 }
 glove(c,e,w,s,pose,front,ch==='nomad',cat);
 if(ch==='patrick'&&!front){const wrist=mix(e,w,.9);oval(c,wrist.x,wrist.y,4,3.3,'#af986e',ink,.6);oval(c,wrist.x,wrist.y,2.6,2.4,'#36333a');line(c,[xy(wrist.x,wrist.y),xy(wrist.x+1.6,wrist.y-1.1)],'#e6d3a3',.65)}
 if(ch==='bieu'){const chain=mix(e,w,.88);c.strokeStyle='#b9bdc0';c.lineWidth=1;c.beginPath();c.ellipse(chain.x,chain.y,4,2,.2,0,Math.PI*2);c.stroke()}
}
function waistDetails(c:C,ch:CharId,p:Rig['p'],s:Style,o:DrawOpts){
 const {at}=axes(p);
 if(s.leg==='skirt'){
  const hem=[at(.02,-s.waist),at(.02,s.waist),at(-.42,s.waist+10),at(-.48,-s.waist-8)];polygon(c,hem,'#c17598',ink,1.1);
  for(let i=-3;i<=3;i++)line(c,[at(.02,i*3),at(-.44,i*6)],i%2?'#5b344d':'#e8a2bb',1.1);for(let i=0;i<3;i++)line(c,[at(-.1-i*.12,-s.waist-4),at(-.1-i*.12,s.waist+7)],'#4e324c',.9);const strap=[at(.13,10),at(-.25,17),at(-.45,18)];line(c,strap,'#252330',3);return;
 }
 const belt=ch==='caetano'?'#25242a':ch==='cristyan'?'#e1cda7':s.dark;polygon(c,[at(.06,-s.waist-2),at(.06,s.waist+2),at(-.06,s.waist+2),at(-.06,-s.waist-2)],belt,ink,.6);
 if(ch==='caetano'){
  const knot=at(.02,5);oval(c,knot.x,knot.y,3.5,3,belt,ink,.5);
  const swing=Math.sin(o.time*.075)*3;polygon(c,[at(.02,5),at(-.38,4+swing),at(-.6,9+swing),at(-.57,14+swing),at(-.22,10),at(.02,9)],belt,ink,.8);polygon(c,[at(.02,3),at(-.34,-4-swing),at(-.53,0-swing),at(-.48,4),at(-.2,4)],'#3e3740',ink,.7);
 }else if(ch!=='nomad'&&ch!=='cristyan'){
  const buckle=at(0,2);c.strokeStyle=ch==='jane'||ch==='hdsh'?'#e6c159':'#b4a38c';c.lineWidth=1;c.strokeRect(buckle.x-3,buckle.y-2.5,6,5);
 }
 if(['bieu','aneninha','ulisses','felipence'].includes(ch)){
  const start=at(-.07,11),end=at(-.22,20);c.beginPath();c.moveTo(start.x,start.y);c.quadraticCurveTo(start.x+15,start.y+20,end.x,end.y);c.strokeStyle='#7d7a82';c.lineWidth=1.5;c.stroke();c.strokeStyle='#e2d7c5';c.lineWidth=.5;c.stroke();
 }
 if(ch==='felipence'){const sway=Math.sin(o.time*.065)*4;polygon(c,[at(.03,13),at(-.65,15+sway),at(-.52,22+sway),at(-.71,26+sway),at(.02,20)],'#d27b3b',ink,.9)}
}
function coatTails(c:C,ch:CharId,p:Rig['p'],s:Style,o:DrawOpts){
 if(ch!=='ulisses')return;const {at}=axes(p),wave=Math.sin(o.time*.07)*4;
 polygon(c,[at(.73,-s.shoulder*.8),at(.11,-s.waist),at(-1.12,-s.waist-15-wave),at(-.93,0),at(-.22,4),at(.8,-8)],s.dark,ink,1.2);
 polygon(c,[at(.65,s.shoulder*.8),at(.08,s.waist),at(-1.08,s.waist+12+wave),at(-.95,4),at(-.25,-4),at(.7,7)],s.cloth,ink,1.2);line(c,[at(.12,15),at(-.9,20+wave)],'#a34d55',.9);
}
function weapon(c:C,ch:CharId,p:Rig['p'],_s:Style,o:DrawOpts){
 if(ch==='felipence'){
  const a=axes(p).at(.43,-12),playing=!!o.poseName&&/riff|sound|guitar|s[123]|super/.test(o.poseName);c.save();c.translate(playing?p.wF.x-8:a.x,playing?p.wF.y+4:a.y);c.rotate(playing?-.3:-1.05);
  // Offset-waist guitar, bridge, frets and six physical strings; no bitmap prop.
  c.beginPath();c.moveTo(-12,-7);c.bezierCurveTo(-24,-18,-28,2,-13,14);c.quadraticCurveTo(0,24,11,13);c.bezierCurveTo(22,1,15,-9,8,-6);c.lineTo(6,-32);c.lineTo(-1,-32);c.lineTo(-3,-8);c.quadraticCurveTo(-8,-4,-12,-7);c.closePath();c.fillStyle='#6e4338';c.fill();c.strokeStyle=ink;c.lineWidth=1.3;c.stroke();poly(c,[[-1,-30],[5,-30],[6,6],[-2,6]],'#252331',ink,.6);poly(c,[[-1,-38],[7,-39],[9,-31],[-1,-29]],'#392a2d',ink,.7);
  for(let i=0;i<5;i++)line(c,[xy(-.6,-28+i*5),xy(5,-28+i*5)],'#b19a85',.5);for(let i=0;i<3;i++)line(c,[xy(1+i,-37),xy(1+i,9)],'#d7c1a0',.3);c.strokeStyle='#d6c3ae';c.lineWidth=.8;c.strokeRect(-3,7,11,3);c.restore();
 }
 if(ch==='ulisses'){
  const a=axes(p).at(-.07,13);c.save();c.translate(a.x,a.y);c.rotate(-.68+Math.sin(o.time*.045)*.025);poly(c,[[-2,-36],[2,-36],[2,49],[0,54],[-2,49]],'#242330',ink,.8);line(c,[xy(0,-32),xy(0,46)],'#966365',1);poly(c,[[-3,-57],[3,-57],[2.5,-36],[-2.5,-36]],'#312d35',ink,.8);for(let i=0;i<5;i++)line(c,[xy(-2,-54+i*3),xy(2,-52+i*3)],'#b9a28b',.7);oval(c,0,-35,7,2,'#b9a06b',ink,.7);c.restore();
 }
}
function robotBody(c:C,p:Rig['p'],pose:Pose,o:DrawOpts){
 const s={...S('jane'),cloth:'#e9e2cf',dark:'#8b8190',accent:'#e4bd34',shoulder:18,waist:11}, {at}=axes(p);
 const mechLimb=(a:P2,b:P2,size:number)=>{segment(c,a,b,size,size*.72,s.cloth,s.dark,'#fff1d9',true);const u=mix(a,b,.36);oval(c,u.x,u.y,size*.83,size*.4,'#d5af31',ink,.6);line(c,[mix(a,b,.18),mix(a,b,.7)],'#3c414c',1.3)};
 for(const side of ['B','F']){const k=p['k'+side],a=p['a'+side],t=p['t'+side];mechLimb(p.hip,k,8);mechLimb(k,a,7);shoe(c,a,t,s,false,true,side==='B')}
 mechLimb(at(.88,-10),p.eB,7);mechLimb(p.eB,p.wB,6);glove(c,p.eB,p.wB,s,pose,false,true);
 polygon(c,[at(-.1,-10),at(-.1,10),at(.8,17),at(1.1,12),at(1.02,-12),at(.8,-17)],'#e5ba32',ink,1.2);polygon(c,[at(.31,-8),at(.31,8),at(.76,11),at(.89,0),at(.76,-11)],'#353742',ink,.8);const core=at(.62,0);text(c,'⌛',core.x,core.y+4,12,'#ffe080');for(let side=-1;side<=1;side+=2)polygon(c,[at(.96,side*10),at(1.03,side*22),at(.76,side*25),at(.59,side*16)],'#e9e3d8',ink,1);
 mechLimb(at(.88,10),p.eF,7);mechLimb(p.eF,p.wF,6);glove(c,p.eF,p.wF,s,pose,true,true);c.save();c.translate(p.head.x,p.head.y);c.rotate(pose.rot+(pose.head+pose.lean)*Math.PI/310);robotHead(c,o);c.restore();
}
function armoredBody(c:C,ch:CharId,p:Rig['p'],pose:Pose,s:Style,o:DrawOpts){
 const {at}=axes(p);for(const side of ['B','F']){const k=p['k'+side],a=p['a'+side],t=p['t'+side];segment(c,p.hip,k,12,10,'#9d5f65','#542d41','#dda3a0',true);segment(c,k,a,11,7,'#9d5f65','#542d41','#dda3a0',true);shoe(c,a,t,{...s,shoe:'#86535e',accent:'#ee8584'},false,true,side==='B')}
 polygon(c,[at(-.15,-18),at(-.15,18),at(.45,25),at(1.05,30),at(1.2,13),at(1.05,-16),at(.8,-30),at(.33,-25)],'#a6696f',ink,1.4);
 for(let i=0;i<5;i++){const y=.15+i*.18;polygon(c,[at(y,-23),at(y+.12,-24),at(y+.2,-2),at(y+.17,2),at(y+.12,24),at(y,22),at(y+.04,0)],i%2?'#bd8183':'#89525f',ink,.7)}
 for(const side of ['B','F']){const e=p['e'+side],w=p['w'+side],sh=at(.9,side==='F'?20:-20);segment(c,sh,e,13,11,'#bb7e81','#6b3b50','#e9b8ac',true);segment(c,e,w,12,9,'#985a68','#5b3145','#d9a29c',true);for(let i=0;i<3;i++){const n=mix(e,w,.15+i*.27);poly(c,[[n.x-6,n.y-5],[n.x+10,n.y-9],[n.x+6,n.y+3],[n.x-7,n.y+5]],'#b07479',ink,.7)}glove(c,e,w,{...s,skin:'#b27c7d',shadow:'#6a4656'},pose,side==='F')}
 c.save();c.translate(p.head.x,p.head.y);c.rotate(pose.rot+(pose.head+pose.lean)*Math.PI/310);animeHead(c,ch,s.head,{...o,transformation:false});c.restore();
}
function creatureBody(c:C,ch:CharId,p:Rig['p'],pose:Pose,s:Style,o:DrawOpts){
 const ape=ch==='orango',white=o.transformation&&ape,fur=white?'#e6e0e5':s.cloth,dark=white?'#9691aa':s.dark,light=white?'#fff8ef':s.hairLight,{at}=axes(p),sh=s.shoulder;
 const limb=(a:P2,b:P2,thick:number)=>{
  segment(c,a,b,thick,thick*.72,fur,dark,light);
  if(ape){const u=xy(b.x-a.x,b.y-a.y),L=Math.hypot(u.x,u.y)||1;for(let i=0;i<5;i++){const m=mix(a,b,.12+i*.17),n=xy(-u.y/L,u.x/L);polygon(c,[xy(m.x+n.x*thick*.8,m.y+n.y*thick*.8),xy(m.x+n.x*(thick+5),m.y+n.y*(thick+5)),xy(m.x+u.x*.12+n.x*thick*.62,m.y+u.y*.12+n.y*thick*.62)],i%2?dark:fur,ink,.45)}}
 };
 for(const side of ['B','F']){const k=p['k'+side],a=p['a'+side],t=p['t'+side];limb(p.hip,k,ape?18:13);limb(k,a,ape?15:11);shoe(c,a,t,{...s,skin:ape?'#855c4c':s.skin,shadow:dark},true,false,side==='B')}
 const backSh=at(.86,-sh*.75);limb(backSh,p.eB,ape?21:15);limb(p.eB,p.wB,ape?20:12);glove(c,p.eB,p.wB,{...s,skin:ape?'#9b7761':s.cloth,shadow:dark},pose,false);
 polygon(c,[at(-.12,-s.waist),at(-.12,s.waist),at(.4,sh*.84),at(.86,sh),at(1.1,sh*.58),at(1.14,-sh*.6),at(.86,-sh),at(.4,-sh*.85)],fur,ink,1.5);
 polygon(c,[at(.08,-12),at(.08,12),at(.46,19),at(.87,21),at(1.03,10),at(1.02,-11),at(.85,-22),at(.43,-18)],ape?white?'#c4b4c6':'#783b2c':s.skin,ink,.7);
 for(let i=0;i<3;i++){const t=.2+i*.17;line(c,[at(t,-13),at(t-.015,-2),at(t+.015,2),at(t,13)],ape?dark:s.shadow,.8)}line(c,[at(.67,-20),at(.62,-2),at(.68,19)],ape?dark:s.shadow,1);
 if(!ape){polygon(c,[at(.4,-sh*.9),at(.8,-sh*1.3),at(.4,-sh*1.18),at(.12,-sh*.75)],s.cloth,ink,1);for(let i=0;i<3;i++)line(c,[at(.78-i*.07,17),at(.72-i*.07,23)],s.shadow,.75);const tail=at(-.1,-13);poly(c,[[tail.x,tail.y],[tail.x-40,tail.y-13],[tail.x-55,tail.y-36],[tail.x-54,tail.y-5],[tail.x-73,tail.y+9],[tail.x-43,tail.y+5],[tail.x-17,tail.y+14]],s.cloth,ink,1.1)}
 const frontSh=at(.86,sh*.75);limb(frontSh,p.eF,ape?23:15);limb(p.eF,p.wF,ape?21:12);glove(c,p.eF,p.wF,{...s,skin:ape?white?'#ac94a9':'#9b7761':s.cloth,shadow:dark},pose,true);
 c.save();c.translate(p.head.x,p.head.y);c.rotate(pose.rot+(pose.head+pose.lean)*Math.PI/340);animeHead(c,ch,s.head,o);c.restore();
}
export function animeRig(c:C,ch:CharId,rig:Rig,pose:Pose,o:DrawOpts){
 o={...o,expr:o.expr??(pose.mouth>.5?'shout':'n')};
 let s=S(ch);const p=rig.p;c.save();
 if(o.transformation&&ch==='jane'){robotBody(c,p,pose,o);c.restore();return;}
 if(o.transformation&&ch==='patrick'){armoredBody(c,ch,p,pose,s,o);c.restore();return;}
 if(ch==='tubarao'&&o.transformation){megalodon(c,p,pose,o);c.restore();return;}
 if(ch==='orango'||ch==='tubarao'){creatureBody(c,ch,p,pose,s,o);c.restore();return;}
 if(o.transformation&&ch==='gabrielzin')s={...s,cloth:'#e1c39b',dark:'#ac8b79',accent:'#e292af',pants:'#e2c39c',shoe:'#dec3a0',arms:'long',leg:'pants'};
 if(o.transformation&&ch==='santox'){
  // The human base silhouette becomes the long-limbed, smiling glitch rabbit.
  s={...s,skin:'#8e58b6',shadow:'#533269',light:'#c593e1',cloth:'#bf479a',dark:'#6e2e73',pants:'#ac3d91',shoe:'#9b6abd',accent:'#e7c568',arms:'skin',leg:'pants',shoulder:19,waist:12};
 }
 coatTails(c,ch,p,s,o);weapon(c,ch,p,s,o);pantLeg(c,ch,p,s,p.kB,p.aB,p.tB,false,o);arm(c,ch,p,s,pose,p.eB,p.wB,false,o);
 // Sternocleidomastoid muscles, trapezius and clavicle support the smaller head.
 segment(c,p.neck,p.head,s.head*.44,s.head*.36,s.skin,s.shadow,s.light);paintedTorso(c,ch,p,s,o);pantLeg(c,ch,p,s,p.kF,p.aF,p.tF,true,o);waistDetails(c,ch,p,s,o);
 c.save();c.translate(p.head.x,p.head.y);c.rotate((pose.lean+pose.head)*Math.PI/330+pose.rot);animeHead(c,ch,s.head,o);c.restore();arm(c,ch,p,s,pose,p.eF,p.wF,true,o);
 if(ch==='jane'&&o.poseName?.startsWith('laptop')){
  const pos=xy(p.wF.x+2,p.wF.y+2);c.save();c.translate(pos.x,pos.y);c.rotate(-.2);poly(c,[[-13,-3],[8,-3],[15,2],[-10,4]],'#33353e',ink,.65);poly(c,[[-13,-3],[-17,-16],[5,-16],[8,-3]],'#393b44',ink,.8);poly(c,[[-14,-14],[3,-14],[5,-5],[-12,-5]],'#202e36','',0);line(c,[xy(-10,-11),xy(-6,-9),xy(-9,-7)],'#e9c64f',.65);line(c,[xy(-2,-11),xy(1,-9),xy(-1,-7)],'#e9c64f',.65);c.restore();
 }
 if(ch==='hdsh'){
  const a=axes(p).at(1.07,-10);oval(c,a.x,a.y,5,6,'#272533',ink,.8);oval(c,a.x,a.y,3,3.5,'#aa7bba');
 }
 c.restore();
}


function megalodon(c:C,p:Rig['p'],pose:Pose,o:DrawOpts){
 // A true aquatic silhouette for Benzinho, Fiquei Puto: fins and a flexing caudal
 // peduncle replace the humanoid arms/legs while the simulation owns the hurtbox.
 const center=xy(p.hip.x,-65),wave=Math.sin(o.time*.09)*4;
 c.save();c.translate(center.x,center.y);c.rotate(pose.rot+(pose.lean-10)*Math.PI/900);
 poly(c,[[-42,0],[-104,-20+wave],[-127,-53+wave],[-121,-10+wave],[-149,17+wave],[-109,11+wave],[-73,27]],'#33465d',ink,1.5);
 c.beginPath();c.moveTo(-81,1);c.bezierCurveTo(-52,-44,-2,-60,41,-39);c.bezierCurveTo(65,-31,91,-17,97,-3);c.quadraticCurveTo(91,27,47,38);c.bezierCurveTo(-11,58,-55,36,-81,1);c.closePath();c.fillStyle='#3c536c';c.fill();c.strokeStyle=ink;c.lineWidth=1.6;c.stroke();
 c.beginPath();c.moveTo(-69,9);c.bezierCurveTo(-23,9,23,-15,94,-5);c.quadraticCurveTo(89,25,46,35);c.bezierCurveTo(0,51,-41,32,-69,9);c.closePath();c.fillStyle='#d9e1df';c.fill();
 poly(c,[[-36,-36],[-21,-88],[4,-44]],'#354a62',ink,1.3);poly(c,[[-10,11],[19,50],[46,65],[29,26]],'#34485f',ink,1.3);
 poly(c,[[45,-27],[64,-25],[54,-17],[46,-17]],'#e4ece6',ink,.7);oval(c,54,-22,2.1,2.6,'#8bb4cd');oval(c,54,-22,.75,2.2,'#101a2c');line(c,[xy(44,-28),xy(65,-26)],ink,1.8);
 poly(c,[[45,5],[91,-2],[78,23],[55,29],[38,21]],'#362b3d',ink,1.1);
 for(let i=0;i<7;i++){poly(c,[[46+i*6,6-i*.7],[51+i*6,5.6-i*.7],[49+i*6,14-i*.65]],'#f8f1da','',0);poly(c,[[45+i*4.7,23],[50+i*4.7,24-i*.5],[47+i*4.7,16]],'#f8f1da','',0)}
 for(let i=0;i<4;i++)line(c,[xy(20-i*6,-4),xy(17-i*6,18)],'#6d8792',1.2);
 line(c,[xy(-40,-27),xy(-5,-39),xy(27,-30)],'#7392ab',1.3);c.restore();
}
