// Signed access tokens. A buyer who has paid receives one of these; the chat
// endpoint refuses to run without a valid, unexpired token. The signature is
// made with APP_SECRET on the server, so a buyer cannot forge or extend one.

import crypto from "crypto";

function b64url(input) {
  return Buffer.from(input).toString("base64url");
}

function sign(data, secret) {
  return crypto.createHmac("sha256", secret).update(data).digest("base64url");
}

// Create a token bound to a paid Paddle transaction id, valid for ttlSeconds.
export function issueToken(sessionId, ttlSeconds, secret) {
  const payload = {
    sid: sessionId,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const body = b64url(JSON.stringify(payload));
  const sig = sign(body, secret);
  return `${body}.${sig}`;
}

// Returns { valid, sid, reason }.
export function verifyToken(token, secret) {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return { valid: false, reason: "malformed" };
  }
  const [body, sig] = token.split(".");
  const expected = sign(body, secret);
  const a = Buffer.from(sig || "", "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { valid: false, reason: "bad-signature" };
  }
  let payload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return { valid: false, reason: "corrupt" };
  }
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    return { valid: false, reason: "expired" };
  }
  return { valid: true, sid: payload.sid };
}
