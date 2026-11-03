import type { Column } from "../../types";
import {
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import {
  X,
  ArrowUpRight,
  PackageOpen,
  Loader2,
  ChevronDown,
} from "lucide-react";
const accessibleText = (node: ReactNode): string =>
  typeof node === "string" || typeof node === "number"
    ? String(node)
    : Array.isArray(node)
      ? node.map(accessibleText).join(" ")
      : isValidElement<{ children?: ReactNode }>(node)
        ? accessibleText(node.props.children)
        : "";
export function Button({
  variant = "primary",
  children,
  ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "destructive" | "ghost";
}) {
  return (
    <button
      {...p}
      aria-label={
        p["aria-label"] || accessibleText(children).trim() || undefined
      }
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded px-3 py-2 sm:min-h-0 sm:px-4 text-base font-medium transition-colors ${variant === "primary" ? "bg-noir text-gold hover:bg-noir/90" : variant === "destructive" ? "bg-danger text-white" : variant === "secondary" ? "border-[0.5px] border-edge bg-surface text-muted hover:bg-ivory" : "text-muted hover:bg-ivory"} ${p.className || ""}`}
    >
      {children}
    </button>
  );
}
export function Badge({
  children,
  variant = "neutral",
}: {
  children: ReactNode;
  variant?: string;
}) {
  return (
    <span
      className={`inline-flex self-start items-center gap-1 whitespace-nowrap rounded-full px-1.5 py-0.5 text-xs font-medium ${variant === "success" ? "bg-success-tint text-success" : variant === "danger" ? "bg-danger-tint text-danger" : variant === "info" ? "bg-blue-50 text-blue-700" : variant === "warning" || variant === "gold" ? "bg-gold/10 text-gold" : "bg-ivory text-muted"}`}
    >
      {children}
    </span>
  );
}
export const StatusDot = ({
  status = "success",
  size = "sm",
}: {
  status?: string;
  size?: "sm" | "md";
}) => (
  <span
    aria-hidden
    className={`inline-block ${size === "md" ? "h-2 w-2" : "h-1.5 w-1.5"} shrink-0 rounded-full ${["danger", "offline"].includes(status) ? "bg-danger" : ["warning", "amber"].includes(status) ? "bg-gold" : "bg-success"}`}
  />
);
export function ProgressBar({
  value,
  color = "success",
}: {
  value: number;
  color?: string;
}) {
  return (
    <svg
      role="progressbar"
      aria-label="Progress"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      viewBox="0 0 100 1"
      preserveAspectRatio="none"
      className="h-1 w-full overflow-hidden rounded-full bg-edge"
    >
      <rect
        width={Math.max(0, Math.min(100, value))}
        height="1"
        className={
          color === "danger"
            ? "fill-danger"
            : color === "warning"
              ? "fill-gold"
              : "fill-success"
        }
      />
    </svg>
  );
}
export function MetricCard({
  label,
  value,
  sub,
  trend,
  icon,
}: {
  label: string;
  value: ReactNode;
  sub: ReactNode;
  trend?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="panel p-3">
      <div className="flex items-center justify-between">
        <span className="eyebrow">{label}</span>
        <span className="text-gold">{icon}</span>
      </div>
      <div className="mb-2 mt-4 flex items-center justify-between">
        <span className="text-2xl font-medium">{value}</span>
        {trend && (
          <Badge variant="success">
            <ArrowUpRight aria-hidden size={10} />
            {trend}
          </Badge>
        )}
      </div>
      <div className="text-sm text-muted">{sub}</div>
    </div>
  );
}
export const Spinner = () => (
  <div role="status" aria-label="Loading" className="flex justify-center p-8">
    <Loader2 aria-hidden className="animate-spin text-gold" size={22} />
  </div>
);
export function EmptyState({
  title = "Nothing here yet",
  description = "Try adjusting your filters.",
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 p-10 text-center">
      <PackageOpen aria-hidden className="text-gold" size={28} />
      <h3>{title}</h3>
      <p className="text-muted">{description}</p>
      {action}
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
  footer,
  drawer = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  drawer?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const handler = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (e.key === "Escape") {
        if (document.querySelector("[data-venda-select-content]")) return;
        closeRef.current();
      }
      if (e.key === "Tab") {
        const nodes = ref.current?.querySelectorAll<HTMLElement>(
          'button,input,select,textarea,a[href],[tabindex="0"]',
        );
        if (!nodes?.length) return;
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    ref.current?.focus();
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className={`fixed inset-0 z-[1000] flex bg-noir/30 ${drawer ? "justify-end" : "items-center justify-center"}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex min-h-0 max-h-[calc(100dvh-1rem)] max-w-[calc(100%-1rem)] flex-col bg-surface outline-none ${drawer ? "h-dvh !max-h-dvh !max-w-full w-full sm:w-[440px] border-l-[0.5px] border-edge" : "w-[470px] rounded-xl border-[0.5px] border-edge"}`}
      >
        <header className="flex shrink-0 items-center justify-between gap-2 border-b-[0.5px] border-edge p-3 sm:p-5">
          <h2>{title}</h2>
          <Button variant="ghost" aria-label="Close dialog" onClick={onClose}>
            <X aria-hidden size={16} />
          </Button>
        </header>
        <div className="min-h-0 overflow-y-auto p-3 sm:p-5">{children}</div>
        {footer && (
          <footer className="shrink-0 border-t-[0.5px] border-edge p-3 sm:p-5">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
export function DataTable<T extends { id: string }>({
  columns,
  data,
  onRow,
}: {
  columns: Column<T>[];
  data: T[];
  onRow?: (row: T) => void;
}) {
  const [sort, setSort] = useState({ key: "", asc: true });
  const column = columns.find((c) => c.key === sort.key);
  const sorted = column?.sortValue
    ? [...data].sort((a, b) => {
        const x = column.sortValue!(a),
          y = column.sortValue!(b);
        return (
          (typeof x === "number" && typeof y === "number"
            ? x - y
            : String(x).localeCompare(String(y))) * (sort.asc ? 1 : -1)
        );
      })
    : data;
  return (
    <div
      role="region"
      aria-label="Scrollable data table"
      tabIndex={0}
      className="max-w-full overflow-x-auto overscroll-x-contain"
    >
      <table className="w-full min-w-[640px] text-base">
        <thead className="bg-ivory/70">
          <tr>
            {columns.map((c) => (
              <th key={c.key}>
                {c.sortValue ? (
                  <button
                    aria-label={`Sort by ${c.label}`}
                    className="flex items-center gap-1"
                    onClick={() =>
                      setSort({
                        key: c.key,
                        asc: sort.key === c.key ? !sort.asc : true,
                      })
                    }
                  >
                    {c.label}
                    <ChevronDown aria-hidden size={10} />
                  </button>
                ) : (
                  c.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr
              key={row.id}
              className={onRow ? "cursor-pointer hover:bg-ivory/50" : ""}
              onClick={() => onRow?.(row)}
            >
              {columns.map((c) => (
                <td key={c.key}>{c.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!data.length && <EmptyState />}
    </div>
  );
}
