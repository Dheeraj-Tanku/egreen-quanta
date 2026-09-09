import { PageHeader } from "@/components/ui";
import { Card } from "@/components/ui";

const TILES = [
  { label: "Events (24h)", value: "—", hint: "verification events ingested", module: "M3" },
  { label: "Open alerts", value: "—", hint: "awaiting triage", module: "M3" },
  { label: "Quantum-vulnerable", value: "—", hint: "signatures needing PQC migration", module: "M4" },
  { label: "Audit chain", value: "—", hint: "tamper-evident log integrity", module: "M6" },
];

export function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Security Operations Overview"
        description="Digital-signature trust posture, live threats, and quantum-risk at a glance."
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {TILES.map((t) => (
          <Card key={t.label} className="flex flex-col gap-1">
            <span className="text-xs text-muted">{t.label}</span>
            <span className="text-2xl font-semibold tabular-nums text-fg">{t.value}</span>
            <span className="text-[11px] text-muted">
              {t.hint} · <span className="text-primary">{t.module}</span>
            </span>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="mb-2 text-sm font-semibold">Threat timeline</h3>
          <div className="grid h-48 place-items-center text-xs text-muted">
            Populated by the detection engine (M3) and quantum-risk scoring (M4).
          </div>
        </Card>
        <Card>
          <h3 className="mb-2 text-sm font-semibold">Severity mix</h3>
          <div className="grid h-48 place-items-center text-xs text-muted">M3</div>
        </Card>
      </div>
    </>
  );
}
