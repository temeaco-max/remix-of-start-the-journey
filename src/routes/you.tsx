import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/you")({
  beforeLoad: () => { throw redirect({ to: "/workspace" }); },
  head: () => ({ meta: [{ title: "Workspace — Kurukoo" }, { name: "description", content: "Your personal Kurukoo workspace for getting useful things done." }] }),
});
