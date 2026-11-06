import {layerCanvas} from './canvas';
// Arenas adicionais em camadas: arquitetura pré-renderizada e pequenos detalhes vivos.
// Todas compartilham o mesmo chão e os mesmos limites físicos do jogo.
const TAU = Math.PI * 2;
type Ctx = CanvasRenderingContext2D;
type Scene = { sky: HTMLCanvasElement; mountains: HTMLCanvasElement; hall: HTMLCanvasElement; floor: HTMLCanvasElement };
const IDS = new Set(['casebre', 'praca', 'osasco', 'bolivia', 'morro', 'campo', 'casabranca', 'letsgay', 'ngb', 'zoologico', 'termodinamica']);
const canvas=layerCanvas;
function rect(c: Ctx, x: number, y: number, w: number, h: number, color: string) { c.fillStyle = color; c.fillRect(x, y, w, h); }
function line(c: Ctx, points: number[][], color: string, width = 2) { c.strokeStyle = color; c.lineWidth = width; c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); }
function poly(c: Ctx, points: number[][], color: string, stroke?: string) { c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fillStyle = color; c.fill(); if (stroke) { c.strokeStyle = stroke; c.lineWidth = 2; c.stroke(); } }
function oval(c: Ctx, x: number, y: number, rx: number, ry: number, color: string) { c.fillStyle = color; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fill(); }
function label(c: Ctx, s: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign = 'center') { c.fillStyle = color; c.font = `900 ${size}px 'Russo One',Impact,sans-serif`; c.textAlign = align; c.textBaseline = 'middle'; c.fillText(s, x, y); }
function gradient(c: Ctx, w: number, h: number, top: string, bottom: string) { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, top); g.addColorStop(1, bottom); c.fillStyle = g; c.fillRect(0, 0, w, h); }
function cloud(c: Ctx, x: number, y: number, s: number, color = '#ffffff66') { oval(c, x, y, 77 * s, 13 * s, color); oval(c, x - 24 * s, y - 12 * s, 33 * s, 19 * s, color); oval(c, x + 26 * s, y - 9 * s, 40 * s, 22 * s, color); }
function skyline(c: Ctx, base: number, color: string) { for (let i = 0; i < 27; i++) { const x = i * 64 - 32, h = 35 + (i * 71) % 117; rect(c, x, base - h, 51, h, color); for (let r = 0; r < h / 23 - 1; r++) for (let k = 0; k < 3; k++) rect(c, x + 8 + k * 14, base - h + 12 + r * 23, 6, 9, '#e9d7a133'); } }
function hill(c: Ctx, base: number, color: string, phase: number, amplitude: number) { const pts = [[0, 460]]; for (let x = 0; x <= 1600; x += 40) pts.push([x, base - Math.sin(x / 230 + phase) * amplitude - Math.sin(x / 87 + phase) * amplitude * .22]); pts.push([1600, 460]); poly(c, pts, color); }
function tree(c: Ctx, x: number, y: number, s: number, color = '#315d42') { line(c, [[x, y], [x, y - 99 * s]], '#624e3a', 10 * s); oval(c, x, y - 120 * s, 46 * s, 52 * s, color); oval(c, x - 35 * s, y - 92 * s, 36 * s, 37 * s, color); oval(c, x + 36 * s, y - 95 * s, 40 * s, 40 * s, color); }
function palm(c: Ctx, x: number, y: number, s: number, color = '#215b55') { c.strokeStyle = '#8d694c'; c.lineWidth = 14 * s; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x - 20 * s, y - 101 * s, x + 10 * s, y - 189 * s); c.stroke(); const top = y - 189 * s; for (let k = 0; k < 7; k++) { const a = -.2 + k * .53, dx = Math.cos(a) * 90 * s * (k < 3 ? 1 : -1), dy = Math.sin(a) * 34 * s; c.fillStyle = color; c.beginPath(); c.moveTo(x + 10 * s, top); c.quadraticCurveTo(x + dx * .65, top - 41 * s, x + dx, top + dy + 32 * s); c.quadraticCurveTo(x + dx * .6, top - 6 * s, x + 10 * s, top); c.fill(); } }
function lamp(c: Ctx, x: number, y: number, color = '#ffe5a4') { rect(c, x - 4, y - 120, 8, 120, '#303948'); poly(c, [[x - 18, y - 120], [x + 18, y - 120], [x + 11, y - 151], [x - 11, y - 151]], '#384555'); rect(c, x - 9, y - 145, 18, 24, color); poly(c, [[x - 21, y - 151], [x, y - 164], [x + 21, y - 151]], '#273342'); }
function sign(c: Ctx, name: string, y = 396, width = 360, color = '#283c45', ink = '#fff3cd', size = 20) { rect(c, 800 - width / 2 - 4, y - 4, width + 8, 39, '#15202a'); rect(c, 800 - width / 2, y, width, 31, color); label(c, name, 800, y + 16, size, ink); }
function bench(c: Ctx, x: number, y: number, color = '#88563f') { for (let k = 0; k < 3; k++) rect(c, x, y - 38 + k * 10, 112, 7, color); rect(c, x - 4, y - 10, 120, 9, color); for (const dx of [12, 94]) { rect(c, x + dx, y - 8, 6, 19, '#33434a'); line(c, [[x + dx, y - 35], [x + dx, y + 10]], '#33434a', 4); } }

