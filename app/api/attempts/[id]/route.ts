import { requireUser, ownedAttempt, json, bad } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabase-server";
import { gradeWithAI, gradeMcq, type GradeResult, type RubricCriterion } from "@/lib/grading";

export const maxDuration = 90;

type Ctx = { params: Promise<{ id: string }> };

// GET /api/attempts/[id] — fetch own attempt with challenge + grade.
export async function GET(_req: Request, { params }: Ctx) {
  const { error, user } = await requireUser();
  if (error) return error;
  const { id } = await params;
  const attempt = await ownedAttempt(id, user!.id);
  if (!attempt) return bad("Attempt not found", 404);
  const admin = supabaseAdmin();
  const { data: grade } = await admin.from("nc_grades").select("*").eq("attempt_id", id).maybeSingle();
  return json({ attempt, grade });
}

function asRubric(raw: unknown): RubricCriterion[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((r) => r && typeof r.criterion === "string")
    .map((r) => ({
      criterion: r.criterion as string,
      max: Number(r.max) || 0,
      description: typeof r.description === "string" ? (r.description as string) : "",
    }));
}

async function persistGrade(attemptId: string, grade: GradeResult) {
  const admin = supabaseAdmin();
  const { error } = await admin.from("nc_grades").insert({
    attempt_id: attemptId,
    total_score: grade.total,
    max_score: grade.max,
    breakdown: grade.breakdown,
    ai_model: grade.model,
    ai_feedback: grade.overall_feedback,
  });
  if (error) throw error;
  await admin.from("nc_attempts").update({ status: "graded" }).eq("id", attemptId);
}

// POST /api/attempts/[id] — submit answers; grades immediately (MCQ auto, else AI).
export async function POST(req: Request, { params }: Ctx) {
  const { error, user } = await requireUser();
  if (error) return error;
  const { id } = await params;
  const attempt = await ownedAttempt(id, user!.id);
  if (!attempt) return bad("Attempt not found", 404);
  if (attempt.status !== "in_progress") return bad("Attempt already submitted", 409);

  const body = (await req.json().catch(() => ({}))) as {
    code_submission?: string | null;
    mcq_answer?: string | null;
    open_answer?: string | null;
    blur_count?: number;
    time_taken_seconds?: number;
  };
  const challenge = attempt.nc_challenges as {
    type: string;
    title: string;
    category: string;
    difficulty: string;
    prompt: string;
    correct_option: string | null;
    rubric: unknown;
  };
  const submission =
    challenge.type === "code"
      ? (body.code_submission ?? "")
      : challenge.type === "mcq"
        ? (body.mcq_answer ?? "")
        : (body.open_answer ?? "");
  if (!submission.trim()) return bad("Empty submission — write something first");

  const admin = supabaseAdmin();
  await admin
    .from("nc_attempts")
    .update({
      code_submission: challenge.type === "code" ? submission : null,
      mcq_answer: challenge.type === "mcq" ? submission : null,
      open_answer: challenge.type === "open" ? submission : null,
      blur_count: Math.max(0, Number(body.blur_count) || 0),
      time_taken_seconds: body.time_taken_seconds ?? null,
      status: "submitted",
      submitted_at: new Date().toISOString(),
    })
    .eq("id", id);

  const rubric = asRubric(challenge.rubric);
  try {
    const grade: GradeResult =
      challenge.type === "mcq"
        ? gradeMcq(challenge.correct_option, submission, rubric)
        : await gradeWithAI({
            title: challenge.title,
            category: challenge.category,
            difficulty: challenge.difficulty,
            type: challenge.type,
            prompt: challenge.prompt,
            rubric,
            submission,
          });
    await persistGrade(id, grade);
    return json({ graded: true, total: grade.total, max: grade.max });
  } catch (e) {
    // AI unavailable — keep the submission, surface the honest state.
    return json(
      { graded: false, ai_unavailable: true, message: e instanceof Error ? e.message : "AI grading unavailable" },
      202
    );
  }
}
