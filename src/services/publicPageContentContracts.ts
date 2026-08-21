export interface PublicPageContentContract {
  route: string;
  purpose: string;
  audience: string[];
  requiredSections: string[];
  requiredActions: string[];
  requiredStates: string[];
  seo: { indexable: boolean; title: boolean; description: boolean; canonical: boolean; structuredData?: string[]; internalLinks: boolean };
  truthBoundary: string;
}

const base = (route: string, purpose: string, requiredSections: string[], requiredActions: string[] = [], truthBoundary = 'Public content must only claim capabilities, availability, providers, evidence and fulfilment that the repository or approved source can substantiate.') => ({
  route,
  purpose,
  audience: ['public'],
  requiredSections,
  requiredActions,
  requiredStates: ['loading', 'empty', 'error', 'normal'],
  seo: { indexable: true, title: true, description: true, canonical: true, internalLinks: true },
  truthBoundary,
});

export const PUBLIC_PAGE_CONTENT_CONTRACTS: readonly PublicPageContentContract[] = [
  base('/', 'Explain Kurukoo clearly and move visitors into the product.', ['product promise', 'how Kurukoo works', 'core capabilities', 'real-world examples', 'trust/evidence explanation', 'channels/clients', 'pricing entry', 'FAQ', 'primary CTA'], ['start chat', 'sign up']),
  base('/about', 'Explain what Kurukoo is, why it exists, and what it is becoming.', ['mission', 'product definition', 'operating model', 'people/ecosystem', 'trust and boundaries', 'roadmap context'], ['start chat']),
  base('/features', 'Explain what Kurukoo can do in human product language.', ['conversational Agent', 'Desk', 'Discover', 'Requests', 'Tasks', 'Connect', 'Memory', 'Agents', 'Network', 'Economic coordination', 'Safety', 'cross-client experience', 'FAQ'], ['open chat', 'sign up']),
  base('/explore', 'Let visitors understand the breadth of Kurukoo capabilities and categories.', ['capability taxonomy', 'categories', 'examples', 'agent handoff', 'discovery handoff', 'how capabilities become real outcomes'], ['open chat', 'explore capability']),
  base('/discover', 'Public discovery surface for activity, Topics, Opportunities and relevant options.', ['For You or public equivalent', 'Nearby', 'Today/Daily Picks', 'Topics', 'Opportunities', 'Explore Kurukoo', 'source/provenance', 'sponsored disclosure', 'empty-state alternatives'], ['open item', 'open chat', 'save/watch/follow where authenticated']),
  base('/network', 'Explain the people, providers, businesses, contributors and bounded agents participating in Kurukoo.', ['network definition', 'participant types', 'verification/evidence', 'discovery and coordination', 'availability boundaries', 'join/partner paths'], ['become provider/partner', 'open chat']),
  base('/channels', 'Explain supported Kurukoo access channels and their readiness boundaries.', ['Web', 'PWA', 'iOS', 'Android', 'supported external channels', 'readiness/availability', 'privacy/security', 'setup path'], ['open chat', 'start setup']),
  base('/topics', 'Public shared-content surface for durable Topics.', ['topic index', 'taxonomy/filtering', 'topic detail entry', 'replies/community context', 'moderation/reporting explanation', 'related Topics', 'Chat handoff'], ['open topic', 'join conversation']),
  base('/resources', 'Resource library for learning and product usage.', ['resource taxonomy', 'featured resources', 'resource cards', 'detail/article template', 'related resources', 'updated metadata', 'Chat handoff'], ['open resource', 'open chat']),
  base('/help', 'Help and support entry point.', ['search/help navigation', 'getting started', 'account/auth help', 'Chat help', 'Requests/Tasks/Connect help', 'payments/subscriptions help', 'safety/help escalation', 'contact support', 'FAQ'], ['search help', 'contact support', 'open chat']),
  base('/contact', 'Give people legitimate ways to contact Kurukoo.', ['reason selector', 'support contact', 'partnership contact', 'press/media', 'advertising contact', 'privacy/legal contact', 'expected response semantics', 'abuse/safety route'], ['submit contact', 'open help']),
  base('/pricing', 'Explain plans, pricing logic and what is or is not currently active.', ['plans', 'entitlements', 'consumer/provider/business/agent relevance', 'billing cycle', 'regional caveats', 'payment readiness', 'FAQ', 'upgrade path'], ['compare plans', 'sign up']),
  base('/partners', 'Explain ecosystem partnership opportunities.', ['partner types', 'benefits', 'integration models', 'requirements', 'trust/compliance', 'lead/contact path'], ['become partner', 'contact']),
  base('/advertise', 'Explain how approved advertising works on Kurukoo.', ['inventory/surfaces', 'audiences', 'placement rules', 'sponsorship disclosure', 'pricing/eligibility', 'creative requirements', 'measurement', 'contact CTA'], ['start advertising enquiry', 'contact']),
  base('/blog', 'Publish Kurukoo product, ecosystem and educational content.', ['article index', 'categories', 'article detail', 'author/date', 'related content', 'SEO metadata', 'newsletter/Chat continuation where appropriate'], ['open article', 'search content']),
  base('/careers', 'Explain real opportunities to work with Kurukoo.', ['company context', 'open roles', 'role detail', 'application path', 'equal opportunity/privacy notice'], ['view role', 'apply']),
  base('/developers', 'Explain Kurukoo as a platform and how developers can build with it.', ['platform overview', 'architecture model', 'API/SDK entry', 'authentication', 'webhooks/events', 'rate limits', 'examples', 'security/trust', 'support'], ['open API docs', 'open developer resources']),
  base('/developers/api', 'Technical API documentation.', ['getting started', 'authentication', 'resources', 'request/response examples', 'errors', 'webhooks', 'idempotency', 'rate limits', 'versioning', 'security', 'changelog'], ['copy example', 'test endpoint where supported']),
  base('/legal', 'Legal/privacy/safety/disclaimer index and durable legal documents.', ['terms', 'privacy', 'cookies', 'acceptable use', 'safety/disclaimer', 'provider/marketplace boundaries', 'refund/dispute/payment terms', 'document version/date'], ['open document']),
  base('/cookies', 'Explain cookies and consent categories.', ['necessary cookies', 'analytics/performance', 'preferences', 'consent controls', 'retention', 'third-party services', 'privacy contact'], ['manage consent']),
] as const;

export function getPublicPageContentContract(route: string): PublicPageContentContract | undefined {
  return PUBLIC_PAGE_CONTENT_CONTRACTS.find(item => item.route === route);
}
