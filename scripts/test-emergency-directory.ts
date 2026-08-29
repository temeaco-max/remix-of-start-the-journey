/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import { getEmergencyServices } from '../src/services/emergencyDirectoryService.js';

const expectations: Record<string, Record<string, string>> = {
  NG: { national: '112', police: '112', ambulance: '112', fire: '112' },
  GH: { national: '112', police: '191', ambulance: '193', fire: '192' },
  GB: { national: '999', police: '999', ambulance: '999', fire: '999' },
  CA: { national: '911', police: '911', ambulance: '911', fire: '911' },
};

for (const [country, services] of Object.entries(expectations)) {
  for (const [service, number] of Object.entries(services)) {
    const records = getEmergencyServices(country, service as any);
    const record = records.find(item => item.service === service) || records.find(item => item.service === 'national');
    if (!record || record.number !== number) throw new Error(`${country}/${service}: expected ${number}, got ${record?.number || 'none'}`);
    if (record.verificationState !== 'verified_source_pending_local_activation') throw new Error(`${country}/${service}: unexpected verification state`);
  }
}

console.log(JSON.stringify({ ok: true, markets: Object.keys(expectations).length, recordsChecked: Object.values(expectations).reduce((total, services) => total + Object.keys(services).length, 0) }, null, 2));
