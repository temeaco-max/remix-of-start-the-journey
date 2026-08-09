export interface MemoryProfile {
    phone: string;
    name: string;
    email?: string;
    full_name?: string;
    display_name?: string;
    location: string;
    primary_lga?: string;
    primary_state?: string;
    country: string;
    subscription_tier: string;
    subscription_expiry?: string;
    points_balance?: number;
    wallet_balance_minor: number;
    currency: string;
    preferences?: string;
    behavior_patterns?: string;
    inferred_roles?: string;
    grace_leads?: number;
    fcm_token?: string;
    is_available: number;
    available_for_work?: number;
    is_contributor?: number;
    nin?: string;
    verified_provider?: number;
    livecast_signals_remaining?: number;
    trust_score?: number;
    sso_provider?: string;
    sso_provider_id?: string;
    email_verified_at?: string;
    last_active_at?: string;
}

export interface SkillItem {
    id: number;
    phone: string;
    skill: string;
    source: string;
    confidence: number;
    is_available: number;
    operation_mode: string;
}

export interface IntentRoutingResult {
    skill: string;
    target_skill?: string;
    reply: string;
    cardData?: any;
}