function casebre(c: Ctx) {
  hill(c, 315, '#50675d', 2, 33); for (let i = 0; i < 8; i++) tree(c, i * 230 - 25, 410, .6 + i % 3 * .1, '#345447');
  rect(c, 0, 417, 1600, 32, '#6f6850');
  // Tábuas irregulares, telhado de zinco e varanda de uma casa simples.
  rect(c, 472, 197, 655, 226, '#84624d');
  for (let x = 474, i = 0; x < 1126; x += 29, i++) { rect(c, x, 201, 26, 218, ['#a27a58', '#8c654b', '#b08a63', '#977451'][i % 4]); line(c, [[x + 8, 210], [x + 5, 415]], '#4e403633', 1); for (const y of [225, 399]) oval(c, x + 15, y, 1.5, 1.5, '#3e3932'); }
  poly(c, [[410, 204], [478, 127], [1080, 150], [1186, 217]], '#67787a', '#2e4145');
  for (let x = 460; x < 1150; x += 24) line(c, [[x, 151 + Math.max(0, x - 478) * .035], [x - 40, 205]], '#b4bcb477', 3);
  line(c, [[411, 204], [1185, 217]], '#354a4b', 8);
  rect(c, 735, 274, 116, 149, '#302f2b'); rect(c, 742, 278, 49, 144, '#654f3e'); rect(c, 798, 278, 47, 144, '#6d5841'); oval(c, 799, 352, 3, 3, '#c4ad70');
  for (const x of [538, 957]) { rect(c, x, 258, 101, 87, '#3b4b49'); rect(c, x + 7, 265, 86, 72, '#b6c9b188'); line(c, [[x + 50, 261], [x + 50, 343]], '#514c3b', 6); line(c, [[x + 3, 301], [x + 98, 301]], '#514c3b', 5); rect(c, x - 17, 256, 20, 93, '#6c6a51'); rect(c, x + 102, 256, 20, 93, '#6c6a51'); }
  for (const x of [478, 1120]) rect(c, x, 210, 12, 226, '#624c39'); rect(c, 471, 424, 670, 13, '#544637');
  // Rede na varanda, botijão e caixotes.
  c.strokeStyle = '#c9a869'; c.lineWidth = 4; c.beginPath(); c.moveTo(505, 345); c.quadraticCurveTo(603, 421, 705, 348); c.stroke(); poly(c, [[513, 355], [689, 360], [658, 390], [557, 391]], '#9d6a62');
  rect(c, 1070, 376, 34, 47, '#848d88'); oval(c, 1087, 376, 17, 6, '#b1b9aa'); rect(c, 1080, 367, 14, 8, '#6d7973');
  for (let i = 0; i < 3; i++) { rect(c, 350 + i * 36, 408 - i % 2 * 24, 35, 29, '#a87845'); line(c, [[354 + i * 36, 412 - i % 2 * 24], [380 + i * 36, 432 - i % 2 * 24]], '#654a31', 2); }
  line(c, [[1194, 253], [1466, 272]], '#4b4940', 2); for (let i = 0; i < 5; i++) { const x = 1209 + i * 45; poly(c, [[x, 256 + i * 3], [x + 28, 258 + i * 3], [x + 33, 302 + i * 3], [x - 5, 299 + i * 3]], ['#caa78b', '#7095a0', '#b7b39a'][i % 3]); }
  sign(c, 'CASEBRE', 223, 220, '#4f5946', '#f5dfac', 23);
}

function praca(c: Ctx) {
  skyline(c, 346, '#504e72'); rect(c, 0, 355, 1600, 90, '#477169');
  for (const x of [185, 380, 1220, 1420]) tree(c, x, 416, .9, '#354f55');
  // Monumento do dedo indicador sobre uma fonte pública.
  oval(c, 800, 401, 262, 36, '#a6c1ba'); oval(c, 800, 393, 242, 29, '#476e80'); oval(c, 800, 391, 222, 23, '#72aab3');
  rect(c, 714, 328, 172, 62, '#6d8393'); poly(c, [[698, 329], [902, 329], [884, 314], [716, 314]], '#b8c2b9'); rect(c, 742, 265, 116, 51, '#879eaa');
  const bronze = '#bf9663';
  poly(c, [[765, 267], [754, 243], [752, 219], [732, 197], [732, 176], [747, 171], [770, 191], [773, 108], [777, 86], [791, 78], [804, 90], [805, 159], [819, 148], [835, 155], [839, 174], [854, 176], [860, 194], [874, 204], [871, 243], [845, 268]], bronze, '#7f6148');
  line(c, [[783, 106], [786, 210], [771, 226]], '#e0bf83', 4); line(c, [[811, 180], [815, 217]], '#876845', 3); line(c, [[839, 194], [840, 225]], '#876845', 3);
  rect(c, 736, 345, 128, 29, '#344b60'); label(c, 'DEDILHADOR', 800, 360, 13, '#f2dab4');
  for (const x of [410, 1076]) bench(c, x, 410, '#957454'); for (const x of [323, 1277]) lamp(c, x, 430, '#ffe6a6');
  for (let i = 0; i < 12; i++) { oval(c, 180 + i * 112, 437, 29, 8, '#7e9a77'); oval(c, 180 + i * 112, 431, 20, 9, '#775c92'); }
  sign(c, 'PRAÇA DO DEDILHADOR', 33, 454, '#344c61', '#eadbc0', 22);
}

function osasco(c: Ctx) {
  skyline(c, 320, '#6d6874');
  for (let i = 0; i < 12; i++) { const x = 135 * i - 20, h = 116 + i % 4 * 29; rect(c, x, 391 - h, 121, h, ['#ac825c', '#8e8d89', '#c39c78', '#b5a28d'][i % 4]); for (let k = 0; k < 4; k++) for (let r = 0; r < 4; r++) rect(c, x + 15 + k * 25, 399 - h + r * 23, 12, 15, '#59606c'); }
  // Viaduto ferroviário, pilares e comércio de rua.
  rect(c, 0, 244, 1600, 23, '#b8b9b0'); rect(c, 0, 267, 1600, 22, '#747c7c'); rect(c, 0, 240, 1600, 5, '#4a555c');
  for (const x of [185, 470, 1100, 1385]) { poly(c, [[x - 20, 285], [x + 78, 285], [x + 65, 310], [x + 47, 424], [x + 4, 424], [x - 3, 310]], '#93958e'); line(c, [[x + 7, 299], [x + 15, 422]], '#b8b8aa', 5); }
  for (let x = 0; x < 1600; x += 34) line(c, [[x, 220], [x, 242]], '#515c63', 3); line(c, [[0, 220], [1600, 220]], '#737b7f', 3);
  rect(c, 603, 258, 394, 56, '#205b75'); label(c, 'OSASCO', 800, 282, 31, '#f5e3b0'); label(c, 'CIDADE TRABALHO', 800, 304, 10, '#c1d5da');
  rect(c, 560, 334, 470, 99, '#6d7e85'); label(c, 'DEDILHO', 800, 386, 43, '#deb73e'); label(c, 'NA ÁREA', 800, 416, 20, '#283f50');
  // Carrinho tradicional de cachorro-quente.
  const x = 1178; rect(c, x, 362, 143, 60, '#e0d3a8'); rect(c, x + 5, 373, 133, 28, '#b53e38'); label(c, 'HOT DOG', x + 72, 387, 19, '#fff2b4'); rect(c, x + 10, 334, 5, 34, '#758b8e'); rect(c, x + 128, 334, 5, 34, '#758b8e'); poly(c, [[x - 15, 336], [x + 158, 336], [x + 136, 310], [x + 6, 310]], '#d44c36'); for (let k = 0; k < 5; k++) poly(c, [[x + k * 32, 310], [x + 15 + k * 32, 310], [x + 20 + k * 32, 336], [x + 2 + k * 32, 336]], '#e9bb57'); oval(c, x + 24, 425, 12, 12, '#263940'); oval(c, x + 116, 425, 12, 12, '#263940');
  rect(c, 0, 433, 1600, 11, '#bec0af'); for (let i = 0; i < 18; i++) rect(c, i * 100, 434, 45, 8, i % 2 ? '#c4b55f' : '#4f5455');
}

