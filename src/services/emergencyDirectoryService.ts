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

// These records are authoritative public emergency-number references, not proof of a live
// connection or dispatch. Actual calling remains an externally evidenced capability.
export const VERIFIED_EMERGENCY_SERVICES: readonly EmergencyServiceRecord[] = [
  { country: 'NG', jurisdiction: 'NG', service: 'national', name: 'National Emergency Number', number: '112', source: 'https://statehouse.gov.ng/nec-moves-to-strengthen-national-emergency-response-okays-112-as-lifeline/', sourceAuthority: 'National Economic Council / State House', verificationState: 'verified_source_pending_local_activation', lastVerified: '2026-07-09', dialable: true },
  { country: 'NG', jurisdiction: 'NG', service: 'police', name: 'Nigeria Police Force Emergency', number: '112', source: 'https://fmhds.gov.ng/', sourceAuthority: 'Federal Ministry of Humanitarian Affairs and Social Development', verificationState: 'verified_source_pending_local_activation', lastVerified: '2026-08-17', dialable: true },
  { country: 'NG', jurisdiction: 'NG', service: 'ambulance', name: 'Ambulance Emergency', number: '112', source: 'https://fmhds.gov.ng/', sourceAuthority: 'Federal Ministry of Humanitarian Affairs and Social Development', verificationState: 'verified_source_pending_local_activation', lastVerified: '2026-08-17', dialable: true },
  { country: 'NG', jurisdiction: 'NG', service: 'fire', name: 'Federal Fire Service Emergency', number: '112', source: 'https://fmhds.gov.ng/', sourceAuthority: 'Federal Ministry of Humanitarian Affairs and Social Development', verificationState: 'verified_source_pending_local_activation', lastVerified: '2026-08-17', dialable: true },
  { country: 'GH', jurisdiction: 'GH', service: 'national', name: 'Ghana Emergency Response Centre', number: '112', source: 'https://www.mint.gov.gh/emergency-numbers/', sourceAuthority: 'Ghana Ministry of the Interior', verificationState: 'verified_source_pending_local_activation', lastVerified: '2026-08-17', dialable: true },
  { country: 'GH', jurisdiction: 'GH', service: 'police', name: 'Ghana Police Service Emergency', number: '191', source: 'https://www.mint.gov.gh/emergency-numbers/', sourceAuthority: 'Ghana Ministry of the Interior', verificationState: 'verified_source_pending_local_activation', lastVerified: '2026-08-17', dialable: true },
  { country: 'GH', jurisdiction: 'GH', service: 'ambulance', name: 'National Ambulance Service Emergency', number: '193', source: 'https://nas.gov.gh/', sourceAuthority: 'Ghana National Ambulance Service', verificationState: 'verified_source_pending_local_activation', lastVerified: '2026-08-17', dialable: true },
  { country: 'GH', jurisdiction: 'GH', service: 'fire', name: 'Ghana National Fire Service Emergency', number: '192', source: 'https://www.mint.gov.gh/emergency-numbers/', sourceAuthority: 'Ghana Ministry of the Interior', verificationState: 'verified_source_pending_local_activation', lastVerified: '2026-08-17', dialable: true },
  { country: 'GB', jurisdiction: 'GB', service: 'national', name: 'UK Emergency Services', number: '999', source: 'https://www.gov.uk/guidance/999-and-112-the-uks-national-emergency-numbers', sourceAuthority: 'UK Government / GOV.UK', verificationState: 'verified_source_pending_local_activation', lastVerified: '2026-08-17', dialable: true },
  { country: 'GB', jurisdiction: 'GB', service: 'police', name: 'UK Police Emergency', number: '999', source: 'https://www.gov.uk/contact-police', sourceAuthority: 'UK Government / GOV.UK', verificationState: 'verified_source_pending_local_activation', lastVerified: '2026-08-17', dialable: true },
  { country: 'GB', jurisdiction: 'GB', service: 'ambulance', name: 'UK Ambulance Emergency', number: '999', source: 'https://www.gov.uk/guidance/999-and-112-the-uks-national-emergency-numbers', sourceAuthority: 'UK Government / GOV.UK', verificationState: 'verified_source_pending_local_activation', lastVerified: '2026-08-17', dialable: true },
  { country: 'GB', jurisdiction: 'GB', service: 'fire', name: 'UK Fire Emergency', number: '999', source: 'https://www.gov.uk/guidance/999-and-112-the-uks-national-emergency-numbers', sourceAuthority: 'UK Government / GOV.UK', verificationState: 'verified_source_pending_local_activation', lastVerified: '2026-08-17', dialable: true },
  { country: 'CA', jurisdiction: 'CA', service: 'national', name: 'Canada Emergency Services', number: '911', source: 'https://www.canada.ca/en/public-safety-canada/campaigns/national-911-service.html', sourceAuthority: 'Government of Canada / Public Safety Canada', verificationState: 'verified_source_pending_local_activation', lastVerified: '2026-08-17', dialable: true },
  { country: 'CA', jurisdiction: 'CA', service: 'police', name: 'Canada Police Emergency', number: '911', source: 'https://www.canada.ca/en/public-safety-canada/campaigns/national-911-service.html', sourceAuthority: 'Government of Canada / Public Safety Canada', verificationState: 'verified_source_pending_local_activation', lastVerified: '2026-08-17', dialable: true },
  { country: 'CA', jurisdiction: 'CA', service: 'ambulance', name: 'Canada Ambulance Emergency', number: '911', source: 'https://www.canada.ca/en/public-safety-canada/campaigns/national-911-service.html', sourceAuthority: 'Government of Canada / Public Safety Canada', verificationState: 'verified_source_pending_local_activation', lastVerified: '2026-08-17', dialable: true },
  { country: 'CA', jurisdiction: 'CA', service: 'fire', name: 'Canada Fire Emergency', number: '911', source: 'https://www.canada.ca/en/public-safety-canada/campaigns/national-911-service.html', sourceAuthority: 'Government of Canada / Public Safety Canada', verificationState: 'verified_source_pending_local_activation', lastVerified: '2026-08-17', dialable: true },
];

export function getEmergencyServices(country: string, service?: EmergencyServiceRecord['service']): EmergencyServiceRecord[] {
  const normalized = String(country || '').toUpperCase();
  return VERIFIED_EMERGENCY_SERVICES.filter(record => record.country === normalized && (!service || record.service === service || record.service === 'national'));
}

export function getPreferredEmergencyNumber(country: string, service?: EmergencyServiceRecord['service']): EmergencyServiceRecord | null {
  return getEmergencyServices(country, service)[0] || null;
}
