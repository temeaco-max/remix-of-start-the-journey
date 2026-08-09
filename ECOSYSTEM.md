# Kurukoo Ecosystem & Authoritative Registry (v5.39)

**Tagline:** Wake up. Get going.  
**Shortcode:** `*7000#`  
**Voice/WhatsApp:** `7000`  

---

## 1. Overview & Core Identity
Kurukoo is an AI-powered everyday utility platform providing economic infrastructure across WhatsApp, USSD (`*7000#`), and Kurukoo App (a single-screen chat PWA).

Every user operates via a **single, private living memory profile** (`memory_profiles`). There are no separate table silos for riders, providers, or customers. Everyone has one conversation thread, one Points balance, and one evolving identity.

---

## 2. Tight Integration Mandate & Unified Data Architecture

### Core Tables
1. **`memory_profiles`**: Single source of truth for phone number, name, location (LGA/State/Country), Points balance, subscription tier, and JSONB preferences.
2. **`skills`**: Multi-skilled hustles linked to `memory_profiles.phone`. Stores operation mode (`mobile` | `stationary` | `delivery` | `hybrid`), pricing, radius, availability, verified status, and product lists.
3. **`provider_presence`**: Real-time presence layer shared between Kuru Pulse and `find_worker` matching.
4. **`messages`**: Unified conversation history spanning WhatsApp, PWA, and USSD.
5. **`user_behavior_signals`**: Incremental signals learned through conversational interactions.

---

## 3. 30-Day Progressive Conversational Onboarding

Instead of filling long registration forms, Kurukoo learns who you are over 30 days of natural, 1-question daily chat prompts:

- **Day 1 (First Contact)**: Capture name → stored in `memory_profiles.name`.
- **Day 2 (Intent Classifier)**: AI router classifies first request as Find / Earn / Both.
- **Day 3-30 (Habit & Preference Building)**: One daily question covering work mode, routine, favourite vendors, transport, or skills.
- **Points Incentive**: Every daily answer awards +1 Point.
- **FCM Push Keep-Alive Loophole**: Bypasses Meta's 24-hour conversation window charges by sending a free FCM Push or PWA in-app notification at Hour 22 of idle time. Clicking the notification deep-links the user directly back to WhatsApp with a pre-filled message, prompting them to send it and restart the 24-hour conversation clock completely free.
- **Unified Onboarding Gateway Modal**: Available in the PWA (`onboarding-modal.ejs`) to pre-register users into memory profiles and route them to their preferred messaging/PWA interface, showcasing promotional lifetime session coverages, alternative free chat bots (Telegram, FB Messenger, Instagram, TikTok), and custom self-hosted Business WhatsApp API setup.

---

## 4. Authoritative 45-Category Taxonomy Map

