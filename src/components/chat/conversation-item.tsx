import { useEffect, useRef, useState } from "react";
import { MessageSquare, Trash2, Pencil, Check, X } from "lucide-react";

interface ConversationItemProps {
  id: string;
  title: string;
  active: boolean;
  onSelect: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
}

export function ConversationItem({ title, active, onSelect, onRename, onDelete }: ConversationItemProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);
  useEffect(() => { setDraft(title); }, [title]);

  const commit = () => {
    const v = draft.trim();
    if (v && v !== title) onRename(v);
    setEditing(false);
  };

  return (
    <div className={`group relative flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors ${
      active
        ? "bg-accent text-accent-foreground shadow-soft"
        : "text-foreground/85 hover:bg-surface/80"
    }`}>
      {active && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary-glow" />}
      <MessageSquare className={`h-3.5 w-3.5 shrink-0 ${active ? "text-primary-glow" : "text-muted-foreground"}`} />
      {editing ? (
        <>
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(title); setEditing(false); } }}
            className="min-w-0 flex-1 rounded-md bg-background px-2 py-0.5 text-sm outline-none ring-1 ring-ring/50"
          />
          <button onClick={commit} className="grid h-6 w-6 place-items-center rounded hover:bg-accent" aria-label="Save">
            <Check className="h-3 w-3 text-success" />
          </button>
          <button onClick={() => { setDraft(title); setEditing(false); }} className="grid h-6 w-6 place-items-center rounded hover:bg-accent" aria-label="Cancel">
            <X className="h-3 w-3 text-muted-foreground" />
          </button>
        </>
      ) : (
        <>
          <button onClick={onSelect} onDoubleClick={() => setEditing(true)} className="min-w-0 flex-1 truncate text-left">
            {title}
          </button>
          <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
            <button onClick={() => setEditing(true)} className="grid h-6 w-6 place-items-center rounded hover:bg-background" aria-label="Rename" title="Rename">
              <Pencil className="h-3 w-3 text-muted-foreground" />
            </button>
            <button onClick={onDelete} className="grid h-6 w-6 place-items-center rounded hover:bg-background" aria-label="Delete" title="Delete">
              <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
