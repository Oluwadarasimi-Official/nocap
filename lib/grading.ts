// NoCap AI grading engine — the anti-black-box grader.
// Groq is the primary provider (OpenAI-compatible API); Gemini is the
// automatic fallback. Keys come from env only — never hardcode them.
// When no provider is configured or both fail, grading throws
// "AI grading unavailable" and the caller must surface that state honestly.
// Scores are never invented.

export interface RubricCriterion {
  criterion: string;
  max: number;
  description: string;
}

export interface GradeRow {
  criterion: string;
  score: number;
  max: number;
  feedback: string;
}

export interface GradeResult {
  total: number;
  max: number;
  breakdown: GradeRow[];
  overall_feedback: string;
  model: string;
}

export function gradingStatus(): { enabled: boolean; primary: string; fallback: string } {
  const primary = process.env.GROQ_API_KEY ? "groq" : null;
  const fallback = process.env.GEMINI_API_KEY ? "gemini" : null;
  return {
    enabled: Boolean(primary || fallback),
    primary: primary ?? "none",
    fallback: fallback ?? "none",
  };
}

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

function geminiUrl(model: string, key: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
}

function buildPrompt(args: {
  title: string;
  category: string;
  difficulty: string;
  type: string;
  prompt: string;
  rubric: RubricCriterion[];
  submission: string;
}): { system: string; user: string } {
  const { title, category, difficulty, type, prompt, rubric, submission } = args;
  const rubricText = rubric
    .map((r) => `- ${r.criterion} (max ${r.max} points): ${r.description}`)
    .join("\n");
  const system = [
    "You are NoCap, a strict but fair technical examiner grading a timed skill challenge.",
    "Grade ONLY what is in the submission. Never invent achievements the submission does not show.",
    "Be demanding: a perfect score means genuinely excellent work, not merely an attempt.",
    "Respond with a single JSON object and nothing else — no markdown fences, no prose.",
    'Shape: {"breakdown":[{"criterion":"<exact name from rubric>","score":<number 0..max>,"max":<max>,"feedback":"<one or two sentences>"}],"overall_feedback":"<2-3 sentences>"}',
  ].join("\n");
  const user = [
    `Challenge: ${title} (${category} — ${difficulty}, type: ${type})`,
    "",
    "Challenge prompt:",
    prompt,
    "",
    "Rubric:",
    rubricText,
    "",
    "Candidate submission:",
    submission.length > 12000 ? submission.slice(0, 12000) + "\n...[truncated]" : submission,
  ].join("\n");
  return { system, user };
}

function parseGradeJson(text: string, rubric: RubricCriterion[], model: string): GradeResult {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new Error("AI returned unparseable output");
  const parsed = JSON.parse(text.slice(start, end + 1)) as {
    breakdown?: { criterion?: string; score?: number; max?: number; feedback?: string }[];
    overall_feedback?: string;
  };
  if (!Array.isArray(parsed.breakdown) || parsed.breakdown.length === 0) {
    throw new Error("AI returned no rubric breakdown");
  }
  const breakdown: GradeRow[] = rubric.map((r) => {
    const row = parsed.breakdown!.find(
      (b) => (b.criterion ?? "").toLowerCase().trim() === r.criterion.toLowerCase().trim()
    );
    const raw = Number(row?.score);
    const score = Number.isFinite(raw) ? Math.max(0, Math.min(r.max, Math.round(raw))) : 0;
    return {
      criterion: r.criterion,
      score,
      max: r.max,
      feedback: typeof row?.feedback === "string" && row.feedback.trim() ? row.feedback.trim() : "No specific feedback given.",
    };
  });
  const total = breakdown.reduce((s, r) => s + r.score, 0);
  const max = breakdown.reduce((s, r) => s + r.max, 0);
  return {
    total,
    max,
    breakdown,
    overall_feedback:
      typeof parsed.overall_feedback === "string" && parsed.overall_feedback.trim()
        ? parsed.overall_feedback.trim()
        : "Graded against the rubric above.",
    model,
  };
}

async function callGroq(system: string, user: string): Promise<{ text: string; model: string }> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY is not configured");
  const model = process.env.GROQ_MODEL ?? "openai/gpt-oss-120b";
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 1500,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Groq returned HTTP ${res.status}`);
  const j = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = j.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Groq returned an empty response");
  return { text, model: `groq/${model}` };
}

async function callGemini(system: string, user: string): Promise<{ text: string; model: string }> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not configured");
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  const res = await fetch(geminiUrl(model, key), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      generationConfig: { temperature: 0.2, maxOutputTokens: 1500, responseMimeType: "application/json" },
      contents: [{ parts: [{ text: user }] }],
    }),
  });
  if (!res.ok) throw new Error(`Gemini returned HTTP ${res.status}`);
  const j = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = j.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim();
  if (!text) throw new Error("Gemini returned an empty response");
  return { text, model: `gemini/${model}` };
}

/** Grade a code or open-ended submission with AI. Groq first, Gemini on failure. */
export async function gradeWithAI(args: {
  title: string;
  category: string;
  difficulty: string;
  type: string;
  prompt: string;
  rubric: RubricCriterion[];
  submission: string;
}): Promise<GradeResult> {
  const { system, user } = buildPrompt(args);
  const errors: string[] = [];
  try {
    const { text, model } = await callGroq(system, user);
    return parseGradeJson(text, args.rubric, model);
  } catch (e) {
    errors.push(`groq: ${e instanceof Error ? e.message : "error"}`);
  }
  try {
    const { text, model } = await callGemini(system, user);
    return parseGradeJson(text, args.rubric, model);
  } catch (e) {
    errors.push(`gemini: ${e instanceof Error ? e.message : "error"}`);
  }
  throw new Error(`AI grading unavailable (${errors.join("; ")})`);
}

/** Deterministic grading for multiple-choice — no AI needed, instant result. */
export function gradeMcq(
  correctOption: string | null,
  answer: string | null,
  rubric: RubricCriterion[]
): GradeResult {
  const max = rubric.reduce((s, r) => s + r.max, 0) || 100;
  const correct =
    !!correctOption && !!answer && answer.trim().toLowerCase() === correctOption.trim().toLowerCase();
  const explanation =
    rubric[0]?.description ??
    (correct ? "Correct answer." : "Wrong answer.");
  return {
    total: correct ? max : 0,
    max,
    breakdown: [
      {
        criterion: rubric[0]?.criterion ?? "Correctness",
        score: correct ? max : 0,
        max,
        feedback: correct ? `Correct — ${explanation}` : `Not quite. ${explanation}`,
      },
    ],
    overall_feedback: correct
      ? "Nailed it. Quick, clean, correct."
      : "Missed this one — review the concept and run it back.",
    model: "nocap/auto",
  };
}
