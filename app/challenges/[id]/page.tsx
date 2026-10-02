import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseServer, supabaseAdmin, currentUser } from "@/lib/supabase-server";
import { GlassCard, DifficultyBadge, TypeBadge, SectionTitle, EmptyState } from "@/components/ui";
import StartAttemptButton from "@/components/StartAttemptButton";

type Ctx = { params: Promise<{ id: string }> };

export default async function ChallengeDetailPage({ params }: Ctx) {
  const { id } = await params;
  const sb = await supabaseServer();
  const user = await currentUser();
  const { data: challenge } = await sb
    .from("nc_challenges")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();
  if (!challenge) notFound();
  const rubric = (challenge.rubric ?? []) as { criterion: string; max: number; description: string }[];

  let best: { total_score: number } | null = null;
  if (user) {
    const { data } = await sb
      .from("nc_attempts")
      .select("id, nc_grades(total_score)")
      .eq("challenge_id", id)
      .eq("user_id", user.id)
      .eq("status", "graded")
      .order("created_at", { ascending: false })
      .limit(20);
    const scores = (data ?? [])
      .map((a) => (a.nc_grades as unknown as { total_score: number } | null)?.total_score)
      .filter((s): s is number => typeof s === "number");
    if (scores.length) best = { total_score: Math.max(...scores) };
  }

  // Top scores on this challenge (public leaderboard slice)
  const admin = supabaseAdmin();
  const { data: topAttempts } = await admin
    .from("nc_attempts")
    .select("id, user_id, nc_grades(total_score, max_score)")
    .eq("challenge_id", id)
    .eq("status", "graded")
    .order("created_at", { ascending: false })
    .limit(60);
  const scored = (topAttempts ?? [])
    .map((a) => ({
      user_id: a.user_id as string,
      score: (a.nc_grades as unknown as { total_score: number; max_score: number } | null)?.total_score ?? null,
      max: (a.nc_grades as unknown as { total_score: number; max_score: number } | null)?.max_score ?? 100,
    }))
    .filter((r) => r.score !== null);
  const bestByUser = new Map<string, { score: number; max: number }>();
  for (const r of scored) {
    const prev = bestByUser.get(r.user_id);
    if (!prev || r.score! > prev.score) bestByUser.set(r.user_id, { score: r.score!, max: r.max });
  }
  const top = [...bestByUser.entries()]
    .sort((a, b) => b[1].score / b[1].max - a[1].score / a[1].max)
    .slice(0, 5);
  const { data: topProfiles } = top.length
    ? await admin.from("nc_profiles").select("id, username, name").in("id", top.map(([u]) => u))
    : { data: [] as { id: string; username: string | null; name: string | null }[] };
  const nameOf = (uid: string) => {
    const p = (topProfiles ?? []).find((x) => x.id === uid);
    return p?.name ?? (p?.username ? `@${p.username}` : "fighter");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Link href="/challenges" className="text-sm text-slate-400 hover:text-lime-300">← All challenges</Link>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <DifficultyBadge difficulty={challenge.difficulty} />
          <TypeBadge type={challenge.type} />
          <span className="text-xs text-slate-500">{challenge.category}</span>
        </div>
        <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">{challenge.title}</h1>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-400">
          <span>⏱ {challenge.time_limit_minutes} minutes</span>
          <span className="font-bold text-lime-300">⚡ {challenge.points} pts</span>
          {best && <span className="text-slate-300">Your best: <b className="text-lime-300">{best.total_score}%</b></span>}
        </div>

        <GlassCard className="mt-6 p-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">The brief</p>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{challenge.prompt}</div>
        </GlassCard>

        <div className="mt-6">
          <SectionTitle hint="This is exactly what the AI grades you against. No surprises, no black box.">
            The open rubric
          </SectionTitle>
          <div className="grid gap-3 sm:grid-cols-3">
            {rubric.map((r) => (
              <GlassCard key={r.criterion} className="p-5">
                <p className="font-display text-sm font-bold text-white">{r.criterion}</p>
                <p className="mt-1 font-mono text-xs text-lime-300">max {r.max} pts</p>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">{r.description}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>

      <div>
        <GlassCard className="sticky top-24 border-lime-400/20 p-6 text-center">
          <p className="font-display text-lg font-bold text-white">Ready?</p>
          <p className="mt-1 text-xs text-slate-400">
            The clock starts the moment you enter. Tab-switching is tracked.
          </p>
          <div className="mt-4">
            <StartAttemptButton challengeId={challenge.id} signedIn={!!user} />
          </div>
        </GlassCard>

        <div className="mt-6">
          <SectionTitle>Top fighters</SectionTitle>
          {top.length === 0 ? (
            <EmptyState title="No scores yet" hint="Be the first to conquer this one." />
          ) : (
            <GlassCard className="divide-y divide-white/5">
              {top.map(([uid, s], i) => (
                <div key={uid} className="flex items-center justify-between px-5 py-3">
                  <p className="text-sm text-slate-300">
                    <span className="mr-2 font-mono font-bold text-lime-400">#{i + 1}</span>
                    {nameOf(uid)}
                  </p>
                  <p className="font-mono text-sm font-bold text-white">{Math.round((s.score / s.max) * 100)}%</p>
                </div>
              ))}
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}
