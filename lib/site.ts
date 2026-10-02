import QRCode from "qrcode";

export function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

export function resultPublicUrl(code: string): string {
  return `${siteUrl()}/r/${code}`;
}

export async function qrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, { margin: 1, width: 240, color: { dark: "#0a1120", light: "#ffffff" } });
}

export const CATEGORIES = ["Frontend", "Backend", "Algorithms"] as const;

export const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"] as const;

export const CHALLENGE_TYPES = ["code", "mcq", "open"] as const;

export const TYPE_LABELS: Record<string, string> = {
  code: "Code it",
  mcq: "Quick fire",
  open: "Think deep",
};

export const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: "bg-emerald-500/15 text-emerald-300",
  Intermediate: "bg-amber-500/15 text-amber-300",
  Advanced: "bg-rose-500/15 text-rose-300",
};
