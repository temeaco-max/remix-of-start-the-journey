export type KurukooRoleId =
  | "seeker"
  | "provider"
  | "business"
  | "creator"
  | "contributor"
  | "partner"
  | "advertiser"
  | "local-agent";

export type KurukooRole = {
  id: KurukooRoleId;
  title: string;
  shortTitle: string;
  description: string;
  homeLabel: string;
  actions: Array<{ title: string; detail: string; to: string }>;
};

export type KurukooPublicRole = {
  id: KurukooRoleId;
  title: string;
  description: string;
  to: string;
  cta: string;
};

/**
 * Kurukoo's eight participation roles.
 *
 * These are product roles, not eight separate products. A person or organisation
 * can participate in more than one role; the Home/For You surface uses the
 * selected role as a presentation preference until a canonical profile/role
 * signal is available from the backend.
 *
 * Frontend rule: every role-aware surface must derive its role set from this
 * registry. Do not create a second, partial list of Kurukoo participation roles.
 */
export const KURUKOO_ROLES: KurukooRole[] = [
  {
    id: "seeker",
    title: "People who need something",
    shortTitle: "Get things done",
    description: "Ask Kurukoo to find, arrange or follow through on something.",
    homeLabel: "Get something done",
    actions: [
      { title: "Ask for help", detail: "Tell Kurukoo what you need.", to: "/chat" },
      { title: "Find nearby", detail: "See useful people, places and offers.", to: "/discover" },
      { title: "Follow a request", detail: "See what is happening now.", to: "/work" },
    ],
  },
  {
    id: "provider",
    title: "People who provide it",
    shortTitle: "Provide a service",
    description: "Offer a skill, service or availability to people who need it.",
    homeLabel: "Provide a service",
    actions: [
      { title: "Go Live", detail: "Let nearby people discover your availability.", to: "/discover" },
      { title: "Manage requests", detail: "See work that needs your attention.", to: "/work" },
      { title: "Your provider profile", detail: "See how people can find you.", to: "/providers" },
    ],
  },
  {
    id: "business",
    title: "Businesses",
    shortTitle: "Grow a business",
    description: "Turn local demand into customers, work and repeat business.",
    homeLabel: "Grow your business",
    actions: [
      { title: "Be discoverable", detail: "Put your business where people look.", to: "/businesses" },
      { title: "Reach local demand", detail: "See nearby opportunities.", to: "/discover" },
      { title: "Manage work", detail: "Keep requests moving.", to: "/work" },
    ],
  },
  {
    id: "creator",
    title: "Creators",
    shortTitle: "Create & reach people",
    description: "Publish useful things, build an audience and participate in the network.",
    homeLabel: "Create something useful",
    actions: [
      { title: "Start a Topic", detail: "Share useful local knowledge and ideas.", to: "/topics" },
      { title: "Explore opportunities", detail: "Find ways to participate.", to: "/explore" },
      { title: "Connect", detail: "Build useful relationships.", to: "/contacts" },
    ],
  },
  {
    id: "contributor",
    title: "Contributors",
    shortTitle: "Contribute",
    description: "Help make Kurukoo more useful through knowledge, participation and community signals.",
    homeLabel: "Contribute locally",
    actions: [
      { title: "Help someone", detail: "Find practical ways to contribute.", to: "/explore/community" },
      { title: "Share knowledge", detail: "Add useful community context.", to: "/topics" },
      { title: "Find opportunities", detail: "See where your contribution can help.", to: "/explore" },
    ],
  },
  {
    id: "partner",
    title: "Partners",
    shortTitle: "Partner with Kurukoo",
    description: "Bring services, capabilities or distribution into the network.",
    homeLabel: "Build a partnership",
    actions: [
      { title: "Connect a service", detail: "Explore connection options.", to: "/connect" },
      { title: "Find network demand", detail: "Explore goals and opportunities.", to: "/explore" },
      { title: "Work with Kurukoo", detail: "See active coordination.", to: "/work" },
    ],
  },
  {
    id: "advertiser",
    title: "Advertisers",
    shortTitle: "Reach the right people",
    description: "Put relevant offers in front of people when they are ready for them.",
    homeLabel: "Reach useful audiences",
    actions: [
      { title: "Explore local demand", detail: "Understand where people are looking.", to: "/discover" },
      { title: "See opportunities", detail: "Find relevant network signals.", to: "/opportunities" },
      { title: "Explore Kurukoo", detail: "See the surfaces people use.", to: "/explore" },
    ],
  },
  {
    id: "local-agent",
    title: "Local agents",
    shortTitle: "Represent locally",
    description: "Help people and organisations navigate local needs, places and opportunities.",
    homeLabel: "Help locally",
    actions: [
      { title: "See local activity", detail: "Watch what is happening nearby.", to: "/discover" },
      { title: "Coordinate work", detail: "Keep requests moving.", to: "/work" },
      { title: "Stay connected", detail: "Keep useful relationships close.", to: "/contacts" },
    ],
  },
];

/**
 * Public-shell wording for the same eight roles. Keep this list in the same
 * order as KURUKOO_ROLES so the public network story and authenticated For You
 * experience cannot silently drift apart.
 */
export const KURUKOO_PUBLIC_ROLES: KurukooPublicRole[] = [
  {
    id: "seeker",
    title: "People",
    description: "Ask for help, discover useful things and keep everyday life moving through one conversation.",
    to: "/chat",
    cta: "For people",
  },
  {
    id: "provider",
    title: "Providers",
    description: "Offer a genuine skill, become discoverable when eligible and coordinate work with customers.",
    to: "/providers",
    cta: "Become a Provider",
  },
  {
    id: "business",
    title: "Businesses",
    description: "Make products and services discoverable, respond to demand and grow customer relationships.",
    to: "/businesses",
    cta: "For businesses",
  },
  {
    id: "creator",
    title: "Creators",
    description: "Share useful ideas, build an audience and create value around content and Topics.",
    to: "/creators",
    cta: "For creators",
  },
  {
    id: "contributor",
    title: "Contributors",
    description: "Help add useful information, local context, curation or onboarding through scoped workflows.",
    to: "/contributors",
    cta: "Become a contributor",
  },
  {
    id: "partner",
    title: "Partners",
    description: "Connect organisations and services to Kurukoo through defined capabilities and authorised integrations.",
    to: "/partners",
    cta: "For partners",
  },
  {
    id: "advertiser",
    title: "Advertisers",
    description: "Reach relevant Kurukoo audiences through clearly labelled sponsored discovery, offers and campaigns.",
    to: "/advertising",
    cta: "Advertise on Kurukoo",
  },
  {
    id: "local-agent",
    title: "Agents",
    description: "Physical and local agent-participants who help people reach services, information and opportunities.",
    to: "/chat?prompt=I%20want%20to%20join%20the%20Kurukoo%20agent%20network",
    cta: "Join the agent network",
  },
];

export const DEFAULT_KURUKOO_ROLE: KurukooRoleId = "seeker";
export const KURUKOO_ROLE_STORAGE_KEY = "kurukoo-role";

export function getKurukooRole(roleId?: string | null): KurukooRole {
  return KURUKOO_ROLES.find((role) => role.id === roleId) ?? KURUKOO_ROLES[0];
}

export function getStoredKurukooRole(): KurukooRole {
  if (typeof window === "undefined") return getKurukooRole(DEFAULT_KURUKOO_ROLE);
  return getKurukooRole(window.localStorage.getItem(KURUKOO_ROLE_STORAGE_KEY));
}
