import type { ReactNode } from "react";

// NoCap design system — dark luxury, high voltage lime energy.

export function GlassCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-[0_8px_40px_-12px_rgba(0,0,0,0.6)] ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="mb-4">
      <h2 className="font-display text-lg font-semibold text-white">{children}</h2>
      {hint && <p className="mt-1 text-sm text-slate-400">{hint}</p>}
    </div>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <GlassCard className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-lime-400/20 bg-lime-400/10">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a3e635" strokeWidth="1.8">
          <path d="M13 2L4.5 13.5H11L10 22l8.5-11.5H12L13 2z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <p className="font-display text-base font-semibold text-white">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-sm text-slate-400">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </GlassCard>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-200">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "w-full rounded-xl border border-white/10 bg-[#0a1120]/80 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-lime-400/60 focus:ring-2 focus:ring-lime-400/20";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-lime-300 to-emerald-400 px-5 py-2.5 text-sm font-bold text-[#0a1405] transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";

export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-5 py-2.5 text-sm font-medium text-slate-200 transition hover:border-lime-400/40 hover:text-white active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";

export const btnDanger =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-5 py-2.5 text-sm font-medium text-rose-300 transition hover:bg-rose-500/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";

export function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const styles: Record<string, string> = {
    Beginner: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
    Intermediate: "bg-amber-500/15 text-amber-300 border-amber-400/30",
    Advanced: "bg-rose-500/15 text-rose-300 border-rose-400/30",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${styles[difficulty] ?? styles.Beginner}`}
    >
      {difficulty}
    </span>
  );
}

export function TypeBadge({ type }: { type: string }) {
  const labels: Record<string, string> = { code: "⌨ Code it", mcq: "⚡ Quick fire", open: "🧠 Think deep" };
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] font-semibold text-slate-300">
      {labels[type] ?? type}
    </span>
  );
}

export function ScoreRing({ value, max, size = 120 }: { value: number; max: number; size?: number }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  const color = pct >= 80 ? "#a3e635" : pct >= 50 ? "#fbbf24" : "#fb7185";
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * pct) / 100}
        />
      </svg>
      <div className="absolute text-center">
        <p className="font-display text-2xl font-bold text-white">{Math.round(pct)}<span className="text-sm text-slate-400">%</span></p>
        <p className="text-[10px] uppercase tracking-widest text-slate-500">{value}/{max}</p>
      </div>
    </div>
  );
}

export function GradeBar({ label, score, max, feedback }: { label: string; score: number; max: number; feedback: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (score / max) * 100)) : 0;
  const color = pct >= 80 ? "bg-lime-400" : pct >= 50 ? "bg-amber-400" : "bg-rose-400";
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="font-mono text-xs text-slate-400">{score}<span className="text-slate-600">/{max}</span></p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-xs leading-relaxed text-slate-400">{feedback}</p>
    </div>
  );
}
