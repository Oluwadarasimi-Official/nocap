import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { currentUser, supabaseAdmin } from "@/lib/supabase-server";
import { qrDataUrl } from "@/lib/site";
import { requestResultUrl } from "@/lib/site-server";
import { GlassCard, ScoreRing, GradeBar, SectionTitle, EmptyState, btnPrimary, btnGhost } from "@/components/ui";
import { CopyLinkButton, RetryGradingButton } from "@/components/result-actions";

type Ctx = { params: Promise<{ id: string }> };

export default async function ResultPage({ params }: Ctx) {
  const { id } = await params;
  const user = await currentUser();
  if (!user) redirect("/login");
  const admin = supabaseAdmin();
  const { data: attempt } = await admin
    .from("nc_attempts")
    .select("id, public_code, status, blur_count, time_taken_seconds, submitted_at, user_id, nc_challenges(id, title, difficulty, type, category, points)")
    .eq("id", id)
    .maybeSingle();
  if (!attempt || attempt.user_id !== user.id) notFound();
  if (attempt.status === "in_progress") redirect(`/attempt/${id}`);

  const ch = attempt.nc_challenges as unknown as { id: string; title: string; difficulty: string; type: string; category: string; points: number };
  const { data: grade } = await admin.from("nc_grades").select("*").eq("attempt_id", id).maybeSingle();
  const { data: prof } = await admin.from("nc_profiles").select("username, name").eq("id", user.id).maybeSingle();
  const fighter = (prof as { name?: string | null; username?: string | null } | null)?.name ?? "NoCap fighter";

  const publicUrl = await requestResultUrl(attempt.public_code);
  const timeStr = attempt.time_taken_seconds != null
    ? `${Math.floor(attempt.time_taken_seconds / 60)}m ${attempt.time_taken_seconds % 60}s`
    : "—";

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/dashboard" className="text-sm text-slate-400 hover:text-lime-300">← Dashboard</Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs tracking-widest text-lime-400/80">{attempt.public_code}</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-white">{ch.title}</h1>
          <p className="mt-1 text-sm text-slate-400">
            {ch.category} · {ch.difficulty} · ⏱ {timeStr}
            {attempt.blur_count > 0 && <span className="ml-2 text-amber-300">· ⚠ {attempt.blur_count} tab switch{attempt.blur_count === 1 ? "" : "es"}</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/challenges/${ch.id}`} className={btnGhost}>Run it back 🔁</Link>
        </div>
      </div>

      {!grade ? (
        <GlassCard className="mt-8 border-amber-400/20 p-8 text-center">
          <p className="font-display text-xl font-bold text-white">⏳ Grading engine unreachable</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
            Your submission is saved safe. The AI grader is currently unavailable — we never fake a score,
            so this stays ungraded until the engine responds.
          </p>
          <div className="mt-5 flex justify-center">
            <RetryGradingButton attemptId={id} />
          </div>
        </GlassCard>
      ) : (
        <>
          <GlassCard className="mt-8 p-8">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-10">
              <ScoreRing value={Number(grade.total_score)} max={Number(grade.max_score)} size={150} />
              <div className="flex-1 text-center sm:text-left">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Verdict</p>
                <p className="mt-2 font-display text-2xl font-bold text-white">
                  {Number(grade.total_score) >= 80 ? "Certified. No cap. 🏆"
                    : Number(grade.total_score) >= 50 ? "Solid — room to level up 💪"
                    : "Tough run. The arena respects the attempt. 🥊"}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">{grade.ai_feedback}</p>
                <p className="mt-2 font-mono text-[11px] text-slate-600">graded by {grade.ai_model}</p>
              </div>
            </div>
          </GlassCard>

          <div className="mt-8">
            <SectionTitle hint="Every point, explained. This is the whole point of NoCap — open grading, no black box.">
              Rubric breakdown
            </SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2">
              {(grade.breakdown as { criterion: string; score: number; max: number; feedback: string }[]).map((b) => (
                <GradeBar key={b.criterion} label={b.criterion} score={b.score} max={b.max} feedback={b.feedback} />
              ))}
            </div>
          </div>

          <GlassCard className="mt-8 p-8">
            <div className="flex flex-col items-center gap-6 sm:flex-row">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={await qrDataUrl(publicUrl)} alt={`QR code for ${attempt.public_code}`} width={150} height={150} className="rounded-xl border border-white/10 bg-white p-2" />
              <div className="flex-1 text-center sm:text-left">
                <p className="font-display text-lg font-bold text-white">Flex the scorecard 📣</p>
                <p className="mt-1 text-sm text-slate-400">
                  Anyone with the link sees your score, the rubric breakdown and the grader's notes — signed {attempt.public_code}, by {fighter}.
                </p>
                <p className="mt-3 break-all font-mono text-xs text-lime-300">{publicUrl}</p>
                <div className="mt-4">
                  <CopyLinkButton url={publicUrl} />
                </div>
              </div>
            </div>
          </GlassCard>
        </>
      )}
    </div>
  );
}
