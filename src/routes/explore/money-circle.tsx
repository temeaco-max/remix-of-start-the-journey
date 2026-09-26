import { createFileRoute } from "@tanstack/react-router";
import { MoneyCircleStepper } from "@/components/kurukoo/money-circle-stepper";

export const Route = createFileRoute("/explore/money-circle")({
  head: () => ({
    meta: [
      { title: "Money Circle — Kurukoo" },
      {
        name: "description",
        content:
          "Start or manage a savings circle with Kurukoo and keep track of who contributes what.",
      },
    ],
  }),
  component: MoneyCirclePage,
});

function MoneyCirclePage() {
  return <MoneyCircleStepper />;
}