function bolivia(c: Ctx) {
  // Cordilheira andina com neve e casario de altitude.
  poly(c, [[0, 385], [0, 309], [115, 236], [233, 284], [390, 118], [535, 281], [706, 205], [820, 293], [1010, 110], [1165, 261], [1350, 181], [1600, 303], [1600, 442]], '#7d8196');
  poly(c, [[319, 200], [390, 118], [469, 207], [420, 184], [389, 171], [359, 205]], '#f1eee4'); poly(c, [[930, 193], [1010, 110], [1093, 193], [1048, 177], [1016, 168], [971, 196]], '#e7ede9');
  hill(c, 385, '#747d67', 3, 26);
  const colors = ['#b87652', '#b9a270', '#9c6f67', '#d0b588', '#9b7262']; for (let i = 0; i < 19; i++) { const x = i * 88 - 20, y = 305 + i % 3 * 19; rect(c, x, y, 83, 132, colors[i % 5]); poly(c, [[x - 3, y], [x + 41, y - 17], [x + 86, y]], '#795146'); for (let k = 0; k < 3; k++) rect(c, x + 10 + k * 23, y + 18, 13, 23, '#4e6565'); }
  // Igreja colonial e faixa tricolor da praça.
  rect(c, 617, 247, 366, 181, '#ddc58f'); rect(c, 645, 190, 62, 237, '#d5b275'); rect(c, 895, 190, 62, 237, '#d5b275');
  for (const x of [645, 895]) { poly(c, [[x - 8, 191], [x + 31, 161], [x + 70, 191]], '#735441'); rect(c, x + 17, 215, 28, 47, '#645a48'); line(c, [[x + 31, 145], [x + 31, 166]], '#d6bc79', 4); line(c, [[x + 23, 153], [x + 39, 153]], '#d6bc79', 4); }
  poly(c, [[711, 259], [800, 209], [889, 259]], '#e8d49b'); oval(c, 800, 282, 24, 24, '#667e77'); rect(c, 770, 347, 60, 81, '#66503a'); oval(c, 800, 348, 30, 27, '#66503a');
  for (let k = 0; k < 3; k++) rect(c, 588 - k * 17, 425 + k * 5, 424 + k * 34, 6, '#c3b48c');
  line(c, [[30, 87], [1570, 136]], '#3a4454', 3); line(c, [[30, 92], [1570, 141]], '#7f7772', 1);
  for (let i = 0; i < 9; i++) { const x = 130 + i * 166; poly(c, [[x, 299], [x + 29, 302], [x + 14, 327]], ['#bc4847', '#e1ba46', '#4f8a5b'][i % 3]); }
  sign(c, 'BOLIVIA · LOS ANDES', 43, 390, '#6b4f52', '#ffdf98', 22);
}

function morro(c: Ctx) {
  hill(c, 314, '#443b65', 2.5, 72); hill(c, 357, '#5f486b', .5, 81);
  const colors = ['#a96555', '#6f818b', '#c69b74', '#97717b', '#ae8558', '#73928a'];
  // Casas empilhadas acompanhando a encosta, caixas d'água e antenas.
  for (let row = 0; row < 4; row++) for (let col = 0; col < 15; col++) { const x = col * 115 - 60 + row % 2 * 35, yy = 185 + row * 62 + Math.abs(col - 7) * 4; const h = 63 + (col + row) % 3 * 8; rect(c, x, yy, 106, h, colors[(col + row * 3) % 6]); rect(c, x - 4, yy - 4, 114, 8, '#594b51'); for (let k = 0; k < 3; k++) { rect(c, x + 9 + k * 32, yy + 17, 19, 25, '#3b3c52'); rect(c, x + 12 + k * 32, yy + 19, 13, 19, (col + row + k) % 3 ? '#ffc971aa' : '#7e9da077'); } if ((col + row) % 3 === 0) { rect(c, x + 56, yy - 23, 27, 19, '#395767'); oval(c, x + 69, yy - 23, 14, 4, '#77919a'); } if ((col + row) % 5 === 0) { line(c, [[x + 28, yy - 4], [x + 28, yy - 39]], '#343647', 2); line(c, [[x + 12, yy - 32], [x + 44, yy - 32]], '#343647', 2); } }
  poly(c, [[716, 438], [884, 438], [826, 302], [774, 302]], '#b4a5a0'); for (let i = 0; i < 14; i++) line(c, [[775 - i * 4, 307 + i * 9], [827 + i * 4, 307 + i * 9]], '#6c6669', 3);
  for (let i = 0; i < 3; i++) { c.strokeStyle = '#2f2c41'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 195 + i * 24); c.quadraticCurveTo(790, 297 + i * 21, 1600, 210 + i * 20); c.stroke(); }
  rect(c, 360, 357, 310, 79, '#524f64'); label(c, 'BIEU', 514, 390, 48, '#f3cfb0'); label(c, 'AQUI É COMUNIDADE', 514, 423, 13, '#e1a565');
  rect(c, 987, 340, 212, 99, '#42414b'); poly(c, [[1000, 352], [1187, 352], [1175, 426], [1010, 426]], '#d6d3c1'); for (let i = 0; i < 5; i++) rect(c, 1010 + i * 35, 353, 17, 72, '#353741'); label(c, '1910', 1093, 392, 16, '#e7c580');
  sign(c, 'MORRO DO BIEU', 47, 350, '#623a54', '#ffdab5', 24);
}

