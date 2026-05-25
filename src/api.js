const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

async function callGroq(prompt) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) throw new Error("Missing GROQ API key. Add VITE_GROQ_API_KEY to your .env file.");

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "Groq API error");
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

export async function generatePost(update, platform, tone) {
  const platformInstructions = {
    linkedin: "Generate ONE LinkedIn post (150-250 words). End with 5-7 relevant hashtags on a new line.",
    twitter: "Generate ONE X/Twitter post (max 280 characters). End with 3-4 hashtags.",
    both: `Generate TWO posts labeled clearly:
LINKEDIN: (150-250 words, 5-7 hashtags)
TWITTER: (max 280 characters, 3-4 hashtags)`,
  };

  const prompt = `You are a social media content writer for AI startups. Tone: ${tone}.

Startup update: "${update}"

${platformInstructions[platform]}

Rules:
- No filler phrases like "Excited to share" or "Thrilled to announce"
- Be specific and real — use the actual numbers and details provided
- Sound like a real founder, not a corporate press release
- If tone is Beginner-friendly, explain technical terms simply
- Return only the post content, nothing else.`;

  return callGroq(prompt);
}

export async function generateOutreachMessage(lead) {
  const prompt = `You are an expert B2B outreach copywriter for an AI startup.

Write a short, personalized cold outreach message for this lead:
- Name: ${lead.name}
- Company: ${lead.company}
- LinkedIn: ${lead.linkedin || "not provided"}
- Notes: ${lead.notes || "none"}

Rules:
- Max 100 words
- No generic openers like "I hope this finds you well"
- Be specific to their company
- Mention that we build AI automation tools
- End with a simple, low-pressure CTA
- Sound human, not like a template
- Return only the message, nothing else.`;

  return callGroq(prompt);
}
