import { useState } from "react";
import { Copy, Check, RotateCw, Pencil, Trash2, Brain, Wrench, Paperclip, Globe, ThumbsUp, ThumbsDown, Sparkles } from "lucide-react";
import { Markdown } from "@/components/markdown";
import { MessageAttachmentChip } from "./attachment-card";
import type { Message } from "@/lib/api/endpoints";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  attachments?: Message["attachments"];
  tools_used?: Message["tools_used"];
  memories_used?: Message["memories_used"];
}

export interface ToolEvent {
  name: string;
  status: "start" | "running" | "stream" | "done" | "error" | "skipped";
}

interface MessageBubbleProps {
  message: ChatMessage;
  streaming?: boolean;
  statusLabel?: string;
  tools?: ToolEvent[];
  sources?: string[];
  feedback?: "up" | "down" | null;
  onFeedback?: (helpful: boolean) => void;
  onCopy?: () => void;
  onRetry?: () => void;
  onEdit?: (newContent: string) => void;
  onDelete?: () => void;
}

/**
 * Premium message: assistant uses an open layout (no bubble) with avatar,
 * user uses a soft gradient pill. Generous spacing, smooth entrance.
 */
export function MessageBubble({
  message, streaming, statusLabel, tools, sources, feedback, onFeedback,
  onCopy, onRetry, onEdit, onDelete,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    onCopy?.();
  };

  return (
    <div className={`group flex animate-msg-in gap-3 sm:gap-4 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="relative grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-primary text-[11px] font-bold text-primary-foreground shadow-glow">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
      )}

      <div className={`flex min-w-0 flex-col gap-2 ${isUser ? "max-w-[88%] items-end sm:max-w-[78%]" : "max-w-full flex-1 items-start"}`}>
        {/* USER bubble */}
        {isUser ? (
          <div className="relative rounded-2xl rounded-tr-md bg-gradient-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground shadow-glow">
            {editing ? (
              <div className="space-y-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={Math.min(8, Math.max(2, draft.split("\n").length))}
                  className="w-full resize-none rounded-lg bg-black/20 p-2 text-sm text-inherit outline-none ring-1 ring-white/20"
                  autoFocus
                />
                <div className="flex justify-end gap-1.5">
                  <button onClick={() => { setDraft(message.content); setEditing(false); }} className="rounded-md px-2.5 py-1 text-xs opacity-80 hover:opacity-100">Cancel</button>
                  <button onClick={() => { onEdit?.(draft); setEditing(false); }} disabled={!draft.trim() || draft === message.content} className="rounded-md bg-black/20 px-2.5 py-1 text-xs font-medium ring-1 ring-white/20 disabled:opacity-40">Save & resend</button>
                </div>
              </div>
            ) : (
              <div className="whitespace-pre-wrap text-pretty">{message.content}</div>
            )}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {message.attachments.map((a) => <MessageAttachmentChip key={a.id} attachment={a} />)}
              </div>
            )}
          </div>
        ) : (
          /* ASSISTANT — open layout, no bubble */
          <div className="w-full text-[15px] leading-7 text-foreground">
            {streaming && !message.content ? (
              <div className="flex items-center gap-2.5 py-1.5 text-muted-foreground">
                <span className="flex gap-1" aria-hidden>
                  <span className="h-2 w-2 animate-bounce rounded-full bg-primary-glow [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-primary-glow [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-primary-glow" />
                </span>
                <span className="text-sm">{statusLabel ?? "Thinking…"}</span>
              </div>
            ) : (
              <div className="prose-message animate-in fade-in duration-200">
                <Markdown content={message.content} />
                {streaming && message.content && (
                  <span className="ml-0.5 inline-block h-4 w-[3px] translate-y-0.5 rounded-sm bg-primary-glow cursor-blink align-middle" />
                )}
              </div>
            )}

            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {message.attachments.map((a) => <MessageAttachmentChip key={a.id} attachment={a} />)}
              </div>
            )}

            {/* Live tools while streaming */}
            {streaming && tools && tools.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5 animate-in fade-in duration-200">
                {tools.map((t) => (
                  <span key={t.name} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/70 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {t.name === "web_search" ? <Globe className="h-3 w-3 text-primary-glow" /> : <Wrench className="h-3 w-3" />}
                    {t.name.replace(/_/g, " ")}
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      t.status === "running" ? "animate-status-pulse bg-primary-glow"
                      : t.status === "done" ? "bg-success"
                      : t.status === "error" ? "bg-destructive"
                      : "bg-muted-foreground/40"
                    }`} />
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Source citations */}
        {!isUser && sources && sources.length > 0 && (
          <div className="flex flex-col gap-1.5 animate-in fade-in duration-300">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/80">
              Live sources
            </p>
            <div className="flex flex-wrap gap-1.5">
              {sources.slice(0, 6).map((src, i) => {
                let host = src;
                try { host = new URL(src).hostname.replace(/^www\./, ""); } catch { /* keep raw */ }
                return (
                  <a key={`${src}-${i}`} href={src} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/60 px-2.5 py-1 text-[11px] text-muted-foreground transition hover:border-primary/40 hover:bg-accent hover:text-foreground"
                    title={src}>
                    <Globe className="h-3 w-3" /> {host}
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Persisted indicators */}
        {!isUser && !streaming && (message.tools_used?.length || message.memories_used?.length) ? (
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {message.memories_used && message.memories_used.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface/60 px-2 py-0.5">
                <Brain className="h-3 w-3 text-primary-glow" /> {message.memories_used.length} memor{message.memories_used.length === 1 ? "y" : "ies"}
              </span>
            )}
            {message.tools_used?.map((t) => (
              <span key={t.name} className="inline-flex items-center gap-1 rounded-full border border-border bg-surface/60 px-2 py-0.5">
                <Wrench className={`h-3 w-3 ${t.status === "error" ? "text-destructive" : "text-muted-foreground"}`} />
                {t.name}
              </span>
            ))}
          </div>
        ) : null}

        {/* Hover actions */}
        {!editing && !streaming && (
          <div className={`flex items-center gap-0.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100 ${isUser ? "flex-row-reverse" : ""}`}>
            <ActionButton onClick={handleCopy} label={copied ? "Copied" : "Copy"}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </ActionButton>
            {isUser && onEdit && (
              <ActionButton onClick={() => setEditing(true)} label="Edit"><Pencil className="h-3.5 w-3.5" /></ActionButton>
            )}
            {!isUser && onRetry && (
              <ActionButton onClick={onRetry} label="Regenerate"><RotateCw className="h-3.5 w-3.5" /></ActionButton>
            )}
            {!isUser && onFeedback && (
              <>
                <ActionButton onClick={() => onFeedback(true)} label="Helpful" active={feedback === "up"}>
                  <ThumbsUp className="h-3.5 w-3.5" />
                </ActionButton>
                <ActionButton onClick={() => onFeedback(false)} label="Not helpful" active={feedback === "down"}>
                  <ThumbsDown className="h-3.5 w-3.5" />
                </ActionButton>
              </>
            )}
            {onDelete && (
              <ActionButton onClick={onDelete} label="Delete" danger><Trash2 className="h-3.5 w-3.5" /></ActionButton>
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-border bg-surface text-[10px] font-bold shadow-soft">
          You
        </div>
      )}
    </div>
  );
}

function ActionButton({ onClick, label, danger, active, children }: { onClick: () => void; label: string; danger?: boolean; active?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`grid h-7 w-7 place-items-center rounded-md transition-colors ${
        active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent"
      } ${danger ? "hover:text-destructive" : "hover:text-foreground"}`}
    >
      {children}
    </button>
  );
}
