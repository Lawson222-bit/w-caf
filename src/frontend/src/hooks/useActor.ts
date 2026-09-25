import { createActor } from "@/backend";
import { useActor as useCaffeineActor } from "@caffeineai/core-infrastructure";

export function useActor() {
  return useCaffeineActor(createActor);
}
