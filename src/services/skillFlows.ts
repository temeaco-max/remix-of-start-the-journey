import { getDb } from '../database.js';

export type EconomicCapability =
    | 'discovery'
    | 'availability'
    | 'quote'
    | 'verification'
    | 'reservation'
    | 'payment'
    | 'escrow'
    | 'contract'
    | 'fulfillment'
    | 'tracking'
    | 'evidence'
    | 'cancellation'
    | 'dispute'
    | 'completion';

export interface SkillFlow {
    skill: string;
    question_set: string;
    post_match_action: string;
    payment_model: string;
    fulfillment_instructions: string;
    capabilities?: EconomicCapability[];
    category?: string;
}

/**
 * Authoritative category families. A skill is an economic request type, not a
 * separate product. Category-specific requirements are composed on top of the
 * same request lifecycle.
 */
export const ECONOMIC_CATEGORIES = [
    'transport-mobility', 'food-drink', 'repairs-maintenance', 'personal-care',
    'emergency-dispatch', 'health-medical', 'education-learning', 'events-entertainment',
    'accommodation-lodging', 'agriculture-produce', 'professional-services',
    'spiritual-religious', 'freelance-services', 'gigs-microtasks', 'errands-delivery',
    'communication-telecom', 'logistics-freight', 'tourism-travel', 'creative-arts',
    'security-safety', 'fitness-coaching', 'nightlife-lounges', 'betting-gaming',
    'money-circle', 'classifieds-marketplace', 'price-check', 'government-civic',
    'community-neighbourhood', 'cravings-streetfood', 'reach-reference',
    'language-services', 'automotive-mechanics', 'finance-tax', 'pet-animal-care',
    'digital-services', 'property-real-estate', 'childcare-nanny', 'beauty-wellness',
    'cleaning-sanitation', 'home-automation', 'legal-compliance', 'fashion-apparel',
    'solar-energy', 'event-rentals', 'water-beverage', 'sports-recreation'
] as const;

