import { createFileRoute } from "@tanstack/react-router";
import { ForYouHomePage } from "@/components/kurukoo/for-you-home";

export const Route = createFileRoute("/for-you")({
  head: () => ({
    meta: [
      { title: "For You — Kurukoo" },
      { name: "description", content: "Your personal workspace for getting useful things done with Kurukoo." },
    ],
  }),
  component: ForYouHomePage,
});
