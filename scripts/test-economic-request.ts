import { auditEconomicTaxonomy, getDefaultCapabilities, getEconomicCategory, getKnownSkills, ECONOMIC_CATEGORIES, getAllowedEconomicTransitions } from '../src/services/skillFlows.js';

const taxonomy = auditEconomicTaxonomy();
if (taxonomy.unmapped.length) throw new Error(`Unmapped skills: ${taxonomy.unmapped.join(', ')}`);
if (taxonomy.categories !== ECONOMIC_CATEGORIES.length) throw new Error('Economic category count mismatch');

// `ride_request` is the chat intent; the canonical economic skill it resolves to
// is `okada_rider` (see intentRouter.ts). Keep this audit aligned with the
// canonical CATEGORY_BY_SKILL catalogue rather than introducing a second alias.
const requiredSkills = ['okada_rider','keke_driver','order_food','buy_car','buy_ticket','repair','find_worker','product_sourcing','security_personnel','verified_artist','football_player','sports_coach'];
for (const skill of requiredSkills) {
  const category = getEconomicCategory(skill);
  if (!category) throw new Error(`Missing category for required skill: ${skill}`);
  const capabilities = getDefaultCapabilities(category);
  if (!capabilities.includes('discovery') || !capabilities.includes('completion')) throw new Error(`Incomplete capabilities for ${skill}`);
}

const known = getKnownSkills();
if (known.length < 100) throw new Error(`Expected broad skill taxonomy, found only ${known.length}`);
if (!getAllowedEconomicTransitions('requested').includes('awaiting_match')) throw new Error('Initial lifecycle transition missing');
if (!getAllowedEconomicTransitions('paid').includes('in_fulfillment')) throw new Error('Paid -> fulfilment transition missing');
if (!getAllowedEconomicTransitions('fulfilled').includes('completed')) throw new Error('Fulfilled -> completed transition missing');

console.log(`Economic request audit passed: ${taxonomy.categories} categories, ${taxonomy.skills} skills.`);
