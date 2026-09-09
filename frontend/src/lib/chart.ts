/** Shared Recharts styling that follows the theme tokens. */

export const tooltipStyle: React.CSSProperties = {
  background: "rgb(var(--surface))",
  border: "1px solid rgb(var(--border))",
  borderRadius: 8,
  fontSize: 12,
  color: "rgb(var(--fg))",
};

export const axisTick = { fontSize: 11, fill: "rgb(var(--muted))" };

export const SEVERITY_COLOR: Record<string, string> = {
  critical: "rgb(var(--critical))",
  high: "rgb(var(--high))",
  medium: "rgb(var(--medium))",
  low: "rgb(var(--low))",
  info: "rgb(var(--info))",
  ok: "rgb(var(--ok))",
};

export const BAND_COLOR: Record<string, string> = {
  immediate: "rgb(var(--critical))",
  plan: "rgb(var(--medium))",
  monitor: "rgb(var(--low))",
  ok: "rgb(var(--ok))",
};
