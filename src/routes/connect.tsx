import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Cloud, Mail, MessageCircle, Mic, Plug, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { FAQSection } from "@/components/kurukoo/faq-section";
import { Action, actionClass } from "@/components/kurukoo/primitives";
import { Badge, Panel, SectionHeader } from "@/components/kurukoo/ui";
import { fetchConnectedResources, revokeConnectedResource, type ConnectedResource } from "@/lib/kurukoo-api";

export const Route = createFileRoute("/connect")({
  head: () => ({
    meta: [
      { title: "Connect Kurukoo to your services" },
      {
        name: "description",
        content:
          "Connect supported services and resources to Kurukoo with clear permissions. Learn how connected sources can become part of everyday requests and work.",
      },
      { property: "og:title", content: "Connect — Kurukoo" },
      {
        property: "og:description",
        content: "Connect supported services and resources to Kurukoo with clear permissions.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/connect" },
    ],
    links: [{ rel: "canonical", href: "/connect" }],
  }),
  component: ConnectPage,
});

const connectionTypes = [
  {
    title: "Storage",
    body: "Bring authorised files and documents into the context of a request when a supported storage connection is available.",
    examples: "Examples can include Google Drive and other supported storage services.",
    icon: Cloud,
  },
  {
    title: "Messaging",
    body: "Use an authorised communication channel when a supported request needs Kurukoo to reach someone after approval.",
    examples: "Examples can include WhatsApp and other supported messaging channels.",
    icon: MessageCircle,
  },
  {
    title: "Email",
    body: "Keep relevant email communication within the same permission and action model when an email connection is supported.",
    examples: "Permissions are scoped to what the connected service exposes.",
    icon: Mail,
  },
  {
    title: "Calendar",
    body: "Use calendar availability and scheduling context when a supported calendar connection is authorised.",
    examples: "Kurukoo should only treat a calendar as connected when the account has authorised it.",
    icon: CalendarDays,
  },
];

const assistantConnections = [
  {
    name: "ChatGPT",
    description: "An external conversation doorway for asking Kurukoo to help with work.",
  },
  {
    name: "Claude",
    description: "A possible external conversation doorway with scoped Kurukoo context.",
  },
  {
    name: "Grok",
    description: "A possible chat or voice doorway into the Kurukoo request flow.",
  },
  {
    name: "Gemini",
    description: "A possible chat or voice doorway when the connection is supported and authorised.",
  },
];

