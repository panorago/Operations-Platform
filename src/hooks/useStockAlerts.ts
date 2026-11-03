import { useAppStore } from "../store";
export function useStockAlerts() {
  const products = useAppStore((s) => s.products);
  return products.filter((p) => p.stock <= p.reorderLevel);
}