const CATEGORY_BY_SKILL: Record<string, string> = {
    okada_rider: 'transport-mobility', keke_driver: 'transport-mobility', informal_taxi: 'transport-mobility',
    shuttle_driver: 'transport-mobility', wheelbarrow_boy: 'transport-mobility', truck_pusher: 'transport-mobility',
    school_run: 'transport-mobility', pet_taxi: 'transport-mobility', ev_charging: 'transport-mobility', taxi_quick: 'transport-mobility', train_check: 'transport-mobility',
    suya_vendor: 'food-drink', orange_hawker: 'food-drink', street_food_cart: 'food-drink', caterer: 'food-drink', bakery: 'food-drink', zobo_seller: 'food-drink', kunu_seller: 'food-drink', food_nearby: 'food-drink', grocery_reminder: 'food-drink',
    phone_repairer: 'repairs-maintenance', shoe_cobbler: 'repairs-maintenance', generator_repairer: 'repairs-maintenance', plumber: 'repairs-maintenance', electrician: 'repairs-maintenance', mechanic: 'repairs-maintenance', vulcaniser: 'repairs-maintenance', boiler_service: 'repairs-maintenance',
    mobile_barber: 'personal-care', home_hairdresser: 'personal-care', manicurist: 'personal-care', laundry_man: 'personal-care', house_cleaner: 'personal-care',
    ambulance_finder: 'emergency-dispatch', towing_service: 'emergency-dispatch', fire_service_contact: 'emergency-dispatch', security_patrol: 'emergency-dispatch', flood_line: 'emergency-dispatch', swep_alert: 'emergency-dispatch',
    medicine_delivery: 'health-medical', nursery_nurse: 'health-medical', herbal_practitioner: 'health-medical', doctor_appointment: 'health-medical', sleep_tracker: 'health-medical', energy_logger: 'health-medical', sad_lamp: 'health-medical', carer_break: 'health-medical',
    home_tutor: 'education-learning', jamb_form_assistant: 'education-learning', language_tutor: 'education-learning', word_of_day: 'education-learning',
    event_mc: 'events-entertainment', dj: 'events-entertainment', live_band: 'events-entertainment', comedian: 'events-entertainment', verified_artist: 'events-entertainment', museum_quiet: 'events-entertainment', vinyl_wantlist: 'events-entertainment', event_finder: 'events-entertainment',
    room_to_rent: 'accommodation-lodging', short_let_host: 'accommodation-lodging', house_agent: 'accommodation-lodging', moving_house: 'accommodation-lodging', first_flat: 'accommodation-lodging', hotel_deals: 'accommodation-lodging',
    poultry_farmer: 'agriculture-produce', fish_seller: 'agriculture-produce', fresh_veg_hawker: 'agriculture-produce', allotment_sitter: 'agriculture-produce',
    accounting_clerk: 'professional-services', legal_draftsman: 'professional-services', tax_assistant: 'professional-services', job_tracker: 'professional-services',
    prayer_partner: 'spiritual-religious', counselor: 'spiritual-religious', religious_book_seller: 'spiritual-religious',
    graphic_designer: 'freelance-services', copywriter: 'freelance-services', social_media_manager: 'freelance-services', side_hustle: 'freelance-services',
    flyer_distributor: 'gigs-microtasks', queue_stander: 'gigs-microtasks', survey_taker: 'gigs-microtasks',
    dispatch_rider: 'errands-delivery', grocery_shopper: 'errands-delivery', bill_payment_runner: 'errands-delivery', document_courier: 'errands-delivery',
    recharge_card_seller: 'communication-telecom', data_reseller: 'communication-telecom', phone_accessory_hawker: 'communication-telecom',
    haulage_driver: 'logistics-freight', cold_chain_operator: 'logistics-freight', boat_operator: 'logistics-freight',
    creek_guide: 'tourism-travel', city_tour_guide: 'tourism-travel', right_to_roam: 'tourism-travel', urban_explorer: 'tourism-travel', flight_alert: 'tourism-travel',
    bead_maker: 'creative-arts', tailor_fashion_designer: 'creative-arts', photographer: 'creative-arts', sketch_prompt: 'creative-arts', creative_block: 'creative-arts',
    night_guard: 'security-safety', event_bouncer: 'security-safety', night_walk: 'security-safety',
    fitness_trainer: 'fitness-coaching', running_beacon: 'fitness-coaching', couch_to_5k: 'fitness-coaching', walking_group: 'fitness-coaching',
    bar_triage: 'nightlife-lounges', lounge_promoter: 'nightlife-lounges', football_viewing_center: 'betting-gaming', sports_analyst: 'betting-gaming',
    thrift_collector_ajo: 'money-circle', group_savings_organiser: 'money-circle',
    second_hand_phones: 'classifieds-marketplace', clothes_bend_down: 'classifieds-marketplace', car_boot: 'classifieds-marketplace', charity_shop: 'classifieds-marketplace', farm_shop: 'classifieds-marketplace', gift_finder: 'classifieds-marketplace',
    wholesale_rice_tracker: 'price-check', cement_price_checker: 'price-check',
    nin_passport_guidance: 'government-civic', bin_day: 'government-civic', council_tax: 'government-civic', parking_appeal: 'government-civic', accessibility: 'government-civic',
    neighbourhood_watch: 'community-neighbourhood', skill_swap: 'community-neighbourhood', funeral_wishes: 'community-neighbourhood', bereavement_admin: 'community-neighbourhood', street_party: 'community-neighbourhood', borrowed_iou: 'community-neighbourhood', micro_volunteer: 'community-neighbourhood', pride_events: 'community-neighbourhood', genealogy: 'community-neighbourhood',
    akara_hot_seller: 'cravings-streetfood', puff_puff_hawker: 'cravings-streetfood', roasted_corn_vendor: 'cravings-streetfood',
    lga_office_directory: 'reach-reference', artisan_registry: 'reach-reference',
    pidgin_interpreter: 'language-services', hausa_translator: 'language-services', yoruba_transcriber: 'language-services', igbo_tutor: 'language-services', ijaw_voice: 'language-services',
    roadside_mechanic: 'automotive-mechanics', car_washer: 'automotive-mechanics', mot_reminder: 'automotive-mechanics',
    micro_bookkeeper: 'finance-tax', insurance_renewal: 'finance-tax', energy_tariff: 'finance-tax', retirement_coach: 'finance-tax',
    dog_breeder: 'pet-animal-care', vet_assistant: 'pet-animal-care', lost_pet: 'pet-animal-care', pet_weight: 'pet-animal-care',
    wifi_installer: 'digital-services', warranty_tracker: 'digital-services', digital_executor: 'digital-services', digital_declutter: 'digital-services', inbox_zero: 'digital-services',
    land_surveyor: 'property-real-estate', rental_tracker: 'property-real-estate',
    daycare_operator: 'childcare-nanny', babysitter: 'childcare-nanny',
    spa_masseuse: 'beauty-wellness', makeup_artist: 'beauty-wellness',
    fumigation_agent: 'cleaning-sanitation', waste_collector: 'cleaning-sanitation',
    smart_tv_bridge: 'home-automation', ac_remote_bridge: 'home-automation',
    contract_reviewer: 'legal-compliance', affidavit_assistant: 'legal-compliance',
    ankara_seamstress: 'fashion-apparel', suit_tailor: 'fashion-apparel',
    inverter_installer: 'solar-energy', solar_panel_technician: 'solar-energy',
    canopy_rental: 'event-rentals', public_address_system: 'event-rentals',
    sachet_water_distributor: 'water-beverage', tanker_water_supplier: 'water-beverage',
    football_player: 'sports-recreation', basketball_player: 'sports-recreation', tennis_partner: 'sports-recreation', sports_coach: 'sports-recreation', football_club_founder: 'sports-recreation', match_organizer: 'sports-recreation', team_captain: 'sports-recreation', league_admin: 'sports-recreation', pitch_manager: 'sports-recreation', sports_event_host: 'sports-recreation'
};

