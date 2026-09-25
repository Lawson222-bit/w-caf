import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "../App";

export interface Transaction {
  id: string;
  items: CartItem[];
  total: number;
  paymentMethod: string;
  timestamp: number;
}

interface TransactionStore {
  transactions: Transaction[];
  addTransaction: (transaction: Transaction) => void;
  clearTransactions: () => void;
}

export const useTransactionStore = create<TransactionStore>()(
  persist(
    (set) => ({
      transactions: [],
      addTransaction: (transaction) =>
        set((state) => ({
          transactions: [transaction, ...state.transactions],
        })),
      clearTransactions: () => set({ transactions: [] }),
    }),
    {
      name: "pos-transactions",
      version: 1,
    },
  ),
);
