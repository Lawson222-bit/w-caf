import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";

export function useAddCardBalance() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      cardId,
      amount,
    }: {
      cardId: string;
      amount: number;
    }) => {
      if (!actor) {
        throw new Error(
          "Backend actor not initialized. Please refresh the page.",
        );
      }
      const result = await actor.addCardBalance(cardId, amount);
      if (result.__kind__ === "err") {
        throw new Error(result.err);
      }
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allCustomerCards"] });
    },
  });
}