function campo(c: Ctx) {
  skyline(c, 312, '#3d6268'); hill(c, 365, '#2f6157', 1.2, 28); rect(c, 0, 330, 1600, 116, '#326d52');
  // Arquibancada e alambrado; a faixa jogável mantém a geometria original.
  for (let r = 0; r < 5; r++) { rect(c, 280 - r * 21, 309 + r * 17, 1040 + r * 42, 15, r % 2 ? '#899b8c' : '#aab1a0'); for (let i = 0; i < 52; i++) { const x = 304 + i * 20, y = 306 + r * 17; oval(c, x, y, 3.6, 4.5, ['#f0c784', '#324c5e', '#e4ddd0', '#e59969'][i % 4]); rect(c, x - 4, y + 3, 8, 6, ['#f2db6a', '#c0534b', '#44697c', '#d6e2ce'][i % 4]); } }
  for (let x = 200; x <= 1400; x += 50) line(c, [[x, 296], [x, 426]], '#7ca28a77', 1); for (let y = 302; y <= 422; y += 17) line(c, [[200, y], [1400, y]], '#93b29a66', 1);
  // Trave branca com rede.
  const gx = 635, gy = 336; rect(c, gx, gy, 330, 7, '#e2e7d2'); rect(c, gx, gy, 7, 91, '#e2e7d2'); rect(c, gx + 323, gy, 7, 91, '#e2e7d2'); for (let x = gx + 16; x < gx + 324; x += 17) line(c, [[x, gy + 6], [x, 426]], '#d7e9d280', 1); for (let y = gy + 18; y < 425; y += 14) line(c, [[gx + 5, y], [gx + 325, y]], '#d7e9d280', 1);
  for (const x of [250, 1350]) { rect(c, x - 5, 124, 10, 294, '#606e72'); rect(c, x - 62, 114, 124, 43, '#384c58'); for (let i = 0; i < 6; i++) rect(c, x - 54 + i * 19, 122, 13, 25, '#fff1b3'); }
  rect(c, 668, 198, 264, 66, '#1f3d45'); label(c, 'CAMPEÕES', 800, 214, 17, '#e8e9bd'); label(c, 'CASA  0 × 0  VISITANTE', 800, 244, 16, '#b3f0b1');
  for (let i = 0; i < 8; i++) { rect(c, 285 + i * 129, 390, 122, 36, ['#ece3b2', '#386d72', '#c8d0b7'][i % 3]); label(c, ['DEDILHO', 'BOLA NA REDE', 'CAMPEÕES'][i % 3], 345 + i * 129, 408, 12, i % 3 ? '#f6e8a7' : '#42706b'); }
}

function casabranca(c: Ctx) {
  // A Casa Branca, silhueta neoclássica com pórtico e alas simétricas.
  for (let x = 80; x < 1600; x += 130) tree(c, x, 394, 1.1, '#253d4b'); rect(c, 0, 397, 1600, 47, '#365b50');
  rect(c, 346, 251, 908, 144, '#b9cdd0'); rect(c, 416, 220, 768, 174, '#d5dfda'); rect(c, 407, 210, 786, 14, '#eef0dc'); rect(c, 337, 243, 926, 12, '#e3e9dc');
  for (let row = 0; row < 2; row++) for (let k = 0; k < 13; k++) { const x = 440 + k * 57, y = 244 + row * 67; rect(c, x, y, 26, 43, '#405d6a'); rect(c, x - 3, y - 3, 32, 4, '#f3f1df'); line(c, [[x + 13, y], [x + 13, y + 43]], '#c8d8d2', 2); line(c, [[x, y + 21], [x + 26, y + 21]], '#c8d8d2', 2); }
  poly(c, [[616, 235], [800, 176], [984, 235]], '#eaf0df', '#879fa7'); poly(c, [[653, 226], [800, 187], [947, 226]], '#bccdd0'); oval(c, 800, 214, 13, 13, '#e4e9da');
  rect(c, 621, 235, 358, 15, '#f4f3dd'); for (let i = 0; i < 6; i++) { const x = 643 + i * 60; rect(c, x - 6, 249, 21, 144, '#dde8de'); rect(c, x - 10, 248, 29, 8, '#fff5d9'); rect(c, x - 12, 385, 33, 9, '#eef1df'); line(c, [[x + 10, 258], [x + 10, 383]], '#afc5c2', 2); }
  rect(c, 777, 332, 46, 61, '#364f5b'); for (let i = 0; i < 4; i++) rect(c, 611 - i * 12, 394 + i * 8, 378 + i * 24, 8, '#c7d7cf');
  rect(c, 795, 132, 4, 50, '#b7ccd3'); rect(c, 799, 135, 50, 25, '#d8d8cc'); for (let i = 0; i < 6; i++) rect(c, 799, 136 + i * 4, 50, 2, '#ad555d'); rect(c, 799, 135, 20, 14, '#41536e');
  for (let x = 180; x <= 1420; x += 28) { rect(c, x, 410, 6, 28, '#b8d0c7'); poly(c, [[x - 2, 410], [x + 3, 403], [x + 8, 410]], '#d4e2cc'); } rect(c, 180, 419, 1240, 4, '#b8d0c7');
  sign(c, 'CASA BRANCA · OVNIS', 42, 452, '#263f51', '#d5f7b3', 22); label(c, 'IDEIA: JALAM', 1230, 426, 11, '#d1e2c1');
}

