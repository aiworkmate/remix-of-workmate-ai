import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, ShieldCheck, Brain, Workflow, BarChart3, FileText, Stethoscope, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { AuthDialog } from "@/components/auth-dialog";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI WorkMate — The Secure AI Operating System" },
      { name: "description", content: "Chat, memory, documents, workflows, analytics — one premium, secure, multi-tenant AI operating system." },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Brain, title: "Persistent memory", desc: "Workspace-scoped, confidence-ranked recall." },
  { icon: FileText, title: "Document intelligence", desc: "Parsed, retrievable, fully audited." },
  { icon: Workflow, title: "Workflow automations", desc: "Permission-aware, agentic execution." },
  { icon: BarChart3, title: "Operational analytics", desc: "Latency, tools, errors — all live." },
  { icon: ShieldCheck, title: "Enterprise security", desc: "RBAC, RLS, full audit trail." },
  { icon: Stethoscope, title: "Clinician-grade assist", desc: "Structured observations, reviewed." },
];

function Landing() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signup");

  // Auto-forward returning users so they "enter the OS" instantly.
  useEffect(() => {
    if (!loading && session) navigate({ to: "/app", replace: true });
  }, [session, loading, navigate]);

  function startChatting() {
    if (session) return navigate({ to: "/app" });
    setMode("signup");
    setAuthOpen(true);
  }
  function continueSession() {
    if (session) return navigate({ to: "/app" });
    setMode("signin");
    setAuthOpen(true);
  }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-background text-foreground">
      {/* Ambient backdrop */}
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" />
      <div className="pointer-events-none absolute -top-48 left-1/2 h-[640px] w-[1200px] -translate-x-1/2 rounded-full bg-primary/20 blur-[160px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[600px] rounded-full bg-primary-glow/10 blur-[140px]" />

      {/* Header */}
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-primary shadow-glow">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-base font-semibold tracking-tight sm:text-lg">AI WorkMate</span>
          <span className="ml-1 hidden rounded-full border border-border bg-surface/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:inline">
            v4 · enterprise
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={continueSession}>Sign in</Button>
          <Button size="sm" onClick={startChatting} className="shadow-glow">Get started</Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 pt-16 pb-24 text-center sm:px-6 sm:pt-24">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-[11px] text-muted-foreground backdrop-blur sm:text-xs">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
          </span>
          Live · SOC-aligned · Multi-tenant
        </div>

        <h1 className="mx-auto mt-6 max-w-4xl text-balance font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
          The AI operating system{" "}
          <span className="bg-gradient-to-r from-primary-glow via-primary to-primary-glow bg-clip-text text-transparent">
            built for serious work.
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-balance text-sm text-muted-foreground sm:mt-6 sm:text-lg">
          Chat with persistent memory. Search live data. Run workflows. Audit everything.
          One premium AI workspace — for teams that can't afford a chatbot.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" onClick={startChatting} className="h-12 w-full gap-2 px-6 text-sm shadow-glow sm:w-auto">
            Start chatting <ArrowRight className="h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" onClick={continueSession} className="h-12 w-full px-6 text-sm sm:w-auto">
            Continue session
          </Button>
        </div>

        {/* Mock product chrome */}
        <div className="relative mx-auto mt-16 max-w-5xl">
          <div className="absolute inset-x-8 -top-8 h-24 rounded-full bg-primary/30 blur-3xl" />
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card/70 shadow-elevated backdrop-blur">
            <div className="flex items-center gap-1.5 border-b border-border/60 px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
              <span className="ml-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">workmate · /chat</span>
            </div>
            <div className="grid gap-4 p-6 text-left sm:grid-cols-[1fr_2fr] sm:gap-6 sm:p-8">
              <div className="space-y-2">
                <div className="h-3 w-24 rounded-full bg-muted/70" />
                <div className="h-8 rounded-lg bg-gradient-primary/20" />
                <div className="h-6 rounded-md bg-muted/40" />
                <div className="h-6 rounded-md bg-muted/40" />
                <div className="h-6 rounded-md bg-muted/40" />
              </div>
              <div className="space-y-3">
                <div className="rounded-xl bg-muted/40 p-4">
                  <div className="h-3 w-3/4 rounded-full bg-muted-foreground/30" />
                  <div className="mt-2 h-3 w-1/2 rounded-full bg-muted-foreground/20" />
                </div>
                <div className="ml-auto w-fit max-w-[80%] rounded-xl bg-gradient-primary px-4 py-3 shadow-glow">
                  <div className="h-3 w-40 rounded-full bg-primary-foreground/40" />
                </div>
                <div className="rounded-xl bg-muted/40 p-4">
                  <div className="h-3 w-full rounded-full bg-muted-foreground/30" />
                  <div className="mt-2 h-3 w-5/6 rounded-full bg-muted-foreground/20" />
                  <div className="mt-2 h-3 w-2/3 rounded-full bg-muted-foreground/20" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="group flex flex-col gap-3 bg-surface p-6 transition hover:bg-surface-elevated sm:p-7">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent/50 text-primary-glow transition group-hover:bg-accent">
                <f.icon className="h-4 w-4" />
              </div>
              <h3 className="font-display text-base font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-border/60">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-[11px] text-muted-foreground sm:px-6 sm:text-xs">
          <span>© {new Date().getFullYear()} AI WorkMate. All systems audited.</span>
          <span className="font-mono">build · prod · region-eu-w1</span>
        </div>
      </footer>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} defaultMode={mode} />
    </div>
  );
}
