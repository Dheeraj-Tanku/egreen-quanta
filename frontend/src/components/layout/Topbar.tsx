import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { Badge } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { SystemInfo } from "@/types/api";

import { ThemeToggle } from "./ThemeToggle";

export function Topbar({ onMenu }: { onMenu?: () => void }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ["system-info"],
    queryFn: () => api.get<SystemInfo>("/system/info"),
    staleTime: 60_000,
  });

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface/60 px-4">
      <div className="flex items-center gap-2 text-xs text-muted">
        {onMenu && (
          <button
            onClick={onMenu}
            aria-label="Open navigation"
            className="mr-1 grid h-8 w-8 place-items-center rounded-lg border border-border bg-surface-2 md:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>
        )}
        <span className="inline-flex h-2 w-2 rounded-full bg-ok" role="status" aria-label="API online" />
        <span>
          {data ? (
            <>
              API online · <span className="text-fg">{data.environment}</span> · {data.database}
            </>
          ) : (
            "connecting…"
          )}
        </span>
        {data?.ml_enabled ? (
          <Badge severity="info" className="ml-1">
            ML on
          </Badge>
        ) : null}
      </div>

      <div className="relative flex items-center gap-3 text-xs">
        <span className="hidden text-muted lg:inline">
          revocation {data?.outbound_revocation ? "online" : "offline"}
        </span>
        <ThemeToggle />
        {user && (
          <>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-2 py-1.5 hover:bg-surface-2/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/20 text-[11px] font-semibold text-primary">
                {user.full_name?.[0]?.toUpperCase() ?? user.email[0]?.toUpperCase()}
              </span>
              <span className="hidden text-fg sm:inline">{user.email}</span>
              <Badge severity="info">{user.role}</Badge>
            </button>
            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-11 z-40 w-44 rounded-lg border border-border bg-surface p-1 shadow-card"
                onMouseLeave={() => setMenuOpen(false)}
              >
                <div className="px-2 py-1.5 text-[11px] text-muted">
                  Signed in as
                  <div className="truncate text-fg">{user.email}</div>
                </div>
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    void logout();
                  }}
                  className="mt-1 w-full rounded px-2 py-1.5 text-left text-sm text-fg hover:bg-surface-2"
                >
                  Sign out
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </header>
  );
}
