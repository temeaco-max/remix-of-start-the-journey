import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "./index";

export const Route = createFileRoute("/for-you")({
  head: () => ({ meta: [{ title: "For You — Kurukoo" }, { name: "description", content: "Your personal workspace for getting useful things done with Kurukoo." }] }),
  component: HomePage,
});
