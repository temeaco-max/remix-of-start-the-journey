import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "./index";

// Canonical authenticated landing surface: /you (For You).
export const Route = createFileRoute("/you")({
  head: () => ({ meta: [{ title: "For You — Kurukoo" }, { name: "description", content: "Your personal view for getting useful things done with Kurukoo." }] }),
  component: HomePage,
});
