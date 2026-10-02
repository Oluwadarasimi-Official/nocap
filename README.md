# NoCap 🔥 — Prove Your Skills Live

**No cap = no lies.** Timed skill challenges graded by AI against a fully open rubric.
Don't claim it — prove it, live.

Built for the **Devcenter Hacktober 2026** sprint. Next.js 15 + TypeScript + Tailwind + Supabase.

## The loop

1. **Pick your battle** — challenge bank: coding (⌨), quick-fire MCQ (⚡), deep-thinking open design (🧠)
   across Frontend / Backend / Algorithms, Beginner → Advanced.
2. **Beat the clock** — timed sessions, tab-switching tracked for honest runs.
3. **Get graded, open book** — AI grades against a public rubric; every point explained
   criterion-by-criterion. MCQ grades instantly and deterministically.
4. **Flex the scorecard** — shareable result page with QR code (`/r/NC-XXXXXX`).

## AI grading engine (`lib/grading.ts`)

Provider abstraction with automatic failover:

| Priority | Provider | Env vars |
|---|---|---|
| 1 (primary) | Groq (OpenAI-compatible) | `GROQ_API_KEY`, `GROQ_MODEL` (default `llama-3.3-70b-versatile`) |
| 2 (fallback) | Gemini | `GEMINI_API_KEY`, `GEMINI_MODEL` (default `gemini-2.0-flash`) |

If the primary fails or rate-limits, grading automatically fails over to the fallback.
If neither is configured/available, the app runs in an honest degraded mode —
submissions are saved, and the UI says **"AI grading unavailable"** instead of inventing a score.
Scores are never faked. Check `/api/ai/status` for the live provider state.

Get a free Groq key at https://groq.com (very generous free tier, fast inference).

## Supabase

Uses a shared project; all tables are `nc_`-prefixed (`nc_profiles`, `nc_challenges`,
`nc_attempts`, `nc_grades`). Schema + seed challenges live in `supabase/`.

## Run it

```bash
npm install
npm run dev        # or: PORT=8080 npm start  (production, PORT-aware)
```

Required env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`. Optional: `GROQ_API_KEY`, `GEMINI_API_KEY`.