function beach(c: Ctx, thermal: boolean) {
  const ocean = thermal ? '#3ca6bd' : '#6f8fc6'; rect(c, 0, 278, 1600, 123, ocean);
  const sun = thermal ? '#ffe7a0' : '#ffc8cb'; oval(c, 800, 258, 70, 70, sun); rect(c, 0, 280, 1600, 8, ocean);
  for (let j = 0; j < 9; j++) line(c, [[350 + j * 35, 290 + j * 10], [1250 - j * 35, 290 + j * 10]], thermal ? '#e5f8d166' : '#f5c5d85e', 3);
  poly(c, [[0, 397], [250, 385], [520, 398], [800, 386], [1050, 399], [1360, 384], [1600, 399], [1600, 448], [0, 448]], thermal ? '#dfc29a' : '#e1b7c1');
  // Ilhas, palmeiras e faixas de areia moldam duas praias distintas.
  poly(c, [[0, 282], [0, 233], [92, 206], [182, 257], [277, 280]], thermal ? '#658478' : '#625b81'); poly(c, [[1280, 282], [1436, 218], [1525, 232], [1600, 209], [1600, 282]], thermal ? '#507e79' : '#6b5b89');
  if (thermal) {
    // Estação de pesquisa costeira, coletores solares e circuito térmico.
    rect(c, 567, 315, 466, 112, '#e9dfbf'); rect(c, 551, 306, 498, 14, '#657d7b'); rect(c, 732, 350, 57, 77, '#4a7b83'); rect(c, 807, 339, 190, 65, '#8bbfc0'); for (let i = 0; i < 6; i++) line(c, [[820 + i * 30, 340], [820 + i * 30, 403]], '#d7e7c7', 2);
    for (let i = 0; i < 5; i++) { const x = 583 + i * 84; poly(c, [[x, 299], [x + 71, 299], [x + 57, 272], [x + 5, 272]], '#34667c', '#81c4cd'); for (let k = 1; k < 4; k++) line(c, [[x + 7 + k * 13, 275], [x + 5 + k * 17, 298]], '#a6d6c255', 1); }
    rect(c, 619, 329, 69, 73, '#f2e5c2'); label(c, 'Q = mcΔT', 654, 346, 11, '#596d78'); label(c, 'LAB', 654, 382, 22, '#3c737b');
    line(c, [[1043, 394], [1119, 394], [1119, 346], [1172, 346], [1172, 418]], '#ae7251', 11); line(c, [[1043, 392], [1117, 392], [1117, 346]], '#efb177', 4); rect(c, 1153, 374, 54, 48, '#719fa3');
    // Termômetro gigante com escala visível.
    rect(c, 440, 280, 37, 119, '#e0e5d4'); oval(c, 459, 399, 26, 26, '#d6ddd0'); rect(c, 454, 295, 10, 105, '#e77f4c'); oval(c, 459, 399, 16, 16, '#f18d46'); for (let y = 298; y < 385; y += 13) rect(c, 467, y, 8, 2, '#607a83');
    sign(c, 'PRAIA DA TERMODINÂMICA', 43, 548, '#3c6d7a', '#ffebbd', 23); palm(c, 258, 433, 1.1, '#3d7768'); palm(c, 1370, 435, 1.22, '#326a64');
  } else {
    // Quiosque colorido, bandeiras e guarda-sóis da Praia do Lets Gay.
    for (let i = 0; i < 6; i++) rect(c, 594 + i * 69, 337, 68, 91, ['#cb7386', '#d79372', '#cdbb7b', '#79b399', '#7e9bbf', '#9a82b6'][i]);
    for (const x of [590, 1007]) rect(c, x, 309, 9, 122, '#795368'); poly(c, [[560, 333], [1040, 333], [990, 291], [610, 291]], '#8d557d');
    rect(c, 664, 315, 272, 41, '#392c60'); label(c, "LET'S GAY", 800, 336, 29, '#f8dfba');
    for (let i = 0; i < 3; i++) { rect(c, 664 + i * 91, 370, 71, 42, '#55496a'); rect(c, 659 + i * 91, 411, 81, 8, '#e8d1ba'); }
    const rainbow = ['#e77785', '#e6a264', '#e9d274', '#8bbc94', '#84b9d1', '#b194cf'];
    for (const x of [414, 1177]) { rect(c, x, 244, 5, 189, '#bc97b0'); for (let k = 0; k < 6; k++) rect(c, x + 5, 251 + k * 10, 95, 10, rainbow[k]); }
    for (const x of [280, 1230]) { rect(c, x, 355, 5, 75, '#b9919c'); for (let k = 0; k < 6; k++) poly(c, [[x + 2, 321], [x - 66 + k * 23, 354], [x - 43 + k * 23, 354]], rainbow[k]); rect(c, x - 59, 424, 107, 6, '#e5c9c3'); }
    palm(c, 193, 440, 1.35, '#45647d'); palm(c, 1412, 439, 1.25, '#445e78');
    line(c, [[589, 309], [1012, 309]], '#4a405e', 2); for (let i = 0; i < 16; i++) oval(c, 594 + i * 27, 315 + Math.sin(i / 15 * Math.PI) * 13, 3.2, 4, rainbow[i % 6]);
    sign(c, 'PRAIA DO LETS GAY', 43, 460, '#61476f', '#ffe1da', 24); label(c, 'IDEIA: JALAM E DIEGÃO', 1150, 425, 10, '#674661');
  }
}

function ngb(c: Ctx) {
  gradient(c, 1600, 445, '#0c2137', '#244663');
  // Redação com painel central, ilhas de trabalho e iluminação de estúdio.
  for (let i = 0; i < 12; i++) { const x = i * 145 - 32; poly(c, [[x, 0], [x + 5, 0], [x + 145, 436], [x + 138, 436]], '#456b8144'); }
  rect(c, 413, 129, 774, 225, '#071929'); rect(c, 426, 141, 748, 202, '#13516a');
  // Mapa abstrato em silhueta e marca da emissora.
  const continents = [[[466, 189], [513, 163], [560, 175], [579, 202], [548, 229], [534, 250], [505, 228]], [[562, 235], [588, 247], [594, 278], [574, 315], [558, 287]], [[864, 186], [903, 171], [949, 181], [988, 174], [1048, 190], [1119, 215], [1070, 245], [1019, 229], [991, 249], [953, 226], [909, 235]], [[921, 244], [962, 246], [972, 273], [947, 311], [928, 282]], [[1065, 286], [1104, 278], [1129, 302], [1096, 317]]]; for (const p of continents) poly(c, p, '#5ab3bd66');
  for (let x = 440; x <= 1170; x += 60) line(c, [[x, 145], [x, 340]], '#81d5da18', 1); for (let y = 159; y <= 340; y += 30) line(c, [[430, y], [1170, y]], '#81d5da18', 1);
  oval(c, 800, 239, 133, 77, '#092d48dc'); label(c, 'NGB', 800, 224, 68, '#ddf8f2'); label(c, 'NEWS', 800, 275, 33, '#4bd8d7'); rect(c, 688, 314, 224, 21, '#bd4b57'); label(c, 'AO VIVO', 800, 325, 13, '#fff0d9');
  for (const x of [294, 1210]) { for (let r = 0; r < 3; r++) { rect(c, x, 177 + r * 57, 95, 49, '#071725'); rect(c, x + 4, 181 + r * 57, 87, 41, ['#24566c', '#31536e', '#346276'][r]); label(c, ['24H', 'NGB', 'NEWS'][r], x + 47, 201 + r * 57, 15, '#8fd5d2'); } }
  // Bancada e duas câmeras com tripés.
  poly(c, [[561, 368], [1039, 368], [1005, 432], [595, 432]], '#19344b', '#4aa6b4'); rect(c, 545, 362, 510, 12, '#b7d8d4'); line(c, [[596, 421], [1004, 421]], '#37b4c6', 4); label(c, 'NGB NEWS', 800, 400, 25, '#c1e5df');
  for (const x of [365, 1235]) { rect(c, x - 25, 328, 50, 30, '#132633'); rect(c, x + (x < 800 ? 25 : -40), 334, 15, 17, '#3c5868'); line(c, [[x, 357], [x, 402], [x - 22, 438]], '#253744', 5); line(c, [[x, 401], [x + 23, 438]], '#253744', 5); oval(c, x + 10, 332, 2, 2, '#e6636b'); }
  rect(c, 475, 93, 650, 5, '#8ad7da'); rect(c, 450, 100, 700, 4, '#34697b');
}

