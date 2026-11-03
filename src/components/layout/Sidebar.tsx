import { isPreview } from "../../lib/runtime";
import { NavLink } from "react-router-dom";
import { ShieldCheck, LogOut } from "lucide-react";
import { useAppStore, useCartStore } from "../../store";
import { api } from "../../lib/api";
import { links } from "./navigation";
export default function Sidebar() {
  const s = useAppStore();
  const unread = s.alerts.filter((a) => !a.read).length;
  return (
    <aside className="flex w-[200px] shrink-0 flex-col bg-noir text-white/40">
      <div className="px-6 pb-8 pt-7">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded bg-gold text-xl text-noir">
            V
          </span>
          <span className="text-xl font-medium tracking-[.22em] text-gold">
            VENDA
          </span>
        </div>
        <p className="mt-3 text-sm text-white/30">FreshMark Zimbabwe</p>
      </div>
      <nav className="flex-1">
        {links
          .filter(
            (l) =>
              s.user?.role === "Admin" ||
              (s.user?.role === "Finance"
                ? !["catalogue", "tracking", "inventory", "settings"].includes(
                    l.path,
                  )
                : !["credits", "settings"].includes(l.path)),
          )
          .map(({ path, label, icon: Icon, group }) => (
            <div key={path}>
              {group && (
                <p className="px-6 pb-3 pt-5 text-xs tracking-[.16em] text-white/20">
                  {group}
                </p>
              )}
              <NavLink
                aria-label={label}
                to={`/${path}`}
                className={({ isActive }) =>
                  `flex items-center gap-3 border-l-2 px-5 py-3 ${isActive ? "border-gold bg-gold/[0.08] text-gold" : "border-transparent hover:bg-white/5 hover:text-white/70"}`
                }
              >
                <Icon aria-hidden size={14} />
                <span>{label}</span>
                {path === "alerts" && unread > 0 && (
                  <span className="ml-auto rounded-full bg-gold px-1.5 text-xs text-noir">
                    {unread}
                  </span>
                )}
              </NavLink>
            </div>
          ))}
      </nav>
      <div className="mx-4 mb-4 rounded-xl border-[0.5px] border-white/10 p-3">
        <ShieldCheck aria-hidden className="mb-2 text-gold" size={17} />
        <p className="text-sm text-white/70">One connected operation.</p>
        <p className="mt-1 text-xs leading-5">
          Built for better retail decisions.
        </p>
      </div>
      <div className="flex items-center gap-2 border-t-[0.5px] border-white/10 p-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/10 text-gold">
          {s.user?.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)}
        </span>
        <div className="flex-1">
          <p className="text-sm text-white/80">{s.user?.name}</p>
          <p className="mt-1 text-xs">{s.user?.role}</p>
        </div>
        <button
          aria-label={isPreview ? "Reload preview" : "Sign out"}
          onClick={() =>
            isPreview
              ? window.location.reload()
              : void api.post("/logout").then(() => {
                  useCartStore.getState().clearCart();
                  useAppStore.setState({ user: null, loaded: false });
                })
          }
        >
          <LogOut aria-hidden size={13} />
        </button>
      </div>
    </aside>
  );
}