| # | Category Slug | Category Name | Icon | Core Skill Tags Included |
|---|---|---|---|---|
| 1 | `transport-mobility` | Transport & Mobility | 🚕 | `okada_rider`, `keke_driver`, `informal_taxi`, `shuttle_driver`, `wheelbarrow_boy`, `truck_pusher`, `school_run`, `pet_taxi`, `ev_charging`, `taxi_quick`, `train_check` |
| 2 | `food-drink` | Food & Drink | 🍲 | `suya_vendor`, `orange_hawker`, `street_food_cart`, `caterer`, `bakery`, `zobo_seller`, `kunu_seller`, `food_nearby`, `grocery_reminder` |
| 3 | `repairs-maintenance` | Repairs & Maintenance | 🔧 | `phone_repairer`, `shoe_cobbler`, `generator_repairer`, `plumber`, `electrician`, `mechanic`, `vulcaniser`, `boiler_service` |
| 4 | `personal-care` | Personal & Household Care | 💈 | `mobile_barber`, `home_hairdresser`, `manicurist`, `laundry_man`, `house_cleaner` |
| 5 | `emergency-dispatch` | Emergency Dispatch | 🚨 | `ambulance_finder`, `towing_service`, `fire_service_contact`, `security_patrol`, `flood_line`, `swep_alert` |
| 6 | `health-medical` | Health & Medical | 🏥 | `medicine_delivery`, `nursery_nurse`, `herbal_practitioner`, `doctor_appointment`, `sleep_tracker`, `energy_logger`, `sad_lamp`, `carer_break` |
| 7 | `education-learning` | Education & Learning | 📚 | `home_tutor`, `jamb_form_assistant`, `language_tutor`, `word_of_day` |
| 8 | `events-entertainment` | Events & Entertainment | 🎭 | `event_mc`, `dj`, `live_band`, `comedian`, `verified_artist`, `museum_quiet`, `vinyl_wantlist`, `event_finder` |
| 9 | `accommodation-lodging` | Accommodation & Lodging | 🏠 | `room_to_rent`, `short_let_host`, `house_agent`, `moving_house`, `first_flat`, `hotel_deals` |
| 10 | `agriculture-produce` | Agriculture & Produce | 🌾 | `poultry_farmer`, `fish_seller`, `fresh_veg_hawker`, `allotment_sitter` |
| 11 | `professional-services` | Professional Services | 💼 | `accounting_clerk`, `legal_draftsman`, `tax_assistant`, `job_tracker` |
| 12 | `spiritual-religious` | Spiritual & Religious | 🕊️ | `prayer_partner`, `counselor`, `religious_book_seller` |
| 13 | `freelance-services` | Freelance & Digital | 💻 | `graphic_designer`, `copywriter`, `social_media_manager`, `side_hustle` |
| 14 | `gigs-microtasks` | Micro-Tasks & Quick Gigs | ⚡ | `flyer_distributor`, `queue_stander`, `survey_taker` |
| 15 | `errands-delivery` | Errands & Delivery | 📦 | `dispatch_rider`, `grocery_shopper`, `bill_payment_runner`, `document_courier` |
| 16 | `communication-telecom` | Communication & Telecom | 📱 | `recharge_card_seller`, `data_reseller`, `phone_accessory_hawker` |
| 17 | `logistics-freight` | Logistics & Freight | 🚚 | `haulage_driver`, `cold_chain_operator`, `boat_operator` |
| 18 | `tourism-travel` | Tourism & Travel | ✈️ | `creek_guide`, `city_tour_guide`, `right_to_roam`, `urban_explorer`, `flight_alert` |
| 19 | `creative-arts` | Creative Arts & Media | 🎨 | `bead_maker`, `tailor_fashion_designer`, `photographer`, `sketch_prompt`, `creative_block` |
| 20 | `security-safety` | Security & Safety | 🛡️ | `night_guard`, `event_bouncer`, `night_walk` |
| 21 | `fitness-coaching` | Fitness & Coaching | 🏋️ | `fitness_trainer`, `running_beacon`, `couch_to_5k`, `walking_group` |
| 22 | `nightlife-lounges` | Nightlife & Lounges | 🍸 | `bar_triage`, `lounge_promoter` |
| 23 | `betting-gaming` | Betting & Sports | ⚽ | `football_viewing_center`, `sports_analyst` |
| 24 | `money-circle` | Money Circle & Savings | 💰 | `thrift_collector_ajo`, `group_savings_organiser` |
| 25 | `classifieds-marketplace` | Classifieds & Marketplace | 🛒 | `second_hand_phones`, `clothes_bend_down`, `car_boot`, `charity_shop`, `farm_shop`, `gift_finder` |
| 26 | `price-check` | Price Checker & Market Intel | 🏷️ | `wholesale_rice_tracker`, `cement_price_checker` |
| 27 | `government-civic` | Government & Civic Help | 🏛️ | `nin_passport_guidance`, `bin_day`, `council_tax`, `parking_appeal`, `accessibility` |
| 28 | `community-neighbourhood` | Community & Neighbourhood | 🤝 | `neighbourhood_watch`, `skill_swap`, `funeral_wishes`, `bereavement_admin`, `street_party`, `borrowed_iou`, `micro_volunteer`, `pride_events`, `genealogy` |
| 29 | `cravings-streetfood` | Cravings & Fast Food | 🍢 | `akara_hot_seller`, `puff_puff_hawker`, `roasted_corn_vendor` |
| 30 | `reach-reference` | Local Directory & Contacts | 📞 | `lga_office_directory`, `artisan_registry` |
| 31 | `language-services` | Language & Dialect Services | 🗣️ | `pidgin_interpreter`, `hausa_translator`, `yoruba_transcriber`, `igbo_tutor`, `ijaw_voice` |
| 32 | `automotive-mechanics` | Automotive Care & Mechanics | 🚘 | `roadside_mechanic`, `car_washer`, `mot_reminder` |
| 33 | `finance-tax` | Finance & Tax Consulting | 📊 | `micro_bookkeeper`, `insurance_renewal`, `energy_tariff`, `retirement_coach` |
| 34 | `pet-animal-care` | Pet & Animal Care | 🐕 | `dog_breeder`, `vet_assistant`, `lost_pet`, `pet_weight` |
| 35 | `digital-services` | Digital & IT Services | 💻 | `wifi_installer`, `warranty_tracker`, `digital_executor`, `digital_declutter`, `inbox_zero` |
| 36 | `property-real-estate` | Property & Real Estate | 🏢 | `land_surveyor`, `rental_tracker` |
| 37 | `childcare-nanny` | Childcare & Nanny Services | 👶 | `daycare_operator`, `babysitter` |
| 38 | `beauty-wellness` | Beauty & Spa | 💅 | `spa_masseuse`, `makeup_artist` |
| 39 | `cleaning-sanitation` | Cleaning & Sanitation | 🧹 | `fumigation_agent`, `waste_collector` |
| 40 | `home-automation` | Smart Home & Remote | 🔌 | `smart_tv_bridge`, `ac_remote_bridge` |
| 41 | `legal-compliance` | Legal & Compliance | ⚖️ | `contract_reviewer`, `affidavit_assistant` |
| 42 | `fashion-apparel` | Fashion & Bespoke Tailoring | 👗 | `ankara_seamstress`, `suit_tailor` |
| 43 | `solar-energy` | Renewable & Solar Energy | ☀️ | `inverter_installer`, `solar_panel_technician` |
| 44 | `event-rentals` | Event Rentals & Equipment | 🎪 | `canopy_rental`, `public_address_system` |
| 45 | `water-beverage` | Water & Beverage Supply | 💧 | `sachet_water_distributor`, `tanker_water_supplier` |

