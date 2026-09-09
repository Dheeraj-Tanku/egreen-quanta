import { useState } from "react";

import { PageHeader } from "@/components/ui";
import { cn } from "@/lib/cn";

import { CorrelationPanel } from "./CorrelationPanel";
import { MigrationPlanPanel } from "./MigrationPlanPanel";
import { QuantumRiskPanel } from "./QuantumRiskPanel";
import { TuningPanel } from "./TuningPanel";

type Tab = "risk" | "plan" | "tuning" | "correlation";

export function QuantumPage() {
  const [tab, setTab] = useState<Tab>("risk");
  const tabs: [Tab, string][] = [
    ["risk", "Quantum risk"],
    ["plan", "Migration plan"],
    ["tuning", "Detection tuning"],
    ["correlation", "Correlation"],
  ];

  return (
    <>
      <PageHeader
        title="Quantum Lab"
        description="Classical simulated / simulated-quantum annealing over QUBO models — no quantum hardware. Every run is seeded; small instances are brute-force-verified."
      />
      <div className="mb-4 flex gap-1 border-b border-border">
        {tabs.map(([id, label]) => (
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
      {tab === "risk" && <QuantumRiskPanel />}
      {tab === "plan" && <MigrationPlanPanel />}
      {tab === "tuning" && <TuningPanel />}
      {tab === "correlation" && <CorrelationPanel />}
    </>
  );
}
