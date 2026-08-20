/**
 * Cross-client implementation contract for platform work added after the Expo
 * shell was created. Native surfaces call canonical web/API owners.
 */
export type MobileCapabilityArea =
  | "discover" | "chat" | "notifications" | "agents" | "economic_requests" | "memory"
  | "provider_network" | "ai_runtime" | "safety" | "credentials" | "admin"
  | "commerce" | "catalogue" | "communications";

export type MobileCapabilityStatus = "implemented" | "client_ready" | "server_only" | "external_required" | "admin_only";

export interface MobileCapabilityContract {
  id: string;
  area: MobileCapabilityArea;
  title: string;
  status: MobileCapabilityStatus;
  canonicalOwner: string;
  nativeRoute: string | null;
  api: string[];
  notes: string;
}

export const MOBILE_PLATFORM_CONTRACTS: readonly MobileCapabilityContract[] = [
  { id: "discover", area: "discover", title: "Discover / Daily Picks / Topics / Opportunities / Products / Agent Network", status: "implemented", canonicalOwner: "src/services/discoverExperience.ts + discoverCommercialComposition.ts", nativeRoute: "/(tabs)/discover", api: ["/api/discover/home", "/api/discover/items/:type/:id/actions", "/api/discover/promotions/:id/impression", "/api/discover/promotions/:id/click"], notes: "Native consumes the same canonical feed and watch/follow/save/action boundary as web." },
  { id: "chat-routing", area: "chat", title: "Canonical Chat and AI routing", status: "implemented", canonicalOwner: "src/services/canonicalChatTurnService.ts + src/services/fastTextService.ts + src/services/aiInferencePolicy.ts", nativeRoute: "/(tabs)/chat", api: ["/api/chat/stream", "/api/chat/messages", "/api/chat/feedback"], notes: "Mobile never routes independently; backend remains the sole turn authority." },
  { id: "notifications", area: "notifications", title: "Notifications and background continuation", status: "client_ready", canonicalOwner: "src/services/pushNotificationsCanonical.ts + internal_notifications", nativeRoute: "/surface/notifications", api: ["canonical notification endpoints"], notes: "Watch, reminder, request, lead, provider and continuation events use the existing queue." },
  { id: "agents", area: "agents", title: "First-class agents and bounded inference budgets", status: "client_ready", canonicalOwner: "src/services/agentRuntime.ts + src/services/agentInferenceBudgetService.ts", nativeRoute: "/surface/agents", api: ["agent canonical routes"], notes: "Budget enforcement and authority remain server-side." },
  { id: "economic-requests", area: "economic_requests", title: "Economic Request lifecycle", status: "client_ready", canonicalOwner: "src/services/skillFlows.ts + economic request services", nativeRoute: "/surface/requests", api: ["canonical Economic Request routes"], notes: "Payment, quote, escrow and evidence stay server-owned." },
  { id: "memory", area: "memory", title: "Owner-scoped Memory", status: "client_ready", canonicalOwner: "src/services/memoryProfile.ts + livingMemoryEngine", nativeRoute: "/surface/memory", api: ["canonical memory routes"], notes: "Native does not create a competing memory store." },
  { id: "provider-network", area: "provider_network", title: "Provider discovery, verification and trust", status: "external_required", canonicalOwner: "src/services/discoveryNetwork.ts + providerVerificationLifecycle.ts", nativeRoute: "/surface/provider-network", api: ["/api/discover/*", "canonical provider verification routes"], notes: "Native UI can be built against canonical state." },
  { id: "commerce-network", area: "commerce", title: "Points, POS agents, provider lead charges and agent commissions", status: "client_ready", canonicalOwner: "src/services/pointsEngine.ts + agentNetworkCommerce.ts + commercialLedger.ts", nativeRoute: "/surface/commerce", api: ["/api/points/balance", "/api/agent-network/*", "/api/commercial/*"], notes: "Top-up settlement requires the verified payment boundary; Points remain closed-loop." },
  { id: "catalogue", area: "catalogue", title: "Provider / business / WhatsApp / store / affiliate product inventory", status: "client_ready", canonicalOwner: "src/services/catalogueSourceRegistry.ts + catalogueInventoryMatcher.ts", nativeRoute: "/surface/catalogue", api: ["/api/catalogue/sources", "/api/catalogue/products", "/api/catalogue/products/search", "/api/discover/home"], notes: "All product sources converge into one catalogue authority; connected-store credentials remain protected." },
  { id: "provider-communications", area: "communications", title: "Masked provider calling and real-time provider session/tracking", status: "external_required", canonicalOwner: "src/services/providerCommunicationService.ts + privacyBridge.ts + webrtcSignalling.ts", nativeRoute: "/surface/provider-communication", api: ["/api/provider-communication/*", "/api/webrtc/*", "/api/voice/*"], notes: "Mobile can build the tracking/call UI now; actual telephony routing and relay depend on approved external adapters." },
  { id: "ai-runtime", area: "ai_runtime", title: "AI provider health, quotas, telemetry and router", status: "server_only", canonicalOwner: "src/services/unifiedAiEngine.ts + aiInferencePolicy.ts + aiProviderHealth.ts + aiCostTelemetry.ts", nativeRoute: null, api: [], notes: "Operator telemetry belongs in protected Admin surfaces." },
  { id: "safety", area: "safety", title: "Safety, check-ins and escalation boundaries", status: "client_ready", canonicalOwner: "src/services/safetyService.ts", nativeRoute: "/surface/safety", api: ["canonical safety routes"], notes: "Preserve explicit consent and trusted-contact boundaries." },
  { id: "provider-credentials", area: "credentials", title: "Provider credential lifecycle", status: "admin_only", canonicalOwner: "src/services/providerCredentialService.ts", nativeRoute: null, api: [], notes: "Never expose secrets to consumer native UI." },
  { id: "admin-convergence", area: "admin", title: "AI telemetry, provider health, agent budgets, commerce and provider controls", status: "admin_only", canonicalOwner: "src/routes/adminRoutes.ts + adminPlatformRoutes.ts", nativeRoute: null, api: [], notes: "Web Admin remains the canonical operator surface." },
] as const;

export function getMobileCapability(id: string): MobileCapabilityContract | undefined { return MOBILE_PLATFORM_CONTRACTS.find((item) => item.id === id); }

export function assertMobileContractComplete(expectedIds: readonly string[]): void {
  const known = new Set(MOBILE_PLATFORM_CONTRACTS.map((item) => item.id));
  const missing = expectedIds.filter((id) => !known.has(id));
  if (missing.length) throw new Error(`Missing native platform contracts: ${missing.join(", ")}`);
}
