import { Sparkles, FileText, Lightbulb, Search, Code, ChartBar } from "lucide-react";

const SUGGESTIONS = [
  { icon: Lightbulb, title: "Brainstorm ideas", prompt: "Help me brainstorm 10 creative product ideas for a B2B SaaS targeting small dental clinics." },
  { icon: FileText,  title: "Summarize a document", prompt: "Summarize the key takeaways from a document I'll paste — focus on action items and risks." },
  { icon: Search,    title: "Research a topic",   prompt: "Research the current state of agentic AI frameworks and compare LangGraph, CrewAI, and AutoGen." },
  { icon: Code,      title: "Explain code",       prompt: "Explain this code and suggest improvements:\n\n```\n// paste code here\n```" },
  { icon: ChartBar,  title: "Analyze data",       prompt: "I have a dataset of monthly sales. Walk me through how to analyze it for seasonality and growth trends." },
  { icon: Sparkles,  title: "Draft an email",     prompt: "Draft a polite, concise email to a client explaining a 2-week project delay and a new timeline." },
];

export function ChatWelcome({ onPick, name }: { onPick: (prompt: string) => void; name?: string }) {
  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col items-center justify-center px-4 py-12 sm:px-6">
      <div className="relative mb-8 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-primary shadow-glow">
        <Sparkles className="h-7 w-7 text-primary-foreground" />
        <div className="absolute inset-0 rounded-2xl bg-gradient-primary opacity-50 blur-xl" />
      </div>

      <h1 className="text-balance text-center font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        {name ? `Welcome back, ${name.split(" ")[0]}` : "How can I help you today?"}
      </h1>
      <p className="mt-3 max-w-md text-balance text-center text-sm text-muted-foreground sm:text-base">
        Ask anything. Upload a document. Research a topic. Memory and tools are always on.
      </p>

      <div className="mt-10 grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SUGGESTIONS.map(({ icon: Icon, title, prompt }) => (
          <button
            key={title}
            onClick={() => onPick(prompt)}
            className="group relative flex items-start gap-3 rounded-xl border border-border bg-surface/50 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-surface hover:shadow-soft"
          >
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent/50 text-primary-glow transition-colors group-hover:bg-accent">
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium">{title}</div>
              <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{prompt}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
