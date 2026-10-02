import Link from "next/link";
import { supabaseServer } from "@/lib/supabase-server";
import { GlassCard, DifficultyBadge, TypeBadge, btnPrimary, btnGhost } from "@/components/ui";

export default async function HomePage() {
  const sb = await supabaseServer();
  const { data: challenges } = await sb
    .from("nc_challenges")
    .select("id, slug, title, category, difficulty, type, points, time_limit_minutes")
    .eq("is_active", true)
    .order("points", { ascending: false })
    .limit(3);
  const { count: attempts } = await sb.from("nc_attempts").select("id", { count: "exact", head: true });
  const { count: graded } = await sb.from("nc_grades").select("id", { count: "exact", head: true });

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl border border-lime-400/20 bg-gradient-to-b from-lime-400/[0.07] to-transparent px-6 py-16 text-center sm:px-12 sm:py-24">
        <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-lime-400/30 bg-lime-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-lime-300">
          ⚡ Live skill challenges, AI-graded
        </p>
        <h1 className="mx-auto mt-6 max-w-4xl font-display text-5xl font-bold leading-[1.02] tracking-tight text-white sm:text-7xl">
          DON'T CLAIM IT.
          <br />
          <span className="bg-gradient-to-r from-lime-300 via-emerald-300 to-lime-400 bg-clip-text text-transparent">
            PROVE IT LIVE.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">
          NoCap puts you in the arena: timed challenges, real code, real thinking — graded by AI against a
          fully open rubric. No fake certificates. No cap. Just proof.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/challenges" className={btnPrimary + " px-8 py-3.5 text-base"}>
            Enter the arena 🔥
          </Link>
          <Link href="/leaderboard" className={btnGhost + " px-8 py-3.5 text-base"}>
            See the leaderboard
          </Link>
        </div>
        <div className="mx-auto mt-10 flex max-w-lg items-center justify-center gap-8 text-center">
          <div>
            <p className="font-display text-2xl font-bold text-white">{challenges?.length ?? 10}+</p>
            <p className="text-xs uppercase tracking-widest text-slate-500">Challenges</p>
          </div>
          <div className="h-10 w-px bg-white/10" />
          <div>
            <p className="font-display text-2xl font-bold text-white">{attempts ?? 0}</p>
            <p className="text-xs uppercase tracking-widest text-slate-500">Attempts</p>
          </div>
          <div className="h-10 w-px bg-white/10" />
          <div>
            <p className="font-display text-2xl font-bold text-white">{graded ?? 0}</p>
            <p className="text-xs uppercase tracking-widest text-slate-500">Graded</p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mt-16">
        <h2 className="text-center font-display text-3xl font-bold text-white">
          How the arena works
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-400">
          Three steps. Zero room for faking.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            { n: "01", t: "Pick your battle", d: "Choose from coding, quick-fire and deep-thinking challenges across Frontend, Backend and Algorithms — Beginner to Advanced." },
            { n: "02", t: "Beat the clock", d: "Timed sessions with the pressure on. Tab-switching is tracked, so the run stays honest." },
            { n: "03", t: "Get graded, open book", d: "AI grades against a public rubric — every point explained, criterion by criterion. Share your scorecard with a QR code." },
          ].map((s) => (
            <GlassCard key={s.n} className="p-6">
              <p className="font-display text-4xl font-bold text-lime-400/30">{s.n}</p>
              <p className="mt-3 font-display text-lg font-bold text-white">{s.t}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.d}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="mt-16">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-display text-2xl font-bold text-white">Hardest battles right now</h2>
          <Link href="/challenges" className="text-sm font-medium text-lime-300 hover:text-lime-200">
            All challenges →
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {(challenges ?? []).map((c) => (
            <Link key={c.id} href={`/challenges/${c.id}`}>
              <GlassCard className="group h-full p-6 transition hover:border-lime-400/30">
                <div className="flex flex-wrap items-center gap-2">
                  <DifficultyBadge difficulty={c.difficulty} />
                  <TypeBadge type={c.type} />
                </div>
                <p className="mt-3 font-display text-lg font-bold text-white group-hover:text-lime-200">{c.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {c.category} · ⏱ {c.time_limit_minutes} min · ⚡ {c.points} pts
                </p>
              </GlassCard>
            </Link>
          ))}
        </div>
      </section>

      {/* MANIFESTO */}
      <section className="mt-16">
        <GlassCard className="border-lime-400/20 px-6 py-12 text-center sm:px-12">
          <p className="mx-auto max-w-2xl font-display text-2xl font-bold leading-snug text-white sm:text-3xl">
            "A certificate says you <span className="text-slate-500 line-through">passed</span>.
            <br />
            A NoCap scorecard says you <span className="text-lime-400">did it</span>."
          </p>
          <Link href="/signup" className={btnPrimary + " mt-8 px-8 py-3.5 text-base"}>
            Claim your handle — it's free
          </Link>
        </GlassCard>
      </section>
    </div>
  );
}
