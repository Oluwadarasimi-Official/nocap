"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { btnPrimary, btnGhost, GlassCard } from "./ui";

interface ChallengeData {
  id: string;
  title: string;
  type: string;
  prompt: string;
  starter_code: string | null;
  options: { id: string; text: string }[];
  time_limit_minutes: number;
}

export default function ChallengeRunner({
  attemptId,
  challenge,
}: {
  attemptId: string;
  challenge: ChallengeData;
}) {
  const router = useRouter();
  const totalSeconds = challenge.time_limit_minutes * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [code, setCode] = useState(challenge.starter_code ?? "");
  const [mcqAnswer, setMcqAnswer] = useState<string | null>(null);
  const [openAnswer, setOpenAnswer] = useState("");
  const [blurs, setBlurs] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedAt = useRef(Date.now());
  const submittedRef = useRef(false);

  useEffect(() => {
    const onBlur = () => setBlurs((b) => b + 1);
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, []);

  async function submit(auto = false) {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const timeTaken = Math.min(totalSeconds, Math.round((Date.now() - startedAt.current) / 1000));
      const res = await fetch(`/api/attempts/${attemptId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code_submission: challenge.type === "code" ? code : null,
          mcq_answer: challenge.type === "mcq" ? mcqAnswer : null,
          open_answer: challenge.type === "open" ? openAnswer : null,
          blur_count: blurs,
          time_taken_seconds: timeTaken,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error ?? "Submission failed");
      router.push(`/results/${attemptId}`);
    } catch (e) {
      submittedRef.current = false;
      setSubmitting(false);
      setError(e instanceof Error ? e.message : "Submission failed");
      if (auto) {
        // auto-submit retry once more after a beat
        setTimeout(() => {
          if (!submittedRef.current) submit(true);
        }, 3000);
      }
    }
  }

  useEffect(() => {
    if (secondsLeft <= 0) {
      submit(true);
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  const mm = Math.floor(secondsLeft / 60);
  const ss = secondsLeft % 60;
  const urgent = secondsLeft < 120;
  const canSubmit =
    challenge.type === "mcq" ? !!mcqAnswer : (challenge.type === "code" ? code.trim() : openAnswer.trim()).length > 0;

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <GlassCard className="sticky top-24 p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest text-lime-400">Challenge</p>
            <div
              className={`rounded-lg px-3 py-1 font-mono text-sm font-bold ${urgent ? "bg-rose-500/15 text-rose-300" : "bg-white/5 text-slate-200"}`}
            >
              {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
            </div>
          </div>
          <h1 className="mt-2 font-display text-2xl font-bold text-white">{challenge.title}</h1>
          <div className="mt-4 max-w-none whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
            {challenge.prompt}
          </div>
          {blurs > 0 && (
            <p className="mt-4 rounded-lg border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
              ⚠ Tab switches detected: {blurs} — staying focused keeps your run clean.
            </p>
          )}
        </GlassCard>
      </div>
      <div className="lg:col-span-3">
        <GlassCard className="p-6">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">Your answer</p>
          {challenge.type === "code" && (
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              className="h-[420px] w-full resize-y rounded-xl border border-white/10 bg-black/50 p-4 font-mono text-sm leading-relaxed text-lime-100 outline-none focus:border-lime-400/50"
            />
          )}
          {challenge.type === "mcq" && (
            <div className="space-y-3">
              {challenge.options.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setMcqAnswer(o.id)}
                  className={`w-full rounded-xl border p-4 text-left text-sm transition ${
                    mcqAnswer === o.id
                      ? "border-lime-400/60 bg-lime-400/10 text-white"
                      : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25"
                  }`}
                >
                  <span className="mr-2 font-mono font-bold text-lime-400">{o.id.toUpperCase()}</span>
                  {o.text}
                </button>
              ))}
            </div>
          )}
          {challenge.type === "open" && (
            <textarea
              value={openAnswer}
              onChange={(e) => setOpenAnswer(e.target.value)}
              placeholder="Think it through, then write your answer…"
              spellCheck={false}
              className="h-[420px] w-full resize-y rounded-xl border border-white/10 bg-black/50 p-4 text-sm leading-relaxed text-slate-100 outline-none focus:border-lime-400/50"
            />
          )}
          {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button onClick={() => submit(false)} disabled={submitting || !canSubmit} className={btnPrimary}>
              {submitting ? "Submitting…" : "Submit — no cap 🎯"}
            </button>
            <button onClick={() => router.push(`/challenges/${challenge.id}`)} className={btnGhost}>
              Forfeit
            </button>
            <p className="w-full text-xs text-slate-500">
              Submitting locks your answer and sends it for grading. The clock auto-submits at zero.
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
