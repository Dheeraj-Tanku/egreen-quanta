import { useState } from "react";

import { PageHeader } from "@/components/ui";
import { cn } from "@/lib/cn";

import { AlertsPanel } from "./AlertsPanel";
import { IncidentsPanel } from "./IncidentsPanel";
import { RulesPanel } from "./RulesPanel";

type Tab = "alerts" | "incidents" | "rules";

export function ThreatsPage() {
  const [tab, setTab] = useState<Tab>("alerts");
  const tabs: [Tab, string][] = [
    ["alerts", "Alerts"],
    ["incidents", "Incidents"],
    ["rules", "Rules"],
  ];

  return (
    <>
      <PageHeader
        title="Threats & Incidents"
        description="Deterministic + history-aware detections over verification events, blended into a risk score and correlated into incidents."
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
      {tab === "alerts" && <AlertsPanel />}
      {tab === "incidents" && <IncidentsPanel />}
      {tab === "rules" && <RulesPanel />}
    </>
  );
}
