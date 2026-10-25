import type { badgeVariants } from "@/shared/ui/badge";

type BadgeVariant = NonNullable<Parameters<typeof badgeVariants>[0]>["variant"];

// Gallery sample only: how a feature would map order states to badge tones.
export const statusVariant = {
  pendingReview: "pending",
  confirmed: "positive",
  completed: "neutral",
  rejected: "negative",
  cancelled: "negative",
} as const satisfies Record<string, BadgeVariant>;

export type SampleStatus = keyof typeof statusVariant;

export const sampleOrders: ReadonlyArray<{
  number: string;
  customer: string;
  status: SampleStatus;
  total: number;
}> = [
  { number: "SNK-0045", customer: "Ana Rodríguez", status: "pendingReview", total: 7500 },
  { number: "SNK-0044", customer: "Luis Mora", status: "confirmed", total: 12000 },
  { number: "SNK-0043", customer: "Sofía Vargas", status: "completed", total: 4500 },
  { number: "SNK-0042", customer: "Diego Castro", status: "rejected", total: 9000 },
  { number: "SNK-0041", customer: "María Jiménez", status: "cancelled", total: 3000 },
];
