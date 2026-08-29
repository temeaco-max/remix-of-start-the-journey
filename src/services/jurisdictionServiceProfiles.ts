/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
export interface ServiceJurisdictionProfile {
  country: string;
  currency: string;
  sameDayRepairSupported: boolean;
  collectionReturnRequiresProviderCapability: boolean;
  notes: string[];
  requiredEvidence: string[];
}

export const SERVICE_JURISDICTION_PROFILES: Record<string, ServiceJurisdictionProfile> = {
  GB: {
    country: 'GB', currency: 'GBP', sameDayRepairSupported: true,
    collectionReturnRequiresProviderCapability: true,
    notes: ['Same-day repair is an available service mode only when an eligible repair provider and transport capacity confirm it.', 'Provider terms, consumer-service requirements and any applicable waste/electrical-equipment obligations remain provider/platform compliance boundaries.'],
    requiredEvidence: ['provider verification', 'device intake condition', 'repair/diagnosis record', 'functional test', 'return confirmation'],
  },
  NG: {
    country: 'NG', currency: 'NGN', sameDayRepairSupported: true,
    collectionReturnRequiresProviderCapability: true,
    notes: ['Same-day repair is an available service mode only when local repair capacity, parts and collection/return are confirmed.', 'Jurisdiction-specific payment, tax and provider requirements must be satisfied before settlement.'],
    requiredEvidence: ['provider verification', 'device intake condition', 'repair/diagnosis record', 'functional test', 'return confirmation'],
  },
  CA: {
    country: 'CA', currency: 'CAD', sameDayRepairSupported: true,
    collectionReturnRequiresProviderCapability: true,
    notes: ['Same-day repair is an available service mode only when provider capacity, parts and transport are confirmed.', 'Province-specific consumer, tax and service obligations remain applicable.'],
    requiredEvidence: ['provider verification', 'device intake condition', 'repair/diagnosis record', 'functional test', 'return confirmation'],
  },
};

export function getServiceJurisdictionProfile(country: string): ServiceJurisdictionProfile {
  return SERVICE_JURISDICTION_PROFILES[String(country || '').trim().toUpperCase()] || {
    country: String(country || '').trim().toUpperCase() || 'UNSPECIFIED',
    currency: 'NGN', sameDayRepairSupported: false,
    collectionReturnRequiresProviderCapability: true,
    notes: ['Jurisdiction profile is not configured; do not make legal, tax or service-availability assumptions.'],
    requiredEvidence: ['provider verification', 'service evidence', 'completion confirmation'],
  };
}
