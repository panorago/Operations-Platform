import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useAppStore } from "../../store";
import { date, today } from "../../lib/utils";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
export default function Shell() {
  const s = useAppStore();
  useEffect(() => {
    const cleanup = s.startSimulation();
    const id = setInterval(
      () => void s.refresh().catch(() => undefined),
      60000,
    );
    return () => {
      cleanup();
      clearInterval(id);
    };
  }, [s.startSimulation, s.refresh]);
  return (
    <div className="flex h-screen min-w-[1280px] overflow-hidden bg-ivory">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto px-5 py-[18px]">
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
