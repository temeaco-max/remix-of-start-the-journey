import { createFileRoute } from "@tanstack/react-router";
import { AgentsPage } from "@/routes/agents";

export const Route = createFileRoute("/capabilities")({
  head: () => ({
    meta: [{ title: "Capabilities — Kurukoo" }],
  }),
  component: AgentsPage,
});
