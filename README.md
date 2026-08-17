# The Clarity Snapshot — Web App

A paid, gated web tool for **builtbymostafaK© Creative Studio**.

Flow: a button on your site → **Paddle** checkout (choose $10 / $15 / $20) → after payment, the buyer lands on a private chat page on your domain that runs the **Clarity Companion** (powered by Claude). No buyer account needed. The AI key stays on the server, and each purchase unlocks a capped number of messages so a shared link can't run up your bill.

Payment uses **Paddle**, a merchant of record: Paddle sells to your customers worldwide in USD, collects and remits all sales tax/VAT for you, and pays you out — and Egypt is supported as a seller country.

---

## Pages

```
/            Landing + Paddle checkout (index.html)
/pay         Pricing page with tiers + checkout (pay.html)
/tool        The gated chat page (tool.html) — loads after payment
/terms       Terms of Service
/privacy     Privacy Policy
/refund      Refund Policy
```

## What you'll need (all have free tiers)

| Service | Why | Cost |
|---|---|---|
| **Paddle** | Takes the payment, handles tax | Per-transaction fee only |
| **Anthropic** | Powers the conversation | ~a few cents per completed Snapshot; you set a spend limit |
| **Vercel** | Hosts the app | Free |
| **Upstash** | Caps usage per purchase (protects your bill) | Free |

## Setup

1. **Paddle** — sign up at paddle.com, complete seller verification, create a product "The Clarity Snapshot" with three one-time prices ($10/$15/$20). Your price IDs and client token are already filled into `api/config.js`. Under **Developer tools → Authentication**, copy your **API key** (`pdl_live_...`) — the one secret you set in Vercel as `PADDLE_API_KEY`. Under **Checkout → Checkout settings**, set your default payment link + approved domain to `clarity.builtbymostafak.studio`.
2. **Anthropic** — create an API key at console.anthropic.com and set a monthly spend cap.
3. **Upstash** — create a Redis database, copy the REST URL + token.
4. **App secret** — generate one: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
5. **Deploy to Vercel** — deploy this folder, then set the environment variables below and redeploy.
6. **Domain** — point `clarity.builtbymostafak.studio` at the Vercel project (and match it in Paddle's approved domains).

## Environment variables (set in Vercel)

```
PADDLE_ENVIRONMENT        = production
PADDLE_API_KEY            = your live key (the only Paddle secret)
ANTHROPIC_API_KEY
ANTHROPIC_MODEL           = claude-sonnet-5
APP_SECRET
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
SESSION_MESSAGE_BUDGET    = 60
SESSION_TTL_SECONDS       = 86400
```

(Client token and price IDs are pre-filled in `api/config.js`, so they're not in this list.)

## Test before going live

You're on live Paddle, so test with a real card: buy the $10 tier yourself, confirm the chat opens and gives a Snapshot, then refund yourself from the Paddle dashboard. (To test without real money instead, set `PADDLE_ENVIRONMENT=sandbox`, use sandbox Paddle keys, and Paddle's test card.)

## Tuning it to sound like you

Open `api/_lib/prompt.js` and adjust the Clarity Companion's questions and voice until they sound exactly like you. Run the tool on 2–3 of your own real projects first.

## How the paid gate works

1. The landing/pricing page loads Paddle.js and opens a checkout for the tier the buyer picks.
2. After payment, Paddle redirects to `/tool` and appends a transaction id (`_ptxn`).
3. `/api/session` asks Paddle "was this transaction actually paid?" — only if yes does it hand back a signed access pass and open a message budget in Upstash.
4. Every message passes through `/api/chat`, which checks the pass and spends one from the budget before calling Claude. When the budget is gone, the session closes.

Your Anthropic key and the Companion's instructions live only on the server — buyers never see them.

## Files

```
index.html            Landing + Paddle checkout
pay.html              Pricing page
tool.html             Gated chat page
terms.html            Terms of Service
privacy.html          Privacy Policy
refund.html           Refund Policy
api/config.js         Public Paddle settings for the frontend
api/session.js        Verifies the Paddle transaction, issues access pass
api/chat.js           Runs the Clarity Companion via Claude (capped)
api/checkout.js       Deprecated — redirects to /
api/_lib/prompt.js    The Companion's voice — edit this
api/_lib/token.js     Signs / verifies access passes
api/_lib/usage.js     Per-purchase message cap (Upstash)
.env.example          The full list of settings
vercel.json           Routing + function config
```