function orangutan(c: Ctx, x: number, y: number, s: number) {
  oval(c, x, y, 21 * s, 29 * s, '#a65b36'); oval(c, x, y - 26 * s, 18 * s, 18 * s, '#b96639'); oval(c, x, y - 23 * s, 11 * s, 11 * s, '#d6a570'); oval(c, x - 5 * s, y - 27 * s, 2 * s, 2 * s, '#352b24'); oval(c, x + 5 * s, y - 27 * s, 2 * s, 2 * s, '#352b24'); line(c, [[x - 13 * s, y - 12 * s], [x - 35 * s, y + 20 * s], [x - 32 * s, y + 38 * s]], '#9e5434', 12 * s); line(c, [[x + 14 * s, y - 12 * s], [x + 37 * s, y + 12 * s], [x + 36 * s, y + 30 * s]], '#9e5434', 12 * s); line(c, [[x - 9 * s, y + 18 * s], [x - 15 * s, y + 44 * s]], '#8f4c31', 12 * s); line(c, [[x + 9 * s, y + 18 * s], [x + 17 * s, y + 44 * s]], '#8f4c31', 12 * s);
}
function zoologico(c: Ctx) {
  hill(c, 304, '#517d67', .5, 44); for (let i = 0; i < 12; i++) tree(c, i * 147 - 20, 391, 1.2 + i % 3 * .2, ['#2e6552', '#356f56', '#3e7c5d'][i % 3]);
  // Rochedo, cascata e lagoa do recinto dos orangotangos.
  poly(c, [[541, 407], [531, 274], [575, 235], [612, 246], [641, 220], [687, 235], [725, 266], [734, 410]], '#6d7d6a'); for (const x of [553, 609, 679]) line(c, [[x, 273], [x + 21, 382]], '#4d675755', 5);
  poly(c, [[614, 257], [665, 257], [683, 400], [600, 400]], '#7ac5c2'); oval(c, 662, 407, 143, 24, '#4c9f9c'); oval(c, 662, 409, 124, 17, '#8dc9b3');
  // Troncos de escalada, ponte de cordas e animais estilizados.
  for (const x of [406, 919, 1205]) { line(c, [[x, 427], [x + 3, 239]], '#6d583b', 29); line(c, [[x - 7, 421], [x - 4, 251]], '#987c4e', 4); }
  line(c, [[400, 284], [920, 298]], '#9e8856', 7); line(c, [[919, 298], [1207, 274]], '#9e8856', 7);
  c.strokeStyle = '#c7ad76'; c.lineWidth = 4; for (const y of [279, 312]) { c.beginPath(); c.moveTo(410, y); c.quadraticCurveTo(667, y + 80, 920, y + 15); c.stroke(); }
  for (let i = 0; i < 18; i++) { const x = 422 + i * 28, y = 316 + Math.sin(i / 17 * Math.PI) * 39; line(c, [[x, y - 30], [x, y]], '#b59a64', 2); line(c, [[x - 8, y], [x + 8, y]], '#826b44', 9); }
  orangutan(c, 1001, 350, 1.25); orangutan(c, 450, 361, .8);
  for (let i = 0; i < 7; i++) { const x = 285 + i * 175; rect(c, x, 399, 9, 42, '#665d44'); line(c, [[x + 4, 407], [x + 174, 407]], '#b3ae8d', 3); line(c, [[x + 4, 426], [x + 174, 426]], '#a49e79', 3); }
  // Placa central alta para permanecer visível atrás dos lutadores.
  rect(c, 510, 88, 580, 69, '#64513a'); rect(c, 517, 94, 566, 56, '#4b6e4c'); label(c, 'ZOOLÓGICO DO ORANGOTANGO', 800, 113, 22, '#f2db91'); label(c, 'PRESERVE A SELVA · RESPEITE OS ANIMAIS', 800, 138, 11, '#d5e4a7');
  for (const x of [300, 1260]) { palm(c, x, 439, .75, '#397b53'); oval(c, x + 40, 409, 17, 6, '#d7b64e'); }
}

