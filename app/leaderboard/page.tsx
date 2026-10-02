import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-server";
import { GlassCard, SectionTitle, EmptyState } from "@/components/ui";

export default async function LeaderboardPage() {
  // Public board — reads via the service role; only aggregate scores are exposed.
  const admin = supabaseAdmin();

  // Best grade per (user, challenge), then total points per user.
  const { data: attempts } = await admin
    .from("nc_attempts")
    .select("user_id, challenge_id, nc_challenges(points), nc_grades(total_score, max_score)")
    .eq("status", "graded")
    .order("created_at", { ascending: false })
    .limit(500);

  const best = new Map<string, Map<string, { pct: number; points: number }>>();
  for (const a of attempts ?? []) {
    const g = a.nc_grades as unknown as { total_score: number; max_score: number } | null;
    const pts = (a.nc_challenges as unknown as { points: number } | null)?.points ?? 0;
    if (!g || !g.max_score) continue;
    const pct = g.total_score / g.max_score;
    let um = best.get(a.user_id as string);
    if (!um) { um = new Map(); best.set(a.user_id as string, um); }
    const prev = um.get(a.challenge_id as string);
    if (!prev || pct > prev.pct) um.set(a.challenge_id as string, { pct, points: pts });
  }
  const totals = [...best.entries()].map(([uid, m]) => {
    let score = 0;
    let battles = 0;
    for (const v of m.values()) { score += v.pct * v.points; battles++; }
    return { uid, score: Math.round(score), battles };
  }).sort((a, b) => b.score - a.score).slice(0, 50);

  const { data: profiles } = totals.length
    ? await admin.from("nc_profiles").select("id, username, name").in("id", totals.map((t) => t.uid))
    : { data: [] as { id: string; username: string | null; name: string | null }[] };
  const nameOf = (uid: string) => {
    const p = (profiles ?? []).find((x) => x.id === uid);
    return p?.name ?? (p?.username ? `@${p.username}` : "fighter");
  };
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-center font-display text-4xl font-bold text-white">
        LEADER<span className="text-lime-400">BOARD</span> 🏆
      </h1>
      <p className="mt-2 text-center text-sm text-slate-400">
        Ranked by total arena points — best score per challenge counts. No cap, just numbers.
      </p>

      {totals.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="The board is empty"
            hint="No graded runs yet. Be the first legend."
            action={<Link href="/challenges" className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-lime-300 to-emerald-400 px-5 py-2.5 text-sm font-bold text-[#0a1405] transition hover:brightness-110">Enter the arena</Link>}
          />
        </div>
      ) : (
        <GlassCard className="mt-8 divide-y divide-white/5">
          {totals.map((t, i) => (
            <div key={t.uid} className={`flex items-center justify-between px-5 py-4 ${i < 3 ? "bg-lime-400/[0.04]" : ""}`}>
              <div className="flex items-center gap-3">
                <span className="w-8 text-center font-display text-lg font-bold">
                  {i < 3 ? medals[i] : <span className="text-slate-500">#{i + 1}</span>}
                </span>
                <div>
                  <p className="font-display text-sm font-bold text-white">{nameOf(t.uid)}</p>
                  <p className="text-xs text-slate-500">{t.battles} battle{t.battles === 1 ? "" : "s"} conquered</p>
                </div>
              </div>
              <p className="font-display text-lg font-bold text-lime-300">{t.score.toLocaleString()} <span className="text-xs font-normal text-slate-500">pts</span></p>
            </div>
          ))}
        </GlassCard>
      )}

      <div className="mt-8">
        <SectionTitle>How points work</SectionTitle>
        <GlassCard className="p-6 text-sm leading-relaxed text-slate-400">
          Each challenge carries points by difficulty. Your score on a challenge is your percentage × its points —
          and only your <b className="text-white">best run per challenge</b> counts. Grind the hard ones. 🌶️
        </GlassCard>
      </div>
    </div>
  );
}
