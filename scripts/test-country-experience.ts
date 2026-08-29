/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import assert from 'node:assert/strict';
import { getCountryExperience, listCountryExperiences, normalizeCountryCode } from '../src/services/countryExperience.js';

const countries = listCountryExperiences();
assert.deepEqual(countries.map(country => country.code), ['ng', 'gh', 'gb', 'ca', 'us']);
assert.equal(normalizeCountryCode('unknown'), 'ng');
assert.equal(normalizeCountryCode('GB'), 'gb');
assert.equal(normalizeCountryCode('CA'), 'ca');
assert.equal(normalizeCountryCode('US'), 'us');
for (const country of countries) {
  assert.equal(country.pricingManaged, true);
  assert.match(country.locale, /^en-/);
  assert.ok(country.currency.length >= 3);
  assert.ok(country.publicPath === `/${country.code}`);
  assert.ok(country.channels.includes('web'));
  assert.ok(country.channels.includes('email'));
  assert.ok(country.defaultEmergencyNumber.length >= 3);
  assert.equal(getCountryExperience(country.code).code, country.code);
}
assert.equal(getCountryExperience('gh').currency, 'GHS');
assert.equal(getCountryExperience('gb').currencyMinorUnit, 'pence');
assert.equal(getCountryExperience('ca').currency, 'CAD');
assert.equal(getCountryExperience('us').currency, 'USD');
assert.equal(getCountryExperience('ca').defaultEmergencyNumber, '911');
assert.equal(getCountryExperience('us').defaultEmergencyNumber, '911');
console.log(`Country experience contract passed: ${countries.length} supported markets share the canonical UI/management metadata.`);