function ResourceCard({ resource, onRevoke }: { resource: ConnectedResource; onRevoke: (id: string) => void }) {
  const [busy, setBusy] = useState(false);

  async function revoke() {
    if (!window.confirm(`Disconnect ${resource.label} from Kurukoo?`)) return;
    setBusy(true);
    try {
      await revokeConnectedResource(resource.id);
      onRevoke(resource.id);
    } catch {
      // Keep the current connection visible when the server rejects the request.
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-elevated">
          <Plug className="size-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[14px] font-semibold">{resource.label}</p>
            <Badge tone="success">{resource.state || "Connected"}</Badge>
          </div>
          <p className="mt-1 text-[11.5px] text-muted-foreground">
            {resource.kind}
            {resource.vendor ? ` · ${resource.vendor}` : ""}
            {resource.protocol ? ` · ${resource.protocol}` : ""}
          </p>
          <p className="mt-2 text-[10.5px] leading-relaxed text-muted-foreground">
            {resource.capabilities?.length ? resource.capabilities.join(" · ") : "Authorised resource"}
          </p>
        </div>
      </div>
      <div className="mt-3">
        <Action disabled={busy} onClick={() => void revoke()}>
          {busy ? "Disconnecting…" : "Disconnect"}
        </Action>
      </div>
    </article>
  );
}

function PublicConnect() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-9 pb-4">
      <header className="max-w-3xl">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Connect</p>
        <h1 className="mt-3 font-serif text-[40px] leading-[1.02] tracking-[-0.045em] md:text-[52px]">Bring your useful tools into the flow</h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-7 text-muted-foreground">
          Connect supported services and resources so Kurukoo can use authorised context when it helps get a job done. You choose what is connected and what access is allowed.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link to="/login" className={actionClass("primary")}>Log in to manage connections</Link>
          <Link to="/how-it-works" className={actionClass()}>How it works</Link>
        </div>
      </header>

      <section className="rounded-[22px] border border-border bg-surface p-5 md:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-tint text-brand-ink"><ShieldCheck className="size-5" /></span>
          <div>
            <h2 className="text-[15px] font-semibold">You stay in control</h2>
            <p className="mt-1.5 max-w-3xl text-[12.5px] leading-relaxed text-muted-foreground">
              A connection gives Kurukoo a defined doorway into a service. It does not mean unlimited access or automatic permission to act. Important external actions still follow the relevant approval and evidence flow.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="connection-types">
        <div className="mb-4">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Connection types</p>
          <h2 id="connection-types" className="mt-1.5 font-serif text-[29px] leading-[1.05] tracking-[-0.035em]">Connect the context your requests need</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {connectionTypes.map(({ title, body, examples, icon: Icon }) => (
            <article key={title} className="rounded-[19px] border border-border bg-surface p-4">
              <span className="grid size-9 place-items-center rounded-xl bg-elevated"><Icon className="size-4" /></span>
              <h3 className="mt-4 text-[14.5px] font-semibold">{title}</h3>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">{body}</p>
              <p className="mt-3 text-[10.5px] leading-relaxed text-foreground/65">{examples}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[22px] border border-border bg-elevated/35 p-5 md:p-6">
        <div className="max-w-3xl">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">External assistants</p>
          <h2 className="mt-1.5 font-serif text-[29px] leading-[1.05] tracking-[-0.035em]">Use the conversation surface you prefer</h2>
          <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
            Kurukoo is being built so external assistants can become another doorway into the same request and approval model. The frontend will only show an assistant as connected when an actual authorised connection exists.
          </p>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {assistantConnections.map((assistant) => (
            <div key={assistant.name} className="rounded-[17px] border border-border bg-surface p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[13.5px] font-semibold">{assistant.name}</p>
                <span className="rounded-full bg-elevated px-2 py-1 text-[9.5px] font-medium text-muted-foreground">Connection path</span>
              </div>
              <p className="mt-2 text-[11.5px] leading-relaxed text-muted-foreground">{assistant.description}</p>
              <div className="mt-3 flex items-center gap-2 text-[10.5px] text-muted-foreground"><MessageCircle className="size-3.5" /> Chat <Mic className="ml-1 size-3.5" /> Voice</div>
            </div>
          ))}
        </div>
      </section>

      <FAQSection
        items={[
          { question: "What does Connect actually do?", answer: "Connect is where supported external services and resources are authorised. Once connected, the service can become part of the context or action path for requests that support it." },
          { question: "Can Kurukoo access everything in a connected account?", answer: "No. A connection should expose only the scope supported and authorised by the service and the account. Kurukoo should not imply access it does not have." },
          { question: "Can I disconnect a service?", answer: "Yes. Authenticated connection management includes disconnecting supported resources that are currently connected to your account." },
          { question: "Are all the services shown here live?", answer: "No. The public page describes the connection model and examples. A service is treated as connected only when the underlying connection is actually available and authorised for the account." },
        ]}
      />
    </div>
  );
}

function AuthenticatedConnect() {
  const [resources, setResources] = useState<ConnectedResource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void fetchConnectedResources()
      .then((items) => { if (!cancelled) setResources(items); })
      .catch(() => { if (!cancelled) setResources([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-8">
      <header className="max-w-3xl">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-primary">Kurukoo OS</p>
        <h1 className="mt-2 font-serif text-[38px] leading-[1.02] tracking-[-0.045em] md:text-[44px]">Connect</h1>
        <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">Manage the services and resources actually authorised for this account.</p>
      </header>

      <Panel className="p-5">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-tint text-brand-ink"><ShieldCheck className="size-5" /></span>
          <div>
            <p className="text-[14px] font-semibold">Connection permissions</p>
            <p className="mt-1.5 max-w-2xl text-[12px] leading-relaxed text-muted-foreground">Only resources returned by Kurukoo's connected-resource service are treated as connected here. External actions still require the relevant request and approval flow.</p>
          </div>
        </div>
      </Panel>

      <section>
        <SectionHeader title="Connected resources" subtitle="Services and devices currently authorised for this account." />
        {loading ? (
          <div className="grid gap-3 md:grid-cols-2">
            {[0, 1].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl border border-border bg-surface" />)}
          </div>
        ) : resources.length ? (
          <div className="grid gap-3 md:grid-cols-2">{resources.map((resource) => <ResourceCard key={resource.id} resource={resource} onRevoke={(id) => setResources((items) => items.filter((item) => item.id !== id))} />)}</div>
        ) : (
          <Panel className="p-5"><p className="text-[13px] font-medium">No connected resources yet</p><p className="mt-1 text-[11.5px] text-muted-foreground">When a supported service is authorised for this account, it will appear here with its permissions and disconnect control.</p></Panel>
        )}
      </section>

      <section>
        <SectionHeader title="Connection paths" subtitle="External assistants and services can become authorised doorways into the same Kurukoo flow." />
        <div className="grid gap-3 md:grid-cols-2">
          {assistantConnections.map((assistant) => (
            <Panel key={assistant.name} className="p-4">
              <div className="flex items-center justify-between gap-3"><p className="text-[13.5px] font-semibold">{assistant.name}</p><Badge tone="quiet">Not connected</Badge></div>
              <p className="mt-2 text-[11.5px] leading-relaxed text-muted-foreground">{assistant.description}</p>
              <p className="mt-3 text-[10.5px] text-muted-foreground">A connection will appear here when the underlying service and authorisation path are available.</p>
            </Panel>
          ))}
        </div>
      </section>
    </div>
  );
}

function ConnectPage() {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const read = () => setAuthenticated(window.localStorage.getItem("kurukoo-authenticated") === "true");
    read();
    window.addEventListener("kurukoo-auth-updated", read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener("kurukoo-auth-updated", read);
      window.removeEventListener("storage", read);
    };
  }, []);

  return authenticated ? <AuthenticatedConnect /> : <PublicConnect />;
}
