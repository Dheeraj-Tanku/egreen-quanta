import type { ReactNode } from "react";

export function EmptyState({
  title,
  hint,
  icon,
}: {
  title: string;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-14 text-center">
      {icon ? <div className="mb-3 text-muted">{icon}</div> : null}
      <p className="text-sm font-medium text-fg">{title}</p>
      {hint ? <p className="mt-1 max-w-sm text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

/** Placeholder for feature areas delivered in a later build module. */
export function ModulePlaceholder({ module, feature }: { module: string; feature: string }) {
  return (
    <EmptyState
      title={`${feature} arrives in ${module}`}
      hint="This screen is wired into routing and the design system now; its data and interactions land with that build module."
    />
  );
}
