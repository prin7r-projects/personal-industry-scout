/** Subscription tiers in ascending access order. */
export type Tier = "operator" | "partner" | "concierge";

/** Numeric ordering for tier comparison. Higher = more access. */
const TIER_RANK: Record<Tier, number> = {
  operator: 0,
  partner: 1,
  concierge: 2,
};

export const TIERS = ["operator", "partner", "concierge"] as const;

const TIER_LABELS: Record<Tier, string> = {
  operator: "Operator",
  partner: "Partner",
  concierge: "Concierge",
};

/**
 * Returns true when `userTier` meets or exceeds `requiredTier`.
 * Unrecognized tiers are treated as "operator" (minimum access).
 */
export function tierMeets(
  userTier: string | null | undefined,
  requiredTier: Tier,
): boolean {
  const userRank = TIER_RANK[userTier as Tier] ?? -1;
  return userRank >= TIER_RANK[requiredTier];
}

/** Human-readable tier name. Falls back to "Operator" for unknown input. */
export function tierLabel(tier: string | null | undefined): string {
  return TIER_LABELS[tier as Tier] ?? "Operator";
}

/**
 * Returns the highest tier from a set of subscription tiers.
 * For use when a user may have multiple active subscriptions.
 */
export function highestTier(tiers: (string | null | undefined)[]): Tier {
  let best: Tier = "operator";
  for (const t of tiers) {
    const rank = TIER_RANK[t as Tier] ?? -1;
    if (rank > TIER_RANK[best]) best = t as Tier;
  }
  return best;
}
