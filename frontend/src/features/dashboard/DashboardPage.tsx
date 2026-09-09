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
import { axisTick, BAND_COLOR, SEVERITY_COLOR as SEV_COLOR, tooltipStyle } from "@/lib/chart";
import { formatNumber } from "@/lib/format";
import type { ThreatStats } from "@/types/api";

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
                <XAxis dataKey="date" tick={axisTick} />
                <YAxis tick={axisTick} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="valid"
                  stackId="1"
                  stroke="rgb(var(--ok))"
                  fill="rgb(var(--ok) / 0.25)"
                />
                <Area
                  type="monotone"
                  dataKey="indeterminate"
                  stackId="1"
                  stroke="rgb(var(--medium))"
                  fill="rgb(var(--medium) / 0.25)"
                />
                <Area
                  type="monotone"
                  dataKey="invalid"
                  stackId="1"
                  stroke="rgb(var(--critical))"
                  fill="rgb(var(--critical) / 0.3)"
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
                    <Cell key={d.name} fill={SEV_COLOR[d.name] ?? "rgb(var(--muted))"} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
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

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card>
          <h3 className="mb-2 text-sm font-semibold">Top detections (24h)</h3>
          {data.top_rules.length === 0 ? (
            <p className="text-xs text-muted">No findings in the last 24 hours.</p>
          ) : (
            <ul className="space-y-1.5">
              {data.top_rules.map((r) => {
                const max = data.top_rules[0].count || 1;
                return (
                  <li key={r.code} className="flex items-center gap-2 text-xs">
                    <span className="w-10 font-mono text-muted">{r.code}</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                      <span
                        className="block h-full rounded-full bg-primary"
                        style={{ width: `${(r.count / max) * 100}%` }}
                      />
                    </span>
                    <span className="w-6 text-right tabular-nums text-fg">{r.count}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Recent alerts</h3>
            <Link to="/threats" className="text-xs text-primary">
              all →
            </Link>
          </div>
          {data.recent_alerts.length === 0 ? (
            <p className="text-xs text-muted">No alerts yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {data.recent_alerts.map((a) => (
                <li key={a.id} className="flex items-center gap-2 text-xs">
                  <span
                    className="inline-block h-2 w-2 shrink-0 rounded-full"
                    style={{ background: SEV_COLOR[a.severity] ?? "rgb(var(--muted))" }}
                  />
                  <span className="flex-1 truncate text-fg" title={a.title}>
                    {a.title}
                  </span>
                  <span className="tabular-nums text-muted">{a.risk_score}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Post-quantum exposure</h3>
            <Link to="/quantum" className="text-xs text-primary">
              lab →
            </Link>
          </div>
          {Object.keys(data.pqc_by_band).length === 0 ? (
            <p className="text-xs text-muted">
              Score the portfolio in the Quantum Lab to populate this.
            </p>
          ) : (
            <div className="space-y-1.5">
              {(["immediate", "plan", "monitor", "ok"] as const).map((band) => {
                const n = data.pqc_by_band[band] ?? 0;
                const total = Object.values(data.pqc_by_band).reduce((s, x) => s + x, 0) || 1;
                const color = BAND_COLOR[band];
                return (
                  <div key={band} className="flex items-center gap-2 text-xs">
                    <span className="w-16 text-muted">{band}</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                      <span
                        className="block h-full rounded-full"
                        style={{ width: `${(n / total) * 100}%`, background: color }}
                      />
                    </span>
                    <span className="w-6 text-right tabular-nums text-fg">{n}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
