import type { ReactNode } from "react";

/** Content wrapper retained for legacy marketing routes; the root route supplies the canonical public OS shell. */
export function MarketingPage({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
