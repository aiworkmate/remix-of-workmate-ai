import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Paperclip, Send, Square, Mic, MicOff, Image as ImageIcon, Volume2, VolumeX } from "lucide-react";
import { createPending, releasePending, uploadAttachment, toMessageAttachment, type PendingAttachment } from "@/services/attachments";
import type { MessageAttachment } from "@/lib/api/endpoints";
import { PendingAttachmentCard } from "./attachment-card";
import { useSpeechRecognition, useAutoSpeak, cancelSpeak } from "@/hooks/use-voice-mode";

interface ComposerProps {
  disabled?: boolean;
  isStreaming?: boolean;
  onSend: (text: string, attachments: MessageAttachment[]) => void | Promise<void>;
  onStop?: () => void;
}

/**
 * Premium composer with auto-grow, drag/drop attachments, voice placeholder,
 * and large mobile-friendly touch targets.
 */
export function Composer({ disabled, isStreaming, onSend, onStop }: ComposerProps) {
  const [text, setText] = useState("");
  const [pending, setPending] = useState<PendingAttachment[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [focused, setFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [autoSpeak, setAutoSpeak] = useAutoSpeak();
  const baseTextRef = useRef("");
  const { listening, start: startListen, stop: stopListen, supported: micSupported } =
    useSpeechRecognition((transcript, final) => {
      const base = baseTextRef.current;
      const next = (base ? base + " " : "") + transcript;
      setText(next);
      if (final) baseTextRef.current = next;
    });
  const toggleMic = () => {
    if (listening) {
      stopListen();
    } else {
      baseTextRef.current = text;
      startListen();
    }
  };

  // Auto-grow
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [text]);

  const canSend = Boolean(text.trim() || pending.some((p) => p.status === "uploaded"))
    && !isStreaming
    && !pending.some((p) => p.status === "uploading" || p.status === "processing");

  const addFiles = useCallback((files: FileList | File[]) => {
    const next: PendingAttachment[] = [];
    for (const file of Array.from(files)) {
      if (file.size > 25 * 1024 * 1024) continue;
      next.push(createPending(file));
    }
    if (!next.length) return;
    setPending((curr) => [...curr, ...next]);
    for (const p of next) {
      uploadAttachment(p, (update) => {
        setPending((curr) => curr.map((c) => (c.clientId === update.clientId ? update : c)));
      });
    }
  }, []);

  const removePending = (clientId: string) => {
    setPending((curr) => {
      const target = curr.find((c) => c.clientId === clientId);
      if (target) releasePending(target);
      return curr.filter((c) => c.clientId !== clientId);
    });
  };

  const handleSubmit = async () => {
    if (!canSend) return;
    const attachments = pending
      .map(toMessageAttachment)
      .filter((a): a is MessageAttachment => a !== null);
    const value = text.trim();
    setText("");
    pending.forEach(releasePending);
    setPending([]);
    await onSend(value, attachments);
  };

  return (
    <div
      onDragEnter={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
      }}
      className={`mx-auto max-w-3xl rounded-2xl border bg-surface/70 backdrop-blur-xl transition-all duration-200 ${
        dragOver
          ? "border-primary/70 shadow-glow ring-4 ring-primary/20"
          : focused
            ? "border-primary/40 shadow-elevated"
            : "border-border shadow-soft"
      }`}
    >
      {pending.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-b border-border/60 p-2.5">
          {pending.map((p) => (
            <PendingAttachmentCard key={p.clientId} attachment={p} onRemove={() => removePending(p.clientId)} />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-1.5 p-2 sm:gap-2 sm:p-2.5">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
          rows={1}
          placeholder={dragOver ? "Drop files to attach…" : "Ask anything…"}
          disabled={disabled}
          enterKeyHint="send"
          autoCapitalize="sentences"
          className="max-h-[160px] min-h-[24px] w-full resize-none bg-transparent px-2 py-1 text-[15px] leading-6 outline-none placeholder:text-muted-foreground/60 disabled:opacity-50 sm:max-h-[200px] sm:px-2.5 sm:py-1.5"
        />

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-0.5">
            <ComposerIconButton onClick={() => fileInputRef.current?.click()} label="Attach files">
              <Paperclip className="h-[18px] w-[18px]" />
            </ComposerIconButton>
            <ComposerIconButton onClick={() => imageInputRef.current?.click()} label="Attach image">
              <ImageIcon className="h-[18px] w-[18px]" />
            </ComposerIconButton>
            <ComposerIconButton
              onClick={toggleMic}
              label={listening ? "Stop voice input" : micSupported ? "Voice input" : "Voice not supported in this browser"}
              disabled={!micSupported}
              active={listening}
            >
              {listening ? <MicOff className="h-[18px] w-[18px]" /> : <Mic className="h-[18px] w-[18px]" />}
            </ComposerIconButton>
            <ComposerIconButton
              onClick={() => {
                const next = !autoSpeak;
                setAutoSpeak(next);
                if (!next) cancelSpeak();
              }}
              label={autoSpeak ? "Mute spoken replies" : "Speak replies aloud"}
              active={autoSpeak}
            >
              {autoSpeak ? <Volume2 className="h-[18px] w-[18px]" /> : <VolumeX className="h-[18px] w-[18px]" />}
            </ComposerIconButton>
          </div>

          <input ref={fileInputRef} type="file" multiple className="hidden"
            onChange={(e) => { if (e.target.files?.length) { addFiles(e.target.files); e.target.value = ""; } }} />
          <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => { if (e.target.files?.length) { addFiles(e.target.files); e.target.value = ""; } }} />

          {isStreaming && onStop ? (
            <button
              onClick={onStop}
              type="button"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-destructive/90 text-destructive-foreground shadow-soft transition hover:bg-destructive active:scale-95"
              aria-label="Stop generation"
              title="Stop generating"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canSend}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow transition-all disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none enabled:hover:scale-105 active:scale-95"
              aria-label="Send message"
            >
              {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ComposerIconButton({ onClick, label, disabled, active, children }: { onClick: () => void; label: string; disabled?: boolean; active?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={`grid h-9 w-9 place-items-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent ${
        active
          ? "bg-primary/15 text-primary hover:bg-primary/20"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
