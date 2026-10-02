import { redirect } from "next/navigation";
import Link from "next/link";
import { currentUser } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { GlassCard, SectionTitle, EmptyState, ScoreRing, btnPrimary } from "@/components/ui";

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const admin = supabaseAdmin();
  const { data: attempts } = await admin
    .from("nc_attempts")
    .select("id, public_code, status, blur_count, time_taken_seconds, submitted_at, created_at, nc_challenges(id, title, difficulty, type, category, points), nc_grades(total_score, max_score)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  const { data: prof } = await admin.from("nc_profiles").select("username, name").eq("id", user.id).maybeSingle();
  const fighter = (prof as { name?: string | null; username?: string | null } | null)?.name
    ?? (prof as { username?: string | null } | null)?.username ?? "fighter";

  const graded = (attempts ?? []).filter((a) => a.status === "graded");
  const bestByChallenge = new Map<string, number>();
  let totalPts = 0;
  for (const a of graded) {
    const g = a.nc_grades as unknown as { total_score: number; max_score: number } | null;
    const ch = a.nc_challenges as unknown as { id: string; points: number } | null;
    if (!g || !g.max_score || !ch) continue;
    const pct = g.total_score / g.max_score;
    const prev = bestByChallenge.get(ch.id) ?? 0;
    if (pct > prev) bestByChallenge.set(ch.id, pct);
  }
  for (const [cid, pct] of bestByChallenge) {
    const a = graded.find((x) => (x.nc_challenges as unknown as { id: string } | null)?.id === cid);
    const pts = (a?.nc_challenges as unknown as { points: number } | null)?.points ?? 0;
    totalPts += Math.round(pct * pts);
  }
  const avg = graded.length
    ? Math.round((graded.reduce((s, a) => {
        const g = a.nc_grades as unknown as { total_score: number; max_score: number } | null;
        return s + (g && g.max_score ? g.total_score / g.max_score : 0);
      }, 0) / graded.length) * 100)
    : 0;

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-white">
        Yo, {fighter} <span className="text-lime-400">👊</span>
      </h1>
      <p className="mt-1 text-sm text-slate-400">Your arena record. Every run makes the legend bigger.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <GlassCard className="p-6 text-center">
          <p className="font-display text-3xl font-bold text-lime-300">{totalPts.toLocaleString()}</p>
          <p className="mt-1 text-xs uppercase tracking-widest text-slate-500">Arena points</p>
        </GlassCard>
        <GlassCard className="p-6 text-center">
          <p className="font-display text-3xl font-bold text-white">{bestByChallenge.size}</p>
          <p className="mt-1 text-xs uppercase tracking-widest text-slate-500">Challenges conquered</p>
        </GlassCard>
        <GlassCard className="p-6 text-center">
          <p className="font-display text-3xl font-bold text-white">{graded.length ? `${avg}%` : "—"}</p>
          <p className="mt-1 text-xs uppercase tracking-widest text-slate-500">Average score</p>
        </GlassCard>
      </div>

      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <SectionTitle>Run history</SectionTitle>
          <Link href="/challenges" className={btnPrimary}>New battle ⚔️</Link>
        </div>
        {(attempts ?? []).length === 0 ? (
          <EmptyState
            title="No battles yet"
            hint="Your history starts with the first run. Pick a challenge and show the world."
            action={<Link href="/challenges" className={btnPrimary}>Browse challenges</Link>}
          />
        ) : (
          <div className="grid gap-3">
            {attempts!.map((a) => {
              const ch = a.nc_challenges as unknown as { id: string; title: string; difficulty: string; type: string } | null;
              const g = a.nc_grades as unknown as { total_score: number; max_score: number } | null;
              const pct = g && g.max_score ? Math.round((g.total_score / g.max_score) * 100) : null;
              const href = a.status === "in_progress" ? `/attempt/${a.id}` : `/results/${a.id}`;
              return (
                <Link key={a.id} href={href}>
                  <GlassCard className="flex items-center justify-between gap-3 px-5 py-4 transition hover:border-lime-400/30">
                    <div className="min-w-0">
                      <p className="truncate font-display text-sm font-bold text-white">{ch?.title ?? "Challenge"}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-slate-500">
                        {a.public_code} · {new Date(a.created_at).toLocaleDateString()}
                        {a.status === "in_progress" && <span className="ml-2 text-amber-300">● in progress — resume</span>}
                        {a.status === "submitted" && <span className="ml-2 text-amber-300">● awaiting AI grading</span>}
                      </p>
                    </div>
                    {pct !== null ? (
                      <ScoreRing value={pct} max={100} size={64} />
                    ) : (
                      <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-wider text-slate-500">
                        {a.status.replace("_", " ")}
                      </span>
                    )}
                  </GlassCard>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
