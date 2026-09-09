import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { Badge } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { SystemInfo } from "@/types/api";

export function Topbar() {
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
        <span className="inline-flex h-2 w-2 rounded-full bg-ok" />
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
        <span className="hidden text-muted sm:inline">
          revocation {data?.outbound_revocation ? "online" : "offline"}
        </span>
        {user && (
          <>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-2 py-1.5 hover:bg-surface-2/70"
            >
              <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/20 text-[11px] font-semibold text-primary">
                {user.full_name?.[0]?.toUpperCase() ?? user.email[0]?.toUpperCase()}
              </span>
              <span className="hidden text-fg sm:inline">{user.email}</span>
              <Badge severity="info">{user.role}</Badge>
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-11 z-40 w-44 rounded-lg border border-border bg-surface p-1 shadow-card"
                onMouseLeave={() => setMenuOpen(false)}
              >
                <div className="px-2 py-1.5 text-[11px] text-muted">
                  Signed in as
                  <div className="truncate text-fg">{user.email}</div>
                </div>
                <button
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
