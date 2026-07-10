// Bitachon Judaica: static server + product admin.
// Data: ./data/products.json + ./data/config.json (categories, tags, about, contact). Images in public/assets/products.
// Auth: single shared password (ADMIN_PASSWORD in ./.env), signed cookie. ponytail: one editor, no sessions table.
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "public");
const DATA_DIR = path.join(__dirname, "data");
const PRODUCTS = path.join(DATA_DIR, "products.json");
const CONFIG = path.join(DATA_DIR, "config.json");
const IMG_DIR = path.join(ROOT, "assets", "products");
const PORT = 3015;
const MAX_BODY = 25 * 1024 * 1024;
const MAX_IMG = 8 * 1024 * 1024;

const DEFAULT_CONFIG = {
  categories: ["Art & Clay", "Havdalah", "Mezuzahs", "Signs & Words", "Apparel & Gifts"],
  tags: ["New", "One of a Kind", "Bestseller", "Gift"],
  about: { quote: "It began on my mirror", paragraphs: [] },
  contact: { intro: "We would love to hear from you.", phone: "", phoneHref: "", subtext: "" },
};

function envFile() {
  const o = {};
  try {
    fs.readFileSync(path.join(__dirname, ".env"), "utf8").split("\n").forEach(l => {
      const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) o[m[1]] = m[2].trim();
    });
  } catch {}
  return o;
}
const ENV = envFile();
const envVal = k => (process.env[k] || ENV[k] || "").trim();
const PASSWORD = envVal("ADMIN_PASSWORD");
const TOKEN = PASSWORD ? crypto.createHash("sha256").update("bj:" + PASSWORD).digest("hex") : null;

const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml",
  ".ico": "image/x-icon", ".webp": "image/webp", ".woff": "font/woff", ".woff2": "font/woff2",
};

function readJson(file, fallback) { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return fallback; } }
function writeJson(file, obj) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + ".tmp"; fs.writeFileSync(tmp, JSON.stringify(obj, null, 2)); fs.renameSync(tmp, file);
}
const readProducts = () => readJson(PRODUCTS, []);
const writeProducts = l => writeJson(PRODUCTS, l);
const readConfig = () => ({ ...DEFAULT_CONFIG, ...readJson(CONFIG, {}) });
const writeConfig = c => writeJson(CONFIG, c);

