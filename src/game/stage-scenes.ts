// Cenários brasileiros desenhados em camadas vetoriais; nenhuma imagem externa.
const TAU = Math.PI * 2;
function canvas(w: number, h: number) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function rect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) { c.fillStyle = color; c.fillRect(x, y, w, h); }
function line(c: CanvasRenderingContext2D, points: number[][], color: string, width = 2) { c.strokeStyle = color; c.lineWidth = width; c.beginPath(); points.forEach(([x,y],i) => i ? c.lineTo(x,y) : c.moveTo(x,y)); c.stroke(); }
function poly(c: CanvasRenderingContext2D, points: number[][], color: string, stroke?: string) { c.beginPath(); points.forEach(([x,y],i) => i ? c.lineTo(x,y) : c.moveTo(x,y)); c.closePath(); c.fillStyle=color;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();} }
function ellipse(c: CanvasRenderingContext2D,x:number,y:number,rx:number,ry:number,color:string){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fill();}
function text(c: CanvasRenderingContext2D,s:string,x:number,y:number,size:number,color:string,align:CanvasTextAlign='center'){c.fillStyle=color;c.font=`900 ${size}px 'Russo One',Impact,sans-serif`;c.textAlign=align;c.textBaseline='middle';c.fillText(s,x,y);}
function cloud(c:CanvasRenderingContext2D,x:number,y:number,scale:number,color='#ffffff99'){ellipse(c,x,y,70*scale,14*scale,color);ellipse(c,x-20*scale,y-8*scale,30*scale,16*scale,color);ellipse(c,x+23*scale,y-9*scale,40*scale,20*scale,color);}
function gradient(c:CanvasRenderingContext2D,w:number,h:number,top:string,bottom:string){const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,top);g.addColorStop(1,bottom);c.fillStyle=g;c.fillRect(0,0,w,h);}
function tree(c:CanvasRenderingContext2D,x:number,y:number,s:number,color:string){rect(c,x-6*s,y-100*s,12*s,100*s,'#554331');ellipse(c,x,y-120*s,42*s,48*s,color);ellipse(c,x-30*s,y-98*s,34*s,30*s,color);ellipse(c,x+27*s,y-100*s,38*s,35*s,color);}
function skyline(c:CanvasRenderingContext2D,w:number,base:number,color:string){for(let i=0;i<Math.ceil(w/66)+2;i++){const x=i*66-40;const h=45+((i*73)%130);rect(c,x,base-h,49,h,color);for(let j=0;j<4;j++)for(let k=0;k<Math.floor(h/22)-1;k++)rect(c,x+7+j*10,base-h+12+k*20,4,7,'#d6e1e144');}}
function floor(id:string,w:number){const out=canvas(w,150),c=out.getContext('2d')!;const colors:Record<string,[string,string]>={neto:['#b9b3a5','#777873'],liberdade:['#898d9c','#414554'],curitiba:['#b4bba7','#728577'],piaui:['#c98857','#855033'],planalto:['#dae5e9','#9baeb9']};const a=colors[id]??colors.neto;gradient(c,w,150,a[0],a[1]);const ys=[0,10,26,50,83,126,150];for(let row=0;row<ys.length-1;row++){line(c,[[0,ys[row]],[w,ys[row]]],id==='piaui'?'#60392055':'#26343e44',1.5);for(let col=-10;col<30;col++){const u=(col+(row%2)*.5)*90;line(c,[[800+(u-800)*(1+ys[row]/180),ys[row]],[800+(u-800)*(1+ys[row+1]/180),ys[row+1]]],id==='piaui'?'#75452944':'#24323c33',1);}}if(id==='liberdade'){for(let x=0;x<w;x+=88)poly(c,[[x,22],[x+22,36],[x,50],[x-22,36]],'#d9d6c855');}if(id==='piaui'){for(let i=0;i<65;i++)ellipse(c,(i*83)%w,7+(i*17)%137,2+(i%4),1,'#edc99766');}rect(c,0,0,w,4,'#26313c88');return out;}
function neto(c:CanvasRenderingContext2D,w:number){
 skyline(c,w,302,'#768aa0');rect(c,0,315,w,130,'#b3ae9c');
 // Fachada baseada na referência: faixa azul, letreiro creme e vitrines abertas.
 rect(c,210,112,1180,300,'#e9e7cc');rect(c,207,196,1186,58,'#1e61a3');
 rect(c,228,252,1144,163,'#172b35');
 const glass=c.createLinearGradient(0,252,0,416);glass.addColorStop(0,'#425769');glass.addColorStop(1,'#14212c');c.fillStyle=glass;c.fillRect(246,256,1107,155);
 for(let x=260;x<1360;x+=124){rect(c,x,257,6,157,'#839da8');line(c,[[x+9,266],[x+90,386]],'#ccf4ff22',9);}
 rect(c,355,122,890,73,'#f7f0d6');
 text(c,'NETO',610,150,48,'#c94b46');text(c,'SUPERMERCADOS',928,158,36,'#c94b46');
 // Carrinho simplificado no letreiro.
 line(c,[[383,142],[397,142],[411,172],[448,172],[457,145]],'#3da5c4',4);line(c,[[405,151],[451,151]],'#3da5c4',3);ellipse(c,416,181,4,4,'#3da5c4');ellipse(c,446,181,4,4,'#3da5c4');
 text(c,'PREÇO BOM · GENTE DA GENTE',800,224,18,'#ffffff');
 for(let x=290,i=0;x<1330;x+=175,i++){const py=289+(i%2)*6;rect(c,x,py,93,108,'#f9e7a8');rect(c,x+4,py+4,85,25,'#c73530');text(c,'OFERTA',x+46,py+17,15,'#fff');text(c,['ARROZ','CAFÉ','FEIJÃO','AÇÚCAR','BANANA','LEITE'][i%6],x+46,py+50,12,'#49413b');text(c,['9,99','12,90','6,49','4,99','3,99','4,79'][i%6],x+46,py+78,24,'#c72928');}
 for(const x of [230,510,1090,1368]){rect(c,x,249,10,170,'#2668aa');rect(c,x-8,411,27,9,'#879393');}
 // Entrada central e carrinhos de compra.
 rect(c,690,259,215,158,'#0c1b22');rect(c,718,278,7,138,'#64828e');rect(c,878,278,7,138,'#64828e');text(c,'ENTRADA',800,277,13,'#d5f7df');
 for(let i=0;i<3;i++){const x=1170+i*24;line(c,[[x,374],[x+44,379],[x+35,405],[x+6,401],[x,374],[x-13,371]],'#9baeb3',3);ellipse(c,x+8,412,4,4,'#23303a');ellipse(c,x+34,412,4,4,'#23303a');}
 // Bicicleta encostada na calçada.
 for(const x of [290,357]){c.strokeStyle='#263b45';c.lineWidth=4;c.beginPath();c.arc(x,420,25,0,TAU);c.stroke();}line(c,[[290,420],[316,385],[336,420],[290,420],[323,402],[357,420],[344,382],[361,381]],'#49635e',3);line(c,[[306,384],[326,384]],'#18232d',4);
 rect(c,170,435,1260,8,'#7b7c73');
}
function lantern(c:CanvasRenderingContext2D,x:number,y:number,color:string){line(c,[[x,y-18],[x,y+2]],'#252031',2);ellipse(c,x,y+20,15,23,color);rect(c,x-10,y-3,20,5,'#352637');rect(c,x-10,y+40,20,5,'#352637');for(let i=-2;i<=2;i++)line(c,[[x+i*5,y+1],[x+i*5,y+40]],'#6e1d2b66',1);}
function liberdade(c:CanvasRenderingContext2D,w:number){
 skyline(c,w,338,'#576176');
 const shops=['MERCEARIA','LÁMEN','LIVRARIA','CHÁ & DOCES','BONS VENTOS'];
 for(let i=0;i<8;i++){const x=i*210-35;const h=173+(i%3)*36;rect(c,x,430-h,197,h,['#9a5b57','#687989','#d5b68a','#815f78'][i%4]);rect(c,x+9,430-h+16,179,28,'#2e2b3b');text(c,shops[i%shops.length],x+98,430-h+30,14,'#fce3ad');rect(c,x+14,430-h+55,168,h-55,'#302c3c');for(let k=0;k<3;k++){rect(c,x+24+k*54,430-h+68,43,63,'#e4b76c');line(c,[[x+24+k*54,430-h+99],[x+67+k*54,430-h+99]],'#462d35',2);}poly(c,[[x-5,430-h+52],[x+202,430-h+52],[x+186,430-h+72],[x+5,430-h+72]],'#b63b3d');}
 // Torii monumental e lanternas características da Liberdade.
 for(const x of [470,1130]){rect(c,x-16,144,32,295,'#a82d38');rect(c,x-24,423,48,14,'#3c2636');}
 poly(c,[[420,142],[1180,142],[1212,117],[1191,154],[800,172],[409,154],[388,117]],'#a72c38','#4f2938');rect(c,446,192,708,18,'#b33a3e');rect(c,786,158,28,56,'#782b35');
 rect(c,734,176,132,56,'#332636');text(c,'LIBERDADE',800,193,14,'#f9dfa4');text(c,'SÃO PAULO',800,215,12,'#e9c88c');
 line(c,[[0,229],[1600,229]],'#3b2b3c',3);for(let x=65;x<w;x+=150)lantern(c,x,229,'#d94645');
 for(const x of [260,1340]){rect(c,x,180,9,257,'#393140');poly(c,[[x-30,190],[x+39,190],[x+28,175],[x-20,175]],'#d33b41');lantern(c,x+5,195,'#f15c4a');}
 rect(c,0,434,w,8,'#4e4f5f');
}
function araucaria(c:CanvasRenderingContext2D,x:number,y:number,s:number){rect(c,x-4*s,y-177*s,8*s,177*s,'#48584a');for(let j=0;j<5;j++){const yy=y-(100+j*21)*s;const span=(63-j*5)*s;line(c,[[x-span,yy-21*s],[x,yy],[x+span,yy-21*s]],'#344e43',5*s);ellipse(c,x-span*.7,yy-21*s,span*.55,10*s,'#355f4d');ellipse(c,x+span*.7,yy-21*s,span*.55,10*s,'#355f4d');}ellipse(c,x,y-206*s,56*s,14*s,'#416d58');}
function curitiba(c:CanvasRenderingContext2D,w:number){
 rect(c,0,309,w,136,'#567d61');skyline(c,w,319,'#8faba2');
 for(let x=0;x<w;x+=145)tree(c,x+20,355,.8+(x%3)*.05,'#42694f');
 // Estufa do Jardim Botânico: pavilhões de vidro e cúpulas metálicas.
 const left=476,base=380;
 const glass=c.createLinearGradient(0,180,0,base);glass.addColorStop(0,'#c9e5e3bb');glass.addColorStop(.5,'#8bb9b5cc');glass.addColorStop(1,'#486f6bd9');
 c.fillStyle=glass;c.strokeStyle='#e5efdf';c.lineWidth=4;
 for(const [x,span,top] of [[left,190,219],[934,190,219],[666,268,166]]){
  c.beginPath();c.moveTo(x,base);c.lineTo(x,top+63);c.bezierCurveTo(x,top+28,x+span*.22,top,x+span*.5,top);c.bezierCurveTo(x+span*.78,top,x+span,top+28,x+span,top+63);c.lineTo(x+span,base);c.closePath();c.fill();c.stroke();
  for(let i=1;i<8;i++){const xx=x+span*i/8;const curve=Math.sqrt(Math.max(0,1-Math.pow((i/8-.5)*2,2)));line(c,[[xx,top+63-63*curve],[xx,base]],'#d8e8df',2);}
  for(let yy=top+64;yy<base;yy+=27)line(c,[[x,yy],[x+span,yy]],'#d8e8df',2);
 }
 rect(c,790,152,20,24,'#dbe9d9');ellipse(c,800,150,12,6,'#dbe9d9');rect(c,780,317,40,63,'#324f4c');
 for(let i=0;i<3;i++)rect(c,435-i*12,380+i*11,730+i*24,11,['#bcc8ae','#b2bfaa','#9eaf98'][i]);
 // Jardim francês e alameda central atrás do piso de luta.
 poly(c,[[737,414],[863,414],[944,446],[656,446]],'#d5d2ba');
 for(let i=0;i<4;i++){rect(c,320+i*65,410,46,23,'#2c6342');rect(c,1040+i*65,410,46,23,'#2c6342');for(let k=0;k<5;k++){ellipse(c,326+i*65+k*8,418,3,3,i%2?'#e5b7c9':'#efd087');ellipse(c,1046+i*65+k*8,418,3,3,i%2?'#e5b7c9':'#efd087');}}
 araucaria(c,276,420,1.3);araucaria(c,1325,421,1.15);araucaria(c,100,401,.8);araucaria(c,1490,411,.9);
 rect(c,618,397,364,26,'#416c54');text(c,'JARDIM BOTÂNICO · CURITIBA',800,410,15,'#e6f0d3');
}
function cactus(c:CanvasRenderingContext2D,x:number,y:number,s:number){c.strokeStyle='#3e634a';c.lineWidth=13*s;c.lineCap='round';c.beginPath();c.moveTo(x,y);c.lineTo(x,y-92*s);c.moveTo(x,y-39*s);c.lineTo(x-27*s,y-45*s);c.lineTo(x-27*s,y-70*s);c.moveTo(x,y-56*s);c.lineTo(x+25*s,y-62*s);c.lineTo(x+25*s,y-83*s);c.stroke();c.lineCap='butt';line(c,[[x-2*s,y-4*s],[x-2*s,y-88*s]],'#83a06d',2*s);}
function piaui(c:CanvasRenderingContext2D,w:number){
 // Mesas e paredões da Serra da Capivara, com camadas de arenito.
 poly(c,[[0,415],[0,280],[160,278],[180,202],[344,202],[364,300],[500,303],[548,246],[700,246],[730,335],[864,325],[888,242],[1090,242],[1108,300],[1270,300],[1305,223],[1475,223],[1510,284],[1600,279],[1600,445]],'#b96b4b');
 for(let k=0;k<4;k++)line(c,[[0,315+k*22],[320,310+k*23],[650,337+k*15],[980,310+k*24],[1300,325+k*18],[1600,320+k*21]],'#7f473666',4);
 poly(c,[[0,444],[0,359],[175,339],[300,388],[455,361],[650,389],[800,372],[970,396],[1120,364],[1350,377],[1600,348],[1600,445]],'#91513d');
 // Casario simples, igreja e vegetação da caatinga.
 for(const [x,y,col] of [[420,363,'#f1ca92'],[535,376,'#dbb27e'],[1050,374,'#e1b18a']] as [number,number,string][]){rect(c,x,y,87,65,col);poly(c,[[x-6,y],[x+43,y-32],[x+95,y]],'#7d3a30');rect(c,x+35,y+27,20,38,'#654331');rect(c,x+8,y+19,18,21,'#557366');}
 rect(c,745,331,110,98,'#e6c497');poly(c,[[733,332],[800,298],[866,332]],'#913f31');rect(c,791,359,20,70,'#574233');rect(c,777,325,46,14,'#d1a778');line(c,[[800,281],[800,302]],'#805132',4);line(c,[[790,289],[810,289]],'#805132',4);
 for(const [x,y,sc] of [[230,434,1.3],[352,432,.75],[1230,433,1.15],[1390,435,.8],[80,435,.9]])cactus(c,x,y,sc);
 for(let i=0;i<18;i++){const x=(i*179)%w;poly(c,[[x-20,439],[x-12,424-i%13],[x+9,423-i%11],[x+24,439]],'#b0784d');}
 rect(c,684,411,232,26,'#694131');text(c,'PIAUÍ · SERRA & SOL',800,424,15,'#ffe6aa');
}
function planalto(c:CanvasRenderingContext2D,w:number){
 rect(c,0,336,w,109,'#729b67');skyline(c,w,334,'#a3b9b2');
 // Espelho d'água e palácio modernista em Brasília.
 rect(c,260,385,1080,55,'#68a6b7');for(let i=0;i<8;i++)line(c,[[280+i*40,395+i*5],[1240-i*24,395+i*5]],'#d8f1ee55',2);
 rect(c,377,202,846,182,'#91bdc6');
 const glass=c.createLinearGradient(0,209,0,377);glass.addColorStop(0,'#79a6b3');glass.addColorStop(.5,'#c2dce0');glass.addColorStop(1,'#638f9f');c.fillStyle=glass;c.fillRect(381,211,838,163);
 for(let x=396;x<1217;x+=32)rect(c,x,210,3,166,'#416c7c');for(let y=239;y<377;y+=37)rect(c,380,y,840,4,'#537e8b');
 rect(c,346,188,908,17,'#f8f5df');rect(c,340,377,920,14,'#e9eddb');
 // Colunas curvas, a assinatura arquitetônica do Planalto.
 for(let i=0;i<9;i++){const x=370+i*107;c.fillStyle='#f4f3e7';c.beginPath();c.moveTo(x-10,202);c.bezierCurveTo(x+9,237,x+7,290,x-14,335);c.quadraticCurveTo(x-23,357,x-31,377);c.lineTo(x+26,377);c.bezierCurveTo(x-1,330,x+1,242,x+27,202);c.closePath();c.fill();line(c,[[x-30,377],[x+26,377]],'#cad8d1',3);}
 // Rampa e espelhos de reflexo.
 poly(c,[[774,374],[841,374],[1017,436],[925,436]],'#e4e7d5','#a6b7ad');line(c,[[774,369],[927,429],[1017,429]],'#d3dfd7',3);
 for(let i=0;i<7;i++)rect(c,395+i*111,397,34,18,'#d7eee033');
 // Bandeira brasileira em mastro alto.
 rect(c,304,159,4,225,'#c7d7d8');rect(c,308,163,85,51,'#287e48');poly(c,[[319,188],[350,169],[382,188],[350,207]],'#f7d456');ellipse(c,350,188,12,12,'#315483');line(c,[[340,186],[360,190]],'#fff',2);
 rect(c,566,402,468,26,'#3d6774');text(c,'PALÁCIO DO PLANALTO',800,415,18,'#edf6ed');
}
export function buildOutdoorScene(id: string, w: number, h: number) {
 const sky=canvas(960,h),sc=sky.getContext('2d')!;
 const palette:Record<string,[string,string]>={neto:['#2673a7','#d5e8e0'],liberdade:['#7b87ac','#efd1c0'],curitiba:['#7ba7b7','#e5ead9'],piaui:['#6d3a69','#ffd17b'],planalto:['#2f86bf','#d7edf0']};
 const colors=palette[id]??palette.neto;gradient(sc,960,h,colors[0],colors[1]);
 if(id==='piaui'){ellipse(sc,677,203,57,57,'#ffd780');cloud(sc,220,125,1.5,'#e5a8a366');cloud(sc,700,83,1.4,'#e7a4ad44');}else{cloud(sc,170,99,1.1);cloud(sc,707,126,1.4);cloud(sc,441,47,.8);}
 const mountains=canvas(w,h),mc=mountains.getContext('2d')!;
 // Distant landscape layer creates stable low-cost parallax across all camera positions.
 if(id==='piaui'){poly(mc,[[0,430],[0,324],[170,287],[350,340],[570,290],[820,335],[1040,280],[1260,331],[1450,284],[1600,315],[1600,430]],'#87526488');}
 else {skyline(mc,w,355,id==='curitiba'?'#7c9c8c':'#7894a088');}
 const hall=canvas(w,h),hc=hall.getContext('2d')!;
 ({neto,liberdade,curitiba,piaui,planalto}[id]??neto)(hc,w);
 return {sky,mountains,hall,floor:floor(id,w)};
}
