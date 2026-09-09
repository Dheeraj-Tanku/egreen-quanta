import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { LoadingPane } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import type { Role } from "@/types/api";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") return <LoadingPane label="Restoring session…" />;
  if (status === "anonymous") {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}

export function RequireRole({
  atLeast,
  children,
}: {
  atLeast: Role;
  children: ReactNode;
}) {
  const { atLeast: hasAtLeast, status } = useAuth();
  if (status === "loading") return <LoadingPane />;
  if (!hasAtLeast(atLeast)) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center">
        <p className="text-sm font-medium text-fg">Access restricted</p>
        <p className="mt-1 text-xs text-muted">
          This area requires the <span className="text-fg">{atLeast}</span> role or higher.
        </p>
      </div>
    );
  }
  return <>{children}</>;
}
