export interface EmergencyServiceRecord {
  country: string;
  jurisdiction: string;
  service: 'national' | 'police' | 'ambulance' | 'fire' | 'disaster';
  name: string;
  number: string;
  source: string;
  sourceAuthority: string;
  verificationState: 'verified_source_pending_local_activation';
  lastVerified: string;
  dialable: boolean;
}

// Nigeria's national emergency number was adopted as 112 by the National Economic Council
// and is reaffirmed in current federal emergency-service material. The application may use this
// as a canonical emergency contact, but must still treat actual call connection/dispatch as external evidence.
export const VERIFIED_NIGERIA_EMERGENCY_SERVICES: readonly EmergencyServiceRecord[] = [
  {
    country: 'NG', jurisdiction: 'NG', service: 'national', name: 'National Emergency Number', number: '112',
    source: 'https://statehouse.gov.ng/nec-moves-to-strengthen-national-emergency-response-okays-112-as-lifeline/', sourceAuthority: 'National Economic Council / State House', verificationState: 'verified_source_pending_local_activation', lastVerified: '2026-07-09', dialable: true,
  },
  {
    country: 'NG', jurisdiction: 'NG', service: 'police', name: 'Nigeria Police Force Emergency', number: '112',
    source: 'https://fmhds.gov.ng/', sourceAuthority: 'Federal Ministry of Humanitarian Affairs and Social Development', verificationState: 'verified_source_pending_local_activation', lastVerified: '2026-08-17', dialable: true,
  },
  {
    country: 'NG', jurisdiction: 'NG', service: 'ambulance', name: 'Ambulance Emergency', number: '112',
    source: 'https://fmhds.gov.ng/', sourceAuthority: 'Federal Ministry of Humanitarian Affairs and Social Development', verificationState: 'verified_source_pending_local_activation', lastVerified: '2026-08-17', dialable: true,
  },
  {
    country: 'NG', jurisdiction: 'NG', service: 'fire', name: 'Federal Fire Service Emergency', number: '112',
    source: 'https://fmhds.gov.ng/', sourceAuthority: 'Federal Ministry of Humanitarian Affairs and Social Development', verificationState: 'verified_source_pending_local_activation', lastVerified: '2026-08-17', dialable: true,
  },
];

export function getEmergencyServices(country: string, service?: EmergencyServiceRecord['service']): EmergencyServiceRecord[] {
  const normalized = String(country || '').toUpperCase();
  return VERIFIED_NIGERIA_EMERGENCY_SERVICES.filter(record => record.country === normalized && (!service || record.service === service || record.service === 'national'));
}

export function getPreferredEmergencyNumber(country: string, service?: EmergencyServiceRecord['service']): EmergencyServiceRecord | null {
  return getEmergencyServices(country, service)[0] || null;
}
