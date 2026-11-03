import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useAppStore } from "../../store";
import { HQ } from "../../data/trucks";
const marker = (delayed = false, hq = false) =>
  L.divIcon({
    className: "venda-marker",
    html: `<div class="map-dot ${delayed ? "delayed" : ""} ${hq ? "hq" : ""}"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
function Follow({ selected }: { selected?: string }) {
  const map = useMap();
  const t = useAppStore((s) => s.trucks.find((t) => t.id === selected));
  useEffect(() => {
    if (t) map.flyTo([t.lat, t.lng], 11, { duration: 0.7 });
  }, [selected, map]);
  return null;
}
export default function TruckMap({ mini = false }: { mini?: boolean }) {
  const { trucks, selectedTruck, setSelectedTruck } = useAppStore();
  const t = trucks.find((t) => t.id === selectedTruck);
  const [tileError, setTileError] = useState(false);
  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={mini ? undefined : [-18.01, 31.08]}
        zoom={mini ? undefined : 10}
        bounds={
          mini
            ? L.latLngBounds([
                ...trucks.map((t) => L.latLng(t.lat, t.lng)),
                L.latLng(...HQ),
              ])
            : undefined
        }
        boundsOptions={{ padding: [22, 22] }}
        zoomControl={!mini}
        dragging={!mini}
        scrollWheelZoom={!mini}
        doubleClickZoom={!mini}
        touchZoom={!mini}
        keyboard={!mini}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          eventHandlers={{
            tileerror: () => setTileError(true),
            tileload: () => setTileError(false),
          }}
        />
        {trucks.map((t) => (
          <Marker
            key={t.id}
            title={t.id}
            alt={t.id}
            interactive={!mini}
            position={[t.lat, t.lng]}
            icon={marker(t.delayed)}
            eventHandlers={mini ? {} : { click: () => setSelectedTruck(t.id) }}
          >
            <Popup>
              <strong>{t.id}</strong>
              <br />
              {t.name} · ETA {t.eta}
              <br />
              Simulated location
            </Popup>
          </Marker>
        ))}
        <Marker
          title="FreshMark HQ"
          alt="FreshMark HQ"
          interactive={!mini}
          position={HQ}
          icon={marker(false, true)}
        >
          <Popup>FreshMark HQ · Harare</Popup>
        </Marker>
        {!mini && t && (
          <Polyline
            positions={[[t.lat, t.lng], HQ]}
            pathOptions={{ color: "#C9933A", weight: 2, dashArray: "5 8" }}
          />
        )}
        {!mini && <Follow selected={selectedTruck} />}
      </MapContainer>
      {tileError && (
        <p
          role="status"
          className="pointer-events-none absolute bottom-9 right-2 z-[400] rounded bg-surface/90 px-2 py-1 text-xs text-muted"
        >
          Map tiles unavailable · check network access
        </p>
      )}
    </div>
  );
}
