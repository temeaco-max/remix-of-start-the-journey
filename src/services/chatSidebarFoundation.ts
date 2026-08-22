export type ChatSidebarPlacement = 'primary-left' | 'secondary-left' | 'header' | 'right-context' | 'drawer' | 'chat-only' | 'account-menu';

export interface ChatSidebarCapability {
  id: string;
  label: string;
  sourceSurface: 'chat';
  targetPlacement: ChatSidebarPlacement;
  canonicalRoute?: string;
  preserveOnDesk: boolean;
  purpose: string;
}

/**
 * Chat remains the inventory source for authenticated interaction capabilities,
 * but placement follows the usage-based authenticated navigation model.
 * Primary navigation is for frequent work; lower-frequency/setup controls move
 * to Account, Settings, header or the context inspector.
 */
export const CHAT_SIDEBAR_FOUNDATION: readonly ChatSidebarCapability[] = [
  { id: 'new-conversation', label: 'New conversation', sourceSurface: 'chat', targetPlacement: 'primary-left', canonicalRoute: '/chat', preserveOnDesk: true, purpose: 'Start a new Agent conversation.' },
  { id: 'conversation', label: 'Agent', sourceSurface: 'chat', targetPlacement: 'primary-left', canonicalRoute: '/chat', preserveOnDesk: true, purpose: 'Open Agent as the core conversational surface.' },
  { id: 'requests', label: 'Requests', sourceSurface: 'chat', targetPlacement: 'primary-left', canonicalRoute: '/requests', preserveOnDesk: true, purpose: 'Continue and inspect Economic Requests created through conversation.' },
  { id: 'tasks', label: 'Tasks', sourceSurface: 'chat', targetPlacement: 'primary-left', canonicalRoute: '/tasks', preserveOnDesk: true, purpose: 'Manage longer-running work and contribution tasks.' },
  { id: 'discover', label: 'Discover', sourceSurface: 'chat', targetPlacement: 'primary-left', canonicalRoute: '/discover', preserveOnDesk: true, purpose: 'Find people, products, places, providers and opportunities.' },
  { id: 'reminders', label: 'Reminders', sourceSurface: 'chat', targetPlacement: 'secondary-left', canonicalRoute: '/reminders', preserveOnDesk: true, purpose: 'Manage reminders created or continued through conversation.' },
  { id: 'saved', label: 'Saved', sourceSurface: 'chat', targetPlacement: 'secondary-left', canonicalRoute: '/saved', preserveOnDesk: true, purpose: 'Return to saved context and offers.' },
  { id: 'topics', label: 'Topics', sourceSurface: 'chat', targetPlacement: 'secondary-left', canonicalRoute: '/topics', preserveOnDesk: true, purpose: 'Access durable community context without making it a forum clone.' },
  { id: 'recent-conversations', label: 'Recent conversations', sourceSurface: 'chat', targetPlacement: 'secondary-left', canonicalRoute: '/chat', preserveOnDesk: true, purpose: 'Return quickly to recent Agent conversations.' },
  { id: 'presence', label: 'Your presence', sourceSurface: 'chat', targetPlacement: 'right-context', preserveOnDesk: true, purpose: 'Show current presence/readiness without implying external availability.' },
  { id: 'memory-status', label: 'Memory', sourceSurface: 'chat', targetPlacement: 'right-context', canonicalRoute: '/memory', preserveOnDesk: true, purpose: 'Expose memory continuity status and control.' },
  { id: 'connected-status', label: 'Connected', sourceSurface: 'chat', targetPlacement: 'right-context', canonicalRoute: '/connect', preserveOnDesk: true, purpose: 'Expose channel/source connectivity state.' },
  { id: 'nearby-radar', label: 'Nearby Radar', sourceSurface: 'chat', targetPlacement: 'right-context', canonicalRoute: '/discover', preserveOnDesk: true, purpose: 'Explicit nearby-context control with source/readiness truth.' },
  { id: 'connect', label: 'Connect', sourceSurface: 'chat', targetPlacement: 'account-menu', canonicalRoute: '/connect', preserveOnDesk: true, purpose: 'Manage channels, storage and connected sources without cluttering primary navigation.' },
  { id: 'top-up', label: 'Top up', sourceSurface: 'chat', targetPlacement: 'account-menu', canonicalRoute: '/top-up', preserveOnDesk: true, purpose: 'Manage Points top-up without cluttering primary navigation.' },
  { id: 'subscription', label: 'Subscriptions', sourceSurface: 'chat', targetPlacement: 'account-menu', canonicalRoute: '/subscriptions', preserveOnDesk: true, purpose: 'Manage plans and entitlements.' },
  { id: 'wallet', label: 'Wallet', sourceSurface: 'chat', targetPlacement: 'account-menu', canonicalRoute: '/wallet', preserveOnDesk: true, purpose: 'Manage economic balance and financial state.' },
  { id: 'ai-agents', label: 'AI Agents', sourceSurface: 'chat', targetPlacement: 'account-menu', canonicalRoute: '/agents', preserveOnDesk: true, purpose: 'Manage autonomous/assistive Agents, goals and approvals.' },
  { id: 'contacts', label: 'Contacts', sourceSurface: 'chat', targetPlacement: 'account-menu', canonicalRoute: '/settings/contacts', preserveOnDesk: true, purpose: 'Manage consent-bound phone contact access and contact-driven coordination.' },
  { id: 'memory', label: 'Memory', sourceSurface: 'chat', targetPlacement: 'account-menu', canonicalRoute: '/memory', preserveOnDesk: true, purpose: 'Review and control retained personal context.' },
  { id: 'safety', label: 'Safety & check-ins', sourceSurface: 'chat', targetPlacement: 'account-menu', canonicalRoute: '/safety', preserveOnDesk: true, purpose: 'Access safety support and settings without making the primary sidebar alarming.' },
  { id: 'appearance', label: 'Appearance', sourceSurface: 'chat', targetPlacement: 'drawer', canonicalRoute: '/settings#appearance', preserveOnDesk: true, purpose: 'Control presentation settings within Settings.' },
  { id: 'settings', label: 'Settings', sourceSurface: 'chat', targetPlacement: 'account-menu', canonicalRoute: '/settings', preserveOnDesk: true, purpose: 'Manage account, privacy, memory, safety, notifications and OS preferences.' },
  { id: 'cart', label: 'Cart', sourceSurface: 'chat', targetPlacement: 'header', canonicalRoute: '/cart', preserveOnDesk: true, purpose: 'Fast commerce access; do not elevate Cart to primary navigation.' },
  { id: 'points-balance', label: 'Points', sourceSurface: 'chat', targetPlacement: 'header', canonicalRoute: '/points', preserveOnDesk: true, purpose: 'Expose current Points balance and entry to Points management.' },
  { id: 'notifications', label: 'Notifications', sourceSurface: 'chat', targetPlacement: 'header', canonicalRoute: '/notifications', preserveOnDesk: true, purpose: 'Show unread state and open the notification drawer.' },
  { id: 'conversation-context', label: 'Conversation context', sourceSurface: 'chat', targetPlacement: 'header', preserveOnDesk: true, purpose: 'Open the contextual inspector for the current conversation.' },
  { id: 'conversation-overflow', label: 'Conversation actions', sourceSurface: 'chat', targetPlacement: 'header', preserveOnDesk: true, purpose: 'Pin, save, reminders and safe conversation actions.' },
  { id: 'inspector-current-request', label: 'Current request', sourceSurface: 'chat', targetPlacement: 'right-context', canonicalRoute: '/requests', preserveOnDesk: true, purpose: 'Display request identity, lifecycle and next action context.' },
  { id: 'inspector-discovery', label: 'Discovery context', sourceSurface: 'chat', targetPlacement: 'right-context', canonicalRoute: '/discover', preserveOnDesk: true, purpose: 'Display relevant Daily Picks/discovery context without replacing the main task.' },
];

export const CHAT_CAPABILITIES_MISSING_FROM_DESK = CHAT_SIDEBAR_FOUNDATION.filter((item) => item.preserveOnDesk);
