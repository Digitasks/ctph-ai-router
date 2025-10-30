import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, userId, channel } = req.body;

    const systemPrompt =
      process.env.SYSTEM_PROMPT ||
      "You are Angge, the friendly AI travel assistant for CTPH Tour. Always reply helpfully, naturally, and concisely in Taglish.";

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    });

    const reply = completion.choices?.[0]?.message?.content?.trim();

    return res.status(200).json({
      reply: reply || "Sorry, I didn’t catch that. Could you please rephrase?",
      userId,
      channel,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
