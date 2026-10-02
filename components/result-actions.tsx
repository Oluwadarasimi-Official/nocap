"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { btnGhost, btnPrimary } from "./ui";

export function CopyLinkButton({ url, label = "Copy public link" }: { url: string; label?: string }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setDone(true);
    setTimeout(() => setDone(false), 2000);
  }
  return (
    <button onClick={copy} className={btnGhost}>
      {done ? "✓ Copied!" : label}
    </button>
  );
}

export function RetryGradingButton({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function retry() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/attempts/${attemptId}/grade`, { method: "POST" });
      const d = await res.json().catch(() => ({}));
      if (d.graded) {
        router.refresh();
        return;
      }
      throw new Error(d.message ?? "AI grading still unavailable");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Retry failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button onClick={retry} disabled={busy} className={btnPrimary}>
        {busy ? "Grading…" : "🔁 Retry AI grading"}
      </button>
      {err && <p className="mt-2 text-sm text-amber-300">{err}</p>}
    </div>
  );
}
