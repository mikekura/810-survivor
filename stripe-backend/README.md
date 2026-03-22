# 810 SURVIVOR Stripe Backend

This is the minimal backend that turns the static web game into a real Stripe-powered skin store.

## What it does

- creates Stripe Checkout Sessions for every paid skin
- receives `checkout.session.completed` by webhook
- stores purchased skins per `playerId`
- returns owned skins to the web game
- confirms a success-page `session_id` so unlocks can appear immediately

## 1. Install

```bash
cd stripe-backend
npm install
```

## 2. Configure

Copy `.env.example` to `.env` and fill in:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `ALLOWED_ORIGINS`
- `SUCCESS_URL`
- `CANCEL_URL`

Example:

```env
PORT=8787
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
ALLOWED_ORIGINS=https://810-survivor.com,https://www.810-survivor.com
SUCCESS_URL=https://810-survivor.com/stripe-success.html
CANCEL_URL=https://810-survivor.com/stripe-cancel.html
```

## 3. Start locally

```bash
npm start
```

The backend will run on:

```text
http://localhost:8787
```

## 4. Connect the frontend

In [src/data/commerce.js](/C:/Users/ookub/OneDrive/ドキュメント/manatsu-web-rpg/src/data/commerce.js), set:

```js
stripeServer: {
  baseUrl: "http://localhost:8787",
  successUrl: "http://localhost:8000/stripe-success.html",
  cancelUrl: "http://localhost:8000/stripe-cancel.html"
}
```

If `stripeServer.baseUrl` is set, the game uses backend Checkout Sessions first.
If it is empty, the game falls back to Stripe Payment Links.

## 5. Register the webhook

Point Stripe webhook events to:

```text
POST /api/stripe/webhook
```

Required event:

- `checkout.session.completed`

## 6. Frontend flow

1. player opens the in-game store
2. game sends `skinId + playerId` to `POST /api/checkout/session`
3. backend returns a Stripe Checkout URL
4. Stripe redirects to `stripe-success.html?session_id=...`
5. success page calls `GET /api/checkout/confirm`
6. the game save is updated with purchased skins

## Notes

- Purchases are stored in `stripe-backend/data/entitlements.json`
- This is the smallest working example, not a full production commerce system
- For production, move entitlements to a proper database
