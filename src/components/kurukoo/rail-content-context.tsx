import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

/**
 * Context interface that lets authenticated route components register
 * custom content for the Trusted Context rail.
 *
 * When a route sets rail content, ContextualTrustedRail renders it
 * instead of its default route-based content. When no override is
 * active (content === null), the rail falls back to its default
 * behaviour.
 */
type RailContentValue = {
  content: ReactNode | null;
  setContent: (node: ReactNode | null) => void;
};

const RailContentContext = createContext<RailContentValue | undefined>(undefined);

export function RailContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<ReactNode | null>(null);
  const setContentStable = useCallback((node: ReactNode | null) => {
    setContent(node);
  }, []);
  return (
    <RailContentContext.Provider value={{ content, setContent: setContentStable }}>
      {children}
    </RailContentContext.Provider>
  );
}

/**
 * Hook for route components to register (or clear) rail takeover content.
 * Call in a useEffect and return a cleanup that calls `clearRailContent()`.
 */
export function useRailContent() {
  const ctx = useContext(RailContentContext);
  if (!ctx) {
    throw new Error("useRailContent must be used within a RailContentProvider");
  }
  return ctx;
}

/** Convenience hook that returns just the content node (or null). */
export function useRailContentNode(): ReactNode | null {
  const ctx = useContext(RailContentContext);
  return ctx?.content ?? null;
}
