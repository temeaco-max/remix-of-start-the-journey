export const engagementPrompts = {
    qualifying: [
        "Is this urgent or can it wait until tomorrow?",
        "Do you have a specific budget in mind for this service?",
        "Is this a one-time request or a recurring need?"
    ],
    alternative: [
        "I found a provider for ₦5,000. But if you wait until tomorrow, I can get you one for ₦3,500. Which would you prefer?",
        "We have standard express dispatch or economy scheduled delivery. Which works best for you?"
    ],
    teaser: [
        "By the way, once you sign up, I'll remember this conversation and suggest providers before you even ask next time.",
        "Signing up unlocks direct escrow protection and 20 welcome credits instantly."
    ],
    nudge: [
        "No problem. I'll hold this for you. Come back anytime.",
        "Take your time deciding. Your preferences are saved in this session."
    ]
};

export function getSmartEngagementPrompt(type: 'qualifying' | 'alternative' | 'teaser' | 'nudge'): string {
    const list = engagementPrompts[type] || engagementPrompts.qualifying;
    return list[Math.floor(Math.random() * list.length)];
}
