import { createPortal } from "react-dom";
import { useEffect, useMemo, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import {
  LocateFixed,
  Navigation,
  Plus,
  Minus,
  Pause,
  Play,
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import { useAppStore } from "../../store";
import { HQ } from "../../data/trucks";
import { money } from "../../lib/utils";
import type { Truck } from "../../types";
const icons = new Map<string, L.DivIcon>();
function truckIcon(t: Truck, selected: boolean) {
  const angle =
    Math.round(
      (Math.atan2(-(HQ[0] - t.lat), HQ[1] - t.lng) * 180) / Math.PI / 15,
    ) * 15;
  const key = `${t.id}-${t.delayed}-${t.progress >= 100}-${selected}-${angle}`;
  const found = icons.get(key);
  if (found) return found;
  const color =
    t.progress >= 100 ? "#6B6B7B" : t.delayed ? "#C0392B" : "#2D7A4F";
  const icon = L.divIcon({
    className: `fleet-marker ${selected ? "fleet-selected" : ""}`,
    html: `<div class="truck-pin"><svg width="30" height="30" viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="13" fill="${color}"/><g transform="rotate(${angle},14,14)" fill="white"><path d="M5 8h11v9H5zM17 11h4l3 4v2h-7z"/><circle cx="8" cy="19" r="2"/><circle cx="20" cy="19" r="2"/></g></svg><span class="truck-label">${t.id}</span></div>`,
    iconSize: [30, 42],
    iconAnchor: [15, 15],
  });
  icons.set(key, icon);
  return icon;
}
const hqIcon = L.divIcon({
  className: "hq-marker",
  html: '<div class="hq-pin">HQ</div>',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});
const roads: [number, number][][] = [
  [[-18.35, 31.15], [-18.15, 31.09], [-18.01, 31.075], [-17.93, 31.05], HQ],
  [[-18.2, 31.1], [-18.09, 31.07], [-17.95, 31.06], HQ],
  [[-18.12, 31.03], [-17.99, 31.03], [-17.9, 31.045], HQ],
  [[-18.05, 30.92], [-17.96, 30.98], [-17.87, 31.02], HQ],
  [[-17.89, 31.24], [-17.89, 31.12], [-17.85, 31.08], HQ],
  [[-17.86, 31.2], [-17.83, 31.14], [-17.82, 31.08], HQ],
];
function Follow({ selected, enabled }: { selected: string; enabled: boolean }) {
  const map = useMap();
  const t = useAppStore((s) => s.trucks.find((t) => t.id === selected));
  const previous = useRef(selected);
  useEffect(() => {
    if (t && previous.current !== selected)
      map.flyTo([t.lat, t.lng], 11, { duration: 0.7 });
    previous.current = selected;
  }, [selected, map]);
  useEffect(() => {
    if (t && enabled && !map.getBounds().pad(-0.2).contains([t.lat, t.lng]))
      map.panTo([t.lat, t.lng], { animate: true, duration: 0.8 });
  }, [t?.lat, t?.lng, enabled, map]);
  return null;
}
function Controls({
  follow,
  setFollow,
  mini,
}: {
  follow: boolean;
  setFollow: (n: boolean) => void;
  mini: boolean;
}) {
  const map = useMap();
  const running = useAppStore((s) => s.simulationRunning),
    setRunning = useAppStore((s) => s.setSimulationRunning);
  const fit = () => {
    setFollow(false);
    return map.fitBounds(
      L.latLngBounds([
        ...useAppStore.getState().trucks.map((t) => L.latLng(t.lat, t.lng)),
        L.latLng(...HQ),
      ]),
      { padding: [40, 40], animate: true },
    );
  };
  return createPortal(
    <div className="absolute right-3 top-3 z-[450] flex flex-col gap-1.5">
      <button
        aria-label={running ? "Pause fleet updates" : "Resume fleet updates"}
        title={running ? "Pause updates" : "Resume updates"}
        className="map-control"
        onClick={() => setRunning(!running)}
      >
        {running ? (
          <Pause aria-hidden size={14} />
        ) : (
          <Play aria-hidden size={14} />
        )}
      </button>
      <button
        title="Fit all trucks"
        aria-label="Fit all trucks on map"
        className="map-control"
        onClick={fit}
      >
        <LocateFixed aria-hidden size={15} />
      </button>
      {!mini && (
        <button
          title="Follow selected truck"
          aria-label="Follow selected truck"
          aria-pressed={follow}
          className={`map-control ${follow ? "!bg-noir !text-gold" : ""}`}
          onClick={() => setFollow(!follow)}
        >
          <Navigation aria-hidden size={14} />
        </button>
      )}
      <button
        aria-label="Zoom map in"
        className="map-control"
        onClick={() => map.zoomIn()}
      >
        <Plus aria-hidden size={15} />
      </button>
      <button
        aria-label="Zoom map out"
        className="map-control"
        onClick={() => map.zoomOut()}
      >
        <Minus aria-hidden size={15} />
      </button>
    </div>,
    map.getContainer().parentElement!,
  );
}
export default function TruckMap({ mini = false }: { mini?: boolean }) {
  const trucks = useAppStore((s) => s.trucks),
    selected = useAppStore((s) => s.selectedTruck),
    setSelected = useAppStore((s) => s.setSelectedTruck);
  const [hasTiles, setHasTiles] = useState(false);
  const [tileError, setTileError] = useState(false),
    [follow, setFollow] = useState(false);
  const bounds = useMemo(
    () =>
      L.latLngBounds([
        ...trucks.map((t) => L.latLng(t.lat, t.lng)),
        L.latLng(...HQ),
      ]),
    [],
  );
  const t = trucks.find((t) => t.id === selected);
  return (
    <div className="relative h-full w-full">
      <MapContainer
        className="venda-map"
        bounds={bounds}
        boundsOptions={{ padding: [35, 35] }}
        zoomControl={false}
        dragging
        scrollWheelZoom={!mini}
        doubleClickZoom
        touchZoom
        keyboard
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          eventHandlers={{
            tileerror: () => setTileError(true),
            tileload: () => {
              setHasTiles(true);
              setTileError(false);
            },
          }}
        />
        {!hasTiles &&
          roads.map((positions, i) => (
            <Polyline
              key={i}
              positions={positions}
              pathOptions={{ color: "#FFFFFF", weight: 7, opacity: 0.85 }}
            />
          ))}
        {!hasTiles &&
          roads.map((positions, i) => (
            <Polyline
              key={`line-${i}`}
              positions={positions}
              pathOptions={{ color: "#B8C6BE", weight: 2, opacity: 0.9 }}
            />
          ))}
        {!mini && t && (
          <Polyline
            positions={[[t.lat, t.lng], HQ]}
            pathOptions={{
              color: "#C9933A",
              weight: 3,
              opacity: 0.9,
              className: "fleet-route",
            }}
          />
        )}
        {trucks.map((tr) => (
          <Marker
            key={tr.id}
            title={`${tr.id} ${tr.name}`}
            alt={tr.id}
            position={[tr.lat, tr.lng]}
            icon={truckIcon(tr, tr.id === selected)}
            eventHandlers={{ click: () => setSelected(tr.id) }}
          >
            <Popup>
              <div className="space-y-1">
                <p className="font-medium">
                  {tr.id} · {tr.name}
                </p>
                <p className="text-sm text-muted">
                  {tr.driver} · {tr.plate}
                </p>
                <p className="text-sm">
                  {tr.progress >= 100
                    ? "Arrived at HQ"
                    : tr.delayed
                      ? "Delayed · " + tr.eta + " ETA"
                      : tr.eta + " ETA"}{" "}
                  · {Math.round(tr.progress)}% complete
                </p>
                <p className="text-xs text-muted">Vehicle position</p>
              </div>
            </Popup>
          </Marker>
        ))}
        <Marker
          title="FreshMark HQ"
          alt="FreshMark HQ"
          position={HQ}
          icon={hqIcon}
        >
          <Popup>FreshMark receiving hub · Harare</Popup>
        </Marker>
        <Controls follow={follow} setFollow={setFollow} mini={mini} />
        {!mini && <Follow selected={selected} enabled={follow} />}
      </MapContainer>
      <div className="pointer-events-none absolute bottom-6 left-3 z-[400] rounded bg-white/90 px-2 py-1 text-xs text-muted">
        {hasTiles
          ? "OpenStreetMap · Harare network"
          : tileError
            ? "Schematic road overlay · map tiles offline"
            : "Schematic road overlay · loading map tiles"}
      </div>
    </div>
  );
}
