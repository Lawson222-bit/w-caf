import { createActor } from "@/backend";
import { useActor as useCaffeineActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useGetRewardPoints(username: string) {
  const { actor, isFetching } = useCaffeineActor(createActor);
  return useQuery<bigint>({
    queryKey: ["rewardPoints", username],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getRewardPoints(username);
    },
    enabled: !!actor && !isFetching && !!username,
  });
}

export function useRedeemForGiftCard() {
  const { actor } = useCaffeineActor(createActor);
  const queryClient = useQueryClient();
  return useMutation<string, Error, { username: string; cardName: string }>({
    mutationFn: async ({ username, cardName }) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.redeemForGiftCard(username, cardName);
      if (result.__kind__ === "ok") return result.ok;
      throw new Error(result.err);
    },
    onSuccess: (_data, { username }) => {
      queryClient.invalidateQueries({ queryKey: ["rewardPoints", username] });
    },
  });
}
