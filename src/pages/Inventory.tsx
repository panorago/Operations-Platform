import Select from "../components/ui/Select";
import MonitorPanel from "../components/modules/MonitorPanel";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, CheckCircle, TriangleAlert, PackageX } from "lucide-react";
import { useAppStore, useCartStore } from "../store";
import {
  Badge,
  Button,
  DataTable,
  MetricCard,
  ProgressBar,
} from "../components/ui";
import { date, stockStatus } from "../lib/utils";
import type { Product } from "../types";
import toast from "react-hot-toast";
export default function Inventory() {
  const s = useAppStore();
  const navigate = useNavigate();
  const [q, setQ] = useState(""),
    [supplier, setSupplier] = useState("all"),
    [category, setCategory] = useState("all"),
    [issues, setIssues] = useState(false);

  const rows = s.products.filter(
    (p) =>
      p.name.toLowerCase().includes(q.toLowerCase()) &&
      (supplier === "all" || p.supplierId === supplier) &&
      (category === "all" || p.category === category) &&
      (!issues || p.stock <= p.reorderLevel),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow mb-2">SHELF HEALTH & REPLENISHMENT</p>
          <h1>Inventory</h1>
          <p className="subtext">
            A clear view of every product. Act before shelves go empty.
          </p>
        </div>
      </div>
      <div className="mb-4 grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total SKUs", value: s.products.length, icon: Package },
          {
            label: "In stock",
            value: s.products.filter((p) => p.stock > p.reorderLevel).length,
            icon: CheckCircle,
          },
          {
            label: "Low stock",
            value: s.products.filter(
              (p) => p.stock > 0 && p.stock <= p.reorderLevel,
            ).length,
            icon: TriangleAlert,
          },
          {
            label: "Out of stock",
            value: s.products.filter((p) => !p.stock).length,
            icon: PackageX,
          },
        ].map((m) => (
          <MetricCard
            key={m.label}
            label={m.label}
            value={m.value.toString().padStart(2, "0")}
            sub="Across all six supplier categories"
            icon={<m.icon aria-hidden size={15} />}
          />
        ))}
      </div>
      <div className="mb-5">
        <MonitorPanel />
      </div>
      <div className="panel">
        <div className="toolbar px-4">
          <input
            aria-label="Search inventory"
            placeholder="Search inventory…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Select
            aria-label="Inventory supplier"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
          >
            <option value="all">All suppliers</option>
            {s.suppliers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Inventory category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">All categories</option>
            {[...new Set(s.products.map((p) => p.category))].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
          <label className="flex items-center gap-2 text-muted">
            <input
              type="checkbox"
              checked={issues}
              onChange={(e) => setIssues(e.target.checked)}
            />
            Issues only
          </label>
          <span className="ml-auto text-sm text-muted">
            {rows.length} products
          </span>
        </div>
        <DataTable<Product>
          data={rows}
          columns={[
            {
              key: "name",
              label: "Product",
              sortValue: (p) => p.name,
              render: (p) => <span className="font-medium">{p.name}</span>,
            },
            {
              key: "supplier",
              label: "Supplier",
              render: (p) => p.supplierName,
            },
            { key: "category", label: "Category", render: (p) => p.category },
            {
              key: "stock",
              label: "In stock",
              sortValue: (p) => p.stock,
              render: (p) => (
                <span className={!p.stock ? "text-danger" : ""}>{p.stock}</span>
              ),
            },
            {
              key: "reorder",
              label: "Reorder level",
              render: (p) => p.reorderLevel,
            },
            {
              key: "bar",
              label: "Stock health",
              render: (p) => (
                <div className="w-20">
                  <ProgressBar
                    value={(p.stock / (p.reorderLevel * 2)) * 100}
                    color={
                      !p.stock
                        ? "danger"
                        : p.stock <= p.reorderLevel
                          ? "warning"
                          : "success"
                    }
                  />
                </div>
              ),
            },
            {
              key: "status",
              label: "Status",
              render: (p) => (
                <Badge
                  variant={
                    !p.stock
                      ? "danger"
                      : p.stock <= p.reorderLevel
                        ? "warning"
                        : "success"
                  }
                >
                  {stockStatus(p)}
                </Badge>
              ),
            },
            {
              key: "updated",
              label: "Last updated",
              render: (p) => date(p.updatedAt, "dd MMM · HH:mm"),
            },
            {
              key: "action",
              label: "Action",
              render: (p) =>
                p.stock <= p.reorderLevel ? (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      useCartStore
                        .getState()
                        .addItem(
                          p.id,
                          false,
                          Math.max(1, p.reorderLevel - p.stock),
                        );
                      s.setActiveSupplier(p.supplierId);
                      toast.success("Reorder quantity added");
                      navigate("/catalogue");
                    }}
                  >
                    Reorder
                  </Button>
                ) : (
                  <span className="text-muted">—</span>
                ),
            },
          ]}
        />
      </div>
    </>
  );
}
