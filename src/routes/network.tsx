import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/network")({
  head: () => ({ meta: [{ title: "Local Agents & Ambassadors — Kurukoo" }] }),
  component: NetworkRedirect,
});

function NetworkRedirect() {
  return <Navigate to="/agents-ambassadors" replace />;
}
