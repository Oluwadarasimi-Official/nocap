import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-server";
import { GlassCard, ScoreRing, GradeBar, SectionTitle } from "@/components/ui";

type Ctx = { params: Promise<{ code: string }> };

export default async function PublicResultPage({ params }: Ctx) {
  const { code } = await params;
  // Public scorecard: the unguessable public_code is the capability token,
  // so this page reads via the service role. Only graded attempts are visible.
  const admin = supabaseAdmin();
  const { data: attempt } = await admin
    .from("nc_attempts")
    .select("id, public_code, blur_count, time_taken_seconds, submitted_at, user_id, nc_challenges(title, difficulty, type, category)")
    .eq("public_code", code.toUpperCase())
    .eq("status", "graded")
    .maybeSingle();
  if (!attempt) notFound();
  const { data: grade } = await admin.from("nc_grades").select("*").eq("attempt_id", attempt.id).maybeSingle();
  if (!grade) notFound();
  const { data: prof } = await admin.from("nc_profiles").select("username, name").eq("id", attempt.user_id).maybeSingle();
  const fighter = (prof as { name?: string | null; username?: string | null } | null)?.name
    ?? ((prof as { username?: string | null } | null)?.username ? `@${(prof as { username?: string | null }).username}` : "NoCap fighter");
  const ch = attempt.nc_challenges as unknown as { title: string; difficulty: string; type: string; category: string };
  const timeStr = attempt.time_taken_seconds != null
    ? `${Math.floor(attempt.time_taken_seconds / 60)}m ${attempt.time_taken_seconds % 60}s`
    : "—";

  return (
    <div className="mx-auto max-w-4xl">
      <div className="text-center">
        <p className="font-display text-sm font-bold tracking-[0.3em] text-slate-400">
          NO<span className="text-lime-400">CAP</span> VERIFIED SCORECARD
        </p>
        <p className="mt-2 font-mono text-xs tracking-widest text-lime-400/80">{attempt.public_code}</p>
        <h1 className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl">{ch.title}</h1>
        <p className="mt-2 text-sm text-slate-400">
          conquered by <b className="text-white">{fighter}</b> · {ch.category} · {ch.difficulty} · ⏱ {timeStr}
          {attempt.blur_count > 0 && <span className="text-amber-300"> · ⚠ {attempt.blur_count} tab switch{attempt.blur_count === 1 ? "" : "es"}</span>}
          {attempt.blur_count === 0 && <span className="text-emerald-300"> · clean run, zero tab switches ✓</span>}
        </p>
      </div>

      <GlassCard className="mt-8 p-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-10">
          <ScoreRing value={Number(grade.total_score)} max={Number(grade.max_score)} size={150} />
          <div className="flex-1 text-center sm:text-left">
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{grade.ai_feedback}</p>
            <p className="mt-2 font-mono text-[11px] text-slate-600">graded by {grade.ai_model} · open rubric</p>
          </div>
        </div>
      </GlassCard>

      <div className="mt-8">
        <SectionTitle hint="Every point explained — this is what makes a NoCap score worth trusting.">
          Rubric breakdown
        </SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          {(grade.breakdown as { criterion: string; score: number; max: number; feedback: string }[]).map((b) => (
            <GradeBar key={b.criterion} label={b.criterion} score={b.score} max={b.max} feedback={b.feedback} />
          ))}
        </div>
      </div>

      <GlassCard className="mt-8 p-8 text-center">
        <p className="font-display text-xl font-bold text-white">Think you can beat {Math.round((Number(grade.total_score) / Number(grade.max_score)) * 100)}%?</p>
        <p className="mt-1 text-sm text-slate-400">Step into the arena. No cap.</p>
        <Link
          href="/challenges"
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-lime-300 to-emerald-400 px-8 py-3 text-sm font-bold text-[#0a1405] transition hover:brightness-110"
        >
          Take a challenge 🔥
        </Link>
      </GlassCard>
    </div>
  );
}
