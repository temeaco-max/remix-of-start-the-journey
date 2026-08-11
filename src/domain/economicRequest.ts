import {
  ECONOMIC_CATEGORIES,
  getEconomicCategory,
  getDefaultCapabilities,
  type EconomicCapability,
} from '../services/skillFlows.js';

export interface RequirementDefinition {
  key: string;
  description: string;
  required?: boolean;
}

export interface EconomicRequestDefinition {
  skill: string;
  category: string;
  requirements: RequirementDefinition[];
  capabilities: EconomicCapability[];
}

const CATEGORY_REQUIREMENTS: Record<string, RequirementDefinition[]> = {
  'transport-mobility': [
    { key: 'origin', description: 'Pickup or origin location' },
    { key: 'destination', description: 'Destination location' },
    { key: 'passengers', description: 'Number of passengers', required: false },
    { key: 'departure_time', description: 'Requested departure time', required: false },
    { key: 'vehicle_preference', description: 'Preferred vehicle type', required: false },
  ],
  'food-drink': [
    { key: 'items', description: 'Requested food or grocery items' },
    { key: 'quantity', description: 'Requested quantity', required: false },
    { key: 'delivery_address', description: 'Delivery address', required: false },
    { key: 'delivery_time', description: 'Requested delivery time', required: false },
    { key: 'dietary_requirements', description: 'Dietary requirements or allergies', required: false },
  ],
  'repairs-maintenance': [
    { key: 'service', description: 'Repair or maintenance service required' },
    { key: 'device', description: 'Device, vehicle, or asset being repaired', required: false },
    { key: 'model', description: 'Model or type', required: false },
    { key: 'issue', description: 'Fault or problem description', required: false },
    { key: 'location', description: 'Service location', required: false },
    { key: 'urgency', description: 'Requested urgency', required: false },
  ],
  'personal-care': [{ key: 'service', description: 'Personal-care service required' }],
  'emergency-dispatch': [{ key: 'location', description: 'Incident location' }],
  'health-medical': [{ key: 'service', description: 'Health or medical service required' }],
  'education-learning': [{ key: 'subject', description: 'Subject or learning need' }],
  'events-entertainment': [
    { key: 'event', description: 'Event or entertainment requirement' },
    { key: 'date', description: 'Event date', required: false },
    { key: 'venue', description: 'Event venue', required: false },
    { key: 'budget', description: 'Approximate budget', required: false },
  ],
  'accommodation-lodging': [{ key: 'location', description: 'Accommodation location' }],
  'agriculture-produce': [{ key: 'product', description: 'Produce or agricultural product' }],
  'professional-services': [{ key: 'service', description: 'Professional service required' }],
  'spiritual-religious': [{ key: 'service', description: 'Service required' }],
  'freelance-services': [{ key: 'service', description: 'Freelance service required' }],
  'gigs-microtasks': [{ key: 'task', description: 'Task to be completed' }],
  'errands-delivery': [{ key: 'task', description: 'Errand or delivery task' }],
  'communication-telecom': [{ key: 'service', description: 'Telecom service required' }],
  'logistics-freight': [
    { key: 'origin', description: 'Pickup or origin location' },
    { key: 'destination', description: 'Destination location' },
  ],
  'tourism-travel': [{ key: 'destination', description: 'Travel destination' }],
  'creative-arts': [{ key: 'service', description: 'Creative service required' }],
  'security-safety': [{ key: 'service', description: 'Security service required' }],
  'fitness-coaching': [{ key: 'service', description: 'Fitness or coaching service required' }],
  'nightlife-lounges': [{ key: 'event', description: 'Nightlife event or venue requirement' }],
  'betting-gaming': [{ key: 'activity', description: 'Gaming or activity requirement' }],
  'money-circle': [{ key: 'purpose', description: 'Savings or money-circle purpose' }],
  'classifieds-marketplace': [{ key: 'item', description: 'Item or product requested' }],
  'price-check': [{ key: 'item', description: 'Item whose price is requested' }],
  'government-civic': [{ key: 'service', description: 'Government or civic service required' }],
  'community-neighbourhood': [{ key: 'purpose', description: 'Community purpose' }],
  'cravings-streetfood': [{ key: 'item', description: 'Food item requested' }],
  'reach-reference': [{ key: 'query', description: 'Reference or lookup query' }],
  'language-services': [{ key: 'service', description: 'Language service required' }],
  'automotive-mechanics': [{ key: 'service', description: 'Automotive service required' }],
  'finance-tax': [{ key: 'service', description: 'Finance or tax service required' }],
  'pet-animal-care': [{ key: 'service', description: 'Pet or animal service required' }],
  'digital-services': [{ key: 'service', description: 'Digital service required' }],
  'property-real-estate': [{ key: 'property_type', description: 'Property type' }],
  'childcare-nanny': [{ key: 'service', description: 'Childcare service required' }],
  'beauty-wellness': [{ key: 'service', description: 'Beauty or wellness service required' }],
  'cleaning-sanitation': [{ key: 'service', description: 'Cleaning or sanitation service required' }],
  'home-automation': [{ key: 'service', description: 'Home-automation service required' }],
  'legal-compliance': [{ key: 'service', description: 'Legal or compliance service required' }],
  'fashion-apparel': [{ key: 'service', description: 'Fashion or apparel service required' }],
  'solar-energy': [{ key: 'service', description: 'Solar or energy service required' }],
  'event-rentals': [{ key: 'item', description: 'Event rental item required' }],
  'water-beverage': [{ key: 'item', description: 'Water or beverage item required' }],
  'sports-recreation': [{ key: 'activity', description: 'Sport or recreation activity required' }],
};

