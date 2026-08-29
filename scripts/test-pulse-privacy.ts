/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import assert from 'node:assert/strict';
import { toPublicPulseProviders, type ActivePulseProvider } from '../src/services/nearbyPulse.js';

const providers: ActivePulseProvider[] = [{
  phone: '+2348012345678',
  skill: 'plumber',
  lat: 6.5244,
  lng: 3.3792,
  name: 'Verified Plumber',
  location: 'Ikeja',
  subscription_tier: 'Plus',
  source: 'mobile',
}];

const publicView = toPublicPulseProviders(providers)[0];
assert.ok(publicView.id);
assert.equal(publicView.verified, true);
assert.equal(publicView.live_now, true);
assert.equal(publicView.location_radius_m, 100);
assert.equal('phone' in publicView, false, 'public Pulse must not expose provider phone');
assert.notEqual(publicView.lat, providers[0].lat, 'public Pulse should fuzz latitude');
assert.notEqual(publicView.lng, providers[0].lng, 'public Pulse should fuzz longitude');
assert.ok(Math.abs(publicView.lat - providers[0].lat) < 0.01);
assert.ok(Math.abs(publicView.lng - providers[0].lng) < 0.01);
console.log('Pulse privacy contract passed: public projection is phone-free and coordinate-fuzzed.');
