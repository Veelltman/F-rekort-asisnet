/* Cloudflare Worker для Førerkort-trener.
   - Регистрация по имени, PIN и коду приглашения, вход, хранение прогресса (KV).
   - Таблица круга друзей.
   - Прокси к Claude API для «Учителя», доступный только владельцу (первому зарегистрированному)
     и именам из списка разрешённых.
   Секреты: INVITE_CODE, ANTHROPIC_API_KEY. Переменная: ALLOWED_ORIGIN (необязательно). KV: USERS. */

const enc = new TextEncoder();

function json(data, status, cors) {
  return new Response(JSON.stringify(data), { status: status || 200, headers: Object.assign({ "content-type": "application/json" }, cors) });
}
function err(msg, status, cors) { return json({ error: msg }, status, cors); }

async function sha256(s) {
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(s));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}
function randomHex(n) {
  const a = new Uint8Array(n); crypto.getRandomValues(a);
  return [...a].map(b => b.toString(16).padStart(2, "0")).join("");
}
function normName(name) {
  return String(name || "").trim().replace(/\s+/g, " ").slice(0, 24);
}
function keyOf(name) { return "user:" + name.toLowerCase(); }

async function getUser(env, name) {
  const raw = await env.USERS.get(keyOf(name));
  return raw ? JSON.parse(raw) : null;
}
async function putUser(env, user) {
  await env.USERS.put(keyOf(user.name), JSON.stringify(user));
}
async function auth(request, env) {
  const h = request.headers.get("authorization") || "";
  const tok = h.startsWith("Bearer ") ? h.slice(7) : "";
  if (!tok) return null;
  const name = await env.USERS.get("token:" + tok);
  return name ? getUser(env, name) : null;
}
async function isTeacherAllowed(env, user) {
  const owner = await env.USERS.get("meta:owner");
  if (owner && owner.toLowerCase() === user.name.toLowerCase()) return true;
  const list = (await env.USERS.get("meta:teacher_allowed")) || "";
  return list.split(",").map(s => s.trim().toLowerCase()).filter(Boolean).includes(user.name.toLowerCase());
}

function todayKey() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function summarize(user) {
  const st = user.state || {};
  const answers = st.answers || {};
  let correct = 0, wrong = 0;
  Object.values(answers).forEach(a => { correct += a.correct || 0; wrong += a.wrong || 0; });
  const exams = st.exams || [];
  const last = exams[exams.length - 1] || null;
  const daily = st.daily || {};
  const days = Object.keys(daily).sort();
  let streak = 0;
  const d = new Date();
  for (;;) {
    const k = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    if (!daily[k]) break;
    streak += 1; d.setDate(d.getDate() - 1);
  }
  return {
    name: user.name,
    answered: correct + wrong,
    accuracy: correct + wrong ? Math.round((correct / (correct + wrong)) * 100) : null,
    today: daily[todayKey()] || null,
    dailyCount: days.length,
    streak,
    exams: exams.length,
    examsPassed: exams.filter(e => e.passed).length,
    lastExam: last ? { correct: last.correct, total: last.total, passed: last.passed } : null,
    lastActive: user.updatedAt || user.createdAt
  };
}

