import { useEffect, type ReactNode } from "react";

import { cn } from "@/lib/cn";

export function Drawer({
  open,
  onClose,
  title,
  children,
  width = "32rem",
  side = "right",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: string;
  side?: "left" | "right";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex bg-black/50",
        side === "right" ? "justify-end" : "justify-start",
      )}
      onMouseDown={onClose}
    >
      <div
        className={cn(
          "flex h-full flex-col bg-surface shadow-2xl",
          side === "right" ? "border-l border-border" : "border-r border-border",
        )}
        style={{ width }}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-fg">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded px-2 py-1 text-muted hover:bg-surface-2 hover:text-fg"
          >
            ✕
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}
