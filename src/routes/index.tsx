import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Shield, Send, Sparkles, Square, Plus, Lock, Zap, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WorkMate AI — Secure AI Operating System" },
      { name: "description", content: "WorkMate AI is a secure, enterprise-grade AI operating system powered by GPT-5.5. Chat, code, analyze, and ship — privately." },
      { property: "og:title", content: "WorkMate AI — Secure AI Operating System" },
      { property: "og:description", content: "Secure AI OS powered by GPT-5.5." },
    ],
  }),
  component: WorkMate,
});

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  { icon: Zap, title: "Draft a launch email", prompt: "Draft a concise launch email for a new product feature." },
  { icon: Sparkles, title: "Explain a concept", prompt: "Explain zero-knowledge proofs like I'm a curious engineer." },
  { icon: Lock, title: "Review for security", prompt: "Review this snippet for security issues: \n\n```js\n\n```" },
  { icon: Bot, title: "Plan my day", prompt: "Help me plan a focused 4-hour deep work block." },
];

function WorkMate() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [input]);

  const stop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
  };

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setError(null);
    setInput("");

    const userMsg: Msg = { role: "user", content };
    const next = [...messages, userMsg];
    setMessages(next);
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
        signal: controller.signal,
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || "Request failed");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistant = "";
      let done = false;
      setMessages((p) => [...p, { role: "assistant", content: "" }]);

      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line || line.startsWith(":")) continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) {
              assistant += delta;
              setMessages((p) => {
                const copy = [...p];
                copy[copy.length - 1] = { role: "assistant", content: assistant };
                return copy;
              });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setError((e as Error).message);
      setMessages((p) => p.filter((m, i) => !(i === p.length - 1 && m.role === "assistant" && m.content === "")));
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const newChat = () => {
    stop();
    setMessages([]);
    setError(null);
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-sidebar">
        <div className="p-4 flex items-center gap-2.5">
          <div className="size-9 rounded-xl flex items-center justify-center" style={{ background: "var(--gradient-brand)" }}>
            <Shield className="size-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-semibold tracking-tight">WorkMate AI</div>
            <div className="text-[11px] text-muted-foreground">Secure AI OS</div>
          </div>
        </div>
        <div className="px-3">
          <Button onClick={newChat} variant="secondary" className="w-full justify-start gap-2 bg-secondary/60 hover:bg-secondary">
            <Plus className="size-4" /> New chat
          </Button>
        </div>
        <div className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="text-xs uppercase tracking-wider text-muted-foreground px-2 mb-2">Session</div>
          <div className="rounded-lg px-3 py-2 text-sm bg-secondary/40 border border-border/60 truncate">
            {messages.find((m) => m.role === "user")?.content.slice(0, 40) || "New conversation"}
          </div>
        </div>
        <div className="p-3 border-t border-border">
          <div className="rounded-lg p-3 bg-card/60 border border-border/60">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Lock className="size-3" /> End-to-end encrypted
            </div>
            <div className="text-xs text-muted-foreground">Model: <span className="text-foreground font-medium">GPT-5.5</span></div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "var(--gradient-glow)" }} />
        <header className="relative flex items-center justify-between px-6 py-4 border-b border-border/60 backdrop-blur">
          <div className="flex items-center gap-2">
            <div className="md:hidden size-8 rounded-lg flex items-center justify-center" style={{ background: "var(--gradient-brand)" }}>
              <Shield className="size-4 text-primary-foreground" />
            </div>
            <div className="font-semibold md:hidden">WorkMate AI</div>
            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              GPT-5.5 · Secure runtime
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={newChat} className="gap-2">
            <Plus className="size-4" /> New
          </Button>
        </header>

        <div ref={scrollRef} className="relative flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="max-w-2xl mx-auto px-6 pt-20 pb-10">
              <div className="text-center mb-10">
                <div className="inline-flex size-16 rounded-2xl items-center justify-center mb-5" style={{ background: "var(--gradient-brand)", boxShadow: "var(--shadow-glow)" }}>
                  <Shield className="size-8 text-primary-foreground" />
                </div>
                <h1 className="text-4xl font-semibold tracking-tight mb-3">WorkMate AI</h1>
                <p className="text-muted-foreground max-w-md mx-auto">A secure AI operating system for your work. Powered by GPT-5.5.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.title}
                    onClick={() => send(s.prompt)}
                    className="group text-left rounded-xl border border-border/60 bg-card/60 hover:bg-card hover:border-primary/40 p-4 transition"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <s.icon className="size-4 text-primary" />
                      <div className="font-medium text-sm">{s.title}</div>
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-2">{s.prompt}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
              {messages.map((m, i) => (
                <MessageBubble key={i} msg={m} />
              ))}
              {loading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground pl-11">
                  <span className="size-2 rounded-full bg-primary animate-pulse" />
                  WorkMate is thinking…
                </div>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="px-4 pb-2">
            <div className="max-w-3xl mx-auto text-sm rounded-lg bg-destructive/15 border border-destructive/40 text-destructive-foreground px-3 py-2">
              {error}
            </div>
          </div>
        )}

        {/* Composer */}
        <div className="relative border-t border-border/60 bg-background/80 backdrop-blur px-4 py-4">
          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="max-w-3xl mx-auto"
          >
            <div className="flex items-end gap-2 rounded-2xl border border-border bg-card/80 p-2 focus-within:border-primary/60 transition">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
                }}
                placeholder="Message WorkMate AI…"
                rows={1}
                className="flex-1 resize-none bg-transparent outline-none px-3 py-2.5 text-sm placeholder:text-muted-foreground max-h-[200px]"
              />
              {loading ? (
                <Button type="button" onClick={stop} size="icon" variant="secondary" className="rounded-xl">
                  <Square className="size-4 fill-current" />
                </Button>
              ) : (
                <Button type="submit" disabled={!input.trim()} size="icon" className="rounded-xl" style={{ background: "var(--gradient-brand)" }}>
                  <Send className="size-4" />
                </Button>
              )}
            </div>
            <div className="text-center text-[11px] text-muted-foreground mt-2 flex items-center justify-center gap-1.5">
              <Lock className="size-3" />
              Encrypted session · WorkMate AI can make mistakes. Verify important info.
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

function MessageBubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === "user";
  return (
    <div className="flex gap-3">
      <div
        className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${isUser ? "bg-secondary" : ""}`}
        style={!isUser ? { background: "var(--gradient-brand)" } : undefined}
      >
        {isUser ? <User className="size-4" /> : <Shield className="size-4 text-primary-foreground" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted-foreground mb-1">{isUser ? "You" : "WorkMate AI"}</div>
        {isUser ? (
          <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none prose-pre:bg-secondary prose-pre:border prose-pre:border-border prose-code:text-primary">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content || "…"}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