const SKILL_REQUIREMENT_OVERRIDES: Record<string, RequirementDefinition[]> = {
  verified_artist: [
    { key: 'artist', description: 'Artist or talent requested' },
    { key: 'event_type', description: 'Type of event' },
    { key: 'event_date', description: 'Event date' },
    { key: 'venue', description: 'Event venue' },
    { key: 'audience_size', description: 'Expected audience size', required: false },
    { key: 'performance_duration', description: 'Performance duration', required: false },
    { key: 'budget', description: 'Approximate budget', required: false },
    { key: 'technical_rider', description: 'Technical requirements', required: false },
    { key: 'travel_requirements', description: 'Travel or accommodation requirements', required: false },
  ],
  buy_car: [
    { key: 'item', description: 'Vehicle requested' },
    { key: 'budget', description: 'Vehicle budget', required: false },
    { key: 'year', description: 'Preferred model year', required: false },
    { key: 'condition', description: 'New or used preference', required: false },
    { key: 'inspection_required', description: 'Whether inspection is required', required: false },
  ],
  buy_ticket: [
    { key: 'event', description: 'Event requested' },
    { key: 'date', description: 'Event date', required: false },
    { key: 'ticket_type', description: 'Ticket type or seating level', required: false },
    { key: 'quantity', description: 'Number of tickets', required: false },
    { key: 'seat_preference', description: 'Seat preference', required: false },
  ],
  order_food: [
    { key: 'items', description: 'Food items requested' },
    { key: 'quantity', description: 'Quantity', required: false },
    { key: 'delivery_address', description: 'Delivery address', required: false },
    { key: 'delivery_time', description: 'Requested delivery time', required: false },
  ],
  repair: [
    { key: 'device', description: 'Device or asset being repaired' },
    { key: 'issue', description: 'Fault or problem description' },
    { key: 'location', description: 'Service location', required: false },
    { key: 'urgency', description: 'Requested urgency', required: false },
  ],
  product_sourcing: [
    { key: 'item', description: 'Product requested' },
    { key: 'quantity', description: 'Quantity', required: false },
    { key: 'budget', description: 'Target budget', required: false },
    { key: 'delivery_location', description: 'Delivery location', required: false },
  ],
};

export function getRequirementSchema(skill: string): RequirementDefinition[] {
  const normalized = skill.trim().toLowerCase();
  const category = getEconomicCategory(normalized);
  return [...(SKILL_REQUIREMENT_OVERRIDES[normalized] || CATEGORY_REQUIREMENTS[category || ''] || [])];
}

export function getEconomicRequestDefinition(skill: string): EconomicRequestDefinition | null {
  const normalized = skill.trim().toLowerCase();
  const category = getEconomicCategory(normalized);
  if (!category || !ECONOMIC_CATEGORIES.includes(category as (typeof ECONOMIC_CATEGORIES)[number])) return null;
  return {
    skill: normalized,
    category,
    requirements: getRequirementSchema(normalized),
    capabilities: getDefaultCapabilities(category),
  };
}

export function getRequiredRequirementKeys(skill: string): string[] {
  return getRequirementSchema(skill).filter((field) => field.required !== false).map((field) => field.key);
}

export function getMissingRequirements(skill: string, requirements: Record<string, unknown>): string[] {
  return getRequiredRequirementKeys(skill).filter((key) => {
    const value = requirements[key];
    return value === undefined || value === null || (typeof value === 'string' && !value.trim());
  });
}
