import { createFileRoute, redirect } from "@tanstack/react-router";

// Channel activation states are managed on the authenticated Connect page,
// where users actually make and manage their connections.
export const Route = createFileRoute("/channels")({
  beforeLoad: () => {
    throw redirect({ to: "/connect", replace: true });
  },
});