export default {
  async fetch(request, env) {
    const cors = {
      "access-control-allow-origin": env.ALLOWED_ORIGIN || "*",
      "access-control-allow-methods": "GET, POST, PUT, OPTIONS",
      "access-control-allow-headers": "content-type, authorization, anthropic-version, anthropic-beta"
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      /* ---------- Регистрация ---------- */
      if (path === "/api/register" && request.method === "POST") {
        const body = await request.json();
        const name = normName(body.name);
        const pin = String(body.pin || "");
        if (name.length < 2) return err("Имя слишком короткое", 400, cors);
        if (!/^\d{4,6}$/.test(pin)) return err("PIN должен быть из 4–6 цифр", 400, cors);
        if (!env.INVITE_CODE || String(body.invite || "").trim().toLowerCase() !== env.INVITE_CODE.toLowerCase()) return err("Неверный код приглашения", 403, cors);
        if (await getUser(env, name)) return err("Это имя уже занято", 409, cors);
        const salt = randomHex(8);
        const user = { name, salt, pinHash: await sha256(salt + pin), createdAt: Date.now(), updatedAt: Date.now(), state: body.state || {} };
        await putUser(env, user);
        if (!(await env.USERS.get("meta:owner"))) await env.USERS.put("meta:owner", name);
        const token = randomHex(24);
        await env.USERS.put("token:" + token, name);
        return json({ token, name, teacher: await isTeacherAllowed(env, user) }, 200, cors);
      }

      /* ---------- Вход ---------- */
      if (path === "/api/login" && request.method === "POST") {
        const body = await request.json();
        const name = normName(body.name);
        const user = await getUser(env, name);
        if (!user || user.pinHash !== await sha256(user.salt + String(body.pin || ""))) return err("Неверное имя или PIN", 401, cors);
        const token = randomHex(24);
        await env.USERS.put("token:" + token, user.name);
        return json({ token, name: user.name, teacher: await isTeacherAllowed(env, user) }, 200, cors);
      }

      const user = await auth(request, env);
      if (!user) return err("Нужно войти", 401, cors);

      /* ---------- Прогресс ---------- */
      if (path === "/api/state" && request.method === "GET") {
        return json({ name: user.name, state: user.state || {}, updatedAt: user.updatedAt, teacher: await isTeacherAllowed(env, user) }, 200, cors);
      }
      if (path === "/api/state" && request.method === "PUT") {
        const text = await request.text();
        if (text.length > 800000) return err("Слишком большой прогресс", 413, cors);
        user.state = JSON.parse(text);
        user.updatedAt = Date.now();
        await putUser(env, user);
        return json({ ok: true, updatedAt: user.updatedAt }, 200, cors);
      }

      /* ---------- Круг ---------- */
      if (path === "/api/circle" && request.method === "GET") {
        const list = await env.USERS.list({ prefix: "user:", limit: 200 });
        const users = await Promise.all(list.keys.map(k => env.USERS.get(k.name).then(r => r ? JSON.parse(r) : null)));
        const rows = users.filter(Boolean).map(summarize).sort((a, b) => (b.lastActive || 0) - (a.lastActive || 0));
        return json({ me: user.name, owner: await env.USERS.get("meta:owner"), rows }, 200, cors);
      }

      /* ---------- Учитель (только владелец и разрешённые) ---------- */
      if (path === "/api/teacher" && request.method === "POST") {
        if (!(await isTeacherAllowed(env, user))) return err("Учитель доступен только владельцу сайта", 403, cors);
        if (!env.ANTHROPIC_API_KEY) return err("На сервере не задан ключ API", 500, cors);
        const upstream = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-api-key": env.ANTHROPIC_API_KEY,
            "anthropic-version": request.headers.get("anthropic-version") || "2023-06-01",
            "anthropic-beta": request.headers.get("anthropic-beta") || ""
          },
          body: await request.text()
        });
        const headers = new Headers(cors);
        headers.set("content-type", upstream.headers.get("content-type") || "application/json");
        return new Response(upstream.body, { status: upstream.status, headers });
      }

      /* ---------- Владелец: список допущенных к учителю ---------- */
      if (path === "/api/teacher-allowed" && request.method === "PUT") {
        const owner = await env.USERS.get("meta:owner");
        if (!owner || owner.toLowerCase() !== user.name.toLowerCase()) return err("Только владелец", 403, cors);
        const body = await request.json();
        await env.USERS.put("meta:teacher_allowed", (body.names || []).map(normName).join(","));
        return json({ ok: true }, 200, cors);
      }

      return err("Not found", 404, cors);
    } catch (e) {
      return err("Ошибка сервера: " + (e.message || e), 500, cors);
    }
  }
};
