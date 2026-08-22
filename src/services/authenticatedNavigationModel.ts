export type AuthNavPlacement = 'primary-sidebar' | 'secondary-sidebar' | 'header' | 'account-menu' | 'settings-section' | 'context-drawer';
export type AuthNavFrequency = 'core' | 'frequent' | 'occasional' | 'setup' | 'configuration' | 'instant';

export interface AuthNavItem {
  id: string;
  label: string;
  route?: string;
  placement: AuthNavPlacement;
  frequency: AuthNavFrequency;
  purpose: string;
  reason?: string;
}

/**
 * Usage-based authenticated IA. The sidebar is intentionally not a dump of
 * every capability. Frequent work stays visible; low-frequency/setup controls
 * move to Account, Settings or contextual drawers.
 */
export const AUTHENTICATED_NAVIGATION: readonly AuthNavItem[] = [
  { id: 'desk', label: 'Desk', route: '/desk', placement: 'primary-sidebar', frequency: 'core', purpose: 'Authenticated personal operating environment and starting point.', reason: 'Always-visible home.' },
  { id: 'agent', label: 'Agent', route: '/chat', placement: 'primary-sidebar', frequency: 'core', purpose: 'Conversational intelligence and universal interaction surface.', reason: 'Core daily interaction.' },
  { id: 'discover', label: 'Discover', route: '/discover', placement: 'primary-sidebar', frequency: 'frequent', purpose: 'Discover people, providers, products, places and opportunities.', reason: 'Frequent discovery task.' },
  { id: 'requests', label: 'Requests', route: '/requests', placement: 'primary-sidebar', frequency: 'core', purpose: 'Manage Economic Requests and fulfilment lifecycle.', reason: 'Core ongoing work.' },
  { id: 'tasks', label: 'Tasks', route: '/tasks', placement: 'primary-sidebar', frequency: 'frequent', purpose: 'Manage actionable and longer-running work.', reason: 'High-frequency work surface.' },

  { id: 'reminders', label: 'Reminders', route: '/reminders', placement: 'secondary-sidebar', frequency: 'frequent', purpose: 'View and manage reminders.', reason: 'Useful, but less central than Tasks.' },
  { id: 'saved', label: 'Saved', route: '/saved', placement: 'secondary-sidebar', frequency: 'frequent', purpose: 'Return to saved context, offers and items.', reason: 'Useful retrieval surface without consuming primary navigation.' },
  { id: 'topics', label: 'Topics', route: '/topics', placement: 'secondary-sidebar', frequency: 'occasional', purpose: 'Community and shared topical context.', reason: 'Discovery/community rather than core work.' },

  { id: 'search', label: 'Search Kurukoo', placement: 'header', frequency: 'instant', purpose: 'Universal direct navigation and semantic search handoff.' },
  { id: 'points', label: 'Points', route: '/points', placement: 'header', frequency: 'instant', purpose: 'Show current Points balance and provide direct access to Points.' },
  { id: 'cart', label: 'Cart', route: '/cart', placement: 'header', frequency: 'instant', purpose: 'Fast commerce access without primary-sidebar elevation.' },
  { id: 'notifications', label: 'Notifications', route: '/notifications', placement: 'header', frequency: 'instant', purpose: 'Action-oriented unread updates without leaving current context.' },
  { id: 'account', label: 'Account', placement: 'header', frequency: 'instant', purpose: 'Identity and access to lower-frequency account controls.' },

  { id: 'profile', label: 'Profile', route: '/settings/profile', placement: 'account-menu', frequency: 'occasional', purpose: 'Manage personal identity and account profile.' },
  { id: 'settings', label: 'Settings', route: '/settings', placement: 'account-menu', frequency: 'configuration', purpose: 'Central configuration surface.' },
  { id: 'subscriptions', label: 'Subscriptions', route: '/subscriptions', placement: 'account-menu', frequency: 'occasional', purpose: 'Plans, entitlements and billing lifecycle.' },
  { id: 'top-up', label: 'Top up', route: '/top-up', placement: 'account-menu', frequency: 'occasional', purpose: 'Add funds/Points when needed.' },
  { id: 'wallet', label: 'Wallet', route: '/wallet', placement: 'account-menu', frequency: 'occasional', purpose: 'View and manage economic balance/financial state.' },
  { id: 'agents', label: 'AI Agents', route: '/agents', placement: 'account-menu', frequency: 'setup', purpose: 'Manage autonomous/assistive Agents and their goals, tools and approval settings.' },
  { id: 'connect', label: 'Connect', route: '/connect', placement: 'account-menu', frequency: 'setup', purpose: 'Manage connected channels, storage and external sources.' },
  { id: 'contacts', label: 'Contacts', route: '/settings/contacts', placement: 'account-menu', frequency: 'setup', purpose: 'Manage contact access and consent-bound phone contacts integration.' },
  { id: 'memory', label: 'Memory', route: '/memory', placement: 'account-menu', frequency: 'configuration', purpose: 'Review, control and revoke retained personal context.', reason: 'Memory is a trust/privacy control more than a daily destination.' },
  { id: 'safety', label: 'Safety & check-ins', route: '/safety', placement: 'account-menu', frequency: 'configuration', purpose: 'Manage safety and consent-bound check-in settings.', reason: 'Keep settings accessible without making the primary nav alarming.' },
  { id: 'appearance', label: 'Appearance', route: '/settings#appearance', placement: 'settings-section', frequency: 'configuration', purpose: 'Theme and visual preferences.', reason: 'Persistent setting belongs inside Settings.' },
  { id: 'settings-memory', label: 'Memory controls', route: '/settings#memory', placement: 'settings-section', frequency: 'configuration', purpose: 'Privacy, retention and memory controls.', reason: 'Configuration belongs inside Settings while /memory remains the inspection surface.' },
  { id: 'settings-safety', label: 'Safety controls', route: '/settings#safety', placement: 'settings-section', frequency: 'configuration', purpose: 'Safety preferences and consent controls.', reason: 'Configuration belongs inside Settings while /safety remains the operational surface.' },
];

export const PRIMARY_SIDEBAR_ITEMS = AUTHENTICATED_NAVIGATION.filter((item) => item.placement === 'primary-sidebar');
export const SECONDARY_SIDEBAR_ITEMS = AUTHENTICATED_NAVIGATION.filter((item) => item.placement === 'secondary-sidebar');
export const HEADER_ITEMS = AUTHENTICATED_NAVIGATION.filter((item) => item.placement === 'header');
export const ACCOUNT_MENU_ITEMS = AUTHENTICATED_NAVIGATION.filter((item) => item.placement === 'account-menu');
export const SETTINGS_SECTION_ITEMS = AUTHENTICATED_NAVIGATION.filter((item) => item.placement === 'settings-section');
