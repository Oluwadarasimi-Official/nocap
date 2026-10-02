import { requireUser, json, bad, publicCode } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabase-server";

// POST /api/attempts — start a new attempt on a challenge.
export async function POST(req: Request) {
  const { error, user } = await requireUser();
  if (error) return error;
  const body = (await req.json().catch(() => ({}))) as { challenge_id?: string };
  if (!body.challenge_id) return bad("challenge_id is required");
  const admin = supabaseAdmin();
  const { data: challenge } = await admin
    .from("nc_challenges")
    .select("id")
    .eq("id", body.challenge_id)
    .eq("is_active", true)
    .maybeSingle();
  if (!challenge) return bad("Challenge not found", 404);
  const { data: attempt, error: insErr } = await admin
    .from("nc_attempts")
    .insert({
      public_code: publicCode(),
      challenge_id: body.challenge_id,
      user_id: user!.id,
      status: "in_progress",
    })
    .select("id")
    .single();
  if (insErr) return bad(insErr.message, 500);
  return json({ attempt_id: attempt.id });
}
