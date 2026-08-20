import assert from 'node:assert/strict';
import { buildSkillBehaviourInstruction, resolveSkillBehaviour } from '../src/services/skillBehaviourRegistry.js';
import { getServiceJurisdictionProfile } from '../src/services/jurisdictionServiceProfiles.js';
import { chooseInferenceProvider } from '../src/services/aiInferencePolicy.js';

const phone = resolveSkillBehaviour('My iPhone 13 screen is broken in London and I need collection and return today.');
assert(phone);
assert.equal(phone.skill, 'phone_repairer');
assert(phone.required.includes('device'));
assert(phone.compound?.some(leg => leg.skill === 'device_collection'));
assert(phone.compound?.some(leg => leg.skill === 'delivery_return'));
assert(buildSkillBehaviourInstruction(phone).includes('Completion evidence'));

const hotel = resolveSkillBehaviour('Book me a hotel and airport transfer in London.');
assert(hotel);
assert.equal(hotel.skill, 'hotel_booking');
assert(hotel.compound?.some(leg => leg.skill === 'airport_transfer'));

assert.equal(getServiceJurisdictionProfile('GB').currency, 'GBP');
assert.equal(getServiceJurisdictionProfile('NG').currency, 'NGN');
assert.equal(getServiceJurisdictionProfile('CA').currency, 'CAD');
assert.equal(getServiceJurisdictionProfile('GB').sameDayRepairSupported, true);

const cheap = chooseInferenceProvider({ task: 'conversation', prompt: 'hello' });
assert.equal(cheap.provider, 'smollm2');
const complex = chooseInferenceProvider({ task: 'planning', prompt: 'coordinate and negotiate a same-day repair with pickup and return' });
assert(['smollm2', 'mistral'].includes(complex.provider));

console.log('Skill behaviour, compound fulfilment, jurisdiction and inference policy checks passed.');
