import { useMutation } from "@tanstack/react-query";
import type { GiftCard } from "../backend";
import { useActor } from "./useActor";

export function useIssueGiftCard() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({
      code,
      balance,
    }: { code: string; balance: number }) => {
      if (!actor) throw new Error("Actor not initialized");
      await actor.issueGiftCard(code, balance);
    },
  });
}

export function useGetGiftCard() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (code: string): Promise<GiftCard> => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.getGiftCard(code);
    },
  });
}

export function useGiftCardPayment() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ code, amount }: { code: string; amount: number }) => {
      if (!actor) throw new Error("Actor not initialized");
      // biome-ignore lint/correctness/useHookAtTopLevel: actor.useGiftCard is a canister method, not a React hook
      await actor.useGiftCard(code, amount);
    },
  });
}
