import { useState } from "react";
import { Outlet } from "react-router-dom";

import { useAlertStream } from "@/lib/useAlertStream";

import { MobileNav, Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppShell() {
  const [navOpen, setNavOpen] = useState(false);
  const { connected } = useAlertStream();

  return (
    <div className="flex h-full">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[60] focus:rounded focus:bg-primary focus:px-3 focus:py-1.5 focus:text-sm focus:text-primary-fg"
      >
        Skip to content
      </a>
      <Sidebar />
      <MobileNav open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setNavOpen(true)} streamConnected={connected} />
        <main id="main" className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
