import { useMutation } from "@tanstack/react-query";
import type { CartItem } from "../App";
import type { MenuItem } from "../backend";
import { useTransactionStore } from "../state/transactionsStore";
import { useActor } from "./useActor";

export function useCompleteTransaction() {
  const { actor } = useActor();
  const addTransaction = useTransactionStore((state) => state.addTransaction);

  return useMutation({
    mutationFn: async ({
      items,
      total,
      paymentMethod,
    }: {
      items: CartItem[];
      total: number;
      paymentMethod: string;
    }) => {
      if (!actor) throw new Error("Actor not initialized");

      const backendItems: MenuItem[] = items.map((item) => ({
        name: item.name,
        price: item.price,
        category: item.category,
      }));

      await actor.completeTransaction(backendItems, total, paymentMethod);

      const receiptId = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      addTransaction({
        id: receiptId,
        items,
        total,
        paymentMethod,
        timestamp: Date.now(),
      });

      return receiptId;
    },
  });
}
