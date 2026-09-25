import { useQuery } from "@tanstack/react-query";
import type { CustomerCard, CustomerOrder } from "../backend";
import { useActor } from "./useActor";

export interface CustomerProfile {
  orders: CustomerOrder[];
  points: bigint;
  cards: CustomerCard[];
}

export function useCustomerProfile(username: string) {
  const { actor, isFetching } = useActor();

  return useQuery<CustomerProfile>({
    queryKey: ["customerProfile", username],
    queryFn: async () => {
      if (!actor) {
        throw new Error(
          "Backend actor not initialized. Please refresh the page.",
        );
      }
      const result = await actor.getCustomerProfile(username);
      if (result.__kind__ === "err") {
        throw new Error(result.err);
      }
      return result.ok;
    },
    enabled: !!actor && !isFetching && !!username,
  });
}
