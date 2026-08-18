import assert from 'node:assert/strict';
import { getCountryExperience, listCountryExperiences, normalizeCountryCode } from '../src/services/countryExperience.js';

const countries = listCountryExperiences();
assert.deepEqual(countries.map(country => country.code), ['ng', 'gh', 'gb']);
assert.equal(normalizeCountryCode('unknown'), 'ng');
assert.equal(normalizeCountryCode('GB'), 'gb');
for (const country of countries) {
  assert.equal(country.pricingManaged, true);
  assert.equal(country.locale, 'en');
  assert.ok(country.currency.length >= 3);
  assert.ok(country.publicPath === `/${country.code}`);
  assert.ok(country.channels.includes('web'));
  assert.ok(country.channels.includes('email'));
  assert.ok(country.defaultEmergencyNumber.length >= 3);
  assert.equal(getCountryExperience(country.code).code, country.code);
}
assert.equal(getCountryExperience('gh').currency, 'GHS');
assert.equal(getCountryExperience('gb').currencyMinorUnit, 'pence');
console.log(`Country experience contract passed: ${countries.length} supported markets share the canonical UI/management metadata.`);
