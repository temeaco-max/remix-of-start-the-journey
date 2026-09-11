import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "./index";

export const Route = createFileRoute("/workspace")({
  head: () => ({ meta: [{ title: "Workspace — Kurukoo" }, { name: "description", content: "Your personal Kurukoo workspace for getting useful things done." }] }),
  component: WorkspacePage,
});

function WorkspacePage() {
  return <HomePage />;
}
