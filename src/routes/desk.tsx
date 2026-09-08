import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "./index";

export const Route = createFileRoute("/desk")({
  head: () => ({
    meta: [
      { title: "Everyday AI OS for real life" },
      { name: "description", content: "Your personal workspace for getting useful things done with Kurukoo." },
    ],
  }),
  component: HomePage,
});
