export type CommerceSupplyType = "provider" | "business_storefront" | "affiliate_partner";

export type CommerceSupplySource = {
  id: string;
  name: string;
  type: CommerceSupplyType;
  description: string;
  commercialDisclosure?: string;
  transactionMode: "kurukoo" | "external_handoff" | "referral";
};

/**
 * Canonical frontend vocabulary for agentic commerce.
 * These are product concepts, not claims that any partner is currently live.
 */
export const commerceSupplyTypes: Record<CommerceSupplyType, string> = {
  provider: "Kurukoo provider",
  business_storefront: "Business storefront",
  affiliate_partner: "Partner supply",
};

export const storefrontPrinciples = [
  "Start with the outcome, not a catalogue.",
  "Compare only evidence Kurukoo can attribute or verify.",
  "Keep provider, partner and sponsored status distinct.",
  "Show material commercial relationships clearly.",
  "Ask for consent before consequential external actions.",
  "Record the handoff and outcome honestly.",
] as const;

export const exampleCommerceJourneys = [
  {
    title: "Find me a laptop under £800",
    outcome: "Compare suitable new, refurbished and local options.",
  },
  {
    title: "Help me launch my business",
    outcome: "Coordinate setup, suppliers, services, storefront and follow-up.",
  },
  {
    title: "Find somewhere to stay",
    outcome: "Compare suitable accommodation and move to an authorised booking path.",
  },
] as const;
