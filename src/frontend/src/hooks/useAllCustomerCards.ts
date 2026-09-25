import { useQuery } from "@tanstack/react-query";
import type { CustomerCard } from "../backend";
import { useActor } from "./useActor";

export function useAllCustomerCards() {
  const { actor, isFetching } = useActor();

  return useQuery<CustomerCard[]>({
    queryKey: ["allCustomerCards"],
    queryFn: async () => {
      if (!actor) {
        throw new Error(
          "Backend actor not initialized. Please refresh the page.",
        );
      }
      return actor.getAllCustomerCards();
    },
    enabled: !!actor && !isFetching,
  });
}
