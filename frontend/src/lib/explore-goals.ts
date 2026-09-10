import type { LucideIcon } from "lucide-react";
import {
  Banknote,
  BriefcaseBusiness,
  Car,
  GraduationCap,
  HeartPulse,
  Home,
  MapPin,
  MessageCircle,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Users,
} from "lucide-react";

export type ExploreGoal = {
  id: string;
  label: string;
  prompt: string;
  icon: LucideIcon;
  capabilityIds: string[];
};

export type ExploreGoalGroup = {
  id: string;
  label: string;
  icon: LucideIcon;
  goals: ExploreGoal[];
};

export const exploreGoalGroups: ExploreGoalGroup[] = [
  {
    id: "everyday",
    label: "Everyday",
    icon: ShoppingBag,
    goals: [
      { id: "food", label: "Get food", prompt: "Help me get food", icon: ShoppingBag, capabilityIds: ["order_food", "food_nearby", "suya_vendor"] },
      { id: "groceries", label: "Get groceries", prompt: "Help me get groceries", icon: ShoppingBag, capabilityIds: ["grocery_shopper", "grocery_reminder"] },
      { id: "errands", label: "Get an errand done", prompt: "Help me get an errand done", icon: Sparkles, capabilityIds: ["find_worker", "bill_payment_runner", "document_courier"] },
      { id: "delivery", label: "Send or receive something", prompt: "Help me arrange a delivery", icon: MapPin, capabilityIds: ["dispatch_rider", "haulage_driver", "cold_chain_operator"] },
    ],
  },
  {
    id: "getting-around",
    label: "Getting around",
    icon: Car,
    goals: [
      { id: "ride", label: "Get a ride", prompt: "Help me get a ride", icon: Car, capabilityIds: ["ride_request", "taxi_quick", "okada_rider", "keke_driver"] },
      { id: "travel", label: "Plan travel", prompt: "Help me plan my travel", icon: MapPin, capabilityIds: ["train_check", "flight_alert", "hotel_deals", "city_tour_guide"] },
    ],
  },
  {
    id: "home",
    label: "Home & things",
    icon: Home,
    goals: [
      { id: "repair", label: "Fix something", prompt: "Help me get something repaired", icon: Home, capabilityIds: ["repair", "phone_repair", "generator_repairer", "plumber", "electrician"] },
      { id: "cleaning", label: "Get home help", prompt: "Help me find someone for my home", icon: Home, capabilityIds: ["house_cleaner", "laundry_man", "fumigation_agent", "waste_collector"] },
      { id: "solar", label: "Improve my energy", prompt: "Help me with solar or home energy", icon: Sparkles, capabilityIds: ["solar_panel_technician", "inverter_installer", "energy_tariff"] },
    ],
  },
  {
    id: "money-work",
    label: "Money & work",
    icon: Banknote,
    goals: [
      { id: "money-circle", label: "Start or manage a Money Circle", prompt: "Help me with my Money Circle", icon: Banknote, capabilityIds: ["thrift_collector_ajo", "group_savings_organiser"] },
      { id: "work", label: "Find work", prompt: "Help me find work or a gig", icon: BriefcaseBusiness, capabilityIds: ["side_hustle", "survey_taker", "find_worker"] },
      { id: "sell", label: "Sell something", prompt: "Help me sell something locally", icon: ShoppingBag, capabilityIds: ["second_hand_phones", "product_sourcing"] },
      { id: "business", label: "Grow my business", prompt: "Help me grow my business", icon: BriefcaseBusiness, capabilityIds: ["social_media_manager", "graphic_designer", "copywriter"] },
    ],
  },
  {
    id: "life",
    label: "Life",
    icon: HeartPulse,
    goals: [
      { id: "health", label: "Get health or care help", prompt: "Help me find health or care support", icon: HeartPulse, capabilityIds: ["doctor_appointment", "nursery_nurse", "carer_break", "medicine_delivery"] },
      { id: "education", label: "Learn or study", prompt: "Help me learn or study", icon: GraduationCap, capabilityIds: ["home_tutor", "language_tutor", "jamb_form_assistant", "word_of_day"] },
      { id: "spiritual", label: "Pray or reflect", prompt: "Help me pray or reflect", icon: Sparkles, capabilityIds: ["prayer_partner", "religious_book_seller"] },
    ],
  },
  {
    id: "community",
    label: "People & community",
    icon: Users,
    goals: [
      { id: "events", label: "Find something happening", prompt: "Help me find an event", icon: Users, capabilityIds: ["event_finder", "buy_ticket", "live_band"] },
      { id: "sports", label: "Play or follow sport", prompt: "Help me find sport activities", icon: Users, capabilityIds: ["football_player", "basketball_player", "tennis_partner", "sports_coach"] },
      { id: "connect", label: "Find people who can help", prompt: "Help me find someone who can help", icon: MessageCircle, capabilityIds: ["find_worker", "skill_swap", "micro_volunteer"] },
    ],
  },
  {
    id: "safety",
    label: "Safety & urgent help",
    icon: ShieldCheck,
    goals: [
      { id: "emergency", label: "Get urgent help", prompt: "I need urgent help", icon: ShieldCheck, capabilityIds: ["emergency", "ambulance_finder", "fire_service_contact"] },
      { id: "security", label: "Get security help", prompt: "Help me with security", icon: ShieldCheck, capabilityIds: ["security_patrol", "security_personnel", "night_guard"] },
    ],
  },
];

export const exploreGoalById = Object.fromEntries(
  exploreGoalGroups.flatMap((group) => group.goals.map((goal) => [goal.id, goal])),
) as Record<string, ExploreGoal>;
