import Link from "next/link";
import { supabaseServer } from "@/lib/supabase-server";
import { GlassCard, DifficultyBadge, TypeBadge, EmptyState } from "@/components/ui";
import { CATEGORIES, DIFFICULTIES } from "@/lib/site";

type SP = { category?: string; difficulty?: string; type?: string };

export default async function ChallengesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const sb = await supabaseServer();
  let q = sb
    .from("nc_challenges")
    .select("id, slug, title, category, difficulty, type, points, time_limit_minutes")
    .eq("is_active", true)
    .order("points", { ascending: false });
  if (sp.category) q = q.eq("category", sp.category);
  if (sp.difficulty) q = q.eq("difficulty", sp.difficulty);
  if (sp.type) q = q.eq("type", sp.type);
  const { data: challenges } = await q;

  const chip = (href: string, label: string, active: boolean) => (
    <Link
      key={href + label}
      href={href}
      className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
        active
          ? "border-lime-400/60 bg-lime-400/15 text-lime-200"
          : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
  const withParam = (k: keyof SP, v: string) => {
    const p = new URLSearchParams();
    if (sp.category && k !== "category") p.set("category", sp.category);
    if (sp.difficulty && k !== "difficulty") p.set("difficulty", sp.difficulty);
    if (sp.type && k !== "type") p.set("type", sp.type);
    if ((sp[k] ?? "") !== v) p.set(k, v);
    const s = p.toString();
    return `/challenges${s ? `?${s}` : ""}`;
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-white">
        The challenge bank <span className="text-lime-400">⚔️</span>
      </h1>
      <p className="mt-1 text-sm text-slate-400">Pick your battle. Every one is timed and graded live.</p>

      <div className="mt-6 space-y-3">
        <div className="flex flex-wrap gap-2">
          {chip("/challenges", "All categories", !sp.category)}
          {CATEGORIES.map((c) => chip(withParam("category", c), c, sp.category === c))}
        </div>
        <div className="flex flex-wrap gap-2">
          {chip(withParam("difficulty", ""), "Any difficulty", !sp.difficulty)}
          {DIFFICULTIES.map((d) => chip(withParam("difficulty", d), d, sp.difficulty === d))}
        </div>
        <div className="flex flex-wrap gap-2">
          {chip(withParam("type", ""), "Any format", !sp.type)}
          {chip(withParam("type", "code"), "⌨ Code it", sp.type === "code")}
          {chip(withParam("type", "mcq"), "⚡ Quick fire", sp.type === "mcq")}
          {chip(withParam("type", "open"), "🧠 Think deep", sp.type === "open")}
        </div>
      </div>

      {(challenges ?? []).length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No battles match" hint="Loosen the filters and try again." />
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {challenges!.map((c) => (
            <Link key={c.id} href={`/challenges/${c.id}`}>
              <GlassCard className="group flex h-full flex-col p-6 transition hover:border-lime-400/30">
                <div className="flex flex-wrap items-center gap-2">
                  <DifficultyBadge difficulty={c.difficulty} />
                  <TypeBadge type={c.type} />
                </div>
                <p className="mt-3 font-display text-lg font-bold text-white group-hover:text-lime-200">{c.title}</p>
                <p className="mt-1 text-xs text-slate-500">{c.category}</p>
                <div className="mt-auto flex items-center justify-between pt-4 text-xs text-slate-400">
                  <span>⏱ {c.time_limit_minutes} min</span>
                  <span className="font-bold text-lime-300">⚡ {c.points} pts</span>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
