import { useMutation } from "@tanstack/react-query";

import { Button, Card } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import type { CorrelationResult } from "@/types/api";

export function CorrelationPanel() {
  const run = useMutation<CorrelationResult, ApiError>({
    mutationFn: () =>
      api.post<CorrelationResult>("/quantum/correlation/run", { lookback_hours: 24, seed: 1337 }),
  });

  const r = run.data;
  const better = r ? r.qubo_modularity >= r.baseline_modularity : false;

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-fg">
          Re-cluster the last 24h of events with a densest-subgraph QUBO and compare to the
          greedy baseline
        </span>
        <Button onClick={() => run.mutate()} disabled={run.isPending}>
          {run.isPending ? "Solving…" : "Run correlation"}
        </Button>
        {run.error && <span className="text-xs text-critical">{run.error.message}</span>}
      </Card>

      {r && (
        <>
          <Card className="flex flex-wrap items-center gap-4 text-xs">
            <span>
              {r.event_count} events → {r.clusters.length} incidents, {r.singletons.length}{" "}
              singletons
            </span>
            <span>
              modularity — QUBO{" "}
              <span className={better ? "text-ok" : "text-medium"}>{r.qubo_modularity}</span> vs
              greedy <span className="text-muted">{r.baseline_modularity}</span>
            </span>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {r.clusters.map((members, i) => (
              <Card key={i} className="p-2.5">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-semibold text-fg">Incident {i + 1}</span>
                  <span className="text-muted">density {r.cluster_density[i]}</span>
                </div>
                <ul className="space-y-0.5 text-[11px] text-fg/90">
                  {members.map((label, j) => (
                    <li key={j} className="truncate rounded bg-surface-2/50 px-1.5 py-0.5">
                      {label}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>

          {r.singletons.length > 0 && (
            <Card>
              <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
                Unclustered ({r.singletons.length})
              </h4>
              <div className="flex flex-wrap gap-1 text-[11px] text-muted">
                {r.singletons.map((s, i) => (
                  <span key={i} className="rounded bg-surface-2 px-1.5 py-0.5">
                    {s}
                  </span>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
