// Usage cap, backed by Upstash Redis (REST). One purchase unlocks a fixed
// number of messages; this is what stops a shared link from running up your
// Anthropic bill. If Upstash env vars are not set, enforcement is skipped
// (fine for testing, not recommended for a live paid tool).

const URL = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export const usageEnabled = Boolean(URL && TOKEN);

async function redis(command) {
  const res = await fetch(URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });
  if (!res.ok) throw new Error(`Upstash error ${res.status}`);
  const data = await res.json();
  return data.result;
}

// Create the budget for a session the first time it is opened. Idempotent:
// NX means a second call (e.g. page refresh) will not reset the counter.
export async function initBudget(sid, budget, ttlSeconds) {
  if (!usageEnabled) return;
  await redis(["SET", `cs:${sid}`, String(budget), "EX", String(ttlSeconds), "NX"]);
}

// Try to spend one message. Returns { ok, remaining, reason }.
export async function spend(sid) {
  if (!usageEnabled) return { ok: true, remaining: null };
  const current = await redis(["GET", `cs:${sid}`]);
  if (current === null || current === undefined) {
    return { ok: false, remaining: 0, reason: "expired" };
  }
  if (Number(current) <= 0) {
    return { ok: false, remaining: 0, reason: "exhausted" };
  }
  const remaining = await redis(["DECR", `cs:${sid}`]);
  return { ok: true, remaining: Number(remaining) };
}