---

## 5. Conversational Card UI & Interactive Widgets

All channels (WhatsApp, USSD, and PWA `kurukoo-chat.js`) render structured responses using standard card patterns:

- **Ride Picker Card**: Quick options for Okada, Keke, Taxi, and Car.
- **Pulse "Go Live" Card**: Provider status toggle with distance radius and active timer.
- **Product Storefront Card**: Item photo, price in Points/fiat, vendor location, and instant order CTA.
- **Trade Arbitrage Card**: Buy/sell prices, profit margin estimate, and Accept/Decline actions.
- **Survey Question Card**: Yes/No prompt with +1 Point bonus badge.

---

## 6. Signature Engagement Voice (Pidgin-First)
- **Morning greeting**: "Ku Kurukoo! 🌅 Time don reach. Wetin you go do today?"
- **Food nudge**: "Ku Kurukoo! 🍲 Time don reach to chop. Order now."
- **Work/hustle nudge**: "Ku Kurukoo! 💰 Make we hustle. See jobs near you."
- **Story/gist**: "Ku Kurukoo! 📢 I get gist for you today…"
- **Emergency alert**: "Ku Kurukoo! 🚨 Important alert for your area."
- **General prompt**: "Ku Kurukoo! Wetin you need?"

---

*End of Kurukoo Ecosystem & Authoritative Registry v5.39*
