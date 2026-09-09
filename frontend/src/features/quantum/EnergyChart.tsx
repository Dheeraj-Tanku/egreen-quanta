import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { axisTick, tooltipStyle } from "@/lib/chart";
import type { SolverInfo } from "@/types/api";

export function EnergyChart({ solver }: { solver: SolverInfo }) {
  const data = solver.energy_trajectory.map((e, i) => ({ sweep: i, energy: e }));
  return (
    <div>
      <div className="mb-1 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-muted">
        <span>
          method <span className="text-fg">{solver.method}</span>
        </span>
        <span>
          best energy <span className="text-fg tabular-nums">{solver.best_energy}</span>
        </span>
        {solver.optimal != null && (
          <span className={solver.optimal ? "text-ok" : "text-medium"}>
            {solver.optimal ? "optimal (brute-force verified)" : `gap ${solver.optimality_gap}`}
          </span>
        )}
        <span>
          {solver.sweeps} sweeps · seed {solver.seed} · {solver.wall_ms} ms
        </span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ left: -14, right: 8, top: 8 }}>
          <XAxis dataKey="sweep" tick={{ ...axisTick, fontSize: 10 }} />
          <YAxis tick={{ ...axisTick, fontSize: 10 }} width={56} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line
            type="monotone"
            dataKey="energy"
            stroke="rgb(var(--accent))"
            strokeWidth={1.6}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
