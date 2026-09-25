import { createActor } from "@/backend";
import type { CustomerCard } from "@/backend";
import { useActor as useCaffeineActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useCustomerCards(username: string, password: string) {
  const { actor, isFetching } = useCaffeineActor(createActor);
  return useQuery<CustomerCard[]>({
    queryKey: ["customerCards", username],
    queryFn: async () => {
      if (!actor) return [];
      const result = await actor.getCustomerCards(username, password);
      if (result.__kind__ === "ok") return result.ok;
      throw new Error(result.err);
    },
    enabled: !!actor && !isFetching && !!username && !!password,
  });
}

export function useAllCustomerCards() {
  const { actor, isFetching } = useCaffeineActor(createActor);
  return useQuery<CustomerCard[]>({
    queryKey: ["allCustomerCards"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllCustomerCards();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCustomerCardPayment() {
  const { actor } = useCaffeineActor(createActor);
  const queryClient = useQueryClient();
  return useMutation<CustomerCard, Error, { cardId: string; amount: number }>({
    mutationFn: async ({ cardId, amount }) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.addCardBalance(cardId, -amount);
      if (result.__kind__ === "ok") return result.ok;
      throw new Error(result.err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allCustomerCards"] });
    },
  });
}

export function useGenerateCustomerCard() {
  const { actor } = useCaffeineActor(createActor);
  const queryClient = useQueryClient();
  return useMutation<
    CustomerCard,
    Error,
    { username: string; password: string; cardName: string; cardColor: string }
  >({
    mutationFn: async ({ username, password, cardName, cardColor }) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.generateCustomerCard(
        username,
        password,
        cardName,
        cardColor,
      );
      if (result.__kind__ === "ok") return result.ok;
      throw new Error(result.err);
    },
    onSuccess: (_data, { username }) => {
      queryClient.invalidateQueries({ queryKey: ["customerCards", username] });
    },
  });
}
