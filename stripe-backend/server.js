const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const Stripe = require("stripe");

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 8787);
const dataDir = path.join(__dirname, "data");
const dbFile = path.join(dataDir, "entitlements.json");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

const allowedOrigins = String(process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const successUrlDefault = String(process.env.SUCCESS_URL || "").trim();
const cancelUrlDefault = String(process.env.CANCEL_URL || "").trim();

const SKIN_CATALOG = {
  poolMonitor: { name: "Pool Guard Senpai", price: 300 },
  summerFestival: { name: "Summer Festival Senpai", price: 300 },
  noonAwakening: { name: "Noon Awakened Senpai", price: 400 },
  nightPatrol: { name: "Night Patrol Senpai", price: 350 },
  ramuneDrive: { name: "Ramune Drive Senpai", price: 350 },
  stationMaster: { name: "Station Master Senpai", price: 350 },
  score81000: { name: "81K Tide Runner", price: 450 },
  score114514: { name: "114,514 Special Skin", price: 810 },
  score162000: { name: "162K Flash Step", price: 550 },
  score243000: { name: "243K Relay Burst", price: 650 },
  score324000: { name: "324K Skyline Heat", price: 750 },
  score405000: { name: "405K Crown Line", price: 950 }
};

function ensureDb() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(dbFile)) {
    fs.writeFileSync(dbFile, JSON.stringify({ players: {} }, null, 2));
  }
}

function loadDb() {
  ensureDb();
  try {
    return JSON.parse(fs.readFileSync(dbFile, "utf8"));
  } catch (error) {
    return { players: {} };
  }
}

function saveDb(db) {
  ensureDb();
  fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));
}

function getPlayerRecord(db, playerId) {
  if (!db.players[playerId]) {
    db.players[playerId] = {
      ownedSkins: [],
      purchases: []
    };
  }
  return db.players[playerId];
}

function grantSkin(playerId, skinId, source, sessionId) {
  if (!playerId || !skinId || !SKIN_CATALOG[skinId]) {
    return [];
  }
  const db = loadDb();
  const player = getPlayerRecord(db, playerId);
  if (!Array.isArray(player.ownedSkins)) {
    player.ownedSkins = [];
  }
  if (!Array.isArray(player.purchases)) {
    player.purchases = [];
  }
  if (!player.ownedSkins.includes(skinId)) {
    player.ownedSkins.push(skinId);
  }
  player.purchases.push({
    skinId,
    source: source || "manual",
    sessionId: sessionId || "",
    createdAt: new Date().toISOString()
  });
  saveDb(db);
  return player.ownedSkins.slice();
}

function getOwnedSkins(playerId) {
  if (!playerId) {
    return [];
  }
  const db = loadDb();
  const player = getPlayerRecord(db, playerId);
  return Array.isArray(player.ownedSkins) ? player.ownedSkins.slice() : [];
}

function buildAllowedOrigin(origin) {
  if (!origin) {
    return false;
  }
  if (!allowedOrigins.length) {
    return origin;
  }
  return allowedOrigins.includes(origin) ? origin : false;
}

function requireStripeKeys(res) {
  if (!process.env.STRIPE_SECRET_KEY) {
    res.status(500).json({ error: "STRIPE_SECRET_KEY is not configured." });
    return false;
  }
  return true;
}

function resolveSuccessUrl(customUrl) {
  const clean = String(customUrl || "").trim();
  return clean || successUrlDefault;
}

function resolveCancelUrl(customUrl) {
  const clean = String(customUrl || "").trim();
  return clean || cancelUrlDefault;
}

app.use((req, res, next) => {
  const allowed = buildAllowedOrigin(req.headers.origin);
  if (allowed) {
    res.setHeader("Access-Control-Allow-Origin", allowed);
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  }
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
});

app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  if (!requireStripeKeys(res)) {
    return;
  }
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    res.status(500).json({ error: "STRIPE_WEBHOOK_SECRET is not configured." });
    return;
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    res.status(400).send("Webhook signature verification failed.");
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const playerId = session.metadata && session.metadata.playerId;
    const skinId = session.metadata && session.metadata.skinId;
    if (session.payment_status === "paid") {
      grantSkin(playerId, skinId, "webhook", session.id);
    }
  }

  res.json({ received: true });
});

app.use(express.json());
app.use(cors({
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }
    const allowed = buildAllowedOrigin(origin);
    callback(allowed ? null : new Error("Origin not allowed"), !!allowed);
  }
}));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/player/skins", (req, res) => {
  const playerId = String(req.query.playerId || "").trim();
  res.json({
    playerId,
    ownedSkins: getOwnedSkins(playerId)
  });
});

app.get("/api/checkout/confirm", async (req, res) => {
  if (!requireStripeKeys(res)) {
    return;
  }

  const sessionId = String(req.query.sessionId || "").trim();
  const playerId = String(req.query.playerId || "").trim();
  if (!sessionId || !playerId) {
    res.status(400).json({ error: "sessionId and playerId are required." });
    return;
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const skinId = session.metadata && session.metadata.skinId;
    const sessionPlayerId = session.metadata && session.metadata.playerId;
    if (session.payment_status !== "paid" || sessionPlayerId !== playerId || !SKIN_CATALOG[skinId]) {
      res.status(400).json({ error: "Checkout session is not eligible for unlock." });
      return;
    }
    const ownedSkins = grantSkin(playerId, skinId, "confirm", session.id);
    res.json({
      playerId,
      skinId,
      ownedSkins
    });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to confirm checkout session." });
  }
});

app.post("/api/checkout/session", async (req, res) => {
  if (!requireStripeKeys(res)) {
    return;
  }

  const skinId = String(req.body.skinId || "").trim();
  const playerId = String(req.body.playerId || "").trim();
  const successUrl = resolveSuccessUrl(req.body.successUrl);
  const cancelUrl = resolveCancelUrl(req.body.cancelUrl);
  const skin = SKIN_CATALOG[skinId];

  if (!skin) {
    res.status(400).json({ error: "Unknown skinId." });
    return;
  }
  if (!playerId) {
    res.status(400).json({ error: "playerId is required." });
    return;
  }
  if (!successUrl || !cancelUrl) {
    res.status(400).json({ error: "successUrl and cancelUrl are required." });
    return;
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: successUrl + (successUrl.includes("?") ? "&" : "?") + "session_id={CHECKOUT_SESSION_ID}",
      cancel_url: cancelUrl,
      line_items: [
        {
          price_data: {
            currency: "jpy",
            product_data: {
              name: skin.name
            },
            unit_amount: skin.price
          },
          quantity: 1
        }
      ],
      metadata: {
        skinId,
        playerId
      }
    });

    res.json({
      url: session.url
    });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to create checkout session." });
  }
});

app.listen(port, () => {
  ensureDb();
  console.log("810 SURVIVOR Stripe backend running on port " + port);
});
