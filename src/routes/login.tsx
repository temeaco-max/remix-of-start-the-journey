import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthPanel } from "@/components/kurukoo/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — Kurukoo" },
      { name: "description", content: "Log in to Kurukoo and pick up where you left off." },
      { property: "og:title", content: "Log in — Kurukoo" },
      { property: "og:description", content: "Log in to Kurukoo." },
      { property: "og:url", content: "/login" },
    ],
    links: [{ rel: "canonical", href: "/login" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <AuthPanel
      title="Welcome back"
      subtitle="Log in to see what Kurukoo has been getting on with."
      cta="Log in"
      footer={
        <>
          New here?{" "}
          <Link to="/signup" className="underline">
            Create an account
          </Link>
        </>
      }
    />
  );
}
