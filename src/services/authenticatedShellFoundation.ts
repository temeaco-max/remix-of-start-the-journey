export type AuthenticatedShellRegion = 'top-header' | 'primary-sidebar' | 'main-content' | 'context-inspector' | 'mobile-overflow';

export interface AuthenticatedShellContract {
  region: AuthenticatedShellRegion;
  required: string[];
  interaction: string[];
}

export const AUTHENTICATED_SHELL_CONTRACT: readonly AuthenticatedShellContract[] = [
  {
    region: 'top-header',
    required: ['canonical Kurukoo brand', 'universal search trigger', 'system/readiness status', 'Points balance', 'Cart access', 'notifications trigger', 'account/profile trigger'],
    interaction: ['search opens drawer/modal', 'notifications opens drawer', 'account opens usage-based account menu', 'Cart stays a compact header action', 'Points stays a compact header balance/action', 'header remains consistent across Desk, Chat and resource pages'],
  },
  {
    region: 'primary-sidebar',
    required: ['Desk', 'Agent', 'Discover', 'Requests', 'Tasks', 'active route state', 'secondary navigation access', 'collapse/expand affordance where desktop layout permits'],
    interaction: ['preserve current context when appropriate', 'navigate to canonical clean URLs', 'keyboard accessible', 'active state follows current surface'],
  },
  {
    region: 'main-content',
    required: ['purpose-specific page content', 'page-specific information architecture', 'state treatment', 'canonical actions'],
    interaction: ['deep links resolve', 'primary action is obvious', 'recovery path exists', 'return-to-Desk/Chat available where context warrants'],
  },
  {
    region: 'context-inspector',
    required: ['contextual information', 'current-objective/context', 'evidence/readiness state where applicable', 'next action', 'presence/memory/connectivity/Nearby Radar where relevant'],
    interaction: ['drawer opens/closes without destroying main context', 'context follows selected object/surface', 'escape/backdrop close', 'deep-link to durable object when appropriate'],
  },
  {
    region: 'mobile-overflow',
    required: ['secondary feature access', 'account/settings access', 'same product vocabulary'],
    interaction: ['use native mobile navigation patterns', 'do not copy desktop sidebar into mobile', 'preserve canonical deep links'],
  },
];

export const AUTHENTICATED_NAVIGATION_PRINCIPLES = {
  sidebarShowsFrequentWorkOnly: true,
  primarySidebar: ['desk', 'agent', 'discover', 'requests', 'tasks'],
  secondarySidebar: ['reminders', 'saved', 'topics'],
  header: ['search', 'points', 'cart', 'notifications', 'account'],
  accountMenu: ['profile', 'settings', 'subscriptions', 'top-up', 'wallet', 'ai-agents', 'connect', 'contacts', 'memory', 'safety'],
  settingsSections: ['appearance', 'memory', 'safety', 'notifications', 'privacy', 'connections', 'contacts'],
  contextInspector: ['presence', 'memory-status', 'connected-status', 'nearby-radar', 'current-objective', 'current-request', 'discovery-context'],
} as const;

export const AUTHENTICATED_SHELL_BRAND_RULES = {
  referenceLogoLiteralReuse: false,
  logoAuthority: 'brandPrimitiveRegistry',
  referenceHeaderInteractionPatternsAllowed: true,
  deskSpecificContentReferenceAllowedOutsideDesk: false,
  canonicalSearchName: 'Search Kurukoo',
  canonicalAgentActionLabel: 'Ask Agent',
} as const;

export const AUTHENTICATED_SHELL_FOUNDATION_VERSION = '1.1.0';
