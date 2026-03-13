/**
 * AI calls for mock interview: generate questions from resume, evaluate answer and return feedback.
 * Prefers Gemini (GEMINI_API_KEY); falls back to OpenAI (OPENAI_API_KEY) if needed.
 */

const OPENAI_MODEL = "gpt-4o-mini";
const MAX_TOKENS_QUESTIONS = 800;
const MAX_TOKENS_FEEDBACK = 400;

async function callGemini(prompt: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new Error("GEMINI_API_KEY is not set");

  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": key,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini error: ${res.status} ${err.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
}

async function callOpenAI(prompt: string, maxTokens: number): Promise<string> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw new Error("OPENAI_API_KEY is not set");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error: ${res.status} ${err.slice(0, 200)}`);
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

export async function generateQuestionsFromResume(resumeText: string, count: number = 5): Promise<string[]> {
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

  const hasGemini = !!process.env.GEMINI_API_KEY?.trim();
  const hasOpenAI = !!process.env.OPENAI_API_KEY?.trim();

  let content: string;
  if (hasGemini) {
    try {
      content = await callGemini(prompt);
    } catch (e) {
      if (!hasOpenAI) throw e;
      content = await callOpenAI(prompt, MAX_TOKENS_QUESTIONS);
    }
  } else {
    content = await callOpenAI(prompt, MAX_TOKENS_QUESTIONS);
  }
  const lines = content
    .split("\n")
    .map((l) => l.replace(/^\d+[.)]\s*/, "").trim())
    .filter((l) => l.length > 10);
  return lines.slice(0, count);
}

export async function getFeedbackForAnswer(question: string, userAnswer: string): Promise<string> {
  const prompt = `You are an expert interview coach. Evaluate this interview answer and give brief, constructive feedback (2–4 sentences). Focus on what was strong and one specific suggestion to improve. Be encouraging but honest.

Question: ${question}

Candidate's answer: ${userAnswer}

Feedback:`;

  const hasGemini = !!process.env.GEMINI_API_KEY?.trim();
  const hasOpenAI = !!process.env.OPENAI_API_KEY?.trim();

  let content: string;
  if (hasGemini) {
    try {
      content = await callGemini(prompt);
    } catch (e) {
      if (!hasOpenAI) throw e;
      content = await callOpenAI(prompt, MAX_TOKENS_FEEDBACK);
    }
  } else {
    content = await callOpenAI(prompt, MAX_TOKENS_FEEDBACK);
  }

  return content || "No feedback generated.";
}
