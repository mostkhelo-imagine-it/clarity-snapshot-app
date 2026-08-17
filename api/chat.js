// POST /api/chat   body: { token, messages: [{role, content}, ...] }
// Validates the paid token, spends one message from the buyer's budget, and
// returns the Clarity Companion's reply from Claude. The API key never leaves
// the server, and the system prompt is not exposed to the client.

import Anthropic from "@anthropic-ai/sdk";
import { verifyToken } from "./_lib/token.js";
import { spend } from "./_lib/usage.js";
import { SYSTEM_PROMPT } from "./_lib/prompt.js";

const MAX_MESSAGES = 80;      // safety ceiling on conversation length
const MAX_CHARS = 6000;       // per-message input ceiling

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed." });
    }
    if (!process.env.ANTHROPIC_API_KEY || !process.env.APP_SECRET) {
      return res.status(500).json({ error: "Server not configured." });
    }

    const { token, messages } = req.body || {};

    const check = verifyToken(token, process.env.APP_SECRET);
    if (!check.valid) {
      return res.status(401).json({ error: "access-invalid", reason: check.reason });
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "No messages provided." });
    }
    if (messages.length > MAX_MESSAGES) {
      return res.status(400).json({ error: "Conversation is too long." });
    }
    const clean = messages.slice(-MAX_MESSAGES).map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content ?? "").slice(0, MAX_CHARS),
    }));

    const usage = await spend(check.sid);
    if (!usage.ok) {
      return res.status(402).json({ error: "budget", reason: usage.reason });
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

    const completion = await anthropic.messages.create({
      model,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: clean,
    });

    const reply = completion.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    return res.status(200).json({ reply, remaining: usage.remaining });
  } catch (err) {
    console.error("chat error:", err);
    return res.status(500).json({ error: "Something interrupted the conversation. Please try again." });
  }
}
