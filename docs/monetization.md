# 810 SURVIVOR Monetization Setup

## Stripe Payment Links

1. Open Stripe Dashboard.
2. Create one Payment Link per paid skin.
3. Copy each `https://buy.stripe.com/...` URL.
4. Paste the URLs into:
   `src/data/commerce.js`
5. In Stripe Dashboard, set the after-payment redirect URL if you want:
   - success: `/stripe-success.html`
   - cancel: `/stripe-cancel.html`

Example:

```js
stripePaymentLinks: {
  poolMonitor: "https://buy.stripe.com/test_xxx",
  summerFestival: "https://buy.stripe.com/test_xxx",
  noonAwakening: "https://buy.stripe.com/test_xxx",
  nightPatrol: "https://buy.stripe.com/test_xxx",
  ramuneDrive: "https://buy.stripe.com/test_xxx",
  stationMaster: "https://buy.stripe.com/test_xxx",
  score81000: "https://buy.stripe.com/test_xxx",
  score114514: "https://buy.stripe.com/test_xxx",
  score162000: "https://buy.stripe.com/test_xxx",
  score243000: "https://buy.stripe.com/test_xxx",
  score324000: "https://buy.stripe.com/test_xxx",
  score405000: "https://buy.stripe.com/test_xxx"
}
```

Current behavior:
- The store opens Stripe Checkout in a new tab.
- If a score-unlock skin also has a Stripe link, the store shows `BUY` for that skin.
- This static build does not verify payment.
- Secure skin unlock after payment needs a backend and Stripe webhook.

## Stripe Server Mode

If you want real unlock sync after payment, use the backend in:

`stripe-backend/`

Frontend config in `src/data/commerce.js`:

```js
stripeServer: {
  baseUrl: "https://YOUR-STRIPE-BACKEND.example.com",
  successUrl: "https://810-survivor.com/stripe-success.html",
  cancelUrl: "https://810-survivor.com/stripe-cancel.html"
}
```

Current server flow:

1. The game creates a persistent `playerId`.
2. Store `BUY` calls `POST /api/checkout/session`.
3. Stripe redirects back to `stripe-success.html?session_id=...`.
4. The success page calls `GET /api/checkout/confirm`.
5. Purchased skins are written into local save data.

GitHub Pages example:
- game URL: `https://YOURNAME.github.io/810-survivor/`
- success URL: `https://YOURNAME.github.io/810-survivor/stripe-success.html`
- cancel URL: `https://YOURNAME.github.io/810-survivor/stripe-cancel.html`

Recommended production flow:
1. Create Stripe Checkout Session on your server.
2. Redirect player to Checkout.
3. Receive `checkout.session.completed` by webhook.
4. Save purchased skins in your database.
5. Return purchased skins to the game on login.

## Google AdSense

1. Get approved in AdSense.
2. Copy your publisher ID:
   `ca-pub-xxxxxxxxxxxxxxxx`
3. Create display ad units and copy the slot IDs.
4. Paste them into:
   `src/data/commerce.js`

Example:

```js
adsense: {
  publisherId: "ca-pub-1234567890123456",
  topSlot: "1234567890",
  bottomSlot: "0987654321",
  autoAds: false
}
```

Current behavior:
- If `publisherId` is empty, ad containers stay hidden.
- If `publisherId` and slot IDs are set, top and bottom ads are injected.
- Mobile hides the ad slots to protect the play area.

Files involved:
- `src/data/commerce.js`
- `src/systems/monetization.js`
- `index.html`
- `styles/main.css`