function authed(req) {
  if (!TOKEN) return false;
  const m = (req.headers.cookie || "").match(/bj_admin=([a-f0-9]+)/);
  if (!m) return false;
  const a = Buffer.from(m[1]), b = Buffer.from(TOKEN);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function json(res, code, obj) {
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(obj));
}
function readBody(req, cb) {
  let len = 0; const chunks = [];
  req.on("data", d => { len += d.length; if (len > MAX_BODY) req.destroy(); else chunks.push(d); });
  req.on("end", () => cb(Buffer.concat(chunks).toString("utf8")));
  req.on("error", () => cb(null));
}
function saveImage(dataUrl) {
  const m = /^data:image\/(png|jpe?g|webp);base64,(.+)$/s.exec(dataUrl || "");
  if (!m) throw new Error("bad image");
  const ext = m[1] === "jpeg" ? "jpg" : m[1];
  const buf = Buffer.from(m[2], "base64");
  if (buf.length > MAX_IMG) throw new Error("image too large");
  fs.mkdirSync(IMG_DIR, { recursive: true });
  const file = `${crypto.randomUUID()}.${ext}`;
  fs.writeFileSync(path.join(IMG_DIR, file), buf);
  return `/assets/products/${file}`;
}
function unlink(p) { try { fs.unlinkSync(path.join(ROOT, p.replace(/^\//, ""))); } catch {} }

async function aiGenerate(field, b) {
  const key = envVal("OPENROUTER_API_KEY");
  if (!key) throw new Error("AI not configured");
  const brand = 'You are writing product copy for "Bitachon Judaica", handcrafted Judaica made by hand. Bitachon means trust in Hashem; every piece is a warm, faith-filled reminder that Hashem is always with you. Boutique, heartfelt tone.';
  const cats = (b.categories || []).join(", ");
  const known = [cats ? `Categories: ${cats}` : "", (field !== "name" && b.name) ? `Name: "${b.name}"` : ""].filter(Boolean).join("\n");
  const prompts = {
    name: 'Give a short product name, MAXIMUM 3 words, boutique and spiritual feel (e.g. "Lotus Havdalah", "Garden Blessing"). Return ONLY the name, no quotes, no markdown.',
    tagline: 'Give a tagline of EXACTLY one short line, 4 to 7 words, poetic but concise (e.g. "Trust in Every Detail"). Return ONLY the tagline, no quotes, no markdown.',
    description: 'Write EXACTLY 2 short, warm sentences: what makes this piece visually special and its spiritual meaning. Plain text only, no markdown, do not repeat the name.',
  };
  const content = [];
  const img = b.imageData || b.imageUrl;
  if (img) content.push({ type: "image_url", image_url: { url: img } });
  content.push({ type: "text", text: `${brand}\n\n${known ? known + "\n\n" : ""}${prompts[field]}` });
  const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": "Bearer " + key, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "anthropic/claude-haiku-4.5", max_tokens: field === "description" ? 170 : 25, messages: [{ role: "user", content }] }),
  });
  if (!r.ok) throw new Error("AI request failed");
  const d = await r.json();
  return (d.choices?.[0]?.message?.content || "").trim()
    .replace(/^#{1,6}\s+/gm, "").replace(/\*{1,2}([^*]+)\*{1,2}/g, "$1").replace(/`([^`]+)`/g, "$1").replace(/^["']|["']$/g, "").trim();
}

const server = http.createServer((req, res) => {
  const url = (req.url || "/").split("?")[0];

  if (url.startsWith("/api/")) {
    // ---- public reads ----
    if (url === "/api/products" && req.method === "GET") return json(res, 200, readProducts());
    if (url === "/api/config" && req.method === "GET") return json(res, 200, readConfig());
    if (url === "/api/session" && req.method === "GET") return json(res, 200, { authed: authed(req) });
    // ---- auth ----
    if (url === "/api/login" && req.method === "POST") return readBody(req, body => {
      let pw = ""; try { pw = (JSON.parse(body || "{}").password || "").trim(); } catch {}
      if (!TOKEN || pw !== PASSWORD) return json(res, 401, { error: "Wrong password" });
      res.writeHead(200, { "Content-Type": "application/json", "Set-Cookie": `bj_admin=${TOKEN}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=2592000` });
      return res.end(JSON.stringify({ ok: true }));
    });
    if (url === "/api/logout" && req.method === "POST") {
      res.writeHead(200, { "Content-Type": "application/json", "Set-Cookie": "bj_admin=; HttpOnly; Path=/; Max-Age=0" });
      return res.end(JSON.stringify({ ok: true }));
    }

    // everything below requires auth
    if (!authed(req)) return json(res, 401, { error: "unauthorized" });

    if (url === "/api/upload" && req.method === "POST") return readBody(req, body => {
      try { const p = saveImage(JSON.parse(body || "{}").imageData); json(res, 200, { path: p }); }
      catch (e) { json(res, 400, { error: String(e.message || e) }); }
    });
    if (url === "/api/generate" && req.method === "POST") return readBody(req, body => {
      (async () => {
        try {
          const b = JSON.parse(body || "{}");
          const field = ["name", "tagline", "description"].includes(b.field) ? b.field : "description";
          json(res, 200, { text: await aiGenerate(field, b) });
        } catch (e) { json(res, 500, { error: String(e.message || e) }); }
      })();
    });
    if (url === "/api/products" && req.method === "POST") return readBody(req, body => {
      try {
        const b = JSON.parse(body || "{}");
        if (!b.name || !b.name.trim()) return json(res, 400, { error: "name required" });
        const cfg = readConfig();
        const list = readProducts();
        let p = b.id && list.find(x => x.id === b.id);
        if (!p) { p = { id: crypto.randomUUID(), created: Date.now() }; list.push(p); }
        p.name = b.name.trim();
        p.tagline = (b.tagline || "").trim();
        p.price = (b.price || "").trim();
        p.description = (b.description || "").trim();
        p.categories = (b.categories || []).filter(c => cfg.categories.includes(c));
        p.tags = (b.tags || []).filter(t => cfg.tags.includes(t));
        p.images = Array.isArray(b.images) ? b.images.filter(s => typeof s === "string" && s.startsWith("/assets/products/")) : [];
        p.available = b.available !== false;
        writeProducts(list);
        json(res, 200, p);
      } catch (e) { json(res, 400, { error: String(e.message || e) }); }
    });
    if (url === "/api/products/delete" && req.method === "POST") return readBody(req, body => {
      let id = ""; try { id = JSON.parse(body || "{}").id; } catch {}
      let list = readProducts(); const p = list.find(x => x.id === id);
      list = list.filter(x => x.id !== id); writeProducts(list);
      if (p) (p.images || []).forEach(unlink);
      json(res, 200, { ok: true });
    });
    if (url === "/api/products/reorder" && req.method === "POST") return readBody(req, body => {
      let ids = []; try { ids = JSON.parse(body || "{}").ids || []; } catch {}
      const list = readProducts(); const byId = Object.fromEntries(list.map(p => [p.id, p]));
      const ordered = ids.map(id => byId[id]).filter(Boolean);
      list.forEach(p => { if (!ids.includes(p.id)) ordered.push(p); });
      writeProducts(ordered); json(res, 200, { ok: true });
    });
    if (url === "/api/config" && req.method === "POST") return readBody(req, body => {
      try {
        const b = JSON.parse(body || "{}");
        const cfg = readConfig();
        if (Array.isArray(b.categories)) cfg.categories = b.categories.map(s => String(s).trim()).filter(Boolean);
        if (Array.isArray(b.tags)) cfg.tags = b.tags.map(s => String(s).trim()).filter(Boolean);
        if (b.about) cfg.about = { quote: String(b.about.quote || ""), paragraphs: (b.about.paragraphs || []).map(String) };
        if (b.contact) cfg.contact = { intro: "", phone: "", phoneHref: "", subtext: "", ...b.contact };
        writeConfig(cfg);
        // cascade renames to products
        const renames = b.renames || {};
        if ((renames.categories || []).length || (renames.tags || []).length) {
          const list = readProducts();
          const apply = (arr, pairs) => arr.map(v => { const hit = pairs.find(([o]) => o === v); return hit ? hit[1] : v; });
          list.forEach(p => {
            if (renames.categories?.length) p.categories = apply(p.categories || [], renames.categories);
            if (renames.tags?.length) p.tags = apply(p.tags || [], renames.tags);
          });
          writeProducts(list);
        }
        json(res, 200, cfg);
      } catch (e) { json(res, 400, { error: String(e.message || e) }); }
    });
    return json(res, 404, { error: "not found" });
  }

  // ---- static ----
  let urlPath = decodeURIComponent(url);
  if (urlPath.endsWith("/")) urlPath += "index.html";
  if (urlPath === "/admin") urlPath = "/admin.html";
  const filePath = path.normalize(path.join(ROOT, urlPath));
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); return res.end("Forbidden"); }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" }); return res.end("<h1>Not found</h1>"); }
    const ext = path.extname(filePath).toLowerCase();
    const cache = (ext === ".html" || ext === ".css" || ext === ".js") ? "no-cache" : "public, max-age=86400";
    res.writeHead(200, { "Content-Type": TYPES[ext] || "application/octet-stream", "Cache-Control": cache });
    res.end(data);
  });
});
server.listen(PORT, "0.0.0.0", () => console.log("bitachon-site on :" + PORT + (TOKEN ? " (admin on)" : " (NO ADMIN_PASSWORD)")));
