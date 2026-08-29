/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
/**
 * Contact-name reconciliation is intentionally provider-gated.
 *
 * Kurukoo must not infer a person's name from a phone prefix, a demo phone
 * number, or a generated name list. A future trusted contact provider may
 * implement the reconciliation contract here after explicit privacy,
 * consent, ownership and retention decisions are enabled.
 */
export type ContactSyncReadiness = {
  enabled: boolean;
  sourceConfigured: boolean;
  available: boolean;
  reason: string;
};

export function getContactSyncReadiness(): ContactSyncReadiness {
  const enabled = process.env.KURUKOO_CONTACT_SYNC_ENABLED === 'true';
  const sourceConfigured = process.env.KURUKOO_CONTACT_SYNC_SOURCE === 'trusted_provider';
  return {
    enabled,
    sourceConfigured,
    available: enabled && sourceConfigured,
    reason: enabled && sourceConfigured
      ? 'trusted_contact_provider_boundary_ready_for_adapter_validation'
      : 'contact_sync_disabled_until_trusted_provider_and_consent_boundary_are_configured',
  };
}

export async function startContactSyncService(): Promise<void> {
  const readiness = getContactSyncReadiness();
  if (!readiness.available) {
    console.warn(`[Contact Sync Service] Disabled: ${readiness.reason}. No names will be inferred or mutated.`);
    return;
  }

  // The adapter remains deliberately unimplemented until the provider,
  // consent, ownership, retention and deletion contract is approved.
  console.warn('[Contact Sync Service] Trusted-provider boundary is configured, but no adapter is activated. No contact data was changed.');
}

export async function syncUserContacts(): Promise<{ updatedCount: number; readiness: ContactSyncReadiness }> {
  const readiness = getContactSyncReadiness();
  return { updatedCount: 0, readiness };
}
