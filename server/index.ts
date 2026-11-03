import express from "express";
import { processNotifications, notificationConfig } from "./notifications";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import {
  randomBytes,
  randomUUID,
  createHash,
  timingSafeEqual,
} from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { seed } from "../src/data";
import { applyCommand } from "./domain";
import type { AppState, Command, Role } from "../src/types";
const root = resolve(process.env.DATA_DIR || ".runtime");
mkdirSync(root, { recursive: true });
const db = new DatabaseSync(resolve(root, "venda.sqlite"));
db.exec(
  "PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS state (id INTEGER PRIMARY KEY, data TEXT NOT NULL); CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY,name TEXT,email TEXT UNIQUE,role TEXT,status TEXT,password TEXT); CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY,userId TEXT,expires INTEGER); CREATE TABLE IF NOT EXISTS audit (id TEXT PRIMARY KEY,actor TEXT,action TEXT,at TEXT);",
);
db.prepare("INSERT OR IGNORE INTO state VALUES (1,?)").run(
  JSON.stringify(seed),
);
const read = () =>
  JSON.parse(
    (db.prepare("SELECT data FROM state WHERE id=1").get() as { data: string })
      .data,
  ) as AppState;
const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "256kb" }));
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "same-origin");
  if (req.method !== "GET" && req.headers["sec-fetch-site"] === "cross-site") {
    res.status(403).json({ error: "Cross-site request denied" });
    return;
  }
  const origin = req.headers.origin;
  if (
    req.method !== "GET" &&
    origin &&
    new URL(origin).host !== req.headers.host
  ) {
    res.status(403).json({ error: "Origin rejected" });
    return;
  }
  next();
});
const userSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(12).max(128),
});
const digest = (s: string) => createHash("sha256").update(s).digest("hex");
function session(res: express.Response, id: string) {
  const token = randomBytes(32).toString("hex");
  db.prepare("INSERT INTO sessions VALUES (?,?,?)").run(
    digest(token),
    id,
    Date.now() + 86400000,
  );
  res.cookie("venda_session", token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.COOKIE_SECURE === "true",
    maxAge: 86400000,
    path: "/",
  });
}
const publicUser = (u: Record<string, unknown>) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  status: u.status,
});
const attempts = new Map<string, { count: number; until: number }>();
app.get("/api/health", (_req, res) => {
  try {
    db.prepare("SELECT 1").get();
    res.json({ status: "ok" });
  } catch {
    res.status(503).json({ status: "unavailable" });
  }
});
app.get("/api/auth", (req, res) => {
  const token = req.headers.cookie?.match(/(?:^|; )venda_session=([^;]+)/)?.[1];
  const u = token
    ? db
        .prepare(
          "SELECT users.* FROM sessions JOIN users ON users.id=sessions.userId WHERE token=? AND expires>?",
        )
        .get(digest(token), Date.now())
    : undefined;
  res.json({
    needsSetup: !db.prepare("SELECT id FROM users LIMIT 1").get(),
    setupProtected: Boolean(process.env.SETUP_TOKEN),
    user: u ? publicUser(u) : null,
  });
});
app.post("/api/setup", (req, res) => {
  if (db.prepare("SELECT id FROM users LIMIT 1").get()) {
    res.status(409).json({ error: "Already initialized" });
    return;
  }
  if (process.env.NODE_ENV === "production" && !process.env.SETUP_TOKEN) {
    res
      .status(503)
      .json({
        error:
          "Initial setup is locked. Set SETUP_TOKEN in your hosting environment.",
      });
    return;
  }
  if (process.env.SETUP_TOKEN) {
    const supplied =
      z.string().max(256).optional().parse(req.body.setupToken) || "";
    if (
      !timingSafeEqual(
        Buffer.from(digest(supplied)),
        Buffer.from(digest(process.env.SETUP_TOKEN)),
      )
    ) {
      res
        .status(403)
        .json({
          error:
            "Invalid setup key. Use SETUP_TOKEN from your hosting environment.",
        });
      return;
    }
  }
  const input = userSchema.parse(req.body);
  const id = randomUUID();
  db.prepare("INSERT INTO users VALUES (?,?,?,?,?,?)").run(
    id,
    input.name,
    input.email.toLowerCase(),
    "Admin",
    "Active",
    bcrypt.hashSync(input.password, 12),
  );
  session(res, id);
  res.json({ ok: true });
});
app.post("/api/login", (req, res) => {
  const key = req.ip || "local";
  const limit = attempts.get(key);
  if (limit && limit.until > Date.now() && limit.count >= 10) {
    res
      .status(429)
      .json({ error: "Too many attempts. Try again in 15 minutes." });
    return;
  }
  const input = z
    .object({ email: z.string().email(), password: z.string().max(128) })
    .parse(req.body);
  const u = db
    .prepare("SELECT * FROM users WHERE email=?")
    .get(input.email.toLowerCase());
  if (!u || !bcrypt.compareSync(input.password, u.password as string)) {
    attempts.set(key, {
      count: (limit && limit.until > Date.now() ? limit.count : 0) + 1,
      until: Date.now() + 900000,
    });
    res.status(401).json({ error: "Email or password incorrect" });
    return;
  }
  attempts.delete(key);
  session(res, u.id as string);
  res.json({ ok: true });
});
app.use("/api", (req, res, next) => {
  const token = req.headers.cookie?.match(/(?:^|; )venda_session=([^;]+)/)?.[1];
  const u = token
    ? db
        .prepare(
          "SELECT users.* FROM sessions JOIN users ON users.id=sessions.userId WHERE token=? AND expires>?",
        )
        .get(digest(token), Date.now())
    : undefined;
  if (!u) {
    res.status(401).json({ error: "Sign in required" });
    return;
  }
  res.locals.user = publicUser(u);
  next();
});
app.post("/api/logout", (req, res) => {
  const token = req.headers.cookie?.match(/(?:^|; )venda_session=([^;]+)/)?.[1];
  if (token)
    db.prepare("DELETE FROM sessions WHERE token=?").run(digest(token));
  res.clearCookie("venda_session");
  res.json({ ok: true });
});
app.get("/api/state", (_req, res) => res.json(read()));
const settingsSchema = z.object({
  company: z.object({
    name: z.string().min(1).max(150),
    address: z.string().max(300),
    phone: z.string().max(50),
    email: z.string().email(),
  }),
  notifications: z.record(
    z.string(),
    z.object({ email: z.boolean(), sms: z.boolean(), inapp: z.boolean() }),
  ),
  thresholds: z
    .array(z.number().int().min(1).max(90))
    .length(3)
    .refine((a) => a[0] > a[1] && a[1] > a[2], "Thresholds must descend"),
  dailyPings: z.boolean(),
  suspendCredit: z.boolean(),
});
const commandSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("checkout"),
    items: z
      .array(
        z.object({
          productId: z.string(),
          qty: z.number().int().positive().max(10000),
          credit: z.boolean(),
        }),
      )
      .min(1)
      .max(100),
    mode: z.enum(["pay", "credit"]),
    method: z.enum(["EcoCash", "Bank Transfer", "Cash on Delivery"]),
    terms: z.union([z.literal(7), z.literal(15), z.literal(30)]),
  }),
  z.object({
    type: z.literal("payInvoice"),
    id: z.string(),
    method: z.enum(["EcoCash", "Bank Transfer", "Cash on Delivery"]),
  }),
  z.object({ type: z.literal("readAlert"), id: z.string() }),
  z.object({ type: z.literal("readAll") }),
  z.object({ type: z.literal("triggerReminders") }),
  z.object({
    type: z.literal("orderStatus"),
    id: z.string(),
    status: z.enum([
      "Pending",
      "Processing",
      "Dispatched",
      "Delivered",
      "Cancelled",
    ]),
  }),
  z.object({ type: z.literal("saveSettings"), settings: settingsSchema }),
  z.object({
    type: z.literal("saveSupplier"),
    supplier: z.object({
      id: z.string().min(1),
      name: z.string().min(1).max(150),
      category: z.string().min(1).max(50),
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      creditLimit: z.number().positive().max(10000000),
      creditUsed: z.number().nonnegative(),
      contactEmail: z.string().email(),
      phone: z.string().max(50),
      trucks: z.array(z.string()),
    }),
  }),
]);
app.post("/api/commands", (req, res) => {
  const c = commandSchema.parse(req.body) as Command;
  db.exec("BEGIN IMMEDIATE");
  try {
    const state = applyCommand(read(), c, res.locals.user.role as Role);
    db.prepare("UPDATE state SET data=? WHERE id=1").run(JSON.stringify(state));
    db.prepare("INSERT INTO audit VALUES (?,?,?,?)").run(
      randomUUID(),
      res.locals.user.id,
      c.type,
      new Date().toISOString(),
    );
    db.exec("COMMIT");
    res.json(state);
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
});
app.get("/api/users", (_req, res) => {
  if (res.locals.user.role !== "Admin") {
    res.status(403).json({ error: "Administrator access required" });
    return;
  }
  res.json(db.prepare("SELECT id,name,email,role,status FROM users").all());
});
app.post("/api/users", (req, res) => {
  if (res.locals.user.role !== "Admin") {
    res.status(403).json({ error: "Administrator access required" });
    return;
  }
  const u = userSchema
    .extend({ role: z.enum(["Admin", "Operations", "Finance"]) })
    .parse(req.body);
  db.prepare("INSERT INTO users VALUES (?,?,?,?,?,?)").run(
    randomUUID(),
    u.name,
    u.email.toLowerCase(),
    u.role,
    "Active",
    bcrypt.hashSync(u.password, 12),
  );
  res.json({ ok: true });
});
let aiLast = 0;
app.post("/api/ai", async (_req, res, next) => {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      res.status(503).json({
        error:
          "Set ANTHROPIC_API_KEY on the server to enable live recommendations.",
      });
      return;
    }
    if (Date.now() - aiLast < 10000) {
      res.status(429).json({ error: "Please wait before refreshing again." });
      return;
    }
    aiLast = Date.now();
    const low = read().products.filter((p) => p.stock <= p.reorderLevel);
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "anthropic-version": "2023-06-01",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 300,
        stream: true,
        system:
          "You are an inventory manager for a Zimbabwean retail store. Analyse the stock data and give concise reorder recommendations in 2-3 sentences. Mention products, urgency and reorder quantities.",
        messages: [
          {
            role: "user",
            content: JSON.stringify(
              low.map(
                ({
                  name,
                  supplierName,
                  stock,
                  reorderLevel,
                  weeklyAvgSales,
                }) => ({
                  name,
                  supplierName,
                  stock,
                  reorderLevel,
                  weeklyAvgSales,
                }),
              ),
            ),
          },
        ],
      }),
      signal: AbortSignal.timeout(45000),
    });
    if (!upstream.ok || !upstream.body) {
      res.status(502).json({
        error: `AI provider returned ${upstream.status}. Please retry later.`,
      });
      return;
    }
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    const reader = upstream.body.getReader();
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done || res.destroyed) break;
        res.write(value);
      }
    } finally {
      await reader.cancel();
    }
    res.end();
  } catch (e) {
    if (res.headersSent) res.end();
    else next(e);
  }
});
app.use(express.static(resolve("dist")));
app.get("/{*path}", (_req, res) => res.sendFile(resolve("dist/index.html")));
app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    res.status(400).json({
      error:
        err instanceof z.ZodError
          ? err.issues.map((i) => i.message).join("; ")
          : err instanceof Error
            ? err.message
            : "Request failed",
    });
  },
);
let processingNotifications = false;
const timer = setInterval(async () => {
  if (processingNotifications) return;
  processingNotifications = true;
  try {
    const state = applyCommand(read(), { type: "triggerReminders" }, "Admin");
    db.prepare("UPDATE state SET data=? WHERE id=1").run(JSON.stringify(state));
    await processNotifications(
      read,
      (s) => {
        db.prepare("UPDATE state SET data=? WHERE id=1").run(JSON.stringify(s));
      },
      notificationConfig(),
    );
  } catch {
    console.error(
      "Reminder job failed; inspect application and provider availability.",
    );
  } finally {
    processingNotifications = false;
  }
}, 60000);
timer.unref();
app.listen(Number(process.env.PORT || 3001), "0.0.0.0", () =>
  console.log(`VENDA API listening on ${process.env.PORT || 3001}`),
);
