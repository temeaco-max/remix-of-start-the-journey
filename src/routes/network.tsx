import { createFileRoute } from "@tanstack/react-router";
import { ProviderWorkspace } from "@/components/kurukoo/provider-workspace";
export const Route = createFileRoute("/network")({ head: () => ({ meta: [{ title: "Network — Kurukoo" }] }), component: ProviderWorkspace });
