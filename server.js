// Bitachon Judaica: static file server + tiny product admin.
// Static files from ./public; products in ./data/products.json; images in public/assets/products.
// Auth = single shared password (ADMIN_PASSWORD from env or ./.env), signed cookie. ponytail: one admin user, no sessions table.
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "public");
const DATA = path.join(__dirname, "data", "products.json");
const IMG_DIR = path.join(ROOT, "assets", "products");
const PORT = 3015;
const MAX_BODY = 25 * 1024 * 1024;      // request cap (base64 inflates ~33%)
const MAX_IMG = 8 * 1024 * 1024;        // decoded image cap
const CATEGORIES = ["Art & Clay", "Havdalah", "Mezuzahs", "Signs & Words", "Apparel & Gifts"];

function loadPassword() {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD.trim();
  try {
    const m = fs.readFileSync(path.join(__dirname, ".env"), "utf8").match(/^ADMIN_PASSWORD=(.*)$/m);
    return m ? m[1].trim() : "";
  } catch { return ""; }
}
const PASSWORD = loadPassword();
const TOKEN = PASSWORD ? crypto.createHash("sha256").update("bj:" + PASSWORD).digest("hex") : null;

const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml",
  ".ico": "image/x-icon", ".webp": "image/webp", ".woff": "font/woff", ".woff2": "font/woff2",
};

function readProducts() { try { return JSON.parse(fs.readFileSync(DATA, "utf8")); } catch { return []; } }
function writeProducts(list) {
  fs.mkdirSync(path.dirname(DATA), { recursive: true });
  const tmp = DATA + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(list, null, 2));
  fs.renameSync(tmp, DATA);                 // atomic-ish, no half-written file
}
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
function saveImage(id, dataUrl) {
  const m = /^data:image\/(png|jpe?g|webp);base64,(.+)$/s.exec(dataUrl || "");
  if (!m) throw new Error("bad image");
  const ext = m[1] === "jpeg" ? "jpg" : m[1];
  const buf = Buffer.from(m[2], "base64");
  if (buf.length > MAX_IMG) throw new Error("image too large");
  fs.mkdirSync(IMG_DIR, { recursive: true });
  const file = `${id}.${ext}`;
  fs.writeFileSync(path.join(IMG_DIR, file), buf);
  return `/assets/products/${file}`;
}

const server = http.createServer((req, res) => {
  const url = (req.url || "/").split("?")[0];

  // ---- API ----
  if (url.startsWith("/api/")) {
    if (url === "/api/products" && req.method === "GET") return json(res, 200, readProducts());
    if (url === "/api/session" && req.method === "GET") return json(res, 200, { authed: authed(req), categories: CATEGORIES });
    if (url === "/api/login" && req.method === "POST") return readBody(req, body => {
      let pw = ""; try { pw = (JSON.parse(body || "{}").password || "").trim(); } catch {}
      if (!TOKEN || pw !== PASSWORD) return json(res, 401, { error: "Wrong password" });
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Set-Cookie": `bj_admin=${TOKEN}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=2592000`,
      });
      return res.end(JSON.stringify({ ok: true }));
    });
    if (url === "/api/logout" && req.method === "POST") {
      res.writeHead(200, { "Content-Type": "application/json", "Set-Cookie": "bj_admin=; HttpOnly; Path=/; Max-Age=0" });
      return res.end(JSON.stringify({ ok: true }));
    }
    if (url === "/api/products" && req.method === "POST") {
      if (!authed(req)) return json(res, 401, { error: "unauthorized" });
      return readBody(req, body => {
        try {
          const b = JSON.parse(body || "{}");
          if (!CATEGORIES.includes(b.category)) return json(res, 400, { error: "bad category" });
          if (!b.name || !b.name.trim()) return json(res, 400, { error: "name required" });
          const list = readProducts();
          let p = b.id && list.find(x => x.id === b.id);
          if (!p) { p = { id: crypto.randomUUID(), created: Date.now() }; list.push(p); }
          p.category = b.category; p.name = b.name.trim();
          p.price = (b.price || "").trim(); p.description = (b.description || "").trim();
          p.available = b.available !== false;
          if (b.imageData) p.image = saveImage(p.id, b.imageData);
          writeProducts(list);
          return json(res, 200, p);
        } catch (e) { return json(res, 400, { error: String(e.message || e) }); }
      });
    }
    if (url === "/api/products/delete" && req.method === "POST") {
      if (!authed(req)) return json(res, 401, { error: "unauthorized" });
      return readBody(req, body => {
        let id = ""; try { id = JSON.parse(body || "{}").id; } catch {}
        let list = readProducts(); const p = list.find(x => x.id === id);
        list = list.filter(x => x.id !== id); writeProducts(list);
        if (p && p.image) { try { fs.unlinkSync(path.join(ROOT, p.image.replace(/^\//, ""))); } catch {} }
        return json(res, 200, { ok: true });
      });
    }
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
server.listen(PORT, "0.0.0.0", () => console.log("bitachon-site on :" + PORT + (TOKEN ? " (admin on)" : " (NO ADMIN_PASSWORD set)")));
