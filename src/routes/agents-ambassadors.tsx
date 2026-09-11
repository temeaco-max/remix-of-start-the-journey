import { createFileRoute } from "@tanstack/react-router";
import { RoleLanding } from "@/components/kurukoo/role-landing";

export const Route = createFileRoute("/agents-ambassadors")({
  head: () => ({ meta: [{ title: "Local Agents & Ambassadors — Kurukoo" }, { name: "description", content: "Learn what local agents and ambassadors do for Kurukoo, what they can gain and how to join." }] }),
  component: AgentsAmbassadorsPage,
});

function AgentsAmbassadorsPage() {
  return <RoleLanding
    eyebrow="For local agents & ambassadors"
    title="Help Kurukoo reach people, services and opportunities on the ground."
    intro="Local agents and ambassadors are people who represent Kurukoo in their communities. They help people discover and use Kurukoo, connect local demand with useful services and opportunities, and support participation where a digital-only experience is not enough."
    whatKurukooIs="Kurukoo is an AI execution layer for real life. As a local agent or ambassador, you are a trusted human presence around that layer: you can introduce people to Kurukoo, help them understand what it can do, support onboarding, identify local opportunities and—when authorised—facilitate supported network activity."
    participation={["Introduce Kurukoo to people, businesses and organisations that could benefit from it.", "Help people get started, including practical onboarding and local guidance.", "Identify useful local providers, businesses, opportunities and community needs.", "Participate in authorised field, referral, sales or support activities within your role and permissions.", "Represent Kurukoo accurately and never promise an outcome, price, availability or reward that the system has not confirmed."]}
    benefits={["A practical way to build local relationships around a useful product.", "Potential referral rewards for qualifying referrals.", "Where authorised, potential commission from qualifying Points sales or other supported commercial activity.", "Access to agent tools, opportunities, support and a dedicated contributor community as the programme develops.", "The chance to build a useful local network and participate in Kurukoo's growth."]}
    features={["Agent onboarding and role setup", "Referral attribution and links", "Local discovery and opportunity signals", "Agent/community communications", "Points sales tools where authorised", "Agent activity, earnings and support"]}
    useCases={["An ambassador introduces a neighbourhood business to Kurukoo and helps the owner start its business onboarding.", "A local agent helps someone who is unfamiliar with AI describe what they need and begin a request.", "An authorised agent facilitates a Points sale, with settlement evidence required before commission is treated as settled.", "An agent identifies a useful local provider or opportunity and helps connect the right people without fabricating availability or guarantees.", "An ambassador shares a referral link; Kurukoo attributes qualifying activity and applies the current referral rules rather than rewarding every click."]}
    offer="Ask Kurukoo about the current local-agent and ambassador sign-up programme, launch bonuses, referral terms and any local activation offers. Offers and commissions are programme-controlled and should be treated as pending until the qualifying conditions are met."
    referral="Your referral is attributed through Kurukoo's referral system when the programme provides an eligible referral path. If the person or organisation completes the required qualifying steps, the referral can move toward an approved reward. Where a commercial activity also qualifies for commission, that is tracked separately under the applicable rules."
    joinPrompt="I want to become a Kurukoo local agent or ambassador. Explain the role, benefits, current offers and how I can join."
    primaryLabel="Join as an agent"
    primaryTo="/chat?prompt=I%20want%20to%20become%20a%20Kurukoo%20local%20agent%20or%20ambassador"
  />;
}
