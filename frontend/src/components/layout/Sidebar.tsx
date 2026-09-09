import { NavLink } from "react-router-dom";

import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";

import { NAV_ITEMS } from "./navigation";

function Icon({ path }: { path: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[18px] w-[18px] shrink-0"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

export function Sidebar() {
  const { atLeast } = useAuth();
  const items = NAV_ITEMS.filter((i) => {
    if (i.to === "/admin") return atLeast("admin");
    if (i.to === "/audit") return atLeast("auditor");
    return true;
  });

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-surface/60 px-3 py-4 md:flex">
      <div className="mb-6 flex items-center gap-2 px-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
            <path
              d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6l-8-4Z"
              stroke="currentColor"
              strokeWidth={1.6}
            />
            <circle cx="12" cy="11" r="2.5" stroke="currentColor" strokeWidth={1.6} />
          </svg>
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-fg">Egreen Quanta</div>
          <div className="text-[10px] uppercase tracking-widest text-muted">SOC</div>
        </div>
      </div>

      <nav className="flex flex-col gap-0.5">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary/15 text-fg"
                  : "text-muted hover:bg-surface-2/70 hover:text-fg",
              )
            }
          >
            <Icon path={item.icon} />
            <span className="flex-1">{item.label}</span>
            {item.module ? (
              <span className="rounded bg-surface-2 px-1 text-[9px] font-medium text-muted opacity-0 transition-opacity group-hover:opacity-100">
                {item.module}
              </span>
            ) : null}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto px-2 pt-4 text-[10px] text-muted">
        v0.1.0 · PS-141 · SIH 2026
      </div>
    </aside>
  );
}
