import { create } from "zustand";
import { persist } from "zustand/middleware";
import toast from "react-hot-toast";
import { api, errorMessage } from "../lib/api";
import { seed } from "../data";
import { daysLeft, orderTotals } from "../lib/utils";
import type { AppState, Store, CartStore, User } from "../types";
let simulation: ReturnType<typeof setInterval> | undefined;
let references = 0;
export const useAppStore = create<Store>((set, get) => ({
  ...structuredClone(seed),
  loaded: false,
  user: null,
  needsSetup: false,
  setupProtected: false,
  authChecked: false,
  activeSupplier: "all",
  selectedTruck: "ZW-01",
  aiSuggestion: null,
  aiHidden: false,
  users: [],
  checkAuth: async () => {
    try {
      const { data } = await api.get<{
        user: User | null;
        needsSetup: boolean;
        setupProtected: boolean;
      }>("/auth");
      set({ ...data, authChecked: true });
      if (data.user) await get().refresh();
    } catch (e) {
      set({ authChecked: true });
      toast.error(errorMessage(e));
    }
  },
  refresh: async () => {
    const { data } = await api.get<AppState>("/state");
    set({ ...data, loaded: true });
  },
  command: async (c) => {
    try {
      const { data } = await api.post<AppState>("/commands", c);
      set(data);
      return true;
    } catch (e) {
      toast.error(errorMessage(e));
      return false;
    }
  },
  setActiveSupplier: (activeSupplier) => set({ activeSupplier }),
  setSelectedTruck: (selectedTruck) => set({ selectedTruck }),
  setAiSuggestion: (aiSuggestion) => set({ aiSuggestion, aiHidden: false }),
  clearAiSuggestion: () => set({ aiHidden: true }),
  loadUsers: async () => {
    try {
      const { data } = await api.get<User[]>("/users");
      set({ users: data });
    } catch (e) {
      toast.error(errorMessage(e));
    }
  },
  getBySupplier: (id) => get().products.filter((p) => p.supplierId === id),
  getAlerts: () => get().products.filter((p) => p.stock <= p.reorderLevel),
  getOverdue: () => get().invoices.filter((i) => !i.paid && daysLeft(i) < 0),
  getDueSoon: () =>
    get().invoices.filter(
      (i) => !i.paid && daysLeft(i) >= 0 && daysLeft(i) <= 15,
    ),
  markPaid: (id) =>
    get().command({ type: "payInvoice", id, method: "Bank Transfer" }),
  triggerReminders: () => get().command({ type: "triggerReminders" }),
  markRead: (id) => get().command({ type: "readAlert", id }),
  markAllRead: () => get().command({ type: "readAll" }),
  getUnread: () => get().alerts.filter((a) => !a.read),
  startSimulation: () => {
    references++;
    if (!simulation)
      simulation = setInterval(
        () =>
          set((s) => ({
            trucks: s.trucks.map((t) => ({
              ...t,
              lat: t.lat + (Math.random() - 0.5) * 0.002,
              lng: t.lng + (Math.random() - 0.5) * 0.002,
            })),
          })),
        30000,
      );
    return () => {
      references--;
      if (references === 0 && simulation) {
        clearInterval(simulation);
        simulation = undefined;
      }
    };
  },
}));
export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      paymentMode: "pay",
      addItem: (productId, credit = false, qty = 1) =>
        set((s) => ({
          items: s.items.some((i) => i.productId === productId)
            ? s.items.map((i) =>
                i.productId === productId
                  ? { ...i, qty: i.qty + qty, credit: i.credit || credit }
                  : i,
              )
            : [...s.items, { productId, qty, credit }],
          paymentMode: credit ? "credit" : s.paymentMode,
        })),
      removeItem: (id) =>
        set((s) => ({ items: s.items.filter((i) => i.productId !== id) })),
      updateQty: (id, qty) => {
        if (!Number.isSafeInteger(qty)) return;
        set((s) => ({
          items:
            qty <= 0
              ? s.items.filter((i) => i.productId !== id)
              : s.items.map((i) =>
                  i.productId === id ? { ...i, qty: Math.min(qty, 10000) } : i,
                ),
        }));
      },
      clearCart: () => set({ items: [], paymentMode: "pay" }),
      totals: () => orderTotals(get().items, useAppStore.getState().products),
    }),
    {
      name: "venda-cart",
      partialize: (s) => ({ items: s.items, paymentMode: s.paymentMode }),
    },
  ),
);
export const useSupplierStore = useAppStore;
export const useProductStore = useAppStore;
export const useTruckStore = useAppStore;
export const useInvoiceStore = useAppStore;
export const useAlertStore = useAppStore;
export const useInventoryStore = useAppStore;
