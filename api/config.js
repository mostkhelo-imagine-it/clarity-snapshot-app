// GET /api/config
// Public settings the landing page needs to open a Paddle checkout: the
// client-side token (safe to expose — it's sent to the browser anyway), the
// environment, and the single fixed price. No secrets here — the Paddle API
// key stays server-side in session.js.
//
// The product is sold at one fixed price, US$15, using the existing Paddle
// price id below (the id created at $15, so the displayed price matches what
// Paddle charges).

export default async function handler(req, res) {
  res.status(200).json({
    clientToken: process.env.PADDLE_CLIENT_TOKEN || "live_5629486ca25f8a091297d95584a",
    environment: process.env.PADDLE_ENVIRONMENT === "sandbox" ? "sandbox" : "production",
    price: process.env.PADDLE_PRICE_15 || "pri_01m056bz7d89cg5rnp1p3y8mhd",
  });
}
