import { json } from "@/lib/api";
import { gradingStatus } from "@/lib/grading";

export async function GET() {
  const s = gradingStatus();
  return json({ enabled: s.enabled, primary: s.primary, fallback: s.fallback });
}
