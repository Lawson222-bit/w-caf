import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CustomerOrder {
  id: string;
  customerName: string;
  items: { name: string; price: number; quantity: number }[];
  total: number;
  timestamp: number;
  status: "pending" | "done";
}

interface OrdersStore {
  orders: CustomerOrder[];
  addOrder: (order: CustomerOrder) => void;
  markDone: (id: string) => void;
  clearDone: () => void;
}

export const useOrdersStore = create<OrdersStore>()(
  persist(
    (set) => ({
      orders: [],
      addOrder: (order) =>
        set((state) => ({ orders: [order, ...state.orders] })),
      markDone: (id) =>
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === id ? { ...o, status: "done" as const } : o,
          ),
        })),
      clearDone: () =>
        set((state) => ({
          orders: state.orders.filter((o) => o.status !== "done"),
        })),
    }),
    { name: "wcafe-orders", version: 1 },
  ),
);
