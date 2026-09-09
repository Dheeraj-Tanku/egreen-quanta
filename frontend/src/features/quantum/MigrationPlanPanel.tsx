import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { Button, Card } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import type { MigrationPlanResult } from "@/types/api";

import { EnergyChart } from "./EnergyChart";

const SEED_IDENTITIES = [
  { name: "root-ca", qes: 96, criticality: 5, effort: 3 },
  { name: "issuing-ca", qes: 88, criticality: 5, effort: 3 },
  { name: "code-signing", qes: 82, criticality: 4, effort: 2 },
  { name: "tls-frontend", qes: 74, criticality: 4, effort: 2 },
  { name: "email-smime", qes: 61, criticality: 3, effort: 2 },
  { name: "doc-signing", qes: 58, criticality: 3, effort: 2 },
  { name: "device-attest", qes: 44, criticality: 2, effort: 1 },
  { name: "ci-artifacts", qes: 39, criticality: 2, effort: 1 },
  { name: "legacy-app", qes: 30, criticality: 1, effort: 1 },
  { name: "sandbox", qes: 18, criticality: 1, effort: 1 },
];

function waveColor(q: number) {
  if (q >= 75) return "rgb(244 63 94)";
  if (q >= 50) return "rgb(250 204 21)";
  if (q >= 25) return "rgb(96 165 250)";
  return "rgb(52 211 153)";
}

export function MigrationPlanPanel() {
  const [waves, setWaves] = useState(4);
  const plan = useMutation<MigrationPlanResult, ApiError>({
    mutationFn: () =>
      api.post<MigrationPlanResult>("/quantum/pq-risk/plan", {
        identities: SEED_IDENTITIES,
        waves,
        seed: 1337,
      }),
  });

  const p = plan.data;

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-fg">
          Plan PQC migration for {SEED_IDENTITIES.length} signing identities over
        </span>
        <select
          value={waves}
          onChange={(e) => setWaves(Number(e.target.value))}
          className="rounded-lg border border-border bg-surface-2 px-2 py-1 text-sm"
        >
          {[3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>
              {n} waves
            </option>
          ))}
        </select>
        <Button onClick={() => plan.mutate()} disabled={plan.isPending}>
          {plan.isPending ? "Optimising…" : "Run planner"}
        </Button>
        {plan.error && <span className="text-xs text-critical">{plan.error.message}</span>}
      </Card>

      {p && (
        <>
          <Card>
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <span>
                cumulative risk-exposure-time{" "}
                <span className="text-fg tabular-nums">{p.cumulative_exposure}</span>
              </span>
              <span>
                vs greedy baseline{" "}
                <span className="text-muted tabular-nums">{p.baseline_exposure}</span>
              </span>
              <span
                className={p.improvement_pct >= 0 ? "text-ok" : "text-critical"}
              >
                {p.improvement_pct >= 0 ? "−" : "+"}
                {Math.abs(p.improvement_pct)}% exposure
              </span>
              <span className="text-muted">capacity {p.wave_capacity}/wave</span>
            </div>
            {p.notes.map((n) => (
              <p key={n} className="mt-1 text-[11px] text-medium">
                {n}
              </p>
            ))}
          </Card>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {p.waves.map((members, i) => (
              <Card key={i} className="p-2.5">
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-semibold text-fg">Wave {i + 1}</span>
                  <span className="text-muted">
                    load {members.reduce((s, m) => s + m.effort, 0)}/{p.wave_capacity}
                  </span>
                </div>
                <div className="space-y-1">
                  {members.map((m) => (
                    <div
                      key={m.name}
                      className="flex items-center justify-between rounded px-1.5 py-1 text-[11px]"
                      style={{ background: waveColor(m.qes) + "1f" }}
                    >
                      <span className="text-fg">{m.name}</span>
                      <span className="tabular-nums" style={{ color: waveColor(m.qes) }}>
                        {m.qes}
                      </span>
                    </div>
                  ))}
                  {members.length === 0 && (
                    <p className="py-2 text-center text-[11px] text-muted">—</p>
                  )}
                </div>
              </Card>
            ))}
          </div>

          <Card>
            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
              Solver convergence
            </h4>
            <EnergyChart solver={p.solver} />
          </Card>
        </>
      )}
    </div>
  );
}
