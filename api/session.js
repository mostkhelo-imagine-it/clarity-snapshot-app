// GET /api/session?txn=txn_xxx   (Paddle appends _ptxn to the success URL)
// Confirms with Paddle that this transaction was actually paid, opens a usage
// budget, and returns a signed access token the chat page will use.

import { issueToken } from "./_lib/token.js";
import { initBudget } from "./_lib/usage.js";

const API_BASE =
  process.env.PADDLE_ENVIRONMENT === "sandbox"
    ? "https://sandbox-api.paddle.com"
    : "https://api.paddle.com";

// A Paddle transaction is settled when it reaches one of these statuses.
const PAID = ["completed", "paid", "billed"];

export default async function handler(req, res) {
  try {
    const txnId = req.query.txn || req.query._ptxn;
    if (!txnId) {
      return res.status(400).json({ ok: false, error: "Missing transaction." });
    }
    if (!process.env.PADDLE_API_KEY || !process.env.APP_SECRET) {
      return res.status(500).json({ ok: false, error: "Server not configured." });
    }

    const r = await fetch(`${API_BASE}/transactions/${encodeURIComponent(txnId)}`, {
      headers: { Authorization: `Bearer ${process.env.PADDLE_API_KEY}` },
    });
    if (!r.ok) {
      return res.status(402).json({ ok: false, error: "Payment not found." });
    }
    const body = await r.json();
    const status = body && body.data && body.data.status;
    if (!PAID.includes(status)) {
      return res.status(402).json({ ok: false, error: "Payment isn't complete yet." });
    }

    const budget = Number(process.env.SESSION_MESSAGE_BUDGET || 60);
    const ttl = Number(process.env.SESSION_TTL_SECONDS || 86400);

    await initBudget(txnId, budget, ttl);
    const token = issueToken(txnId, ttl, process.env.APP_SECRET);

    return res.status(200).json({ ok: true, token });
  } catch (err) {
    console.error("session error:", err);
    return res.status(500).json({ ok: false, error: "Could not verify your payment." });
  }
}
