export type ChatSidebarPlacement = 'primary-left' | 'secondary-left' | 'header' | 'right-context' | 'drawer' | 'chat-only';

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
 * Inventory extracted from public/chat/index.html. Desk must absorb these
 * capabilities so moving away from Chat never makes functionality disappear.
 */
export const CHAT_SIDEBAR_FOUNDATION: readonly ChatSidebarCapability[] = [
  { id: 'new-conversation', label: 'New conversation', sourceSurface: 'chat', targetPlacement: 'primary-left', canonicalRoute: '/chat', preserveOnDesk: true, purpose: 'Start a new Agent conversation.' },
  { id: 'conversation', label: 'Conversation', sourceSurface: 'chat', targetPlacement: 'primary-left', canonicalRoute: '/chat', preserveOnDesk: true, purpose: 'Open Agent as the core conversational surface.' },
  { id: 'requests', label: 'Requests', sourceSurface: 'chat', targetPlacement: 'primary-left', canonicalRoute: '/requests', preserveOnDesk: true, purpose: 'Continue and inspect Economic Requests created through conversation.' },
  { id: 'tasks', label: 'Tasks', sourceSurface: 'chat', targetPlacement: 'primary-left', canonicalRoute: '/tasks', preserveOnDesk: true, purpose: 'Manage longer-running work and contribution tasks.' },
  { id: 'discover', label: 'Discover', sourceSurface: 'chat', targetPlacement: 'primary-left', canonicalRoute: '/discover', preserveOnDesk: true, purpose: 'Find people, products, places, providers and opportunities.' },
  { id: 'connect', label: 'Connect', sourceSurface: 'chat', targetPlacement: 'primary-left', canonicalRoute: '/connect', preserveOnDesk: true, purpose: 'Manage channels, storage and connected sources.' },
  { id: 'topics', label: 'Topics', sourceSurface: 'chat', targetPlacement: 'secondary-left', canonicalRoute: '/topics', preserveOnDesk: true, purpose: 'Access durable community context without making it a forum clone.' },
  { id: 'recent-conversations', label: 'Recent conversations', sourceSurface: 'chat', targetPlacement: 'secondary-left', canonicalRoute: '/chat', preserveOnDesk: true, purpose: 'Return quickly to recent Agent conversations.' },
  { id: 'presence', label: 'Your presence', sourceSurface: 'chat', targetPlacement: 'right-context', preserveOnDesk: true, purpose: 'Show current presence/readiness without implying external availability.' },
  { id: 'memory-status', label: 'Memory', sourceSurface: 'chat', targetPlacement: 'right-context', canonicalRoute: '/memory', preserveOnDesk: true, purpose: 'Expose memory continuity status and control.' },
  { id: 'connected-status', label: 'Connected', sourceSurface: 'chat', targetPlacement: 'right-context', canonicalRoute: '/connect', preserveOnDesk: true, purpose: 'Expose channel/source connectivity state.' },
  { id: 'nearby-radar', label: 'Nearby Radar', sourceSurface: 'chat', targetPlacement: 'right-context', canonicalRoute: '/discover', preserveOnDesk: true, purpose: 'Explicit nearby-context control with source/readiness truth.' },
  { id: 'top-up', label: 'Top up', sourceSurface: 'chat', targetPlacement: 'secondary-left', canonicalRoute: '/top-up', preserveOnDesk: true, purpose: 'Manage Points top-up without cluttering primary navigation.' },
  { id: 'subscription', label: 'Subscription', sourceSurface: 'chat', targetPlacement: 'secondary-left', canonicalRoute: '/subscriptions', preserveOnDesk: true, purpose: 'Manage plans and entitlements.' },
  { id: 'saved', label: 'Saved & offers', sourceSurface: 'chat', targetPlacement: 'secondary-left', canonicalRoute: '/saved', preserveOnDesk: true, purpose: 'Return to saved context and offers.' },
  { id: 'reminders', label: 'Reminders', sourceSurface: 'chat', targetPlacement: 'secondary-left', canonicalRoute: '/reminders', preserveOnDesk: true, purpose: 'Manage reminders created or continued through conversation.' },
  { id: 'safety', label: 'Safety & check-ins', sourceSurface: 'chat', targetPlacement: 'secondary-left', canonicalRoute: '/safety', preserveOnDesk: true, purpose: 'Access consent-bound safety support.' },
  { id: 'settings', label: 'Settings', sourceSurface: 'chat', targetPlacement: 'secondary-left', canonicalRoute: '/settings', preserveOnDesk: true, purpose: 'Manage account and OS preferences.' },
  { id: 'appearance', label: 'Appearance', sourceSurface: 'chat', targetPlacement: 'drawer', preserveOnDesk: true, purpose: 'Control presentation settings without changing product semantics.' },
  { id: 'cart', label: 'Cart', sourceSurface: 'chat', targetPlacement: 'header', canonicalRoute: '/cart', preserveOnDesk: true, purpose: 'Fast commerce access; do not elevate Cart to primary sidebar navigation.' },
  { id: 'points-balance', label: 'Points', sourceSurface: 'chat', targetPlacement: 'header', canonicalRoute: '/points', preserveOnDesk: true, purpose: 'Expose current Points balance and entry to Points management.' },
  { id: 'notifications', label: 'Notifications', sourceSurface: 'chat', targetPlacement: 'header', canonicalRoute: '/notifications', preserveOnDesk: true, purpose: 'Show unread state and open the notification drawer.' },
  { id: 'conversation-context', label: 'Conversation context', sourceSurface: 'chat', targetPlacement: 'header', preserveOnDesk: true, purpose: 'Open the contextual inspector for the current conversation.' },
  { id: 'conversation-overflow', label: 'Conversation actions', sourceSurface: 'chat', targetPlacement: 'header', preserveOnDesk: true, purpose: 'Pin, save, reminders and safe conversation actions.' },
  { id: 'inspector-current-request', label: 'Current request', sourceSurface: 'chat', targetPlacement: 'right-context', canonicalRoute: '/requests', preserveOnDesk: true, purpose: 'Display request identity, lifecycle and next action context.' },
  { id: 'inspector-discovery', label: 'Discovery context', sourceSurface: 'chat', targetPlacement: 'right-context', canonicalRoute: '/discover', preserveOnDesk: true, purpose: 'Display relevant Daily Picks/discovery context without replacing the main task.' },
];

export const CHAT_CAPABILITIES_MISSING_FROM_DESK = CHAT_SIDEBAR_FOUNDATION.filter((item) => item.preserveOnDesk);
