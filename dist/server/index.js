// src/game/accessories.ts
var ACCESSORY_STYLES = {
  ulisses: { id: "katana", name: "Katana Rakuyo", allNormals: true },
  felipence: { id: "guitar", name: "Guitarra", allNormals: true },
  bieu: { id: "screwdriver", name: "Chave de fenda", allNormals: false },
  aneninha: { id: "spray", name: "Lata de spray", allNormals: false }
};
var NAMES = {
  ulisses: { pL: "Corte R\xE1pido", pM: "Corte Cruzado", pH: "Corte Descendente", kL: "Golpe de Cabo", kM: "Corte de Retorno", kH: "Corte Ascendente", cP: "Corte Baixo", cK: "Varredura de L\xE2mina", jP: "Corte A\xE9reo", jK: "Queda da L\xE2mina" },
  felipence: { pL: "Batida de Guitarra", pM: "Varredura de Guitarra", pH: "Quebra Acorde", kL: "Toque do Bra\xE7o", kM: "Balan\xE7o da Guitarra", kH: "Guitarra Ascendente", cP: "Riff Rasteiro", cK: "Varredura do Corpo", jP: "Riff A\xE9reo", jK: "Queda da Guitarra" },
  bieu: { pL: "Cabo da Chave", pM: "Chave Cruzada", pH: "Chave de Impacto", cP: "Chave Rasteira", jP: "Chave A\xE9rea" },
  aneninha: { pL: "Batida de Lata", pM: "Lata Cruzada", pH: "Lata de Impacto", cP: "Lata Rasteira", jP: "Lata A\xE9rea" }
};
function applyAccessoryNormals(ch, moves) {
  const style = ACCESSORY_STYLES[ch];
  if (!style) return;
  for (const m of Object.values(moves)) if (m.kind === "normal" && !m.grab && m.id !== "headbutt" && (style.allNormals || /^(p[LMH]|cP|jP)$/.test(m.id))) {
    m.accessory = style.id;
    m.label = NAMES[ch]?.[m.id] ?? m.label;
  }
}

// src/game/woc-data.ts
var NEW_FIGHTERS = ["patrick", "gabrielzin", "ulisses", "felipence", "hdsh"];
function createWocFighters(normals, base2) {
  const make = (id, name, color, hp, walk, reach, poses, specials, superName, bio) => {
    const ps = Object.fromEntries(Object.entries(base2).map(([k, v]) => [k, { ...v }]));
    ps.idle = { ...base2.idle, ...poses[0] };
    for (let i = 0; i < 3; i++) {
      ps[`w${i + 1}_s`] = { ...ps.idle, ...poses[i + 1], lean: (poses[i + 1]?.lean ?? 0) - 12 };
      ps[`w${i + 1}_a`] = { ...ps.idle, ...poses[i + 1] };
    }
    const moves = normals(id === "patrick" ? 1.05 : id === "gabrielzin" ? 0.85 : 0.95, id === "patrick" ? 2 : 0, reach);
    const timings = id === "patrick" ? [[16, 4, 25, 65], [19, 6, 30, 78], [28, 4, 36, 96]] : id === "gabrielzin" ? [[15, 3, 24, 38], [21, 4, 30, 64], [18, 3, 26, 42]] : id === "ulisses" ? [[16, 5, 27, 62], [20, 3, 32, 58], [22, 3, 29, 48]] : id === "felipence" ? [[18, 4, 28, 60], [20, 6, 30, 66], [23, 3, 29, 52]] : [[18, 3, 28, 0], [20, 3, 27, 46], [30, 3, 32, 60]];
    for (let i = 0; i < 3; i++) {
      const [startup, active, recovery, dmg] = timings[i];
      moves[`s${i + 1}`] = { ...baseMove, id: `s${i + 1}`, startup, active, recovery, dmg, whiff: 10, hb: [15, 135 + reach, 40, 155], poses: [`w${i + 1}_s`, `w${i + 1}_a`], label: specials[i].toUpperCase() };
    }
    return { id, name, short: name.split(" ")[0].toUpperCase(), title: { patrick: "O EMPRES\xC1RIO DA COURA\xC7A", gabrielzin: "CARISMA EM COMBATE", ulisses: "O VAMPIRO DE TWITCHCITY", felipence: "A SINFONIA DOS CAMPE\xD5ES", hdsh: "O ANALISTA DA ARENA" }[id], color, color2: "#262031", glow: color, hp, walk, walkBack: walk * 0.79, jumpVy: 16, jumpVx: walk + 1, dashVx: walk * 2.5, dashDur: 15, pushW: id === "patrick" ? 32 : 26, hurtH: id === "gabrielzin" ? 159 : id === "patrick" ? 185 : 178, crouchH: 106, moves, poses: ps, attrs: [{ label: "VELOCIDADE", v: id === "patrick" ? 2 : 4 }, { label: "FOR\xC7A", v: id === "patrick" ? 5 : 3 }, { label: "ALCANCE", v: reach > 15 ? 5 : 3 }, { label: "T\xC9CNICA", v: 4 }], specials: specials.map((name2, i) => ({ key: ["U", "I", "O"][i], name: name2, desc: "" })), superName, quote: bio, bio };
  };
  const defs = {
    patrick: make("patrick", "PATRICK INVINCIBLE", "#dc6464", 1160, 3.45, 8, [{ lean: 2, fa1: 48, fa2: -85, ba1: 100, ba2: -90 }, { lean: 8, fa1: -30, fa2: -110, ba1: 75, ba2: -120 }, { lean: 40, fa1: 80, fa2: -100, ba1: 110, ba2: -90 }, { lean: 30, ba1: 0, ba2: -5, fa1: 95, fa2: -100 }], ["Escudo de Casco", "Investida Blindada", "Punho Coura\xE7ado"], "COLIS\xC3O INVENC\xCDVEL", "Ex-lutador de MMA. Armadura com compromisso e contra-ataques de perto."),
    gabrielzin: make("gabrielzin", "GABRIELZIN", "#f472b6", 930, 4.45, -5, [{ lean: 6, fa1: 40, fa2: -100, ba1: 115, ba2: -65 }, { lean: 16, fa1: 0, fa2: -5, finger: 1 }, { lean: 25, fa1: 0, fa2: -25, ba1: 155, ba2: 175 }, { lean: 4, fa1: -35, fa2: -65, finger: 1 }], ["Beijinho", "Abra\xE7o de Cupido", "Piscadinha"], "KAWAI!", "Charme em combate: proj\xE9teis de cora\xE7\xE3o e captura de perto, com prepara\xE7\xE3o vis\xEDvel."),
    ulisses: make("ulisses", "ULISSES O NEFASTO", "#b91c3c", 1020, 4.1, 24, [{ lean: 3, fa1: 60, fa2: -65, ba1: 110, ba2: -80 }, { lean: 24, fa1: -10, fa2: -5, ba1: 140, ba2: -60 }, { lean: 35, head: -12, fa1: 25, fa2: -30, mouth: 1 }, { lean: 18, fa1: -10, fa2: 0, finger: 1 }], ["Distor\xE7\xE3o de Membros", "Presas Sugadoras", "Manipula\xE7\xE3o de Sangue"], "CORTES DE RAKUYO", "Vampiro de Twitchcity. Capture sangue com as presas para sustentar a regenera\xE7\xE3o."),
    felipence: make("felipence", "FELIPENCE", "#fb923c", 1010, 3.95, 16, [{ lean: 4, fa1: 50, fa2: -70, ba1: 120, ba2: -55 }, { lean: 22, fa1: 28, fa2: -10, ba1: 115, ba2: -40 }, { lean: -8, fa1: -40, fa2: -100, ba1: 145, ba2: -120, mouth: 1 }, { lean: 22, fa1: 30, fa2: -10, ba1: 120, ba2: -50 }], ["Riff Impacto", "Pulso de Som", "Lamento Ressonante"], "MY IMMORTAL", "Guitarrista de Lea Amy. Alcance musical e ondas sonoras com pausas para resposta."),
    hdsh: make("hdsh", "H?D?SH", "#b667ff", 980, 3.85, 6, [{ lean: 3, fa1: 45, fa2: -90, ba1: 110, ba2: -65 }, { lean: 35, fa1: 20, fa2: 0, ba1: 120, ba2: -65 }, { lean: 10, fa1: -8, fa2: 0, finger: 1 }, { lean: 0, fa1: -70, fa2: -110, ba1: 115, ba2: -70 }], ["Atari de Territ\xF3rio", "An\xE1lise de Tend\xEAncia", "Airdrop Hunter"], "FULL BOX 200", "An\xE1lise e desenvolvimento: feche territ\xF3rio, intercepte trajet\xF3rias e anuncie o airdrop.")
  };
  Object.assign(defs.patrick.moves.s1, { hb: [10, 116, 55, 165], kb: 7 });
  Object.assign(defs.patrick.moves.s2, { advance: [15, 27, 8], hb: [15, 155, 35, 170], kb: 9 });
  Object.assign(defs.patrick.moves.s3, { kb: 10, pierce: 0.12, blockstun: 18, launch: 7, charge: true, whiff: 16 });
  Object.assign(defs.gabrielzin.moves.s1, { dmg: 38, kb: 6 });
  Object.assign(defs.gabrielzin.moves.s2, { grab: "cupid", unblockable: true, hb: [0, 92, 0, 160], advance: [16, 22, 5], whiff: 18 });
  Object.assign(defs.ulisses.moves.s1, { hb: [25, 235, 65, 155], recovery: 31, kb: 7 });
  Object.assign(defs.ulisses.moves.s2, { grab: "vampire", unblockable: true, hb: [0, 88, 0, 170], whiff: 18 });
  Object.assign(defs.felipence.moves.s1, { hb: [15, 195, 45, 160], kb: 9 });
  Object.assign(defs.felipence.moves.s2, { hb: [-110, 145, 20, 175], kb: 10, launch: 5, whiff: 16 });
  Object.assign(defs.hdsh.moves.s3, { level: "high", launch: 5, hitstun: 23 });
  Object.assign(defs.patrick.poses.win, { lean: -3, fa1: 95, fa2: 90, ba1: 105, ba2: 95, head: -8 });
  Object.assign(defs.gabrielzin.poses.win, { lean: -7, fa1: -25, fa2: -95, ba1: 115, ba2: -110, finger: 1, mouth: 1 });
  Object.assign(defs.ulisses.poses.win, { lean: -4, fa1: 70, fa2: 25, ba1: -80, ba2: -135, head: -12 });
  Object.assign(defs.felipence.poses.win, { lean: -12, fa1: 48, fa2: 0, ba1: 145, ba2: 175, head: -15, mouth: 1 });
  Object.assign(defs.hdsh.poses.win, { lean: -2, fa1: -60, fa2: -120, ba1: 110, ba2: 80, head: -6, finger: 1 });
  for (const id of NEW_FIGHTERS) defs[id].poses.taunt = { ...defs[id].poses.win, lean: defs[id].poses.win.lean + 4 };
  const descriptions = {
    patrick: ["Protege o bra\xE7o nos frames ativos; perde para agarr\xF5es e recupera vulner\xE1vel.", "Avan\xE7o anunciado, sem invulnerabilidade. Bloqueie e puna.", "Soco lento que pressiona a guarda, sem tornar a defesa in\xFAtil."],
    gabrielzin: ["Cora\xE7\xE3o que explode em um contato, empurra e pode ser bloqueado.", "Abra\xE7o capturado apenas de perto e fora de combos verdadeiros. Erro \xE9 pun\xEDvel.", "Proj\xE9til rosa de um acerto; usa o limite universal de dist\xE2ncia."],
    ulisses: ["Bra\xE7o distorcido de alcance elevado, recupera\xE7\xE3o longa e sem rastreamento.", "Presas de perto: captura sangue, restaura pouca vida e perde para ataques.", "L\xE2mina de sangue em linha reta. Defenda ou salte."],
    felipence: ["Golpe de guitarra que empurra; espa\xE7o para punir se errar.", "Explos\xE3o sonora pr\xF3xima dos dois lados, sem invulnerabilidade.", "Nota sonora de um contato com chip reduzido."],
    hdsh: ["Uma \xE1rea de Go por vez, dura at\xE9 2 s e reduz o avan\xE7o. Salte ou acerte o analista.", "Seta em linha reta de um acerto, sem rastreamento.", "Marca o ch\xE3o por 30 frames antes da queda. Mova-se, salte ou defenda em p\xE9."]
  };
  for (const id of NEW_FIGHTERS) defs[id].specials.forEach((s, i) => s.desc = descriptions[id][i]);
  return defs;
}
var baseMove = { id: "", kind: "special", rank: 9, startup: 18, active: 4, recovery: 26, whiff: 10, dmg: 60, hitstun: 22, blockstun: 12, kb: 6, kbBlock: 4, hb: [15, 135, 40, 155], level: "mid", launch: 0, launchVx: 5, hitstop: 8, shake: 7, power: 1.4, poses: ["idle", "idle"] };

// src/game/shark-choreography.ts
var SHARK_KISS_DAMAGE = 64;
var SHARK_ULT_DURATION = 210;
var SHARK_ULT_TAIL_FRAME = 138;
var SHARK_ULT_THROW = 700;
var SHARK_ULT_BEATS = [[60, 12], [82, 12], [104, 12], [SHARK_ULT_TAIL_FRAME, 254]];
var SHARK_ULT_DAMAGE = SHARK_ULT_BEATS.reduce((sum, [, damage]) => sum + damage, 0);
var clamp = (n) => Math.max(0, Math.min(1, n));
function sharkUltMotion(t) {
  return {
    phase: t < 30 ? "transform" : t < 52 ? "approach" : t < 116 ? "lick" : t < SHARK_ULT_TAIL_FRAME ? "windup" : t < 148 ? "tail" : t < 190 ? "flight" : "restore",
    transform: clamp(t / 30),
    restore: clamp((t - 190) / 20),
    tongue: Math.max(0, ...SHARK_ULT_BEATS.slice(0, 3).map(([at]) => 1 - Math.abs(t - at) / 8)),
    windup: clamp((t - 116) / 22),
    flight: clamp((t - SHARK_ULT_TAIL_FRAME) / 47)
  };
}

// src/game/data.ts
var CHAR_IDS = ["caetano", "orango", "tubarao", "rickzera", "bieu", "nomad", "renngotti", "aneninha", "santox", "jao", "jane", "cristyan", "eneas", "patrick", "gabrielzin", "ulisses", "felipence", "hdsh"];
var RANGED_MOVES = {
  caetano: [],
  orango: ["s1"],
  tubarao: [],
  rickzera: ["s1"],
  bieu: ["s2", "s3"],
  nomad: ["s1", "s2", "s3"],
  renngotti: ["s2", "s3"],
  aneninha: ["s2", "s3"],
  santox: ["s1"],
  jao: ["s1", "s2", "s3"],
  jane: ["s1"],
  cristyan: [],
  eneas: ["s1", "s2", "s3"],
  patrick: [],
  gabrielzin: ["s1", "s3"],
  ulisses: ["s3"],
  felipence: ["s3"],
  hdsh: ["s1", "s2", "s3"]
};
var mvBase = {
  id: "",
  kind: "normal",
  rank: 1,
  startup: 5,
  active: 3,
  recovery: 10,
  whiff: 0,
  dmg: 20,
  hitstun: 14,
  blockstun: 9,
  kb: 3,
  kbBlock: 2,
  hb: [20, 90, 100, 140],
  level: "mid",
  launch: 0,
  launchVx: 0,
  hitstop: 6,
  shake: 2,
  power: 0.6,
  poses: ["idle", "idle"]
};
function mv(id, o) {
  return [id, { ...mvBase, id, ...o }];
}
var cIdle = { lean: 6, head: 0, fa1: 45, fa2: -70, ba1: 95, ba2: -75, fl1: 62, fl2: 102, bl1: 118, bl2: 82, rot: 0, finger: 0, mouth: 0 };
var cp = (o) => ({ ...cIdle, ...o });
var cCrouch = cp({ lean: 20, fa1: 50, fa2: -60, ba1: 100, ba2: -70, fl1: 30, fl2: 118, bl1: 148, bl2: 62 });
var caetanoPoses = {
  idle: cIdle,
  crouch: cCrouch,
  jump: cp({ lean: 0, fa1: 30, fa2: -80, ba1: 120, ba2: -60, fl1: 40, fl2: 120, bl1: 100, bl2: 160 }),
  block: cp({ lean: 4, fa1: -10, fa2: -100, ba1: 5, ba2: -95 }),
  blockC: { ...cCrouch, fa1: -10, fa2: -100, ba1: 5, ba2: -95 },
  hit: cp({ lean: -22, head: -18, fa1: 100, fa2: 70, ba1: 130, ba2: 90, fl1: 85, fl2: 95, bl1: 105, bl2: 90, mouth: 1 }),
  hitLow: cp({ lean: 25, head: 15, fa1: 70, fa2: 40, ba1: 90, ba2: 60, fl1: 40, fl2: 110, bl1: 140, bl2: 70, mouth: 1 }),
  air: cp({ lean: -35, head: -25, fa1: -120, fa2: -100, ba1: -150, ba2: -110, fl1: 60, fl2: 90, bl1: 40, bl2: 120, rot: -0.9, mouth: 1 }),
  down: cp({ lean: 0, head: 0, fa1: 85, fa2: 90, ba1: 95, ba2: 100, fl1: 80, fl2: 100, bl1: 95, bl2: 85, rot: -1.5708, mouth: 1 }),
  getup: cp({ lean: 40, fa1: 70, fa2: 40, ba1: 80, ba2: 60, fl1: 30, fl2: 120, bl1: 150, bl2: 60, rot: -0.25 }),
  win: cp({ lean: -4, head: -10, fa1: 70, fa2: -170, ba1: 110, ba2: -10, fl1: 85, fl2: 92, bl1: 95, bl2: 88 }),
  grabbed: cp({ lean: -20, head: -25, fa1: -120, fa2: -100, ba1: -140, ba2: -90, fl1: 85, fl2: 95, bl1: 100, bl2: 80, mouth: 1 }),
  rush: cp({ lean: 45, fa1: 150, fa2: 170, ba1: 160, ba2: 175, fl1: 30, fl2: 80, bl1: 130, bl2: 120 }),
  taunt: cp({ lean: 8, head: -6, fa1: -12, fa2: -8, finger: 1, ba1: 100, ba2: -100, fl1: 70, fl2: 100, bl1: 110, bl2: 85, mouth: 1 }),
  pL_s: cp({ fa1: 70, fa2: -120, lean: 2 }),
  pL_a: cp({ fa1: -5, fa2: -2, lean: 14, ba1: 100, ba2: -100, fl1: 55, fl2: 100 }),
  pM_s: cp({ lean: -6, ba1: 75, ba2: -130, fa1: 80, fa2: -90 }),
  pM_a: cp({ ba1: 0, ba2: -3, lean: 20, fa1: 110, fa2: -110, fl1: 50, fl2: 95, bl1: 135, bl2: 100 }),
  pH_s: cp({ lean: -10, ba1: 70, ba2: -140, fl1: 55, fl2: 105 }),
  pH_a: cp({ ba1: -12, ba2: -8, lean: 28, fl1: 45, fl2: 90, bl1: 140, bl2: 110, fa1: 120, fa2: -60 }),
  kL_s: cp({ fl1: 20, fl2: 120, lean: -4 }),
  kL_a: cp({ fl1: 5, fl2: -5, lean: -8, bl1: 100, bl2: 90 }),
  kM_s: cp({ fl1: 15, fl2: 130, lean: -10 }),
  kM_a: cp({ fl1: -22, fl2: -18, lean: -20, bl1: 100, bl2: 90 }),
  kH_s: cp({ fl1: 10, fl2: 135, lean: -18, fa1: 70, fa2: -110 }),
  kH_a: cp({ fl1: -48, fl2: -44, lean: -32, bl1: 95, bl2: 88, fa1: 110, fa2: 90 }),
  cP_s: { ...cCrouch },
  cP_a: { ...cCrouch, fa1: -20, fa2: -15, lean: 28 },
  cK_s: { ...cCrouch, lean: 5 },
  cK_a: { ...cCrouch, lean: -30, fl1: 25, fl2: 15, ba1: 130, ba2: 100, bl1: 150 },
  jP_s: cp({ lean: 0, fa1: 30, fa2: -80, ba1: 120, ba2: -60, fl1: 40, fl2: 120, bl1: 100, bl2: 160 }),
  jP_a: cp({ lean: 12, fa1: -10, fa2: -5, ba1: 110, ba2: -70, fl1: 40, fl2: 120, bl1: 100, bl2: 160 }),
  jK_s: cp({ lean: 0, fl1: 40, fl2: 120, bl1: 100, bl2: 160 }),
  jK_a: cp({ lean: -22, fl1: 30, fl2: 25, bl1: 120, bl2: 150, fa1: 100, fa2: -120 }),
  chute_s: cp({ lean: 22, fa1: 60, fa2: -20, ba1: 110, ba2: -30, fl1: 45, fl2: 110, bl1: 135, bl2: 70 }),
  chute_a: cp({ lean: -38, fa1: -150, fa2: -170, ba1: 150, ba2: 170, fl1: -8, fl2: -12, bl1: 100, bl2: 92 }),
  dedo_s: cp({ lean: -6, fa1: 80, fa2: -95, finger: 1 }),
  dedo_a: cp({ fa1: -5, fa2: -3, finger: 1, lean: 24, ba1: 110, ba2: -90, fl1: 45, fl2: 90, bl1: 140, bl2: 100 }),
  soco_s: cp({ lean: -30, ba1: 172, ba2: 178, fa1: -20, fa2: -40, fl1: 50, fl2: 100, bl1: 130, bl2: 95, head: -8 }),
  soco_a: cp({ lean: 36, ba1: -3, ba2: 0, fl1: 40, fl2: 95, bl1: 150, bl2: 110, fa1: 140, fa2: -100, mouth: 1 })
};
var caetanoMoves = Object.fromEntries([
  mv("pL", { rank: 1, startup: 4, active: 3, recovery: 8, dmg: 22, hitstun: 13, blockstun: 8, kb: 2.5, hb: [20, 95, 105, 140], poses: ["pL_s", "pL_a"], trail: "fw", hitstop: 5 }),
  mv("pM", { rank: 2, startup: 6, active: 4, recovery: 13, dmg: 40, hitstun: 17, blockstun: 11, kb: 4, hb: [20, 115, 100, 142], poses: ["pM_s", "pM_a"], trail: "bw", hitstop: 7, power: 0.9 }),
  mv("pH", { rank: 3, startup: 9, active: 4, recovery: 19, dmg: 65, hitstun: 22, blockstun: 14, kb: 7, kbBlock: 4, hb: [20, 130, 95, 145], poses: ["pH_s", "pH_a"], trail: "bw", hitstop: 9, shake: 5, power: 1.2, launch: 6, launchVx: 5 }),
  mv("kL", { rank: 1, startup: 5, active: 3, recovery: 10, dmg: 24, hitstun: 13, blockstun: 8, kb: 2.5, hb: [15, 100, 50, 100], poses: ["kL_s", "kL_a"], trail: "fa", hitstop: 5 }),
  mv("kM", { rank: 2, startup: 7, active: 4, recovery: 14, dmg: 45, hitstun: 18, blockstun: 12, kb: 5, hb: [20, 118, 80, 140], poses: ["kM_s", "kM_a"], trail: "fa", hitstop: 7, power: 0.9 }),
  mv("kH", { rank: 3, startup: 10, active: 5, recovery: 21, dmg: 70, hitstun: 23, blockstun: 15, kb: 8, kbBlock: 5, hb: [20, 125, 70, 165], poses: ["kH_s", "kH_a"], trail: "fa", hitstop: 9, shake: 5, power: 1.2, launch: 6, launchVx: 6 }),
  mv("cP", { rank: 1, startup: 5, active: 3, recovery: 9, dmg: 25, hitstun: 13, blockstun: 8, kb: 2, hb: [20, 100, 50, 95], poses: ["cP_s", "cP_a"], trail: "fw", hitstop: 5 }),
  mv("cK", { rank: 2, startup: 8, active: 4, recovery: 22, dmg: 50, hitstun: 22, blockstun: 12, kb: 6, hb: [10, 135, 0, 35], level: "low", poses: ["cK_s", "cK_a"], trail: "fa", hitstop: 8, power: 1, launch: 5, launchVx: 4 }),
  mv("jP", { rank: 2, air: true, level: "high", startup: 5, active: 10, recovery: 0, dmg: 50, hitstun: 18, blockstun: 12, kb: 4, hb: [10, 95, 20, 125], poses: ["jP_s", "jP_a"], trail: "fw", hitstop: 7, power: 0.9 }),
  mv("jK", { rank: 2, air: true, level: "high", startup: 6, active: 10, recovery: 0, dmg: 55, hitstun: 19, blockstun: 12, kb: 5, hb: [5, 100, -10, 85], poses: ["jK_s", "jK_a"], trail: "fa", hitstop: 7, power: 1 }),
  mv("s1", {
    kind: "special",
    rank: 9,
    startup: 12,
    active: 8,
    recovery: 22,
    whiff: 8,
    dmg: 90,
    hitstun: 26,
    blockstun: 16,
    kb: 9,
    kbBlock: 6,
    hb: [10, 155, 25, 155],
    launch: 8,
    launchVx: 7,
    hitstop: 10,
    shake: 9,
    power: 2,
    poses: ["chute_s", "chute_a"],
    trail: "fa",
    advance: [10, 20, 4],
    label: "CHUTE DA CONSPIRA\xC7\xC3O",
    turn: [3, 14],
    sound: "purple"
  }),
  mv("s2", {
    kind: "special",
    rank: 9,
    startup: 8,
    active: 5,
    recovery: 16,
    whiff: 6,
    dmg: 55,
    hitstun: 14,
    blockstun: 10,
    kb: 3,
    kbBlock: 1,
    hb: [30, 140, 100, 140],
    hitstop: 11,
    shake: 4,
    power: 1.5,
    poses: ["dedo_s", "dedo_a"],
    trail: "fw",
    advance: [6, 15, 13],
    dedilho: true,
    pierce: 0.55,
    label: "DEDILHO PERFURANTE",
    sound: "purple"
  }),
  mv("s3", {
    kind: "special",
    rank: 9,
    startup: 30,
    active: 6,
    recovery: 26,
    whiff: 34,
    dmg: 140,
    hitstun: 30,
    blockstun: 20,
    kb: 12,
    kbBlock: 8,
    hb: [20, 130, 60, 155],
    launch: 11,
    launchVx: 9,
    hitstop: 15,
    shake: 22,
    power: 3,
    poses: ["soco_s", "soco_a"],
    advance: [28, 36, 5],
    label: "SOCO PEGO!",
    charge: true,
    sound: "purple"
  })
]);
var oIdle = { lean: 38, head: -8, fa1: 70, fa2: 78, ba1: 98, ba2: 92, fl1: 60, fl2: 100, bl1: 120, bl2: 80, rot: 0, finger: 0, mouth: 0 };
var op = (o) => ({ ...oIdle, ...o });
var oCrouch = op({ lean: 55, fa1: 40, fa2: 100, ba1: 40, ba2: 110, fl1: 35, fl2: 115, bl1: 145, bl2: 65 });
var orangoPoses = {
  idle: oIdle,
  crouch: oCrouch,
  jump: op({ lean: 20, fa1: -40, fa2: -70, ba1: -20, ba2: -50, fl1: 50, fl2: 120, bl1: 100, bl2: 150 }),
  block: op({ lean: 25, fa1: -20, fa2: -110, ba1: -5, ba2: -100 }),
  blockC: { ...oCrouch, fa1: -20, fa2: -110, ba1: -5, ba2: -100, lean: 45 },
  hit: op({ lean: 12, head: -28, fa1: 120, fa2: 100, ba1: 140, ba2: 110, fl1: 80, fl2: 95, bl1: 105, bl2: 90, mouth: 1 }),
  hitLow: op({ lean: 50, head: 10, fa1: 80, fa2: 70, ba1: 100, ba2: 80, mouth: 1 }),
  air: op({ lean: 0, head: -25, fa1: -130, fa2: -100, ba1: -150, ba2: -110, fl1: 60, fl2: 100, bl1: 40, bl2: 120, rot: -0.9, mouth: 1 }),
  down: op({ lean: 0, head: 0, fa1: 100, fa2: 105, ba1: 110, ba2: 100, fl1: 80, fl2: 100, bl1: 95, bl2: 85, rot: -1.5708, mouth: 1 }),
  getup: op({ lean: 60, rot: -0.2 }),
  win: op({ lean: -4, head: -20, fa1: 50, fa2: -150, ba1: 130, ba2: -150, fl1: 85, fl2: 92, bl1: 95, bl2: 88, mouth: 1 }),
  grabbed: op({ lean: -10, head: -30, fa1: -130, fa2: -100, ba1: -140, ba2: -90, fl1: 85, fl2: 95, bl1: 100, bl2: 80, mouth: 1 }),
  rush: op({ lean: 62, fa1: 30, fa2: 20, ba1: 110, ba2: 100, fl1: 20, fl2: 90, bl1: 150, bl2: 80, mouth: 1 }),
  roar: op({ lean: -10, head: -32, mouth: 1, fa1: -60, fa2: -110, ba1: -120, ba2: -80, fl1: 80, fl2: 95, bl1: 100, bl2: 85 }),
  slam: op({ lean: 62, fa1: 75, fa2: 65, ba1: 85, ba2: 75, mouth: 1 }),
  taunt: op({ lean: -10, head: -32, mouth: 1, fa1: -60, fa2: -110, ba1: -120, ba2: -80, fl1: 80, fl2: 95, bl1: 100, bl2: 85 }),
  grabHold: op({ lean: 42, fa1: -8, fa2: -5, ba1: 80, ba2: 85, mouth: 1 }),
  pullIn: op({ lean: 50, fa1: 50, fa2: -70, ba1: 90, ba2: 90, mouth: 1 }),
  throwUp: op({ lean: -4, fa1: -95, fa2: -90, ba1: -100, ba2: -95, fl1: 85, fl2: 92, bl1: 95, bl2: 88, mouth: 1 }),
  throwDown: op({ lean: 58, fa1: 60, fa2: 55, ba1: 65, ba2: 60, mouth: 1 }),
  bite: op({ lean: 76, head: 28, mouth: 1, fa1: 20, fa2: 40, ba1: 30, ba2: 50, fl1: 35, fl2: 115, bl1: 145, bl2: 65 }),
  pL_s: op({ fa1: 30, fa2: -70, lean: 30 }),
  pL_a: op({ fa1: 5, fa2: 0, lean: 44 }),
  pM_s: op({ fa1: -130, fa2: -110, lean: 24 }),
  pM_a: op({ fa1: 25, fa2: 15, lean: 50 }),
  pH_s: op({ fa1: -120, fa2: -130, ba1: -110, ba2: -120, lean: 8, head: -22 }),
  pH_a: op({ fa1: 60, fa2: 50, ba1: 65, ba2: 55, lean: 58, mouth: 1 }),
  kL_s: op({ fl1: 20, fl2: 100, lean: 32 }),
  kL_a: op({ fl1: 8, fl2: 0, lean: 40 }),
  kM_s: op({ fl1: 15, fl2: 115, lean: 44 }),
  kM_a: op({ fl1: -14, fl2: -8, lean: 48 }),
  kH_s: op({ lean: 52, fl1: 30, fl2: 110, bl1: 140, bl2: 100 }),
  kH_a: op({ lean: 72, fl1: -35, fl2: -30, bl1: -20, bl2: -25, fa1: 80, fa2: 85, ba1: 100, ba2: 95, mouth: 1 }),
  cP_s: { ...oCrouch },
  cP_a: { ...oCrouch, fa1: 10, fa2: 5, lean: 62 },
  cK_s: { ...oCrouch },
  cK_a: { ...oCrouch, lean: 66, fl1: 15, fl2: 5 },
  jP_s: op({ lean: 30, fa1: -40, fa2: -70, ba1: -20, ba2: -50, fl1: 50, fl2: 120, bl1: 100, bl2: 150 }),
  jP_a: op({ lean: 44, fa1: 20, fa2: 15, ba1: 30, ba2: 20, fl1: 50, fl2: 120, bl1: 100, bl2: 150, mouth: 1 }),
  jK_s: op({ lean: 20, fl1: 50, fl2: 120, bl1: 100, bl2: 150, fa1: -40, fa2: -70 }),
  jK_a: op({ lean: 30, fl1: 25, fl2: 20, bl1: 100, bl2: 150, fa1: -60, fa2: -80, ba1: -40, ba2: -70 }),
  dedo_s: op({ lean: 20, fa1: 60, fa2: -100, finger: 1, ba1: 90, ba2: 90 }),
  dedo_a: op({ lean: 46, fa1: -3, fa2: -1, finger: 1, ba1: 80, ba2: 85, mouth: 1 }),
  puxao_s: op({ lean: 30, fa1: -20, fa2: -10, ba1: -20, ba2: -10 }),
  puxao_a: op({ lean: 48, fa1: -5, fa2: 5, ba1: 5, ba2: 10, mouth: 1 }),
  mord_s: op({ lean: 70, fa1: 80, fa2: 85, ba1: 90, ba2: 92, fl1: 30, fl2: 110, bl1: 140, bl2: 70 }),
  mord_a: op({ lean: 80, fa1: -20, fa2: -10, ba1: -15, ba2: -5, fl1: 120, fl2: 150, bl1: 60, bl2: 120, mouth: 1 })
};
var orangoMoves = Object.fromEntries([
  mv("pL", { rank: 1, startup: 6, active: 3, recovery: 11, dmg: 30, hitstun: 14, blockstun: 9, kb: 3.5, hb: [25, 140, 85, 130], poses: ["pL_s", "pL_a"], trail: "fw", hitstop: 6 }),
  mv("pM", { rank: 2, startup: 9, active: 4, recovery: 17, dmg: 55, hitstun: 18, blockstun: 12, kb: 5, hb: [25, 150, 60, 125], poses: ["pM_s", "pM_a"], trail: "fw", hitstop: 8, shake: 3, power: 1 }),
  mv("pH", { rank: 3, startup: 14, active: 5, recovery: 25, dmg: 90, hitstun: 24, blockstun: 16, kb: 9, kbBlock: 5, hb: [20, 160, 20, 125], poses: ["pH_s", "pH_a"], trail: "fw", hitstop: 11, shake: 8, power: 1.6, launch: 7, launchVx: 6 }),
  mv("kL", { rank: 1, startup: 7, active: 3, recovery: 12, dmg: 32, hitstun: 14, blockstun: 9, kb: 3.5, hb: [20, 108, 20, 65], poses: ["kL_s", "kL_a"], trail: "fa", hitstop: 6 }),
  mv("kM", { rank: 2, startup: 10, active: 4, recovery: 18, dmg: 60, hitstun: 19, blockstun: 12, kb: 5.5, hb: [20, 120, 25, 90], poses: ["kM_s", "kM_a"], trail: "fa", hitstop: 8, shake: 3, power: 1 }),
  mv("kH", { rank: 3, startup: 14, active: 5, recovery: 27, dmg: 95, hitstun: 25, blockstun: 16, kb: 10, kbBlock: 6, hb: [20, 150, 30, 140], poses: ["kH_s", "kH_a"], trail: "fa", hitstop: 11, shake: 8, power: 1.6, launch: 7, launchVx: 7 }),
  mv("cP", { rank: 1, startup: 7, active: 3, recovery: 12, dmg: 34, hitstun: 14, blockstun: 9, kb: 3, hb: [25, 135, 30, 80], poses: ["cP_s", "cP_a"], trail: "fw", hitstop: 6 }),
  mv("cK", { rank: 2, startup: 11, active: 4, recovery: 26, dmg: 65, hitstun: 22, blockstun: 13, kb: 7, hb: [10, 130, 0, 35], level: "low", poses: ["cK_s", "cK_a"], trail: "fa", hitstop: 9, shake: 4, power: 1.2, launch: 5, launchVx: 5 }),
  mv("jP", { rank: 2, air: true, level: "high", startup: 7, active: 10, recovery: 0, dmg: 65, hitstun: 19, blockstun: 13, kb: 5, hb: [10, 120, 0, 110], poses: ["jP_s", "jP_a"], trail: "fw", hitstop: 8, power: 1.1 }),
  mv("jK", { rank: 2, air: true, level: "high", startup: 8, active: 10, recovery: 0, dmg: 70, hitstun: 20, blockstun: 13, kb: 6, hb: [5, 105, -15, 80], poses: ["jK_s", "jK_a"], trail: "fa", hitstop: 8, power: 1.2 }),
  mv("s1", {
    kind: "special",
    rank: 9,
    startup: 24,
    active: 7,
    recovery: 28,
    whiff: 10,
    dmg: 140,
    hitstun: 28,
    blockstun: 18,
    kb: 11,
    kbBlock: 7,
    hb: [60, 280, 95, 135],
    launch: 7,
    launchVx: 8,
    hitstop: 13,
    shake: 16,
    power: 2.5,
    poses: ["dedo_s", "dedo_a"],
    advance: [20, 27, 5],
    dedilho: true,
    label: "DEDILHO SUPREMO",
    charge: true,
    sound: "red"
  }),
  mv("s2", {
    kind: "special",
    rank: 9,
    startup: 16,
    active: 3,
    recovery: 20,
    whiff: 18,
    dmg: 140,
    hitstun: 0,
    blockstun: 0,
    kb: 0,
    kbBlock: 0,
    hb: [0, 105, 15, 150],
    hitstop: 0,
    shake: 0,
    power: 2,
    poses: ["puxao_s", "puxao_a"],
    grab: "puxao",
    unblockable: true,
    label: "PUX\xC3O DE CAMISA",
    sound: "red"
  }),
  mv("s3", {
    kind: "special",
    rank: 9,
    startup: 18,
    active: 10,
    recovery: 24,
    whiff: 24,
    dmg: 125,
    hitstun: 0,
    blockstun: 0,
    kb: 0,
    kbBlock: 0,
    hb: [0, 100, 0, 70],
    level: "low",
    hitstop: 4,
    shake: 0,
    power: 2,
    poses: ["mord_s", "mord_a"],
    advance: [18, 28, 9],
    grab: "mordida",
    label: "MORDIDA NA PERNA",
    sound: "red"
  })
]);
var tubaraoPoses = {
  ...Object.fromEntries(Object.entries(caetanoPoses).map(([k, p]) => [k, { ...p }])),
  idle: cp({ lean: 14, head: -4, fa1: 52, fa2: -54, ba1: 100, ba2: -62, fl1: 72, fl2: 96, bl1: 112, bl2: 86 }),
  roar: cp({ lean: -10, head: -25, mouth: 1, fa1: -40, fa2: -80, ba1: -120, ba2: -85 }),
  bite: cp({ lean: 48, head: 18, mouth: 1, fa1: 15, fa2: 25, ba1: 45, ba2: 35 }),
  bite_s: cp({ lean: -12, head: -12, mouth: 1, fa1: 65, fa2: -80 }),
  bite_a: cp({ lean: 42, head: 18, mouth: 1, fa1: 20, fa2: 10, ba1: 125, ba2: 100, fl1: 45, fl2: 90, bl1: 140, bl2: 100 }),
  swallow_s: cp({ lean: 5, fa1: 5, fa2: -10, ba1: 0, ba2: -5, mouth: 1 }),
  swallow_a: cp({ lean: 30, head: -8, fa1: -8, fa2: -15, ba1: -20, ba2: -10, mouth: 1 }),
  kiss_s: cp({ lean: -10, head: 10, fa1: 65, fa2: -90, ba1: 100, ba2: -85 }),
  kiss_a: cp({ lean: 36, head: 8, fa1: 10, fa2: -65, ba1: 15, ba2: -80, mouth: 2 }),
  fin_s: cp({ lean: -22, head: 8, fa1: 120, fa2: -100, ba1: 150, ba2: -85 }),
  fin_a: cp({ lean: 60, head: -22, fa1: 135, fa2: 135, ba1: 150, ba2: 140, fl1: 30, fl2: 80, bl1: 145, bl2: 100, mouth: 1 }),
  kiss: cp({ lean: 22, head: 10, fa1: -12, fa2: -80, ba1: -20, ba2: -90, mouth: 2 }),
  grabHold: cp({ lean: 14, fa1: -15, fa2: -5, ba1: -10, ba2: 0 }),
  pullIn: cp({ lean: 10, fa1: 40, fa2: -85, ba1: 20, ba2: -95, mouth: 1 }),
  throwUp: cp({ lean: -10, fa1: -95, fa2: -90, ba1: -100, ba2: -95, mouth: 1 }),
  throwDown: cp({ lean: 50, fa1: 40, fa2: 35, ba1: 50, ba2: 40, mouth: 1 }),
  slam: cp({ lean: 50, fa1: 50, fa2: 40, ba1: 65, ba2: 50, mouth: 1 })
};
var rickzeraPoses = {
  ...Object.fromEntries(Object.entries(caetanoPoses).map(([k, p]) => [k, { ...p }])),
  idle: cp({ lean: -3, head: 3, fa1: 75, fa2: -38, ba1: 103, ba2: -35, fl1: 78, fl2: 92, bl1: 106, bl2: 88 }),
  taunt: cp({ lean: -8, head: 5, fa1: -25, fa2: -8, finger: 1, ba1: 90, ba2: -35 }),
  // For Rick, the front/near arm is his anatomical left: the golden knuckles.
  franco_s: cp({ lean: -12, fa1: 60, fa2: -65, ba1: 65, ba2: -125 }),
  franco_a: cp({ lean: 14, fa1: 65, fa2: -70, ba1: -10, ba2: -5 }),
  knuckle_s: cp({ lean: -16, head: 10, fa1: -100, fa2: -145, ba1: 65, ba2: -65, fl1: 65, fl2: 101, bl1: 116, bl2: 83 }),
  knuckle_a: cp({ lean: 48, head: -10, fa1: 25, fa2: 66, ba1: 130, ba2: -45, fl1: 26, fl2: 112, bl1: 133, bl2: 76, mouth: 1 }),
  wise_a: cp({ lean: 20, fa1: -12, fa2: 0, ba1: -20, ba2: -5, finger: 1 }),
  double_s: cp({ lean: -12, fl1: 30, fl2: 125, bl1: 135, bl2: 145, fa1: -50, fa2: -110 }),
  double_a: cp({ lean: -18, fl1: -25, fl2: -20, bl1: 110, bl2: 155, fa1: -80, fa2: -120, ba1: 125, ba2: 150 }),
  roar: cp({ lean: -10, fa1: -40, fa2: -90, ba1: -130, ba2: -80, mouth: 1 }),
  slam: cp({ lean: 32, fa1: 45, fa2: 35, ba1: 50, ba2: 40 }),
  bite: cp({ lean: 44, head: 15, mouth: 1 }),
  grabHold: cp({ lean: 8, fa1: -12, fa2: -5, ba1: -18, ba2: -5 }),
  pullIn: cp({ lean: 4, fa1: 40, fa2: -85, ba1: 30, ba2: -95 }),
  throwUp: cp({ lean: -8, fa1: -95, fa2: -90, ba1: -100, ba2: -95 }),
  throwDown: cp({ lean: 45, fa1: 45, fa2: 35, ba1: 50, ba2: 40 })
};
var tubaraoMoves = Object.fromEntries(
  Object.entries(caetanoMoves).filter(([, m]) => m.kind === "normal").map(([id, m]) => [id, {
    ...m,
    startup: m.startup + 2,
    recovery: m.recovery + 3,
    dmg: Math.round(m.dmg * 1.3),
    power: m.power * 1.15,
    hb: [m.hb[0], m.hb[1] + 24, m.hb[2], m.hb[3] + 8]
  }])
);
Object.assign(tubaraoMoves, Object.fromEntries([
  mv("s1", { kind: "special", rank: 9, startup: 13, active: 8, recovery: 25, whiff: 12, dmg: 100, hitstun: 27, blockstun: 16, kb: 8, kbBlock: 5, hb: [18, 160, 65, 180], hitstop: 10, shake: 10, power: 2, poses: ["bite_s", "bite_a"], advance: [8, 22, 6], label: "MORDIDA" }),
  mv("s2", { kind: "special", rank: 9, startup: 18, active: 4, recovery: 28, whiff: 20, dmg: 125, hitstun: 0, blockstun: 0, kb: 0, hb: [0, 96, 5, 180], hitstop: 0, power: 2, poses: ["swallow_s", "swallow_a"], grab: "engole", unblockable: true, label: "ENGOLE" }),
  mv("s3", { kind: "special", rank: 9, startup: 18, active: 4, recovery: 24, whiff: 16, dmg: SHARK_KISS_DAMAGE, hitstun: 28, blockstun: 14, kb: 3, kbBlock: 4, hb: [10, 110, 40, 172], hitstop: 8, shake: 6, power: 1.3, poses: ["kiss_s", "kiss_a"], advance: [14, 18, 2], label: "BEIJO DO FISCALIZADOR" })
]));
var rickzeraMoves = Object.fromEntries(
  Object.entries(caetanoMoves).filter(([, m]) => m.kind === "normal").map(([id, m]) => [id, {
    ...m,
    startup: Math.max(3, m.startup - 1),
    recovery: Math.max(0, m.recovery - 1),
    dmg: Math.round(m.dmg * 0.9),
    kb: m.kb * 0.85,
    hb: [...m.hb]
  }])
);
Object.assign(rickzeraMoves, Object.fromEntries([
  mv("s1", { kind: "special", rank: 9, startup: 12, active: 13, recovery: 19, whiff: 5, dmg: 24, hitstun: 20, blockstun: 12, kb: 5, kbBlock: 3, hb: [20, 105, 80, 145], hitstop: 7, shake: 5, power: 1.3, poses: ["franco_s", "franco_a"], label: "ARREMESSO DO FRANCO SU\xCD\xC7O \xB7 3 NOTAS" }),
  mv("s2", { kind: "special", rank: 9, startup: 24, active: 5, recovery: 29, whiff: 14, dmg: 84, hitstun: 24, blockstun: 14, kb: 3, kbBlock: 4, hb: [15, 118, 0, 168], level: "high", launch: 1, launchVx: 2, spike: true, hitstop: 12, shake: 14, power: 2.3, poses: ["knuckle_s", "knuckle_a"], advance: [15, 22, 2], trail: "fw", label: "SOCO INGL\xCAS" }),
  mv("s3", { kind: "special", rank: 9, startup: 3, active: 12, recovery: 12, whiff: 5, dmg: 34, hitstun: 18, blockstun: 12, kb: 4, hb: [5, 110, -15, 130], launch: 5, launchVx: 3, hitstop: 6, shake: 5, power: 1.3, poses: ["double_s", "double_a"], trail: "fa", label: "DOUBLE JUMP" })
]));
var bieuPoses = {
  ...Object.fromEntries(Object.entries(rickzeraPoses).map(([k, p]) => [k, { ...p }])),
  idle: cp({ lean: 4, fa1: 50, fa2: -65, ba1: 105, ba2: -70, fl1: 72, fl2: 94, bl1: 110, bl2: 86 }),
  driver_s: cp({ lean: -12, fa1: 65, fa2: -115, ba1: 100, ba2: -75 }),
  driver_a: cp({ lean: 28, fa1: -12, fa2: -4, ba1: 110, ba2: -80, finger: 1 }),
  rat_s: cp({ lean: 22, fa1: 80, fa2: -85, ba1: 105, ba2: -60 }),
  rat_a: cp({ lean: 42, fa1: 35, fa2: 6, ba1: 105, ba2: -50, fl1: 40, fl2: 110, bl1: 135, bl2: 78 }),
  spray_s: cp({ lean: -10, fa1: 25, fa2: -75, ba1: 105, ba2: -60 }),
  spray_a: cp({ lean: 12, fa1: -8, fa2: -4, ba1: 110, ba2: -70, finger: 1 }),
  spray: cp({ lean: 12, fa1: -8, fa2: -4, ba1: 110, ba2: -70, finger: 1 }),
  drive: cp({ lean: -6, fa1: -8, fa2: -30, ba1: -15, ba2: -38, fl1: 30, fl2: 112, bl1: 145, bl2: 65 })
};
var nomadPoses = {
  ...Object.fromEntries(Object.entries(rickzeraPoses).map(([k, p]) => [k, { ...p }])),
  idle: cp({ lean: 9, fa1: 65, fa2: -55, ba1: 112, ba2: -55, fl1: 68, fl2: 98, bl1: 118, bl2: 84 }),
  burger_s: cp({ lean: -12, fa1: 70, fa2: -125, ba1: 105, ba2: -55 }),
  burger_a: cp({ lean: 20, fa1: -8, fa2: -2, ba1: 110, ba2: -70 }),
  glock_s: cp({ lean: -4, fa1: 15, fa2: -70, ba1: -8, ba2: -95 }),
  glock_a: cp({ lean: 7, fa1: -10, fa2: 0, ba1: -18, ba2: -6, finger: 1 }),
  boomerang_s: cp({ lean: -18, fa1: -90, fa2: -140, ba1: 110, ba2: -60 }),
  boomerang_a: cp({ lean: 24, fa1: -10, fa2: -8, ba1: 120, ba2: -75 }),
  bazooka: cp({ lean: -8, fa1: -14, fa2: -10, ba1: -35, ba2: -20, fl1: 65, fl2: 100, bl1: 120, bl2: 80 })
};
function copyNormals(dmgScale, startup, reach) {
  return Object.fromEntries(Object.entries(caetanoMoves).filter(([, m]) => m.kind === "normal").map(([id, m]) => [id, {
    ...m,
    startup: Math.max(3, m.startup + startup),
    dmg: Math.round(m.dmg * dmgScale),
    hb: [m.hb[0], m.hb[1] + reach, m.hb[2], m.hb[3]]
  }]));
}
var bieuMoves = copyNormals(1.05, 1, 8);
Object.assign(bieuMoves, Object.fromEntries([
  mv("s1", { kind: "special", rank: 9, startup: 13, active: 6, recovery: 26, whiff: 11, dmg: 80, hitstun: 25, blockstun: 15, kb: 7, kbBlock: 4, hb: [20, 150, 70, 146], pierce: 0.35, hitstop: 9, shake: 9, power: 1.8, poses: ["driver_s", "driver_a"], advance: [7, 15, 3.5], label: "CHAVE DE FENDA", trail: "fw" }),
  mv("s2", { kind: "special", rank: 9, startup: 16, active: 3, recovery: 25, whiff: 6, dmg: 42, hitstun: 21, blockstun: 13, kb: 4, kbBlock: 2, hb: [20, 100, 0, 35], level: "low", hitstop: 6, shake: 4, power: 1.2, poses: ["rat_s", "rat_a"], label: "JOGAR RATO" }),
  mv("s3", { kind: "special", rank: 9, startup: 19, active: 7, recovery: 25, whiff: 8, dmg: 16, hitstun: 15, blockstun: 9, kb: 1, kbBlock: 1, hb: [20, 155, 10, 130], hitstop: 3, shake: 3, power: 0.8, poses: ["spray_s", "spray_a"], label: "PICHA\xC7\xC3O" })
]));
var nomadMoves = copyNormals(1, 1, 5);
Object.assign(nomadMoves, Object.fromEntries([
  mv("s1", { kind: "special", rank: 9, startup: 15, active: 3, recovery: 26, whiff: 8, dmg: 52, hitstun: 23, blockstun: 14, kb: 6, kbBlock: 3, hb: [20, 120, 65, 145], hitstop: 8, shake: 6, power: 1.4, poses: ["burger_s", "burger_a"], label: "MARIO BURGER" }),
  mv("s2", { kind: "special", rank: 9, startup: 15, active: 5, recovery: 29, whiff: 7, dmg: 20, hitstun: 16, blockstun: 9, kb: 2, kbBlock: 1.5, hb: [20, 120, 135, 155], level: "high", hitstop: 3, shake: 3, power: 0.9, poses: ["glock_s", "glock_a"], label: "RAJADA DE GLOCK" }),
  mv("s3", { kind: "special", rank: 9, startup: 17, active: 4, recovery: 29, whiff: 9, dmg: 38, hitstun: 22, blockstun: 12, kb: 3, kbBlock: 2, hb: [20, 120, 70, 140], hitstop: 6, shake: 5, power: 1.3, poses: ["boomerang_s", "boomerang_a"], label: "BOOMERANG" })
]));
var renngottiPoses = {
  ...Object.fromEntries(Object.entries(rickzeraPoses).map(([k, p]) => [k, { ...p }])),
  idle: cp({ lean: 3, head: -3, fa1: 60, fa2: -62, ba1: 105, ba2: -58, fl1: 74, fl2: 96, bl1: 110, bl2: 87 }),
  moon_s: cp({ lean: 8, fa1: -15, fa2: -8, ba1: -20, ba2: -12 }),
  moon_a: cp({ lean: -18, fa1: -100, fa2: -95, ba1: -110, ba2: -100, mouth: 1 }),
  mic_s: cp({ lean: -10, fa1: 50, fa2: -125, ba1: 100, ba2: -60 }),
  mic_a: cp({ lean: 20, fa1: -10, fa2: -4, ba1: 115, ba2: -70 }),
  shout_s: cp({ lean: -16, head: -12, fa1: 42, fa2: -80, ba1: 112, ba2: -70 }),
  shout_a: cp({ lean: 28, head: 8, fa1: 90, fa2: 30, ba1: 130, ba2: 70, mouth: 1 }),
  tilt_s: cp({ lean: -12, fa1: -100, fa2: -90, ba1: -112, ba2: -98, mouth: 1 }),
  tilt_a: cp({ lean: 42, fa1: 45, fa2: 28, ba1: 65, ba2: 36, mouth: 1 }),
  desk: cp({ lean: -12, fa1: -100, fa2: -90, ba1: -112, ba2: -98, mouth: 1 })
};
var renngottiMoves = copyNormals(1, 0, 7);
Object.assign(renngottiMoves, Object.fromEntries([
  mv("s1", { kind: "special", rank: 9, startup: 16, active: 4, recovery: 26, whiff: 18, dmg: 90, hitstun: 0, blockstun: 0, kb: 0, hb: [0, 100, 0, 176], hitstop: 0, shake: 6, power: 1.8, poses: ["moon_s", "moon_a"], grab: "moon", unblockable: true, label: "JOGA PRA LUA" }),
  mv("s2", { kind: "special", rank: 9, startup: 14, active: 3, recovery: 23, whiff: 8, dmg: 60, hitstun: 23, blockstun: 14, kb: 6, kbBlock: 3, hb: [20, 110, 65, 150], hitstop: 8, shake: 6, power: 1.4, poses: ["mic_s", "mic_a"], label: "JOGAR MICROFONE" }),
  mv("s3", { kind: "special", rank: 9, startup: 17, active: 12, recovery: 30, whiff: 13, dmg: 65, hitstun: 28, blockstun: 17, kb: 13, kbBlock: 7, hb: [10, 300, 20, 190], hitstop: 9, shake: 12, power: 1.9, poses: ["shout_s", "shout_a"], label: "GRITO ALTO" })
]));
var aneninhaPoses = {
  ...Object.fromEntries(Object.entries(caetanoPoses).map(([k, p]) => [k, { ...p }])),
  idle: cp({ lean: -2, head: 3, fa1: 48, fa2: -78, ba1: 110, ba2: -60, fl1: 72, fl2: 98, bl1: 112, bl2: 86 }),
  osasco_s: cp({ lean: -22, fa1: 75, fa2: -130, ba1: 100, ba2: -110 }),
  osasco_a: cp({ lean: 30, fa1: -5, fa2: -2, ba1: 125, ba2: -100, fl1: 45, fl2: 90, bl1: 140, bl2: 105, mouth: 1 }),
  paint_s: cp({ lean: 0, fa1: 45, fa2: -80, ba1: 100, ba2: -50 }),
  paint_a: cp({ lean: 15, fa1: -12, fa2: 0, ba1: 115, ba2: -60, finger: 1 }),
  shout_s: cp({ lean: -10, head: -12, fa1: -30, fa2: -80, ba1: -140, ba2: -90 }),
  shout_a: cp({ lean: 18, head: 12, mouth: 1, fa1: -20, fa2: -80, ba1: -150, ba2: -95 }),
  dance1: cp({ lean: -12, head: -5, fa1: -60, fa2: -120, ba1: -135, ba2: -165, fl1: 42, fl2: 110, bl1: 112, bl2: 87, mouth: 1 }),
  dance2: cp({ lean: 12, head: -8, fa1: -125, fa2: -155, ba1: -40, ba2: -95, fl1: 76, fl2: 92, bl1: 143, bl2: 64, mouth: 1 }),
  roar: cp({ lean: -8, head: -18, fa1: -60, fa2: -100, ba1: -135, ba2: -100, mouth: 1 }),
  taunt: cp({ lean: -8, head: 4, fa1: -20, fa2: -10, ba1: 100, ba2: -70 }),
  win: cp({ lean: -7, head: -8, fa1: -65, fa2: -120, ba1: -140, ba2: -155, fl1: 70, fl2: 96, bl1: 115, bl2: 84, mouth: 1 })
};
var aneninhaMoves = copyNormals(0.98, 0, 0);
Object.assign(aneninhaMoves, Object.fromEntries([
  mv("s1", { kind: "special", rank: 9, startup: 14, active: 6, recovery: 22, whiff: 12, dmg: 95, hitstun: 28, blockstun: 16, kb: 9, kbBlock: 5, hb: [15, 150, 65, 160], launch: 6, launchVx: 5, hitstop: 12, shake: 13, power: 2.2, poses: ["osasco_s", "osasco_a"], advance: [10, 21, 5], trail: "fw", label: "SOCO DE OSASCO" }),
  mv("s2", { kind: "special", rank: 9, startup: 17, active: 5, recovery: 25, whiff: 8, dmg: 20, hitstun: 16, blockstun: 9, kb: 3, kbBlock: 2, hb: [20, 145, 5, 145], hitstop: 5, shake: 3, power: 1, poses: ["paint_s", "paint_a"], label: "PICHAR MURO \u2014 OSASCO" }),
  mv("s3", { kind: "special", rank: 9, startup: 18, active: 8, recovery: 25, whiff: 10, dmg: 65, hitstun: 27, blockstun: 15, kb: 12, kbBlock: 7, hb: [10, 275, 15, 185], hitstop: 8, shake: 11, power: 1.8, poses: ["shout_s", "shout_a"], label: "GRITO ALTO" })
]));
var santoxPoses = {
  ...Object.fromEntries(Object.entries(caetanoPoses).map(([k, p]) => [k, { ...p }])),
  idle: cp({ lean: -5, head: 6, fa1: 65, fa2: -50, ba1: 110, ba2: -35, fl1: 77, fl2: 96, bl1: 108, bl2: 87 }),
  elastic_s: cp({ lean: -20, fa1: 85, fa2: -130, ba1: 110, ba2: -40 }),
  elastic_a: cp({ lean: 18, fa1: -5, fa2: 0, ba1: 115, ba2: -60, fl1: 58, fl2: 100, bl1: 124, bl2: 82 }),
  rabbit_s: cp({ lean: -16, fl1: 10, fl2: 145, fa1: 80, fa2: -90 }),
  rabbit_a: cp({ lean: -28, fl1: -18, fl2: -12, bl1: 108, bl2: 135, fa1: 100, fa2: -110 }),
  fourth_s: cp({ lean: -4, head: -10, fa1: 25, fa2: -85, ba1: 120, ba2: -70 }),
  fourth_a: cp({ lean: 0, head: 0, fa1: 30, fa2: -20, ba1: 130, ba2: 155, finger: 1 }),
  abstract_s: cp({ lean: -8, fa1: -60, fa2: -100, ba1: -130, ba2: -160 }),
  abstract_a: cp({ lean: 17, fa1: -15, fa2: -5, ba1: 150, ba2: 155, mouth: 1 }),
  taunt: cp({ lean: 0, head: 0, fa1: 30, fa2: -20, ba1: 130, ba2: 155, finger: 1 }),
  win: cp({ lean: -6, head: 5, fa1: 40, fa2: -20, ba1: 115, ba2: 160 })
};
var santoxMoves = copyNormals(0.9, 1, 4);
Object.assign(santoxMoves, Object.fromEntries([
  mv("s1", { kind: "special", rank: 9, startup: 20, active: 4, recovery: 30, whiff: 12, dmg: 52, hitstun: 21, blockstun: 12, kb: 6, kbBlock: 3, hb: [45, 370, 80, 145], hitstop: 9, shake: 7, power: 1.5, poses: ["elastic_s", "elastic_a"], label: "SOCO EL\xC1STICO A LONGA DIST\xC2NCIA" }),
  mv("s2", { kind: "special", rank: 9, air: true, startup: 13, active: 6, recovery: 24, whiff: 10, dmg: 68, hitstun: 22, blockstun: 13, kb: 6, kbBlock: 4, hb: [15, 155, 20, 130], level: "high", launch: 5, launchVx: 4, hitstop: 9, shake: 8, power: 1.7, poses: ["rabbit_s", "rabbit_a"], trail: "fa", label: "CHUTE DO COELHO" }),
  mv("s3", { kind: "special", rank: 9, startup: 8, active: 18, recovery: 28, whiff: 0, dmg: 0, hitstun: 0, blockstun: 0, kb: 0, hb: [0, 0, 0, 0], hitstop: 0, shake: 0, power: 0, poses: ["fourth_s", "fourth_a"], label: "QUEBRAR A QUARTA PAREDE" })
]));
var jaoPoses = {
  ...Object.fromEntries(Object.entries(caetanoPoses).map(([k, p]) => [k, { ...p }])),
  idle: cp({ lean: 2, head: -3, fa1: 55, fa2: -80, ba1: 104, ba2: -65, fl1: 75, fl2: 94, bl1: 110, bl2: 88 }),
  chess_s: cp({ lean: -12, fa1: 30, fa2: -105, ba1: 100, ba2: -70 }),
  chess_a: cp({ lean: 25, fa1: 35, fa2: 5, ba1: 110, ba2: -60, fl1: 48, fl2: 108, bl1: 133, bl2: 78, finger: 1 }),
  math_s: cp({ lean: -8, fa1: 50, fa2: -115, ba1: 110, ba2: -65 }),
  math_a: cp({ lean: 16, fa1: -10, fa2: -5, ba1: 110, ba2: -80, finger: 1 }),
  ball_s: cp({ lean: -18, fa1: -65, fa2: -100, ba1: -100, ba2: -130 }),
  ball_a: cp({ lean: 25, fa1: -8, fa2: 0, ba1: 115, ba2: -80, fl1: 54, fl2: 98, bl1: 125, bl2: 85 }),
  calculation_s: cp({ lean: -5, fa1: -60, fa2: -95, ba1: -130, ba2: -155 }),
  calculation_a: cp({ lean: 8, fa1: 10, fa2: -5, ba1: 155, ba2: 165, finger: 1 }),
  taunt: cp({ lean: -4, fa1: 20, fa2: -95, ba1: 108, ba2: -65, finger: 1 }),
  win: cp({ lean: -4, fa1: 68, fa2: -165, ba1: 104, ba2: -15 })
};
var jaoMoves = copyNormals(0.95, 1, 0);
Object.assign(jaoMoves, Object.fromEntries([
  mv("s1", { kind: "special", rank: 9, startup: 24, active: 1, recovery: 30, whiff: 0, dmg: 0, hitstun: 0, blockstun: 0, kb: 0, hb: [0, 0, 0, 0], hitstop: 0, power: 0.7, poses: ["chess_s", "chess_a"], label: "TABULEIRO DE XADREZ" }),
  mv("s2", { kind: "special", rank: 9, startup: 18, active: 3, recovery: 26, whiff: 8, dmg: 44, hitstun: 21, blockstun: 12, kb: 5, kbBlock: 3, hb: [20, 110, 70, 140], hitstop: 7, shake: 5, power: 1.3, poses: ["math_s", "math_a"], label: "S\xCDMBOLOS DA MATEM\xC1TICA" }),
  mv("s3", { kind: "special", rank: 9, startup: 22, active: 3, recovery: 32, whiff: 10, dmg: 62, hitstun: 25, blockstun: 14, kb: 10, kbBlock: 5, hb: [20, 110, 65, 140], hitstop: 10, shake: 8, power: 1.8, poses: ["ball_s", "ball_a"], label: "ARREMESSO ABSOLUTO" })
]));
var janePoses = {
  ...Object.fromEntries(Object.entries(caetanoPoses).map(([k, p]) => [k, { ...p }])),
  idle: cp({ lean: 0, head: 2, fa1: 55, fa2: -80, ba1: 112, ba2: -60, fl1: 72, fl2: 98, bl1: 110, bl2: 86 }),
  laptop_s: cp({ lean: 4, fa1: 35, fa2: -30, ba1: 135, ba2: 160, fl1: 42, fl2: 110, bl1: 140, bl2: 65 }),
  laptop_a: cp({ lean: 18, head: 14, fa1: 30, fa2: -18, ba1: 140, ba2: 160, fl1: 38, fl2: 112, bl1: 145, bl2: 62 }),
  moto_s: cp({ lean: 24, fa1: 15, fa2: -8, ba1: 50, ba2: 10, fl1: 38, fl2: 112, bl1: 140, bl2: 62 }),
  moto_a: cp({ lean: -10, fa1: -12, fa2: -4, ba1: 25, ba2: -15, fl1: 20, fl2: 105, bl1: 150, bl2: 65 }),
  slide_s: cp({ lean: 45, fa1: 120, fa2: 160, ba1: 150, ba2: 170, fl1: 20, fl2: 125, bl1: 160, bl2: 35 }),
  slide_a: cp({ lean: 48, fa1: 100, fa2: 145, ba1: 130, ba2: 160, fl1: 10, fl2: 25, bl1: 145, bl2: 55 }),
  kick_a: cp({ lean: -25, fl1: -20, fl2: -15, bl1: 105, bl2: 94, fa1: 80, fa2: -100 }),
  zord_s: cp({ lean: -6, fa1: -80, fa2: -110, ba1: -125, ba2: -155 }),
  zord_a: cp({ lean: 15, fa1: -10, fa2: -2, ba1: 125, ba2: -70, finger: 1 }),
  dizzy: cp({ lean: 12, head: 18, fa1: 90, fa2: 65, ba1: 120, ba2: 90, mouth: 0.2 }),
  win: cp({ lean: -4, fa1: -65, fa2: -140, ba1: 112, ba2: -40 })
};
var janeMoves = copyNormals(0.78, 0, -24);
for (const m of Object.values(janeMoves)) m.hb = [m.hb[0] * 0.75, Math.max(65, m.hb[1]), m.hb[2] * 0.58, m.hb[3] * 0.65];
Object.assign(janeMoves, Object.fromEntries([
  mv("s1", { kind: "special", rank: 9, startup: 18, active: 12, recovery: 22, whiff: 0, dmg: 18, hitstun: 13, blockstun: 8, kb: 3, kbBlock: 2, hb: [15, 85, 35, 100], hitstop: 4, shake: 3, power: 0.8, poses: ["laptop_s", "laptop_a"], label: "FINGINDO QUE T\xC1 TRABALHANDO" }),
  mv("s2", { kind: "special", rank: 9, startup: 12, active: 300, recovery: 24, whiff: 0, dmg: 11, hitstun: 13, blockstun: 8, kb: 3, kbBlock: 2, hb: [-65, 110, 0, 115], hitstop: 4, shake: 4, power: 0.9, poses: ["moto_s", "moto_a"], label: "DANDO GRAU DE MOTO" }),
  mv("s3", { kind: "special", rank: 9, startup: 30, active: 6, recovery: 25, whiff: 10, dmg: 58, hitstun: 23, blockstun: 13, kb: 6, kbBlock: 4, hb: [-35, 115, -10, 100], level: "high", launch: 4, launchVx: 3, hitstop: 8, shake: 7, power: 1.4, poses: ["slide_s", "kick_a"], advance: [1, 17, 9], turn: [24, 36], trail: "fa", label: "POR BAIXO, SALTO E GIRO" })
]));
var cristyanPoses = {
  ...Object.fromEntries(Object.entries(caetanoPoses).map(([k, p]) => [k, { ...p }])),
  idle: cp({ lean: 5, fa1: 25, fa2: -100, ba1: 75, ba2: -120, fl1: 66, fl2: 100, bl1: 120, bl2: 82 }),
  teep_s: cp({ lean: -5, fl1: 5, fl2: 130, fa1: 35, fa2: -105, ba1: 90, ba2: -110 }),
  teep_a: cp({ lean: -24, fl1: -5, fl2: -3, bl1: 101, bl2: 88, fa1: 45, fa2: -105, ba1: 100, ba2: -100 }),
  power_s: cp({ lean: -26, ba1: 135, ba2: -150, fa1: 15, fa2: -100 }),
  power_a: cp({ lean: 28, ba1: -3, ba2: 0, fa1: 95, fa2: -110, fl1: 50, fl2: 100, bl1: 135, bl2: 90 }),
  spin_s: cp({ lean: -15, fl1: 10, fl2: 135, fa1: -50, fa2: -110, ba1: 130, ba2: 170 }),
  spin_a: cp({ lean: -35, fl1: -20, fl2: -18, bl1: 100, bl2: 90, fa1: -120, fa2: -155, ba1: 145, ba2: 165 }),
  hammock_s: cp({ lean: 8, fa1: 20, fa2: -15, ba1: 150, ba2: 160 }),
  hammock_a: cp({ lean: -10, fa1: -80, fa2: -120, ba1: -115, ba2: -150, fl1: 35, fl2: 110, bl1: 135, bl2: 70 }),
  slam_a: cp({ lean: 40, fa1: 38, fa2: 25, ba1: 70, ba2: 42, fl1: 35, fl2: 110, bl1: 145, bl2: 60 })
};
var cristyanMoves = copyNormals(0.99, 1, 4);
Object.assign(cristyanMoves, Object.fromEntries([
  mv("s1", { kind: "special", rank: 9, startup: 11, active: 4, recovery: 23, whiff: 10, dmg: 62, hitstun: 21, blockstun: 13, kb: 12, kbBlock: 5, hb: [20, 158, 40, 132], hitstop: 8, shake: 7, power: 1.5, poses: ["teep_s", "teep_a"], trail: "fa", label: "CHUTE TEEP EMPURRANDO" }),
  mv("s2", { kind: "special", rank: 9, startup: 21, active: 4, recovery: 32, whiff: 16, dmg: 90, hitstun: 26, blockstun: 15, kb: 13, kbBlock: 6, hb: [15, 135, 80, 145], launch: 7, launchVx: 10, hitstop: 12, shake: 13, power: 2.1, poses: ["power_s", "power_a"], trail: "bw", charge: true, label: "SOCO PODEROSO" }),
  mv("s3", { kind: "special", rank: 9, startup: 17, active: 7, recovery: 28, whiff: 12, dmg: 74, hitstun: 23, blockstun: 14, kb: 8, kbBlock: 5, hb: [-45, 155, 40, 160], launch: 5, launchVx: 5, hitstop: 9, shake: 9, power: 1.8, poses: ["spin_s", "spin_a"], advance: [10, 21, 2.4], trail: "fa", turn: [5, 22], label: "PIRUETA COM CHUTE" })
]));
var eneasPoses = {
  ...Object.fromEntries(Object.entries(caetanoPoses).map(([k, p]) => [k, { ...p }])),
  idle: cp({ lean: 1, fa1: 55, fa2: -65, ba1: 105, ba2: -65, fl1: 77, fl2: 94, bl1: 107, bl2: 88 }),
  shout_s: cp({ lean: -15, head: -12, fa1: 30, fa2: -80, ba1: 115, ba2: -70 }),
  shout_a: cp({ lean: 20, head: 10, fa1: 95, fa2: 15, ba1: 135, ba2: 65, mouth: 1 }),
  ecg_s: cp({ lean: 8, fa1: 15, fa2: -90, ba1: 110, ba2: -60 }),
  ecg_a: cp({ lean: 18, fa1: -5, fa2: 0, ba1: 125, ba2: -70, finger: 1 }),
  five_s: cp({ lean: -8, fa1: -55, fa2: -100, ba1: 110, ba2: -65 }),
  five_a: cp({ lean: 15, fa1: -8, fa2: 0, ba1: 120, ba2: -65 }),
  six_a: cp({ lean: 20, fa1: 25, fa2: 10, ba1: 130, ba2: 145 }),
  atom_s: cp({ lean: -4, fa1: -10, fa2: -105, ba1: 110, ba2: -70, finger: 1 }),
  atom_a: cp({ lean: 24, fa1: 30, fa2: 15, ba1: 130, ba2: -40, mouth: 1 })
};
var eneasMoves = copyNormals(0.98, 2, 10);
Object.assign(eneasMoves, Object.fromEntries([
  mv("s1", { kind: "special", rank: 9, startup: 18, active: 8, recovery: 28, whiff: 12, dmg: 60, hitstun: 25, blockstun: 14, kb: 11, kbBlock: 6, hb: [15, 275, 20, 180], hitstop: 8, shake: 10, power: 1.7, poses: ["shout_s", "shout_a"], label: "MEU NOME \xC9 EN\xC9AS!" }),
  mv("s2", { kind: "special", rank: 9, startup: 20, active: 3, recovery: 29, whiff: 8, dmg: 46, hitstun: 22, blockstun: 13, kb: 6, kbBlock: 3, hb: [20, 110, 65, 140], hitstop: 7, shake: 6, power: 1.3, poses: ["ecg_s", "ecg_a"], label: "DIAGN\xD3STICO FATAL" }),
  mv("s3", { kind: "special", rank: 9, startup: 22, active: 14, recovery: 30, whiff: 8, dmg: 28, hitstun: 21, blockstun: 11, kb: 3, kbBlock: 2, hb: [20, 110, 55, 145], launch: 8, launchVx: 2, hitstop: 5, shake: 6, power: 1.2, poses: ["five_s", "five_a"], recoveryPose: "six_a", label: "56 NA TESTA!" })
]));
var CHARS = {
  caetano: {
    id: "caetano",
    name: "KARAT\xCA CAETANO",
    short: "CAETANO",
    title: "O MAIOR ARTISTA MARCIAL DO MUNDO (segundo ele)",
    color: "#f97316",
    color2: "#9a3412",
    glow: "#fed7aa",
    hp: 1e3,
    walk: 4.4,
    walkBack: 3.6,
    jumpVy: 16.5,
    jumpVx: 5.4,
    dashVx: 11.5,
    dashDur: 15,
    pushW: 26,
    hurtH: 172,
    crouchH: 110,
    moves: caetanoMoves,
    poses: caetanoPoses,
    attrs: [
      { label: "VELOCIDADE", v: 5 },
      { label: "FOR\xC7A", v: 3 },
      { label: "ALCANCE", v: 3 },
      { label: "RESIST\xCANCIA", v: 3 },
      { label: "MOBILIDADE", v: 5 }
    ],
    specials: [
      { key: "U", name: "CHUTE DA CONSPIRA\xC7\xC3O", desc: "Chute girat\xF3rio com rastro roxo. Empurra e derruba." },
      { key: "I", name: "DEDILHO PERFURANTE", desc: "Estocada ultrarr\xE1pida que fura a defesa." },
      { key: "O", name: "SOCO PEGO", desc: "Soco exagerado, dano enorme. Se errar, paga caro." }
    ],
    superName: "CONSPIRA\xC7\xC3O ABSOLUTA",
    quote: "ERA TUDO PARTE DA CONSPIRA\xC7\xC3O.",
    bio: "T\xE9cnico: defesa precisa carrega um Dedilho refor\xE7ado. Confirme o Dedilho em Chute para estender combos."
  },
  orango: {
    id: "orango",
    name: "ORANGO TANGO BITENCOURT",
    short: "ORANGO",
    title: "O REI DA SELVA",
    color: "#ef4444",
    color2: "#991b1b",
    glow: "#fca5a5",
    hp: 1150,
    walk: 3,
    walkBack: 2.4,
    jumpVy: 15,
    jumpVx: 3.6,
    dashVx: 7.5,
    dashDur: 16,
    pushW: 44,
    hurtH: 150,
    crouchH: 95,
    moves: orangoMoves,
    poses: orangoPoses,
    attrs: [
      { label: "VELOCIDADE", v: 3 },
      { label: "FOR\xC7A", v: 5 },
      { label: "ALCANCE", v: 5 },
      { label: "RESIST\xCANCIA", v: 5 },
      { label: "MOBILIDADE", v: 2 }
    ],
    specials: [
      { key: "U", name: "DEDILHO SUPREMO", desc: "Estocada colossal com onda de choque vermelha." },
      { key: "I", name: "PUX\xC3O DE CAMISA", desc: "Agarr\xE3o imposs\xEDvel de bloquear. S\xF3 de perto." },
      { key: "O", name: "MORDIDA NA PERNA", desc: "Avan\xE7a, agarra a perna e morde. Derruba." }
    ],
    superName: "INSTINTO PRIMORDIAL",
    quote: "O REI DA SELVA N\xC3O PRECISA DE FAIXA.",
    bio: "Agressivo: acertos acumulam \xCDmpeto, aumentando dano e avan\xE7o. Agarr\xF5es punem rivais defensivos."
  },
  tubarao: {
    id: "tubarao",
    name: "TUBAR\xC3O FISCAL",
    short: "TUBAR\xC3O",
    title: "O FISCAL DOS SETE MARES",
    color: "#06b6d4",
    color2: "#155e75",
    glow: "#a5f3fc",
    hp: 1230,
    walk: 3.25,
    walkBack: 2.6,
    jumpVy: 15.5,
    jumpVx: 4,
    dashVx: 8.5,
    dashDur: 17,
    pushW: 39,
    hurtH: 196,
    crouchH: 122,
    moves: tubaraoMoves,
    poses: tubaraoPoses,
    attrs: [{ label: "VELOCIDADE", v: 2 }, { label: "FOR\xC7A", v: 5 }, { label: "ALCANCE", v: 4 }, { label: "RESIST\xCANCIA", v: 5 }, { label: "MOBILIDADE", v: 3 }],
    specials: [
      { key: "U", name: "MORDIDA", desc: "Avan\xE7a com uma mordida poderosa. Pode ser defendida." },
      { key: "I", name: "ENGOLE", desc: "Agarr\xE3o de perto: engole e cospe o rival. Ignora defesa." },
      { key: "O", name: "BEIJO DO FISCALIZADOR", desc: "Beijo de perto com cora\xE7\xF5es e 64 de dano. Bloque\xE1vel, sem armadura; errar deixa uma abertura." }
    ],
    superName: "QUANDO TER\xC1 LIVE?",
    quote: "SUA DECLARA\xC7\xC3O CAIU NA MALHA FINA.",
    bio: "Mordidas, Engole e um Beijo de perto. Na ULT, vira um tubar\xE3o com rosto humanoide, lambe o rival e o lan\xE7a para longe com uma rabada."
  },
  rickzera: {
    id: "rickzera",
    name: "RICKZERA",
    short: "RICKZERA",
    title: "O REI DAS TRANSFER\xCANCIAS",
    color: "#22c55e",
    color2: "#166534",
    glow: "#bbf7d0",
    hp: 940,
    walk: 4.8,
    walkBack: 3.9,
    jumpVy: 16,
    jumpVx: 5.6,
    dashVx: 12,
    dashDur: 14,
    pushW: 26,
    hurtH: 172,
    crouchH: 108,
    moves: rickzeraMoves,
    poses: rickzeraPoses,
    attrs: [{ label: "VELOCIDADE", v: 5 }, { label: "FOR\xC7A", v: 2 }, { label: "ALCANCE", v: 5 }, { label: "RESIST\xCANCIA", v: 2 }, { label: "MOBILIDADE", v: 5 }],
    specials: [
      { key: "U", name: "ARREMESSO DO FRANCO SU\xCD\xC7O", desc: "Arremessa tr\xEAs notas em sequ\xEAncia. A rajada pode ser defendida e conta como um uso de dist\xE2ncia." },
      { key: "I", name: "SOCO INGL\xCAS", desc: "Soco descendente com energia verde e soco ingl\xEAs dourado na m\xE3o esquerda. Esmaga o rival no ch\xE3o e abre uma cratera. Defenda em p\xE9; errar deixa uma abertura." },
      { key: "O", name: "DOUBLE JUMP", desc: "Salto com chute; no ar, ganha um segundo impulso. A tecla de pulo tamb\xE9m d\xE1 o segundo salto." }
    ],
    superName: "WISE 6X",
    quote: "TRANSFER\xCANCIA CONCLU\xCDDA. SEIS VEZES.",
    bio: "Camiseta preta, cal\xE7a cargo bege e soco ingl\xEAs dourado na m\xE3o esquerda. Pressiona com tr\xEAs francos su\xED\xE7os, derrubada de perto e salto duplo."
  },
  bieu: {
    id: "bieu",
    name: "BIEUBATMAN",
    short: "BIEU",
    title: "O PREST\xCDGIO DA RUA",
    color: "#a855f7",
    color2: "#581c87",
    glow: "#e9d5ff",
    hp: 1080,
    walk: 3.9,
    walkBack: 3.1,
    jumpVy: 16,
    jumpVx: 4.8,
    dashVx: 10,
    dashDur: 16,
    pushW: 30,
    hurtH: 178,
    crouchH: 110,
    moves: bieuMoves,
    poses: bieuPoses,
    attrs: [{ label: "VELOCIDADE", v: 3 }, { label: "FOR\xC7A", v: 4 }, { label: "ALCANCE", v: 4 }, { label: "RESIST\xCANCIA", v: 4 }, { label: "MOBILIDADE", v: 3 }],
    specials: [
      { key: "U", name: "CHAVE DE FENDA", desc: "Estocada de perto que atravessa parte da defesa." },
      { key: "I", name: "JOGAR RATO", desc: "Rato pelo ch\xE3o: pule ou use defesa agachada." },
      { key: "O", name: "PICHA\xC7\xC3O", desc: "Nuvem de tinta que permanece e pressiona com at\xE9 quatro acertos." }
    ],
    superName: "PREST\xCDGIO",
    quote: "PASSANDO COM PREST\xCDGIO.",
    bio: "Regata branca, cachos curtos e atitude. Combina press\xE3o de perto, rato rasteiro e controle com tinta."
  },
  nomad: {
    id: "nomad",
    name: "NOMAD LOBBY",
    short: "NOMAD",
    title: "O DONO DA ARENA",
    color: "#f59e0b",
    color2: "#9a3412",
    glow: "#fde68a",
    hp: 1100,
    walk: 3.6,
    walkBack: 2.9,
    jumpVy: 15.8,
    jumpVx: 4.5,
    dashVx: 9.4,
    dashDur: 16,
    pushW: 33,
    hurtH: 171,
    crouchH: 104,
    moves: nomadMoves,
    poses: nomadPoses,
    attrs: [{ label: "VELOCIDADE", v: 3 }, { label: "FOR\xC7A", v: 4 }, { label: "ALCANCE", v: 5 }, { label: "RESIST\xCANCIA", v: 4 }, { label: "MOBILIDADE", v: 3 }],
    specials: [
      { key: "U", name: "MARIO BURGER", desc: "Arremessa um hamb\xFArguer que empurra o advers\xE1rio." },
      { key: "I", name: "RAJADA DE GLOCK", desc: "Tr\xEAs disparos altos: agache para evitar ou defenda em p\xE9." },
      { key: "O", name: "BOOMERANG", desc: "Vai e volta, podendo acertar uma vez em cada trajeto." }
    ],
    superName: "ARENA",
    quote: "BEM-VINDO \xC0 MINHA ARENA.",
    bio: "Bon\xE9 vermelho, macac\xE3o azul e barba loira. Domina a dist\xE2ncia com lanche, rajada e boomerang."
  },
  renngotti: {
    id: "renngotti",
    name: "RENNGOTTI",
    short: "RENNGOTTI",
    title: "A VOZ DO CAOS",
    color: "#e2e8f0",
    color2: "#475569",
    glow: "#f8fafc",
    hp: 1020,
    walk: 4.1,
    walkBack: 3.3,
    jumpVy: 16.2,
    jumpVx: 5,
    dashVx: 10.5,
    dashDur: 15,
    pushW: 29,
    hurtH: 180,
    crouchH: 110,
    moves: renngottiMoves,
    poses: renngottiPoses,
    attrs: [{ label: "VELOCIDADE", v: 4 }, { label: "FOR\xC7A", v: 3 }, { label: "ALCANCE", v: 4 }, { label: "RESIST\xCANCIA", v: 3 }, { label: "MOBILIDADE", v: 4 }],
    specials: [
      { key: "U", name: "JOGA PRA LUA", desc: "Agarr\xE3o de perto que lan\xE7a alto e abre espa\xE7o para um combo a\xE9reo." },
      { key: "I", name: "JOGAR MICROFONE", desc: "Arremessa o microfone em arco para pressionar \xE0 dist\xE2ncia." },
      { key: "O", name: "GRITO ALTO", desc: "Onda sonora \xE0 frente: interrompe golpes e empurra. Pode ser defendida." }
    ],
    superName: "TILT",
    quote: "A MESA N\xC3O AGUENTOU O TILT.",
    bio: "Alcance: o microfone vira armadilha ao cair. Grito amplia sua zona de resson\xE2ncia; agarr\xE3o lunar abre juggle."
  },
  aneninha: {
    id: "aneninha",
    name: "ANENINHA",
    short: "ANENINHA",
    title: "OSASCO NO CORA\xC7\xC3O, BOL\xCDVIA NO RITMO",
    color: "#ec4899",
    color2: "#9d174d",
    glow: "#fbcfe8",
    hp: 1e3,
    walk: 4.3,
    walkBack: 3.5,
    jumpVy: 16.3,
    jumpVx: 5.1,
    dashVx: 10.8,
    dashDur: 15,
    pushW: 27,
    hurtH: 169,
    crouchH: 105,
    moves: aneninhaMoves,
    poses: aneninhaPoses,
    attrs: [{ label: "VELOCIDADE", v: 4 }, { label: "FOR\xC7A", v: 3 }, { label: "ALCANCE", v: 4 }, { label: "RESIST\xCANCIA", v: 3 }, { label: "MOBILIDADE", v: 4 }],
    specials: [
      { key: "U", name: "SOCO DE OSASCO", desc: "Soco com avan\xE7o que lan\xE7a e abre combos." },
      { key: "I", name: "PICHAR MURO PARA REPRESENTAR OSASCO", desc: "Pinta um muro que pressiona com at\xE9 tr\xEAs acertos. Pode ser defendido ou saltado." },
      { key: "O", name: "GRITO ALTO", desc: "Onda de voz frontal que interrompe e empurra. Pode ser defendida." }
    ],
    superName: "YO SOY DE BOLIVIA",
    quote: "OSASCO NO CORA\xC7\xC3O, BOL\xCDVIA NO RITMO!",
    bio: "Imprevis\xEDvel: baixo + ESP 1 vira rasteira; frente + ESP 2 pinta atr\xE1s do rival pr\xF3ximo. Alterne alturas e lados."
  },
  santox: {
    id: "santox",
    name: "1SANT0X",
    short: "1SANT0X",
    title: "O COELHO FORA DO ROTEIRO",
    color: "#c026d3",
    color2: "#581c87",
    glow: "#f5d0fe",
    hp: 950,
    walk: 4.15,
    walkBack: 3.3,
    jumpVy: 16.4,
    jumpVx: 5,
    dashVx: 10,
    dashDur: 15,
    pushW: 26,
    hurtH: 186,
    crouchH: 111,
    moves: santoxMoves,
    poses: santoxPoses,
    attrs: [{ label: "VELOCIDADE", v: 4 }, { label: "FOR\xC7A", v: 2 }, { label: "ALCANCE", v: 5 }, { label: "RESIST\xCANCIA", v: 2 }, { label: "MOBILIDADE", v: 4 }],
    specials: [
      { key: "U", name: "SOCO EL\xC1STICO A LONGA DIST\xC2NCIA", desc: "Alcance de 370, dano moderado e recupera\xE7\xE3o longa. Pode ser bloqueado; conta no limite de longa dist\xE2ncia." },
      { key: "I", name: "CHUTE DO COELHO", desc: "Pequeno salto com chute alto que lan\xE7a. Defenda em p\xE9 e puna a aterrissagem." },
      { key: "O", name: "QUEBRAR A QUARTA PAREDE", desc: "Olha para a c\xE2mera e sorri: evita golpes por 0,3 s ap\xF3s a prepara\xE7\xE3o. Recarga de 8 s e recupera\xE7\xE3o vulner\xE1vel." }
    ],
    superName: "ABSTRA\xC7\xC3O",
    quote: "VOC\xCA EST\xC1 JOGANDO. EU ESTOU OLHANDO.",
    bio: "Alcance el\xE1stico e esquiva calculada. Acerte \xE0 m\xE9dia dist\xE2ncia; a Quarta Parede exige antecipa\xE7\xE3o e n\xE3o causa dano."
  },
  jao: {
    id: "jao",
    name: "JaoDoPikles",
    short: "JAODOPIKLES",
    title: "CADA ROUND \xC9 UMA EQUA\xC7\xC3O",
    color: "#818cf8",
    color2: "#312e81",
    glow: "#e0e7ff",
    hp: 990,
    walk: 3.8,
    walkBack: 3.1,
    jumpVy: 15.6,
    jumpVx: 4.5,
    dashVx: 9.1,
    dashDur: 16,
    pushW: 28,
    hurtH: 177,
    crouchH: 108,
    moves: jaoMoves,
    poses: jaoPoses,
    attrs: [{ label: "VELOCIDADE", v: 3 }, { label: "FOR\xC7A", v: 3 }, { label: "ALCANCE", v: 4 }, { label: "RESIST\xCANCIA", v: 3 }, { label: "T\xC9CNICA", v: 5 }],
    specials: [
      { key: "U", name: "TABULEIRO DE XADREZ", desc: "Uma zona por vez, por at\xE9 3 s: reduz em 35% o avan\xE7o no ch\xE3o. Pule para escapar; acertar Jao desfaz o tabuleiro." },
      { key: "I", name: "S\xCDMBOLOS DA MATEM\xC1TICA", desc: "Dispara uma f\xF3rmula em linha reta. Um acerto, dano moderado, sem persegui\xE7\xE3o." },
      { key: "O", name: "ARREMESSO ABSOLUTO", desc: "Bola em arco com um quique: atordoa e empurra. Pode ser defendida ou saltada." }
    ],
    superName: "CHESS IS LIFE",
    quote: "XEQUE-MATE. A CONTA FECHOU.",
    bio: "Estrat\xE9gia com xadrez, matem\xE1tica e basquete. Crie espa\xE7o com o tabuleiro, depois confirme a f\xF3rmula ou o arremesso."
  },
  jane: {
    id: "jane",
    name: "JANE",
    short: "JANE",
    title: "PEQUENA NO TAMANHO, GIGANTE NO DEPLOY",
    color: "#eab308",
    color2: "#854d0e",
    glow: "#fef08a",
    hp: 860,
    walk: 4.6,
    walkBack: 3.7,
    jumpVy: 15.8,
    jumpVx: 5.4,
    dashVx: 11,
    dashDur: 14,
    pushW: 20,
    hurtH: 115,
    crouchH: 72,
    moves: janeMoves,
    poses: janePoses,
    attrs: [{ label: "VELOCIDADE", v: 5 }, { label: "FOR\xC7A", v: 2 }, { label: "ALCANCE", v: 3 }, { label: "RESIST\xCANCIA", v: 2 }, { label: "MOBILIDADE", v: 5 }],
    specials: [
      { key: "U", name: "FINGINDO QUE T\xC1 TRABALHANDO", desc: "Cochila com o laptop e lan\xE7a dois comandos Java. Dano baixo; a dupla conta como um uso \xE0 dist\xE2ncia." },
      { key: "I", name: "DANDO GRAU DE MOTO", desc: "Segure at\xE9 5 s. Soltar a tempo dispara uma arrancada sem controle; ambos compartilham seis contatos. Exceder o limite causa queda e tontura de 1 s. Recarga de 3 s." },
      { key: "O", name: "POR BAIXO, SALTO E GIRO", desc: "Desliza, vira, salta e anuncia um chute girat\xF3rio a\xE9reo. Defenda em p\xE9 ou puna a recupera\xE7\xE3o; baixos interrompem a passagem." }
    ],
    superName: "AREIAZORD",
    quote: "FUNCIONA NA MINHA M\xC1QUINA. E NO MEU ROB\xD4.",
    bio: "Adulta de baixa estatura, loira com franja e jaqueta branca. Mobilidade e comandos Java compensam vida e alcance curtos."
  },
  cristyan: {
    id: "cristyan",
    name: "CRISTYAN",
    short: "CRISTYAN",
    title: "O PESO DO MUAY THAI BAIANO",
    color: "#f97316",
    color2: "#7c2d12",
    glow: "#fed7aa",
    hp: 1060,
    walk: 3.9,
    walkBack: 3.1,
    jumpVy: 15.7,
    jumpVx: 4.6,
    dashVx: 9.6,
    dashDur: 16,
    pushW: 30,
    hurtH: 179,
    crouchH: 109,
    moves: cristyanMoves,
    poses: cristyanPoses,
    attrs: [{ label: "VELOCIDADE", v: 3 }, { label: "FOR\xC7A", v: 4 }, { label: "ALCANCE", v: 3 }, { label: "RESIST\xCANCIA", v: 4 }, { label: "T\xC9CNICA", v: 4 }],
    specials: [
      { key: "U", name: "CHUTE TEEP EMPURRANDO", desc: "Chute frontal que afasta o rival. Pode ser defendido; use para controlar o espa\xE7o." },
      { key: "I", name: "SOCO PODEROSO", desc: "Prepara um soco que arremessa para longe. O erro deixa uma recupera\xE7\xE3o longa e vulner\xE1vel." },
      { key: "O", name: "PIRUETA COM CHUTE", desc: "Gira com um chute amplo de um acerto. Sem invulnerabilidade: antecipe ou defenda." }
    ],
    superName: "REDE BAIANA",
    quote: "DESCANSOU? AGORA ACORDA PRA REVANCHE.",
    bio: "Press\xE3o de perto com teep, for\xE7a e giro. Precisa se aproximar e confirmar acertos; n\xE3o tem proj\xE9teis."
  },
  eneas: {
    id: "eneas",
    name: "DOUTOR EN\xC9AS",
    short: "EN\xC9AS",
    title: "CI\xCANCIA EM VOLUME M\xC1XIMO",
    color: "#22c55e",
    color2: "#166534",
    glow: "#fef08a",
    hp: 1080,
    walk: 3.2,
    walkBack: 2.6,
    jumpVy: 15,
    jumpVx: 4,
    dashVx: 8.5,
    dashDur: 17,
    pushW: 31,
    hurtH: 184,
    crouchH: 114,
    moves: eneasMoves,
    poses: eneasPoses,
    attrs: [{ label: "VELOCIDADE", v: 2 }, { label: "FOR\xC7A", v: 3 }, { label: "ALCANCE", v: 4 }, { label: "RESIST\xCANCIA", v: 4 }, { label: "CI\xCANCIA", v: 5 }],
    specials: [
      { key: "U", name: "MEU NOME \xC9 EN\xC9AS!", desc: "Onda sonora de m\xE9dio alcance que atordoa brevemente e empurra. Pode ser defendida." },
      { key: "I", name: "DIAGN\xD3STICO FATAL", desc: "Dispara um eletrocardiograma el\xE9trico pelo estetosc\xF3pio. No acerto: CASO GRAVE!" },
      { key: "O", name: "56 NA TESTA!", desc: "O 5 lan\xE7a e o 6 derruba. Dois proj\xE9teis bloque\xE1veis; a sequ\xEAncia conta como um uso \xE0 dist\xE2ncia." }
    ],
    superName: "BOMBA AT\xD4MICA BRASILEIRA",
    quote: "MEU NOME \xC9 EN\xC9AS!",
    bio: "M\xE9dio alcance com voz, ECG e n\xFAmeros. Prepara\xE7\xE3o e recupera\xE7\xE3o lentas exigem controlar a dist\xE2ncia e respeitar a recarga."
  },
  ...createWocFighters(copyNormals, caetanoPoses)
};
var BASE_HP = Object.fromEntries(CHAR_IDS.map((id) => [id, CHARS[id].hp]));
for (const def of Object.values(CHARS)) def.hp *= 2;
CHARS.eneas.name = "DR. ACREANO";
CHARS.eneas.short = "ACREANO";
CHARS.eneas.quote = "MEU NOME \xC9 ACREANO!";
CHARS.eneas.moves.s1.label = "MEU NOME \xC9 ACREANO!";
CHARS.eneas.specials[0].name = "MEU NOME \xC9 ACREANO!";
CHARS.caetano.superName = "SEQU\xCANCIA DE GOLPES KARATEKA";
CHARS.caetano.moves.s1.label = "CHUTE SENBUKAN";
CHARS.caetano.moves.s1.sound = void 0;
CHARS.caetano.specials[0] = { key: "U", name: "CHUTE SENBUKAN", desc: "Chute girat\xF3rio com energia laranja. Prepara\xE7\xE3o, defesa e puni\xE7\xE3o preservadas." };
CHARS.orango.superName = "INSTINTO DESCONTROLADO";
CHARS.tubarao.name = "TUBAR\xC3O FISCALIZADOR";
CHARS.rickzera.superName = "COMBO WISE";
CHARS.rickzera.bio = "Mercen\xE1rio atl\xE9tico. Segure CARREGAR em neutro ou receba dano para acumular energia. Especiais consomem energia, separada da stamina e da ULT.";
CHARS.rickzera.specials = [{ key: "U", name: "PROJETOS DE TRANSFER\xCANCIAS", desc: "Converte 16 de energia em tr\xEAs orbes verdes. Uma rajada conta como um uso de dist\xE2ncia." }, { key: "I", name: "SOCO DE ENERGIA", desc: "Gasta 22 de energia em uma proje\xE7\xE3o de punho verde, bloque\xE1vel e sem rastreamento." }, { key: "O", name: "SALTO DE ENERGIA", desc: "Gasta 18 de energia para um salto elevado. O segundo impulso no ar tamb\xE9m tem custo." }];
for (const [i, k] of ["s1", "s2", "s3"].entries()) CHARS.rickzera.moves[k].label = CHARS.rickzera.specials[i].name;
Object.assign(CHARS.rickzera.moves.s2, { dmg: 72, startup: 18, active: 3, recovery: 28, whiff: 10, launch: 0, spike: false, kb: 8, advance: void 0, poses: ["pH_s", "pH_a"] });
RANGED_MOVES.rickzera = ["s1", "s2"];
CHARS.bieu.color = "#22b8ef";
CHARS.bieu.glow = "#a5e9ff";
CHARS.bieu.superName = "CRIAS DO CAP\xC3O REDONDO";
CHARS.nomad.color = "#9ae042";
CHARS.nomad.color2 = "#4b1689";
CHARS.nomad.glow = "#d7b4ff";
CHARS.nomad.specials[0].name = "BURGER C\xD3SMICO";
CHARS.nomad.specials[1] = { key: "I", name: "SOCO GIGANTE", desc: "Punho c\xF3smico de alcance m\xE9dio, prepara\xE7\xE3o vis\xEDvel e recupera\xE7\xE3o longa. Pode ser defendido." };
CHARS.nomad.specials[2].name = "BOOMERANG N\xD4MADE";
Object.assign(CHARS.nomad.moves.s2, { startup: 20, active: 4, recovery: 30, whiff: 12, dmg: 72, hb: [15, 180, 55, 155], poses: ["pH_s", "pH_a"], label: "SOCO GIGANTE", level: "mid", kb: 9 });
RANGED_MOVES.nomad = ["s1", "s3"];
CHARS.aneninha.superName = "CRIAS DE OSASCO";
CHARS.aneninha.specials[2] = { key: "O", name: "LAN\xC7AR BARATAS", desc: "Barata rasteira de um acerto. Salte ou use defesa agachada." };
Object.assign(CHARS.aneninha.moves.s3, { dmg: 38, level: "low", launch: 0, label: "LAN\xC7AR BARATAS" });
CHARS.santox.title = "A LOUCURA C\xD4MICA";
CHARS.jao.color = "#9333ea";
CHARS.jao.glow = "#d8b4fe";
CHARS.jane.hurtH = 96;
CHARS.jane.crouchH = 60;
CHARS.cristyan.color = "#eab308";
CHARS.cristyan.glow = "#fef08a";
CHARS.cristyan.specials[2] = { key: "O", name: "JOELHADA DO GARUDA", desc: "Joelhada girat\xF3ria anunciada. Um acerto, sem invulnerabilidade e com recupera\xE7\xE3o pun\xEDvel." };
CHARS.cristyan.moves.s3.label = "JOELHADA DO GARUDA";
var SPECIAL_CHIP = {
  caetano: [0.04, 0.08, 0.06],
  orango: [0.06, 0, 0],
  tubarao: [0.05, 0, 0.025],
  rickzera: [0.025, 0.015, 0.025],
  bieu: [0.06, 0.03, 0.015],
  nomad: [0.03, 0.01, 0.02],
  renngotti: [0, 0.04, 0.04],
  aneninha: [0.04, 0.015, 0.035],
  santox: [0.035, 0.04, 0],
  jao: [0, 0.025, 0.035],
  jane: [0.015, 0.015, 0.035],
  cristyan: [0.035, 0.05, 0.04],
  eneas: [0.04, 0.035, 0.025],
  patrick: [0.03, 0.035, 0.06],
  gabrielzin: [0.02, 0, 0.02],
  ulisses: [0.03, 0, 0.025],
  felipence: [0.035, 0.03, 0.04],
  hdsh: [0, 0.025, 0.03]
};
for (const id of CHAR_IDS) for (const [i, key] of ["s1", "s2", "s3"].entries()) CHARS[id].moves[key].chip = SPECIAL_CHIP[id][i];
for (const def of Object.values(CHARS)) for (const move of Object.values(def.moves))
  if (move.kind === "normal" && !move.air && move.rank === 1) move.startup = Math.max(3, move.startup - 1);
for (const def of Object.values(CHARS)) {
  def.poses.headbutt_s = { ...def.poses.idle, lean: -12, head: 12, fa1: 65, fa2: -95, ba1: 90, ba2: -105 };
  def.poses.headbutt_a = { ...def.poses.idle, lean: 40, head: -22, fa1: 88, fa2: -65, ba1: 120, ba2: -85, mouth: 1 };
  def.moves.headbutt = mv("headbutt", {
    rank: 3,
    startup: 14,
    active: 3,
    recovery: 24,
    whiff: 12,
    dmg: Math.round(def.moves.pM.dmg * 1.05),
    hitstun: 20,
    blockstun: 12,
    kb: 5,
    kbBlock: 3,
    hb: [15, Math.round(def.hurtH * 0.34 + 25), Math.round(def.hurtH * 0.45), Math.round(def.hurtH * 0.94)],
    poses: ["headbutt_s", "headbutt_a"],
    hitstop: 8,
    shake: 5,
    power: 1.2,
    label: "CABE\xC7ADA"
  })[1];
}
for (const ch of CHAR_IDS) applyAccessoryNormals(ch, CHARS[ch].moves);
for (const ch of CHAR_IDS) for (const id of ["pL", "pM", "pH", "kL", "kM", "kH"]) {
  const m = CHARS[ch].moves[id];
  m.launch = m.launchVx = 0;
  m.kb = Math.min(m.kb, id.endsWith("H") ? 2.6 : 1.9);
  if (id.endsWith("H")) m.hitstun = Math.max(24, m.hitstun);
}
function movePhase(move, frame, connected) {
  if (frame < move.startup) return { phase: "startup", progress: Math.max(0, frame / Math.max(1, move.startup)) };
  if (frame < move.startup + move.active) return { phase: "active", progress: Math.max(0, (frame - move.startup) / Math.max(1, move.active)) };
  const duration = move.recovery + (connected ? 0 : move.whiff);
  return { phase: "recovery", progress: Math.min(1, Math.max(0, (frame - move.startup - move.active + 1) / Math.max(1, duration))) };
}
function impactStrength(move) {
  return move.kind === "normal" ? move.rank === 1 ? 0.55 : move.rank === 2 ? 1 : 1.65 : move.power;
}
var NORMAL_BY_RANK = { p: ["pL", "pM", "pH"], k: ["kL", "kM", "kH"] };

// src/game/combat-evolution.ts
var GUARD_RULES = { max: 100, delay: 135, regen: 0.32, breakFrames: 42, restore: 45 };
var STANDING_COMBO_LIMIT = 10;
var SIGNATURES = {
  caetano: { name: "Kata Senbukan", buttons: "pkppkp", art: "s2", guard: 26 },
  orango: { name: "F\xFAria da Selva", buttons: "pppkpk", art: "s1", guard: 34 },
  tubarao: { name: "Mar\xE9 Predat\xF3ria", buttons: "pkkppk", art: "s1", guard: 30 },
  rickzera: { name: "Fluxo de Energia", buttons: "ppkpkp", art: "pH", guard: 24 },
  bieu: { name: "Mal\xEDcia do Cap\xE3o", buttons: "pkpkkp", art: "s1", guard: 24 },
  nomad: { name: "Combo do Lobby", buttons: "ppkkpk", art: "s2", guard: 28 },
  renngotti: { name: "Sem Controle", buttons: "pkpkpp", art: "pH", guard: 32 },
  aneninha: { name: "Passo de Osasco", buttons: "pkkkkp", art: "s1", guard: 24 },
  santox: { name: "Erro de Continuidade", buttons: "ppkppk", art: "s1", guard: 24 },
  jao: { name: "Xeque em Seis", buttons: "pppkkp", art: "pH", guard: 24 },
  jane: { name: "Protocolo de Impacto", buttons: "pkkpkp", art: "pH", guard: 26 },
  cristyan: { name: "Seis Armas", buttons: "pkkkpp", art: "s1", guard: 30 },
  eneas: { name: "Sequ\xEAncia Nacional", buttons: "ppppkk", art: "pH", guard: 32 },
  patrick: { name: "Press\xE3o Blindada", buttons: "ppkkkk", art: "s3", guard: 34 },
  gabrielzin: { name: "Charme em Cadeia", buttons: "pkkkpk", art: "pH", guard: 22 },
  ulisses: { name: "Valsa do Nefasto", buttons: "pkpppk", art: "pH", guard: 28 },
  felipence: { name: "Cad\xEAncia do Caos", buttons: "ppkkkp", art: "s1", guard: 30 },
  hdsh: { name: "Padr\xE3o Decifrado", buttons: "pkpkpk", art: "pH", guard: 24 }
};
var standing = /^(p[LMH]|k[LMH])$/;
function signatureContinuation(ch, history, button, moves) {
  const s = SIGNATURES[ch], n = history.length;
  if (n < 2 || n >= s.buttons.length || history.some((id2, i) => !standing.test(id2) || id2[0] !== s.buttons[i]) || s.buttons[n] !== button) return;
  const id = button + (n === 3 ? "M" : "H"), base2 = moves[id], last = n === s.buttons.length - 1;
  return {
    ...base2,
    ...n >= 3 ? { startup: 6, active: 3, recovery: last ? 31 : 19, whiff: 16, hitstun: last ? 27 : 24, kb: last ? 4 : 1.4, launch: 0, rank: 3, advance: [0, 5, 1.6] } : {},
    signature: { step: n + 1, total: s.buttons.length, name: s.name },
    label: `${s.name} \xB7 ${n + 1}/${s.buttons.length}`,
    artMove: last ? s.art : void 0,
    guardDamage: last ? s.guard : void 0
  };
}
function guardPressure(m) {
  return m.guardDamage ?? (m.kind === "super" ? 32 : m.kind === "special" ? Math.min(30, 14 + m.power * 4) : m.id === "headbutt" ? 22 : m.rank >= 3 ? 22 : m.rank === 2 ? 13 : 8);
}

// src/game/combos.ts
var step = (move, input, hint = "Confirme o acerto antes de continuar.") => ({ move, input, hint });
var SPECIAL = { caetano: ["s2", "Dedilho t\xE9cnico"], orango: ["s1", "Dedilho Supremo"], tubarao: ["s1", "Mordida do Fiscal"], rickzera: ["s1", "Transfer\xEAncia de energia"], bieu: ["s1", "Chave confirmada"], nomad: ["s1", "Lanche na sequ\xEAncia"], renngotti: ["s2", "Microfone no combo"], aneninha: ["s1", "Osasco confirmado"], santox: ["s2", "Chute do Coelho"], jao: ["s2", "Equa\xE7\xE3o confirmada"], jane: ["s2", "Grau na sequ\xEAncia"], cristyan: ["s1", "Teep baiano"], eneas: ["s2", "Diagn\xF3stico confirmado"], patrick: ["s1", "Casco confirmado"], gabrielzin: ["s1", "Cora\xE7\xE3o confirmado"], ulisses: ["s1", "Membro distorcido"], felipence: ["s1", "Riff confirmado"], hdsh: ["s2", "Tend\xEAncia confirmada"] };
var COMBO_ROUTES = CHAR_IDS.flatMap((ch) => {
  const [special, name] = SPECIAL[ch], longAir = !["orango", "tubarao", "eneas", "patrick"].includes(ch);
  return [
    { id: `${ch}-two`, ch, name: "Um, dois!", level: "B\xE1sico", steps: [step("pL", ["p"]), step("kM", ["k"])], help: "Dois golpes com soco e chute. Comece perto e aperte o segundo durante o impacto." },
    { id: `${ch}-three`, ch, name: "Tr\xEAs tempos", level: "B\xE1sico", steps: [step("pL", ["p"]), step("kM", ["k"]), step("pH", ["p"])], help: "Leve \u2192 m\xE9dio \u2192 forte. O forte termina a cadeia; errar continua pun\xEDvel." },
    { id: `${ch}-special`, ch, name, level: "Intermedi\xE1rio", steps: [step("pL", ["p"]), step("kM", ["k"]), step(special, [special])], help: ch === "jane" ? "Confirme os dois normais em ESP 2. Soltar a moto inicia a arrancada; n\xE3o exceda cinco segundos." : `Confirme os normais no especial. ${["orango", "jao", "eneas"].includes(ch) ? "Este encaixe espec\xEDfico tem prepara\xE7\xE3o reduzida ap\xF3s o m\xE9dio confirmado." : "A prepara\xE7\xE3o e a recupera\xE7\xE3o pr\xF3prias do especial continuam valendo."}` },
    { id: `${ch}-air`, ch, name: "Rasteira e persegui\xE7\xE3o", level: "A\xE9reo", steps: [step("cK", ["down", "k"], "Segure baixo e aperte chute: rasteira."), step("jump", ["up"], "Aperte salto nos seis frames ap\xF3s o lan\xE7amento confirmado."), ...longAir ? [step("jP", ["p"], "Soco no ar, perto do rival."), step("jK", ["k"], "Confirme o soco em um chute a\xE9reo.")] : [step("jK", ["k"], "Chute no ar. A for\xE7a do lan\xE7amento pede uma finaliza\xE7\xE3o curta.")]], help: "Rasteira baixa \u2192 salto de persegui\xE7\xE3o \u2192 ataque a\xE9reo. O salto exige acerto; quatro contatos de juggle encerram as extens\xF5es." },
    { id: `${ch}-signature`, ch, name: SIGNATURES[ch].name, level: "Intermedi\xE1rio", steps: [...SIGNATURES[ch].buttons].map((b, i) => step(b + (i === 0 ? "L" : i === 1 || i === 3 ? "M" : "H"), [b], "Continue a ordem durante o impacto. Solte as dire\xE7\xF5es.")), help: "Seis contatos exclusivos com o rival em p\xE9. Exige cada acerto na ordem indicada; erro ou bloqueio interrompe a extens\xE3o. O golpe final encerra a sequ\xEAncia." }
  ];
});
var comboRoute = (id) => COMBO_ROUTES.find((r) => r.id === id);
function newComboCoach(id) {
  return { routeId: id, status: "ready", progress: 0, hits: 0, damage: 0, freeAt: null, notice: "Comece perto. O treinador conta acertos reais, n\xE3o s\xF3 bot\xF5es.", lastSerial: -1 };
}
function advanceComboCoach(c, e) {
  if (c.freeAt !== null) return;
  const route = comboRoute(c.routeId);
  if (!route) return;
  if (e.type === "free" && e.actor === 1) {
    if (c.progress > 0) {
      c.freeAt = e.tick;
      if (c.status === "active") {
        c.status = "failed";
        c.notice = "O rival recuperou o controle antes do fim. Confirme mais cedo ou ajuste a dist\xE2ncia.";
      }
    }
    return;
  }
  if (e.actor !== 0) return;
  if (e.type === "hit" && c.status !== "failed") {
    c.hits = e.hits;
    c.damage = e.damage;
  }
  if (c.status === "failed" || c.status === "success") return;
  const expected = route.steps[c.progress];
  if (!expected) return;
  if (e.type === "start") {
    c.status = "active";
    if (expected.move !== e.move) {
      c.status = "failed";
      c.notice = "Golpe diferente da rota. Solte as dire\xE7\xF5es e tente novamente.";
    }
  } else if (e.type === "block" || e.type === "whiff") {
    if (c.status === "active") {
      c.status = "failed";
      c.notice = e.type === "block" ? "Bloqueado: houve uma brecha ou o comando chegou tarde." : "O golpe errou. Aproxime-se antes de repetir.";
    }
  } else if (e.type === "jump" && expected.move === "jump" || e.type === "hit" && e.move === expected.move && e.serial !== c.lastSerial) {
    c.status = "active";
    c.lastSerial = e.serial;
    c.progress++;
    if (c.progress === route.steps.length) {
      c.status = "success";
      c.notice = "COMBO CORRETO! Todos os golpes da rota acertaram sem uma recupera\xE7\xE3o entre eles.";
    } else c.notice = route.steps[c.progress].hint;
  }
}

// src/game/training/catalog.ts
var TRAINING_VERSION = "reborn-1";
var TRAINING_RULES = { firstLesson: 50, simple: 75, intermediate: 150, advanced: 250, gradeS: 100, aiWin: [40, 65, 100, 160, 250, 320, 400], exam: 500, boss: 750, repeatRate: 0.25, repeatDailyXp: 400, repeatPerActivity: 2, masteryPerLevel: 120, maxTicks: 10800, maxInputs: 1e4, sessionSeconds: 1800, historyLimit: 100 };
var TIERS = ["Iniciante", "Normal", "Veterano", "Especialista", "Mestre", "Pesadelo", "Lend\xE1ria"];
var RANKS = ["Aprendiz", "Lutador", "Especialista", "Veterano", "Mestre", "Lenda dos Campe\xF5es"];
var DEFAULT_LAB = { dummy: "idle", hp: 100, heal: true, stamina: false, meter: 200, resource: 100, guard: "normal", distance: 180, side: 0, script: "punch", tier: 1 };
var base = (id, title, metric, target, category, more = {}) => ({ id, title, description: `Demonstre ${target} ${metric}.`, hint: "O treinador conta o que acontece na luta. Apertar sem conectar n\xE3o completa o objetivo.", kind: "challenge", section: "challenges", category, goals: [{ metric, target }], tier: 0, style: "technical", opponent: "caetano", stage: "dojo", finite: false, xp: TRAINING_RULES.simple, evaluation: "precision", maxTicks: TRAINING_RULES.maxTicks, distance: 115, ...more });
var L = (id, title, metric, target, hint, more = {}) => base("lesson-" + id, title, metric, target, "Fundamentos", { kind: "lesson", section: "academy", xp: TRAINING_RULES.firstLesson, hint, description: hint, ...more });
var LESSONS = [
  L("move", "Encontre sua dist\xE2ncia", "walk", 260, "Mova para frente e para tr\xE1s. Entre e saia do alcance antes de atacar.", { evaluation: "mobility", distance: 260 }),
  L("jump", "Controle do salto", "jump", 3, "Salte tr\xEAs vezes. Solte o comando entre os saltos.", { evaluation: "mobility" }),
  L("dash", "Passo rel\xE2mpago", "dash", 3, "Toque duas vezes rapidamente na mesma dire\xE7\xE3o para dar dash.", { evaluation: "mobility" }),
  L("turn", "Nunca perca o rival", "turn", 3, "Use Virar. A orienta\xE7\xE3o manual permite manter ou trocar o lado.", { evaluation: "mobility" }),
  L("basic", "Golpes com prop\xF3sito", "normalHits", 5, "Aproxime-se e acerte socos e chutes. Golpes no vazio n\xE3o contam."),
  L("combo", "Um, dois, tr\xEAs", "bestCombo", 3, "Conecte tr\xEAs acertos sem deixar o advers\xE1rio recuperar o controle.", { evaluation: "combo", meter: 0 }),
  L("guard", "Defender \xE9 agir", "blocks", 4, "Segure Defesa antes do contato. Observe o in\xEDcio do soco do aluno.", { script: "punch", evaluation: "defense" }),
  L("perfect", "No \xFAltimo instante", "perfects", 3, "Aperte Defesa nos 3 frames anteriores ao contato. O brilho do defensor confirma a defesa perfeita. Caetano tamb\xE9m possui Leitura de 5 frames.", { script: "punch", evaluation: "defense" }),
  L("low", "Defesa com base", "lowBlocks", 3, "Mantenha Baixo + Defesa para bloquear as rasteiras demonstradas.", { script: "low", evaluation: "defense" }),
  L("punish", "Agora \xE9 sua vez", "punishes", 3, "Espere o golpe errar e acerte durante a recupera\xE7\xE3o. O rival vai demonstrar cabe\xE7adas fora de alcance.", { script: "whiff", distance: 150 }),
  L("stamina", "Gerenciamento de f\xF4lego", "staminaRecovered", 55, "Ataques e deslocamentos gastam stamina. Pare de atacar em neutro para recuperar.", { evaluation: "resource" }),
  L("ultimate", "Assinatura final", "superHits", 1, "Com 200 ULT iniciais, use sua Ultimate perto do rival e confirme o acerto.", { meter: 200 }),
  L("form", "A hora da transforma\xE7\xE3o", "forms", 1, "Use Forma com 200 ULT e f\xF4lego. A prepara\xE7\xE3o pode ser punida; a forma ativa dura 10 segundos.", { meter: 200, evaluation: "resource" })
];
var rows = {
  Fundamentos: [["contact", "Primeiro contato", "hits", 8, "Acerte oito ataques."], ["ground", "Base firme", "lowHits", 4, "Acerte quatro golpes baixos."], ["air", "Dom\xEDnio dos ares", "airHits", 3, "Pule perto do alvo e acerte no ar."], ["move", "Jogo de pernas", "walk", 600, "Controle seiscentas unidades de espa\xE7o.", { evaluation: "mobility" }], ["switch", "De olho no outro lado", "turn", 6, "Execute seis viradas manuais.", { evaluation: "mobility" }], ["dash", "Passo e dist\xE2ncia", "dash", 6, "Execute seis dashes.", { evaluation: "mobility" }]],
  Ofensiva: [["combo", "Tr\xEAs tempos", "bestCombo", 3, "Confirme uma cadeia de tr\xEAs contatos.", { evaluation: "combo" }], ["combo6", "Press\xE3o cont\xEDnua", "bestCombo", 6, "Conecte uma cadeia de seis contatos.", { xp: 150, evaluation: "combo" }], ["throw", "Quebre a espera", "grabs", 3, "Conecte tr\xEAs agarr\xF5es reais.", { script: "guard" }], ["punish", "Ca\xE7ador de aberturas", "punishes", 5, "Puna cinco ataques errados durante a recupera\xE7\xE3o.", { script: "whiff", distance: 150, xp: 150 }], ["head", "Impacto frontal", "headHits", 4, "Conecte quatro cabe\xE7adas."], ["fury", "F\xFAria controlada", "comboUlt", 1, "Conecte uma cadeia de cinco ou mais contatos com Ultimate.", { meter: 200, evaluation: "combo", xp: 250 }]],
  Defensiva: [["wall", "Muralha absoluta", "blocks", 10, "Bloqueie dez ataques sem perder HP.", { script: "punch", constraints: { noDamage: true }, evaluation: "defense", xp: 150 }], ["perfect", "Leitura precisa", "perfects", 5, "Fa\xE7a cinco defesas perfeitas reais.", { script: "punch", evaluation: "defense", xp: 150 }], ["low", "Muralha baixa", "lowBlocks", 5, "Bloqueie cinco rasteiras.", { script: "low", evaluation: "defense" }], ["antiair", "C\xE9u fechado", "antiAir", 3, "Acerte tr\xEAs ataques contra um rival no ar.", { script: "air", evaluation: "defense" }], ["counter", "Resposta t\xE9cnica", "punishes", 3, "Bloqueie ou espere a recupera\xE7\xE3o e puna tr\xEAs vezes.", { script: "whiff", distance: 150, evaluation: "defense" }], ["break", "A guarda tem limite", "guardBreaks", 1, "Pressione at\xE9 quebrar a guarda do alvo.", { script: "guard", evaluation: "defense" }]],
  Recursos: [["breath", "Respira e responde", "staminaRecovered", 100, "Recupere cem de stamina sem reiniciar.", { evaluation: "resource" }], ["special", "Arsenal completo", "uniqueSpecials", 3, "Produza o efeito real dos tr\xEAs especiais.", { evaluation: "resource", meter: 200 }], ["ult", "Assinatura final", "superHits", 1, "Conecte uma Ultimate.", { meter: 200, evaluation: "resource" }], ["form", "Poder no momento certo", "formHits", 5, "Conecte cinco ataques durante sua transforma\xE7\xE3o.", { meter: 200, evaluation: "resource", xp: 150 }], ["cooldown", "Sem spam", "cooldowns", 1, "Complete a recarga de uma sequ\xEAncia de golpes \xE0 dist\xE2ncia.", { evaluation: "resource" }], ["efficient", "Sem desperd\xEDcio", "wins", 1, "Ven\xE7a sem esgotar a stamina.", { finite: true, tier: 1, constraints: { noExhaust: true }, evaluation: "resource", xp: 150, distance: 340 }]],
  Sobreviv\u00EAncia: [["chance", "\xDAltima chance", "wins", 1, "Ven\xE7a come\xE7ando com apenas 10% de HP.", { finite: true, health: 0.1, tier: 0, xp: 150, distance: 340 }], ["normal", "Sem especial", "wins", 1, "Ven\xE7a usando apenas normais, agarr\xE3o e movimenta\xE7\xE3o.", { finite: true, tier: 1, constraints: { noSpecial: true, noForm: true }, xp: 150, distance: 340 }], ["perfect", "Perfei\xE7\xE3o", "wins", 1, "Ven\xE7a sem receber dano.", { finite: true, tier: 1, constraints: { noDamage: true }, xp: 250, distance: 340 }], ["space", "Dono do espa\xE7o", "wins", 1, "Ven\xE7a o controle de dist\xE2ncia de J\xE3o.", { finite: true, tier: 2, opponent: "jao", style: "defensive", xp: 150, distance: 420 }], ["despair", "Desespero final", "activeTicks", 1800, "Sobreviva trinta segundos contra IA Pesadelo.", { finite: true, tier: 5, style: "aggressive", evaluation: "survival", xp: 250, distance: 340 }], ["all", "Contra tudo", "wins", 3, "Ven\xE7a tr\xEAs advers\xE1rios com recupera\xE7\xE3o limitada entre eles.", { finite: true, tier: 2, xp: 250, distance: 340 }]],
  Maestria: [["advanced", "Seis contatos", "bestCombo", 6, "Conecte uma sequ\xEAncia longa e mantenha a precis\xE3o.", { xp: 250, evaluation: "combo" }], ["duel", "Combate consciente", "wins", 1, "Ven\xE7a uma IA Especialista adaptativa.", { finite: true, tier: 3, style: "adaptive", xp: 250, distance: 340 }], ["pressure", "Press\xE3o que abre portas", "guardBreaks", 2, "Quebre a guarda duas vezes sem reiniciar.", { script: "guard", xp: 150 }], ["air", "Persegui\xE7\xE3o a\xE9rea", "airHits", 6, "Conecte seis contatos a\xE9reos reais.", { xp: 150, evaluation: "combo" }], ["form", "Controle da forma", "formHits", 8, "Conecte oito golpes durante a forma.", { meter: 200, xp: 250, evaluation: "resource" }], ["precision", "Consist\xEAncia de mestre", "punishes", 7, "Puna sete recupera\xE7\xF5es observadas.", { script: "whiff", distance: 150, xp: 250 }]]
};
rows.Fundamentos.push(["rhythm", "Passos e saltos", "walk", 300, "Mova e salte tr\xEAs vezes no mesmo exerc\xEDcio.", { goals: [{ metric: "walk", target: 300 }, { metric: "jump", target: 3 }], evaluation: "mobility" }], ["base", "Ataque com base", "lowHits", 2, "Confirme dois baixos e dois normais.", { goals: [{ metric: "lowHits", target: 2 }, { metric: "normalHits", target: 4 }] }], ["approach", "Entrada veloz", "dash", 2, "Execute dois dashes e conecte quatro ataques.", { goals: [{ metric: "dash", target: 2 }, { metric: "hits", target: 4 }] }]);
rows.Ofensiva.push(["opening", "Abre e confirma", "bestCombo", 3, "Puna uma recupera\xE7\xE3o e confirme uma cadeia de tr\xEAs.", { goals: [{ metric: "punishes", target: 1 }, { metric: "bestCombo", target: 3 }], script: "whiff", distance: 150, xp: 150 }], ["variety", "Varia\xE7\xE3o confirmada", "normalHits", 4, "Confirme quatro normais e tr\xEAs especiais.", { goals: [{ metric: "normalHits", target: 4 }, { metric: "specialHits", target: 3 }], xp: 150 }], ["advance", "Tome a iniciativa", "wins", 1, "Ven\xE7a uma IA agressiva Normal com uma cadeia de tr\xEAs.", { goals: [{ metric: "wins", target: 1 }, { metric: "bestCombo", target: 3 }], finite: true, tier: 1, style: "aggressive", distance: 340, xp: 150 }]);
rows.Defensiva.push(["timing", "Ritmo de defesa", "blocks", 6, "Bloqueie seis contatos, incluindo duas perfeitas.", { goals: [{ metric: "blocks", target: 6 }, { metric: "perfects", target: 2 }], script: "punch", evaluation: "defense", xp: 150 }], ["mixed", "Leitura de alturas", "blocks", 8, "Defenda o padr\xE3o alternado de altos e baixos.", { goals: [{ metric: "blocks", target: 8 }, { metric: "lowBlocks", target: 3 }], script: "mixed", evaluation: "defense", xp: 150 }], ["hold", "Resista \xE0 press\xE3o", "activeTicks", 1200, "Sobreviva vinte segundos contra uma IA agressiva Normal.", { finite: true, tier: 1, style: "aggressive", distance: 340, evaluation: "survival", xp: 150 }]);
rows.Recursos.push(["rick", "Energia consciente", "energyCharged", 60, "Com Rickzera, acumule sessenta de energia fora da Cruz.", { character: "rickzera", evaluation: "resource", xp: 150 }], ["restore", "Bateria conquistada", "resourceRecovered", 15, "Com Jane, recupere bateria acertando o rival.", { character: "jane", evaluation: "resource", xp: 150 }], ["vitality", "Sangue em combate", "resourceRecovered", 15, "Com Ulisses, recupere sangue atrav\xE9s de acertos.", { character: "ulisses", evaluation: "resource", xp: 150 }]);
rows.Sobreviv\u00EAncia.push(["patient", "Jogo paciente", "wins", 1, "Ven\xE7a a IA defensiva Normal sem transformar.", { finite: true, tier: 1, style: "defensive", constraints: { noForm: true }, distance: 340, xp: 150 }], ["veteran", "Pulso de veterano", "activeTicks", 1500, "Sobreviva vinte e cinco segundos contra uma IA Veterana t\xE9cnica.", { finite: true, tier: 2, style: "technical", distance: 340, evaluation: "survival", xp: 150 }], ["reserve", "Vida preservada", "wins", 1, "Ven\xE7a a IA Normal recebendo no m\xE1ximo 250 de dano.", { finite: true, tier: 1, constraints: { maxDamage: 250 }, distance: 340, xp: 250 }]);
rows.Maestria.push(["read", "Leitura e execu\xE7\xE3o", "perfects", 3, "Fa\xE7a tr\xEAs perfeitas e conecte uma cadeia de quatro.", { goals: [{ metric: "perfects", target: 3 }, { metric: "bestCombo", target: 4 }], script: "punch", evaluation: "combo", xp: 250 }], ["nightmare", "Supere o Pesadelo", "wins", 1, "Ven\xE7a uma IA Pesadelo com recursos normais.", { finite: true, tier: 5, style: "adaptive", distance: 340, evaluation: "combat", xp: 250 }], ["legend", "Prova\xE7\xE3o lend\xE1ria", "wins", 1, "Ven\xE7a uma IA Lend\xE1ria t\xE9cnica.", { finite: true, tier: 6, style: "technical", distance: 340, evaluation: "combat", xp: 250 }]);
var CHALLENGES = Object.entries(rows).flatMap(([category, items]) => items.map(([id, title, metric, target, hint, more]) => base(category.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") + "-" + id, title, metric, target, category, { description: hint, hint, ...more })));
var specialties = {
  caetano: ["Precis\xE3o Senbukan", "Puna tr\xEAs recupera\xE7\xF5es com o karat\xEA.", "punishes", 3],
  rickzera: ["Reserva consciente", "Acumule quarenta de energia fora da Cruz.", "energyCharged", 40],
  jane: ["Bateria em movimento", "Recupere bateria acertando os ataques da Jane.", "resourceRecovered", 12],
  ulisses: ["Vitalidade conquistada", "Recupere sangue acertando o advers\xE1rio.", "resourceRecovered", 12],
  felipence: ["Riff confirmado", "Conecte seis ataques especiais sonoros.", "specialHits", 6],
  orango: ["Instinto com t\xE9cnica", "Conecte tr\xEAs agarr\xF5es leg\xEDtimos.", "grabs", 3],
  tubarao: ["Ca\xE7a no alcance", "Conecte quatro especiais do Fiscal.", "specialHits", 4],
  bieu: ["Malandragem confirmada", "Conecte tr\xEAs especiais diferentes.", "uniqueSpecials", 3],
  nomad: ["Arsenal da jogatina", "Produza o efeito dos tr\xEAs especiais.", "uniqueSpecials", 3],
  renngotti: ["F\xFAria com dire\xE7\xE3o", "Conecte tr\xEAs ataques a\xE9reos.", "airHits", 3],
  aneninha: ["Osasco em combate", "Conecte cinco especiais reais.", "specialHits", 5],
  santox: ["Brecha do glitch", "Produza o efeito de todos os especiais, incluindo uma evas\xE3o real.", "uniqueSpecials", 3],
  jao: ["Tabuleiro em a\xE7\xE3o", "Produza o efeito dos tr\xEAs especiais. O tabuleiro precisa limitar movimento.", "uniqueSpecials", 3],
  cristyan: ["Oito armas", "Conecte quatro golpes baixos e mantenha o dom\xEDnio da base.", "lowHits", 4],
  eneas: ["Diagn\xF3stico preciso", "Conecte seis ataques especiais.", "specialHits", 6],
  patrick: ["Casco disciplinado", "Bloqueie seis ataques de verdade.", "blocks", 6],
  gabrielzin: ["Charme com contato", "Conecte cinco ataques especiais.", "specialHits", 5],
  hdsh: ["An\xE1lise aplicada", "Produza os tr\xEAs efeitos especiais; o territ\xF3rio precisa limitar movimento.", "uniqueSpecials", 3]
};
var MASTERY = CHAR_IDS.flatMap((ch) => {
  const [title, hint, metric, target] = specialties[ch];
  return [
    base(`mastery-${ch}-power`, title, metric, target, "Recursos", { kind: "mastery", section: "mastery", character: ch, xp: 150, description: hint, hint, evaluation: "resource", script: metric === "blocks" ? "punch" : metric === "punishes" ? "whiff" : void 0, distance: metric === "punishes" ? 150 : 115 }),
    base(`mastery-${ch}-chain`, `${CHARS[ch].short} \u2014 confirma\xE7\xE3o`, "bestCombo", 5, "Maestria", { kind: "mastery", section: "mastery", character: ch, xp: 150, description: "Conecte cinco contatos em uma cadeia real.", hint: "As rotas de combo da Academia ajudam a chegar ao objetivo.", evaluation: "combo" }),
    base(`mastery-${ch}-form`, `${CHARS[ch].short} \u2014 ess\xEAncia`, "formHits", 5, "Maestria", { kind: "mastery", section: "mastery", character: ch, meter: 200, xp: 250, description: "Acerte cinco ataques durante a transforma\xE7\xE3o leg\xEDtima do personagem.", hint: "Ative a forma com 200 ULT e aproveite seus dez segundos.", evaluation: "resource" })
  ];
});
var COMBO_LESSONS = COMBO_ROUTES.map((r) => base("route-" + r.id, r.name, "route", 1, "Ofensiva", { kind: "combo", section: "academy", character: r.ch, xp: r.level === "B\xE1sico" ? 75 : 150, evaluation: "combo", routeId: r.id, hint: r.help, description: r.help, distance: 100 }));
var bosses = { 5: ["caetano", "Exame de Precis\xE3o", "technical"], 10: ["rickzera", "Guerra de Energia", "adaptive"], 20: ["jao", "Tabuleiro de Combate", "defensive"], 30: ["santox", "Prova\xE7\xE3o do Glitch", "unpredictable"], 40: ["jane", "Velocidade EVA", "technical"], 50: ["caetano", "\xDAltimo exame Senbukan", "adaptive"] };
var towerTier = (floor) => floor <= 5 ? 0 : floor <= 10 ? 1 : floor <= 15 ? 2 : floor <= 20 ? 3 : floor <= 30 ? 4 : floor <= 40 ? 5 : 6;
var TOWER = Array.from({ length: 50 }, (_, i) => {
  const floor = i + 1, tier = towerTier(floor), boss = bosses[floor], ch = boss?.[0] ?? CHAR_IDS[(i * 7 + 3) % CHAR_IDS.length];
  return base(`tower-${floor}`, boss ? boss[1] : `Andar ${floor} \xB7 ${CHARS[ch].short}`, "wins", 1, "Sobreviv\xEAncia", { kind: "tower", section: "circuit", finite: true, tier, opponent: ch, style: boss?.[2] ?? ["aggressive", "defensive", "technical", "unpredictable", "adaptive"][i % 5], floor, boss: !!boss, xp: boss ? 750 : TRAINING_RULES.aiWin[tier], unique: !!boss, distance: 360, description: `Andar ${floor}: ${boss ? "chefe \u2014 " : ""}${CHARS[ch].name}. Atributos e recursos seguem as regras normais.`, hint: boss?.[0] === "rickzera" ? "Rick precisa carregar fora da Cruz de Energia. Pressione suas janelas de recupera\xE7\xE3o." : boss?.[0] === "jao" ? "Evite movimentos previs\xEDveis e pressione para interromper o controle de espa\xE7o." : "Observe o alcance, confirme seus ataques e preserve a guarda.", evaluation: "combat", constraints: floor === 25 ? { noExhaust: true } : floor === 45 ? { noSpecial: true } : void 0 });
});
var EXAMS = RANKS.map((title, index) => base(`exam-${index}`, `Exame \xB7 ${title}`, "wins", 1, "Maestria", { kind: "exam", section: "circuit", finite: true, tier: Math.min(6, index + 1), opponent: bosses[index * 10]?.[0] ?? CHAR_IDS[index * 3 % 18], style: "technical", exam: index, xp: 500, unique: true, distance: 320, description: `Demonstre o dom\xEDnio exigido para ${title}.`, hint: "A prova usa os recursos normais. As exig\xEAncias anteriores precisam estar conclu\xEDdas.", evaluation: "combat" }));
var RIVAL_ACTIVITIES = CHAR_IDS.flatMap((ch) => TIERS.map((_, tier) => base(`rival-${ch}-${tier}`, `Rival \xB7 ${CHARS[ch].short}`, "wins", 1, "Maestria", { kind: "rival", section: "circuit", finite: true, tier, opponent: ch, style: "adaptive", xp: TRAINING_RULES.aiWin[tier], distance: 340, description: `Enfrente ${CHARS[ch].name} na dificuldade ${TIERS[tier]}.`, hint: "O rival muda a estrat\xE9gia observando seus h\xE1bitos, sem alterar atributos.", evaluation: "combat" })));
var NPC_DRILLS = [
  base("city-moderator", "Patrulha da Capital", "wins", 1, "Ofensiva", { finite: true, tier: 1, opponent: "ulisses", npc: "moderator", stage: "twitchcity-capital", distance: 340, xp: 100, description: "Enfrente um Moderador com espada e jetpack na pra\xE7a da Capital.", hint: "A espada tem alcance. Espere o corte terminar antes de avan\xE7ar.", evaluation: "combat" }),
  base("city-supreme", "Comando Supremo", "wins", 1, "Maestria", { finite: true, tier: 3, opponent: "renngotti", npc: "supreme", stage: "twitchcity-military", distance: 360, xp: 250, description: "Confronte o martelo e a armadura do Moderador Supremo.", hint: "O martelo \xE9 pesado. Puna a recupera\xE7\xE3o em vez de disputar o impacto.", evaluation: "combat" }),
  base("city-jetpack", "C\xE9u sob controle", "antiAir", 4, "Defensiva", { opponent: "ulisses", npc: "moderator", stage: "twitchcity-capital", script: "air", distance: 100, xp: 150, description: "Acerte quatro antia\xE9reos contra o jetpack do Moderador.", hint: "Espere o soldado entrar no alcance do seu golpe.", evaluation: "defense" })
];
TOWER.forEach((a) => {
  if (!a.boss && a.floor % 5 === 1) {
    a.npc = "moderator";
    a.opponent = "ulisses";
    a.stage = "twitchcity-capital";
    a.title = `Andar ${a.floor} \xB7 Patrulha da Capital`;
    a.description = "Moderador com espada, jetpack e regras pr\xF3prias de equipamento.";
  } else if (!a.boss && a.floor % 10 === 8) {
    a.npc = "supreme";
    a.opponent = "renngotti";
    a.stage = "twitchcity-military";
    a.title = `Andar ${a.floor} \xB7 Comando Supremo`;
    a.description = "O comandante usa martelo pesado; aproveite sua recupera\xE7\xE3o.";
  } else if (a.opponent === "caetano") a.stage = "twitchcity-conservator";
});
var ACTIVITIES = [...LESSONS, ...CHALLENGES, ...NPC_DRILLS, ...MASTERY, ...COMBO_LESSONS, ...TOWER, ...EXAMS, ...RIVAL_ACTIVITIES];
var INDEX = new Map(ACTIVITIES.map((a) => [a.id, a]));
var activity = (id) => INDEX.get(id);
function unlockedTier(p) {
  let tier = 1;
  const wins = (n) => ACTIVITIES.filter((a) => a.finite && a.tier === n).reduce((sum, a) => sum + (p.completions[a.id]?.wins ?? 0), 0);
  if (p.exams.includes("exam-1") && wins(1) >= 2) tier = 2;
  if (tier === 2 && wins(2) >= 2 && Object.values(p.completions).filter((c) => ["A", "S"].includes(c.best)).length >= 6) tier = 3;
  if (tier === 3 && p.exams.includes("exam-2") && wins(3) >= 2) tier = 4;
  if (tier === 4 && p.exams.includes("exam-3") && wins(4) >= 2) tier = 5;
  if (tier === 5 && p.exams.includes("exam-4") && wins(5) >= 2) tier = 6;
  return tier;
}
function lockedReason(a, p, ch) {
  if (a.character && a.character !== ch) return `Escolha ${CHARS[a.character].name}.`;
  if (a.id === "recursos-cooldown" && RANGED_MOVES[ch].length === 0) return "Este exerc\xEDcio exige um lutador com ataques \xE0 dist\xE2ncia.";
  if (a.floor && a.floor > p.tower + 1) return `Conclua o andar ${a.floor - 1}.`;
  if (a.exam !== void 0) {
    const i = a.exam;
    if (i > 0 && !p.exams.includes(`exam-${i - 1}`)) return "Conclua o exame anterior.";
    const lessonCount = LESSONS.filter((l) => p.completions[l.id]?.wins).length;
    if (lessonCount < Math.min(13, 3 + i * 2)) return `Conclua ${Math.min(13, 3 + i * 2)} aulas da Academia.`;
    if (i > 0 && Object.values(p.completions).filter((c) => c.wins && ["A", "S"].includes(c.best)).length < 2 + i * 2) return `Obtenha ${2 + i * 2} avalia\xE7\xF5es A ou S.`;
    if (i > 1 && !ACTIVITIES.some((a2) => a2.finite && a2.tier >= i - 1 && (p.completions[a2.id]?.wins ?? 0) > 0)) return `Ven\xE7a uma IA ${TIERS[i - 1]}.`;
    return null;
  }
  if (a.tier > unlockedTier(p)) return `Dificuldade ${TIERS[a.tier]} bloqueada. Avance nos exames e ven\xE7a o n\xEDvel anterior.`;
  return null;
}
function rotatingMissions(nowSeconds, p) {
  const day = Math.floor(nowSeconds / 86400) * 86400, week = Math.floor((nowSeconds - 345600) / 604800) * 604800 + 345600;
  const daily = [["Conclua tr\xEAs treinos defensivos", "defense", 3], ["Jogue com tr\xEAs lutadores", "characters", 3], ["Ven\xE7a duas IAs Veteranas ou superiores", "veteranWins", 2]];
  let d = daily[Math.floor(day / 86400) % daily.length];
  if (d[1] === "veteranWins" && p && unlockedTier(p) < 2) d = daily[1];
  const assigned = daily.find((item) => p?.missions[`daily-${day}-${item[1]}`]);
  if (assigned) d = assigned;
  return [
    { id: `daily-${day}-${d[1]}`, title: d[0], start: day, end: day + 86400, target: d[2], metric: d[1], xp: 150, period: "daily" },
    { id: `weekly-${week}-gradeA`, title: "Conclua dez atividades com A ou S", start: week, end: week + 604800, target: 10, metric: "gradeA", xp: 500, period: "weekly" },
    { id: `weekly-${week}-bosses`, title: "Derrote tr\xEAs chefes da Torre", start: week, end: week + 604800, target: 3, metric: "bosses", xp: 500, period: "weekly" },
    { id: `weekly-${week}-streak`, title: "Conquiste cinco vit\xF3rias seguidas", start: week, end: week + 604800, target: 5, metric: "streak", xp: 350, period: "weekly" }
  ];
}
function rivalStyle(a, p) {
  return a.kind === "rival" && (p.rivals[a.opponent]?.streak ?? 0) >= 2 ? "adaptive" : a.style;
}

// src/game/training/evaluation.ts
var GRADE_VALUE = { D: 0, C: 1, B: 2, A: 3, S: 4 };
function freshMetrics() {
  return { walk: 0, jump: 0, dash: 0, turn: 0, crouch: 0, hits: 0, normalHits: 0, specialHits: 0, uniqueSpecials: 0, lowHits: 0, airHits: 0, headHits: 0, grabs: 0, damage: 0, blocks: 0, perfects: 0, lowBlocks: 0, antiAir: 0, punishes: 0, guardBreaks: 0, bestCombo: 0, comboUlt: 0, superHits: 0, forms: 0, formHits: 0, staminaRecovered: 0, energyCharged: 0, resourceRecovered: 0, cooldowns: 0, route: 0, wins: 0, activeTicks: 0, attempts: 0, connected: 0, whiffs: 0, damageTaken: 0, staminaUsed: 0, exhausts: 0, specialStarts: 0, formStarts: 0, minHp: 1, enemyStarts: 0, winStreak: 0 };
}
var clamp2 = (v) => Math.max(0, Math.min(100, v));
function evaluate(a, m, success) {
  const precision = clamp2(m.attempts ? 100 * m.connected / m.attempts : 100), health = clamp2(100 - m.damageTaken / 12), speed = clamp2(110 - m.activeTicks / (a.evaluation === "survival" ? 90 : 45)), defense = clamp2(100 * (m.blocks + m.perfects * 0.5) / Math.max(1, m.blocks + m.enemyStarts * 0.1)), resources = clamp2(100 - m.exhausts * 22 - m.staminaUsed / 45), combo = clamp2(40 + m.bestCombo * 10);
  const values = {
    mobility: [{ label: "Execu\xE7\xE3o", value: success ? 100 : 45, help: "Movimentos reais conclu\xEDdos." }, { label: "Ritmo", value: speed, help: "Tempo ativo at\xE9 completar." }],
    precision: [{ label: "Precis\xE3o", value: precision, help: "Ataques que conectaram / ataques iniciados." }, { label: "Ritmo", value: speed, help: "Tempo ativo at\xE9 o objetivo." }, { label: "Controle", value: health, help: "Dano recebido durante o exerc\xEDcio." }],
    defense: [{ label: "Defesa", value: defense, help: "Bloqueios reais, com b\xF4nus por precis\xE3o." }, { label: "Preserva\xE7\xE3o", value: health, help: "Vida preservada." }, { label: "Ritmo", value: speed, help: "Tentativas dentro do tempo ativo." }],
    resource: [{ label: "Efici\xEAncia", value: resources, help: "Esgotamentos e gasto de stamina." }, { label: "Execu\xE7\xE3o", value: success ? 100 : 40, help: "Uso real do recurso pedido." }, { label: "Precis\xE3o", value: precision, help: "Acertos em rela\xE7\xE3o aos ataques." }],
    combo: [{ label: "Confirma\xE7\xE3o", value: precision, help: "Ataques que conectaram." }, { label: "Sequ\xEAncia", value: combo, help: "Melhor combo real do motor." }, { label: "Ritmo", value: speed, help: "Tempo para confirmar a sequ\xEAncia." }],
    combat: [{ label: "Controle", value: health, help: "Dano recebido." }, { label: "Precis\xE3o", value: precision, help: "Acertos em rela\xE7\xE3o aos ataques." }, { label: "Recursos", value: resources, help: "Stamina usada com seguran\xE7a." }, { label: "Press\xE3o", value: combo, help: "Melhor cadeia confirmada." }],
    survival: [{ label: "Resist\xEAncia", value: clamp2(m.activeTicks / Math.max(1, a.goals[0].target) * 100), help: "Tempo sobrevivido em combate." }, { label: "Preserva\xE7\xE3o", value: health, help: "Vida preservada." }, { label: "Recursos", value: resources, help: "F\xF4lego dispon\xEDvel durante a press\xE3o." }]
  };
  const breakdown = values[a.evaluation].map((v) => ({ ...v, value: Math.round(v.value) }));
  const score = Math.round(breakdown.reduce((n, v) => n + v.value, 0) / breakdown.length), grade = !success ? "D" : score >= 90 ? "S" : score >= 75 ? "A" : score >= 60 ? "B" : score >= 45 ? "C" : "D";
  const recommendations = [];
  if (m.exhausts > 0) recommendations.push(`Voc\xEA esgotou a stamina ${m.exhausts} vez(es). Pratique Gerenciamento de f\xF4lego.`);
  if (m.attempts > 3 && precision < 65) recommendations.push("Muitos ataques ficaram sem contato. Aproxime-se e confirme antes de continuar a sequ\xEAncia.");
  if (m.damageTaken > 250) recommendations.push("Voc\xEA recebeu muita press\xE3o. Treine Guarda e No \xFAltimo instante.");
  if (m.bestCombo < 3 && a.evaluation === "combat") recommendations.push("Pratique a rota Tr\xEAs tempos da Academia para converter aberturas em combos.");
  if (!success && a.constraints?.noSpecial && m.specialStarts) recommendations.push("Este exerc\xEDcio permite apenas golpes normais e mobilidade. Os especiais iniciados invalidaram a tentativa.");
  if (!recommendations.length) recommendations.push(success ? "Boa execu\xE7\xE3o. Experimente uma rota mais exigente ou avance nos exames." : "Observe a orienta\xE7\xE3o do treinador e repita com mais calma.");
  return { grade, score, breakdown, recommendations: recommendations.slice(0, 3) };
}

// src/game/training/progress.ts
function freshProgress() {
  return { version: 1, revision: 0, xp: 0, rank: 0, exams: [], completions: {}, mastery: {}, uses: {}, history: [], tower: 0, streak: 0, bestStreak: 0, rivals: {}, missions: {}, rewards: [], repeatDay: "", repeatXp: 0, repeatCount: {}, activeSeconds: 0, legacy: [] };
}
var safe = (n, max = 1e9) => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= max;
function readProgress(raw) {
  const out = freshProgress();
  if (!raw || typeof raw !== "object" || raw.version !== 1) return out;
  const p = raw;
  for (const key of ["xp", "revision", "rank", "tower", "streak", "bestStreak", "activeSeconds", "repeatXp"]) if (safe(p[key])) out[key] = p[key];
  out.rank = Math.min(5, Math.floor(out.rank));
  out.tower = Math.min(50, Math.floor(out.tower));
  out.exams = Array.isArray(p.exams) ? p.exams.filter((x) => /^exam-[0-5]$/.test(x)).slice(0, 6) : [];
  out.rewards = Array.isArray(p.rewards) ? p.rewards.filter((x) => typeof x === "string" && x.length < 150).slice(-1200) : [];
  out.legacy = Array.isArray(p.legacy) ? p.legacy.filter((x) => typeof x === "string").slice(0, 100) : [];
  out.repeatDay = typeof p.repeatDay === "string" ? p.repeatDay.slice(0, 10) : "";
  for (const ch of CHAR_IDS) {
    if (safe(p.mastery?.[ch], 1e6)) out.mastery[ch] = p.mastery[ch];
    if (safe(p.uses?.[ch])) out.uses[ch] = p.uses[ch];
  }
  for (const a of ACTIVITIES) {
    const c = p.completions?.[a.id];
    if (c && safe(c.count) && safe(c.wins) && ["D", "C", "B", "A", "S"].includes(c.best) && safe(c.score, 100) && safe(c.first, 1e15) && safe(c.last, 1e15)) out.completions[a.id] = { ...c };
    if (safe(p.repeatCount?.[a.id], 100)) out.repeatCount[a.id] = p.repeatCount[a.id];
  }
  out.history = Array.isArray(p.history) ? p.history.filter(validResult).slice(0, TRAINING_RULES.historyLimit) : [];
  if (!p.uses) for (const r of out.history) out.uses[r.character] = (out.uses[r.character] ?? 0) + 1;
  for (const ch of CHAR_IDS) {
    const r = p.rivals?.[ch];
    if (r && r.character === ch && safe(r.tier, 6) && safe(r.wins) && safe(r.losses) && safe(r.streak) && safe(r.best) && Number.isInteger(r.tier) && typeof r.last === "string" && ["aggressive", "defensive", "technical", "unpredictable", "adaptive"].includes(r.style)) out.rivals[ch] = { ...r };
  }
  if (p.missions && typeof p.missions === "object") {
    for (const [id, m] of Object.entries(p.missions).slice(-24)) if (/^(daily|weekly)-[0-9]+-[A-Za-z]+$/.test(id) && m && safe(m.value) && Array.isArray(m.chars)) out.missions[id] = { value: m.value, chars: m.chars.filter((ch) => CHAR_IDS.includes(ch)).slice(0, 18), claimed: m.claimed === true };
  }
  return out;
}
function validResult(r) {
  if (!r || typeof r !== "object") return false;
  const v = r;
  return typeof v.id === "string" && !!activity(v.activityId) && CHAR_IDS.includes(v.character) && CHAR_IDS.includes(v.opponent) && typeof v.success === "boolean" && ["D", "C", "B", "A", "S"].includes(v.grade) && safe(v.at, 1e15) && safe(v.activeSeconds, 2e3) && safe(v.xp, 1e5) && !!v.metrics && Object.keys(freshMetrics()).every((k) => safe(v.metrics[k])) && safe(v.score, 100) && safe(v.masteryGained, 1e3) && typeof v.reason === "string" && Array.isArray(v.recommendations) && v.recommendations.every((s) => typeof s === "string" && s.length < 600) && Array.isArray(v.breakdown) && v.breakdown.every((b) => b && typeof b.label === "string" && typeof b.help === "string" && safe(b.value, 100));
}
function applyResult(previous, result, missions, awardLocal = true) {
  const p = readProgress(previous);
  if (p.history.some((r2) => r2.id === result.id)) return p;
  const a = activity(result.activityId);
  if (!a) return p;
  const r = { ...result, metrics: { ...result.metrics }, xp: 0, masteryGained: 0, promoted: false };
  const nowSeconds = r.at / 1e3, day = new Date(r.at).toISOString().slice(0, 10);
  if (p.repeatDay !== day) {
    p.repeatDay = day;
    p.repeatCount = {};
    p.repeatXp = 0;
  }
  const old = p.completions[a.id];
  p.completions[a.id] = { count: (old?.count ?? 0) + 1, wins: (old?.wins ?? 0) + (r.success ? 1 : 0), best: old && GRADE_VALUE[old.best] > GRADE_VALUE[r.grade] ? old.best : r.grade, score: Math.max(old?.score ?? 0, r.score), first: old?.first ?? r.at, last: r.at };
  if (a.finite) p.streak = r.success ? p.streak + 1 : 0;
  p.bestStreak = Math.max(p.bestStreak, p.streak);
  p.activeSeconds += r.activeSeconds;
  p.uses[r.character] = (p.uses[r.character] ?? 0) + 1;
  if (r.success) {
    if (awardLocal) {
      const first = `first:${a.id}`;
      if (!p.rewards.includes(first) && !old?.wins) {
        r.xp = a.xp;
        p.rewards.push(first);
      } else if (!a.unique && (p.repeatCount[a.id] ?? 0) < TRAINING_RULES.repeatPerActivity) {
        const repeat = Math.min(Math.floor(a.xp * TRAINING_RULES.repeatRate), TRAINING_RULES.repeatDailyXp - p.repeatXp);
        r.xp = Math.max(0, repeat);
        if (r.xp) {
          p.repeatXp += r.xp;
          p.repeatCount[a.id] = (p.repeatCount[a.id] ?? 0) + 1;
        }
      }
      if (r.grade === "S" && ["challenge", "mastery", "combo"].includes(a.kind) && !p.rewards.includes(`gradeS:${a.id}`) && old?.best !== "S") {
        r.xp += TRAINING_RULES.gradeS;
        p.rewards.push(`gradeS:${a.id}`);
      }
    }
    r.masteryGained = Math.min(50, 12 + Math.floor(r.score / 10) + (a.finite ? 10 : 0));
    p.mastery[r.character] = Math.min(1080, (p.mastery[r.character] ?? 0) + r.masteryGained);
    if (a.exam !== void 0 && !p.exams.includes(a.id)) {
      p.exams.push(a.id);
      r.promoted = a.exam > p.rank;
      p.rank = Math.max(p.rank, a.exam);
    }
    if (a.floor) p.tower = Math.max(p.tower, a.floor);
  }
  if (a.finite && !a.npc) {
    const oldR = p.rivals[r.opponent], streak = r.success ? (oldR?.streak ?? 0) + 1 : 0;
    p.rivals[r.opponent] = { character: r.opponent, tier: a.tier, style: a.style, wins: (oldR?.wins ?? 0) + (r.success ? 1 : 0), losses: (oldR?.losses ?? 0) + (r.success ? 0 : 1), streak, best: Math.max(oldR?.best ?? 0, streak), last: CHARS[r.opponent].quote + (r.success ? " \xB7 Sua vit\xF3ria ficou registrada. Prepare-se para a revanche." : " \xB7 Treine a defesa e a recupera\xE7\xE3o na Academia antes da revanche.") };
  }
  for (const m of missions) {
    if (nowSeconds < m.start || nowSeconds >= m.end) continue;
    const data = p.missions[m.id] ?? { value: 0, chars: [], claimed: false };
    if (m.metric === "streak" && a.finite && !data.claimed) data.value = r.success ? Math.min(m.target, data.value + 1) : 0;
    if (r.success) {
      if (m.metric === "characters" && !data.chars.includes(r.character)) data.chars.push(r.character);
      const add = m.metric === "veteranWins" ? Number(a.finite && a.tier >= 2) : m.metric === "defense" ? Number(a.category === "Defensiva") : m.metric === "gradeA" ? Number(GRADE_VALUE[r.grade] >= 3) : m.metric === "bosses" ? Number(!!a.boss) : 0;
      data.value = m.metric === "characters" ? data.chars.length : m.metric === "streak" ? data.value : data.value + add;
      if (data.value >= m.target && !data.claimed) {
        data.claimed = true;
        if (awardLocal) {
          r.xp += m.xp;
          p.rewards.push("mission:" + m.id);
        }
      }
    }
    p.missions[m.id] = data;
  }
  const activeIds = new Set(missions.map((m) => m.id));
  p.missions = Object.fromEntries(Object.entries(p.missions).filter(([id]) => activeIds.has(id)));
  p.xp += r.xp;
  p.revision++;
  p.history = [r, ...p.history].slice(0, TRAINING_RULES.historyLimit);
  p.rewards = p.rewards.slice(-1200);
  return p;
}

// src/game/training/npc.ts
var TRAINING_NPCS = { moderator: { id: "moderator", name: "Moderador de Twitchcity", short: "MODERADOR", base: "ulisses", weapon: "Espada moderna", description: "Espada de energia estabilizada, armadura t\xE1tica e jetpack. Unidade de arquivo do antigo governo, recriada no simulador.", hp: 1e3 }, supreme: { id: "supreme", name: "Moderador Supremo", short: "MODERADOR SUPREMO", base: "renngotti", weapon: "Martelo de execu\xE7\xE3o", description: "Comandante de armadura pesada, capa e jetpack avan\xE7ado. Golpes lentos e fortes, com recupera\xE7\xE3o que pode ser punida.", hp: 1250 } };
function npcDefinition(id) {
  const meta = TRAINING_NPCS[id], source = CHARS[meta.base], heavy = id === "supreme";
  const moves = Object.fromEntries(Object.entries(source.moves).map(([key, m]) => [key, { ...m, hb: [...m.hb], accessory: void 0, signature: m.signature ? { ...m.signature, name: heavy ? "Protocolo de Execu\xE7\xE3o" : "Protocolo de Conten\xE7\xE3o" } : void 0 }]));
  const normal = CHARS.caetano.moves.pH;
  moves.s1 = { ...normal, id: "s1", kind: "special", rank: 3, startup: heavy ? 24 : 12, active: 6, recovery: heavy ? 34 : 22, whiff: 14, dmg: heavy ? 115 : 68, hb: [15, heavy ? 175 : 160, -150, -30], hitstun: 24, blockstun: 19, poses: source.moves.pH.poses, label: heavy ? "MARTELO DE EXECU\xC7\xC3O" : "CORTE DE CONTEN\xC7\xC3O", trail: "fw", grab: void 0, charge: false, dedilho: false, advance: [3, 8, heavy ? 1.7 : 2.6] };
  moves.s2 = { ...CHARS.caetano.moves.kH, id: "s2", kind: "special", startup: 15, active: 10, recovery: 25, whiff: 14, dmg: heavy ? 76 : 58, hb: [10, 145, -132, -26], poses: source.moves.kH.poses, label: "AVAN\xC7O T\xC1TICO", advance: [4, 14, heavy ? 3 : 5], grab: void 0 };
  moves.s3 = { ...normal, id: "s3", kind: "special", startup: heavy ? 28 : 18, active: 8, recovery: 30, whiff: 14, dmg: heavy ? 125 : 78, hb: [10, 135, -205, -15], launch: 9, launchVx: 3.5, poses: source.moves.pH.poses, label: heavy ? "ONDA DE IMPACTO" : "ASCENS\xC3O DO JETPACK", trail: "fw", grab: void 0, charge: false, dedilho: false };
  return { ...source, name: meta.name, short: meta.short, title: heavy ? "COMANDANTE DOS MODERADORES" : "FOR\xC7A DE SEGURAN\xC7A \xB7 ARQUIVO", color: "#a46cd9", color2: "#442052", glow: "#a8ff3b", hp: meta.hp, pushW: heavy ? 36 : 28, hurtH: heavy ? 194 : 180, crouchH: heavy ? 124 : 112, walk: heavy ? 3.4 : 4.2, walkBack: heavy ? 2.8 : 3.5, jumpVy: heavy ? 16.5 : 17.6, moves };
}
function applyTrainingNpc(f, id) {
  const def = npcDefinition(id);
  f.npc = id;
  f.def = def;
  f.maxHp = f.hp = f.dispHp = def.hp;
  return f;
}

// src/game/touch.ts
var pointers = /* @__PURE__ */ new Map();
var touchInput = {
  held: /* @__PURE__ */ new Set(),
  pressed: /* @__PURE__ */ new Set(),
  set(id, actions) {
    const before = this.held;
    for (const a of actions) if (!before.has(a)) this.pressed.add(a);
    if (actions.length) pointers.set(id, actions);
    else pointers.delete(id);
    this.held = new Set([...pointers.values()].flat());
  },
  consume() {
    const out = [...this.pressed];
    this.pressed.clear();
    return out;
  },
  clear() {
    pointers.clear();
    this.held.clear();
    this.pressed.clear();
  }
};

// src/game/input.ts
var ACTIONS = ["left", "right", "up", "down", "p", "k", "block", "s1", "s2", "s3", "super", "grab", "turn", "headbutt", "transform", "charge"];
var MAX_INPUT_MASK = (1 << ACTIONS.length) - 1;
var INPUT_BUFFER_FRAMES = 9;
var DASH_TAP_FRAMES = 14;
var DEFAULT_BINDINGS = [
  {
    left: ["KeyA", ""],
    right: ["KeyD", ""],
    up: ["KeyW", ""],
    down: ["KeyS", ""],
    p: ["KeyJ", ""],
    k: ["KeyK", ""],
    block: ["KeyE", ""],
    s1: ["KeyU", ""],
    s2: ["KeyI", ""],
    s3: ["KeyO", ""],
    super: ["KeyH", ""],
    grab: ["KeyG", ""],
    turn: ["KeyQ", ""],
    headbutt: ["KeyL", ""],
    transform: ["KeyF", ""],
    charge: ["KeyC", ""]
  },
  {
    left: ["ArrowLeft", ""],
    right: ["ArrowRight", ""],
    up: ["ArrowUp", ""],
    down: ["ArrowDown", ""],
    p: ["Numpad1", "Comma"],
    k: ["Numpad2", "Period"],
    block: ["Numpad3", "Slash"],
    s1: ["Numpad4", "Semicolon"],
    s2: ["Numpad5", "Quote"],
    s3: ["Numpad6", "Enter"],
    super: ["Numpad0", "ShiftRight"],
    grab: ["Numpad7", "KeyB"],
    turn: ["KeyN", ""],
    headbutt: ["Numpad9", "BracketLeft"],
    transform: ["Numpad8", "BracketRight"],
    charge: ["KeyM", ""]
  }
];
var Keyboard = class {
  down = /* @__PURE__ */ new Set();
  pressed = /* @__PURE__ */ new Set();
  listeners = [];
  kd = (e) => {
    if (!e.repeat && !this.down.has(e.code)) this.pressed.add(e.code);
    this.down.add(e.code);
    this.listeners.forEach((l) => l(e.code, e));
  };
  ku = (e) => {
    this.down.delete(e.code);
  };
  blur = () => {
    this.down.clear();
    this.pressed.clear();
  };
  consumePressed() {
    const out = new Set(this.pressed);
    this.pressed.clear();
    return out;
  }
  attach() {
    window.addEventListener("keydown", this.kd);
    window.addEventListener("keyup", this.ku);
    window.addEventListener("blur", this.blur);
  }
  detach() {
    window.removeEventListener("keydown", this.kd);
    window.removeEventListener("keyup", this.ku);
    window.removeEventListener("blur", this.blur);
    this.down.clear();
    this.pressed.clear();
  }
};
var keyboard = new Keyboard();
var Pad = class {
  history = [];
  held = {};
  pressedAt = {};
  prevAt = {};
  edgeAt = {};
  constructor() {
    this.reset();
  }
  reset() {
    this.history = [];
    for (const a of ACTIONS) {
      this.held[a] = false;
      this.pressedAt[a] = -999;
      this.prevAt[a] = -999;
      this.edgeAt[a] = -999;
    }
  }
  set(a, down, tick) {
    if (down && !this.held[a]) {
      this.tap(a, tick);
    }
    this.held[a] = down;
  }
  pollKeys(b, tick, touch = false, presses = keyboard.consumePressed()) {
    for (const a of ACTIONS) {
      const [c1, c2] = b[a];
      this.set(a, !!c1 && keyboard.down.has(c1) || !!c2 && keyboard.down.has(c2) || touch && touchInput.held.has(a), tick);
      if ((presses.has(c1) || presses.has(c2)) && this.pressedAt[a] !== tick) this.tap(a, tick);
    }
    if (touch) {
      for (const a of touchInput.consume()) if (this.pressedAt[a] !== tick) this.tap(a, tick);
    }
  }
  buffered(a, tick, win = INPUT_BUFFER_FRAMES) {
    const age = tick - this.pressedAt[a];
    return age >= 0 && age < win;
  }
  doubleTapped(a, tick) {
    const gap = this.edgeAt[a] - this.prevAt[a];
    return this.buffered(a, tick) && this.prevAt[a] >= 0 && gap > 0 && gap <= DASH_TAP_FRAMES;
  }
  consumeDash(a) {
    this.consume(a);
    this.edgeAt[a] = this.prevAt[a] = -999;
  }
  freezeBuffers(tick) {
    for (const a of ACTIONS) {
      if (this.pressedAt[a] < tick && tick - this.pressedAt[a] <= INPUT_BUFFER_FRAMES) this.pressedAt[a]++;
    }
  }
  consume(a) {
    this.pressedAt[a] = -999;
  }
  tap(a, tick) {
    this.history.push({ action: a, tick, directions: ["left", "right", "up", "down"].filter((d) => this.held[d]) });
    if (this.history.length > 24) this.history.shift();
    this.prevAt[a] = this.edgeAt[a];
    this.edgeAt[a] = tick;
    this.pressedAt[a] = tick;
  }
};

// src/game/resources.ts
var RESOURCE_RULES = {
  meterMax: 200,
  ultimateCost: 100,
  transformationCost: 200,
  staminaMax: 120,
  regenDelay: 32,
  regenIdle: 0.48,
  regenMoving: 0.24,
  exhaustFrames: 120,
  exhaustRelease: 24,
  jumpCost: 5,
  dashCost: 7,
  blockCost: 3,
  activationFrames: 72,
  commitFrame: 36,
  transformationFrames: 600,
  energyMax: 100,
  energyStart: 40,
  energyCharge: 0.42,
  energyOnDamage: 0.22,
  energyCosts: { s1: 16, s2: 22, s3: 18 },
  batteryMax: 100,
  regenerationBloodMax: 3,
  onHit: { energy: 5, battery: 4, blood: 1 }
};
var freshResources = () => ({ stamina: RESOURCE_RULES.staminaMax, staminaDelay: 0, exhaustT: 0, energy: RESOURCE_RULES.energyStart, blood: 1, battery: 100, formT: 0, formStartup: 0, formElapsed: 0, formVariant: 0, aftermathT: 0, charging: false, formShield: 0, confusionT: 0, predictionCooldown: 0 });
var formPowerActive = (f) => f.formT > 0;
var form = (name, damage, speed, drain, help, extra = {}) => ({ name, duration: RESOURCE_RULES.transformationFrames, damage, speed, reach: 1, scale: 1, drain, aftermath: 120, cost: "200 ULT + f\xF4lego", help, ...extra, defense: 0 });
var FORMS = {
  rickzera: form("Cruz de Energia", 2, 2, 0.18, "Consome toda a energia. Atributos f\xEDsicos 2\xD7; cada acerto recupera energia, inclusive na forma. Ao terminar, especiais exigem nova carga.", { reach: 1.12, cost: "200 ULT + toda a energia" }),
  caetano: form("Karat\xEA Prime", 1.35, 1.2, 0.24, "Precis\xE3o, foco e press\xE3o laranja. Seus golpes atravessam a defesa durante a forma."),
  orango: form("Albino 00", 1.35, 1.08, 0.27, "Pelagem branca, levita\xE7\xE3o visual e pulsos ps\xEDquicos. Agarr\xF5es continuam exigindo aproxima\xE7\xE3o.", { reach: 1.15 }),
  tubarao: form("Benzinho, Fiquei Puto", 1.5, 0.9, 0.3, "Forma Megalodonte. Stomp e devorar de perto; depois retorna filhote e cresce em dois minutos.", { scale: 1.22, reach: 1.25, aftermath: 7200 }),
  bieu: form("Maldito BuggyBatman", 1.25, 1.15, 0.28, "Dom\xEDnio de ilus\xF5es: nuvens de tinta causam confus\xE3o curta. A forma ativa protege contra qualquer ataque."),
  nomad: form("Jogatina", 1, 1, 0.16, "Paga 10% do HP m\xE1ximo; sorteia for\xE7a, velocidade ou tamanho. O resultado aparece na tela.", { cost: "200 ULT + 10% HP m\xE1ximo" }),
  renngotti: form("Berserker", 2, 2, 0.28, "Atributos f\xEDsicos 2\xD7. Ap\xF3s o fim, for\xE7a/mobilidade caem pela metade por 15 segundos.", { aftermath: 900 }),
  aneninha: form("Raiane Rindo", 1.2, 1.2, 0.25, "Fuma\xE7a rosa amplia o controle de Osasco. Efeito de confus\xE3o curto, com prote\xE7\xE3o contra repeti\xE7\xE3o."),
  santox: form("Jax \u2014 Dom\xEDnio de Loucura", 1.35, 1.2, 0.3, "Coelho glitch, membros el\xE1sticos e dom\xEDnio inst\xE1vel. A esquiva mant\xE9m seu startup e cooldown.", { reach: 1.18, aftermath: 180 }),
  jao: form("Falso G\xEAnio", 1.2, 1.1, 0.24, "Antecipa\xE7\xE3o sinalizada: auxilia uma guarda em neutro a cada segundo. A forma ativa concede imunidade total a ataques.", { aftermath: 180 }),
  jane: form("EVA", 1.35, 1.1, 0.12, "Traje rob\xF3tico de 3 m: lasers nas m\xE3os, dash ampliado e bateria finita. Hurtbox tamb\xE9m cresce.", { scale: 2.65, reach: 1.2, cost: "200 ULT + bateria do rob\xF4" }),
  cristyan: form("Muayfimeu", 1.4, 1.15, 0.3, "Sequ\xEAncia dourada de Muay Thai. Combina golpes fortes com a prote\xE7\xE3o da forma ativa."),
  eneas: form("Quando Debate n\xE3o Resolve", 2, 1.05, 0.33, "Dr. Acreano rasga o palet\xF3 e revela as tatuagens do Brasil. Dobra a for\xE7a f\xEDsica, com alto desgaste."),
  patrick: form("Rei Tatu", 1.5, 0.9, 0.32, "Coura\xE7a vermelha concede imunidade a ataques; seus golpes atravessam a defesa.", { cost: "200 ULT + alto desgaste", aftermath: 180 }),
  gabrielzin: form("Gatito", 1.3, 1.1, 0.25, "Fantasia de gato bege: patas, for\xE7a e alcance ampliados. A melodia \xE9 sintetizada pelo jogo.", { reach: 1.2 }),
  ulisses: form("Regenera\xE7\xE3o Imediata", 1.15, 1.08, 0.22, "Luta com bra\xE7os e garras. Consome um estoque de sangue a cada 5 s para curar 100 HP. Sem estoque, deixa de curar; a forma continua por 10 s.", { cost: "200 ULT + sangue capturado" }),
  felipence: form("Sinfonia do Caos", 1.3, 1.08, 0.27, "Sobrecarga sonora laranja amplia o alcance. Ondas atravessam a defesa durante a forma ativa.", { reach: 1.18 }),
  hdsh: form("Overclock Anal\xEDtico", 1.2, 1.2, 0.25, "Predi\xE7\xE3o sinalizada ajuda a guarda em neutro, com intervalo. Exaust\xE3o mental ap\xF3s a forma.", { aftermath: 180 })
};
function formStats(f) {
  let damage = 1, speed = 1, defense = 1, reach = 1, scale = 1;
  if (f.formT > 0) {
    ({ damage, speed, defense, reach, scale } = FORMS[f.ch]);
    if (f.ch === "nomad") {
      if (f.formVariant === 0) damage = 2;
      else if (f.formVariant === 1) speed = 1.6;
      else {
        scale = 1.25;
        reach = 1.25;
        defense = 0.8;
      }
    }
  } else if (f.aftermathT > 0) {
    if (f.ch === "renngotti") {
      damage = 0.5;
      speed = 0.5;
      defense = 2;
    }
    if (f.ch === "tubarao") {
      const growth = 1 - Math.min(1, f.aftermathT / 7200);
      damage = 0.65 + 0.35 * growth;
      scale = 0.55 + 0.45 * growth;
      speed = 0.8 + 0.2 * growth;
    }
  }
  if (formPowerActive(f)) defense = 0;
  return { damage, speed, defense, reach, scale, invulnerable: formPowerActive(f), defenseBreak: formPowerActive(f) };
}
function staminaCost(m) {
  if (m.kind === "super") return 0;
  if (m.id === "bikeRush") return 0;
  if (m.kind === "special") return m.dmg === 0 ? 6 : m.grab ? 12 : 10;
  return m.rank === 1 ? 3 : m.rank === 2 ? 5 : 8;
}
function canTransform(f) {
  return !f.ko && f.formT === 0 && f.formStartup === 0 && f.aftermathT === 0 && f.exhaustT === 0 && f.stamina >= 30 && f.meter >= 200 && f.y === 0 && f.landLag === 0 && f.state === "ground" && (f.ch !== "rickzera" || f.energy >= 20) && (f.ch !== "ulisses" || f.blood >= 1) && (f.ch !== "jane" || f.battery >= 25) && (f.ch !== "nomad" || f.hp > f.maxHp * 0.1);
}
function gainEnergy(f, amount) {
  if (f.ch === "rickzera" && f.formT === 0 && f.formStartup === 0) f.energy = Math.min(100, f.energy + Math.max(0, amount));
}
function recoverAttackResource(f) {
  const key = f.ch === "rickzera" ? "energy" : f.ch === "jane" ? "battery" : f.ch === "ulisses" ? "blood" : null;
  if (!key) return null;
  const max = key === "blood" ? RESOURCE_RULES.regenerationBloodMax : 100, before = f[key];
  f[key] = Math.min(max, before + RESOURCE_RULES.onHit[key]);
  const amount = f[key] - before;
  return amount > 0 ? { key, amount, label: key === "energy" ? "ENERGIA" : key === "battery" ? "BATERIA" : "SANGUE" } : null;
}
function payStamina(f, cost) {
  f.stamina = Math.max(0, f.stamina - cost);
  f.staminaDelay = RESOURCE_RULES.regenDelay;
  if (f.stamina === 0) f.exhaustT = Math.max(f.exhaustT, RESOURCE_RULES.exhaustFrames);
}

// src/game/training/ai.ts
var TRAINING_AI_PROFILES = [
  { reaction: 30, jitter: 8, observe: 8, think: 18, mistake: 0.3, block: 0.22, special: 0.12, combo: 2, ultimate: 0.08, adapt: 0 },
  { reaction: 21, jitter: 7, observe: 6, think: 14, mistake: 0.2, block: 0.42, special: 0.26, combo: 3, ultimate: 0.2, adapt: 0.05 },
  { reaction: 17, jitter: 6, observe: 6, think: 12, mistake: 0.14, block: 0.55, special: 0.42, combo: 3, ultimate: 0.35, adapt: 0.15 },
  { reaction: 14, jitter: 5, observe: 4, think: 10, mistake: 0.1, block: 0.66, special: 0.56, combo: 4, ultimate: 0.48, adapt: 0.3 },
  { reaction: 12, jitter: 4, observe: 4, think: 8, mistake: 0.07, block: 0.75, special: 0.66, combo: 5, ultimate: 0.6, adapt: 0.45 },
  { reaction: 11, jitter: 3, observe: 3, think: 7, mistake: 0.045, block: 0.81, special: 0.74, combo: 6, ultimate: 0.69, adapt: 0.58 },
  { reaction: 10, jitter: 2, observe: 2, think: 6, mistake: 0.025, block: 0.86, special: 0.82, combo: 6, ultimate: 0.77, adapt: 0.7 }
];
var CombatMemory = class {
  events = [];
  tendencies = { projectile: 0, jump: 0, guard: 0, special: 0, exhaust: 0 };
  seen = /* @__PURE__ */ new Set();
  observe(s, now2, adapt) {
    const kinds = [];
    if (s.move?.id.startsWith("s")) kinds.push("special");
    if (s.projectiles.length) kinds.push("projectile");
    if (s.y < -30) kinds.push("jump");
    if (s.guard) kinds.push("guard");
    if (s.staminaLow) kinds.push("exhaust");
    for (const kind of kinds) {
      const key = `${kind}:${kind === "special" ? s.serial : Math.floor(s.tick / 45)}`;
      if (this.seen.has(key)) continue;
      this.seen.add(key);
      this.events.push({ tick: now2, kind, key });
    }
    this.events = this.events.filter((e) => e.tick > now2 - 600).slice(-96);
    this.seen = new Set(this.events.map((e) => e.key));
    if (now2 % 30 === 0) for (const kind of Object.keys(this.tendencies)) {
      const desired = Math.min(1, this.events.filter((e) => e.kind === kind).length / 6) * adapt;
      this.tendencies[kind] += Math.max(-0.04, Math.min(0.04, desired - this.tendencies[kind]));
    }
  }
};
var TrainingBrain = class {
  constructor(tier, style) {
    this.tier = tier;
    this.style = style;
    this.currentStyle = style;
  }
  tier;
  style;
  memory = new CombatMemory();
  perception = [];
  lastObservation = null;
  nextThink = 0;
  guardUntil = 0;
  low = false;
  walk = 0;
  plan = [];
  continued = -1;
  taps = {};
  guardSerial = -1;
  bikeRelease = 0;
  currentStyle;
  dash = null;
  tap(g, f, a) {
    f.pad.set(a, true, g.tick);
    if (f.pad.pressedAt[a] !== g.tick) f.pad.tap(a, g.tick);
    this.taps[a] = g.tick + 2;
  }
  act(g, f) {
    const P = TRAINING_AI_PROFILES[this.tier], o = g.opp(f), now2 = g.tick;
    for (const a of ACTIONS) if ((this.taps[a] ?? Infinity) <= now2) {
      f.pad.set(a, false, now2);
      delete this.taps[a];
    }
    if (f.ch === "jane" && f.move?.id === "s2") f.pad.set("s2", now2 < this.bikeRelease, now2);
    if (now2 % P.observe === 0 || !this.perception.length) {
      this.perception.push({ tick: now2, x: o.x, y: o.y, state: o.state, serial: o.serial, guard: o.guard, form: o.formT > 0, staminaLow: o.exhaustT > 0, move: o.move ? { id: o.move.id, startup: o.move.startup, active: o.move.active, recovery: o.move.recovery, whiff: o.move.whiff, t: o.moveT, low: o.move.level === "low", reach: o.move.hb[1] } : null, projectiles: g.projectiles.filter((p) => p.owner !== f.idx && p.life > 0 && p.move.dmg > 0).map((p) => ({ x: p.x, y: p.y, vx: p.vx, radius: p.radius ?? 18, low: p.move.level === "low" })) });
      this.perception = this.perception.filter((s) => s.tick > now2 - 64).slice(-34);
    }
    const latency = P.reaction + Math.floor(g.random() * (P.jitter + 1)), seen = [...this.perception].reverse().find((s) => s.tick <= now2 - latency);
    if (!seen) {
      for (const a of ["left", "right", "block", "down"]) f.pad.set(a, false, now2);
      return;
    }
    this.lastObservation = seen;
    this.memory.observe(seen, now2, P.adapt * (this.style === "adaptive" ? 1 : 0.65));
    const distance = Math.abs(seen.x - f.x), dir = seen.x >= f.x ? 1 : -1;
    const free = f.y === 0 && f.landLag === 0 && (f.state === "ground" || f.state === "dash" && f.stateT >= 4) && !f.ko;
    const canGuard = ["ground", "block", "hit", "getup", "dash"].includes(f.state) && !f.ko;
    const rnd2 = () => g.random();
    if (this.style === "unpredictable" && now2 % 210 === 0) this.currentStyle = ["aggressive", "defensive", "technical"][Math.floor(rnd2() * 3)];
    const aggressive = this.currentStyle === "aggressive", defensive = this.currentStyle === "defensive", technical = this.currentStyle === "technical";
    const tendency = this.memory.tendencies;
    if (f.state === "attack") {
      if (f.connected && this.plan.length && f.serial !== this.continued) {
        this.continued = f.serial;
        this.tap(g, f, this.plan.shift());
      }
      if (f.move && f.moveT > f.move.startup + f.move.active && !f.connected) this.plan = [];
    } else if (!free) this.plan = [];
    if (canGuard && seen.move && seen.state === "attack" && seen.serial !== this.guardSerial) {
      this.guardSerial = seen.serial;
      const remaining = seen.move.startup + seen.move.active - seen.move.t - (now2 - seen.tick);
      if (remaining > 0 && distance < seen.move.reach + f.def.pushW + 25 && rnd2() < Math.min(0.93, P.block * (defensive ? 1.1 : 0.95))) {
        this.guardUntil = now2 + Math.max(6, remaining + 8);
        this.low = seen.move.low;
      }
    }
    const threat = seen.projectiles.find((p) => {
      const x = p.x + p.vx * (now2 - seen.tick), dx = f.x - x;
      return Math.abs(dx) < 240 && (p.vx === 0 || dx * p.vx > 0);
    });
    if (threat && canGuard && now2 >= this.nextThink && rnd2() < P.block + tendency.projectile * 0.15) {
      this.guardUntil = now2 + 18;
      this.low = threat.low;
    }
    const conserve = f.stamina < 28 || f.guardMeter < 24 || f.exhaustT > 0;
    if (f.guardMeter < 18) this.guardUntil = 0;
    let block = canGuard && now2 < this.guardUntil;
    if (f.state === "block" && f.blockstun > 0) block = true;
    if (free && now2 >= this.nextThink && !block) {
      this.nextThink = now2 + P.think + Math.floor(rnd2() * P.think * 0.8);
      this.plan = [];
      const r = rnd2();
      if (r < P.mistake) {
        this.walk = rnd2() < 0.55 ? 0 : rnd2() < 0.5 ? 1 : -1;
      } else if (conserve || seen.form) {
        this.walk = -1;
        if (!seen.form && rnd2() < P.block * 0.5) this.guardUntil = now2 + P.think;
      } else if (f.manualFacing && f.facing !== dir) this.tap(g, f, "turn");
      else if (!f.npc && canTransform(f) && distance > 180 && rnd2() < P.special * 0.18) {
        this.tap(g, f, "transform");
        this.walk = 0;
      } else if (f.ch === "rickzera" && f.formT === 0 && f.formStartup === 0 && f.energy < 25 && distance > 260) {
        f.pad.set("charge", true, now2);
        this.walk = 0;
      } else {
        f.pad.set("charge", false, now2);
        const punish = seen.move && seen.state === "attack" && seen.move.t >= seen.move.startup + seen.move.active && seen.move.startup + seen.move.active + seen.move.recovery + seen.move.whiff - seen.move.t - (now2 - seen.tick) > f.def.moves.headbutt.startup + 3;
        const melee = Math.max(75, Math.min(140, f.def.moves.pL.hb[1] + o.def.pushW - 8));
        if (punish && distance < f.def.moves.headbutt.hb[1] + o.def.pushW - 4 && rnd2() < 0.4 + P.special * 0.6) {
          this.tap(g, f, "headbutt");
          this.walk = 0;
        } else if (seen.guard && distance < 76 && rnd2() < 0.2 + tendency.guard * 0.65) {
          this.tap(g, f, "grab");
          this.walk = 0;
        } else if (seen.y < -35 && distance < 150 && rnd2() < P.special + tendency.jump * 0.2) {
          this.tap(g, f, seen.y > -125 ? "headbutt" : "up");
          this.walk = 0;
        } else if (!f.npc && f.meter >= 100 && distance < 300 && (seen.state === "hit" || seen.state === "down" || seen.state === "cine" || punish) && rnd2() < P.ultimate) {
          this.tap(g, f, "super");
          this.walk = 0;
        } else if (distance < melee && rnd2() < (aggressive ? 0.9 : defensive ? 0.5 : 0.7)) {
          const route = COMBO_ROUTES.find((r2) => r2.ch === f.ch && r2.id.endsWith(P.combo >= 5 ? "-signature" : "-three"));
          this.plan = route.steps.map((s) => s.input[0]).slice(0, P.combo);
          this.continued = -1;
          this.tap(g, f, this.plan.shift());
          this.walk = 0;
        } else if (distance < 165 && rnd2() < P.special * 0.5) {
          const choices = f.ch === "jane" ? ["s3", "s2"] : ["s1", "s2", "s3"];
          const a = choices[Math.floor(rnd2() * choices.length)];
          if (a === "s2" && f.ch === "jane") this.bikeRelease = now2 + 40 + Math.floor(rnd2() * 85);
          this.tap(g, f, a);
          this.walk = 0;
        } else if (distance > 180 && f.rangedCooldown === 0 && !f.npc && RANGED_MOVES[f.ch].length && rnd2() < P.special * (defensive ? 1 : 0.7)) {
          const a = RANGED_MOVES[f.ch][Math.floor(rnd2() * RANGED_MOVES[f.ch].length)];
          this.tap(g, f, a);
          this.walk = 0;
        } else {
          const preferred = melee * (defensive ? 1.7 : technical ? 1.2 : 0.9);
          this.walk = distance > preferred ? 1 : distance < preferred - 30 ? -1 : 0;
          if (distance > 360 && this.walk === 1 && this.tier >= 2 && f.stamina > 55 && rnd2() < 0.14) {
            this.dash = { at: now2, dir };
          }
          if (threat && this.tier >= 3 && rnd2() < 0.16 + tendency.projectile * 0.15) this.tap(g, f, "up");
        }
      }
    }
    if (f.state === "jump" && !f.airAttacked && Math.abs(seen.y - f.y) < 120 && distance < 140 && rnd2() < 0.05 + this.tier * 0.01) this.tap(g, f, "k");
    let direction = free && !block ? this.walk * dir : 0;
    if (this.dash) {
      const age = now2 - this.dash.at;
      if (age > 6 || !free) this.dash = null;
      else direction = age === 0 || age === 3 || age === 4 || age === 5 ? 0 : this.dash.dir;
    }
    f.pad.set("left", direction < 0, now2);
    f.pad.set("right", direction > 0, now2);
    f.pad.set("block", block, now2);
    f.pad.set("down", block && this.low, now2);
  }
};

// src/game/training/runtime.ts
var TrainingSession = class {
  constructor(game, spec) {
    this.game = game;
    this.spec = spec;
    if (spec.version !== TRAINING_VERSION) throw new Error("Atualize o jogo para abrir este treino.");
    this.def = spec.activityId === "lab" ? null : activity(spec.activityId) ?? null;
    if (spec.activityId !== "lab" && !this.def) throw new Error("Atividade de treinamento inv\xE1lida.");
    this.lab = { ...DEFAULT_LAB, ...spec.lab };
    this.brain = new TrainingBrain(this.def?.tier ?? this.lab.tier, spec.style ?? this.def?.style ?? "adaptive");
  }
  game;
  spec;
  def;
  metrics = freshMetrics();
  transcript = [];
  result = null;
  notice = "Observe o alcance e confirme seus ataques.";
  revision = 0;
  brain;
  lab;
  recording = [];
  recordTicks = 0;
  playbackTick = 0;
  playbackIndex = 0;
  playbackLeft = 0;
  specials = /* @__PURE__ */ new Set();
  connected = /* @__PURE__ */ new Set();
  superSerials = /* @__PURE__ */ new Set();
  startHp = 0;
  beforeX = 0;
  beforeStamina = 100;
  exhausted = false;
  wave = 0;
  scriptLast = -1e3;
  formActive = false;
  get finite() {
    return !!this.def?.finite;
  }
  get isLab() {
    return this.spec.activityId === "lab";
  }
  setup() {
    const g = this.game, a = g.f[0], b = g.f[1], d = this.def;
    g.winsNeeded = 1;
    g.phase = "fight";
    g.phaseT = 0;
    g.ann = null;
    const distance = this.isLab ? this.lab.distance : d?.distance ?? 180;
    a.x = 800 - distance / 2;
    b.x = 800 + distance / 2;
    a.meter = d?.meter ?? (this.isLab ? this.lab.meter : 0);
    b.meter = 0;
    if (d?.health) a.hp = a.maxHp * d.health;
    if (this.isLab) {
      a.hp = a.maxHp * this.lab.hp / 100;
      b.hp = b.maxHp * this.lab.hp / 100;
      for (const f of g.f) {
        f.meter = f.npc ? 0 : this.lab.meter;
        f.energy = f.battery = this.lab.resource;
        f.blood = Math.floor(this.lab.resource * 3 / 100);
      }
      if (this.lab.side === 1) {
        const x = a.x;
        a.x = b.x;
        b.x = x;
        a.facing = -1;
        b.facing = 1;
      }
    }
    this.startHp = a.hp;
    g.train.dummy = this.isLab && this.lab.dummy === "p2" ? 3 : 0;
    b.cpu = this.finite || this.isLab && ["aggressive", "defensive", "adaptive"].includes(this.lab.dummy);
    if (d?.routeId) {
      g.startComboLesson(d.routeId);
      a.meter = 0;
    }
    this.beforeX = a.x;
    this.beforeStamina = a.stamina;
    this.notice = d?.hint ?? "Laborat\xF3rio livre: as altera\xE7\xF5es n\xE3o concedem XP de conta.";
  }
  beforeTick() {
    this.beforeX = this.game.f[0].x;
    this.beforeStamina = this.game.f[0].stamina;
  }
  recordInputs() {
    if (this.result) return;
    const f = this.game.f[0], held = ACTIONS.reduce((n, a, i) => n + (f.pad.held[a] ? 1 << i : 0), 0), pressed = ACTIONS.reduce((n, a, i) => n + (f.pad.pressedAt[a] === this.game.tick ? 1 << i : 0), 0);
    if (!this.isLab) this.append(this.transcript, held, pressed);
    else if (this.lab.dummy === "record" && this.recordTicks < 900) {
      this.append(this.recording, held, pressed);
      this.recordTicks++;
      const b = this.game.f[1];
      ACTIONS.forEach((a, i) => {
        b.pad.set(a, !!(held & 1 << i), this.game.tick);
        if (pressed & 1 << i && b.pad.pressedAt[a] !== this.game.tick) b.pad.tap(a, this.game.tick);
      });
      f.pad.reset();
    }
  }
  append(trace, held, pressed) {
    const previous = trace[trace.length - 1];
    if (previous && previous[1] === held && previous[2] === 0 && pressed === 0) previous[0]++;
    else trace.push([1, held, pressed]);
  }
  metric(metric, amount, token = "") {
    if (this.result) return;
    const aliases = { jump: "jump", dash: "dash", turn: "turn", crouch: "crouch", transform: "forms", stamina: "staminaRecovered", energy: "energyCharged", range: "cooldowns", resource: "resourceRecovered", grabs: "grabs" };
    if (metric === "special") {
      if (token) this.specials.add(token);
      this.metrics.uniqueSpecials = this.specials.size;
    } else if (aliases[metric]) this.metrics[aliases[metric]] += Math.max(0, amount);
  }
  combat(e) {
    if (this.result) return;
    const m = this.metrics;
    if (e.type === "super") {
      if (e.actor === 0) {
        m.attempts++;
        m.specialStarts++;
      } else m.enemyStarts++;
    }
    if (e.type === "start") {
      if (e.actor === 0) {
        const move = this.game.f[0].move;
        if (move?.kind !== "super") m.attempts++;
        if (move?.kind === "special") m.specialStarts++;
        if (e.move === "super") m.specialStarts++;
      } else if (this.game.f[e.actor].move?.kind !== "super") m.enemyStarts++;
    }
    if (e.type === "chip") {
      if (e.actor === 0) m.damage += e.amount;
      else m.damageTaken += e.amount;
    }
    if (e.type === "hit" && e.actor === 0) m.bestCombo = Math.max(m.bestCombo, e.hits);
    if (e.type === "damage") {
      if (e.actor === 0) {
        m.damage += e.amount;
        m.hits++;
        m.bestCombo = Math.max(m.bestCombo, e.hits);
        const key = e.actor + ":" + e.serial;
        if (!this.connected.has(key)) {
          this.connected.add(key);
          m.connected++;
        }
        if (e.move === "super") {
          if (!this.superSerials.has(e.serial)) {
            m.superHits++;
            this.superSerials.add(e.serial);
          }
          if (e.hits >= 5) m.comboUlt = 1;
        } else {
          const move = this.game.f[0].move;
          if (move?.kind === "normal") m.normalHits++;
          if (move?.kind === "special" || e.move.startsWith("s")) m.specialHits++;
        }
        if (e.low) m.lowHits++;
        if (e.air) m.airHits++;
        if (e.move === "headbutt") m.headHits++;
        if (e.targetAir && !e.air) m.antiAir++;
        if (e.combo === "punish" && e.hits <= 1) m.punishes++;
        if (this.game.f[0].formT > 0) m.formHits++;
      } else m.damageTaken += e.amount;
    }
    if (e.type === "block") {
      if (e.target === 0) {
        m.blocks++;
        if (e.low) m.lowBlocks++;
        if (e.perfect) m.perfects++;
        this.notice = e.perfect ? "Defesa no instante certo. Repita o mesmo ritmo." : "Voc\xEA bloqueou. Para a perfeita, solte Defesa e aperte mais perto do contato.";
      }
    }
    if (e.type === "guardBreak" && e.actor === 0) m.guardBreaks++;
    if (e.type === "whiff" && e.actor === 0) {
      m.whiffs++;
      this.notice = "O golpe ficou fora do alcance. Aproxime-se antes de confirmar.";
    }
    if (e.type === "damage" && e.target === 0) this.notice = "Voc\xEA recebeu o golpe. Observe a prepara\xE7\xE3o e preserve a guarda antes de responder.";
  }
  controlOpponent() {
    const g = this.game, b = g.f[1];
    if (this.result) {
      b.pad.reset();
      return;
    }
    if (this.isLab) {
      const mode = this.lab.dummy;
      if (mode === "record" || mode === "p2") return;
      if (mode === "playback") {
        this.playRecording();
        return;
      }
      if (["aggressive", "defensive", "adaptive"].includes(mode)) {
        this.brain.act(g, b);
        return;
      }
      if (mode === "script") {
        this.script(this.lab.script);
        return;
      }
      b.pad.reset();
      if (this.lab.guard !== "normal") {
        b.pad.set("block", true, g.tick);
        b.pad.set("down", this.lab.guard === "low", g.tick);
      }
      return;
    }
    if (this.def?.script) {
      this.script(this.def.script);
      return;
    }
    if (this.finite) {
      this.brain.act(g, b);
      return;
    }
    b.pad.reset();
    if (this.game.coach && this.game.coach.progress > 0) b.pad.set("block", true, g.tick);
    if (this.def?.goals.some((t) => t.metric === "uniqueSpecials") && ["jao", "hdsh", "santox"].includes(g.f[0].ch)) {
      b.pad.set("left", Math.abs(b.x - g.f[0].x) > 120, g.tick);
      if (g.tick - this.scriptLast > 105 && b.state === "ground") {
        b.pad.set("p", true, g.tick);
        this.scriptLast = g.tick;
      }
    }
  }
  script(kind) {
    const g = this.game, b = g.f[1], a = g.f[0];
    b.pad.reset();
    if (kind === "guard") {
      b.pad.set("block", true, g.tick);
      b.pad.set("down", a.move?.level === "low", g.tick);
      return;
    }
    if (kind === "air") {
      if (g.tick - this.scriptLast >= 85 && b.state === "ground") {
        b.pad.set("up", true, g.tick);
        this.scriptLast = g.tick;
      }
      return;
    }
    if (g.tick - this.scriptLast < 110 || b.state !== "ground" || b.landLag > 0) return;
    const distance = Math.abs(a.x - b.x), desired = kind === "whiff" ? Math.max(155, b.def.moves.headbutt.hb[1] + a.def.pushW + 20) : Math.min(92, b.def.moves.pL.hb[1] + a.def.pushW - 5);
    if (kind !== "whiff" && distance > desired + 8) {
      b.pad.set(a.x > b.x ? "right" : "left", true, g.tick);
      return;
    }
    if (kind === "whiff" && distance < desired - 10) {
      b.pad.set(a.x > b.x ? "left" : "right", true, g.tick);
      return;
    }
    this.scriptLast = g.tick;
    if (kind === "low" || kind === "mixed" && Math.floor(g.tick / 110) % 2 === 0) b.pad.set("down", true, g.tick);
    const key = kind === "whiff" ? "headbutt" : kind === "projectile" ? "s2" : kind === "low" ? "k" : "p";
    b.pad.set(key, true, g.tick);
    b.pad.tap(key, g.tick);
  }
  afterTick() {
    if (this.result) return;
    const g = this.game, a = g.f[0], b = g.f[1], m = this.metrics;
    m.activeTicks++;
    if ((a.walking !== 0 || a.state === "dash") && a.state !== "hit") m.walk += Math.abs(a.x - this.beforeX);
    m.minHp = Math.min(m.minHp, a.hp / a.maxHp);
    m.staminaUsed += Math.max(0, this.beforeStamina - a.stamina);
    if (a.exhaustT > 0 && !this.exhausted) m.exhausts++;
    this.exhausted = a.exhaustT > 0;
    if (a.formStartup > 0 && !this.formActive) m.formStarts++;
    this.formActive = a.formStartup > 0 || a.formT > 0;
    if (g.coach?.status === "success") m.route = 1;
    if (this.isLab) {
      for (const f of g.f) {
        if (this.lab.stamina) {
          f.stamina = 100;
          f.exhaustT = 0;
        }
        f.meter = f.npc ? 0 : this.lab.meter;
      }
      if (this.lab.dummy === "record" && this.recordTicks >= 900) {
        this.lab.dummy = "idle";
        b.pad.reset();
        this.notice = "Grava\xE7\xE3o conclu\xEDda. Abra Configurar e selecione a reprodu\xE7\xE3o.";
      }
      if (g.tick % 15 === 0) this.changed();
      return;
    }
    const d = this.def;
    if (a.hp <= 0 || a.ko || b.wins >= g.winsNeeded) {
      this.finish(false, "O advers\xE1rio venceu. O resultado foi registrado para orientar seu pr\xF3ximo treino.");
      return;
    }
    if (this.finite && (b.hp <= 0 || b.ko || g.winner === 0 || a.wins >= g.winsNeeded)) {
      m.wins++;
      if (d.goals.some((t) => t.metric === "wins" && m.wins < t.target)) {
        const hp = Math.min(a.maxHp, a.hp + a.maxHp * 0.15), resources = { stamina: a.stamina, meter: a.meter, energy: a.energy, battery: a.battery, blood: a.blood };
        this.wave++;
        g.replaceTrainingOpponent(CHAR_IDS[(this.wave * 5 + 3) % 18]);
        a.hp = hp;
        Object.assign(a, resources);
        a.x = 630;
        g.f[1].x = 970;
        this.brain = new TrainingBrain(d.tier, d.style);
        this.notice = "Pr\xF3ximo advers\xE1rio. Voc\xEA recuperou 15% de vida; os demais recursos foram preservados.";
      } else if (!d.goals.every((goal) => m[goal.metric] >= goal.target)) {
        this.finish(false, "Voc\xEA venceu o advers\xE1rio, mas ainda faltou demonstrar o objetivo adicional do exerc\xEDcio.");
        return;
      }
    }
    const c = d.constraints;
    if (c?.noSpecial && m.specialStarts || c?.noForm && m.formStarts || c?.noExhaust && m.exhausts || c?.noDamage && m.damageTaken > 0 || c?.maxDamage && m.damageTaken > c.maxDamage) {
      this.finish(false, "Uma restri\xE7\xE3o do exerc\xEDcio foi ultrapassada. Veja a an\xE1lise para ajustar a pr\xF3xima tentativa.");
      return;
    }
    if (d.goals.every((goal) => m[goal.metric] >= goal.target)) {
      this.finish(true, "Objetivo demonstrado com a\xE7\xF5es reais do combate.");
      return;
    }
    if (m.activeTicks >= d.maxTicks) {
      this.finish(false, "O tempo ativo da tentativa terminou. Voc\xEA pode tentar novamente.");
      return;
    }
    if (g.tick % 15 === 0) this.changed();
  }
  changed() {
    this.revision++;
    this.game.onEvent({ type: "training" });
  }
  finish(success, reason) {
    const d = this.def, evaluation = evaluate(d, this.metrics, success);
    this.result = { id: this.spec.verifiedSession ?? `local-${this.spec.seed}-${d.id}`, activityId: d.id, character: this.game.f[0].ch, opponent: d.opponent, success, reason, ...evaluation, metrics: { ...this.metrics }, activeSeconds: this.metrics.activeTicks / 60, at: Date.now(), xp: 0, masteryGained: 0, promoted: false, verified: false };
    this.game.togglePause(true);
    this.changed();
    this.game.onEvent({ type: "trainingResult", result: this.result });
  }
  configureLab(next) {
    if (!this.isLab) return false;
    this.lab = { ...next };
    this.game.train.dummy = next.dummy === "p2" ? 3 : 0;
    this.game.resetPositions();
    Object.assign(this.metrics, freshMetrics());
    this.brain = new TrainingBrain(next.tier, ["aggressive", "defensive", "adaptive"].includes(next.dummy) ? next.dummy : "technical");
    this.setup();
    this.playbackIndex = this.playbackLeft = this.playbackTick = 0;
    this.changed();
    return true;
  }
  clearRecording() {
    this.recording = [];
    this.recordTicks = 0;
    this.playbackIndex = this.playbackLeft = this.playbackTick = 0;
  }
  playRecording() {
    const g = this.game, b = g.f[1];
    if (!this.recording.length) {
      b.pad.reset();
      return;
    }
    if (this.playbackLeft === 0) {
      if (this.playbackIndex >= this.recording.length) {
        this.playbackIndex = 0;
        b.pad.reset();
      }
      this.playbackLeft = this.recording[this.playbackIndex][0];
    }
    const row = this.recording[this.playbackIndex], first = this.playbackLeft === row[0];
    ACTIONS.forEach((a, i) => {
      b.pad.set(a, !!(row[1] & 1 << i), g.tick);
      if (first && row[2] & 1 << i && b.pad.pressedAt[a] !== g.tick) b.pad.tap(a, g.tick);
    });
    this.playbackTick++;
    if (--this.playbackLeft === 0) this.playbackIndex++;
  }
  get initialHp() {
    return this.startHp;
  }
  get actor() {
    return this.spec.p1;
  }
};

// src/game/audio.ts
var audio = new Proxy({ ctx: null }, { get(target, key) {
  return key in target ? target[key] : (() => {
  });
} });

// src/game/transformation-audio.ts
function transformationAudio(ch) {
  audio.tone(ch === "patrick" || ch === "tubarao" ? 95 : 165, 0.5, "sawtooth", 0.13, 820);
  audio.say(FORMS[ch].name, 1.1, 1.1);
  if (ch === "gabrielzin") {
    for (const [i, n] of [523.25, 659.25, 783.99, 659.25, 587.33, 523.25].entries()) audio.tone(n, 0.13, "triangle", 0.11, n, i * 0.15);
    audio.say("Miau! Miau!", 1.3, 1.4);
  } else if (ch === "felipence") for (const [i, n] of [110, 164.81, 220].entries()) audio.tone(n, 0.5, "sawtooth", 0.08, n, i * 0.08);
}

// src/game/woc-choreography.ts
var beats = (frames, damages, poses, caption) => frames.map((frame, i) => ({ frame, damage: damages[i], pose: poses[i % poses.length], caption: i === frames.length - 1 ? caption : "" }));
var WOC_ULTIMATES = {
  caetano: { duration: 180, beats: beats([30, 48, 66, 84, 102, 132], [30, 35, 35, 40, 50, 110], ["pL_a", "pM_a", "kM_a", "dedo_a", "pH_a", "kH_a"], "KARATEKA!") },
  rickzera: { duration: 180, beats: beats([30, 48, 66, 84, 102, 132], [28, 32, 36, 40, 44, 90], ["pL_a", "kL_a", "pM_a", "kM_a", "pH_a", "kH_a"], "COMBO WISE!") },
  bieu: { duration: 180, beats: beats([42, 63, 84, 105, 132], [35, 35, 35, 35, 130], ["pL_a", "pM_a", "kM_a", "pH_a"], "CAP\xC3O REDONDO!") },
  aneninha: { duration: 180, beats: beats([42, 63, 84, 105, 132], [35, 35, 35, 35, 130], ["pL_a", "kM_a", "pM_a", "pH_a"], "OSASCO!") },
  patrick: { duration: 180, beats: beats([45, 78, 132], [90, 70, 140], ["w1_a", "w2_a", "w3_a"], "COLIS\xC3O INVENC\xCDVEL!") },
  gabrielzin: { duration: 180, beats: beats([50, 90, 132], [60, 80, 130], ["w1_a", "w2_a", "win"], "KAWAI!") },
  ulisses: { duration: 180, beats: beats([38, 56, 74, 92, 132], [40, 40, 40, 40, 120], ["w1_a", "pH_a", "kH_a"], "RAKUYO!") },
  felipence: { duration: 180, beats: beats([50, 84, 132], [70, 80, 125], ["w1_a", "w3_a", "w2_a"], "MY IMMORTAL!") },
  hdsh: { duration: 180, beats: beats([48, 90, 132], [50, 50, 100], ["w1_a", "w2_a", "w3_a"], "FULL BOX 200!") }
};
function ultimatePose(ch, frame) {
  const track = WOC_ULTIMATES[ch];
  return track?.beats.filter((b) => b.frame <= frame).at(-1)?.pose ?? "taunt";
}

// src/game/presentation.ts
var FIGHTER_STYLE = {
  patrick: { name: "COURA\xC7A E CONTRA-ATAQUE", help: "Escudo tem armadura s\xF3 na janela ativa. Investida e Punho cobram prepara\xE7\xE3o; agarr\xF5es vencem a prote\xE7\xE3o.", victory: "O REI TATU SEGUE EM P\xC9" },
  gabrielzin: { name: "CHARME E CAPTURA", help: "Proj\xE9teis rosas criam espa\xE7o para o Abra\xE7o. Captura exige curta dist\xE2ncia e recupera\xE7\xE3o do rival.", victory: "O CHARME TOMOU A ARENA" },
  ulisses: { name: "SANGUE E ALCANCE", help: "Ataque com a katana nos normais, capture sangue com Presas e guarde estoques para a regenera\xE7\xE3o.", victory: "A NOITE PERTENCE AO NEFASTO" },
  felipence: { name: "PRESS\xC3O SONORA", help: "Tr\xEAs normais confirmados carregam Resson\xE2ncia. Riff ou o final de Cad\xEAncia do Caos libera a explos\xE3o sonora; receber um golpe perde a carga.", victory: "O \xDALTIMO ACORDE \xC9 DELE" },
  hdsh: { name: "AN\xC1LISE E TERRIT\xD3RIO", help: "Controle o ch\xE3o com Go, intercepte com setas e anuncie o airdrop. Salto e acertos desfazem sua zona.", victory: "A AN\xC1LISE FECHOU O BOX" },
  caetano: { name: "T\xC9CNICO", help: "Defenda no \xFAltimo instante para carregar a Precis\xE3o. Ela fortalece o pr\xF3ximo Dedilho. Confirme Dedilho em Chute para continuar o combo.", victory: "A T\xC9CNICA VENCEU A TEORIA" },
  orango: { name: "PRESS\xC3O", help: "Acertos seguidos acumulam at\xE9 3 de \xCDmpeto: mais dano e avan\xE7o. Ser atingido ou recuar por muito tempo encerra a press\xE3o.", victory: "A SELVA TEM UM CAMPE\xC3O" },
  renngotti: { name: "CONTROLE DE ALCANCE", help: "Microfones que n\xE3o acertam viram armadilhas no ch\xE3o. Use Grito para ampliar a resson\xE2ncia dessas zonas.", victory: "O MICROFONE FICOU COM ELE" },
  aneninha: { name: "IMPROVISO", help: "Baixo + ESP 1 troca o soco por uma rasteira. Frente + ESP 2 pinta atr\xE1s do rival pr\xF3ximo. Varie os lados e a altura dos ataques.", victory: "OSASCO EM RITMO DE FESTA" },
  tubarao: { name: "AGARR\xD5ES", help: "Mordida avan\xE7a, Beijo pressiona de perto e Engole pune a guarda. A ULT termina com uma rabada de longa dist\xE2ncia.", victory: "FISCALIZA\xC7\xC3O CONCLU\xCDDA" },
  rickzera: { name: "MOBILIDADE", help: "Carregue energia em neutro ou ao receber dano. Converta em orbes, punho projetado e salto elevado.", victory: "O PIX DA VIT\xD3RIA CAIU" },
  bieu: { name: "ARMADILHAS", help: "Misture o Rato rasteiro, a Picha\xE7\xE3o e o avan\xE7o da Chave de Fenda.", victory: "PREST\xCDGIO NA ARENA" },
  nomad: { name: "PROJ\xC9TEIS", help: "Alterne Burger C\xF3smico, Soco Gigante e Boomerang; respeite o cooldown de dist\xE2ncia.", victory: "O LOBBY TEM NOVO DONO" },
  santox: { name: "ALCANCE E ESQUIVA", help: "Soco el\xE1stico domina a m\xE9dia dist\xE2ncia. Chute do Coelho \xE9 alto; Quarta Parede evita golpes por 0,3 s, com prepara\xE7\xE3o e recarga de 8 s.", victory: "O ROTEIRO MUDOU DE DONO" },
  jao: { name: "CONTROLE E C\xC1LCULO", help: "O tabuleiro reduz o movimento no ch\xE3o por at\xE9 3 s. Um por vez: pular ou acertar Jao rompe o controle. Alterne f\xF3rmulas e bola.", victory: "XEQUE-MATE NA ARENA" },
  jane: { name: "MOBILIDADE E GADGETS", help: "Segure ESP 2 para manter a moto. Solte antes de 5 s: ultrapassar derruba a moto e deixa Jane tonta por 1 s. Recarga de 3 s; baixos interrompem seu deslize.", victory: "DEPLOY CONCLU\xCDDO SEM REUNI\xC3O" },
  cristyan: { name: "MUAY THAI E ESPA\xC7O", help: "Teep cria dist\xE2ncia; Soco Poderoso arremessa o rival, mas prepara e recupera devagar. Pirueta acerta uma vez e pode ser punida.", victory: "A REDE N\xC3O AGUENTOU O PESO" },
  eneas: { name: "CI\xCANCIA DE M\xC9DIO ALCANCE", help: "Voz empurra, ECG pressiona e 5 \u2192 6 lan\xE7a e derruba. Os tr\xEAs especiais compartilham o limite de dist\xE2ncia. Sem invulnerabilidade.", victory: "MEU NOME \xC9 CAMPE\xC3O!" }
};
var lines = {
  caetano: { orango: "Hoje a t\xE9cnica doma a selva.", renngotti: "Pode gritar. Eu conto os frames.", aneninha: "Teu ritmo tem guarda baixa." },
  orango: { caetano: "Quero ver o dedilho segurar isto!", renngotti: "Microfone n\xE3o segura orangotango!", aneninha: "A selva tamb\xE9m sabe dan\xE7ar!" },
  renngotti: { caetano: "Esse dojo agora tem microfone.", orango: "Teu rugido est\xE1 sem alcance.", aneninha: "Hoje eu fa\xE7o a trilha!" },
  aneninha: { caetano: "Tenta prever o passo de Osasco!", orango: "Vem dan\xE7ar, rei da selva!", renngotti: "Aumenta o som da Bol\xEDvia!" },
  santox: { jao: "Voc\xEA calculou a pessoa atr\xE1s da tela?", caetano: "Teu dedilho alcan\xE7a a quarta parede?", aneninha: "Se mudar o ritmo, eu mudo o roteiro." },
  jao: { santox: "At\xE9 o caos tem uma solu\xE7\xE3o.", caetano: "Hoje a t\xE9cnica encontra o c\xE1lculo.", orango: "For\xE7a bruta n\xE3o d\xE1 xeque-mate." },
  jane: { jao: "Pode calcular. Eu j\xE1 dei deploy.", cristyan: "Teu descanso \xE9 na rede. O meu \xE9 no laptop.", eneas: "Doutor, meu c\xF3digo est\xE1 com sono." },
  cristyan: { jane: "Moto n\xE3o vale na roda de treino!", caetano: "Hoje a teoria encontra um teep.", eneas: "Pode falar. Eu espero o intervalo." },
  eneas: { jane: "Isso n\xE3o \xE9 sono, \xE9 economia de energia!", jao: "Matem\xE1tica tamb\xE9m \xE9 ci\xEAncia!", cristyan: "Vou medir esse batimento!" }
};
var defaults = { patrick: "Coura\xE7a tamb\xE9m exige estrat\xE9gia.", gabrielzin: "O charme tamb\xE9m tem frame data.", ulisses: "O sangue conta uma hist\xF3ria.", felipence: "A pr\xF3xima nota vai te alcan\xE7ar.", hdsh: "O padr\xE3o j\xE1 est\xE1 na minha an\xE1lise.", caetano: "Um golpe. Uma teoria comprovada.", orango: "Entrou na selva, aguenta a press\xE3o!", renngotti: "Alcance m\xE1ximo. Volume tamb\xE9m.", aneninha: "Osasco muda o passo sem avisar!", tubarao: "A fiscaliza\xE7\xE3o chegou na arena!", rickzera: "Pode parcelar essa derrota.", bieu: "O muro j\xE1 sabe o campe\xE3o.", nomad: "O pr\xF3ximo round \xE9 no meu lobby!", santox: "A c\xE2mera tamb\xE9m est\xE1 me olhando?", jao: "J\xE1 calculei os pr\xF3ximos tr\xEAs lances.", jane: "N\xE3o me acorde antes do deploy.", cristyan: "Na minha rede, o descanso \xE9 curto.", eneas: "Meu nome \xE9 Acreano! E agora \xE9 ci\xEAncia!" };
var matchupLine = (a, b) => lines[a]?.[b] || (a === b ? "At\xE9 meu espelho vai aprender." : defaults[a]);
var rivalWins = {};
var rivals = [
  ["caetano", "ulisses", "No dojo, at\xE9 a noite tem disciplina.", "Sua disciplina tamb\xE9m sangra.", "A t\xE9cnica encerrou sua noite.", "A noite passou pela sua guarda."],
  ["rickzera", "hdsh", "Pode analisar. Eu j\xE1 estou no pr\xF3ximo golpe.", "Sua energia tamb\xE9m deixa padr\xF5es.", "Faltou energia nessa an\xE1lise.", "Seu pr\xF3ximo golpe j\xE1 estava no gr\xE1fico."],
  ["jane", "felipence", "Sua guitarra vai precisar de atualiza\xE7\xE3o.", "Ent\xE3o prepara o volume do deploy.", "Corrigi o ru\xEDdo da sua guitarra.", "O \xFAltimo acorde derrubou seu sistema."],
  ["renngotti", "nomad", "Chega de sorte. Hoje vale press\xE3o.", "Relaxa. Essa partida j\xE1 est\xE1 no meu lobby.", "A sorte n\xE3o segurou o impacto.", "Volta para a fila do lobby."],
  ["bieu", "gabrielzin", "Charme n\xE3o distrai quem vive de mal\xEDcia.", "Ent\xE3o tenta resistir sem desviar o olhar.", "O Cap\xE3o conhece todos os truques.", "At\xE9 sua mal\xEDcia caiu no charme."],
  ["aneninha", "cristyan", "Minha sequ\xEAncia n\xE3o tem hora de descanso.", "Depois dela, eu te apresento a rede.", "Osasco passou por cima da rede.", "A rede de hoje ficou para voc\xEA."],
  ["orango", "patrick", "Essa coura\xE7a aguenta a selva inteira?", "Uma pe\xE7a por vez. Pode tentar.", "A selva encontrou a rachadura.", "Seu instinto encontrou uma parede."],
  ["jao", "eneas", "Vou demonstrar sua derrota em seis lances.", "Quero ver os c\xE1lculos passarem pela ci\xEAncia.", "A demonstra\xE7\xE3o est\xE1 conclu\xEDda.", "A hip\xF3tese n\xE3o resistiu ao experimento."],
  ["tubarao", "santox", "At\xE9 a quarta parede recebe fiscaliza\xE7\xE3o.", "Vamos ver quem quebra a tela primeiro.", "O glitch terminou no fundo do mar.", "A fiscaliza\xE7\xE3o saiu do roteiro."]
];
for (const [a, b, opening, answer, win, reply] of rivals) {
  lines[a] = { ...lines[a], [b]: opening };
  lines[b] = { ...lines[b], [a]: answer };
  rivalWins[a] = { ...rivalWins[a], [b]: win };
  rivalWins[b] = { ...rivalWins[b], [a]: reply };
}
var victoryLine = (a, b) => rivalWins[a]?.[b] ?? FIGHTER_STYLE[a].victory;
var FINISHER_CALLS = { patrick: "Colis\xE3o invenc\xEDvel conclu\xEDda!", gabrielzin: "Kawai em volume m\xE1ximo!", ulisses: "Rakuyo encerrou a noite!", felipence: "O \xFAltimo acorde venceu!", hdsh: "Full box! Duzentos!", caetano: "Dedo de precis\xE3o absoluta!", orango: "A selva encerrou o expediente!", renngotti: "Direto para a lua, com \xE1udio!", aneninha: "Osasco fez a festa inteira!", tubarao: "Beijo de fiscaliza\xE7\xE3o aprovado!", rickzera: "Transfer\xEAncia encerrada em seis vezes!", bieu: "Prest\xEDgio carimbado no asfalto!", nomad: "O lobby fechou para balan\xE7o!", santox: "O coelho saiu do roteiro!", jao: "Xeque-mate absoluto! A conta fechou!", jane: "Deploy do AreiaZord autorizado!", cristyan: "Senten\xE7a da rede! Hora de acordar!", eneas: "Cinquenta e seis no placar! Meu nome \xE9 Acreano!" };

// src/game/challenges.ts
var TRAINING_CHALLENGES = [
  { id: "transform", title: "Dois estoques, uma forma", description: "Ative uma transforma\xE7\xE3o sem ser interrompido.", hint: "Guarde 200 ULT. Em neutro, use F / FORMA com f\xF4lego. A prepara\xE7\xE3o pode ser punida.", metric: "transform", target: 1, unit: "forma ativa" },
  { id: "stamina", title: "Respira e responde", description: "Recupere 50 de f\xF4lego descansando.", hint: "Gaste stamina com golpes e mobilidade, depois solte os ataques em neutro.", metric: "stamina", target: 50, unit: "f\xF4lego recuperado" },
  { id: "energy", title: "Energia n\xE3o \xE9 Ultimate", description: "Acumule 40 de energia com Rickzera.", hint: "Segure C / CARREGAR em neutro. A Cruz de Energia impede a recarga enquanto est\xE1 ativa.", metric: "energy", target: 40, unit: "energia carregada" },
  { id: "hits", title: "Primeiro contato", description: "Acerte 5 golpes no advers\xE1rio.", hint: "Aproxime-se e use soco ou chute.", metric: "hits", target: 5, unit: "acertos" },
  { id: "low", title: "Rasteiras de respeito", description: "Acerte 3 ataques agachados.", hint: "Segure baixo e use soco ou chute.", metric: "low", target: 3, unit: "rasteiros" },
  { id: "air", title: "Dom\xEDnio dos ares", description: "Acerte 2 ataques a\xE9reos.", hint: "Pule perto do advers\xE1rio e ataque durante o salto.", metric: "air", target: 2, unit: "a\xE9reos" },
  { id: "jump", title: "Sai do ch\xE3o", description: "Execute 5 saltos.", hint: "Solte o comando de pulo antes de saltar novamente.", metric: "jump", target: 5, unit: "saltos" },
  { id: "dash", title: "Passo rel\xE2mpago", description: "Execute 3 dashes.", hint: "Toque duas vezes rapidamente na mesma dire\xE7\xE3o.", metric: "dash", target: 3, unit: "dashes" },
  { id: "crouch", title: "Perfil baixo", description: "Fique agachado por 3 segundos no total.", hint: "Mantenha o direcional para baixo.", metric: "crouch", target: 180, unit: "quadros" },
  { id: "block", title: "Muralha", description: "Defenda 3 golpes da IA.", hint: "Segure Defesa: altos e m\xE9dios. Baixo + Defesa: baixos e m\xE9dios. Pode manter o bot\xE3o durante hitstun.", metric: "block", target: 3, unit: "bloqueios", cpu: true },
  { id: "combo", title: "Tr\xEAs \xE9 combo", description: "Conecte um combo de pelo menos 3 acertos.", hint: "Combine soco, chute e especial sem deixar o rival se recuperar.", metric: "combo", target: 3, unit: "no combo" },
  { id: "special", title: "Arsenal completo", description: "Use os 3 especiais diferentes com efeito real.", hint: "Acerte golpes; com Santox, evite um ataque usando ESP 3. Com Jao ou H?D?SH, limite um rival em movimento no tabuleiro.", metric: "special", target: 3, unit: "especiais" },
  { id: "damage", title: "Press\xE3o constante", description: "Cause 500 de dano acumulado.", hint: "O boneco se recupera: continue variando seus golpes.", metric: "damage", target: 500, unit: "de dano" },
  { id: "super", title: "Assinatura final", description: "Acerte uma ULT.", hint: "A barra fica cheia no treino. Aproxime-se antes de ativar.", metric: "super", target: 1, unit: "ULT acertada" },
  { id: "range", title: "Sem spam", description: "Use 3 golpes \xE0 dist\xE2ncia e espere o cooldown terminar.", hint: "Durante os 5 segundos, use corpo a corpo ou defenda.", metric: "range", target: 1, unit: "cooldown conclu\xEDdo", ranged: true },
  { id: "turn", title: "De olho no outro lado", description: "Execute 3 viradas manuais no ch\xE3o.", hint: "Use Virar (Q por padr\xE3o ou o bot\xE3o VIRAR). Solte entre apertos; a dire\xE7\xE3o fica manual at\xE9 receber um golpe ou entrar numa sequ\xEAncia.", metric: "turn", target: 3, unit: "viradas" },
  { id: "perfect", title: "No \xFAltimo instante", description: "Fa\xE7a 3 defesas perfeitas.", hint: "Aperte Defesa at\xE9 3 frames antes do contato, estando livre. Segurar n\xE3o renova a janela. Caetano tamb\xE9m conta com sua Leitura.", metric: "perfect", target: 3, unit: "perfeitas", cpu: true },
  { id: "blockLow", title: "Base firme", description: "Bloqueie 3 golpes baixos da IA.", hint: "Baixo + Defesa. M\xE9dios tamb\xE9m s\xE3o bloqueados; ataques que exigem defesa em p\xE9 continuam perigosos. O HUD mostra quando voc\xEA est\xE1 livre.", metric: "blockLow", target: 3, unit: "baixos defendidos", cpu: true }
];
var challengeDefinition = (id) => TRAINING_CHALLENGES.find((c) => c.id === id);
var challengeAvailable = (id, ch) => (id !== "range" || RANGED_MOVES[ch].length > 0) && (id !== "energy" || ch === "rickzera");
var STORE = "dedilho-wars-training-badges-v1";
function completedChallenges() {
  try {
    const x = JSON.parse(localStorage.getItem(STORE) || "[]");
    return Array.isArray(x) ? x.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}
function saveChallengeBadge(id) {
  try {
    localStorage.setItem(STORE, JSON.stringify([.../* @__PURE__ */ new Set([...completedChallenges(), id])]));
  } catch {
  }
}

// src/game/training/npc-art.ts
var TAU = Math.PI * 2;

// src/game/animation.ts
var ANIMATION_STYLE = {
  caetano: { weight: 0.8, tempo: 0.075, swing: 15, recoil: 0.8 },
  orango: { weight: 1.5, tempo: 0.052, swing: 28, recoil: 1.3 },
  tubarao: { weight: 1.35, tempo: 0.055, swing: 16, recoil: 1.15 },
  rickzera: { weight: 0.75, tempo: 0.085, swing: 19, recoil: 0.85 },
  bieu: { weight: 0.95, tempo: 0.08, swing: 22, recoil: 1 },
  nomad: { weight: 1.3, tempo: 0.065, swing: 24, recoil: 1.2 },
  renngotti: { weight: 1, tempo: 0.06, swing: 14, recoil: 0.9 },
  aneninha: { weight: 0.8, tempo: 0.095, swing: 25, recoil: 1.2 },
  santox: { weight: 0.65, tempo: 0.085, swing: 31, recoil: 1.35 },
  jao: { weight: 0.85, tempo: 0.065, swing: 15, recoil: 0.75 },
  jane: { weight: 0.65, tempo: 0.095, swing: 23, recoil: 1 },
  cristyan: { weight: 1.1, tempo: 0.08, swing: 18, recoil: 1 },
  patrick: { weight: 1.4, tempo: 0.052, swing: 12, recoil: 1.2 },
  gabrielzin: { weight: 0.65, tempo: 0.09, swing: 27, recoil: 0.9 },
  ulisses: { weight: 0.95, tempo: 0.062, swing: 17, recoil: 1.1 },
  felipence: { weight: 1.1, tempo: 0.075, swing: 22, recoil: 1.15 },
  hdsh: { weight: 0.85, tempo: 0.068, swing: 14, recoil: 0.8 },
  eneas: { weight: 1.3, tempo: 0.055, swing: 12, recoil: 1.1 }
};
var clamp3 = (n) => Math.max(0, Math.min(1, n));
var ease = (n) => {
  const t = clamp3(n);
  return t * t * (3 - 2 * t);
};
var JOINT = /^(fa|ba|fl|bl)[12]$/;
function mixAnimation(a, b, amount) {
  const k = clamp3(amount), out = { ...a };
  if (k === 0) return out;
  if (k === 1) return { ...b };
  for (const key of Object.keys(a)) {
    let d = b[key] - a[key];
    if (JOINT.test(key)) d = ((d + 180) % 360 + 360) % 360 - 180;
    out[key] = a[key] + d * k;
  }
  return out;
}
function sampleTrack(keys, time) {
  for (let i = 1; i < keys.length; i++) {
    if (time <= keys[i][0]) {
      const [a, p] = keys[i - 1], [b, q] = keys[i];
      return mixAnimation(p, q, ease((time - a) / Math.max(1e-3, b - a)));
    }
  }
  return { ...keys[keys.length - 1][1] };
}
function attackAnimation(ch, m, frame, connected, neutral) {
  const poses = CHARS[ch].poses, idle = neutral || poses[m.air ? "jump" : m.id[0] === "c" ? "crouch" : "idle"];
  const wind = poses[m.poses[0]] || idle, strike = poses[m.poses[1]] || wind;
  const style = ANIMATION_STYLE[ch], kick = /^(k|cK|jK)/.test(m.id) || m.trail === "fa" || m.trail === "ba";
  const amount = (m.kind === "normal" && m.rank === 1 ? 0.55 : 1) * style.recoil;
  const anticipation = mixAnimation(idle, wind, 0.52);
  anticipation.lean -= 3 * amount;
  anticipation.head += 2 * amount;
  const coil = { ...wind, lean: wind.lean - 2.5 * amount, head: wind.head + 2 * amount };
  if (kick) {
    coil.fl2 += 7 * amount;
    coil.ba2 -= 4 * amount;
  } else {
    coil.fa2 -= 5 * amount;
    coil.ba1 += 3 * amount;
  }
  const follow = { ...strike, lean: strike.lean + 2.5 * amount, head: strike.head - 1.5 * amount };
  const recoil = mixAnimation(poses[m.recoveryPose || m.poses[1]] || strike, wind, 0.28);
  recoil.lean -= 2 * amount;
  const activeEnd = m.startup + m.active;
  const end = activeEnd + m.recovery + (connected ? 0 : m.whiff);
  let keys = [
    [0, mixAnimation(idle, wind, 0.18)],
    [m.startup * 0.27, anticipation],
    [m.startup * 0.66, coil],
    [Math.max(m.startup * 0.67, m.startup - 1), mixAnimation(wind, strike, 0.32)],
    [m.startup, strike],
    [activeEnd - 0.01, follow],
    [activeEnd + (end - activeEnd) * 0.3, recoil],
    [end - 1, idle]
  ];
  if (ch === "jane" && m.id === "s3") {
    const hop = { ...poses.jump, fa1: -35, ba1: 155, fl1: -15, fl2: 120 };
    keys = [
      [0, wind],
      [10, { ...wind, lean: wind.lean + 3 }],
      [17, wind],
      [21, hop],
      [m.startup - 3, mixAnimation(hop, strike, 0.28)],
      [m.startup, strike],
      [activeEnd, follow],
      [end - 1, idle]
    ];
  }
  const result = sampleTrack(keys, Math.max(0, frame));
  if (ch === "rickzera" && m.id === "s1" && frame >= m.startup && frame < activeEnd) {
    const flick = Math.sin((frame - m.startup) % 6 / 6 * Math.PI);
    result.ba1 -= flick * 8;
    result.ba2 -= flick * 6;
  }
  return result;
}
function proceduralMotion(ch, base2, f) {
  const p = { ...base2 }, s = ANIMATION_STYLE[ch], t = f.animT, breath = Math.sin(t * s.tempo);
  if (f.state === "ground") {
    if (f.landLag > 0) return mixAnimation(base2, CHARS[ch].poses.crouch, Math.min(1, f.landLag / 4));
    if (f.walking && !f.crouch && !f.guard) {
      const speed = Math.min(1, Math.abs(f.vx) / CHARS[ch].walk), phase = t * 0.24;
      const front = Math.sin(phase), back = Math.sin(phase + Math.PI);
      p.fl1 += front * 24 * speed;
      p.bl1 += back * 24 * speed;
      p.fl2 += (front * 8 - Math.max(0, Math.cos(phase)) * 22) * speed;
      p.bl2 += (back * 8 - Math.max(0, Math.cos(phase + Math.PI)) * 22) * speed;
      p.fa1 -= front * s.swing * speed;
      p.ba1 -= back * s.swing * speed;
      p.fa2 += front * 8 * speed;
      p.ba2 += back * 8 * speed;
      p.lean += f.vx * f.facing * 1.2;
      p.head -= front * 1.6 * speed;
    } else {
      p.lean += breath * (f.guard ? 0.45 : 1.25);
      p.head -= breath * 0.75;
      p.fa1 += breath * (f.guard ? 0.7 : 2.8);
      p.ba1 -= breath * 1.8;
      p.fa2 += Math.sin(t * s.tempo - 0.6) * 1.7;
      if (!f.crouch && !f.guard) {
        p.fl1 += breath * 0.8;
        p.bl1 -= breath * 0.8;
      }
    }
  } else if (f.state === "jump") {
    const rise = Math.max(-1, Math.min(1, f.vy / 10));
    p.fl1 += rise * 14;
    p.fl2 -= rise * 16;
    p.bl1 -= rise * 12;
    p.bl2 += rise * 15;
    p.fa1 += rise * 16;
    p.ba1 -= rise * 12;
    p.lean += f.vx * f.facing * 1.2;
  } else if (f.state === "dash") {
    const phase = Math.sin(t * 0.7);
    p.fl1 += phase * 25;
    p.bl1 -= phase * 25;
    p.fl2 -= Math.max(0, phase) * 25;
    p.bl2 += Math.min(0, phase) * 25;
    p.fa1 -= phase * s.swing * 0.6;
    p.ba1 += phase * s.swing * 0.6;
    p.head += Math.cos(t * 0.7) * 1.1;
  } else if (f.state === "hit" || f.state === "block") {
    const shock = Math.exp(-f.stateT * 0.25) * Math.sin(f.stateT * 1.25);
    p.lean -= shock * (f.state === "hit" ? 7 : 3);
    p.head -= shock * 4;
    p.fa2 += shock * 7;
    p.ba2 -= shock * 5;
  } else if (f.state === "getup") {
    return mixAnimation(p, CHARS[ch].poses.idle, ease(f.stateT / 18));
  } else if (f.state === "dizzy") {
    p.lean += Math.sin(t * 0.18) * 7;
    p.head -= Math.sin(t * 0.18 + 0.7) * 9;
  } else if (f.state === "win") {
    p.lean += breath * 2;
    p.head += Math.cos(t * s.tempo) * 2 - breath;
    p.fa2 += Math.sin(t * s.tempo * 2) * (ch === "orango" ? 24 : 3);
    p.ba2 -= Math.sin(t * s.tempo * 2) * (ch === "orango" ? 24 : 3);
  }
  return p;
}
var ANIMATION_SUBFRAMES = 3;
var ANIMATION_FPS = 60 * ANIMATION_SUBFRAMES;
var ANIMATION_CLIPS = {
  idle: { label: "Prontid\xE3o e respira\xE7\xE3o", ticks: 120, frames: 360, pose: "idle", loop: true },
  walk: { label: "Caminhada", ticks: 32, frames: 96, pose: "idle", loop: true },
  dash: { label: "Dash e corrida", ticks: 24, frames: 72, pose: "rush", loop: true },
  jump: { label: "Salto: subida e queda", ticks: 24, frames: 72, pose: "jump", loop: false },
  guard: { label: "Defesa alta", ticks: 36, frames: 108, pose: "block", loop: true },
  crouch: { label: "Agachar e apoio baixo", ticks: 36, frames: 108, pose: "crouch", loop: true },
  hit: { label: "Rea\xE7\xE3o ao impacto", ticks: 16, frames: 48, pose: "hit", loop: false },
  getup: { label: "Levantar", ticks: 18, frames: 54, pose: "getup", loop: false },
  win: { label: "Comemora\xE7\xE3o", ticks: 60, frames: 180, pose: "win", loop: true }
};
var ANIMATION_CLIP_IDS = Object.keys(ANIMATION_CLIPS);
var ANIMATION_FRAMES_PER_FIGHTER = ANIMATION_CLIP_IDS.reduce((sum, id) => sum + ANIMATION_CLIPS[id].frames, 0);
var frameLibrary = /* @__PURE__ */ new Map();
function animationFrames(ch, id) {
  const key = ch + ":" + id, old = frameLibrary.get(key);
  if (old) return old;
  const clip = ANIMATION_CLIPS[id], def = CHARS[ch], base2 = def.poses[clip.pose] || def.poses.idle;
  const result = Array.from({ length: clip.frames }, (_, i) => {
    const phase = i / clip.frames * Math.PI * 2;
    const animT = id === "walk" ? phase / 0.24 : id === "dash" ? phase / 0.7 : phase / ANIMATION_STYLE[ch].tempo;
    const f = {
      state: id === "idle" || id === "walk" || id === "guard" || id === "crouch" ? "ground" : id,
      stateT: i / ANIMATION_SUBFRAMES,
      animT,
      vx: id === "walk" ? def.walk : 0,
      vy: -10 + i / (clip.frames - 1) * 20,
      walking: id === "walk" ? 1 : 0,
      facing: 1,
      crouch: id === "crouch",
      guard: id === "guard",
      landLag: 0
    };
    return Object.freeze(proceduralMotion(ch, base2, f));
  });
  Object.freeze(result);
  frameLibrary.set(key, result);
  return result;
}
function animationFrame(ch, id, frame) {
  const frames = animationFrames(ch, id), n = frames.length, loop = ANIMATION_CLIPS[id].loop;
  const t = loop ? (frame % n + n) % n : Math.max(0, Math.min(n - 1, frame));
  const a = Math.floor(t), b = loop ? (a + 1) % n : Math.min(n - 1, a + 1);
  return mixAnimation(frames[a], frames[b], t - a);
}
function relativeFrame(ch, id, tick, base2) {
  const canonical = CHARS[ch].poses[ANIMATION_CLIPS[id].pose] || CHARS[ch].poses.idle;
  const p = animationFrame(ch, id, tick * ANIMATION_SUBFRAMES);
  for (const k of Object.keys(p)) p[k] += base2[k] - canonical[k];
  return p;
}
function motionAnimation(ch, base2, f) {
  if (f.state === "ground") {
    if (f.landLag > 0) return mixAnimation(base2, CHARS[ch].poses.crouch, Math.min(1, f.landLag / 4));
    const id = f.guard ? "guard" : f.crouch ? "crouch" : f.walking ? "walk" : "idle";
    const rate = id === "walk" ? 1 : ANIMATION_STYLE[ch].tempo / 0.075;
    let p = relativeFrame(ch, id, f.animT * rate, base2);
    if (id === "walk") {
      p = mixAnimation(base2, p, Math.min(1, Math.abs(f.vx) / CHARS[ch].walk));
      p.lean += (f.vx * f.facing - Math.abs(f.vx)) * 1.2;
    }
    return p;
  }
  if (f.state === "jump") {
    const p = relativeFrame(ch, "jump", clamp3((f.vy + 10) / 20) * (ANIMATION_CLIPS.jump.frames - 1) / ANIMATION_SUBFRAMES, base2);
    p.lean += f.vx * f.facing * 1.2;
    return p;
  }
  if (f.state === "dash") return relativeFrame(ch, "dash", f.animT, base2);
  if (f.state === "hit") return relativeFrame(ch, "hit", f.stateT, base2);
  if (f.state === "getup") return relativeFrame(ch, "getup", f.stateT, base2);
  if (f.state === "win") return relativeFrame(ch, "win", f.animT * ANIMATION_STYLE[ch].tempo / 0.075, base2);
  if (f.state === "block") {
    const p = relativeFrame(ch, "guard", f.animT, base2), shock = Math.exp(-f.stateT * 0.25) * Math.sin(f.stateT * 1.25);
    p.lean -= shock * 3;
    p.head -= shock * 4;
    p.fa2 += shock * 7;
    p.ba2 -= shock * 5;
    return p;
  }
  return proceduralMotion(ch, base2, f);
}

// src/game/rig.ts
var G = {
  jane: { T: 28, th: 21, sh: 20, ua: 17, fo: 15, headR: 10.8, foot: 10, hOff: 1.02, hFwd: 1.5 },
  cristyan: { T: 60, th: 45, sh: 44, ua: 34, fo: 31, headR: 12.8, foot: 16, hOff: 1.12, hFwd: 2 },
  eneas: { T: 61, th: 42, sh: 40, ua: 35, fo: 32, headR: 14, foot: 17, hOff: 1, hFwd: 2 },
  santox: { T: 60, th: 46, sh: 43, ua: 35, fo: 32, headR: 13, foot: 18, hOff: 1.1, hFwd: 1 },
  jao: { T: 58, th: 43, sh: 42, ua: 32, fo: 30, headR: 12.5, foot: 16, hOff: 1.1, hFwd: 2 },
  aneninha: { T: 54, th: 40, sh: 39, ua: 29, fo: 27, headR: 12.8, foot: 14, hOff: 1.1, hFwd: 2 },
  caetano: { T: 58, th: 44, sh: 44, ua: 32, fo: 30, headR: 12.7, foot: 14, hOff: 1.15, hFwd: 2 },
  orango: { T: 62, th: 34, sh: 30, ua: 52, fo: 50, headR: 21, foot: 17, hOff: 0.85, hFwd: 6 },
  tubarao: { T: 66, th: 46, sh: 42, ua: 38, fo: 35, headR: 23, foot: 17, hOff: 0.9, hFwd: 4 },
  rickzera: { T: 57, th: 44, sh: 43, ua: 32, fo: 30, headR: 12.7, foot: 16, hOff: 1.15, hFwd: 2 },
  bieu: { T: 58, th: 44, sh: 43, ua: 34, fo: 31, headR: 12.7, foot: 15, hOff: 1.15, hFwd: 2 },
  nomad: { T: 55, th: 37, sh: 35, ua: 34, fo: 31, headR: 13.8, foot: 17, hOff: 1, hFwd: 3 },
  renngotti: { T: 58, th: 40, sh: 38, ua: 35, fo: 32, headR: 13.5, foot: 17, hOff: 1.05, hFwd: 3 },
  patrick: { T: 62, th: 47, sh: 44, ua: 35, fo: 32, headR: 12.8, foot: 17, hOff: 1.12, hFwd: 2 },
  gabrielzin: { T: 50, th: 38, sh: 37, ua: 28, fo: 25, headR: 12.3, foot: 14, hOff: 1.12, hFwd: 2 },
  ulisses: { T: 61, th: 46, sh: 43, ua: 35, fo: 32, headR: 13, foot: 17, hOff: 1.1, hFwd: 2 },
  felipence: { T: 58, th: 44, sh: 43, ua: 33, fo: 31, headR: 13, foot: 16, hOff: 1.12, hFwd: 2 },
  hdsh: { T: 57, th: 43, sh: 42, ua: 33, fo: 30, headR: 13, foot: 16, hOff: 1.12, hFwd: 2 }
};
var rad = (d) => d * Math.PI / 180;
var pol = (o, ang, len) => ({ x: o.x + Math.cos(rad(ang)) * len, y: o.y + Math.sin(rad(ang)) * len });
function lerpPose(a, b, k) {
  if (k <= 0) return { ...a };
  if (k >= 1) return { ...b };
  const o = { ...a };
  for (const key of Object.keys(a)) {
    let delta = b[key] - a[key];
    if (/^(fa|ba|fl|bl)[12]$/.test(key)) delta = ((delta + 180) % 360 + 360) % 360 - 180;
    o[key] = a[key] + delta * k;
  }
  return o;
}
function computeRig(ch, pose) {
  const g = G[ch];
  const lr = rad(pose.lean);
  const dir = { x: Math.sin(lr), y: -Math.cos(lr) };
  const hip = { x: 0, y: 0 };
  const neck = { x: dir.x * g.T, y: dir.y * g.T };
  const sh = { x: dir.x * g.T * 0.88, y: dir.y * g.T * 0.88 };
  const hd = rad(pose.lean + pose.head);
  const head = { x: neck.x + Math.sin(hd) * g.headR * g.hOff + g.hFwd, y: neck.y - Math.cos(hd) * g.headR * g.hOff };
  const eF = pol(sh, pose.fa1, g.ua);
  const wF = pol(eF, pose.fa2, g.fo);
  const eB = pol(sh, pose.ba1, g.ua);
  const wB = pol(eB, pose.ba2, g.fo);
  const kF = pol(hip, pose.fl1, g.th);
  const aF = pol(kF, pose.fl2, g.sh);
  const tF = pol(aF, pose.fl2 - 75, g.foot);
  const kB = pol(hip, pose.bl1, g.th);
  const aB = pol(kB, pose.bl2, g.sh);
  const tB = pol(aB, pose.bl2 - 75, g.foot);
  const p = { hip, neck, sh, head, eF, wF, eB, wB, kF, aF, tF, kB, aB, tB };
  if (pose.rot) {
    const c = Math.cos(pose.rot);
    const s = Math.sin(pose.rot);
    for (const k in p) {
      const q = p[k];
      p[k] = { x: q.x * c - q.y * s, y: q.x * s + q.y * c };
    }
  }
  const penalty = (1 - Math.min(1, Math.abs(pose.rot) * 2)) * 600;
  let low = Math.max(p.aF.y + 5, p.aB.y + 5, p.tF.y + 3, p.tB.y + 3);
  low = Math.max(low, p.head.y + g.headR - penalty, p.sh.y + 12 - penalty, p.hip.y + 14 - penalty, p.wF.y + 8 - penalty, p.wB.y + 8 - penalty);
  for (const k in p) p[k] = { x: p[k].x, y: p[k].y - low };
  return { p };
}

// src/game/timing.ts
var SIMULATION_HZ = 60;
var TICK_MS = 1e3 / SIMULATION_HZ;
var MAX_FRAME_GAP_MS = 250;
var FrameTimer = class {
  last = null;
  remainder = 0;
  frames = 0;
  deltaFrames = 0;
  get fraction() {
    return this.remainder;
  }
  /** Drops time while paused/hidden and after a long interruption. Normal slow
   * frames (down to 4 Hz) still advance the same amount of game time. */
  sample(nowMs, running = true) {
    this.deltaFrames = 0;
    if (!Number.isFinite(nowMs)) return 0;
    if (this.last !== null && nowMs < this.last) return 0;
    const dt = this.last === null ? 0 : nowMs - this.last;
    this.last = nowMs;
    if (!running || dt > MAX_FRAME_GAP_MS) {
      this.remainder = 0;
      return 0;
    }
    this.deltaFrames = dt / TICK_MS;
    this.frames += this.deltaFrames;
    this.remainder += this.deltaFrames;
    const ticks = Math.floor(this.remainder + 1e-8);
    this.remainder = Math.max(0, this.remainder - ticks);
    return ticks;
  }
  /** Rebase without rewinding the animation or accumulating hidden-tab debt. */
  rebase() {
    this.last = null;
    this.remainder = 0;
    this.deltaFrames = 0;
  }
};

// src/game/render-motion.ts
function captureMotion(f) {
  return {
    x: f.x,
    y: f.y,
    pose: { ...f.pose },
    state: f.state,
    serial: f.serial,
    facing: f.facing,
    guard: f.guard,
    crouch: f.crouch,
    turn: f.turn,
    rotAdd: f.rotAdd,
    impact: f.impact?.serial,
    animT: f.animT,
    stateT: f.stateT,
    vx: f.vx,
    vy: f.vy,
    walking: f.walking,
    poseName: f.poseName,
    landLag: f.landLag,
    moveT: f.moveT
  };
}

// src/game/mobile-settings.ts
var DEFAULT_MOBILE_SETTINGS = { hand: "right", largeButtons: false, haptics: false, graphics: "auto" };
var KEY = "dedilho-mobile-v1";
function normalizeMobileSettings(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  return { hand: r.hand === "left" ? "left" : "right", largeButtons: r.largeButtons === true, haptics: r.haptics === true, graphics: r.graphics === "sharp" ? "sharp" : "auto" };
}
function read() {
  try {
    return normalizeMobileSettings(JSON.parse(localStorage.getItem(KEY) || "null"));
  } catch {
    return { ...DEFAULT_MOBILE_SETTINGS };
  }
}
var state = read();

// src/game/canvas.ts
var MAX_SCENE_PIXELS = 3840 * 2160;
var MAX_DETAIL_PIXELS = 2048 * 2048;

// src/game/training/city-stages.ts
var TRAINING_STAGES = {
  "twitchcity-capital": { id: "twitchcity-capital", name: "Twitchcity \xB7 Capital", subtitle: "PRA\xC7A C\xCDVICA \xB7 CANAL DA CAPITAL", accent: "#c478ff", district: "Distrito Capital" },
  "twitchcity-military": { id: "twitchcity-military", name: "Twitchcity \xB7 Distrito Militar", subtitle: "BASE DOS SHOOTER \xB7 P\xC1TIO DE OPERA\xC7\xD5ES", accent: "#44dfff", district: "Distrito Militar" },
  "twitchcity-conservator": { id: "twitchcity-conservator", name: "Twitchcity \xB7 Distrito Conservador", subtitle: "MORRO SENBUKAN \xB7 CAMINHO DO DOJO", accent: "#ffc36c", district: "Distrito Conservador" }
};
var TAU2 = Math.PI * 2;

// src/game/stage-scenes.ts
var TAU3 = Math.PI * 2;

// src/game/extra-stage-scenes.ts
var TAU4 = Math.PI * 2;

// src/game/stage.ts
var STAGES = {
  ...TRAINING_STAGES,
  neto: { id: "neto", name: "Neto Supermercados", subtitle: "OFERTAS E COMBATE NA CAL\xC7ADA", accent: "#3b82f6" },
  dojo: { id: "dojo", name: "Dojo Senbukan", subtitle: "O DOJO CL\xC1SSICO DO DEDILHO", accent: "#a855f7" },
  liberdade: { id: "liberdade", name: "Liberdade SP", subtitle: "LANTERNAS NO CORA\xC7\xC3O DE S\xC3O PAULO", accent: "#ef4444" },
  curitiba: { id: "curitiba", name: "Curitiba", subtitle: "JARDIM BOT\xC2NICO E ARAUC\xC1RIAS", accent: "#4ade80" },
  piaui: { id: "piaui", name: "Piau\xED", subtitle: "SERRA, CAATINGA E SOL", accent: "#fb923c" },
  planalto: { id: "planalto", name: "Pal\xE1cio do Planalto", subtitle: "A ARENA MODERNISTA DE BRAS\xCDLIA", accent: "#38bdf8" },
  casebre: { id: "casebre", name: "Casebre", subtitle: "QUINTAL PEQUENO, BRIGA GRANDE", accent: "#d9a86c" },
  praca: { id: "praca", name: "Pra\xE7a do Dedilhador", subtitle: "O MONUMENTO DA COMUNIDADE", accent: "#c084fc" },
  osasco: { id: "osasco", name: "Osasco", subtitle: "A CIDADE N\xC3O PARA", accent: "#fbbf24" },
  bolivia: { id: "bolivia", name: "Bol\xEDvia", subtitle: "COMBATE NAS ALTURAS DOS ANDES", accent: "#f87171" },
  morro: { id: "morro", name: "Morro do Bieu", subtitle: "RESPEITA A COMUNIDADE", accent: "#fb7185" },
  campo: { id: "campo", name: "Campo do futebol dos campe\xF5es", subtitle: "O CL\xC1SSICO DO DEDILHO", accent: "#4ade80" },
  casabranca: { id: "casabranca", name: "Casa Branca com Ovnis", subtitle: "VISITANTES DE OUTRA GAL\xC1XIA", accent: "#a3e635", credit: "Jalam" },
  letsgay: { id: "letsgay", name: "Praia do Lets Gay", subtitle: "SOL, MAR E TODAS AS CORES", accent: "#f472b6", credit: "Jalam e Dieg\xE3o" },
  ngb: { id: "ngb", name: "Lugar do NGB News", subtitle: "A NOT\xCDCIA AO VIVO NA ARENA", accent: "#22d3ee" },
  zoologico: { id: "zoologico", name: "Zool\xF3gico do Orangotango", subtitle: "BEM-VINDOS AO REINO DA SELVA", accent: "#86efac" },
  termodinamica: { id: "termodinamica", name: "Praia da Termodin\xE2mica", subtitle: "CALOR, ONDAS E ENTROPIA", accent: "#fb923c" }
};
var FLOOR_Y = 470;

// src/game/ai.ts
function incomingProjectile(g, f) {
  return g.projectiles.filter((p) => {
    if (p.owner === f.idx || p.life <= 0 || p.move.dmg <= 0) return false;
    const dx = f.x - p.x;
    if (p.vx === 0) return Math.abs(dx) < (p.radius ?? 20) + f.def.pushW + 30;
    return Math.abs(dx) < 280 && dx * p.vx > 0;
  }).sort((a, b) => Math.abs(a.x - f.x) - Math.abs(b.x - f.x))[0];
}
function newAI() {
  return { tapAt: {}, thinkT: 0, walk: 0, stopDist: 120, seen: -1, blockT: 0, blockUntil: -1, blockLow: false, guardT: 0, plan: [], planStep: 0, expectSerial: -1, dashAt: -1, crouchT: 0, bikeUntil: 0 };
}
var PROFILE = {
  easy: { react: 22, block: 0.3, aggr: 0.35, spec: 0.25, combo: 2, mistake: 0.25, mash: 4.5, sup: 0.2 },
  normal: { react: 11, block: 0.6, aggr: 0.6, spec: 0.45, combo: 3, mistake: 0.12, mash: 7.5, sup: 0.5 },
  hard: { react: 4, block: 0.85, aggr: 0.85, spec: 0.7, combo: 4, mistake: 0.04, mash: 11, sup: 0.9 }
};
function aiMashRate(d) {
  return PROFILE[d].mash;
}
var rnd = Math.random;
function aiAct(g, f, diff) {
  const o = g.opp(f);
  const P = PROFILE[diff];
  const ai = f.ai;
  const pad = f.pad;
  const tk = g.tick;
  pad.set("charge", false, tk);
  for (const k in ai.tapAt) {
    const a = k;
    if (tk - ai.tapAt[a] >= 2) {
      pad.set(a, false, tk);
      delete ai.tapAt[a];
    }
  }
  const tap = (a) => {
    pad.set(a, true, tk);
    ai.tapAt[a] = tk;
  };
  if (f.ch === "jane" && f.move?.id === "s2") pad.set("s2", tk < ai.bikeUntil, tk);
  const dx = o.x - f.x;
  const dist = Math.abs(dx);
  const dir = dx >= 0 ? 1 : -1;
  const canAct = f.state === "ground" || f.state === "dash";
  const canPrepareGuard = ["ground", "dash", "hit", "block", "getup"].includes(f.state) && !f.ko;
  let block = false;
  let crouch = false;
  let forced = null;
  if (f.state === "block") {
    block = true;
    crouch = f.crouch;
  }
  const incoming = incomingProjectile(g, f);
  if (incoming && canPrepareGuard && rnd() < P.block * 0.12) ai.guardT = tk + 24;
  if (f.ch === "rickzera" && f.state === "jump" && f.airJumps < 2 && f.vy > 0 && dist > 170 && rnd() < P.aggr * 0.08) tap("up");
  if (f.ch === "renngotti" && f.state === "jump" && !f.airAttacked && Math.abs(o.y - f.y) < 125 && dist < 150 && rnd() < P.aggr * 0.2) tap(rnd() < 0.5 ? "p" : "k");
  const mv2 = o.move;
  if (o.state === "attack" && mv2 && !mv2.grab && o.serial !== ai.seen && dist < mv2.hb[1] + 60) {
    ai.seen = o.serial;
    if (rnd() < P.block) {
      ai.blockT = tk + P.react + Math.floor(rnd() * 4);
      ai.blockUntil = ai.blockT + mv2.startup + mv2.active + 6;
      ai.blockLow = mv2.level === "low";
    }
  }
  if (o.state === "attack" && mv2 && mv2.grab && dist < 170 && P.react < 12 && rnd() < 0.04 && canAct) tap("up");
  if (tk >= ai.blockT && tk <= ai.blockUntil && canPrepareGuard) {
    block = true;
    crouch = ai.blockLow;
  }
  if (tk < ai.guardT && canPrepareGuard && (dist < 230 || incoming)) {
    block = true;
    if (incoming?.move.level === "low") crouch = true;
  }
  if (f.manualFacing && f.facing !== dir && f.state === "ground" && f.landLag === 0) tap("turn");
  if (f.guardMeter < 22 && canAct && !incoming) {
    block = false;
    forced = -1;
    ai.guardT = 0;
  }
  if (ai.plan.length) {
    if (ai.planStep === 0) {
      if (f.state === "ground" && !block) {
        const a = ai.plan[0];
        ai.expectSerial = f.serial + 1;
        ai.planStep = 1;
        forced = a === "p" || a === "k" ? 0 : null;
        tap(a);
      }
    } else if (f.state === "attack" && f.serial === ai.expectSerial) {
      if (f.connected && ai.planStep < ai.plan.length) {
        const a = ai.plan[ai.planStep];
        ai.expectSerial = f.serial + 1;
        ai.planStep++;
        forced = 0;
        tap(a);
      } else if (!f.connected && f.move && f.moveT > f.move.startup + f.move.active + 2) {
        ai.plan = [];
        ai.planStep = 0;
      }
    } else if (f.state !== "attack") {
      ai.plan = [];
      ai.planStep = 0;
    }
    if (f.state === "attack" && f.connected && f.meter >= 100 && rnd() < P.sup * 0.05 && f.move && f.move.kind !== "super") tap("super");
  }
  if (canAct && !block && !ai.plan.length && tk >= ai.thinkT) {
    ai.thinkT = tk + 5 + Math.floor(rnd() * (10 + (1 - P.aggr) * 30));
    if (rnd() < P.mistake) {
      ai.walk = rnd() < 0.5 ? 0 : rnd() < 0.5 ? 1 : -1;
    } else decide();
  }
  if (canAct && canTransform(f) && tk % 90 === 0 && rnd() < 0.6) {
    tap("transform");
    return;
  }
  if (canAct && f.ch === "rickzera" && f.formT === 0 && f.energy < 22 && dist > 220) {
    for (const a of ["left", "right", "down", "block"]) pad.set(a, false, tk);
    f.pad.set("charge", true, tk);
    return;
  }
  if (canAct && f.exhaustT > 0) {
    f.pad.set("block", true, tk);
    return;
  }
  function startPlan(list) {
    const n = Math.max(1, Math.min(list.length, P.combo));
    ai.plan = list.slice(0, n);
    if (rnd() < P.spec && n >= 2) {
      const choices = f.ch === "caetano" ? ["s1", "s2", "s3"] : f.ch === "santox" ? ["s1", "s2"] : f.ch === "jao" ? ["s2", "s3"] : f.ch === "renngotti" ? ["s2", "s3"] : ["s1", "s3"];
      ai.plan[n - 1] = choices[Math.floor(rnd() * choices.length)];
    }
    ai.planStep = 0;
  }
  function decide() {
    const r = rnd();
    if (diff !== "easy" && dist < 105 && f.stamina > 48 && !o.guard && r < (diff === "hard" ? 0.25 : 0.12)) {
      ai.plan = [...SIGNATURES[f.ch].buttons];
      ai.planStep = 0;
      ai.walk = 0;
      return;
    }
    const oDown = o.state === "down" || o.state === "getup" || o.state === "launched";
    if (f.meter >= 100 && dist < 480 && (oDown || o.state === "hit" || o.state === "block" || rnd() < 0.2) && rnd() < P.sup) {
      tap("super");
      return;
    }
    if (dist < 82 && o.y === 0 && o.guard && o.blockstun <= 0 && o.throwShield === 0 && r < 0.3) {
      tap("grab");
      return;
    }
    if (o.move && o.state === "attack" && o.y === 0 && o.moveT >= o.move.startup + o.move.active && o.move.startup + o.move.active + o.move.recovery + (o.connected ? 0 : o.move.whiff) - o.moveT > f.def.moves.headbutt.startup + 2 && dist < f.def.moves.headbutt.hb[1] + o.def.pushW && r < P.aggr * 0.3) {
      tap("headbutt");
      ai.walk = 0;
      return;
    }
    if (f.ch === "caetano") {
      if (dist > 300) {
        ai.walk = 1;
        ai.stopDist = 150;
        if (r < 0.2 * P.aggr && f.state === "ground") ai.dashAt = tk + 4;
        else if (r < 0.28) tap("up");
      } else if (dist > 170) {
        if (r < 0.35 * P.spec + 0.1) tap("s2");
        else if (r < 0.5) {
          forced = -1;
          tap("k");
        } else if (r < 0.6 && oDown) tap("s3");
        else {
          ai.walk = 1;
          ai.stopDist = 110;
        }
      } else if (r < P.aggr) {
        const plans = [["p", "p", "p", "s1"], ["k", "k", "k", "s2"], ["p", "p", "k", "s1"], ["k", "p", "p", "s3"], ["p", "k", "p", "s1"]];
        startPlan(plans[Math.floor(rnd() * plans.length)]);
      } else if (r < P.aggr + 0.15) {
        ai.walk = -1;
        ai.stopDist = 400;
      } else ai.guardT = tk + 20 + Math.floor(rnd() * 30);
    } else if (f.ch === "jane") {
      if (dist > 420) {
        ai.walk = 1;
        ai.stopDist = 300;
        if (f.rangedCooldown === 0 && r < P.spec * 0.5) tap("s1");
      } else if (dist > 180 && f.rangedCooldown === 0) {
        tap("s1");
        ai.walk = dist < 230 ? -1 : 0;
        ai.stopDist = 270;
      } else if (dist < 120 && f.bikeCooldown === 0 && r < P.spec * 0.35) {
        ai.bikeUntil = tk + 45 + Math.floor(rnd() * 110);
        tap("s2");
        ai.walk = 0;
      } else if (dist < 150 && r < P.spec * 0.65) {
        tap("s3");
        ai.walk = 0;
      } else if (dist < 110 && r < P.aggr) startPlan(["p", "p", "k", "s3"]);
      else {
        ai.walk = dist < 180 ? -1 : 1;
        ai.stopDist = 260;
      }
    } else if (f.ch === "cristyan") {
      if (dist > 270) {
        ai.walk = 1;
        ai.stopDist = 140;
        if (r > 0.8) ai.dashAt = tk + 4;
      } else if (dist > 150) {
        if (r < P.spec * 0.55) tap("s1");
        else {
          ai.walk = 1;
          ai.stopDist = 95;
        }
      } else if (o.state === "attack" && o.move && o.moveT >= o.move.startup + o.move.active && r < P.spec) tap("s2");
      else if (r < P.aggr + 0.1) startPlan(rnd() < 0.5 ? ["p", "p", "k", "s1"] : ["k", "p", "k", "s3"]);
      else ai.guardT = tk + 22;
    } else if (f.ch === "eneas") {
      if (dist > 480) {
        ai.walk = 1;
        ai.stopDist = 320;
      } else if (dist > 150 && f.rangedCooldown === 0) {
        ai.walk = 0;
        tap(dist < 275 && r < 0.35 ? "s1" : r < 0.7 ? "s2" : "s3");
      } else if (dist < 145 && r < P.aggr) startPlan(["p", "k", "p", "s1"]);
      else {
        ai.walk = dist < 230 ? -1 : 1;
        ai.stopDist = 280;
        if (r > 0.75) ai.guardT = tk + 18;
      }
    } else if (f.ch === "santox") {
      if (o.state === "attack" && dist < 220 && f.fourthCooldown === 0 && r < P.spec * 0.6) {
        tap("s3");
        ai.walk = 0;
      } else if (dist > 390) {
        ai.walk = 1;
        ai.stopDist = 280;
        if (r > 0.85) tap("up");
      } else if (dist > 180) {
        ai.walk = dist < 240 ? -1 : 0;
        ai.stopDist = 270;
        if (f.rangedCooldown === 0 && r < P.spec + 0.1) tap("s1");
        else if (r > 0.8) ai.walk = 1;
      } else if (r < P.spec * 0.5) {
        tap("s2");
        ai.walk = 0;
      } else if (r < P.aggr + 0.15) startPlan(["p", "p", "k", "s1"]);
      else {
        ai.walk = -1;
        ai.stopDist = 260;
      }
    } else if (f.ch === "jao") {
      if (dist > 570) {
        ai.walk = 1;
        ai.stopDist = 400;
      } else if (dist > 180 && f.rangedCooldown === 0) {
        ai.walk = 0;
        if (!g.projectiles.some((p) => p.kind === "chess" && p.owner === f.idx && p.life > 0) && dist < 380 && r < 0.35) tap("s1");
        else tap(r < 0.65 ? "s2" : "s3");
      } else if (dist < 150 && r < P.aggr) startPlan(["p", "p", "k", "s3"]);
      else {
        ai.walk = dist < 260 ? -1 : 1;
        ai.stopDist = 310;
        if (r > 0.85) tap("up");
      }
    } else if (f.ch === "rickzera") {
      if (dist > 270) {
        ai.walk = dist > 620 || f.rangedCooldown > 0 ? 1 : 0;
        ai.stopDist = f.rangedCooldown > 0 ? 140 : 480;
        if (f.rangedCooldown === 0 && r < 0.45 * P.spec + 0.2) tap("s1");
        else if (r > 0.8 && dist < 550) tap("s3");
      } else if (dist > 145) {
        if (dist < 175 && o.y === 0 && r < 0.2 + P.spec * 0.35) tap("s2");
        else if (r < 0.5) tap("s3");
        else {
          ai.walk = 1;
          ai.stopDist = 100;
        }
      } else if (r < P.aggr) {
        startPlan(rnd() < 0.5 ? ["p", "p", "k", "s2"] : ["k", "p", "k", "s1"]);
      } else if (r > 0.82) {
        ai.walk = -1;
        ai.stopDist = 380;
      } else ai.guardT = tk + 22;
    } else if (f.ch === "aneninha") {
      if (dist > 290) {
        ai.walk = 1;
        ai.stopDist = 175;
        if (r > 0.8) tap("up");
      } else if (dist > 150) {
        if (r < 0.2 + P.spec * 0.4) tap("s3");
        else {
          ai.walk = 1;
          ai.stopDist = 105;
        }
      } else if (r < P.spec * 0.45) {
        tap(rnd() < 0.55 ? "s2" : "s1");
        ai.walk = 0;
      } else if (r < P.aggr + 0.15) {
        startPlan(rnd() < 0.5 ? ["p", "p", "k", "s1"] : ["k", "p", "p", "s3"]);
      } else ai.guardT = tk + 20;
    } else if (f.ch === "renngotti") {
      if (o.state === "launched" && o.y < -140 && dist < 180 && r < 0.7 * P.aggr) {
        ai.walk = 1;
        tap("up");
      } else if (dist > 300) {
        ai.walk = dist > 550 ? 1 : 0;
        ai.stopDist = 210;
        if (r < 0.25 + P.spec * 0.5) tap("s2");
        else {
          ai.walk = 1;
          ai.stopDist = 160;
        }
      } else if (dist > 150) {
        if (r < 0.2 + P.spec * 0.45) tap("s3");
        else if (r < 0.65) tap("s2");
        else {
          ai.walk = 1;
          ai.stopDist = 95;
        }
      } else if (dist < 115 && r < 0.15 + P.spec * 0.4) {
        tap("s1");
        ai.walk = 0;
      } else if (r < P.aggr + 0.15) {
        startPlan(rnd() < 0.5 ? ["p", "p", "k", "s3"] : ["k", "p", "p", "s2"]);
      } else ai.guardT = tk + 24;
    } else if (f.ch === "bieu") {
      if (dist > 245) {
        ai.walk = dist > 500 ? 1 : 0;
        ai.stopDist = 150;
        if (r < 0.25 + P.spec * 0.5) tap("s2");
        else {
          ai.walk = 1;
          ai.stopDist = 130;
        }
      } else if (dist > 150) {
        if (r < 0.25 + P.spec * 0.4) tap("s2");
        else {
          ai.walk = 1;
          ai.stopDist = 100;
        }
      } else if (r < P.spec * 0.45) {
        tap(rnd() < 0.55 ? "s3" : "s1");
      } else if (r < P.aggr + 0.2) {
        startPlan(rnd() < 0.5 ? ["p", "k", "p", "s1"] : ["k", "p", "k", "s3"]);
      } else ai.guardT = tk + 24;
    } else if (f.ch === "nomad") {
      if (dist > 220) {
        ai.walk = dist > 650 ? 1 : 0;
        ai.stopDist = 430;
        if (r < 0.3 + P.spec * 0.3) tap("s1");
        else if (r < 0.6 + P.spec * 0.25) tap(dist < 440 && rnd() < 0.55 ? "s3" : "s2");
        else ai.guardT = tk + 18;
      } else if (dist > 125) {
        if (r < 0.25 + P.spec * 0.4) tap("s3");
        else if (r < 0.65) tap("s1");
        else {
          ai.walk = 1;
          ai.stopDist = 100;
        }
      } else if (r < P.aggr + 0.1) {
        startPlan(rnd() < 0.5 ? ["p", "p", "k", "s1"] : ["k", "p", "p", "s3"]);
      } else ai.guardT = tk + 25;
    } else if (f.ch === "tubarao") {
      if (dist > 290) {
        ai.walk = 1;
        ai.stopDist = 120;
        if (r > 0.85) ai.dashAt = tk + 4;
      } else if (dist > 145) {
        ai.walk = 1;
        ai.stopDist = 90;
        if (r < 0.25 + P.spec * 0.4) tap("s1");
      } else if (dist < 130 && r < P.spec * 0.25 && !o.guard) {
        tap("s3");
        ai.walk = 0;
      } else if (dist < 115 && r < P.spec * 0.55) {
        tap("s2");
        ai.walk = 0;
      } else if (r < P.aggr + 0.1) {
        startPlan(rnd() < 0.5 ? ["p", "p", "k", "s1"] : ["k", "p", "p", "s3"]);
      } else ai.guardT = tk + 20;
    } else {
      if (dist > 340) {
        ai.walk = 1;
        ai.stopDist = 200;
        if (r < 0.1 * P.aggr) ai.dashAt = tk + 4;
      } else if (dist > 200) {
        if (r < 0.4 * P.spec + 0.05) tap("s1");
        else if (r < 0.2 + 0.45 * P.spec) tap("s3");
        else {
          ai.walk = 1;
          ai.stopDist = 130;
        }
      } else if (dist > 125) {
        if (r < 0.3 * P.spec + 0.05) tap("s3");
        else if (r < 0.55) {
          forced = -1;
          tap("p");
        } else {
          ai.walk = 1;
          ai.stopDist = 100;
        }
      } else if (r < 0.3 + 0.2 * P.spec) tap("s2");
      else if (r < P.aggr + 0.2) {
        const plans = [["p", "p", "p", "s1"], ["k", "k", "p", "s3"], ["p", "k", "k", "s1"], ["p", "p", "k", "s2"]];
        startPlan(plans[Math.floor(rnd() * plans.length)]);
      } else if (r < P.aggr + 0.3) {
        ai.walk = -1;
        ai.stopDist = 300;
      } else ai.guardT = tk + 20 + Math.floor(rnd() * 30);
    }
  }
  if (ai.walk === 1 && dist < ai.stopDist) ai.walk = 0;
  if (ai.walk === -1 && dist > ai.stopDist) ai.walk = 0;
  if (tk === ai.dashAt && canAct) {
    pad.tap(dir > 0 ? "right" : "left", tk);
    ai.walk = 1;
  }
  let w = block || crouch ? 0 : forced !== null ? forced : ai.walk;
  if (f.state === "attack") w = forced !== null ? forced : 0;
  if (f.state === "jump") w = ai.walk;
  const worldDir = w * dir;
  pad.set("right", worldDir > 0, tk);
  pad.set("left", worldDir < 0, tk);
  pad.set("block", block, tk);
  pad.set("down", crouch, tk);
}

// src/game/balance.ts
var SUPER_STARTUP_FRAMES = 12;
var SUPER_CAPTURE_HEIGHT = 100;
var MICROPHONE_LIMIT = 2;
var CONFIRMED_SPECIAL_LINKS = { orango: "s1", jao: "s2", eneas: "s2", ulisses: "s1", felipence: "s1", patrick: "s1", hdsh: "s2", gabrielzin: "s1" };
var LINK_STARTUP_CREDIT = 8;
var COMBO_SCALE = [1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2];
function comboDamageScale(priorHits) {
  return COMBO_SCALE[Math.min(COMBO_SCALE.length - 1, Math.max(0, Math.floor(priorHits)))];
}

// src/game/engine.ts
var GRAV = 0.85;
var METER_GAIN_SCALE = 0.5;
var CANCEL_CONFIRM_FRAMES = 6;
var DASH_COMMIT_FRAMES = 4;
var PERFECT_GUARD_FRAMES = 3;
var PRECISION_GUARD_FRAMES = 5;
var GUARD_READY_FEEDBACK_FRAMES = 36;
var SUPER_SEQUENCE = { caetano: "superC", orango: "superO", tubarao: "superT", rickzera: "superR", bieu: "superB", nomad: "superN", renngotti: "superG", aneninha: "superA", santox: "superS", jao: "superJ", jane: "superJane", cristyan: "superCristyan", eneas: "superEneas", patrick: "superWoc", gabrielzin: "superWoc", ulisses: "superWoc", felipence: "superWoc", hdsh: "superWoc" };
var easeOut = (u) => 1 - (1 - u) * (1 - u);
var clamp4 = (v, a, b) => Math.max(a, Math.min(b, v));
var rand = (a, b) => a + Math.random() * (b - a);
function makeFighter(idx, ch, cpu) {
  const def = CHARS[ch];
  const pose = { ...def.poses.idle };
  return {
    idx,
    ch,
    def,
    x: idx === 0 ? 560 : 1040,
    y: 0,
    vx: 0,
    vy: 0,
    facing: idx === 0 ? 1 : -1,
    manualFacing: false,
    ...freshResources(),
    hp: def.hp,
    maxHp: def.hp,
    dispHp: def.hp,
    meter: 0,
    state: "ground",
    stateT: 0,
    move: null,
    moveT: 0,
    connected: false,
    contact: "pending",
    contactFrame: -1,
    poseName: "idle",
    impact: null,
    groundSmash: false,
    guardMeter: GUARD_RULES.max,
    guardDelay: 0,
    guardBreakT: 0,
    resonance: 0,
    resonanceT: 0,
    hitDone: false,
    hbActive: false,
    serial: 0,
    hitstun: 0,
    blockstun: 0,
    stunLow: false,
    crouch: false,
    guard: false,
    guardSpentAt: -999,
    guardResult: "none",
    guardResultT: 0,
    guardReadyT: 0,
    walking: 0,
    landLag: 0,
    airAttacked: false,
    airJumps: 0,
    precision: 0,
    parryCooldown: 0,
    momentum: 0,
    momentumT: 0,
    throwShield: 0,
    throwTechUntil: 0,
    rangedUses: 0,
    rangedCooldown: 0,
    fourthCooldown: 0,
    bikeCooldown: 0,
    bikeTicks: 0,
    bikeHits: 0,
    bikeNextHit: 0,
    bikeDizzy: 0,
    hidden: false,
    juggle: 0,
    invuln: 0,
    armor: false,
    ko: false,
    pad: new Pad(),
    cpu,
    ai: newAI(),
    pose,
    poseOverride: null,
    rig: computeRig(ch, pose),
    animT: Math.floor(Math.random() * 100),
    turn: 1,
    rotAdd: 0,
    exprT: 0,
    exprOverride: "n",
    expr: "n",
    glow: 0,
    aura: 0,
    trail: [],
    comboHits: 0,
    comboDmg: 0,
    comboMoves: [],
    comboKind: "basic",
    comboLastSerial: -1,
    comboResult: null,
    wins: 0
  };
}
var Game = class {
  // Only used within one synchronous step; snapshots cannot occur mid-step.
  // A super capture on the exact recovery frame must not reset combo scaling.
  recoveredCombos = /* @__PURE__ */ new Map();
  coach = null;
  trainingLog = [];
  cfg;
  reborn = null;
  randomState = 0;
  f;
  tick = 0;
  hitstop = 0;
  slowmo = 0;
  paused = false;
  phase = "intro";
  phaseT = 0;
  round = 1;
  winsNeeded = 2;
  timeLeft = 99;
  timeAcc = 0;
  cam = { x: 800, zoom: 1 };
  camOv = null;
  camOvT = 0;
  parts = [];
  arena = { damage: [0, 0, 0], slot: -1, tick: -999, serial: 0 };
  projectiles = [];
  flash = { c: "#fff", a: 0 };
  shake = 0;
  ann = null;
  moveBanner = null;
  seq = null;
  cine = null;
  clash = null;
  expl = null;
  comboShow = [
    { hits: 0, dmg: 0, t: 0 },
    { hits: 0, dmg: 0, t: 0 }
  ];
  train = { dummy: 0, lastDmg: 0, combo: 0, total: 0, idle: 0, maxCombo: 0 };
  challenge = null;
  challengeSuperSerial = -1;
  hype = 0;
  speed = 0;
  // intensidade de linhas de velocidade
  perfect = false;
  winner = -1;
  finisher = null;
  finishedBy = null;
  elapsedTicks = 0;
  onEvent;
  onlineInputs = [0, 0];
  onlinePressed = [0, 0];
  clock = new FrameTimer();
  previousVisual = null;
  get renderFraction() {
    return this.clock.fraction;
  }
  keyHandler;
  constructor(cfg, onEvent) {
    this.cfg = cfg;
    this.randomState = cfg.reborn?.seed ?? 0;
    audio.setArena(cfg.stage || "dojo");
    this.onEvent = onEvent;
    const other = cfg.p2;
    this.f = [makeFighter(0, cfg.p1, false), makeFighter(1, other, cfg.mode === "ai")];
    if (cfg.reborn?.npc) applyTrainingNpc(this.f[1], cfg.reborn.npc);
    this.keyHandler = (code, e) => this.onKey(code, e);
    if (!cfg.headless) {
      keyboard.attach();
      keyboard.listeners.push(this.keyHandler);
    }
    if (cfg.reborn) this.f.forEach((f, i) => f.animT = (cfg.reborn.seed >>> i * 8 >>> 0) % 100);
    this.resetMatch();
    if (cfg.reborn) {
      this.reborn = new TrainingSession(this, cfg.reborn);
      this.reborn.setup();
    }
  }
  random() {
    if (!this.cfg.reborn) return Math.random();
    this.randomState = Math.imul(this.randomState, 1664525) + 1013904223 >>> 0;
    return this.randomState / 4294967296;
  }
  get infiniteTrainingResources() {
    return this.training && !this.reborn;
  }
  get sandboxTraining() {
    return this.training && !this.reborn?.finite;
  }
  combatEvent(type, a, d = this.opp(a), move = a.move?.id ?? "", amount = 0) {
    if (!this.reborn) return;
    const m = a.move ?? a.def.moves[move];
    this.reborn.combat({ type, tick: this.tick, actor: a.idx, target: d.idx, move, serial: a.serial, amount, hits: d.comboHits, combo: d.comboKind, low: m?.level === "low", air: a.y < 0, targetAir: d.y < 0, perfect: d.guardResult === "perfect" || d.guardResult === "precision" });
  }
  replaceTrainingOpponent(ch, npc) {
    if (!this.reborn || !this.reborn.finite && !this.reborn.isLab) return false;
    this.f[1] = makeFighter(1, ch, true);
    if (npc) applyTrainingNpc(this.f[1], npc);
    this.f[1].animT = (this.cfg.reborn.seed + CHAR_IDS.indexOf(ch)) % 100;
    this.resetRound();
    return true;
  }
  destroy() {
    if (!this.cfg.headless) {
      keyboard.listeners = keyboard.listeners.filter((l) => l !== this.keyHandler);
      keyboard.detach();
    }
    audio.stopMusic();
  }
  get training() {
    return this.cfg.mode === "training";
  }
  opp(f) {
    return this.f[1 - f.idx];
  }
  // ------------------------------------------------------------ controle de partida
  resetMatch() {
    if (this.challenge) this.challenge = { id: this.challenge.id, current: 0, done: false, seen: [] };
    for (const f of this.f) {
      f.wins = 0;
      f.meter = 0;
      Object.assign(f, freshResources());
    }
    this.round = 1;
    this.finisher = null;
    this.finishedBy = null;
    this.elapsedTicks = 0;
    this.winner = -1;
    this.resetRound();
    audio.music("fight");
  }
  restart() {
    this.resetClock();
    this.paused = false;
    this.resetMatch();
  }
  resetRound() {
    if (!this.cfg.headless) {
      keyboard.pressed.clear();
      touchInput.pressed.clear();
    }
    for (const f of this.f) {
      f.x = f.idx === 0 ? 560 : 1040;
      f.y = 0;
      f.vx = f.vy = 0;
      f.facing = f.idx === 0 ? 1 : -1;
      f.manualFacing = false;
      f.hp = f.maxHp;
      f.dispHp = f.maxHp;
      f.state = "ground";
      f.stateT = 0;
      f.move = null;
      f.contact = "pending";
      f.contactFrame = -1;
      f.poseName = "idle";
      f.impact = null;
      f.groundSmash = false;
      f.hbActive = false;
      f.hitstun = f.blockstun = 0;
      f.landLag = 0;
      f.invuln = 0;
      f.armor = false;
      f.ko = false;
      f.crouch = f.guard = false;
      f.guardSpentAt = -999;
      f.guardResult = "none";
      f.guardResultT = f.guardReadyT = 0;
      f.guardMeter = GUARD_RULES.max;
      f.guardDelay = f.guardBreakT = f.resonance = f.resonanceT = 0;
      f.poseOverride = null;
      f.rotAdd = 0;
      f.turn = 1;
      f.glow = f.aura = 0;
      f.comboHits = f.comboDmg = 0;
      f.comboMoves = [];
      f.comboKind = "basic";
      f.comboLastSerial = -1;
      f.comboResult = null;
      f.juggle = 0;
      f.airJumps = 0;
      f.throwTechUntil = 0;
      f.precision = f.parryCooldown = f.momentum = f.momentumT = f.throwShield = 0;
      f.rangedUses = 0;
      f.rangedCooldown = 0;
      f.fourthCooldown = 0;
      f.bikeCooldown = f.bikeTicks = f.bikeHits = f.bikeNextHit = f.bikeDizzy = 0;
      f.airAttacked = false;
      f.hidden = false;
      f.trail = [];
      f.pad.reset();
      f.ai = newAI();
      f.pose = { ...f.def.poses.idle };
    }
    this.seq = this.cine = this.clash = this.expl = null;
    this.projectiles = [];
    this.arena = { damage: [0, 0, 0], slot: -1, tick: -999, serial: 0 };
    this.comboShow = [{ hits: 0, dmg: 0, t: 0 }, { hits: 0, dmg: 0, t: 0 }];
    this.hitstop = 0;
    this.slowmo = 0;
    this.timeLeft = 99;
    this.timeAcc = 0;
    this.perfect = false;
    this.parts = this.parts.filter((p) => p.type === "leaf");
    this.phaseT = 0;
    this.phase = this.training ? "fight" : "intro";
    this.trainingLog = [];
    if (this.coach) this.coach = newComboCoach(this.coach.routeId);
    this.camOv = null;
    if (this.training) this.announce("TREINAMENTO", "", 60, "#fbbf24");
  }
  startChallenge(id) {
    this.coach = null;
    if (!this.training || id && !challengeAvailable(id, this.f[0].ch)) return;
    this.challenge = id ? { id, current: 0, done: false, seen: [] } : null;
    this.challengeSuperSerial = -1;
    const def = id ? challengeDefinition(id) : null, cpu = !!def && "cpu" in def && def.cpu;
    this.train.dummy = cpu ? 1 : 0;
    this.f[1].cpu = this.train.dummy === 1;
    this.resetPositions();
    this.f[0].x = 650;
    this.f[1].x = cpu ? 830 : 760;
    this.train.lastDmg = this.train.combo = this.train.total = this.train.maxCombo = 0;
  }
  challengeEvent(metric, amount = 1, token = "") {
    this.reborn?.metric(metric, amount, token);
    const c = this.challenge;
    if (!this.training || !c || c.done) return;
    const def = challengeDefinition(c.id);
    if (def.metric !== metric) return;
    if (metric === "special") {
      if (c.seen.includes(token)) return;
      c.seen.push(token);
    }
    c.current = Math.min(def.target, metric === "combo" ? Math.max(c.current, amount) : c.current + amount);
    if (c.current >= def.target) {
      c.done = true;
      saveChallengeBadge(c.id);
      audio.confirm();
    }
  }
  startComboLesson(id) {
    if (!this.training || this.cfg.online) return false;
    const route = id ? comboRoute(id) : null;
    if (id && (!route || route.ch !== this.f[0].ch)) return false;
    this.coach = null;
    this.challenge = null;
    this.train.dummy = 0;
    if (!this.cfg.headless) {
      keyboard.down.clear();
      keyboard.pressed.clear();
      touchInput.clear();
    }
    this.resetPositions();
    this.f[0].x = 600;
    this.f[1].x = 600 + this.f[0].def.pushW + this.f[1].def.pushW + 5;
    if (id) this.coach = newComboCoach(id);
    this.ann = null;
    this.moveBanner = null;
    this.train.lastDmg = this.train.combo = this.train.total = 0;
    return true;
  }
  trainingEvent(type, f, move = "", target = this.opp(f), serial = f.serial) {
    if (!this.training) return;
    this.combatEvent(type, f, target, move);
    const e = { type, actor: f.idx, move, serial, tick: this.tick, hits: type === "free" ? f.comboHits : target.comboHits, damage: type === "free" ? f.comboDmg : target.comboDmg };
    this.trainingLog.push(e);
    if (this.trainingLog.length > 96) this.trainingLog.shift();
    if (this.coach) advanceComboCoach(this.coach, e);
  }
  resetPositions() {
    this.resetRound();
    for (const f of this.f) f.meter = RESOURCE_RULES.meterMax;
    if (this.coach) {
      this.f[0].x = 600;
      this.f[1].x = 600 + this.f[0].def.pushW + this.f[1].def.pushW + 5;
      this.ann = null;
      this.moveBanner = null;
    }
  }
  onKey(code, e) {
    if (this.reborn && e.target instanceof Element && e.target.closest('button,input,select,textarea,[contenteditable="true"],[role="dialog"]')) return;
    const bound = this.cfg.bindings.some((b) => Object.values(b).some((c) => c.includes(code)));
    if (bound || code === "Escape" || code === "Space") e.preventDefault();
    if (e.repeat || this.reborn?.result) return;
    if (code === "Escape" || code === "KeyP") {
      if (!this.cfg.online) this.togglePause();
    } else if (this.training && !this.paused && (!this.reborn || this.reborn.isLab)) {
      if (code === "KeyR") {
        if (this.reborn?.isLab) this.reborn.configureLab(this.reborn.lab);
        else this.resetPositions();
      }
      if (code === "KeyT") {
        if (this.reborn?.isLab) {
          const modes = ["idle", "adaptive", "script", "p2"];
          this.reborn.configureLab({ ...this.reborn.lab, dummy: modes[(modes.indexOf(this.reborn.lab.dummy) + 1) % modes.length] });
        } else {
          this.train.dummy = (this.train.dummy + 1) % 4;
          this.f[1].cpu = this.train.dummy === 1;
          this.f[1].pad.reset();
        }
      }
    }
  }
  togglePause(v) {
    if (this.phase === "matchEnd" && !this.reborn) return;
    this.paused = v === void 0 ? !this.paused : v;
    this.resetClock();
    if (!this.cfg.headless) {
      keyboard.pressed.clear();
      touchInput.pressed.clear();
      if (this.reborn) {
        keyboard.down.clear();
        touchInput.clear();
        for (const f of this.f) f.pad.reset();
      }
    }
    this.onEvent({ type: "pause", paused: this.paused });
  }
  // Inspection helpers are offline-training only, with the match remaining paused.
  stepTrainingFrame() {
    if (!this.training || this.cfg.online || !this.paused) return false;
    this.paused = false;
    try {
      this.step();
    } finally {
      this.paused = true;
    }
    return true;
  }
  previewTrainingMove(id) {
    const f = this.f[0];
    if (!this.training || this.cfg.online || !this.paused || this.phase !== "fight" || this.cine || this.seq || this.clash || f.state !== "ground" || f.y !== 0 || f.landLag > 0) return false;
    if (id === "super") {
      this.startSuper(f);
      return true;
    }
    const move = f.def.moves[id];
    if (!move || move.air) return false;
    return this.startMove(f, move);
  }
  announce(text, sub = "", dur = 70, color = "#ffffff") {
    this.ann = { text, sub, t: 0, dur, color };
  }
  // ------------------------------------------------------------ loop
  resetClock() {
    this.clock.rebase();
    this.previousVisual = null;
  }
  advance(nowMs) {
    const ticks = this.clock.sample(nowMs, !this.paused);
    for (let i = 0; i < ticks && !this.paused; i++) {
      this.previousVisual = [captureMotion(this.f[0]), captureMotion(this.f[1])];
      this.step();
    }
  }
  pollInputs() {
    if (this.cfg.trainingInput) {
      const input = this.cfg.trainingInput(this.tick);
      ACTIONS.forEach((a, i) => {
        this.f[0].pad.set(a, !!(input.held & 1 << i), this.tick);
        if (input.pressed & 1 << i && this.f[0].pad.pressedAt[a] !== this.tick) this.f[0].pad.tap(a, this.tick);
      });
      return;
    }
    if (this.cfg.headless) return;
    if (this.cfg.online) {
      keyboard.consumePressed();
      for (const f of this.f) {
        ACTIONS.forEach((a, i) => {
          const held = !!(this.onlineInputs[f.idx] & 1 << i);
          if (f.idx === 1 && this.clash && a === (this.clash.kind === "super" ? "super" : "p")) f.pad.held[a] = held;
          else f.pad.set(a, held, this.tick);
          if (this.onlinePressed[f.idx] & 1 << i && f.pad.pressedAt[a] !== this.tick) f.pad.tap(a, this.tick);
        });
        this.onlinePressed[f.idx] = 0;
      }
      return;
    }
    const m = this.cfg.mode;
    const human = m === "versus" ? [true, true] : m === "ai" ? [true, false] : [true, this.train.dummy === 3];
    const presses = keyboard.consumePressed();
    for (let i = 0; i < 2; i++) if (human[i]) this.f[i].pad.pollKeys(this.cfg.bindings[i], this.tick, i === 0, presses);
  }
  step() {
    if (this.paused) return;
    this.reborn?.beforeTick();
    this.stepCore();
    this.reborn?.afterTick();
  }
  stepCore() {
    if (this.paused) return;
    this.recoveredCombos.clear();
    this.tick++;
    for (const f of this.f) {
      if (f.fourthCooldown > 0) f.fourthCooldown--;
      if (f.bikeCooldown > 0) f.bikeCooldown--;
      if (f.rangedCooldown > 0 && --f.rangedCooldown === 0) {
        f.rangedUses = 0;
        if (f.idx === 0) this.challengeEvent("range");
      }
    }
    this.pollInputs();
    this.reborn?.recordInputs();
    if (this.phase === "intro" && this.phaseT >= 30 && this.f.some((f) => f.pad.buffered("p", this.tick) || f.pad.buffered("k", this.tick))) {
      this.phase = "fight";
      this.phaseT = 0;
      for (const f of this.f) {
        f.pad.consume("p");
        f.pad.consume("k");
      }
      this.announce("FIGHT!", "", 35, "#fb923c");
      audio.gong();
    }
    for (const f of this.f) if (f.ch === "jane" && f.formT === 0 && f.move?.id === "s2" && f.bikeCooldown === 0 && f.moveT >= f.move.startup && f.moveT <= f.move.startup + f.move.active) {
      f.bikeTicks++;
      if (f.bikeTicks > 300) this.stopBike(f, true);
      else if (f.bikeTicks >= 12 && !f.pad.held.s2) this.stopBike(f);
    }
    if (this.phase === "fight") this.elapsedTicks++;
    for (const f of this.f) {
      if (f.precision > 0) f.precision--;
      if (f.parryCooldown > 0) f.parryCooldown--;
      if (f.momentumT > 0 && --f.momentumT === 0) f.momentum = 0;
    }
    if (this.phase === "finishWindow" || this.phase === "finisher") {
      this.updateFinish();
      return;
    }
    if (this.phase !== "fight") for (const f of this.f) f.pad.reset();
    if (this.camOvT > 0) this.camOvT--;
    else this.camOv = null;
    this.shake *= 0.88;
    if (this.shake < 0.3) this.shake = 0;
    if (this.flash.a > 0) this.flash.a = Math.max(0, this.flash.a - 0.035);
    if (this.ann) {
      this.ann.t++;
      if (this.ann.t > this.ann.dur) this.ann = null;
    }
    if (this.moveBanner) {
      this.moveBanner.t++;
      if (this.moveBanner.t > this.moveBanner.dur) this.moveBanner = null;
    }
    for (const c of this.comboShow) if (c.t > 0) c.t--;
    for (const f of this.f) f.dispHp += (f.hp - f.dispHp) * (f.hp < f.dispHp ? 0.04 : 1);
    if (this.speed > 0) this.speed = Math.max(0, this.speed - 0.04);
    if (this.expl) {
      this.expl.t++;
      if (this.expl.t > this.expl.dur) this.expl = null;
    }
    if (this.hitstop > 0) {
      for (const f of this.f) f.pad.freezeBuffers(this.tick);
      this.hitstop--;
      this.updateCamera();
      return;
    }
    if (this.slowmo > 0) {
      this.slowmo--;
      if (this.tick % 3 !== 0) {
        for (const f of this.f) f.pad.freezeBuffers(this.tick);
        this.updateCamera();
        return;
      }
    }
    if (this.clash) {
      this.updateClash();
      this.updateFx();
      this.updateCamera();
      return;
    }
    if (this.cine) {
      this.reborn?.controlOpponent();
      const rival = this.opp(this.cine.f);
      const free = !rival.ko && rival.y === 0 && (rival.state === "ground" && rival.landLag === 0 || rival.state === "dash" && rival.stateT >= DASH_COMMIT_FRAMES);
      if (this.cine.next === void 0 && free && rival.pad.buffered("super", this.tick) && this.canSuper(rival)) {
        rival.pad.consume("super");
        this.startSuper(rival);
      }
      this.updateCine();
      this.updateFx();
      this.updateCamera();
      return;
    }
    if (this.seq) {
      this.updateSeq();
      this.updateFx();
      this.updateCamera();
      return;
    }
    this.updatePhase();
    if (this.phase === "fight") for (const f of this.f) this.updateResources(f);
    if (this.phase === "fight") {
      const [a, b] = this.f;
      if (this.cfg.mode === "ai") aiAct(this, b, this.cfg.difficulty);
      if (this.training && this.reborn) this.reborn.controlOpponent();
      else if (this.training) {
        const d = this.train.dummy;
        if (d === 1) aiAct(this, b, "normal");
        else if (d === 2) {
          b.pad.set("block", true, this.tick);
          const incomingLow = this.projectiles.some((p) => p.owner !== b.idx && p.move.level === "low" && Math.abs(p.x - b.x) < 280 && (p.vx === 0 || (b.x - p.x) * p.vx > 0));
          b.pad.set("down", !!a.move && a.move.level === "low" || incomingLow, this.tick);
        } else if (d === 0) {
          b.pad.reset();
          if (this.coach && this.coach.progress > 0) b.pad.set("block", true, this.tick);
        }
        a.meter = b.meter = RESOURCE_RULES.meterMax;
      }
    }
    for (const f of this.f) this.updateFighter(f, this.opp(f));
    this.resolvePush();
    for (const f of this.f) this.clampX(f);
    this.updateProjectiles();
    this.resolveHits();
    for (const f of this.f) this.animate(f);
    this.updateFx();
    this.updateCamera();
    this.updateTraining();
  }
  // ------------------------------------------------------------ fases do round
  updatePhase() {
    this.phaseT++;
    const [a, b] = this.f;
    switch (this.phase) {
      case "intro":
        if (this.phaseT === 1) {
          const last = a.wins + 1 >= this.winsNeeded && b.wins + 1 >= this.winsNeeded;
          this.announce(last ? "ROUND FINAL" : `ROUND ${this.round}`, "", 70, "#fde68a");
          audio.bell();
          if (this.round !== 1) audio.say(last ? "Round final" : `Round ${this.round}`, 0.8, 0.95);
        }
        if (this.round === 1 && this.phaseT === 8) audio.say(matchupLine(a.ch, b.ch), 1.2, 1.25);
        if (this.round === 1 && this.phaseT === 130) audio.say(matchupLine(b.ch, a.ch), 1.2, 1.25);
        if (this.phaseT === (this.round === 1 ? 245 : 72)) {
          this.announce("FIGHT!", "", 50, "#fb923c");
          audio.gong();
          audio.say("Liberou o dedilho!", 1.1, 1.3);
        }
        if (this.phaseT >= (this.round === 1 ? 285 : 110)) {
          this.phase = "fight";
          this.phaseT = 0;
        }
        break;
      case "fight":
        if (!this.sandboxTraining) {
          this.timeAcc++;
          if (this.timeAcc >= 60) {
            this.timeAcc = 0;
            this.timeLeft--;
            if (this.timeLeft <= 0) this.timeUp();
          }
        }
        break;
      case "ko": {
        const loser = a.ko ? a : b;
        if (this.phaseT > 100 && a.ko && b.ko && a.state === "down" && b.state === "down") this.endRound(-1);
        else if (this.phaseT > 100 && loser.state === "down") this.endRound(loser === a ? 1 : 0);
        else if (this.phaseT > 400) this.endRound(loser === a ? 1 : 0);
        break;
      }
      case "roundEnd":
        if (this.phaseT >= (a.wins >= this.winsNeeded || b.wins >= this.winsNeeded ? 70 : 160)) {
          const done = a.wins >= this.winsNeeded || b.wins >= this.winsNeeded;
          if (done && a.wins !== b.wins) {
            this.winner = a.wins > b.wins ? 0 : 1;
            if (this.f[1 - this.winner].ko) {
              this.phase = "finishWindow";
              this.phaseT = 0;
              this.hitstop = this.slowmo = 0;
              for (const f of this.f) {
                const held = f.pad.held.super;
                f.move = null;
                f.hbActive = false;
                f.pad.reset();
                f.pad.held.super = held;
              }
              this.announce("HORA DO FINISHER!", "ULT PARA FINALIZAR \xB7 OU AGUARDE", 240, "#fde047");
              audio.say("Fecha a conta com um finisher!", 1.2, 1.15);
            } else this.completeMatch();
          } else {
            this.round++;
            this.resetRound();
          }
        }
        break;
      default:
        break;
    }
  }
  requestFinisher(idx) {
    if (this.phase !== "finishWindow" || idx !== this.winner) return false;
    this.finisher = { winner: idx, t: 0, dur: 210 };
    this.finishedBy = idx;
    this.phase = "finisher";
    this.phaseT = 0;
    this.ann = null;
    this.projectiles = [];
    this.seq = this.cine = this.clash = null;
    audio.boom(1.1);
    audio.say(FINISHER_CALLS[this.f[idx].ch], 1.2, 1.1);
    return true;
  }
  updateFinish() {
    this.phaseT++;
    if (this.phase === "finishWindow") {
      const f = this.f[this.winner];
      if (f.pad.buffered("super", this.tick) || f.cpu && this.phaseT === 70) this.requestFinisher(this.winner);
      else if (this.phaseT >= 240) this.completeMatch();
    } else if (this.finisher) {
      this.finisher.t++;
      if (this.finisher.t === 95) audio.boom(1.6);
      if (this.finisher.t >= this.finisher.dur) this.completeMatch();
    }
  }
  completeMatch() {
    if (this.phase === "matchEnd") return;
    this.phase = "matchEnd";
    this.phaseT = 0;
    this.finisher = null;
    this.ann = null;
    audio.music("victory");
    audio.say(`${this.finishedBy !== null ? "Finisher! " : ""}Vit\xF3ria de ${this.f[this.winner].def.short}! ${victoryLine(this.f[this.winner].ch, this.f[1 - this.winner].ch)}`, 1.1, 1.15);
    this.onEvent({ type: "matchEnd", winner: this.winner });
  }
  timeUp() {
    const [a, b] = this.f;
    this.announce("TEMPO!", "", 80, "#fde68a");
    const pa = a.hp / a.maxHp;
    const pb = b.hp / b.maxHp;
    if (Math.abs(pa - pb) < 1e-4) this.endRound(-1);
    else this.endRound(pa > pb ? 0 : 1);
  }
  endRound(w) {
    this.phase = "roundEnd";
    this.phaseT = 0;
    this.slowmo = 0;
    if (w < 0) {
      this.announce("EMPATE", "", 100, "#fde68a");
      return;
    }
    const win = this.f[w];
    const lose = this.f[1 - w];
    win.wins++;
    win.state = "win";
    win.stateT = 0;
    win.vx = 0;
    win.y = 0;
    win.move = null;
    win.poseOverride = null;
    win.glow = win.aura = 0;
    if (lose.state !== "down") {
      lose.state = "down";
      lose.stateT = 0;
      lose.ko = true;
      lose.y = 0;
      lose.vx = 0;
    }
    this.perfect = win.hp >= win.maxHp;
    if (this.perfect) {
      this.announce("PERFECT", "", 110, "#fde047");
      audio.say("Perfeito!", 0.8, 1);
    }
    if (win.ch === "orango") audio.roar();
    this.hype = 1;
  }
  triggerKO(a, d) {
    if (this.sandboxTraining) {
      d.hp = d.maxHp;
      return;
    }
    if (this.phase !== "fight") return;
    this.phase = "ko";
    this.phaseT = 0;
    d.ko = true;
    const decisive = a.wins + 1 >= this.winsNeeded;
    this.slowmo = decisive ? 110 : 60;
    this.hitstop = Math.max(this.hitstop, 14);
    this.announce("K.O.", "", 130, "#ef4444");
    audio.ko();
    audio.say("Nocaute!", 0.7, 0.9);
    this.flash = { c: "#ffffff", a: 1 };
    this.shake = Math.max(this.shake, 30);
    this.hype = 1;
    this.camOv = { x: d.x, zoom: decisive ? 1.7 : 1.4 };
    this.camOvT = 90;
    if (d.state !== "launched" && d.state !== "seq") {
      d.state = "launched";
      d.vy = -11;
      d.vx = a.facing * 7;
      d.y = Math.min(d.y, -2);
    }
  }
  // ------------------------------------------------------------ atualização do lutador
  updateResources(f) {
    if (f.guardBreakT > 0) {
      f.guardBreakT--;
      if (f.guardBreakT === 0) f.guardMeter = Math.max(f.guardMeter, GUARD_RULES.restore);
    }
    if (f.guardDelay > 0) f.guardDelay--;
    else if (f.guardBreakT === 0 && f.state === "ground" && !f.guard) f.guardMeter = Math.min(GUARD_RULES.max, f.guardMeter + GUARD_RULES.regen);
    if (f.resonanceT > 0) {
      f.resonanceT--;
      if (f.resonanceT === 0) f.resonance = 0;
    }
    f.charging = false;
    if (f.confusionT > 0) f.confusionT--;
    if (f.predictionCooldown > 0) f.predictionCooldown--;
    if (f.aftermathT > 0) f.aftermathT--;
    if (f.exhaustT > 0) {
      f.exhaustT--;
      if (f.exhaustT === 0 && f.stamina < RESOURCE_RULES.exhaustRelease) f.exhaustT = 1;
    }
    if (f.staminaDelay > 0) f.staminaDelay--;
    if (f.formT > 0) {
      f.formElapsed++;
      f.formT--;
      payStamina(f, FORMS[f.ch].drain);
      if (f.ch === "jane") f.battery = Math.max(0, f.battery - 0.1);
      if (f.ch === "ulisses" && f.formElapsed % 300 === 0 && f.blood > 0) {
        f.blood--;
        f.hp = Math.min(f.maxHp, f.hp + 100);
        this.text(f.x, FLOOR_Y - 205, "REGENERA\xC7\xC3O +100", f.def.glow, 20);
      }
      if (f.formT === 0) this.endTransformation(f);
    } else if (f.formStartup === 0) {
      if (f.staminaDelay === 0 && ["ground", "jump", "getup", "down"].includes(f.state)) {
        const before = f.stamina;
        f.stamina = Math.min(RESOURCE_RULES.staminaMax, f.stamina + (f.state === "ground" && Math.abs(f.vx) < 0.2 ? RESOURCE_RULES.regenIdle : RESOURCE_RULES.regenMoving));
        if (f.idx === 0) this.challengeEvent("stamina", f.stamina - before);
      }
      if (f.ch === "jane") f.battery = Math.min(100, f.battery + 0.06);
    }
  }
  beginTransformation(f) {
    if (f.npc || !canTransform(f)) return false;
    f.meter -= RESOURCE_RULES.transformationCost;
    payStamina(f, 12);
    if (f.ch === "rickzera") f.energy = 0;
    if (f.ch === "nomad") {
      f.hp -= f.maxHp * 0.1;
      f.formVariant = (this.tick + f.serial * 7) % 3;
    }
    f.formStartup = RESOURCE_RULES.activationFrames;
    f.formElapsed = 0;
    f.state = "transform";
    f.stateT = 0;
    f.move = null;
    f.hbActive = false;
    f.guard = false;
    f.vx = f.vy = 0;
    f.poseOverride = "taunt";
    this.moveBanner = { text: FORMS[f.ch].name, color: f.def.color, t: 0, dur: 120 };
    this.text(f.x, FLOOR_Y - 215, "TRANSFORMA\xC7\xC3O \xB7 PREPARA\xC7\xC3O VULNER\xC1VEL", f.def.glow, 18);
    transformationAudio(f.ch);
    return true;
  }
  endTransformation(f) {
    f.formT = 0;
    f.formStartup = 0;
    f.aftermathT = FORMS[f.ch].aftermath;
    f.formShield = 0;
    if (f.ch === "rickzera") f.energy = 0;
    if (f.ch === "jane") f.battery = 0;
    f.exhaustT = Math.max(f.exhaustT, 90);
    f.staminaDelay = 32;
    this.text(f.x, FLOOR_Y - 205, f.ch === "renngotti" ? "BERSERKER \xB7 RECUPERA\xC7\xC3O 15s" : f.ch === "tubarao" ? "FILHOTE \xB7 CRESCIMENTO" : "FORMA ENCERRADA", f.def.glow, 20);
  }
  canSuper(f) {
    return !f.npc && (f.meter >= 100 || this.infiniteTrainingResources) && this.phase === "fight";
  }
  pickNormal(f, btn) {
    const pad = f.pad;
    const fwd = f.facing > 0 ? "right" : "left";
    const back = f.facing > 0 ? "left" : "right";
    if (f.y < 0 || f.state === "jump") return btn === "p" ? "jP" : "jK";
    if (pad.held.down) return btn === "p" ? "cP" : "cK";
    if (pad.held[fwd]) return btn === "p" ? "pM" : "kM";
    if (pad.held[back]) return btn === "p" ? "pH" : "kH";
    return btn === "p" ? "pL" : "kL";
  }
  tryGroundActions(f) {
    const pad = f.pad;
    const tk = this.tick;
    if (this.phase !== "fight") return false;
    if (pad.buffered("transform", tk) && this.beginTransformation(f)) {
      pad.consume("transform");
      return true;
    }
    if (pad.buffered("super", tk) && this.canSuper(f)) {
      pad.consume("super");
      this.startSuper(f);
      return true;
    }
    if (pad.buffered("grab", tk)) {
      if (this.startMove(f, { ...f.def.moves.pH, id: "throw", kind: "special", startup: 9, active: 3, recovery: 26, whiff: 16, dmg: 70, grab: "throw", unblockable: true, hb: [0, 84, 0, 170], advance: void 0, poses: ["pH_s", "pH_a"], label: "AGARR\xC3O" })) {
        pad.consume("grab");
        return true;
      }
    }
    for (const s of ["s1", "s2", "s3"]) {
      if (pad.buffered(s, tk) && this.startMove(f, f.def.moves[s])) {
        pad.consume(s);
        return true;
      }
    }
    if (pad.buffered("headbutt", tk) && this.startMove(f, f.def.moves.headbutt)) {
      pad.consume("headbutt");
      return true;
    }
    for (const b of ["p", "k"]) {
      if (pad.buffered(b, tk) && this.startMove(f, f.def.moves[this.pickNormal(f, b)])) {
        pad.consume(b);
        return true;
      }
    }
    return false;
  }
  sampleGuard(f) {
    f.crouch = f.pad.held.down;
    f.guard = f.guardBreakT === 0 && f.landLag === 0 && (f.pad.held.block || f.pad.buffered("block", this.tick));
    if (f.guard) f.pad.consume("block");
    const o = this.opp(f), m = o.move;
    if (!f.guard && f.formT > 0 && ["jao", "hdsh"].includes(f.ch) && f.predictionCooldown === 0 && f.exhaustT === 0 && f.stamina >= 6 && f.landLag === 0 && f.state === "ground" && m && !m.grab && m.level !== "low" && o.moveT >= m.startup - 5 && o.moveT < m.startup + m.active && Math.abs(f.x - o.x) < 180) {
      f.guard = true;
      f.crouch = false;
      f.predictionCooldown = 60;
      payStamina(f, 6);
      this.text(f.x, FLOOR_Y - 200, "PREVIS\xC3O \xB7 GUARDA ALTA", f.def.glow, 16);
    }
  }
  orient(f, o) {
    if (this.phase === "fight" && f.state === "ground" && f.y === 0 && f.landLag === 0 && f.pad.buffered("turn", this.tick)) {
      f.facing = f.facing === 1 ? -1 : 1;
      f.manualFacing = true;
      f.pad.consume("turn");
      if (f.idx === 0) this.challengeEvent("turn");
      return;
    }
    if (!f.manualFacing) f.facing = o.x >= f.x ? 1 : -1;
  }
  tryGroundMobility(f) {
    const pad = f.pad, tk = this.tick, def = f.def;
    if (this.phase !== "fight") return false;
    if (!f.crouch && pad.buffered("up", tk) && f.exhaustT === 0 && f.stamina >= RESOURCE_RULES.jumpCost) {
      payStamina(f, RESOURCE_RULES.jumpCost);
      pad.consume("up");
      f.vy = -def.jumpVy * Math.min(1.3, formStats(f).speed);
      f.vx = ((pad.held.right ? 1 : 0) - (pad.held.left ? 1 : 0)) * def.jumpVx;
      if (f.idx === 0) this.challengeEvent("jump");
      f.state = "jump";
      f.stateT = 0;
      f.airAttacked = false;
      f.airJumps = 1;
      f.guard = false;
      audio.jump();
      this.dust(f.x, FLOOR_Y, 4);
      this.trainingEvent("jump", f, "jump");
      return true;
    }
    const fwd = f.facing > 0 ? "right" : "left", back = f.facing > 0 ? "left" : "right";
    const dashDir = pad.doubleTapped(fwd, tk) ? 1 : pad.doubleTapped(back, tk) ? -1 : 0;
    if (dashDir && !f.crouch && !f.guard && f.exhaustT === 0 && f.stamina >= RESOURCE_RULES.dashCost) {
      payStamina(f, RESOURCE_RULES.dashCost);
      if (f.idx === 0) this.challengeEvent("dash");
      f.state = "dash";
      f.stateT = 0;
      f.vx = dashDir * f.facing * (dashDir > 0 ? def.dashVx : def.dashVx * 0.85) * formStats(f).speed;
      f.x += f.vx;
      pad.consumeDash(dashDir > 0 ? fwd : back);
      audio.whoosh(0.5);
      return true;
    }
    return false;
  }
  steerAir(f) {
    const steer = (f.pad.held.right ? 1 : 0) - (f.pad.held.left ? 1 : 0);
    if (steer) {
      const limit2 = f.def.jumpVx * Math.min(1.5, formStats(f).speed);
      f.vx = clamp4(f.vx + steer * 0.28, -limit2, limit2);
    }
  }
  startMove(f, m) {
    if (f.ch === "jane" && f.formT > 0 && ["s1", "s2"].includes(m.id)) m = { ...m, startup: 18, active: 3, recovery: 28, whiff: 12, dmg: 60, poses: ["zord_s", "zord_a"], label: "EVA \xB7 LASER DAS M\xC3OS", advance: void 0 };
    if (f.ch === "tubarao" && f.formT > 0 && m.id === "s1") m = { ...m, label: "MEGALODONTE \xB7 STOMP", level: "mid", launch: 5 };
    const rangedActivation = RANGED_MOVES[f.ch].includes(m.id) || f.ch === "jane" && f.formT > 0 && m.id === "s2";
    if (rangedActivation && f.rangedCooldown > 0) return false;
    if (f.ch === "rickzera" && m.id === "s3" && f.y < 0 && f.airJumps >= 2) return false;
    if (f.ch === "jane" && m.id === "s2" && f.formT === 0 && (f.bikeCooldown > 0 || f.move?.id === "s2")) return false;
    if (f.ch === "santox" && m.id === "s3" && f.fourthCooldown > 0) return false;
    const cost = staminaCost(m), special = m.kind === "special" && m.id !== "bikeRush";
    if ((special || m.rank >= 3) && m.kind !== "super" && (f.exhaustT > 0 || f.stamina < cost)) return false;
    const energyCost = f.ch === "rickzera" && /^s[123]$/.test(m.id) ? RESOURCE_RULES.energyCosts[m.id] : 0;
    if (energyCost && f.formT === 0 && f.energy < energyCost) return false;
    if (f.ch === "jane" && f.formT > 0 && ["s1", "s2"].includes(m.id) && f.battery < 12) return false;
    if (f.ch === "santox" && m.id === "s2" && f.y < 0) return false;
    if (f.y < 0 && !m.air && !(f.ch === "rickzera" && m.id === "s3")) return false;
    if (f.ch === "jane" && m.id === "s2" && f.formT === 0) {
      if (f.bikeCooldown > 0 || f.move?.id === "s2") return false;
      f.bikeTicks = f.bikeHits = f.bikeNextHit = 0;
    }
    if (f.ch === "santox" && m.id === "s3") {
      if (f.fourthCooldown > 0) return false;
      f.fourthCooldown = 480;
      this.moveBanner = null;
    }
    if (f.ch === "caetano" && m.id === "s2" && f.precision > 0) {
      m = { ...m, dmg: 73, hitstun: 20, label: "DEDILHO: LEITURA PERFEITA" };
      f.precision = 0;
    }
    if (f.ch === "aneninha" && m.id === "s1" && f.pad.held.down) m = { ...m, dmg: 78, level: "low", hb: [15, 145, 0, 70], launch: 4, poses: ["cK_s", "cK_a"], variant: "low", label: "RASTEIRA DE OSASCO" };
    if (f.ch === "aneninha" && m.id === "s2" && f.pad.held[f.facing > 0 ? "right" : "left"]) m = { ...m, variant: "reverse", label: "OSASCO DO OUTRO LADO" };
    if (rangedActivation) {
      if (f.rangedCooldown > 0) return false;
      if (++f.rangedUses === 3) f.rangedCooldown = 300;
    }
    if (m.kind !== "super") payStamina(f, cost);
    if (energyCost && f.formT === 0) f.energy -= energyCost;
    if (f.ch === "jane" && f.formT > 0 && ["s1", "s2"].includes(m.id)) f.battery -= 12;
    m = { ...m, resourcePower: formStats(f).damage, rangeScale: formStats(f).reach };
    if (m.id === "throw") f.throwTechUntil = this.tick + 12;
    if (f.ch === "rickzera" && m.id === "s3") {
      if (f.y < 0 && f.airJumps >= 2) return false;
      if (f.idx === 0) this.challengeEvent("jump");
      f.airJumps = f.y < 0 ? f.airJumps + 1 : 1;
      f.vy = -f.def.jumpVy * 1.25 * Math.min(1.3, formStats(f).speed);
      f.y = Math.min(f.y, -1);
      f.vx = ((f.pad.held.right ? 1 : 0) - (f.pad.held.left ? 1 : 0) || f.facing) * f.def.jumpVx;
      m = { ...m, air: true };
      this.ring(f.x, FLOOR_Y + f.y, f.def.glow, 70, 18, 4);
      this.spark(f.x, FLOOR_Y + f.y, f.def.color, 12, 5, 3, 18);
      audio.jump();
    }
    if (f.ch === "santox" && m.id === "s2") {
      f.y = -1;
      f.vy = -9.2;
      f.vx = f.facing * 3.6;
      f.airJumps = 1;
      f.landLag = 12;
      audio.jump();
      this.dust(f.x, FLOOR_Y, 5);
    }
    f.state = "attack";
    f.stateT = 0;
    f.move = m;
    f.moveT = 0;
    f.connected = false;
    f.contact = "pending";
    f.contactFrame = -1;
    f.hitDone = false;
    f.hbActive = false;
    f.serial++;
    f.guard = false;
    f.guardResultT = f.guardReadyT = 0;
    if (f.ch === "jane" && m.id === "s3") f.manualFacing = false;
    f.crouch = m.id === "cP" || m.id === "cK";
    f.turn = 1;
    if (m.air) f.airAttacked = true;
    else if (f.y === 0 && !f.move.advance) f.vx *= 0.3;
    if (m.label && !(f.ch === "santox" && m.id === "s3")) {
      this.moveBanner = { text: m.label, color: f.def.color, t: 0, dur: 75 };
      if (m.kind === "special") this.hype = Math.max(this.hype, 0.5);
    }
    if (f.ch === "aneninha" && m.id === "s3") {
      audio.say("Osasco!", 1.4, 1.1);
      audio.noise(0.35, 0.17, 1300, "bandpass");
    }
    if (f.ch === "santox" && m.id === "s3") audio.say("Voc\xEA a\xED. Est\xE1 me vendo?", 1.25, 1.15);
    if (f.ch === "tubarao" && m.id === "s1") audio.bite();
    if (f.ch === "tubarao" && m.id === "s3") audio.kiss();
    if (m.id === "s3" && f.ch === "orango") audio.roar();
    if (m.id === "s3" && f.ch === "caetano") audio.say("Soco pego!", 1.2, 1.1);
    if (m.id === "s1" && f.ch === "caetano") audio.say("Chute Senbukan!", 1.2, 1.1);
    if (m.id === "s2" && f.ch === "caetano") audio.say("Dedilho!", 1.3, 1.2);
    if (f.ch === "rickzera" && m.id === "s2") audio.say("Soco de energia!", 1.1, 1.15);
    this.trainingEvent("start", f, m.id);
    return true;
  }
  tryCancel(f) {
    const m = f.move;
    if (m.id === "headbutt") return false;
    const pad = f.pad;
    const tk = this.tick;
    if (!f.connected || f.contactFrame < 0 || f.moveT - f.contactFrame > CANCEL_CONFIRM_FRAMES || this.phase !== "fight" || f.ch === "jane" && ["s2", "bikeRush", "s3"].includes(m.id)) return false;
    const clean = f.contact === "hit";
    const opponent = this.opp(f);
    if (clean && m.kind === "normal" && !m.air && !f.pad.held.down && opponent.state === "hit" && m.signature?.step !== 6) {
      for (const b of ["p", "k"]) if (pad.buffered(b, tk)) {
        const next = signatureContinuation(f.ch, opponent.comboMoves, b, f.def.moves);
        if (next && this.startMove(f, next)) {
          pad.consume(b);
          return true;
        }
      }
    }
    if (m.air) {
      if (clean && m.kind === "normal" && m.id === "jP" && f.y < 0 && opponent.state === "launched" && opponent.juggle < 4 && pad.buffered("k", tk) && this.startMove(f, f.def.moves.jK)) {
        pad.consume("k");
        return true;
      }
      return false;
    }
    const launcher = m.launch > 0 && (m.kind === "normal" || ["caetano", "orango", "tubarao", "aneninha", "cristyan"].includes(f.ch));
    if (clean && launcher && opponent.state === "launched" && opponent.juggle < 4 && f.y === 0 && pad.buffered("up", tk)) {
      pad.consume("up");
      f.move = null;
      f.hbActive = false;
      f.state = "jump";
      f.stateT = 0;
      f.y = -1;
      f.vy = -Math.min(f.def.jumpVy, Math.max(8, -opponent.vy + 2));
      f.vx = clamp4((opponent.x - f.x) * 0.1, -f.def.jumpVx, f.def.jumpVx);
      f.airAttacked = false;
      f.airJumps = 1;
      f.guard = f.crouch = f.armor = false;
      f.turn = 1;
      audio.jump();
      this.dust(f.x, FLOOR_Y, 5);
      if (f.idx === 0) this.challengeEvent("jump");
      this.trainingEvent("jump", f, "jump");
      return true;
    }
    if (clean && f.ch === "caetano" && m.id === "s2" && pad.buffered("s1", tk) && this.startMove(f, f.def.moves.s1)) {
      pad.consume("s1");
      return true;
    }
    if (clean && m.kind !== "super" && pad.buffered("super", tk) && this.canSuper(f)) {
      pad.consume("super");
      this.startSuper(f);
      return true;
    }
    if (m.kind === "normal") {
      if (clean && m.rank < 3 && pad.buffered("headbutt", tk) && this.startMove(f, f.def.moves.headbutt)) {
        pad.consume("headbutt");
        return true;
      }
      for (const s of ["s1", "s2", "s3"]) {
        if (clean && pad.buffered(s, tk)) {
          let special = f.def.moves[s];
          if (["pM", "kM"].includes(m.id) && opponent.state === "hit" && opponent.comboHits >= 2 && CONFIRMED_SPECIAL_LINKS[f.ch] === s) {
            const credit = Math.min(LINK_STARTUP_CREDIT, special.startup - 8);
            special = { ...special, startup: special.startup - credit, advance: special.advance ? [Math.max(0, special.advance[0] - credit), Math.max(1, special.advance[1] - credit), special.advance[2]] : void 0 };
          }
          if (this.startMove(f, special)) {
            pad.consume(s);
            return true;
          }
        }
      }
      if (!m.air && m.rank < 3) {
        for (const b of ["p", "k"]) {
          if (pad.buffered(b, tk)) {
            let cand = this.pickNormal(f, b);
            let cm = f.def.moves[cand];
            if (cm.rank <= m.rank) {
              if (pad.held.down) continue;
              cand = NORMAL_BY_RANK[b][m.rank];
              cm = f.def.moves[cand];
            }
            if (cm && cm.rank > m.rank && !cm.air) {
              if (this.startMove(f, cm)) {
                pad.consume(b);
                return true;
              }
            }
          }
        }
      }
    }
    return false;
  }
  endAttack(f) {
    const m = f.move;
    if (m && !f.connected && m.dmg > 0 && !this.projectileKind(f, m)) this.trainingEvent("whiff", f, m.id);
    if (f.ch === "jane" && m?.id === "s2" && f.bikeCooldown === 0) f.bikeCooldown = 180;
    if (m && m.kind === "super") {
      f.armor = false;
      f.glow = 0;
      f.aura = 0;
    }
    f.armor = false;
    f.move = null;
    f.hbActive = false;
    f.poseOverride = null;
    f.turn = 1;
    f.stateT = 0;
    f.state = f.y < 0 ? "jump" : "ground";
  }
  stopBike(f, crash = false) {
    const m = f.move;
    if (f.ch !== "jane" || m?.id !== "s2") return;
    f.bikeCooldown = 180;
    f.hbActive = false;
    f.vx = 0;
    if (crash) {
      f.move = null;
      f.state = "dizzy";
      f.stateT = 0;
      f.bikeDizzy = 60;
      f.poseOverride = "dizzy";
      f.guard = f.crouch = false;
      f.invuln = 0;
      this.text(f.x, FLOOR_Y - 145, "PASSOU DO PONTO!", "#fde047", 25);
      this.dust(f.x, FLOOR_Y, 8);
      audio.land();
    } else {
      this.startMove(f, { ...f.def.moves.s2, id: "bikeRush", startup: 3, active: 16, recovery: 24, whiff: 8, dmg: 18, hb: [-20, 105, 0, 105], advance: [0, 19, 15], label: "MOTO SEM CONTROLE" });
      f.invuln = 0;
      f.armor = false;
      audio.whoosh(1.4);
    }
  }
  interruptBike(f) {
    if (f.ch === "jane" && f.move?.id === "s2") f.bikeCooldown = 180;
    f.bikeDizzy = 0;
  }
  resetComboOf(f) {
    if (f.comboHits > 0) {
      this.recoveredCombos.set(f, { hits: f.comboHits, damage: f.comboDmg, moves: [...f.comboMoves], kind: f.comboKind, serial: f.comboLastSerial });
      const actionable = f.state === "ground" && f.landLag === 0 || f.state === "jump" || f.state === "dash";
      f.comboResult = { hits: f.comboHits, damage: f.comboDmg, moves: [...f.comboMoves], kind: f.comboKind, freeAt: actionable ? this.tick : null };
      if (actionable) this.trainingEvent("free", f);
      const att = 1 - f.idx;
      if (f.comboHits >= 2) this.comboShow[att] = { hits: f.comboHits, dmg: f.comboDmg, t: 90, kind: f.comboKind };
      if (this.training) {
        this.train.combo = f.comboHits;
        this.train.total = f.comboDmg;
        this.train.maxCombo = Math.max(this.train.maxCombo, f.comboHits);
      }
      f.comboHits = 0;
      f.comboDmg = 0;
    }
    f.juggle = 0;
  }
  markActionable(f) {
    if (f.state === "ground" && f.landLag === 0 && f.comboResult && f.comboResult.freeAt === null) {
      f.comboResult.freeAt = this.tick;
      this.trainingEvent("free", f);
    }
  }
  updateFighter(f, o) {
    const previousX = f.x;
    const enteredState = f.state;
    f.stateT++;
    if (f.guardResultT > 0) f.guardResultT--;
    if (f.guardReadyT > 0) f.guardReadyT--;
    if (f.invuln > 0) f.invuln--;
    if (f.throwShield > 0) f.throwShield--;
    const def = f.def;
    const pad = f.pad;
    const tk = this.tick;
    f.walking = 0;
    if (f.state === "ground" || f.state === "jump" || f.state === "dash" || f.state === "getup") this.resetComboOf(f);
    switch (f.state) {
      case "ground":
      case "dash": {
        f.y = 0;
        const dashing = f.state === "dash";
        if (!dashing) this.orient(f, o);
        if (dashing) {
          if (f.stateT >= DASH_COMMIT_FRAMES && (pad.held.block || pad.buffered("block", tk))) {
            f.state = "ground";
            f.stateT = 0;
            f.vx = 0;
            break;
          }
          if (f.stateT >= DASH_COMMIT_FRAMES && this.tryGroundActions(f)) return;
          f.vx *= f.stateT > def.dashDur - 4 ? 0.82 : 0.98;
          f.x += f.vx;
          if (f.stateT >= def.dashDur) {
            f.state = "ground";
            f.stateT = 0;
          }
          if (f.stateT % 3 === 0) this.dust(f.x - f.facing * 20, FLOOR_Y, 1);
          break;
        }
        f.crouch = pad.held.down;
        if (f.landLag > 0) {
          f.landLag--;
          if (f.landLag > 0) {
            f.guard = false;
            f.vx *= 0.7;
            f.x += f.vx;
            break;
          }
        }
        this.markActionable(f);
        if (f.pad.buffered("turn", tk)) this.orient(f, o);
        this.sampleGuard(f);
        if (this.tryGroundActions(f)) return;
        if (f.ch === "rickzera" && f.formT === 0 && f.formStartup === 0 && pad.held.charge && !f.guard && !f.crouch) {
          f.charging = true;
          f.vx = 0;
          const before = f.energy;
          gainEnergy(f, RESOURCE_RULES.energyCharge);
          if (f.idx === 0) this.challengeEvent("energy", f.energy - before);
          f.poseOverride = "taunt";
          if (tk % 12 === 0) this.spark(f.x, FLOOR_Y - 90, "#4ade80", 2, 2, 2, 12);
          break;
        } else if (f.poseOverride === "taunt") f.poseOverride = null;
        if (this.tryGroundMobility(f)) break;
        if (f.guard || f.crouch) {
          f.vx = 0;
        } else {
          const dir = ((pad.held.right ? 1 : 0) - (pad.held.left ? 1 : 0)) * (f.confusionT > 0 ? -1 : 1);
          if (dir !== 0) {
            const forward = dir === f.facing;
            f.vx += (dir * ((forward ? def.walk : def.walkBack) + (f.ch === "orango" && forward ? f.momentum * 0.25 : 0)) * formStats(f).speed * (f.exhaustT > 0 ? 0.8 : 1) - f.vx) * (Math.sign(f.vx) === dir ? 0.78 : 0.85);
            f.walking = forward ? 1 : -1;
          } else {
            f.vx *= 0.38;
            if (Math.abs(f.vx) < 0.12) f.vx = 0;
            f.walking = f.vx === 0 ? 0 : f.vx * f.facing > 0 ? 1 : -1;
          }
        }
        f.x += f.vx;
        break;
      }
      case "jump": {
        this.steerAir(f);
        if (f.ch === "rickzera" && f.airJumps < 2 && this.phase === "fight") {
          if (pad.buffered("s3", tk) && this.startMove(f, f.def.moves.s3)) {
            pad.consume("s3");
            return;
          }
          if (pad.buffered("up", tk) && f.exhaustT === 0 && f.stamina >= 5 && (f.formT > 0 || f.energy >= 18)) {
            payStamina(f, 5);
            if (f.formT === 0) f.energy -= 18;
            pad.consume("up");
            f.airJumps++;
            f.vy = -def.jumpVy * 1.15;
            f.airAttacked = false;
            this.ring(f.x, FLOOR_Y + f.y, def.glow, 68, 16, 4);
            audio.jump();
          }
        }
        f.vy += GRAV;
        f.y += f.vy;
        f.x += f.vx;
        if (!f.airAttacked && this.phase === "fight") {
          for (const b of ["p", "k"]) {
            if (pad.buffered(b, tk) && this.startMove(f, f.def.moves[b === "p" ? "jP" : "jK"])) {
              pad.consume(b);
              return;
            }
          }
        }
        if (f.y >= 0) this.land(f);
        break;
      }
      case "attack":
        this.updateAttack(f, o);
        break;
      case "transform":
        f.vx = f.vy = 0;
        f.formStartup = Math.max(0, RESOURCE_RULES.activationFrames - f.stateT);
        if (f.stateT === RESOURCE_RULES.commitFrame) {
          if (f.idx === 0) this.challengeEvent("transform");
          f.formT = FORMS[f.ch].duration;
          f.formShield = f.ch === "patrick" ? 3 : 0;
          f.formElapsed = 0;
          this.ring(f.x, FLOOR_Y - 10, f.def.color, 240, 30, 7);
          audio.boom(0.8);
        }
        f.aura = 1;
        f.glow = 1;
        f.poseOverride = f.stateT < 36 ? "crouch" : "win";
        if (f.stateT >= RESOURCE_RULES.activationFrames) {
          f.formStartup = 0;
          f.state = "ground";
          f.stateT = 0;
          f.poseOverride = null;
          f.landLag = 8;
        }
        break;
      case "dizzy":
        f.vx = 0;
        f.y = 0;
        if (f.stateT > 1) f.bikeDizzy = Math.max(0, f.bikeDizzy - 1);
        if (f.bikeDizzy === 0) {
          f.state = "ground";
          f.stateT = 0;
          f.poseOverride = null;
        }
        break;
      case "hit":
        f.hitstun--;
        f.x += f.vx;
        f.vx *= 0.86;
        if (f.hitstun <= 0) {
          f.state = "ground";
          f.stateT = 0;
          f.vx = 0;
          f.throwShield = 10;
          f.guard = pad.held.block;
          f.crouch = pad.held.down;
        }
        break;
      case "block":
        f.crouch = pad.held.down;
        f.blockstun--;
        f.x += f.vx;
        f.vx *= 0.86;
        if (f.blockstun <= 0) {
          f.state = "ground";
          f.stateT = 0;
          f.guardReadyT = GUARD_READY_FEEDBACK_FRAMES;
          f.vx = 0;
          f.throwShield = 10;
          f.guard = pad.held.block;
          f.crouch = pad.held.down;
        }
        break;
      case "launched":
        f.vy += GRAV * 0.9;
        f.y += f.vy;
        f.x += f.vx;
        f.vx *= 0.992;
        if (f.y >= 0) {
          f.y = 0;
          f.vy = 0;
          f.vx *= 0.4;
          f.state = "down";
          f.stateT = 0;
          audio.land();
          this.dust(f.x, FLOOR_Y, 8);
          this.shake = Math.max(this.shake, f.ko ? 14 : 6);
          if (f.groundSmash) {
            f.groundSmash = false;
            this.knuckleCrater(f.x);
          }
        }
        break;
      case "down":
        f.x += f.vx;
        f.vx *= 0.85;
        if (!f.ko && f.stateT >= 42 && this.phase !== "roundEnd") {
          f.state = "getup";
          f.stateT = 0;
          f.invuln = 22;
        }
        break;
      case "getup":
        if (f.stateT >= 18) {
          f.state = "ground";
          f.stateT = 0;
        }
        break;
      case "win":
      case "seq":
      case "cine":
        f.x += f.vx;
        f.vx *= 0.8;
        break;
    }
    if (f.state === "ground" && enteredState !== "ground" && this.phase === "fight" && !f.ko) {
      this.resetComboOf(f);
      this.orient(f, o);
      this.sampleGuard(f);
      this.markActionable(f);
      if (!(enteredState === "dash" && f.guard) && f.landLag === 0 && !this.tryGroundActions(f)) this.tryGroundMobility(f);
    }
    if (f.y === 0 && (f.state === "ground" || f.state === "dash") && this.projectiles.some((p) => (p.kind === "chess" || p.kind === "territory") && p.owner !== f.idx && p.life > 0 && Math.abs(p.x - f.x) < (p.radius ?? 110))) {
      f.x = previousX + (f.x - previousX) * 0.65;
      if (f.x !== previousX && this.opp(f).idx === 0) this.challengeEvent("special", 1, "s1");
    }
  }
  land(f) {
    f.airJumps = 0;
    f.airAttacked = false;
    f.y = 0;
    f.vy = 0;
    f.vx = 0;
    f.state = "ground";
    f.stateT = 0;
    f.landLag = Math.max(3, f.landLag);
    f.throwShield = 10;
    audio.land();
    this.dust(f.x, FLOOR_Y, 5);
  }
  updateAttack(f, o) {
    const m = f.move;
    const t = f.moveT;
    if (f.ch === "eneas" && m.id === "s3") f.poseOverride = t >= m.startup + 10 && t < m.startup + m.active ? "six_a" : null;
    if (f.ch === "renngotti" && m.id === "s3" && t === m.startup) {
      for (const p of this.projectiles) if (p.owner === f.idx && p.anchored && !p.resonating) {
        p.resonating = true;
        p.radius = 90;
        p.life = Math.min(p.life, 24);
        p.move = { ...p.move, dmg: 35, level: "mid", hitstun: 20 };
        this.ring(p.x, FLOOR_Y - 35, f.def.glow, 150, 22, 5);
      }
    }
    f.hbActive = false;
    if (m.air) {
      this.steerAir(f);
      f.vy += GRAV;
      f.y += f.vy;
      f.x += f.vx;
      if (f.y >= 0) {
        this.endAttack(f);
        this.land(f);
        f.landLag = f.ch === "santox" && m.id === "s2" ? 12 : 5;
        return;
      }
    } else {
      if (f.ch === "jane" && m.id === "s3") {
        f.crouch = t < 18;
        if (t === 18) {
          f.facing = o.x >= f.x ? 1 : -1;
          f.y = -1;
          f.vy = -8.5;
          f.crouch = false;
          f.airAttacked = true;
          audio.jump();
          this.dust(f.x, FLOOR_Y, 5);
        }
        if (t >= 18 && f.y < 0) {
          f.vy += GRAV;
          f.y += f.vy;
          if (f.y >= 0) {
            f.y = 0;
            f.vy = 0;
            audio.land();
          }
        }
        if (t >= 17) f.vx = 0;
      }
      if (f.ch === "jane" && f.formT === 0 && m.id === "s2") f.vx = 0;
      else if (m.advance && t >= m.advance[0] && t < m.advance[1]) f.vx = m.advance[2] * f.facing;
      else f.vx *= 0.75;
      f.x += f.vx;
    }
    const a0 = m.startup;
    const a1 = m.startup + m.active;
    if (m.kind === "super") f.armor = t >= a0 && t < a1;
    if (f.ch === "patrick" && m.id === "s1") f.armor = t >= a0 && t < a1;
    const rangedKind = this.projectileKind(f, m);
    const ranged = rangedKind !== null;
    if (t >= a1 && f.contact === "pending" && !ranged && (m.dmg > 0 || m.grab)) f.contact = "whiff";
    f.hbActive = !ranged && !(f.ch === "santox" && m.id === "s3") && t >= a0 && t < a1 && !f.hitDone;
    if (f.ch === "jane" && f.formT === 0 && m.id === "s2" && t >= a0 && t < a1) {
      f.hbActive = f.bikeHits < 6 && f.bikeTicks >= f.bikeNextHit;
      if (f.hbActive) {
        f.hitDone = false;
        f.move = { ...m, dmg: Math.min(15, 11 + Math.floor(f.bikeTicks / 60)) };
      }
    }
    if (f.ch === "jane" && m.id === "bikeRush" && f.bikeHits >= 6) f.hbActive = false;
    if (f.ch === "jane" && m.id === "bikeRush" && t < a1 && t % 2 === 0) {
      this.dust(f.x - f.facing * 45, FLOOR_Y, 2);
      this.spark(f.x - f.facing * 40, FLOOR_Y - 20, "#fde047", 2, 3, 2, 10);
    }
    if (f.ch === "santox" && m.id === "s3" && t >= a0 && t < a1) {
      f.invuln = 1;
      this.camOv = { x: f.x, zoom: 1.75 };
      this.camOvT = 2;
    }
    if (ranged && (t === a0 || (rangedKind === "java" || rangedKind === "five") && t === a0 + 10 || (rangedKind === "franco" || rangedKind === "energy") && (t === a0 + 6 || t === a0 + 12) || rangedKind === "bullet" && (t === a0 + 8 || t === a0 + 16))) this.spawnProjectile(f, m);
    this.moveFx(f, m, t, o);
    if (f.connected && this.tryCancel(f)) return;
    f.moveT++;
    if (m.air) {
      if (f.moveT >= a1) this.endAttack(f);
    } else {
      const total = a1 + m.recovery + (f.connected ? 0 : m.whiff);
      if (f.moveT >= total) this.endAttack(f);
    }
  }
  tipPos(f, joint) {
    const p = f.rig.p[joint];
    return { x: f.x + f.facing * f.turn * p.x, y: FLOOR_Y + f.y + p.y };
  }
  moveFx(f, m, t, _o) {
    const col = f.def.color;
    if (m.turn) {
      const [t0, t1] = m.turn;
      if (t >= t0 && t <= t1) {
        const u = (t - t0) / (t1 - t0);
        const c = Math.cos(u * Math.PI * 2);
        f.turn = Math.abs(c) < 0.18 ? c < 0 ? -0.18 : 0.18 : c;
      } else f.turn = 1;
    }
    if (t === m.startup) {
      audio.swing(f.ch, f.ch === "ulisses" && f.formT > 0 ? { ...m, accessory: void 0 } : m);
      if (m.sound === "purple") audio.purple();
      if (m.sound === "red") audio.red();
      if (m.kind === "special") this.speed = Math.max(this.speed, 0.5);
    }
    if (m.charge && t < m.startup && t % 2 === 0) {
      const tip = this.tipPos(f, f.ch === "orango" ? "wF" : "wB");
      const ang = rand(0, Math.PI * 2);
      const d = 60 * (1 - t / m.startup) + 25;
      this.parts.push({ type: "spark", x: tip.x + Math.cos(ang) * d, y: tip.y + Math.sin(ang) * d, vx: -Math.cos(ang) * 3, vy: -Math.sin(ang) * 3, life: 12, max: 12, size: 3, color: f.def.glow, g: 0, rot: 0, grow: 0 });
      f.aura = Math.min(1, t / m.startup);
    } else if (m.charge && t >= m.startup + m.active) f.aura = Math.max(0, f.aura - 0.1);
    if (m.trail && t >= m.startup - 2 && t < m.startup + m.active + 5) {
      const j = m.trail === "fw" ? "wF" : m.trail === "bw" ? "wB" : m.trail === "fa" ? "aF" : "aB";
      f.trail.push(this.tipPos(f, j));
      if (f.trail.length > 14) f.trail.shift();
    }
    if (m.id === "s1" && f.ch === "caetano" && t >= 3 && t < 16) this.spark(f.x + f.facing * 60, FLOOR_Y + f.y - 80, col, 1, 2, 3, 14);
    void col;
  }
  projectileKind(f, m) {
    if (f.npc) return null;
    if (f.ch === "rickzera") return m.id === "s1" ? "energy" : m.id === "s2" ? "energyFist" : null;
    if (f.ch === "bieu") return m.id === "s2" ? "rat" : m.id === "s3" ? "spray" : null;
    if (f.ch === "nomad") return m.id === "s1" ? "burger" : m.id === "s3" ? "boomerang" : null;
    if (f.ch === "renngotti") return m.id === "s2" ? "microphone" : null;
    if (f.ch === "aneninha") return m.id === "s2" ? "osasco" : m.id === "s3" ? "roach" : null;
    if (f.ch === "jao") return m.id === "s1" ? "chess" : m.id === "s2" ? "formula" : m.id === "s3" ? "basketball" : null;
    if (f.ch === "jane") return f.formT > 0 && ["s1", "s2"].includes(m.id) ? "laser" : m.id === "s1" ? "java" : null;
    if (f.ch === "gabrielzin") return m.id === "s1" ? "heart" : m.id === "s3" ? "wink" : null;
    if (f.ch === "ulisses") return m.id === "s3" ? "blood" : null;
    if (f.ch === "felipence") return m.id === "s3" ? "sound" : null;
    if (f.ch === "hdsh") return m.id === "s1" ? "territory" : m.id === "s2" ? "trend" : m.id === "s3" ? "drop" : null;
    if (f.ch === "eneas") return m.id === "s2" ? "ecg" : m.id === "s3" ? "five" : null;
    return null;
  }
  spawnProjectile(f, m) {
    let kind = this.projectileKind(f, m);
    if (!kind) return;
    if (["energy", "energyFist", "heart", "wink", "blood", "sound", "territory", "trend", "drop", "roach", "laser"].includes(kind)) {
      if (kind === "territory") this.projectiles = this.projectiles.filter((p) => p.owner !== f.idx || p.kind !== "territory");
      const anchored = kind === "territory" || kind === "drop";
      const target = clamp4(f.x + clamp4(this.opp(f).x - f.x, -360, 360), 60, 1540);
      const scale = formStats(f).scale, muzzleX = f.x + f.facing * f.rig.p.wF.x * scale, muzzleY = f.y + f.rig.p.wF.y * scale;
      const laserVy = clamp4((this.opp(f).y - this.opp(f).def.hurtH * 0.55 - muzzleY) / Math.max(4, Math.abs(this.opp(f).x - muzzleX) / 18), -14, 14);
      this.projectiles.push({ owner: f.idx, launchFacing: f.facing, kind, x: kind === "laser" ? muzzleX : kind === "drop" ? target : kind === "territory" ? clamp4(f.x + f.facing * 200, 110, 1490) : f.x + f.facing * 60, y: kind === "laser" ? muzzleY : kind === "drop" ? -350 : kind === "territory" ? 0 : kind === "roach" ? -18 : -108, vx: anchored ? 0 : f.facing * (kind === "laser" ? 18 : kind === "trend" ? 13 : 10), vy: kind === "laser" ? laserVy : void 0, life: kind === "territory" ? 120 : kind === "drop" ? 58 : 80, serial: f.serial, move: m, age: 0, radius: kind === "territory" ? 100 : kind === "energyFist" ? 30 : kind === "drop" ? 32 : 18 });
      audio.tone(kind === "sound" ? 330 : 700, 0.12, "triangle", 0.12, 1200);
      return;
    }
    if (kind === "microphone") {
      const owned = this.projectiles.filter((p) => p.owner === f.idx && p.kind === "microphone" && p.life > 0);
      const replaced = new Set(owned.slice(0, Math.max(0, owned.length - MICROPHONE_LIMIT + 1)));
      this.projectiles = this.projectiles.filter((p) => !replaced.has(p));
    }
    if (kind === "chess") {
      this.projectiles = this.projectiles.filter((p) => p.kind !== "chess" || p.owner !== f.idx);
      this.projectiles.push({ owner: f.idx, launchFacing: f.facing, kind, x: clamp4(f.x + f.facing * 230, 115, 1485), y: 0, vx: 0, life: 180, serial: f.serial, move: m, age: 0, radius: 110 });
      this.ring(f.x + f.facing * 230, FLOOR_Y - 5, f.def.glow, 220, 25, 4);
      audio.tone(330, 0.2, "triangle", 0.14, 660);
      return;
    }
    if (kind === "five" && f.moveT > m.startup) {
      kind = "six";
      m = { ...m, dmg: 34, launch: 0, spike: true, kb: 6, hitstun: 22, poses: ["five_s", "six_a"] };
    }
    const speed = { franco: 12, rat: 8, spray: 0, burger: 9, bullet: 20, boomerang: 11, bazooka: 20, microphone: 11, osasco: 0, formula: 10, basketball: 9, java: 10, ecg: 11, five: 10, six: 10 }[kind] ?? 10;
    const y = kind === "java" ? -72 : kind === "ecg" ? -96 : kind === "five" || kind === "six" ? -100 : kind === "rat" ? -18 : kind === "bullet" ? -145 : kind === "spray" || kind === "osasco" ? -70 : kind === "microphone" ? -115 : -104;
    const radius = kind === "osasco" ? 48 : kind === "spray" ? 62 : kind === "rat" ? 14 : kind === "bullet" ? 6 : kind === "burger" ? 25 : 20;
    this.projectiles.push({ owner: f.idx, launchFacing: f.facing, kind, x: kind === "osasco" && m.variant === "reverse" && Math.abs(f.x - this.opp(f).x) < 220 ? this.opp(f).x + f.facing * 80 : f.x + f.facing * (kind === "spray" || kind === "osasco" ? 115 : 65), y, vx: f.facing * speed, life: kind === "osasco" ? 96 : kind === "spray" ? 64 : kind === "boomerang" ? 110 : 95, serial: f.serial, move: m, age: 0, radius: kind === "basketball" ? 23 : radius, vy: kind === "microphone" ? -2.4 : kind === "basketball" ? -2.3 : void 0 });
    audio.tone(kind === "bullet" ? 220 : kind === "rat" ? 900 : 640, 0.1, "triangle", 0.14, kind === "bullet" ? 70 : 1500);
    this.spark(f.x + f.facing * 60, FLOOR_Y + y, f.def.glow, 5, 4, 2, 12);
  }
  updateProjectiles() {
    if (this.phase !== "fight") {
      this.projectiles = [];
      return;
    }
    const volleys = new Set(this.projectiles.filter((p) => p.move.dmg > 0).map((p) => `${p.owner}:${p.serial}`));
    this.projectiles = this.projectiles.filter((p) => {
      p.age = (p.age ?? 0) + 1;
      const a = this.f[p.owner];
      if (p.kind === "chess" || p.kind === "territory") {
        p.life--;
        return p.life > 0;
      }
      if (p.kind === "drop") {
        if (p.age < 30) {
          p.life--;
          return true;
        }
        p.y += 22;
      }
      if (p.kind === "laser") p.y += p.vy ?? 0;
      if (p.kind === "boomerang") {
        if (!p.returning && (p.age >= 32 || p.x < 35 || p.x > 1565)) p.returning = true;
        if (p.returning) {
          p.vx = clamp4((a.x - p.x) * 0.16, -13, 13);
          p.y += (a.y - 100 - p.y) * 0.1;
          if (Math.abs(p.x - a.x) < 24) return false;
        }
      }
      p.x += p.vx;
      if (p.kind === "basketball") {
        p.vy = (p.vy ?? 0) + 0.12;
        p.y += p.vy;
        if (p.y >= -23) {
          if ((p.bounces ?? 0) >= 1) return false;
          p.bounces = 1;
          p.y = -23;
          p.vy = -Math.abs(p.vy) * 0.72;
          audio.tone(150, 0.08, "sine", 0.1, 70);
        }
      }
      if (p.kind === "microphone" && !p.anchored) {
        p.vy = (p.vy ?? 0) + 0.075;
        p.y += p.vy;
      }
      if (p.kind === "microphone" && !p.anchored && (p.age >= 50 || p.y >= -18)) {
        p.anchored = true;
        p.vx = 0;
        p.vy = 0;
        p.y = -14;
        p.life = 80;
        p.radius = 48;
        p.move = { ...p.move, dmg: 28, level: "low", hitstun: 16, kb: 3 };
      }
      p.life--;
      if (p.life <= 0 || p.x < -40 || p.x > 1640) return false;
      const d = this.opp(a);
      if (d.state === "launched" && d.juggle >= 4 || ["down", "getup", "seq", "cine", "win"].includes(d.state)) return true;
      const phaseMask = p.returning ? 2 : 1;
      if (p.kind === "boomerang" && (p.hitMask ?? 0) & phaseMask) return true;
      if ((p.kind === "spray" || p.kind === "osasco") && ((p.hitCount ?? 0) >= (p.kind === "osasco" ? 3 : 4) || p.age - (p.lastHitAt ?? -99) < (p.kind === "osasco" ? 20 : 14))) return true;
      const r = p.radius ?? 20;
      const ry = p.kind === "osasco" ? 65 : p.kind === "spray" ? 55 : p.anchored ? 28 : p.kind === "basketball" ? 23 : p.kind === "five" || p.kind === "six" ? 30 : p.kind === "bullet" ? 6 : p.kind === "drop" ? 32 : p.kind === "laser" ? 18 : 15;
      const box = { x0: p.x - r, x1: p.x + r, y0: p.y - ry, y1: p.y + ry };
      if (!this.overlap(box, this.hurtBox(d))) return true;
      if (d.invuln > 0 && !formPowerActive(a) && !formPowerActive(d)) {
        if (d.idx === 0 && d.ch === "santox" && d.move?.id === "s3") this.challengeEvent("special", 1, "s3");
        return true;
      }
      this.applyHit(a, d, p.move, { x: p.x, y: FLOOR_Y + p.y, dir: Math.sign(p.vx) || Math.sign(d.x - p.x) || p.launchFacing || a.facing, serial: p.serial });
      if (p.kind === "boomerang") {
        p.hitMask = (p.hitMask ?? 0) | phaseMask;
        return true;
      }
      if (p.kind === "spray" || p.kind === "osasco") {
        p.lastHitAt = p.age;
        p.hitCount = (p.hitCount ?? 0) + 1;
        return true;
      }
      return false;
    });
    for (const f of this.f) if (f.contact === "pending" && volleys.has(`${f.idx}:${f.serial}`) && !this.projectiles.some((p) => p.owner === f.idx && p.serial === f.serial)) f.contact = "whiff";
  }
  // ------------------------------------------------------------ colisão
  hurtBox(f) {
    const scale = formStats(f).scale, w = (f.def.pushW + 4) * scale;
    if (f.ch === "tubarao" && f.formT > 0) {
      const xa = f.x - f.facing * 80 * scale, xb = f.x + f.facing * 105 * scale;
      return { x0: Math.min(xa, xb), x1: Math.max(xa, xb), y0: f.y - (f.state === "launched" ? 100 : 155) * scale, y1: f.y };
    }
    let h = f.crouch && f.y === 0 ? f.def.crouchH : f.def.hurtH;
    if (f.y < 0) h = f.def.hurtH * 0.9;
    if (f.state === "launched") h = f.def.hurtH * 0.6;
    return { x0: f.x - w, x1: f.x + w, y0: f.y - h * scale, y1: f.y - (f.state === "launched" ? 20 : 0) };
  }
  boxOf(f) {
    const m = f.move;
    const scale = m.rangeScale ?? 1;
    const xa = f.x + f.facing * m.hb[0] * scale;
    const xb = f.x + f.facing * m.hb[1] * scale;
    return { x0: Math.min(xa, xb), x1: Math.max(xa, xb), y0: f.y - m.hb[3], y1: f.y - m.hb[2] };
  }
  overlap(a, b) {
    return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
  }
  canHit(att, def) {
    const m = att.move;
    if (def.invuln > 0 && !formPowerActive(att) && !formPowerActive(def)) return false;
    const dead = ["down", "getup", "seq", "cine", "win"];
    if (m.grab === "super") return !dead.includes(def.state);
    if (m.grab) return (def.throwShield === 0 || formPowerActive(att)) && def.y === 0 && (def.state === "ground" || def.state === "dash" || def.state === "dizzy" || def.state === "transform" || def.state === "block" && (def.blockstun <= 0 || formPowerActive(att)) || def.state === "attack" && !!def.move && (formPowerActive(att) || def.armor || def.ch === "jane" && ["s2", "bikeRush"].includes(def.move.id) || def.moveT >= def.move.startup + def.move.active) || m.grab === "throw" && def.move?.id === "throw");
    if (dead.includes(def.state)) return false;
    if (def.state === "launched" && def.juggle >= 4) return false;
    return true;
  }
  resolvePush() {
    const [a, b] = this.f;
    const skip = ["seq", "cine"];
    if (skip.includes(a.state) || skip.includes(b.state)) return;
    if ([a, b].some((f) => f.ch === "jane" && f.move?.id === "s3" && f.moveT < 18 && this.opp(f).y === 0)) return;
    if (a.y < -105 || b.y < -105) return;
    if (a.state === "down" || b.state === "down") return;
    const width = (f) => (f.ch === "tubarao" && f.formT > 0 ? 65 : f.def.pushW) * formStats(f).scale;
    const need = width(a) + width(b);
    const dx = b.x - a.x;
    const over = need - Math.abs(dx);
    if (over > 0) {
      const dir = dx === 0 ? a.facing > 0 ? 1 : -1 : Math.sign(dx);
      a.x -= dir * over / 2;
      b.x += dir * over / 2;
    }
  }
  clampX(f) {
    if (f.state === "seq") return;
    const o = this.opp(f);
    const min = 40;
    const max = 1560;
    if (f.x < min) {
      const over = min - f.x;
      f.x = min;
      if ((f.state === "hit" || f.state === "block") && o.y === 0 && o.state !== "seq") o.x += over * 0.9;
    }
    if (f.x > max) {
      const over = f.x - max;
      f.x = max;
      if ((f.state === "hit" || f.state === "block") && o.y === 0 && o.state !== "seq") o.x -= over * 0.9;
    }
    if (o.state !== "seq") {
      if (Math.abs(f.x - o.x) > 880) f.x = o.x + Math.sign(f.x - o.x) * 880;
    }
  }
  clashWindow(f) {
    const m = f.move;
    return f.state === "attack" && !!m && !!m.dedilho && f.moveT < m.startup + m.active + 3 && !f.hitDone;
  }
  resolveHits() {
    const [a, b] = this.f;
    if (this.phase !== "fight") return;
    if (!formPowerActive(a) && !formPowerActive(b) && a.state === "attack" && b.state === "attack" && a.move?.kind === "super" && b.move?.kind === "super" && a.hbActive && b.hbActive && a.facing !== b.facing && this.overlap(this.boxOf(a), this.boxOf(b))) {
      this.startClash(a, b, "super");
      return;
    }
    if (!formPowerActive(a) && !formPowerActive(b) && this.clashWindow(a) && this.clashWindow(b)) {
      if (this.overlap(this.boxOf(a), this.boxOf(b))) {
        this.startClash(a, b);
        return;
      }
    }
    const hits = [];
    for (const [x, y] of [[a, b], [b, a]]) if (y.idx === 0 && y.ch === "santox" && y.move?.id === "s3" && y.invuln > 0 && x.hbActive && x.move && this.overlap(this.boxOf(x), this.hurtBox(y))) this.challengeEvent("special", 1, "s3");
    for (const [x, y] of [[a, b], [b, a]]) if (x.hbActive && x.move && this.canHit(x, y) && this.overlap(this.boxOf(x), this.hurtBox(y))) {
      const ba = this.boxOf(x), bd = this.hurtBox(y);
      hits.push({ a: x, d: y, m: x.move, impact: { x: (Math.max(ba.x0, bd.x0) + Math.min(ba.x1, bd.x1)) / 2, y: FLOOR_Y + (Math.max(ba.y0, bd.y0) + Math.min(ba.y1, bd.y1)) / 2, dir: x.ch === "jane" && x.move.id === "s2" || x.ch === "cristyan" && x.move.id === "s3" ? Math.sign(y.x - x.x) || x.facing : x.facing, serial: x.serial } });
    }
    for (const h of hits) {
      if (h.m.grab && !formPowerActive(h.a) && hits.some((other) => other.d === h.a && !other.m.grab)) continue;
      if (this.seq) break;
      this.applyHit(h.a, h.d, h.m, h.impact);
      if (h.m.grab && (this.seq || !formPowerActive(h.d))) break;
    }
    if (!this.sandboxTraining && a.hp <= 0 && b.hp <= 0) {
      a.ko = b.ko = true;
      this.phase = "ko";
    }
  }
  gainMeter(f, amount) {
    f.meter = Math.min(RESOURCE_RULES.meterMax, f.meter + amount * METER_GAIN_SCALE);
  }
  trackComboMove(a, d, id, serial, advanced) {
    const punish = d.state === "dizzy" || d.state === "attack" && !!d.move && d.moveT > d.move.startup + d.move.active;
    if (d.comboHits === 0) {
      d.comboMoves = [];
      d.comboLastSerial = -1;
      d.comboKind = punish ? "punish" : "basic";
      d.comboResult = null;
    }
    if (d.comboKind !== "punish" && advanced) d.comboKind = "advanced";
    if (d.comboLastSerial !== serial) {
      d.comboMoves.push(id);
      d.comboLastSerial = serial;
    }
    if (punish && d.comboHits === 0) this.text(d.x, FLOOR_Y + d.y - 135, "PUNI\xC7\xC3O!", "#fb923c", 24);
    void a;
  }
  dealDamage(a, d, dmg) {
    if (formPowerActive(d)) return 0;
    dmg *= formStats(d).defense;
    gainEnergy(d, dmg * RESOURCE_RULES.energyOnDamage);
    if (d.formStartup > 0) {
      d.formStartup = 0;
      d.poseOverride = null;
      if (d.formT === 0) this.text(d.x, FLOOR_Y - 205, "TRANSFORMA\xC7\xC3O INTERROMPIDA", d.def.glow, 18);
    }
    if (d.ch === "orango") d.momentum = d.momentumT = 0;
    if (a.idx === 0) {
      this.challengeEvent("hits");
      this.challengeEvent("damage", dmg);
      if (this.seq?.kind.startsWith("super") && this.challengeSuperSerial !== a.serial) {
        this.challengeSuperSerial = a.serial;
        this.challengeEvent("super");
      }
    }
    if (this.sandboxTraining) {
      this.train.lastDmg = Math.round(dmg);
      d.comboDmg += dmg;
      d.hp = Math.max(1, d.hp - dmg);
      this.train.idle = 0;
    } else {
      d.hp = Math.max(0, d.hp - dmg);
      d.comboDmg += dmg;
    }
    this.combatEvent("damage", a, d, this.seq?.kind.startsWith("super") ? "super" : a.move?.id ?? this.seq?.kind ?? "", dmg);
    this.gainMeter(a, dmg * 0.16);
    this.gainMeter(d, dmg * 0.11);
    if (dmg > 0) {
      const restored = recoverAttackResource(a);
      if (restored) {
        if (a.idx === 0) this.reborn?.metric("resource", restored.amount);
        this.text(a.x, FLOOR_Y + a.y - a.def.hurtH - 18, `${restored.label} +${Number(restored.amount.toFixed(1))}`, a.def.glow, 15);
        this.ring(a.x, FLOOR_Y + a.y - 60, a.def.glow, 48, 16, 2);
      }
    }
    return dmg;
  }
  applyHit(a, d, m = a.move, impact) {
    const latest = !impact || impact.serial === a.serial;
    const tracked = a.move?.id === m.id && (!impact || impact.serial === a.serial);
    if (tracked) {
      a.hitDone = true;
      a.hbActive = false;
      if (a.ch === "jane" && ["s2", "bikeRush"].includes(m.id)) {
        a.bikeHits++;
        a.bikeNextHit = a.bikeTicks + 30;
      }
    }
    const ba = impact ? this.hurtBox(d) : this.boxOf(a);
    const bd = this.hurtBox(d);
    const px = impact?.x ?? (Math.max(ba.x0, bd.x0) + Math.min(ba.x1, bd.x1)) / 2;
    const py = impact?.y ?? FLOOR_Y + (Math.max(ba.y0, bd.y0) + Math.min(ba.y1, bd.y1)) / 2;
    const dir = impact?.dir ?? a.facing;
    if (formPowerActive(d)) {
      if (latest) a.contact = "whiff";
      if (this.training) this.train.lastDmg = 0;
      const showImmunity = !d.impact || d.impact.kind !== "armor" || this.tick - d.impact.tick >= 18;
      if (!d.impact || this.tick - d.impact.tick >= 6) {
        this.recordImpact(d, "armor", Math.max(1, impactStrength(m)), px, py);
        this.spark(px, py, d.def.glow, 22, 8, 3, 18);
        this.ring(px, py, d.def.glow, 110, 18, 5);
        this.ring(px, py, "#ffffff", 55, 12, 2);
        if (showImmunity) this.text(px, py - 55, "INVULNER\xC1VEL", d.def.glow, 19);
        audio.block();
      }
      return;
    }
    const breakDefense = formPowerActive(a);
    if (breakDefense && d.guard) {
      d.guardMeter = 0;
      d.guardBreakT = GUARD_RULES.breakFrames;
      d.guardDelay = GUARD_RULES.delay;
    }
    if (breakDefense && (d.guard || d.armor || d.invuln > 0 || m.grab && d.throwShield > 0)) {
      this.text(px, py - 60, "DEFESA ROMPIDA!", a.def.glow, 23);
      this.ring(px, py, a.def.glow, 160, 22, 7);
      this.spark(px, py, a.def.glow, 32, 11, 4, 22);
    }
    if (m.grab) {
      if (a.ch === "orango" && m.kind !== "super") {
        a.momentum = Math.min(3, a.momentum + 1);
        a.momentumT = 180;
      }
      if (!breakDefense && m.grab === "throw" && (this.tick - d.pad.edgeAt.grab <= 8 || d.move?.id === "throw" && this.tick <= d.throwTechUntil)) {
        for (const f of [a, d]) {
          f.move = null;
          f.hbActive = false;
          f.state = "ground";
          f.stateT = 0;
          f.landLag = 10;
          f.throwShield = 25;
          f.pad.consume("grab");
        }
        a.vx = -a.facing * 4;
        d.vx = a.facing * 4;
        this.text(px, py - 40, "ESCAPOU!", "#bae6fd", 28);
        audio.block();
        return;
      }
      if (a.idx === 0 && m.kind === "special" && /^s[123]$/.test(m.id)) this.challengeEvent("special", 1, m.id);
      if (tracked) a.connected = true;
      if (latest) a.contact = "hit";
      if (tracked) a.contactFrame = a.moveT;
      if (m.grab === "super") this.startSeq(SUPER_SEQUENCE[a.ch], a, d);
      else this.startSeq(m.grab, a, d);
      return;
    }
    const blocked = !breakDefense && d.guard && d.landLag === 0 && d.y === 0 && (d.state === "ground" || d.state === "block") && !m.unblockable && (m.level !== "low" || d.crouch) && (m.level !== "high" || !d.crouch);
    if (tracked) a.connected = true;
    if (latest) a.contact = blocked ? "block" : "hit";
    if (tracked) a.contactFrame = a.moveT;
    if (blocked) {
      payStamina(d, RESOURCE_RULES.blockCost + (m.rank >= 3 ? 2 : 0));
      const age = this.tick - d.pad.edgeAt.block, fresh = d.pad.edgeAt.block !== d.guardSpentAt && age >= 0;
      const precision = fresh && d.ch === "caetano" && d.parryCooldown === 0 && age < PRECISION_GUARD_FRAMES;
      const perfect = fresh && age < PERFECT_GUARD_FRAMES;
      const result = precision ? "precision" : perfect ? "perfect" : "block";
      if (precision || perfect) d.guardMeter = Math.min(GUARD_RULES.max, d.guardMeter + (precision ? 12 : 7));
      else d.guardMeter = Math.max(0, d.guardMeter - guardPressure(m));
      d.guardDelay = GUARD_RULES.delay;
      d.guardSpentAt = d.pad.edgeAt.block;
      d.guardResult = result;
      d.guardResultT = 36;
      d.guardReadyT = 0;
      this.recordImpact(d, result, impactStrength(m), px, py);
      if (d.idx === 0) {
        this.challengeEvent("block");
        if (m.level === "low") this.challengeEvent("blockLow");
        if (perfect || precision) this.challengeEvent("perfect");
      }
      const chip = precision || m.kind === "normal" ? 0 : m.dmg * Math.min(0.08, m.chip ?? 0.04);
      const prev = d.hp;
      d.hp = Math.max(this.sandboxTraining || m.kind !== "super" ? 1 : 0, d.hp - chip);
      gainEnergy(d, (prev - d.hp) * RESOURCE_RULES.energyOnDamage);
      this.combatEvent("chip", a, d, m.id, Math.max(0, prev - d.hp));
      d.dispHp = Math.max(d.hp, d.dispHp);
      this.gainMeter(a, m.dmg * 0.08);
      this.gainMeter(d, m.dmg * 0.05);
      d.state = "block";
      d.stateT = 0;
      d.blockstun = precision ? 4 : perfect ? Math.max(4, Math.ceil(m.blockstun * 0.6)) : m.blockstun;
      d.guard = true;
      d.vx = precision ? 0 : dir * m.kbBlock * 1.3;
      d.move = null;
      d.hbActive = false;
      this.hitstop = Math.max(this.hitstop, Math.round(m.hitstop * 0.6));
      this.shake = Math.max(this.shake, 2 + m.power);
      const color = precision ? "#fef08a" : perfect ? "#67e8f9" : "#bfe3ff";
      if (precision || perfect) {
        if (precision) {
          d.precision = 120;
          d.parryCooldown = 24;
          this.gainMeter(d, 6);
        }
        this.text(px, py - 40, precision ? "LEITURA!" : "PERFEITA!", color, precision ? 27 : 22);
        this.ring(px, py, color, precision ? 90 : 65, 18, 4);
        audio.perfectBlock(precision);
      } else audio.block();
      this.spark(px, py, color, perfect || precision ? 10 : 6, 5, 3, 12);
      this.ring(px, py, color, 36, 12, 3);
      this.hype = Math.max(this.hype, 0.1);
      if (this.training) this.train.lastDmg = 0;
      if (a.x === d.x) a.x -= dir;
      if (d.hp <= 0 && prev > 0) this.triggerKO(a, d);
      this.trainingEvent("block", a, m.id, d, impact?.serial ?? a.serial);
      if (d.guardMeter === 0 && !precision && !perfect) {
        this.combatEvent("guardBreak", a, d, m.id);
        d.guardBreakT = GUARD_RULES.breakFrames;
        d.state = "hit";
        d.stateT = 0;
        d.hitstun = GUARD_RULES.breakFrames;
        d.blockstun = 0;
        d.guard = d.armor = d.crouch = false;
        d.vx = dir * 0.8;
        d.guardResult = "none";
        d.guardResultT = 0;
        d.stunLow = false;
        if (latest) a.contact = "hit";
        this.recordImpact(d, "guardBreak", 2.5, px, py);
        this.text(px, py - 65, "QUEBRA DE GUARDA!", "#fbbf24", 29);
        this.reactArena(px, 2.5);
        this.ring(px, py, "#fbbf24", 160, 25, 7);
        this.spark(px, py, "#bfecff", 42, 11, 4, 24);
        this.hitstop = Math.max(this.hitstop, 11);
        this.shake = Math.max(this.shake, 9);
        audio.boom(0.45);
      }
      return;
    }
    if (!breakDefense && (d.armor || d.ch === "patrick" && d.formT > 0 && d.formShield > 0)) {
      if (d.ch === "patrick" && d.formT > 0 && d.formShield > 0) d.formShield--;
      d.manualFacing = false;
      this.recordImpact(d, "armor", 0.7, px, py);
      this.dealDamage(a, d, Math.max(1, m.dmg * 0.75 * (m.resourcePower ?? 1)));
      this.hitstop = Math.max(this.hitstop, 4);
      this.spark(px, py, "#e2e8f0", 10, 6, 3, 16);
      this.text(px, py - 30, "ARMADURA", "#cbd5e1", 18);
      audio.hit(0.7);
      if (d.hp <= 0) {
        d.armor = false;
        d.move = null;
        d.hbActive = false;
        d.state = "launched";
        d.y = -2;
        d.vy = -9;
        d.vx = dir * 6;
        this.triggerKO(a, d);
      }
      return;
    }
    if (a.idx === 0) {
      if (m.level === "low") this.challengeEvent("low");
      if (m.air || a.ch === "jane" && m.id === "s3" && a.y < 0) this.challengeEvent("air");
      if (m.kind === "special" && /^s[123]$/.test(m.id)) this.challengeEvent("special", 1, m.id);
    }
    const air = d.y < 0 || d.state === "launched";
    if (d.state !== "hit" && d.state !== "launched") {
      d.comboHits = 0;
      d.comboDmg = 0;
    }
    this.trackComboMove(a, d, m.id, impact?.serial ?? a.serial, m.kind !== "normal" || !!m.air);
    d.comboHits++;
    if (a.idx === 0) this.challengeEvent("combo", d.comboHits);
    const scale = comboDamageScale(d.comboHits - 1);
    const sonic = a.ch === "felipence" && a.resonance >= 3 && (m.id === "s1" || m.signature?.step === 6);
    const dmg = Math.max(1, (m.dmg + (sonic ? 18 : 0)) * (m.resourcePower ?? 1) * scale * (a.ch === "orango" ? 1 + a.momentum * 0.03 : 1));
    if (sonic) {
      a.resonance = a.resonanceT = 0;
      if (!m.signature) this.text(px, py - 72, "RESSON\xC2NCIA!", a.def.glow, 25);
      for (let i = 0; i < 3; i++) this.ring(px, py, a.def.glow, 110 + i * 45, 24 + i * 3, 5);
      audio.boom(0.55);
    } else if (a.ch === "felipence" && m.kind === "normal") {
      a.resonance = Math.min(3, a.resonance + 1);
      a.resonanceT = 240;
    }
    if (d.ch === "felipence") d.resonance = d.resonanceT = 0;
    if (a.ch === "orango") {
      a.momentum = Math.min(3, a.momentum + 1);
      a.momentumT = 180;
    }
    if (d.ch === "orango") d.momentum = d.momentumT = 0;
    this.dealDamage(a, d, dmg);
    if (m.signature) {
      this.moveBanner = { text: `${m.signature.name} \xB7 ${m.signature.step}/${m.signature.total}`, color: a.def.color, t: 6, dur: 55 };
      if (m.signature.step === m.signature.total) {
        this.parts = this.parts.filter((p) => p.type !== "text" || !["COMBO!", "COMBO AVAN\xC7ADO"].includes(p.text ?? ""));
        this.ring(px, py, a.def.glow, 170, 25, 6);
        if (a.ch === "ulisses") a.hp = Math.min(a.maxHp, a.hp + 16);
      }
    }
    if (a.formT > 0 && ["bieu", "aneninha", "santox"].includes(a.ch) && d.predictionCooldown === 0) {
      d.confusionT = 18;
      d.predictionCooldown = 90;
      this.text(d.x, FLOOR_Y - 205, "CONFUS\xC3O \xB7 0,3s", a.def.glow, 18);
    }
    this.trainingEvent("hit", a, m.id, d, impact?.serial ?? a.serial);
    this.interruptBike(d);
    if (d.ch === "jao" || d.ch === "hdsh") {
      for (const p of this.projectiles) if ((p.kind === "chess" || p.kind === "territory") && p.owner === d.idx) p.life = 0;
    }
    d.move = null;
    d.hbActive = false;
    d.guard = false;
    d.manualFacing = false;
    d.guardResultT = d.guardReadyT = 0;
    d.landLag = 0;
    d.armor = false;
    d.poseOverride = null;
    d.turn = 1;
    d.stunLow = m.level === "low" || d.crouch;
    d.hitstun = m.hitstun;
    if (!air && d.comboHits > 6) d.hitstun = Math.max(9, d.hitstun - (d.comboHits - 6) * 3);
    d.stateT = 0;
    d.groundSmash = false;
    if (m.launch > 0 || air || d.comboHits >= STANDING_COMBO_LIMIT) {
      d.state = "launched";
      d.vy = m.spike ? 9 : -(m.launch > 0 ? m.launch : 6.5);
      d.vx = dir * (m.launchVx || m.kb + 1);
      d.y = Math.min(d.y, -1);
      d.juggle++;
    } else {
      d.state = "hit";
      d.vx = dir * m.kb;
    }
    d.invuln = 0;
    this.hitstop = Math.max(this.hitstop, m.hitstop);
    this.shake = Math.max(this.shake, m.shake);
    this.hype = Math.max(this.hype, 0.25 * m.power);
    this.hitFx(a, d, m, px, py);
    if (this.training) this.train.idle = 0;
    if (d.hp <= 0) {
      d.vy = d.groundSmash ? 9 : -11;
      d.vx = dir * 7;
      d.y = Math.min(d.y, -2);
      d.state = "launched";
      this.triggerKO(a, d);
    }
  }
  hitFx(a, d, m, px, py) {
    this.reactArena(px, impactStrength(m), !!m.signature && m.signature.step === m.signature.total);
    if (a.ch === "eneas" && m.id === "s2") this.text(px, py - 40, "CASO GRAVE!", "#86efac", 30);
    const col = a.def.color;
    const glow = a.def.glow;
    const strength = impactStrength(m);
    if (d.comboHits >= 2) {
      const col2 = d.comboKind === "punish" ? "#fb923c" : d.comboKind === "advanced" ? "#d8b4fe" : "#67e8f9";
      this.ring(px, py, col2, d.comboKind === "basic" ? 45 : 75, 16, d.comboKind === "punish" ? 6 : 3);
      if (d.comboHits === 2) this.text(px, py - 65, d.comboKind === "punish" ? "PUNI\xC7\xC3O" : d.comboKind === "advanced" ? "COMBO AVAN\xC7ADO" : "COMBO!", col2, 21);
    }
    this.recordImpact(d, "hit", strength, px, py);
    audio.hit(strength);
    this.spark(px, py, glow, 16 + Math.round(strength * 15), 6 + strength * 4, 3 + strength, 20 + strength * 5);
    this.spark(px, py, "#ffffff", m.rank === 1 ? 3 : 5, 6, 2, 10);
    this.glowFx(px, py, "#ffffff", 40 + strength * 25, 8);
    if (strength >= 1) this.ring(px, py, col, 50 + strength * 25, 16, 5);
    if (strength >= 2 || m.kind === "normal" && m.rank === 3) {
      this.flash = { c: glow, a: m.kind === "normal" ? 0.16 : Math.min(0.55, 0.2 * strength) };
    }
    if (a.ch === "caetano" && m.id === "s2") {
      this.flash = { c: "#c084fc", a: 0.55 };
      this.glowFx(px, py, "#e9d5ff", 130, 14);
      this.spark(px, py, "#e9d5ff", 20, 9, 3, 18);
      this.ring(px, py, "#e9d5ff", 120, 18, 4);
      this.hitstop = Math.max(this.hitstop, 13);
      audio.purple();
      this.streak(px, py, 0, "#fff7ed");
      this.streak(px, py, Math.PI, "#c084fc");
      this.text(px, py - 58, m.dmg > 55 ? "PRECIS\xC3O!" : "PERFURANTE!", "#f5d0fe", 30);
    }
    if (a.ch === "caetano" && m.id === "s3") {
      this.flash = { c: "#ffffff", a: 0.7 };
      for (let i = 0; i < 4; i++) this.ring(px, py, i % 2 ? "#c084fc" : "#7e22ce", 100 + i * 60, 22 + i * 4, 10);
      this.spark(px, py, "#c084fc", 45, 14, 5, 28);
      this.glowFx(px, py, "#a855f7", 260, 22);
      audio.boom(0.9);
      this.text(px, py - 60, "POW!", "#e9d5ff", 54);
    }
    if (a.ch === "orango" && m.id === "s1") {
      this.flash = { c: "#ff3b2f", a: 0.6 };
      for (let i = 0; i < 3; i++) this.ring(px, py, i % 2 ? "#ff7a5c" : "#ff2a2a", 90 + i * 80, 20 + i * 4, 12);
      for (let i = 0; i < 16; i++) this.streak(px, py, i / 16 * Math.PI * 2, "#ff6a4a");
      this.glowFx(px, py, "#ff3b2f", 240, 20);
      audio.boom(0.8);
      this.text(px, py - 60, "SMASH!", "#fecaca", 50);
    }
    if (a.ch === "caetano" && m.id === "s1") this.spark(px, py, "#e9d5ff", 22, 11, 4, 20);
    if (a.ch === "rickzera" && m.id === "s2") {
      this.spark(px, py, "#a3ff36", 12, 7, 3, 20);
      this.ring(px, py, "#39df71", 75, 18, 4);
      this.flash = { c: "#65ef80", a: 0.28 };
    }
    void d;
  }
  knuckleCrater(x) {
    this.dust(x, FLOOR_Y, 10);
    this.spark(x, FLOOR_Y - 6, "#a3ff36", 16, 8, 3, 24);
    this.ring(x, FLOOR_Y - 4, "#86efac", 84, 20, 4);
    this.parts.push({ type: "crater", x, y: FLOOR_Y + 4, vx: 0, vy: 0, life: 180, max: 180, size: 64, color: "#a3ff36", g: 0, rot: 0, grow: 0 });
    this.shake = Math.max(this.shake, 15);
    audio.knuckleImpact();
  }
  recordImpact(d, kind, strength, x = d.x, y = FLOOR_Y + d.y - d.def.hurtH * 0.58) {
    d.impact = { serial: (d.impact?.serial ?? 0) + 1, kind, strength, tick: this.tick, x, y };
  }
  reactArena(x, strength, finisher = false) {
    if (strength < 1.2 && !finisher) return;
    const positions = [250, 800, 1350], slot = positions.reduce((best, p, i) => Math.abs(p - x) < Math.abs(positions[best] - x) ? i : best, 0);
    if (Math.abs(positions[slot] - x) > 280 || this.tick - this.arena.tick < 16) return;
    this.arena.damage[slot] = Math.min(3, this.arena.damage[slot] + 1);
    this.arena.slot = slot;
    this.arena.tick = this.tick;
    this.arena.serial++;
  }
  // ------------------------------------------------------------ DEDILHO CLASH
  startClash(a, b, kind = "dedilho") {
    this.clash = { kind, startedAt: this.tick, pending: [0, 0], a, b, t: this.cfg.online ? -60 : 0, c: [0, 0], m: [a.move, b.move], x: (a.x + b.x) / 2 };
    for (const f of [a, b]) {
      f.state = "seq";
      f.manualFacing = false;
      f.guardResultT = f.guardReadyT = 0;
      f.poseOverride = kind === "super" ? "rush" : "dedo_a";
      f.vx = 0;
      f.move = null;
      f.hbActive = false;
      f.aura = 1;
      f.armor = false;
      f.invuln = 0;
      f.glow = 0;
      f.landLag = 0;
      f.pad.consume(kind === "super" ? "super" : "p");
    }
    audio.clash();
    this.shake = 28;
    this.flash = { c: "#ffffff", a: 0.8 };
    this.moveBanner = null;
    this.announce(kind === "super" ? "BATALHA DE ULTS!" : "DEDILHO CLASH!", this.cfg.online ? "PREPARE SEU COMANDO!" : kind === "super" ? "APERTE SUA ULT REPETIDAMENTE!" : "APERTE SOCO REPETIDAMENTE!", this.cfg.online ? 50 : 150, "#fde047");
  }
  updateClash() {
    const c = this.clash;
    const inputFrame = c.t;
    c.t++;
    const mid = (c.a.x + c.b.x) / 2;
    this.camOv = { x: mid, zoom: 1.45 };
    this.camOvT = 2;
    const fs = [c.a, c.b];
    const action = c.kind === "super" ? "super" : "p";
    const active = inputFrame >= 0 && inputFrame < 150;
    for (let i = 0; i < 2; i++) {
      const f = fs[i];
      c.c[i] += c.pending[i];
      c.pending[i] = 0;
      if (!active) {
        f.pad.consume(action);
        continue;
      }
      if (f.cpu || this.training && i === 1 && this.train.dummy === 1) {
        if (this.random() < aiMashRate(this.cfg.difficulty) / 60) c.c[i]++;
      } else if (f.pad.buffered(action, this.tick)) {
        c.c[i]++;
        f.pad.consume(action);
        audio.tone(500 + c.c[i] * 12, 0.05, "square", 0.06);
      }
    }
    this.shake = Math.max(this.shake, 8);
    if (c.t % 2 === 0) {
      const lead = (c.c[0] - c.c[1]) * 6;
      const cx = mid + lead;
      this.spark(cx, FLOOR_Y - 115, c.t % 4 === 0 ? "#c084fc" : "#ff4a3a", 4, 9, 3, 14);
      this.spark(cx, FLOOR_Y - 115, "#ffffff", 2, 12, 2, 10);
    }
    if (c.t % 12 === 0) audio.clash();
    const diff = c.c[0] - c.c[1];
    if (!this.cfg.online && c.t >= 50 && Math.abs(diff) >= 10 || c.t >= (this.cfg.online ? 240 : 150)) {
      if (c.kind === "super" && diff === 0) {
        this.clash = null;
        for (const f of fs) {
          f.state = "ground";
          f.stateT = 0;
          f.poseOverride = null;
          f.aura = f.glow = 0;
          f.armor = false;
          f.turn = 1;
          f.landLag = 14;
          f.vx = (Math.sign(f.x - this.opp(f).x) || -f.facing) * 4;
        }
        this.announce("EMPATE DE ULTS!", "AS DUAS BARRAS FORAM GASTAS", 65, "#67e8f9");
        this.ring(mid, FLOOR_Y - 100, "#67e8f9", 180, 24, 6);
        audio.clash();
        return;
      }
      const w = diff > 0 ? 0 : diff < 0 ? 1 : this.random() < 0.5 ? 0 : 1;
      const win = fs[w];
      const lose = fs[1 - w];
      const m = c.m[w];
      this.clash = null;
      this.announce("", "", 0);
      this.ann = null;
      if (c.kind === "super") {
        this.startSeq(SUPER_SEQUENCE[win.ch], win, lose);
        this.text(win.x, FLOOR_Y - 190, "VENCEU A BATALHA DE ULT!", win.def.glow, 27);
        audio.boom(1);
        return;
      }
      win.state = "ground";
      win.poseOverride = null;
      win.aura = 0;
      win.landLag = 14;
      win.stateT = 0;
      lose.aura = 0;
      lose.poseOverride = null;
      lose.state = "hit";
      lose.comboHits = 1;
      lose.invuln = 0;
      this.dealDamage(win, lose, m.dmg);
      lose.state = "launched";
      lose.vy = -10;
      lose.vx = win.facing * 9;
      lose.y = -2;
      lose.juggle = 1;
      const px = lose.x;
      this.flash = { c: win.def.glow, a: 0.9 };
      this.shake = 36;
      this.hitstop = 12;
      for (let i = 0; i < 4; i++) this.ring(px, FLOOR_Y - 100, win.def.color, 120 + i * 70, 24, 10);
      this.spark(px, FLOOR_Y - 100, win.def.glow, 40, 14, 5, 26);
      this.text(px, FLOOR_Y - 190, `${win.def.short} VENCEU!`, win.def.glow, 40);
      audio.boom(1);
      audio.hit(3);
      if (lose.hp <= 0) this.triggerKO(win, lose);
    }
  }
  queueClashInput(side, startedAt, mask, frame = this.clash?.t ?? -1) {
    const c = this.clash, action = c?.kind === "super" ? "super" : "p";
    if (!c || c.t < 0 || c.startedAt !== startedAt || frame < 0 || frame >= 150 || !(mask & 1 << ACTIONS.indexOf(action))) return false;
    c.pending[c.a.idx === side ? 0 : 1]++;
    return true;
  }
  // ------------------------------------------------------------ SEQUÊNCIAS (agarrões e supers)
  startSuper(f) {
    if (this.cine?.f === f || this.cine?.next === f.idx) return;
    this.interruptBike(f);
    f.manualFacing = false;
    f.guardResultT = f.guardReadyT = 0;
    if (!this.infiniteTrainingResources) f.meter = Math.max(0, f.meter - RESOURCE_RULES.ultimateCost);
    this.combatEvent("super", f, this.opp(f), "super");
    f.state = "cine";
    f.stateT = 0;
    f.move = null;
    f.vx = 0;
    f.guard = f.crouch = false;
    f.hbActive = false;
    f.turn = 1;
    f.glow = 1;
    f.aura = 1;
    f.poseOverride = f.ch === "orango" || f.ch === "tubarao" ? "roar" : f.ch === "bieu" ? "drive" : f.ch === "nomad" ? "bazooka" : f.ch === "renngotti" ? "tilt_s" : f.ch === "aneninha" ? "roar" : f.ch === "santox" ? "abstract_s" : f.ch === "jao" ? "calculation_s" : f.ch === "jane" ? "zord_s" : f.ch === "cristyan" ? "hammock_s" : f.ch === "eneas" ? "atom_s" : "taunt";
    if (this.cine) {
      this.cine.next = f.idx;
      return;
    }
    this.beginSuperCine(f);
  }
  beginSuperCine(f) {
    this.cine = { f, t: 0, dur: f.ch === "caetano" ? 100 : f.ch === "orango" ? 120 : 75 };
    this.moveBanner = { text: f.def.superName, color: f.def.color, t: 0, dur: 150 };
    this.flash = { c: f.def.glow, a: 0.8 };
    this.hype = 1;
  }
  updateCine() {
    const c = this.cine;
    const f = c.f;
    c.t++;
    const o = this.opp(f);
    this.camOv = { x: f.x + f.facing * 50, zoom: 1.75 };
    this.camOvT = 2;
    this.speed = 1;
    if (f.ch === "caetano") {
      if (c.t === 1) {
        audio.purple();
        audio.boom(0.6);
        audio.say("Voc\xEA n\xE3o sabe de nada!", 1.1, 0.95);
      }
      if (c.t % 5 === 0) this.spark(f.x, FLOOR_Y - 100, "#c084fc", 3, 6, 3, 20);
    } else if (f.ch === "orango") {
      if (c.t === 1) audio.roar();
      this.shake = Math.max(this.shake, 7);
      if (c.t % 4 === 0) this.spark(f.x, FLOOR_Y - 90, "#ff4a3a", 3, 7, 3, 20);
      if (c.t === c.dur - 22) {
        f.poseOverride = "slam";
      }
      if (c.t === c.dur - 10) {
        this.ring(f.x + f.facing * 80, FLOOR_Y, "#ff3b2f", 380, 28, 14);
        this.ring(f.x + f.facing * 80, FLOOR_Y, "#ffb4a0", 240, 22, 8);
        this.shake = 34;
        this.flash = { c: "#ff2a2a", a: 0.7 };
        this.dust(f.x + f.facing * 80, FLOOR_Y, 16);
        audio.boom(1);
      }
    }
    if (f.ch !== "caetano" && f.ch !== "orango") {
      if (c.t === 1) {
        audio.tone(f.ch === "tubarao" ? 160 : 520, 0.7, "sawtooth", 0.22, 1e3);
        audio.say(f.ch === "eneas" ? "Ci\xEAncia! Sa\xFAde! Tecnologia! Meu nome \xE9 Acreano!" : f.def.superName, f.ch === "eneas" ? 1.8 : f.ch === "tubarao" ? 0.7 : 1.1, 1.05);
      }
      if (c.t % 5 === 0) {
        this.ring(f.x, FLOOR_Y - 100, f.def.glow, 90 + c.t * 2, 18, 3);
        this.spark(f.x, FLOOR_Y - 95, f.def.color, 4, 7, 3, 20);
      }
      this.shake = Math.max(this.shake, 3);
    }
    if (c.t >= c.dur) {
      this.cine = null;
      f.poseOverride = null;
      f.facing = o.x >= f.x ? 1 : -1;
      const sp = f.ch === "caetano" ? 17 : f.ch === "rickzera" ? 19 : 14;
      const m = {
        ...f.def.moves.pL,
        id: "super",
        kind: "super",
        rank: 9,
        startup: SUPER_STARTUP_FRAMES,
        active: ["santox", "jao", "jane", "cristyan", "eneas"].includes(f.ch) ? 24 : 34,
        recovery: 34,
        whiff: 0,
        dmg: 0,
        hb: [0, 100, -10, SUPER_CAPTURE_HEIGHT],
        grab: "super",
        unblockable: true,
        poses: ["rush", "rush"],
        advance: [SUPER_STARTUP_FRAMES, SUPER_STARTUP_FRAMES + (["santox", "jao", "jane", "cristyan", "eneas"].includes(f.ch) ? 24 : 34), ["santox", "jao", "jane", "cristyan", "eneas"].includes(f.ch) ? 12 : sp],
        trail: "fa",
        label: void 0,
        turn: void 0,
        charge: false
      };
      this.startMove(f, m);
      f.armor = false;
      f.glow = 1;
      f.aura = 1;
      audio.whoosh(2);
      if (c.next !== void 0) this.beginSuperCine(this.f[c.next]);
    }
  }
  startSeq(kind, a, d) {
    if (formPowerActive(d)) return;
    if (a.idx === 0 && !kind.startsWith("super")) this.reborn?.metric("grabs", 1);
    const dur = kind.startsWith("super") && WOC_ULTIMATES[a.ch] ? WOC_ULTIMATES[a.ch].duration : { puxao: 86, mordida: 78, engole: 100, superC: 215, superO: 215, superT: SHARK_ULT_DURATION, superR: 170, superB: 160, superN: 150, superG: 155, superA: 206, superS: 180, superJ: 195, superJane: 180, superCristyan: 185, superEneas: 195, superWoc: 180, vampire: 82, cupid: 82, moon: 74, throw: 60 }[kind];
    const recovered = kind.startsWith("super") ? this.recoveredCombos.get(d) : void 0;
    if (recovered) {
      d.comboHits = recovered.hits;
      d.comboDmg = recovered.damage;
      d.comboMoves = [...recovered.moves];
      d.comboKind = recovered.kind;
      d.comboLastSerial = recovered.serial;
    }
    const continuing = d.state === "hit" || d.state === "launched" || !!recovered;
    if (!continuing) {
      d.comboHits = 0;
      d.comboDmg = 0;
    }
    this.trackComboMove(a, d, a.move?.id ?? (kind.startsWith("super") ? "super" : kind), a.serial, true);
    this.seq = { kind, a, d, t: 0, dur, x0: d.x, damageScale: comboDamageScale(d.comboHits), resourcePower: a.move?.resourcePower ?? formStats(a).damage };
    a.state = "seq";
    d.state = "seq";
    for (const f of [a, d]) {
      f.manualFacing = false;
      f.guardResultT = f.guardReadyT = 0;
      f.landLag = 0;
      f.groundSmash = false;
    }
    this.interruptBike(a);
    this.interruptBike(d);
    a.move = d.move = null;
    a.hbActive = d.hbActive = false;
    a.vx = d.vx = 0;
    a.armor = false;
    a.guard = d.guard = false;
    for (const p of this.projectiles) if (p.kind === "chess" && p.owner === d.idx) p.life = 0;
    a.crouch = d.crouch = false;
    a.turn = d.turn = 1;
    d.facing = -a.facing;
    if (kind.startsWith("super")) {
      a.y = 0;
      d.y = 0;
      this.seq.x0 = a.x + a.facing * 80;
      d.x = a.x + a.facing * 80;
    }
    this.hitstop = Math.max(this.hitstop, kind === "puxao" || kind === "mordida" ? 8 : 0);
    if (kind === "puxao") {
      this.moveBanner = { text: "PUX\xC3O DE CAMISA", color: a.def.color, t: 0, dur: 75 };
      audio.roar();
    }
    if (kind === "mordida") audio.roar();
    this.shake = Math.max(this.shake, 6);
  }
  seqHit(a, d, dmg, power, color) {
    if (formPowerActive(d)) return;
    this.dealDamage(a, d, dmg * (this.seq?.damageScale ?? 1) * (this.seq?.resourcePower ?? 1));
    d.comboHits++;
    this.trainingEvent("hit", a, d.comboMoves[d.comboMoves.length - 1] || "super", d);
    if (a.idx === 0) this.challengeEvent("combo", d.comboHits);
    const px = d.x + rand(-14, 14);
    const py = FLOOR_Y + d.y - rand(60, 120);
    audio.hit(Math.min(power, 3));
    this.recordImpact(d, "hit", Math.min(power, 3), d.x, FLOOR_Y + d.y - d.def.hurtH * 0.58);
    this.spark(px, py, color, 10 + power * 4, 5 + power * 3, 3 + power, 16);
    this.spark(px, py, "#ffffff", 4, 7, 2, 9);
    this.glowFx(px, py, "#ffffff", 40 + power * 30, 7);
    this.ring(px, py, color, 40 + power * 25, 12, 4);
    this.shake = Math.max(this.shake, 5 + power * 4);
    this.hype = 1;
  }
  updateSeq() {
    const s = this.seq;
    const { a, d } = s;
    s.t++;
    const t = s.t;
    const f = a.facing;
    a.facing = f;
    d.facing = -f;
    const lerpTo = (obj, x, k) => {
      obj.x += (x - obj.x) * k;
    };
    if (s.kind.startsWith("super") && WOC_ULTIMATES[a.ch]) {
      const track = WOC_ULTIMATES[a.ch];
      a.poseOverride = ultimatePose(a.ch, t);
      d.poseOverride = t >= 145 ? "down" : "hit";
      d.x = a.x + f * (t >= 132 ? 85 + (t - 132) * 4 : 85);
      d.y = t >= 132 ? -Math.max(0, 100 * Math.sin(Math.min(1, (t - 132) / 40) * Math.PI)) : 0;
      for (const beat of track.beats) if (t === beat.frame) {
        this.seqHit(a, d, beat.damage, t === 132 ? 3 : 1.4, a.def.glow);
        if (beat.caption) this.text(d.x, FLOOR_Y - 180, beat.caption, a.def.glow, 35);
      }
      this.camOv = { x: (a.x + d.x) / 2, zoom: 1.2 };
      this.camOvT = 2;
    } else if (s.kind === "vampire" || s.kind === "cupid") {
      a.poseOverride = t < 28 ? "w2_s" : "w2_a";
      d.poseOverride = t < 62 ? "grabbed" : "air";
      d.x = a.x + f * (t < 62 ? 64 : 64 + (t - 62) * 5);
      d.y = t >= 62 ? -50 * Math.sin((t - 62) / 20 * Math.PI) : 0;
      if (t === 32 || t === 60) this.seqHit(a, d, a.def.moves.s2.dmg * (t === 32 ? 0.35 : 0.65), 1.5, a.def.glow);
      if (t === 60 && s.kind === "vampire") {
        a.blood = Math.min(3, a.blood + 1);
        a.hp = Math.min(a.maxHp, a.hp + 30);
        this.text(a.x, FLOOR_Y - 190, "SANGUE +1", a.def.glow, 20);
      }
    } else if (s.kind === "throw") {
      a.poseOverride = t < 28 ? "pH_s" : "pH_a";
      d.poseOverride = t < 28 ? "grabbed" : "air";
      if (t < 28) {
        d.x = a.x + f * 60;
        d.y = -Math.sin(t / 28 * Math.PI / 2) * 55;
      }
      if (t === 28) {
        s.x0 = d.x;
        this.seqHit(a, d, 70, 1.6, a.def.glow);
      }
      if (t >= 28) {
        const u = Math.min(1, (t - 28) / 27);
        d.x = s.x0 + f * 145 * u;
        d.y = -100 * Math.sin(u * Math.PI);
        d.rotAdd = -u * Math.PI;
        if (t > 55) d.poseOverride = "down";
      }
    } else if (s.kind === "puxao") {
      this.camOv = { x: (a.x + d.x) / 2, zoom: 1.35 };
      this.camOvT = 2;
      if (t <= 8) {
        lerpTo(d, a.x + f * 150, 0.4);
        a.poseOverride = "grabHold";
        d.poseOverride = "grabbed";
      } else if (t <= 28) {
        const u = (t - 8) / 20;
        d.x = a.x + f * (150 - 55 * easeOut(u));
        a.poseOverride = "pullIn";
        d.poseOverride = "grabbed";
        if (t % 3 === 0) this.dust(d.x, FLOOR_Y, 2);
        this.shake = Math.max(this.shake, 3);
        if (t === 12) audio.tone(200, 0.3, "sawtooth", 0.25, 90);
      } else if (t <= 50) {
        const u = (t - 28) / 22;
        a.poseOverride = "throwUp";
        d.poseOverride = "grabbed";
        d.x = a.x + f * (95 - 215 * u);
        d.y = -200 * Math.sin(Math.PI * u);
        d.rotAdd = -u * Math.PI * 2.5;
        if (t === 29) audio.whoosh(2);
      } else {
        if (t === 51) {
          d.rotAdd = 0;
          d.y = 0;
          d.x = a.x - f * 120;
          d.poseOverride = "down";
          a.poseOverride = "throwDown";
          this.seqHit(a, d, a.def.moves.s2.dmg, 3, "#ff3b2f");
          this.shake = 30;
          this.flash = { c: "#ff2a2a", a: 0.6 };
          this.ring(d.x, FLOOR_Y, "#ff3b2f", 260, 24, 12);
          this.dust(d.x, FLOOR_Y, 18);
          audio.boom(0.9);
          this.hitstop = 8;
          this.text(d.x, FLOOR_Y - 110, "BAM!", "#fecaca", 56);
        }
      }
    } else if (s.kind === "mordida") {
      this.camOv = { x: (a.x + d.x) / 2, zoom: 1.5 };
      this.camOvT = 2;
      if (t <= 6) lerpTo(a, d.x - f * 70, 0.5);
      a.poseOverride = "bite";
      d.poseOverride = "hitLow";
      d.rotAdd = -0.25;
      d.y = Math.min(0, d.y * 0.8);
      if (t === 12 || t === 28 || t === 44) {
        this.seqHit(a, d, 28, 1.6, "#ff2a2a");
        audio.bite();
        d.y = -14;
        a.exprT = 6;
        a.exprOverride = "n";
        this.text(d.x + f * 20, FLOOR_Y - 60, ["CRUNCH!", "NHAC!", "MORDE!"][(t - 12) / 16], "#fecaca", 40);
        this.shake = Math.max(this.shake, 9);
      }
      if (t === 60) {
        this.seqHit(a, d, 41, 2.6, "#ff2a2a");
        this.ring(d.x, FLOOR_Y - 30, "#ff3b2f", 200, 22, 10);
        this.flash = { c: "#ff2a2a", a: 0.5 };
        audio.roar();
      }
    } else if (s.kind === "engole") {
      this.updateEngole(s);
    } else if (s.kind === "superT") {
      this.updateSuperT(s);
    } else if (s.kind === "superR") {
      this.updateSuperR(s);
    } else if (s.kind === "moon") {
      this.updateMoon(s);
    } else if (s.kind === "superJane" || s.kind === "superCristyan" || s.kind === "superEneas") {
      this.updateTrioSuper(s);
    } else if (s.kind === "superS" || s.kind === "superJ") {
      this.updateViewerSuper(s);
    } else if (s.kind === "superA") {
      this.updateSuperA(s);
    } else if (s.kind === "superG") {
      this.updateSuperG(s);
    } else if (s.kind === "superB") {
      this.updateSuperB(s);
    } else if (s.kind === "superN") {
      this.updateSuperN(s);
    } else if (s.kind === "superC") {
      this.updateSuperC(s);
    } else {
      this.updateSuperO(s);
    }
    this.pushAttackerBack(s);
    d.x = clamp4(d.x, 40, 1560);
    a.x = clamp4(a.x, 40, 1560);
    this.animate(a);
    this.animate(d);
    if (t >= s.dur) this.finishSeq(s);
  }
  pushAttackerBack(_s) {
  }
  updateViewerSuper(s) {
    const { a, d, t } = s, santox = s.kind === "superS";
    a.poseOverride = santox ? t < 45 ? "abstract_s" : "abstract_a" : t < 48 ? "calculation_s" : "calculation_a";
    d.poseOverride = t < 45 ? "grabbed" : t > s.dur - 20 ? "down" : "air";
    d.x = clamp4(s.x0 + a.facing * Math.sin(t * 0.04) * 50, 40, 1560);
    d.y = t < 45 ? 0 : -Math.sin(Math.min(1, (t - 45) / (s.dur - 65)) * Math.PI) * 110;
    const times = santox ? [48, 78, 108, 144] : [52, 90, 128, 162];
    if (times.includes(t)) {
      this.seqHit(a, d, santox ? 60 : 65, t === times[3] ? 2.8 : 1.5, a.def.glow);
      this.flash = { c: a.def.color, a: 0.25 };
    }
  }
  updateTrioSuper(s) {
    const { a, d, t } = s;
    a.poseOverride = a.ch === "jane" ? t < 50 ? "zord_s" : "zord_a" : a.ch === "cristyan" ? t < 100 ? "hammock_s" : t < 145 ? "hammock_a" : "slam_a" : t < 75 ? "atom_s" : t > 175 ? "shout_a" : "atom_a";
    d.poseOverride = a.ch === "cristyan" && t < 125 ? "down" : t > s.dur - 18 ? "down" : "air";
    d.x = clamp4(s.x0 + a.facing * 45, 40, 1560);
    d.y = a.ch === "cristyan" && t < 125 ? -45 : -Math.sin(t / s.dur * Math.PI) * 75;
    const hits = a.ch === "jane" ? [[65, 50], [86, 50], [107, 50], [128, 50], [149, 50]] : a.ch === "cristyan" ? [[55, 30], [118, 30], [153, 200]] : [[143, 240], [178, 35]];
    for (const [at, dmg] of hits) if (t === at) this.seqHit(a, d, dmg, dmg > 100 ? 3 : 1.5, a.def.glow);
    if (a.ch === "eneas" && t === 178) audio.say("Meu nome \xE9 Acreano!", 1.4, 0.75);
  }
  updateEngole(s) {
    const { a, d, t } = s;
    const f = a.facing;
    this.camOv = { x: a.x + f * 35, zoom: 1.4 };
    this.camOvT = 2;
    a.poseOverride = t < 58 ? "swallow_a" : "bite_a";
    d.poseOverride = "grabbed";
    if (t < 24) {
      d.x += (a.x + f * 35 - d.x) * 0.24;
      d.y = -Math.sin(t / 24 * Math.PI / 2) * 65;
    } else if (t < 58) {
      d.hidden = true;
      d.x = a.x;
      this.shake = Math.max(this.shake, 4);
      if (t % 8 === 0) this.ring(a.x, FLOOR_Y - 110, a.def.glow, 65, 16, 3);
    }
    if (t === 24) audio.bite();
    if (t === 58) {
      d.hidden = false;
      this.seqHit(a, d, a.def.moves.s2.dmg, 3, a.def.glow);
      this.text(a.x, FLOOR_Y - 180, "DEVOLVIDO!", a.def.glow, 35);
      audio.boom(0.8);
    }
    if (t >= 58) {
      const u = clamp4((t - 58) / 30, 0, 1);
      d.x = a.x + f * (50 + 270 * u);
      d.y = -160 * Math.sin(u * Math.PI);
      d.rotAdd = u * Math.PI * 2;
      d.poseOverride = t > 88 ? "down" : "air";
      if (t % 4 === 0) this.spark(d.x, FLOOR_Y + d.y - 70, a.def.glow, 5, 5, 3, 18);
    }
  }
  updateSuperT(s) {
    const { a, d, t } = s, f = a.facing, motion = sharkUltMotion(t);
    this.camOv = { x: (a.x + d.x) / 2, zoom: t < 138 ? 1.35 : 1 };
    this.camOvT = 2;
    a.aura = 0.6;
    a.poseOverride = t < 30 ? "roar" : t < 116 ? "kiss" : t < 150 ? "fin_a" : "win";
    a.y = 0;
    d.hidden = false;
    d.poseOverride = t < SHARK_ULT_TAIL_FRAME ? "grabbed" : t < 185 ? "air" : "down";
    if (t < SHARK_ULT_TAIL_FRAME) {
      d.x = a.x + f * 80;
      d.y = -Math.sin(t * 0.15) * 3;
      d.rotAdd = 0;
    }
    for (const [at, damage] of SHARK_ULT_BEATS) if (t === at) {
      const tail = t === SHARK_ULT_TAIL_FRAME;
      this.seqHit(a, d, damage, tail ? 4 : 0.65, tail ? "#a5f3fc" : "#f9a8d4");
      if (tail) {
        this.flash = { c: "#a5f3fc", a: 0.45 };
        this.shake = 30;
        this.hitstop = 12;
        this.text(d.x, FLOOR_Y - 160, "RABADA!", "#a5f3fc", 46);
        audio.sharkTail();
        this.ring(d.x, FLOOR_Y - 80, "#7dd3fc", 180, 26, 6);
      } else {
        audio.sharkLick();
        this.text(a.x + f * 65, FLOOR_Y - 170, "\u2665", "#f9a8d4", 28);
      }
    }
    if (t >= SHARK_ULT_TAIL_FRAME) {
      d.x = s.x0 + f * SHARK_ULT_THROW * motion.flight;
      d.y = -250 * Math.sin(motion.flight * Math.PI);
      d.rotAdd = motion.flight < 1 ? -motion.flight * Math.PI * 2 : 0;
      if (t >= 185) {
        d.y = 0;
        d.rotAdd = 0;
      }
    }
    if (t === 190) audio.say("Quando ter\xE1 live?", 1.2, 0.85);
  }
  updateSuperR(s) {
    const { a, d, t } = s;
    const f = a.facing;
    this.camOv = { x: (a.x + d.x) / 2, zoom: 1.4 };
    this.camOvT = 2;
    a.aura = a.glow = 1;
    const beats2 = [18, 38, 58, 78, 98, 122];
    const i = beats2.indexOf(t);
    a.poseOverride = t < 122 ? ["franco_a", "pM_a", "wise_a", "kM_a", "pH_a"][Math.min(4, Math.floor(t / 24))] : "wise_a";
    d.poseOverride = "hit";
    d.x = a.x + f * 105;
    if (i >= 0) {
      this.seqHit(a, d, i === 5 ? 155 : 25, i === 5 ? 4 : 1.4, a.def.glow);
      this.text(d.x, FLOOR_Y - 160, `WISE ${i + 1}x`, a.def.glow, i === 5 ? 54 : 32);
      for (let k = 0; k < 8; k++) this.streak(d.x, FLOOR_Y - 100, k * Math.PI / 4, "#86efac");
      if (i === 5) {
        this.flash = { c: "#86efac", a: 0.9 };
        this.shake = 42;
        this.hitstop = 12;
        audio.boom(1.4);
        this.ring(d.x, FLOOR_Y - 100, "#4ade80", 380, 28, 8);
      }
    }
    if (t > 122) {
      const u = clamp4((t - 122) / 30, 0, 1);
      d.x = a.x + f * (105 + 300 * u);
      d.y = -120 * Math.sin(u * Math.PI);
      d.rotAdd = -u * Math.PI;
      d.poseOverride = t > 152 ? "down" : "air";
      if (t > 152) a.poseOverride = "win";
    }
  }
  updateMoon(s) {
    const { a, d, t } = s;
    const f = a.facing;
    this.camOv = { x: (a.x + d.x) / 2, zoom: t < 25 ? 1.3 : 0.9 };
    this.camOvT = 2;
    if (t < 25) {
      a.poseOverride = "grabHold";
      d.poseOverride = "grabbed";
      d.x += (a.x + f * 78 - d.x) * 0.3;
      d.y = 0;
    } else {
      a.poseOverride = t < 45 ? "moon_a" : "idle";
      d.poseOverride = "air";
      const u = t - 25;
      d.x = a.x + f * (80 + u * 0.9);
      d.y = -14 * u + 0.18 * u * u;
      d.rotAdd = -Math.min(1, u / 35) * Math.PI * 2;
      if (t % 5 === 0) this.spark(d.x, FLOOR_Y + d.y - 70, "#e2e8f0", 4, 4, 3, 16);
    }
    if (t === 25) {
      this.seqHit(a, d, a.def.moves.s1.dmg, 2.4, a.def.glow);
      this.text(d.x, FLOOR_Y - 200, "PRA LUA!", "#f8fafc", 42);
      this.ring(a.x + f * 65, FLOOR_Y - 70, "#e2e8f0", 140, 20, 5);
      audio.whoosh(2);
      audio.tone(260, 0.6, "triangle", 0.15, 1500);
    }
  }
  updateSuperA(s) {
    const { a, d, t } = s;
    const f = a.facing;
    this.camOv = { x: (a.x + d.x) / 2, zoom: 1.02 };
    this.camOvT = 2;
    a.y = -Math.abs(Math.sin(t * Math.PI / 12)) * 8;
    a.aura = a.glow = 1;
    a.poseOverride = Math.floor(t / 12) % 2 ? "dance1" : "dance2";
    d.poseOverride = t < 156 ? "hit" : "air";
    if (t < 45) d.x += (a.x + f * 155 - d.x) * 0.12;
    if (t === 1) audio.say("Yo soy de Bolivia!", 1.35, 1.05);
    if (t <= 156 && t % 12 === 0) {
      const notes = [392, 494, 587, 494, 440, 523, 659, 523];
      audio.tone(notes[Math.floor(t / 12) % notes.length], 0.16, "triangle", 0.08);
      audio.noise(0.045, 0.08, 1500, "bandpass");
    }
    if (t >= 56 && t <= 136 && (t - 56) % 20 === 0) {
      this.seqHit(a, d, 24, 1.1, a.def.glow);
      d.x = a.x + f * (155 + (t - 56) * 0.65);
      if (t === 56) this.text(d.x, FLOOR_Y - 190, "\xA1BOLIVIA!", a.def.glow, 25);
    }
    if (t === 156) {
      s.x0 = d.x;
      this.seqHit(a, d, 170, 4, a.def.glow);
      this.flash = { c: "#fbcfe8", a: 0.85 };
      this.shake = 35;
      this.hitstop = 10;
      this.text(d.x, FLOOR_Y - 180, "YO SOY DE BOLIVIA!", "#fef08a", 39);
      audio.boom(1.2);
    }
    if (t > 156 && t < 187) {
      const u = (t - 156) / 31;
      d.x = s.x0 + f * 200 * u;
      d.y = -150 * Math.sin(u * Math.PI);
      d.rotAdd = -u * Math.PI;
    }
    if (t >= 187) {
      d.y = 0;
      d.rotAdd = 0;
      d.poseOverride = "down";
      a.poseOverride = "win";
    }
    if (t % 3 === 0) {
      const colors = ["#ef4444", "#facc15", "#22c55e", "#ec4899"];
      this.spark(a.x + f * rand(-150, 360), FLOOR_Y - rand(140, 260), colors[Math.floor(t / 3) % 4], 3, 3, 3, 36);
    }
  }
  updateSuperG(s) {
    const { a, d, t } = s;
    const f = a.facing;
    this.camOv = { x: (a.x + d.x) / 2, zoom: t < 65 ? 1.3 : 1.15 };
    this.camOvT = 2;
    a.aura = a.glow = 1;
    a.poseOverride = t < 65 ? "tilt_s" : t < 105 ? "tilt_a" : "win";
    d.poseOverride = t < 65 ? "grabbed" : t < 95 ? "hitLow" : "down";
    if (t < 65) d.x = a.x + f * 120;
    if (t >= 35 && t < 65) this.shake = Math.max(this.shake, 3 + (t - 35) * 0.2);
    if (t === 40) audio.tone(100, 0.5, "sawtooth", 0.2, 400);
    if (t === 65) {
      s.x0 = d.x;
      this.seqHit(a, d, 315, 4.5, "#f8fafc");
      this.flash = { c: "#ffffff", a: 0.95 };
      this.expl = { t: 0, color: "#cbd5e1", dur: 50 };
      this.hitstop = 12;
      this.shake = 48;
      this.text(d.x, FLOOR_Y - 165, "TILT!", "#f8fafc", 64);
      for (let i = 0; i < 6; i++) this.ring(d.x, FLOOR_Y - 55, i % 2 ? "#e2e8f0" : "#64748b", 130 + i * 65, 25 + i * 3, 8);
      this.dust(d.x, FLOOR_Y, 22);
      this.spark(d.x, FLOOR_Y - 70, "#d6b78b", 38, 13, 5, 32);
      audio.boom(1.7);
    }
    if (t >= 65 && t < 95) {
      const u = (t - 65) / 30;
      d.x = s.x0 + f * 160 * u;
      d.y = -45 * Math.sin(u * Math.PI);
      d.rotAdd = -u * Math.PI * 0.5;
    }
    if (t >= 95) {
      d.y = 0;
      d.rotAdd = 0;
    }
  }
  updateSuperB(s) {
    const { a, d, t } = s;
    const f = a.facing;
    this.camOv = { x: (a.x + d.x) / 2, zoom: t < 70 ? 1.1 : 1.3 };
    this.camOvT = 2;
    a.poseOverride = t < 112 ? "drive" : "win";
    a.aura = 1;
    d.poseOverride = t < 70 ? "grabbed" : t < 112 ? "air" : "down";
    if (t < 70) {
      a.x += f * (t < 35 ? 0.5 : 2);
      d.x = a.x + f * 112;
      if (t % 5 === 0) this.dust(a.x - f * 55, FLOOR_Y, 3);
    }
    if (t === 35) audio.tone(85, 0.8, "sawtooth", 0.25, 340);
    if (t === 70) {
      s.x0 = d.x;
      this.seqHit(a, d, 275, 4, a.def.glow);
      this.flash = { c: "#e9d5ff", a: 0.9 };
      this.shake = 42;
      this.hitstop = 12;
      this.text(d.x, FLOOR_Y - 170, "PREST\xCDGIO!", a.def.glow, 47);
      for (let i = 0; i < 5; i++) this.ring(d.x, FLOOR_Y - 80, i % 2 ? "#ffffff" : a.def.color, 140 + i * 55, 28, 7);
      audio.boom(1.5);
    }
    if (t >= 70 && t < 112) {
      const u = (t - 70) / 42;
      d.x = s.x0 + f * 310 * u;
      d.y = -245 * Math.sin(u * Math.PI);
      d.rotAdd = -u * Math.PI * 3;
    }
    if (t >= 112) {
      d.y = 0;
      d.rotAdd = 0;
      if (t === 112) {
        this.dust(d.x, FLOOR_Y, 18);
        this.ring(d.x, FLOOR_Y, a.def.color, 230, 24, 8);
      }
    }
  }
  updateSuperN(s) {
    const { a, d, t } = s;
    const f = a.facing;
    this.camOv = { x: (a.x + d.x) / 2, zoom: t < 60 ? 1.3 : 1.1 };
    this.camOvT = 2;
    a.poseOverride = t < 100 ? "bazooka" : "win";
    a.aura = a.glow = 1;
    d.poseOverride = t < 60 ? "grabbed" : t < 105 ? "air" : "down";
    if (t < 35) d.x = a.x + f * 300;
    if (t === 35) {
      const move = { ...a.def.moves.s1, id: "arena", dmg: 285, kind: "super" };
      this.projectiles.push({ owner: a.idx, kind: "bazooka", x: a.x + f * 70, y: -105, vx: f * 10, life: 30, serial: a.serial, move, age: 0, radius: 24 });
      audio.noise(0.25, 0.3, 1500, "lowpass");
      audio.tone(120, 0.3, "sawtooth", 0.24, 40);
    }
    for (const p of this.projectiles.filter((p2) => p2.kind === "bazooka" && p2.owner === a.idx)) {
      p.x += p.vx;
      p.age = (p.age ?? 0) + 1;
      p.life--;
    }
    if (t === 60) {
      this.projectiles = this.projectiles.filter((p) => p.kind !== "bazooka" || p.owner !== a.idx);
      s.x0 = d.x;
      this.seqHit(a, d, 285, 4.5, "#fde68a");
      this.expl = { t: 0, color: "#f59e0b", dur: 65 };
      this.flash = { c: "#fff7d6", a: 1 };
      this.shake = 48;
      this.hitstop = 12;
      this.text(d.x, FLOOR_Y - 180, "ARENA!", "#fde68a", 60);
      for (let i = 0; i < 7; i++) this.ring(d.x, FLOOR_Y - 90, i % 2 ? "#fff7d6" : "#f97316", 130 + i * 65, 28 + i * 2, 9);
      this.spark(d.x, FLOOR_Y - 85, "#fde68a", 55, 15, 5, 30);
      audio.boom(1.8);
    }
    if (t >= 60 && t < 105) {
      const u = (t - 60) / 45;
      d.x = s.x0 + f * 250 * u;
      d.y = -225 * Math.sin(u * Math.PI);
      d.rotAdd = -u * Math.PI * 2;
    }
    if (t >= 105) {
      d.y = 0;
      d.rotAdd = 0;
      if (t === 105) this.dust(d.x, FLOOR_Y, 20);
    }
  }
  updateSuperC(s) {
    const { a, d, t } = s;
    const f = a.facing;
    const mid = (a.x + d.x) / 2;
    this.camOv = { x: mid, zoom: t > 56 && t < 165 ? 1.25 : 1.6 };
    this.camOvT = 2;
    this.speed = Math.max(this.speed, 0.6);
    a.aura = 1;
    a.glow = 1;
    if (t <= 6) a.x += (s.x0 - f * 75 - a.x) * 0.4;
    if (t >= 4 && t <= 52 && (t - 4) % 8 === 0) {
      const i = (t - 4) / 8;
      a.poseOverride = ["pL_a", "kM_a", "pM_a", "kL_a", "pH_a", "kH_a", "pM_a"][i];
      d.poseOverride = i % 2 ? "hit" : "hitLow";
      d.x = a.x + f * (75 + (i % 2 ? 6 : -6));
      this.seqHit(a, d, 14, 1, "#c084fc");
      for (let k = 0; k < 6; k++) this.streak(d.x, FLOOR_Y - 90, rand(0, Math.PI * 2), "#e9d5ff");
    }
    if (t === 58) {
      a.poseOverride = "kH_a";
      this.seqHit(a, d, 20, 2, "#e9d5ff");
      audio.purple();
    }
    if (t >= 58 && t <= 86) {
      const u = clamp4((t - 58) / 26, 0, 1);
      d.y = -170 * easeOut(u);
      d.poseOverride = "air";
      if (t > 64) a.y = -160 * easeOut(clamp4((t - 64) / 22, 0, 1));
    }
    if (t > 86 && t < 140) {
      d.y = -170 + Math.sin(t * 0.4) * 6;
      a.y = d.y * 0.93;
      d.x = a.x + f * 74;
      d.rotAdd = Math.sin(t * 0.3) * 0.2;
    }
    if (t >= 90 && t <= 117 && (t - 90) % 9 === 0) {
      const i = (t - 90) / 9;
      a.poseOverride = ["pL_a", "kM_a", "pM_a", "kL_a"][i];
      this.seqHit(a, d, 18, 1.2, "#c084fc");
    }
    if (t === 124) {
      a.poseOverride = "chute_s";
      audio.purple();
    }
    if (t >= 124 && t <= 138) {
      const u = (t - 124) / 14;
      const c = Math.cos(u * Math.PI * 2);
      a.turn = Math.abs(c) < 0.18 ? c < 0 ? -0.18 : 0.18 : c;
      a.aura = 1;
    }
    if (t === 139) {
      a.turn = 1;
      a.poseOverride = "chute_a";
      audio.whoosh(3);
      this.flash = { c: "#c084fc", a: 0.5 };
    }
    if (t === 142) {
      this.seqHit(a, d, 130, 4, "#e9d5ff");
      this.flash = { c: "#ffffff", a: 1 };
      this.shake = 42;
      this.hitstop = 10;
      audio.boom(1.2);
      this.text(d.x, FLOOR_Y + d.y - 90, "CONSPIRA\xC7\xC3O!", "#f5d0fe", 56);
    }
    if (t > 142 && t <= 158) {
      const u = (t - 142) / 16;
      d.x = s.x0 + f * 380 * u;
      d.y = -170 * (1 - u * u);
      d.poseOverride = "air";
      d.rotAdd = -u * Math.PI * 3;
      a.y += (0 - a.y) * 0.12;
    }
    if (t === 159) {
      d.y = 0;
      d.rotAdd = 0;
      d.poseOverride = "down";
      this.expl = { t: 0, color: "#c084fc", dur: 55 };
      for (let i = 0; i < 5; i++) this.ring(d.x, FLOOR_Y - 20, i % 2 ? "#e9d5ff" : "#a855f7", 160 + i * 110, 26 + i * 4, 14);
      this.spark(d.x, FLOOR_Y - 40, "#e9d5ff", 90, 18, 6, 40);
      this.spark(d.x, FLOOR_Y - 40, "#a855f7", 60, 12, 8, 46);
      this.glowFx(d.x, FLOOR_Y - 60, "#ffffff", 520, 30);
      this.dust(d.x, FLOOR_Y, 24);
      this.flash = { c: "#ffffff", a: 1 };
      this.shake = 55;
      this.camOv = { x: d.x, zoom: 1.2 };
      audio.boom(2);
    }
    if (t > 158) {
      a.y += (0 - a.y) * 0.15;
      if (t > 170) {
        a.poseOverride = "win";
        a.turn = 1;
      }
      this.camOv = { x: (a.x + d.x) / 2 + f * 120, zoom: 1.15 };
    }
  }
  updateSuperO(s) {
    const { a, d, t } = s;
    const f = a.facing;
    const mid = (a.x + d.x) / 2;
    this.camOv = { x: mid, zoom: t > 74 && t < 190 ? 1.25 : 1.55 };
    this.camOvT = 2;
    this.speed = Math.max(this.speed, 0.6);
    a.aura = 1;
    a.glow = 1;
    if (t <= 6) a.x += (s.x0 - f * 105 - a.x) * 0.4;
    if (t >= 4 && t <= 68 && (t - 4) % 8 === 0) {
      const i = (t - 4) / 8;
      a.poseOverride = ["pL_a", "pM_a", "pH_a", "kL_a", "pM_a", "pH_a", "kM_a", "pL_a", "pH_a"][i];
      d.poseOverride = i % 2 ? "hit" : "hitLow";
      d.x = a.x + f * (105 + (i % 2 ? 8 : -8));
      this.seqHit(a, d, i === 8 ? 24 : 14, 1.5, "#ff3b2f");
      if (i % 3 === 0) a.exprT = 8;
      a.exprOverride = "shout";
      this.shake = Math.max(this.shake, 12);
      for (let k = 0; k < 6; k++) this.streak(d.x, FLOOR_Y - 90, rand(0, Math.PI * 2), "#ff7a5c");
    }
    if (t === 76) {
      a.poseOverride = "throwUp";
      this.seqHit(a, d, 25, 2.2, "#ff3b2f");
      audio.roar();
    }
    if (t >= 76 && t <= 100) {
      const u = clamp4((t - 76) / 24, 0, 1);
      d.y = -170 * easeOut(u);
      d.poseOverride = "air";
    }
    if (t > 100 && t < 154) {
      d.y = -170 + Math.sin(t * 0.4) * 6;
      d.rotAdd = Math.sin(t * 0.3) * 0.2;
    }
    if (t === 104) {
      a.poseOverride = "roar";
      audio.roar();
      this.flash = { c: "#ff2a2a", a: 0.6 };
    }
    if (t >= 104 && t < 150) {
      this.shake = Math.max(this.shake, 6 + (t - 104) * 0.2);
      if (t % 2 === 0) {
        const tip = this.tipPos(a, "wF");
        const ang = rand(0, Math.PI * 2);
        const dd = 130 - (t - 104) * 2;
        this.parts.push({ type: "spark", x: tip.x + Math.cos(ang) * dd, y: tip.y + Math.sin(ang) * dd, vx: -Math.cos(ang) * 6, vy: -Math.sin(ang) * 6, life: 18, max: 18, size: 4, color: "#ff5a3a", g: 0, rot: 0, grow: 0 });
      }
    }
    if (t === 118) a.poseOverride = "dedo_s";
    if (t === 150) {
      a.poseOverride = "dedo_a";
      audio.red();
      audio.whoosh(3);
      this.flash = { c: "#ff2a2a", a: 0.8 };
    }
    if (t === 154) {
      this.seqHit(a, d, 180, 4.5, "#ff3b2f");
      this.flash = { c: "#ff2a2a", a: 1 };
      this.shake = 50;
      this.hitstop = 10;
      this.expl = { t: 0, color: "#ff2a2a", dur: 70 };
      for (let i = 0; i < 6; i++) this.ring(d.x, FLOOR_Y + d.y, i % 2 ? "#ffb4a0" : "#ff2a2a", 200 + i * 110, 28 + i * 4, 16);
      this.text(d.x, FLOOR_Y + d.y - 90, "DEDILHO SUPREMO!", "#fecaca", 60);
      audio.boom(2);
    }
    if (t > 154 && t <= 174) {
      const u = (t - 154) / 20;
      d.x = s.x0 + f * 440 * u;
      d.y = -170 * (1 - u * u);
      d.poseOverride = "air";
      d.rotAdd = -u * Math.PI * 3;
    }
    if (t === 175) {
      d.y = 0;
      d.rotAdd = 0;
      d.poseOverride = "down";
      for (let i = 0; i < 4; i++) this.ring(d.x, FLOOR_Y - 20, "#ff2a2a", 200 + i * 130, 28, 14);
      this.spark(d.x, FLOOR_Y - 40, "#ff6a4a", 80, 18, 7, 40);
      this.glowFx(d.x, FLOOR_Y - 60, "#ffffff", 560, 30);
      this.dust(d.x, FLOOR_Y, 24);
      this.flash = { c: "#ff2a2a", a: 1 };
      this.shake = 55;
      audio.boom(2);
      this.camOv = { x: d.x, zoom: 1.2 };
    }
    if (t > 175) {
      this.camOv = { x: (a.x + d.x) / 2 + f * 120, zoom: 1.15 };
      if (t === 190) {
        a.poseOverride = "roar";
        audio.roar();
      }
    }
  }
  finishSeq(s) {
    const { a, d } = s;
    this.seq = null;
    a.state = "ground";
    a.stateT = 0;
    a.poseOverride = null;
    a.landLag = 10;
    a.y = 0;
    a.turn = 1;
    a.glow = a.aura = 0;
    a.armor = false;
    d.hidden = false;
    d.rotAdd = 0;
    d.poseOverride = null;
    d.turn = 1;
    d.facing = -a.facing;
    if (s.kind === "moon") {
      a.landLag = 3;
      d.state = "launched";
      d.y = Math.min(-200, d.y);
      d.vy = 1.5;
      d.vx = a.facing * 2;
      d.juggle = 1;
    } else if (s.kind === "mordida") {
      d.state = "launched";
      d.y = -2;
      d.vy = -8;
      d.vx = a.facing * 6;
      d.juggle = 1;
    } else {
      d.state = "down";
      d.stateT = s.kind === "puxao" ? 18 : 0;
      d.y = 0;
      d.vx = 0;
    }
    d.x = clamp4(d.x, 40, 1560);
    a.x = clamp4(a.x, 40, 1560);
    if (Math.abs(a.x - d.x) < 60) a.x = d.x - a.facing * 60;
    a.x = clamp4(a.x, 40, 1560);
    if (d.hp <= 0) this.triggerKO(a, d);
  }
  // ------------------------------------------------------------ animação
  animate(f) {
    f.animT++;
    const def = f.def;
    let name = "idle";
    let k = 0.32;
    const m = f.move;
    let recoveryProgress = null;
    switch (f.state) {
      case "ground":
        name = f.guard ? f.crouch ? "blockC" : "block" : f.crouch ? "crouch" : "idle";
        if (f.landLag > 0) name = "crouch";
        break;
      case "dash":
        name = f.vx * f.facing > 0 ? "rush" : "jump";
        k = 0.4;
        break;
      case "jump":
        name = "jump";
        break;
      case "transform":
        f.vx = f.vy = 0;
        f.formStartup = Math.max(0, RESOURCE_RULES.activationFrames - f.stateT);
        if (f.stateT === RESOURCE_RULES.commitFrame) {
          if (f.idx === 0) this.challengeEvent("transform");
          f.formT = FORMS[f.ch].duration;
          f.formShield = f.ch === "patrick" ? 3 : 0;
          f.formElapsed = 0;
          this.ring(f.x, FLOOR_Y - 10, f.def.color, 240, 30, 7);
          audio.boom(0.8);
        }
        f.aura = 1;
        f.glow = 1;
        f.poseOverride = f.stateT < 36 ? "crouch" : "win";
        if (f.stateT >= RESOURCE_RULES.activationFrames) {
          f.formStartup = 0;
          f.state = "ground";
          f.stateT = 0;
          f.poseOverride = null;
          f.landLag = 8;
        }
        break;
      case "dizzy":
        name = "dizzy";
        break;
      case "attack":
        if (m) {
          const phase = movePhase(m, Math.max(0, f.moveT - 1), f.connected);
          if (phase.phase === "startup") {
            name = m.poses[0];
            if (f.ch === "jane" && m.id === "s3" && f.moveT > 18) name = "jump";
            k = 0.4;
          } else if (phase.phase === "active") {
            name = m.poses[1];
            k = 0.8;
          } else {
            name = m.air ? "jump" : f.crouch ? "crouch" : "idle";
            recoveryProgress = phase.progress;
            k = 0.5;
          }
        }
        break;
      case "hit":
        name = f.stunLow ? "hitLow" : "hit";
        k = 0.5;
        break;
      case "block":
        name = f.crouch ? "blockC" : "block";
        k = 0.6;
        break;
      case "launched":
        name = "air";
        k = 0.25;
        break;
      case "down":
        name = "down";
        k = 0.35;
        break;
      case "getup":
        name = "getup";
        break;
      case "win":
        name = "win";
        break;
      default:
        break;
    }
    if (f.poseOverride) {
      name = f.poseOverride;
      k = 0.5;
    }
    const base2 = def.poses[name] || def.poses.idle;
    f.poseName = name;
    const choreographed = f.state === "attack" && m && !f.poseOverride;
    const t = choreographed ? attackAnimation(f.ch, m, Math.max(0, f.moveT - 1), f.connected, def.poses[m.air ? "jump" : f.crouch ? "crouch" : "idle"]) : f.poseOverride ? { ...base2 } : motionAnimation(f.ch, base2, f);
    if (choreographed) k = recoveryProgress === null && f.moveT - 1 >= m.startup ? 1 : 0.72;
    if (f.state === "launched") t.rot = -0.5 - Math.min(f.stateT * 0.09, 1.9);
    f.pose = lerpPose(f.pose, t, k);
    f.rig = computeRig(f.ch, f.pose);
    let expr = "n";
    if (f.exprT > 0) {
      f.exprT--;
      expr = f.exprOverride;
    } else if (f.state === "hit" || f.state === "launched" || f.state === "down" || f.state === "seq" && f.poseOverride && ["hit", "hitLow", "grabbed", "air", "down"].includes(f.poseOverride)) expr = "hit";
    else if (f.pose.mouth > 0.5 && !(f.ch === "caetano" && f.state === "win")) expr = "shout";
    f.expr = expr;
    if (!(f.state === "attack" && m && m.trail)) {
      if (f.trail.length) f.trail.shift();
    }
    if (f.state !== "attack" && f.state !== "cine" && f.aura > 0 && f.glow === 0) f.aura = Math.max(0, f.aura - 0.08);
    if (f.state === "win" && f.ch === "orango" && f.animT % 60 === 0) audio.roar();
  }
  // ------------------------------------------------------------ câmera & efeitos
  updateCamera() {
    const [a, b] = this.f;
    const sep = Math.abs(a.x - b.x);
    let tx = (a.x + b.x) / 2;
    let tz = clamp4(1 + (880 - sep) / 880 * 0.38, 1, 1.3);
    if (this.camOv) {
      tx = this.camOv.x;
      tz = this.camOv.zoom;
    } else if (this.phase === "roundEnd" || this.phase === "matchEnd") {
      const w = a.state === "win" ? a : b.state === "win" ? b : null;
      if (w) {
        tx = w.x;
        tz = 1.45;
      }
    }
    const kx = this.camOv ? 0.2 : 0.14;
    this.cam.x += (tx - this.cam.x) * kx;
    this.cam.zoom += (tz - this.cam.zoom) * (this.camOv ? 0.18 : 0.1);
    const half = 480 / this.cam.zoom;
    this.cam.x = clamp4(this.cam.x, half, 1600 - half);
  }
  updateTraining() {
    if (!this.sandboxTraining) return;
    const d = this.f[1];
    const a = this.f[0];
    if (a.crouch && a.y === 0) this.challengeEvent("crouch");
    for (const f of this.f) {
      if (this.reborn?.isLab && !this.reborn.lab.heal) continue;
      if (f.state === "ground" && f.hp < f.maxHp) {
        this.train.idle++;
        if (this.train.idle > 90) f.hp = Math.min(f.maxHp, f.hp + 12);
      }
    }
    if (d.hp < d.maxHp && (d.state === "hit" || d.state === "launched")) this.train.idle = 0;
    if (a.hp < a.maxHp && (a.state === "hit" || a.state === "launched")) this.train.idle = 0;
    if (d.comboHits > 0) {
      this.train.combo = d.comboHits;
      this.train.total = d.comboDmg;
    }
  }
  updateFx() {
    if (this.cfg.headless) {
      this.parts = [];
      return;
    }
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.life--;
      if (p.life <= 0) {
        this.parts.splice(i, 1);
        continue;
      }
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.g;
      p.size += p.grow;
      if (p.type === "spark" || p.type === "dust") {
        p.vx *= 0.96;
      }
      if (p.type === "leaf") {
        p.x += Math.sin(this.tick * 0.05 + p.rot) * 0.6;
        if (p.x < -50) p.x = 1650;
        if (p.y > FLOOR_Y + 90) {
          p.y = -20;
          p.life = p.max;
        }
      }
    }
    if (this.parts.length > 700) this.parts.splice(0, this.parts.length - 700);
    if (this.tick % 40 === 0 && this.parts.filter((p) => p.type === "leaf").length < 22) {
      this.parts.push({ type: "leaf", x: rand(0, 1600), y: rand(-20, 200), vx: rand(-2.2, -0.7), vy: rand(0.4, 1.2), life: 1e5, max: 1e5, size: rand(4, 8), color: Math.random() < 0.5 ? "#e8764a" : "#f2b366", g: 0, rot: rand(0, 6), grow: 0 });
    }
  }
  // ------------------------------------------------------------ helpers de partículas
  spark(x, y, color, n, spd, size = 3, life = 18) {
    if (this.cfg.headless) return;
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const v = rand(spd * 0.3, spd);
      this.parts.push({ type: "spark", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1, life: life * rand(0.6, 1), max: life, size: size * rand(0.6, 1.2), color, g: 0.15, rot: a, grow: -0.05 });
    }
  }
  ring(x, y, color, maxR, life = 20, lw = 6) {
    if (this.cfg.headless) return;
    this.parts.push({ type: "ring", x, y, vx: 0, vy: 0, life, max: life, size: 8, color, g: 0, rot: lw, grow: (maxR - 8) / life });
  }
  glowFx(x, y, color, size, life = 10) {
    this.parts.push({ type: "glow", x, y, vx: 0, vy: 0, life, max: life, size, color, g: 0, rot: 0, grow: 0 });
  }
  streak(x, y, ang, color) {
    if (this.cfg.headless) return;
    const v = rand(10, 22);
    this.parts.push({ type: "streak", x, y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, life: 12, max: 12, size: rand(20, 50), color, g: 0, rot: ang, grow: 0 });
  }
  dust(x, y, n) {
    if (this.cfg.headless) return;
    for (let i = 0; i < n; i++) this.parts.push({ type: "dust", x: x + rand(-16, 16), y: y + rand(-4, 4), vx: rand(-2, 2), vy: rand(-1.8, -0.2), life: 26, max: 26, size: rand(4, 9), color: "#d7b894", g: -0.02, rot: 0, grow: 0.25 });
  }
  text(x, y, txt, color, size = 40) {
    if (this.cfg.headless) return;
    this.parts.push({ type: "text", x, y, vx: 0, vy: -0.7, life: 50, max: 50, size, color, g: 0, rot: rand(-0.12, 0.12), grow: 0, text: txt });
  }
};

// src/game/training/verify.ts
function createTrainingGame(spec, onEvent = () => {
}, headless = false, input) {
  const a = activity(spec.activityId);
  if (!CHAR_IDS.includes(spec.p1) || spec.version !== TRAINING_VERSION || !Number.isSafeInteger(spec.seed) || spec.seed < 0 || spec.seed > 4294967295 || spec.activityId !== "lab" && !a || a?.character && a.character !== spec.p1) throw new Error("Configura\xE7\xE3o do treinamento inv\xE1lida.");
  return new Game({ mode: "training", p1: spec.p1, p2: a?.opponent ?? spec.p2 ?? "caetano", stage: a?.stage ?? spec.stage ?? "dojo", difficulty: "normal", bindings: DEFAULT_BINDINGS, reborn: spec, headless, trainingInput: input }, onEvent);
}
function parseTranscript(value) {
  if (!Array.isArray(value) || !value.length || value.length > TRAINING_RULES.maxInputs) throw new Error("Sequ\xEAncia de comandos inv\xE1lida.");
  let ticks = 0;
  const trace = value.map((row) => {
    if (!Array.isArray(row) || row.length !== 3 || !row.every(Number.isSafeInteger) || row[0] < 1 || row[0] > TRAINING_RULES.maxTicks || row[1] < 0 || row[1] > MAX_INPUT_MASK || row[2] < 0 || row[2] > MAX_INPUT_MASK || row[2] !== 0 && row[0] !== 1) throw new Error("Comandos fora dos limites.");
    ticks += row[0];
    return [row[0], row[1], row[2]];
  });
  if (ticks > TRAINING_RULES.maxTicks) throw new Error("A tentativa ultrapassou o tempo m\xE1ximo.");
  return { trace, ticks };
}
function replayTraining(spec, value) {
  if (spec.activityId === "lab" || spec.lab) throw new Error("O laborat\xF3rio n\xE3o concede recompensas de conta.");
  const { trace, ticks } = parseTranscript(value);
  let index = 0, left = trace[0][0], fresh = true;
  const g = createTrainingGame(spec, () => {
  }, true, () => {
    const row = trace[index], out = { held: row[1], pressed: fresh ? row[2] : 0 };
    fresh = false;
    if (--left === 0) {
      index++;
      if (index < trace.length) {
        left = trace[index][0];
        fresh = true;
      }
    }
    return out;
  });
  try {
    for (let i = 0; i < ticks; i++) {
      if (g.reborn?.result) throw new Error("H\xE1 comandos ap\xF3s o resultado final.");
      g.step();
    }
    if (!g.reborn?.result) throw new Error("A sequ\xEAncia n\xE3o comprova a conclus\xE3o de uma atividade.");
    return g.reborn.result;
  } finally {
    g.destroy();
  }
}

// worker/training.js
async function progressRow(db, user) {
  await db.prepare("INSERT OR IGNORE INTO training_progress (user_id,data) VALUES (?,?)").bind(user.id, JSON.stringify(freshProgress())).run();
  const row = await db.prepare("SELECT * FROM training_progress WHERE user_id=?").bind(user.id).first();
  let progress;
  try {
    progress = readProgress(JSON.parse(row.data));
  } catch {
    progress = freshProgress();
  }
  const account = await db.prepare("SELECT xp,training_xp,username FROM users WHERE id=?").bind(user.id).first();
  progress.xp = account.training_xp;
  progress.revision = row.revision;
  return { row, progress, account };
}
async function trainingProfile(db, user, time, json2) {
  const { progress, account } = await progressRow(db, user), day = new Date(time * 1e3).toISOString().slice(0, 10);
  const repeats = await db.prepare("SELECT activity_id,SUM(xp) AS xp,COUNT(*) AS count FROM training_awards WHERE user_id=? AND utc_day=? AND reason='repeat' GROUP BY activity_id").bind(user.id, day).all();
  progress.repeatDay = day;
  progress.repeatXp = repeats.results.reduce((n, r) => n + r.xp, 0);
  progress.repeatCount = Object.fromEntries(repeats.results.map((r) => [r.activity_id, r.count]));
  return json2({ progress, accountXp: account.xp, trainingXp: account.training_xp, username: account.username, missions: rotatingMissions(time, progress) });
}
async function startTraining(db, user, b, time, json2, fail2) {
  const a = activity(b.activityId);
  if (!a || !CHAR_IDS.includes(b.p1)) fail2(400, "Escolha uma atividade e um lutador v\xE1lidos.");
  if (b.lab || b.activityId === "lab") fail2(422, "O laborat\xF3rio livre n\xE3o concede XP de conta.");
  const { progress } = await progressRow(db, user), locked = lockedReason(a, progress, b.p1);
  if (locked) fail2(403, locked);
  const id = crypto.randomUUID(), seed = crypto.getRandomValues(new Uint32Array(1))[0], spec = { activityId: a.id, p1: b.p1, seed, version: TRAINING_VERSION, npc: a.npc, style: rivalStyle(a, progress), verifiedSession: id };
  await db.batch([
    db.prepare("UPDATE training_runs SET state='abandoned' WHERE user_id=? AND state='active'").bind(user.id),
    db.prepare("INSERT INTO training_runs (id,user_id,activity_id,character,seed,version,config,created,expires) VALUES (?,?,?,?,?,?,?,?,?)").bind(id, user.id, a.id, b.p1, seed, TRAINING_VERSION, JSON.stringify(spec), time, time + TRAINING_RULES.sessionSeconds),
    db.prepare("DELETE FROM training_runs WHERE user_id=? AND state!='active' AND created<? AND id NOT IN (SELECT id FROM training_runs WHERE user_id=? ORDER BY created DESC LIMIT 100)").bind(user.id, time - 2592e3, user.id),
    db.prepare("DELETE FROM training_awards WHERE user_id=? AND reason='repeat' AND applied=1 AND utc_day<?").bind(user.id, new Date((time - 7776e3) * 1e3).toISOString().slice(0, 10))
  ]);
  return json2({ id, spec, expires: time + TRAINING_RULES.sessionSeconds, missions: rotatingMissions(time, progress) });
}
async function abandonTraining(db, user, id, json2) {
  await db.prepare("UPDATE training_runs SET state='abandoned' WHERE id=? AND user_id=? AND state='active'").bind(id, user.id).run();
  return json2({ ok: true });
}
async function submitTraining(db, user, id, b, time, json2, fail2) {
  const run = await db.prepare("SELECT * FROM training_runs WHERE id=? AND user_id=?").bind(id, user.id).first();
  if (!run) fail2(404, "Tentativa n\xE3o encontrada para esta conta.");
  if (run.state === "complete") return json2({ result: JSON.parse(run.result), duplicate: true });
  if (run.state !== "active" || run.expires < time) fail2(409, "Esta tentativa foi encerrada ou expirou. O treino local continua dispon\xEDvel.");
  if (run.version !== TRAINING_VERSION) fail2(409, "A vers\xE3o do treinamento mudou. Atualize o jogo e inicie outra tentativa.");
  let ticks;
  try {
    ticks = parseTranscript(b.inputs).ticks;
  } catch (e) {
    fail2(422, e.message);
  }
  if (ticks / 60 > time - run.created + 3) fail2(422, "O tempo desta sequ\xEAncia ainda n\xE3o corresponde \xE0 sess\xE3o autorizada. Tente salvar novamente em alguns segundos.");
  let verified;
  try {
    verified = replayTraining(JSON.parse(run.config), b.inputs);
  } catch (e) {
    fail2(422, "Resultado n\xE3o verificado: " + e.message);
  }
  const a = activity(run.activity_id), { row, progress } = await progressRow(db, user), missions = rotatingMissions(time, progress);
  verified = { ...verified, id, at: time * 1e3, verified: true, xp: 0 };
  const next = applyResult(progress, verified, missions, false), result = next.history[0], claim = crypto.randomUUID(), day = new Date(time * 1e3).toISOString().slice(0, 10);
  const statements = [
    db.prepare("UPDATE training_progress SET data=?,revision=revision+1,last_run_id=? WHERE user_id=? AND revision=? AND EXISTS(SELECT 1 FROM training_runs WHERE id=? AND user_id=? AND state='active')").bind(JSON.stringify(next), id, user.id, row.revision, id, user.id),
    db.prepare("UPDATE training_runs SET state='verified',claim_id=?,result=? WHERE id=? AND user_id=? AND state='active' AND EXISTS(SELECT 1 FROM training_progress WHERE user_id=? AND revision=? AND last_run_id=?)").bind(claim, JSON.stringify(result), id, user.id, user.id, row.revision + 1, id)
  ];
  const gate = "EXISTS(SELECT 1 FROM training_runs WHERE id=? AND user_id=? AND state='verified' AND claim_id=?)";
  const grant = (key, xp, reason) => statements.push(db.prepare(`INSERT OR IGNORE INTO training_awards (user_id,reward_key,run_id,activity_id,xp,reason,utc_day) SELECT ?,?,?,?,?,?,? WHERE ${gate}`).bind(user.id, key, id, a.id, xp, reason, day, id, user.id, claim));
  if (result.success) {
    grant("first:" + a.id, a.xp, a.boss ? "boss" : a.kind === "exam" ? "exam" : "first");
    if (!a.unique) {
      statements.push(db.prepare(`INSERT OR IGNORE INTO training_awards (user_id,reward_key,run_id,activity_id,xp,reason,utc_day)
    SELECT ?,?,?,?,MIN(?,MAX(0,?-COALESCE((SELECT SUM(xp) FROM training_awards WHERE user_id=? AND utc_day=? AND reason='repeat'),0))),'repeat',?
    WHERE ${gate} AND EXISTS(SELECT 1 FROM training_awards WHERE user_id=? AND reward_key=? AND run_id!=?)
    AND (SELECT COUNT(*) FROM training_awards WHERE user_id=? AND activity_id=? AND utc_day=? AND reason='repeat')<?
    AND COALESCE((SELECT SUM(xp) FROM training_awards WHERE user_id=? AND utc_day=? AND reason='repeat'),0)<?`).bind(user.id, "repeat:" + id, id, a.id, Math.floor(a.xp * TRAINING_RULES.repeatRate), TRAINING_RULES.repeatDailyXp, user.id, day, day, id, user.id, claim, user.id, "first:" + a.id, id, user.id, a.id, day, TRAINING_RULES.repeatPerActivity, user.id, day, TRAINING_RULES.repeatDailyXp));
    }
    if (result.grade === "S" && ["challenge", "mastery", "combo"].includes(a.kind)) grant("gradeS:" + a.id, TRAINING_RULES.gradeS, "gradeS");
    for (const m of missions) if (!progress.missions[m.id]?.claimed && next.missions[m.id]?.claimed) grant("mission:" + m.id, m.xp, "mission");
  }
  statements.push(
    db.prepare(`UPDATE users SET xp=xp+COALESCE((SELECT SUM(xp) FROM training_awards WHERE user_id=? AND run_id=? AND applied=0),0),training_xp=training_xp+COALESCE((SELECT SUM(xp) FROM training_awards WHERE user_id=? AND run_id=? AND applied=0),0) WHERE id=? AND ${gate}`).bind(user.id, id, user.id, id, user.id, id, user.id, claim),
    db.prepare(`UPDATE training_awards SET applied=1 WHERE user_id=? AND run_id=? AND applied=0 AND ${gate}`).bind(user.id, id, id, user.id, claim),
    db.prepare(`UPDATE training_runs SET state='complete',result=json_set(result,'$.xp',COALESCE((SELECT SUM(xp) FROM training_awards WHERE user_id=? AND run_id=?),0),'$.rewardNote',CASE WHEN json_extract(result,'$.success')=0 THEN 'Sem XP: objetivo n\xE3o conclu\xEDdo.' WHEN COALESCE((SELECT SUM(xp) FROM training_awards WHERE user_id=? AND run_id=?),0)=0 THEN 'Recompensa \xFAnica j\xE1 recebida ou limite de repeti\xE7\xE3o atingido.' ELSE 'Recompensa verificada pelo servidor.' END) WHERE id=? AND user_id=? AND claim_id=? AND state='verified'`).bind(user.id, id, user.id, id, id, user.id, claim),
    db.prepare("UPDATE training_progress SET data=json_set(data,'$.xp',(SELECT training_xp FROM users WHERE id=?),'$.history[0]',json((SELECT result FROM training_runs WHERE id=? AND user_id=? AND claim_id=?))) WHERE user_id=? AND last_run_id=? AND revision=? AND EXISTS(SELECT 1 FROM training_runs WHERE id=? AND user_id=? AND state='complete' AND claim_id=?)").bind(user.id, id, user.id, claim, user.id, id, row.revision + 1, id, user.id, claim)
  );
  const batch = await db.batch(statements);
  const completed = await db.prepare("SELECT state,result FROM training_runs WHERE id=? AND user_id=?").bind(id, user.id).first();
  if (completed?.state === "complete") return json2({ result: JSON.parse(completed.result), duplicate: batch[0].meta.changes === 0 });
  fail2(409, "O progresso mudou durante o salvamento. Tente salvar esta tentativa novamente.");
}

// worker/progression.js
async function rememberMatch(db, code, epoch, time) {
  await db.prepare(`INSERT OR IGNORE INTO matches (id,room_code,host_id,guest_id,host_char,guest_char,stage,created)
 SELECT epoch,code,host_id,guest_id,host_char,guest_char,stage,? FROM rooms WHERE code=? AND epoch=? AND guest_id IS NOT NULL AND status='playing'`).bind(time, code, epoch).run();
}
var statsCols = "u.id,u.username,u.games,u.wins,u.losses,u.xp,u.training_xp,(u.xp-u.training_xp) AS multiplayer_xp,u.points,u.finishers,u.streak,u.best_streak";
async function leaderboard(db, url, json2) {
  const page = Math.floor(Math.max(0, Math.min(49, Number(url.searchParams.get("page")) || 0)));
  const rows2 = await db.prepare(`SELECT ${statsCols} FROM users u WHERE games>0 ORDER BY points DESC,wins DESC,losses ASC,username_key ASC LIMIT 21 OFFSET ?`).bind(page * 20).all();
  return json2({ players: rows2.results.slice(0, 20).map((u, i) => ({ ...u, rank: page * 20 + i + 1 })), page, more: rows2.results.length > 20, rules: "Vit\xF3ria: 3 pontos e 100 XP. Derrota: 0 pontos e 40 XP. Finisher: +20 XP para o vencedor. Resultados exigem confirma\xE7\xE3o dos dois jogadores." });
}
async function profile(db, user, json2) {
  const me = await db.prepare(`SELECT ${statsCols} FROM users u WHERE id=?`).bind(user.id).first();
  const rank = me.games ? await db.prepare("SELECT COUNT(*)+1 AS rank FROM users WHERE games>0 AND (points>? OR points=? AND wins>? OR points=? AND wins=? AND losses<? OR points=? AND wins=? AND losses=? AND username_key<(SELECT username_key FROM users WHERE id=?))").bind(me.points, me.points, me.wins, me.points, me.wins, me.losses, me.points, me.wins, me.losses, user.id).first() : null;
  const history = await db.prepare(`SELECT m.id,m.host_char,m.guest_char,m.stage,m.host_score,m.guest_score,m.winner_idx,m.finisher_idx,m.created,m.finished,m.status,h.username AS host_name,g.username AS guest_name,m.host_id,m.guest_id FROM matches m JOIN users h ON h.id=m.host_id JOIN users g ON g.id=m.guest_id WHERE m.host_id=? OR m.guest_id=? ORDER BY m.created DESC LIMIT 30`).bind(user.id, user.id).all();
  return json2({ user: { ...me, rank: rank?.rank || null }, history: history.results });
}
async function submitResult(db, user, id, b, json2, fail2, time) {
  const m = await db.prepare("SELECT * FROM matches WHERE id=?").bind(id).first();
  if (!m) fail2(404, "Partida n\xE3o encontrada.");
  const host = m.host_id === user.id;
  if (!host && m.guest_id !== user.id) fail2(403, "Voc\xEA n\xE3o participou desta partida.");
  const { winner, hostScore, guestScore } = b, finisher = b.finisher ?? -1;
  if (![0, 1].includes(winner) || !Number.isInteger(hostScore) || !Number.isInteger(guestScore) || hostScore < 0 || guestScore < 0 || hostScore > 2 || guestScore > 2 || (winner === 0 ? hostScore !== 2 || guestScore >= 2 : guestScore !== 2 || hostScore >= 2) || ![-1, winner].includes(finisher)) fail2(400, "Placar inv\xE1lido.");
  if (time - m.created < 10) fail2(422, "A partida terminou cedo demais para entrar no ranking.");
  if (time - m.created > 7200) fail2(409, "O prazo de confirma\xE7\xE3o desta partida terminou.");
  const report = [winner, hostScore, guestScore, finisher].join(":"), own = host ? "host_report" : "guest_report";
  if (m[own] && m[own] !== report) fail2(409, "Seu resultado j\xE1 foi informado e n\xE3o pode ser alterado.");
  await db.prepare(`UPDATE matches SET ${own}=?,host_score=?,guest_score=?,winner_idx=?,finisher_idx=?,finished=COALESCE(finished,?) WHERE id=? AND (${own} IS NULL OR ${own}=?)`).bind(report, hostScore, guestScore, winner, finisher, time, id, report).run();
  await db.batch([
    db.prepare(`INSERT OR IGNORE INTO match_awards (match_id,user_id,won,xp,points,finisher) SELECT id,host_id,CASE WHEN winner_idx=0 THEN 1 ELSE 0 END,CASE WHEN winner_idx=0 THEN 100+CASE WHEN finisher_idx=0 THEN 20 ELSE 0 END ELSE 40 END,CASE WHEN winner_idx=0 THEN 3 ELSE 0 END,CASE WHEN finisher_idx=0 THEN 1 ELSE 0 END FROM matches WHERE id=? AND host_report=guest_report AND host_report IS NOT NULL`).bind(id),
    db.prepare(`INSERT OR IGNORE INTO match_awards (match_id,user_id,won,xp,points,finisher) SELECT id,guest_id,CASE WHEN winner_idx=1 THEN 1 ELSE 0 END,CASE WHEN winner_idx=1 THEN 100+CASE WHEN finisher_idx=1 THEN 20 ELSE 0 END ELSE 40 END,CASE WHEN winner_idx=1 THEN 3 ELSE 0 END,CASE WHEN finisher_idx=1 THEN 1 ELSE 0 END FROM matches WHERE id=? AND host_report=guest_report AND host_report IS NOT NULL`).bind(id),
    db.prepare(`WITH fresh AS (SELECT * FROM match_awards WHERE match_id=? AND applied=0)
   UPDATE users SET games=games+1,wins=wins+(SELECT won FROM fresh WHERE user_id=users.id),losses=losses+1-(SELECT won FROM fresh WHERE user_id=users.id),xp=xp+(SELECT xp FROM fresh WHERE user_id=users.id),points=points+(SELECT points FROM fresh WHERE user_id=users.id),finishers=finishers+(SELECT finisher FROM fresh WHERE user_id=users.id),best_streak=MAX(best_streak,CASE WHEN (SELECT won FROM fresh WHERE user_id=users.id)=1 THEN streak+1 ELSE 0 END),streak=CASE WHEN (SELECT won FROM fresh WHERE user_id=users.id)=1 THEN streak+1 ELSE 0 END WHERE id IN (SELECT user_id FROM fresh)`).bind(id),
    db.prepare("UPDATE match_awards SET applied=1 WHERE match_id=? AND applied=0").bind(id),
    db.prepare("UPDATE matches SET status=CASE WHEN host_report=guest_report THEN 'confirmed' ELSE 'disputed' END WHERE id=? AND host_report IS NOT NULL AND guest_report IS NOT NULL").bind(id)
  ]);
  const fresh = await db.prepare("SELECT status FROM matches WHERE id=?").bind(id).first();
  const award = await db.prepare("SELECT xp,points,won,finisher FROM match_awards WHERE match_id=? AND user_id=?").bind(id, user.id).first();
  return json2({ status: fresh.status, award: award || null });
}

// worker/index.js
var VERSION = "dw-online-13";
var MAX_INPUT_MASK2 = 65535;
var CHARS2 = ["caetano", "orango", "tubarao", "rickzera", "bieu", "nomad", "renngotti", "aneninha", "santox", "jao", "jane", "cristyan", "eneas", "patrick", "gabrielzin", "ulisses", "felipence", "hdsh"];
var STAGES2 = ["neto", "dojo", "liberdade", "curitiba", "piaui", "planalto", "casebre", "praca", "osasco", "bolivia", "morro", "campo", "casabranca", "letsgay", "ngb", "zoologico", "termodinamica"];
var COOKIE = "dw_session";
var encoder = new TextEncoder();
var HttpError = class extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
};
var fail = (status, message) => {
  throw new HttpError(status, message);
};
var json = (value, status = 200, headers = {}) => new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", ...headers } });
var now = () => Math.floor(Date.now() / 1e3);
var random = (n = 32) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => b.toString(16).padStart(2, "0")).join("");
var digest = async (text) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(text))), (b) => b.toString(16).padStart(2, "0")).join("");
async function passwordHash(password, salt) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: encoder.encode(salt), iterations: 1e5, hash: "SHA-256" }, key, 256);
  return Array.from(new Uint8Array(bits), (b) => b.toString(16).padStart(2, "0")).join("");
}
var equal = (a, b) => {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
};
var cookie = (token, secure, age = 604800) => `${COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${age}${secure ? "; Secure" : ""}`;
async function body(req, max = 65536) {
  if (!req.headers.get("Content-Type")?.startsWith("application/json")) fail(415, "Envie os dados em JSON.");
  const reader = req.body?.getReader();
  let size = 0, text = "";
  const decoder = new TextDecoder();
  if (reader) for (; ; ) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > max) {
      await reader.cancel();
      fail(413, "Dados acima do limite.");
    }
    text += decoder.decode(value, { stream: true });
  }
  try {
    const v = JSON.parse(text);
    if (!v || typeof v !== "object" || Array.isArray(v)) throw Error();
    return v;
  } catch {
    fail(400, "Dados inv\xE1lidos.");
  }
}
async function limit(db, key, max, seconds) {
  const bucket = Math.floor(now() / seconds);
  const row = await db.prepare("INSERT INTO rate_limits (key,hits,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET hits=hits+1 RETURNING hits").bind(`${key}:${bucket}`, now() + seconds * 2).first();
  if (row.hits > max) fail(429, "Muitas tentativas. Aguarde alguns minutos e tente novamente.");
}
async function session(req, db, required = true) {
  const token = req.headers.get("Cookie")?.split(";").map((x) => x.trim()).find((x) => x.startsWith(COOKIE + "="))?.slice(COOKIE.length + 1);
  const user = token && /^[a-f0-9]{64}$/.test(token) ? await db.prepare("SELECT u.id,u.username FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires>?").bind(await digest(token), now()).first() : null;
  if (!user && required) fail(401, "Entre na sua conta para jogar online.");
  return user || null;
}
async function member(db, code, user) {
  const r = await db.prepare("SELECT * FROM rooms WHERE code=? AND expires>?").bind(code, now()).first();
  if (!r) fail(404, "Sala n\xE3o encontrada ou encerrada.");
  if (r.host_id !== user.id && r.guest_id !== user.id) fail(403, "Voc\xEA n\xE3o participa desta sala.");
  return r;
}
async function roomView(db, r) {
  const users = await db.prepare("SELECT id,username FROM users WHERE id IN (?,?)").bind(r.host_id, r.guest_id || "").all();
  const name = (id) => users.results.find((u) => u.id === id)?.username || "";
  return { code: r.code, status: r.status, epoch: r.epoch, stage: r.stage, host: { id: r.host_id, username: name(r.host_id), char: r.host_char, ready: !!r.host_ready, seen: r.host_seen }, guest: r.guest_id ? { id: r.guest_id, username: name(r.guest_id), char: r.guest_char, ready: !!r.guest_ready, seen: r.guest_seen } : null, protocol: VERSION };
}
var index_default = {
  async fetch(req, env) {
    const url = new URL(req.url), path = url.pathname;
    if (!path.startsWith("/api/")) return env.ASSETS.fetch(req);
    try {
      if (!env.DB) return json({ error: "O servi\xE7o online est\xE1 indispon\xEDvel. Os modos locais continuam dispon\xEDveis." }, 503);
      if (req.method !== "GET") {
        if (req.headers.get("Origin") !== url.origin) fail(403, "Origem da solicita\xE7\xE3o inv\xE1lida.");
        if (req.method !== "POST") fail(405, "M\xE9todo n\xE3o permitido.");
      }
      const db = env.DB;
      if (path === "/api/health" && req.method === "GET") {
        await db.prepare("SELECT id FROM users LIMIT 1").first();
        return json({ online: true, protocol: VERSION });
      }
      if (path === "/api/session" && req.method === "GET") return json({ user: await session(req, db, false), protocol: VERSION });
      if (["/api/auth/register", "/api/auth/login"].includes(path) && req.method === "POST") {
        const b2 = await body(req, 4096), username = typeof b2.username === "string" ? b2.username.trim() : "", password = b2.password;
        if (!/^[A-Za-z0-9_]{3,24}$/.test(username) || typeof password !== "string" || password.length < 8 || password.length > 128) fail(400, "Use um usu\xE1rio com 3 a 24 letras, n\xFAmeros ou _ e uma senha com 8 a 128 caracteres.");
        const key = username.toLowerCase();
        await limit(db, "auth-user:" + await digest(key), 20, 900);
        await limit(db, "auth-ip:" + await digest(req.headers.get("CF-Connecting-IP") || "local"), 100, 900);
        let user2 = await db.prepare("SELECT * FROM users WHERE username_key=?").bind(key).first();
        if (path.endsWith("/register")) {
          if (user2) fail(409, "Este nome de usu\xE1rio j\xE1 est\xE1 em uso.");
          const id = crypto.randomUUID(), salt = random(16), hash = await passwordHash(password, salt);
          try {
            await db.prepare("INSERT INTO users (id,username,username_key,password_hash,salt,created) VALUES (?,?,?,?,?,?)").bind(id, username, key, hash, salt, now()).run();
          } catch (e) {
            if (String(e).includes("UNIQUE")) fail(409, "Este nome de usu\xE1rio j\xE1 est\xE1 em uso.");
            throw e;
          }
          user2 = { id, username };
        } else {
          const hash = await passwordHash(password, user2?.salt || "00000000000000000000000000000000");
          if (!user2 || !equal(hash, user2.password_hash)) fail(401, "Usu\xE1rio ou senha incorretos.");
        }
        const token = random();
        await db.batch([
          db.prepare("DELETE FROM sessions WHERE expires<? OR user_id=? AND token_hash IN (SELECT token_hash FROM sessions WHERE user_id=? ORDER BY expires DESC LIMIT -1 OFFSET 9)").bind(now(), user2.id, user2.id),
          db.prepare("INSERT INTO sessions (token_hash,user_id,expires) VALUES (?,?,?)").bind(await digest(token), user2.id, now() + 604800),
          db.prepare("DELETE FROM rate_limits WHERE expires<?").bind(now())
        ]);
        return json({ user: { id: user2.id, username: user2.username }, protocol: VERSION }, 200, { "Set-Cookie": cookie(token, url.protocol === "https:") });
      }
      if (path === "/api/auth/logout" && req.method === "POST") {
        const token = req.headers.get("Cookie")?.split(";").map((x) => x.trim()).find((x) => x.startsWith(COOKIE + "="))?.slice(COOKIE.length + 1);
        if (token) await db.prepare("DELETE FROM sessions WHERE token_hash=?").bind(await digest(token)).run();
        return json({ ok: true }, 200, { "Set-Cookie": cookie("", url.protocol === "https:", 0) });
      }
      if (path === "/api/leaderboard" && req.method === "GET") return await leaderboard(db, url, json);
      const user = await session(req, db);
      if (path === "/api/training" && req.method === "GET") return await trainingProfile(db, user, now(), json);
      if (path === "/api/training/start" && req.method === "POST") {
        await limit(db, "training-start:" + user.id, 30, 300);
        return await startTraining(db, user, await body(req, 4096), now(), json, fail);
      }
      const trainingPath = path.match(/^\/api\/training\/([a-f0-9-]{36})\/(submit|abandon)$/);
      if (trainingPath && req.method === "POST") {
        if (trainingPath[2] === "abandon") return await abandonTraining(db, user, trainingPath[1], json);
        await limit(db, "training-submit:" + user.id, 20, 60);
        return await submitTraining(db, user, trainingPath[1], await body(req, 262144), now(), json, fail);
      }
      if (path === "/api/profile" && req.method === "GET") return await profile(db, user, json);
      const resultPath = path.match(/^\/api\/results\/([a-f0-9-]{36})$/);
      if (resultPath && req.method === "POST") return await submitResult(db, user, resultPath[1], await body(req, 2048), json, fail, now());
      if (path === "/api/rooms" && req.method === "POST") {
        await limit(db, "create:" + user.id, 10, 300);
        const code2 = Array.from(crypto.getRandomValues(new Uint8Array(8)), (x) => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[x % 32]).join("");
        await db.batch([
          db.prepare("DELETE FROM rooms WHERE code IN (SELECT code FROM rooms WHERE expires<? LIMIT 50)").bind(now()),
          db.prepare("INSERT INTO rooms (code,host_id,host_seen,expires) VALUES (?,?,?,?)").bind(code2, user.id, now(), now() + 7200)
        ]);
        return json({ room: await roomView(db, await member(db, code2, user)) });
      }
      const match = path.match(/^\/api\/rooms\/([A-Z2-9]{8})(?:\/(join|configure|start|signal|sync|finish|leave))?$/);
      if (!match) fail(404, "Endere\xE7o n\xE3o encontrado.");
      const [, code, op2] = match;
      if (op2 === "join" && req.method === "POST") {
        await limit(db, "join:" + user.id, 30, 60);
        await db.prepare("UPDATE rooms SET guest_id=?,guest_seen=?,guest_ready=0 WHERE code=? AND guest_id IS NULL AND host_id!=? AND status!='playing' AND expires>?").bind(user.id, now(), code, user.id, now()).run();
        const r2 = await db.prepare("SELECT * FROM rooms WHERE code=? AND expires>?").bind(code, now()).first();
        if (!r2) fail(404, "Sala n\xE3o encontrada ou encerrada.");
        if (r2.host_id === user.id) fail(409, "Esta sala foi criada por voc\xEA.");
        if (r2.guest_id !== user.id) fail(409, "Esta sala j\xE1 tem dois jogadores.");
        return json({ room: await roomView(db, r2) });
      }
      const r = await member(db, code, user), host = r.host_id === user.id, side = host ? "host" : "guest";
      if (!op2 && req.method === "GET") {
        await db.prepare(`UPDATE rooms SET ${side}_seen=? WHERE code=?`).bind(now(), code).run();
        const after = Math.max(0, Math.min(Number(url.searchParams.get("after")) || 0, 1e12));
        const signals = await db.prepare("SELECT id,payload FROM signals WHERE room=? AND epoch=? AND sender!=? AND id>? ORDER BY id LIMIT 100").bind(code, r.epoch, user.id, after).all();
        return json({ room: await roomView(db, r), signals: signals.results.map((s) => ({ id: s.id, payload: JSON.parse(s.payload) })) });
      }
      if (req.method !== "POST") fail(405, "M\xE9todo n\xE3o permitido.");
      if (op2 === "leave") {
        if (host) await db.prepare("DELETE FROM rooms WHERE code=?").bind(code).run();
        else await db.batch([db.prepare("UPDATE rooms SET guest_id=NULL,guest_ready=0,host_ready=0,status='waiting',epoch='',host_state=NULL,guest_input=NULL,host_n=0,guest_n=0 WHERE code=? AND guest_id=?").bind(code, user.id), db.prepare("DELETE FROM signals WHERE room=?").bind(code)]);
        return json({ ok: true });
      }
      const b = await body(req);
      if (op2 === "configure") {
        if (r.status === "playing") fail(409, "A partida j\xE1 come\xE7ou.");
        const ch = b.char ?? r[side + "_char"];
        if (!CHARS2.includes(ch)) fail(400, "Lutador inv\xE1lido.");
        const stage = host ? b.stage ?? r.stage : r.stage;
        if (!STAGES2.includes(stage)) fail(400, "Mapa inv\xE1lido.");
        await db.prepare(`UPDATE rooms SET ${side}_char=?,${side}_ready=?,${host && stage !== r.stage ? "guest_ready=0," : ""}stage=?,status='waiting',${side}_seen=? WHERE code=? AND status!='playing'`).bind(ch, b.ready === true ? 1 : 0, stage, now(), code).run();
      } else if (op2 === "start") {
        if (!host) fail(403, "Somente o criador pode iniciar.");
        const epoch = crypto.randomUUID();
        const updated = await db.prepare("UPDATE rooms SET status='playing',epoch=?,host_state=NULL,guest_input=NULL,host_n=0,guest_n=0 WHERE code=? AND status!='playing' AND host_ready=1 AND guest_ready=1 AND guest_id IS NOT NULL AND host_seen>? AND guest_seen>? RETURNING code").bind(epoch, code, now() - 15, now() - 15).first();
        if (!updated) fail(409, "Os dois jogadores precisam estar conectados e prontos.");
        await db.prepare("DELETE FROM signals WHERE room=?").bind(code).run();
        await rememberMatch(db, code, epoch, now());
      } else if (op2 === "finish") {
        if (!host) fail(403, "Somente o criador pode finalizar.");
        await db.prepare("UPDATE rooms SET status='finished',host_ready=0,guest_ready=0 WHERE code=? AND epoch=?").bind(code, b.epoch).run();
      } else if (op2 === "signal") {
        if (b.epoch !== r.epoch || r.status !== "playing") fail(409, "Esta partida foi encerrada.");
        if (!["offer", "answer", "ice"].includes(b.payload?.type) || JSON.stringify(b.payload).length > 16e3) fail(400, "Conex\xE3o inv\xE1lida.");
        await limit(db, "signal:" + code + ":" + user.id, 150, 60);
        await db.prepare("INSERT INTO signals (room,epoch,sender,payload) VALUES (?,?,?,?)").bind(code, r.epoch, user.id, JSON.stringify(b.payload)).run();
        return json({ ok: true });
      } else if (op2 === "sync") {
        if (b.epoch !== r.epoch || !["playing", "finished"].includes(r.status)) fail(409, "Esta partida foi encerrada.");
        if (!Number.isSafeInteger(b.n) || b.n < 1 || b.n > 1e9) fail(400, "Sequ\xEAncia inv\xE1lida.");
        const value = host ? b.state : b.input;
        const invalidEvent = (e) => !e || !Number.isSafeInteger(e.id) || e.id < 1 || !Number.isInteger(e.mask) || e.mask < 0 || e.mask > MAX_INPUT_MASK2 || e.clash !== void 0 && (!Number.isSafeInteger(e.clash) || e.clash < 0) || e.clashFrame !== void 0 && (!Number.isSafeInteger(e.clashFrame) || e.clashFrame < -60 || e.clashFrame > 240);
        const invalid = host ? !value || value.v !== VERSION || !Array.isArray(value.f) || value.f.length !== 2 : !value || !Number.isInteger(value.mask) || value.mask < 0 || value.mask > MAX_INPUT_MASK2 || !Array.isArray(value.events) || value.events.length > 32 || value.events.some(invalidEvent);
        if (invalid) fail(400, "Estado inv\xE1lido.");
        await db.prepare(`UPDATE rooms SET ${host ? "host_state" : "guest_input"}=?,${side}_n=?,${side}_seen=? WHERE code=? AND epoch=? AND ${side}_n<?`).bind(JSON.stringify(value), b.n, now(), code, r.epoch, b.n).run();
        const fresh = await member(db, code, user), peer = host ? "guest" : "host";
        return json({ n: fresh[peer + "_n"], value: JSON.parse(fresh[host ? "guest_input" : "host_state"] || "null"), seen: fresh[peer + "_seen"], status: fresh.status });
      } else fail(404, "Endere\xE7o n\xE3o encontrado.");
      return json({ room: await roomView(db, await member(db, code, user)) });
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message }, e.status);
      console.error("Game API failure", e instanceof Error ? e.message : "unknown");
      return json({ error: "O servi\xE7o online est\xE1 indispon\xEDvel. Tente novamente em instantes." }, 503);
    }
  }
};
export {
  index_default as default
};
