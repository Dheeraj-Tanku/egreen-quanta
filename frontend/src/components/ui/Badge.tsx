import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export type Severity = "critical" | "high" | "medium" | "low" | "info" | "ok";

const tone: Record<Severity, string> = {
  critical: "bg-critical/15 text-critical ring-critical/30",
  high: "bg-high/15 text-high ring-high/30",
  medium: "bg-medium/15 text-medium ring-medium/30",
  low: "bg-low/15 text-low ring-low/30",
  info: "bg-info/15 text-info ring-info/30",
  ok: "bg-ok/15 text-ok ring-ok/30",
};

export function Badge({
  severity = "info",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { severity?: Severity }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ring-1 ring-inset",
        tone[severity],
        className,
      )}
      {...props}
    />
  );
}
