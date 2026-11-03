import { isPreview } from "../../lib/runtime";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell, Menu } from "lucide-react";
import { useAppStore } from "../../store";
import { date, today } from "../../lib/utils";
import { links } from "./navigation";
export default function Topbar({ onMenu }: { onMenu: () => void }) {
  const s = useAppStore();
  const loc = useLocation();
  const navigate = useNavigate();
  const title =
    links.find((l) => loc.pathname === `/${l.path}`)?.label || "VENDA";
  const unread = s.alerts.filter((a) => !a.read).length;
  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b-[0.5px] border-edge bg-surface px-3 sm:px-5">
      <div className="flex items-center gap-3">
        <button
          aria-label="Open navigation"
          aria-haspopup="dialog"
          className="flex h-11 w-11 items-center justify-center lg:hidden"
          onClick={onMenu}
        >
          <Menu aria-hidden size={20} />
        </button>
        <span className="hidden text-muted sm:inline">Workspace</span>
        <span className="hidden text-edge sm:inline">/</span>
        <span>{title}</span>
      </div>
      <div className="flex items-center gap-5">
        <span className="hidden text-sm text-muted md:inline">
          {date(today(), "EEE, dd MMM yyyy")} · CAT
        </span>
        <span className="hidden items-center gap-1.5 text-xs text-success sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          {isPreview ? "On-device storage" : "System connected"}
        </span>
        <button
          aria-label={`${unread} unread notifications`}
          className="flex min-h-11 items-center gap-1 border-l-[0.5px] border-edge pl-4"
          onClick={() => navigate("/alerts")}
        >
          <Bell aria-hidden size={15} />
          <span className="text-xs text-gold">{unread}</span>
        </button>
      </div>
    </header>
  );
}
