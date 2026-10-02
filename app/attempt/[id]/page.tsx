import { redirect, notFound } from "next/navigation";
import { currentUser } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-server";
import ChallengeRunner from "@/components/ChallengeRunner";

type Ctx = { params: Promise<{ id: string }> };

export default async function AttemptPage({ params }: Ctx) {
  const { id } = await params;
  const user = await currentUser();
  if (!user) redirect("/login");
  const admin = supabaseAdmin();
  const { data: attempt } = await admin
    .from("nc_attempts")
    .select("id, status, user_id, nc_challenges(id, title, type, prompt, starter_code, options, time_limit_minutes)")
    .eq("id", id)
    .maybeSingle();
  if (!attempt || attempt.user_id !== user.id) notFound();
  if (attempt.status !== "in_progress") redirect(`/results/${id}`);
  const ch = attempt.nc_challenges as unknown as {
    id: string;
    title: string;
    type: string;
    prompt: string;
    starter_code: string | null;
    options: { id: string; text: string }[];
    time_limit_minutes: number;
  };

  return (
    <ChallengeRunner
      attemptId={attempt.id}
      challenge={{
        id: ch.id,
        title: ch.title,
        type: ch.type,
        prompt: ch.prompt,
        starter_code: ch.starter_code,
        options: Array.isArray(ch.options) ? ch.options : [],
        time_limit_minutes: ch.time_limit_minutes,
      }}
    />
  );
}
