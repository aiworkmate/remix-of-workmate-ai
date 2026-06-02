import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  MessageSquare, Brain, FileText, Workflow, ArrowUpRight,
  Sparkles, Activity, ShieldCheck, Zap, Cpu,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { StatusPill } from "@/components/page-primitives";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Overview · AI WorkMate" }] }),
  component: OverviewPage,
});

function OverviewPage() {
  const { user, profile } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["overview", user?.id],
    queryFn: async () => {
      const [c, m, u] = await Promise.all([
        supabase.from("conversations").select("id", { count: "exact", head: true }),
        supabase.from("memories").select("id", { count: "exact", head: true }),
        supabase.from("uploads").select("id", { count: "exact", head: true }),
      ]);
      return {
        conversations: c.count ?? 0,
        memories: m.count ?? 0,
        uploads: u.count ?? 0,
      };
    },
    enabled: !!user,
  });

  const tiles = [
    { label: "Conversations", value: stats?.conversations ?? 0, icon: MessageSquare, to: "/app/chat", trend: "+12% this week" },
    { label: "Memories", value: stats?.memories ?? 0, icon: Brain, to: "/app/memory", trend: "3 pinned" },
    { label: "Documents", value: stats?.uploads ?? 0, icon: FileText, to: "/app/uploads", trend: "Indexed" },
    { label: "Workflows", value: 4, icon: Workflow, to: "/app/workflows", trend: "2 ran today" },
  ];

  const firstName = profile?.display_name?.split(" ")[0] ?? "operator";

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="mx-auto max-w-7xl space-y-4 p-4 md:p-6">
        {/* Hero */}
        <section className="iris-border relative overflow-hidden rounded-3xl bg-gradient-surface p-6 shadow-elevated md:p-10">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gradient-iris opacity-30 blur-3xl" />
          <div className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-gradient-iris opacity-20 blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/40 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground backdrop-blur">
              <Sparkles className="h-3 w-3 text-primary-glow" /> Operator console
            </div>
            <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight md:text-5xl">
              Welcome back,{" "}
              <span className="iris-text">{firstName}</span>.
            </h1>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
              Your secure AI operating system at a glance. Conversations, memory, retrieval, and automations
              — orchestrated under one iridescent roof.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                to="/app/chat"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-iris px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-glow transition hover:scale-[1.02]"
              >
                <MessageSquare className="h-4 w-4" /> Start a chat
              </Link>
              <Link
                to="/app/uploads"
                className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-surface/60 px-4 py-2.5 text-sm backdrop-blur transition hover:bg-accent"
              >
                <FileText className="h-4 w-4" /> Add document
              </Link>
              <StatusPill tone="success">All systems nominal</StatusPill>
            </div>
          </div>
        </section>

        {/* Bento grid */}
        <section className="grid grid-cols-2 gap-4 md:grid-cols-6 md:auto-rows-[minmax(140px,auto)]">
          {tiles.map((c, i) => (
            <Link
              key={c.label}
              to={c.to}
              className={`group iris-border relative overflow-hidden rounded-2xl bg-card/70 p-5 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-glow ${
                i === 0 ? "md:col-span-3 md:row-span-2" : i === 1 ? "md:col-span-3" : "md:col-span-2"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-iris-soft text-primary-glow shadow-iris">
                  <c.icon className="h-4 w-4" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary-glow" />
              </div>
              <div className="mt-6 font-display text-4xl font-semibold tabular-nums md:text-5xl">
                {c.value}
              </div>
              <div className="mt-1 text-sm font-medium">{c.label}</div>
              <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
                {c.trend}
              </div>
              {i === 0 && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-primary/10 to-transparent" />
              )}
            </Link>
          ))}

          {/* Security */}
          <div className="iris-border col-span-2 rounded-2xl bg-card/70 p-5 backdrop-blur md:col-span-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-success" />
              <span className="font-display text-sm font-semibold">Security posture</span>
            </div>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-center justify-between"><span className="text-muted-foreground">Row-level security</span><StatusPill tone="success">Enforced</StatusPill></li>
              <li className="flex items-center justify-between"><span className="text-muted-foreground">Audit log streaming</span><StatusPill tone="success">Live</StatusPill></li>
              <li className="flex items-center justify-between"><span className="text-muted-foreground">Tenant isolation</span><StatusPill tone="success">Per-org</StatusPill></li>
              <li className="flex items-center justify-between"><span className="text-muted-foreground">PII redaction</span><StatusPill tone="info">Adaptive</StatusPill></li>
            </ul>
          </div>

          {/* Quickstart */}
          <div className="iris-border col-span-2 rounded-2xl bg-card/70 p-5 backdrop-blur md:col-span-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary-glow" />
              <span className="font-display text-sm font-semibold">Quickstart</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Memory and tool calls run through the backend orchestrator — never in the browser.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/app/memory" className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-surface/60 px-3 py-1.5 text-xs hover:bg-accent">
                <Brain className="h-3.5 w-3.5" /> Inspect memory
              </Link>
              <Link to="/app/workflows" className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-surface/60 px-3 py-1.5 text-xs hover:bg-accent">
                <Workflow className="h-3.5 w-3.5" /> Browse workflows
              </Link>
              <Link to="/app/analytics" className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-surface/60 px-3 py-1.5 text-xs hover:bg-accent">
                <Cpu className="h-3.5 w-3.5" /> Open analytics
              </Link>
            </div>
          </div>
        </section>

        {/* Activity */}
        <section className="iris-border rounded-2xl bg-card/70 p-5 backdrop-blur md:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary-glow" />
            <span className="font-display text-sm font-semibold">Recent activity</span>
          </div>
          <div className="divide-y divide-border/60 text-sm">
            {[
              { t: "2m ago", e: "Memory promoted to pinned", d: "Q3 OKR — clinical ops" },
              { t: "14m ago", e: "Workflow run completed", d: "intake-triage · 312ms" },
              { t: "1h ago", e: "Document indexed", d: "policy-v3.pdf · 24 chunks" },
              { t: "3h ago", e: "Role updated", d: "j.lopez → admin" },
            ].map((row) => (
              <div key={row.t} className="flex items-center justify-between py-3">
                <div className="min-w-0">
                  <div className="truncate font-medium">{row.e}</div>
                  <div className="truncate text-xs text-muted-foreground">{row.d}</div>
                </div>
                <span className="font-mono text-[11px] text-muted-foreground">{row.t}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
