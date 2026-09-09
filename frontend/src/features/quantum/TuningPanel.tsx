import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Button, Card } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { TuningMetrics, TuningResult } from "@/types/api";

import { EnergyChart } from "./EnergyChart";

function Metric({ label, before, after }: { label: string; before: number; after: number }) {
  const delta = after - before;
  return (
    <div className="rounded-lg border border-border bg-surface-2/40 p-2 text-center">
      <div className="text-[10px] uppercase tracking-wide text-muted">{label}</div>
      <div className="text-sm text-fg tabular-nums">
        {before} → <span className="font-semibold">{after}</span>
      </div>
      <div className={delta >= 0 ? "text-[10px] text-ok" : "text-[10px] text-critical"}>
        {delta >= 0 ? "+" : ""}
        {delta.toFixed(3)}
      </div>
    </div>
  );
}

export function TuningPanel() {
  const qc = useQueryClient();
  const { atLeast } = useAuth();

  const run = useMutation<TuningResult, ApiError>({
    mutationFn: () => api.post<TuningResult>("/quantum/tuning/run", { synthetic: true, seed: 1337 }),
  });
  const apply = useMutation<{ applied: number }, ApiError, string>({
    mutationFn: (runId) => api.post("/quantum/tuning/apply", { run_id: runId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["detection-rules"] }),
  });

  const r = run.data;
  const m = (k: keyof TuningMetrics) => [r?.before[k] ?? 0, r?.after[k] ?? 0] as const;

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-fg">
          Tune detection-rule weights against labelled history (QUBO over weight levels)
        </span>
        <Button onClick={() => run.mutate()} disabled={run.isPending}>
          {run.isPending ? "Optimising…" : "Run tuning"}
        </Button>
        {run.error && <span className="text-xs text-critical">{run.error.message}</span>}
      </Card>

      {r && (
        <>
          <Card>
            <p className="mb-2 text-xs text-muted">
              {r.sample_size} labelled events ({r.source}) · threshold {r.threshold}
            </p>
            <div className="grid grid-cols-3 gap-2">
              <Metric label="Precision" before={m("precision")[0]} after={m("precision")[1]} />
              <Metric label="Recall" before={m("recall")[0]} after={m("recall")[1]} />
              <Metric label="F1" before={m("f1")[0]} after={m("f1")[1]} />
            </div>
          </Card>

          <Card>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              Proposed weights (levels {r.levels.join(", ")})
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(r.weights)
                .sort((a, b) => b[1] - a[1])
                .map(([code, w]) => (
                  <span
                    key={code}
                    className="rounded border border-border bg-surface-2 px-2 py-1 font-mono text-xs"
                  >
                    {code} <span className="text-primary">{w}</span>
                  </span>
                ))}
            </div>
            {atLeast("admin") && (
              <Button
                size="sm"
                className="mt-3"
                disabled={apply.isPending}
                onClick={() => apply.mutate(r.run_id)}
              >
                {apply.isPending
                  ? "Applying…"
                  : apply.data
                    ? `Applied to ${apply.data.applied} rules`
                    : "Apply these weights"}
              </Button>
            )}
          </Card>

          <Card>
            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
              Solver convergence
            </h4>
            <EnergyChart solver={r.solver} />
          </Card>
        </>
      )}
    </div>
  );
}
