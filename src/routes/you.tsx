import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "./index";

export const Route = createFileRoute("/you")({
  head: () => ({
    meta: [
      { title: "For You — Kurukoo" },
      { name: "description", content: "Your personal Kurukoo workspace for what matters now." },
    ],
  }),
  component: HomePage,
});
