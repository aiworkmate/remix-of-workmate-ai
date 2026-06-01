## Reality check

You asked for "do all" on 8 priorities across two codebases. I want to be honest: shipping every priority deeply in one turn would mean shallow work everywhere and a broken app. So this plan does the highest-leverage cut of V4 in one focused pass, and queues the rest as named follow-up passes you can trigger one-by-one.

## Decision: one canonical app

`packages/gpt-module/` already contains the real WorkMate app — full auth, RLS-backed Supabase schema (organizations, workspaces, conversations, messages, memories, uploads, response_outcomes, routing_stats), chat router, memory, uploads, workflows, medical, admin, analytics, audit routes. The root `src/routes/index.tsx` chat I built earlier is a toy compared to that.

**V4 = gpt-module is the app.** The root will redirect to it. No merge refactor — that would be a week of churn for zero user value.

## V4 Pass 1 (this turn) — backend intelligence + reliability

Scope kept tight on purpose. Files touched live under `packages/gpt-module/src/lib/chat/` and `src/routes/api/chat.ts`.

1. **Router upgrade** (`router.server.ts`)
   - Structured intent classification: `general | research | live | file_grounded | memory_recall | task_capture | medical`
   - Live-data triggers: time/date words, "today/now/latest/price/news/weather/score/release", proper nouns + recency, explicit URLs
   - Returns `{ intent, needsWeb, needsMemory, needsFiles, confidence, reason }`

2. **Live data: Tavily + SerpAPI fallback** (`web-search.server.ts`)
   - Tavily primary (already keyed). On 4xx/5xx/timeout → SerpAPI fallback (key present).
   - 8s timeout, 2 retries with jitter, results normalized to `{title, url, snippet, published_at}`.
   - Cached in-memory per query for 5 min.

3. **Memory intelligence** (`memory.server.ts`)
   - Typed memory kinds: `goal | project | task | preference | decision | fact`
   - Write path: post-turn extractor (small model, tool-calling) saves only high-confidence items; dedupe by cosine similarity on existing user memories.
   - Read path: hybrid retrieval (kind filter + embedding + recency + pin) → top 6, capped tokens.

4. **Long-conversation stability** (`model.server.ts`)
   - Rolling window: keep last N turns verbatim, summarize older turns into a compact "conversation brief" stored on `conversations.summary`.
   - Hard token budget per request with deterministic truncation order: system → brief → memory → tools → recent turns → current message.

5. **Anti-hallucination + recovery** (`safe.server.ts`)
   - When `needsWeb` and web tools all fail: model is told explicitly "live data unavailable" and instructed not to invent current facts.
   - All tool failures recorded to `response_outcomes` with `was_fallback=true`.
   - Streaming endpoint catches mid-stream errors and emits a clean SSE `error` event instead of dying silently.

6. **Observability**
   - Every turn writes `response_outcomes` (intent, live_used, memory_hits, latency_ms, chars, was_fallback) and updates `routing_stats`. Already-existing tables, currently underused.

## V4 Pass 1 (this turn) — UI

1. **Mobile-first chat shell** (`routes/app/chat.tsx`, `components/chat/*`)
   - Bottom-anchored composer with safe-area padding, swipe-to-open conversation drawer, sticky message header, on-scroll auto-stick.
   - Streaming token rendering already in place; add typing indicator + cancel button + retry-last-turn button.

2. **Desktop workspace polish** (`components/app-sidebar.tsx`, `app-topbar.tsx`)
   - 3-pane layout on ≥lg: conversations | chat | context panel (memory hits, sources, files used for this turn).
   - Command palette (⌘K) for: new chat, switch workspace, jump to memory, jump to uploads.

3. **Root → app redirect**
   - `src/routes/index.tsx` becomes a thin redirect to the gpt-module app entry, so the preview URL lands on the real product.

## Explicitly NOT in this pass (queued for follow-ups)

I will not pretend to ship these in one turn. Ask for any of them next and I'll do a focused pass:

- **Pass 2 — Files & docs intelligence:** OCR pipeline, image understanding, chunked embeddings, grounded citations in answers.
- **Pass 3 — Dashboards & analytics:** real charts on `response_outcomes` + `routing_stats`, per-workspace usage, cost estimation.
- **Pass 4 — Projects & tasks surfaces:** UI for the goal/project/task memory kinds (kanban + list).
- **Pass 5 — Stress testing & load harness:** scripted concurrent-user simulation, failure-injection, p95 latency tracking.
- **Pass 6 — Security hardening review:** RLS audit, rate limiting on `/api/chat`, prompt-injection defenses on web/tool results.

## Technical notes

- Lovable AI Gateway stays the model provider. Default chat model: `google/gemini-3-flash-preview`. Heavy reasoning paths use `openai/gpt-5.2`. Extraction/classification uses `google/gemini-2.5-flash-lite` with tool-calling for structured output.
- Tavily + SerpAPI secrets already configured.
- All new server code lives in `*.server.ts` (server-only) or `*.functions.ts` (callable from client), per TanStack import-graph rules.
- No DB migrations needed for Pass 1 — schema already supports everything above.
- No new dependencies.

## What you'll see after this pass

- Open the preview → land directly in the real WorkMate app (login if needed).
- Chat feels stable on phone, premium on desktop, with visible "Sources" / "Memory used" context.
- "What's the weather in Paris today?" actually hits Tavily; if Tavily is down, SerpAPI; if both down, the assistant says so instead of making it up.
- Long chats don't blow the context window — older turns get summarized into a brief.
- Every turn is logged for the analytics pass.

Approve and I'll execute Pass 1. Reject and tell me which single priority to start with instead — I'd rather do one priority excellently than eight badly.