/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import type { ProviderCommunicationState } from './providerCommunicationService.js';

const MESSAGE_READY_STATES = new Set<ProviderCommunicationState>(['connected', 'arrived', 'in_progress']);
const VOICE_READY_STATES = new Set<ProviderCommunicationState>(['arrived', 'in_progress']);
const LOCATION_ACTIVE_STATES = new Set<ProviderCommunicationState>(['created', 'ringing', 'connected', 'provider_en_route', 'arrived', 'in_progress']);

/**
 * Canonical presentation policy for request-scoped provider communication.
 * This answers whether a UI affordance may be shown; it never authorizes the
 * underlying transport. Transport authorization remains in the communication
 * service/routes and external provider adapters.
 */
export function communicationAvailability(state: ProviderCommunicationState) {
  return {
    message: MESSAGE_READY_STATES.has(state),
    voice: VOICE_READY_STATES.has(state),
    video: VOICE_READY_STATES.has(state),
    location: LOCATION_ACTIVE_STATES.has(state),
    callReason: VOICE_READY_STATES.has(state)
      ? 'provider_arrived'
      : 'voice_unlocks_when_provider_arrives',
  } as const;
}
