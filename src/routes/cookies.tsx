import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/cookies")({
  loader: () => { throw redirect({ to: "/legal/$section", params: { section: "cookies" } }); },
  component: () => null,
});
