import { Link, useRouterState } from "@tanstack/react-router";
import {
  MessageSquare, Brain, FileText, Workflow, BarChart3,
  Shield, Settings, Stethoscope, LayoutDashboard, Plus, ScrollText, Sparkles,
} from "lucide-react";

const groups = [
  {
    label: "Workspace",
    items: [
      { to: "/app", label: "Overview", icon: LayoutDashboard, exact: true },
      { to: "/app/chat", label: "Chat", icon: MessageSquare },
      { to: "/app/memory", label: "Memory", icon: Brain },
      { to: "/app/uploads", label: "Documents", icon: FileText },
      { to: "/app/workflows", label: "Workflows", icon: Workflow },
    ],
  },
  {
    label: "Insights",
    items: [
      { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
      { to: "/app/medical", label: "Medical assistive", icon: Stethoscope },
    ],
  },
  {
    label: "Administration",
    items: [
      { to: "/app/admin", label: "Admin", icon: Shield },
      { to: "/app/audit", label: "Audit logs", icon: ScrollText },
      { to: "/app/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <aside className="relative hidden w-64 shrink-0 flex-col md:flex">
      <div className="glass absolute inset-y-3 left-3 right-0 flex flex-col rounded-2xl shadow-elevated">
        <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4">
          <div className="relative grid h-8 w-8 place-items-center rounded-xl bg-gradient-iris shadow-glow">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <div className="truncate font-display text-sm font-semibold leading-none">
              <span className="iris-text">AI WorkMate</span>
            </div>
            <div className="mt-1 truncate font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
              Acme · Production
            </div>
          </div>
        </div>

        <div className="px-3 pt-4">
          <Link
            to="/app/chat"
            className="group flex items-center justify-center gap-2 rounded-xl bg-gradient-iris px-3 py-2.5 text-sm font-medium text-primary-foreground shadow-glow transition hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" /> New chat
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-thin px-2.5 py-4">
          {groups.map((g) => (
            <div key={g.label} className="mb-5">
              <div className="mb-1.5 px-2.5 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60">
                {g.label}
              </div>
              <ul className="space-y-0.5">
                {g.items.map((item) => {
                  const active = isActive(item.to, item.exact);
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        className={`group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition ${
                          active
                            ? "bg-gradient-iris-soft text-foreground shadow-[inset_0_1px_0_0_oklch(1_0_0/0.06)]"
                            : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-foreground"
                        }`}
                      >
                        {active && (
                          <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-gradient-iris" />
                        )}
                        <item.icon
                          className={`h-4 w-4 transition ${
                            active ? "text-primary-glow" : "text-muted-foreground group-hover:text-foreground"
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="iris-border rounded-xl bg-surface/40 p-3 text-xs backdrop-blur">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 animate-status-pulse rounded-full bg-success shadow-[0_0_10px_currentColor]" />
              <span className="font-medium">All systems nominal</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Audit streaming · RLS active</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