function makeFloor(id:string,w:number,density:number) {
  const out = canvas(w,150,density), c = out.getContext('2d')!;
  const palette: Record<string, [string, string]> = { casebre: ['#b59368', '#776950'], praca: ['#b4b8c0', '#767d94'], osasco: ['#6d747b', '#414d59'], bolivia: ['#b9a88a', '#7a726a'], morro: ['#9e8b89', '#6c6473'], campo: ['#5d9753', '#2b684b'], casabranca: ['#adc0ae', '#758e8d'], letsgay: ['#eac5bf', '#bb92ad'], ngb: ['#30536b', '#142b43'], zoologico: ['#baa277', '#727b54'], termodinamica: ['#ead2a3', '#c1a883'] };
  const colors = palette[id]; gradient(c, w, 150, colors[0], colors[1]);
  if (id === 'campo') {
    for (let x = 0; x < w; x += 135) rect(c, x, 0, 68, 150, '#79a96922'); line(c, [[800, 0], [800, 150]], '#d8eac59c', 4); c.strokeStyle = '#dfebc79c'; c.lineWidth = 3; c.beginPath(); c.ellipse(800, 48, 154, 51, 0, 0, TAU); c.stroke();
    for (let i = 0; i < 190; i++) line(c, [[(i * 83) % w, (i * 31) % 150], [(i * 83) % w + 2, (i * 31) % 150 - 4]], '#c8da8c33', 1);
  } else if (id === 'letsgay' || id === 'termodinamica' || id === 'casebre' || id === 'zoologico') {
    for (let i = 0; i < 130; i++) oval(c, (i * 83) % w, 5 + (i * 41) % 142, 1 + i % 3, 1, '#f7e2bc66');
    if (id === 'zoologico') { for (let i = 0; i < 19; i++) oval(c, 15 + i * 89, 32 + i % 3 * 32, 29, 10, '#b6b38b77'); }
    if (id === 'casebre') for (let i = 0; i < 7; i++) line(c, [[i * 260, 13 + i % 3 * 25], [i * 260 + 90, 33 + i % 3 * 25], [i * 260 + 144, 27 + i % 3 * 25]], '#685b3b33', 2);
  } else {
    const ys = [0, 12, 33, 64, 108, 150]; for (let row = 0; row < ys.length - 1; row++) { line(c, [[0, ys[row]], [w, ys[row]]], '#112d3c38', 1.5); for (let j = -10; j < 25; j++) { const x = j * (id === 'ngb' ? 160 : 95) + row % 2 * 45; line(c, [[800 + (x - 800) * (1 + ys[row] / 230), ys[row]], [800 + (x - 800) * (1 + ys[row + 1] / 230), ys[row + 1]]], '#0b2b3938', 1); } }
    if (id === 'praca') for (let x = 0; x < w; x += 100) poly(c, [[x, 32], [x + 30, 48], [x, 65], [x - 30, 48]], '#ddd2b655');
    if (id === 'osasco') for (let x = 0; x < w; x += 170) rect(c, x, 87, 91, 4, '#dcc99588');
    if (id === 'ngb') { line(c, [[0, 21], [w, 21]], '#37c1d744', 3); line(c, [[0, 106], [w, 106]], '#e56a6b33', 2); }
  }
  rect(c, 0, 0, w, 4, '#1b35394d'); return out;
}

export function buildExtraScene(id:string,w:number,h:number,density=1): Scene | null {
  if (!IDS.has(id)) return null;
  const sky = canvas(960,h,density), sc = sky.getContext('2d')!;
  const palettes: Record<string, [string, string]> = { casebre: ['#607b87', '#d2c1a5'], praca: ['#373e68', '#c69b9e'], osasco: ['#687f99', '#e3bb83'], bolivia: ['#4d8db2', '#c8e2dd'], morro: ['#4b436e', '#e29c8c'], campo: ['#234a5b', '#84a7a3'], casabranca: ['#0c1937', '#536b83'], letsgay: ['#8e6cac', '#ffc5be'], ngb: ['#0c2137', '#214764'], zoologico: ['#698f86', '#d0d8ad'], termodinamica: ['#2c8eb6', '#ffe0ab'] };
  gradient(sc, 960, h, ...palettes[id]);
  if (id === 'casabranca') { for (let i = 0; i < 83; i++) oval(sc, (i * 127) % 960, 13 + i * 47 % 246, i % 5 ? 1 : 1.7, i % 5 ? 1 : 1.7, '#e1f3e4aa'); oval(sc, 768, 92, 29, 29, '#dcdfc7'); oval(sc, 759, 86, 27, 27, '#162647'); }
  else if (id !== 'ngb') { cloud(sc, 169, 109, 1.1); cloud(sc, 709, 77, 1.3); cloud(sc, 465, 164, .7, '#fff3d138'); }
  const mountains = canvas(w,h,density), mc = mountains.getContext('2d')!;
  if (id === 'bolivia') hill(mc, 339, '#91a4aa', 1, 84);
  else if (id === 'letsgay' || id === 'termodinamica') hill(mc, 344, id === 'letsgay' ? '#8789ab' : '#88a9a5', 1, 33);
  else if (id === 'casabranca') hill(mc, 368, '#273e50', 2, 21);
  else if (id === 'ngb') { rect(mc, 0, 55, w, 390, '#12354a'); skyline(mc, 341, '#24617a'); }
  else skyline(mc, 344, ['casebre', 'zoologico', 'campo'].includes(id) ? '#648b7c88' : '#8b8b9b66');
  const hall = canvas(w,h,density), hc = hall.getContext('2d')!;
  const builders: Record<string, (c: Ctx) => void> = { casebre, praca, osasco, bolivia, morro, campo, casabranca, letsgay: c => beach(c, false), ngb, zoologico, termodinamica: c => beach(c, true) };
  builders[id](hc);
  return { sky, mountains, hall, floor: makeFloor(id,w,density) };
}

