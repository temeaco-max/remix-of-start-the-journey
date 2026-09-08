export type LegalPolicy = {
  title: string;
  summary: string;
  status: string;
  updated: string;
  sections: Array<{ heading: string; body: string; bullets?: string[] }>;
  related: string[];
};

const commonStatus =
  "Product-policy foundation — final jurisdiction-specific legal review required before binding publication";

export const legalPolicies: Record<string, LegalPolicy> = {
  privacy: {
    title: "Privacy Policy",
    summary:
      "How Kurukoo handles personal information, location, memory, communications and privacy choices.",
    status: commonStatus,
    updated: "July 2026",
    related: ["terms", "cookies", "security", "data-retention"],
    sections: [
      {
        heading: "Information Kurukoo may handle",
        body: "Depending on the experience, Kurukoo may handle account and identity information, conversations, requests, provider or business interactions, Topics, transaction records, device/session information, and location when you explicitly use a location-dependent feature.",
      },
      {
        heading: "Why it is used",
        body: "Information supports the conversational service, account continuity, discovery and fulfilment, safety, evidence and audit trails, and enabled commercial or connected services that you choose.",
      },
      {
        heading: "Memory and location",
        body: "Owner-scoped memory can reduce repetition. It is not evidence of current provider availability, price or fulfilment. Location is purpose-bound; public discovery uses safe approximate provider positions.",
      },
      {
        heading: "Deletion and export",
        body: "The repository provides account deletion and export paths. Some records may need to be retained or anonymised for reconciliation, security, fraud prevention or legal obligations; the final notice must state the exact basis and period.",
      },
      {
        heading: "Your rights and choices",
        body: "The production notice should describe access, correction, deletion, objection, portability and other statutory rights that apply to the relevant jurisdiction, together with the approved privacy contact route.",
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    summary:
      "Rules for using Kurukoo accounts, conversations, requests, providers, businesses, content and transactions.",
    status: "Contract foundation — final legal agreement required before binding publication",
    updated: "July 2026",
    related: ["acceptable-use", "safety", "points", "advertising"],
    sections: [
      {
        heading: "What Kurukoo provides",
        body: "Kurukoo is a conversation-first fulfilment and coordination network. It may help users discover capabilities, providers, businesses, opportunities and community context, and coordinate requests where the necessary evidence, authorisation and integrations exist.",
      },
      {
        heading: "No automatic promise",
        body: "A listing, Topic, AI response or discovery result does not itself prove current availability, price, verification, payment settlement or fulfilment. Those states come from the canonical service that owns them.",
      },
      {
        heading: "User responsibilities",
        body: "Users must provide truthful information, use Kurukoo lawfully, respect other participants, protect account access and review confirmations before consequential actions are committed.",
      },
      {
        heading: "Providers, businesses and content",
        body: "Profiles represent capability and network participation. Verification, availability, pricing, inventory and fulfilment remain separate states. Community content is subject to moderation and does not become fulfilment proof.",
      },
      {
        heading: "Payments, suspension and changes",
        body: "Activated paid flows use the appropriate payment boundary and confirmation. Kurukoo may restrict access for safety, abuse, fraud, security, moderation or legal reasons. Final commercial and liability clauses require legal approval.",
      },
    ],
  },
  cookies: {
    title: "Cookie Policy",
    summary:
      "How Kurukoo uses cookies and similar browser technologies for sessions, security, preferences and optional measurement.",
    status: "Cookie policy foundation — final consent configuration required",
    updated: "July 2026",
    related: ["privacy", "advertising", "security"],
    sections: [
      {
        heading: "Essential session cookies",
        body: "Authentication and session mechanisms can be needed to keep you signed in and protect authenticated actions.",
      },
      {
        heading: "Preferences",
        body: "The site may retain interface choices such as appearance and locally selected product preferences. These should be scoped to the purpose for which they are needed.",
      },
      {
        heading: "Optional measurement and advertising",
        body: "Optional analytics or advertising technologies require a separately documented purpose, disclosure and consent treatment where applicable. Sponsored content is labelled separately from organic discovery.",
      },
      {
        heading: "Security",
        body: "Cookies or similar mechanisms may support session integrity and security controls. Credentials and sensitive identifiers must not be exposed in URLs or public client state.",
      },
    ],
  },
  safety: {
    title: "Safety & Trust",
    summary:
      "How Kurukoo handles safety, evidence, availability, identity, location and consequential actions.",
    status: "Operational safety policy foundation",
    updated: "July 2026",
    related: ["trust", "community-guidelines", "security", "compliance"],
    sections: [
      {
        heading: "Truth before convenience",
        body: "Kurukoo must not invent providers, prices, bookings, payments, stock, delivery or completed outcomes simply to make a flow look complete.",
      },
      {
        heading: "Provider and location safety",
        body: "Verification and current availability are separate facts. Nearby and Pulse use explicit location permissions and safe approximate public projections; stale live presence expires.",
      },
      {
        heading: "Consequential actions",
        body: "Payments, purchases, communications, account changes and other consequential operations require the relevant authority, confirmation and external evidence where applicable.",
      },
      {
        heading: "Urgent situations",
        body: "Kurukoo is not an emergency response service unless a specific emergency integration has been independently configured and verified. For urgent danger, use the appropriate local emergency service.",
      },
    ],
  },
  trust: {
    title: "Trust & Verification",
    summary: "How Kurukoo keeps evidence, verification, availability and discovery state separate.",
    status: "Operational policy foundation",
    updated: "July 2026",
    related: ["safety", "security", "compliance"],
    sections: [
      {
        heading: "Capability is not availability",
        body: "A provider can have a capability in their profile while being unavailable. Current availability is shown only when the canonical provider state supports it.",
      },
      {
        heading: "Discovery lifecycle",
        body: "A discovered business, place or event may be a candidate or opportunity before it becomes claimed, onboarded, verified or available. Discovery does not create provider authority.",
      },
      {
        heading: "Presence is temporary",
        body: "Go Live on Pulse is an explicit, temporary presence signal for eligible providers. It is not a permanent promise and does not reveal an exact public position.",
      },
    ],
  },
  "community-guidelines": {
    title: "Community Guidelines",
    summary: "Standards for Topics, replies, reports, moderation and public community context.",
    status: "Community policy foundation — final moderation process required",
    updated: "July 2026",
    related: ["acceptable-use", "privacy", "safety"],
    sections: [
      {
        heading: "Be useful and truthful",
        body: "Distinguish personal experience, opinion, report and verified fact. Do not manufacture evidence or current availability.",
      },
      {
        heading: "Protect personal information",
        body: "Do not publish credentials, private contact details, precise home addresses or other sensitive information without a valid basis. Prefer broad locality to exact location.",
      },
      {
        heading: "Moderation and reporting",
        body: "Topics and replies may be reviewed, restricted or removed. Reporting sends content into the moderation path; it does not itself prove the report is valid.",
      },
      {
        heading: "Community context is not fulfilment proof",
        body: "A Topic can inform discovery or discussion but does not make a provider available, price current, review verified or order fulfilled.",
      },
    ],
  },
  "acceptable-use": {
    title: "Acceptable Use",
    summary:
      "Prohibited and restricted uses of Kurukoo accounts, content, discovery and fulfilment services.",
    status: commonStatus,
    updated: "July 2026",
    related: ["terms", "safety", "points", "community-guidelines"],
    sections: [
      {
        heading: "Do not misuse identity",
        body: "Do not impersonate another person, evade account controls, use stolen credentials or misrepresent authority or ownership.",
      },
      {
        heading: "Do not abuse discovery",
        body: "Do not publish deceptive presence, stalk people, coordinate harassment or manipulate location-sensitive discovery for harmful purposes.",
      },
      {
        heading: "Do not abuse money, content or moderation",
        body: "Do not commit fraud, chargeback abuse or unauthorised payment activity; do not spam, manipulate reports or exploit moderation and security systems.",
      },
    ],
  },
  compliance: {
    title: "Compliance",
    summary: "Kurukoo's evidence, legal, safety and external-activation boundaries.",
    status: "Compliance framework — not a certification or legal opinion",
    updated: "July 2026",
    related: ["privacy", "security", "points", "safety"],
    sections: [
      {
        heading: "Readiness is not external activation",
        body: "Payments, settlement, provider availability, inventory, dispatch, messaging channels, voice, KYC and similar dependencies require configured providers, credentials, evidence and controlled tests before they are represented as live.",
      },
      {
        heading: "Privacy, location and evidence",
        body: "Location is explicit and purpose-bound; public discovery uses approximate data; state such as availability, payment and fulfilment must be backed by the service that owns it.",
      },
      {
        heading: "Financial and regulated boundaries",
        body: "The repository's Points guardrail requires a legal/regulatory assessment before public issuance of a named digital token or equivalent instrument. This page does not claim licensing, exemption or certification.",
      },
      {
        heading: "AI and governance",
        body: "AI may interpret, explain, suggest and coordinate within bounded permissions. Canonical services remain authoritative for identity, requests, availability, payment and fulfilment.",
      },
    ],
  },
  "data-retention": {
    title: "Data Retention",
    summary:
      "Retention, expiry, deletion and export rules derived from Kurukoo's current repository policy.",
    status: "Repository policy translated for users",
    updated: "July 2026",
    related: ["privacy", "security", "compliance"],
    sections: [
      {
        heading: "Current retention targets",
        body: "The repository policy currently specifies:",
        bullets: [
          "Temporary anonymous or incomplete sessions: 24 hours.",
          "Operational audit logs containing potentially sensitive data: 30 days.",
          "Location history, where enabled: 30 days; active provider location is handled separately for current presence.",
          "Personal profile data: retained until deletion is requested, subject to applicable legal obligations.",
        ],
      },
      {
        heading: "Deletion",
        body: "The policy provides for account deletion, removal of the owner's memory profile and skills/roles, deletion of profile access logs, and anonymisation of certain transactional records that must remain for reconciliation or analysis.",
      },
      {
        heading: "Export and lifecycle jobs",
        body: "The repository provides for a user data export and scheduled purging of expired temporary sessions and audit logs. Production operations must monitor these lifecycle jobs.",
      },
    ],
  },
  security: {
    title: "Security",
    summary:
      "Security principles for identity, authorisation, secrets, privacy, location and auditability.",
    status: "Security policy foundation",
    updated: "July 2026",
    related: ["privacy", "safety", "compliance"],
    sections: [
      {
        heading: "Identity and authorisation",
        body: "Authenticated actions should be owner-scoped and protected by the relevant permission boundary. Knowing an identifier must never be enough to access private account state.",
      },
      {
        heading: "Secrets and credentials",
        body: "Credentials and tokens remain server-side or in protected secret stores. They must not be placed in URLs, public discovery data or browser-visible metadata.",
      },
      {
        heading: "Location and auditability",
        body: "Exact provider coordinates and internal source references are not public discovery data. Security-sensitive workflows maintain bounded audit evidence without storing unnecessary sensitive information or model private reasoning.",
      },
    ],
  },
  points: {
    title: "Points & Network Units",
    summary:
      "Product guardrails for Kurukoo points, rewards and their separation from fiat payments.",
    status: "Product/legal guardrail — regulatory assessment required before named token issuance",
    updated: "July 2026",
    related: ["terms", "compliance", "privacy"],
    sections: [
      {
        heading: "Closed-loop utility",
        body: "The intended model limits points to eligible Kurukoo services, access and benefits rather than presenting them as general money.",
      },
      {
        heading: "No investment rights",
        body: "The repository guardrail says points should not provide ownership, dividends, interest, liquidation rights, profit-sharing or investment returns. Ordinary users do not receive fiat redemption or unrestricted peer-to-peer transfer under the intended model.",
      },
      {
        heading: "Separate fiat rail",
        body: "Goods, fares, services, subscriptions and provider payouts use the appropriate payment provider. The repository explicitly requires legal and regulatory assessment before public issuance of a named digital token.",
      },
    ],
  },
  advertising: {
    title: "Advertising Policy",
    summary:
      "How sponsored discovery is disclosed, approved and kept distinct from organic information.",
    status: "Advertising policy foundation",
    updated: "July 2026",
    related: ["cookies", "privacy", "terms"],
    sections: [
      {
        heading: "Clear disclosure",
        body: "Sponsored cards, campaigns and placements are labelled so users can distinguish paid or sponsored content from organic discovery.",
      },
      {
        heading: "No fabricated campaigns",
        body: "Kurukoo should not imply an advertiser has an active offer, promotion or budget when the canonical campaign state does not support that claim.",
      },
      {
        heading: "Relevance and user control",
        body: "Advertising may appear in discovery or Daily Picks under configured rules, while remaining separate from fulfilment proof and community moderation. Applicable measurement and consent controls should be disclosed.",
      },
    ],
  },
  ai: {
    title: "AI & Automation",
    summary:
      "How Kurukoo's AI and agents operate within safety, evidence, authorisation and canonical service boundaries.",
    status: "AI product policy foundation",
    updated: "July 2026",
    related: ["privacy", "security", "safety", "compliance"],
    sections: [
      {
        heading: "AI can assist, not invent state",
        body: "AI may interpret a request, retrieve context, suggest options or propose a next action. It must not fabricate availability, inventory, price, payment, identity verification or completion.",
      },
      {
        heading: "Canonical services remain authoritative",
        body: "The service that owns a piece of state remains the authority for that state. AI and agents act through approved capability boundaries rather than replacing canonical state owners.",
      },
      {
        heading: "Human control and memory",
        body: "Consequential actions remain behind required confirmation and authorisation. Memory can improve continuity but never becomes proof of current provider state or permission to commit an action.",
      },
    ],
  },
};

export const legalPolicySlugs = Object.keys(legalPolicies);
