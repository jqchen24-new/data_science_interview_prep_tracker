/**
 * OpenAI calls for mock interview: generate questions from resume, evaluate answer and return feedback.
 * Requires OPENAI_API_KEY in env.
 */

const MODEL = "gpt-4o-mini";
const MAX_TOKENS_QUESTIONS = 800;
const MAX_TOKENS_FEEDBACK = 400;

function getApiKey(): string {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw new Error("OPENAI_API_KEY is not set");
  return key;
}

export async function generateQuestionsFromResume(resumeText: string, count: number = 5): Promise<string[]> {
  const key = getApiKey();
  const prompt = `You are an expert interview coach. Based on the following resume text, generate exactly ${count} interview questions. Mix of:
- Resume-based questions (about experience, projects, skills mentioned)
- Behavioral/situational questions (e.g. "Tell me about a time when...", "How do you handle...")

Rules:
- Output exactly one question per line.
- Do not number the questions.
- Each line should be a single question, no extra text.
- Questions should be clear and professional.

Resume:
---
${resumeText.slice(0, 14_000)}
---`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: MAX_TOKENS_QUESTIONS,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error: ${res.status} ${err.slice(0, 200)}`);
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content?.trim() ?? "";
  const lines = content
    .split("\n")
    .map((l) => l.replace(/^\d+[.)]\s*/, "").trim())
    .filter((l) => l.length > 10);
  return lines.slice(0, count);
}

export async function getFeedbackForAnswer(question: string, userAnswer: string): Promise<string> {
  const key = getApiKey();
  const prompt = `You are an expert interview coach. Evaluate this interview answer and give brief, constructive feedback (2–4 sentences). Focus on what was strong and one specific suggestion to improve. Be encouraging but honest.

Question: ${question}

Candidate's answer: ${userAnswer}

Feedback:`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: MAX_TOKENS_FEEDBACK,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error: ${res.status} ${err.slice(0, 200)}`);
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content?.trim() ?? "No feedback generated.";
}
