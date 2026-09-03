import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy route: Notifications was merged into the Activity surface.
export const Route = createFileRoute("/notifications")({
  beforeLoad: () => {
    throw redirect({ to: "/activity" });
  },
});
