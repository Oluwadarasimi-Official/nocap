import { requireUser, ownedAttempt, json, bad } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabase-server";
import { gradeWithAI, type RubricCriterion } from "@/lib/grading";

export const maxDuration = 90;

type Ctx = { params: Promise<{ id: string }> };

// POST /api/attempts/[id]/grade — retry AI grading for a submitted (ungraded) attempt.
export async function POST(_req: Request, { params }: Ctx) {
  const { error, user } = await requireUser();
  if (error) return error;
  const { id } = await params;
  const attempt = await ownedAttempt(id, user!.id);
  if (!attempt) return bad("Attempt not found", 404);
  if (attempt.status === "graded") return json({ graded: true, already: true });
  if (attempt.status !== "submitted") return bad("Attempt is not awaiting grading", 409);

  const challenge = attempt.nc_challenges as {
    type: string;
    title: string;
    category: string;
    difficulty: string;
    prompt: string;
    rubric: unknown;
  };
  if (challenge.type === "mcq") return bad("MCQ attempts grade automatically on submit", 400);
  const submission = (attempt.code_submission ?? attempt.open_answer ?? "").trim();
  if (!submission) return bad("No submission to grade", 400);

  const rubric: RubricCriterion[] = Array.isArray(challenge.rubric)
    ? (challenge.rubric as RubricCriterion[])
    : [];
  try {
    const grade = await gradeWithAI({
      title: challenge.title,
      category: challenge.category,
      difficulty: challenge.difficulty,
      type: challenge.type,
      prompt: challenge.prompt,
      rubric,
      submission,
    });
    const admin = supabaseAdmin();
    const { error: insErr } = await admin.from("nc_grades").insert({
      attempt_id: id,
      total_score: grade.total,
      max_score: grade.max,
      breakdown: grade.breakdown,
      ai_model: grade.model,
      ai_feedback: grade.overall_feedback,
    });
    if (insErr) throw insErr;
    await admin.from("nc_attempts").update({ status: "graded" }).eq("id", id);
    return json({ graded: true, total: grade.total, max: grade.max });
  } catch (e) {
    return json(
      { graded: false, ai_unavailable: true, message: e instanceof Error ? e.message : "AI grading unavailable" },
      202
    );
  }
}
