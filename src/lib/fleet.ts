import type { Truck } from "../types";
import { HQ } from "../data/trucks";
export function kilometres(lat: number, lng: number) {
  const r = Math.PI / 180;
  const a =
    Math.sin(((lat - HQ[0]) * r) / 2) ** 2 +
    Math.cos(lat * r) *
      Math.cos(HQ[0] * r) *
      Math.sin(((lng - HQ[1]) * r) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
export function advanceFleet(trucks: Truck[], elapsed = 1, speed = 1): Truck[] {
  return trucks.map((t) => {
    if (t.progress >= 100) return t;
    const remaining = kilometres(t.lat, t.lng);
    const travel =
      (t.speed / 3600) * elapsed * speed * 8 * (t.delayed ? 0.65 : 1);
    const ratio = remaining < 0.04 ? 1 : Math.min(1, travel / remaining);
    return {
      ...t,
      lat: t.lat + (HQ[0] - t.lat) * ratio,
      lng: t.lng + (HQ[1] - t.lng) * ratio,
      progress: Math.min(100, t.progress + (100 - t.progress) * ratio),
      speed: ratio === 1 ? 0 : t.speed,
    };
  });
}
