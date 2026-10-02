"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { btnPrimary } from "./ui";

export default function StartAttemptButton({ challengeId, signedIn }: { challengeId: string; signedIn: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function start() {
    if (!signedIn) {
      router.push("/signup");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challenge_id: challengeId }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error ?? "Could not start attempt");
      router.push(`/attempt/${d.attempt_id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not start attempt");
      setBusy(false);
    }
  }

  return (
    <div>
      <button onClick={start} disabled={busy} className={btnPrimary + " w-full px-8 py-3.5 text-base sm:w-auto"}>
        {busy ? "Entering…" : signedIn ? "Start challenge — beat the clock ⏱" : "Sign up to take the challenge"}
      </button>
      {err && <p className="mt-2 text-sm text-rose-300">{err}</p>}
    </div>
  );
}
