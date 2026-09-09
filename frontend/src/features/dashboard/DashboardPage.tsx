import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, LoadingPane, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import type { ThreatStats } from "@/types/api";

const SEV_COLOR: Record<string, string> = {
  critical: "rgb(244 63 94)",
  high: "rgb(251 146 60)",
  medium: "rgb(250 204 21)",
  low: "rgb(96 165 250)",
  info: "rgb(129 140 248)",
};

export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["threat-stats"],
    queryFn: () => api.get<ThreatStats>("/threats/stats"),
    refetchInterval: 15_000,
  });

  if (isLoading || !data) {
    return (
      <>
        <PageHeader title="Security Operations Overview" />
        <LoadingPane />
      </>
    );
  }

  const mttt =
    data.mean_time_to_triage_seconds == null
      ? "—"
      : `${Math.round(data.mean_time_to_triage_seconds / 60)}m`;
  const donut = Object.entries(data.alerts_by_severity).map(([name, value]) => ({ name, value }));

  const tiles = [
    { label: "Events (24h)", value: formatNumber(data.events_24h), hint: `${formatNumber(data.events_total)} total` },
    { label: "Invalid (24h)", value: formatNumber(data.invalid_24h), hint: "failed verification" },
    { label: "Open alerts", value: formatNumber(data.open_alerts), hint: `${data.open_incidents} open incidents` },
    { label: "Quantum-vulnerable", value: formatNumber(data.quantum_vulnerable_events), hint: "RSA/ECC events · see Quantum Lab" },
    { label: "Mean time to triage", value: mttt, hint: "open → triaged" },
  ];

  return (
    <>
      <PageHeader
        title="Security Operations Overview"
        description="Digital-signature trust posture, live threats, and quantum-risk at a glance."
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {tiles.map((t) => (
          <Card key={t.label} className="flex flex-col gap-1">
            <span className="text-xs text-muted">{t.label}</span>
            <span className="text-2xl font-semibold tabular-nums text-fg">{t.value}</span>
            <span className="text-[11px] text-muted">{t.hint}</span>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Verification timeline (7 days)</h3>
            <Link to="/threats" className="text-xs text-primary">
              alerts →
            </Link>
          </div>
          {data.timeline.length === 0 ? (
            <div className="grid h-52 place-items-center text-xs text-muted">
              No events yet — verify a signature to populate.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.timeline} margin={{ left: -20, right: 8, top: 8 }}>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "rgb(138 150 170)" }} />
                <YAxis tick={{ fontSize: 11, fill: "rgb(138 150 170)" }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "rgb(15 20 30)",
                    border: "1px solid rgb(38 48 68)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="valid"
                  stackId="1"
                  stroke="rgb(52 211 153)"
                  fill="rgb(52 211 153 / 0.25)"
                />
                <Area
                  type="monotone"
                  dataKey="indeterminate"
                  stackId="1"
                  stroke="rgb(250 204 21)"
                  fill="rgb(250 204 21 / 0.25)"
                />
                <Area
                  type="monotone"
                  dataKey="invalid"
                  stackId="1"
                  stroke="rgb(244 63 94)"
                  fill="rgb(244 63 94 / 0.3)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <h3 className="mb-1 text-sm font-semibold">Open alerts by severity</h3>
          {donut.length === 0 ? (
            <div className="grid h-52 place-items-center text-xs text-muted">No open alerts</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={donut}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={52}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {donut.map((d) => (
                    <Cell key={d.name} fill={SEV_COLOR[d.name] ?? "rgb(138 150 170)"} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "rgb(15 20 30)",
                    border: "1px solid rgb(38 48 68)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
            {donut.map((d) => (
              <span key={d.name} className="flex items-center gap-1">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: SEV_COLOR[d.name] }}
                />
                {d.name} {d.value}
              </span>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
