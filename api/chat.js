import OpenAI from "openai";

const cors = (res) => {
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGINS || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
};

const SYSTEM_PROMPT = process.env.SYSTEM_PROMPT || `
You are Angge, CTPH Tour’s friendly AI travel assistant. Speak in natural Taglish — warm, short, and helpful.
Goals:
- Ask/confirm essentials: travel date, number of pax, departure city, contact.
- Offer relevant destinations (Coron, El Nido, Boracay, Bohol, Siargao, Cebu, etc.)
- If user asks for a price, explain that prices vary by date/hotel/airfare, then say: “I’ll send this to Ella for a proper quote.”
Routing:
- quote/pricing/custom plan → tag: needs_quote → handoff to Ella
- add-ons/upgrades → tag: upsell_candidate → handoff to Angge
Tone:
Approachable, human, never robotic. Replies 1–3 sentences max unless asked for details.
`;

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const { message, userId, channel, context } = req.body || {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Missing 'message' string in body." });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...(Array.isArray(context) ? context : []).map(m => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content || "")
      })),
      { role: "user", content: message.trim() }
    ];

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.4,
      max_tokens: 300,
      messages
    });

    const reply = completion.choices?.[0]?.message?.content?.trim() || "Got it!";
    res.status(200).json({ reply, meta: { userId, channel } });
  } catch (err) {
    console.error("Router error:", err);
    res.status(500).json({ error: "Server error", details: String(err.message || err) });
  }
}
