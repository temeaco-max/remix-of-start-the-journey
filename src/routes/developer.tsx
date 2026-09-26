import { createFileRoute, redirect } from "@tanstack/react-router";

// Compatibility route: the canonical developer surface is /developers.
// This singular alias redirects so no second page owner exists.
export const Route = createFileRoute("/developer")({
  beforeLoad: () => {
    throw redirect({ to: "/developers" });
  },
  head: () => ({
    meta: [
      { title: "Developers — Kurukoo" },
      {
        name: "description",
        content: "Build with Kurukoo's execution layer and integration model.",
      },
    ],
  }),
});
