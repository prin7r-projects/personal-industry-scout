import * as React from "react";
import { ScoutWorkspace } from "./scout-workspace";

export const metadata = {
  title: "Scout workspace · Personal Industry Scout",
  description:
    "Onboarding to results: set your watchlist, lock your industries and regions, and read the desk's sample brief — all in one workspace."
};

export const dynamic = "force-static";

export default function ScoutAppPage() {
  return <ScoutWorkspace />;
}
