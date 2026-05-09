import { tierMeets, type Tier } from "@pis/role-gate";

type RoleGateProps = {
  tier: Tier;
  userTier?: string | null;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function RoleGate({ tier, userTier, children, fallback = null }: RoleGateProps) {
  if (tierMeets(userTier, tier)) return <>{children}</>;
  return <>{fallback}</>;
}

type RoleGateRenderProps = {
  tier: Tier;
  userTier?: string | null;
  children: (hasAccess: boolean) => React.ReactNode;
};

export function RoleGateRender({ tier, userTier, children }: RoleGateRenderProps) {
  return <>{children(tierMeets(userTier, tier))}</>;
}
