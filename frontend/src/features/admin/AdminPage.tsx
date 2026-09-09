import { useState } from "react";

import { PageHeader } from "@/components/ui";
import { RequireRole } from "@/components/RequireAuth";
import { cn } from "@/lib/cn";

import { ApiKeysPanel } from "./ApiKeysPanel";
import { UsersPanel } from "./UsersPanel";

type Tab = "users" | "api-keys";

export function AdminPage() {
  const [tab, setTab] = useState<Tab>("users");

  return (
    <RequireRole atLeast="admin">
      <PageHeader
        title="Administration"
        description="Users and roles, and API keys for machine ingest."
      />
      <div className="mb-4 flex gap-1 border-b border-border">
        {(
          [
            ["users", "Users"],
            ["api-keys", "API keys"],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm transition-colors",
              tab === id
                ? "border-primary text-fg"
                : "border-transparent text-muted hover:text-fg",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "users" ? <UsersPanel /> : <ApiKeysPanel />}
    </RequireRole>
  );
}
