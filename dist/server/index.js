// worker/progression.js
async function rememberMatch(db, code, epoch, time) {
  await db.prepare(`INSERT OR IGNORE INTO matches (id,room_code,host_id,guest_id,host_char,guest_char,stage,created)
 SELECT epoch,code,host_id,guest_id,host_char,guest_char,stage,? FROM rooms WHERE code=? AND epoch=? AND guest_id IS NOT NULL AND status='playing'`).bind(time, code, epoch).run();
}
var statsCols = "u.id,u.username,u.games,u.wins,u.losses,u.xp,u.points,u.finishers,u.streak,u.best_streak";
async function leaderboard(db, url, json2) {
  const page = Math.floor(Math.max(0, Math.min(49, Number(url.searchParams.get("page")) || 0)));
  const rows = await db.prepare(`SELECT ${statsCols} FROM users u WHERE games>0 ORDER BY points DESC,wins DESC,losses ASC,username_key ASC LIMIT 21 OFFSET ?`).bind(page * 20).all();
  return json2({ players: rows.results.slice(0, 20).map((u, i) => ({ ...u, rank: page * 20 + i + 1 })), page, more: rows.results.length > 20, rules: "Vit\xF3ria: 3 pontos e 100 XP. Derrota: 0 pontos e 40 XP. Finisher: +20 XP para o vencedor. Resultados exigem confirma\xE7\xE3o dos dois jogadores." });
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
var VERSION = "dw-online-10";
var MAX_INPUT_MASK = 16383;
var CHARS = ["caetano", "orango", "tubarao", "rickzera", "bieu", "nomad", "renngotti", "aneninha", "santox", "jao", "jane", "cristyan", "eneas"];
var STAGES = ["neto", "dojo", "liberdade", "curitiba", "piaui", "planalto", "casebre", "praca", "osasco", "bolivia", "morro", "campo", "casabranca", "letsgay", "ngb", "zoologico", "termodinamica"];
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
      const [, code, op] = match;
      if (op === "join" && req.method === "POST") {
        await limit(db, "join:" + user.id, 30, 60);
        await db.prepare("UPDATE rooms SET guest_id=?,guest_seen=?,guest_ready=0 WHERE code=? AND guest_id IS NULL AND host_id!=? AND status!='playing' AND expires>?").bind(user.id, now(), code, user.id, now()).run();
        const r2 = await db.prepare("SELECT * FROM rooms WHERE code=? AND expires>?").bind(code, now()).first();
        if (!r2) fail(404, "Sala n\xE3o encontrada ou encerrada.");
        if (r2.host_id === user.id) fail(409, "Esta sala foi criada por voc\xEA.");
        if (r2.guest_id !== user.id) fail(409, "Esta sala j\xE1 tem dois jogadores.");
        return json({ room: await roomView(db, r2) });
      }
      const r = await member(db, code, user), host = r.host_id === user.id, side = host ? "host" : "guest";
      if (!op && req.method === "GET") {
        await db.prepare(`UPDATE rooms SET ${side}_seen=? WHERE code=?`).bind(now(), code).run();
        const after = Math.max(0, Math.min(Number(url.searchParams.get("after")) || 0, 1e12));
        const signals = await db.prepare("SELECT id,payload FROM signals WHERE room=? AND epoch=? AND sender!=? AND id>? ORDER BY id LIMIT 100").bind(code, r.epoch, user.id, after).all();
        return json({ room: await roomView(db, r), signals: signals.results.map((s) => ({ id: s.id, payload: JSON.parse(s.payload) })) });
      }
      if (req.method !== "POST") fail(405, "M\xE9todo n\xE3o permitido.");
      if (op === "leave") {
        if (host) await db.prepare("DELETE FROM rooms WHERE code=?").bind(code).run();
        else await db.batch([db.prepare("UPDATE rooms SET guest_id=NULL,guest_ready=0,host_ready=0,status='waiting',epoch='',host_state=NULL,guest_input=NULL,host_n=0,guest_n=0 WHERE code=? AND guest_id=?").bind(code, user.id), db.prepare("DELETE FROM signals WHERE room=?").bind(code)]);
        return json({ ok: true });
      }
      const b = await body(req);
      if (op === "configure") {
        if (r.status === "playing") fail(409, "A partida j\xE1 come\xE7ou.");
        const ch = b.char ?? r[side + "_char"];
        if (!CHARS.includes(ch)) fail(400, "Lutador inv\xE1lido.");
        const stage = host ? b.stage ?? r.stage : r.stage;
        if (!STAGES.includes(stage)) fail(400, "Mapa inv\xE1lido.");
        await db.prepare(`UPDATE rooms SET ${side}_char=?,${side}_ready=?,${host && stage !== r.stage ? "guest_ready=0," : ""}stage=?,status='waiting',${side}_seen=? WHERE code=? AND status!='playing'`).bind(ch, b.ready === true ? 1 : 0, stage, now(), code).run();
      } else if (op === "start") {
        if (!host) fail(403, "Somente o criador pode iniciar.");
        const epoch = crypto.randomUUID();
        const updated = await db.prepare("UPDATE rooms SET status='playing',epoch=?,host_state=NULL,guest_input=NULL,host_n=0,guest_n=0 WHERE code=? AND status!='playing' AND host_ready=1 AND guest_ready=1 AND guest_id IS NOT NULL AND host_seen>? AND guest_seen>? RETURNING code").bind(epoch, code, now() - 15, now() - 15).first();
        if (!updated) fail(409, "Os dois jogadores precisam estar conectados e prontos.");
        await db.prepare("DELETE FROM signals WHERE room=?").bind(code).run();
        await rememberMatch(db, code, epoch, now());
      } else if (op === "finish") {
        if (!host) fail(403, "Somente o criador pode finalizar.");
        await db.prepare("UPDATE rooms SET status='finished',host_ready=0,guest_ready=0 WHERE code=? AND epoch=?").bind(code, b.epoch).run();
      } else if (op === "signal") {
        if (b.epoch !== r.epoch || r.status !== "playing") fail(409, "Esta partida foi encerrada.");
        if (!["offer", "answer", "ice"].includes(b.payload?.type) || JSON.stringify(b.payload).length > 16e3) fail(400, "Conex\xE3o inv\xE1lida.");
        await limit(db, "signal:" + code + ":" + user.id, 150, 60);
        await db.prepare("INSERT INTO signals (room,epoch,sender,payload) VALUES (?,?,?,?)").bind(code, r.epoch, user.id, JSON.stringify(b.payload)).run();
        return json({ ok: true });
      } else if (op === "sync") {
        if (b.epoch !== r.epoch || !["playing", "finished"].includes(r.status)) fail(409, "Esta partida foi encerrada.");
        if (!Number.isSafeInteger(b.n) || b.n < 1 || b.n > 1e9) fail(400, "Sequ\xEAncia inv\xE1lida.");
        const value = host ? b.state : b.input;
        const invalidEvent = (e) => !e || !Number.isSafeInteger(e.id) || e.id < 1 || !Number.isInteger(e.mask) || e.mask < 0 || e.mask > MAX_INPUT_MASK || e.clash !== void 0 && (!Number.isSafeInteger(e.clash) || e.clash < 0) || e.clashFrame !== void 0 && (!Number.isSafeInteger(e.clashFrame) || e.clashFrame < -60 || e.clashFrame > 240);
        const invalid = host ? !value || value.v !== VERSION || !Array.isArray(value.f) || value.f.length !== 2 : !value || !Number.isInteger(value.mask) || value.mask < 0 || value.mask > MAX_INPUT_MASK || !Array.isArray(value.events) || value.events.length > 32 || value.events.some(invalidEvent);
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
