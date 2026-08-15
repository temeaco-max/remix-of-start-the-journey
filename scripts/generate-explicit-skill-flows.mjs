import fs from 'node:fs';

const sourcePath = 'src/services/skillFlows.ts';
const source = fs.readFileSync(sourcePath, 'utf8');
const match = source.match(/const CATEGORY_BY_SKILL:Record<string,string>=\{([\s\S]*?)\};/);
if (!match) throw new Error('CATEGORY_BY_SKILL map not found');
const entries = [...match[1].matchAll(/(?:^|,)\s*([A-Za-z0-9_]+):'([^']+)'/g)].map(([, skill, category]) => ({ skill, category }));
if (entries.length < 180) throw new Error(`Expected at least 180 canonical skills, found ${entries.length}`);
const categoryProfiles = {
  'transport-mobility': { action: 'quote_and_reserve', payment: 'payment_after_confirmation', fulfillment: 'Confirm a verified driver, route, timing and quote before reservation or payment.' },
  'food-drink': { action: 'catalog_match_and_fulfill', payment: 'payment_after_confirmed_offer', fulfillment: 'Confirm seller availability, item details, price and delivery or collection before payment.' },
  'repairs-maintenance': { action: 'diagnose_and_quote', payment: 'payment_after_diagnosis', fulfillment: 'Collect the asset, issue, location and urgency; require provider diagnosis and quote before payment.' },
  'personal-care': { action: 'availability_and_booking', payment: 'payment_after_confirmation', fulfillment: 'Confirm practitioner identity, availability, location and quote before booking.' },
  'emergency-dispatch': { action: 'safety_triage_and_route', payment: 'no_payment_before_safety', fulfillment: 'Triage urgency first, show emergency limitations, and route only to verified public or provider contacts.' },
  'health-medical': { action: 'information_and_referral', payment: 'provider_confirmation_required', fulfillment: 'Provide bounded information and verified referral steps; do not diagnose or claim medical availability.' },
  'education-learning': { action: 'match_and_schedule', payment: 'payment_after_confirmation', fulfillment: 'Confirm learner goal, tutor or resource identity, timing and fee before scheduling.' },
  'events-entertainment': { action: 'discover_and_book', payment: 'payment_after_quote', fulfillment: 'Confirm event, date, venue, provider terms and quote before any booking or payment.' },
  'accommodation-lodging': { action: 'availability_and_quote', payment: 'payment_after_verified_listing', fulfillment: 'Show only verified listing references and require host availability and confirmed terms before payment.' },
  'agriculture-produce': { action: 'source_and_verify', payment: 'payment_after_offer', fulfillment: 'Confirm produce type, quantity, location, seller evidence and delivery terms before payment.' },
  'professional-services': { action: 'scope_and_quote', payment: 'payment_after_scope_confirmation', fulfillment: 'Confirm outcome, scope, provider identity, deadline and quote before engagement.' },
  'spiritual-religious': { action: 'match_and_schedule', payment: 'payment_after_confirmation', fulfillment: 'Confirm the requested support, consent, timing and provider terms before scheduling.' },
  'freelance-services': { action: 'scope_and_quote', payment: 'payment_after_scope_confirmation', fulfillment: 'Confirm deliverable, scope, deadline, provider evidence and quote before commitment.' },
  'gigs-microtasks': { action: 'task_scope_and_match', payment: 'payment_after_acceptance', fulfillment: 'Confirm task scope, location, timing, worker identity and rate before acceptance.' },
  'errands-delivery': { action: 'match_and_track', payment: 'payment_after_quote', fulfillment: 'Confirm item, pickup, destination, worker identity, quote and delivery evidence before release.' },
  'communication-telecom': { action: 'availability_and_source', payment: 'payment_after_offer', fulfillment: 'Confirm product or service identity, seller evidence, price and activation boundary before payment.' },
  'logistics-freight': { action: 'quote_and_track', payment: 'payment_after_confirmation', fulfillment: 'Confirm cargo, route, vehicle, timing, carrier evidence and quote before dispatch.' },
  'tourism-travel': { action: 'discover_and_plan', payment: 'payment_after_confirmation', fulfillment: 'Confirm itinerary, provider or public reference, timing and price before booking.' },
  'creative-arts': { action: 'scope_and_quote', payment: 'payment_after_contract', fulfillment: 'Confirm creative brief, rights, timing, provider identity and quote before engagement.' },
  'security-safety': { action: 'verify_and_book', payment: 'payment_after_vetting', fulfillment: 'Confirm safety need, location, timing, provider verification and terms before booking.' },
  'fitness-coaching': { action: 'match_and_schedule', payment: 'payment_after_confirmation', fulfillment: 'Confirm activity, ability, location, timing and coach identity before scheduling.' },
  'nightlife-lounges': { action: 'discover_and_verify', payment: 'information_only_until_confirmed', fulfillment: 'Show public venue references and require current venue confirmation; do not claim availability or admission.' },
  'betting-gaming': { action: 'information_and_safety', payment: 'no_automated_betting', fulfillment: 'Provide informational or community context only; never place bets, move funds or imply odds certainty.' },
  'money-circle': { action: 'rules_and_consent', payment: 'no_funds_from_chat', fulfillment: 'Confirm members, rules, cadence and consent; no funds move from the conversational flow alone.' },
  'classifieds-marketplace': { action: 'offer_review', payment: 'payment_after_verified_offer', fulfillment: 'Show only authoritative seller references and require offer, ownership, price and payment confirmation.' },
  'price-check': { action: 'evidence_and_compare', payment: 'information_only', fulfillment: 'Return sourced indicative references with timestamp and location; do not claim a live quote or stock.' },
  'government-civic': { action: 'guidance_and_directory', payment: 'information_only', fulfillment: 'Provide bounded public guidance or verified directory references; no filing, payment or official outcome is claimed.' },
  'community-neighbourhood': { action: 'consent_and_coordinate', payment: 'information_only_until_confirmed', fulfillment: 'Coordinate only with participant consent and public evidence; do not expose private location or identity.' },
  'cravings-streetfood': { action: 'catalog_match_and_fulfill', payment: 'payment_after_confirmed_offer', fulfillment: 'Confirm vendor, item, price and delivery or collection details before payment.' },
  'reach-reference': { action: 'directory_and_verify', payment: 'information_only', fulfillment: 'Return verified public contact references and clearly label stale or unverified information.' },
  'language-services': { action: 'scope_and_match', payment: 'payment_after_confirmation', fulfillment: 'Confirm language pair, format, deadline, provider identity and quote before engagement.' },
  'automotive-mechanics': { action: 'diagnose_and_quote', payment: 'payment_after_diagnosis', fulfillment: 'Confirm vehicle, issue, location, mechanic evidence and quote before work or payment.' },
  'finance-tax': { action: 'information_and_referral', payment: 'information_only_until_confirmed', fulfillment: 'Provide bounded information and verified referral steps; do not file, transfer funds or guarantee outcomes.' },
  'pet-animal-care': { action: 'match_and_schedule', payment: 'payment_after_confirmation', fulfillment: 'Confirm animal need, location, timing, provider identity and quote before scheduling.' },
  'digital-services': { action: 'scope_and_quote', payment: 'payment_after_scope_confirmation', fulfillment: 'Confirm digital outcome, access boundary, provider identity and quote before execution.' },
  'property-real-estate': { action: 'listing_and_verification', payment: 'payment_after_verified_terms', fulfillment: 'Show verified listing references and require owner or agent confirmation before any commitment.' },
  'childcare-nanny': { action: 'verify_and_match', payment: 'payment_after_vetting', fulfillment: 'Confirm child-safety requirements, schedule, identity and verification before contact or booking.' },
  'beauty-wellness': { action: 'availability_and_booking', payment: 'payment_after_confirmation', fulfillment: 'Confirm practitioner, service, timing, location and quote before booking.' },
  'cleaning-sanitation': { action: 'scope_and_quote', payment: 'payment_after_confirmation', fulfillment: 'Confirm service scope, location, timing, worker identity and quote before booking.' },
  'home-automation': { action: 'diagnose_and_scope', payment: 'payment_after_scope_confirmation', fulfillment: 'Confirm device, access boundary, issue and provider quote; no hidden device control is claimed.' },
  'legal-compliance': { action: 'information_and_referral', payment: 'payment_after_scope_confirmation', fulfillment: 'Provide bounded information and verified professional referral; do not claim legal representation or filing.' },
  'fashion-apparel': { action: 'scope_and_quote', payment: 'payment_after_confirmation', fulfillment: 'Confirm garment or alteration requirements, measurements, provider identity and quote before engagement.' },
  'solar-energy': { action: 'site_scope_and_quote', payment: 'payment_after_verified_quote', fulfillment: 'Confirm energy need, site information, installer verification and quote before commitment.' },
  'event-rentals': { action: 'availability_and_quote', payment: 'payment_after_confirmation', fulfillment: 'Confirm item, event date, venue, owner availability and quote before reservation.' },
  'water-beverage': { action: 'availability_and_delivery', payment: 'payment_after_quote', fulfillment: 'Confirm product, quantity, source, price and delivery evidence before payment.' },
  'sports-recreation': { action: 'match_and_schedule', payment: 'payment_after_confirmation', fulfillment: 'Confirm activity, participants, venue, timing and organizer terms before booking.' },
};
const escape = value => String(value).replaceAll('\\', '\\\\').replaceAll("'", "\\'");
const display = skill => skill.split('_').map(part => part[0].toUpperCase() + part.slice(1)).join(' ');
const informationCategories = new Set(['emergency-dispatch','health-medical','betting-gaming','money-circle','price-check','government-civic','community-neighbourhood','reach-reference','finance-tax','legal-compliance','nightlife-lounges']);
const explicitRequirements = (skill, category, label) => {
  const canonical = {
    ride_request: [{ key: 'origin', label: 'Pickup location', required: true }, { key: 'destination', label: 'Destination', required: true }, { key: 'departure_time', label: 'When' }],
    order_food: [{ key: 'items', label: 'What do you want?', required: true }, { key: 'quantity', label: 'Quantity' }, { key: 'location', label: 'Delivery area', required: true }, { key: 'delivery_time', label: 'Delivery time' }],
    repair: [{ key: 'device_or_asset', label: 'What needs fixing?', required: true }, { key: 'issue', label: 'Problem', required: true }, { key: 'location', label: 'Location', required: true }, { key: 'urgency', label: 'Urgency' }],
    find_worker: [{ key: 'service', label: 'Job or service', required: true }, { key: 'location', label: 'Location or area', required: true }, { key: 'time', label: 'When or deadline' }, { key: 'budget', label: 'Budget or rate' }],
    product_sourcing: [{ key: 'product', label: 'Product or goods', required: true }, { key: 'quantity', label: 'Quantity' }, { key: 'budget', label: 'Budget' }, { key: 'location', label: 'Preferred area' }, { key: 'deadline', label: 'Deadline' }],
    security_personnel: [{ key: 'service', label: 'Security need', required: true }, { key: 'location', label: 'Location', required: true }, { key: 'date_time', label: 'Date and time', required: true }, { key: 'duration', label: 'Duration' }],
  };
  if (canonical[skill]) return canonical[skill];
  const requirements = [{ key: 'objective', label: `Outcome for ${label}`, required: true }];
  if (!informationCategories.has(category)) requirements.push({ key: 'location', label: category === 'digital-services' || category === 'home-automation' ? 'Access or service context' : 'Location or area' });
  if (!['price-check','reach-reference','government-civic'].includes(category)) requirements.push({ key: 'timing', label: 'When or deadline' });
  if (['food-drink','cravings-streetfood','agriculture-produce','water-beverage','classifieds-marketplace','communication-telecom'].includes(category)) requirements.push({ key: 'quantity', label: 'Quantity or scope' });
  if (['professional-services','freelance-services','creative-arts','legal-compliance','finance-tax','solar-energy','property-real-estate'].includes(category)) requirements.push({ key: 'budget', label: 'Budget or fee boundary' });
  return requirements;
};
const lines = entries.map(({ skill, category }) => {
  const profile = categoryProfiles[category];
  if (!profile) throw new Error(`No category profile for ${category} (${skill})`);
  const label = display(skill);
  const requirements = explicitRequirements(skill, category, label);
  const questions = requirements.map(requirement => `{q:${JSON.stringify(requirement.label + '?')},options:[]}`);
  const mode = ['emergency-dispatch','security-safety'].includes(category) ? 'safety' : ['community-neighbourhood','sports-recreation','money-circle'].includes(category) ? 'coordination' : informationCategories.has(category) ? 'information' : 'economic';
  return `  ${JSON.stringify(skill)}:{category:${JSON.stringify(category)},mode:${JSON.stringify(mode)},requirements:${JSON.stringify(requirements)},questions:[${questions.join(',')}],action:${JSON.stringify(profile.action)},payment:${JSON.stringify(profile.payment)},fulfillment:${JSON.stringify(profile.fulfillment)}}`;
});
const block = `\nconst EXPLICIT_SKILL_FLOW_DEFINITIONS:Record<string,{category:string;mode:string;requirements:Array<{key:string;label:string;required?:boolean}>;questions:Array<{q:string;options:string[]}>;action:string;payment:string;fulfillment:string}>={\n${lines.join(',\n')}\n};\n`;
const marker = 'function seedCanonicalSkillFlows';
const markerIndex = source.indexOf(marker);
if (markerIndex < 0) throw new Error('seedCanonicalSkillFlows marker not found');
const before = source.slice(0, markerIndex);
const after = source.slice(markerIndex);
const withoutOld = before.replace(/\nconst EXPLICIT_SKILL_FLOW_DEFINITIONS:[\s\S]*?\n\};\n$/, '\n');
const nextSource = `${withoutOld}${block}${after}`;
fs.writeFileSync(sourcePath, nextSource);
console.log(`Generated ${entries.length} explicit skill-flow definitions in ${sourcePath}`);
