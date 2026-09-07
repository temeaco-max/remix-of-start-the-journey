import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { Action, IntegrationGap } from "@/components/kurukoo/primitives";
import { Panel, Rows, SettingsRow, Tabs, Toggle } from "@/components/kurukoo/ui";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Kurukoo" },
      { name: "description", content: "Control how Kurukoo behaves, remembers, communicates and works for you." },
      { property: "og:title", content: "Settings — Kurukoo" },
      { property: "og:description", content: "Your personal controls for Kurukoo." },
    ],
  }),
  component: SettingsPage,
});

const tabs = ["Account", "Privacy", "Notifications", "Services", "Voice", "Money", "Appearance"] as const;

function SettingIntro({ icon: Icon, eyebrow, title, description }: { icon: typeof UserRound; eyebrow: string; title: string; description: string }) {
  return <Panel className="mb-4 overflow-hidden p-0"><div className="flex items-start gap-4 p-5 md:p-6"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-elevated text-muted-foreground"><Icon className="size-5" /></span><div className="min-w-0"><p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{eyebrow}</p><h2 className="mt-1 text-[17px] font-semibold tracking-[-0.02em]">{title}</h2><p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">{description}</p></div></div></Panel>;
}

function ProfileEditor() {
  const [name, setName] = useState("Ada");
  const [saved, setSaved] = useState(false);
  useEffect(() => { const stored = localStorage.getItem("kurukoo-profile-name")?.trim(); if (stored) setName(stored); }, []);
  const save = () => { const next = name.trim() || "Ada"; setName(next); localStorage.setItem("kurukoo-profile-name", next); window.dispatchEvent(new Event("kurukoo-profile-updated")); setSaved(true); window.setTimeout(() => setSaved(false), 1600); };
  return <div className="flex items-center gap-2"><input value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }} aria-label="Profile name" className="h-9 w-32 rounded-lg border border-border bg-background px-2.5 text-[12.5px] outline-none focus-visible:ring-2 focus-visible:ring-ring" /><button type="button" onClick={save} className="h-9 rounded-lg bg-primary px-3 text-[12px] font-medium text-primary-foreground hover:opacity-90">{saved ? "Saved" : "Save"}</button></div>;
}

function SettingsPage() {
  const [tab, setTab] = useState<string>(tabs[0]);

  return <>
    <PageHeader title="Settings" subtitle="Control how Kurukoo behaves, remembers, communicates and works for you." />
    <Tabs items={tabs} value={tab} onChange={setTab} />

    <div className="mt-4">
      {tab === "Account" && <><SettingIntro icon={UserRound} eyebrow="Your identity" title="Make Kurukoo feel like yours" description="Manage the details Kurukoo uses to represent you and keep your account secure." /><Rows><SettingsRow title="Profile" description="Name, photo and how people see you" control={<ProfileEditor />} /><SettingsRow title="Email and phone" description="Used for confirmations" control={<Action>Edit</Action>} /><SettingsRow title="Security" description="Password, sessions and two-factor" control={<Action>Manage</Action>} /><SettingsRow title="Language" description="English (UK)" control={<Action>Change</Action>} /><SettingsRow title="Memory" description="What Kurukoo remembers about you" control={<Link to="/memory" className={actionClass()}>Open</Link>} /></Rows></>}
      {tab === "Privacy" && <><SettingIntro icon={ShieldCheck} eyebrow="Your control" title="Kurukoo asks before it acts" description="Choose what Kurukoo can use and when it needs your approval. Your choices stay visible and understandable." /><Rows><SettingsRow title="Ask before contacting anyone" description="Nothing is sent without approval" control={<Toggle label="Ask before contacting" defaultOn />} /><SettingsRow title="Share location for discovery" description="Allow nearby recommendations to use your location" control={<Toggle label="Share location" />} /><SettingsRow title="Personalised recommendations" description="Use your activity and interests to improve suggestions" control={<Toggle label="Personalised recommendations" defaultOn />} /><SettingsRow title="Download your data" description="Request a copy of your Kurukoo data" control={<Action>Request</Action>} /></Rows></>}
      {tab === "Notifications" && <><SettingIntro icon={Sparkles} eyebrow="Stay informed" title="Only hear when it matters" description="Keep approvals, replies and important activity close without turning Kurukoo into a noisy notification feed." /><Rows><SettingsRow title="Approvals" description="When Kurukoo needs a decision" control={<Toggle label="Approvals" defaultOn />} /><SettingsRow title="Network replies" description="When someone responds to a request" control={<Toggle label="Network replies" defaultOn />} /><SettingsRow title="Followed topics and people" description="Updates from things you follow" control={<Toggle label="Following activity" />} /><SettingsRow title="Product updates" description="New Kurukoo features and improvements" control={<Toggle label="Product updates" />} /></Rows></>}
      {tab === "Services" && <><SettingIntro icon={Check} eyebrow="Connected services" title="Choose what Kurukoo can work with" description="Connected services extend what Kurukoo can do for you. Review permissions and connection state in one place." /><Rows><SettingsRow title="Connected services" description="Storage, messaging, email and calendar" control={<Link to="/connect" className={actionClass()}>Open Connect</Link>} /><SettingsRow title="Storage destination" description="Where files are kept" control={<Link to="/artifacts" className={actionClass()}>Files</Link>} /></Rows></>}
      {tab === "Voice" && <><SettingIntro icon={Sparkles} eyebrow="Voice" title="Talk to Kurukoo naturally" description="Control voice input and how Kurukoo responds when you prefer speaking over typing." /><Rows><SettingsRow title="Voice input" description="Speak instead of typing" control={<Toggle label="Voice input" defaultOn />} /><SettingsRow title="Read replies aloud" description="Hear Kurukoo responses" control={<Toggle label="Read replies aloud" />} /><SettingsRow title="Calls" description="Voice sessions with people in your requests" control={<Link to="/calls" className={actionClass()}>Open</Link>} /></Rows></>}
      {tab === "Money" && <><SettingIntro icon={Sparkles} eyebrow="Money" title="Keep value and payments clear" description="Manage the places where points, wallet balance, subscriptions and payment methods meet." /><Rows><SettingsRow title="Wallet and points" description="Your Kurukoo value balance" control={<Link to="/wallet" className={actionClass()}>Open</Link>} /><SettingsRow title="Subscription" description="Plan and billing" control={<Link to="/subscriptions" className={actionClass()}>Manage</Link>} /><SettingsRow title="Payment methods" description="None added" control={<Action>Add</Action>} /><SettingsRow title="Network, business and creator accounts" description="Account types connected to Kurukoo" control={<Link to="/network" className={actionClass()}>Open</Link>} /></Rows></>}
      {tab === "Appearance" && <><SettingIntro icon={Sparkles} eyebrow="Appearance" title="Make Kurukoo comfortable everywhere" description="Kurukoo follows your device preferences while keeping the OS shell consistent across surfaces." /><Rows><SettingsRow title="Theme" description="Use the appearance control in the shell" control={<span className="text-[12px] text-muted-foreground">System / Light / Dark</span>} /><SettingsRow title="Reduce motion" description="Follows your system setting" control={<span className="text-[12px] text-muted-foreground">System</span>} /><SettingsRow title="Text size" description="Follows your browser setting" control={<span className="text-[12px] text-muted-foreground">Default</span>} /></Rows></>}
    </div>

    <div className="mt-4 flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 text-[12px] text-muted-foreground"><span>Settings are saved locally in this preview.</span><span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-[var(--color-success)]" /> Ready</span></div>
    <IntegrationGap>Account-backed persistence will be available when your account connection is enabled.</IntegrationGap>
  </>;
}