const DEFAULT_CAPABILITIES: EconomicCapability[] = ['discovery', 'availability', 'quote', 'verification', 'reservation', 'payment', 'fulfillment', 'cancellation', 'dispute', 'completion'];

export function getEconomicCategory(skill: string): string | null {
    return CATEGORY_BY_SKILL[skill.trim().toLowerCase()] || null;
}

export function getDefaultCapabilities(category?: string): EconomicCapability[] {
    const capabilities = [...DEFAULT_CAPABILITIES];
    if (category === 'events-entertainment' || category === 'professional-services' || category === 'property-real-estate') capabilities.splice(5, 0, 'contract');
    if (category === 'transport-mobility' || category === 'logistics-freight' || category === 'errands-delivery') capabilities.splice(7, 0, 'tracking');
    return [...new Set(capabilities)];
}

function normalize(row: any): SkillFlow | null {
    if (!row) return null;
    const skill = String(row.skill || '').trim();
    if (!skill) return null;
    const category = getEconomicCategory(skill);
    return {
        skill,
        question_set: String(row.question_set || '').trim(),
        post_match_action: String(row.post_match_action || '').trim(),
        payment_model: String(row.payment_model || '').trim(),
        fulfillment_instructions: String(row.fulfillment_instructions || '').trim(),
        capabilities: getDefaultCapabilities(category || undefined),
        category: category || undefined
    };
}

export async function getSkillFlow(skill: string): Promise<SkillFlow | null> {
    const name = skill.trim();
    if (!name) return null;
    const db = await getDb();
    const stmt = db.prepare(`SELECT skill, question_set, post_match_action, payment_model, fulfillment_instructions FROM skill_flows WHERE skill = ? LIMIT 1`);
    stmt.bind([name]);
    const result = stmt.step() ? normalize(stmt.getAsObject()) : null;
    stmt.free();
    return result;
}

export async function auditSkillFlows(): Promise<{ total: number; valid: number; invalid: string[] }> {
    const db = await getDb();
    const stmt = db.prepare(`SELECT skill, question_set, post_match_action, payment_model, fulfillment_instructions FROM skill_flows ORDER BY skill`);
    const invalid: string[] = [];
    let total = 0;
    let valid = 0;
    while (stmt.step()) {
        total += 1;
        const row = stmt.getAsObject();
        const flow = normalize(row);
        if (!flow || !flow.question_set || !flow.post_match_action || !flow.payment_model || !flow.fulfillment_instructions || !flow.category) invalid.push(flow?.skill || String((row as any).skill || 'unknown'));
        else valid += 1;
    }
    stmt.free();
    return { total, valid, invalid };
}

export function auditEconomicTaxonomy(): { categories: number; skills: number; unmapped: string[] } {
    const skills = Object.keys(CATEGORY_BY_SKILL);
    const unmapped = skills.filter((skill) => !ECONOMIC_CATEGORIES.includes(CATEGORY_BY_SKILL[skill] as any));
    return { categories: ECONOMIC_CATEGORIES.length, skills: skills.length, unmapped };
}
