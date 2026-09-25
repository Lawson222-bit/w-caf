import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MenuItem } from "../backend";
import { useActor } from "./useActor";

export function useMenu() {
  const { actor, isFetching } = useActor();

  return useQuery<MenuItem[]>({
    queryKey: ["menu"],
    queryFn: async () => {
      if (!actor) {
        throw new Error(
          "Backend actor not initialized. Please refresh the page.",
        );
      }
      return actor.getMenu();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddMenuItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      price,
      category,
    }: {
      name: string;
      price: number;
      category: string | null;
    }) => {
      if (!actor) {
        throw new Error(
          "Backend actor not initialized. Please refresh the page.",
        );
      }
      await actor.addMenuItem(name, price, category);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu"] });
    },
  });
}

export function useEditMenuItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      index,
      name,
      price,
      category,
    }: {
      index: number;
      name: string;
      price: number;
      category: string | null;
    }) => {
      if (!actor) {
        throw new Error(
          "Backend actor not initialized. Please refresh the page.",
        );
      }
      await actor.editMenuItem(BigInt(index), name, price, category);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu"] });
    },
  });
}

export function useRemoveMenuItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (index: number) => {
      if (!actor) {
        throw new Error(
          "Backend actor not initialized. Please refresh the page.",
        );
      }
      await actor.removeMenuItem(BigInt(index));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu"] });
    },
  });
}
