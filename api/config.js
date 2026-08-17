// GET /api/config
// Public settings the landing page needs to open a Paddle checkout: the
// client-side token (safe to expose — it's sent to the browser anyway), the
// environment, and the price tiers. No secrets here — the Paddle API key
// stays server-side in session.js.
//
// The non-secret values below are pre-filled as defaults so the app works
// out of the box. You can override any of them with environment variables.

export default async function handler(req, res) {
  res.status(200).json({
    clientToken: process.env.PADDLE_CLIENT_TOKEN || "live_5629486ca25f8a091297d95584a",
    environment: process.env.PADDLE_ENVIRONMENT === "sandbox" ? "sandbox" : "production",
    prices: {
      "10": process.env.PADDLE_PRICE_10 || "pri_01m05699s55jpda5cewzqdf9wd",
      "15": process.env.PADDLE_PRICE_15 || "pri_01m056bz7d89cg5rnp1p3y8mhd",
      "20": process.env.PADDLE_PRICE_20 || "pri_01m056fzqtj7np1z0nrtfjzjyx",
    },
  });
}