/** Detalhes pequenos animados no mesmo plano de parallax da arquitetura. */
export function drawExtraStageDetails(c: Ctx, id: string, time: number) {
  if (!IDS.has(id)) return;
  const t = time * .025;
  c.save();
  if (id === 'casebre') {
    for (let i = 0; i < 3; i++) { const phase = (t * .45 + i * .34) % 1; oval(c, 1060 + Math.sin(t + i) * 8, 158 - phase * 64, 8 + phase * 15, 5 + phase * 8, `rgba(210,212,194,${.22 * (1 - phase)})`); }
    oval(c, 798, 251, 7, 9, '#f9da94'); oval(c, 798, 251, 24 + Math.sin(t) * 3, 24, '#ffd37d16');
  } else if (id === 'praca') {
    for (const x of [663, 704, 896, 937]) { c.strokeStyle = '#b1e0e3aa'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, 391); c.quadraticCurveTo((x + 800) / 2, 335 + Math.sin(t + x) * 3, 800, 381); c.stroke(); }
    for (let i = 0; i < 14; i++) { const x = 595 + i * 32, y = 392 + Math.sin(t * 2 + i) * 4; oval(c, x, y, 10 + Math.sin(t + i) * 3, 2, '#ccedef88'); }
  } else if (id === 'osasco') {
    const x = (t * 44) % 1900 - 300; rect(c, x, 190, 293, 47, '#d8dddd'); rect(c, x, 221, 293, 10, '#315f87'); for (let k = 0; k < 10; k++) rect(c, x + 9 + k * 28, 197, 19, 18, '#567a91'); line(c, [[x, 236], [x + 293, 236]], '#384a59', 4);
  } else if (id === 'bolivia') {
    for (let i = 0; i < 4; i++) { const x = ((t * 17 + i * 426) % 1700) - 50, y = 87 + x * .032; line(c, [[x, y], [x, y + 20]], '#39495a', 2); rect(c, x - 21, y + 18, 42, 31, ['#d75847', '#dfba46', '#5a9b69'][i % 3]); rect(c, x - 16, y + 22, 32, 15, '#b9d8d9'); line(c, [[x, y + 23], [x, y + 37]], '#3b5963', 2); }
  } else if (id === 'morro') {
    for (let i = 0; i < 7; i++) { const x = 367 + i * 142, y = 140 + Math.sin(t * .35 + i) * 15 + i % 2 * 35; poly(c, [[x, y - 11], [x + 9, y], [x, y + 14], [x - 9, y]], ['#e3be62', '#c96d87', '#85bac4'][i % 3]); line(c, [[x, y + 13], [x + Math.sin(t + i) * 10, y + 37]], '#d4a395', 1); }
  } else if (id === 'campo') {
    for (const x of [250, 1350]) { const g = c.createRadialGradient(x, 137, 8, x, 137, 94); g.addColorStop(0, '#fffbd758'); g.addColorStop(1, '#fffbd700'); c.fillStyle = g; c.fillRect(x - 94, 44, 188, 188); }
    const x = 1045 + Math.sin(t * .3) * 92; oval(c, x, 434, 10, 3, '#173c4155'); oval(c, x, 422 - Math.abs(Math.sin(t * 1.3)) * 9, 8, 8, '#ebe7ca'); poly(c, [[x - 3, 417 - Math.abs(Math.sin(t * 1.3)) * 9], [x + 3, 417 - Math.abs(Math.sin(t * 1.3)) * 9], [x + 5, 423 - Math.abs(Math.sin(t * 1.3)) * 9], [x, 427 - Math.abs(Math.sin(t * 1.3)) * 9], [x - 5, 423 - Math.abs(Math.sin(t * 1.3)) * 9]], '#35534d');
  } else if (id === 'casabranca') {
    for (let i = 0; i < 3; i++) { const x = 460 + i * 345 + Math.sin(t * .45 + i * 2) * 39, y = 113 + Math.sin(t * .8 + i) * 16 + i % 2 * 38; const beam = c.createLinearGradient(x, y, x, 402); beam.addColorStop(0, '#c5ff9c28'); beam.addColorStop(1, '#c5ff9c00'); poly(c, [[x - 17, y + 7], [x + 17, y + 7], [x + 92, 410], [x - 92, 410]], '#baff7b0b'); c.fillStyle = beam; c.beginPath(); c.moveTo(x - 17, y + 7); c.lineTo(x + 17, y + 7); c.lineTo(x + 70, 399); c.lineTo(x - 70, 399); c.closePath(); c.fill(); oval(c, x, y - 4, 24, 14, '#98b5bd'); oval(c, x, y + 3, 49, 9, '#728f9d'); oval(c, x, y + 5, 37, 4, '#b5f5a4'); for (let k = 0; k < 5; k++) oval(c, x - 29 + k * 15, y + 5, 3, 2, k % 2 ? '#effac9' : '#8bdeab'); }
  } else if (id === 'letsgay' || id === 'termodinamica') {
    for (let j = 0; j < 5; j++) { const y = 342 + j * 11 + Math.sin(t * .65 + j) * 3; c.strokeStyle = id === 'letsgay' ? '#f4d9e184' : '#e9f4d9a0'; c.lineWidth = 2 + j * .2; c.beginPath(); for (let x = 0; x <= 1600; x += 18) { const yy = y + Math.sin(x / 61 + t * .8 + j) * 2; x ? c.lineTo(x, yy) : c.moveTo(x, yy); } c.stroke(); }
    if (id === 'termodinamica') { for (let i = 0; i < 4; i++) { const phase = (t * .22 + i * .25) % 1; oval(c, 1180 + Math.sin(t + i) * 5, 377 - phase * 52, 3 + phase * 8, 5 + phase * 8, `rgba(243,237,205,${.35 * (1 - phase)})`); } }
    else for (let i = 0; i < 16; i++) { const x = 594 + i * 27, y = 315 + Math.sin(i / 15 * Math.PI) * 13; oval(c, x, y, 7, 7, `rgba(255,225,216,${.11 + Math.sin(t * 2 + i) * .05})`); }
  } else if (id === 'ngb') {
    c.save(); c.beginPath(); c.rect(427, 346, 746, 10); c.clip(); rect(c, 427, 346, 746, 10, '#d7686d'); const x = 427 - (t * 24) % 440; for (let i = 0; i < 4; i++) label(c, 'NGB NEWS  ·  DEDILHO WARS AO VIVO  ·', x + i * 440, 352, 8, '#fff0d8', 'left'); c.restore();
    oval(c, 700, 325, 3.5, 3.5, Math.sin(t * 3) > 0 ? '#ffe6b7' : '#ce5965');
    for (let i = 0; i < 11; i++) rect(c, 1052 + i * 7, 299 - (6 + Math.sin(t * 2 + i) * 5), 4, 12 + Math.sin(t * 2 + i) * 5, '#82e0d1');
  } else if (id === 'zoologico') {
    for (let i = 0; i < 8; i++) line(c, [[619 + i * 6, 261 + (t * 18 + i * 21) % 120], [618 + i * 6, 278 + (t * 18 + i * 21) % 120]], '#d0f4e6a0', 2); for (let i = 0; i < 4; i++) oval(c, 611 + i * 39, 408, 13 + Math.sin(t + i) * 5, 2, '#d0ead29a');
    const bx = 1125 + Math.sin(t * .5) * 19, by = 229 + Math.cos(t * .8) * 10; oval(c, bx - 4, by, 6 + Math.sin(t * 7) * 2, 5, '#ecba6c'); oval(c, bx + 4, by, 6 + Math.sin(t * 7) * 2, 5, '#d99265'); line(c, [[bx, by - 4], [bx, by + 5]], '#574c39', 1.5);
  }
  c.restore();
}
