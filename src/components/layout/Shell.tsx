import PreviewBanner from "../modules/PreviewBanner";
import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useAppStore } from "../../store";
import { date, today } from "../../lib/utils";
import { Modal } from "../ui";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
export default function Shell() {
  const [menuOpen, setMenuOpen] = useState(false);
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
    <div className="flex h-dvh overflow-hidden bg-ivory [padding-top:env(safe-area-inset-top)] [padding-bottom:env(safe-area-inset-bottom)] [padding-left:env(safe-area-inset-left)] [padding-right:env(safe-area-inset-right)]">
      <div className="hidden h-full shrink-0 lg:block">
        <Sidebar />
      </div>
      {menuOpen && (
        <Modal title="Navigation" drawer onClose={() => setMenuOpen(false)}>
          <Sidebar mobile onNavigate={() => setMenuOpen(false)} />
        </Modal>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <PreviewBanner />
        <Topbar onMenu={() => setMenuOpen(true)} />
        <main
          ref={main}
          className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5 sm:py-[18px]"
        >
          <Outlet />
        </main>
        <footer className="flex shrink-0 flex-wrap justify-between gap-1 px-3 py-2 sm:px-5 text-xs text-muted">
          <span>© {date(today(), "yyyy")} FreshMark Retail Zimbabwe</span>
          <span className="flex items-center gap-1">
            VENDA Operations Intelligence <ArrowUpRight aria-hidden size={10} />
          </span>
        </footer>
      </div>
    </div>
  );
}
