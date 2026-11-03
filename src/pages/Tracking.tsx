import { lazy, Suspense, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { MapPin, Download, TriangleAlert, Radio } from "lucide-react";
import toast from "react-hot-toast";
import { useAppStore } from "../store";
import {
  Badge,
  Button,
  ProgressBar,
  Spinner,
  StatusDot,
} from "../components/ui";
import { distance, download } from "../lib/utils";
const TruckMap = lazy(() => import("../components/modules/TruckMap"));
export default function Tracking() {
  const s = useAppStore();
  const [all, setAll] = useState(false);
  const [params] = useSearchParams();
  useEffect(() => {
    const id = params.get("truck");
    if (id && s.trucks.some((t) => t.id === id)) s.setSelectedTruck(id);
  }, [params]);
  const t = s.trucks.find((t) => t.id === s.selectedTruck)!;
  const order = s.orders.find(
    (o) => o.truckId === t.id && o.status !== "Cancelled",
  );
  const manifest = (order?.items || []).flatMap((item) => {
    const product = s.products.find((p) => p.id === item.productId);
    return product ? [{ ...product, qty: item.qty }] : [];
  });
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow mb-2">LOGISTICS & DISTRIBUTION</p>
          <h1>Live truck tracking</h1>
          <p className="subtext">
            Supplier deliveries, routes and arrival estimates.
          </p>
        </div>
      </div>
      <div className="panel grid grid-cols-1 overflow-hidden xl:h-[calc(100dvh-200px)] xl:min-h-[580px] xl:grid-cols-[220px_minmax(0,1fr)_240px]">
        <section className="max-h-64 overflow-auto border-b-[0.5px] border-edge xl:max-h-none xl:border-b-0 xl:border-r-[0.5px]">
          <header className="flex items-center justify-between p-4">
            <h3>In transit</h3>
            <Badge>{s.trucks.length}</Badge>
          </header>
          {s.trucks.map((tr) => (
            <button
              aria-label={`Track ${tr.id}`}
              key={tr.id}
              onClick={() => {
                s.setSelectedTruck(tr.id);
                setAll(false);
              }}
              className={`w-full border-b-[0.5px] border-edge px-4 py-4 text-left ${tr.id === t.id ? "border-l-[0.5px] border-l-gold bg-gold/5" : "hover:bg-ivory"}`}
            >
              <div className="flex items-center gap-2">
                <StatusDot status={tr.delayed ? "danger" : "success"} />
                <span className="font-medium">{tr.id}</span>
                {tr.delayed && (
                  <span className="ml-auto text-xs text-danger">+2h</span>
                )}
              </div>
              <p className="mb-3 mt-1.5 text-sm text-muted">{tr.name}</p>
              <div className="flex justify-between text-xs">
                <span>ETA {tr.eta}</span>
                <span className="text-muted">
                  {distance(tr.lat, tr.lng)} km left*
                </span>
              </div>
            </button>
          ))}
        </section>
        <div className="relative h-[380px] min-w-0 sm:h-[480px] xl:h-auto">
          <Suspense fallback={<Spinner />}>
            <TruckMap />
          </Suspense>
          <div className="absolute left-3 top-3 z-[400] flex gap-2">
            <Badge variant="success">
              On route:{" "}
              {s.trucks.filter((t) => !t.delayed && t.progress < 100).length}
            </Badge>
            <Badge variant="danger">
              <TriangleAlert aria-hidden size={10} />{" "}
              {s.trucks.filter((t) => t.delayed && t.progress < 100).length}{" "}
              delayed
            </Badge>
          </div>
          <p className="absolute bottom-6 left-3 z-[400] rounded bg-surface/90 px-2 py-1 text-xs text-muted">
            * Straight-line estimate · route schematic
          </p>
        </div>
        <section className="flex flex-col overflow-auto border-t-[0.5px] border-edge p-4 xl:border-l-[0.5px] xl:border-t-0">
          <div className="mb-4">
            <div className="flex justify-between">
              <h2>{t.id}</h2>
              <StatusDot status={t.delayed ? "danger" : "success"} />
            </div>
            <p className="mt-1 text-muted">{t.name}</p>
            <div className="mt-3">
              <Badge variant={t.delayed ? "danger" : "success"}>
                {t.delayed ? "Delayed · +2h" : "On route"}
              </Badge>
            </div>
          </div>
          {t.delayed && (
            <p className="mb-4 rounded bg-danger-tint p-2 text-xs text-danger">
              {t.delayReason}
            </p>
          )}
          <div className="space-y-4">
            {[
              ["Estimated arrival", `${t.eta} CAT`],
              ["Distance left", `${distance(t.lat, t.lng)} km*`],
              ["Departed", `${t.departed} CAT`],
              ["Current speed", `${t.speed} km/h`],
              ["Driver", t.driver],
              ["Plate number", t.plate],
            ].map(([k, v]) => (
              <div className="flex justify-between" key={k}>
                <span className="text-muted">{k}</span>
                <span>{v}</span>
              </div>
            ))}
          </div>
          <div className="my-5">
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-muted">Route progress</span>
              <span>{Math.round(t.progress)}%</span>
            </div>
            <ProgressBar
              value={t.progress}
              color={t.delayed ? "warning" : "success"}
            />
            <p className="mt-3 text-xs leading-5 text-muted">
              <MapPin aria-hidden className="mr-1 inline" size={10} />
              {t.route}
            </p>
          </div>
          <h3 className="mb-1">Delivery manifest</h3>
          <p className="mb-2 text-xs text-muted">
            Order {order?.id || "not assigned"}
          </p>
          {manifest.slice(0, all ? undefined : 4).map((p) => (
            <div
              key={p.id}
              className="border-b-[0.5px] border-edge py-2 text-sm"
            >
              {p.name}
              <span className="float-right text-muted">× {p.qty}</span>
            </div>
          ))}
          {manifest.length > 4 && (
            <button
              aria-label="Toggle full manifest"
              onClick={() => setAll(!all)}
              className="mt-2 text-left text-xs text-gold"
            >
              {all ? "Show less" : `Show all ${manifest.length} products`}
            </button>
          )}
          <div className="mt-auto space-y-2 pt-6">
            <Button
              className="w-full"
              onClick={() =>
                toast(
                  "Supplier alert prepared. Contact " +
                    s.suppliers.find((p) => p.id === t.supplierId)?.phone,
                  { icon: "☎" },
                )
              }
            >
              Alert supplier
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              aria-label="Download manifest"
              onClick={() =>
                download(
                  `${t.id}-manifest.csv`,
                  "Truck,Order,Product,Supplier,Quantity\n" +
                    manifest
                      .map(
                        (p) =>
                          `${t.id},${order?.id || ""},"${p.name}","${p.supplierName}",${p.qty}`,
                      )
                      .join("\n"),
                  "text/csv",
                )
              }
            >
              <Download aria-hidden size={12} /> Download manifest
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}
