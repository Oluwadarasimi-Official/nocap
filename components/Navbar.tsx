"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useState } from "react";

export default function Navbar({ userEmail, username }: { userEmail: string | null; username: string | null }) {
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const link = (href: string, label: string) => (
    <Link
      key={href}
      href={href}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
        pathname === href ? "bg-lime-400/15 text-lime-300" : "text-slate-400 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
  async function signOut() {
    setBusy(true);
    await supabaseBrowser().auth.signOut();
    window.location.href = "/";
  }
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050914]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="font-display text-xl font-bold tracking-tight text-white">
          NO<span className="text-lime-400">CAP</span>
          <span className="ml-2 hidden font-body text-xs font-normal text-slate-500 sm:inline">no lies. prove it live.</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {link("/challenges", "Challenges")}
          {link("/leaderboard", "Leaderboard")}
          {userEmail && link("/dashboard", "Dashboard")}
        </nav>
        <div className="flex items-center gap-2">
          {userEmail ? (
            <>
              <span className="hidden max-w-[140px] truncate text-xs text-slate-400 sm:block">
                {username ? `@${username}` : userEmail}
              </span>
              <button
                onClick={signOut}
                disabled={busy}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-rose-400/40 hover:text-white disabled:opacity-50"
              >
                {busy ? "…" : "Sign out"}
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white">
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-gradient-to-r from-lime-300 to-emerald-400 px-4 py-1.5 text-sm font-bold text-[#0a1405] transition hover:brightness-110"
              >
                Join
              </Link>
            </>
          )}
        </div>
      </div>
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-white/5 px-4 py-2 md:hidden">
        {link("/challenges", "Challenges")}
        {link("/leaderboard", "Leaderboard")}
        {userEmail && link("/dashboard", "Dashboard")}
      </nav>
    </header>
  );
}
