import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { Action, IntegrationGap } from "@/components/kurukoo/primitives";
import { Rows, SettingsRow, Tabs, Toggle } from "@/components/kurukoo/ui";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Kurukoo" },
      { name: "description", content: "Account, privacy, notifications, connected services, voice, payments and appearance." },
      { property: "og:title", content: "Settings — Kurukoo" },
      { property: "og:description", content: "The control layer of Kurukoo." },
    ],
  }),
  component: SettingsPage,
});

const tabs = ["Account", "Privacy", "Notifications", "Services", "Voice", "Money", "Appearance"] as const;

function SettingsPage() {
  const [tab, setTab] = useState<string>(tabs[0]);

  return (
    <>
      <PageHeader title="Settings" subtitle="How Kurukoo behaves, and what it may do for you." />
      <Tabs items={tabs} value={tab} onChange={setTab} />

      <div className="mt-4">
        {tab === "Account" ? (
          <Rows>
            <SettingsRow title="Profile" description="Name, photo and how people see you" control={<Action>Edit</Action>} />
            <SettingsRow title="Email and phone" description="Used for confirmations" control={<Action>Edit</Action>} />
            <SettingsRow title="Security" description="Password, sessions and two-factor" control={<Action>Manage</Action>} />
            <SettingsRow title="Language" description="English (UK)" control={<Action>Change</Action>} />
            <SettingsRow title="Memory" description="What Kurukoo remembers about you" control={<Link to="/memory"><Action>Open</Action></Link>} />
          </Rows>
        ) : null}

        {tab === "Privacy" ? (
          <Rows>
            <SettingsRow title="Ask before contacting anyone" description="Nothing is sent without approval" control={<Toggle label="Ask before contacting" defaultOn />} />
            <SettingsRow title="Share location for discovery" control={<Toggle label="Share location" />} />
            <SettingsRow title="Personalised recommendations" control={<Toggle label="Personalised recommendations" defaultOn />} />
            <SettingsRow title="Download your data" control={<Action>Request</Action>} />
          </Rows>
        ) : null}

        {tab === "Notifications" ? (
          <Rows>
            <SettingsRow title="Approvals" description="When Kurukoo needs a decision" control={<Toggle label="Approvals" defaultOn />} />
            <SettingsRow title="Provider replies" control={<Toggle label="Provider replies" defaultOn />} />
            <SettingsRow title="Followed topics and people" control={<Toggle label="Following activity" />} />
            <SettingsRow title="Product updates" control={<Toggle label="Product updates" />} />
          </Rows>
        ) : null}

        {tab === "Services" ? (
          <Rows>
            <SettingsRow title="Connected services" description="Storage, messaging, email, calendar" control={<Link to="/connect"><Action>Open Connect</Action></Link>} />
            <SettingsRow title="Storage destination" description="Where artifacts are kept" control={<Link to="/artifacts"><Action>Artifacts</Action></Link>} />
          </Rows>
        ) : null}

        {tab === "Voice" ? (
          <Rows>
            <SettingsRow title="Voice input" description="Speak instead of typing" control={<Toggle label="Voice input" defaultOn />} />
            <SettingsRow title="Read replies aloud" control={<Toggle label="Read replies aloud" />} />
            <SettingsRow title="Calls" description="Voice sessions with providers" control={<Link to="/calls"><Action>Open</Action></Link>} />
          </Rows>
        ) : null}

        {tab === "Money" ? (
          <Rows>
            <SettingsRow title="Wallet and points" control={<Link to="/wallet"><Action>Open</Action></Link>} />
            <SettingsRow title="Subscription" control={<Link to="/subscriptions"><Action>Manage</Action></Link>} />
            <SettingsRow title="Payment methods" description="None added" control={<Action>Add</Action>} />
            <SettingsRow title="Provider, business and creator accounts" control={<Link to="/providers"><Action>Open</Action></Link>} />
          </Rows>
        ) : null}

        {tab === "Appearance" ? (
          <Rows>
            <SettingsRow title="Theme" description="Use the toggle in the sidebar or header" />
            <SettingsRow title="Reduce motion" description="Follows your system setting" />
            <SettingsRow title="Text size" description="Follows your browser setting" />
          </Rows>
        ) : null}
      </div>

      <IntegrationGap>
        Settings are not persisted — they reset on reload until the account backend exists.
      </IntegrationGap>
    </>
  );
}
