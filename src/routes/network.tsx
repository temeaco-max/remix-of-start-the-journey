import { createFileRoute } from "@tanstack/react-router";
import { ProvidersPage } from "@/routes/providers";

export const Route = createFileRoute("/network")({
  head: () => ({
    meta: [{ title: "Network — Kurukoo" }],
  }),
  component: ProvidersPage,
});
