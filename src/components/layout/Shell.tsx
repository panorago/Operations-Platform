import PreviewBanner from "../modules/PreviewBanner";
import { useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useAppStore } from "../../store";
import { date, today } from "../../lib/utils";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
export default function Shell() {
  const main = useRef<HTMLElement>(null);
  const location = useLocation();
  useEffect(() => {
    main.current?.scrollTo(0, 0);
  }, [location.pathname]);
  const startSimulation = useAppStore((s) => s.startSimulation),
    refresh = useAppStore((s) => s.refresh),
    refreshMonitor = useAppStore((s) => s.refreshMonitor);
  const s = { startSimulation, refresh, refreshMonitor };
  useEffect(() => {
    const cleanup = s.startSimulation();
    void s.refreshMonitor();
    const id = setInterval(() => {
      void s.refresh().catch(() => undefined);
      void s.refreshMonitor();
    }, 60000);
    return () => {
      cleanup();
      clearInterval(id);
    };
  }, [s.startSimulation, s.refresh]);
  return (
    <div className="flex h-screen min-w-[1280px] overflow-hidden bg-ivory">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <PreviewBanner />
        <Topbar />
        <main ref={main} className="flex-1 overflow-y-auto px-5 py-[18px]">
          <Outlet />
        </main>
        <footer className="flex justify-between px-5 py-2 text-xs text-muted">
          <span>© {date(today(), "yyyy")} FreshMark Retail Zimbabwe</span>
          <span className="flex items-center gap-1">
            VENDA Operations Intelligence <ArrowUpRight aria-hidden size={10} />
          </span>
        </footer>
      </div>
    </div>
  );
}
