import { NextResponse } from "next/server";
import { supabaseServer, supabaseAdmin, currentUser } from "./supabase-server";

export async function requireUser() {
  const user = await currentUser();
  if (!user) return { error: NextResponse.json({ error: "Sign in required" }, { status: 401 }) as NextResponse, user: null };
  return { error: null as null, user };
}

/** Fetch an attempt ensuring the caller owns it. */
export async function ownedAttempt(attemptId: string, userId: string) {
  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("nc_attempts")
    .select("*, nc_challenges(*)")
    .eq("id", attemptId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export function publicCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `NC-${s}`;
}

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** The server-component Supabase client for the current request (RLS-enforced). */
export { supabaseServer };
